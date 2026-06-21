// "What Would Change If..." scenario buttons — four edge state transitions
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md,
// "'What Would Change If...' Toggles" — four scenario buttons, each applying
// a named state change and re-rendering immediately.

"use client";

import {
  coverageAdvancesToPartial,
  contactRespondsToProgressiveDisclosure,
  contactIsInHoldbackGroup,
  consentIsDeclined,
} from "@/lib/scenario-presets";
import type { VisitorState } from "@kalder/shared";

export type EdgeStateTogglesProps = {
  state: VisitorState;
  onChange: (state: VisitorState) => void;
};

const buttonClass = "rounded-md border border-border bg-background px-3 py-2 text-left text-xs text-foreground hover:border-kalder-accent/40 hover:bg-surface-raised";

export function EdgeStateToggles({ state, onChange }: EdgeStateTogglesProps) {
  return (
    <div className="flex flex-col gap-2 border-t border-border bg-surface p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What Would Change If...</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button type="button" className={buttonClass} onClick={() => onChange(coverageAdvancesToPartial(state))}>
          What if coverage advances to &apos;partial&apos;?
        </button>
        <button type="button" className={buttonClass} onClick={() => onChange(contactRespondsToProgressiveDisclosure(state))}>
          What if the contact responds to progressive disclosure?
        </button>
        <button type="button" className={buttonClass} onClick={() => onChange(contactIsInHoldbackGroup(state))}>
          What if this contact is in the holdback group?
        </button>
        <button type="button" className={buttonClass} onClick={() => onChange(consentIsDeclined(state))}>
          What if consent is declined?
        </button>
      </div>
    </div>
  );
}
