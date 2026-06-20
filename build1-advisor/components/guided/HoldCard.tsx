// H-0x HOLD display with resolution input and confirm control
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Guided
// Workflow Mode: Step Card Specification" — HOLD = integrity interrupt,
// non-bypassable; resolution must be explicitly confirmed by the practitioner.

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { HoldRecord } from "@/lib/session/session-state";

export type HoldCardProps = {
  hold: HoldRecord;
  onResolve: (holdId: string, resolutionText: string) => void;
};

export function HoldCard({ hold, onResolve }: HoldCardProps) {
  const [resolutionText, setResolutionText] = useState("");

  function handleConfirm() {
    const trimmed = resolutionText.trim();
    if (!trimmed) return;
    onResolve(hold.holdCode, trimmed);
  }

  return (
    <Card className="rounded-md border-0 border-l-[3px] border-l-kalder-hold bg-kalder-hold/[0.03] shadow-none">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-kalder-hold">HOLD {hold.holdCode}</span>
        </div>
        <p className="text-sm text-foreground">{hold.description}</p>
        <p className="text-xs text-muted-foreground">Resolution: {hold.resolutionInstruction}</p>
        <p className="font-mono text-xs text-kalder-accent">{hold.corpusAuthority}</p>

        <Textarea
          value={resolutionText}
          onChange={(event) => setResolutionText(event.target.value)}
          placeholder="Enter resolution..."
          rows={2}
        />
        <Button
          onClick={handleConfirm}
          disabled={resolutionText.trim().length === 0}
          className="self-start bg-kalder-hold text-white hover:bg-kalder-hold/90"
        >
          Confirm Resolution
        </Button>
      </CardContent>
    </Card>
  );
}
