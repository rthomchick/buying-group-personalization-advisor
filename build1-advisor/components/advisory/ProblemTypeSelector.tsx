// PT-1 / PT-2 / PT-5 entry point with descriptions
//
// Source of truth: knowledge/specs/kalder_layer2_decisions_log_L2E_builds.md,
// "Advisory Mode" — descriptions are the canonical practitioner-facing problem
// statements quoted there verbatim, not paraphrased.

"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProblemType } from "@/lib/session/session-state";

export type ProblemTypeSelectorProps = {
  onSelect: (problemType: ProblemType) => void;
};

const PROBLEM_TYPES: { id: ProblemType; title: string; description: string }[] = [
  {
    id: "PT-1",
    title: "PT-1 — Classification State Diagnosis",
    description: "A contact's confidence tier or experience level isn't what I expected.",
  },
  {
    id: "PT-2",
    title: "PT-2 — Cohort Performance Diagnosis",
    description: "A cohort metric is underperforming or has shifted unexpectedly.",
  },
  {
    id: "PT-5",
    title: "PT-5 — Sales Escalation Readiness",
    description: "I need to know whether a contact or account is ready for sales activation.",
  },
];

export function ProblemTypeSelector({ onSelect }: ProblemTypeSelectorProps) {
  const [selected, setSelected] = useState<ProblemType | null>(null);

  function handleSelect(problemType: ProblemType) {
    setSelected(problemType);
    onSelect(problemType);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {PROBLEM_TYPES.map((pt) => (
        <Card
          key={pt.id}
          role="button"
          tabIndex={0}
          onClick={() => handleSelect(pt.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") handleSelect(pt.id);
          }}
          className={cn(
            "cursor-pointer bg-surface transition-colors hover:bg-surface-raised",
            selected === pt.id && "border-kalder-accent ring-1 ring-kalder-accent",
          )}
        >
          <CardHeader>
            <CardTitle className="text-sm">{pt.title}</CardTitle>
            <CardDescription>{pt.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
