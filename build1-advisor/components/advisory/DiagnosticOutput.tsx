// Six-section collapsible card renderer
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Advisory
// Mode Output Rendering" — NAMED_STATE_CHECK is non-collapsible by default;
// the other five sections render collapsible and open by default.

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { NamedStateCheck } from "./NamedStateCheck";
import type { ParsedAdvisoryOutput, SectionName } from "@/lib/advisory/output-parser";

export type DiagnosticOutputProps = {
  output: ParsedAdvisoryOutput;
};

const SECTION_LABELS: Record<SectionName, string> = {
  PROBLEM_RESTATEMENT: "PROBLEM RESTATEMENT",
  CORPUS_SECTION_TRAVERSAL: "CORPUS SECTION TRAVERSAL",
  NAMED_STATE_CHECK: "NAMED STATE CHECK",
  DIAGNOSIS: "DIAGNOSIS",
  RECOMMENDED_ACTIONS: "RECOMMENDED ACTIONS",
  DIAGNOSTIC_CONFIDENCE: "DIAGNOSTIC CONFIDENCE",
};

// NAMED_STATE_CHECK's raw text names each state inline (e.g.
// "differential_insufficient: True"). Extracted here rather than re-parsing
// in the page layer, since this is the one place that text is rendered.
function extractNamedStateValue(namedStateText: string, key: string): string {
  const pattern = new RegExp(`${key}\\s*[:=]\\s*([^\\n.]+)`, "i");
  const match = namedStateText.match(pattern);
  return match ? match[1].trim() : "NOT_DETERMINABLE — not named in output";
}

function CorpusCitationLine({ text }: { text: string }) {
  return <p className="font-mono text-xs text-kalder-accent">{text}</p>;
}

function CollapsibleSection({ name, section }: { name: SectionName; section: ParsedAdvisoryOutput["sections"][SectionName] }) {
  return (
    <Collapsible defaultOpen className="rounded-lg border border-border bg-surface">
      <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="text-sm font-semibold tracking-wide text-foreground">{SECTION_LABELS[name]}</span>
        <div className="flex items-center gap-2">
          {!section.present && (
            <Badge variant="outline" className="border-kalder-flag/40 text-[10px] text-kalder-flag">
              missing
            </Badge>
          )}
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        {section.present ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{section.text}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Claude's response did not include this section header.</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DiagnosticOutput({ output }: DiagnosticOutputProps) {
  const namedStateText = output.sections.NAMED_STATE_CHECK.text;
  const differentialInsufficient = extractNamedStateValue(namedStateText, "differential_insufficient");
  const pendingSolutionFallback = extractNamedStateValue(namedStateText, "pending_solution_fallback");

  return (
    <div className="flex flex-col gap-3">
      {output.reducedConfidence && (
        <Card className="border-kalder-flag/40 bg-kalder-flag/[0.08]">
          <CardContent className="flex flex-col gap-1 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-kalder-flag">
              Reduced confidence — corpus substitution occurred
            </span>
            {output.substitutionNotices.map((notice, idx) => (
              <CorpusCitationLine key={idx} text={notice} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="bg-surface-raised">
        <CardHeader>
          <CardTitle className="text-xs font-mono text-muted-foreground">Data model: v0.2.0</CardTitle>
        </CardHeader>
      </Card>

      <CollapsibleSection name="PROBLEM_RESTATEMENT" section={output.sections.PROBLEM_RESTATEMENT} />
      <CollapsibleSection name="CORPUS_SECTION_TRAVERSAL" section={output.sections.CORPUS_SECTION_TRAVERSAL} />

      <NamedStateCheck differential_insufficient={differentialInsufficient} pending_solution_fallback={pendingSolutionFallback} />

      <CollapsibleSection name="DIAGNOSIS" section={output.sections.DIAGNOSIS} />
      <CollapsibleSection name="RECOMMENDED_ACTIONS" section={output.sections.RECOMMENDED_ACTIONS} />
      <CollapsibleSection name="DIAGNOSTIC_CONFIDENCE" section={output.sections.DIAGNOSTIC_CONFIDENCE} />
    </div>
  );
}
