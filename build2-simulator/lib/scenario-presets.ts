// "What Would Change If..." state transforms for the four edge states
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md,
// "'What Would Change If...' Toggles" — four scenario buttons, each applying
// a named state change and re-rendering immediately. Each function here
// returns a new VisitorState; none mutate the input, so the caller can
// always compare before/after states (the upgrade-path demo sequences in
// the decisions log depend on showing both).

import type { VisitorState } from "@kalder/shared";

/** "What if coverage advances to 'partial'?" */
export function coverageAdvancesToPartial(state: VisitorState): VisitorState {
  return { ...state, solution_category_coverage_status: "partial" };
}

/**
 * "What if the contact responds to progressive disclosure?" — the Contact B
 * upgrade path (decisions log § Synthetic Data Set): zero-party Champion
 * self-identification clears differential_insufficient, upgrades
 * confidence_tier to MEDIUM, and confirms the buying job via KNOWN state.
 */
export function contactRespondsToProgressiveDisclosure(state: VisitorState): VisitorState {
  return {
    ...state,
    differential_insufficient: false,
    confidence_tier: "MEDIUM",
    buying_job_confidence: "KNOWN",
    buying_job_confirmed: "IT-ACQ-CH-PI-1",
  };
}

/** "What if this contact is in the holdback group?" */
export function contactIsInHoldbackGroup(state: VisitorState): VisitorState {
  return { ...state, holdback_group: true };
}

/** "What if consent is declined?" */
export function consentIsDeclined(state: VisitorState): VisitorState {
  return { ...state, visitor_consent_state: "declined" };
}
