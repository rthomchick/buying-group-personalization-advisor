// Right panel — decisioning trace: step-by-step routing evaluation with
// corpus authority citations
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Right
// Panel Structure" — visitor state as received, routing evaluation (each
// step labeled ✓/✗ with corpus authority), experience assigned (with
// pending_solution_fallback note if active), module composition overview,
// three-axis status. Version stamp v0.2.0 in every panel header.
//
// Alfonso's pending_solution_fallback display requirement (decisions log):
// when active, this panel must show (a) the visitor's actual confidence_tier
// stored separately from the routing outcome, and (b) the upgrade-path note.

import { TraceStep } from "./TraceStep";
import type { VisitorState, DecisioningResult } from "@kalder/shared";
import type { ModuleComposition } from "@/lib/module-renderer";

export type DecisioningPanelProps = {
  state: VisitorState;
  result: DecisioningResult;
  composition: ModuleComposition;
};

function PendingSolutionFallbackNote({ state }: { state: VisitorState }) {
  return (
    <div className="rounded-md border border-kalder-flag/40 bg-kalder-flag/[0.08] px-3 py-2 text-xs text-foreground">
      <p className="font-semibold uppercase tracking-wide text-kalder-flag">pending_solution_fallback: ACTIVE</p>
      <p className="mt-1">
        Visitor&apos;s actual <span className="font-mono text-kalder-accent">confidence_tier</span> ({state.confidence_tier}) is stored
        in AEP and unaffected by this constraint. This is a routing constraint, not a classification judgment.
      </p>
      <p className="mt-1">
        When <span className="font-mono text-kalder-accent">solution_category_coverage_status</span> advances to{" "}
        <span className="font-mono text-kalder-accent">partial</span>, Level 2 activates automatically. No re-accumulation required.
      </p>
    </div>
  );
}

function ThreeAxisStatus({ result }: { result: DecisioningResult }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2">
      <span className="font-mono text-xs text-muted-foreground">three_axis</span>
      <span className="font-mono text-xs text-kalder-accent">
        {result.three_axis_active ? "ACTIVE" : "not active"} — mode: {result.three_axis_result.mode ?? "null"}
        {result.three_axis_result.jtbd_code ? ` — jtbd_code: ${result.three_axis_result.jtbd_code}` : ""}
      </span>
    </div>
  );
}

export function DecisioningPanel({ state, result, composition }: DecisioningPanelProps) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto border-l border-border bg-surface p-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h2 className="text-sm font-semibold text-foreground">Decisioning Trace</h2>
        <span className="font-mono text-xs text-kalder-version-stamp">v0.2.0</span>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visitor State (as received)</h3>
        <pre className="overflow-x-auto rounded-md bg-background/40 p-3 font-mono text-xs text-kalder-accent">{JSON.stringify(state, null, 2)}</pre>
      </section>

      <section className="flex flex-col gap-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Routing Evaluation</h3>
        <div className="rounded-md border border-border bg-background/40 px-3">
          {result.trace.map((step, idx) => (
            <TraceStep key={`${step.step}-${idx}`} step={step} index={idx} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Experience Assigned</h3>
        <div className="rounded-md border border-kalder-accent/40 bg-kalder-accent/[0.08] px-3 py-2">
          <p className="font-mono text-sm text-foreground">
            Fallback Level <span className="text-kalder-accent">{result.fallback_level}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">routing_path: {result.routing_path}</p>
          {result.differential_override && <p className="mt-1 text-xs font-semibold text-kalder-flag">OVERRIDE ACTIVE — Priority 0</p>}
          {result.consent_suppressed && <p className="mt-1 text-xs font-semibold text-kalder-flag">Consent suppressed — firmographic-only routing</p>}
        </div>
        {result.pending_solution_fallback && <PendingSolutionFallbackNote state={state} />}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Module Composition Overview</h3>
        <div className="flex flex-col gap-1">
          {composition.slots.map((slot) => (
            <div key={slot.module_type} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/40 px-3 py-1.5">
              <span className="font-mono text-xs text-foreground">{slot.module_type}</span>
              <span className="font-mono text-xs text-muted-foreground">{slot.axes_active.join(" x ") || "—"}</span>
              <span className="font-mono text-xs text-kalder-accent">{slot.rendering_state}</span>
            </div>
          ))}
        </div>
      </section>

      <ThreeAxisStatus result={result} />
    </div>
  );
}
