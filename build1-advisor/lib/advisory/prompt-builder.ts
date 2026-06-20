// Dynamic system prompt assembly: base layer + corpus injection + user context
//
// Source of truth:
// - knowledge/specs/kalder_layer2_developer_brief.md, "Advisory Mode: System Prompt Construction"
// - knowledge/specs/kalder_layer2_decisions_log_L2E_builds.md, "Advisory Mode (locked)"
//
// Alfonso's non-negotiable: the system prompt is constructed from corpus retrieval
// outputs AT QUERY TIME. A hardcoded Advisory Mode system prompt is a Failure Mode A
// instance. Layer 2 below calls the real retrieval layer (Store 1 via queryVectorStore,
// Store 2 via lookupTable) on every invocation — it never reads markdown files directly
// and never inlines corpus text as a literal string.

import { queryVectorStore, SIMILARITY_THRESHOLD, type VectorQueryResult } from "../retrieval/vector-store";
import { lookupTable, type StructuredTableName, type StructuredLookupResult } from "../retrieval/structured-store";

export type ProblemType = "PT-1" | "PT-2" | "PT-5";

const PROBLEM_TYPE_LABELS: Record<ProblemType, string> = {
  "PT-1": "Classification State Diagnosis",
  "PT-2": "Cohort Performance Diagnosis",
  "PT-5": "Sales Escalation Readiness",
};

export type UserContext = Record<string, string>;

// ---------------------------------------------------------------------------
// Layer 1 — Base instruction (static)
// ---------------------------------------------------------------------------

function buildBaseInstructionLayer(problemType: ProblemType): string {
  const label = PROBLEM_TYPE_LABELS[problemType];
  return `You are the Kalder Buying Group Personalization AI Advisor operating in Advisory Mode.
You are reasoning against the Kalder corpus (v0.2.0) to diagnose a ${problemType} (${label}) query.

REQUIRED: Traverse all reasoning steps in sequence before producing a diagnosis.
REQUIRED: Detect and explicitly name the following program states if present:
  - differential_insufficient = True
  - pending_solution_fallback
Treating these as generic low-confidence or coverage-gap states is a disqualifying error.

Every claim must cite a corpus section or data model section key.

Output format (six named sections):
PROBLEM_RESTATEMENT | CORPUS_SECTION_TRAVERSAL | NAMED_STATE_CHECK |
DIAGNOSIS | RECOMMENDED_ACTIONS | DIAGNOSTIC_CONFIDENCE

REQUIRED: Emit each section as a bracketed header on its own line, exactly as
follows (uppercase, square brackets, no other text on that line), in this order:
[PROBLEM_RESTATEMENT]
[CORPUS_SECTION_TRAVERSAL]
[NAMED_STATE_CHECK]
[DIAGNOSIS]
[RECOMMENDED_ACTIONS]
[DIAGNOSTIC_CONFIDENCE]
Do not use markdown headings, numbered lists, or any other heading style for
these six labels. This format is machine-parsed — deviating from it breaks
the Advisor's rendering of your output.

Data model version: 0.2.0`;
}

// ---------------------------------------------------------------------------
// Layer 2 — Problem-type corpus injection (dynamic, retrieved per query)
// ---------------------------------------------------------------------------

// Each entry is either a narrative retrieval (Store 1, semantic query against
// the vector index) or a structured retrieval (Store 2, exact table lookup by
// canonical §-key name). Citations match the brief's per-problem-type list verbatim.
//
// expectedDocumentId pins each narrative spec to the document the brief actually
// names (e.g. "doc5" for "Document 5, Section 3"). Several topics — progressive
// disclosure in particular — are discussed across multiple documents, so blind
// top-1 semantic rank can surface an on-topic chunk from the WRONG document.
// retrieveNarrativeSection searches topK matches for the best-scoring chunk from
// expectedDocumentId before falling back to literal top-1.
type NarrativeRetrievalSpec = {
  kind: "narrative";
  citation: string; // e.g. "Document 2, Section 5"
  query: string; // natural-language query sent to Store 1
  expectedDocumentId: string; // e.g. "doc2" — the document the brief's citation names
};

type StructuredRetrievalSpec = {
  kind: "structured";
  citation: string; // e.g. "§12 SCORING_RULES"
  table: StructuredTableName;
};

type RetrievalSpec = NarrativeRetrievalSpec | StructuredRetrievalSpec;

const PT1_RETRIEVAL_SPECS: RetrievalSpec[] = [
  {
    kind: "narrative",
    citation: "Document 2, Section 5 (seven-step scoring sequence)",
    query: "seven-step classification scoring sequence role confidence",
    expectedDocumentId: "doc2",
  },
  {
    kind: "narrative",
    citation: "Document 2, Section 9 (three-tier data authority)",
    query: "three-tier data source authority hierarchy ML classifier zero-party behavioral",
    expectedDocumentId: "doc2",
  },
  { kind: "structured", citation: "§12 SCORING_RULES key parameters", table: "SCORING_RULES" },
  { kind: "structured", citation: "§3 CONFIDENCE_TIERS tier definitions", table: "CONFIDENCE_TIERS" },
  { kind: "structured", citation: "§4 FALLBACK_CASCADE Level 1–5 trigger conditions", table: "FALLBACK_CASCADE" },
  {
    kind: "narrative",
    citation: "Document 5, Section 1.2 (differential_insufficient Priority 0 override)",
    query: "differential_insufficient Priority 0 override fallback level 3",
    expectedDocumentId: "doc5",
  },
  {
    kind: "narrative",
    citation: "Document 5, Section 3 (progressive disclosure activation)",
    query: "module-level decisioning rules progressive_disclosure offer matching",
    expectedDocumentId: "doc5",
  },
];

const PT2_RETRIEVAL_SPECS: RetrievalSpec[] = [
  {
    kind: "narrative",
    citation: "Document 3, Section 2 (cohort definitions and AEP audience gates)",
    query: "campaign cohort definitions AEP audience segment entry criteria",
    expectedDocumentId: "doc3",
  },
  {
    kind: "narrative",
    citation: "Document 7 (measurement framework; Norris addendum on TAL quality distribution)",
    query: "TAL quality distribution report Revenue Operations confidence cap",
    expectedDocumentId: "doc7",
  },
  {
    kind: "narrative",
    citation: "Document 5, Section 1 (fallback cascade; pending_solution_fallback definition)",
    query: "pending_solution_fallback coverage status fallback level routing",
    expectedDocumentId: "doc5",
  },
  { kind: "structured", citation: "§6 CAMPAIGN_COHORTS", table: "CAMPAIGN_COHORTS" },
  {
    kind: "narrative",
    citation: "Document 8, Section 5 (signal monitoring)",
    query: "weekly signal monitoring coverage status verification escalation",
    expectedDocumentId: "doc8",
  },
];

const PT5_RETRIEVAL_SPECS: RetrievalSpec[] = [
  {
    kind: "narrative",
    citation: "Document 3, Section 6.4 (two contact-level gates)",
    query: "two contact-level gates confidence_tier differential_insufficient Outreach sequence",
    expectedDocumentId: "doc3",
  },
  {
    kind: "narrative",
    citation: "Document 6, Section 7 (convergence point architecture; per-cohort alert activation)",
    query: "convergence point alert payload canonical recommended_action per-cohort activation",
    expectedDocumentId: "doc6",
  },
  { kind: "structured", citation: "§SA SALES_ACTIVATION_CONFIG (alert payloads)", table: "SALES_ACTIVATION_CONFIG" },
  {
    kind: "narrative",
    citation: "Document 8, Section 6 (sales activation workflow)",
    query: "sales activation workflow routing Salesforce Outreach Outreach sequence trigger",
    expectedDocumentId: "doc8",
  },
];

const RETRIEVAL_SPECS_BY_PROBLEM_TYPE: Record<ProblemType, RetrievalSpec[]> = {
  "PT-1": PT1_RETRIEVAL_SPECS,
  "PT-2": PT2_RETRIEVAL_SPECS,
  "PT-5": PT5_RETRIEVAL_SPECS,
};

export type RetrievedSection = {
  citation: string;
  status: "retrieved" | "below_threshold" | "empty" | "not_found";
  sourceLabel: string; // document_id/section_title or table name, for traceability
  score?: number; // similarity score, for narrative retrievals only
  substituted?: boolean; // true when expectedDocumentId had no above-threshold match and a different document's top-1 was used instead
  text: string; // formatted block injected into the prompt; gap-labeled if not retrieved
};

const NARRATIVE_RETRIEVAL_TOP_K = 10;

function formatRetrievedChunk(match: VectorQueryResult["matches"][number]): string {
  return `${match.metadata.document_id} — ${match.metadata.section_title}${
    match.metadata.subsection ? ` (${match.metadata.subsection})` : ""
  }`;
}

async function retrieveNarrativeSection(spec: NarrativeRetrievalSpec): Promise<RetrievedSection> {
  const result: VectorQueryResult = await queryVectorStore(spec.query, NARRATIVE_RETRIEVAL_TOP_K);

  if (result.matches.length === 0) {
    return {
      citation: spec.citation,
      status: "empty",
      sourceLabel: "Store 1 (no matches returned)",
      text: `[GAP — ${spec.citation}: Store 1 returned no matches for query "${spec.query}". Not substituted with placeholder text.]`,
    };
  }

  // Prefer the best-scoring match from the document the brief's citation actually
  // names. Several topics (e.g. progressive disclosure) are discussed across
  // multiple documents — blind top-1 semantic rank can surface the wrong document.
  const matchFromExpectedDocument = result.matches.find(
    (m) => m.metadata.document_id === spec.expectedDocumentId && m.aboveThreshold,
  );

  if (matchFromExpectedDocument) {
    return {
      citation: spec.citation,
      status: "retrieved",
      sourceLabel: formatRetrievedChunk(matchFromExpectedDocument),
      score: matchFromExpectedDocument.score,
      text:
        `[${spec.citation}]\nSource: ${formatRetrievedChunk(matchFromExpectedDocument)} | similarity ${matchFromExpectedDocument.score.toFixed(4)}\n\n` +
        matchFromExpectedDocument.metadata.chunk_text,
    };
  }

  const topMatch = result.matches[0];

  if (!topMatch.aboveThreshold) {
    return {
      citation: spec.citation,
      status: "below_threshold",
      sourceLabel: formatRetrievedChunk(topMatch),
      score: topMatch.score,
      text:
        `[LOW-CONFIDENCE RETRIEVAL — ${spec.citation}: best match scored ${topMatch.score.toFixed(4)}, ` +
        `below the ${SIMILARITY_THRESHOLD} threshold. Source: ${formatRetrievedChunk(topMatch)}. ` +
        `Labeled explicitly per Reference Mode below-threshold rule — not presented as authoritative.]\n\n${topMatch.metadata.chunk_text}`,
    };
  }

  // No above-threshold match from the expected document — fall back to the
  // literal top-1 match, but label it visibly as a substitute. Must never be
  // silently dropped or presented as if it came from the cited document.
  return {
    citation: spec.citation,
    status: "retrieved",
    sourceLabel: formatRetrievedChunk(topMatch),
    score: topMatch.score,
    substituted: true,
    text:
      `[SUBSTITUTE — expected ${spec.expectedDocumentId} section not retrieved above threshold; using top-1 corpus match]\n` +
      `[${spec.citation}]\nSource: ${formatRetrievedChunk(topMatch)} | similarity ${topMatch.score.toFixed(4)}\n\n` +
      topMatch.metadata.chunk_text,
  };
}

function retrieveStructuredSection(spec: StructuredRetrievalSpec): RetrievedSection {
  const result: StructuredLookupResult = lookupTable(spec.table);

  if (result.status !== "ok") {
    return {
      citation: spec.citation,
      status: "not_found",
      sourceLabel: `Store 2 (${spec.table})`,
      text: `[GAP — ${spec.citation}: Store 2 table "${spec.table}" not found. Not substituted with placeholder text.]`,
    };
  }

  return {
    citation: spec.citation,
    status: "retrieved",
    sourceLabel: `Store 2 — ${result.table} | Data model v${result.dataModelVersion}`,
    text:
      `[${spec.citation}]\nSource: Store 2 — ${result.table} | Data model v${result.dataModelVersion}\n\n` +
      JSON.stringify(result.record, null, 2),
  };
}

export type Layer2Result = {
  promptText: string;
  retrievedSections: RetrievedSection[];
};

/**
 * Retrieves the corpus sections specified for the given problem type via the
 * real retrieval layer (Store 1 + Store 2) and formats them into Layer 2 of
 * the system prompt. Never reads markdown files directly; never hardcodes
 * corpus text. Below-threshold or missing retrievals are labeled as gaps,
 * never silently substituted with placeholder text.
 */
export async function buildCorpusInjectionLayer(problemType: ProblemType): Promise<Layer2Result> {
  const specs = RETRIEVAL_SPECS_BY_PROBLEM_TYPE[problemType];

  const retrievedSections: RetrievedSection[] = await Promise.all(
    specs.map((spec) => (spec.kind === "narrative" ? retrieveNarrativeSection(spec) : Promise.resolve(retrieveStructuredSection(spec)))),
  );

  const promptText = retrievedSections.map((section) => section.text).join("\n\n---\n\n");

  return { promptText, retrievedSections };
}

// ---------------------------------------------------------------------------
// Layer 3 — User context (dynamic, from practitioner input)
// ---------------------------------------------------------------------------

function buildUserContextLayer(userContext: UserContext): string {
  const entries = Object.entries(userContext);
  if (entries.length === 0) {
    return "PRACTITIONER CONTEXT:\n(none provided)";
  }

  const formattedEntries = entries.map(([key, value]) => `  ${key}: ${value}`).join("\n");
  return `PRACTITIONER CONTEXT (elicited inputs, structured):\n${formattedEntries}`;
}

// ---------------------------------------------------------------------------
// Final assembly
// ---------------------------------------------------------------------------

export type BuildAdvisoryPromptResult = {
  prompt: string;
  layer1: string;
  layer2: string;
  layer3: string;
  retrievedSections: RetrievedSection[];
};

/**
 * Assembles the complete Advisory Mode system prompt from three layers, in order:
 * 1. Base instruction (static)
 * 2. Problem-type corpus injection (dynamic — retrieved from Store 1 / Store 2 at query time)
 * 3. User context (dynamic — practitioner-elicited inputs)
 *
 * The prompt is never a static file — Layer 2 is retrieved fresh on every call.
 */
export async function buildAdvisoryPrompt(
  problemType: ProblemType,
  userContext: UserContext,
): Promise<BuildAdvisoryPromptResult> {
  const layer1 = buildBaseInstructionLayer(problemType);
  const { promptText: layer2, retrievedSections } = await buildCorpusInjectionLayer(problemType);
  const layer3 = buildUserContextLayer(userContext);

  const prompt = `${layer1}\n\n---\n\nCORPUS SECTION INJECTION (${problemType}):\n\n${layer2}\n\n---\n\n${layer3}`;

  return { prompt, layer1, layer2, layer3, retrievedSections };
}
