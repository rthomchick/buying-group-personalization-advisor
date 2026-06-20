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

// Claude's actual phrasing varies run to run — observed forms include
// "= `True`: PRESENT and ACTIVE", "NOT PRESENT as a causal factor",
// "ACTIVE", "Not active", "= False", "NOT_DETERMINABLE", "not determinable".
// Negative forms are checked first since they contain their positive
// substrings ("NOT ACTIVE" contains "ACTIVE", "NOT PRESENT" implies false).
const NEGATIVE_PATTERNS = ["NOT ACTIVE", "NOT PRESENT", "NOT TRIGGERED", "= `FALSE`", "= FALSE", ": FALSE", " FALSE", "INACTIVE"];
const POSITIVE_PATTERNS = ["PRESENT AND ACTIVE", "= `TRUE`", "= TRUE", ": TRUE", "ACTIVE", "TRIGGERED", " TRUE"];

function normalizeLabel(value: string): NamedStateLabel {
  const upper = value.trim().toUpperCase();
  if (upper.includes("NOT_DETERMINABLE") || upper.includes("NOT DETERMINABLE")) return "NOT_DETERMINABLE";
  if (NEGATIVE_PATTERNS.some((p) => upper.includes(p))) return "FALSE";
  if (POSITIVE_PATTERNS.some((p) => upper.includes(p))) return "TRUE";
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
          <Badge variant="outline" className="border-border text-[11px] text-kalder-text-muted">
            always visible
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
