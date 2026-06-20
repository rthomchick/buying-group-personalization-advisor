// JSON file download — kalder_audit_{tal_domain}_{timestamp}.json
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Audit Log Schema"
// "Export endpoint: GET /api/audit/export → triggers browser download of
//  kalder_audit_{tal_domain}_{session_timestamp}.json"
//
// Implemented as POST, not GET — the audit log must be assembled from the
// caller-supplied GuidedWorkflowState (session state lives client-side; there
// is no server-side session store this route could read via GET with no body).
// Exportable at any step, not only at completion — session_end_timestamp may
// be null when the export happens mid-session.

import { NextRequest, NextResponse } from "next/server";
import { buildAuditLog } from "../../../../lib/guided/audit-logger";
import type { AuditRequestBody } from "../route";

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

// Filenames cannot contain ":" — sanitize the ISO-8601 timestamp for filesystem
// and HTTP header safety while keeping it sortable and human-readable.
function sanitizeTimestampForFilename(isoTimestamp: string): string {
  return isoTimestamp.replace(/[:.]/g, "-");
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
  // session_end_timestamp may be null for a mid-session export — the filename
  // still needs a concrete timestamp, so fall back to the export time itself.
  const sessionEndTimestamp = body.sessionEndTimestamp ?? null;
  const filenameTimestamp = sessionEndTimestamp ?? new Date().toISOString();

  const auditLog = buildAuditLog(body.guidedWorkflowState, body.workflowSteps, {
    sessionId,
    clientDomain: body.talDomain,
    sessionEndTimestamp,
  });

  const filename = `kalder_audit_${body.talDomain}_${sanitizeTimestampForFilename(filenameTimestamp)}.json`;

  return new NextResponse(JSON.stringify(auditLog, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
