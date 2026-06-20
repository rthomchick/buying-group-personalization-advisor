// Consequence-first deferral dropdown — not a button
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Guided
// Workflow Mode: Step Card Specification" — "Defer this step" is a dropdown,
// not a button. Selecting a defer option shows the named scope-reduction
// consequence before confirming. Practitioner must read and confirm. Never
// fires onDefer without that explicit confirmation step.

"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DeferralOption } from "@/lib/session/session-state";

export type DeferralDropdownProps = {
  onDefer: (reason: Exclude<DeferralOption, "cancel_deferral">) => void;
  consequence: string;
};

const DEFER_OPTIONS: { value: DeferralOption; label: string }[] = [
  { value: "not_yet_available", label: "Defer — not yet available" },
  { value: "consciously_proceeding_without", label: "Defer — consciously proceeding without" },
  { value: "cancel_deferral", label: "Cancel" },
];

export function DeferralDropdown({ onDefer, consequence }: DeferralDropdownProps) {
  const [pendingOption, setPendingOption] = useState<Exclude<DeferralOption, "cancel_deferral"> | null>(null);

  function handleValueChange(value: string) {
    const option = value as DeferralOption;
    if (option === "cancel_deferral") {
      setPendingOption(null);
      return;
    }
    setPendingOption(option);
  }

  function handleConfirm() {
    if (!pendingOption) return;
    onDefer(pendingOption);
    setPendingOption(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <Select onValueChange={handleValueChange}>
        <SelectTrigger className="w-[260px]">
          <SelectValue placeholder="Defer this step ▾" />
        </SelectTrigger>
        <SelectContent>
          {DEFER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {pendingOption && (
        <Card className="border-kalder-flag/40 bg-kalder-flag/[0.06]">
          <CardContent className="flex flex-col gap-2 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-kalder-flag">Consequence</p>
            <p className="text-sm text-foreground">{consequence}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleConfirm} className="bg-kalder-flag text-black hover:bg-kalder-flag/90">
                Confirm Deferral
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPendingOption(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
