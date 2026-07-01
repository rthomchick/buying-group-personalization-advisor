"""
classify_visitor() — Document 2 Section 5 seven-step classification sequence.
Imports all scoring structures from the local data_model.py copy.
Data model version: 0.2.0
"""
from __future__ import annotations

from datetime import datetime, timezone

from data_model import (
    CROSS_ROLE_WEIGHTS,
    CONDITIONAL_WEIGHT_MODIFIERS,
    DECAY_MULTIPLIERS,
    SCORING_RULES,
    CONFIDENCE_TIERS,
    MODEL_VERSION,
)
from models import ClassifyResponse, TraceStep

DATA_MODEL_VERSION: str = MODEL_VERSION["version"]  # "0.2.0"

ROLES: list[str] = ["champion", "economic_buyer", "influencer", "user", "ratifier"]

# Score cap applied when differential_insufficient fires (§12 SCORING_RULES AR-03)
DIFFERENTIAL_INSUFFICIENT_CAP: float = 49.0

# Age threshold (days) treated as same-session for modifier evaluation
_SESSION_THRESHOLD_DAYS: float = 1.0


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _age_days(timestamp_str: str) -> float:
    """Return age of a signal observation in fractional days from now (UTC)."""
    ts = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
    now = datetime.now(tz=timezone.utc)
    return (now - ts).total_seconds() / 86400.0


def _decay_window(age_days: float) -> tuple[str, float]:
    """
    Map signal age to (window_key, multiplier) from §8 DECAY_MULTIPLIERS.
    Returns over_180_days (0.0×) for signals beyond the 180-day ML classifier
    lookback boundary. anonymous_visitor_long_decay excluded — identified
    contacts only in this engine.
    """
    if age_days < _SESSION_THRESHOLD_DAYS:
        return "current_session", DECAY_MULTIPLIERS["current_session"]["multiplier"]
    elif age_days <= 90:
        return "last_90_days", DECAY_MULTIPLIERS["last_90_days"]["multiplier"]
    elif age_days <= 180:
        return "91_to_180_days", DECAY_MULTIPLIERS["91_to_180_days"]["multiplier"]
    else:
        return "over_180_days", DECAY_MULTIPLIERS["over_180_days"]["multiplier"]


def _apply_conditional_modifiers(
    signal_observations: list[dict],
) -> dict[str, dict[str, float]]:
    """
    Pre-Step-1 weight transformation: check CONDITIONAL_WEIGHT_MODIFIERS for
    same-session co-occurrences and return per-signal weight overrides.

    Modifier scope: current_session only (Document 2 §7a, §5.4 co_occurrence_window).
    A trigger signal and its co-occurrence signal must both have been observed
    within the current session (age < 1 day). Prior-session co-occurrences do
    not activate a modifier.

    Returns: dict mapping signal_name → {role: adjusted_weight} for signals
    whose weights differ from CROSS_ROLE_WEIGHTS base values.
    """
    current_session_signals: set[str] = {
        obs["signal_name"]
        for obs in signal_observations
        if _age_days(obs["timestamp"]) < _SESSION_THRESHOLD_DAYS
    }

    weight_overrides: dict[str, dict[str, float]] = {}

    for _modifier_key, modifier in CONDITIONAL_WEIGHT_MODIFIERS.items():
        trigger = modifier["trigger_signal"]
        if trigger not in current_session_signals:
            continue

        co_signals: list[str] = modifier["co_occurrence_signals"]
        if not any(s in current_session_signals for s in co_signals):
            continue

        # Modifier fires — apply delta values to trigger signal's base weights
        base = {
            role: float(CROSS_ROLE_WEIGHTS[trigger].get(role, 0))
            for role in ROLES
        }
        for role, delta in modifier["modifications"].items():
            base[role] = base.get(role, 0.0) + float(delta)

        # Merge with any prior modifier on the same trigger signal
        if trigger not in weight_overrides:
            weight_overrides[trigger] = base
        else:
            for role in ROLES:
                weight_overrides[trigger][role] = (
                    weight_overrides[trigger].get(role, 0.0) + base.get(role, 0.0)
                )

    return weight_overrides


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def classify_visitor(
    contact_id: str,
    signal_observations: list[dict],  # [{signal_name, timestamp, solution_category}, ...]
    ca_attributes: dict,
) -> ClassifyResponse:
    """
    Execute Document 2 Section 5 seven-step classification sequence.
    Returns a fully populated ClassifyResponse with mandatory scoring trace.

    All seven steps execute in order; no step may be skipped or reordered.
    Source of truth: data_model.py (local copy), Document 2 Section 5.
    """
    trace: list[TraceStep] = []

    # =========================================================================
    # PRE-STEP — Conditional weight modifiers  (Document 2 §7a, §5.4)
    # Must run before Step 1 decay multiplication. Same-session scope only.
    # =========================================================================
    weight_overrides = _apply_conditional_modifiers(signal_observations)
    modifier_note = (
        f"Modifiers active for: {list(weight_overrides.keys())}"
        if weight_overrides
        else "No conditional weight modifiers triggered (no same-session co-occurrences)"
    )

    # =========================================================================
    # STEP 1 — Aggregate decay-adjusted weights per role
    # For each qualifying signal, multiply base weight by decay multiplier,
    # then sum across all observations per role.
    # §7 CROSS_ROLE_WEIGHTS  ×  §8 DECAY_MULTIPLIERS
    # =========================================================================
    cumulative: dict[str, float] = {role: 0.0 for role in ROLES}
    step1_lines: list[str] = [modifier_note]
    unknown_signals: list[str] = []

    for obs in signal_observations:
        signal_name = obs["signal_name"]
        timestamp = obs["timestamp"]

        if signal_name not in CROSS_ROLE_WEIGHTS:
            unknown_signals.append(signal_name)
            continue

        age = _age_days(timestamp)
        window_key, multiplier = _decay_window(age)

        if multiplier == 0.0:
            step1_lines.append(
                f"  EXCLUDED {signal_name} (age {age:.0f}d > 180d; "
                "over_180_days multiplier=0.0)"
            )
            continue

        base_weights = weight_overrides.get(
            signal_name,
            {r: float(CROSS_ROLE_WEIGHTS[signal_name].get(r, 0)) for r in ROLES},
        )

        contributions: dict[str, float] = {}
        for role in ROLES:
            adjusted = base_weights.get(role, 0.0) * multiplier
            cumulative[role] += adjusted
            contributions[role] = round(adjusted, 2)

        step1_lines.append(
            f"  {signal_name} ({window_key}, {multiplier}×, age {age:.0f}d): "
            + "  ".join(f"{r}={v:+.2f}" for r, v in contributions.items())
        )

    if unknown_signals:
        step1_lines.append(f"  WARNING: unrecognised signal names skipped: {unknown_signals}")

    cumulative = {r: round(v, 2) for r, v in cumulative.items()}
    scores_summary = "  ".join(f"{r}={v:.2f}" for r, v in cumulative.items())

    trace.append(TraceStep(
        step="decay_adjusted_aggregation",
        result=f"Cumulative scores → {scores_summary}",
        corpus_authority=(
            "Document 2 §3 Signal Recency and Decay, §5.2 Step 1; "
            "data model §7 CROSS_ROLE_WEIGHTS, §8 DECAY_MULTIPLIERS"
        ),
        value=scores_summary,
    ))
    # Emit per-signal detail as a second trace entry for VP-visible transparency
    trace.append(TraceStep(
        step="decay_adjusted_aggregation_detail",
        result="\n".join(step1_lines),
        corpus_authority="data model §7 CROSS_ROLE_WEIGHTS, §8 DECAY_MULTIPLIERS",
        value=None,
    ))

    # =========================================================================
    # STEP 2 — Score floor check
    # If max cumulative score < minimum_cumulative_score (25): UNKNOWN. Halt.
    # §12 SCORING_RULES minimum_cumulative_score
    # =========================================================================
    min_floor: int = SCORING_RULES["minimum_cumulative_score"]  # 25
    max_raw: float = max(cumulative.values())

    if max_raw < min_floor:
        trace.append(TraceStep(
            step="score_floor_check",
            result=(
                f"FAIL — max score {max_raw:.2f} < floor {min_floor}. "
                "UNKNOWN tier assigned. Classification halted."
            ),
            corpus_authority=(
                "Document 2 §5.2 Step 2; data model §12 minimum_cumulative_score"
            ),
            value=max_raw,
        ))
        return ClassifyResponse(
            contact_id=contact_id,
            role_classification="unknown",
            confidence_tier="UNKNOWN",
            role_scores=cumulative,
            top_score=max_raw,
            second_score=0.0,
            differential=0.0,
            differential_insufficient=False,
            fallback_level=4,
            holdback_group=bool(ca_attributes.get("holdback_group", False)),
            scoring_trace=trace,
            data_model_version=DATA_MODEL_VERSION,
        )

    trace.append(TraceStep(
        step="score_floor_check",
        result=f"PASS — max score {max_raw:.2f} >= floor {min_floor}",
        corpus_authority=(
            "Document 2 §5.2 Step 2; data model §12 minimum_cumulative_score"
        ),
        value=max_raw,
    ))

    # =========================================================================
    # STEP 3 — Role differential check
    # Top role must lead second role by >= minimum_role_differential (10).
    # Failure: cap top_score at 49; set differential_insufficient=True.
    # §12 SCORING_RULES minimum_role_differential; Document 5 §1.2
    # =========================================================================
    sorted_roles = sorted(cumulative.items(), key=lambda x: x[1], reverse=True)
    top_role, top_raw = sorted_roles[0]
    second_role, second_raw = sorted_roles[1]
    differential = round(top_raw - second_raw, 2)
    min_diff: int = SCORING_RULES["minimum_role_differential"]  # 10

    differential_insufficient = False
    working_score = top_raw

    if differential < min_diff:
        differential_insufficient = True
        working_score = min(top_raw, DIFFERENTIAL_INSUFFICIENT_CAP)
        trace.append(TraceStep(
            step="role_differential_check",
            result=(
                f"DIFFERENTIAL INSUFFICIENT — "
                f"{top_role}={top_raw:.2f}, {second_role}={second_raw:.2f}, "
                f"differential={differential:.2f} < threshold={min_diff}. "
                f"Top score capped at {DIFFERENTIAL_INSUFFICIENT_CAP} (was {top_raw:.2f}). "
                f"differential_insufficient=True. "
                "This is an ambiguous-role state — the visitor has substantial behavioral "
                "engagement but the signal profile cannot distinguish the role confidently. "
                "It is NOT a low-signal state."
            ),
            corpus_authority=(
                "Document 2 §5.2 Step 3; data model §12 minimum_role_differential AR-03; "
                "Document 5 §1.2 Priority 0 override"
            ),
            value=differential,
        ))
    else:
        # Boundary condition: if only one role is positive, differential check trivially passes.
        positive_roles = [r for r, s in cumulative.items() if s > 0]
        boundary_note = (
            " (single positive-score role — differential check not applicable; "
            "unambiguous classification)"
            if len(positive_roles) == 1
            else ""
        )
        trace.append(TraceStep(
            step="role_differential_check",
            result=(
                f"PASS — {top_role}={top_raw:.2f}, {second_role}={second_raw:.2f}, "
                f"differential={differential:.2f} >= threshold={min_diff}"
                f"{boundary_note}"
            ),
            corpus_authority=(
                "Document 2 §5.2 Step 3; data model §12 minimum_role_differential"
            ),
            value=differential,
        ))

    # =========================================================================
    # STEP 4 — Firmographic bonus (SUPPRESSED in POC — S-03)
    # Production: if firmographic_role matches classified role, add +30.
    # Behavioral floor guard rail PENDING (Document 2 §5.2 Step 4 design gap).
    # =========================================================================
    trace.append(TraceStep(
        step="firmographic_bonus_suppressed",
        result=(
            "SUPPRESSED — Track 2 DPA consent review pending. "
            "No firmographic confirmation bonus applied. "
            "Production replacement: Demandbase title match + §12 firmographic_confirmation_bonus (+30), "
            "subject to pending behavioral floor guard rail (Document 2 §5.2 Step 4)."
        ),
        corpus_authority="Document 9 §P; data model v0.2.0 AR-03; POC simplification S-03",
        value=None,
    ))

    # =========================================================================
    # STEP 5 — Confidence tier assignment
    # Apply score clamp [0, 100], then assign tier.
    # Tier 3 behavioral ceiling: score >= 80 → MEDIUM (never HIGH without
    # Tier 1 ML classifier or Tier 2 zero-party confirmation; POC S-02).
    # Document 2 §5.2 Steps 5–7; §12 SCORING_RULES; §13 DATA_SOURCE_HIERARCHY
    # =========================================================================
    clamped = float(max(
        SCORING_RULES["score_clamp_floor"],       # 0
        min(SCORING_RULES["score_clamp_ceiling"], working_score),  # 100
    ))

    tier_label: str
    tier_note: str = ""

    if clamped >= CONFIDENCE_TIERS["high"]["min"]:    # >= 80
        # Tier 3 behavioral alone cannot produce HIGH (Document 2 §5.2 Step 7)
        tier_label = "MEDIUM"
        tier_note = (
            f"Score {clamped:.2f} >= HIGH threshold ({CONFIDENCE_TIERS['high']['min']}), "
            "but Tier 3 behavioral inference alone cannot produce HIGH confidence "
            "(data model §13 rank-3 MEDIUM ceiling; Document 2 §5.2 Step 7). "
            "POC S-02: Tier 1 ML classifier not active. Assigned MEDIUM."
        )
    elif clamped >= CONFIDENCE_TIERS["medium"]["min"]:   # >= 50
        tier_label = "MEDIUM"
    elif clamped >= CONFIDENCE_TIERS["low"]["min"]:      # >= 25
        tier_label = "LOW"
    else:
        tier_label = "UNKNOWN"

    result_text = f"Score {clamped:.2f} → {tier_label}"
    if tier_note:
        result_text += f" [{tier_note}]"

    trace.append(TraceStep(
        step="confidence_tier_assignment",
        result=result_text,
        corpus_authority=(
            "Document 2 §5.2 Steps 5–7; data model §3 CONFIDENCE_TIERS, "
            "§12 SCORING_RULES (score_clamp), §13 DATA_SOURCE_HIERARCHY"
        ),
        value=clamped,
    ))

    # =========================================================================
    # STEP 6 — Fallback level derivation
    # Initial fallback level derived from confidence tier via CONFIDENCE_TIERS.
    # Priority 0 override evaluated in Step 7.
    # Document 5 §4 FALLBACK_CASCADE; data model §3 CONFIDENCE_TIERS
    # =========================================================================
    _tier_to_fallback: dict[str, int] = {
        "HIGH": 1,
        "MEDIUM": 2,
        "LOW": 3,
        "UNKNOWN": 4,
    }
    initial_fallback = _tier_to_fallback[tier_label]

    trace.append(TraceStep(
        step="fallback_level_derivation",
        result=(
            f"confidence_tier={tier_label} → initial fallback_level={initial_fallback}. "
            "Priority 0 differential_insufficient override evaluated in Step 7."
        ),
        corpus_authority=(
            "Document 5 §4 FALLBACK_CASCADE; data model §3 CONFIDENCE_TIERS fallback_level field"
        ),
        value=initial_fallback,
    ))

    # =========================================================================
    # STEP 7 — Priority 0 differential_insufficient override
    # If differential_insufficient=True: fallback_level=3 regardless of
    # confidence_tier. Evaluated BEFORE any confidence-tier-based routing.
    # This is an ambiguous-role state, not a low-confidence state.
    # Document 5 §1.2; data model §12 SCORING_RULES AR-03
    # =========================================================================
    if differential_insufficient:
        final_fallback = 3
        trace.append(TraceStep(
            step="p0_differential_override",
            result=(
                "OVERRIDE ACTIVE — differential_insufficient=True. "
                f"fallback_level overridden from {initial_fallback} → 3. "
                f"confidence_tier ({tier_label}) is NOT the determining factor. "
                "Priority 0 routes to Level 3 (solution-interest experience) and activates "
                "progressive_disclosure for zero-party self-identification upgrade path. "
                "When the contact responds to progressive disclosure, differential_insufficient "
                "clears to False and confidence_tier upgrades to MEDIUM — routing to Level 2."
            ),
            corpus_authority=(
                "Document 5 §1.2 Priority 0 differential_insufficient override; "
                "data model §12 SCORING_RULES AR-03"
            ),
            value=3,
        ))
    else:
        final_fallback = initial_fallback
        trace.append(TraceStep(
            step="p0_differential_override",
            result=(
                f"NOT ACTIVE — differential_insufficient=False. "
                f"fallback_level={final_fallback} confirmed."
            ),
            corpus_authority="Document 5 §1.2",
            value=final_fallback,
        ))

    return ClassifyResponse(
        contact_id=contact_id,
        role_classification=top_role,
        confidence_tier=tier_label,
        role_scores=cumulative,
        top_score=clamped,
        second_score=round(second_raw, 2),
        differential=differential,
        differential_insufficient=differential_insufficient,
        fallback_level=final_fallback,
        holdback_group=bool(ca_attributes.get("holdback_group", False)),
        scoring_trace=trace,
        data_model_version=DATA_MODEL_VERSION,
    )
