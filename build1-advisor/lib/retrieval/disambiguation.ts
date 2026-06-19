// Stage 2 — six-term registry: confidence, stage, fallback, priority, cohort, role
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Stage 2: Disambiguation Registry"
//
// Each registered term has two corpus meanings that share a surface form. If a query
// contains a registered term, retrieval halts and the practitioner must disambiguate
// before any Store 1 / Store 2 lookup runs. This is a hard gate, not a hint.

export type DisambiguationTerm =
  | "confidence"
  | "stage"
  | "fallback"
  | "priority"
  | "cohort"
  | "role";

export const DISAMBIGUATION_REGISTRY: Record<DisambiguationTerm, string> = {
  confidence:
    "Are you asking about Classification confidence (HIGH/MEDIUM/LOW/UNKNOWN — scoring pipeline output) or Diagnostic confidence (HIGH/MEDIUM/LOW — Advisor output reliability)?",
  stage:
    "Are you asking about Buying Group Stages (§5 BG_STAGES: targeted/engaged/prioritized/qualified) or Buying Job stages (problem_identification → supplier_selection)?",
  fallback:
    "Are you asking about the five-level Fallback Cascade (Level 1–5 experience routing) or fallback logic within a specific decisioning rule?",
  priority:
    "Are you asking about Adobe Target activity priority (four-digit scheme) or user priority type (Priority 1–4 in the Advisor user model)?",
  cohort:
    "Are you asking about Campaign Cohorts (§6: education/acquisition/progression_early_to_mature/progression_win_now) or the holdback group?",
  role:
    "Are you asking about Buying Group Roles (champion/economic_buyer/influencer/user/ratifier) or data authority roles (Tier 1/Tier 2/Tier 3)?",
};

const REGISTRY_TERMS = Object.keys(DISAMBIGUATION_REGISTRY) as DisambiguationTerm[];

// Matches whole words only — "role" must not match inside "roller_deck" or similar.
const TERM_PATTERNS: Record<DisambiguationTerm, RegExp> = REGISTRY_TERMS.reduce(
  (acc, term) => {
    acc[term] = new RegExp(`\\b${term}\\b`, "i");
    return acc;
  },
  {} as Record<DisambiguationTerm, RegExp>,
);

export type DisambiguationCheckResult =
  | { halted: true; term: DisambiguationTerm; prompt: string }
  | { halted: false };

/**
 * Checks a normalized query against the six-term registry.
 * Operates on normalized text (output of Stage 1) — callers must normalize first.
 * Returns the first registered term found; retrieval must halt on any match.
 */
export function checkDisambiguation(normalizedQuery: string): DisambiguationCheckResult {
  for (const term of REGISTRY_TERMS) {
    if (TERM_PATTERNS[term].test(normalizedQuery)) {
      return { halted: true, term, prompt: DISAMBIGUATION_REGISTRY[term] };
    }
  }
  return { halted: false };
}
