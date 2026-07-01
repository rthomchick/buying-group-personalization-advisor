# Evaluator step_id Collision Table

Test plan for the FLAG/HOLD evaluator fix. Every row below is a test case; the
correct assertion for each row is determined by its failure-mode tag. Compiled from
`build1-advisor/lib/guided/flag-hold-evaluator.ts`, cross-checked against
`build1-advisor/data/workflows/onboarding_18step.json`,
`commissioning_12step.json`, and `monitoring_8step.json`.

## Root cause

`WorkflowStepDefinition` has no `workflow_id` field. `evaluateStep()` (called from
`state-machine.ts`) is handed a single resolved `step` object with a bare numeric
`step_id` and no indication of which workflow it came from. Every per-code evaluator
function (`evaluateH01`, `evaluateH02`, `evaluateH03`, `evaluateF01`, `evaluateF04`,
`evaluateF05`, `evaluateF06`, etc.) branches on `step.step_id === N`, where `N` is one
of Onboarding's 18 step numbers. Since Commissioning (steps 1–12) and Monitoring
(steps 1–8) reuse the same numbering range, every colliding `step_id` runs
Onboarding-specific logic against Commissioning/Monitoring data.

**Dispatch is by CODE, not by which codes the colliding Onboarding step happens to
define.** A step's `H-02` always calls `evaluateH02`, regardless of whether the
Onboarding step at that same `step_id` uses `H-02` itself. This distinction was
missed once during authoring (Commissioning/Monitoring Step 6 draft) and caught and
corrected before commit; it was missed again during initial table compilation
(Monitoring Step 5) and corrected here. Treat it as the most common transcription
error when extending this table.

## Failure-mode definitions

- **mis-fires-wrong-condition** — returns `true`/`false` based on null-ness or
  similar, which is sometimes true and sometimes false on real input, but unrelated
  to the actual corpus condition. Neither reliably blocks nor reliably passes.
- **fails-closed-spurious** — returns `true` (blocks) under conditions that hold for
  almost any realistic non-boolean payload — structurally near-always-true.
- **fails-open** — no branch exists for this `step_id`; the function's fallback is a
  bare constant (`return false`), so the code can never fire regardless of input.

A fix that only adds workflow-scoped dispatch does not, by itself, fix any of these
three — it only ensures the lookup reaches the right *workflow's* step. The
destination logic (what the evaluator function actually computes once dispatched)
must independently be fixed and tested per failure mode. That is what this table is
for.

## Content Commissioning (`commissioning_12step.json`) — collides with Onboarding step_id 1–12

| step_id | Code | Colliding Onboarding field (`validation_type`) | Failure mode | Detail |
|---|---|---|---|---|
| 1 | — | `tal_domain` | n/a | No gates authored on this step |
| 2 | H-01 | `tal_member` (None) | mis-fires-wrong-condition | `evaluateH01` → `isNullish(value)` |
| 3 | H-01 | `tal_account_type_source` (`mapping_table`) | mis-fires-wrong-condition | `evaluateH01` → `isNullish(value)` |
| 3 | H-02 | same | fails-closed-spurious | `evaluateH02` mapping-table branch; this step defines no `allowed_values`, so membership against `[]` is always-true for any non-null value |
| 4 | H-01 | `tal_program_status` (`mapping_table`) | mis-fires-wrong-condition | `evaluateH01` → `isNullish(value)` |
| 5 | H-01 | `tal_region` (None) | mis-fires-wrong-condition | `evaluateH01` → `isNullish(value)` |
| 5 | H-02 | same | fails-closed-spurious | `evaluateH02` boolean-type fallback (no `validation_type`); near-always-true for a non-boolean payload |
| 6 | H-01 | `tal_marquee` (None) | mis-fires-wrong-condition | `evaluateH01` → `isNullish(value)` |
| 7 | H-01 (conditional gate) | `tal_channel` (`enum`) | mis-fires-wrong-condition | `evaluateH01` ignores `validation_type` entirely; always the same null-check |
| 8 | H-01 | `tal_new_logo_eligible` (None) | mis-fires-wrong-condition | `evaluateH01` → `isNullish(value)` |
| 8 | H-02 | same | fails-closed-spurious | boolean-type fallback |
| 8 | H-03 | same | **fails-open** | `evaluateH03` has no `step_id===8` branch → unconditional `return false`; can never fire |
| 9 | H-01 (task-2-scoped) | `tal_open_pipeline` (None) | mis-fires-wrong-condition | coincidentally close to "is the field null" but cannot validate enum membership against HIGH/MEDIUM/LOW/UNKNOWN |
| 9 | H-02 (task-1-scoped) | same | fails-closed-spurious | boolean-type fallback |
| 10 | H-01 | `sfdc_opportunity_created`/`sfdc_opportunity_stage` (`mapping_table`) | mis-fires-wrong-condition, **different shape** | Onboarding step 10 has its OWN `step_id===10` branch in `evaluateH01` (`value === true && mappingTableProvided !== true`) — not the generic fallthrough used at steps 2–9. Same category, different specific wrong condition; a test must assert against this compound condition specifically. |
| 10 | H-02 (conditional, mirrors Gate 3) | same | fails-closed-spurious | mapping-table branch, empty `allowed_values` |
| 10 | H-03 | same | **fails-open** | no `step_id===10` branch in `evaluateH03` |
| 11 | — | `visitor_consent_state` | n/a | No gate logic authored at all (genuine no-gate case, not dormant-gate — no `*_pending` fields exist on this step) |
| 12 | H-01–H-04 | Track 2 signal consent status | mis-fires-wrong-condition (would-be), **third distinct collision shape** | Onboarding step 12 has its OWN special cases in BOTH `evaluateH03` (Track 2/DPA consent check) and `evaluateF04` — a complete domain mismatch applying consent/DPA logic to sprint-closure coverage/exclusion-log verification |
| 12 | F-01 | same | **fails-open, verified by reading the function body** | `evaluateF01` branches `step_id===2/4/18` only; 12 matches none, falls through to bare `return false` |

## Signal Monitoring (`monitoring_8step.json`) — collides with Onboarding step_id 1–8

| step_id | Code | Colliding Onboarding field (`validation_type`) | Failure mode | Detail |
|---|---|---|---|---|
| 1 | H-01 | `tal_domain` (None) | mis-fires-wrong-condition | `evaluateH01` → `isNullish(value)` |
| 1 | H-02 | same | fails-closed-spurious | boolean-type fallback |
| 2 | H-01 | `tal_member` (None) | mis-fires-wrong-condition | `evaluateH01` → `isNullish(value)` |
| 3 | H-01 | `tal_account_type_source` (`mapping_table`) | mis-fires-wrong-condition | `evaluateH01` → `isNullish(value)` |
| 3 | H-02 | same | fails-closed-spurious | mapping-table branch, empty `allowed_values` |
| 4 | H-01 | `tal_program_status` (`mapping_table`) | mis-fires-wrong-condition | `evaluateH01` → `isNullish(value)` |
| 5 | H-01 (corpus-gap-affected; see Desk 2) | `tal_region` (None) | mis-fires-wrong-condition | `evaluateH01` → `isNullish(value)`. This finding is independent of the corpus's own missing-threshold gap — the evaluator defect and the corpus gap are two separate problems on the same HOLD. |
| 5 | H-02 | same | fails-closed-spurious | `evaluateH02` boolean-type fallback — dispatches by CODE to `evaluateH02`, not to `evaluateH01`, regardless of which codes Onboarding step 5 itself defines (correction applied during table compilation) |
| 5 | F-01 | same | **fails-open** | `evaluateF01` branches `===2/4/18` only |
| 6 | H-01 | `tal_marquee` (None) | mis-fires-wrong-condition | dispatches to `evaluateH01` by code regardless of Onboarding step 6's own code inventory (which has only H-02) — `isNullish(value)` |
| 6 | H-02 | same | fails-closed-spurious | dispatches to `evaluateH02` by code — boolean-type fallback |
| 7 | H-01 | `tal_channel` (`enum`) | mis-fires-wrong-condition | `evaluateH01` ignores `validation_type` |
| 7 | F-01 | same | **fails-open** | `evaluateF01` branches `===2/4/18` only |
| 8 | H-01 | `tal_new_logo_eligible` (None) | mis-fires-wrong-condition | dispatches to `evaluateH01` by code — `isNullish(value)` |

## Tally across all 20 authored steps

- **mis-fires-wrong-condition**: 13 occurrences — every H-01 code, without exception. The generalization "H-01 always mis-fires because it only checks null-ness" held universally across both workflows.
- **fails-closed-spurious**: 7 occurrences — every H-02 code against an Onboarding collision with `validation_type: None` or an empty-`allowed_values` `mapping_table`/`enum` branch.
- **fails-open**: 5 occurrences — Commissioning Step 8 H-03, Step 10 H-03, Step 12 F-01; Monitoring Step 5 F-01, Step 7 F-01.

No row in either workflow exercises an evaluator branch that happens to be
coincidentally correct. Every populated `hold_triggers_pending` / `flag_triggers_pending`
entry in both files would misfire if moved into the live `hold_triggers` / `flag_triggers`
arrays today.
