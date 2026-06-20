// Pre-retrieval pipeline → Store 1 / Store 2 retrieval → output formatter
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Reference Mode: Pre-Retrieval Pipeline"
//
// This route is a thin wrapper. The four-stage pipeline (normalize → disambiguate →
// resolve context → route) lives entirely in lib/retrieval/router.ts. Store access
// lives in lib/retrieval/structured-store.ts (Store 2) and lib/retrieval/vector-store.ts
// (Store 1). This route's only job is to call routeQuery(), dispatch to the stores
// it names, and format the result into the [ANSWER]/[SOURCE]/[RELATED] template.
//
// Never hallucinate. Never return below-threshold Store 1 results without labeling
// them. A disambiguation halt returns the clarification prompt, not a fabricated answer.

import { NextRequest, NextResponse } from "next/server";
import { routeQuery, type RoutingResult, type QueryType } from "../../../lib/retrieval/router";
import { lookupTable, type StructuredLookupResult } from "../../../lib/retrieval/structured-store";
import { queryVectorStore, SIMILARITY_THRESHOLD, type VectorQueryResult } from "../../../lib/retrieval/vector-store";

const DATA_MODEL_VERSION = "0.2.0";

type ReferenceRequestBody = {
  query: string;
};

type ReferenceModeResponse =
  | {
      outcome: "disambiguation_required";
      term: string;
      prompt: string;
    }
  | {
      outcome: "answered";
      queryType: QueryType;
      answer: string;
      source: string;
      related: string[];
      belowThreshold: boolean;
    };

function formatStructuredSource(sectionKey: string, result: StructuredLookupResult): string {
  if (result.status !== "ok") {
    return `Store 2 lookup failed — table "${sectionKey}" not found.`;
  }
  return `${result.table} | Data Model ${sectionKey} v${result.dataModelVersion}`;
}

async function answerFromStructuredMatches(
  routing: Extract<RoutingResult, { outcome: "routed" }>,
): Promise<NextResponse> {
  const matches = routing.directRouteMatches!;
  const lookups = matches.map((m) => ({ match: m, result: lookupTable(m.tableName) }));

  const notFound = lookups.filter((l) => l.result.status !== "ok");
  if (notFound.length === lookups.length) {
    return NextResponse.json(
      {
        outcome: "answered",
        queryType: routing.queryType,
        answer: `No record found for ${matches.map((m) => m.sectionKey).join(", ")} in Store 2.`,
        source: notFound.map((l) => formatStructuredSource(l.match.sectionKey, l.result)).join("; "),
        related: [],
        belowThreshold: false,
      } satisfies ReferenceModeResponse,
      { status: 200 },
    );
  }

  const primary = lookups.find((l) => l.result.status === "ok")!;
  const related = lookups
    .filter((l) => l !== primary)
    .map((l) => `${l.match.sectionKey} (${l.match.tableName})`);

  const record = primary.result.status === "ok" ? primary.result.record : null;

  return NextResponse.json(
    {
      outcome: "answered",
      queryType: routing.queryType,
      answer: JSON.stringify(record),
      source: formatStructuredSource(primary.match.sectionKey, primary.result),
      related,
      belowThreshold: false,
    } satisfies ReferenceModeResponse,
    { status: 200 },
  );
}

async function answerFromVectorStore(
  routing: Extract<RoutingResult, { outcome: "routed" }>,
): Promise<NextResponse> {
  const result: VectorQueryResult = await queryVectorStore(routing.normalizedQuery);
  const topMatch = result.matches[0];

  if (!topMatch) {
    return NextResponse.json(
      {
        outcome: "answered",
        queryType: routing.queryType,
        answer: "No corpus content found for this query.",
        source: "Store 1 (no matches returned)",
        related: [],
        belowThreshold: false,
      } satisfies ReferenceModeResponse,
      { status: 200 },
    );
  }

  const related = result.matches
    .slice(1, 3)
    .map((m) => `${m.metadata.document_id} — ${m.metadata.section_title}${m.metadata.subsection ? ` (${m.metadata.subsection})` : ""}`);

  const sourceLabel = `${topMatch.metadata.document_id} — ${topMatch.metadata.section_title}${
    topMatch.metadata.subsection ? ` (${topMatch.metadata.subsection})` : ""
  }${topMatch.metadata.section_key ? ` | Data Model ${topMatch.metadata.section_key} v${DATA_MODEL_VERSION}` : ` | v${DATA_MODEL_VERSION}`}`;

  if (!topMatch.aboveThreshold) {
    return NextResponse.json(
      {
        outcome: "answered",
        queryType: routing.queryType,
        answer:
          `[LOW-CONFIDENCE — best match scored ${topMatch.score.toFixed(4)}, below the ${SIMILARITY_THRESHOLD} ` +
          `similarity threshold. Not presented as authoritative.]\n\n${topMatch.metadata.chunk_text}`,
        source: sourceLabel,
        related,
        belowThreshold: true,
      } satisfies ReferenceModeResponse,
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      outcome: "answered",
      queryType: routing.queryType,
      answer: topMatch.metadata.chunk_text,
      source: sourceLabel,
      related,
      belowThreshold: false,
    } satisfies ReferenceModeResponse,
    { status: 200 },
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: ReferenceRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body.query || typeof body.query !== "string" || body.query.trim().length === 0) {
    return NextResponse.json({ error: "Request body must include a non-empty 'query' string." }, { status: 400 });
  }

  const routing = routeQuery(body.query);

  if (routing.outcome === "halted_disambiguation") {
    return NextResponse.json(
      {
        outcome: "disambiguation_required",
        term: routing.term,
        prompt: routing.prompt,
      } satisfies ReferenceModeResponse,
      { status: 200 },
    );
  }

  // Stage 3 fired (a §-keyed section reference) — Store 2 only, regardless of
  // the assigned QT label. This is always the case when directRouteMatches is
  // non-null, per router.ts's own contract.
  if (routing.directRouteMatches) {
    return answerFromStructuredMatches(routing);
  }

  // No direct route — dispatch by store. QT-1/QT-3 never occur without a direct
  // route (see router.ts classifyProseQuery), so "store2" alone cannot happen here.
  if (routing.store === "store1" || routing.store === "store1+store2") {
    return answerFromVectorStore(routing);
  }

  // Defensive fallback — should be unreachable given router.ts's contract.
  return NextResponse.json(
    { error: `Unexpected routing state: queryType ${routing.queryType} with no direct route and store "${routing.store}".` },
    { status: 500 },
  );
}
