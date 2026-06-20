// Session audit log builder — assembles AuditLog from GuidedWorkflowState
//
// Source of truth:
// - knowledge/specs/kalder_layer2_developer_brief.md, "Audit Log Schema"
// - knowledge/specs/kalder_layer2_decisions_log_L2E_builds.md, "Audit Log Format (locked)"
// - packages/shared/src/audit-log.ts (AuditLog, AuditStepRecord — authoritative target shape)
//
// This is a pure transform: GuidedWorkflowState + workflow step definitions + a
// client domain string → AuditLog. It does not read or write any session store —
// the caller (the API route) supplies everything needed on each call, consistent
// with session state living client-side, never on the server.
//
// Reads resolvedHolds/acknowledgedFlags (the append-only history arrays) plus
// activeHolds/activeFlags (any still-open at call time) — never activeHolds/
// activeFlags alone, which do not retain history across step advancement.

import type { AuditLog, AuditStepRecord, AuditStepStatus, ConfigurationGapRecord as AuditConfigurationGapRecord } from "@kalder/shared";
import type { GuidedWorkflowState } from "../session/session-state";
import type { WorkflowStepDefinition } from "./flag-hold-evaluator";

function buildStepRecord(
  state: GuidedWorkflowState,
  step: WorkflowStepDefinition,
): AuditStepRecord {
  const stepId = step.step_id;

  const resolvedHoldsForStep = state.resolvedHolds.filter((h) => h.stepId === stepId);
  const activeHoldsForStep = state.activeHolds.filter((h) => h.stepId === stepId);
  const acknowledgedFlagsForStep = state.acknowledgedFlags.filter((f) => f.stepId === stepId);
  const activeFlagsForStep = state.activeFlags.filter((f) => f.stepId === stepId);
  const deferralForStep = state.deferralLog.find((d) => d.stepId === stepId);

  const holdCodes = [...resolvedHoldsForStep.map((h) => h.holdCode), ...activeHoldsForStep.map((h) => h.holdCode)];
  const flagCodes = [...acknowledgedFlagsForStep.map((f) => f.flagCode), ...activeFlagsForStep.map((f) => f.flagCode)];

  let status: AuditStepStatus;
  if (deferralForStep) {
    status = "deferred";
  } else if (resolvedHoldsForStep.length > 0) {
    status = "hold_resolved";
  } else if (acknowledgedFlagsForStep.length > 0) {
    status = "flagged_acknowledged";
  } else {
    status = "complete";
  }

  const mostRecentTimestamp =
    deferralForStep?.confirmedAtTimestamp ??
    resolvedHoldsForStep[resolvedHoldsForStep.length - 1]?.resolvedAtTimestamp ??
    acknowledgedFlagsForStep[acknowledgedFlagsForStep.length - 1]?.acknowledgedAtTimestamp ??
    state.sessionStartTimestamp;

  return {
    step_id: stepId,
    step_title: step.step_title,
    corpus_authority: step.corpus_authority,
    status,
    flag_codes: flagCodes,
    hold_codes: holdCodes,
    hold_resolution: resolvedHoldsForStep[resolvedHoldsForStep.length - 1]?.resolution ?? null,
    deferral_consequence: deferralForStep?.consequence ?? null,
    timestamp: mostRecentTimestamp,
  };
}

function buildConfigurationGapRecords(state: GuidedWorkflowState): AuditConfigurationGapRecord[] {
  // session-state.ts's ConfigurationGapRecord uses camelCase (in-app state
  // convention); audit-log.ts's ConfigurationGapRecord uses snake_case (the
  // exported/JSON audit record convention). These are two distinct types for
  // two distinct layers — map field-by-field, do not assume structural identity.
  return state.configurationGapRecords.map((gap) => ({
    gap_id: gap.gapId,
    trigger: gap.trigger,
    attribute: gap.attribute,
    consequence: gap.consequence,
    status: gap.status,
    timestamp: gap.timestamp,
  }));
}

export type BuildAuditLogOptions = {
  sessionId: string;
  clientDomain: string; // tal_domain value
  sessionEndTimestamp?: string | null; // null when exported mid-session
};

/**
 * Assembles a complete AuditLog from a GuidedWorkflowState. Every step that
 * has been touched (submitted, resolved, acknowledged, or deferred) produces
 * one AuditStepRecord. Steps never reached (not_started) are omitted — they
 * have no audit-relevant activity to record.
 */
export function buildAuditLog(
  state: GuidedWorkflowState,
  steps: WorkflowStepDefinition[],
  options: BuildAuditLogOptions,
): AuditLog {
  const touchedStepIds = new Set<number>([
    ...state.completedSteps,
    ...state.resolvedHolds.map((h) => h.stepId),
    ...state.activeHolds.map((h) => h.stepId),
    ...state.acknowledgedFlags.map((f) => f.stepId),
    ...state.activeFlags.map((f) => f.stepId),
    ...state.deferralLog.map((d) => d.stepId),
  ]);

  const stepsCompleted: AuditStepRecord[] = steps
    .filter((s) => touchedStepIds.has(s.step_id))
    .sort((a, b) => a.step_id - b.step_id)
    .map((s) => buildStepRecord(state, s));

  return {
    session_id: options.sessionId,
    data_model_version: state.dataModelVersion,
    session_start_timestamp: state.sessionStartTimestamp,
    session_end_timestamp: options.sessionEndTimestamp ?? null,
    practitioner_id: state.practitionerId,
    client_domain: options.clientDomain,
    steps_completed: stepsCompleted,
    configuration_gap_records: buildConfigurationGapRecords(state),
    deferral_count: state.deferralLog.length,
    holds_resolved_count: state.resolvedHolds.length,
    flags_acknowledged_count: state.acknowledgedFlags.length,
  };
}
