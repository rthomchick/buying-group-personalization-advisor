// Onboarding (18 steps) / Commissioning (12 steps) / Monitoring (10 steps)

"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { WorkflowId } from "@/lib/session/session-state";

export type WorkflowSelectorProps = {
  onSelect: (workflowId: WorkflowId) => void;
};

const WORKFLOWS: { id: WorkflowId; title: string; description: string }[] = [
  { id: "onboarding_18step", title: "Onboarding", description: "18 steps — client onboarding and attribute configuration." },
  {
    id: "content_commissioning_12step",
    title: "Content Commissioning",
    description: "12 steps — content graph node authoring and validation.",
  },
  { id: "signal_monitoring_10step", title: "Signal Monitoring", description: "10 steps — ongoing signal health checks." },
];

export function WorkflowSelector({ onSelect }: WorkflowSelectorProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {WORKFLOWS.map((workflow) => (
        <Card
          key={workflow.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(workflow.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") onSelect(workflow.id);
          }}
          className="cursor-pointer bg-surface transition-colors hover:bg-surface-raised hover:border-kalder-accent/50"
        >
          <CardHeader>
            <CardTitle className="text-sm">{workflow.title}</CardTitle>
            <CardDescription>{workflow.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
