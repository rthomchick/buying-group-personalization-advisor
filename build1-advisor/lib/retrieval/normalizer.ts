// Stage 1 — query normalization: strip filler, normalize case, expand abbreviations
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Stage 1: Query Normalizer"
// Section-key → canonical table name mapping sourced from
// knowledge/data-model/kalder_data_model_v0_2_0_spec.md (§ headers) and
// knowledge/data-model/kalder_data_model.py (top-level dict names).
//
// This stage must not destroy §-prefixed section keys — Stage 3 (context-resolver)
// detects them by regex on the normalized output. Expansion appends the canonical
// table name after the key rather than replacing it.

// Canonical table/section name for every § key in the data model. Used to enrich
// (not replace) section-key tokens so later stages and disambiguation prompts can
// resolve them without a second lookup.
export const SECTION_KEY_TABLE_NAMES: Record<string, string> = {
  "§M": "MODEL_VERSION",
  "§0": "MODULE_SCOPE",
  "§1A": "PLATFORM_CAPABILITIES",
  "§1B": "PRODUCTS",
  "§1C": "SOLUTIONS",
  "§1D": "SOLUTION_CATEGORIES",
  "§2": "ROLES",
  "§3": "CONFIDENCE_TIERS",
  "§4": "FALLBACK_CASCADE",
  "§5": "BG_STAGES",
  "§6": "CAMPAIGN_COHORTS",
  "§7": "CROSS_ROLE_WEIGHTS",
  "§8": "DECAY_MULTIPLIERS",
  "§9": "CONTENT_TYPES",
  "§10": "MODULE_TYPES",
  "§11": "METRICS",
  "§12": "SCORING_RULES",
  "§13": "DATA_SOURCE_AUTHORITY",
  "§14": "ENGAGEMENT_THRESHOLDS",
  "§15": "MARTECH_STACK",
  "§16": "CONTENT_GRAPH_NODE_TYPES",
  "§17": "JTBD_CODES",
  "§18": "BG_CONVERGENCE_POINTS",
  "§19": "TITLE_ROLE_MAP",
  "§20": "WEBSITE_SURFACES",
  "§SA": "SALES_ACTIVATION_CONFIG",
  "§CA": "CLIENT_ATTRIBUTE_MAP",
  "§P": "PRIVACY_CONSENT_ARCHITECTURE",
  "§H": "HELPER_FUNCTIONS",
};

// Filler words stripped before matching. Conservative list — must not remove terms
// that are themselves corpus vocabulary (e.g. "stage", "role", "priority" are never
// filler; they are disambiguation-registry terms).
const FILLER_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "of",
  "for",
  "to",
  "what's",
  "whats",
  "what",
  "tell",
  "me",
  "about",
  "please",
  "can",
  "you",
  "i",
  "want",
  "know",
  "looking",
]);

// Literal abbreviation / shorthand expansions. Applied as whole-word token replacement.
// "min"/"max" only expand standalone — never inside another word.
const ABBREVIATION_EXPANSIONS: Record<string, string> = {
  min: "minimum",
  max: "maximum",
  diff_insufficient: "differential_insufficient",
  "diff-insufficient": "differential_insufficient",
  differential_insufficient: "differential_insufficient",
  jtbd: "jtbd",
  ca: "client_attribute_map",
  sa: "sales_activation_config",
};

export type NormalizedQuery = {
  original: string;
  normalized: string;
};

/**
 * Stage 1 of the pre-retrieval pipeline. Strips filler words, lowercases prose,
 * expands known abbreviations, and enriches (without removing) §-prefixed section
 * keys with their canonical table name.
 */
export function normalizeQuery(rawQuery: string): NormalizedQuery {
  const original = rawQuery;

  // Enrich section keys first, on the original-cased string, so the §-token
  // itself is preserved verbatim for Stage 3's regex detection.
  let working = enrichSectionKeys(rawQuery);

  // Lowercase everything else for matching purposes. Section keys are case-sensitive
  // (§ + uppercase letters/digits) — lowercase the rest of the string token-by-token
  // so keys already enriched are not corrupted.
  const tokens = working.split(/\s+/);
  const expandedTokens: string[] = [];

  for (const token of tokens) {
    if (token.startsWith("§")) {
      expandedTokens.push(token);
      continue;
    }

    const stripped = token.replace(/[.,!?;:]+$/, "");
    const lower = stripped.toLowerCase();

    if (FILLER_WORDS.has(lower)) {
      continue;
    }

    const expanded = ABBREVIATION_EXPANSIONS[lower] ?? lower;
    expandedTokens.push(expanded);
  }

  const normalized = expandedTokens.join(" ").replace(/\s+/g, " ").trim();

  return { original, normalized };
}

function enrichSectionKeys(query: string): string {
  // Matches § followed by an alphanumeric key (e.g. §CA, §12, §1a, §SA).
  return query.replace(/§[A-Za-z0-9]+/g, (match) => {
    const tableName = SECTION_KEY_TABLE_NAMES[match.toUpperCase()];
    return tableName ? `${match} ${tableName}` : match;
  });
}
