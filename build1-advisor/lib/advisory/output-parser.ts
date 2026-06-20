// Parse Claude API response into six named sections
//
// Source of truth:
// - knowledge/specs/kalder_layer2_developer_brief.md, "Advisory Mode Output Rendering"
// - knowledge/specs/kalder_layer2_decisions_log_L2E_builds.md, "Advisory Mode (locked)"
//
// Six sections, in order: PROBLEM_RESTATEMENT, CORPUS_SECTION_TRAVERSAL,
// NAMED_STATE_CHECK, DIAGNOSIS, RECOMMENDED_ACTIONS, DIAGNOSTIC_CONFIDENCE.
// NAMED_STATE_CHECK is non-collapsible by default — its permanent visibility
// enforces the L2-C requirement that named program states are never silently
// skipped. The bracketed-header delimiter format ([PROBLEM_RESTATEMENT], etc.)
// is specified in prompt-builder.ts's Layer 1 instruction — this parser expects
// exactly that format.

export const SECTION_ORDER = [
  "PROBLEM_RESTATEMENT",
  "CORPUS_SECTION_TRAVERSAL",
  "NAMED_STATE_CHECK",
  "DIAGNOSIS",
  "RECOMMENDED_ACTIONS",
  "DIAGNOSTIC_CONFIDENCE",
] as const;

export type SectionName = (typeof SECTION_ORDER)[number];

export type ParsedSection = {
  name: SectionName;
  text: string;
  present: boolean; // false if Claude's output omitted this section's header entirely
  collapsible: boolean; // false only for NAMED_STATE_CHECK
};

export type NamedStateValue = "True" | "False" | "Active" | "Not active" | "Not determinable";

export type ParsedAdvisoryOutput = {
  sections: Record<SectionName, ParsedSection>;
  allSectionsPresent: boolean;
  // Whether differential_insufficient / pending_solution_fallback were
  // explicitly named in NAMED_STATE_CHECK text, vs. silently absent.
  namedStateCheck: {
    differentialInsufficientMentioned: boolean;
    pendingSolutionFallbackMentioned: boolean;
  };
  // True when the assembled prompt (Layer 2) contained a [SUBSTITUTE — ...]
  // marker — i.e. a corpus section retrieval fell back to a different document
  // than the brief's citation named. Surfaced so the UI/caller can flag reduced
  // retrieval confidence on this specific diagnosis, never silently dropped.
  reducedConfidence: boolean;
  substitutionNotices: string[];
  rawText: string;
};

const HEADER_PATTERN = /^\[(PROBLEM_RESTATEMENT|CORPUS_SECTION_TRAVERSAL|NAMED_STATE_CHECK|DIAGNOSIS|RECOMMENDED_ACTIONS|DIAGNOSTIC_CONFIDENCE)\]\s*$/m;

function splitIntoSections(responseText: string): Record<SectionName, string | null> {
  const result: Record<SectionName, string | null> = {
    PROBLEM_RESTATEMENT: null,
    CORPUS_SECTION_TRAVERSAL: null,
    NAMED_STATE_CHECK: null,
    DIAGNOSIS: null,
    RECOMMENDED_ACTIONS: null,
    DIAGNOSTIC_CONFIDENCE: null,
  };

  const globalPattern = new RegExp(HEADER_PATTERN.source, "gm");
  const matches: { name: SectionName; index: number; headerEnd: number }[] = [];

  let match: RegExpExecArray | null;
  while ((match = globalPattern.exec(responseText)) !== null) {
    matches.push({
      name: match[1] as SectionName,
      index: match.index,
      headerEnd: match.index + match[0].length,
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const sectionText = responseText.slice(current.headerEnd, next ? next.index : responseText.length).trim();
    result[current.name] = sectionText;
  }

  return result;
}

function detectNamedStateMentions(namedStateCheckText: string | null): {
  differentialInsufficientMentioned: boolean;
  pendingSolutionFallbackMentioned: boolean;
} {
  if (!namedStateCheckText) {
    return { differentialInsufficientMentioned: false, pendingSolutionFallbackMentioned: false };
  }
  return {
    differentialInsufficientMentioned: /differential_insufficient/i.test(namedStateCheckText),
    pendingSolutionFallbackMentioned: /pending_solution_fallback/i.test(namedStateCheckText),
  };
}

const SUBSTITUTE_NOTICE_PATTERN = /\[SUBSTITUTE — [^\]]+\]/g;

/**
 * Scans the assembled system prompt (Layer 2's text, not Claude's response)
 * for [SUBSTITUTE — ...] markers emitted by prompt-builder.ts when a corpus
 * retrieval fell back to a different document than the brief's citation named.
 * Returns every notice found — never silently drops a substitution signal.
 */
export function detectSubstitutionNotices(assembledPrompt: string): string[] {
  return assembledPrompt.match(SUBSTITUTE_NOTICE_PATTERN) ?? [];
}

/**
 * Parses a Claude API response into the six required named sections.
 * Sections missing from the response (Claude failed to emit the bracketed
 * header) are marked present: false with empty text — never silently
 * defaulted to a fabricated value. NAMED_STATE_CHECK is always marked
 * non-collapsible per the L2-C requirement.
 */
export function parseAdvisoryOutput(responseText: string, assembledPrompt: string): ParsedAdvisoryOutput {
  const rawSections = splitIntoSections(responseText);

  const sections = {} as Record<SectionName, ParsedSection>;
  for (const name of SECTION_ORDER) {
    const text = rawSections[name];
    sections[name] = {
      name,
      text: text ?? "",
      present: text !== null,
      collapsible: name !== "NAMED_STATE_CHECK",
    };
  }

  const allSectionsPresent = SECTION_ORDER.every((name) => sections[name].present);
  const namedStateCheck = detectNamedStateMentions(rawSections.NAMED_STATE_CHECK);
  const substitutionNotices = detectSubstitutionNotices(assembledPrompt);

  return {
    sections,
    allSectionsPresent,
    namedStateCheck,
    reducedConfidence: substitutionNotices.length > 0,
    substitutionNotices,
    rawText: responseText,
  };
}
