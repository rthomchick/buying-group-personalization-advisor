// Step validation → FLAG/HOLD evaluator → state manager
//
// Source of truth:
// - knowledge/specs/kalder_layer2_developer_brief.md, "Guided Workflow Mode"
// - knowledge/specs/kalder_layer2_decisions_log_L2E_builds.md, "Guided Workflow Mode (locked)"
//
// This route is a thin wrapper. All state transition logic lives in
// lib/guided/state-machine.ts; all trigger evaluation lives in
// lib/guided/flag-hold-evaluator.ts. This route's only job is to dispatch by
// action, load the workflow's step definitions, call the state machine, and
// return the updated GuidedWorkflowState — it does not evaluate triggers or
// mutate state itself.
//
// Session state lives client-side (sessionStorage) — there is no server-side
// session store. The client sends the full GuidedWorkflowState with every
// request and receives the updated state back. This route is a pure transform
// with no in-memory state across requests.
//
// THE non-negotiable rule is enforced in state-machine.ts's advanceToNextStep(),
// not here — this route's only job on "advance" is to surface
// HoldBlocksAdvancementError as 409, never to bypass or re-implement the check.

import { readFileSync } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  initializeWorkflowState,
  submitStep,
  resolveHold,
  acknowledgeFlag,
  deferStep,
  advanceToNextStep,
  HoldBlocksAdvancementError,
  FlagAcknowledgmentBlockedByHoldError,
} from "../../../lib/guided/state-machine";
import type { WorkflowStepDefinition, StepSubmission } from "../../../lib/guided/flag-hold-evaluator";
import type { GuidedWorkflowState, WorkflowId, DeferralOption } from "../../../lib/session/session-state";

type GuidedAction = "advance" | "resolveHold" | "acknowledgeFlag" | "defer" | "initWorkflow";

type GuidedRequestBody = {
  action: GuidedAction;
  guidedWorkflowState: GuidedWorkflowState | null;
  workflowId?: WorkflowId;
  practitionerId?: string;
  stepInput?: Record<string, unknown>;
  holdId?: string;
  holdResolutionText?: string;
  flagId?: string;
  deferralReason?: DeferralOption;
};

// WorkflowId literal values do not match their data file names 1:1
// (e.g. "content_commissioning_12step" → commissioning_12step.json) — an
// explicit map avoids silently guessing a filename from the id string.
const WORKFLOW_FILENAMES: Record<WorkflowId, string> = {
  onboarding_18step: "onboarding_18step.json",
  content_commissioning_12step: "commissioning_12step.json",
  signal_monitoring_10step: "monitoring_10step.json",
};

const WORKFLOWS_DIR = path.join(process.cwd(), "data", "workflows");

type LoadStepsResult = { ok: true; steps: WorkflowStepDefinition[] } | { ok: false };

function loadWorkflowSteps(workflowId: WorkflowId): LoadStepsResult {
  const filename = WORKFLOW_FILENAMES[workflowId];
  if (!filename) return { ok: false };

  const filePath = path.join(WORKFLOWS_DIR, filename);
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return { ok: true, steps: parsed.steps as WorkflowStepDefinition[] };
  } catch {
    return { ok: false };
  }
}

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: GuidedRequestBody;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const action = body.action;
  if (!action || !["advance", "resolveHold", "acknowledgeFlag", "defer", "initWorkflow"].includes(action)) {
    return errorResponse(
      `Unknown or missing action. Must be one of: advance, resolveHold, acknowledgeFlag, defer, initWorkflow. Received: ${String(action)}`,
      400,
    );
  }

  // --- initWorkflow: the only action that does not require an existing state ---
  if (action === "initWorkflow") {
    if (!body.workflowId) {
      return errorResponse("initWorkflow requires 'workflowId'.", 400);
    }
    const loadResult = loadWorkflowSteps(body.workflowId);
    if (!loadResult.ok) {
      return errorResponse(`Workflow definition not found for workflowId "${body.workflowId}".`, 404);
    }

    const practitionerId = body.practitionerId ?? "practitioner";
    const newState = initializeWorkflowState(body.workflowId, practitionerId);
    return NextResponse.json({
      guidedWorkflowState: newState,
      workflowSteps: loadResult.steps,
      firedHolds: [],
      firedFlags: [],
    });
  }

  // --- All other actions require an existing GuidedWorkflowState ---
  if (!body.guidedWorkflowState) {
    return errorResponse(`Action "${action}" requires 'guidedWorkflowState'.`, 400);
  }

  const state = body.guidedWorkflowState;
  const loadResult = loadWorkflowSteps(state.workflowId);
  if (!loadResult.ok) {
    return errorResponse(`Workflow definition not found for workflowId "${state.workflowId}".`, 404);
  }
  const steps = loadResult.steps;
  const totalSteps = steps.length;

  const currentStepDefinition = steps.find((s) => s.step_id === state.currentStep);
  if (!currentStepDefinition) {
    return errorResponse(`No step definition found for current step ${state.currentStep}.`, 404);
  }

  try {
    switch (action) {
      case "advance": {
        // evaluateStep() (via submitStep()) against stepInput, then the gated
        // advanceToNextStep(). stepInput field names must match StepSubmission.
        const submission = (body.stepInput ?? {}) as StepSubmission;
        const submittedState = submitStep(state, steps, submission);
        const advancedState = advanceToNextStep(submittedState, totalSteps);
        return NextResponse.json({
          guidedWorkflowState: advancedState,
          firedHolds: submittedState.activeHolds,
          firedFlags: submittedState.activeFlags,
        });
      }

      case "resolveHold": {
        if (!body.holdId) {
          return errorResponse("resolveHold requires 'holdId'.", 400);
        }
        if (!body.holdResolutionText || body.holdResolutionText.trim().length === 0) {
          return errorResponse("resolveHold requires non-empty 'holdResolutionText'.", 400);
        }
        const updatedState = resolveHold(state, body.holdId, body.holdResolutionText);
        return NextResponse.json({ guidedWorkflowState: updatedState });
      }

      case "acknowledgeFlag": {
        if (!body.flagId) {
          return errorResponse("acknowledgeFlag requires 'flagId'.", 400);
        }
        const updatedState = acknowledgeFlag(state, body.flagId);
        return NextResponse.json({ guidedWorkflowState: updatedState });
      }

      case "defer": {
        if (!body.deferralReason) {
          return errorResponse("defer requires 'deferralReason'.", 400);
        }
        const updatedState = deferStep(state, currentStepDefinition, body.deferralReason, currentStepDefinition.deferral_consequence);
        return NextResponse.json({ guidedWorkflowState: updatedState });
      }
    }
  } catch (error) {
    if (error instanceof HoldBlocksAdvancementError) {
      return NextResponse.json(
        {
          error: error.message,
          activeHolds: error.activeHolds,
        },
        { status: 409 },
      );
    }
    if (error instanceof FlagAcknowledgmentBlockedByHoldError) {
      return NextResponse.json(
        {
          error: error.message,
          activeHolds: error.activeHolds,
        },
        { status: 409 },
      );
    }
    // All other thrown errors from the state machine (missing hold/flag code,
    // empty resolution text, deferral not permitted on this step, etc.) are
    // caller input problems — 400, not 500.
    const message = error instanceof Error ? error.message : String(error);
    return errorResponse(message, 400);
  }

  // Unreachable — every case in the switch above returns. Kept for type safety.
  return errorResponse("Unhandled action.", 400);
}
