// Individual module slot — rendered, NOT_RENDERED, SUPPRESSED_ACTIVE,
// or SUPPRESSED_HOLDBACK states
//
// progressive_disclosure is the one module type with two distinct suppression
// states (Document 4 §5.2; Document 5 §7.7) — delegated to
// ProgressiveDisclosureSlot.tsx, which renders each state with a visually
// distinct treatment. All other module types only ever reach "rendered" or
// "not_rendered" (per lib/module-renderer.ts), so they share this generic card.

import { ProgressiveDisclosureSlot } from "./ProgressiveDisclosureSlot";
import type { ModuleSlot as ModuleSlotType } from "@/lib/module-renderer";

export type ModuleSlotProps = {
  slot: ModuleSlotType;
};

const RENDERING_STATE_STYLES: Record<ModuleSlotType["rendering_state"], string> = {
  rendered: "border-border bg-surface",
  not_rendered: "border-border bg-background/20",
  suppressed_active: "border-kalder-text-muted border-dashed bg-background/40",
  suppressed_holdback: "border-kalder-hold border-dashed bg-kalder-hold/[0.06]",
};

const RENDERING_STATE_LABELS: Record<ModuleSlotType["rendering_state"], string> = {
  rendered: "rendered",
  not_rendered: "not rendered",
  suppressed_active: "suppressed — active",
  suppressed_holdback: "suppressed — holdback",
};

export function ModuleSlot({ slot }: ModuleSlotProps) {
  if (slot.module_type === "progressive_disclosure") {
    return <ProgressiveDisclosureSlot slot={slot} />;
  }

  return (
    <div className={`rounded-md border px-3 py-3 ${RENDERING_STATE_STYLES[slot.rendering_state]}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-wide text-foreground">{slot.module_type}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{RENDERING_STATE_LABELS[slot.rendering_state]}</span>
      </div>
      {slot.axes_active.length > 0 && <p className="mt-1 font-mono text-[10px] text-muted-foreground">axes: {slot.axes_active.join(" x ")}</p>}
      {slot.rendering_state === "rendered" && <p className="mt-2 text-sm text-foreground">{slot.variant_descriptor}</p>}
      <p className="mt-1 font-mono text-xs text-kalder-accent">{slot.corpus_authority}</p>
    </div>
  );
}
