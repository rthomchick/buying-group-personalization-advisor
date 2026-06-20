// Conversational interface within a selected problem type

"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DiagnosticOutput } from "./DiagnosticOutput";
import type { ProblemType } from "@/lib/session/session-state";
import type { ParsedAdvisoryOutput } from "@/lib/advisory/output-parser";

export type AdvisoryChatProps = {
  problemType: ProblemType;
  onSubmit: (userContext: string) => void;
  isLoading: boolean;
  output: ParsedAdvisoryOutput | null;
  // Pre-populates the input (e.g. step context from InlineAdvisoryPanel).
  // Practitioner can edit before submitting — never auto-submitted.
  initialValue?: string;
};

export function AdvisoryChat({ problemType, onSubmit, isLoading, output, initialValue = "" }: AdvisoryChatProps) {
  const [userContext, setUserContext] = useState(initialValue);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = userContext.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label className="font-mono text-xs text-kalder-accent">{problemType}</label>
        <Textarea
          value={userContext}
          onChange={(event) => setUserContext(event.target.value)}
          placeholder="Describe the contact, account, or cohort situation you want diagnosed..."
          disabled={isLoading}
          rows={4}
        />
        <Button type="submit" disabled={isLoading || userContext.trim().length === 0} className="self-end">
          {isLoading ? "Diagnosing..." : "Submit to Advisor"}
        </Button>
      </form>

      {output && <DiagnosticOutput output={output} />}
    </div>
  );
}
