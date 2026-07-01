// Regression test suite for the Document 4 §5.3 module renderer.
// Build 2 had no committed test coverage despite commit message e20c20d
// claiming "27/27 tests passing" — this rebuilds real coverage of all 11
// module types, the per-level fallback table, and the suppressed_active vs.
// suppressed_holdback distinction.
//
// Run with: node --import ./test-resolve-hook.mjs lib/module-renderer.test.ts
// Harness convention matches build1-advisor/lib/guided/flag-hold-evaluator.test.ts.

import { renderModules } from "./module-renderer.ts";
import { DEFAULT_VISITOR_STATE } from "@kalder/shared";
import type { VisitorState, DecisioningResult } from "@kalder/shared";

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

function result(level: 1 | 2 | 3 | 4 | 5, overrides: Partial<DecisioningResult> = {}): DecisioningResult {
  return {
    fallback_level: level,
    pending_solution_fallback: false,
    three_axis_active: false,
    three_axis_result: { active: false, mode: null, jtbd_code: null },
    differential_override: false,
    consent_suppressed: false,
    routing_path: `level_${level}`,
    trace: [],
    ...overrides,
  };
}

const ALL_MODULE_TYPES = [
  "hero",
  "benefits",
  "cta",
  "gated_assets",
  "proof",
  "narrative",
  "problem_framing",
  "outcomes",
  "use_cases",
  "trust_signals",
  "progressive_disclosure",
] as const;

function slotFor(comp: ReturnType<typeof renderModules>, moduleType: string) {
  const slot = comp.slots.find((s) => s.module_type === moduleType);
  if (!slot) throw new Error(`Fixture error: no slot for module_type ${moduleType}`);
  return slot;
}

// ===========================================================================
// Structural invariant: all 11 module types always present, every level,
// never omitted — including at levels where a type doesn't render.
// ===========================================================================
{
  for (const level of [1, 2, 3, 4, 5] as const) {
    const comp = renderModules(state({}), result(level));
    ok(`Level ${level}: composition has all 11 module slots present`, comp.slots.length === 11);
    ok(
      `Level ${level}: slot module_types match the full MODULE_TYPES set exactly`,
      ALL_MODULE_TYPES.every((mt) => comp.slots.some((s) => s.module_type === mt)),
    );
    ok(`Level ${level}: composition fallback_level matches the input result`, comp.fallback_level === level);
  }
}

// ===========================================================================
// Document 4 §5.3 per-level fallback table — active-levels-per-module-type.
// Module types with a documented "not_rendered" ceiling:
//   - gated_assets: not_rendered at Level 5
//   - proof: not_rendered at Levels 4-5
//   - problem_framing: not_rendered at Levels 4-5
//   - outcomes: not_rendered at Levels 4-5
//   - use_cases: not_rendered at Levels 4-5
//   - trust_signals: not_rendered at Level 5
//   - progressive_disclosure: suppressed_active at 1, rendered 2-4, not_rendered at 5
// hero, benefits, cta, narrative: always "rendered" at every level (content
// varies, but the slot itself is never withheld).
// ===========================================================================
{
  const alwaysRendered = ["hero", "benefits", "cta", "narrative"] as const;
  for (const level of [1, 2, 3, 4, 5] as const) {
    const comp = renderModules(state({}), result(level));
    for (const mt of alwaysRendered) {
      ok(`${mt} @ Level ${level}: rendering_state is "rendered" (never withheld)`, slotFor(comp, mt).rendering_state === "rendered");
    }
  }

  // gated_assets: rendered 1-4, not_rendered 5
  for (const level of [1, 2, 3, 4] as const) {
    const comp = renderModules(state({}), result(level));
    ok(`gated_assets @ Level ${level}: rendered`, slotFor(comp, "gated_assets").rendering_state === "rendered");
  }
  ok("gated_assets @ Level 5: not_rendered", slotFor(renderModules(state({}), result(5)), "gated_assets").rendering_state === "not_rendered");

  // proof: rendered 1-3, not_rendered 4-5
  for (const level of [1, 2, 3] as const) {
    const comp = renderModules(state({}), result(level));
    ok(`proof @ Level ${level}: rendered`, slotFor(comp, "proof").rendering_state === "rendered");
  }
  for (const level of [4, 5] as const) {
    const comp = renderModules(state({}), result(level));
    ok(`proof @ Level ${level}: not_rendered`, slotFor(comp, "proof").rendering_state === "not_rendered");
  }

  // problem_framing: rendered 1-3, not_rendered 4-5
  for (const level of [1, 2, 3] as const) {
    const comp = renderModules(state({}), result(level));
    ok(`problem_framing @ Level ${level}: rendered`, slotFor(comp, "problem_framing").rendering_state === "rendered");
  }
  for (const level of [4, 5] as const) {
    const comp = renderModules(state({}), result(level));
    ok(`problem_framing @ Level ${level}: not_rendered`, slotFor(comp, "problem_framing").rendering_state === "not_rendered");
  }

  // outcomes: rendered 1-3, not_rendered 4-5
  for (const level of [1, 2, 3] as const) {
    const comp = renderModules(state({}), result(level));
    ok(`outcomes @ Level ${level}: rendered`, slotFor(comp, "outcomes").rendering_state === "rendered");
  }
  for (const level of [4, 5] as const) {
    const comp = renderModules(state({}), result(level));
    ok(`outcomes @ Level ${level}: not_rendered`, slotFor(comp, "outcomes").rendering_state === "not_rendered");
  }

  // use_cases: rendered 1-3, not_rendered 4-5
  for (const level of [1, 2, 3] as const) {
    const comp = renderModules(state({}), result(level));
    ok(`use_cases @ Level ${level}: rendered`, slotFor(comp, "use_cases").rendering_state === "rendered");
  }
  for (const level of [4, 5] as const) {
    const comp = renderModules(state({}), result(level));
    ok(`use_cases @ Level ${level}: not_rendered`, slotFor(comp, "use_cases").rendering_state === "not_rendered");
  }

  // trust_signals: rendered 1-4, not_rendered 5
  for (const level of [1, 2, 3, 4] as const) {
    const comp = renderModules(state({}), result(level));
    ok(`trust_signals @ Level ${level}: rendered`, slotFor(comp, "trust_signals").rendering_state === "rendered");
  }
  ok("trust_signals @ Level 5: not_rendered", slotFor(renderModules(state({}), result(5)), "trust_signals").rendering_state === "not_rendered");
}

// ===========================================================================
// progressive_disclosure: the one module type with two distinct, never-
// conflated suppression states, plus a normal rendered range and a
// not_rendered ceiling.
// ===========================================================================
{
  // Level 1: suppressed_active (architecturally off by design, not absent)
  const compL1 = renderModules(state({ holdback_group: false }), result(1));
  ok("progressive_disclosure @ Level 1, no holdback: suppressed_active", slotFor(compL1, "progressive_disclosure").rendering_state === "suppressed_active");

  // Levels 2-4: rendered normally
  for (const level of [2, 3, 4] as const) {
    const comp = renderModules(state({ holdback_group: false }), result(level));
    ok(`progressive_disclosure @ Level ${level}, no holdback: rendered`, slotFor(comp, "progressive_disclosure").rendering_state === "rendered");
  }

  // Level 5, no holdback: not_rendered (simply absent from the offer catalog at this level)
  const compL5 = renderModules(state({ holdback_group: false }), result(5));
  ok("progressive_disclosure @ Level 5, no holdback: not_rendered (plain absence, not a measurement suppression)", slotFor(compL5, "progressive_disclosure").rendering_state === "not_rendered");

  // Holdback (Level 5 forced by decisioning engine): suppressed_holdback — a
  // DIFFERENT rendering_state than plain Level-5 not_rendered, and checked
  // BEFORE the level-based logic per the source's own stated precedence.
  const compHoldback = renderModules(state({ holdback_group: true }), result(5));
  ok(
    "progressive_disclosure @ Level 5 WITH holdback: suppressed_holdback, distinct from plain not_rendered",
    slotFor(compHoldback, "progressive_disclosure").rendering_state === "suppressed_holdback",
  );
  ok(
    "suppressed_active (Level 1) and suppressed_holdback (holdback) are never the same value",
    slotFor(compL1, "progressive_disclosure").rendering_state !== slotFor(compHoldback, "progressive_disclosure").rendering_state,
  );

  // Holdback precedence: even if holdback_group is true at a level that would
  // otherwise be suppressed_active (Level 1) or rendered (Level 2-4), holdback
  // wins — checked first in the source.
  const compHoldbackLevel1 = renderModules(state({ holdback_group: true }), result(1));
  ok(
    "holdback_group: true takes precedence over Level-1 suppressed_active — holdback check runs first",
    slotFor(compHoldbackLevel1, "progressive_disclosure").rendering_state === "suppressed_holdback",
  );
  const compHoldbackLevel2 = renderModules(state({ holdback_group: true }), result(2));
  ok(
    "holdback_group: true takes precedence over Level-2 normal rendering",
    slotFor(compHoldbackLevel2, "progressive_disclosure").rendering_state === "suppressed_holdback",
  );
}

// ===========================================================================
// axes_active: per-level axis narrowing (spot checks on cta, which has the
// most complex per-level branching — role/confidence_tier/buying_job varies
// by level and by buying_job_confidence).
// ===========================================================================
{
  const compL1 = renderModules(state({}), result(1));
  ok("cta @ Level 1: full intended axes (role, confidence_tier, buying_job)", JSON.stringify(slotFor(compL1, "cta").axes_active) === JSON.stringify(["role", "confidence_tier", "buying_job"]));

  const compL2Known = renderModules(state({ buying_job_confidence: "KNOWN" }), result(2));
  ok(
    "cta @ Level 2, buying_job_confidence KNOWN: includes buying_job axis",
    slotFor(compL2Known, "cta").axes_active.includes("buying_job"),
  );

  const compL2Unknown = renderModules(state({ buying_job_confidence: "UNKNOWN" }), result(2));
  ok(
    "cta @ Level 2, buying_job_confidence UNKNOWN: excludes buying_job axis",
    !slotFor(compL2Unknown, "cta").axes_active.includes("buying_job"),
  );

  const compL3 = renderModules(state({}), result(3));
  ok("cta @ Level 3: narrowed to solution_category only", JSON.stringify(slotFor(compL3, "cta").axes_active) === JSON.stringify(["solution_category"]));

  const compL5 = renderModules(state({}), result(5));
  ok("cta @ Level 5: no axes active", slotFor(compL5, "cta").axes_active.length === 0);
}

// ===========================================================================
// variant_descriptor: POC scenario (it_operations/champion) resolves
// pre-authored content; every other combination gets a labeled placeholder.
// ===========================================================================
{
  const compPoc = renderModules(state({ solution_category: "it_operations", role_classification: "champion" }), result(1));
  ok(
    "POC scenario (it_operations/champion) @ Level 1: hero variant is not a placeholder",
    !slotFor(compPoc, "hero").variant_descriptor.startsWith("[PLACEHOLDER]"),
  );

  const compNonPoc = renderModules(state({ solution_category: "risk_compliance", role_classification: "ratifier" }), result(1));
  ok(
    "Non-POC scenario (risk_compliance/ratifier) @ Level 1: hero variant is a labeled placeholder",
    slotFor(compNonPoc, "hero").variant_descriptor.startsWith("[PLACEHOLDER]"),
  );
  ok(
    "Placeholder text names the actual solution_category and role, not generic text",
    slotFor(compNonPoc, "hero").variant_descriptor.includes("risk_compliance") && slotFor(compNonPoc, "hero").variant_descriptor.includes("ratifier"),
  );
}

// ===========================================================================
// corpus_authority: every slot must carry a non-empty citation, at every level.
// ===========================================================================
{
  for (const level of [1, 2, 3, 4, 5] as const) {
    const comp = renderModules(state({}), result(level));
    ok(
      `Level ${level}: every one of the 11 slots carries a non-empty corpus_authority citation`,
      comp.slots.every((s) => typeof s.corpus_authority === "string" && s.corpus_authority.length > 0),
    );
  }
}

// ---------------------------------------------------------------------------
console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailed assertions:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
