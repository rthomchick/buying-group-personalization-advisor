// Prioritized gap list (CRITICAL / HIGH / MODERATE) and audit log export button
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Guided
// Workflow Mode: Step Card Specification" — "Completion Screen", gap priority
// logic:
//   CRITICAL: Category A blocking inputs unresolved (H-01 HOLDs resolved by
//             deferral — which is not possible; flag for review)
//   HIGH: Category B deferrable inputs with scope-reduction consequences
//   MODERATE: Configuration Gap Records from F-04 FLAGs (Track 2 pending)

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { GuidedWorkflowState } from "@/lib/session/session-state";
import type { WorkflowStepDefinition } from "@/lib/guided/flag-hold-evaluator";

export type CompletionScreenProps = {
  state: GuidedWorkflowState;
  workflowSteps: WorkflowStepDefinition[];
  talDomain: string;
  onExport: () => void;
  onReturn: () => void;
};

type Gap = { priority: "CRITICAL" | "HIGH" | "MODERATE"; attribute: string; consequence: string; nextStep?: string };

function buildGaps(state: GuidedWorkflowState, steps: WorkflowStepDefinition[]): Gap[] {
  const gaps: Gap[] = [];
  const stepsById = new Map(steps.map((s) => [s.step_id, s]));

  // CRITICAL: Category A steps with a deferral on record. H-01 HOLDs cannot
  // legitimately be cleared by deferral (HOLDs are non-bypassable) — any
  // Category A deferral on record means a step was deferred despite carrying
  // a blocking HOLD, which should not be reachable through the state machine
  // and is therefore flagged for review rather than silently trusted.
  for (const deferral of state.deferralLog) {
    const step = stepsById.get(deferral.stepId);
    if (step?.category === "A") {
      gaps.push({
        priority: "CRITICAL",
        attribute: step.attribute ?? step.step_title,
        consequence: `${deferral.consequence} — flagged for review: Category A step deferred.`,
        nextStep: "Review this deferral with the Advisor before activation.",
      });
    }
  }

  // HIGH: Category B steps with a deferral on record.
  for (const deferral of state.deferralLog) {
    const step = stepsById.get(deferral.stepId);
    if (step?.category === "B") {
      gaps.push({
        priority: "HIGH",
        attribute: step.attribute ?? step.step_title,
        consequence: deferral.consequence,
        nextStep: "Complete this attribute to restore full scope.",
      });
    }
  }

  // MODERATE: persistent Configuration Gap Records (F-04 Track 2 pending).
  for (const gap of state.configurationGapRecords) {
    if (gap.status === "persistent_unresolved") {
      gaps.push({
        priority: "MODERATE",
        attribute: gap.attribute,
        consequence: gap.consequence,
        nextStep: "Track 2 — pending.",
      });
    }
  }

  return gaps;
}

const PRIORITY_STYLES: Record<Gap["priority"], string> = {
  CRITICAL: "border-kalder-hold/40 bg-kalder-hold/[0.06] text-kalder-hold",
  HIGH: "border-kalder-flag/40 bg-kalder-flag/[0.06] text-kalder-flag",
  MODERATE: "border-border bg-muted text-muted-foreground",
};

export function CompletionScreen({ state, workflowSteps, talDomain, onExport, onReturn }: CompletionScreenProps) {
  const gaps = buildGaps(state, workflowSteps);
  const grouped: Record<Gap["priority"], Gap[]> = { CRITICAL: [], HIGH: [], MODERATE: [] };
  for (const gap of gaps) grouped[gap.priority].push(gap);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">Session Complete — {talDomain}</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {new Date().toISOString()} | Data model: v{state.dataModelVersion}
        </span>
      </div>

      <Card className="bg-surface">
        <CardHeader>
          <CardTitle className="text-sm">Session Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
          <div>
            <div className="text-muted-foreground">Steps completed</div>
            <div className="font-mono text-foreground">
              {state.completedSteps.length}/{workflowSteps.length}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Steps deferred</div>
            <div className="font-mono text-foreground">{state.deferralLog.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground">HOLDs resolved</div>
            <div className="font-mono text-foreground">{state.resolvedHolds.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground">FLAGs acknowledged</div>
            <div className="font-mono text-foreground">{state.acknowledgedFlags.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Config gaps</div>
            <div className="font-mono text-foreground">
              {state.configurationGapRecords.filter((g) => g.status === "persistent_unresolved").length} persistent
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Open Gaps — Prioritized by Program Impact</h3>
        {gaps.length === 0 && <p className="text-sm text-muted-foreground">No open gaps recorded for this session.</p>}
        {(["CRITICAL", "HIGH", "MODERATE"] as const).map(
          (priority) =>
            grouped[priority].length > 0 && (
              <div key={priority} className="flex flex-col gap-2">
                {grouped[priority].map((gap, idx) => (
                  <Card key={`${priority}-${idx}`} className={`border ${PRIORITY_STYLES[priority]}`}>
                    <CardContent className="flex flex-col gap-1 py-3">
                      <span className="text-xs font-bold uppercase tracking-wide">{priority}</span>
                      <p className="text-sm text-foreground">
                        {gap.attribute} — {gap.consequence}
                      </p>
                      {gap.nextStep && <p className="text-xs text-muted-foreground">→ {gap.nextStep}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ),
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={onExport}>
          <Download className="size-4" />
          Export Audit Log (JSON)
        </Button>
        <Button variant="secondary" onClick={onReturn}>
          Return to Advisor
        </Button>
      </div>
    </div>
  );
}
