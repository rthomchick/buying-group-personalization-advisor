// Context assembly → Claude API call → six-section output parser
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Advisory Mode: System Prompt Construction"
//
// This route is a thin wrapper. Prompt assembly (three dynamic layers, retrieved
// from Store 1/Store 2 at query time) lives entirely in lib/advisory/prompt-builder.ts.
// Output parsing lives in lib/advisory/output-parser.ts. This route's only job is to
// call buildAdvisoryPrompt(), call the Claude API with the result, and call
// parseAdvisoryOutput() on the response — it does not assemble prompts or parse
// sections itself.
//
// Alfonso's non-negotiable: the system prompt is rebuilt from corpus retrieval on
// every request. There is no cached or static prompt anywhere in this route.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildAdvisoryPrompt, type ProblemType, type UserContext } from "../../../lib/advisory/prompt-builder";
import { parseAdvisoryOutput } from "../../../lib/advisory/output-parser";

const CLAUDE_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4096;

type AdvisoryRequestBody = {
  problemType: ProblemType;
  userContext: UserContext;
};

function isValidProblemType(value: unknown): value is ProblemType {
  return value === "PT-1" || value === "PT-2" || value === "PT-5";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set. Cannot reach the Claude API." }, { status: 503 });
  }

  let body: AdvisoryRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isValidProblemType(body.problemType)) {
    return NextResponse.json(
      { error: `problemType must be one of PT-1, PT-2, PT-5. Received: ${String(body.problemType)}` },
      { status: 400 },
    );
  }

  if (!body.userContext || typeof body.userContext !== "object") {
    return NextResponse.json({ error: "Request body must include a 'userContext' object." }, { status: 400 });
  }

  // Layer 1 + Layer 2 (retrieved from Store 1/Store 2 at query time) + Layer 3 —
  // rebuilt fresh on every request. Never cached, never static.
  const { prompt, retrievedSections } = await buildAdvisoryPrompt(body.problemType, body.userContext);

  const anthropic = new Anthropic({ apiKey });

  let message;
  try {
    message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: prompt,
      messages: [
        {
          role: "user",
          content: `Diagnose this ${body.problemType} query using the corpus sections and practitioner context provided in your system prompt. Produce the six required sections in the exact bracketed-header format specified.`,
        },
      ],
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Claude API request failed.", detail }, { status: 502 });
  }

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "Claude API response contained no text content block." }, { status: 502 });
  }

  const parsed = parseAdvisoryOutput(textBlock.text, prompt);

  return NextResponse.json({
    problemType: body.problemType,
    dataModelVersion: "0.2.0",
    parsed,
    retrievedSections,
  });
}
