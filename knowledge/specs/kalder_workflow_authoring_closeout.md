# Kalder Workflow Authoring — Close-Out Package

Scope: authored `build1-advisor/data/workflows/commissioning_12step.json` (12 steps)
and `monitoring_8step.json` (8 steps, restructured from a 10-step file with two
non-corpus bookend steps). All content derived from the nine numbered corpus
documents at `knowledge/corpus/`; no code, state machine, or evaluator logic was
modified except the reference-string updates listed in Desk 1's dependency chain.

---

## Desk 1 — Evaluator Fix (routes to: build/code session)

The full test plan is **`knowledge/specs/evaluator_collision_table.md`** — do not
duplicate it here. Summary: every populated `hold_triggers_pending` /
`flag_triggers_pending` entry across both workflows (20 steps, ~25 individual codes)
would misfire today if installed into the live `hold_triggers` / `flag_triggers`
arrays, because the evaluator (`lib/guided/flag-hold-evaluator.ts`) dispatches
HOLD/FLAG codes by a bare numeric `step_id` with no workflow scoping, and
Commissioning/Monitoring reuse Onboarding's 1–18 numbering range. Three failure
modes were found and tagged per row: **mis-fires-wrong-condition** (13 rows — every
H-01, since it only checks null-ness), **fails-closed-spurious** (7 rows — every
H-02 against a `None`/empty-`allowed_values` collision), **fails-open** (5 rows —
`evaluateH03` and `evaluateF01` have no branch for several colliding `step_id`s and
fall through to a bare `return false`).

### Fix specification — four requirements

1. **Workflow-scoped dispatch.** Key HOLD/FLAG evaluation on `(workflow_id,
   step_id)`, not `step_id` alone. Requires adding a `workflow_id` field to
   `WorkflowStepDefinition` (currently absent — confirmed by reading the type).
2. **Reachable, semantically-grounded branch per code per gate-defining step.**
   Every `evaluateH0N`/`evaluateF0N` function must have a real branch for every
   `(workflow_id, step_id)` combination that actually uses that code — not a bare
   fallback constant. `evaluateH03`'s unconditional `return false` for any
   unhandled `step_id` is the clearest violation: a fallback constant is never
   correct, it is just silently wrong in a way that produces no visible error.
3. **Per-step test asserting correct firing behavior per failure mode.** The
   collision table *is* this test plan — each row is a test case, and the
   correct assertion is determined by its failure-mode tag. A fix that only
   addresses requirement 1 and is naively retested ("does it dispatch to the
   right workflow now?") could pass while an H-02-shaped code is still
   fails-closed-spurious, or an H-03/F-01-shaped code is still fails-open,
   because workflow-scoped dispatch alone does not guarantee the *destination*
   logic is correct — it only guarantees the lookup no longer collides.
4. **Task-level granularity.** Commissioning Step 9 (`confidence_tier_minimum`
   Assignment) has two HOLDs scoped to different sub-tasks within one step
   (H-01 gates task 2, H-02 gates task 1 — confirmed by the corpus's own
   blockquote placement, not inferred). `StepSubmission` carries one
   undifferentiated value per step with no sub-task addressing. Requirements 1–3
   do not fix this — a step with task-scoped HOLDs cannot be evaluated correctly
   even after dispatch and branches are fixed, because the *submission shape
   itself* has nowhere to carry "which task is this value for." This is the only
   requirement that touches submission **structure** rather than evaluation
   **logic** — flag it as a different kind of change from 1–3.

### Dependency chain — why authoring completion is not usability

```
author content (DONE, this pass)
        │
        ▼
fix evaluator (requirements 1–4 above)
        │
        ▼
install dormant gates into live arrays
  (move hold_triggers_pending → hold_triggers,
   flag_triggers_pending → flag_triggers,
   per step — see Desk 3 for the no-gate exception)
        │
        ▼
workflows usable
```

All 20 authored steps across both files currently carry their gate content in
`hold_triggers_pending` / `flag_triggers_pending`, with the live `hold_triggers` /
`flag_triggers` arrays empty. **This is deliberate, not incomplete** — installing
now, before the evaluator fix, would silently activate the wrong logic documented
in the collision table. The Content Strategist persona's actual gap — having a
working, corpus-correct guided workflow for Commissioning and Monitoring — closes
only at the bottom of this chain, not at the top. Authoring completion is a
necessary but not sufficient condition.

One exception: Commissioning Step 10's three HOLDs may be a workflow-level *mirror*
of Sanity's own automated GROQ cross-document validation (Document 8 §3.6) rather
than an independent check this workflow's evaluator needs to originate — Sanity
blocks the `status: approved` transition regardless of whether this workflow's
evaluator ever runs. Whether these three HOLDs need to be load-bearing after the
fix (vs. UI/audit-log visibility only, surfacing a block Sanity already enforces)
is an open scope question for the fix session, not resolved here.

---

## Desk 2 — Corpus-Completeness Findings (routes to: corpus owner)

**1. Monitoring Check 5 — undefined weekly escalation threshold (open).**
Document 8 §5.2 Check 5 forward-references "the threshold defined in Section 12
(Incident Response)" for the weekly stale-account-**count** escalation condition.
Section 12 was read in full (all six subsections, 12.2–12.6: Signal Collection
Failure, Classification Accuracy Drop, Content Node Error, Sync Pipeline Failure,
Outreach Alert Payload) — none define a TAL-staleness incident scenario or any
numeric count threshold. This is distinct from the 72-hour **per-account**
staleness threshold (§CA Section 2.2.1), which is defined and fully operational —
finding the 72-hour value does not resolve this gap, because the gap is in a
different, second threshold. **Scope of impact:** blocks only Monitoring Step 5's
H-01 (the single-week-spike gate); H-02 (three-week trend) and F-01 (normal
log-and-monitor outcome) are fully operationalizable as authored. **Action:**
author the missing weekly-count threshold into §12, or correct the §5.2
cross-reference to point to wherever it is actually intended to live.

**2. Monitoring step count — resolved, not open.** The workflow file's own
`_known_discrepancy` field flagged a 10-vs-8 step count mismatch against the brief.
Document 8 §5.1 ("covers eight checks"), §5.2 (Check 1 through Check 8, each fully
specified), and §5.3 (an 8-row escalation table) all agree on 8; there is no corpus
concept of a session-open/session-close bookend. Resolved: file renamed
`monitoring_10step.json` → `monitoring_8step.json`, the two non-corpus bookend
steps removed, Checks 1–8 renumbered as step_id 1–8, and four reference sites
updated (`lib/session/session-state.ts` `WorkflowId` union,
`app/api/guided/route.ts` filename map, `components/guided/WorkflowSelector.tsx`
id and UI copy) — grep-confirmed clean of `monitoring_10step`/
`signal_monitoring_10step` outside two superseded `knowledge/specs/` planning docs
that the corpus supersedes per this session's brief. `tsc --noEmit` passes.

**3. Commissioning Step 12, condition (e) — cross-workflow dependency to verify.**
Sprint Closure's condition (e) (any `phase: converge` exclusion log entries are
reviewed and confirmed as *expected*, i.e. attributable to a concurrent Section 4
converge workflow, not unexpected) depends on that concurrent Section 4 (Converge
Content Commissioning Workflow) actually running and producing the exclusion log
entries the corpus describes. Section 4 was read for cross-reference purposes only
during this pass — it was **not authored** as a workflow in its own right. Condition
(e)'s correctness in practice depends on Section 4 behaving as the corpus
describes; flagged as a dependency to verify when/if a converge-side guided
workflow is built, not a defect in this pass's output.

---

## Desk 3 — Schema & Launch-Readiness Observations (routes to: later design / platform)

**1. `phase` field — required but with no clean meaning for two of three
workflows.** `phase: number` on `WorkflowStepDefinition` has no `?` (required) and
is read by no runtime logic or UI anywhere in the codebase — confirmed by
inspection, not assumed. Commissioning's Sprint Planning/Prerequisite-Check steps
(no corpus-numbered phase) and all of Monitoring (corpus describes the 8 checks as
parallel, not phased) can only satisfy this required field with a documented
placeholder value of `0`. **This is a schema smell**: the field should probably be
optional or accept an explicit not-applicable value rather than forcing a
0-with-a-note convention. Two *different meanings* were assigned to the same
literal `0` across the two files — do not transfer one file's reading onto the
other:
   - Commissioning's `phase: 0` = "pre-Phase-1 step in a workflow that DOES have
     phases 1–4" (Generate/Review/Approve/Publish-Sync/Closure, matching Document 8
     §3.1's own phase names).
   - Monitoring's `phase: 0` = "this workflow has NO phase structure at all"
     (parallel checks, not a lifecycle).

**2. D8-Flag-05 — GROQ validation load test (Platform Engineer, pre-production).**
All three GROQ cross-document validation functions (Commissioning Step 10) must be
load-tested under 10 simultaneous `status: approved` transitions, with a 2-second
per-node ceiling, before production commissioning opens. Not a per-node content
gate — a one-time platform readiness task, owned by the Platform Engineer, that
this authoring pass surfaces but does not own.

**3. D8-Flag-04 — single-point enforcement, sole backstop is a recurring human
audit.** The `phase: converge` pre-write exclusion check (Commissioning Step 11) is
enforced exclusively by the sync pipeline — no Adobe Target activity rule
duplicates it, by corpus design. Its only backstop is the **weekly catalog
integrity audit** (a recurring Platform Engineer practice, not part of either
authored workflow). This is an architectural single-point-of-failure by design,
not an oversight — flagged here as a known, accepted production-correctness
dependency this authoring pass's integrity story relies on entirely.

**4. Dormant-gate vs. no-gate — preserve the distinction on install.** Most steps
with corpus-grounded gates use `hold_triggers_pending` / `flag_triggers_pending`
(content designed, not yet installed). Commissioning Step 11 (Publish/Sync) is a
genuinely different case: it has **no** `*_pending` fields at all, because Document
8 §3.7 assigns this entire phase to automated pipeline behavior with no
practitioner-facing gate for diverge nodes. When the evaluator fix lands and
dormant gates are installed workflow-wide, Step 11 should receive nothing — it is
not an oversight to be filled in, it is a corpus-grounded absence.

---

## Appendix — Gate-Authoring Model (for reuse / reskin)

This pass converged on a model with three independent axes plus a prose layer.
Any future workflow authored against this corpus should reuse this model rather
than rederive it.

**Topologies** (structural — may require schema support to fully express):
- *universal-blocking* — gate applies unconditionally (Commissioning Gates 1–2).
- *conditional* — gate applies only under a stated sub-condition, e.g. module type
  (Commissioning Gate 3, Step 7's jtbd_code check).
- *in-step-remedy* — the failure's remedy is a procedure performed within the same
  step, not a referral elsewhere (Commissioning Gate 4).
- *two-independent-condition* — two distinct conditions with two distinct remedies,
  evaluated independently (Monitoring Checks 1, 3, 6).
- *two-tier-severity* — one metric, two severity thresholds on the same signal,
  lower tier logs, higher tier escalates (Monitoring Check 7).
- *three-outcome* — three mutually exclusive corpus-named branches, e.g.
  spike/trend/neither (Monitoring Check 5).
- *task-scoped* — gates address different sub-tasks within one step, not the step
  as a whole (Commissioning Step 9) — the one topology that exposed a submission-
  structure gap (Desk 1, requirement 4).
- *no-gate* — genuinely no practitioner-facing gate exists; do not author dormant
  placeholders for it (Commissioning Step 11).

**Code type:**
- *HOLD* — hard-required, no documented exception.
- *FLAG* — either a documented-exception path (Commissioning Step 12 condition a)
  or a corpus-named normal, non-failure outcome (Monitoring Check 5's "log and
  monitor," Check 7's Tier 1) — both are non-blocking, but for different reasons;
  name which one a given FLAG is.

**Granularity:** step-scoped (the default) vs. task-scoped (Commissioning Step 9).

**Remedy variants** — prose-level distinctions within a topology, never requiring
schema changes: wait-for-external-process-to-complete (Gate 1's under_review
branch), judgment-overflow-escalate-to-a-person (Step 9's confidence_tier_minimum
uncertainty), route-to-separate-commissioning-path (Gates 1–3's absent-node
branches), in-step-self-resolve (Gate 4). Topology is the level that needs
structural treatment; remedy description is documentation-only variation within a
topology and does not.

**Governing principles, observed throughout:**
- Corpus governs over any prior brief or spec where they conflict.
- Split a gate into multiple codes only on **divergent remedy**, not mere
  distinguishability — two failure states with the same fix stay one code.
- When the corpus is silent or forward-references something undefined, **author
  the gate and name the gap explicitly** in its condition text — never invent a
  plausible value.
- Evaluator dispatch is by **code**, never by which codes the colliding step
  happens to define — this was the single most common analysis error during this
  pass and should be the first thing re-checked when extending the table.
- Verify every numeric value, error string, and field name against the source
  directly before treating it as load-bearing — coincidental plausibility is not
  verification.

---

## Entity-Name Register

Canonical names and exact casing as used throughout both authored files, for
downstream consistency verification.

**Node types:** `Narrative`, `Audience`, `JTBD`, `Content Module`, `Proof`, `Asset`

**Content-graph fields:** `solution_category`, `role`, `buying_stage`, `module_type`,
`jtbd_code`, `jtbd_ref`, `narrative_ref`, `proof_refs`, `asset_refs`,
`intended_axes`, `buying_job`, `confidence_tier_minimum`, `solution_claim`,
`message_pillar`, `supporting_claims`, `content_body`, `phase` (content-graph sense:
`diverge`/`converge` — distinct from the workflow-schema `phase` field, see Desk 3),
`coverage_status`, `solution_category_coverage_status`, `status` (Sanity:
`draft`/`under_review`/`approved`), `content_preferences`

**Module types (the 11):** `hero`, `benefits`, `cta`, `gated_assets`, `proof`,
`narrative` (module slot — distinct from the `Narrative` node type),
`problem_framing`, `outcomes`, `use_cases`, `trust_signals`,
`progressive_disclosure`

**`jtbd_ref`-required module types (the 4, verified directly against Document 4
§6):** `cta`, `gated_assets`, `proof`, `use_cases`

**Solution categories:** `customer_engagement`, `employee_experience`,
`risk_compliance`, `ai_platform`, `it_operations`

**`confidence_tier_minimum` values:** `HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`

**Account/contact-plane attributes (Monitoring):** `bg_stage`,
`pending_solution_fallback`, `solution_key`, `stitching_pending`,
`tal_last_refreshed_at`, `multi_match_unresolved`, `role_confidence_score`,
`confidence_tier`, `differential_insufficient`

**Other named values/channels:** `slack_data_team_channel`, `gap_summary`,
`fallback_event_count_7d`, `current_coverage_status`

**Roles/practitioners:** `Content Ops Lead` / `Content Strategist` (used
interchangeably per Document 8 §3.1), `Platform Engineer`, `Analytics Lead`,
`Marketing Ops Engineer`

**Workflow identifiers:** `content_commissioning_12step`, `signal_monitoring_8step`
(renamed from `signal_monitoring_10step` — see Desk 2, item 2)

**Gate codes used:** `H-01`, `H-02`, `H-03`, `H-04` (Commissioning Step 12 only);
`F-01` (Commissioning Step 12, Monitoring Checks 5 and 7)

This register is exhaustive for both authored files as of this close-out — every
canonical name either file's content references appears above with the exact
casing used. Cross-check against `knowledge/data-model/kalder_data_model.py` if any
future edit introduces a name not listed here.
