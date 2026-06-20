// Audit log read/write from session state
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Audit Log Schema"
//
// This route is a thin wrapper. Assembly logic lives entirely in
// lib/guided/audit-logger.ts. Session state lives client-side (sessionStorage) —
// there is no server-side session store — so the caller supplies the
// GuidedWorkflowState, the workflow's step definitions, and the client domain
// in the request body on every call. This route is a pure transform with no
// in-memory state across requests.

import { NextRequest, NextResponse } from "next/server";
import { buildAuditLog } from "../../../lib/guided/audit-logger";
import type { GuidedWorkflowState } from "../../../lib/session/session-state";
import type { WorkflowStepDefinition } from "../../../lib/guided/flag-hold-evaluator";

export type AuditRequestBody = {
  guidedWorkflowState: GuidedWorkflowState;
  workflowSteps: WorkflowStepDefinition[];
  talDomain: string;
  sessionId?: string;
  sessionEndTimestamp?: string | null;
};

function isValidAuditRequestBody(body: unknown): body is AuditRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.guidedWorkflowState === "object" &&
    b.guidedWorkflowState !== null &&
    Array.isArray(b.workflowSteps) &&
    typeof b.talDomain === "string" &&
    b.talDomain.trim().length > 0
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isValidAuditRequestBody(body)) {
    return NextResponse.json(
      {
        error:
          "Request body must include guidedWorkflowState (object), workflowSteps (array), and talDomain (non-empty string).",
      },
      { status: 400 },
    );
  }

  const sessionId = body.sessionId ?? crypto.randomUUID();

  const auditLog = buildAuditLog(body.guidedWorkflowState, body.workflowSteps, {
    sessionId,
    clientDomain: body.talDomain,
    sessionEndTimestamp: body.sessionEndTimestamp ?? null,
  });

  return NextResponse.json(auditLog);
}
