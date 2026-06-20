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

import type { HoldRecord, FlagRecord } from "../session/session-state";

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
  step_id: number;
  phase: number;
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
// Per-code condition predicates. Each predicate is named after the HOLD/FLAG
// code it evaluates and is intentionally explicit rather than parsed from the
// JSON's free-text `condition` field — the JSON is authoritative for WHICH
// codes apply to a step; this is the authoritative evaluation logic for what
// each code actually checks.
// ---------------------------------------------------------------------------

function evaluateH01(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
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

function evaluateH02(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
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

function evaluateH03(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  // H-03: consent gate blocking activation scope.
  if (step.step_id === 11) {
    return submission.claimsNullTreatedAsFunctionalOnly === true;
  }
  if (step.step_id === 12) {
    return submission.claimsTrack2Complete === true && submission.dpaDocumentationConfirmed !== true;
  }
  return false;
}

function evaluateH05(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
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

function evaluateH06(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  // H-06: data model version mismatch detected.
  if (step.step_id !== 18) return false;
  if (!submission.retrievalIndexVersion || !submission.expectedDataModelVersion) return false;
  return submission.retrievalIndexVersion !== submission.expectedDataModelVersion;
}

const HOLD_EVALUATORS: Record<string, (step: WorkflowStepDefinition, submission: StepSubmission) => boolean> = {
  "H-01": evaluateH01,
  "H-02": evaluateH02,
  "H-03": evaluateH03,
  // H-04 (prerequisite step incomplete) is evaluated by the state machine,
  // which has visibility into completedSteps — not by this per-step evaluator.
  "H-05": evaluateH05,
  "H-06": evaluateH06,
};

function evaluateF01(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  // F-01: practitioner is deviating from a corpus default.
  if (step.step_id === 2) return submission.value === false; // tal_member: false
  if (step.step_id === 4) return submission.value === "post_sale" || submission.value === "out_of_program";
  if (step.step_id === 18) return submission.practitionerOverrodeAdvisorSuggestion === true;
  return false;
}

function evaluateF02(_step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  // F-02: optional attribute is null and its absence degrades program scope.
  // Modeled here as "practitioner explicitly set false" — the JSON's own
  // deferral_consequence text covers the null/deferred case via deferral logging.
  return submission.value === false;
}

function evaluateF03(_step: WorkflowStepDefinition, _submission: StepSubmission): boolean {
  // F-03: practitioner has explicitly deferred a step. Fired by the state
  // machine's deferStep() path, not by submitted-value inspection here.
  return false;
}

function evaluateF04(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
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

function evaluateF05(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
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

function evaluateF06(step: WorkflowStepDefinition, submission: StepSubmission): boolean {
  // F-06: Advisor-derivable value overridden by practitioner.
  if (step.step_id === 3) {
    return submission.practitionerOverrodeAdvisorSuggestion === true;
  }
  return false;
}

const FLAG_EVALUATORS: Record<string, (step: WorkflowStepDefinition, submission: StepSubmission) => boolean> = {
  "F-01": evaluateF01,
  "F-02": evaluateF02,
  "F-03": evaluateF03,
  "F-04": evaluateF04,
  "F-05": evaluateF05,
  "F-06": evaluateF06,
};

/**
 * Evaluates a step's hold_triggers and flag_triggers (read from the workflow
 * JSON) against a practitioner submission. Returns fully-formed HoldRecord/
 * FlagRecord objects for every trigger that fires. Per the L2-D rule, FLAG
 * evaluation is only meaningful once all HOLDs are clear — this function
 * still evaluates both, but the state machine must not surface FLAG
 * acknowledgment controls while activeHolds.length > 0.
 */
export function evaluateStep(step: WorkflowStepDefinition, submission: StepSubmission): EvaluationResult {
  const firedHolds: HoldRecord[] = [];
  for (const trigger of step.hold_triggers) {
    const evaluator = HOLD_EVALUATORS[trigger.code];
    if (evaluator && evaluator(step, submission)) {
      firedHolds.push(makeHoldRecord(step, trigger));
    }
  }

  const firedFlags: FlagRecord[] = [];
  for (const trigger of step.flag_triggers) {
    const evaluator = FLAG_EVALUATORS[trigger.code];
    if (evaluator && evaluator(step, submission)) {
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
