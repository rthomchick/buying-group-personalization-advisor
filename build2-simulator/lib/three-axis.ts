// Buying job axis evaluation — KNOWN / INFERRED / TWO_AXIS_PLUS_PRIOR
//
// Source of truth: knowledge/kalder_doc5_personalization_decisioning_rules.md,
// Section 2.2 "Three-Axis Activation Conditions" — the complete interaction
// matrix (authoritative from Document 2, Section 7.5):
//
//   Role Confidence | Buying Job Confidence | Axes               | active?
//   HIGH            | KNOWN                 | role x stage x bj  | yes (KNOWN)
//   HIGH            | INFERRED              | role x stage x bj  | yes (INFERRED)
//   HIGH            | UNKNOWN               | two-axis + prior   | no
//   MEDIUM          | KNOWN                 | role x stage x bj  | yes (KNOWN)
//   MEDIUM          | INFERRED              | two-axis + prior   | no
//   MEDIUM          | UNKNOWN               | two-axis + prior   | no
//   LOW/UNKNOWN role| any                    | Levels 3-5 cascade | no
//
// "The MEDIUM asymmetry rule" (§2.2): INFERRED activates three-axis at Level 1
// (HIGH) only — not at Level 2 (MEDIUM). This is by design, not omission:
// adding an inferred buying job on top of already-uncertain MEDIUM role
// inference is too speculative to serve confidently. Zero-party KNOWN buying
// job is acceptable at MEDIUM because self-identification removes the
// inference layer entirely.

import type { VisitorState, ThreeAxisResult } from "@kalder/shared";

/**
 * Evaluates whether three-axis (role x stage x buying_job) content selection
 * is active, given the visitor's buying job confidence and the fallback
 * level already determined by the decisioning engine. fallback_level must be
 * 1 (HIGH) or 2 (MEDIUM) for three-axis to ever activate — Levels 3-5 do not
 * carry role confidence sufficient for buying-job-axis personalization
 * (§2.2's "LOW/UNKNOWN role -> Levels 3-5 cascade" row); this function
 * still accepts any fallback_level defensively and returns not-active with
 * no prior lookup for levels outside 1-2, rather than assuming the caller
 * only ever invokes it post-Level-1/2-check.
 */
export function evalThreeAxis(state: VisitorState, fallbackLevel: 1 | 2 | 3 | 4 | 5): ThreeAxisResult {
  if (fallbackLevel !== 1 && fallbackLevel !== 2) {
    return { active: false, mode: null, jtbd_code: null };
  }

  if (state.buying_job_confidence === "KNOWN") {
    return { active: true, mode: "KNOWN", jtbd_code: state.buying_job_confirmed };
  }

  if (state.buying_job_confidence === "INFERRED" && fallbackLevel === 1) {
    return { active: true, mode: "INFERRED", jtbd_code: null };
  }

  // INFERRED at Level 2 (MEDIUM asymmetry rule) and UNKNOWN at either level
  // both fall through here: two-axis + PROBABLE_JOB_PRIORS applies, three-axis
  // is not active.
  return { active: false, mode: "TWO_AXIS_PLUS_PRIOR", jtbd_code: null };
}
