// Document 5 §1.6 — eight steps in strict order, full trace output
// Steps: consent gate, TAL check, P0 differential override, coverage check,
// holdback check, Level 1, Level 2, Level 3, Level 4 default
//
// Source of truth: knowledge/kalder_doc5_personalization_decisioning_rules.md,
// Section 1.6 "Rule Evaluation Sequence" (authoritative routing logic) and
// Section 7 "Holdback Group Specification" (authoritative holdback behavior).
//
// This is the most important file in Build 2. No shortcuts, no merged steps —
// every step in Document 5 §1.6 produces its own labeled trace entry with a
// corpus authority citation, even when a step does not terminate evaluation.
//
// Holdback correction: the developer brief's pseudocode says holdback only
// suppresses progressive_disclosure while "experience level routing continues
// normally." Document 5 §7.1–7.7 is explicit and detailed that this is wrong —
// holdback_group: true forces the full Level 5 default experience for ALL
// module slots, regardless of confidence_tier or computed fallback_level.
// Holdback activities fire at Target priority 5950–5954, specifically BEFORE
// the Level 4 account activity (6001–6004), so a holdback visitor's actual
// classified level is never served — this is what keeps the control group
// clean (§7.1, §7.5, §7.7). The corpus governs over the brief's pseudocode.

import type { VisitorState, DecisioningResult, TraceStep } from "@kalder/shared";

function step(stepName: string, result: string, corpusAuthority: string, value?: string | boolean | number): TraceStep {
  return { step: stepName, result, corpus_authority: corpusAuthority, value };
}

type ResultInput = Partial<DecisioningResult> & { trace: TraceStep[]; routing_path: string };

function buildResult(input: ResultInput): DecisioningResult {
  return {
    fallback_level: input.fallback_level ?? 5,
    pending_solution_fallback: input.pending_solution_fallback ?? false,
    three_axis_active: input.three_axis_active ?? false,
    three_axis_result: input.three_axis_result ?? { active: false, mode: null, jtbd_code: null },
    differential_override: input.differential_override ?? false,
    consent_suppressed: input.consent_suppressed ?? false,
    routing_path: input.routing_path,
    trace: input.trace,
  };
}

/**
 * Document 5 §1.6 eight-step routing sequence. Steps are evaluated strictly
 * in order; the first step that produces a routing outcome terminates
 * evaluation. Every step — terminating or not — pushes a trace entry.
 */
export function runDecisioningEngine(state: VisitorState): DecisioningResult {
  const trace: TraceStep[] = [];

  // Step 0 — Consent gate. Document 5 §1.7 edge-state table; full specification
  // in Document 9 (Privacy and Consent Architecture). Null/absent consent is
  // never treated as permissive.
  if (!state.visitor_consent_state || state.visitor_consent_state === "declined") {
    trace.push(
      step(
        "consent_gate",
        "SUPPRESSED — visitor_consent_state is null or declined. No behavioral signal collected or scored. Firmographic-only routing.",
        "Document 5 §1.7; Document 9",
        state.visitor_consent_state ?? "null",
      ),
    );
    return buildResult({
      fallback_level: state.tal_member ? 4 : 5,
      consent_suppressed: true,
      routing_path: "consent_gate",
      trace,
    });
  }
  trace.push(step("consent_gate", `PASS — visitor_consent_state: ${state.visitor_consent_state}`, "Document 9", state.visitor_consent_state));

  // Step 1 — TAL membership check. Document 5 §1.3, Level 5 activation condition.
  if (!state.tal_member) {
    trace.push(step("tal_check", "FAIL — tal_member: false → Level 5", "Document 5 §1.3 (Level 5)", state.tal_member));
    return buildResult({ fallback_level: 5, routing_path: "non_tal", trace });
  }
  trace.push(step("tal_check", "PASS — tal_member: true", "Document 5 §1.3", state.tal_member));

  // Step 2 — Priority 0: differential_insufficient override. Document 5 §1.2.
  // Evaluated before any fallback level rule. Absolute — takes precedence over
  // confidence_tier and coverage availability at any level.
  if (state.differential_insufficient) {
    trace.push(
      step(
        "p0_differential_check",
        "OVERRIDE ACTIVE — differential_insufficient: true → Level 3. confidence_tier NOT evaluated. Override is absolute.",
        "Document 5 §1.2",
        state.differential_insufficient,
      ),
    );
    return buildResult({
      fallback_level: 3,
      differential_override: true,
      routing_path: "differential_insufficient_override",
      trace,
    });
  }
  trace.push(step("p0_differential_check", "PASS — differential_insufficient: false. Override not active.", "Document 5 §1.2", state.differential_insufficient));

  // Step 3 — Coverage check. Document 5 §1.4. pending/constructed activates
  // pending_solution_fallback and applies an absolute MEDIUM confidence ceiling
  // for all remaining steps. partial deactivates pending_solution_fallback but
  // still caps at Level 3 (role-variant nodes do not exist yet) — that ceiling
  // is enforced naturally by Steps 5/6 below, not by this step.
  const pendingCoverage = state.solution_category_coverage_status === "pending" || state.solution_category_coverage_status === "constructed";
  if (pendingCoverage) {
    trace.push(
      step(
        "coverage_check",
        `pending_solution_fallback ACTIVE — solution_category_coverage_status: ${state.solution_category_coverage_status}. ` +
          `Levels 1 and 2 UNAVAILABLE for this solution category. Stored confidence_tier (${state.confidence_tier}) is unaffected — ` +
          `this is a routing constraint, not a classification judgment.`,
        "Document 5 §1.4",
        state.solution_category_coverage_status,
      ),
    );
  } else {
    trace.push(
      step(
        "coverage_check",
        `coverage: ${state.solution_category_coverage_status} — Levels 1 and 2 reachable subject to confidence_tier` +
          (state.solution_category_coverage_status === "partial" ? " (partial still caps at Level 3 — role-variant nodes do not exist)" : ""),
        "Document 5 §1.1, §1.4",
        state.solution_category_coverage_status,
      ),
    );
  }

  // Step 4 — Holdback check. Document 5 §7.1–7.7 (authoritative — overrides the
  // simplified framing in the developer brief). holdback_group: true forces
  // Level 5 for ALL module slots regardless of confidence_tier or the level
  // that would otherwise be computed. Holdback activities (Target priority
  // 5950–5954) fire BEFORE the Level 4 account activity (6001–6004) so the
  // visitor's actual classified level is never served — this is what keeps
  // the control group clean. Classification scoring still runs and is stored
  // in AEP (§7.7) — only experience DELIVERY is withheld. Evaluation stops here.
  if (state.holdback_group) {
    trace.push(
      step(
        "holdback_check",
        "holdback_group: true — Level 5 default experience FORCED for all module slots. Experience level routing does NOT continue " +
          "normally. Classification scoring still runs and is stored in AEP; only experience delivery is withheld. progressive_disclosure " +
          "does not render at Level 5 — this is a labeled measurement-control suppression, not an absence.",
        "Document 5 §7.1, §7.5, §7.7",
        state.holdback_group,
      ),
    );
    return buildResult({
      fallback_level: 5,
      pending_solution_fallback: pendingCoverage,
      routing_path: "holdback_override",
      trace,
    });
  }
  trace.push(step("holdback_check", "PASS — holdback_group: false. Not in measurement control group.", "Document 5 §7.4", state.holdback_group));

  // Step 5 — Level 1 check. Document 5 §1.3 (Level 1 activation conditions).
  // Requires NOT pendingCoverage AND confidence_tier HIGH. partial coverage
  // also disqualifies Level 1 even though pendingCoverage is false for partial
  // — role-variant nodes do not exist at partial (§1.3 note; §1.5).
  const level1Eligible = !pendingCoverage && state.confidence_tier === "HIGH" && state.solution_category_coverage_status !== "partial";
  if (level1Eligible) {
    trace.push(step("level_1_check", "PASS — confidence_tier: HIGH, coverage sufficient → Level 1", "Document 5 §1.3 (Level 1)"));
    return buildResult({ fallback_level: 1, pending_solution_fallback: pendingCoverage, routing_path: "level_1", trace });
  }
  trace.push(
    step(
      "level_1_check",
      pendingCoverage
        ? "FAIL — pending_solution_fallback active"
        : state.solution_category_coverage_status === "partial" && state.confidence_tier === "HIGH"
          ? "FAIL — coverage: partial; role-variant nodes do not exist for Level 1"
          : `FAIL — confidence_tier: ${state.confidence_tier}`,
      "Document 5 §1.3 (Level 1)",
    ),
  );

  // Step 6 — Level 2 check. Document 5 §1.3 (Level 2 activation conditions).
  // Same partial-coverage disqualification as Level 1.
  const level2Eligible = !pendingCoverage && state.confidence_tier === "MEDIUM" && state.solution_category_coverage_status !== "partial";
  if (level2Eligible) {
    trace.push(step("level_2_check", "PASS — confidence_tier: MEDIUM, coverage sufficient → Level 2", "Document 5 §1.3 (Level 2)"));
    return buildResult({ fallback_level: 2, pending_solution_fallback: pendingCoverage, routing_path: "level_2", trace });
  }
  trace.push(
    step(
      "level_2_check",
      pendingCoverage
        ? "FAIL — pending_solution_fallback active"
        : state.solution_category_coverage_status === "partial" && state.confidence_tier === "MEDIUM"
          ? "FAIL — coverage: partial; role-variant nodes do not exist for Level 2"
          : `FAIL — confidence_tier: ${state.confidence_tier}`,
      "Document 5 §1.3 (Level 2)",
    ),
  );

  // Step 7 — Level 3 check. Document 5 §1.6 Step 4: tal_member (already
  // confirmed true at Step 1) AND solution-category interest signals present.
  // In the simulator, solution-category interest is represented by a non-null
  // solution_category on the visitor state.
  if (state.solution_category) {
    trace.push(step("level_3_check", "PASS — solution-category interest identified → Level 3", "Document 5 §1.6 (Step 4); §4 FALLBACK_CASCADE"));
    return buildResult({ fallback_level: 3, pending_solution_fallback: pendingCoverage, routing_path: "level_3", trace });
  }

  // Step 8 — Level 4 default. Document 5 §1.6 Step 4 (tal_member true, no
  // solution-category interest signal) and §1.3 (Level 4 activation conditions).
  trace.push(step("level_4_check", "PASS — TAL identified, no solution-category interest signal → Level 4", "Document 5 §1.6 (Step 4); §1.3 (Level 4)"));
  return buildResult({ fallback_level: 4, pending_solution_fallback: pendingCoverage, routing_path: "level_4", trace });
}
