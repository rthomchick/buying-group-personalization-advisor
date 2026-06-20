// Non-collapsible section — differential_insufficient and pending_solution_fallback
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Advisory
// Mode: System Prompt Construction" — "Treating these as generic low-confidence
// or coverage-gap states is a disqualifying error." This section is never
// collapsible and carries more visual weight than the five sections around it
// by design — it is the one place these two named program states cannot be
// missed by the practitioner.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type NamedStateLabel = "TRUE" | "FALSE" | "NOT_DETERMINABLE";

export type NamedStateCheckProps = {
  differential_insufficient: string;
  pending_solution_fallback: string;
};

function normalizeLabel(value: string): NamedStateLabel {
  const upper = value.trim().toUpperCase();
  if (upper.includes("NOT_DETERMINABLE") || upper.includes("NOT DETERMINABLE")) return "NOT_DETERMINABLE";
  // Negative forms ("NOT ACTIVE", "FALSE") must be checked before their
  // positive substrings ("ACTIVE", "TRUE") — "Not active" contains "ACTIVE".
  if (upper.includes("NOT ACTIVE") || upper.includes("FALSE")) return "FALSE";
  if (upper.includes("TRUE") || upper.includes("ACTIVE")) return "TRUE";
  return "NOT_DETERMINABLE";
}

const LABEL_STYLES: Record<NamedStateLabel, string> = {
  TRUE: "bg-kalder-flag/15 text-kalder-flag border-kalder-flag/40",
  FALSE: "bg-kalder-success/15 text-kalder-success border-kalder-success/40",
  NOT_DETERMINABLE: "bg-muted text-muted-foreground border-border",
};

function NamedStateRow({ name, rawValue }: { name: string; rawValue: string }) {
  const label = normalizeLabel(rawValue);
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-background/40 px-3 py-2">
      <span className="font-mono text-sm text-foreground">{name}</span>
      <Badge variant="outline" className={cn("font-mono text-xs", LABEL_STYLES[label])}>
        {label}
      </Badge>
    </div>
  );
}

export function NamedStateCheck({ differential_insufficient, pending_solution_fallback }: NamedStateCheckProps) {
  return (
    <Card className="border-2 border-kalder-accent/50 bg-surface-raised shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm tracking-wide text-foreground">
          NAMED STATE CHECK
          <Badge variant="outline" className="border-kalder-accent/40 text-[10px] text-kalder-accent">
            non-collapsible
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <NamedStateRow name="differential_insufficient" rawValue={differential_insufficient} />
        <NamedStateRow name="pending_solution_fallback" rawValue={pending_solution_fallback} />
      </CardContent>
    </Card>
  );
}
