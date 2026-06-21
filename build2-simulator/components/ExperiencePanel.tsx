// Left panel — buyer view: module slots rendered by fallback level
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md,
// "Governing Design Constraint" — left panel is the buyer view (experience
// composition); dual-panel architecture is mandatory, this panel is never
// optional. All 11 module slots are always rendered here (in not_rendered or
// suppressed states where applicable) — a slot that doesn't render is shown
// as a labeled absence, never silently dropped from the composition (this is
// the same "not absent from the composition" requirement that governs
// progressive_disclosure's suppression states).

import { ModuleSlot } from "./ModuleSlot";
import type { ModuleComposition } from "@/lib/module-renderer";

export type ExperiencePanelProps = {
  composition: ModuleComposition;
};

export function ExperiencePanel({ composition }: ExperiencePanelProps) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto bg-background p-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h2 className="text-sm font-semibold text-foreground">Buyer Experience — Fallback Level {composition.fallback_level}</h2>
        <span className="font-mono text-xs text-kalder-version-stamp">v0.2.0</span>
      </div>

      <div className="flex flex-col gap-3">
        {composition.slots.map((slot) => (
          <ModuleSlot key={slot.module_type} slot={slot} />
        ))}
      </div>
    </div>
  );
}
