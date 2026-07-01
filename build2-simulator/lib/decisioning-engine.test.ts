// Regression test suite for the Document 5 §1.6 eight-step decisioning engine.
// Build 2 had no committed test coverage despite commit messages (2c37e46,
// fe9778e) claiming passing suites — this rebuilds real coverage against the
// actual current behavior of lib/decisioning-engine.ts.
//
// Run with: node lib/decisioning-engine.test.ts
// (Node 20+ with native TypeScript stripping; no test framework dependency.)
// Harness convention matches build1-advisor/lib/guided/flag-hold-evaluator.test.ts.

import { runDecisioningEngine } from "./decisioning-engine.ts";
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
// Step 0 — Consent gate (Document 5 §1.7; Document 9)
// ===========================================================================
{
  const r = runDecisioningEngine(state({ visitor_consent_state: "declined", tal_member: true }));
  ok("declined consent -> consent_suppressed true", r.consent_suppressed === true);
  ok("declined consent + tal_member -> Level 4", r.fallback_level === 4);
  ok("declined consent -> routing_path consent_gate", r.routing_path === "consent_gate");

  const r2 = runDecisioningEngine(state({ visitor_consent_state: "declined", tal_member: false }));
  ok("declined consent + non-TAL -> Level 5", r2.fallback_level === 5);

  const r3 = runDecisioningEngine(state({ visitor_consent_state: null as unknown as VisitorState["visitor_consent_state"], tal_member: true }));
  ok("null consent treated as declined, not permissive -> consent_suppressed true", r3.consent_suppressed === true);
  ok("null consent + tal_member -> Level 4", r3.fallback_level === 4);

  const r4 = runDecisioningEngine(state({ visitor_consent_state: "functional_only" }));
  ok("functional_only consent passes gate (not suppressed)", r4.consent_suppressed === false);

  const r5 = runDecisioningEngine(state({ visitor_consent_state: "full" }));
  ok("full consent passes gate (not suppressed)", r5.consent_suppressed === false);
}

// ===========================================================================
// Step 1 — TAL membership check (Document 5 §1.3, Level 5)
// ===========================================================================
{
  const r = runDecisioningEngine(state({ visitor_consent_state: "full", tal_member: false }));
  ok("non-TAL -> Level 5", r.fallback_level === 5);
  ok("non-TAL -> routing_path non_tal", r.routing_path === "non_tal");
  ok("non-TAL -> not consent_suppressed (passed consent gate)", r.consent_suppressed === false);
}

// ===========================================================================
// Step 2 — P0 differential_insufficient override (Document 5 §1.2)
// Absolute — takes precedence over confidence_tier at any level.
// ===========================================================================
{
  const r = runDecisioningEngine(
    state({ tal_member: true, differential_insufficient: true, confidence_tier: "HIGH", solution_category_coverage_status: "complete" }),
  );
  ok("differential_insufficient overrides even HIGH confidence + complete coverage -> Level 3", r.fallback_level === 3);
  ok("differential_insufficient -> differential_override true", r.differential_override === true);
  ok("differential_insufficient -> routing_path differential_insufficient_override", r.routing_path === "differential_insufficient_override");

  const r2 = runDecisioningEngine(
    state({ tal_member: true, differential_insufficient: true, holdback_group: true, confidence_tier: "HIGH" }),
  );
  ok("differential_insufficient fires BEFORE holdback check (Step 2 precedes Step 4)", r2.routing_path === "differential_insufficient_override");
  ok("differential override -> Level 3, not holdback's Level 5", r2.fallback_level === 3);
}

// ===========================================================================
// Step 3/4 — Holdback override (Document 5 §7.1-7.7)
// holdback_group: true forces Level 5 for ALL module slots regardless of
// confidence_tier or otherwise-computed fallback_level.
// ===========================================================================
{
  const r = runDecisioningEngine(
    state({ tal_member: true, holdback_group: true, confidence_tier: "HIGH", solution_category_coverage_status: "complete", differential_insufficient: false }),
  );
  ok("holdback forces Level 5 even for HIGH confidence + complete coverage", r.fallback_level === 5);
  ok("holdback -> routing_path holdback_override", r.routing_path === "holdback_override");
  ok("holdback -> three_axis_active false (buildResult default, evalThreeAxis never called)", r.three_axis_active === false);
  ok("holdback -> three_axis_result inactive default", r.three_axis_result.active === false && r.three_axis_result.mode === null);

  const r2 = runDecisioningEngine(
    state({ tal_member: true, holdback_group: true, confidence_tier: "MEDIUM", solution_category_coverage_status: "pending" }),
  );
  ok("holdback forces Level 5 even with pending coverage (not Level 5 for a different reason)", r2.fallback_level === 5);
  ok("holdback + pending coverage -> pending_solution_fallback still recorded true", r2.pending_solution_fallback === true);
  ok("holdback -> routing_path is holdback_override, not a coverage-driven path", r2.routing_path === "holdback_override");
}

// ===========================================================================
// Step 5 — Level 1 (Document 5 §1.3): HIGH confidence, not pending, not partial
// ===========================================================================
{
  const r = runDecisioningEngine(
    state({ tal_member: true, confidence_tier: "HIGH", solution_category_coverage_status: "complete", differential_insufficient: false }),
  );
  ok("HIGH confidence + complete coverage -> Level 1", r.fallback_level === 1);
  ok("Level 1 -> routing_path level_1", r.routing_path === "level_1");

  const rPartial = runDecisioningEngine(
    state({ tal_member: true, confidence_tier: "HIGH", solution_category_coverage_status: "partial" }),
  );
  ok("HIGH confidence + partial coverage disqualifies Level 1 (role-variant nodes absent)", rPartial.fallback_level !== 1);

  const rPending = runDecisioningEngine(
    state({ tal_member: true, confidence_tier: "HIGH", solution_category_coverage_status: "pending" }),
  );
  ok("HIGH confidence + pending coverage disqualifies Level 1", rPending.fallback_level !== 1);
  ok("pending coverage -> pending_solution_fallback true", rPending.pending_solution_fallback === true);
}

// ===========================================================================
// Step 6 — Level 2 (Document 5 §1.3): MEDIUM confidence, not pending, not partial
// ===========================================================================
{
  const r = runDecisioningEngine(
    state({ tal_member: true, confidence_tier: "MEDIUM", solution_category_coverage_status: "complete", differential_insufficient: false }),
  );
  ok("MEDIUM confidence + complete coverage -> Level 2", r.fallback_level === 2);
  ok("Level 2 -> routing_path level_2", r.routing_path === "level_2");

  const rPartial = runDecisioningEngine(
    state({ tal_member: true, confidence_tier: "MEDIUM", solution_category_coverage_status: "partial" }),
  );
  ok("MEDIUM confidence + partial coverage disqualifies Level 2 -> falls through to Level 3", rPartial.fallback_level === 3);
  ok("Contact A shape (MEDIUM + partial + solution_category set) matches documented Level 3 correction", rPartial.routing_path === "level_3");

  const rPending = runDecisioningEngine(
    state({ tal_member: true, confidence_tier: "MEDIUM", solution_category_coverage_status: "pending" }),
  );
  ok("MEDIUM confidence + pending coverage disqualifies Level 2", rPending.fallback_level !== 2);
}

// ===========================================================================
// Step 7/8 — Level 3 vs Level 4 (Document 5 §1.6 Step 4; §1.3)
// LOW/UNKNOWN confidence with a solution_category -> Level 3;
// without one -> Level 4 default.
// ===========================================================================
{
  const r3 = runDecisioningEngine(
    state({ tal_member: true, confidence_tier: "LOW", solution_category: "it_operations" }),
  );
  ok("LOW confidence + solution_category present -> Level 3", r3.fallback_level === 3);
  ok("Level 3 -> routing_path level_3", r3.routing_path === "level_3");

  const r4 = runDecisioningEngine(
    state({ tal_member: true, confidence_tier: "UNKNOWN", solution_category: null as unknown as VisitorState["solution_category"] }),
  );
  ok("UNKNOWN confidence + no solution_category -> Level 4 default", r4.fallback_level === 4);
  ok("Level 4 -> routing_path level_4", r4.routing_path === "level_4");
}

// ===========================================================================
// Three-axis wiring: only called at Level 1/2 return points (per file's own
// header comment) — every other routing path must carry the inactive default.
// ===========================================================================
{
  const rLevel1 = runDecisioningEngine(
    state({ tal_member: true, confidence_tier: "HIGH", solution_category_coverage_status: "complete", buying_job_confidence: "KNOWN", buying_job_confirmed: "JTBD-01" }),
  );
  ok("Level 1 + KNOWN buying job -> three_axis_active true", rLevel1.three_axis_active === true);
  ok("Level 1 + KNOWN buying job -> three_axis_result mode KNOWN", rLevel1.three_axis_result.mode === "KNOWN");

  const rLevel2 = runDecisioningEngine(
    state({ tal_member: true, confidence_tier: "MEDIUM", solution_category_coverage_status: "complete", buying_job_confidence: "INFERRED" }),
  );
  ok("Level 2 + INFERRED buying job -> three_axis_active false (MEDIUM/INFERRED asymmetry, evaluated in three-axis.test.ts)", rLevel2.three_axis_active === false);

  const rLevel3 = runDecisioningEngine(
    state({ tal_member: true, confidence_tier: "LOW", solution_category: "it_operations", buying_job_confidence: "KNOWN", buying_job_confirmed: "JTBD-01" }),
  );
  ok("Level 3 never calls evalThreeAxis, even with KNOWN buying job -> three_axis_active false", rLevel3.three_axis_active === false);
  ok("Level 3 -> three_axis_result is the inactive default, not a real evaluation", rLevel3.three_axis_result.mode === null);

  const rLevel4 = runDecisioningEngine(
    state({ tal_member: true, confidence_tier: "UNKNOWN", solution_category: null as unknown as VisitorState["solution_category"], buying_job_confidence: "KNOWN", buying_job_confirmed: "JTBD-01" }),
  );
  ok("Level 4 never calls evalThreeAxis -> three_axis_active false", rLevel4.three_axis_active === false);

  const rConsent = runDecisioningEngine(state({ visitor_consent_state: "declined", buying_job_confidence: "KNOWN" }));
  ok("consent_gate path never calls evalThreeAxis -> three_axis_active false", rConsent.three_axis_active === false);

  const rHoldback = runDecisioningEngine(state({ tal_member: true, holdback_group: true, confidence_tier: "HIGH", buying_job_confidence: "KNOWN" }));
  ok("holdback path never calls evalThreeAxis -> three_axis_active false", rHoldback.three_axis_active === false);
}

// ===========================================================================
// Trace completeness: every step, terminating or not, must push a trace entry.
// ===========================================================================
{
  const r = runDecisioningEngine(
    state({ tal_member: true, confidence_tier: "HIGH", solution_category_coverage_status: "complete" }),
  );
  ok("Level 1 trace includes consent_gate, tal_check, p0_differential_check, coverage_check, holdback_check, level_1_check (6 steps)", r.trace.length === 6);
  ok("first trace entry is consent_gate", r.trace[0].step === "consent_gate");
  ok("every trace entry carries a corpus_authority citation", r.trace.every((t) => typeof t.corpus_authority === "string" && t.corpus_authority.length > 0));

  const rLevel4 = runDecisioningEngine(
    state({ tal_member: true, confidence_tier: "UNKNOWN", solution_category: null as unknown as VisitorState["solution_category"] }),
  );
  ok(
    "Level 4 trace includes 8 steps (consent, tal, p0, coverage, holdback, level1, level2, level4 — " +
      "level_3_check pushes no trace entry when solution_category is absent, only on its PASS branch)",
    rLevel4.trace.length === 8,
  );
  ok("last trace entry for Level 4 path is level_4_check", rLevel4.trace[rLevel4.trace.length - 1].step === "level_4_check");
}

// ---------------------------------------------------------------------------
console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailed assertions:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
