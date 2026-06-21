// Handles three distinct states: SUPPRESSED_ACTIVE (Level 1),
// SUPPRESSED_HOLDBACK (holdback_group true), and rendered variants
//
// Source of truth: knowledge/kalder_doc4_content_model_and_taxonomy.md §5.2
// (progressive_disclosure fallback behavior) and knowledge/kalder_doc5_
// personalization_decisioning_rules.md §7.7 (holdback suppression).
//
// These two suppression states must be visually distinct at a glance — they
// mean structurally different things. suppressed_active is an architectural
// design choice (the visitor is already HIGH-confidence, nothing to ask).
// suppressed_holdback is a measurement-integrity withholding (the slot would
// otherwise render; it is intentionally hidden so this visitor can serve as
// a clean control). Conflating the two in the UI would misrepresent why the
// slot is empty to the VP watching the demo.

import type { ModuleSlot } from "@/lib/module-renderer";

export type ProgressiveDisclosureSlotProps = {
  slot: ModuleSlot;
};

export function ProgressiveDisclosureSlot({ slot }: ProgressiveDisclosureSlotProps) {
  if (slot.rendering_state === "suppressed_active") {
    return (
      <div className="rounded-md border-2 border-dashed border-kalder-text-muted bg-background/40 px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-kalder-text-muted">
          progressive_disclosure — SUPPRESSED (active suppression by design)
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{slot.variant_descriptor}</p>
        <p className="mt-1 font-mono text-xs text-kalder-accent">{slot.corpus_authority}</p>
      </div>
    );
  }

  if (slot.rendering_state === "suppressed_holdback") {
    return (
      <div className="rounded-md border-2 border-dashed border-kalder-hold bg-kalder-hold/[0.06] px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-kalder-hold">progressive_disclosure — SUPPRESSED (holdback control condition)</p>
        <p className="mt-1 text-sm text-foreground">{slot.variant_descriptor}</p>
        <p className="mt-1 font-mono text-xs text-kalder-accent">{slot.corpus_authority}</p>
      </div>
    );
  }

  if (slot.rendering_state === "not_rendered") {
    return (
      <div className="rounded-md border border-border bg-background/20 px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">progressive_disclosure — not rendered</p>
        <p className="mt-1 font-mono text-xs text-kalder-accent">{slot.corpus_authority}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-kalder-accent/40 bg-kalder-accent/[0.06] px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-kalder-accent">progressive_disclosure</p>
      <p className="mt-1 text-sm text-foreground">{slot.variant_descriptor}</p>
      <p className="mt-1 font-mono text-xs text-kalder-accent">{slot.corpus_authority}</p>
    </div>
  );
}
