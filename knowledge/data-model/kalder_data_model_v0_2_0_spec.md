---
Status: IMPLEMENTED
Implementation completed: 2026-06-15
Implemented in: kalder_data_model.py v0.2.0
This document is now a historical change record. Do not modify.
---

# Kalder Personalization Hub: Shared Data Model
**Version:** 0.2.0  
**Date:** June 2026  
**Status:** IMPLEMENTED — Historical change record for v0.2.0. See kalder_data_model.py for the canonical implementation.  
**Previous version:** 0.1.0 (S0/S1 scope, initial model)

---

## Document Status

This document is the updated specification for `kalder_data_model.py` v0.2.0. It incorporates all change requests from the Advisory Council Review (CR-01 through CR-12) and the Senior Data Architect Review (AR-01 through AR-09), including four conflict resolutions where the two reviews diverged.

It is written as a specification document. The `.py` file is the canonical implementation artifact; this document records the intent, rationale, and complete change set that the next implementation pass should produce.

---

## §M  Model Metadata

### MODEL_VERSION

```python
MODEL_VERSION = {
    "version": "0.2.0",
    "semver_policy": {
        "patch": "Signal weight tuning, label changes, note updates",
        "minor": "New signals, new sections, non-breaking additions",
        "major": "Breaking changes: entity renames, schema restructuring, removing fields",
    },
    "last_updated": "2026-06-05",
    "changelog": [
        {
            "version": "0.2.0",
            "date": "2026-06-05",
            "changes": [
                "CR-01: Deprecated §2 typical_titles as classification input; §19 TITLE_ROLE_MAP is now sole authoritative lookup",
                "CR-02: Added validation_status sub-field per title entry in TITLE_ROLE_MAP (4-value enum)",
                "CR-03 + AR-03: Fixed firmographic bonus guard rail and scoring order bug",
                "CR-04: Added CONDITIONAL_WEIGHT_MODIFIERS section for Ratifier/InfoSec-Influencer disambiguation",
                "CR-04b: Added infosec_influencer_disambiguation_whitepaper entry to CONDITIONAL_WEIGHT_MODIFIERS for security_whitepaper_download co-occurrence case",
                "CR-05: Added anonymous_visitor_long_decay multiplier with identity-transition behavior",
                "CR-06: Added intended_axes, omitted_axes_rationale, and module_composition_rules to MODULE_TYPES",
                "CR-07: Added category_explainer as distinct content type; recascaded BUYING_JOB_INFERENCE_SIGNALS",
                "CR-08 + AR-08: Added pending_solution_fallback directive with escalation_threshold; refactored get_titles_for_role()",
                "CR-09: Added CLIENT_ATTRIBUTE_MAP configurable namespace for AEP/CRM attribute names",
                "CR-10: Revised T3-07 validation methodology to require randomized progressive disclosure",
                "CR-11: Added PRIVACY_CONSENT_ARCHITECTURE section (consent gating, signal classification, geographic rules, retention, deletion)",
                "CR-12: Added SALES_ACTIVATION_CONFIG as separate section (not embedded in convergence points)",
                "AR-01: Added MODEL_STATUS block defining module role and derivation chain",
                "AR-02: Added COVERAGE_STATUS_HIERARCHY with inheritance rules and validate_coverage_consistency() helper",
                "AR-04: Refactored PROBABLE_JOB_PRIORS from tuple keys to nested dict",
                "AR-05: Removed redundant signal_weights from CONTENT_TYPES; added maps_to_signals reference field",
                "AR-06: Added validate_signal_references() helper for referential integrity",
                "AR-07: Resolved CONFIDENCE_TIERS / ENGAGEMENT_THRESHOLDS numeric collision; renamed engagement keys",
                "AR-09: Added MODEL_VERSION dict with semver policy and changelog",
            ],
        },
        {
            "version": "0.1.0",
            "date": "2026-06-01",
            "changes": ["Initial model — S0/S1 scope"],
        },
    ],
}
```

### MODEL_STATUS  *(new — AR-01)*

```python
MODEL_STATUS = {
    "role": "canonical_specification",
    "description": (
        "This module is the canonical specification from which all downstream artifacts "
        "are derived. It is NOT a runtime data layer — the application does not import "
        "this file directly. Downstream systems derive their schemas, API contracts, and "
        "CMS structures from this specification."
    ),
    "derivation_chain": {
        "direct_consumers": [
            "Signal Definition v1.0",
            "Segmentation Framework v1.0",
            "Content Tagging Framework v1.0",
            "Fragment Architecture Framework v1.0",
            "Personalization Playbook v1.0",
            "Measurement Plan v1.0",
            "BG Personalization Vision & Strategy v1.0",
        ],
        "downstream_systems": {
            "aep": "Derives attribute schema from BUYING_JOB_CONFIDENCE and CLIENT_ATTRIBUTE_MAP",
            "ml_classifier": "Derives training signal definitions from CROSS_ROLE_WEIGHTS and TITLE_ROLE_MAP",
            "cms": "Derives content taxonomy from CONTENT_TYPES, MODULE_TYPES, CONTENT_GRAPH_NODE_TYPES",
            "crm": "Derives buying group stage and role fields from BG_STAGES and CONFIDENCE_TIERS",
            "ai_advisor": "Reads JTBD_CODES, TITLE_ROLE_MAP, and SOLUTIONS for advisory logic",
        },
    },
    "versioning_controls": "See MODEL_VERSION — semver policy applies; major version required for breaking changes",
    "migration_strategy": "Documented in CHANGELOG; downstream documents must declare data_model_version in their own metadata",
}
```

---

## §0  Module Scope

```python
MODULE_SCOPE = {
    "current_activation": ["web"],
    "designed_for": ["web", "email", "paid_media", "sales_enablement", "events"],
    "orchestration_vision": (
        "AI-powered omni-channel B2B buying group journey orchestration. "
        "Web (kalder.com) is Phase 1 activation."
    ),
}
```

---

## §1a–§1d  Platform Capabilities, Products, Solutions, Categories

*Unchanged from v0.1.0. No change requests affected these sections.*

---

## §2  Buying Group Roles  *(CR-01 — typical_titles deprecated)*

The role definitions themselves are unchanged. The `typical_titles` field on each role entry is **deprecated** as a classification input. It is retained for human readability only. Do not use it in any classification logic.

```python
# DEPRECATION PATTERN — apply to each role entry in ROLES:
"typical_titles": {
    "_status": "DEPRECATED — do not use for classification",
    "_superseded_by": "TITLE_ROLE_MAP (§19) with solution_key as required parameter",
    "_retained_for": "Human readability and documentation authoring only",
    "_titles": [
        # original title list preserved here, flagged but not removed
        ...
    ],
}
```

**Rationale:** `typical_titles` in §2 is a flat, cross-category list with no solution context. Role inversions exist across solutions — "Customer Service Manager / Supervisor" is a User in §2 but a Champion in `customer_service` in §19; "Account Executive (AE)" is a User in §2 but a Champion in `sales_automation` in §19. Any classification code reading from §2 without solution context will produce misclassifications. The deprecation is machine-readable so downstream document generation tools can detect and warn on §2 title references.

**§19 `TITLE_ROLE_MAP` is now the sole authoritative role lookup.** `solution_key` is a required parameter for any classification call. See §19 for the full specification.

---

## §3  Buying Group Role Confidence Tiers

*Unchanged from v0.1.0.*

> **Note — AR-07 cross-reference:** `CONFIDENCE_TIERS` uses a 0–100 scale where MEDIUM = 50–79 and HIGH = 80–100. `ENGAGEMENT_THRESHOLDS` (§14) uses a different 0–100 scale. These are distinct instruments. See §14 for the resolution.

---

## §4  Fallback Cascade  *(CR-08 — pending solution fallback)*

Add the following directive to `FALLBACK_CASCADE`:

```python
"pending_solution_fallback": {
    "behavior": "category_level_anchor_titles",
    "description": (
        "When a visitor's solution interest maps to a TITLE_ROLE_MAP entry with "
        "coverage_status: 'pending', fall back to the champion_typical_title and "
        "economic_buyer_typical_title anchor titles defined in §1c SOLUTIONS for "
        "firmographic matching. Confidence ceiling remains MEDIUM. Do not apply "
        "firmographic_confirmation_bonus."
    ),
    "confidence_ceiling": "medium",
    "apply_firmographic_bonus": False,
    "logging_requirement": (
        "Flag all pending-solution fallback events with solution_key and visitor_id "
        "for coverage gap tracking."
    ),
    "escalation_threshold": {
        "fallback_event_count": 50,
        "window_days": 7,
        "alert_channel": "slack_data_team_channel",
        "description": (
            "High fallback volume for a pending solution signals it should be "
            "prioritized for coverage completion."
        ),
        "calibration_note": (
            "This threshold (50 events / 7 days) is a starting hypothesis — "
            "it was set without baseline data and must be tuned in the first "
            "sprint cycle after deployment. For high-volume solutions "
            "(agent_platform, security_operations), this may fire in week 1 "
            "and produce alert fatigue. For low-volume solutions, it may "
            "never fire. The build session must capture fallback event "
            "volume per solution_key from day one to enable calibration."
        ),
    },
}
```

---

## §5–§6  Buying Group Stages, Campaign Cohorts

*Unchanged from v0.1.0.*

---

## §7  Cross-Role Signal Weight Matrix  *(CR-04, AR-05)*

### Weight Authority Clarification  *(AR-05)*

`CROSS_ROLE_WEIGHTS` is the **sole authoritative source for signal weights.** The `signal_weights` field previously present on `CONTENT_TYPES` entries (§9) has been removed. Content types now carry a `maps_to_signals` reference field pointing to the relevant `CROSS_ROLE_WEIGHTS` keys. Any scoring logic that previously read `CONTENT_TYPES["<type>"]["signal_weights"]` must be redirected to `CROSS_ROLE_WEIGHTS` via the signal key reference.

### New Signal Entry: `category_explainer_view`  *(CR-07)*

Add the following entry to `CROSS_ROLE_WEIGHTS` to support the new `category_explainer` content type in §9. Weights are derived from the council's CR-07 `signal_weights` proposal:

```python
"category_explainer_view": {
    "label": "Category explainer page view (60s+ dwell)",
    "champion": 6,
    "economic_buyer": 4,
    "influencer": 2,
    "user": 0,
    "ratifier": 0,
}
```

**Rationale:** A `category_explainer` engages buyers at the problem_identification stage — primarily Champions orienting themselves to a solution space and Economic Buyers evaluating whether a category is worth pursuing. Influencer weight is low (2) rather than zero because technical Influencers occasionally consume category content when entering a new domain. Users and Ratifiers rarely engage with category-level content and carry zero weight.

### New Section: CONDITIONAL_WEIGHT_MODIFIERS  *(CR-04)*

```python
CONDITIONAL_WEIGHT_MODIFIERS = {
    "infosec_influencer_disambiguation": {
        "trigger_signal": "security_trust_center_visit",
        "co_occurrence_signals": ["integration_catalog_view", "technical_docs_deep"],
        "co_occurrence_window": "same_session",
        "requires_any": True,
        # Either co-occurrence signal is sufficient to trigger the modifier
        "modifications": {
            "ratifier": -12,    # 22 → 10
            "influencer": +10,  # 5 → 15
        },
        "rationale": (
            "A security_trust_center_visit in isolation is a strong Ratifier signal "
            "(compliance validation, late-stage). The same visit co-occurring with "
            "integration_catalog_view or technical_docs_deep signals an InfoSec "
            "Influencer conducting architecture evaluation — not a Ratifier doing "
            "compliance validation. The behavioral pattern distinguishes the roles "
            "where title data alone cannot."
        ),
        "behavioral_note": (
            "Security Trust Center visits consumed in isolation indicate a Ratifier "
            "conducting compliance validation. The same visit co-occurring with "
            "integration catalog or deep technical documentation engagement indicates "
            "an InfoSec Influencer building an architecture evaluation — they are "
            "consuming both the compliance posture and the technical integration "
            "surface in the same session, which is an Influencer behavior pattern, "
            "not a Ratifier one."
        ),
        "validation_status": "Hypothesis",
        "validation_metric": (
            "T2-06 Role Classification Accuracy — Ratifier and Influencer "
            "disambiguation rate at ≥60% accuracy threshold"
        ),
        "version": "v0.6.4",
    },

    "infosec_influencer_disambiguation_whitepaper": {
        "trigger_signal": "security_whitepaper_download",
        "co_occurrence_signals": ["integration_catalog_view", "technical_docs_deep"],
        "co_occurrence_window": "same_session",
        "requires_any": True,
        # Either co-occurrence signal is sufficient to trigger the modifier
        "modifications": {
            "ratifier": -10,    # 20 → 10
            "influencer": +10,  # 3 → 13
        },
        "rationale": (
            "A security_whitepaper_download that co-occurs with integration_catalog_view "
            "or technical_docs_deep in the same session shifts the behavioral interpretation "
            "from compliance validation (Ratifier) to architecture evaluation (Influencer). "
            "Mirrors the infosec_influencer_disambiguation logic for security_trust_center_visit "
            "with adjusted deltas reflecting the lower base Ratifier weight for this signal "
            "(20 vs. 22) and the lower base Influencer weight (3 vs. 5)."
        ),
        "behavioral_note": (
            "Security whitepaper downloads consumed in isolation indicate a Ratifier "
            "conducting compliance due diligence. The same download co-occurring with "
            "integration catalog or deep technical documentation engagement indicates "
            "an InfoSec Influencer building an architecture evaluation — they are "
            "consuming both the security specification and the technical integration "
            "surface in the same session, which is an Influencer behavior pattern, "
            "not a Ratifier one."
        ),
        "validation_status": "Hypothesis",
        "validation_metric": (
            "T2-06 Role Classification Accuracy — Ratifier and Influencer "
            "disambiguation rate at ≥60% accuracy threshold"
        ),
        "version": "v0.6.4",
    },
}
```

**Implementation note:** This modifier must be stored in the model (here) and applied by the scoring engine at classification time. It must not be hard-coded in application logic, as that would create a second source of truth for weight adjustments.

---

## §8  Signal Recency and Decay  *(CR-05)*

The existing `DECAY_MULTIPLIERS` are unchanged. The following entry is added for anonymous visitor continuity:

```python
"anonymous_visitor_long_decay": {
    "multiplier": 0.2,
    "window": "181–365 days",
    "applies_to": "anonymous_unidentified_only",
    "description": (
        "Preserves weak signal continuity for return anonymous visitors. "
        "Does not apply to CRM-confirmed contacts, where over_180_days: 0.0 stands."
    ),
    "identity_transition_behavior": {
        "rule": "rescore_on_identification",
        "description": (
            "When an anonymous visitor with 181–365 day signal history becomes "
            "identified (via progressive disclosure or CRM match), historical signals "
            "in this window are rescored using the identified-visitor rules — which "
            "apply over_180_days: 0.0. The anonymous_visitor_long_decay multiplier "
            "does not persist after identification. This prevents weak anonymous "
            "signal history from inflating the identified-visitor role score."
        ),
    },
}
```

> **Privacy note — CR-11 cross-reference:** The `over_180_days: 0.0` multiplier is a **scoring control**, not a **data retention control**. A signal scored at 0.0 still exists in the data store. Actual deletion of signals beyond the retention window is governed by `PRIVACY_CONSENT_ARCHITECTURE` (§P), not by this section.

---

## §9  Content Type Taxonomy  *(CR-07, AR-05)*

### Removed Field

`signal_weights` has been removed from all `CONTENT_TYPES` entries. Replaced with `maps_to_signals`.

### Updated field pattern:

```python
"<content_type_key>": {
    "label": "...",
    "buying_job": "...",
    "campaign_stage": "...",
    "phase": "...",
    "definition": "...",
    "primary_role_affinity": "...",
    "maps_to_signals": ["<cross_role_weights_key>"],  # replaces signal_weights
    # maps_to_signals semantics: each key in this list is a POSSIBLE signal
    # that fires when a visitor engages with this content type. Not all signals
    # will fire on every engagement — each key represents one distinct engagement
    # action (e.g., download, dwell, submit) that is scored independently.
    # The scoring engine evaluates each signal that fired and accumulates
    # the corresponding CROSS_ROLE_WEIGHTS entries; it does not require all
    # keys to be present. A content type with multiple map entries (e.g.,
    # ["case_study_download", "competitive_comparison_view"]) means either
    # signal may fire depending on the specific engagement action observed.
    "engagement_threshold": {...},
    "gating": "...",
}
```

### New Entry: `category_explainer`  *(CR-07)*

```python
"category_explainer": {
    "label": "Category Explainer",
    "buying_job": "problem_identification",   # moved from solution_exploration
    "campaign_stage": "Education",
    "phase": "diverge",
    "definition": (
        "Content that explains what a solution category is and why it matters — "
        "not what Kalder specifically does. Orients early-stage buyers who have "
        "identified a problem area but have not yet begun vendor evaluation."
    ),
    "primary_role_affinity": "champion",
    "maps_to_signals": ["category_explainer_view"],  # weight defined in §7 CROSS_ROLE_WEIGHTS
    "engagement_threshold": {"type": "dwell_time", "minimum_seconds": 60},
    "gating": "ungated",
}
```

**Cascade required:** `category_explainer` must be removed from `BUYING_JOB_INFERENCE_SIGNALS["solution_exploration"]["strong_indicators"]` and added to `BUYING_JOB_INFERENCE_SIGNALS["problem_identification"]["strong_indicators"]`. This cascade is validated by `validate_signal_references()` (see §H — Helper Functions).

**Dependency:** AR-06 (`validate_signal_references()`) must be implemented before this change is merged, so the cascade is verified at import time rather than caught at runtime.

---

## §10  Module Types  *(CR-06)*

### New Fields on Every MODULE_TYPES Entry

Add the following two fields to every entry in `MODULE_TYPES`:

```python
"intended_axes": ["role", "solution_category"],
# List of personalization dimensions this module varies on.
# Valid values: "role", "solution_category", "confidence_tier", "buying_job", "bg_stage"

"omitted_axes_rationale": {
    "<axis_name>": "<reason this axis is intentionally excluded from this module>",
    # Example for "benefits" module:
    # "buying_job": "Benefits section is stage-stable; buying job variation handled by gated_assets",
    # "confidence_tier": "Benefits render regardless of confidence level",
}
```

### New Section: MODULE_COMPOSITION_RULES  *(CR-06, architect expansion)*

```python
MODULE_COMPOSITION_RULES = {
    "conflict_resolution_policy": "highest_specificity_wins",
    "description": (
        "When multiple modules on a single page personalize on overlapping axes, "
        "the module with the most specific axis combination takes precedence. "
        "Stage-level signals from gated_assets override role-only signals from hero "
        "when the visitor's buying job inference differs from their bg_stage."
    ),
    "axis_priority_order": [
        "buying_job",       # most specific — inferred from session behavior
        "bg_stage",         # stage-level — inferred from account-level engagement
        "confidence_tier",  # role confidence
        "role",             # role classification
        "solution_category", # broadest
    ],
    "known_conflict_scenarios": {
        "hero_vs_gated_assets_stage_mismatch": {
            "description": (
                "A Champion in Acquisition bg_stage may receive an Acquisition hero "
                "while gated_assets surfaces Progression content if their buying job "
                "inference signals a later stage. Resolution: gated_assets buying_job "
                "axis takes precedence; hero demotes to solution_category-level variation."
            ),
            "resolution": "gated_assets buying_job overrides hero stage assumption",
        },
        "cta_vs_benefits_buying_job_mismatch": {
            "description": (
                "The cta module personalizes on [role, confidence_tier, buying_job]. "
                "The benefits module personalizes on [role, solution_category] only — "
                "it does not vary by buying_job. When a visitor's buying_job inference "
                "is 'supplier_selection' but the benefits module renders stage-generic "
                "content, the page may deliver a late-stage cta ('See pricing') "
                "alongside early-stage benefits copy ('Why Kalder?'). "
                "Resolution: on pages where both cta and benefits modules are present, "
                "the cta module's buying_job axis takes precedence. The benefits module "
                "should fall back to the role axis only — it does not attempt to match "
                "cta's buying_job specificity. If a benefits variant for the inferred "
                "buying_job does not exist, render the role-default benefits content "
                "rather than a generic fallback."
            ),
            "resolution": "cta buying_job overrides benefits stage assumption; benefits renders role-default when buying_job variant is absent",
        },
    },
}
```

---

## §11  Metric Hierarchy  *(CR-10 — T3-07 revision)*

The full metric hierarchy is unchanged except for T3-07:

```python
"T3-07": {
    "tier": 3,
    "name": "Anonymous Behavioural Targeting Accuracy",
    "definition": (
        "Accuracy of behavioural role classification for anonymous TAL visitors. "
        "Primary validation: randomized progressive disclosure experiment. "
        "Secondary validation: CRM retrospective match (retained but acknowledged "
        "to carry survivor bias — not used as primary accuracy measure)."
    ),
    "primary_validation": {
        "method": "randomized_progressive_disclosure",
        "description": (
            "For a statistically defined sample of anonymous visitors with MEDIUM+ "
            "role confidence, surface a role-confirmation prompt and compare the "
            "declared role to the inferred role. Provides an unbiased accuracy estimate "
            "unaffected by the survivor bias present in CRM retrospective matching."
        ),
        "power_calculation_inputs": {
            "target_accuracy_differential": "15 percentage points (e.g., distinguish 60% from 75%)",
            "minimum_confidence_interval": "95%",
            "expected_medium_plus_base_rate": "TBD — establish at baseline",
            "minimum_sample_size": "TBD — calculated from base rate at baseline establishment",
            "note": (
                "Sample size must be set via power calculation before the first "
                "validation run. 'TBD — set at baseline' is not an acceptable "
                "steady-state answer."
            ),
        },
    },
    "secondary_validation": {
        "method": "crm_retrospective_match",
        "description": (
            "Signal model prediction vs. subsequent Salesforce CRM match for "
            "visitors who later identified. Retained as a supplementary signal. "
            "Carries survivor bias: only measures accuracy for anonymous visitors "
            "who later converted. Systematically excludes missed or incorrect "
            "classifications where the visitor never identified."
        ),
    },
    "target": "Pending baseline — establish via primary validation method",
    "owner": "Analytics & Data Science Lead",
    "cadence": "Quarterly",
    "data_source": "Segment + AEP + Salesforce CRM",
}
```

---

## §12  Classification Scoring Rules  *(CR-03, AR-03)*

### Bug Fix: `classify_visitor()` — Firmographic Bonus Ordering  *(AR-03 — Critical)*

The firmographic bonus was previously applied **before** the differential check, allowing the bonus to simultaneously inflate the score and inflate the apparent role differential — bypassing the differential floor that was designed to prevent low-signal MEDIUM classifications.

**Corrected scoring order:**

```python
# CORRECTED ORDER — do not revert:
# 1. Calculate raw behavioral scores from CROSS_ROLE_WEIGHTS
# 2. Run differential check — is top_role_score - second_role_score >= minimum_role_differential?
# 3. If differential insufficient: cap adjusted_score at 49; set differential_insufficient: True in return dict
# 4. ONLY THEN apply firmographic_confirmation_bonus if guard rail conditions are met (see below)
# 5. Return final score and classification tier

# In return dict, add:
"differential_insufficient": True / False
# Downstream systems must distinguish genuine LOW from differential-capped LOW.
# differential_insufficient: True = behavioral signal exists but role is ambiguous
# differential_insufficient: False + LOW score = genuinely weak signal
```

### Guard Rail: `firmographic_confirmation_bonus`  *(CR-03, AR-03 — Critical)*

```python
"firmographic_confirmation_bonus": 30,
"firmographic_bonus_requires_minimum_behavioral_score": 15,
# The +30 bonus is ONLY applied when the visitor's behavioral score for
# the top role already meets this floor AFTER the differential check.
# A floor of 15 requires at least one meaningful behavioral signal above
# the noise floor. Title match alone cannot produce a MEDIUM classification.
#
# Interaction with differential check: the bonus is applied after the
# differential check and does not affect whether the differential floor
# was met. A visitor whose differential was insufficient at step 2 remains
# capped at 49 even after the bonus is applied.
```

**Before / after illustration:**

| Scenario | v0.1.0 result | v0.2.0 result |
|---|---|---|
| Behavioral score 20, title matches Champion, **differential insufficient** | 20 + 30 = 50 → MEDIUM | Differential check fails → capped at 49 → LOW; bonus not applied regardless of floor |
| Behavioral score 20, title matches Champion, **differential sufficient** | 20 + 30 = 50 → MEDIUM | 20 ≥ floor(15), differential met → 20 + 30 = 50 → MEDIUM (correct; real behavioral signal confirmed by title) |
| Behavioral score 10, title matches Champion | 10 + 30 = 40 → LOW (barely) | 10 < floor(15) → bonus not applied → 10 → UNKNOWN |
| Behavioral score 18, differential sufficient, title matches | 18 + 30 = 48 → LOW | 18 ≥ 15, differential met → 18 + 30 = 48 → LOW (bonus applies, score remains in LOW band) |
| Behavioral score 30, differential sufficient, title matches | 30 + 30 = 60 → MEDIUM | Same → 60 → MEDIUM (correct; behavioral signal is meaningful) |

---

## §13–§14  Data Source Authority Hierarchy, Engagement Score Thresholds  *(AR-07)*

### Naming Collision Resolution  *(AR-07)*

`CONFIDENCE_TIERS` (§3) and `ENGAGEMENT_THRESHOLDS` (§14) both use a 0–100 scale with overlapping tier labels (LOW, MEDIUM, HIGH) at different breakpoints. This creates misread risk in application code and documentation.

**Resolution:** Rename all `ENGAGEMENT_THRESHOLDS` keys to use the `_ENGAGEMENT` suffix:

```python
ENGAGEMENT_THRESHOLDS = {
    "LOW_ENGAGEMENT":    {"min": 0,  "max": 39},
    "MEDIUM_ENGAGEMENT": {"min": 40, "max": 69},
    "HIGH_ENGAGEMENT":   {"min": 70, "max": 100},
}
```

Add the following cross-reference comment at the top of both §3 and §14:

```python
# SCALE DIVERGENCE — READ BEFORE USING:
# CONFIDENCE_TIERS (§3): MEDIUM = 50–79, HIGH = 80–100
# ENGAGEMENT_THRESHOLDS (§14): MEDIUM_ENGAGEMENT = 40–69, HIGH_ENGAGEMENT = 70–100
# A score of 45 is LOW confidence but MEDIUM_ENGAGEMENT.
# A score of 72 is HIGH_ENGAGEMENT but MEDIUM confidence.
# These are distinct instruments. Always namespace which scale you are on.
```

---

## §15–§16  Martech Stack, Content Graph Node Types

*Unchanged from v0.1.0.*

---

## §17  JTBD Codes

*Unchanged from v0.1.0 (131 codes across 15 solutions).*

---

## §18  Buying Group Convergence Points

*Unchanged from v0.1.0. Sales activation output is now handled by the new `SALES_ACTIVATION_CONFIG` section (§SA) rather than being embedded in convergence point entries.*

---

## §19  Title to Role Mapping  *(CR-01, CR-02)*

### §19 Is Now the Sole Authoritative Role Lookup

`solution_key` is a **required parameter** for any classification call that resolves role from title. The deprecated `typical_titles` field in §2 must not be used as a classification input.

**Cross-solution title overlap is expected behavior, not a data error.** Platform-era enterprise titles genuinely span solution categories — "Head of Digital Transformation" appears as a Champion in both `customer_service` and `it_service_management`. The same title legitimately maps to the same role in multiple solutions because that role holder is a credible Champion in both contexts. The `solution_key` parameter is the disambiguation mechanism: classification always resolves within a single solution context. A developer encountering the same title in two solution maps should not flag it as a duplicate or error.

### New Field: `validation_status` on Each Title Entry

Every title within each solution's role list now carries a `validation_status` field. The four-value enumeration:

```python
"validation_status": "inferred"
# Constructed from role definitions and analyst frameworks only.
# No CRM evidence. Lowest weight in ML classifier training.

"validation_status": "constructed_from_anchor"
# Derived from §1c SOLUTIONS champion_typical_title or economic_buyer_typical_title
# anchor fields. Distinct provenance from fully inferred titles.
# ML classifier should weight these differently from pure inferred entries.

"validation_status": "partial_crm_match"
# Some CRM evidence exists; not statistically validated.
# Intermediate weight in ML classifier training.

"validation_status": "validated"
# Ground-truth CRM match confirmed.
# Full weight in ML classifier training.
```

**Example entry pattern:**

```python
"customer_service": {
    "coverage_status": "complete",
    "champion": {
        "titles": [
            {"title": "Head of Customer Experience",       "validation_status": "validated"},
            {"title": "Director of Customer Service Ops",  "validation_status": "validated"},
            {"title": "Head of Digital Transformation",    "validation_status": "partial_crm_match"},
        ]
    },
    "economic_buyer": {
        "titles": [
            {"title": "Chief Customer Officer",            "validation_status": "validated"},
            {"title": "Chief Operating Officer",           "validation_status": "validated"},
        ]
    },
    ...
}
```

---

## §20  Website Surface Taxonomy

*Unchanged from v0.1.0.*

---

## §SA  Sales Activation Config  *(CR-12 — new section)*

Sales alert configuration is maintained as a **separate section** from `BG_CONVERGENCE_POINTS`. This preserves the model's channel-agnostic design principle — convergence point definitions are stable and system-agnostic; alert configuration is coupling to a specific CRM and SDR toolchain that will vary by client.

```python
SALES_ACTIVATION_CONFIG = {
    "convergence_point_alerts": {
        # trigger_condition and alert_payload.recommended_action are canonical —
        # they encode buying intelligence and must not be changed at onboarding.
        # crm_field, sdr_sequence, and alert_channel are client-configured at onboarding.

        "problem_validation": {
            "trigger_condition": (
                "Champion reaches MEDIUM+ role confidence AND buying_job inferred as "
                "'problem_identification' AND Economic Buyer has at least one signal "
                "in the last 30 days. Convergence point is approaching — group is "
                "consuming problem-framing content but has not yet shifted to "
                "solution_exploration buying job signals."
            ),
            "alert_payload": {
                "bg_stage": "<current stage>",
                "convergence_point": "problem_validation",
                "roles_active": ["<list of MEDIUM+ roles in the buying group>"],
                "blocker_risk": "misalignment_on_problem or buying_group_turnover",
                "recommended_action": (
                    "Champion and EB are approaching problem alignment. "
                    "Engage now with external validation content (benchmark report, "
                    "peer references, analyst data) to reinforce urgency. "
                    "Do not introduce solution content yet — the group is still in "
                    "diverge phase. A sales touch at this point should share a "
                    "relevant benchmark or named-account story, not pitch features."
                ),
            },
            "crm_field": "<Salesforce field — configured at onboarding>",
            "sdr_sequence": "<sequence name or ID — configured at onboarding>",
            "alert_channel": ["crm_task", "slack_sdr_channel"],
        },

        "requirements_framing": {
            "trigger_condition": (
                "Champion and Influencer both reach MEDIUM+ role confidence AND "
                "buying_job inference shifts from 'problem_identification' to "
                "'requirements_building' OR use_case_exploration signal appears in "
                "the current session. User-role signal has appeared at least once "
                "in the last 14 days — end-user input is active."
            ),
            "alert_payload": {
                "bg_stage": "<current stage>",
                "convergence_point": "requirements_framing",
                "roles_active": ["<list of MEDIUM+ roles in the buying group>"],
                "blocker_risk": "group_disagreement_on_requirements or buying_consultant_discussion",
                "recommended_action": (
                    "Champion and Influencer are defining evaluation criteria. "
                    "This is the highest-leverage sales intervention point before "
                    "a formal RFP or evaluation framework is locked. Offer an RFP "
                    "template or requirements workshop. If a buying consultant has "
                    "appeared (buying_consultant_discussion blocker is active), "
                    "engage with technical credibility content — not pitch material."
                ),
            },
            "crm_field": "<Salesforce field — configured at onboarding>",
            "sdr_sequence": "<sequence name or ID — configured at onboarding>",
            "alert_channel": ["crm_task", "slack_sdr_channel"],
        },

        "solution_validation": {
            "trigger_condition": (
                "Champion and Influencer both reach MEDIUM+ role confidence AND "
                "technical_docs_deep, integration_catalog_view, or product_tour_engagement "
                "signals appear in the last 7 days. Buying job inference is "
                "'requirements_building' or 'supplier_selection'. Group is evaluating "
                "functional and technical fit."
            ),
            "alert_payload": {
                "bg_stage": "<current stage>",
                "convergence_point": "solution_validation",
                "roles_active": ["<list of MEDIUM+ roles in the buying group>"],
                "blocker_risk": "feasibility_review or exploration_of_integration_with_existing_systems",
                "recommended_action": (
                    "Group is in active technical evaluation. This is a Influencer-led "
                    "convergence point — the Champion needs technical proof to carry "
                    "internally. Provide integration documentation, a technical "
                    "architecture brief, and a named customer reference for a similar "
                    "stack. If feasibility_review blocker is active, proactively offer "
                    "a solutions engineer engagement before the group reaches an impasse."
                ),
            },
            "crm_field": "<Salesforce field — configured at onboarding>",
            "sdr_sequence": "<sequence name or ID — configured at onboarding>",
            "alert_channel": ["crm_task", "slack_sdr_channel"],
        },

        "business_value_alignment": {
            "trigger_condition": (
                "Economic Buyer reaches MEDIUM+ role confidence AND "
                "roi_calculator_usage or pricing_page_view signal appears in the "
                "last 14 days. Champion is at MEDIUM+ and has consumed executive_brief "
                "or case_study content. Group is in active ROI and TCO evaluation."
            ),
            "alert_payload": {
                "bg_stage": "<current stage>",
                "convergence_point": "business_value_alignment",
                "roles_active": ["<list of MEDIUM+ roles in the buying group>"],
                "blocker_risk": "business_case_data_unavailable or budget_cut",
                "recommended_action": (
                    "EB is building or stress-testing the business case. "
                    "This is the highest-stakes EB engagement in the buying journey. "
                    "Provide a pre-built ROI model with inputs populated for their "
                    "industry and company size. If business_case_data_unavailable "
                    "blocker is active, offer a value assessment workshop. "
                    "If budget_cut is active, shift framing from ROI to "
                    "cost-of-inaction — the EB needs ammunition to defend the spend, "
                    "not a new justification to build from scratch."
                ),
            },
            "crm_field": "<Salesforce field — configured at onboarding>",
            "sdr_sequence": "<sequence name or ID — configured at onboarding>",
            "alert_channel": ["crm_task", "slack_sdr_channel"],
        },

        "risk_compliance_validation": {
            "trigger_condition": (
                "Ratifier reaches LOW+ role confidence OR security_trust_center_visit "
                "signal appears for any group member AND Champion and EB are both at "
                "MEDIUM+. Buying job inference is 'supplier_selection'. "
                "Late-stage procurement or legal review is active or approaching."
            ),
            "alert_payload": {
                "bg_stage": "<current stage>",
                "convergence_point": "risk_compliance_validation",
                "roles_active": ["<list of MEDIUM+ roles in the buying group>"],
                "blocker_risk": "purchasing_rules_overrule_group_decision or legal_flag or capital_review_board",
                "recommended_action": (
                    "Ratifier is entering the process. This is the most common "
                    "source of late-stage deal slippage — engage proactively rather "
                    "than reactively. Provide a security and compliance package: "
                    "SOC 2 report, data residency documentation, DPA template, "
                    "and a one-page executive summary of Kalder Trust capabilities. "
                    "If legal_flag or capital_review_board blockers are active, "
                    "escalate to AE immediately — these require direct engagement, "
                    "not content delivery."
                ),
            },
            "crm_field": "<Salesforce field — configured at onboarding>",
            "sdr_sequence": "<sequence name or ID — configured at onboarding>",
            "alert_channel": ["crm_task", "slack_sdr_channel"],
        },

        "final_commitment": {
            "trigger_condition": (
                "Champion, Economic Buyer, and Ratifier all have at least LOW+ "
                "role confidence AND Champion buying job inference is 'supplier_selection' "
                "AND group bg_stage is 'Qualified'. All three required roles are "
                "active — full buying group convergence is in progress."
            ),
            "alert_payload": {
                "bg_stage": "Qualified",
                "convergence_point": "final_commitment",
                "roles_active": ["champion", "economic_buyer", "ratifier"],
                "blocker_risk": "buying_group_turnover or contract_updates_required or purchasing_rules_overrule_group_decision",
                "recommended_action": (
                    "Full buying group is aligned and approaching commitment. "
                    "Remove remaining friction — proactively provide procurement "
                    "guide, contract redline support, and implementation timeline. "
                    "If buying_group_turnover is active at this stage, treat it "
                    "as partial_reset: re-brief the new member on the full "
                    "business case before re-engaging on commitment. "
                    "If purchasing_rules_overrule_group_decision fires at this "
                    "stage, escalate immediately — it is a full_reset blocker and "
                    "requires executive-level engagement to resolve."
                ),
            },
            "crm_field": "<Salesforce field — configured at onboarding>",
            "sdr_sequence": "<sequence name or ID — configured at onboarding>",
            "alert_channel": ["crm_task", "slack_sdr_channel"],
        },
    },
    "onboarding_note": (
        "crm_field, sdr_sequence, and alert_channel are populated during AI Advisor "
        "client onboarding. trigger_condition and alert_payload (including "
        "recommended_action) are canonical — they encode the buying intelligence "
        "and must not be modified at onboarding."
    ),
}
```

---

## §CA  Client Attribute Map  *(CR-09 — new section)*

```python
CLIENT_ATTRIBUTE_MAP = {
    # Maps canonical attribute names to client-specific CDP/CRM field names.
    # Default values are Kalder's own AEP attribute names (the canonical schema).
    # Override during AI Advisor client onboarding.
    "buying_job_confirmed":    "buying_job_confirmed",
    "buying_job_inferred":     "buying_job_inferred",
    "role_confidence_score":   "role_confidence_score",
    "bg_stage":                "bg_stage",
    "role_classification":     "role_classification",
    "confidence_tier":         "confidence_tier",
    "visitor_consent_state":   "visitor_consent_state",   # added for §P
}
# All references to aep_attribute values throughout the model must resolve
# through this map at runtime, not by reading hardcoded strings directly.
```

---

## §P  Privacy and Consent Architecture  *(CR-11 — new section, Critical)*

> **Pre-Build Blocker — two-track completion path.** This section is required before any enterprise deployment.
>
> **Track 1 (data / marketing ops team — clears build blocker):** Conduct Legitimate Interest Assessment (LIA) for the 15 first-party behavioral signals. These are owned-property behavioral signals with no PII and no cross-site tracking. The LIA follows a standard three-question template (purpose, necessity, balancing test) and does not require legal sign-off. §P.2 below reflects Track 1 completed.
>
> **Track 2 (legal — run in parallel, gates Demandbase activation only):** Review the Demandbase DPA and consent mechanism for `demandbase_firmographic_match` and any 6sense signals feeding scoring. Third-party enrichment signals and the features that depend on them (`firmographic_confirmation_bonus`, title-match scoring pathway) remain suppressed until Track 2 completes. Track 2 does not block the build session.

### P.1  Consent State Gating

```python
VISITOR_CONSENT_STATES = {
    "full": {
        "description": "All signals may be collected and scored.",
        "eligible_signals": "all",
    },
    "functional_only": {
        "description": (
            "Only signals classified as 'legitimate_interest' or 'no_pii' may be "
            "collected. Cross-site tracking and third-party enrichment are suppressed."
        ),
        "suppressed_signal_classes": ["explicit_consent_required"],
    },
    "declined": {
        "description": "No behavioral signals may be collected or scored.",
        "eligible_signals": "none",
        "action": "Serve unPersonalized experience. Do not score or classify.",
    },
}
# The visitor_consent_state attribute (mapped via CLIENT_ATTRIBUTE_MAP) must be
# checked before signal collection and scoring logic executes on any visitor.
```

### P.2  Signal-Level Consent Classification

`SIGNAL_CONSENT_REQUIREMENTS` covers all 19 signals in `CROSS_ROLE_WEIGHTS`. The 15 first-party behavioral signals are classified via Track 1 LIA (data / marketing ops team). The third-party enrichment signal (`demandbase_firmographic_match`) requires Track 2 legal review before activation.

```python
# pending_consent_classification_default: functional_only
# Any signal key not present in this dict is treated as functional_only —
# explicit_consent_required class signals are suppressed.
# This default must be applied before SIGNAL_CONSENT_REQUIREMENTS is complete
# and retained permanently as a safety net for new signals added after v0.2.0.
PENDING_CONSENT_CLASSIFICATION_DEFAULT = "functional_only"

# ── Track 1 complete — 15 first-party behavioral signals ──────────────────
# All are owned-property behavioral signals. No PII. No cross-site tracking.
# Lawful basis: legitimate_interest (LIA completed by data / marketing ops team).
# GDPR Article 6(1)(f) applies. LIA documentation required before activation.

LI_FIRST_PARTY = {
    "lawful_basis": "legitimate_interest",
    "pii_involved": False,
    "cross_site": False,
    "gdpr_suppressed_without_consent": False,
    "ccpa_opt_out_affects": False,
}

SIGNAL_CONSENT_REQUIREMENTS = {
    # First-party behavioral signals — LIA completed, no legal review required
    "case_study_download":          {**LI_FIRST_PARTY},
    "competitive_comparison_view":  {**LI_FIRST_PARTY},
    "demo_request":                 {**LI_FIRST_PARTY},
    "multi_solution_exploration":   {**LI_FIRST_PARTY},
    "roi_calculator_usage":         {**LI_FIRST_PARTY},
    "pricing_page_view":            {**LI_FIRST_PARTY},
    "executive_brief_download":     {**LI_FIRST_PARTY},
    "use_case_exploration":         {**LI_FIRST_PARTY},
    "product_tour_engagement":      {**LI_FIRST_PARTY},
    "webinar_registration":         {**LI_FIRST_PARTY},
    "howto_training_content":       {**LI_FIRST_PARTY},
    "community_forum_engagement":   {**LI_FIRST_PARTY},
    "security_whitepaper_download": {**LI_FIRST_PARTY},
    "compliance_governance_content":{**LI_FIRST_PARTY},
    "technical_docs_deep":          {**LI_FIRST_PARTY},
    "faq_support_docs":             {**LI_FIRST_PARTY},
    "diagnostic_assessment":        {**LI_FIRST_PARTY},
    "integration_catalog_view":     {**LI_FIRST_PARTY},
    "security_trust_center_visit":  {**LI_FIRST_PARTY},

    # ── Track 2 pending — third-party enrichment signal ───────────────────
    # Requires legal review: Demandbase DPA, GDPR Article 6(1)(a) consent mechanism.
    # Features gated on this signal (firmographic_confirmation_bonus, title-match
    # scoring pathway) must remain suppressed until Track 2 completes.
    "demandbase_firmographic_match": {
        "lawful_basis": "explicit_consent_required",
        "pii_involved": True,
        "cross_site": True,
        "gdpr_suppressed_without_consent": True,
        "ccpa_opt_out_affects": True,
        "track_2_status": "pending_legal_review",
        "note": (
            "Third-party reverse-IP firmographic enrichment via Demandbase. "
            "Cannot be activated in GDPR jurisdictions without explicit consent. "
            "Suppressed entirely in 'functional_only' and 'declined' consent states. "
            "If 6sense intent data feeds scoring, classify as explicit_consent_required "
            "and add a separate entry here."
        ),
    },
}
```

### P.3  Geographic Handling Rules

```python
GEOGRAPHIC_CONSENT_RULES = {
    "GDPR": {
        "jurisdictions": ["EU", "UK", "EEA"],
        "suppressed_signal_classes": ["explicit_consent_required"],
        "default_consent_state_if_unknown": "functional_only",
        "gdpr_lawful_basis_note": (
            "Legitimate interest applies to behavioral signals on owned web properties. "
            "Third-party enrichment (Demandbase) requires explicit consent under "
            "GDPR Article 6(1)(a). Document legitimate interest basis in LIA before "
            "activating any signal classified as legitimate_interest."
        ),
    },
    "CCPA": {
        "jurisdictions": ["California, US"],
        "opt_out_affects_signals": ["explicit_consent_required"],
        "right_to_opt_out_notice_required": True,
    },
    "default": {
        "jurisdictions": "All others",
        "default_consent_state_if_unknown": "functional_only",
        "note": "Conservative default pending legal review for additional jurisdictions.",
    },
}
```

### P.4  Data Retention Schedule

> **Critical distinction:** `DECAY_MULTIPLIERS` (§8) are **scoring controls**. A signal with `over_180_days: 0.0` multiplier still exists in the data store — it contributes zero to scoring but is visible to legal review. Retention windows below are **storage controls** that govern when data is physically deleted. These are separate instruments.

```python
DATA_RETENTION_SCHEDULE = {
    "raw_behavioral_signals": {
        "retention_window_days": 365,
        "description": "Raw event data in Segment / AEP event stream",
        "deletion_trigger": "Rolling window — auto-expire after retention_window_days",
    },
    "scored_role_attributes": {
        "retention_window_days": 180,
        "description": "AEP profile attributes: role_confidence_score, role_classification, bg_stage",
        "deletion_trigger": "Rolling window; also deleted on consent withdrawal or DSR",
    },
    "crm_enriched_records": {
        "retention_window_days": 730,  # 2 years — standard CRM retention
        "description": "Salesforce CRM contact records with buying group field enrichment",
        "deletion_trigger": "DSR or contract termination; coordinated with CRM admin",
    },
    "firmographic_enrichment_cache": {
        "retention_window_days": 90,
        "description": "Demandbase reverse-IP match results cached in AEP",
        "deletion_trigger": "Rolling window; suppressed immediately on consent withdrawal",
    },
}
```

### P.5  Anonymization and Deletion Path

```python
DELETION_PATH = {
    "trigger_events": ["consent_withdrawal", "data_subject_request_DSR", "contract_termination"],
    "cascade_steps": [
        {
            "step": 1,
            "system": "AEP",
            "action": "Delete all profile attributes in scored_role_attributes retention class",
            "sla_hours": 72,
        },
        {
            "step": 2,
            "system": "Segment",
            "action": "Suppress future event collection; submit deletion request for historical events",
            "sla_hours": 72,
        },
        {
            "step": 3,
            "system": "Snowflake",
            "action": "Execute DELETE on visitor_signals and visitor_scores tables for visitor_id",
            "sla_hours": 168,  # 7 days — batch deletion
        },
        {
            "step": 4,
            "system": "Salesforce CRM",
            "action": "Null-out buying group enrichment fields; retain base contact record per CRM retention policy",
            "sla_hours": 168,
        },
    ],
    "confirmation_requirement": "Generate deletion confirmation record with timestamp and step completion status",
}
```

---

## §H  Helper Functions  *(AR-02, AR-04, AR-06, AR-08)*

### COVERAGE_STATUS_HIERARCHY  *(AR-02)*

```python
COVERAGE_STATUS_HIERARCHY = {
    # A solution's effective coverage_status is the MINIMUM across:
    # its own SOLUTIONS entry, its TITLE_ROLE_MAP entry, and its JTBD_CODES entries.
    "rank": {"pending": 0, "constructed": 1, "partial": 2, "complete": 3},
    "inheritance_rule": "minimum_across_all_associated_entities",
    "description": (
        "When a solution's SOLUTIONS entry reads 'constructed' but its TITLE_ROLE_MAP "
        "entry reads 'pending', the effective status is 'pending'. Reporting on "
        "category completeness must use effective_coverage_status, not the SOLUTIONS "
        "entry in isolation."
    ),
}

def validate_coverage_consistency():
    """
    Surfaces entities where coverage_status diverges from their parent entity's status.
    Call at import time in development; run as a CI check before model updates are merged.
    Raises ValueError on any inconsistency (consistent with validate_signal_references()).
    Returns a list of (entity_type, entity_key, local_status, parent_status) tuples
    where local_status is inconsistent with parent_status per the inheritance rule.
    """
    pass  # implementation in kalder_data_model.py
```

### Refactored `PROBABLE_JOB_PRIORS`  *(AR-04)*

The tuple-key pattern is replaced with a nested dict for serialization safety:

```python
# BEFORE (v0.1.0 — do not use):
PROBABLE_JOB_PRIORS = {
    ("champion", "targeted"): "problem_identification",
    ...
}

# AFTER (v0.2.0):
# Stage keys must exactly match BG_STAGES: targeted, engaged, prioritized, qualified
# Buying job values must exactly match the four valid codes:
#   problem_identification, solution_exploration, requirements_building, supplier_selection
# None values for ratifier are intentional — Ratifiers do not appear in early stages;
#   a None return signals "do not infer a buying job for this role/stage combination"
PROBABLE_JOB_PRIORS = {
    "champion": {
        "targeted":    "problem_identification",
        "engaged":     "solution_exploration",
        "prioritized": "requirements_building",
        "qualified":   "supplier_selection",
    },
    "economic_buyer": {
        "targeted":    "problem_identification",
        "engaged":     "solution_exploration",
        "prioritized": "requirements_building",
        "qualified":   "supplier_selection",
    },
    "influencer": {
        "targeted":    "problem_identification",
        "engaged":     "solution_exploration",
        "prioritized": "requirements_building",
        "qualified":   "supplier_selection",
    },
    "user": {
        "targeted":    "problem_identification",
        "engaged":     "solution_exploration",
        "prioritized": "requirements_building",
        "qualified":   "supplier_selection",
    },
    "ratifier": {
        "targeted":    None,   # Ratifiers do not appear at targeted stage
        "engaged":     None,   # Ratifiers do not appear at engaged stage
        "prioritized": "requirements_building",
        "qualified":   "supplier_selection",
    },
}

def get_probable_buying_job(role: str, bg_stage: str) -> str | None:
    # Returns None for role/stage combinations where buying job inference is not meaningful.
    # Returns "unknown" only when the role or bg_stage key is not found in the dict.
    role_map = PROBABLE_JOB_PRIORS.get(role)
    if role_map is None:
        return "unknown"
    if bg_stage not in role_map:
        return "unknown"
    return role_map[bg_stage]  # may be None — callers must handle None explicitly
```

### `validate_signal_references()`  *(AR-06)*

```python
def validate_signal_references():
    """
    Cross-checks that:
    1. All keys in BUYING_JOB_INFERENCE_SIGNALS[*]["strong_indicators"] and
       "weak_indicators" exist in CONTENT_TYPES.
    2. The buying_job classification on each referenced content type matches the
       inference signal group it appears in.
    Raises ValueError on any mismatch at import time.
    Call before merging any change to §9 or BUYING_JOB_INFERENCE_SIGNALS.
    """
    pass  # implementation in kalder_data_model.py
```

### Refactored `get_titles_for_role()`  *(AR-08)*

```python
def get_titles_for_role(solution_key: str, role: str) -> dict:
    """
    Returns a structured result object that distinguishes failure reasons.
    Callers must not interpret an empty titles list as a data gap without
    checking the status field.
    """
    solution_map = TITLE_ROLE_MAP.get(solution_key)
    if solution_map is None:
        return {
            "status": "not_found",
            "titles": [],
            "reason": f"solution_key '{solution_key}' not in TITLE_ROLE_MAP",
        }
    if solution_map.get("coverage_status") == "pending":
        return {
            "status": "pending",
            "titles": [],
            "reason": f"coverage_status is pending for '{solution_key}' — apply pending_solution_fallback (§4)",
        }
    titles = [entry["title"] for entry in solution_map.get(role, {}).get("titles", [])]
    return {"status": "ok", "titles": titles}
```

---

## Conflict Resolutions

Four cases where the council review and architect review diverged. The following decisions are final for v0.2.0.

| Conflict | Council Position | Architect Position | Resolution |
|---|---|---|---|
| CR-03 scope vs. AR-03 | Guard rail only: add `firmographic_bonus_requires_minimum_behavioral_score` floor | Ordering bug: bonus applied before differential check compounds the over-classification; both must be fixed together | **AR-03 first, then CR-03.** The floor guard is correct but insufficient without the ordering fix. Implement together. Minimum floor set at 15 (architect recommendation), not 10 (council). |
| CR-12 placement | Embed `sales_alert_triggers` inside `BG_CONVERGENCE_POINTS` entries | Separate section (`SALES_ACTIVATION_CONFIG`) referencing convergence point keys; convergence point definitions should be channel-agnostic | **Architect position adopted.** `SALES_ACTIVATION_CONFIG` is a new §SA section. Convergence point definitions are unchanged. Alert payload schema from the council's CR-12 is retained; only placement differs. |
| CR-07 timing dependency | Sprint 2 work; no sequencing constraint noted | AR-06 (`validate_signal_references()`) must exist before CR-07 merges to prevent invisible cascade errors | **Architect sequencing adopted.** AR-06 is a pre-condition for CR-07. |
| CR-08 dependency | Fallback directive in §4/§12; no helper function dependency noted | `get_titles_for_role()` must return structured result (AR-08) before CR-08 fallback logic can distinguish "pending" from "not found" | **Architect sequencing adopted.** AR-08 implemented first (see §H above); CR-08 escalation_threshold added to the fallback directive (§4). |

---

## Implementation Sequencing

Derived from the architect's consolidated recommendation. All pre-build blockers must clear before application development begins.

### Pre-Build Blockers

All four pre-build blockers are now resolved in this document. The build session may open.

1. **§P (CR-11)** — Privacy architecture. Track 1 complete (15 first-party signals classified). Track 2 (Demandbase legal review) runs in parallel and gates only the firmographic pathway, not the build.
2. **§2/§19 (CR-01)** — `typical_titles` deprecated; `TITLE_ROLE_MAP` sole authoritative lookup. ✓
3. **§12 + §H (AR-03 + CR-03)** — `classify_visitor()` bonus ordering fixed; guard rail added. ✓
4. **§M AR-01** — `MODEL_STATUS` block specified. ✓
5. **§SA (CR-12)** — All six convergence points fully specified with canonical trigger conditions and recommended actions. ✓

### Sprint 1 — Data Integrity and Structural Correctness

5. **§7 / §9 (AR-05)** — Remove redundant `signal_weights` from `CONTENT_TYPES`; add `maps_to_signals`.
6. **§H (AR-06)** — `validate_signal_references()` helper.
7. **§3 / §14 (AR-07)** — Resolve confidence/engagement key collision; rename engagement keys.
8. **§H + §4 (AR-08 + CR-08)** — Refactor `get_titles_for_role()`; add pending_solution_fallback with escalation_threshold.
9. **§19 (CR-02)** — `validation_status` sub-field with 4-value enum.
10. **§CA (CR-09)** — `CLIENT_ATTRIBUTE_MAP` abstraction.

### Sprint 2 — Behavioral Refinement and Model Completeness

11. **§7 (CR-04)** — `CONDITIONAL_WEIGHT_MODIFIERS` for Ratifier/InfoSec-Influencer disambiguation.
12. **§10 (CR-06)** — `intended_axes`, `omitted_axes_rationale`, `MODULE_COMPOSITION_RULES`.
13. **§9 (CR-07)** — `category_explainer` content type (after AR-06 exists).
14. **§SA (CR-12)** — `SALES_ACTIVATION_CONFIG` section.
15. **§H (AR-02)** — `COVERAGE_STATUS_HIERARCHY` and `validate_coverage_consistency()`.
16. **§M (AR-09)** — `MODEL_VERSION` dict.

### Backlog — No Build Dependency

17. **§8 (CR-05)** — Anonymous decay multiplier with identity-transition behavior.
18. **§11 (CR-10)** — T3-07 validation methodology revision.
19. **§H (AR-04)** — `PROBABLE_JOB_PRIORS` tuple key refactor (before serialization, not urgently).

---

## Change Request Summary Table

| # | Source | Section(s) | Description | Priority | Status |
|---|--------|-----------|-------------|----------|--------|
| CR-01 | Council | §2, §19 | Deprecate `typical_titles`; make `TITLE_ROLE_MAP` sole lookup with `solution_key` required | Critical | Specified |
| CR-02 | Council | §19 | Add `validation_status` per title entry (4-value enum incl. `constructed_from_anchor`) | High | Specified |
| CR-03 | Council | §12 | Add `firmographic_bonus_requires_minimum_behavioral_score` guard rail (floor = 15) | Critical | Specified (with AR-03) |
| CR-04 | Council | §7 | `CONDITIONAL_WEIGHT_MODIFIERS` for Ratifier/InfoSec-Influencer disambiguation | Medium | Specified |
| CR-05 | Council | §8 | `anonymous_visitor_long_decay` multiplier with identity-transition behavior | Low | Specified |
| CR-06 | Council | §10 | `intended_axes`, `omitted_axes_rationale`, `MODULE_COMPOSITION_RULES` | Medium | Specified |
| CR-07 | Council | §9 | `category_explainer` as distinct content type (after AR-06) | Medium | Specified |
| CR-08 | Council | §4, §12 | `pending_solution_fallback` with escalation_threshold (after AR-08) | High | Specified |
| CR-09 | Council | Global | `CLIENT_ATTRIBUTE_MAP` configurable namespace | High | Specified |
| CR-10 | Council | §11 | T3-07 randomized progressive disclosure primary validation with power calc | Medium | Specified |
| CR-11 | Council | Global | `PRIVACY_CONSENT_ARCHITECTURE` — consent gating, signal classification, geo rules, retention, deletion | Critical | Specified — Track 1 complete (15 first-party signals); Track 2 pending legal (Demandbase only) |
| CR-12 | Council | §18/§SA | `SALES_ACTIVATION_CONFIG` as separate section — all six convergence points specified | High | Specified — complete |
| AR-01 | Architect | Global | `MODEL_STATUS` block | High | Specified |
| AR-02 | Architect | Global | `COVERAGE_STATUS_HIERARCHY` + `validate_coverage_consistency()` | Medium | Specified |
| AR-03 | Architect | §12 | Fix `classify_visitor()` bonus ordering bug; add `differential_insufficient` flag | Critical | Specified (with CR-03) |
| AR-04 | Architect | Global | Refactor `PROBABLE_JOB_PRIORS` from tuple keys to nested dict | Low | Specified |
| AR-05 | Architect | §7, §9 | Remove redundant `signal_weights` from `CONTENT_TYPES`; add `maps_to_signals` | High | Specified |
| AR-06 | Architect | §7, §9 | `validate_signal_references()` helper for referential integrity | High | Specified |
| AR-07 | Architect | §3, §14 | Rename `ENGAGEMENT_THRESHOLDS` keys to avoid collision with `CONFIDENCE_TIERS` | High | Specified |
| AR-08 | Architect | Helper | Refactor `get_titles_for_role()` to return structured result object | Medium | Specified |
| AR-09 | Architect | Global | `MODEL_VERSION` dict with semver policy and changelog | Medium | Specified |

*21 change requests total. 4 Critical. 9 High. 6 Medium. 2 Low.*
