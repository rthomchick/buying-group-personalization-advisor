// Reference Mode view — query input, retrieval results, source citations
//
// Owns all data fetching for Reference Mode. QueryInput, DisambiguationPrompt,
// and ResultCard receive only props — none of them call fetch() themselves.

"use client";

import { useState } from "react";
import { QueryInput } from "@/components/reference/QueryInput";
import { DisambiguationPrompt } from "@/components/reference/DisambiguationPrompt";
import { ResultCard } from "@/components/reference/ResultCard";
import type { ReferenceModeResponse } from "@kalder/shared";

export default function ReferencePage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ReferenceModeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitQuery(submittedQuery: string) {
    setQuery(submittedQuery);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: submittedQuery }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? `Reference Mode request failed (${response.status}).`);
      }

      const data: ReferenceModeResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClarification(clarification: string) {
    submitQuery(`${query} — ${clarification}`);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-8">
      <QueryInput onSubmit={submitQuery} isLoading={isLoading} />

      {error && (
        <div className="rounded-md border border-kalder-hold/40 bg-kalder-hold/[0.08] px-3 py-2 text-sm text-kalder-hold">
          {error}
        </div>
      )}

      {result?.outcome === "disambiguation_required" && (
        <DisambiguationPrompt prompt={result.prompt} onSelect={handleClarification} />
      )}

      {result?.outcome === "answered" && (
        <ResultCard
          result={{
            outcome: "answered",
            queryType: result.queryType,
            answer: result.answer,
            source: result.source,
            related: result.related,
            belowThreshold: result.belowThreshold,
          }}
        />
      )}
    </div>
  );
}
