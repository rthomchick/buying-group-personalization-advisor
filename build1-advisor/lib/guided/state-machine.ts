// GuidedWorkflowState management — step transitions, HOLD/FLAG tracking
//
// Source of truth:
// - knowledge/specs/kalder_onboarding_workflow_18step_spec.md (governing rules)
// - knowledge/specs/kalder_layer2_decisions_log_L2E_builds.md, "Guided Workflow Mode (locked)"
// - build1-advisor/lib/session/session-state.ts (GuidedWorkflowState and all record types — authoritative)
//
// Non-negotiable rule, enforced HERE (not delegated to the UI layer):
// activeHolds.length > 0 on the current step means the step is non-advanceable.
// advanceToNextStep() throws if called while any HOLD is active. There is no
// parameter, flag, or override path that bypasses this check.

import {
  type GuidedWorkflowState,
  type WorkflowId,
  type StepStatus,
  type HoldRecord,
  type FlagRecord,
  type DeferralRecord,
  type DeferralOption,
  type ConfigurationGapRecord,
  DATA_MODEL_VERSION,
} from "../session/session-state";
import { evaluateStep, nowIso, type WorkflowStepDefinition, type StepSubmission } from "./flag-hold-evaluator";

export class HoldBlocksAdvancementError extends Error {
  readonly stepId: number;
  readonly activeHolds: HoldRecord[];

  constructor(stepId: number, activeHolds: HoldRecord[]) {
    super(
      `Step ${stepId} cannot advance: ${activeHolds.length} active HOLD(s) ` +
        `(${activeHolds.map((h) => h.holdCode).join(", ")}) must be resolved first. ` +
        `Non-bypassable per L2-D Guided Workflow Mode rules.`,
    );
    this.name = "HoldBlocksAdvancementError";
    this.stepId = stepId;
    this.activeHolds = activeHolds;
  }
}

export class FlagAcknowledgmentBlockedByHoldError extends Error {
  readonly stepId: number;
  readonly activeHolds: HoldRecord[];

  constructor(stepId: number, activeHolds: HoldRecord[]) {
    super(`Step ${stepId}: FLAG acknowledgment is unavailable while active HOLDs remain on this step.`);
    this.name = "FlagAcknowledgmentBlockedByHoldError";
    this.stepId = stepId;
    this.activeHolds = activeHolds;
  }
}

export function initializeWorkflowState(workflowId: WorkflowId, practitionerId: string): GuidedWorkflowState {
  return {
    workflowId,
    currentStep: 1,
    completedSteps: [],
    stepStatuses: { 1: "in_progress" },
    activeHolds: [],
    activeFlags: [],
    resolvedHolds: [],
    acknowledgedFlags: [],
    deferralLog: [],
    configurationGapRecords: [],
    dataModelVersion: DATA_MODEL_VERSION,
    sessionStartTimestamp: nowIso(),
    practitionerId,
  };
}

function findStep(steps: WorkflowStepDefinition[], stepId: number): WorkflowStepDefinition {
  const step = steps.find((s) => s.step_id === stepId);
  if (!step) {
    throw new Error(`No step definition found for step_id ${stepId} in workflow.`);
  }
  return step;
}

/**
 * Submits a value for the current step. Runs the FLAG/HOLD evaluator against
 * the step's trigger definitions (read from the workflow JSON) and updates
 * activeHolds / activeFlags / stepStatuses accordingly. Does NOT advance the
 * step — advancement is a separate, gated action via advanceToNextStep().
 */
export function submitStep(
  state: GuidedWorkflowState,
  steps: WorkflowStepDefinition[],
  submission: StepSubmission,
): GuidedWorkflowState {
  const step = findStep(steps, state.currentStep);
  const { firedHolds, firedFlags } = evaluateStep(step, submission);

  const stepStatus: StepStatus = firedHolds.length > 0 ? "hold_active" : firedFlags.length > 0 ? "flag_pending" : "in_progress";

  return {
    ...state,
    activeHolds: firedHolds,
    activeFlags: firedFlags,
    stepStatuses: { ...state.stepStatuses, [state.currentStep]: stepStatus },
  };
}

/**
 * Resolves a HOLD on the current step. Must be explicitly confirmed by the
 * Advisor (practitioner-entered resolution text) — silent advancement is
 * prohibited, so this function requires a non-empty resolution string.
 */
export function resolveHold(state: GuidedWorkflowState, holdCode: string, resolution: string): GuidedWorkflowState {
  if (!resolution || resolution.trim().length === 0) {
    throw new Error(`HOLD ${holdCode} resolution requires explicit practitioner-entered resolution text.`);
  }

  const targetHold = state.activeHolds.find((h) => h.holdCode === holdCode && h.stepId === state.currentStep);
  if (!targetHold) {
    throw new Error(`No active HOLD with code ${holdCode} on step ${state.currentStep}.`);
  }

  const resolvedHold: HoldRecord = { ...targetHold, resolved: true, resolution, resolvedAtTimestamp: nowIso() };

  const remainingActiveHolds = state.activeHolds.filter((h) => !(h.holdCode === holdCode && h.stepId === state.currentStep));
  const stepStatus: StepStatus =
    remainingActiveHolds.length > 0 ? "hold_active" : state.activeFlags.length > 0 ? "flag_pending" : "in_progress";

  return {
    ...state,
    activeHolds: remainingActiveHolds,
    resolvedHolds: [...state.resolvedHolds, resolvedHold],
    stepStatuses: { ...state.stepStatuses, [state.currentStep]: stepStatus },
  };
}

/**
 * Acknowledges a FLAG on the current step. Per L2-D: FLAG acknowledgment is
 * available only after all HOLDs on the current step are resolved. Enforced
 * here, not just in the UI — calling this while activeHolds.length > 0 throws.
 */
export function acknowledgeFlag(state: GuidedWorkflowState, flagCode: string): GuidedWorkflowState {
  if (state.activeHolds.length > 0) {
    throw new FlagAcknowledgmentBlockedByHoldError(state.currentStep, state.activeHolds);
  }

  const targetFlag = state.activeFlags.find((f) => f.flagCode === flagCode && f.stepId === state.currentStep);
  if (!targetFlag) {
    throw new Error(`No active FLAG with code ${flagCode} on step ${state.currentStep}.`);
  }

  const acknowledgedFlag: FlagRecord = { ...targetFlag, acknowledged: true, acknowledgedAtTimestamp: nowIso() };

  const remainingActiveFlags = state.activeFlags.filter((f) => !(f.flagCode === flagCode && f.stepId === state.currentStep));

  return {
    ...state,
    activeFlags: remainingActiveFlags,
    acknowledgedFlags: [...state.acknowledgedFlags, acknowledgedFlag],
  };
}

let gapIdCounter = 0;
function generateGapId(): string {
  gapIdCounter += 1;
  return `gap_${Date.now()}_${gapIdCounter}`;
}

/**
 * Defers the current step. "Defer this step" is a dropdown, not a button —
 * the caller must supply the chosen DeferralOption and the named consequence
 * text (sourced from the step's deferral_consequence field) that the
 * practitioner read and confirmed before deferral was allowed to proceed.
 * Records the deferral in deferralLog. If the step's category is "B" with an
 * F-04-style consent gap, callers should also create a ConfigurationGapRecord
 * (step 12's F-04 gap is persistent and not cleared by acknowledgment — see
 * flag-hold-evaluator.ts and the onboarding spec, Notes for Claude Code §3).
 */
export function deferStep(
  state: GuidedWorkflowState,
  step: WorkflowStepDefinition,
  option: DeferralOption,
  consequence: string,
): GuidedWorkflowState {
  if (step.render_deferral_control === false) {
    throw new Error(`Step ${step.step_id} does not permit deferral — no deferral control is rendered for this step.`);
  }
  if (option === "cancel_deferral") {
    throw new Error("cancel_deferral is a UI-only option and must not be passed to deferStep().");
  }

  const deferralRecord: DeferralRecord = {
    stepId: step.step_id,
    option,
    consequence,
    confirmedAtTimestamp: nowIso(),
  };

  return {
    ...state,
    deferralLog: [...state.deferralLog, deferralRecord],
    stepStatuses: { ...state.stepStatuses, [step.step_id]: "deferred" },
  };
}

export function addConfigurationGapRecord(
  state: GuidedWorkflowState,
  trigger: string,
  attribute: string,
  consequence: string,
): GuidedWorkflowState {
  const gapRecord: ConfigurationGapRecord = {
    gapId: generateGapId(),
    trigger,
    attribute,
    consequence,
    status: "persistent_unresolved",
    timestamp: nowIso(),
  };

  return { ...state, configurationGapRecords: [...state.configurationGapRecords, gapRecord] };
}

/**
 * THE non-negotiable rule. Advances from the current step to the next.
 * Throws HoldBlocksAdvancementError if any HOLD is active on the current
 * step — there is no parameter or override path that bypasses this check.
 * This is the sole authority on advanceability; the UI's disabled "Next
 * Step" control is a reflection of this function's guard, not a substitute
 * for it.
 */
export function advanceToNextStep(state: GuidedWorkflowState, totalSteps: number): GuidedWorkflowState {
  if (state.activeHolds.length > 0) {
    throw new HoldBlocksAdvancementError(state.currentStep, state.activeHolds);
  }

  const currentStatus = state.stepStatuses[state.currentStep];
  const completedStatus: StepStatus = currentStatus === "deferred" ? "deferred" : "complete";

  const completedSteps =
    completedStatus === "complete" && !state.completedSteps.includes(state.currentStep)
      ? [...state.completedSteps, state.currentStep]
      : state.completedSteps;

  if (state.currentStep >= totalSteps) {
    return {
      ...state,
      completedSteps,
      stepStatuses: { ...state.stepStatuses, [state.currentStep]: completedStatus },
    };
  }

  const nextStep = state.currentStep + 1;
  const nextStepStatus: StepStatus = state.stepStatuses[nextStep] ?? "not_started";

  return {
    ...state,
    currentStep: nextStep,
    completedSteps,
    stepStatuses: {
      ...state.stepStatuses,
      [state.currentStep]: completedStatus,
      [nextStep]: nextStepStatus === "not_started" ? "in_progress" : nextStepStatus,
    },
    // Advancing to a new step clears the prior step's active HOLD/FLAG
    // working set — activeHolds is already guaranteed empty by the guard
    // above; activeFlags resets because FLAGs are evaluated per-step.
    activeFlags: [],
  };
}

/**
 * Returns true if "Next Step" should be enabled for the current step.
 * Pure derived state — the UI layer must read this, not re-implement the
 * check, but the actual enforcement is advanceToNextStep()'s guard above.
 */
export function canAdvance(state: GuidedWorkflowState): boolean {
  return state.activeHolds.length === 0;
}
