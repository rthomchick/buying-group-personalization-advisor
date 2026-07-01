// Test suite for the FLAG/HOLD evaluator fix — built directly from
// knowledge/specs/evaluator_collision_table.md, the test plan for this fix.
// Every collision-table row is one assertion here, keyed to its failure-mode
// tag:
//   - fails-open rows must become ABLE to fire when the real condition holds
//   - fails-closed-spurious rows must STOP firing when the real condition is
//     absent
//   - mis-fires rows must fire tracking the REAL corpus condition, not
//     null-ness
// A single "dispatch resolves to the right workflow" smoke test is
// insufficient (see the collision table's own framing) — this suite asserts
// destination-logic correctness per row, not just successful lookup.
//
// Run with: node lib/guided/flag-hold-evaluator.test.ts
// (Node 20+ with native TypeScript stripping; no test framework dependency.)

// @ts-ignore -- Node's TS-stripping loader requires explicit .ts extensions
// on relative imports; tsc's "bundler" moduleResolution (this project's
// tsconfig) rejects them. Both tools are satisfied this way: tsc ignores the
// extension-specific error here, Node resolves the file.
import { evaluateStep, type WorkflowStepDefinition, type StepSubmission } from "./flag-hold-evaluator.ts";
import onboardingFile from "../../data/workflows/onboarding_18step.json" with { type: "json" };
import commissioningFile from "../../data/workflows/commissioning_12step.json" with { type: "json" };
import monitoringFile from "../../data/workflows/monitoring_8step.json" with { type: "json" };
// @ts-ignore -- see note above.
import type { WorkflowId } from "../session/session-state.ts";

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let pass = 0;
let fail = 0;
const failures: string[] = [];

function ok(label: string, condition: boolean) {
  if (condition) {
    pass++;
  } else {
    fail++;
    failures.push(label);
    console.log(`FAIL: ${label}`);
  }
}

function loadSteps(workflowId: WorkflowId, file: { steps: unknown[] }): WorkflowStepDefinition[] {
  return (file.steps as Omit<WorkflowStepDefinition, "workflow_id">[]).map((s) => ({ ...s, workflow_id: workflowId }));
}

const onboardingSteps = loadSteps("onboarding_18step", onboardingFile);
const commissioningSteps = loadSteps("content_commissioning_12step", commissioningFile);
const monitoringSteps = loadSteps("signal_monitoring_8step", monitoringFile);

function step(steps: WorkflowStepDefinition[], stepId: number): WorkflowStepDefinition {
  const found = steps.find((s) => s.step_id === stepId);
  if (!found) throw new Error(`Fixture error: no step_id ${stepId} in supplied steps array.`);
  return found;
}

// Builds a step fixture carrying a single live hold/flag trigger of the given
// code, regardless of whether that code is actually live on the loaded JSON
// (Commissioning/Monitoring's real gates are still in *_pending — these
// fixtures simulate "the gate has been installed" so the evaluator's
// destination logic can be tested independently of the install step, per the
// brief: "installation of the dormant gates is a separate task, not this one").
function withLiveHold(base: WorkflowStepDefinition, code: string): WorkflowStepDefinition {
  return { ...base, hold_triggers: [{ code, condition: `test fixture for ${code}` }], flag_triggers: [] };
}
function withLiveFlag(base: WorkflowStepDefinition, code: string): WorkflowStepDefinition {
  return { ...base, hold_triggers: [], flag_triggers: [{ code, condition: `test fixture for ${code}` }] };
}

function holdFired(step: WorkflowStepDefinition, submission: StepSubmission, code: string): boolean {
  return evaluateStep(step, submission).firedHolds.some((h) => h.holdCode === code);
}
function flagFired(step: WorkflowStepDefinition, submission: StepSubmission, code: string): boolean {
  return evaluateStep(step, submission).firedFlags.some((f) => f.flagCode === code);
}

// ===========================================================================
// Content Commissioning — collision table rows
// ===========================================================================

{
  // step 1 — no gates authored, n/a row, nothing to test.

  // step 2 H-01 — mis-fires-wrong-condition -> fixed: tracks Platform
  // Engineer node-list confirmation, not null-ness.
  const s = withLiveHold(step(commissioningSteps, 2), "H-01");
  ok(
    "Commissioning step2 H-01: fires when node list NOT confirmed with Platform Engineer",
    holdFired(s, { nodeListConfirmedWithPlatformEngineer: false }, "H-01"),
  );
  ok(
    "Commissioning step2 H-01: does not fire once confirmed",
    !holdFired(s, { nodeListConfirmedWithPlatformEngineer: true }, "H-01"),
  );
  ok(
    "Commissioning step2 H-01: a present, non-null unrelated value no longer accidentally clears it (old isNullish bug)",
    holdFired(s, { value: "anything-non-null", nodeListConfirmedWithPlatformEngineer: false }, "H-01"),
  );
}

{
  // step 3 H-01 — mis-fires-wrong-condition -> fixed: tracks approved
  // Narrative node existence.
  const sH01 = withLiveHold(step(commissioningSteps, 3), "H-01");
  ok(
    "Commissioning step3 H-01: fires when no approved Narrative node exists",
    holdFired(sH01, { approvedNarrativeNodeExists: false }, "H-01"),
  );
  ok(
    "Commissioning step3 H-01: does not fire when an approved Narrative node exists",
    !holdFired(sH01, { approvedNarrativeNodeExists: true }, "H-01"),
  );

  // step 3 H-02 — fails-closed-spurious -> fixed: must STOP firing absent the
  // real condition (Narrative under_review), even for realistic non-null payloads.
  const sH02 = withLiveHold(step(commissioningSteps, 3), "H-02");
  ok(
    "Commissioning step3 H-02: does NOT fire merely because a realistic non-null value is present (old fails-closed-spurious bug)",
    !holdFired(sH02, { value: "some-non-null-realistic-value", narrativeNodeUnderReview: false }, "H-02"),
  );
  ok(
    "Commissioning step3 H-02: fires when Narrative node is genuinely under_review",
    holdFired(sH02, { narrativeNodeUnderReview: true }, "H-02"),
  );
}

{
  // step 4 H-01 — mis-fires-wrong-condition -> fixed: tracks approved
  // Audience node existence.
  const s = withLiveHold(step(commissioningSteps, 4), "H-01");
  ok(
    "Commissioning step4 H-01: fires when no approved Audience node exists",
    holdFired(s, { approvedAudienceNodeExists: false }, "H-01"),
  );
  ok(
    "Commissioning step4 H-01: does not fire when an approved Audience node exists",
    !holdFired(s, { approvedAudienceNodeExists: true }, "H-01"),
  );
}

{
  // step 5 H-01 — mis-fires-wrong-condition -> fixed: conditional on
  // jtbdGateApplicable, tracks approved JTBD node existence.
  const sH01 = withLiveHold(step(commissioningSteps, 5), "H-01");
  ok(
    "Commissioning step5 H-01: fires when gate applies and no approved JTBD node exists",
    holdFired(sH01, { jtbdGateApplicable: true, approvedJtbdNodeExists: false }, "H-01"),
  );
  ok(
    "Commissioning step5 H-01: does not fire when gate does not apply to this module type",
    !holdFired(sH01, { jtbdGateApplicable: false, approvedJtbdNodeExists: false }, "H-01"),
  );

  // step 5 H-02 — fails-closed-spurious -> fixed: stops firing absent a
  // genuine solution_category mismatch.
  const sH02 = withLiveHold(step(commissioningSteps, 5), "H-02");
  ok(
    "Commissioning step5 H-02: does NOT fire for a non-boolean realistic payload with no actual mismatch (old fails-closed-spurious bug)",
    !holdFired(
      sH02,
      { value: "some-non-boolean-value", jtbdGateApplicable: true, approvedJtbdNodeExists: true, jtbdSolutionCategoryMatches: true },
      "H-02",
    ),
  );
  ok(
    "Commissioning step5 H-02: fires on a genuine solution_category mismatch",
    holdFired(
      sH02,
      { jtbdGateApplicable: true, approvedJtbdNodeExists: true, jtbdSolutionCategoryMatches: false },
      "H-02",
    ),
  );
}

{
  // step 6 H-01 — mis-fires-wrong-condition -> fixed: tracks
  // supporting_claims array length (>= 5).
  const s = withLiveHold(step(commissioningSteps, 6), "H-01");
  ok(
    "Commissioning step6 H-01: fires when supporting_claims has fewer than 5 entries",
    holdFired(s, { supportingClaimsCount: 3 }, "H-01"),
  );
  ok(
    "Commissioning step6 H-01: does not fire once supporting_claims has 5 or more entries",
    !holdFired(s, { supportingClaimsCount: 5 }, "H-01"),
  );
}

{
  // step 7 H-01 (conditional gate) — mis-fires-wrong-condition -> fixed:
  // tracks jtbd_code population for jtbd-applicable module types, ignores
  // the unrelated value entirely.
  const s = withLiveHold(step(commissioningSteps, 7), "H-01");
  ok(
    "Commissioning step7 H-01: fires when jtbd_code not populated for an applicable module type",
    holdFired(s, { jtbdGateApplicable: true, jtbdCodePopulatedBeforeGeneration: false }, "H-01"),
  );
  ok(
    "Commissioning step7 H-01: does not fire when gate is inapplicable, regardless of jtbd_code state",
    !holdFired(s, { jtbdGateApplicable: false, jtbdCodePopulatedBeforeGeneration: false }, "H-01"),
  );
}

{
  // step 8 H-01/H-02 — mis-fires / fails-closed-spurious -> fixed: track R1/R2.
  const sH01 = withLiveHold(step(commissioningSteps, 8), "H-01");
  ok("Commissioning step8 H-01: fires on R1 failure", holdFired(sH01, { r1FactualAccuracyPassed: false }, "H-01"));
  ok("Commissioning step8 H-01: does not fire when R1 passes", !holdFired(sH01, { r1FactualAccuracyPassed: true }, "H-01"));

  const sH02 = withLiveHold(step(commissioningSteps, 8), "H-02");
  ok(
    "Commissioning step8 H-02: does NOT fire for a non-boolean realistic payload absent a real R2 failure (old fails-closed-spurious bug)",
    !holdFired(sH02, { value: "some-non-boolean-value", r2ThroughLinePassed: true }, "H-02"),
  );
  ok("Commissioning step8 H-02: fires on genuine R2 failure", holdFired(sH02, { r2ThroughLinePassed: false }, "H-02"));

  // step 8 H-03 — FAILS-OPEN -> fixed: must become able to fire on R4 failure.
  const sH03 = withLiveHold(step(commissioningSteps, 8), "H-03");
  ok(
    "Commissioning step8 H-03: FAILS-OPEN FIX — now fires on genuine R4 brand-voice failure (was unconditionally false before the fix)",
    holdFired(sH03, { r4BrandVoicePassed: false }, "H-03"),
  );
  ok("Commissioning step8 H-03: does not fire when R4 passes", !holdFired(sH03, { r4BrandVoicePassed: true }, "H-03"));
}

{
  // step 9 H-01 (task-2-scoped) — mis-fires-wrong-condition -> fixed: tracks
  // real enum membership against HIGH/MEDIUM/LOW/UNKNOWN, not null-ness.
  const sH01 = withLiveHold(step(commissioningSteps, 9), "H-01");
  ok(
    "Commissioning step9 H-01: fires when confidence_tier_minimum is null",
    holdFired(sH01, { confidenceTierMinimum: null }, "H-01"),
  );
  ok(
    "Commissioning step9 H-01: fires on a garbage non-enum value (old isNullish bug would have wrongly passed this)",
    holdFired(sH01, { confidenceTierMinimum: "garbage" as never }, "H-01"),
  );
  ok(
    "Commissioning step9 H-01: does not fire for a valid enum value",
    !holdFired(sH01, { confidenceTierMinimum: "HIGH" }, "H-01"),
  );

  // step 9 H-02 (task-1-scoped) — fails-closed-spurious -> fixed: tracks tag
  // field correctness, not boolean-type fallback. Also proves req 4:
  // task-1-only data does not affect task-2's H-01 and vice versa.
  const sH02 = withLiveHold(step(commissioningSteps, 9), "H-02");
  ok(
    "Commissioning step9 H-02: does NOT fire for a non-boolean realistic payload absent a real tag mismatch (old fails-closed-spurious bug)",
    !holdFired(sH02, { value: "some-non-boolean-value", task1TagFieldsCorrect: true }, "H-02"),
  );
  ok(
    "Commissioning step9 H-02: fires when a Compose-populated tag field is wrong",
    holdFired(sH02, { task1TagFieldsCorrect: false }, "H-02"),
  );
  ok(
    "Commissioning step9 task isolation (req 4): task-1 failure does not also trip H-01 (task 2)",
    !holdFired(sH01, { task1TagFieldsCorrect: false, confidenceTierMinimum: "HIGH" }, "H-01"),
  );
  ok(
    "Commissioning step9 task isolation (req 4): task-2 failure does not also trip H-02 (task 1)",
    !holdFired(sH02, { task1TagFieldsCorrect: true, confidenceTierMinimum: null }, "H-02"),
  );
}

{
  // step 10 H-01 — mis-fires-wrong-condition, DIFFERENT SHAPE (compound
  // condition, not bare null-check) -> fixed: GROQ Function 1.
  const sH01 = withLiveHold(step(commissioningSteps, 10), "H-01");
  ok(
    "Commissioning step10 H-01: fires when GROQ Function 1 fails (Narrative not approved)",
    holdFired(sH01, { groqFunction1NarrativeApproved: false }, "H-01"),
  );
  ok(
    "Commissioning step10 H-01: does not fire when Function 1 passes",
    !holdFired(sH01, { groqFunction1NarrativeApproved: true }, "H-01"),
  );

  // step 10 H-02 (conditional) — fails-closed-spurious -> fixed: GROQ
  // Function 2, applicability-gated on jtbd_ref presence.
  const sH02 = withLiveHold(step(commissioningSteps, 10), "H-02");
  ok(
    "Commissioning step10 H-02: does not fire when jtbd_ref is absent (gate inapplicable), even with empty allowed_values (old fails-closed-spurious bug)",
    !holdFired(sH02, { groqFunction2JtbdRefPresent: false, groqFunction2SolutionCategoryMatches: false }, "H-02"),
  );
  ok(
    "Commissioning step10 H-02: fires when jtbd_ref present and Function 2 fails",
    holdFired(sH02, { groqFunction2JtbdRefPresent: true, groqFunction2SolutionCategoryMatches: false }, "H-02"),
  );

  // step 10 H-03 — FAILS-OPEN -> fixed.
  const sH03 = withLiveHold(step(commissioningSteps, 10), "H-03");
  ok(
    "Commissioning step10 H-03: FAILS-OPEN FIX — now fires when GROQ Function 3 fails (was unconditionally false before the fix)",
    holdFired(sH03, { groqFunction3ScopeMatches: false }, "H-03"),
  );
  ok(
    "Commissioning step10 H-03: does not fire when Function 3 passes",
    !holdFired(sH03, { groqFunction3ScopeMatches: true }, "H-03"),
  );
}

{
  // step 11 — no gate authored at all (genuine no-gate case); nothing to test.

  // step 12 — THIRD DISTINCT COLLISION SHAPE: Onboarding's step 12 applies
  // Track-2/DPA consent logic; Commissioning step 12 is sprint-closure
  // verification. mis-fires-wrong-condition (would-be) -> fixed: H-01/H-02/
  // H-03/H-04 each track their own named condition (b)-(e).
  const sH01 = withLiveHold(step(commissioningSteps, 12), "H-01");
  ok(
    "Commissioning step12 H-01 (condition b): fires when coverage status does not reflect sprint",
    holdFired(sH01, { coverageStatusReflectsSprint: false }, "H-01"),
  );
  ok(
    "Commissioning step12 H-01: does not fire when coverage status is correct",
    !holdFired(sH01, { coverageStatusReflectsSprint: true }, "H-01"),
  );

  const sH02 = withLiveHold(step(commissioningSteps, 12), "H-02");
  ok(
    "Commissioning step12 H-02 (condition c): fires when dashboard coverage mismatches sprint deliverables",
    holdFired(sH02, { dashboardCoverageMatchesSprint: false }, "H-02"),
  );

  const sH03 = withLiveHold(step(commissioningSteps, 12), "H-03");
  ok(
    "Commissioning step12 H-03 (condition d): fires when fallback event rate is not declining (would have wrongly run Onboarding's Track-2/DPA logic before the fix)",
    holdFired(sH03, { fallbackEventRateDeclining: false }, "H-03"),
  );

  const sH04 = withLiveHold(step(commissioningSteps, 12), "H-04");
  ok(
    "Commissioning step12 H-04 (condition e): fires when a converge exclusion log entry is unexpected",
    holdFired(sH04, { convergeExclusionLogEntriesExpected: false }, "H-04"),
  );

  // step 12 F-01 — FAILS-OPEN -> fixed.
  const sF01 = withLiveFlag(step(commissioningSteps, 12), "F-01");
  ok(
    "Commissioning step12 F-01: FAILS-OPEN FIX — now fires when an unapproved node is carried forward with a documented reason (was unconditionally false before the fix, evaluateF01 branched only on step_id 2/4/18)",
    flagFired(sF01, { unapprovedNodesCarriedForwardWithReason: true }, "F-01"),
  );
  ok(
    "Commissioning step12 F-01: does not fire when all nodes reached status: approved",
    !flagFired(sF01, { unapprovedNodesCarriedForwardWithReason: false }, "F-01"),
  );
}

// ===========================================================================
// Signal Monitoring — collision table rows
// ===========================================================================

{
  // step 1 H-01/H-02 — mis-fires-wrong-condition -> fixed: real percentage
  // threshold conditions, not null-ness.
  const sH01 = withLiveHold(step(monitoringSteps, 1), "H-01");
  ok(
    "Monitoring step1 H-01: fires when consensus_brief threshold breached",
    holdFired(sH01, { consensusBriefThresholdBreached: true }, "H-01"),
  );
  ok(
    "Monitoring step1 H-01: does not fire when threshold not breached, even with a non-null unrelated value present",
    !holdFired(sH01, { value: "some-non-null-value", consensusBriefThresholdBreached: false }, "H-01"),
  );

  const sH02 = withLiveHold(step(monitoringSteps, 1), "H-02");
  ok(
    "Monitoring step1 H-02: does NOT fire for a non-boolean realistic payload absent a real breach (old fails-closed-spurious bug)",
    !holdFired(sH02, { value: "some-non-boolean-value", executiveBriefThresholdBreached: false }, "H-02"),
  );
  ok(
    "Monitoring step1 H-02: fires when executive_brief threshold breached",
    holdFired(sH02, { executiveBriefThresholdBreached: true }, "H-02"),
  );
}

{
  // step 2 H-01 — mis-fires-wrong-condition -> fixed: AEP/Sanity mismatch.
  const s = withLiveHold(step(monitoringSteps, 2), "H-01");
  ok(
    "Monitoring step2 H-01: fires on a genuine AEP/Sanity coverage_status mismatch",
    holdFired(s, { aepSanityCoverageMismatch: true }, "H-01"),
  );
  ok(
    "Monitoring step2 H-01: does not fire when AEP and Sanity agree",
    !holdFired(s, { aepSanityCoverageMismatch: false }, "H-01"),
  );
}

{
  // step 3 H-01/H-02 — mis-fires / fails-closed-spurious -> fixed: alert
  // pipeline failure vs. real-gap-with-alert-fired.
  const sH01 = withLiveHold(step(monitoringSteps, 3), "H-01");
  ok(
    "Monitoring step3 H-01: fires when threshold breached with no alert (escalation mechanism itself failed)",
    holdFired(sH01, { fallbackThresholdBreachedNoAlert: true }, "H-01"),
  );
  ok("Monitoring step3 H-01: does not fire when no breach occurred", !holdFired(sH01, { fallbackThresholdBreachedNoAlert: false }, "H-01"));

  const sH02 = withLiveHold(step(monitoringSteps, 3), "H-02");
  ok(
    "Monitoring step3 H-02: does NOT fire for an empty allowed_values mapping-table membership artifact absent a real breach (old fails-closed-spurious bug)",
    !holdFired(sH02, { value: "some-mapping-table-value", fallbackThresholdBreachedAlertFired: false }, "H-02"),
  );
  ok(
    "Monitoring step3 H-02: fires on a real breach where the alert did fire",
    holdFired(sH02, { fallbackThresholdBreachedAlertFired: true }, "H-02"),
  );
}

{
  // step 4 H-01 — mis-fires-wrong-condition -> fixed: 24h SLA breach.
  const s = withLiveHold(step(monitoringSteps, 4), "H-01");
  ok(
    "Monitoring step4 H-01: fires when stitching_pending persists beyond 24h",
    holdFired(s, { stitchingPendingBreach24h: true }, "H-01"),
  );
  ok(
    "Monitoring step4 H-01: does not fire when no breach has occurred",
    !holdFired(s, { stitchingPendingBreach24h: false }, "H-01"),
  );
}

{
  // step 5 H-01 — Document 8 §12.7 threshold installed: stale account count
  // exceeds 5% of active TAL accounts, with a 25-account absolute floor.
  // Both conditions (percentage AND floor) must hold for the HOLD to fire.
  const sH01 = withLiveHold(step(monitoringSteps, 5), "H-01");
  ok(
    "Monitoring step5 H-01: fires above threshold and above floor (1600/30000 = 5.33%)",
    holdFired(sH01, { staleAccountCount: 1600, activetalCount: 30000 }, "H-01"),
  );
  ok(
    "Monitoring step5 H-01: fires exactly at threshold (1500/30000 = 5.00%)",
    holdFired(sH01, { staleAccountCount: 1500, activetalCount: 30000 }, "H-01"),
  );
  ok(
    "Monitoring step5 H-01: clears just below threshold (1499/30000 = 4.99%)",
    !holdFired(sH01, { staleAccountCount: 1499, activetalCount: 30000 }, "H-01"),
  );
  ok(
    "Monitoring step5 H-01: clears above percentage threshold but below floor (24/100 = 24%, count 24 < 25)",
    !holdFired(sH01, { staleAccountCount: 24, activetalCount: 100 }, "H-01"),
  );
  ok(
    "Monitoring step5 H-01: fires above percentage threshold and at floor exactly (25/100 = 25%, count 25)",
    holdFired(sH01, { staleAccountCount: 25, activetalCount: 100 }, "H-01"),
  );
  ok(
    "Monitoring step5 H-01: clears with zero stale accounts",
    !holdFired(sH01, { staleAccountCount: 0, activetalCount: 30000 }, "H-01"),
  );

  // H-02 — mis-fires-wrong-condition -> fixed: fully operationalizable, no
  // corpus gap. Tracks the real three-consecutive-week trend.
  const sH02 = withLiveHold(step(monitoringSteps, 5), "H-02");
  ok(
    "Monitoring step5 H-02: fires on a genuine three-consecutive-week rising trend",
    holdFired(sH02, { staleAccountCountRisingThreeWeeks: true }, "H-02"),
  );
  ok(
    "Monitoring step5 H-02: does not fire absent a three-week trend",
    !holdFired(sH02, { staleAccountCountRisingThreeWeeks: false }, "H-02"),
  );

  // F-01 — FAILS-OPEN -> fixed: the corpus's normal log-and-monitor outcome.
  const sF01 = withLiveFlag(step(monitoringSteps, 5), "F-01");
  ok(
    "Monitoring step5 F-01: FAILS-OPEN FIX — now fires on a below-threshold single-week spike (was unconditionally false before the fix, evaluateF01 branched only on step_id 2/4/18)",
    flagFired(sF01, { staleAccountSingleWeekSpikeBelowThreshold: true }, "F-01"),
  );
  ok(
    "Monitoring step5 F-01: does not fire when no spike occurred",
    !flagFired(sF01, { staleAccountSingleWeekSpikeBelowThreshold: false }, "F-01"),
  );
}

{
  // step 6 H-01/H-02 — mis-fires / fails-closed-spurious -> fixed: qualified-
  // stage association vs. three-week rising trend.
  const sH01 = withLiveHold(step(monitoringSteps, 6), "H-01");
  ok(
    "Monitoring step6 H-01: fires when a multi_match_unresolved record is at bg_stage: qualified",
    holdFired(sH01, { multiMatchUnresolvedAtQualifiedStage: true }, "H-01"),
  );
  ok(
    "Monitoring step6 H-01: does not fire absent qualified-stage association",
    !holdFired(sH01, { multiMatchUnresolvedAtQualifiedStage: false }, "H-01"),
  );

  const sH02 = withLiveHold(step(monitoringSteps, 6), "H-02");
  ok(
    "Monitoring step6 H-02: does NOT fire for a non-boolean realistic payload absent a real trend (old fails-closed-spurious bug)",
    !holdFired(
      sH02,
      { value: "some-non-boolean-value", multiMatchUnresolvedRisingThreeWeeksNoQualifiedStage: false },
      "H-02",
    ),
  );
  ok(
    "Monitoring step6 H-02: fires on a genuine three-week rising trend without condition (a)",
    holdFired(
      sH02,
      { multiMatchUnresolvedRisingThreeWeeksNoQualifiedStage: true, multiMatchUnresolvedAtQualifiedStage: false },
      "H-02",
    ),
  );
  ok(
    "Monitoring step6 H-02: does not fire when condition (a)/H-01 has also fired (corpus's 'without (a)' qualifier)",
    !holdFired(
      sH02,
      { multiMatchUnresolvedRisingThreeWeeksNoQualifiedStage: true, multiMatchUnresolvedAtQualifiedStage: true },
      "H-02",
    ),
  );
}

{
  // step 7 — TWO-TIER SEVERITY -> fixed: H-01 FAILS-OPEN, F-01 FAILS-OPEN.
  const sH01 = withLiveHold(step(monitoringSteps, 7), "H-01");
  ok(
    "Monitoring step7 H-01: FAILS-OPEN FIX — now fires on a genuine Tier 2 shift (was unconditionally false before the fix)",
    holdFired(sH01, { confidenceTierTier2Shift: true }, "H-01"),
  );
  ok(
    "Monitoring step7 H-01: does not fire absent a Tier 2 shift",
    !holdFired(sH01, { confidenceTierTier2Shift: false }, "H-01"),
  );

  const sF01 = withLiveFlag(step(monitoringSteps, 7), "F-01");
  ok(
    "Monitoring step7 F-01: FAILS-OPEN FIX — now fires on a genuine Tier 1 shift (was unconditionally false before the fix, evaluateF01 branched only on step_id 2/4/18)",
    flagFired(sF01, { confidenceTierTier1Shift: true }, "F-01"),
  );
  ok(
    "Monitoring step7 F-01: does not fire absent a Tier 1 shift",
    !flagFired(sF01, { confidenceTierTier1Shift: false }, "F-01"),
  );
}

{
  // step 8 H-01 — mis-fires-wrong-condition -> fixed: real WoW drop with
  // stable TAL count.
  const s = withLiveHold(step(monitoringSteps, 8), "H-01");
  ok(
    "Monitoring step8 H-01: fires on a genuine sales-activation-gate-population drop with stable TAL count",
    holdFired(s, { salesActivationGateDropWithStableTal: true }, "H-01"),
  );
  ok(
    "Monitoring step8 H-01: does not fire absent a real drop",
    !holdFired(s, { salesActivationGateDropWithStableTal: false }, "H-01"),
  );
}

// ===========================================================================
// Dispatch-safety: unhandled code must throw, never silently pass (req 2's
// "no bare fallback constant" rule enforced at the dispatch layer).
// ===========================================================================

{
  const bogus = withLiveHold(step(commissioningSteps, 1), "H-99");
  let threw = false;
  try {
    evaluateStep(bogus, {});
  } catch {
    threw = true;
  }
  ok("Dispatch safety: an unregistered code for a workflow throws rather than silently passing", threw);
}

// ===========================================================================
// Onboarding regression — workflow-scoped dispatch must not change Onboarding's
// observable behavior. One assertion per live hold_triggers/flag_triggers
// entry across all 18 steps (matches the live arrays read directly from
// data/workflows/onboarding_18step.json).
// ===========================================================================

{
  ok("Onboarding step1 H-01 fires on null value", holdFired(step(onboardingSteps, 1), { value: null }, "H-01"));
  ok("Onboarding step1 H-01 does not fire on a present value", !holdFired(step(onboardingSteps, 1), { value: "acme.com" }, "H-01"));

  ok("Onboarding step2 H-01 fires on null value", holdFired(step(onboardingSteps, 2), { value: null }, "H-01"));
  ok("Onboarding step2 H-02 fires on a non-boolean value", holdFired(step(onboardingSteps, 2), { value: "yes" }, "H-02"));
  ok("Onboarding step2 F-01 fires when tal_member is false", flagFired(step(onboardingSteps, 2), { value: false }, "F-01"));
  ok("Onboarding step2 nothing fires when tal_member is true", !holdFired(step(onboardingSteps, 2), { value: true }, "H-02"));

  ok("Onboarding step3 H-01 fires on null value", holdFired(step(onboardingSteps, 3), { value: null }, "H-01"));
  ok(
    "Onboarding step3 H-02 fires on a value outside allowed_values",
    holdFired(step(onboardingSteps, 3), { value: "not_a_real_value" }, "H-02"),
  );
  ok(
    "Onboarding step3 F-06 fires on practitioner override",
    flagFired(step(onboardingSteps, 3), { value: "suspect", practitionerOverrodeAdvisorSuggestion: true }, "F-06"),
  );

  ok(
    "Onboarding step4 F-01 fires on post_sale",
    flagFired(step(onboardingSteps, 4), { value: "post_sale" }, "F-01"),
  );
  ok(
    "Onboarding step4 nothing fires on active_prospect",
    !flagFired(step(onboardingSteps, 4), { value: "active_prospect" }, "F-01"),
  );

  ok(
    "Onboarding step5 F-04 fires on GDPR heuristic flag",
    flagFired(step(onboardingSteps, 5), { value: "Germany", practitionerOverrodeAdvisorSuggestion: true }, "F-04"),
  );

  ok("Onboarding step6 H-02 fires on a non-boolean value", holdFired(step(onboardingSteps, 6), { value: "not-a-bool" }, "H-02"));
  ok("Onboarding step6 F-02 fires when value is false", flagFired(step(onboardingSteps, 6), { value: false }, "F-02"));

  ok("Onboarding step7 H-02 fires on an invalid enum value", holdFired(step(onboardingSteps, 7), { value: "bogus" }, "H-02"));
  ok("Onboarding step7 F-05 fires on msp", flagFired(step(onboardingSteps, 7), { value: "msp" }, "F-05"));

  ok("Onboarding step9 H-02 fires on a non-boolean value", holdFired(step(onboardingSteps, 9), { value: 123 }, "H-02"));

  ok(
    "Onboarding step10 H-01 fires when sfdc_opportunity_created true and no mapping table",
    holdFired(step(onboardingSteps, 10), { value: true, mappingTableProvided: false }, "H-01"),
  );
  ok(
    "Onboarding step10 nothing fires when mapping table provided",
    !holdFired(step(onboardingSteps, 10), { value: true, mappingTableProvided: true }, "H-01"),
  );

  ok(
    "Onboarding step11 H-03 fires when claims null treated as functional only",
    holdFired(step(onboardingSteps, 11), { claimsNullTreatedAsFunctionalOnly: true }, "H-03"),
  );
  ok(
    "Onboarding step11 F-04 fires when CMP delivery timing not confirmed",
    flagFired(step(onboardingSteps, 11), { cmpDeliveryTimingConfirmed: false }, "F-04"),
  );

  ok(
    "Onboarding step12 H-03 fires on track2 complete + DPA not confirmed",
    holdFired(step(onboardingSteps, 12), { claimsTrack2Complete: true, dpaDocumentationConfirmed: false }, "H-03"),
  );
  ok(
    "Onboarding step12 F-04 fires when track2 not complete (pending)",
    flagFired(step(onboardingSteps, 12), { claimsTrack2Complete: false }, "F-04"),
  );

  ok(
    "Onboarding step17 H-01 fires when connector inactive",
    holdFired(step(onboardingSteps, 17), { connectorConfirmedActive: false }, "H-01"),
  );
  ok(
    "Onboarding step17 F-05 fires when active but no test write performed",
    flagFired(step(onboardingSteps, 17), { connectorConfirmedActive: true, testWritePerformed: false }, "F-05"),
  );

  ok(
    "Onboarding step18 H-06 fires on data model version mismatch",
    holdFired(step(onboardingSteps, 18), { retrievalIndexVersion: "0.1.0", expectedDataModelVersion: "0.2.0" }, "H-06"),
  );
  ok(
    "Onboarding step18 F-01 fires on practitioner override",
    flagFired(
      step(onboardingSteps, 18),
      { retrievalIndexVersion: "0.2.0", expectedDataModelVersion: "0.2.0", practitionerOverrodeAdvisorSuggestion: true },
      "F-01",
    ),
  );
}

// ---------------------------------------------------------------------------
console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailed assertions:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
