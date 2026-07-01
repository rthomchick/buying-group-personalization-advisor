// Stage 4 — QT-1 through QT-6 routing decision
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Stage 4: Query Type Routing"
//
// | QT   | Store            | Trigger                                                          |
// |------|-------------------|-------------------------------------------------------------------|
// | QT-1 | Store 2           | Specific record lookup (JTBD code, §CA attribute, CROSS_ROLE_WEIGHTS row) |
// | QT-2 | Store 1           | Corpus section content ("what does Document 5 say about...")    |
// | QT-3 | Store 2           | Data model parameter ("minimum_cumulative_score value")          |
// | QT-4 | Store 1 + Store 2 | Cross-document reasoning                                          |
// | QT-5 | Store 1           | Operational procedure (Document 8 sections)                      |
// | QT-6 | Store 1 + Store 2 | Edge case or exception lookup                                     |
//
// This stage runs only after Stage 2 (disambiguation) has cleared the query and
// Stage 3 (context resolution) has run. A Stage 3 direct route always resolves to
// QT-1 or QT-3 — both are Store 2 — never to a Store-1-only type.

import { normalizeQuery } from "./normalizer";
import { checkDisambiguation, type DisambiguationCheckResult, type DisambiguationTerm } from "./disambiguation";
import { resolveContext, type ContextResolution, type SectionKeyMatch } from "./context-resolver";

export type QueryType = "QT-1" | "QT-2" | "QT-3" | "QT-4" | "QT-5" | "QT-6";
export type RetrievalStore = "store1" | "store2" | "store1+store2";

const QT_STORE: Record<QueryType, RetrievalStore> = {
  "QT-1": "store2",
  "QT-2": "store1",
  "QT-3": "store2",
  "QT-4": "store1+store2",
  "QT-5": "store1",
  "QT-6": "store1+store2",
};

// Tables that hold a single set of named scalar parameters rather than a collection
// of discrete records. A direct-route hit on one of these is a QT-3 (data model
// parameter) query. All other direct-route hits are QT-1 (specific record lookup).
const PARAMETER_TABLES = new Set(["SCORING_RULES", "CONFIDENCE_TIERS", "FALLBACK_CASCADE"]);

export type RoutingResult =
  | { outcome: "halted_disambiguation"; term: string; prompt: string }
  | {
      outcome: "routed";
      queryType: QueryType;
      store: RetrievalStore;
      directRouteMatches: SectionKeyMatch[] | null;
      normalizedQuery: string;
    };

/**
 * Stage 4 of the pre-retrieval pipeline. Runs the full normalize → disambiguate →
 * resolve-context sequence and assigns a QT-1..QT-6 classification with its
 * corresponding store target.
 *
 * resolvedTerm: when the caller has already shown the disambiguation prompt for
 * a term and the practitioner picked an option, the clarified query text still
 * contains that term (e.g. "Classification confidence"), which would otherwise
 * re-trigger the same halt. Passing the term here skips the halt for that one
 * term only — any other registry term still halts normally.
 */
export function routeQuery(rawQuery: string, resolvedTerm?: DisambiguationTerm): RoutingResult {
  const { normalized } = normalizeQuery(rawQuery);

  const disambiguation: DisambiguationCheckResult = checkDisambiguation(normalized);
  if (disambiguation.halted && disambiguation.term !== resolvedTerm) {
    return { outcome: "halted_disambiguation", term: disambiguation.term, prompt: disambiguation.prompt };
  }

  const context: ContextResolution = resolveContext(normalized);

  if (context.directRoute) {
    const queryType = classifyDirectRoute(context.matches);
    return {
      outcome: "routed",
      queryType,
      store: QT_STORE[queryType],
      directRouteMatches: context.matches,
      normalizedQuery: normalized,
    };
  }

  const queryType = classifyProseQuery(normalized);
  return {
    outcome: "routed",
    queryType,
    store: QT_STORE[queryType],
    directRouteMatches: null,
    normalizedQuery: normalized,
  };
}

function classifyDirectRoute(matches: SectionKeyMatch[]): "QT-1" | "QT-3" {
  // If every matched table is a parameter table, this is a data-model-parameter
  // lookup (QT-3). Any match against a record-collection table makes it QT-1.
  const allParameterTables = matches.every((m) => PARAMETER_TABLES.has(m.tableName));
  return allParameterTables ? "QT-3" : "QT-1";
}

const DOCUMENT_REFERENCE_PATTERN = /\bdocument\s*\d\b/g;
const OPERATIONAL_DOC_PATTERN = /\bdocument\s*8\b/;
const EDGE_CASE_PATTERN = /\b(edge case|exception|edge state|what if|what happens if)\b/;
const PROCEDURE_PATTERN = /\b(procedure|workflow|runbook|how do i|how to|process for|checklist)\b/;

function classifyProseQuery(normalizedQuery: string): "QT-2" | "QT-4" | "QT-5" | "QT-6" {
  const documentReferences = normalizedQuery.match(DOCUMENT_REFERENCE_PATTERN) ?? [];
  const uniqueDocuments = new Set(documentReferences);

  if (EDGE_CASE_PATTERN.test(normalizedQuery)) {
    return "QT-6";
  }

  if (uniqueDocuments.size >= 2) {
    return "QT-4";
  }

  if (OPERATIONAL_DOC_PATTERN.test(normalizedQuery) || PROCEDURE_PATTERN.test(normalizedQuery)) {
    return "QT-5";
  }

  // Default: a single-document, non-procedural, non-edge-case prose query is
  // corpus section content — QT-2.
  return "QT-2";
}
