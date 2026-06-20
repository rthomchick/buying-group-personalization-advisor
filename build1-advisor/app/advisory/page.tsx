// Advisory Mode view — problem type selector, conversational interface,
// diagnostic output template renderer
//
// Owns all data fetching for Advisory Mode. ProblemTypeSelector and
// AdvisoryChat receive only props — neither calls fetch() itself.
//
// The route's UserContext is a Record<string, string>, not a single string —
// AdvisoryChat's onSubmit hands back the practitioner's free-text description,
// which this page wraps as { description: <text> } before posting.

"use client";

import { useState } from "react";
import { ProblemTypeSelector } from "@/components/advisory/ProblemTypeSelector";
import { AdvisoryChat } from "@/components/advisory/AdvisoryChat";
import { Button } from "@/components/ui/button";
import type { ParsedAdvisoryOutput } from "@/lib/advisory/output-parser";
import type { ProblemType } from "@/lib/session/session-state";

export default function AdvisoryPage() {
  const [problemType, setProblemType] = useState<ProblemType | null>(null);
  const [output, setOutput] = useState<ParsedAdvisoryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitContext(userContext: string) {
    if (!problemType) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemType, userContext: { description: userContext } }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? `Advisory Mode request failed (${response.status}).`);
      }

      const data: { parsed: ParsedAdvisoryOutput } = await response.json();
      setOutput(data.parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setOutput(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleBack() {
    setProblemType(null);
    setOutput(null);
    setError(null);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-8">
      {!problemType ? (
        <ProblemTypeSelector onSelect={setProblemType} />
      ) : (
        <>
          <Button variant="ghost" size="sm" onClick={handleBack} className="self-start">
            ← Back to problem types
          </Button>

          {error && (
            <div className="rounded-md border border-kalder-hold/40 bg-kalder-hold/[0.08] px-3 py-2 text-sm text-kalder-hold">
              {error}
            </div>
          )}

          <AdvisoryChat problemType={problemType} onSubmit={submitContext} isLoading={isLoading} output={output} />
        </>
      )}
    </div>
  );
}
