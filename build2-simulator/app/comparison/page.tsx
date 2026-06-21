// Split-screen comparison mode — two visitor states side by side, read-only
//
// Source of truth: knowledge/specs/kalder_layer2_decisions_log_L2E_builds.md,
// "Comparison mode" — read-only, states set before entering comparison mode.
// Left state uses the standard unprefixed param names; right state uses the
// same names prefixed "r_" (lib/url-params.ts's parseUrlParamsDetailed()
// prefix argument). If either state is missing or invalid, this shows an
// error rather than a partially-rendered comparison — never silently
// render one valid column next to a guessed/defaulted one.

"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ComparisonView, type ComparisonColumn } from "@/components/ComparisonView";
import { runDecisioningEngine } from "@/lib/decisioning-engine";
import { renderModules } from "@/lib/module-renderer";
import { parseUrlParamsDetailed, type UrlParamValidationError } from "@/lib/url-params";
import type { VisitorState } from "@kalder/shared";

function buildColumn(state: VisitorState): ComparisonColumn {
  const result = runDecisioningEngine(state);
  const composition = renderModules(state, result);
  return { state, result, composition };
}

function ErrorList({ title, errors }: { title: string; errors: UrlParamValidationError[] }) {
  return (
    <div className="rounded-md border border-kalder-hold/40 bg-kalder-hold/[0.08] px-4 py-3">
      <p className="text-sm font-semibold text-kalder-hold">{title}</p>
      <ul className="mt-1 list-inside list-disc text-xs text-foreground">
        {errors.map((e, idx) => (
          <li key={idx} className="font-mono">
            {e.param} — {e.reason}
            {e.value ? `: "${e.value}"` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComparisonPageView() {
  const searchParams = useSearchParams();
  const left = parseUrlParamsDetailed(searchParams);
  const right = parseUrlParamsDetailed(searchParams, "r_");

  const hasError = left.state === null || right.state === null;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">Comparison Mode</h1>
        <Link href="/" className="text-xs text-kalder-accent hover:underline">
          ← Back to simulator
        </Link>
      </div>

      {hasError ? (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <p className="text-sm text-foreground">
            Comparison mode requires a complete and valid visitor state for both columns, supplied via URL parameters
            (left: unprefixed, e.g. <code className="font-mono text-kalder-accent">role</code>; right: prefixed with{" "}
            <code className="font-mono text-kalder-accent">r_</code>, e.g. <code className="font-mono text-kalder-accent">r_role</code>).
            Never rendering a partial comparison.
          </p>
          {left.errors && <ErrorList title="Left state (no prefix) — invalid or incomplete" errors={left.errors} />}
          {right.errors && <ErrorList title="Right state (r_ prefix) — invalid or incomplete" errors={right.errors} />}
        </div>
      ) : (
        <ComparisonView left={buildColumn(left.state)} right={buildColumn(right.state)} />
      )}
    </div>
  );
}

export default function ComparisonPage() {
  return (
    <Suspense fallback={null}>
      <ComparisonPageView />
    </Suspense>
  );
}
