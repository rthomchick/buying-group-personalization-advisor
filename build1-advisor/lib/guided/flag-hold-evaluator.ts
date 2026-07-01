// FLAG/HOLD trigger logic per step — reads workflow JSON configuration
//
// Source of truth:
// - knowledge/specs/kalder_onboarding_workflow_18step_spec.md (governing rules, FLAG/HOLD code reference)
// - knowledge/specs/kalder_layer2_decisions_log_L2E_builds.md (Guided Workflow Mode locked decisions)
// - data/workflows/onboarding_18step.json (per-step hold_triggers / flag_triggers — the source of truth
//   for WHICH codes exist on a step; this file is the source of truth for HOW each code's condition
//   is actually evaluated against a submitted value)
//
// Governing rules carried forward:
// - HOLD = integrity interrupt, non-advanceable until resolved.
// - FLAG = advisory interrupt, advanceable after acknowledgment, available only once all HOLDs clear.
// - Every step's hold_triggers/flag_triggers arrays are read from the workflow JSON, never hardcoded
//   per-step in this file — only the evaluation STRATEGY per condition shape is code (null check,
//   enum/mapping-table membership, boolean type check, structural presence check, consent-claim check,
//   version-mismatch check). Adding/removing a code from a step requires only editing the JSON.

import type { HoldRecord, FlagRecord, WorkflowId } from "../session/session-state";

// ---------------------------------------------------------------------------
// Workflow JSON step shape (matches data/workflows/onboarding_18step.json)
// ---------------------------------------------------------------------------

export type TriggerDefinition = {
  code: string;
  condition: string;
  consequence?: string;
};

export type ValidationType = "mapping_table" | "enum" | "structural_binary" | undefined;

export type WorkflowStepDefinition = {
  // Identifies which workflow this step belongs to. Onboarding, Commissioning,
  // and Monitoring reuse the same step_id numbering range (1-18/1-12/1-8), so
  // HOLD/FLAG dispatch must key on (workflow_id, step_id), never step_id alone
  // — see HOLD_EVALUATORS/FLAG_EVALUATORS below. Populated at load time by
  // route.ts's loadWorkflowSteps(), not present in the workflow JSON files
  // themselves (the JSON's own top-level workflow_id is the source value).
  workflow_id: WorkflowId;
  step_id: number;
  phase?: number;
  step_title: string;
  corpus_authority: string;
  attribute: string | null;
  input_required: string;
  validation_rule: string;
  why_this_matters: string;
  hold_triggers: TriggerDefinition[];
  flag_triggers: TriggerDefinition[];
  deferral_consequence: string;
  category: "A" | "B" | "C";
  validation_type?: ValidationType;
  allowed_values?: (string | number)[];
  render_deferral_control?: boolean;
};

// ---------------------------------------------------------------------------
// Step submission — the practitioner-entered context evaluated against a step
// ---------------------------------------------------------------------------

export type StepSubmission = {
  // The primary value being submitted for this step's attribute. null/undefined
  // represents an absent value. Booleans, strings, and numbers all flow through
  // here depending on the step's validation_type.
  value?: string | number | boolean | null;
  // For steps whose H-02 condition is "outside [true, false]" (no validation_type
  // tag, attribute is a plain boolean) — same field as `value` typed narrowly is
  // sufficient; kept separate only for steps with compound semantics below.
  practitionerOverrodeAdvisorSuggestion?: boolean; // F-06 (step 3), F-01 deviation cases
  mappingTableProvided?: boolean; // step 10 — StageName mapping table presence
  cmpDeliveryTimingConfirmed?: boolean; // step 11 F-04
  claimsTrack2Complete?: boolean; // step 12 H-03
  dpaDocumentationConfirmed?: boolean; // step 12 H-03
  claimsNullTreatedAsFunctionalOnly?: boolean; // step 11 H-03
  retrievalIndexVersion?: string; // step 18 H-06
  expectedDataModelVersion?: string; // step 18 H-06
  customFieldsConfirmedProvisioned?: boolean; // step 14 H-05
  characterLimitVerified?: boolean; // step 14 F-05
  sequenceIdsConfirmed?: boolean; // step 15 H-05
  connectorConfirmedActive?: boolean; // step 16/17 H-05/H-01
  testWritePerformed?: boolean; // step 17 F-05

  // --- Commissioning (content_commissioning_12step) ---
  nodeListConfirmedWithPlatformEngineer?: boolean; // step 2 H-01
  approvedNarrativeNodeExists?: boolean; // step 3 H-01, step 7 H-01 (jtbd-applicable gate context)
  narrativeNodeUnderReview?: boolean; // step 3 H-02
  approvedAudienceNodeExists?: boolean; // step 4 H-01
  jtbdGateApplicable?: boolean; // step 5 — module_type in {cta, gated_assets, proof, use_cases}
  approvedJtbdNodeExists?: boolean; // step 5 H-01
  jtbdSolutionCategoryMatches?: boolean; // step 5 H-02
  supportingClaimsCount?: number; // step 6 H-01 (>= 5 required)
  jtbdCodePopulatedBeforeGeneration?: boolean; // step 7 H-01
  r1FactualAccuracyPassed?: boolean; // step 8 H-01 (long-form track only)
  r2ThroughLinePassed?: boolean; // step 8 H-02
  r4BrandVoicePassed?: boolean; // step 8 H-03
  // step 9 carries two task-scoped HOLDs on distinct fields, not a shared
  // `value` — task1TagFieldsCorrect (task 1) and confidenceTierMinimum
  // (task 2) can be set independently, so a task-1 failure can never be
  // mistaken for a task-2 failure or vice versa (evaluator fix requirement 4).
  task1TagFieldsCorrect?: boolean; // step 9 H-02 (task-1-scoped)
  confidenceTierMinimum?: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN" | null; // step 9 H-01 (task-2-scoped)
  groqFunction1NarrativeApproved?: boolean; // step 10 H-01
  groqFunction2JtbdRefPresent?: boolean; // step 10 H-02 applicability
  groqFunction2SolutionCategoryMatches?: boolean; // step 10 H-02
  groqFunction3ScopeMatches?: boolean; // step 10 H-03
  coverageStatusReflectsSprint?: boolean; // step 12 H-01 (condition b)
  dashboardCoverageMatchesSprint?: boolean; // step 12 H-02 (condition c)
  fallbackEventRateDeclining?: boolean; // step 12 H-03 (condition d)
  convergeExclusionLogEntriesExpected?: boolean; // step 12 H-04 (condition e)
  unapprovedNodesCarriedForwardWithReason?: boolean; // step 12 F-01 (condition a documented-exception)

  // --- Monitoring (signal_monitoring_8step) ---
  consensusBriefThresholdBreached?: boolean; // step 1 H-01 (>=20% engaged/prioritized, no active sprint)
  executiveBriefThresholdBreached?: boolean; // step 1 H-02 (>=10% qualified, no active sprint)
  aepSanityCoverageMismatch?: boolean; // step 2 H-01
  fallbackThresholdBreachedNoAlert?: boolean; // step 3 H-01 (alert pipeline failure)
  fallbackThresholdBreachedAlertFired?: boolean; // step 3 H-02 (real gap, alert worked)
  stitchingPendingBreach24h?: boolean; // step 4 H-01
  staleAccountCount?: number; // step 5 H-01 input — accounts where tal_last_refreshed_at exceeds 72h (Document 8 §12.7)
  activetalCount?: number; // step 5 H-01 input — total active TAL account count, denominator for §12.7's 5% threshold
  staleAccountCountRisingThreeWeeks?: boolean; // step 5 H-02
  staleAccountSingleWeekSpikeBelowThreshold?: boolean; // step 5 F-01 (normal/log-and-monitor outcome)
  multiMatchUnresolvedAtQualifiedStage?: boolean; // step 6 H-01
  multiMatchUnresolvedRisingThreeWeeksNoQualifiedStage?: boolean; // step 6 H-02
  confidenceTierTier2Shift?: boolean; // step 7 H-01 (>10pp single-week OR 2-week persistence of tier-1 shift)
  confidenceTierTier1Shift?: boolean; // step 7 F-01 (5pp absolute or 20% relative single-week, not yet tier 2)
  salesActivationGateDropWithStableTal?: boolean; // step 8 H-01
};

export type EvaluationResult = {
  firedHolds: HoldRecord[];
  firedFlags: FlagRecord[];
};

const NOW = () => new Date().toISOString();

function makeHoldRecord(step: WorkflowStepDefinition, trigger: TriggerDefinition): HoldRecord {
  return {
    holdCode: trigger.code,
    stepId: step.step_id,
    description: trigger.condition,
    resolutionInstruction: step.deferral_consequence,
    corpusAuthority: step.corpus_authority,
    resolved: false,
    resolution: null,
    resolvedAtTimestamp: null,
  };
}

function makeFlagRecord(step: WorkflowStepDefinition, trigger: TriggerDefinition): FlagRecord {
  return {
    flagCode: trigger.code,
    stepId: step.step_id,
    description: trigger.condition,
    corpusAuthority: step.corpus_authority,
    consequence: trigger.consequence ?? "",
    acknowledged: false,
    acknowledgedAtTimestamp: null,
  };
}

function isNullish(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

// ---------------------------------------------------------------------------
// Per-code condition predicates, scoped per workflow. Onboarding, Commissioning,
// and Monitoring reuse the same step_id numbering range (1-18 / 1-12 / 1-8), so
// a single global `step.step_id === N` branch would run one workflow's logic
// against another workflow's step — each predicate below is named after both
// the HOLD/FLAG code AND the workflow it evaluates for exactly this reason.
// Dispatch (HOLD_EVALUATORS/FLAG_EVALUATORS below) is keyed on
// (workflow_id, code) — never on code alone, and never falls back across
// workflows. The JSON is authoritative for WHICH codes apply to a step; these
// functions are the authoritative evaluation logic for what each code
// actually checks, scoped to the one workflow it was authored for.
// ---------------------------------------------------------------------------

type EvaluatorFn = (step: WorkflowStepDefinition, submission: StepSubmission) => boolean;

function evaluateH01Onboarding(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  // H-01: blocking onboarding_required attribute missing or incompletely mapped.
  if (step.step_id === 10) {
    // Step 10's H-01 is distinct: fires when sfdc_opportunity_created is true
    // but the StageName mapping table is absent — not a null-value check.
    return submission.value === true && submission.mappingTableProvided !== true;
  }
  if (step.step_id === 17) {
    return submission.connectorConfirmedActive !== true;
  }
  return isNullish(submission.value);
}

function evaluateH02Onboarding(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  // H-02: value entered is outside allowed_values for the attribute.
  if (step.validation_type === "mapping_table" || step.validation_type === "enum") {
    if (isNullish(submission.value)) return false; // null is H-01's concern, not H-02's
    return !(step.allowed_values ?? []).includes(submission.value as string | number);
  }
  // No validation_type tag + attribute present → boolean-typed attribute.
  // H-02 fires when the submitted value is anything other than true/false.
  if (isNullish(submission.value)) return false; // null is H-01's concern, not H-02's
  return typeof submission.value !== "boolean";
}

function evaluateH03Onboarding(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  // H-03: consent gate blocking activation scope.
  if (step.step_id === 11) {
    return submission.claimsNullTreatedAsFunctionalOnly === true;
  }
  if (step.step_id === 12) {
    return submission.claimsTrack2Complete === true && submission.dpaDocumentationConfirmed !== true;
  }
  return false;
}

function evaluateH05Onboarding(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  // H-05: blocking client data input absent. Step-specific because the
  // "blocking input" differs per step (mapping table, CMP identity, custom
  // fields, sequence IDs, connector confirmation).
  switch (step.step_id) {
    case 10:
      return submission.mappingTableProvided !== true;
    case 11:
      return isNullish(submission.value); // CMP identity not confirmable
    case 14:
      return submission.customFieldsConfirmedProvisioned !== true;
    case 15:
      return submission.sequenceIdsConfirmed !== true;
    case 16:
      return submission.connectorConfirmedActive !== true;
    default:
      return false;
  }
}

function evaluateH06Onboarding(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  // H-06: data model version mismatch detected.
  if (step.step_id !== 18) return false;
  if (!submission.retrievalIndexVersion || !submission.expectedDataModelVersion) return false;
  return submission.retrievalIndexVersion !== submission.expectedDataModelVersion;
}

function evaluateF01Onboarding(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  // F-01: practitioner is deviating from a corpus default.
  if (step.step_id === 2) return submission.value === false; // tal_member: false
  if (step.step_id === 4) return submission.value === "post_sale" || submission.value === "out_of_program";
  if (step.step_id === 18) return submission.practitionerOverrodeAdvisorSuggestion === true;
  return false;
}

function evaluateF02Onboarding(_step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  // F-02: optional attribute is null and its absence degrades program scope.
  // Modeled here as "practitioner explicitly set false" — the JSON's own
  // deferral_consequence text covers the null/deferred case via deferral logging.
  return submission.value === false;
}

function evaluateF03Onboarding(_step: WorkflowStepDefinition, _submission: StepSubmission): boolean {
  // F-03: practitioner has explicitly deferred a step. Fired by the state
  // machine's deferStep() path, not by submitted-value inspection here.
  return false;
}

function evaluateF04Onboarding(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  // F-04: consent classification gap — non-blocking; produces persistent
  // Configuration Gap Record.
  if (step.step_id === 5) {
    // GDPR-jurisdiction informational note — fires on a heuristic the JSON
    // describes as "EU/UK/EEA country names detected." Caller supplies the
    // detection result via practitionerOverrodeAdvisorSuggestion as a generic
    // "flag-worthy condition detected" signal for this step.
    return submission.practitionerOverrodeAdvisorSuggestion === true;
  }
  if (step.step_id === 11) {
    return submission.cmpDeliveryTimingConfirmed !== true;
  }
  if (step.step_id === 12) {
    return submission.claimsTrack2Complete !== true; // pending status
  }
  if (step.step_id === 13) {
    return submission.value === false; // unclassified signal present
  }
  return false;
}

function evaluateF05Onboarding(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  // F-05: downstream dependency unconfirmed.
  if (step.step_id === 7) {
    return submission.value === "msp" || submission.value === "partner";
  }
  if (step.step_id === 14) {
    return submission.characterLimitVerified !== true;
  }
  if (step.step_id === 15) {
    return submission.sequenceIdsConfirmed === true && submission.practitionerOverrodeAdvisorSuggestion !== true;
  }
  if (step.step_id === 17) {
    return submission.connectorConfirmedActive === true && submission.testWritePerformed !== true;
  }
  return false;
}

function evaluateF06Onboarding(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  // F-06: Advisor-derivable value overridden by practitioner.
  if (step.step_id === 3) {
    return submission.practitionerOverrodeAdvisorSuggestion === true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Content Commissioning (content_commissioning_12step) — Document 8 §3.
// Every branch below evaluates the actual corpus condition named in the
// step's hold_triggers_pending/flag_triggers_pending text (knowledge/specs/
// kalder_workflow_authoring_closeout.md, Desk 1; knowledge/specs/
// evaluator_collision_table.md), not a null/boolean-type proxy.
// ---------------------------------------------------------------------------

function evaluateH01Commissioning(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  switch (step.step_id) {
    case 2:
      // Node list must be confirmed with the Platform Engineer before
      // advancing toward Phase 1 Prerequisite Checks.
      return submission.nodeListConfirmedWithPlatformEngineer !== true;
    case 3:
      // Gate 1: no approved Narrative node exists for the target pair.
      return submission.approvedNarrativeNodeExists !== true;
    case 4:
      // Gate 2: no approved Audience node exists for the target pair.
      return submission.approvedAudienceNodeExists !== true;
    case 5:
      // Gate 3: conditional on module type requiring jtbd_ref. Applies only
      // when jtbdGateApplicable; fires when no approved JTBD node exists.
      return submission.jtbdGateApplicable === true && submission.approvedJtbdNodeExists !== true;
    case 6:
      // Gate 4: governing Narrative node's supporting_claims array has fewer
      // than 5 entries.
      return (submission.supportingClaimsCount ?? 0) < 5;
    case 7:
      // Generate: jtbd_code not populated before Compose invocation, for
      // module types where jtbd_ref is required (mirrors Gate 3's gate).
      return submission.jtbdGateApplicable === true && submission.jtbdCodePopulatedBeforeGeneration !== true;
    case 8:
      // R1 (long-form track only): a claim cannot be substantiated.
      return submission.r1FactualAccuracyPassed === false;
    case 9:
      // R3 task 2 (task-2-scoped): confidence_tier_minimum is null or not
      // one of the four allowed values at attempted advancement.
      return !isValidConfidenceTier(submission.confidenceTierMinimum);
    case 10:
      // GROQ Function 1: referenced Narrative node's status is not approved.
      return submission.groqFunction1NarrativeApproved === false;
    case 12:
      // Condition (b): solution_category_coverage_status AEP attribute does
      // not reflect the expected post-sprint state.
      return submission.coverageStatusReflectsSprint === false;
    default:
      throw new Error(`evaluateH01Commissioning has no branch for step_id ${step.step_id}.`);
  }
}

function evaluateH02Commissioning(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  switch (step.step_id) {
    case 3:
      // Gate 1: governing Narrative node exists but is under_review.
      return submission.narrativeNodeUnderReview === true;
    case 5:
      // Gate 3: approved JTBD node exists but solution_category mismatches.
      return (
        submission.jtbdGateApplicable === true &&
        submission.approvedJtbdNodeExists === true &&
        submission.jtbdSolutionCategoryMatches === false
      );
    case 8:
      // R2 (both tracks): a claim is introduced beyond the approved
      // through-line, or fails the Champion/Economic-Buyer compatibility test.
      return submission.r2ThroughLinePassed === false;
    case 9:
      // R3 task 1 (task-1-scoped): a Compose-populated tag field is incorrect.
      return submission.task1TagFieldsCorrect === false;
    case 10:
      // GROQ Function 2: applies only when jtbd_ref is present. Fires when
      // the referenced JTBD node's solution_category doesn't match.
      return submission.groqFunction2JtbdRefPresent === true && submission.groqFunction2SolutionCategoryMatches === false;
    case 12:
      // Condition (c): operational dashboard's tuple-level coverage doesn't
      // match the sprint's actual deliverables.
      return submission.dashboardCoverageMatchesSprint === false;
    default:
      throw new Error(`evaluateH02Commissioning has no branch for step_id ${step.step_id}.`);
  }
}

function evaluateH03Commissioning(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  switch (step.step_id) {
    case 8:
      // R4 (both tracks, combined with R2 for short-form): brand voice review
      // fails — grammar, tone, or brand vocabulary.
      return submission.r4BrandVoicePassed === false;
    case 10:
      // GROQ Function 3: referenced Narrative node's solution_category or
      // buying_stage does not match the Content Module's corresponding fields.
      return submission.groqFunction3ScopeMatches === false;
    case 12:
      // Condition (d): pending_solution_fallback event rate has not begun
      // declining within 48 hours of the sprint's final approval events.
      return submission.fallbackEventRateDeclining === false;
    default:
      throw new Error(`evaluateH03Commissioning has no branch for step_id ${step.step_id}.`);
  }
}

function evaluateH04Commissioning(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  switch (step.step_id) {
    case 12:
      // Condition (e): a phase: converge exclusion log entry produced during
      // the sprint is unexpected — not attributable to a concurrent Section 4
      // converge workflow.
      return submission.convergeExclusionLogEntriesExpected === false;
    default:
      throw new Error(`evaluateH04Commissioning has no branch for step_id ${step.step_id}.`);
  }
}

function evaluateF01Commissioning(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  switch (step.step_id) {
    case 12:
      // Condition (a) documented-exception path: a node didn't reach
      // status: approved but is carried forward with a documented reason —
      // non-blocking per the corpus's own carry-forward provision.
      return submission.unapprovedNodesCarriedForwardWithReason === true;
    default:
      throw new Error(`evaluateF01Commissioning has no branch for step_id ${step.step_id}.`);
  }
}

function isValidConfidenceTier(value: StepSubmission["confidenceTierMinimum"]): boolean {
  return value === "HIGH" || value === "MEDIUM" || value === "LOW" || value === "UNKNOWN";
}

// ---------------------------------------------------------------------------
// Weekly Signal Monitoring (signal_monitoring_8step) — Document 8 §5.
// ---------------------------------------------------------------------------

function evaluateH01Monitoring(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  switch (step.step_id) {
    case 1:
      // Check 1: consensus_brief threshold (>=20% engaged/prioritized) breached.
      return submission.consensusBriefThresholdBreached === true;
    case 2:
      // Check 2: AEP attribute and Sanity tuple-level rollup disagree.
      return submission.aepSanityCoverageMismatch === true;
    case 3:
      // Check 3: threshold exceeded AND no automatic alert fired — the
      // escalation mechanism itself has failed.
      return submission.fallbackThresholdBreachedNoAlert === true;
    case 4:
      // Check 4: a contact's stitching_pending has persisted beyond 24 hours.
      return submission.stitchingPendingBreach24h === true;
    case 5: {
      // Check 5 condition (a): single-week stale account count exceeds 5%
      // of active TAL accounts, with a 25-account absolute floor — the
      // threshold does not fire below 25 stale accounts regardless of TAL
      // size (Document 8 §12.7). Both conditions must hold; either one
      // failing clears the HOLD.
      const { staleAccountCount, activetalCount } = submission;
      if (staleAccountCount == null || activetalCount == null || activetalCount <= 0) return false;
      return staleAccountCount / activetalCount >= 0.05 && staleAccountCount >= 25;
    }
    case 6:
      // Check 6 condition (a), highest priority: a multi_match_unresolved
      // record is associated with an account at bg_stage: qualified.
      return submission.multiMatchUnresolvedAtQualifiedStage === true;
    case 7:
      // Check 7 Tier 2 (escalate): two-week persistence of a Tier-1 shift,
      // or a single-week shift exceeding 10pp absolute.
      return submission.confidenceTierTier2Shift === true;
    case 8:
      // Check 8: MEDIUM/HIGH confidence_tier, differential_insufficient:
      // False contact count drops >20% WoW while TAL count is stable.
      return submission.salesActivationGateDropWithStableTal === true;
    default:
      throw new Error(`evaluateH01Monitoring has no branch for step_id ${step.step_id}.`);
  }
}

function evaluateH02Monitoring(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  switch (step.step_id) {
    case 1:
      // Check 1: executive_brief threshold (>=10% qualified) breached.
      return submission.executiveBriefThresholdBreached === true;
    case 3:
      // Check 3: threshold exceeded AND the automatic alert did fire — a
      // real coverage gap requiring remediation.
      return submission.fallbackThresholdBreachedAlertFired === true;
    case 5:
      // Check 5: stale account count rose week-over-week for three
      // consecutive weekly reviews. Fully operationalizable — no corpus gap
      // (the gap is specific to H-01's threshold, not this trend condition).
      return submission.staleAccountCountRisingThreeWeeks === true;
    case 6:
      // Check 6 condition (b): count rose WoW for three consecutive weeks,
      // when condition (a)/H-01 has not also fired.
      return (
        submission.multiMatchUnresolvedRisingThreeWeeksNoQualifiedStage === true &&
        submission.multiMatchUnresolvedAtQualifiedStage !== true
      );
    default:
      throw new Error(`evaluateH02Monitoring has no branch for step_id ${step.step_id}.`);
  }
}

function evaluateF01Monitoring(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  switch (step.step_id) {
    case 5:
      // Check 5: neither H-01 nor H-02 fired, but a single-week spike
      // occurred below H-01's (corpus-undefined) threshold — the corpus's
      // named normal-monitoring, log-and-monitor outcome.
      return submission.staleAccountSingleWeekSpikeBelowThreshold === true;
    case 7:
      // Check 7 Tier 1 (log and monitor): single-week shift meeting the 5pp
      // absolute or 20% relative criterion, not yet at Tier 2.
      return submission.confidenceTierTier1Shift === true;
    default:
      throw new Error(`evaluateF01Monitoring has no branch for step_id ${step.step_id}.`);
  }
}

const HOLD_EVALUATORS: Record<WorkflowId, Record<string, EvaluatorFn>> = {
  onboarding_18step: {
    "H-01": evaluateH01Onboarding,
    "H-02": evaluateH02Onboarding,
    "H-03": evaluateH03Onboarding,
    // H-04 (prerequisite step incomplete) is evaluated by the state machine,
    // which has visibility into completedSteps — not by this per-step evaluator.
    "H-05": evaluateH05Onboarding,
    "H-06": evaluateH06Onboarding,
  },
  content_commissioning_12step: {
    "H-01": evaluateH01Commissioning,
    "H-02": evaluateH02Commissioning,
    "H-03": evaluateH03Commissioning,
    "H-04": evaluateH04Commissioning,
  },
  signal_monitoring_8step: {
    "H-01": evaluateH01Monitoring,
    "H-02": evaluateH02Monitoring,
  },
};

const FLAG_EVALUATORS: Record<WorkflowId, Record<string, EvaluatorFn>> = {
  onboarding_18step: {
    "F-01": evaluateF01Onboarding,
    "F-02": evaluateF02Onboarding,
    "F-03": evaluateF03Onboarding,
    "F-04": evaluateF04Onboarding,
    "F-05": evaluateF05Onboarding,
    "F-06": evaluateF06Onboarding,
  },
  content_commissioning_12step: {
    "F-01": evaluateF01Commissioning,
  },
  signal_monitoring_8step: {
    "F-01": evaluateF01Monitoring,
  },
};

/**
 * Evaluates a step's hold_triggers and flag_triggers (read from the workflow
 * JSON) against a practitioner submission. Returns fully-formed HoldRecord/
 * FlagRecord objects for every trigger that fires. Per the L2-D rule, FLAG
 * evaluation is only meaningful once all HOLDs are clear — this function
 * still evaluates both, but the state machine must not surface FLAG
 * acknowledgment controls while activeHolds.length > 0.
 *
 * Dispatch is keyed on (workflow_id, code). A trigger code with no registered
 * evaluator for the step's workflow throws rather than silently passing —
 * a missing branch must be a loud authoring/build error, never a fallback
 * `false` that lets an authored gate go inert without anyone noticing.
 */
export function evaluateStep(step: WorkflowStepDefinition, submission: StepSubmission): EvaluationResult {
  const firedHolds: HoldRecord[] = [];
  for (const trigger of step.hold_triggers) {
    const evaluator = HOLD_EVALUATORS[step.workflow_id]?.[trigger.code];
    if (!evaluator) {
      throw new Error(
        `No HOLD evaluator registered for code "${trigger.code}" on workflow "${step.workflow_id}" step ${step.step_id}.`,
      );
    }
    if (evaluator(step, submission)) {
      firedHolds.push(makeHoldRecord(step, trigger));
    }
  }

  const firedFlags: FlagRecord[] = [];
  for (const trigger of step.flag_triggers) {
    const evaluator = FLAG_EVALUATORS[step.workflow_id]?.[trigger.code];
    if (!evaluator) {
      throw new Error(
        `No FLAG evaluator registered for code "${trigger.code}" on workflow "${step.workflow_id}" step ${step.step_id}.`,
      );
    }
    if (evaluator(step, submission)) {
      firedFlags.push(makeFlagRecord(step, trigger));
    }
  }

  return { firedHolds, firedFlags };
}

/**
 * Returns the timestamp helper used for resolution/acknowledgment records.
 * Exported so the state machine and tests can use a single time source.
 */
export function nowIso(): string {
  return NOW();
}
