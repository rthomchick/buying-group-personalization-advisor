// Regression test suite for Document 5 §2.2 three-axis interaction matrix.
// Build 2 had no committed test coverage despite commit message fe9778e
// claiming "3 new three-axis test cases, 40/40 passing" — this rebuilds
// real coverage of the full 7-row interaction matrix, with dedicated
// attention to the named MEDIUM/INFERRED asymmetry rule.
//
// Run with: node --import ./test-resolve-hook.mjs lib/three-axis.test.ts
// Harness convention matches build1-advisor/lib/guided/flag-hold-evaluator.test.ts.

import { evalThreeAxis } from "./three-axis.ts";
import { DEFAULT_VISITOR_STATE } from "@kalder/shared";
import type { VisitorState } from "@kalder/shared";

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

function state(overrides: Partial<VisitorState>): VisitorState {
  return { ...DEFAULT_VISITOR_STATE, ...overrides };
}

// ===========================================================================
// Full Document 5 §2.2 interaction matrix (7 rows, authoritative from the
// file's own header comment):
//
//   Role Confidence | Buying Job Confidence | Axes               | active?
//   HIGH            | KNOWN                 | role x stage x bj  | yes (KNOWN)
//   HIGH            | INFERRED              | role x stage x bj  | yes (INFERRED)
//   HIGH            | UNKNOWN               | two-axis + prior   | no
//   MEDIUM          | KNOWN                 | role x stage x bj  | yes (KNOWN)
//   MEDIUM          | INFERRED              | two-axis + prior   | no   <- asymmetry
//   MEDIUM          | UNKNOWN               | two-axis + prior   | no
//   LOW/UNKNOWN role| any                    | Levels 3-5 cascade | no (fallback_level not 1/2)
// ===========================================================================

// --- Row 1: HIGH + KNOWN -> active, mode KNOWN, carries jtbd_code ----------
{
  const s = state({ confidence_tier: "HIGH", buying_job_confidence: "KNOWN", buying_job_confirmed: "JTBD-04" });
  const r = evalThreeAxis(s, 1);
  ok("HIGH + KNOWN @ Level 1: active", r.active === true);
  ok("HIGH + KNOWN @ Level 1: mode KNOWN", r.mode === "KNOWN");
  ok("HIGH + KNOWN @ Level 1: carries the confirmed jtbd_code", r.jtbd_code === "JTBD-04");
}

// --- Row 2: HIGH + INFERRED -> active, mode INFERRED, jtbd_code null -------
{
  const s = state({ confidence_tier: "HIGH", buying_job_confidence: "INFERRED", buying_job_confirmed: null });
  const r = evalThreeAxis(s, 1);
  ok("HIGH + INFERRED @ Level 1: active (the asymmetry's positive case)", r.active === true);
  ok("HIGH + INFERRED @ Level 1: mode INFERRED", r.mode === "INFERRED");
  ok("HIGH + INFERRED @ Level 1: jtbd_code is null (inferred, not confirmed)", r.jtbd_code === null);
}

// --- Row 3: HIGH + UNKNOWN -> not active, two-axis + prior -----------------
{
  const s = state({ confidence_tier: "HIGH", buying_job_confidence: "UNKNOWN", buying_job_confirmed: null });
  const r = evalThreeAxis(s, 1);
  ok("HIGH + UNKNOWN @ Level 1: not active", r.active === false);
  ok("HIGH + UNKNOWN @ Level 1: mode TWO_AXIS_PLUS_PRIOR", r.mode === "TWO_AXIS_PLUS_PRIOR");
  ok("HIGH + UNKNOWN @ Level 1: jtbd_code null", r.jtbd_code === null);
}

// --- Row 4: MEDIUM + KNOWN -> active, mode KNOWN ---------------------------
// Zero-party KNOWN buying job removes the inference layer entirely, so it's
// acceptable at MEDIUM even though INFERRED is not (see Row 5).
{
  const s = state({ confidence_tier: "MEDIUM", buying_job_confidence: "KNOWN", buying_job_confirmed: "JTBD-02" });
  const r = evalThreeAxis(s, 2);
  ok("MEDIUM + KNOWN @ Level 2: active (zero-party declaration removes the inference layer)", r.active === true);
  ok("MEDIUM + KNOWN @ Level 2: mode KNOWN", r.mode === "KNOWN");
  ok("MEDIUM + KNOWN @ Level 2: carries the confirmed jtbd_code", r.jtbd_code === "JTBD-02");
}

// --- Row 5: MEDIUM + INFERRED -> NOT active — THE NAMED ASYMMETRY RULE -----
// "The MEDIUM asymmetry rule" (Document 5 §2.2): INFERRED activates three-axis
// at Level 1 (HIGH) only — not at Level 2 (MEDIUM). By design, not omission:
// stacking an inferred buying job on top of already-uncertain MEDIUM role
// inference is too speculative to serve confidently.
{
  const s = state({ confidence_tier: "MEDIUM", buying_job_confidence: "INFERRED", buying_job_confirmed: null });
  const r = evalThreeAxis(s, 2);
  ok("MEDIUM + INFERRED @ Level 2: NOT active — the MEDIUM/INFERRED asymmetry rule fires here", r.active === false);
  ok("MEDIUM + INFERRED @ Level 2: falls to two-axis + prior, not INFERRED mode", r.mode === "TWO_AXIS_PLUS_PRIOR");
  ok("MEDIUM + INFERRED @ Level 2: jtbd_code null", r.jtbd_code === null);

  // Directly contrast against Row 2 (HIGH + INFERRED) to prove the asymmetry
  // is level-driven, not a general rule against INFERRED.
  const sHigh = state({ confidence_tier: "HIGH", buying_job_confidence: "INFERRED", buying_job_confirmed: null });
  const rHigh = evalThreeAxis(sHigh, 1);
  ok(
    "Asymmetry proof: identical buying_job_confidence (INFERRED) is active at Level 1 but not at Level 2 — the only difference is fallbackLevel",
    rHigh.active === true && r.active === false,
  );
}

// --- Row 6: MEDIUM + UNKNOWN -> not active ---------------------------------
{
  const s = state({ confidence_tier: "MEDIUM", buying_job_confidence: "UNKNOWN", buying_job_confirmed: null });
  const r = evalThreeAxis(s, 2);
  ok("MEDIUM + UNKNOWN @ Level 2: not active", r.active === false);
  ok("MEDIUM + UNKNOWN @ Level 2: mode TWO_AXIS_PLUS_PRIOR", r.mode === "TWO_AXIS_PLUS_PRIOR");
}

// --- Row 7: LOW/UNKNOWN role -> Levels 3-5 cascade, never active -----------
// evalThreeAxis is defensive: fallbackLevel outside {1,2} always returns the
// inactive default regardless of buying_job_confidence, since Levels 3-5 do
// not carry role confidence sufficient for buying-job-axis personalization.
{
  for (const level of [3, 4, 5] as const) {
    for (const bjConfidence of ["KNOWN", "INFERRED", "UNKNOWN"] as const) {
      const s = state({
        confidence_tier: "LOW",
        buying_job_confidence: bjConfidence,
        buying_job_confirmed: bjConfidence === "KNOWN" ? "JTBD-01" : null,
      });
      const r = evalThreeAxis(s, level);
      ok(`Level ${level} + buying_job_confidence ${bjConfidence}: never active (Levels 3-5 cascade)`, r.active === false);
      ok(`Level ${level} + buying_job_confidence ${bjConfidence}: mode is null, not evaluated at all`, r.mode === null);
      ok(`Level ${level} + buying_job_confidence ${bjConfidence}: jtbd_code null even if buying_job_confirmed is set`, r.jtbd_code === null);
    }
  }
}

// --- Defensive input handling: fallbackLevel outside 1/2 short-circuits ----
// before even checking buying_job_confidence, per the function's own doc
// comment ("no prior lookup for levels outside 1-2").
{
  const s = state({ confidence_tier: "HIGH", buying_job_confidence: "KNOWN", buying_job_confirmed: "JTBD-99" });
  const r3 = evalThreeAxis(s, 3);
  ok(
    "Even HIGH + KNOWN (which would be active at Level 1) short-circuits to inactive at Level 3 — the level gate is absolute",
    r3.active === false && r3.mode === null && r3.jtbd_code === null,
  );
}

// ---------------------------------------------------------------------------
console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailed assertions:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
