// Proxy to scoring engine sidecar POST /classify
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md
// "Build 1 Python scoring engine: ... Next.js API route ... proxies to it"
// "/api/classify — Python scoring engine call"
//
// This route is a thin proxy. All scoring logic (the seven-step classification
// sequence) lives in services/scoring-engine/classifier.py — it is NOT
// re-implemented here. SCORING_ENGINE_URL is read from the environment on
// every request, never hardcoded.

import { NextRequest, NextResponse } from "next/server";

// Mirrors services/scoring-engine/models.py exactly.
type SignalObservation = {
  signal_name: string;
  timestamp: string; // ISO-8601
  solution_category: string;
};

type CAAttributes = {
  tal_domain: string;
  tal_member: boolean;
  tal_program_status: string;
  tal_marquee: boolean;
  tal_account_type_source: string;
  tal_region: string;
  tal_upsell_override_active: boolean;
  tal_channel: string;
  holdback_group?: boolean;
};

type ClassifyRequestBody = {
  contact_id: string;
  signal_observations: SignalObservation[];
  ca_attributes: CAAttributes;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const scoringEngineUrl = process.env.SCORING_ENGINE_URL;
  if (!scoringEngineUrl) {
    return NextResponse.json(
      { error: "SCORING_ENGINE_URL is not set. Cannot reach the scoring engine sidecar." },
      { status: 503 },
    );
  }

  let body: ClassifyRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  let sidecarResponse: Response;
  try {
    sidecarResponse = await fetch(`${scoringEngineUrl}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    // Network-level failure (connection refused, DNS failure, timeout) — the
    // sidecar process is not reachable at all. Distinct from a sidecar that
    // responded with an error status, which is passed through below.
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: `Scoring engine sidecar unreachable at ${scoringEngineUrl}. Is it running? (uvicorn main:app --reload)`,
        detail: message,
      },
      { status: 503 },
    );
  }

  // The sidecar responded — pass its status and body through unmodified,
  // whether success or a validation/application error. Do not swallow a
  // real sidecar error response into a generic 503.
  const responseBody = await sidecarResponse.text();
  return new NextResponse(responseBody, {
    status: sidecarResponse.status,
    headers: { "Content-Type": "application/json" },
  });
}
