// Stage 3 — section key detection (§CA, §12, §SA etc.) → direct Store 2 route
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Stage 3: Context Resolution"
// "If query contains a section key (§CA, §12, §SA, §4, etc.), route directly to
//  Store 2 structured lookup. Bypass vector retrieval entirely."
//
// Runs after Stage 2 (disambiguation) has cleared the query. Reuses the canonical
// §-key → table-name registry from normalizer.ts rather than maintaining a second copy.

import { SECTION_KEY_TABLE_NAMES } from "./normalizer";

export type SectionKeyMatch = {
  sectionKey: string; // e.g. "§CA", as it appears in the corpus / data model
  tableName: string; // canonical table/section name, e.g. "CLIENT_ATTRIBUTE_MAP"
};

export type ContextResolution =
  | { directRoute: true; matches: SectionKeyMatch[] }
  | { directRoute: false };

const SECTION_KEY_PATTERN = /§[A-Za-z0-9]+/g;

/**
 * Stage 3 of the pre-retrieval pipeline. Detects explicit §-prefixed section keys
 * in the (normalized) query. Any match routes directly to Store 2 — vector
 * retrieval (Store 1) is bypassed entirely for this query.
 */
export function resolveContext(normalizedQuery: string): ContextResolution {
  const rawMatches = normalizedQuery.match(SECTION_KEY_PATTERN);

  if (!rawMatches || rawMatches.length === 0) {
    return { directRoute: false };
  }

  const seen = new Set<string>();
  const matches: SectionKeyMatch[] = [];

  for (const raw of rawMatches) {
    const sectionKey = raw.toUpperCase();
    if (seen.has(sectionKey)) continue;
    seen.add(sectionKey);

    const tableName = SECTION_KEY_TABLE_NAMES[sectionKey];
    if (tableName) {
      matches.push({ sectionKey, tableName });
    }
  }

  if (matches.length === 0) {
    // Tokens matched the §-prefix pattern but none resolved to a known table —
    // do not claim a direct route to a table that doesn't exist.
    return { directRoute: false };
  }

  return { directRoute: true, matches };
}
