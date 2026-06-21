// Main simulator view — dual panel (ExperiencePanel left, DecisioningPanel right)
// Accepts visitor state from URL parameters or manual input panel
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md,
// "Governing Design Constraint" — dual-panel architecture is mandatory, both
// panels always visible, neither optional. On load: parse URL params if
// present and valid (Build 1 "Send to Simulator" pipeline-fed mode); fall
// back to DEFAULT_VISITOR_STATE (Contact A) for manual-input mode otherwise.
// Every state change (manual input, Load Contact button, or What-Would-
// Change-If toggle) re-runs the decisioning engine and module renderer and
// re-renders both panels immediately — no submit button anywhere.
//
// useSearchParams() requires a Suspense boundary in the Next.js App Router —
// SimulatorView is split out so Suspense can wrap just the part that reads
// search params, not the whole page.

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StateInputPanel } from "@/components/StateInputPanel";
import { ExperiencePanel } from "@/components/ExperiencePanel";
import { DecisioningPanel } from "@/components/DecisioningPanel";
import { EdgeStateToggles } from "@/components/EdgeStateToggles";
import { runDecisioningEngine } from "@/lib/decisioning-engine";
import { renderModules } from "@/lib/module-renderer";
import { parseUrlParamsDetailed } from "@/lib/url-params";
import { DEFAULT_VISITOR_STATE } from "@kalder/shared";
import type { VisitorState } from "@kalder/shared";

function SimulatorView() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VisitorState>(DEFAULT_VISITOR_STATE);
  const [urlParamError, setUrlParamError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.size === 0) return;
    const { state: parsed, errors } = parseUrlParamsDetailed(searchParams);
    if (parsed) {
      setState(parsed);
      setUrlParamError(null);
    } else {
      setUrlParamError(
        `URL parameters present but invalid — falling back to default state. Errors: ${errors
          ?.map((e) => `${e.param} (${e.reason}${e.value ? `: "${e.value}"` : ""})`)
          .join(", ")}`,
      );
    }
    // Only parse once on mount — subsequent state changes are manual-input
    // driven, not URL-driven, and must not be overwritten by a stale URL read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const result = runDecisioningEngine(state);
  const composition = renderModules(state, result);

  return (
    <div className="flex flex-1 flex-col">
      {urlParamError && (
        <div className="border-b border-kalder-hold/40 bg-kalder-hold/[0.08] px-4 py-2 text-xs text-kalder-hold">{urlParamError}</div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 overflow-y-auto">
          <StateInputPanel state={state} onChange={setState} />
        </aside>

        <div className="grid flex-1 grid-cols-2 overflow-hidden">
          <ExperiencePanel composition={composition} />
          <DecisioningPanel state={state} result={result} composition={composition} />
        </div>
      </div>

      <EdgeStateToggles state={state} onChange={setState} />
    </div>
  );
}

export default function SimulatorPage() {
  return (
    <Suspense fallback={null}>
      <SimulatorView />
    </Suspense>
  );
}
