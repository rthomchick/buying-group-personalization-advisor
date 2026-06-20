// Landing page — mode selector (Reference / Advisory / Guided Workflow)

"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSessionState } from "@/lib/session/session-context";
import type { ActiveMode } from "@/lib/session/session-state";

const MODES: { mode: ActiveMode; href: string; title: string; description: string }[] = [
  {
    mode: "reference",
    href: "/reference",
    title: "Reference",
    description: "Direct lookups against the Kalder corpus and data model — answers with source citations.",
  },
  {
    mode: "advisory",
    href: "/advisory",
    title: "Advisory",
    description: "Conversational diagnosis for classification, cohort, and sales-readiness questions.",
  },
  {
    mode: "guided",
    href: "/guided",
    title: "Guided Workflow",
    description: "Step-by-step onboarding, content commissioning, and signal monitoring workflows.",
  },
];

export default function HomePage() {
  const { setActiveMode } = useSessionState();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">Kalder AI Advisor</h1>
        <p className="text-sm text-muted-foreground">Choose a mode to begin.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {MODES.map(({ mode, href, title, description }) => (
          <Link key={mode} href={href} onClick={() => setActiveMode(mode)}>
            <Card className="h-full cursor-pointer bg-surface transition-colors hover:bg-surface-raised hover:border-kalder-accent/50">
              <CardHeader>
                <CardTitle className="text-sm">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
