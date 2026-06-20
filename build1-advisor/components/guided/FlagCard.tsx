// F-0x FLAG display with acknowledge control and corpus citation
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Guided
// Workflow Mode: Step Card Specification" — FLAG = advisory interrupt,
// advanceable after acknowledgment, available only after all HOLDs clear.

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FlagRecord } from "@/lib/session/session-state";

export type FlagCardProps = {
  flag: FlagRecord;
  onAcknowledge: (flagId: string) => void;
};

export function FlagCard({ flag, onAcknowledge }: FlagCardProps) {
  return (
    <Card className="rounded-md border-0 border-l-[3px] border-l-kalder-flag bg-kalder-flag/[0.03] shadow-none">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-kalder-flag">FLAG {flag.flagCode}</span>
        </div>
        <p className="text-sm text-foreground">{flag.description}</p>
        <p className="font-mono text-xs text-kalder-accent">Authority: {flag.corpusAuthority}</p>
        {flag.consequence && <p className="text-xs text-muted-foreground">Consequence: {flag.consequence}</p>}

        <Button
          onClick={() => onAcknowledge(flag.flagCode)}
          variant="secondary"
          className="self-start border border-kalder-flag/40 text-kalder-flag hover:bg-kalder-flag/10"
        >
          Acknowledge
        </Button>
      </CardContent>
    </Card>
  );
}
