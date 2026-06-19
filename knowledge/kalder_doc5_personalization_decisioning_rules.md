# Document 5: Personalization Decisioning Rules
## Kalder Buying Group Personalization Program

**Status:** Approved
**Data model version:** 0.2.0
**Corpus position:** Document 5 of 9
**Depends on:** Document 1 (Buying Group Role Architecture), Document 2 (Signal Definition and Confidence Model), Document 3 (Audience and Segmentation Architecture), Document 4 (Content Model and Taxonomy), `kalder_data_model_s0_s1.py` §3, §4, §10, §12, §19, §20

---

## Table of Contents

- Section 1: Confidence Tier Activation Gates
- Section 2: Two-Axis vs. Three-Axis Content Selection
- Section 3: Module-Level Decisioning Rules
- Section 4: Adobe Target Activity Configuration
- Section 5: Firmographic-First Path
- Section 6: Anonymous Visitor Handling
- Section 7: Holdback Group Specification
- Section 8: Level 4 Page Assembly Completeness
- Section 9: Edge Cases and Suppression Rules
- Section 10: `pending_solution_fallback` Behavior

---


# Document 5: Personalization Decisioning Rules
## Kalder Buying Group Personalization Program
**Status:** Draft — Section 1 only
**Data model version:** 0.2.0
**Corpus position:** Document 5 of 9
**Depends on:** Document 1 (Buying Group Role Architecture), Document 2 (Signal Definition and Confidence Model), Document 3 (Audience and Segmentation Architecture), Document 4 (Content Model and Taxonomy), `kalder_data_model_s0_s1.py` §3, §4, §12

---

## Section 1: Confidence Tier Activation Gates

> **Depends on:** `kalder_data_model_s0_s1.py` §3 CONFIDENCE_TIERS, §4 FALLBACK_CASCADE, §12 SCORING_RULES (AR-03); Document 1 §5 and §8; Document 2 §8.2; Document 3 §6.2; Document 4 §7.2 and §7.6

---

### 1.1 The Two-Constraint Model

Personalization depth in the Kalder program is governed by two independent constraints that must both be satisfied simultaneously.

**Constraint A — Role confidence:** The visitor's `confidence_tier` value (`HIGH` / `MEDIUM` / `LOW` / `UNKNOWN`) combined with `differential_insufficient` = `False`. Constraint A specifies whether the role classification is reliable enough to support personalization at a given depth.

**Constraint B — Coverage availability:** The `solution_category_coverage_status` for the visitor's active solution category must be sufficient to support the candidate fallback level. Constraint B specifies whether approved content exists in the offer catalog to deliver the experience that Constraint A's confidence tier would otherwise authorize.

These constraints are independent. Satisfying Constraint A does not satisfy Constraint B, and Constraint B cannot substitute for Constraint A. When Constraint A alone is satisfied — for example, a visitor classified at HIGH confidence — but Constraint B is not (for example, `solution_category_coverage_status: pending` for that visitor's active solution category), the system routes to the highest level permitted by both constraints simultaneously. The personalization system does not serve an unmatched high-confidence experience. It routes to the best available experience given both constraints at the moment of evaluation.

The fallback levels available at each confidence tier are:

- Level 1 requires: `confidence_tier` = `HIGH` AND sufficient coverage (partial or complete, with approved offers at the tuple level)
- Level 2 requires: `confidence_tier` = `MEDIUM` AND sufficient coverage (partial or complete, with approved offers at the tuple level)
- Level 3 requires: identified solution-category interest AND TAL membership, regardless of role confidence — and is the ceiling when coverage is pending or constructed
- Level 4 requires: TAL account identification, no solution-category interest signal sufficient for Level 3
- Level 5 is the default: no TAL identification or no Demandbase account resolution

Full experience behavior at each level — which modules render, how CTAs are constructed, and which content variants are selected — is specified in Section 3. Adobe Target activity configuration implementing these routing rules is specified in Section 4.

---

### 1.2 Priority 0: The `differential_insufficient` Override

Before evaluating any fallback level rule, the routing sequence must first evaluate the `differential_insufficient` flag in the visitor's AEP contact profile.

**When `differential_insufficient` = `True`: route to Level 3. Stop evaluation.**

Do not read `confidence_tier`. Do not apply any fallback level rule. The override is absolute and takes precedence over all other routing conditions, including HIGH confidence tier and coverage availability at higher levels.

The rationale: `differential_insufficient` = `True` indicates that the scoring engine capped the visitor's top role score at 49 because the top-scoring role did not lead the second-highest-scoring role by the minimum 10-point differential required by `§12 SCORING_RULES` [data model AR-03]. The role distinction that Levels 1 and 2 require cannot be made. Serving role-specific or role-influenced content to a visitor whose role is ambiguous between two close candidates is a data quality failure, not a personalization decision. Level 3 solution-interest content is the correct experience until the ambiguity is resolved — typically via a progressive disclosure prompt specified in Section 3 (`progressive_disclosure` module).

A contact carrying `differential_insufficient` = `True` may have a `fallback_level` value of 2 in their AEP profile from a prior anonymous ID session or a pre-override scoring run. The Target rule for this override supersedes the stored `fallback_level`: when `differential_insufficient` = `True`, serve Level 3 regardless of the `fallback_level` attribute value. The override takes precedence over the fallback level rule evaluation sequence specified in Section 1.5. [Document 3 §6.2 — `differential_insufficient` override; Document 2 §9.5(a)]

**AEP attribute read:** `differential_insufficient` — Boolean `True` / `False`. Read directly from the AEP contact profile at session start. This attribute is set by the `classify_visitor()` scoring engine in `§12 SCORING_RULES` and is pre-computed before session time; it does not require latency-sensitive derivation at session start.

---

### 1.3 The Five Fallback Level Activation Rules

The following compound conditions specify the complete activation requirements for each fallback level. Each condition is a complete and self-contained specification. A platform engineer reading only the condition for Level N — without reading any other level's condition — can correctly identify the full set of requirements for that level.

Logical operators are explicit throughout: AND denotes simultaneous satisfaction of all listed conditions; OR denotes satisfaction of at least one listed branch; NOT denotes exclusion of a value or state. Implied conditions and prose inference are not used.

---

**Level 1: Role-Specific Experience**

Level 1 activates when ALL of the following are true simultaneously:

- `differential_insufficient` = `False` (Priority 0 override is not active)
- AND `confidence_tier` = `HIGH` (role confidence score ≥ 80 after full scoring sequence, confirmed by Tier 1 ML classifier OR Tier 2 zero-party self-identification with behavioral confirmation per `§3 CONFIDENCE_TIERS` [data model §3])
- AND `solution_category_coverage_status` for the visitor's active `solution_category` is NOT `pending` AND NOT `constructed` (that is, coverage status is `partial` OR `complete`)
- AND the offer catalog contains approved `Content Module` nodes with `status: approved` and `phase: diverge` for the visitor's `(role_classification, solution_category, buying_stage)` tuple at the required Level 1 module types (per Document 4, Section 7.3)

All four conditions are required. The absence of any one condition causes the system to evaluate Level 2.

Note: at `partial` coverage, Level 1 is not available. `partial` status means solution-category-level modules are present but role-variant modules for Level 1 do not yet exist. A HIGH-confidence visitor in a `partial`-status category routes to Level 3 — not Level 2 — because role-influenced variants also do not exist under `partial` coverage. See Section 1.4 for the full `partial` coverage routing path.

---

**Level 2: Role-Influenced Experience**

Level 2 activates when ALL of the following are true simultaneously:

- `differential_insufficient` = `False` (Priority 0 override is not active)
- AND `confidence_tier` = `MEDIUM` (role confidence score 50–79 after the full scoring sequence, where Tier 3 behavioral inference alone — regardless of score magnitude — never reaches HIGH per `§3 CONFIDENCE_TIERS` [data model §3])
- AND `solution_category_coverage_status` for the visitor's active `solution_category` is NOT `pending` AND NOT `constructed` (that is, coverage status is `partial` OR `complete`)
- AND the offer catalog contains approved `Content Module` nodes with `status: approved` and `phase: diverge` for the visitor's `(role_classification, solution_category, buying_stage)` tuple at the required Level 2 module types (per Document 4, Section 7.3)
- AND `pending_solution_fallback` is NOT active for the visitor's active `solution_category` (see Section 1.4)

Note: at `partial` coverage, Level 2 is not available for the same reason Level 1 is not available. `partial` status provides solution-category infrastructure but not role-variant nodes. A MEDIUM-confidence visitor in a `partial`-status category routes to Level 3. See Section 1.4.

---

**Level 3: Solution-Interest Experience**

Level 3 activates when ANY of the following branches is true AND the common requirements below are satisfied:

Branch A: `differential_insufficient` = `False` AND `confidence_tier` = `LOW`

Branch B: `differential_insufficient` = `False` AND `confidence_tier` = `MEDIUM` AND `pending_solution_fallback` is active for the visitor's active `solution_category` (the MEDIUM confidence ceiling imposed by `pending_solution_fallback` prevents routing above Level 3 — see Section 1.4)

Branch C: `differential_insufficient` = `False` AND `confidence_tier` = `HIGH` AND `pending_solution_fallback` is active for the visitor's active `solution_category` (same ceiling applies regardless of HIGH confidence — coverage constraint governs)

Branch D: `differential_insufficient` = `True` (Priority 0 override — routes directly to Level 3 regardless of confidence tier or coverage status, per Section 1.2)

Common requirements for Branches A, B, and C (not required for Branch D, where the override is unconditional):

- AND the visitor has demonstrated solution-category interest signals sufficient to identify the active `solution_category` (behavioral signals linked to that category in the AEP scoring pipeline)
- AND `tal_member` = `True`

Note: `pending_solution_fallback` applies a MEDIUM confidence ceiling that is absolute. This ceiling cannot be exceeded by any behavioral score value, any Tier 1 ML classifier output, or any Tier 2 zero-party data. A HIGH-confidence visitor under `pending_solution_fallback` routes to Level 3, not to Level 1 or Level 2. This is not a system limitation; it is a content inventory constraint. No approved role-specific or role-influenced content exists for this category, so the experience must operate at the solution-category level. See Section 1.4 for the full specification of the `pending_solution_fallback` path.

---

**Level 4: Account-Level Experience**

Level 4 activates when ALL of the following are true simultaneously:

- `tal_member` = `True`
- AND the visitor's account has been identified as a TAL member via Demandbase reverse-IP match to a known TAL account domain OR via AEP account resolution against the CRM-confirmed account list (account-level identification; `contact_id` resolution is not required for Level 4)
- AND no solution-category interest signal is sufficient to qualify the visitor for Level 3 (no behavioral accumulation in any solution category reaches the threshold required for Level 3 routing under Section 1.5, Step 4)
- AND `differential_insufficient` = `False` (Branch D of Level 3 takes precedence when `differential_insufficient` = `True`, routing to Level 3 instead)

Level 4 is the account-level experience for TAL-identified visitors who cannot be served at Level 3 or above. Personalization at Level 4 uses industry vertical, company size, and account firmographic attributes, not role or solution-category signals. Level 4 does not require any role confidence; role signals are irrelevant at this level.

---

**Level 5: Default Brand Experience**

Level 5 activates when EITHER of the following is true:

- `tal_member` = `False` (the visitor's IP does not resolve to a known TAL account domain via Demandbase reverse-IP)
- OR no Demandbase account resolution exists (Demandbase returned no match for this session)

Level 5 is the standard kalder.com experience with no personalization. No contact-plane classification attributes are read at Level 5. This is the deterministic outcome for any visitor who cannot be identified as a TAL-associated account contact.

---

### 1.4 The `pending_solution_fallback` Path

`pending_solution_fallback` is a named routing path, not a parenthetical exception within individual level conditions. It activates when `solution_category_coverage_status` for the visitor's active `solution_category` is `pending` OR `constructed` as computed by the coverage tracking pipeline (Document 4, Section 8.5) and written to the `solution_category_coverage_status` AEP attribute.

**Activation condition:** `solution_category_coverage_status` = `pending` OR `solution_category_coverage_status` = `constructed` for the visitor's active `solution_category`.

**The MEDIUM confidence ceiling is absolute.** Under `pending_solution_fallback`, no visitor can receive Level 1 or Level 2 personalization for the affected solution category, regardless of their behavioral score, Tier 1 ML classifier output, or Tier 2 zero-party data. "MEDIUM ceiling regardless of behavioral score, Tier 1 ML classifier output, or Tier 2 zero-party data" is the operative rule. A HIGH-confidence visitor, a Tier 1 ML-confirmed contact, and a Tier 2 zero-party self-identified contact all route to Level 3 or below when `pending_solution_fallback` is active for their solution category. The ceiling does not soften for any data quality advantage; it is a content inventory constraint, not a classification quality constraint.

**Routing under `pending_solution_fallback`:**

- If `tal_member` = `True` AND solution-category interest signals are present: Level 3 (solution-interest experience for this solution category)
- If `tal_member` = `True` AND no solution-category interest signals: Level 4 (account-level experience)
- If `tal_member` = `False` OR no Demandbase resolution: Level 5 (default brand)

**`partial` coverage deactivates `pending_solution_fallback`.** When a solution category advances from `constructed` or `pending` to `partial`, the `pending_solution_fallback` path deactivates for that category automatically via the AEP attribute update. A `partial`-status category can serve Level 3. However, the ceiling at `partial` is Level 3 — not Level 2 or Level 1 — because role-specific and role-influenced variant nodes do not yet exist for a `partial` category. Level 2 and Level 1 become available only when the category advances to `complete` and the per-tuple offer catalog gate (D5-Flag-05) confirms that approved offers exist for the visitor's `(role_classification, solution_category, buying_stage)` tuple.

The distinction between `partial` and `pending`/`constructed` is a named routing difference, not an inferred one:

- `pending` or `constructed`: `pending_solution_fallback` active; ceiling is Level 3 (TAL with solution signal), Level 4 (TAL without solution signal), or Level 5 (non-TAL)
- `partial`: `pending_solution_fallback` deactivated; ceiling is Level 3 (role-variant nodes do not exist; MEDIUM and HIGH confidence visitors route to Level 3, not Level 2 or Level 1)
- `complete`: `pending_solution_fallback` deactivated; Levels 1–5 fully active subject to per-tuple offer catalog gate

**Coverage status propagation to Target.** The `solution_category_coverage_status` AEP attribute is updated by the Document 4 Section 8.5 coverage tracking pipeline, which is triggered by Sanity webhook on any `Content Module` node `status` field transition to or from `approved`. When a category advances from `pending` to `partial`, the routing change in Target occurs automatically via the AEP attribute update — no manual Target activity reconfiguration is required. The coverage status written to AEP is the operative routing input; Target reads it at session start. [Document 4, Section 8.5 — coverage tracking pipeline; Document 3, §6.2 — Target activation architecture]

Full specification of the `pending_solution_fallback` path, including its interaction with multi-session visitors and progressive disclosure behavior, is in Section 10.

---

### 1.5 v1 Launch Coverage State

The following table presents the coverage state for all five solution categories at v1 launch, derived from Document 4, Section 7.6. The "Maximum Level" column specifies the highest fallback level active for TAL-identified visitors with solution-category interest signals; Level 5 is available to all visitors and is not shown as a distinct maximum.

| Solution Category | v1 Coverage Status | Level 1 Active? | Level 2 Active? | Maximum Level (TAL + solution signal) | Notes |
|---|---|---|---|---|---|
| `customer_engagement` | `complete` | Yes | Yes | Level 1 | All five roles × all four buying stages provisioned. Levels 1–5 fully active. Level 1 and Level 2 Target activities are active at v1 for this category only. |
| `it_operations` | `partial` | No | No | Level 3 | `pending_solution_fallback` deactivated. Role-variant nodes do not yet exist; ceiling is Level 3 regardless of role confidence. HIGH and MEDIUM confidence visitors route to Level 3. |
| `employee_experience` | `pending` | No | No | Level 3 (TAL + solution signal) / Level 4 (TAL, no solution signal) | `pending_solution_fallback` active. MEDIUM ceiling applies. Level 4 is maximum for TAL-identified visitors without solution-category interest. |
| `risk_compliance` | `pending` | No | No | Level 3 (TAL + solution signal) / Level 4 (TAL, no solution signal) | `pending_solution_fallback` active. MEDIUM ceiling applies. Level 4 is maximum for TAL-identified visitors without solution-category interest. |
| `ai_platform` | `pending` | No | No | Level 3 (TAL + solution signal) / Level 4 (TAL, no solution signal) | `pending_solution_fallback` active. MEDIUM ceiling applies. Level 4 is maximum for TAL-identified visitors without solution-category interest. |

**Per-tuple note for `customer_engagement`:** `complete` status means all 20 `(role, buying_stage)` pairs are provisioned at the category level. Within that complete category, per-tuple offer catalog gaps — individual pairs missing specific module types — are handled by the per-tuple offer catalog gate (D5-Flag-05, Step 5 of Section 1.6), which demotes to the next level for any tuple lacking approved offers. D5-Flag-05 operates at the tuple granularity that the category-level `coverage_status` does not resolve.

**Target configuration implication:** Customer Engagement is the only category for which Level 1 and Level 2 Target activities are configured and active at v1 launch. For the remaining four categories, only Level 3, Level 4, and Level 5 Target activities require configuration at v1. Level 1 and Level 2 activities for `it_operations` will activate when that category advances from `partial` to `complete`; for `employee_experience`, `risk_compliance`, and `ai_platform`, Level 2 and Level 1 activities will not be configured until those categories advance past `partial` status.

---

### 1.6 Rule Evaluation Sequence

The following numbered sequence is the complete rule evaluation logic for the confidence tier activation gate. A platform engineer implementing this in Adobe Target and a marketing operations analyst tracing a specific visitor's routing outcome can both use this sequence as the authoritative reference. Steps are evaluated in order; each step that produces a routing outcome terminates evaluation.

**Step 1 — Read `differential_insufficient`.**
Read `differential_insufficient` from the visitor's AEP contact profile.
- If `True`: serve Level 3. Stop evaluation.
- If `False`: continue to Step 2.

**Step 2 — Read `solution_category_coverage_status` for the visitor's active `solution_category`.**
Read `solution_category_coverage_status` from the `CLIENT_ATTRIBUTE_MAP` AEP attribute for the visitor's active solution category.
- If `pending` or `constructed`: activate `pending_solution_fallback` path (Section 1.4). Apply MEDIUM confidence ceiling for all remaining steps. Continue to Step 3.
- If `partial` or `complete`: continue to Step 3 with no ceiling applied, but note that `partial` deactivates Level 2 and Level 1 regardless of confidence tier (role-variant nodes do not exist).

*Note for Target implementation:* `solution_category_coverage_status` is a pre-computed AEP attribute updated by the coverage tracking pipeline (Document 4, Section 8.5). It is available at session start without latency-sensitive derivation. Target reads it as a contact profile attribute, not a computed value.

**Step 3 — Read `confidence_tier`. Apply the appropriate level condition.**
Read `confidence_tier` from the visitor's AEP contact profile.
- If `HIGH` AND `pending_solution_fallback` is NOT active AND `solution_category_coverage_status` is `complete`: evaluate Level 1 condition. If satisfied, serve Level 1. Stop evaluation.
- If `HIGH` AND `pending_solution_fallback` is NOT active AND `solution_category_coverage_status` is `partial`: Level 1 and Level 2 are not available. Continue to Step 4.
- If `HIGH` AND `pending_solution_fallback` IS active: MEDIUM ceiling applies. Continue to Step 4.
- If `MEDIUM` AND `pending_solution_fallback` is NOT active AND `solution_category_coverage_status` is `complete`: evaluate Level 2 condition. If satisfied, serve Level 2. Stop evaluation.
- If `MEDIUM` AND `pending_solution_fallback` is NOT active AND `solution_category_coverage_status` is `partial`: Level 2 is not available. Continue to Step 4.
- If `MEDIUM` AND `pending_solution_fallback` IS active: MEDIUM ceiling enforced; route will not exceed Level 3. Continue to Step 4.
- If `LOW` or `UNKNOWN`: continue to Step 4.

**Step 4 — Evaluate Level 3 eligibility.**
- If `tal_member` = `True` AND solution-category interest signals are present for the visitor's active `solution_category`: serve Level 3. Stop evaluation.
- If `tal_member` = `True` AND no solution-category interest signals: serve Level 4. Stop evaluation.
- If `tal_member` = `False` OR no Demandbase account resolution: serve Level 5. Stop evaluation.

**Step 5 — Per-tuple offer catalog gate (D5-Flag-05).**
Before serving the candidate level determined in Steps 3 or 4, read the offer catalog for the visitor's `(role_classification, solution_category, buying_stage)` tuple at the candidate level.
- If approved `Content Module` nodes with `status: approved` and `phase: diverge` exist for the required module types at the candidate level: serve the candidate level.
- If no approved offers exist at the candidate level: demote to the next level (e.g., Level 1 → Level 2; Level 2 → Level 3). Repeat Step 5 at the new candidate level.
- Continue demoting until approved offers are found at a candidate level or Level 5 is reached.
- Level 5 always has offers (default brand experience); the cascade terminates no later than Level 5.

*Note for Target implementation:* Per-tuple offer catalog absence is handled by the offer catalog itself — a tuple with no approved offers has no offers for Target to serve, and Target's fallback evaluation handles the demotion. No AEP attribute for tuple-level coverage status is required; the offer catalog state is the operative gate. [Document 4, Section 8.5 — tuple-level monitoring vs. `CLIENT_ATTRIBUTE_MAP`]

*Note for Target implementation:* Target does not natively evaluate arbitrary compound conditions in a single pass; it evaluates audience memberships. The compound conditions in Sections 1.2 and 1.3 must be encoded as compound AEP audience definitions that pre-compute combined conditions (e.g., HIGH confidence AND coverage sufficient AND differential not insufficient) before session evaluation. Sections 1.2–1.4 specify the logic; Section 4 specifies how that logic maps to Target audience configurations, activity priorities, and rule evaluation order.

---

### 1.7 Edge State Coverage

The following classification states all have deterministic routing outcomes under the evaluation sequence in Section 1.6. No combination of input states produces an unspecified outcome.

| State | Routing Outcome |
|---|---|
| HIGH confidence + `solution_category_coverage_status: pending` | Level 3 (solution signal present, TAL) or Level 4 (TAL, no solution signal) or Level 5 — `pending_solution_fallback` active; MEDIUM ceiling enforced |
| HIGH confidence + `differential_insufficient` = `True` | Level 3 — Priority 0 override; confidence tier not evaluated |
| MEDIUM confidence + `solution_category_coverage_status: pending` | Level 3 (solution signal present, TAL) or Level 4 (TAL, no solution signal) or Level 5 — `pending_solution_fallback` active |
| MEDIUM confidence + `differential_insufficient` = `True` | Level 3 — Priority 0 override; confidence tier not evaluated |
| HIGH confidence + `solution_category_coverage_status: partial` | Level 3 — `partial` deactivates Level 1 and Level 2; role-variant nodes do not exist |
| MEDIUM confidence + `solution_category_coverage_status: partial` | Level 3 — same reason |
| LOW confidence + no solution-category interest signal | Level 4 (TAL-identified) or Level 5 (non-TAL) |
| UNKNOWN confidence + no TAL match | Level 5 |
| UNKNOWN confidence + TAL match + no solution signal | Level 4 |
| `visitor_consent_state: declined` | No behavioral signals collected or scored; account-level experience (Level 4) when TAL match exists; Level 5 when no TAL match. Full specification in Section 5 (Firmographic-First Path), Section 9 (Edge Cases and Suppression Rules), and Document 9 (Privacy and Consent Architecture). [N-4 — see note below] |

**Note on consent-declined routing (Garcia/Ga-1):** The firmographic bonus pathway that affects whether a firmographic-first visitor can reach MEDIUM confidence requires `visitor_consent_state: functional_only` or `full`, pending Track 2 legal review of the Demandbase DPA. Section 1 routing conditions do not imply that the firmographic bonus is unconditionally available. Under current Track 2 pending status, the firmographic bonus (`+30` from `firmographic_confirmation_bonus` in `§12 SCORING_RULES`) is suppressed for all visitors regardless of consent state; additionally, `visitor_consent_state: functional_only` suppresses all `explicit_consent_required` signals (including `demandbase_firmographic_match`) even after Track 2 completes. Both Track 2 completion AND `visitor_consent_state: full` are required for the firmographic bonus to activate. Full specification is in Section 5 (Firmographic-First Path) and Document 9 (Privacy and Consent Architecture). [Document 3, Section 4.2 — Layer 1 consent interaction; Document 2, Section 9.4 — Tier 2 Track 2 gate]

---

*End of Section 1. Section 3 specifies the experience behavior — which modules render and how content variants are selected — at each fallback level. Section 4 specifies how Target activities are configured to implement the routing sequence above. Section 5 specifies the firmographic-first path for visitors identified by Demandbase account match before behavioral signals accumulate. Section 8 specifies the Level 4 account-level experience compositionally. Section 10 specifies the `pending_solution_fallback` path in full. Section 11 specifies progressive disclosure for `differential_insufficient` visitors.*

---


## Section 2: Two-Axis vs. Three-Axis Content Selection

> **Depends on:** Document 2 (Signal Definition and Confidence Model), Sections 7.2–7.5 (KNOWN/INFERRED/UNKNOWN definitions, activation conditions, interaction matrix); Document 4 Section 1.2 (Axis Conditionality Principle), Section 5.3 (module type reference table); Document 5 Section 1 (confidence tier context); Document 5 Section 7, Section 7.7 (holdback and progressive disclosure); `kalder_data_model_s0_s1.py` §4 FALLBACK_CASCADE / PROBABLE_JOB_PRIORS

---

### 2.1 The Two-Axis Default

Two-axis personalization — `role_classification` × `buying_stage` — is the default content selection mode for every visitor. The buying job axis is a third dimension that is added when specific activation conditions are met. It is never the baseline.

Both attributes are read from the visitor's AEP contact profile at session start:

- `role_classification` — the visitor's classified buying group role (`champion`, `economic_buyer`, `influencer`, `user`, `ratifier`, or `default`)
- `buying_stage` — the `BG_STAGES` value from the account-plane profile (`targeted`, `engaged`, `prioritized`, `qualified`)

These two attributes together define the primary selection frame for every content module on every page, regardless of the visitor's buying job confidence state.

A visitor with UNKNOWN buying job confidence is not in a degraded personalization state. UNKNOWN is the normal operating state for most visitors during most of their evaluation journey. Progressive disclosure is a targeted enrichment mechanism for higher-confidence contacts, not a remediation for missing data. When buying job confidence is UNKNOWN, `PROBABLE_JOB_PRIORS` (Section 2.4) ensures that the visitor still receives role-appropriate, stage-appropriate content — the selection is deterministic and informed, not random or undifferentiated. The word "degraded" does not describe any state in this model.

---

### 2.2 Three-Axis Activation Conditions

Three-axis personalization adds the buying job dimension (`buying_job_confirmed` or `buying_job_inferred` from the visitor's AEP contact profile) to the selection frame: role × stage × buying job. The activation conditions are asymmetric between Level 1 (HIGH role confidence) and Level 2 (MEDIUM role confidence).

The complete interaction matrix, authoritative from Document 2, Section 7.5 [data model §4]:

| Role Confidence | Buying Job Confidence | Personalization Axes | Notes |
|---|---|---|---|
| HIGH | KNOWN | Three-axis: role × stage × `buying_job_confirmed` | Highest specificity — explicit job + strong role signal |
| HIGH | INFERRED | Three-axis: role × stage × `buying_job_inferred` | Strong role signal supports the second inference layer |
| HIGH | UNKNOWN | Two-axis + prior | `PROBABLE_JOB_PRIORS` governs variant selection |
| MEDIUM | KNOWN | Three-axis: role × stage × `buying_job_confirmed` | Zero-party declaration offsets MEDIUM role uncertainty |
| MEDIUM | INFERRED | Two-axis + prior | INFERRED excluded at MEDIUM — double-inference too speculative |
| MEDIUM | UNKNOWN | Two-axis + prior | Standard MEDIUM treatment |
| LOW / UNKNOWN role | Any | Levels 3–5 cascade | Role confidence insufficient; buying job axis not evaluated |

**The MEDIUM asymmetry rule:** At Level 2 (MEDIUM role confidence), INFERRED buying job does not activate three-axis personalization. INFERRED activates three-axis at Level 1 only. This asymmetry is by design, not omission, and is locked from Document 2, Section 7.2. The rationale: at MEDIUM role confidence, the role classification itself carries behavioral inference uncertainty. Adding an inferred buying job on top of uncertain role inference produces a content selection that is too speculative to serve confidently — a mismatch probability that is higher than the value of the additional specificity. Zero-party KNOWN buying job at MEDIUM is acceptable precisely because self-identification eliminates the inference layer, replacing probabilistic behavioral signal with a direct declaration that offsets the role confidence uncertainty. [Document 2, Section 7.2 — INFERRED activation condition; Section 7.5 — interaction matrix]

---

### 2.3 How Three-Axis Activation Interacts with Module `intended_axes`

**Named rule: Three-axis activation is per-module, not per-page.**

Three-axis activation is a system-level classification state, not a page-level instruction that overrides individual module behavior. When a visitor's buying job confidence state activates three-axis conditions, only the module slots whose `intended_axes` include `buying_job` use the buying job dimension for selection. Module slots without `buying_job` in their `intended_axes` use two-axis selection regardless of the system's three-axis state.

This is the Axis Conditionality Principle from Document 4, Section 1.2, applied at the decisioning layer: a module type varies only on its specified `intended_axes`. It does not "consider" axes it does not declare.

The practical consequence: a page where three-axis conditions are met will have some slots selecting on three axes and other slots selecting on two. This is the correct behavior and the intended design. It is not a partial personalization failure or an inconsistency to be resolved — it is axis conditionality functioning as designed. Section 3 cites this rule by name for per-module decisioning specifications.

**Module type axis participation (authoritative from Document 4, Section 5.3):**

Three-axis participants — `buying_job` in `intended_axes`:

| Module Type | `intended_axes` |
|---|---|
| `cta` | `[role, confidence_tier, buying_job]` |
| `gated_assets` | `[role, buying_job, bg_stage]` |
| `proof` | `[role, solution_category, buying_job]` |
| `use_cases` | `[role, solution_category, buying_job]` |

Two-axis only — `buying_job` not in `intended_axes`:

| Module Type | `intended_axes` |
|---|---|
| `hero` | `[role, solution_category, bg_stage]` |
| `benefits` | `[role, solution_category]` |
| `narrative` | `[role, solution_category, bg_stage]` |
| `problem_framing` | `[role, solution_category]` |
| `outcomes` | `[role, solution_category, bg_stage]` |
| `trust_signals` | `[role, solution_category]` |
| `progressive_disclosure` | `[confidence_tier, solution_category]` |

A page carrying both `cta` and `hero` for a HIGH + INFERRED visitor will present: a three-axis `cta` (role × stage × `buying_job_inferred`) and a two-axis `hero` (role × stage, from the `bg_stage` axis). Both selections are correct. Neither contradicts the other.

---

### 2.4 PROBABLE_JOB_PRIORS: Content Selection in UNKNOWN and INFERRED-at-MEDIUM States

When the buying job axis is not active — UNKNOWN buying job confidence at any role confidence level, or INFERRED at MEDIUM role confidence — the system uses `PROBABLE_JOB_PRIORS` to select the most appropriate content variant within the two-axis role × stage frame. [data model §4]

`PROBABLE_JOB_PRIORS` is a role × `buying_stage` lookup table that returns the most statistically probable buying job for a given `(role_classification, buying_stage)` combination. For module types with `buying_job` in their `intended_axes`, this prior value is used as a `jtbd_code` for offer catalog matching — it selects which buying-job-tagged content variant is served, using the prior as a proxy for the visitor's actual buying job. It is a content selection input, not a classification claim. The system does not assert that the visitor is in the returned buying job state.

**`PROBABLE_JOB_PRIORS` lookup table** (authoritative from Document 2, Section 7.4 and `kalder_data_model_s0_s1.py §4`):

| Role | Targeted | Engaged | Prioritized | Qualified |
|---|---|---|---|---|
| `champion` | `problem_identification` | `solution_exploration` | `requirements_building` | `supplier_selection` |
| `economic_buyer` | `problem_identification` | `solution_exploration` | `requirements_building` | `supplier_selection` |
| `influencer` | `solution_exploration` | `solution_exploration` | `requirements_building` | `requirements_building` |
| `user` | `solution_exploration` | `solution_exploration` | `requirements_building` | `requirements_building` |
| `ratifier` | None | None | `requirements_building` | `supplier_selection` |

**Three design notes (condensed from Document 2, Section 7.4):**

**Note 1 — Priors are content selection inputs, not classification claims.** A `PROBABLE_JOB_PRIORS` lookup returns the most likely content variant given incomplete information about the visitor's actual buying job. When KNOWN or INFERRED buying job data is available, those override the prior. The prior is the fallback; it does not persist as a classification claim in the visitor's AEP profile.

**Note 2 — `ratifier` None values at `targeted` and `engaged` are intentional.** Ratifiers do not participate in early-stage buying group activity. `PROBABLE_JOB_PRIORS` returning None for `ratifier` at these stages is a designed signal, not an error or a data gap. See Section 2.5 for the deterministic handling rule.

**Note 3 — `influencer` and `user` priors cap at `requirements_building` through the `qualified` stage.** Unlike `champion` and `economic_buyer`, which advance to `supplier_selection` at `qualified`, `influencer` and `user` remain at `requirements_building` even at the final vendor-selection stage. This reflects a buying group dynamics hypothesis: Influencers and Users are validating implementation fit and workflow requirements at the same stage where Champions and Economic Buyers are making the vendor decision. This hypothesis should be validated against observed content consumption patterns as data accumulates. [Document 2, Section 7.4 — Design note 3]

---

### 2.5 Ratifier Null-Prior Handling

`PROBABLE_JOB_PRIORS` returns `None` for `ratifier` at `targeted` and `engaged` stages. This requires explicit handling because module types with `buying_job` in their `intended_axes` must select a content variant, and `None` is not a valid `jtbd_code` for offer catalog matching. The null-prior handling rules in this section apply exclusively to the `ratifier` role at `targeted` and `engaged` buying stages — the only two cells in the `PROBABLE_JOB_PRIORS` table that return `None`. All other role × stage combinations return a non-null prior and do not invoke these rules.

**The rationale (Cu-1):** Ratifiers are governance and procurement stakeholders. They are not engaged in early-stage evaluation activity — they are enrolled by Champions at specific convergence points later in the buying cycle, typically at Risk & Compliance Validation and Final Commitment. A Ratifier who visits kalder.com at the `targeted` or `engaged` stage has not yet been engaged by the Champion, has not been asked to evaluate anything, and is most likely doing background research. Serving buying-job-specific Ratifier content — which addresses governance validation, compliance review, and procurement path — to a visitor who has not yet been activated in their Ratifier capacity implies evaluation urgency that does not reflect their actual involvement level. The `None` prior is the system's signal to serve appropriate stage content for a role that is not yet active in the buying process.

Do not surface a progressive disclosure prompt to resolve the null prior. Ratifiers at `targeted` and `engaged` stages are not executing a buying job at these stages; asking them to declare one would be premature and potentially confusing. The correct response to a null prior is the two-axis fallback specified below, not an escalation to zero-party collection.

**Deterministic fallback rules per module type (N-1):**

**`cta`:** Serve the MEDIUM-tier role-influenced `cta` variant (not the HIGH-tier role-assumptive variant). A role-assumptive CTA presupposes an active evaluation task; a role-influenced CTA acknowledges the visitor's role without presuming they are in an active buying job. The `confidence_tier_minimum: MEDIUM` offer is the correct selection. Do not attempt `jtbd_code` matching.

**`gated_assets`:** Serve ungated or solution-category-level assets — equivalent to the Level 3 `gated_assets` fallback behavior. Do not attempt `role × buying_job × bg_stage` selection. The absence of a buying job prior signals that role-specific, buying-job-targeted asset selection is not appropriate at this stage for this role. Generic brand-level or solution-category-level ungated content is the correct fallback.

**`proof`:** Serve the solution-category-level fallback — `role_classification` and `solution_category` matching only, no `jtbd_code`. Role-specific buying-job-matched proof points are not served. The `proof` node selection reduces to the Level 3 pattern: solution-category proof without role differentiation.

**`use_cases`:** Serve the solution-category-level fallback — same pattern as `proof`. `role_classification` and `solution_category` matching only, no `jtbd_code`. Solution-category use cases without buying-job specificity.

These four rules are deterministic. When `PROBABLE_JOB_PRIORS` returns `None`, the system does not attempt offer catalog matching on `jtbd_code` for any of the four three-axis modules. It falls back to the specified two-axis behavior per module type. There is no ambiguity state, no error path, and no escalation to progressive disclosure.

---

### 2.6 Buying Job Axis and the Holdback Group

Holdback visitors — contacts with `holdback_group = True` — receive the Level 5 default brand experience and are never served the `progressive_disclosure` module, which does not render at Level 5 per Document 4, Section 5.2 and Section 7, Section 7.7. The absence of progressive disclosure means holdback visitors never encounter a buying job prompt and therefore never produce `buying_job_confirmed` (KNOWN state).

**Named measurement asymmetry:** The holdback group's three-axis exposure is structurally limited compared to the personalization group in two ways:

- **KNOWN state is unavailable to holdback visitors.** Progressive disclosure never fires; `buying_job_confirmed` is never set. Holdback visitors at HIGH role confidence can reach three-axis only via the INFERRED path — if behavioral signals accumulate sufficient buying job inference strength within the 30-day decay window.
- **MEDIUM holdback visitors cannot reach three-axis at all.** KNOWN is excluded because progressive disclosure never fires. INFERRED is excluded at MEDIUM by the asymmetry rule in Section 2.2. MEDIUM holdback visitors are permanently in the two-axis + prior state.

The four module types affected by this asymmetry are the three-axis participants: `cta`, `gated_assets`, `proof`, and `use_cases`. For these slots, the personalization group can receive buying-job-specific content that the holdback group structurally cannot — even when both groups have comparable role and stage classifications.

This is a named measurement asymmetry in the holdback design, not a system failure. It must be accounted for in Document 7's lift measurement methodology when comparing offer performance on three-axis module types between holdback and treatment populations. An unadjusted comparison of `cta` click rates between holdback and treatment will understate treatment performance relative to the two-axis slots because the treatment group benefits from buying-job specificity that the holdback group cannot receive. [Cross-reference: Section 7, Section 7.7]

---

### 2.7 AEP Attribute Read Sequence for Buying Job Axis Evaluation

The following numbered sequence is the complete implementation recipe for buying job axis evaluation. A platform engineer reading only this section can implement the evaluation correctly without reference to any other part of Section 2.

**Step 1 — Evaluate role confidence.**
Read `confidence_tier` from the visitor's AEP contact profile.
- If `confidence_tier` = `LOW` or `UNKNOWN`: buying job axis is not evaluated for any module slot. Stop. Proceed to level-appropriate fallback (Level 3, 4, or 5 per Section 1).
- If `confidence_tier` = `HIGH` or `MEDIUM`: continue to Step 2.

**Step 2 — Check `buying_job_confirmed` (KNOWN state).**
Read `buying_job_confirmed` from the visitor's AEP contact profile.
- If `buying_job_confirmed` is not null AND the value was set within the last 90 days (not expired): buying job state = **KNOWN**. Three-axis activates for both HIGH and MEDIUM confidence. Use `buying_job_confirmed` as the `jtbd_code` for offer matching in modules with `buying_job` in their `intended_axes`. Stop — do not proceed to Step 3.
- If `buying_job_confirmed` is null OR expired (set more than 90 days ago): continue to Step 3.

**Step 3 — Check `buying_job_inferred` (INFERRED state) — HIGH confidence only.**
- If `confidence_tier` = `MEDIUM`: do **not** read `buying_job_inferred`. Route directly to Step 4. INFERRED does not activate three-axis at MEDIUM; reading the attribute and discarding it would risk implementation drift where a future code change conditionally applies it. The attribute must not be read for MEDIUM visitors at this step.
- If `confidence_tier` = `HIGH`: read `buying_job_inferred` from the visitor's AEP contact profile.
  - If `buying_job_inferred` is not null AND the value was set within the last 30 days (not expired): buying job state = **INFERRED**. Three-axis activates at Level 1 only. Use `buying_job_inferred` as the `jtbd_code` for offer matching in modules with `buying_job` in their `intended_axes`. Stop — do not proceed to Step 4.
  - If `buying_job_inferred` is null OR expired (set more than 30 days ago): continue to Step 4.

**Step 4 — Apply PROBABLE_JOB_PRIORS (UNKNOWN state or INFERRED-at-MEDIUM).**
Buying job state = **UNKNOWN**. Two-axis + prior applies.
Look up `(role_classification, buying_stage)` in `PROBABLE_JOB_PRIORS` [data model §4].
- If the lookup returns a non-null value: use the returned value as the `jtbd_code` for offer matching in modules with `buying_job` in their `intended_axes`. Proceed to Step 5.
- If the lookup returns `None` (ratifier at `targeted` or `engaged`): apply the null-prior fallback rules per Section 2.5 for each affected module type. Proceed to Step 5.

**Step 5 — Apply axis conditionality per module slot.**
For each module slot on the current page: check whether `buying_job` is in the module type's `intended_axes` (per the reference tables in Section 2.3).
- If `buying_job` is **not** in `intended_axes`: ignore the buying job state entirely. Apply two-axis selection (`role_classification` × `buying_stage`) for this slot regardless of the outcome of Steps 1–4.
- If `buying_job` **is** in `intended_axes`: apply the `jtbd_code` from the applicable step above (Step 2 KNOWN, Step 3 INFERRED, Step 4 prior, or Step 4 null-prior fallback) for this slot's offer matching.

**Attribute expiry check (N-2):** Steps 2 and 3 both require an expiry check on the AEP attribute value. An attribute that is present in the AEP profile but set outside its decay window must be treated as null — not as a valid state. The expiry windows are:
- `buying_job_confirmed`: 90 days from date of self-identification [Document 2, Section 7.2]
- `buying_job_inferred`: 30 days from most recent inference [Document 2, Section 7.2]

An implementation that reads the attribute value without checking its timestamp will produce stale three-axis activation — a visitor whose `buying_job_confirmed` was set 95 days ago would incorrectly receive KNOWN-state three-axis personalization. The timestamp check is a required part of each attribute read, not an optional validation.

---

*End of Section 2. Section 3 specifies per-module offer selection logic and cites the "Three-axis activation is per-module, not per-page" rule from Section 2.3 as its authority for axis-conditional content selection. Section 2.4's PROBABLE_JOB_PRIORS table is the authoritative reference for prior-based offer matching. Section 2.5 null-prior rules apply exclusively to the four three-axis module types at ratifier × targeted/engaged combinations.*

---


## Section 3: Module-Level Decisioning Rules

> **Depends on:** Document 4 Section 5.2 (per-module type specifications), Section 5.3 (module type reference table); Document 5 Section 1 (fallback level routing); Document 5 Section 2 (buying job axis activation); Document 5 Section 4.5 (cta dual offer set configuration), Section 4.7 (named conflict scenario resolutions)

---

### 3.0 Overview: The Two-Layer Offer Matching Model

Section 3 specifies Layer 2 of the offer matching model. Layer 1 is specified in Section 4.

**Layer 1 — Activity audience gate (Section 4):** Determines which visitors enter a Target activity. The activity audience gate evaluates cohort membership, `confidence_tier`, `differential_insufficient` state, and `holdback_group` status. A visitor who does not satisfy the activity's audience conditions is not served by that activity; Target evaluates the next lower-priority activity. Layer 1 is entirely specified in Section 4. Section 3 does not repeat it.

**Layer 2 — Per-offer attribute matching (this section):** Within an activity that a visitor has entered, determines which specific offer in the catalog they receive. Offer matching reads `role_classification`, `solution_category`, `buying_stage`, and — when three-axis conditions are active — `jtbd_code` from the visitor's AEP contact profile, and matches those values against offer attributes written to the catalog at Sanity-to-Target sync time. Section 3 specifies this matching for each of the eleven module types.

The two layers are complementary and non-overlapping. Section 3 specifications reference offer attributes only. They do not re-specify cohort conditions or confidence tier audience gates — those belong to Layer 1.

**The `confidence_tier_minimum` offer gate:** Within an activity that a visitor has entered, individual offers carry a `confidence_tier_minimum` field that may further restrict which offers within the activity the visitor is eligible to receive. This is an offer-level constraint, not an activity-level constraint. A visitor admitted by the activity's audience gate may still be ineligible for specific offers within that activity if their `confidence_tier` does not meet the offer's `confidence_tier_minimum`. The visitor receives the offer whose `confidence_tier_minimum` they meet or exceed.

**"Three-axis activation is per-module, not per-page" (Section 2.3):** This named rule from Section 2.3 governs all eleven module specifications below. Each module is evaluated against its own `intended_axes`. A system-level three-axis state does not activate the buying job dimension for modules whose `intended_axes` does not include `buying_job`. For those modules, two-axis selection applies regardless of the visitor's buying job confidence state.

---

### 3.1 `hero`

**Active levels:** 1–4 active. Level 5: brand default hero offer (slot renders; not personalized).

**Selection logic:**

Levels 1–2: Read `role_classification`, `solution_category`, `buying_stage` from visitor AEP profile. Match against offers with `module_type = hero`, `role = [role_classification]`, `solution_category = [solution_category]`, `buying_stage = [buying_stage]`, `confidence_tier_minimum` met by visitor's `confidence_tier`. The `buying_job` axis does not apply — `hero`'s `intended_axes` are `[role, solution_category, bg_stage]`. Per the Section 2.3 named rule: two-axis + stage selection regardless of system three-axis state.

Level 3: Match on `solution_category` only. `role = default` (or equivalent solution-category-level tag). `buying_stage` not matched. Offer attributes: `module_type = hero`, `solution_category = [solution_category]`.

Level 4: Match on account firmographic attributes (`industry_vertical`, `company_size_segment`) if industry-level hero offers exist in the catalog; otherwise serve Level 5 brand default offer. No role or solution-category attribute matching.

Level 5: Serve brand default hero offer. No attribute matching — offer is the global default.

**Level-by-level behavior:**

- Level 1 (HIGH): Role- and stage-specific hero variant for the visitor's `role_classification` and `buying_stage`. Full above-the-fold orientation for the classified role.
- Level 2 (MEDIUM): Same role- and stage-specific variant as Level 1. `hero` does not distinguish between HIGH and MEDIUM confidence; both are admitted to the same offer pool at `confidence_tier_minimum: MEDIUM`.
- Level 3: Solution-category hero variant. No role differentiation. General value proposition for the solution area.
- Level 4: Industry or firmographic hero variant if available in catalog; otherwise brand default.
- Level 5: Brand default hero. No personalization signal applied.

**`confidence_tier_minimum` gate:** MEDIUM. Offers tagged MEDIUM are served to Level 1 and Level 2 visitors. No HIGH-tagged `hero` offers exist — the `hero` module does not distinguish within the role × stage frame by confidence tier. Level 1 and Level 2 share the same offer pool.

**Named conflict scenario:** `hero_vs_gated_assets_stage_mismatch`. When this conflict fires, the `hero` slot demotes from `bg_stage`-axis activity (Target priority 2x01) to `solution_category`-axis activity (Target priority 5x01). The `hero` slot receives a solution-category-level offer rather than a role × stage offer. Resolution is automatic via the Target priority convention — no Target reconfiguration is required. [Document 5 Section 4.7; Document 4 Section 5.4.2]

**Cross-references:** Section 2.3 (per-module two-axis only for `hero`). Section 4.7 (`hero_vs_gated_assets_stage_mismatch` resolution implementation in Target).

---

### 3.2 `benefits`

**Active levels:** 1–4 active. Level 5: generic solution-agnostic value proposition (brand default offer; slot renders).

**Selection logic:**

Levels 1–2: Read `role_classification`, `solution_category` from visitor AEP profile. Match against offers with `module_type = benefits`, `role = [role_classification]`, `solution_category = [solution_category]`. `buying_stage` is not a match attribute — `benefits`'s `intended_axes` are `[role, solution_category]` only; the module does not vary by stage. `buying_job` axis does not apply. Per Section 2.3: two-axis selection regardless of system three-axis state.

Level 3: Match on `solution_category` only. `role = default`.

Level 4: Solution-category default (same offer as Level 3). `benefits` renders at Level 4 with solution-category framing; no role attribute matching.

Level 5: Brand default `benefits` offer. No attribute matching.

**Level-by-level behavior:**

- Level 1 (HIGH): Full role-specific benefits for the visitor's classified role within the solution category.
- Level 2 (MEDIUM): Same role-specific benefits as Level 1 — `benefits` does not distinguish between HIGH and MEDIUM. Level 1 and Level 2 share the same offer pool.
- Level 3: Solution-category benefits variant. No role differentiation.
- Level 4: Solution-category default (same as Level 3).
- Level 5: Generic solution-agnostic value proposition.

**`confidence_tier_minimum` gate:** MEDIUM. Both Level 1 and Level 2 visitors receive the same role-specific offer pool. No HIGH-specific `benefits` offers.

**Named conflict scenario:** `cta_vs_benefits_buying_job_mismatch`. When this conflict fires, the `benefits` slot is unaffected — it serves its role-default content regardless of the `cta` module's buying_job-axis selection. The conflict is not a failure; it is the documented content gap where late-stage CTA language may not be reinforced by the `benefits` copy. No `benefits` offer substitution occurs. [Document 5 Section 4.7; Document 4 Section 5.4.2]

**Cross-references:** Section 2.3 (two-axis only; `buying_job` omitted by design from `benefits`'s `intended_axes`). D5-Flag-04: if a late-stage `buying_stage: qualified` benefits offer set is ever commissioned, the `benefits` module's `intended_axes` would need to be extended to include `bg_stage`, which requires a Document 4 amendment. Section 3 does not make that amendment. This is a forward dependency, not a current specification gap.

---

### 3.3 `cta`

**Active levels:** 1–4 active. Level 5: generic brand CTA (brand default offer; slot renders).

**Selection logic:**

Level 1 (HIGH, role-assumptive offer set): Read `role_classification`, `confidence_tier` (= HIGH), `jtbd_code` per Section 2 activation rules. Match against offers with `module_type = cta`, `role = [role_classification]`, `confidence_tier_minimum = HIGH`, `jtbd_code = [buying_job value]`. `jtbd_code` sourced from: `buying_job_confirmed` (KNOWN), `buying_job_inferred` (INFERRED, HIGH only), or `PROBABLE_JOB_PRIORS(role_classification, buying_stage)` (UNKNOWN). Served by Target activity 3x03. Ratifier null-prior at `targeted`/`engaged`: serve MEDIUM-tier `cta` offer per Section 2.5 — no `jtbd_code` matching.

Level 2 (MEDIUM, role-influenced offer set): Read `role_classification`, `confidence_tier` (= MEDIUM), `jtbd_code` per Section 2 activation rules. INFERRED buying job is excluded at MEDIUM per Section 2.2. `jtbd_code` sourced from: `buying_job_confirmed` (KNOWN at MEDIUM) or `PROBABLE_JOB_PRIORS(role_classification, buying_stage)` (UNKNOWN or INFERRED-at-MEDIUM). Match against offers with `module_type = cta`, `role = [role_classification]`, `confidence_tier_minimum = MEDIUM`, `jtbd_code = [buying_job value]`. Served by Target activity 3x13.

Level 3: Match on `solution_category` only. Generic exploratory CTA — "Learn more" or "Explore [Solution Category]." Offer attributes: `module_type = cta`, `solution_category = [solution_category]`, `confidence_tier_minimum = UNKNOWN` or `LOW`.

Level 4: Brand-level awareness CTA. No solution or role attribute matching. Brand default offer.

Level 5: Generic brand CTA. No attribute matching. Brand default offer.

**Level-by-level behavior:**

- Level 1 (HIGH): Full three-axis CTA — role × `confidence_tier` × `buying_job`. Direct, assumptive language. Drawn from HIGH offer set (activity 3x03).
- Level 2 (MEDIUM): Role × `confidence_tier` CTA with `buying_job` if KNOWN; `PROBABLE_JOB_PRIORS` if UNKNOWN or INFERRED-at-MEDIUM. Softer, role-influenced language. Drawn from MEDIUM offer set (activity 3x13).
- Level 3: Solution-category default CTA. Exploratory tone. No role or buying_job specificity.
- Level 4: Brand awareness CTA.
- Level 5: Generic brand CTA.

**`confidence_tier_minimum` gate — dual offer sets (D5-Flag-02):** `cta` has two structurally separated offer populations:

- **HIGH offer set:** `confidence_tier_minimum = HIGH`. Served by Target activity 3x03. Activity audience condition: `confidence_tier = HIGH AND differential_insufficient = False`. A MEDIUM visitor cannot receive a HIGH offer — the activity's audience condition structurally excludes them before offer matching occurs. This is a structural guarantee, not an offer-level filter within a shared activity. [Section 4.5]
- **MEDIUM offer set:** `confidence_tier_minimum = MEDIUM`. Served by Target activity 3x13. Activity audience condition: `confidence_tier = MEDIUM AND differential_insufficient = False`.

**Named conflict scenario:** `cta_vs_benefits_buying_job_mismatch`. The `cta` module's `buying_job`-axis selection wins. Activity 3x03 (HIGH) or 3x13 (MEDIUM) fires before the `benefits` `role`-axis activity (4x02) or `solution_category`-axis activity (5x02) for the same page. The `benefits` slot serves role-default content regardless. [Document 5 Section 4.7]

**Cross-references:** Section 2.2 (INFERRED excluded at MEDIUM); Section 2.4 (`PROBABLE_JOB_PRIORS` for UNKNOWN and INFERRED-at-MEDIUM); Section 2.5 (ratifier null-prior: serve MEDIUM-tier `cta` offer, no `jtbd_code` matching); Section 4.5 (dual offer set Target activity configuration and structural separation guarantee).

---

### 3.4 `gated_assets`

**Active levels:** 1–3 active. Level 4: generic brand-level or industry-relevant ungated content (slot renders; no solution-specific targeting). Level 5: not rendered.

**Selection logic:**

Level 1 (three-axis, KNOWN or INFERRED): Read `role_classification`, `buying_stage`, `jtbd_code` per Section 2 activation rules. Match against offers with `module_type = gated_assets`, `role = [role_classification]`, `buying_stage = [buying_stage]`, `jtbd_code = [buying_job value]`. Individual Asset node `confidence_tier_minimum` values govern which specific assets within the slot are eligible for this visitor's `confidence_tier` — the module slot activates at MEDIUM, but individual assets within it may require HIGH.

Level 1 (two-axis + prior, UNKNOWN): Read `role_classification`, `buying_stage`. Apply `PROBABLE_JOB_PRIORS(role_classification, buying_stage)` for `jtbd_code`. Match on same offer attributes as three-axis. Ratifier null-prior at `targeted`/`engaged`: serve Level 3 fallback per Section 2.5 — `solution_category`-level ungated assets, no `role` or `jtbd_code` matching.

Level 2 (KNOWN — three-axis): Same as Level 1 three-axis. Full three-axis selection when `buying_job_confirmed` is present. Individual asset `confidence_tier_minimum` values still apply.

Level 2 (INFERRED or UNKNOWN — two-axis + prior; INFERRED excluded at Level 2 per Section 2.2): Read `role_classification`, `buying_stage`. Apply `PROBABLE_JOB_PRIORS` for `jtbd_code`. Individual asset `confidence_tier_minimum` values govern asset access — assets tagged `confidence_tier_minimum = HIGH` are not served to MEDIUM visitors.

Level 3: Match on `solution_category` only. Ungated assets only (`gating = ungated`). `role = default`, `jtbd_code` not matched.

Level 4: Generic brand-level or industry-relevant ungated content. No `solution_category` targeting. Account-level firmographic context only.

Level 5: Slot not rendered.

**Level-by-level behavior:**

- Level 1 (HIGH + three-axis): Full role × `buying_job` × stage asset selection. All gating levels eligible subject to individual asset `confidence_tier_minimum` values.
- Level 2 (MEDIUM + KNOWN): Full three-axis, same selection logic as Level 1. Individual asset gating still applies.
- Level 2 (MEDIUM + INFERRED or UNKNOWN; INFERRED excluded at Level 2 per Section 2.2): Role × stage with `PROBABLE_JOB_PRIORS`. Assets tagged `confidence_tier_minimum = HIGH` are not served (gated_registration suppressed for MEDIUM visitors).
- Level 3: Solution-category ungated assets only. No role or buying_job differentiation.
- Level 4: Generic brand-level or industry-relevant ungated content. No solution context.
- Level 5: Slot not rendered.

**`confidence_tier_minimum` gate:** MEDIUM at the module slot level — the slot activates at Level 2 and above. Within the slot, individual Asset nodes carry their own `confidence_tier_minimum` values that independently gate specific asset access. A MEDIUM visitor may see the slot but not all assets within it if individual assets are tagged `confidence_tier_minimum = HIGH`.

**Named conflict scenario:** `hero_vs_gated_assets_stage_mismatch`. The `gated_assets` `buying_job`-axis selection wins. The `gated_assets` slot retains its `buying_job`-matched offer (served by `buying_job`-axis activity 1x04). The `hero` slot demotes to `solution_category`-level variation. [Document 5 Section 4.7; Document 4 Section 5.4.2]

**Cross-references:** Section 2.4 (`PROBABLE_JOB_PRIORS` for UNKNOWN and INFERRED-at-MEDIUM); Section 2.5 (ratifier null-prior: Level 3 fallback — `solution_category`-level ungated assets, no `role` or `jtbd_code` matching); Section 4.7 (`hero_vs_gated_assets_stage_mismatch` resolution).

---

### 3.5 `proof`

**Active levels:** 1–3 active. Level 4–5: not rendered.

**Selection logic:**

Levels 1–2: Read `role_classification`, `solution_category`, `jtbd_code` per Section 2 activation rules. Match against offers with `module_type = proof`, `role = [role_classification]`, `solution_category = [solution_category]`, `jtbd_code = [buying_job value]`. `PROBABLE_JOB_PRIORS(role_classification, buying_stage)` governs `jtbd_code` when buying job state is UNKNOWN (or INFERRED at MEDIUM). Ratifier null-prior at `targeted`/`engaged`: serve Level 3 fallback per Section 2.5 — `solution_category`-level proof, no `role` or `jtbd_code` matching.

Level 3: Match on `solution_category` only. `role = default`, `jtbd_code` not matched.

Levels 4–5: Slot not rendered.

**Level-by-level behavior:**

- Level 1 (HIGH): Role- and `buying_job`-matched proof points. Champion at `problem_identification` receives peer validation of problem severity; Economic Buyer at `supplier_selection` receives quantified ROI proof.
- Level 2 (MEDIUM): Same role- and `buying_job`-matched selection as Level 1. `proof`'s `confidence_tier_minimum: MEDIUM` means Level 1 and Level 2 share the same offer pool. `PROBABLE_JOB_PRIORS` governs when INFERRED-at-MEDIUM or UNKNOWN.
- Level 3: Solution-category proof points without role or buying_job differentiation.
- Level 4: Not rendered.
- Level 5: Not rendered.

**`confidence_tier_minimum` gate:** MEDIUM. Level 1 and Level 2 share the same offer pool. No HIGH-tagged `proof` offers — social proof renders at all active confidence levels equally.

**Named conflict scenario:** None. General `highest_specificity_wins` policy applies.

**Cross-references:** Section 2.4 (`PROBABLE_JOB_PRIORS`); Section 2.5 (ratifier null-prior: Level 3 fallback — `solution_category`-level proof, no `role` or `jtbd_code` matching).

---

### 3.6 `narrative`

**Active levels:** 1–4 active. Level 5: brand default offer (slot renders; not "not rendered").

**Selection logic:**

Levels 1–2: Read `role_classification`, `solution_category`, `buying_stage` from visitor AEP profile. Match against offers with `module_type = narrative`, `role = [role_classification]`, `solution_category = [solution_category]`, `buying_stage = [buying_stage]`. `buying_job` axis does not apply — `narrative`'s `intended_axes` are `[role, solution_category, bg_stage]`. Per Section 2.3: two-axis + stage selection regardless of system three-axis state.

Level 3: Match on `solution_category` only. `role = default`.

Level 4: Generic brand value proposition offer (`role = default`, `solution_category` not matched) or solution-category narrative if Level 4 offers exist in the catalog for this solution category. Serve brand default if no solution-category Level 4 offer is available.

Level 5: Brand default `narrative` offer. No attribute matching.

**Level-by-level behavior:**

- Level 1 and 2: Role- and stage-specific narrative variant expressing the through-line's `solution_claim` and `message_pillar` in role-appropriate language for the visitor's `buying_stage`. The offer selected at Levels 1–2 inherits its factual backbone from the `Narrative` node referenced via `narrative_ref` in Sanity — the through-line is Sanity-enforced structural coherence, not Target-enforced; the narrative slot must be understood as carrying the program's core solution claim, not as an interchangeable role-variant content block. [Document 4 Section 4 — through-line requirement]
- Level 3: Solution-category narrative. No role differentiation.
- Level 4: Generic brand value proposition or solution-category narrative if available in catalog.
- Level 5: Brand default.

**`confidence_tier_minimum` gate:** MEDIUM. Level 1 and Level 2 share the same offer pool. No HIGH-tagged `narrative` offers.

**Named conflict scenario:** No independently named scenario. When `gated_assets` and `narrative` co-occur on the same page, the `gated_assets` `buying_job`-axis selection may conflict with the `narrative` `bg_stage`-axis selection in the same manner as `hero_vs_gated_assets_stage_mismatch`. Resolution is identical: `gated_assets buying_job` overrides; `narrative` demotes to `solution_category`-level variation. This resolution is automatic via the Target priority convention — `buying_job`-axis activity 1x06 fires before `bg_stage`-axis activity 2x06. [Document 4 Section 5.3 — `narrative` composition note]

**Cross-references:** Section 2.3 (two-axis only for `narrative`). Section 4 priority convention for the `gated_assets`-vs-`narrative` mismatch resolution.

---

### 3.7 `problem_framing`

**Active levels:** 1–3 active. Level 4: not rendered unless an industry-level offer exists in the catalog, in which case the industry-level offer is served; absent such an offer, the slot does not render. Level 5: not rendered.

**Selection logic:**

Levels 1–2: Read `role_classification`, `solution_category` from visitor AEP profile. Match against offers with `module_type = problem_framing`, `role = [role_classification]`, `solution_category = [solution_category]`. `buying_stage` is not a match attribute — `problem_framing`'s `intended_axes` are `[role, solution_category]` only. `buying_job` axis does not apply.

Level 3: Match on `solution_category` only. `role = default`.

Levels 4–5: Not rendered (see active levels note above for Level 4 exception).

**Level-by-level behavior:**

- Level 1 and 2: Role-specific problem framing — the problem described in the visitor's role's language and frame of reference. Level 1 and Level 2 share the same offer pool.
- Level 3: Solution-category problem statement without role differentiation.
- Level 4: Not rendered, or industry-level problem description if such an offer exists in the catalog.
- Level 5: Not rendered.

**`confidence_tier_minimum` gate:** MEDIUM. Level 1 and Level 2 share the same offer pool. No HIGH-tagged `problem_framing` offers.

**Named conflict scenario:** None.

**Cross-references:** Section 2.3 (two-axis only; `buying_job` omitted because `problem_framing` is pre-buying-job content by design — framing the problem precedes the task-specific JTBD layer).

---

### 3.8 `outcomes`

**Active levels:** 1–3 active. Level 4–5: not rendered.

**Selection logic:**

Levels 1–2: Read `role_classification`, `solution_category`, `buying_stage` from visitor AEP profile. Match against offers with `module_type = outcomes`, `role = [role_classification]`, `solution_category = [solution_category]`, `buying_stage = [buying_stage]`. `buying_job` axis does not apply — `outcomes`'s `intended_axes` are `[role, solution_category, bg_stage]`.

Level 3: Match on `solution_category` only. `role = default`, `buying_stage` not matched.

Levels 4–5: Slot not rendered.

**Level-by-level behavior:**

- Level 1 and 2: Role- and stage-specific outcome statements matched to the visitor's role success criteria. Level 1 and Level 2 share the same offer pool.
- Level 3: Solution-category outcomes without role or stage differentiation.
- Level 4: Not rendered.
- Level 5: Not rendered.

**`confidence_tier_minimum` gate:** MEDIUM. Level 1 and Level 2 share the same offer pool. No HIGH-tagged `outcomes` offers.

**Named conflict scenario:** None.

**Cross-references:** Section 2.3 (two-axis + stage; `buying_job` omitted — stage governs outcome emphasis better than buying job for this module type).

---

### 3.9 `use_cases`

**Active levels:** 1–3 active. Level 4–5: not rendered.

**Selection logic:**

Levels 1–2: Read `role_classification`, `solution_category`, `jtbd_code` per Section 2 activation rules. Match against offers with `module_type = use_cases`, `role = [role_classification]`, `solution_category = [solution_category]`, `jtbd_code = [buying_job value]`. `PROBABLE_JOB_PRIORS(role_classification, buying_stage)` governs `jtbd_code` when buying job state is UNKNOWN (or INFERRED at MEDIUM). Ratifier null-prior at `targeted`/`engaged`: serve Level 3 fallback per Section 2.5 — `solution_category`-level use cases, no `role` or `jtbd_code` matching.

Level 3: Match on `solution_category` only. `role = default`, `jtbd_code` not matched.

Levels 4–5: Slot not rendered.

**Level-by-level behavior:**

- Level 1 and 2: Role- and `buying_job`-matched use case content. Level 1 and Level 2 share the same offer pool (`confidence_tier_minimum: MEDIUM`). `PROBABLE_JOB_PRIORS` governs when INFERRED-at-MEDIUM or UNKNOWN.
- Level 3: Solution-category use cases without role or buying_job differentiation.
- Level 4: Not rendered.
- Level 5: Not rendered.

**`confidence_tier_minimum` gate:** MEDIUM. Level 1 and Level 2 share the same offer pool. No HIGH-tagged `use_cases` offers.

**Named conflict scenario:** None. General `highest_specificity_wins` policy applies.

**Cross-references:** Section 2.4 (`PROBABLE_JOB_PRIORS`); Section 2.5 (ratifier null-prior: Level 3 fallback — `solution_category`-level use cases, no `role` or `jtbd_code` matching).

---

### 3.10 `trust_signals`

**Active levels:** 1–3 active. Level 4: brand-level trust signals (general security and compliance overview; slot renders with brand default offer). Level 5: not rendered. Level 4 and Level 5 are distinct — Level 4 renders with brand-level content; Level 5 does not render.

**Selection logic:**

Levels 1–2: Read `role_classification`, `solution_category` from visitor AEP profile. Match against offers with `module_type = trust_signals`, `role = [role_classification]`, `solution_category = [solution_category]`. `buying_job` and `buying_stage` axes do not apply — `trust_signals`'s `intended_axes` are `[role, solution_category]` only.

Level 3: Match on `solution_category` only. `role = default`.

Level 4: Brand-level trust signals. No attribute matching — brand default offer.

Level 5: Not rendered.

**Level-by-level behavior:**

- Level 1 and 2: Role-specific trust signals — security and compliance documentation for Ratifiers; integration partnership signals for Influencers; financial stability and customer retention signals for Economic Buyers; implementation governance documentation for Users; vendor validation for Champions. Level 1 and Level 2 share the same offer pool.
- Level 3: Solution-category trust signals without role differentiation.
- Level 4: Brand-level general security and compliance overview. Slot renders; content is non-personalized.
- Level 5: Slot not rendered.

**`confidence_tier_minimum` gate:** MEDIUM. Level 1 and Level 2 share the same offer pool. No HIGH-tagged `trust_signals` offers — trust and compliance signals are role-specific but not confidence-tier-stratified.

**Named conflict scenario:** None.

**Cross-references:** Section 2.3 (two-axis only; `trust_signals` varies on role but not buying job — role determines which governance and compliance signals are relevant, not the visitor's current task).

---

### 3.11 `progressive_disclosure`

**Active levels:** 2–4 active. Level 1: actively suppressed (not an absence of content — see below). Level 5: not rendered.

**Selection logic:**

Level 2 (MEDIUM): Read `confidence_tier` (= MEDIUM), `solution_category` from visitor AEP profile. Match against offers with `module_type = progressive_disclosure`, `confidence_tier = MEDIUM`, `solution_category = [solution_category]`. Prompt type: role confirmation — presents the visitor's inferred role for confirmation or correction. Offer selected is the MEDIUM-tier progressive disclosure prompt for this solution category.

Level 3: Read `confidence_tier` (= LOW or UNKNOWN), `solution_category`. Match against offers with `module_type = progressive_disclosure`, `confidence_tier = LOW` (or `UNKNOWN`), `solution_category = [solution_category]`. Prompt type: initial role identification — no role assumption; invites the visitor to self-identify. Offer selected is the LOW/UNKNOWN-tier prompt for this solution category.

Level 4: Read `solution_category` if solution-category interest has been established for this visitor (even if sub-threshold for Level 3 routing); otherwise read account firmographic attributes. Priority: `solution_category` matching takes precedence when a solution-category signal exists. Account firmographic context is the fallback for visitors with no solution signal at all. Match against offers with `module_type = progressive_disclosure`, `fallback_level = 4`, `solution_category = [solution_category]` or account-type context. Prompt type: TAL-context invitation — invites the visitor to identify their evaluation context without solution-specific framing. The Level 4 `progressive_disclosure` prompt is the primary mechanism by which a TAL-identified, unclassified visitor begins the classification journey. It is not passive brand content; it is an active conversion mechanism whose response initiates the behavioral scoring and role classification pipeline for an otherwise unclassified contact. This function must be reflected in the offer design and must not be omitted from Level 4 page templates that include the `progressive_disclosure` slot.

Level 1: Actively suppressed — no offer selected, slot does not render. This is not an absence of commissioned content; it is a deliberate design decision. A visitor classified at HIGH confidence has a strong behavioral classification and (if KNOWN buying job) a confirmed evaluation context. A progressive disclosure prompt at Level 1 would ask a visitor to confirm or self-identify what the system already knows to a high degree of certainty — the prompt would be noise at best, presumptuous at worst. Platform engineers must not commission Level 1 `progressive_disclosure` content on the assumption that the slot is simply unpopulated. The slot is architecturally suppressed at Level 1.

Level 5: Slot not rendered. Holdback visitors receive Level 5 and therefore never encounter a `progressive_disclosure` prompt — consistent with the named measurement asymmetry in Section 2.6 and Section 7.7.

**Level-by-level behavior:**

- Level 1: Not rendered. Active suppression — visitor already classified at HIGH; prompt withheld by design.
- Level 2: Role confirmation prompt. Visitor's inferred role presented for confirmation; a positive response upgrades classification to Tier 2 zero-party + behavioral confirmation path (HIGH confidence pathway).
- Level 3: Role identification prompt. No role assumed; visitor invited to self-identify. A response initiates the Tier 2 pathway.
- Level 4: TAL-context invitation. Visitor invited to identify their evaluation context. Lower-commitment prompt than Level 3 role identification; primary conversion mechanism for unclassified TAL contacts.
- Level 5: Not rendered. Holdback visitors do not encounter this prompt.

**`confidence_tier_minimum` gate:** UNKNOWN. `progressive_disclosure` is designed for visitors at all confidence levels except HIGH. The `UNKNOWN` minimum ensures the slot is not gated by confidence tier at the module level. The variant served (role confirmation at Level 2, role identification at Level 3, TAL-context invitation at Level 4) is determined by the visitor's fallback level, not by a `confidence_tier_minimum` offer gate.

**Named conflict scenario:** None. `progressive_disclosure` varies on `confidence_tier` rather than role; it does not produce axis overlap with role-varying modules on the same page.

**Cross-references:** Section 2.6 (holdback visitors do not receive `progressive_disclosure` at Level 5 — named measurement asymmetry); Section 7.7 (measurement implications for holdback group).

---

### 3.12 Scope Boundary

Section 3 specifies Layer 2 offer matching — which offer is served within an activity to which visitor, for each of the eleven module types. Section 4 specifies Layer 1 — which activity fires for which visitor. Section 2 specifies the buying job axis activation state that governs `jtbd_code` matching across the four three-axis module types (`cta`, `gated_assets`, `proof`, `use_cases`). Section 8 specifies the Level 4 account-level experience composition as a whole — which module slots render at Level 4 and what the assembled experience looks like. Document 8 specifies how the offer catalog is populated, maintained, and kept current via the Sanity-to-Target sync pipeline. Cross-references between Section 3 and these sections are by citation; the specifications do not repeat each other.

---


## Section 4: Adobe Target Activity Configuration

> **Depends on:** `kalder_data_model_s0_s1.py` §10 MODULE_COMPOSITION_RULES; Document 3 Section 2.3 (campaign cohort AEP segment definitions), Section 6.2 (Target activation architecture), Section 8.2 (`tal_new_logo_eligible` suppression); Document 4 Section 5.3 (module type reference table), Section 5.4.2 (named conflict scenarios), Section 8.3.2 Phase 4 (Sanity-to-Target sync fields); Document 5 Section 1 (two-constraint model, rule evaluation sequence, D5-Flag-05)

---

### 4.1 Architectural Framing: How Target Implements Corpus Policies

Three principles govern the relationship between the corpus's logical decisioning model and Adobe Target's execution model. Every configuration specification in this section is an application of one or more of these principles.

**Principle 1 — Target evaluates activities, not compound conditions.**

Adobe Target evaluates visitor audience membership against registered activities in descending priority order (lower integer = higher priority; activity 1000 fires before activity 5000). The visitor is served by the first activity whose audience conditions they satisfy that also has a matching offer available in the catalog for the current module slot. This is not the same as the corpus's `highest_specificity_wins` policy, which is a per-module-slot composition rule. The bridge: within a given module slot, each axis-specificity level (`buying_job` / `bg_stage` / `confidence_tier` / `role` / `solution_category`) maps to a distinct Target activity. Target's activity priority order implements the `axis_priority_order` from `MODULE_COMPOSITION_RULES` [data model §10] — higher-priority-axis activities carry lower priority numbers and are evaluated first. The visitor receives the offer from the highest-priority activity for which both their audience membership is satisfied AND an approved matching offer exists in the catalog for their tuple.

**Principle 2 — Offer catalogs, not activities, carry the per-tuple gate.**

The per-tuple offer catalog gate from Section 1, Step 5 (D5-Flag-05) is implemented via the offer catalog's content state, not via a separate Target audience condition or AEP attribute. Each activity's offer catalog is populated only with approved `Content Module` nodes that have cleared the Sanity-to-Target sync pipeline (Document 4, Section 8.3.2 Phase 4). If no approved offer exists in the catalog for a visitor's `(role_classification, solution_category, buying_stage)` tuple at the axis level of the current activity, Target has no offer to serve for that activity and produces no serving event. Evaluation falls through to the next activity in priority order. No AEP attribute for tuple-level coverage status is required; the catalog state is the gate. This is the same principle stated in Document 4, Section 8.5: "Adobe Target does not require tuple-level coverage status as an AEP attribute: per-tuple coverage gating in Target is implemented via the offer catalog itself."

**Principle 3 — Audience definitions pre-compute compound conditions.**

The compound conditions from Section 1 — for example, `confidence_tier = HIGH AND differential_insufficient = False AND solution_category_coverage_status = complete` — cannot be evaluated as live logic inside a Target activity. Target reads pre-computed audience segment memberships at session start, not raw attribute combinations. Compound conditions must be defined as AEP audience segments using Real-Time CDP audience rules, evaluated against the visitor's AEP contact profile before session evaluation. Target reads the resulting audience membership boolean, not the underlying attribute values. Section 4.3 specifies the named compound audience definitions required for each campaign cohort.

---

### 4.2 D5-Flag-01: Activity Priority Numbering Convention

#### 4.2.1 Convention Definition

The activity priority numbering convention encodes `axis_priority_order` from `MODULE_COMPOSITION_RULES` [data model §10] directly into Target priority integers. In Adobe Target, a lower integer = higher priority; activity 1000 is evaluated before activity 5000.

| Priority Range | Axis | Rationale |
|---|---|---|
| 1000–1999 | `buying_job` | Most specific; inferred from session behavior; takes precedence over all other axes |
| 2000–2999 | `bg_stage` | Stage-level; inferred from account-level engagement; overrides confidence and role axes |
| 3000–3999 | `confidence_tier` | Role confidence level; overrides role and `solution_category` axes |
| 4000–4999 | `role` | Role classification; overrides `solution_category` |
| 5000–5999 | `solution_category` | Broadest; baseline personalization when no finer axis is available |
| 6000–6999 | Non-axis activities | Activities that are not axis-personalization activities: Level 4 account-level experiences (6001–6004, one per cohort), suppression activities (6200–6299, Section 9), and the Level 5 global default (6999). 6100–6199 is reserved — future use. Holdback group activities are at 5951–5954 (below this range; see Section 7). This range also accommodates future axis additions. |

This ordering maps smaller integers to more specific axes, which is the correct directionality for Target's evaluation model. A `buying_job`-axis activity at priority 1203 is evaluated before a `role`-axis activity at priority 4202 for the same module slot — which is the `highest_specificity_wins` policy in operation.

#### 4.2.2 Within-Range Sub-Priority Model

Within each axis range, the four-digit priority number reads as:

- **Thousands digit:** Axis range (1 = `buying_job`, 2 = `bg_stage`, 3 = `confidence_tier`, 4 = `role`, 5 = `solution_category`, 6 = Reserved)
- **Hundreds digit:** Campaign cohort (1 = `education`, 2 = `acquisition`, 3 = `progression_early_to_mature`, 4 = `progression_win_now` [PENDING])
- **Tens + units digits (zero-padded):** Module type slot index (01–11), using the Document 4 Section 5.3 reference table order

**Module type index reference (Document 4 Section 5.3 table order):**

| Index | Module Type | Active Levels |
|---|---|---|
| 01 | `hero` | 1–4 |
| 02 | `benefits` | 1–4 |
| 03 | `cta` | 1–4 |
| 04 | `gated_assets` | 1–3 |
| 05 | `proof` | 1–3 |
| 06 | `narrative` | 1–4 |
| 07 | `problem_framing` | 1–3 |
| 08 | `outcomes` | 1–3 |
| 09 | `use_cases` | 1–3 |
| 10 | `trust_signals` | 1–3 |
| 11 | `progressive_disclosure` | 2–4 |

The four-digit model eliminates the three-digit collision that would arise between priority 121 (`buying_job` + `acquisition` + `hero`) and priority 1210 (`buying_job` + `acquisition` + `trust_signals`) under a three-digit scheme. With four digits and zero-padding, 1201 (`hero`) and 1210 (`trust_signals`) are unambiguous.

#### 4.2.3 Worked Examples

**Example 1:** `buying_job`-axis `cta` activity for the `acquisition` cohort.
- Thousands = 1 (`buying_job` range 1000–1999)
- Hundreds = 2 (`acquisition` cohort)
- Tens+units = 03 (`cta` is module index 03)
- **Priority: 1203**

**Example 2:** `confidence_tier`-axis `hero` activity for the `acquisition` cohort.
- Thousands = 3 (`confidence_tier` range 3000–3999)
- Hundreds = 2 (`acquisition` cohort)
- Tens+units = 01 (`hero` is module index 01)
- **Priority: 3201**

**Example 3:** `role`-axis `benefits` activity for the `progression_early_to_mature` cohort.
- Thousands = 4 (`role` range 4000–4999)
- Hundreds = 3 (`progression_early_to_mature` cohort)
- Tens+units = 02 (`benefits` is module index 02)
- **Priority: 4302**

A platform engineer reading priority number 4302 can infer: `role`-axis activity (4000s), `progression_early_to_mature` cohort (hundreds digit 3), `benefits` module slot (index 02). No documentation lookup is required to decode the number.

#### 4.2.4 Override Slot Numbering

`differential_insufficient` override activities use the `buying_job` axis range (1000s) with the cohort in the hundreds digit and `00` in the tens+units position, signaling the override slot rather than a module type:

- `education` override: **1001** (buying_job range, education cohort, override slot)
- `acquisition` override: **1002**
- `progression_early_to_mature` override: **1003**
- `progression_win_now` override [PENDING]: **1004**

These override priorities are evaluated before all other activities in their respective cohort, consistent with the Section 1.2 Priority 0 routing rule.

#### 4.2.5 Sustainability Guarantee (Alfonso A-1, A-2)

When a new `Content Module` node is approved in Sanity and written to the Target offer catalog via the Sanity-to-Target sync pipeline (Document 4, Section 8.3.2 Phase 4), no existing Target activity requires modification. The new offer is added to the offer catalog as an entry within the existing activity for that axis × cohort × module type combination. Existing activity audience conditions, priority settings, and offer matching rules remain unchanged. Activity priority numbers are set once at program setup and are not modified by routine content commissioning. The offer catalog is the only component that changes when content is commissioned. If a configuration change to an existing Target activity is required when new content is added, that is a maintenance liability — flag it to the platform engineering team as an architecture gap.

---

### 4.3 Campaign Cohort Audience Architecture

Each campaign cohort maps to a set of Target activities with an AEP audience segment as the outermost eligibility gate. Within each cohort's activity set, fallback level routing from Section 1 is implemented through the priority convention and compound audience definitions specified below.

#### 4.3.1 `education` Cohort

**AEP audience gate:** Defined in Document 3, Section 2.3. `tal_program_status` = `active_prospect` AND `bg_stage` = `targeted` AND `sfdc_opportunity_created` = `false` OR null AND `contact_engagement_event_count_180d` = 0.

**Active priority ranges:** Activities in the `x1xx` pattern across all axis ranges — 1101–1111, 2101–2111, 3101–3111, 4101–4111, 5101–5111.

**Activation status:** Active at v1. Most visitors in this cohort are unidentified contacts; the majority receive Level 4 (account-level experience). Identified contacts receive Level 3 or Level 4 depending on solution-category interest signals.

**`differential_override_education` compound audience:**

AEP compound audience definition:
- `tal_program_status` = `active_prospect`
- AND `bg_stage` = `targeted`
- AND `differential_insufficient` = `True`

**Priority: 1001.** Any contact in this audience receives the Level 3 solution-interest offer for their active solution category, regardless of any other cohort activity they would otherwise match. Evaluated before all other `x1xx` activities. This override applies even when the visitor would otherwise qualify only for Level 4 — that is, a TAL-matched visitor with no solution-category interest signal who carries `differential_insufficient` = `True` receives a Level 3 experience, not Level 4. The Level 4 account activity at priority 6001 is never reached for these visitors; the override at 1001 fires first and terminates evaluation for that module slot.

**`tal_new_logo_eligible` enforcement:** Not applicable to `education` cohort. `tal_new_logo_eligible` is an acquisition-mode channel filter; education-cohort activities are awareness-level and do not activate acquisition-mode channels. [Document 3, Section 8.2]

#### 4.3.2 `acquisition` Cohort

**AEP audience gate:** Defined in Document 3, Section 2.3. `tal_program_status` = `active_prospect` AND `bg_stage` = `engaged` OR `prioritized` AND `sfdc_opportunity_created` = `false` OR null AND `contact_engagement_event_count_180d` >= 1.

**Active priority ranges:** Activities in the `x2xx` pattern — 1201–1211, 2201–2211, 3201–3213, 4201–4211, 5201–5211. At v1, Levels 1 and 2 activities are active only for `customer_engagement`. For all other solution categories, only solution_category-axis (5000s) activities have offers in the catalog; higher-axis activities fall through automatically.

**`differential_override_acquisition` compound audience:**

AEP compound audience definition:
- `tal_program_status` = `active_prospect`
- AND `bg_stage` = `engaged` OR `prioritized`
- AND `differential_insufficient` = `True`

**Priority: 1002.** Evaluated before all other `x2xx` activities. This override applies even when the visitor would otherwise qualify only for Level 4 — a TAL-matched visitor with no solution-category interest signal who carries `differential_insufficient` = `True` receives a Level 3 experience, not Level 4. The Level 4 account activity at priority 6002 is never reached for these visitors.

**`tal_new_logo_eligible` enforcement:** All acquisition-cohort Target activities serving Level 1, 2, or 3 experiences include an explicit Target-side audience condition: `tal_new_logo_eligible` = `True`. This is a Target audience condition on the activity, not an AEP segment condition. [Document 3, Section 8.2: "This is a channel-level filter, not an AEP segment condition."] A visitor whose account has `tal_new_logo_eligible` = `False` will not satisfy this condition and falls through all acquisition-mode Level 1–3 activities to Level 4 or Level 5, which do not carry the `tal_new_logo_eligible` condition.

#### 4.3.3 `progression_early_to_mature` Cohort

**AEP audience gate:** Defined in Document 3, Section 2.3. `tal_program_status` = `active_prospect` AND `bg_stage` = `qualified` AND `sfdc_opportunity_created` = `true` AND `sfdc_opportunity_stage` IN [2, 3, 4] AND `sfdc_opportunity_stage_stale` = `false`.

**Active priority ranges:** `x3xx` pattern — 1301–1311, 2301–2311, 3301–3313, 4301–4311, 5301–5311.

**`differential_override_progression_early` compound audience:**

AEP compound audience definition:
- `tal_program_status` = `active_prospect`
- AND `bg_stage` = `qualified`
- AND `sfdc_opportunity_created` = `true`
- AND `differential_insufficient` = `True`

**Priority: 1003.** Evaluated before all other `x3xx` activities. This override applies even when the visitor would otherwise qualify only for Level 4. The Level 4 account activity at priority 6003 is never reached for visitors in this compound audience.

**`tal_new_logo_eligible` enforcement:** Applied to acquisition-mode Level 1–3 activities within this cohort, same Target-side condition pattern as Section 4.3.2.

#### 4.3.4 `progression_win_now` Cohort

[PENDING ACTIVATION: Kafka `sfdc_opportunity_stage` pipeline confirmation required per Document 3, Section 6.2. Until activation, all qualified accounts with `sfdc_opportunity_created` = `true` activate the `progression_early_to_mature` activity set regardless of opportunity stage value.]

**Specified architecture (pending activation):**

**AEP audience gate (pending):** `tal_program_status` = `active_prospect` AND `bg_stage` = `qualified` AND `sfdc_opportunity_created` = `true` AND `sfdc_opportunity_stage` IN [5, 6, 7] AND `sfdc_opportunity_stage_stale` = `false`.

**Active priority ranges (pending):** `x4xx` pattern — 1401–1411, 2401–2411, 3401–3413, 4401–4411, 5401–5411.

**`differential_override_progression_win_now` compound audience (pending):**

AEP compound audience definition (pending):
- `tal_program_status` = `active_prospect`
- AND `bg_stage` = `qualified`
- AND `sfdc_opportunity_created` = `true`
- AND `sfdc_opportunity_stage` IN [5, 6, 7]
- AND `differential_insufficient` = `True`

**Priority (pending): 1004.** No `progression_win_now` activities are created in Target until pipeline activation is confirmed. When active, this override will apply even when the visitor would otherwise qualify only for Level 4; the Level 4 account activity at priority 6004 would not be reached for visitors in this compound audience.

---

### 4.4 Offer Catalog Organization Model

An offer in the Target catalog corresponds to a single approved `Content Module` node from Sanity. When the Sanity-to-Target sync pipeline processes an approved node (Document 4, Section 8.3.2 Phase 4), it writes the following fields as offer attributes to the Target catalog. These attributes are the matching inputs Target uses at session time to select the correct offer for a visitor within a given activity.

| Offer Attribute | Source | Role at Serve Time |
|---|---|---|
| `module_type` | `module_type` from Sanity node | Identifies which page slot this offer populates; activities serve only one `module_type` each |
| `role` | `role` from Sanity node | Role-matching for `role`-axis and `confidence_tier`-axis activities |
| `solution_category` | `solution_category` from Sanity node | Solution category matching across all axis levels |
| `buying_stage` | `buying_stage` from Sanity node | Stage-matching for `bg_stage`-axis activities |
| `confidence_tier_minimum` | `confidence_tier_minimum` from Sanity node | Minimum tier gate; Target reads this against the visitor's `confidence_tier` to confirm eligibility |
| `jtbd_code` | Derived from `jtbd_ref` → `JTBD` node's `jtbd_code` string field | Buying job matching for `buying_job`-axis activities; null when `jtbd_ref` is absent |
| `fallback_level` | Derived: `HIGH` → 1, `MEDIUM` → 1–2, `LOW` → 1–3, `UNKNOWN` → all levels | Level eligibility; governs which axis-level activities can serve this offer |
| `phase` | `phase` from Sanity node | Pre-write exclusion check (see Section 4.6); `phase: converge` nodes are excluded before catalog write |

Within a given activity, Target matches a visitor's profile attributes against available offer attributes. For example, an `acquisition`-cohort visitor with `role_classification = champion`, `solution_category = customer_engagement`, `buying_stage = engaged`, and `confidence_tier = HIGH` evaluated by the `role`-axis `hero` activity (priority 4201) would be matched against offers carrying `role: champion`, `solution_category: customer_engagement`, `buying_stage: engaged`, `module_type: hero`. If the catalog contains such an approved offer, Target serves it. If not, Target produces no serving event for that activity, and evaluation falls through to priority 5201 (the `solution_category`-axis `hero` activity).

**Absence-handling behavior:** When Target finds no matching offer in an activity's catalog for a given visitor and module slot, it produces no serving event for that activity. No error is thrown. The next lower-priority activity for the same module slot is evaluated automatically. This cascades until a matching offer is found or the Level 5 default activity fires. The Level 5 default activity always contains a matching offer for every module slot, terminating the cascade. This is Target's native behavior; no custom middleware or fallback activity audience condition is required. [Document 4, Section 8.5 — tuple-level gating via offer catalog; Document 5, Section 1.6 Step 5 — D5-Flag-05]

---

### 4.5 D5-Flag-02: `cta` Module Two-Offer-Set Specification

The `cta` module has `intended_axes: [role, confidence_tier, buying_job]` and two distinct `confidence_tier_minimum` populations: `MEDIUM` (role-influenced CTAs; softer language acknowledging classified role without direct address) and `HIGH` (role-assumptive CTAs; direct address language that assumes the classified role). [Document 4, Section 5.2 — `cta` specification] These must be configured as two separate Target activities to ensure that a MEDIUM-confidence visitor cannot receive a HIGH-tagged role-assumptive CTA under any activity evaluation order.

The governing axis for the HIGH/MEDIUM separation is `confidence_tier`. Both offer sets are placed in the `confidence_tier` range (3000–3999), with distinct priority numbers within that range. Buying job selection within each offer set is handled via offer attribute matching (`jtbd_code`) at serve time, not via a separate `buying_job`-axis activity. [Brinker/Grunberg resolution]

Within the four-digit convention, the `cta` module requires two priority slots in the `confidence_tier` axis range. The standard slot (index 03) is assigned to the HIGH offer set; the secondary slot (index 13, the next available number above the module index ceiling of 11) is assigned to the MEDIUM offer set. A platform engineer reading a priority number ending in 03 within the 3000s range identifies it as the HIGH `cta`; a number ending in 13 is the MEDIUM `cta` pair for the same cohort.

**Offer Set A — Role-Assumptive `cta` (HIGH):**

- **Activity priorities:** 3103 (education), 3203 (acquisition), 3303 (progression_early_to_mature), 3403 [PENDING] (progression_win_now)
- **Audience conditions:**
  - `confidence_tier` = `HIGH`
  - AND `differential_insufficient` = `False`
  - AND `tal_new_logo_eligible` = `True` (acquisition and progression cohorts only)
  - AND AEP cohort audience gate for the applicable cohort (Section 4.3)
- **Offer catalog filter at serve time:** `confidence_tier_minimum` = `HIGH` AND `module_type` = `cta`
- **Buying job selection:** Full three-axis — `jtbd_code` matches on `buying_job_confirmed` first; falls back to `buying_job_inferred` if `buying_job_confirmed` is null; uses `PROBABLE_JOB_PRIORS` for the visitor's `(role_classification, buying_stage)` when both are null
- **Fallback level:** Implements Level 1 CTA behavior. Direct, assumptive tone. [Document 4, Section 5.2 — `cta` Level 1]

**Offer Set B — Role-Influenced `cta` (MEDIUM):**

- **Activity priorities:** 3113 (education), 3213 (acquisition), 3313 (progression_early_to_mature), 3413 [PENDING] (progression_win_now)
- **Audience conditions:**
  - `confidence_tier` = `MEDIUM`
  - AND `differential_insufficient` = `False`
  - AND `tal_new_logo_eligible` = `True` (acquisition and progression cohorts only)
  - AND AEP cohort audience gate for the applicable cohort
- **Offer catalog filter at serve time:** `confidence_tier_minimum` = `MEDIUM` AND `module_type` = `cta`
- **Buying job selection:** If `buying_job_confirmed` is not null, match on `jtbd_code` = `buying_job_confirmed`. If null, use `PROBABLE_JOB_PRIORS` for `(role_classification, buying_stage)` to select the most probable buying job variant from the MEDIUM-tier offer set
- **Fallback level:** Implements Level 2 CTA behavior. Suggestive, educational tone. [Document 4, Section 5.2 — `cta` Level 2]

**Structural separation guarantee:** Because HIGH `cta` (e.g., priority 3203) and MEDIUM `cta` (e.g., priority 3213) are separate activities with mutually exclusive audience conditions (`confidence_tier = HIGH` vs. `confidence_tier = MEDIUM`), a MEDIUM-confidence visitor cannot receive a HIGH-tagged role-assumptive CTA regardless of evaluation order. The audience gate on each activity is the binding constraint — a MEDIUM visitor does not satisfy `confidence_tier = HIGH` and will never be served by the HIGH `cta` activity. A future misconfiguration of offer filtering within either activity cannot create a cross-population serving event because audience non-membership excludes the visitor before offer selection occurs. [B-4]

---

### 4.6 `phase: converge` Exclusion in Target Activity Context

The `phase: converge` exclusion is enforced at the Sanity-to-Target sync pipeline (Document 4, Section 8.3.2 Phase 4), not as a Target audience condition or offer-level filter within any Target activity. No Target activity configuration is required to enforce this exclusion. The exclusion happens before catalog write, making it invisible to Target: a `phase: converge` node never appears in the offer catalog; Target cannot serve what is not in the catalog.

The phase exclusion check in the sync pipeline is synchronous and executes before any offer write, regardless of how the node's `Experience` node relationships are configured. A `phase: converge` node will never appear in the Adobe Target offer catalog under any configuration state.

**Dependency confirmation:** The phase exclusion is completely dependent on the sync pipeline's pre-write check executing correctly. If the sync pipeline's pre-write check is bypassed or misconfigured, `phase: converge` nodes could enter the catalog and be served to web visitors — group alignment content surfaced in the individual-evaluation web experience, which is the primary diverge/converge enforcement failure mode. Operational verification of catalog integrity is a Document 8 audit procedure, not a Document 5 responsibility. [Document 4, Section 8.3.2 Phase 4 — `phase: converge` exclusion check; Document 8 — catalog integrity audit]

---

### 4.7 Named Conflict Scenario Activity Configuration

The activity priority convention resolves both named conflict scenarios from Document 4, Section 5.4.2 automatically, without ad hoc Target audience rules.

**Scenario 1: `hero_vs_gated_assets_stage_mismatch`**

A Champion in Acquisition `bg_stage` whose `buying_job` inference signals a later stage receives an Acquisition-appropriate hero while `gated_assets` surfaces content for the later stage.

Activity evaluation sequence for the `hero` slot and the `gated_assets` slot independently:

For the `gated_assets` slot: Target evaluates the `buying_job`-axis `gated_assets` activity (priority 1204 = `buying_job` range 1000s, `acquisition` cohort 2, `gated_assets` index 04) first. The visitor's `jtbd_code` matches an offer in the catalog. Target serves the `buying_job`-matched `gated_assets` offer. Evaluation stops for the `gated_assets` slot.

For the `hero` slot: The `hero` module's `intended_axes` are `[role, solution_category, bg_stage]` — `buying_job` is not in `hero`'s `intended_axes`, so no `buying_job`-axis `hero` activity exists. Target begins evaluating the `hero` slot at the highest-priority axis the `hero` module participates in: the `bg_stage`-axis `hero` activity (priority 2201). The visitor's `bg_stage` = `acquisition`; the catalog contains an approved offer for `(champion, customer_engagement, engaged)`. Target serves the `bg_stage`-matched hero. Evaluation stops for the `hero` slot.

Result: `gated_assets` receives the `buying_job`-axis offer (more specific, later-stage assets); `hero` receives the `bg_stage`-axis offer (Acquisition-appropriate framing). This is `highest_specificity_wins` in operation. No per-scenario Target configuration is required. [Document 4, Section 5.4.2, Scenario 1 resolution: "gated_assets buying_job overrides hero stage assumption"]

**Scenario 2: `cta_vs_benefits_buying_job_mismatch`**

A visitor whose `buying_job` inference is `supplier_selection` receives a late-stage CTA alongside `benefits` content that does not reinforce the late-stage context.

Activity evaluation sequence:

For the `cta` slot: The `confidence_tier`-axis `cta` activity (priority 3203 for HIGH, 3213 for MEDIUM for the `acquisition` cohort) is evaluated first within the 3000s range. The visitor receives a `buying_job`-matched CTA — `supplier_selection` tone, direct language appropriate to that evaluation stage.

For the `benefits` slot: The `benefits` module has `intended_axes: [role, solution_category]` — it does not vary on `buying_job`. No `buying_job`-axis `benefits` activity exists. Target begins evaluating the `benefits` slot at the `role`-axis `benefits` activity (priority 4202 for `acquisition`). This activity matches on `role_classification` and `solution_category` and serves a role-default benefits section.

Result: Late-stage CTA alongside role-default benefits copy. This is the documented content gap — not a configuration error. The platform engineer should flag this pattern to the content team so `benefits` content can be reviewed for `supplier_selection`-stage relevance. [Document 4, Section 5.4.2, Scenario 2 operational note: "This is a content gap, not a system failure."] No Target configuration change is required.

The priority convention is self-resolving for both named conflict scenarios. All future conflict scenarios not covered by these two cases are handled by the same mechanism: higher-priority-axis activities are evaluated first; absence of a matching offer causes automatic fallthrough; `highest_specificity_wins` resolution is structural. [G-1]

---

### 4.8 v1 Activity Inventory

The following table is the complete configuration checklist for all Target activities required at v1 launch. Every activity that must exist in Target before v1 launch is listed. Missing activities are implementation gaps; the platform engineering team should treat this table as the authoritative pre-launch checklist.

`customer_engagement` (CE) is the only solution category for which Level 1 and Level 2 activities (`buying_job`-axis, `bg_stage`-axis, `confidence_tier`-axis, and `role`-axis) are active at v1. All other solution categories are active at Level 3 (`solution_category`-axis) or Level 4/5 (default) only.

**Abbreviations:** CE = `customer_engagement`; All cats = all five solution categories; T condition = additional Target-side audience condition (not an AEP segment condition).

---

**`education` Cohort — Priority Range x1xx**

| Priority | Activity Name | Axis | Module Type | Solution Category Scope | Status | AEP Audience Gate | Target Condition |
|---|---|---|---|---|---|---|---|
| 1001 | `differential_override_education` | Override | All slots → Level 3 | All cats | Active | `differential_override_education` (Section 4.3.1) | None |
| 2101 | `bgstage_hero_education` | `bg_stage` | `hero` | CE only | Active | `education` cohort + `confidence_tier` IN [HIGH, MEDIUM] | None |
| 2104 | `bgstage_gated_assets_education` | `bg_stage` | `gated_assets` | CE only | Active | `education` cohort + `confidence_tier` IN [HIGH, MEDIUM] | None |
| 3101 | `confidence_tier_hero_education` | `confidence_tier` | `hero` | CE only | Active | `education` cohort + `confidence_tier` IN [HIGH, MEDIUM] + `differential_insufficient` = False | None |
| 3103 | `cta_HIGH_education` | `confidence_tier` (HIGH) | `cta` | CE only | Active | `education` cohort + `confidence_tier` = HIGH + `differential_insufficient` = False | None |
| 3113 | `cta_MEDIUM_education` | `confidence_tier` (MEDIUM) | `cta` | CE only | Active | `education` cohort + `confidence_tier` = MEDIUM + `differential_insufficient` = False | None |
| 4101 | `role_hero_education` | `role` | `hero` | CE only | Active | `education` cohort + `confidence_tier` IN [HIGH, MEDIUM] + `differential_insufficient` = False | None |
| 4102 | `role_benefits_education` | `role` | `benefits` | CE only | Active | Same as above | None |
| 4106 | `role_narrative_education` | `role` | `narrative` | CE only | Active | Same as above | None |
| 5101 | `solcat_hero_education` | `solution_category` | `hero` | All cats | Active | `education` cohort | None |
| 5102 | `solcat_benefits_education` | `solution_category` | `benefits` | All cats | Active | `education` cohort | None |
| 5103 | `solcat_cta_education` | `solution_category` | `cta` | All cats | Active | `education` cohort | None |
| 5104 | `solcat_gated_assets_education` | `solution_category` | `gated_assets` | CE only | Active | `education` cohort | None |
| 5105 | `solcat_proof_education` | `solution_category` | `proof` | CE only | Active | `education` cohort | None |
| 5106 | `solcat_narrative_education` | `solution_category` | `narrative` | All cats | Active | `education` cohort | None |
| 5110 | `solcat_trust_signals_education` | `solution_category` | `trust_signals` | CE only | Active | `education` cohort | None |
| 5111 | `solcat_progressive_disclosure_education` | `solution_category` | `progressive_disclosure` | All cats | Active | `education` cohort | None |
| 6001 | `level4_account_education` | None | All slots | All cats | Active | `education` cohort + no solution signal | None |
| 6999 | `level5_default_global` | None | All slots | All cats | Active | None (terminal safety net) | None |

*Note: `hero`, `benefits`, `cta`, `narrative`, and `progressive_disclosure` serve all categories at `solution_category`-axis because Level 3+ offers exist for all five categories. `gated_assets`, `proof`, `problem_framing`, `outcomes`, `use_cases`, and `trust_signals` are CE-only at v1 (Level 3 offers exist for CE; other categories are pending). `problem_framing` (5107), `outcomes` (5108), and `use_cases` (5109) are omitted from this table for brevity; they follow the same pattern as `proof` (CE only, `solution_category`-axis, `education` cohort).*

---

**`acquisition` Cohort — Priority Range x2xx**

| Priority | Activity Name | Axis | Module Type | Solution Category Scope | Status | AEP Audience Gate | Target Condition |
|---|---|---|---|---|---|---|---|
| 1002 | `differential_override_acquisition` | Override | All slots → Level 3 | All cats | Active | `differential_override_acquisition` (Section 4.3.2) | `tal_new_logo_eligible` = True |
| 1201 | `buying_job_hero_acquisition` | `buying_job` | `hero` | CE only | Active | `acquisition` cohort + `buying_job_confirmed` OR `buying_job_inferred` not null | `tal_new_logo_eligible` = True |
| 1203 | `buying_job_cta_acquisition` | `buying_job` (within HIGH cta) | `cta` | CE only | Active | `acquisition` cohort + `confidence_tier` = HIGH + `differential_insufficient` = False | `tal_new_logo_eligible` = True |
| 1204 | `buying_job_gated_assets_acquisition` | `buying_job` | `gated_assets` | CE only | Active | `acquisition` cohort + `buying_job_confirmed` OR `buying_job_inferred` not null | `tal_new_logo_eligible` = True |
| 2201 | `bgstage_hero_acquisition` | `bg_stage` | `hero` | CE only | Active | `acquisition` cohort + `confidence_tier` IN [HIGH, MEDIUM] | `tal_new_logo_eligible` = True |
| 2204 | `bgstage_gated_assets_acquisition` | `bg_stage` | `gated_assets` | CE only | Active | `acquisition` cohort + `confidence_tier` IN [HIGH, MEDIUM] | `tal_new_logo_eligible` = True |
| 3201 | `confidence_tier_hero_acquisition` | `confidence_tier` | `hero` | CE only | Active | `acquisition` cohort + `confidence_tier` IN [HIGH, MEDIUM] + `differential_insufficient` = False | `tal_new_logo_eligible` = True |
| 3203 | `cta_HIGH_acquisition` | `confidence_tier` (HIGH) | `cta` | CE only | Active | `acquisition` cohort + `confidence_tier` = HIGH + `differential_insufficient` = False | `tal_new_logo_eligible` = True |
| 3213 | `cta_MEDIUM_acquisition` | `confidence_tier` (MEDIUM) | `cta` | CE only | Active | `acquisition` cohort + `confidence_tier` = MEDIUM + `differential_insufficient` = False | `tal_new_logo_eligible` = True |
| 4201 | `role_hero_acquisition` | `role` | `hero` | CE only | Active | `acquisition` cohort + `confidence_tier` IN [HIGH, MEDIUM] + `differential_insufficient` = False | `tal_new_logo_eligible` = True |
| 4202 | `role_benefits_acquisition` | `role` | `benefits` | CE only | Active | Same | `tal_new_logo_eligible` = True |
| 4206 | `role_narrative_acquisition` | `role` | `narrative` | CE only | Active | Same | `tal_new_logo_eligible` = True |
| 5201 | `solcat_hero_acquisition` | `solution_category` | `hero` | All cats | Active | `acquisition` cohort | `tal_new_logo_eligible` = True |
| 5202 | `solcat_benefits_acquisition` | `solution_category` | `benefits` | All cats | Active | `acquisition` cohort | `tal_new_logo_eligible` = True |
| 5203 | `solcat_cta_acquisition` | `solution_category` | `cta` | All cats | Active | `acquisition` cohort | `tal_new_logo_eligible` = True |
| 5204 | `solcat_gated_assets_acquisition` | `solution_category` | `gated_assets` | CE only | Active | `acquisition` cohort | `tal_new_logo_eligible` = True |
| 5211 | `solcat_progressive_disclosure_acquisition` | `solution_category` | `progressive_disclosure` | All cats | Active | `acquisition` cohort | `tal_new_logo_eligible` = True |
| 6002 | `level4_account_acquisition` | None | All slots | All cats | Active | `acquisition` cohort + no solution signal | `tal_new_logo_eligible` = True |
| 6999 | `level5_default_global` | None | All slots | All cats | Active | None (terminal safety net — shared with all cohorts) | None |

*`problem_framing` (5207), `outcomes` (5208), `use_cases` (5209), `proof` (5205), and `trust_signals` (5210) follow the same pattern as `gated_assets` (CE only, `solution_category`-axis, `acquisition` cohort, `tal_new_logo_eligible` = True) and are omitted for brevity.*

---

**`progression_early_to_mature` Cohort — Priority Range x3xx**

| Priority | Activity Name | Axis | Module Type | Solution Category Scope | Status | AEP Audience Gate | Target Condition |
|---|---|---|---|---|---|---|---|
| 1003 | `differential_override_progression_early` | Override | All slots → Level 3 | All cats | Active | `differential_override_progression_early` (Section 4.3.3) | None |
| 1301–1311 | All `buying_job`-axis CE Level 1–2 activities | `buying_job` | Per module index | CE only | Active | `progression_early_to_mature` cohort gate + applicable conditions | As applicable |
| 2301–2311 | All `bg_stage`-axis CE activities | `bg_stage` | Per module index | CE only | Active | Same | As applicable |
| 3301 | `confidence_tier_hero_progression_early` | `confidence_tier` | `hero` | CE only | Active | `progression_early_to_mature` cohort + `confidence_tier` IN [HIGH, MEDIUM] + `differential_insufficient` = False | None |
| 3303 | `cta_HIGH_progression_early` | `confidence_tier` (HIGH) | `cta` | CE only | Active | `progression_early_to_mature` cohort + `confidence_tier` = HIGH + `differential_insufficient` = False | None |
| 3313 | `cta_MEDIUM_progression_early` | `confidence_tier` (MEDIUM) | `cta` | CE only | Active | `progression_early_to_mature` cohort + `confidence_tier` = MEDIUM + `differential_insufficient` = False | None |
| 4301–4311 | All `role`-axis CE activities | `role` | Per module index | CE only | Active | `progression_early_to_mature` cohort + `confidence_tier` IN [HIGH, MEDIUM] + `differential_insufficient` = False | None |
| 5301–5311 | All `solution_category`-axis activities | `solution_category` | Per module index | All cats | Active | `progression_early_to_mature` cohort | None |
| 6003 | `level4_account_progression_early` | None | All slots | All cats | Active | `progression_early_to_mature` cohort + no solution signal | None |
| 6999 | `level5_default_global` | None | All slots | All cats | Active | None (shared terminal safety net) | None |

*Full activity list follows the same per-activity pattern as the `acquisition` cohort table with hundreds digit 3 substituted for 2 throughout. The `progression_early_to_mature` cohort has no `tal_new_logo_eligible` restriction on Level 1–3 activities (this is a progression-stage cohort, not an acquisition-mode activation).*

---

**`progression_win_now` Cohort — Priority Range x4xx**

[PENDING ACTIVATION: All `progression_win_now` activities are architecturally specified but not created in Target until Kafka `sfdc_opportunity_stage` pipeline confirmation is complete per Document 3, Section 6.2. Priority numbers follow the x4xx pattern throughout: override at 1004, `buying_job`-axis at 1401–1411, `bg_stage`-axis at 2401–2411, `confidence_tier`-axis at 3401–3413 (including cta HIGH 3403 and MEDIUM 3413), `role`-axis at 4401–4411, `solution_category`-axis at 5401–5411, Level 4 account at 6004, Level 5 global default at 6999. Until activation, the `progression_early_to_mature` activity set handles all `qualified` accounts.]

---

**Level 5 Default Activity**

| Priority | Activity Name | Axis | Module Type | Solution Category Scope | Status | AEP Audience Gate | Target Condition |
|---|---|---|---|---|---|---|---|
| 6999 | `level5_default_global` | None | All slots | All cats | Active | None | None |

The Level 5 default activity has no AEP audience gate and no Target condition. It fires for any visitor who reaches priority 6999 without having been served by a higher-priority activity — non-TAL visitors, post-sale visitors, visitors with no solution signal and no TAL identification, and any configuration-gap visitors who fall through all other activities. This activity must always contain a matching offer for every module slot. It is the terminal safety net for the cascade.

---

*End of Section 4. Section 3 specifies per-module offer catalog content and variant selection logic. Section 7 specifies holdback group activity configuration (priority range 5951–5954). Section 8 specifies Level 4 account-level experience composition. Section 9 specifies suppression activity configuration (priority range 6200–6299). Document 8 specifies the Sanity-to-Target sync pipeline implementation that keeps the offer catalog current.*

---


## Section 5: Firmographic-First Path

> **Depends on:** `kalder_data_model_s0_s1.py` §12 SCORING_RULES (seven-step scoring sequence, firmographic bonus, behavioral floor, differential check order AR-03, score clamp), §19 TITLE_ROLE_MAP; Document 2 Section 4 (seven-step scoring sequence, classification_mismatch flag); Document 3 Section 4.2 (Layer 1 behavioral scoring, firmographic bonus pathway, consent interaction, session ceiling), Section 5 (Layer 3 promotion mechanics); Document 5 Section 1 (two-constraint model, fallback level routing); Document 5 Section 2.2 (INFERRED excluded at MEDIUM)

---

### 5.1 The Firmographic-First State: Definition and Scope

The firmographic-first path is a named routing path that activates when a specific set of simultaneous conditions is met. All four of the following must be true at the same time:

- `tal_member` = `True` — Demandbase reverse-IP has resolved the visitor's session to a known TAL account domain, establishing account-level identification
- No stable `contact_id` resolved — the visitor is at Layer 1; they have not submitted a form, responded to a progressive disclosure prompt, or been matched to a CRM contact record that would establish contact-level identity
- Demandbase has produced a title match for the visitor in `§19 TITLE_ROLE_MAP` — firmographic role inference is available for this visitor's reported or inferred job title
- The visitor's behavioral score for the top-scoring role is at or above the minimum behavioral floor (15 points per `§12 SCORING_RULES`) but below the MEDIUM threshold (< 50) without firmographic bonus application — a signal exists but is insufficient for MEDIUM classification without amplification

These are entry conditions, not routing conditions. The firmographic-first path does not guarantee a MEDIUM experience; it specifies the logic by which a sub-MEDIUM behavioral signal may be amplified to reach MEDIUM.

**What the firmographic-first path is not:** It is not a general rule for all Demandbase-identified visitors. TAL identification (`tal_member = True`) alone does not invoke this path. A Layer 1 visitor whose behavioral score already meets the MEDIUM threshold through behavioral accumulation alone (≥ 50 without bonus) is already routing to Level 2 through the standard Section 1 cascade — the firmographic-first path does not apply to them. A Layer 1 visitor with no title match, or whose behavioral score is below the 15-point floor, does not receive the firmographic bonus regardless of TAL status. The firmographic-first path is a named amplification path for a specific sub-population, not a bypass of behavioral scoring.

**Identity plane distinction (Ra-1):** Account-level identification (Demandbase reverse-IP → `tal_member = True`) and contact-level identification (`contact_id` resolution → Layer 3) are distinct identity states. The firmographic-first path applies exclusively at Layer 1 — account-identified, contact-unresolved. Layer 3 visitors have a stable `contact_id` and route through the standard Section 1 cascade with the full Tier 1 and Tier 2 confidence pathways available to them. A visitor who is Layer 3 is not on the firmographic-first path regardless of their Demandbase title match status.

---

### 5.2 The MEDIUM Confidence Ceiling: Identity Constraint, Not Content Constraint

Layer 1 firmographic-first visitors are subject to a MEDIUM confidence ceiling. This ceiling is an identity resolution constraint — it is categorically different from the `pending_solution_fallback` MEDIUM ceiling specified in Section 1.4, which is a content inventory constraint. Both ceilings produce the same routing outcome (no Level 1 experience), but for different reasons with different resolution paths.

**Why the Layer 1 ceiling is an identity constraint:**

HIGH confidence requires one of two pathways:
- Tier 1 ML classifier output — requires a CRM-confirmed `contact_id` for the classifier to execute against historical engagement data
- Tier 2 zero-party self-identification with behavioral confirmation — requires a form submission or progressive disclosure response, both of which simultaneously promote the visitor from Layer 1 to Layer 3

Both pathways to HIGH confidence require a stable `contact_id`. A Layer 1 visitor does not have one. This means a Layer 1 visitor whose behavioral score is 90 — which would produce HIGH tier on the score alone — is still MEDIUM confidence under this constraint. The ceiling is not a judgment about signal quality; it is a structural constraint imposed by the absence of contact-level identity resolution. The scoring engine cannot execute Tier 1 or Tier 2 processes without a `contact_id`.

**How the ceiling lifts:** The MEDIUM ceiling lifts automatically and immediately when the visitor promotes to Layer 3 — via form fill, progressive disclosure response, or CRM contact match. Layer 3 promotion establishes a stable `contact_id`, which enables Tier 1 and Tier 2 processes, which can produce HIGH confidence if the accumulated signal warrants it. The ceiling is not a program design choice that can be overridden by content commissioning, Target reconfiguration, or coverage status changes. It is a logical consequence of identity state.

**Resolution distinction from `pending_solution_fallback`:** The `pending_solution_fallback` MEDIUM ceiling (Section 1.4) resolves when a solution category advances from `pending` to `partial` coverage status — a content commissioning event. The Layer 1 MEDIUM ceiling resolves when a visitor promotes to Layer 3 — an identity event. The resolution paths are orthogonal. A visitor subject to both ceilings simultaneously must satisfy both resolution conditions to reach Level 1.

**Operational consequence:** A firmographic-first visitor's maximum experience is Level 2 (MEDIUM), subject to the Section 2.2 buying job constraint: KNOWN buying job activates three-axis at Level 2; INFERRED is excluded at MEDIUM; UNKNOWN uses `PROBABLE_JOB_PRIORS`. If the visitor has an active `buying_job_confirmed` value within its 90-day window from a prior session, three-axis CTA and gated_assets selection applies at Level 2. Otherwise, two-axis + prior governs.

---

### 5.3 The Track 2 Consent Constraint: Two Simultaneous Conditions

The firmographic bonus (`+30` from `firmographic_confirmation_bonus` per `§12 SCORING_RULES Step 4`) requires both of the following conditions to be simultaneously satisfied. Neither is sufficient alone.

**Condition 1 — Track 2 legal review complete:** `demandbase_firmographic_match` is classified `explicit_consent_required` in the signal classification system [data model §P v0.2.0]. The firmographic confirmation bonus does not execute until Track 2 legal review is complete and a Data Processing Agreement with Demandbase has been executed. Under current Track 2 pending status, the bonus pathway is suppressed program-wide for all visitors regardless of consent state.

**Condition 2 — `visitor_consent_state = full`:** Even after Track 2 completes, the firmographic bonus requires `visitor_consent_state = full`. `functional_only` consent suppresses all signals classified `explicit_consent_required`, and `demandbase_firmographic_match` carries that classification. The suppression mechanism is not arbitrary: a `functional_only` visitor has consented to signals required for functional site operation but has not consented to the use of third-party identity enrichment data for personalization. `demandbase_firmographic_match` is third-party identity enrichment. The signal is therefore suppressed by the consent classification, not by a separate program rule. The outcome — no firmographic bonus — follows directly from the consent classification system. [Document 3, Section 4.2 — Layer 1 consent interaction; Document 2, Section 9.4 — `explicit_consent_required` signal suppression] (Ga-2)

**Compound activation rule:** `(track_2_status = complete) AND (visitor_consent_state = full)`. These are independent gates evaluated simultaneously — not a sequence. Track 2 completion does not create a partial activation state that becomes fully active when consent is later confirmed. Both gates must be open at the moment of scoring for the bonus to execute. A visitor with `visitor_consent_state = full` who visits before Track 2 completes receives no bonus. A visitor with Track 2 active but `visitor_consent_state = functional_only` receives no bonus. (Ga-1)

**Current operational state (Track 2 pending):** All firmographic-first visitors are on the behavioral-only scoring path. The MEDIUM threshold (50 points) must be reached through behavioral signal accumulation without the firmographic bonus. This requires more signal volume than the bonus-assisted pathway. This is a temporary architectural constraint. When Track 2 activates and `visitor_consent_state = full` is confirmed at scoring time, the bonus-assisted path will apply and MEDIUM confidence will be reachable in fewer sessions for title-matched visitors.

---

### 5.4 Title Match and Behavioral Alignment: Three Cases

The relationship between the firmographic role inference (from `§19 TITLE_ROLE_MAP`) and the visitor's behavioral top-scoring role produces three distinct cases. Each case is deterministic. (N-1)

**Case 1 — Match (firmographic role = behavioral top-scoring role):**

The `differential_insufficient` flag is evaluated first, before the bonus is applied. If `differential_insufficient = True` (the differential between the top role score and the second-highest role score is less than the required 10-point minimum per `§12 SCORING_RULES AR-03`), the Priority 0 override fires — route to Level 3 per Section 1.2. The firmographic bonus is not applied when `differential_insufficient = True`. Amplifying an ambiguous signal with the bonus would produce a higher score for the top role without resolving the ambiguity between the top and second roles; the differential would remain below the minimum. The override takes precedence. (N-2)

If `differential_insufficient = False`: the bonus applies (subject to Track 2 + consent conditions from Section 5.3). The visitor's pre-bonus behavioral score for the top role increases by +30. The post-bonus score is clamped per `§12 SCORING_RULES Step 5`. The resulting `confidence_tier` is assigned.

Routing outcomes by post-bonus score:
- Post-bonus score ≥ 50 (MEDIUM threshold): visitor routes to Level 2. Role-influenced personalization activates.
- Post-bonus score ≥ 15 but < 50: visitor remains below MEDIUM. Routes to Level 3 (if solution-category interest signals are present and `tal_member = True`) or Level 4 (if TAL-identified without solution signals). The bonus was applied but was insufficient to cross the threshold.
- (Track 2 suppressed or consent not full): no bonus applied. The visitor's pre-bonus behavioral score governs directly. Routing outcomes: score ≥ 50 → Level 2; score ≥ 15 but < 50 → Level 3 (solution-category interest signals present) or Level 4 (no solution signals). These are the same outcome thresholds as the bonus-active case, applied to the pre-bonus score rather than the post-bonus score.

**Case 2 — Mismatch (firmographic role ≠ behavioral top-scoring role):**

The bonus does not apply. The mismatch is flagged: `classification_mismatch = True` is written to the AEP contact profile [Document 2, Section 4, Step 4]. The visitor is classified at their behavioral confidence tier only — the behavioral top-scoring role governs, not the firmographic role. The mismatch does not reclassify the visitor to the firmographic role.

If `differential_insufficient = True` at the pre-bonus score: Priority 0 override applies as in Case 1. Route to Level 3.

If `differential_insufficient = False`: route via standard Section 1 cascade using the behavioral confidence tier.

The `classification_mismatch = True` flag is not used for real-time routing. It is a diagnostic attribute available in the AEP profile for two downstream functions: (a) sales intelligence — surfaces to the account executive via the Outreach integration as an account-level anomaly flagging that the title-inferred role and the behavioral role diverge; (b) signal weight validation — tracked by the Analytics team as a model accuracy input. Neither function affects the current session's experience.

**Case 3 — No title data available:**

Demandbase returned no title for this visitor, or the visitor's title does not map to any role in `§19 TITLE_ROLE_MAP`. The bonus step is a no-op per `§12 SCORING_RULES Step 4`. No `classification_mismatch` flag is set — absence of title data is not a mismatch; it is a data availability condition. The visitor routes on behavioral score alone. This produces the same routing outcome as the Track 2-suppressed state: behavioral-only scoring, MEDIUM threshold requires full behavioral accumulation without bonus amplification.

---

### 5.5 Session Upgrade Path

If a firmographic-first visitor accumulates additional behavioral signals during the session and crosses the MEDIUM threshold (via behavioral accumulation alone, or via behavioral accumulation + firmographic bonus when the compound activation conditions in Section 5.3 are met), the experience upgrades at the next page navigation event within the session.

**Technical constraint (Ra-2):** Adobe Target does not re-evaluate audience conditions mid-page-render. Audience re-evaluation occurs at the next page navigation event — when Target is called to serve activities for the new page load. A score threshold crossing that fires mid-session takes effect at the next page navigation, not immediately upon crossing. The scoring engine may re-score intra-session on behavioral event accumulation triggers, and the resulting updated `confidence_tier` is written to the AEP contact profile. Target reads the updated profile attribute at the next page call. The experience transition therefore occurs at next-page-load, not mid-page.

**Upgrade path:**

A firmographic-first visitor who enters the session below MEDIUM and crosses the MEDIUM threshold during the session will receive the Level 2 experience from the first page they navigate to after the threshold crossing. The upgrade does not require a new session. It does not require a progressive disclosure response or form submission (those are Layer 3 promotions — a different event). It fires on confidence tier change at the next page navigation.

The upgrade ceiling is MEDIUM. A Layer 1 firmographic-first visitor cannot upgrade to HIGH within the session, because HIGH requires a stable `contact_id` that is not available at Layer 1. The session upgrade produces at most Level 2. Layer 3 promotion — which does establish `contact_id` and can unlock HIGH confidence — is specified in Document 3, Section 5 and is not re-specified here.

**Experience coherence on upgrade (G-2):** When the upgrade fires, the visitor's next page shows the Level 2 experience rather than the Level 3 or Level 4 experience they received on prior pages in the same session. A visitor who received a solution-category hero at Level 3 on page one receives a role-influenced hero at Level 2 on page two. This is an increase in relevance — the experience is more specific to the visitor's classified role and stage. The transition is the program functioning as designed, not a disruption to page coherence. Page-to-page variation in the same session that tracks the visitor's improving classification state is a feature of the real-time scoring architecture.

---

### 5.6 What a Firmographic-First Visitor Experiences

**At session start, below MEDIUM (firmographic-first entry state):**

The visitor's current experience is determined by their Section 1 routing state after behavioral scoring without the firmographic bonus (Track 2 is currently pending):

- If `tal_member = True` AND solution-category interest signals are present: **Level 3** (solution-interest experience). The `progressive_disclosure` module renders at Level 3 with an initial role identification prompt — no role assumption; invites the visitor to self-identify. This is the primary conversion mechanism for a firmographic-first visitor at Level 3: a response upgrades classification state and, if a `contact_id` is produced, promotes to Layer 3.
- If `tal_member = True` AND no solution-category interest signals: **Level 4** (account-level experience). The `progressive_disclosure` module renders at Level 4 with a TAL-context invitation prompt — lower-commitment than the Level 3 prompt; invites the visitor to identify their evaluation context. This is the entry point for firmographic-first visitors with no accumulated solution signal.

**After mid-session upgrade to MEDIUM (next page navigation):**

Level 2 experience activates from the visitor's next page load. Role-influenced personalization applies based on the title-matched role classification.

Buying job at Level 2:
- KNOWN (`buying_job_confirmed` active within its 90-day window from a prior session): three-axis selection activates for `cta`, `gated_assets`, `proof`, `use_cases`.
- UNKNOWN or INFERRED (INFERRED is excluded at MEDIUM per Section 2.2): two-axis + `PROBABLE_JOB_PRIORS`.

The `progressive_disclosure` module behavior shifts at the Level 2 experience: the prompt changes from initial role identification (Level 3/4 prompt type) to role confirmation — "You seem to be evaluating as a [role]. Is that right?" This is the MEDIUM-tier prompt variant specified in Section 3.11, Level 2. The shift in prompt type reflects the improved classification state: the system now has enough confidence to present an inferred role for confirmation rather than asking from scratch.

**If the visitor never crosses MEDIUM in this session:**

The visitor remains at Level 3 or Level 4 for the session duration. Their behavioral signals accumulated during the session are written to the AEP profile under the `(anonymous_id, solution_category)` composite key — the Layer 1 classification key (Ra-3). This key is temporary: when the visitor promotes to Layer 3 (on a future session or during this session via progressive disclosure), the classification history is migrated to the `(contact_id, solution_category)` composite key. The `(anonymous_id, solution_category)` key operates under a 90-day device/cookie retention window; behavioral history older than 90 days under this key is not carried forward.

On return sessions within the retention window, prior behavioral history accumulates under the same anonymous identifier. The visitor may cross the MEDIUM threshold on a subsequent session through cumulative behavioral accumulation — either behavioral-only (under current Track 2 suppressed conditions) or bonus-assisted (when Track 2 activates and `visitor_consent_state = full` is confirmed).

---

### 5.7 AEP Attribute Read Sequence for Firmographic-First Routing

The following numbered sequence is the complete implementation recipe for firmographic-first routing. Each step names the attribute read and the decision produced. The sequence terminates at a routing outcome for every possible input combination. (G-1)

**Step 1 — Confirm `tal_member`.**
Read `tal_member` from AEP account-plane profile.
- If `False`: firmographic-first path does not apply. Route to Level 5 (no TAL identification; non-addressable visitor).
- If `True`: continue to Step 2.

**Step 2 — Confirm Layer 1 state (no `contact_id`).**
Read `contact_id` from AEP contact profile.
- If `contact_id` is present and resolved: visitor is Layer 3. Firmographic-first path does not apply. Route via standard Section 1 cascade with full Tier 1 and Tier 2 pathways available.
- If `contact_id` is null or unresolved: visitor is Layer 1. Continue to Step 3.

**Step 3 — Read `visitor_consent_state`.**
Read `visitor_consent_state` from AEP contact profile.
- If `declined`: no behavioral scoring executes. Firmographic-first path does not apply. Route to Level 4 (account-level, TAL-identified, no scoring). The `declined` visitor receives account-level content based on firmographic attributes alone; no behavioral classification or firmographic bonus applies.
- If `functional_only` or `full`: behavioral scoring executes. Continue to Step 4.

**Step 4 — Evaluate compound firmographic bonus activation conditions.**
Evaluate simultaneously: `track_2_status = complete` AND `visitor_consent_state = full`.
- If both conditions met: firmographic bonus pathway is active for this visitor.
- If either condition is not met (Track 2 pending, OR `visitor_consent_state = functional_only`): firmographic bonus is suppressed. Behavioral-only scoring path applies. Continue to Step 5 without bonus capability.

**Step 5 — Run behavioral scoring.**
Execute `§12 SCORING_RULES` Steps 1–3: cumulative signal accumulation, minimum behavioral floor check (15-point minimum), differential check (top role must lead second role by ≥ 10 points per AR-03). Produce:
- Pre-bonus behavioral score for top-scoring role
- `differential_insufficient` flag (True / False)
- Top-scoring `role_classification`
- If below minimum floor (< 15 points): insufficient signal. Route to Level 4 (TAL-identified, no classification) or Level 5 (non-TAL). Firmographic bonus is not applied below the floor — the floor validates that a meaningful behavioral signal exists before amplification is attempted.

**Step 6 — Evaluate `differential_insufficient` override.**
- If `differential_insufficient = True`: apply Priority 0 override per Section 1.2. Route to Level 3. **Stop. Do not proceed to Step 7.** The firmographic bonus is not applied — amplifying an ambiguous two-role signal does not resolve the ambiguity.
- If `differential_insufficient = False`: continue to Step 7.

**Step 7 — Apply firmographic bonus (if active) or record no-op.**
- If firmographic bonus pathway is active (Step 4): read title from Demandbase and look up role mapping in `§19 TITLE_ROLE_MAP`.
  - **Title match (firmographic role = behavioral top-scoring role):** Apply `+30` bonus per `§12 SCORING_RULES Step 4`. Continue to Step 8.
  - **Title mismatch (firmographic role ≠ behavioral top-scoring role):** Set `classification_mismatch = True` in AEP contact profile. Do not apply bonus. Continue to Step 8 using pre-bonus score.
  - **No title data:** No-op — no bonus applied, no flag set. Continue to Step 8 using pre-bonus score.
- If firmographic bonus pathway is suppressed (Step 4): Skip title lookup. Continue to Step 8 using pre-bonus score.

**Step 8 — Clamp score and assign `confidence_tier`.**
Execute `§12 SCORING_RULES Step 5`: clamp post-bonus score to [0, 100]. Assign `confidence_tier` per `§3 CONFIDENCE_TIERS` thresholds based on the clamped score. Then apply the Layer 1 ceiling override: if the assigned `confidence_tier` = `HIGH`, override to `MEDIUM` and write `MEDIUM` to the AEP contact profile. `HIGH` is not a valid `confidence_tier` output at Layer 1. The override fires on the tier assignment output, not on the raw score value. Write `confidence_tier` and `role_classification` to AEP contact profile.

**Step 9 — Route via Section 1 rule evaluation sequence.**
Execute Section 1, Steps 2–5 using the assigned `confidence_tier` and `role_classification`. The MEDIUM ceiling from Step 8 ensures Step 3 cannot produce Level 1 at Layer 1. The Section 1 cascade produces the final routing outcome: Level 2 (MEDIUM), Level 3 (LOW/solution signal present), or Level 4 (TAL, no solution signal). Write classification outputs to AEP under `(anonymous_id, solution_category)` composite key.

---

*End of Section 5. Section 9 specifies edge case handling for suppression conditions. Document 3, Section 5 specifies Layer 3 promotion mechanics in full. Document 6 specifies the progressive disclosure UX through which firmographic-first visitors most commonly promote to Layer 3. Document 8 specifies the Demandbase API integration and `§19 TITLE_ROLE_MAP` maintenance procedures.*

---


## Section 6: Anonymous Visitor Handling

> **Depends on:** Document 3 Section 1.6 (non-TAL behavior rules), Section 4.3 (Layer 2 anonymous behavioral state), Section 5.2 (Layer 2 → Layer 1 promotion path), Section 8.7 (Level 5 default brand experience); Document 5 Section 1.6 (rule evaluation sequence Step 4); Document 5 Section 3 (per-module Level 5 behavior — authority); Document 5 Section 4 (Level 5 global default activity, Target priority 6999); Document 5 Section 5.5 (session upgrade timing)

---

### 6.1 The Three Level 5-Producing States

Level 5 is the terminal routing outcome for three distinct visitor states. They look identical from the visitor's perspective and they all produce the same on-page experience — the default Kalder brand experience with no personalization applied. They are operationally distinct conditions with different causes, different recovery paths, and different implications for list hygiene and channel activation.

| State | Trigger condition | Behavioral signals collected? | Recoverable without human intervention? |
|---|---|---|---|
| **State A — Layer 2 (no account match)** | `tal_member = False` because Demandbase reverse-IP returned no account match for this IP | Yes — captured in Segment event stream; not scored (TAL filter not satisfied) | Yes — if a future session produces a Demandbase account match that resolves to a TAL account, the visitor promotes to Layer 1; behavioral history accumulated under the anonymous identifier carries forward per Document 3 Section 5.2 decay rules |
| **State B — Out of program** | `tal_member = False` because Demandbase reverse-IP resolved the IP to a specific account that is not on the TAL | Yes — captured in Segment event stream; not scored (TAL filter not satisfied) | Yes — if the account is added to the TAL, the next Demandbase match will establish TAL membership; retained behavioral history becomes eligible for scoring at that point |
| **State C — Suppressed TAL member** | `tal_member = True` AND `tal_program_status = post_sale` AND `tal_upsell_override_active = False` | Yes — collected normally; suppression check (not the TAL filter) prevents scoring | Conditionally — suppression lifts when `tal_upsell_override_active` is set to `True` by the Revenue team; full specification in Section 9 and Document 3 Section 8 |

State C is listed here to prevent conflation with States A and B when debugging Level 5 traffic. A suppressed TAL member is identified, in the database, and producing behavioral signals — the acquisition pipeline suppression, not the absence of a TAL match, is what produces the Level 5 experience. Debugging Level 5 traffic without distinguishing State C from States A and B will produce misleading diagnostics.

**Level 5 is not a failure state.** [Document 3, Section 8.7] It is the correct experience for the visitor population described above. Section 6 reaffirms this in the anonymous visitor context: States A and B visitors are receiving the experience the program is designed to deliver for unidentified or out-of-program visitors. No intervention is required and no escalation is triggered by Level 5 traffic in these states.

---

### 6.2 What Anonymous Visitors Experience

The following consolidates per-module Level 5 behavior from Section 3 for States A and B. It is a reference summary, not a new specification; Section 3 is the authority for per-module Level 5 behavior.

- All eleven module slots serve their Level 5 default offer or do not render, per the per-module specification in Section 3. For modules with a brand default offer at Level 5 (`hero`, `benefits`, `cta`, `narrative`), the slot renders with non-personalized brand content. For modules with no Level 5 offer (`gated_assets`, `proof`, `problem_framing`, `outcomes`, `use_cases`, `trust_signals`, `progressive_disclosure`), the slot does not render.
- No personalization signal is applied — no `role_classification`, `buying_stage`, or `solution_category` matching occurs. The Level 5 global default activity (Target priority 6999) has no AEP audience gate and no offer attribute matching; it serves the same offer to all visitors.
- Behavioral signal collection continues for visitors with `visitor_consent_state = full` or `functional_only` — events are captured in the Segment event stream — but the scoring pipeline does not execute because the TAL filter (`tal_member = True`) is not satisfied.
- The `progressive_disclosure` module does not render at Level 5. Anonymous visitors do not encounter a buying job prompt or a role identification prompt. [Section 3.11 — `progressive_disclosure` Level 5: not rendered]
- No Target personalization activity above priority 6999 is evaluated for anonymous visitors. The Level 5 global default activity is the only activity that fires. [Section 4 — Level 5 global default activity]

---

### 6.3 Mid-Session Demandbase Resolution: Layer 2 → Layer 1 Transition

In implementation configurations where Demandbase IP resolution can fire asynchronously after the initial page load, a visitor who begins a session at Layer 2 may receive a Demandbase account match mid-session.

When a mid-session match fires:

1. AEP updates `tal_member` and the account-plane attributes (`account_domain`, `industry_vertical`, `company_size_segment`) for the matched account.
2. The experience update occurs at next page navigation — not on the current page, not mid-render. Target evaluates audience conditions at page-load time; a Demandbase match that fires after the current page has loaded does not modify the current page's served content. This is the same timing constraint as the Section 5.5 session upgrade.
3. At the visitor's next page navigation within the session, Target evaluates the updated AEP profile against the full activity priority sequence. If behavioral signals accumulated during the Layer 2 portion of the session produce a classifiable score at the new Layer 1 identity state, the experience may upgrade immediately to Level 4 or higher at that next page load.

**Deterministic transition rule:** The outcome of the mid-session resolution is one of exactly two states:

- **TAL account match (`tal_member = True`):** visitor transitions from Layer 2 to Layer 1. Routes per Section 1 cascade from next page navigation forward, using the updated AEP profile and any behavioral signals accumulated during the Layer 2 session.
- **Non-TAL account match (Demandbase resolved an account, but it is not on the TAL):** visitor remains at Level 5. `tal_member` does not become `True`. The visitor is now in State B (out of program) rather than State A. The experience does not change at next page navigation.

**Rarity caveat:** Mid-session Demandbase resolution is implementation-dependent. In standard configurations where the Demandbase reverse-IP call fires synchronously at session start, a mid-session match is not possible. This section applies to configurations where resolution is asynchronous or delayed. Document 8 specifies the Demandbase API integration configuration; the timing of resolution is a Document 8 implementation decision.

---

### 6.4 Diagnostic Reference: Determining Anonymous Visitor State

The following decision table is the operational reference for platform engineers and marketing ops analysts determining which Level 5 state a visitor is in.

| `tal_member` | Demandbase match result | `tal_program_status` | Visitor state | Level 5 reason |
|---|---|---|---|---|
| `False` | No account resolved (IP unmatched) | N/A | **State A — Layer 2** | No TAL account match |
| `False` | Account resolved; account not on TAL | N/A | **State B — Out of program** | Account not TAL-eligible |
| `True` | TAL account resolved | `post_sale`, `tal_upsell_override_active = False` | **State C — Suppressed** | Acquisition pipeline suppressed |
| `True` | TAL account resolved | `active_prospect` | **Not Level 5** | Routes per Section 1 cascade |

**States A and B are indistinguishable from the `tal_member` attribute alone.** Both produce `tal_member = False`. The `tal_member` attribute does not preserve the reason for the False value — it does not distinguish between "Demandbase returned no match" and "Demandbase returned a match for a non-TAL account." Distinguishing States A and B requires inspecting the Demandbase resolution log: did Demandbase return any account match for this IP, or no match at all?

For most operational purposes, States A and B are treated identically: Level 5, signals collected but not scored, no channel activation. The distinction matters for list hygiene and TAL expansion decisions — if State B visitors are from accounts that should be added to the TAL, the Demandbase resolution log is the source for identifying those accounts. It does not affect real-time experience routing.

---

*End of Section 6. Section 9 specifies the full suppression specification for State C visitors. Document 3 Section 5.2 specifies the complete Layer 2 → Layer 1 promotion path including multi-session behavioral history carry-forward. Document 8 specifies the Demandbase API integration and IP resolution configuration.*

---


## Section 7: Holdback Group Specification

> **Depends on:** Document 3 Section 2.3 (campaign cohort AEP segment definitions), Section 8.2 (suppression rules); Document 5 Section 1 (two-constraint model, fallback levels); Document 5 Section 4 (activity priority convention, 6000s range table)

> **Cross-section dependency:** The holdback activity priority placement at 5950–5954 requires an update to the Section 4 range table. The 6100–6199 sub-range previously assigned to holdback in the Section 4 range table note should be reassigned to "reserved — future use." The platform engineering team must apply this update to Section 4 before configuring holdback activities in Target.

---

### 7.1 What the Holdback Group Is and Is Not

Three different visitor states produce the Level 5 default brand experience on kalder.com. They look identical to the visitor. They are categorically different as measurement conditions and must not be conflated.

**Level 5 (no TAL match):** The visitor's IP does not resolve to any TAL account domain. The program has no data about this visitor and cannot personalize for them. They receive the default experience because they are outside the program's addressable population. They are not in holdback; they are out of scope. Their outcomes are not used in lift calculations.

**Level 4 (TAL-identified, insufficient classification):** The visitor is TAL-identified but has not accumulated sufficient behavioral signal for role or solution-category classification — no solution-category interest signals, no role confidence above LOW, no Demandbase account resolution adequate for anything above account-level firmographic personalization. The program delivers the best available experience for their classification state (Level 4 account-level or Level 5 default). They are not in holdback; they are receiving their correct experience given data availability. Their outcomes are tracked but are not the primary lift measurement population.

**Holdback (control group):** The visitor is in the program's addressable population AND the program has sufficient classification data to deliver a personalized experience at Level 1, 2, or 3 AND the program is intentionally withholding that personalized experience so the visitor's outcomes can be compared against a matched personalized visitor. Holdback visitors are a measurement instrument, not an underserved segment.

This distinction is foundational to lift measurement integrity. A control group that includes Level 4/5 visitors — visitors the program could not have personalized anyway — dilutes the lift signal by mixing two populations with different expected baseline conversion rates: addressable visitors who received no personalization, and non-addressable visitors for whom personalization was never possible. The holdback group definition in this section is designed to exclude both.

---

### 7.2 Holdback Group Scope: Cohort-Level, Not Site-Wide

Holdback groups are defined at the campaign cohort level, not as a site-wide traffic slice.

The rationale is grounded in B2B measurement realities. Buying groups in the `education` cohort are at a different pipeline stage, converting on different events (first engagement, content download, account identification) at different frequencies than accounts in `acquisition` (opportunity creation) or `progression_early_to_mature` (deal stage advancement). A site-wide holdback that measures aggregate lift across all cohorts conflates these different conversion signals into a single lift number that does not map to any actionable program decision. Cohort-level holdbacks produce the analysis that actually drives investment decisions: is personalization accelerating engagement-stage conversion specifically, or is the lift concentrated in progression-stage accounts? Should the program invest more in acquisition personalization or in progression-stage content? Those questions require cohort-level lift attribution.

B2B conversion events are also low-frequency compared to web engagement events — opportunity creation happens once per account per qualified cycle. Measuring lift on low-frequency events requires maximizing the signal-to-noise ratio, which favors cohort-level analysis where the conversion event is homogeneous and the holdback population is drawn from the same conversion stage.

Four holdback groups, one per cohort:

- `holdback_education` — withholds personalization from a designated percentage of `education` cohort visitors
- `holdback_acquisition` — withholds personalization from a designated percentage of `acquisition` cohort visitors
- `holdback_progression_early` — withholds personalization from a designated percentage of `progression_early_to_mature` cohort visitors
- `holdback_progression_win_now` — [PENDING: specified but not activated until `progression_win_now` cohort activates per Section 4.3.4]

Each holdback group receives the Level 5 default brand experience — the same experience a non-TAL visitor would receive — regardless of their classification state. Holdback visitors do not receive Level 4 account-level personalization; they receive the full default. This is the clean control condition: the counterfactual is "what would this TAL-identified, classified visitor have done if they had received the standard brand experience?" Serving Level 4 to the holdback group rather than Level 5 would introduce a partial-personalization confound into the control condition.

**Multi-person buying group attribution and account-level holdback analysis (Gr-2):** Holdback assignment is individual-level — each visitor is assigned to holdback or personalization based on a hash of their own stable identifier. This is the correct assignment mechanism for session-level analysis and for behavioral signal collection. However, B2B primary outcomes — opportunity creation, deal stage advancement, deal close — are account-level events produced by buying groups, not individual conversion events.

For account-level outcome analysis in Document 7, an account is treated as "in holdback" when the majority (≥50%) of its identified contacts across the relevant cohort are holdback-assigned. This is the working aggregation rule for v1. Document 7 owns the formal account-level aggregation methodology and may refine this threshold based on account size distribution and contact identification rates in the program. Section 7 establishes the individual-level assignment mechanism; Document 7 establishes how that mechanism aggregates to account-level for business outcome measurement.

---

### 7.3 Holdback Traffic Percentage: 10% v1 Starting Point

The v1 holdback percentage is **10% per cohort**. This is a starting hypothesis, not a validated parameter.

10% was selected without baseline traffic data. Document 7 (Measurement and Experimentation Framework) owns the power calculation that validates whether 10% produces sufficient sample size for actionable lift measurement at Kalder's traffic volumes. Until Document 7's power calculation is complete, 10% is the operational assumption.

**Adjustment governance:** Adjustments to holdback percentage within the range 5%–20% require: Analytics Lead proposes adjustment with documented rationale → Marketing Ops implements in Target → change is logged in the program change record. No council review is required for adjustments in this range. Adjustments above 20% require council review because they represent a material reduction in the addressable personalization population. Adjustments below 5% require council review because they risk leaving too little statistical power to detect meaningful lift at any cohort.

**Reduction timing constraint:** Do not reduce any cohort's holdback percentage below 5% within the first 90 days of v1 launch, regardless of power calculation results. Kohavi's recommendation: early data exhibits novelty effects — visitors behaving differently simply because the experience has changed — that inflate measured lift in the first 60–90 days. Reducing holdback before novelty effects have dissipated produces a statistical artifact, not a program signal.

**`progression_win_now` holdback — revenue risk acknowledgment (V-1):** The `progression_win_now` cohort is where withholding personalization carries the most direct revenue risk. Accounts in this cohort are at Salesforce opportunity stages 5–7 — late-stage deals where the difference between a role-appropriate, convergence-point-calibrated experience and a generic brand experience may influence close rates. Withholding personalization from 10% of these accounts is a measurement cost that buys lift attribution data for the cohort where the lift signal has the highest dollar value.

The governance resolution: the `progression_win_now` holdback percentage must be reviewed by the Revenue team at 30 days post-activation. If deal volume in the holdback group is creating measurable revenue risk — for example, if the holdback group shows a materially lower close rate than the personalized group at 30 days, or if a specific holdback account is at risk of churning to a competitor — the Revenue team may request a reduction to 5%. The 5% floor is the minimum that preserves statistical usability for this cohort; below 5%, the holdback group is too small to produce actionable lift measurements at typical B2B deal volumes. Unlike other cohorts where 5% is an absolute floor, the progression_win_now floor is 5% even within the first 90 days — the revenue risk of a late-stage deal loss outweighs the novelty effect risk at this pipeline stage.

---

### 7.4 Holdback Assignment Mechanism: Session-Stable Visitor-Level Assignment

Holdback assignment must be stable across sessions for the same visitor. A visitor assigned to holdback on their first TAL-identified session must receive the holdback treatment on every subsequent session throughout their pre-sale lifecycle.

**Assignment trigger:** A visitor is assigned to holdback or personalization at first TAL identification — the moment the visitor is first matched to a TAL account via Demandbase reverse-IP or CRM contact resolution. This is the earliest point at which the program knows the visitor is in its addressable population.

**Assignment mechanism:** The assignment is deterministic, based on a hash of the visitor's stable identifier:

- For identified contacts: `contact_id` is the stable identifier
- For unidentified TAL-matched visitors (Demandbase reverse-IP match without CRM contact resolution): the anonymous identifier assigned at first TAL identification is the stable identifier

The hash produces a value in the range [0, 100). Visitors whose hash value falls in [0, 10) are assigned to holdback. Visitors in [10, 100) receive personalization. This is the 10% holdback split. The hash function is deterministic: the same identifier always produces the same hash value, which always maps to the same assignment. There is no re-randomization per session.

**Assignment persistence:** The assignment is written to the visitor's AEP profile as the `holdback_group` attribute at first TAL identification and does not change for the duration of the pre-sale lifecycle. When a visitor in holdback is promoted from anonymous to identified (anonymous identifier stitched to a resolved `contact_id`), the holdback assignment from the anonymous session is carried forward to the identified contact record. A visitor in holdback remains in holdback through cohort transitions — moving from `education` to `acquisition` to `progression_early_to_mature` does not reset holdback assignment.

**`holdback_group` AEP attribute (Alfonso A-1):**

| Field | Value |
|---|---|
| **Attribute name** | `holdback_group` |
| **Type** | Boolean |
| **Values** | `True` = visitor is in holdback control group / `False` = visitor receives personalization |
| **Set at** | First TAL identification event (Demandbase reverse-IP match or CRM contact resolution, whichever occurs first) |
| **Set by** | AEP identity resolution pipeline on TAL identification event |
| **Stability** | Permanent for pre-sale lifecycle; not reset on cohort transition, confidence tier change, or classification state change |
| **Post-sale** | Holdback assignment is irrelevant at `tal_program_status` = `post_sale` transition; the attribute remains set but is not evaluated by any active Target activity |
| **Identity stitching** | When an anonymous holdback visitor is promoted to a resolved `contact_id`, the `holdback_group = True` value carries forward to the identified contact profile |

**[CA FLAG]: `holdback_group` is a new AEP contact profile attribute that must be added to `CLIENT_ATTRIBUTE_MAP` (§CA) in the next implementation pass of `kalder_data_model_s0_s1.py`.**

Target reads `holdback_group` as a contact profile attribute at session start. The holdback activities (Section 7.5) use `holdback_group = True` as part of their AEP audience gate condition.

---

### 7.5 Holdback Activity Configuration in Target

Holdback is implemented as four Target activities at priority range **5950–5954**. This placement is in the 5000s axis range, below all `solution_category`-axis personalization activities (5101–5311) and above the Level 4 account activities (6001–6004) in the evaluation sequence.

**Why holdback fires before Level 4 in the evaluation sequence:**

The holdback control condition is "a visitor who could receive personalization but does not." For this condition to be clean, the visitor must have passed the TAL identification gate and the cohort audience gate — confirming they are in the program's addressable personalization population — before the holdback gate fires.

The priority placement at 5950–5954 ensures that a holdback visitor who has exhausted all personalization activity matches (1000s–5311) reaches the holdback gate before the Level 4 account activity (6001–6004). The holdback activity fires, serves the Level 5 default experience, and terminates evaluation for that visitor. The Level 4 account activity is never reached for holdback visitors. This is the correct behavior: the holdback visitor receives the full default, not the Level 4 partial-personalization experience. The control condition is clean.

If holdback activities were placed at 6100–6199 (after Level 4 at 6001–6004), a holdback visitor who qualifies for Level 4 would be served the Level 4 account-level experience by the Level 4 activity before the holdback gate fired — contaminating the control condition with a partial-personalization treatment. The 5950–5954 placement prevents this.

**Section 4 cross-section update (Alfonso A-2):** The Section 4 range table note for the 6000–6999 range must be updated to reflect that holdback moved to 5950–5954 and is not in the 6000s range. The 6100–6199 sub-range previously assigned to holdback in the Section 4 range table description should be reassigned to "reserved — future use." Additionally, the Section 4 section footer cross-reference that cites "Section 7 at 6100–6199" must be updated to cite "Section 7 at 5951–5954." Both locations must be updated before the platform engineer configures holdback activities in Target.

**Holdback activity table:**

| Priority | Activity Name | AEP Audience Gate | Target Condition | What Visitor Receives |
|---|---|---|---|---|
| 5951 | `holdback_education` | `education` cohort gate (Document 3, Section 2.3) AND `holdback_group` = `True` | None | Level 5 default brand experience (all module slots) |
| 5952 | `holdback_acquisition` | `acquisition` cohort gate (Document 3, Section 2.3) AND `holdback_group` = `True` | None | Level 5 default brand experience (all module slots) |
| 5953 | `holdback_progression_early` | `progression_early_to_mature` cohort gate (Document 3, Section 2.3) AND `holdback_group` = `True` | None | Level 5 default brand experience (all module slots) |
| 5954 | `holdback_progression_win_now` | `progression_win_now` cohort gate (Document 3, Section 2.3) AND `holdback_group` = `True` | None | Level 5 default brand experience (all module slots) — [PENDING activation per Section 4.3.4] |

Note on priority numbering within the holdback range: holdback activities use 5951–5954 rather than 5950–5953 to leave 5950 available as a buffer slot. The cohort digit encoding (1 = education, 2 = acquisition, 3 = progression_early, 4 = progression_win_now) in the units position mirrors the override slot encoding at 1001–1004, making the holdback group membership traceable by priority number.

**Evaluation sequence summary for a holdback visitor:**

A TAL-identified `acquisition`-cohort visitor with `holdback_group = True`, HIGH `confidence_tier`, and `customer_engagement` solution category interest would be evaluated as follows:

1. Priority 1002 (`differential_override_acquisition`): `differential_insufficient` = `False` → no match, falls through
2. Priorities 1201–4206 (axis-specific personalization activities): visitor satisfies audience conditions for several of these, but the holdback activity has not yet fired → these activities would serve personalized offers IF the holdback gate were not present
3. Priority 5201–5211 (`solution_category`-axis activities): same — visitor matches, but holdback has not fired yet
4. **Priority 5952 (`holdback_acquisition`):** visitor satisfies `acquisition` cohort gate AND `holdback_group = True` → match. Visitor is served the Level 5 default experience. **Evaluation stops.**
5. Priorities 6001–6999: never reached for this visitor

Step 4 is the critical behavioral confirmation: the holdback gate fires after all personalization activities in the visitor's cohort range have been evaluated (and would have matched), confirming the visitor was addressable for personalization before being assigned to control. [K-1]

---

### 7.6 Solution-Category Holdback Sub-Segmentation

Solution-category sub-segmentation of holdback groups — tracking lift separately for each solution category within a cohort — is a v2 upgrade path, not a v1 requirement.

**Activation condition:** Solution-category sub-segmentation activates for a given solution category within a given cohort when that category produces at least 500 unique holdback visitors per 90-day period. Below this threshold, the sub-segment lacks sufficient statistical power to produce actionable lift measurements at the solution-category level. Document 7 owns the formal power calculation that validates this threshold; 500 unique visitors per 90 days is the hypothesis. If Document 7's power calculation produces a different threshold, Document 7's threshold governs.

At v1 launch, `customer_engagement` within the `acquisition` cohort is the only solution category likely to approach the sub-segmentation threshold, given that it is the only complete-coverage category and carries the highest inbound traffic volume of the five solution categories. The Analytics team should begin monitoring solution-category visitor volume within holdback groups at v1 launch and flag when any category's 90-day unique holdback visitor count approaches 450 (90% of the 500 threshold), allowing time to prepare the sub-segmentation analysis infrastructure before the threshold is crossed.

---

### 7.7 What Holdback Visitors Do and Do Not Experience

**Holdback visitors DO:**

- Receive the Level 5 default brand experience on kalder.com across all module slots — the same generic experience a non-TAL visitor receives
- Have their behavioral signals collected under standard consent rules — TAL identification does not change signal collection; consent state governs what is collected
- Have their classification scoring run — the scoring engine processes their behavioral signals and produces `confidence_tier`, `role_classification`, `fallback_level`, and all other contact-plane classification attributes normally; these outputs are stored in AEP and used for analysis but not for experience delivery
- Remain assigned to their correct `bg_cohort` and `bg_stage` — cohort assignment is account-plane and is not affected by holdback status
- Appear in all cohort audience segments — a holdback visitor in the `acquisition` cohort is a member of the `acquisition` AEP audience segment; only their Target experience delivery is withheld
- Have their outcomes tracked as control group outcomes for lift analysis — engagement events, opportunity creation, deal progression, and deal close are all captured normally

**Holdback visitors DO NOT:**

- Receive any role-specific, role-influenced, solution-interest, or account-level personalized experience on kalder.com — the holdback activity serves the Level 5 default for all module slots, regardless of the visitor's `confidence_tier` or `fallback_level`
- Receive Marketo nurture emails triggered by Adobe Target personalization activity — however, if a Marketo enrollment condition is met independently of Target (for example, a direct form submission on kalder.com triggers a Marketo enrollment rule that does not depend on Target audience membership), Marketo enrollment proceeds normally for holdback visitors; holdback suppresses Target-dependent channel activations, not all program channels
- Trigger Outreach sequences based on personalization-derived signals in Target — however, direct CRM activity (sales calls, meeting scheduling, opportunity stage advancement by the AE) proceeds normally; holdback does not suppress CRM-based sales alerts or direct engagement signals [V-2]
- See `progressive_disclosure` module prompts — the `progressive_disclosure` module is not rendered at Level 5; holdback visitors receiving the Level 5 default experience do not encounter progressive disclosure prompts, which means their zero-party declaration pathway is not available during the holdback period; this is a known tradeoff of the holdback design

**Behavioral signal collection during holdback:** Holdback visitors continue to accumulate behavioral signals and classification scores throughout their holdback period. When a holdback assignment is retired — either at `tal_program_status = post_sale` transition or if a visitor exits the holdback pool through a holdback percentage reduction — their accumulated classification history is immediately available for personalization decisions. This also means the holdback group produces behavioral signal data and classification output that can inform signal weight validation even though personalized experiences are not delivered during the holdback period.

---

### 7.8 Relationship to Document 7

**What Section 7 specifies and hands to Document 7:**

Section 7 specifies the holdback group definition (who is in holdback, based on TAL identification + cohort membership + `holdback_group = True`), the assignment mechanism (deterministic hash of stable identifier, written to `holdback_group` AEP attribute at first TAL identification), the traffic percentage (10% per cohort, explicitly stated as an unvalidated starting hypothesis), the cohort-level segmentation structure (four holdback groups, one per cohort), the Target activity configuration (priorities 5951–5954, placement before Level 4 account activities), the holdback visitor experience (Level 5 default, signal collection and scoring continue normally), the account-level aggregation working rule (≥50% of identified contacts holdback-assigned = account treated as holdback for outcome analysis), and the solution-category sub-segmentation upgrade path (500 unique holdback visitors per 90 days per category is the activation threshold hypothesis).

**What Document 7 inherits from Section 7:**

The holdback group definition as the control condition for all lift calculations. The `holdback_group` AEP attribute as the segment dimension for control/treatment split analysis. The 10% traffic percentage as the starting hypothesis to be validated by Document 7's power calculation — if Document 7 determines a different percentage is required, it governs. The cohort segmentation as the primary analysis dimension for lift breakdown. The account-level aggregation working rule (≥50% threshold) as the starting assumption for Document 7's formal aggregation methodology. The solution-category sub-segmentation conditions as the criteria for upgrading to finer-grained analysis.

**What Document 7 owns and Section 7 does not specify:**

Minimum detectable effect calculations and formal power calculation methodology. Confidence interval specifications and statistical significance thresholds. Novelty effect identification procedures and the timing model for when novelty effects dissipate. Simpson's paradox risk in segment-level analysis and the mitigation approach. The formal account-level aggregation methodology for business outcome attribution. The reporting cadence for lift results and the escalation path when lift is not measurable. The attribution model for multi-person buying groups — how conversion credit is divided across buying group members when some are in holdback and some are in the personalization group.

**Scope boundaries:**

Section 7 does not specify the statistical measurement methodology — that is Document 7. Section 7 does not specify Marketo holdback behavior (whether holdback visitors are explicitly excluded from Marketo email programs as a matter of program design, rather than simply not receiving Target-triggered enrollments) — that is Document 8. Section 7 does not specify how holdback assignment interacts with progressive disclosure beyond the note in Section 7.7 that holdback visitors receive Level 5 and the `progressive_disclosure` module does not render at Level 5. Section 7 does not specify post-sale holdback behavior — holdback assignment is effectively retired at `tal_program_status = post_sale` transition; the attribute remains set but is not read by any active Target activity for post-sale visitors.

---

*End of Section 7. Document 7 (Measurement and Experimentation Framework) inherits the holdback group definition as specified above as its control condition foundation. Section 4 requires a range table update: holdback activities at 5950–5954 should be added to the 5000s range description, and the 6100–6199 sub-range in the 6000s description should be reassigned from "holdback" to "reserved — future use." Section 9 specifies suppression activity configuration in the 6200–6299 range.*

---


## Section 8: Level 4 Page Assembly Completeness

> **Resolves:** D5-Flag-03
> **Depends on:** Document 4 Section 5.2 (per-module Level 4 behavior), Section 5.3 (module type reference table), Section 8.4 (progressive_disclosure commission block, D8-Flag-07); Document 5 Section 1.3 (Level 4 activation rule); Document 5 Section 3 (per-module Level 4 offer matching — authority; Section 8 cites, does not repeat); Document 3 Section 4.2 (Layer 1 personalization depth, account-plane attributes)

---

### 8.1 Level 4 Defined: The TAL-Identified, Unclassified Visitor

A Level 4 visitor is simultaneously known and unknown to the program:

- `tal_member = True` — the program knows which account this visitor is from
- No solution-category interest signal sufficient for Level 3 routing — the program does not know what this visitor is evaluating
- No role classification — the program does not know who within the buying group this visitor is
- May or may not have a resolved `contact_id` — the visitor may be Layer 1 (account-identified only) or Layer 3 with insufficient behavioral signal for Level 3 routing

The program has account-plane data available for Level 4 content selection: `industry_vertical`, `company_size_segment`, `tal_solution_interest_flags` (which solution categories the account has expressed interest in at the program level), and `bg_stage`. [Section 1.3; Document 3, Section 4.2]

The Level 4 page's design purpose follows directly from what the program knows and does not know. The page is not built to inform the visitor at the solution-category level — that is Level 3's function. The Level 4 page is built to accomplish two things simultaneously: establish enough brand credibility and account-relevant resonance to give this known-account visitor reason to stay, and create the conditions for the `progressive_disclosure` module to produce a classification event. The goal of the Level 4 experience is to convert a known-account visitor into a classified contact. Every slot on the Level 4 page serves one or both of those purposes.

---

### 8.2 Guaranteed Module Slots at Level 4

Guaranteed slots are module types that always render at Level 4 regardless of commissioned content state. Their Level 4 offer is either a brand-default offer that exists independent of Sanity content commissioning, or a required offer whose commission is a prerequisite for Level 4 completeness.

**`hero`** — Level 4 behavior: firmographic or brand-default hero. A brand-default hero offer is required in the Level 4 account activity offer catalog (Target activities 6001–6004) and serves as the guaranteed floor. This offer is distinct from the Level 5 brand-default — it is specifically commissioned for the Level 4 experience and served by the Level 4 account activity, not by the Level 5 global default activity at priority 6999. The slot is guaranteed because the Level 4 brand-default hero is a commissioning prerequisite (see Section 8.6 checklist), not because the cascade falls through to Level 5. The Level 4 experience may additionally render a firmographic-targeted hero (matched on `industry_vertical` and `company_size_segment`) if such offers have been commissioned; the brand-default is the floor and the firmographic variant is the quality upgrade.

**`benefits`** — Level 4 behavior: brand-default, solution-agnostic benefits statement. Section 3.2 specifies Level 4 as "solution-category default (same as Level 3)" — but at Level 4 the visitor has no identified solution category. The "same as Level 3" language means the offer is drawn from the same fallback tier; it does not mean solution-category matching applies. At Level 4 with no `solution_category` known, `benefits` serves the brand-default solution-agnostic offer: a general statement of Kalder's value that does not presuppose which solution the visitor is evaluating. This is the authoritative Level 4 `benefits` specification. (N-1)

**`cta`** — Level 4 behavior: brand-level awareness CTA. A brand-default CTA offer is required in the Level 4 offer catalog. This slot is the fallback conversion element when `progressive_disclosure` is absent (see Section 8.5).

**`narrative`** — Level 4 behavior: generic brand value proposition or solution-category narrative if available in catalog. Brand-default is always present. Guaranteed.

**`trust_signals`** — Level 4 behavior: brand-level security and compliance overview. A brand-default trust signals offer is required at Level 4. For a TAL-identified visitor who is still evaluating whether Kalder is a credible enterprise vendor, the trust signals slot carries material weight — it answers the implicit governance question before the visitor has identified themselves as a Ratifier or any other role.

**`progressive_disclosure`** — Level 4 behavior: TAL-context invitation prompt. Guaranteed in architecture; see Section 8.5 for the commissioning dependency that affects v1 completeness. This slot is the primary conversion mechanism for Level 4 visitors and its commission is a prerequisite for a complete Level 4 experience.

**Total guaranteed slots: 6** — `hero`, `benefits`, `cta`, `narrative`, `trust_signals`, `progressive_disclosure`.

These six slots share a common characteristic: each carries a default offer that exists independent of solution-category content commissioning. A Level 4 visitor always receives these six slots — subject to the `progressive_disclosure` commission dependency in Section 8.5 — as the minimum viable Level 4 experience.

---

### 8.3 Conditional and Non-Rendered Module Slots at Level 4

**Conditional (renders at Level 4 only if Level 4 offers have been commissioned):**

**`gated_assets`** — Level 4 behavior: generic brand-level or industry-relevant ungated content. [Section 3.4] This content must be explicitly commissioned as Level 4 asset offers tagged to `industry_vertical` or as brand-level ungated assets. Until it is commissioned, the `gated_assets` slot does not render at Level 4 — the offer catalog contains no Level 4 `gated_assets` offers, Target finds no match, and the cascade reaches Level 5 for this slot (not rendered per Section 3.4). Conditional.

**`problem_framing`** — Level 4 behavior: industry-level problem description, if commissioned. Section 3.7 specified "not rendered unless an industry-level offer exists in the catalog." This makes `problem_framing` technically conditional at Level 4, not guaranteed-absent. If Kalder's content team commissions industry-vertical `problem_framing` offers for the major verticals represented in the TAL, those offers can render at Level 4 and advance the page's credibility by naming the visitor's industry challenge before they have identified themselves. This is a named optional enhancement: commissionable, high-value, not required for minimum Level 4 completeness.

**Not rendered at Level 4 (regardless of commissioning state):**

- `proof` — Active at Levels 1–3 only. Not rendered at Level 4 per Section 3.5 and Document 4 Section 5.3.
- `outcomes` — Active at Levels 1–3 only. Not rendered at Level 4 per Section 3.8.
- `use_cases` — Active at Levels 1–3 only. Not rendered at Level 4 per Section 3.9.

**Summary — every module type in exactly one category (G-1):**

| Module Type | Level 4 Status | Depends on |
|---|---|---|
| `hero` | Guaranteed | Brand-default always present; firmographic quality depends on commissioning |
| `benefits` | Guaranteed | Brand-default (solution-agnostic) always present |
| `cta` | Guaranteed | Brand-default always present |
| `narrative` | Guaranteed | Brand-default always present |
| `trust_signals` | Guaranteed | Brand-default always present |
| `progressive_disclosure` | Guaranteed (architecture) / Commission-blocked (v1) | Document 6 approval required before commissioning |
| `gated_assets` | Conditional | Level 4 ungated asset offers must be commissioned |
| `problem_framing` | Conditional (optional enhancement) | Industry-level offers must be commissioned per vertical |
| `proof` | Not rendered | Active at Levels 1–3 only |
| `outcomes` | Not rendered | Active at Levels 1–3 only |
| `use_cases` | Not rendered | Active at Levels 1–3 only |

---

### 8.4 Level 4 Page Composition by Template

The following specifications describe the Level 4 composition for the two primary templates. They are design guidance — slot ordering is a UX/engineering decision, not a binding Target configuration requirement. Section 8 specifies which module types have Level 4 offers available; template implementation is a Layer 3 deliverable.

**Solution page template at Level 4:**

The solution page assembles the six guaranteed slots with firmographic-targeted or brand-default offers. The page is designed to answer the visit intent of a TAL account member who arrived at a solution-category page without sufficient behavioral history to be classified there. The assembled experience should feel like a well-prepared reception, not a generic brand landing — even without role or solution-category knowledge, the page uses account firmographics to establish industry resonance and uses the `progressive_disclosure` prompt to invite the visitor into a more specific conversation.

Recommended slot order (top to bottom):

1. `hero` — firmographic or brand default; first impression sets industry relevance
2. `benefits` — brand-default solution-agnostic; establishes value without presupposing solution fit
3. `narrative` — generic brand value proposition; carries the through-line claim
4. `progressive_disclosure` — TAL-context invitation prompt; placed mid-page after initial credibility is established, before conversion elements
5. `cta` — brand awareness CTA; explicit next step
6. `trust_signals` — brand-level governance and compliance overview; answers implicit vendor evaluation questions
7. `gated_assets` — conditional; renders if Level 4 industry-relevant ungated assets are commissioned

The `progressive_disclosure` prompt at position 4 is placed mid-page rather than at the bottom because mid-page placement produces higher engagement for contextual prompts than footer placement — the visitor encounters the prompt after establishing basic brand credibility but before the page's conversion elements exhaust their attention. This is experience design guidance, not a Target configuration rule.

**Home page template at Level 4:**

The home page renders a subset of the solution page slots. Not all solution-page slots exist in the home page template structure.

Guaranteed on home page at Level 4: `hero`, `benefits`, `cta`, `progressive_disclosure`, `trust_signals`.

`narrative` is optional on the home page template — the home page may not include a dedicated narrative slot depending on template design. `gated_assets` does not render on the home page template at Level 4. `problem_framing` (conditional) renders if the home page template includes an industry-problem slot and industry-level offers are commissioned.

---

### 8.5 The `progressive_disclosure` Slot as Conversion Mechanism

The `progressive_disclosure` slot at Level 4 is the program's primary mechanism for converting a TAL-identified, unclassified visitor into a classified contact. A visitor who responds to the Level 4 prompt provides zero-party data that either confirms a classification anchor — role, solution category interest, or evaluation context — which advances the visitor toward Level 3 or Level 2 personalization on subsequent pages or sessions. No other slot on the Level 4 page produces a classification event. The `cta` drives engagement; `progressive_disclosure` drives classification.

**Implication 1 — Commission prerequisite for Level 4 completeness:**

The `progressive_disclosure` guaranteed slot designation means the slot renders at Level 4 in architecture — but if no Level 4 `progressive_disclosure` offer has been commissioned in Sanity, Target finds no offer in the catalog, and the slot falls through to Level 5: not rendered. [G-2] The Level 4 `progressive_disclosure` offer commission is therefore a prerequisite for a complete Level 4 experience, not an optional enhancement. It must appear on the v1 content commissioning checklist as a required deliverable.

**Implication 2 — Commission block pending Document 6:**

`progressive_disclosure` module type Content Module nodes are not commissionable at v1 launch until the progressive disclosure UX specification in Document 6 is approved. [Document 4, Section 8.4 — D8-Flag-07 resolution] The Level 4 `progressive_disclosure` slot is architecturally guaranteed but commissioning-blocked until Document 6 approval. This is a named dependency: Document 6 approval → `progressive_disclosure` commission unblocked → Level 4 completeness achievable.

**Implication 3 — Transitional state experience quality (Al-2):**

Until Document 6 is approved and the commission block is lifted, the Level 4 page renders five guaranteed slots — `hero`, `benefits`, `cta`, `narrative`, `trust_signals` — without its primary conversion mechanism. The visitor has no explicit classification pathway. The `cta` slot serves as the fallback conversion element: the brand awareness CTA is a meaningful next step that can move the visitor deeper into the site and accumulate behavioral signal, but it does not produce the zero-party declaration that `progressive_disclosure` is designed to generate. A visitor who clicks a brand CTA and navigates further may eventually accumulate sufficient behavioral signal for Level 3 routing; a visitor who responds to a `progressive_disclosure` prompt can achieve classification in a single interaction. The transitional-state Level 4 page is a functional brand experience, not an incoherent one — but its conversion efficiency for classification is materially lower than the complete Level 4 experience. Lift measurements taken during the transitional period will understate Level 4's classification contribution. The Analytics team should record the Document 6 approval date as the measurement periodization boundary.

---

### 8.6 Commissioning Checklist for Level 4 Completeness

The following checklist is the content team's reference for commissioning the Level 4 experience. It is organized in two tiers: minimum Level 4 (five slots, no `progressive_disclosure`) and complete Level 4 (six slots, including `progressive_disclosure`). Optional enhancements are listed separately.

**Minimum Level 4 — 5 guaranteed slots (no primary conversion mechanism):**

| Node | Module type | Description | Count |
|---|---|---|---|
| Level 4 brand-default hero | `hero` | Brand hero offer; firmographic variants optional but not required for minimum | 1 (+ optional firmographic variants per vertical) |
| Level 4 brand-default benefits | `benefits` | Solution-agnostic benefits statement; no solution category | 1 |
| Level 4 brand awareness CTA | `cta` | Brand-level CTA; no role or solution specificity | 1 |
| Level 4 brand value proposition narrative | `narrative` | Generic brand value proposition; no role or solution specificity | 1 |
| Level 4 brand trust signals | `trust_signals` | General security and compliance overview | 1 |

**Complete Level 4 — 6th slot (primary conversion mechanism):**

| Node | Module type | Description | Count | Dependency |
|---|---|---|---|---|
| Level 4 TAL-context invitation prompt | `progressive_disclosure` | TAL-context invitation per solution category, or single cross-category brand prompt if solution category is unknown at Level 4 | 1 per active solution category (5 at v1) or 1 cross-category | **BLOCKED — Document 6 progressive disclosure UX specification approval required before commissioning** |

**Optional Level 4 enhancements:**

| Node | Module type | Description | Count | Notes |
|---|---|---|---|---|
| Level 4 industry-relevant ungated assets | `gated_assets` | Ungated content matched to TAL-represented verticals | 2–3 per major vertical | Conditional; `gated_assets` slot does not render until commissioned |
| Level 4 industry-level problem framing | `problem_framing` | Industry-vertical problem description | 1 per major vertical in TAL | Named optional enhancement from Section 8.3; high credibility value for TAL-matched visitors |

---

*End of Section 8. D5-Flag-03 resolved. Section 3 remains the authority for per-module Level 4 offer matching logic. Document 6 owns the progressive disclosure UX specification that must be approved before the `progressive_disclosure` commission block (D8-Flag-07) lifts. Section 9 specifies suppression activities that affect which Level 4 visitors are routed to Level 5 rather than receiving the Level 4 experience specified here.*

---


## Section 9: Edge Cases and Suppression Rules

> **Depends on:** Document 3 Section 1.3 (account status classification, trial/POC exception), Section 8.2 (account-level program suppression), Section 8.3 (page-level and surface-level suppression — authority); Document 2 Section 4.3 (post-sale noise filter, trial/POC exception, Filter 4 surface exclusion); Document 5 Section 1.2 (differential_insufficient Priority 0 override); Document 5 Section 4.3 (compound override audience definitions); Document 5 Section 4.8 (6200–6299 range reservation); Document 5 Section 5.4 Case 2 (classification_mismatch flag); Document 5 Section 7.7 (holdback and Outreach interaction)

---

### 9.1 Post-Sale Surface Handling

**Standard post_sale (acquisition suppressed):**

Activation conditions: `tal_program_status = post_sale` AND `tal_upsell_override_active = False`.

The primary suppression mechanism is AEP audience segment exclusion, not a dedicated Target suppression activity. Post-sale accounts are excluded from all acquisition cohort segment definitions in AEP — the `education`, `acquisition`, `progression_early_to_mature`, and `progression_win_now` cohort audience segments all include `tal_program_status ≠ post_sale` as a segment condition. A post-sale visitor therefore never satisfies any acquisition activity's audience gate. They pass through the entire activity priority sequence — 1000s through 5999, including holdback activities at 5951–5954 — matching nothing, and reach the Level 5 global default at priority 6999.

The visitor receives the Level 5 default brand experience. Not Level 4 — even though the visitor is a known TAL account member, the program does not serve them an account-level personalized experience. They are not acquisition targets. The Level 4 account activities (6001–6004) are scoped to active acquisition cohorts; post-sale accounts are not members of those cohorts.

Behavioral signals continue to be collected per consent rules, but the post-sale scoring suppression [Document 3, Section 8.2; Document 2, Section 4.3] prevents those signals from entering the acquisition scoring pipeline. Signal collection without scoring contribution is the correct post-sale behavioral state — the data is retained for future use (e.g., renewal or expansion programs) but does not affect acquisition personalization.

**upsell_override_active = True (post_sale with upsell active):**

Activation conditions: `tal_program_status = post_sale` AND `tal_upsell_override_active = True`.

These visitors are excluded from all acquisition cohort audiences (same mechanism as standard post-sale) and therefore do not match any acquisition activity. Without a dedicated activity, they would fall through to Level 5 at priority 6999. That is the wrong outcome — upsell override visitors are intended for a distinct upsell personalization experience.

Document 5 specifies the routing rule: when `tal_upsell_override_active = True`, the visitor is directed to the upsell override activity at priority 6201 (Section 9.7) before the Level 5 global default fires. The upsell personalization experience served by that activity is out of scope for Document 5 at v1 — it is a distinct personalization program configured by RevOps, not Marketing Ops. Document 5 specifies where in the evaluation sequence the routing diversion occurs; RevOps owns what the visitor receives at that diversion point.

**Trial/POC exception:**

Accounts with `tal_program_status = active_prospect` (the computed override applied to trial and POC accounts per Document 3, Section 1.3 and Document 2, Section 4.3) route through the standard Section 1 cascade — they are not in the post-sale suppression path. This exception prevents suppression misapplication: a trial account in active evaluation should receive role-appropriate personalization, not the post-sale default. Ensure that the `active_prospect` override is applied before the suppression check at session start. [Document 3, Section 1.3]

---

### 9.2 Page-Level and Surface-Level Suppression

Document 3, Section 8.3 is the authority for page-level and surface-level suppression rules and implementation details. Section 9 specifies the routing consequences only.

**Hard suppression pages (careers, IR, press, legal):**

Target does not evaluate any activity for pages in the hard suppression URL-pattern list. No audience is checked, no offer is served, no personalization event fires. The visitor receives the page's standard CMS content — the kalder.com default — with no Target overlay. This is not a Level 5 routing event; it is a Target exclusion. The Level 5 global default activity at priority 6999 does not fire for hard suppression pages — Target is not invoked at all.

Behavioral signal collection is suppressed for hard suppression pages: engagement events from these URL paths are tagged with the surface designation and filtered from scoring engine input before entering the pipeline. [Document 2, Section 4.3, Filter 4 — surface exclusion]

The visitor's classification state is unchanged. `confidence_tier` and `role_classification` set at session start remain in effect; hard suppression pages do not reset or modify the session's classification state. A visitor navigating from a product page (where they received Level 2 personalization) to the Careers page and then back to a product page retains their Level 2 classification on return.

**Soft suppression surfaces (community, support forums):**

The visitor receives their current personalization level on these pages — the experience is not degraded to Level 5. If a visitor is at Level 2 in their session, they receive Level 2 on soft suppression surfaces.

Behavioral signal collection is retained: engagement events from community and support surfaces are captured in the Segment event stream.

Acquisition scoring contribution is suppressed: events from surfaces with `exclusion_flag: suppress_acquisition_scoring` in `WEBSITE_SURFACES` [data model §20] are filtered by the pre-scoring pipeline before reaching the scoring engine. The behavioral record is retained; the scoring contribution is zeroed out. [Document 2, Section 4.3, Filter 4]

Routing consequence: a visitor who navigates exclusively through community and support pages in a session will not see their `confidence_tier` change as a result of that session's activity. Their prior classification state persists. They are served at whatever level their accumulated prior-session classification warrants, but they will not advance toward Level 1 via community engagement alone.

---

### 9.3 Multi-Solution-Category Visitors

A visitor who has accumulated behavioral signals for two or more solution categories requires a deterministic rule for which solution category context governs their experience on any given page.

**Governing rule: the page's solution category context, not the visitor's dominant solution category.**

Each page on kalder.com exists within a solution category URL space (or the brand/home URL space for non-solution pages). When a visitor lands on a page, the program reads the visitor's classification profile keyed to the page's solution category: `(contact_id, [page_solution_category])` for Layer 3 visitors, or `(anonymous_id, [page_solution_category])` for Layer 1. The visitor's classification for other solution categories is not consulted.

**Examples:**

A visitor with `confidence_tier = HIGH` for `customer_engagement` and `confidence_tier = MEDIUM` for `it_operations` who navigates to an IT Operations solution page is evaluated against their `(contact_id, it_operations)` classification key. They receive Level 3 — MEDIUM confidence for `it_operations` is insufficient for Level 2. Their HIGH confidence for `customer_engagement` does not elevate their `it_operations` page experience to Level 1 or Level 2. Personalization is per-(visitor × page_solution_category), not per-visitor across all solution categories.

The same visitor navigating to a Customer Engagement solution page is evaluated against their `(contact_id, customer_engagement)` classification key and receives Level 1 (HIGH confidence, complete coverage category at v1).

**Home page and non-solution-category pages (N-2):**

For pages not scoped to a specific solution category, the program uses the visitor's `tal_solution_interest_flags` from the account-plane profile to determine which solution category context is most relevant. The selection sequence is:

1. If `tal_solution_interest_flags` indicates a single dominant solution category: that category governs. The visitor's classification under that category's key determines fallback level.
2. If `tal_solution_interest_flags` indicates multiple solution categories at comparable priority: use the `role_confidence_score` at the `(contact_id, solution_category)` key as the tiebreaker — the solution category for which the visitor holds the highest `role_confidence_score` in their AEP classification profile governs. This is the most readily available and implementation-stable proxy for accumulated signal strength across session history. If two solution categories produce identical `role_confidence_score` values, the most recently scored category governs (the category whose classification key was last updated, per the `classification_updated_at` timestamp in the AEP contact profile).
3. If no solution interest signal exists (no `tal_solution_interest_flags` set): the visitor has no identifiable solution category context. Route to Level 4 (TAL-identified, no solution signal) or Level 5 (non-TAL), per Section 1 standard cascade.

This rule produces a deterministic outcome for every possible `tal_solution_interest_flags` state, including null. The program does not speculate about solution category on non-solution pages — it uses the account-plane interest signal when available and falls back to Level 4 when not.

Section 9 specifies the classification context governance rule only. Whether the web experience surfaces solution-category navigation that reflects the visitor's multi-category profile is a Layer 3 experience design decision not specified here.

---

### 9.4 `differential_insufficient` Mid-Session State Change

Section 1.2 established the Priority 0 override for `differential_insufficient = True`. Section 9 specifies what happens when this flag changes value mid-session.

**True → False (role ambiguity resolves):**

A visitor arrives with `differential_insufficient = True`. Target routes them to Level 3 via the `differential_override_[cohort]` compound audience at priority 1001–1004. During the session, additional behavioral signals sharpen the role differential — the top role pulls ahead by more than 10 points. The scoring engine re-scores and produces `differential_insufficient = False`.

At the visitor's next page navigation, Target reads the updated AEP profile. The `differential_override_[cohort]` compound audience condition is no longer satisfied (`differential_insufficient ≠ True`). Standard fallback level routing from Section 1 resumes. The visitor's updated `confidence_tier` determines their new fallback level, which may be Level 2 or Level 1 if MEDIUM or HIGH confidence was reached in the re-score. A visitor can jump from Level 3 to Level 1 at a single page navigation if the re-score warrants it. (N-3)

**False → True (new signals create ambiguity):**

A visitor arrives with `differential_insufficient = False` and is routing at Level 2 or Level 1. Additional signals during the session narrow the role differential to within 10 points. The re-score produces `differential_insufficient = True`.

At the visitor's next page navigation, Target reads `differential_insufficient = True` and the `differential_override_[cohort]` compound audience condition is now satisfied. Priority 0 override fires. The visitor routes to Level 3 — a drop from Level 1 or Level 2 at a single page navigation. This is not a system failure. It is the scoring model correctly recognizing that a previously clear role classification has become ambiguous with new evidence, and the decisioning system responding with the conservative Level 3 experience rather than continuing to serve a now-uncertain role classification at higher specificity. (N-3)

Both direction transitions fire at next page navigation — the same timing constraint as Section 5.5. Target does not re-evaluate audience conditions mid-page-render.

---

### 9.5 v1 ML Classifier Coverage Gap: User and Ratifier Roles

The v1 ML classifier covers Champion, Economic Buyer, and Influencer. User and Ratifier are not covered at v1 — labeled training data is insufficient for these roles at launch. Contacts whose behavioral patterns suggest User or Ratifier role do not receive ML classifier output for those roles.

**Routing consequence:**

Visitors whose behavioral profile suggests User or Ratifier follow the Tier 3 behavioral-only classification path:

- HIGH confidence via Tier 1 (ML classifier output) is not achievable for User or Ratifier at v1 — the Tier 1 pathway for these roles does not exist
- HIGH confidence via Tier 2 (zero-party self-identification + behavioral confirmation via progressive disclosure response) is available regardless of ML classifier coverage — the zero-party pathway is not gated on ML classifier output
- The effective ceiling for a User or Ratifier visitor classified via behavioral signals alone is MEDIUM — Tier 3 behavioral scoring can reach MEDIUM but cannot reach HIGH without Tier 1 or Tier 2 confirmation

**Practical implication:** Level 1 (HIGH confidence, role-assumptive experience) is reachable for User and Ratifier visitors only via the Tier 2 pathway — a progressive disclosure response that self-identifies the role, combined with behavioral confirmation. Level 2 (MEDIUM confidence, role-influenced experience) is the maximum depth reachable through behavioral signal accumulation alone for these roles.

This is a **named v1 limitation**, not a permanent constraint. When ML classifier coverage for User and Ratifier is added, the Tier 1 pathway becomes available and HIGH confidence via behavioral + ML is achievable for these roles. Platform engineers and marketing ops analysts should not diagnose User and Ratifier visitors consistently receiving Level 2 maximum experiences as a system defect — it is the expected behavior at v1.

---

### 9.6 `classification_mismatch` Flag and Sales Activation Layer

Section 5.4 Case 2 defined `classification_mismatch = True`: set when the Demandbase firmographic role inference differs from the behavioral top-scoring role. The visitor's web experience routing is governed by the behavioral classification — the `classification_mismatch` flag does not change the fallback level or the content served on kalder.com. That routing specification is complete in Sections 1 and 5. (G-1)

Section 9 specifies the third function of the flag: sales intelligence surfacing to the AE via the Outreach integration.

**Sales activation routing:**

When `classification_mismatch = True` is present on a contact's AEP profile, the AEP-to-Outreach sync writes the flag as a contact attribute in Outreach. The triggered notification delivered to the assigned AE reads:

> Classification note for [Contact Name] at [Account Name]: behavioral activity patterns suggest **[behavioral_role]** role, but firmographic title data suggests **[firmographic_role]**. Before your next outreach touch, it may be worth reviewing their recent page activity to determine which role frame is more accurate. This note is informational — it does not block or modify your active sequence.

The notification specifies: (a) both the behavioral role and the firmographic role so the AE has the full picture, (b) a concrete action — review recent page activity, not a vague "investigate" — to help the AE assess which frame is more accurate, and (c) that the notification is advisory and does not block any sequence or require a response. (Sh-1)

The `classification_mismatch` flag does not produce any change to the visitor's personalization experience. kalder.com continues to serve content calibrated to the behavioral classification. The Outreach notification exists because an AE approaching a contact as a Champion when the contact's title is CFO — or vice versa — is a conversation calibration risk that the program surfaces proactively rather than leaving to the AE to discover mid-call.

---

### 9.7 Target Suppression Activity Configuration (6200–6299 Range)

Section 4 reserved priority range 6200–6299 for suppression activities. This section specifies what is configured in that range at v1 and how the range interacts with the primary suppression mechanism.

**Primary mechanism — audience exclusion:**

Standard post-sale suppression does not require a dedicated activity in the 6200–6299 range. Post-sale accounts are excluded from all acquisition cohort audience segment definitions in AEP. They never satisfy any acquisition activity's audience gate and pass through the entire 1000–5999 priority sequence without matching anything. They reach the Level 5 global default at 6999 via the absence of any matching activity — not via an explicit suppression activity. The 6200–6299 range does not need to be populated for this case to work correctly. (G-2 context: the within-range sub-priority encoding from the personalization activity convention does not apply to this range; 6200–6299 activities use sequential assignment within the range, not the axis × cohort × module index encoding.)

**When a dedicated suppression activity is required:**

A 6200-range activity is needed when a visitor passes the exclusion conditions for all acquisition activities but should not fall through to Level 5. The upsell override case is the only such case at v1: `tal_program_status = post_sale AND tal_upsell_override_active = True` visitors are excluded from acquisition cohort audiences and would reach Level 5 without intervention.

**v1 suppression activity inventory:**

| Priority | Activity Name | AEP Audience Gate | What Visitor Receives |
|---|---|---|---|
| 6201 | `upsell_override_active` | `tal_program_status = post_sale` AND `tal_upsell_override_active = True` | Upsell personalization experience — specification and offer content deferred to RevOps configuration; this activity's presence routes upsell override visitors before the Level 5 global default (6999) fires |

The 6200–6299 range may be populated with additional suppression activities as the program scales — for example, explicit competitor account suppression or regional embargo suppression. At v1, only the upsell override activity at 6201 is defined. All other suppression is handled by AEP audience exclusion, and no additional 6200–6299 activities are required.

---

*End of Section 9. Document 3 Section 8 is the authority for the full suppression architecture. Section 10 specifies the `pending_solution_fallback` path, which governs visitors in solution categories where coverage status is `pending` or `constructed` — a related but distinct edge case not covered here. Section 7 specifies holdback group configuration; holdback visitors who are also post-sale are excluded from holdback activities by virtue of being excluded from all acquisition cohort audiences.*

---


## Section 10: `pending_solution_fallback` Behavior

> **Fulfills forward references from:** Section 1.4
> **Depends on:** `kalder_data_model_s0_s1.py` §4 FALLBACK_CASCADE (`pending_solution_fallback` definition, `apply_firmographic_bonus: False`, logging requirement); Document 4 Section 7.2 (four-state COVERAGE_STATUS_HIERARCHY), Section 7.4 (coverage gap monitoring), Section 7.6 (v1 launch coverage state), Section 8.5 (coverage tracking pipeline); Document 5 Section 1.1 (two-constraint model), Section 1.4 (`pending_solution_fallback` summary), Section 1.5 (v1 coverage state table), Section 3.11 (`progressive_disclosure` level activation), Section 5.3 (firmographic bonus activation conditions)

---

### 10.1 The Two-Constraint Model in the Coverage Context

Section 1.1 established that personalization depth is governed by two independent constraints that must both be satisfied simultaneously. Section 10 applies that model to the coverage dimension.

**Constraint A — Role confidence** (confidence tier and `differential_insufficient` state) is produced by the classification pipeline: behavioral scoring, ML classifier output, and zero-party declarations. Constraint A is unaffected by `pending_solution_fallback`. A HIGH-confidence Champion in a pending solution category is correctly classified. Their behavioral score, Tier 1 ML classifier output, and Tier 2 zero-party confirmations are the same values they would carry in a fully-covered category. The classification pipeline produces the same output regardless of coverage state.

**Constraint B — Coverage availability** (`solution_category_coverage_status` for the visitor's active solution category) is the constraint that `pending_solution_fallback` governs. When Constraint B is not met, the routing path is `pending_solution_fallback` regardless of how strong Constraint A is. The MEDIUM ceiling is a coverage constraint, not a classification judgment.

What changes under `pending_solution_fallback` is experience routing only. The classification output is stored in AEP at its actual values and will govern the experience the moment coverage advances. A visitor subject to `pending_solution_fallback` is not underclassified — they are correctly classified and underserved by a content inventory constraint that is temporary and resolvable.

---

### 10.2 Four-State Coverage Model: Routing Outcomes by State and Visitor Identification

The following table is the complete routing outcome specification for all combinations of coverage state and visitor identification state. It supersedes the v1-specific summary in Section 1.5 by specifying the general model; Section 1.5 remains the authority for the v1 launch state specifically.

| Coverage Status | Non-TAL visitor | TAL, no solution signal | TAL + solution signal | TAL + classified contact |
|---|---|---|---|---|
| `pending` | Level 5 | Level 4 | Level 3 (MEDIUM ceiling active — Level 2 and Level 1 unavailable regardless of classification confidence) | Level 3 (MEDIUM ceiling applies; HIGH-confidence visitors route to Level 3, not Level 1 or Level 2) |
| `constructed` | Level 5 | Level 4 | Level 4 (offer catalog absence — minimum module types for a coherent Level 3 experience are not all present in approved state; per-tuple gate demotes to Level 4) | Level 4 (same reason; MEDIUM ceiling also active via `pending_solution_fallback`, but the governing constraint is offer catalog absence) |
| `partial` | Level 5 | Level 4 | Level 3 (`pending_solution_fallback` deactivated; Level 2 and Level 1 unavailable — role-variant nodes not yet present in offer catalog) | Level 3 (same — role-variant content does not exist; MEDIUM and HIGH confidence visitors route to Level 3 via per-tuple offer catalog gate, not via `pending_solution_fallback` ceiling) |
| `complete` | Level 5 | Level 4 | Level 3 (LOW/UNKNOWN confidence) | Level 1 or Level 2 per classification confidence; per-tuple offer catalog gate (Section 1.6 Step 5) applies within complete category |

**`constructed` state precision (G-2):** `constructed` differs from `pending` in mechanism, not just label. `pending` means no content nodes exist for this category. `constructed` means some nodes exist but the minimum required module types for a coherent Level 3 experience are not all in `approved` state — the offer catalog is partially populated but cannot satisfy a full Level 3 experience render. The governing constraint for `constructed` visitors with solution interest is offer catalog absence at Level 3: Target finds no complete Level 3 offer set, the per-tuple gate (Section 1.6 Step 5) demotes to Level 4, and the visitor receives Level 4. The `pending_solution_fallback` MEDIUM ceiling also applies to `constructed` (the activation condition includes `constructed` state per `§4 FALLBACK_CASCADE`), but it is secondary — the visitor would not reach Level 1 or Level 2 anyway because the Level 3 catalog absence prevents routing above Level 4 regardless of the ceiling.

**`partial` state precision (G-2):** At `partial`, `pending_solution_fallback` deactivates — the MEDIUM ceiling lifts. But a HIGH-confidence visitor in a `partial` category still routes to Level 3, not Level 1 or Level 2. The reason is different: role-variant nodes do not yet exist in the offer catalog. The per-tuple offer catalog gate finds no Level 1 or Level 2 offers for the visitor's `(role_classification, solution_category, buying_stage)` tuple and demotes to Level 3. This is not `pending_solution_fallback` — it is offer catalog absence at the tuple level. The experience outcome (Level 3 maximum) is the same as `pending` for a classified visitor, but the governing mechanism is distinct: `pending_solution_fallback` ceiling vs. per-tuple catalog absence.

---

### 10.3 The MEDIUM Ceiling: Scope and Firmographic Bonus Interaction

When `pending_solution_fallback` is active for a visitor's solution category, the MEDIUM confidence ceiling is absolute. This restatement from Section 1.4 adds the firmographic bonus interaction.

**Ceiling scope:** MEDIUM ceiling regardless of behavioral score, Tier 1 ML classifier output, or Tier 2 zero-party data. A visitor with a behavioral score of 90, a confirmed ML classifier output, and a zero-party self-identification cannot receive Level 1 or Level 2 for their pending solution category. The ceiling is a content availability constraint, not a signal quality constraint.

**Firmographic bonus suppression:** When `pending_solution_fallback` is active, the firmographic bonus (`+30` from `firmographic_confirmation_bonus`, `§12 SCORING_RULES Step 4`) is not applied for the pending category. This is specified in `§4 FALLBACK_CASCADE` as `apply_firmographic_bonus: False`. The rationale: the firmographic bonus amplifies role confidence toward MEDIUM or HIGH. Under `pending_solution_fallback`, a score that would cross the HIGH threshold via the bonus would still be ceiling-applied to MEDIUM for experience routing. Applying the bonus in this context adds signal to the scoring record without any corresponding experience benefit — it produces noise in the classification log without producing the experience the increased score would otherwise warrant. Suppression keeps the stored classification record clean and interpretable.

The `pending_solution_fallback` firmographic bonus suppression is an additional, independent condition layered on top of the Track 2 + consent compound rule from Section 5.3. Under current Track 2 pending status, the firmographic bonus is suppressed for all visitors regardless of `pending_solution_fallback` state. When Track 2 activates and `visitor_consent_state = full` is confirmed, the Track 2 + consent gate opens — but `pending_solution_fallback` suppression remains active for visitors in pending categories until those categories advance to `partial` or `complete`.

**Stored classification is unaffected by the ceiling:** The MEDIUM ceiling applies to experience routing only. `confidence_tier` and `role_confidence_score` in the AEP contact profile reflect the visitor's actual behavioral evidence — the ceiling does not modify these stored attributes. A HIGH-confidence Champion in a pending category has `confidence_tier = HIGH` and `role_confidence_score` at its actual value in their AEP profile. When coverage advances and `pending_solution_fallback` deactivates, the stored classification is immediately available for experience routing at Level 1. The visitor does not need to re-accumulate behavioral signal to reach the experience level their classification warrants. (N-1)

This is the critical operational distinction: an AEP data engineer writing classification attributes must not apply the MEDIUM ceiling to the stored `confidence_tier` value. The ceiling is a routing-layer constraint, not a profile-layer constraint. `confidence_tier = HIGH` is the correct value to write for a HIGH-confidence visitor regardless of their solution category's coverage state.

---

### 10.4 Coverage Status Upgrade: Automatic Propagation and Experience Upgrade Timing

When `solution_category_coverage_status` advances in AEP — from `pending` to `partial`, or from `partial` to `complete` — the routing change for affected visitors occurs automatically without manual Target reconfiguration.

**Propagation mechanism:**

The coverage tracking pipeline [Document 4, Section 8.5] triggers on any `Content Module` node `status` field transition to or from `approved` via Sanity webhook. The pipeline updates `solution_category_coverage_status` in AEP for the affected category. Target reads `solution_category_coverage_status` as a contact profile attribute at session start. The routing change fires on the next session start for all visitors whose solution interest maps to the advanced category.

**Timing:** The upgrade does not apply retroactively to in-progress sessions. A visitor mid-session when a category advances from `pending` to `partial` completes their current session at the pending-state routing depth. The upgrade fires at their next session start.

**What the upgrade means for classified visitors:**

A HIGH-confidence Champion in `employee_experience` who has been routing at Level 3 (MEDIUM ceiling, `pending_solution_fallback` active) is the analogue of a HIGH-confidence Champion in `customer_engagement` routing at Level 1. Both are correctly classified. The `employee_experience` visitor's next session after that category advances to `complete` routes to Level 1 immediately — the stored `confidence_tier = HIGH` and `role_classification = champion` from AEP are the inputs. No form fill, progressive disclosure response, or CRM match is required. Coverage advancement is the gate; the stored classification is the key that was already cut during the pending period.

At `pending → partial` transition: `pending_solution_fallback` deactivates; Level 3 becomes available via the standard cascade. Level 1 and Level 2 remain unavailable because role-variant nodes are not yet present.

At `partial → complete` transition: Level 1 and Level 2 become available per-tuple as individual `(role, buying_stage)` pairs clear the per-tuple offer catalog gate. Stored HIGH-confidence classifications are immediately eligible for Level 1 without re-accumulating signal.

The v1 period for visitors in pending categories is a classification accumulation period, not a lost window. Every behavioral session during `pending_solution_fallback` contributes to a stored classification that becomes actionable when coverage advances. The value of that accumulation is realized when the content inventory catches up.

---

### 10.5 `progressive_disclosure` Behavior Under `pending_solution_fallback`

Section 1.4 deferred this specification to Section 10.

**The question:** Should the `progressive_disclosure` module render for a HIGH-confidence Champion in a pending category? If so, which prompt variant?

**The answer:** Yes, per the standard Section 3.11 specification. The `progressive_disclosure` module's level activation is determined by the visitor's routing fallback level, not by their underlying classification confidence. A HIGH-confidence Champion in a pending category routes to Level 3 (MEDIUM ceiling, solution signal present, TAL-identified). The `progressive_disclosure` module renders at Level 3 with the initial role identification prompt — the same Level 3 prompt as any other Level 3 visitor.

**The incongruity and why it is correct (N-2):** This is intentionally incongruous. The visitor is actually HIGH-confidence — the system already has strong evidence for their role classification — yet the `progressive_disclosure` module presents a Level 3 "who are you?" prompt rather than the Level 2 "You seem to be a Champion — is that right?" confirmation prompt. The module does not know the visitor's underlying classification confidence; it knows only the fallback level.

This incongruity is acceptable and intentional for two reasons. First, the Level 3 prompt does not conflict with the visitor's actual classification — if they self-identify as Champion, they are confirming what the system already believes, and that confirmation upgrades their classification to Tier 2 (zero-party + behavioral confirmation). Second, and more importantly: that Tier 2 confirmation is stored in AEP immediately. It does not wait for coverage to advance. When the category reaches `complete`, the visitor arrives at their first eligible Level 1 session with Tier 2 confirmation already on record — they are immediately served the Level 1 role-assumptive experience without needing to respond to another prompt.

**Downstream benefit:** A HIGH-confidence Champion in a pending category who responds to the Level 3 `progressive_disclosure` prompt will not see an immediate experience upgrade — the category is still pending; Level 1 and Level 2 remain unavailable. But the Tier 2 confirmation is stored and waiting. When coverage advances, that visitor is the first in line for Level 1. The Level 3 prompt is, in this context, a pre-registration mechanism for Level 1 eligibility.

A reader who encounters a HIGH-confidence visitor receiving the Level 3 `progressive_disclosure` prompt should not diagnose this as a system defect. It is the correct behavior at the correct fallback level, with a downstream classification benefit that is invisible at the time of the interaction. (N-2)

---

### 10.6 Logging Requirement and Measurement Integration

`§4 FALLBACK_CASCADE` specifies a logging requirement: all `pending_solution_fallback` activation events must be flagged with `solution_key` and `visitor_id` for coverage gap tracking. Section 10 operationalizes this requirement.

**Log event fields:**

Each `pending_solution_fallback` activation produces a log event containing the following five fields:

| Field | Value | Implementation note |
|---|---|---|
| `solution_key` | The solution category where `pending_solution_fallback` is active | String identifier matching the `solution_category` enum in the data model |
| `visitor_id` | The contact's stable identifier | `contact_id` at Layer 3; `anonymous_id` at Layer 1. Use whichever is resolved at the time of the event |
| `confidence_tier` | The visitor's stored classification confidence at routing time | **Log the actual tier (HIGH, MEDIUM, LOW, or UNKNOWN), not the ceiling-applied tier.** A HIGH-confidence visitor in a pending category logs `HIGH`, not `MEDIUM`. See rationale below |
| `session_timestamp` | ISO 8601 timestamp of the session start at which the routing event fired | — |
| `coverage_status_at_event` | The coverage status of the category at the time of the event | One of: `pending`, `constructed`, `partial`. A `complete` category never produces a `pending_solution_fallback` event |

**Why log actual `confidence_tier`, not ceiling-applied tier (Ra-1):** The log's purpose is coverage gap tracking — it measures how many visitors are being underserved relative to their classification potential and at what confidence level. A log that records `MEDIUM` for every `pending_solution_fallback` visitor regardless of actual classification would obscure the true opportunity cost of the coverage gap. A log that records `HIGH` for HIGH-confidence visitors shows exactly what experience depth would have been delivered if the content were available. A concentration of `HIGH`-confidence `champion` events in `employee_experience` fallback logs is a directional signal to the content team that Champion content for that category should be prioritized in Gate 1 commissioning — that signal is invisible if the log records the ceiling-applied tier.

**Measurement integration:**

The `pending_solution_fallback` event log feeds the coverage gap tracking dashboard [Document 4, Section 7.4]. The event count per `solution_key` per 7-day rolling window is the leading indicator for content commissioning prioritization across all pending categories.

**Compound holdback + `pending_solution_fallback` state (K-1):** A visitor who is simultaneously in holdback (`holdback_group = True`) AND routing through `pending_solution_fallback` represents a compound measurement state that Document 7 must account for explicitly. These visitors are: in the control group for lift measurement, receiving Level 3 or Level 4 rather than the Level 1/Level 2 experience the treatment group receives, AND unable to receive Level 1/Level 2 even if they exited holdback — because coverage is pending. When Document 7 analyzes Level 3 lift measurements, the `pending_solution_fallback` event log provides the dimension needed to disaggregate: did a holdback visitor receive Level 3 because they were in the control group, or because they were in a pending category (or both)? An unadjusted Level 3 lift measurement that includes compound-state visitors in the holdback group will be conflated with the `pending_solution_fallback` routing effect. Document 7 inherits this disaggregation requirement. The `pending_solution_fallback` event log joined to the holdback group assignment log on `visitor_id` produces the compound-state population.

---

### 10.7 v1 State and Resolution Roadmap

The v1 launch coverage state is specified in Document 4, Section 7.6 and summarized in Document 5, Section 1.5. Section 10 adds the resolution path for each pending and partial category.

**`pending_solution_fallback` deactivation conditions by category:**

`pending → partial` transition: `pending_solution_fallback` deactivates. Level 3 becomes available for TAL-identified visitors with solution interest. Level 1 and Level 2 remain unavailable — role-variant nodes do not yet exist. Visitors who have accumulated HIGH or MEDIUM classification during the pending period immediately route to Level 3 on their next session. No re-accumulation required.

`partial → complete` transition: Level 1 and Level 2 become available per-tuple as individual `(role, buying_stage)` pairs clear the per-tuple offer catalog gate. Stored HIGH-confidence and MEDIUM-confidence classifications that accumulated during the `pending` and `partial` periods are immediately eligible for Level 1 and Level 2 respectively. No re-accumulation required.

**The v1 pending period as classification accumulation:**

Visitors who have been engaging with kalder.com during the v1 period in pending solution categories — `employee_experience`, `risk_compliance`, `ai_platform` (v1 pending at launch per Section 1.5) — have been accumulating behavioral signals that are scored and stored in AEP throughout that period. When those categories advance, the stored classification is the input to their upgraded experience. The `pending_solution_fallback` event log documents the scale of this stored opportunity: the number of HIGH-confidence visitors in pending categories is the upper bound on Level 1-eligible contacts who will receive an immediate experience upgrade when coverage advances.

---

*End of Section 10. Section 1.4 forward references are fulfilled. `§4 FALLBACK_CASCADE` logging requirement is operationalized in Section 10.6. Document 4 Section 8.5 is the authority for the coverage tracking pipeline that triggers AEP attribute updates. Document 7 inherits the compound holdback + `pending_solution_fallback` disaggregation requirement specified in Section 10.6.*

---

