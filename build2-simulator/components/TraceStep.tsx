// Individual routing step display — step name, result, corpus authority, value

import type { TraceStep as TraceStepType } from "@kalder/shared";

export type TraceStepProps = {
  step: TraceStepType;
  index: number;
};

// A step's result text starting with FAIL/SUPPRESSED signals the step did not
// pass — render those distinctly from a PASS/OVERRIDE/FORCED step, mirroring
// the brief's "each step labeled with ✓/✗" requirement for the right panel.
function statusSymbol(result: string): "✓" | "✗" {
  return /^(FAIL|SUPPRESSED)/.test(result) ? "✗" : "✓";
}

export function TraceStep({ step, index }: TraceStepProps) {
  const symbol = statusSymbol(step.result);
  const isFail = symbol === "✗";

  return (
    <div className="flex flex-col gap-1 border-b border-border py-2 last:border-b-0">
      <div className="flex items-start gap-2">
        <span className={`font-mono text-sm ${isFail ? "text-kalder-hold" : "text-kalder-success"}`}>{symbol}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {index + 1}. {step.step}
        </span>
      </div>
      <p className="pl-5 text-sm text-foreground">{step.result}</p>
      {step.value !== undefined && <p className="pl-5 font-mono text-xs text-kalder-accent">value: {String(step.value)}</p>}
      <p className="pl-5 font-mono text-xs text-kalder-accent">{step.corpus_authority}</p>
    </div>
  );
}
