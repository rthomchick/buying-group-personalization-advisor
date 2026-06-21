// Side-by-side dual panel layout for comparison mode
//
// Source of truth: knowledge/specs/kalder_layer2_decisions_log_L2E_builds.md,
// "Comparison mode: Split-screen toggle. Two visitor states side-by-side.
// Both decisioning traces and both experience compositions visible
// simultaneously. Read-only (no input panel). States set before entering
// comparison mode." — no StateInputPanel, no EdgeStateToggles here; both
// states are fixed for the duration of this view, set only via URL params.
//
// Column headers follow the "Contact A — MEDIUM Champion" / "Contact B —
// differential_insufficient" pattern: "Contact A"/"Contact B" identify left
// vs. right positionally; the text after the dash is derived from the
// state's actual computed result, never hardcoded. It names whichever named
// edge state is active (differential_insufficient override,
// pending_solution_fallback, holdback, consent suppression) since that's the
// most diagnostically useful summary, falling back to "{TIER} {Role}" when
// no edge state fired.

import { ExperiencePanel } from "./ExperiencePanel";
import { DecisioningPanel } from "./DecisioningPanel";
import type { VisitorState, DecisioningResult } from "@kalder/shared";
import type { ModuleComposition } from "@/lib/module-renderer";

export type ComparisonColumn = {
  state: VisitorState;
  result: DecisioningResult;
  composition: ModuleComposition;
};

export type ComparisonViewProps = {
  left: ComparisonColumn;
  right: ComparisonColumn;
};

function roleLabel(role: VisitorState["role_classification"]): string {
  return role
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Derives the descriptive half of a column header from a state's actual
 * computed result — never a hardcoded contact name. Names the active named
 * edge state when one fired (most diagnostically relevant); falls back to
 * "{TIER} {Role}".
 */
export function deriveStateLabel(state: VisitorState, result: DecisioningResult): string {
  if (result.differential_override) return "differential_insufficient";
  if (result.pending_solution_fallback) return "pending_solution_fallback";
  if (state.holdback_group) return "holdback_group";
  if (result.consent_suppressed) return "consent declined";
  return `${state.confidence_tier} ${roleLabel(state.role_classification)}`;
}

function ComparisonColumnView({ column, positionLabel }: { column: ComparisonColumn; positionLabel: string }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border bg-surface-raised px-4 py-2">
        <h2 className="text-sm font-semibold text-foreground">
          {positionLabel} — {deriveStateLabel(column.state, column.result)}
        </h2>
      </div>
      <div className="grid flex-1 grid-rows-2 overflow-hidden">
        <ExperiencePanel composition={column.composition} />
        <DecisioningPanel state={column.state} result={column.result} composition={column.composition} />
      </div>
    </div>
  );
}

export function ComparisonView({ left, right }: ComparisonViewProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <ComparisonColumnView column={left} positionLabel="Contact A" />
      <div className="w-px shrink-0 bg-border" />
      <ComparisonColumnView column={right} positionLabel="Contact B" />
    </div>
  );
}
