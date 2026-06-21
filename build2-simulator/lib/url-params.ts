// Build 1 -> Build 2 URL parameter schema — parse and encode VisitorState
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md,
// "URL Parameter Schema (Build 1 → Build 2 interface)":
//   ?contact_label=Contact+B&role=champion&tier=LOW&diff_insufficient=true
//   &bj_confidence=UNKNOWN&bj_confirmed=&solution=it_operations&stage=targeted
//   &tal=true&coverage=partial&holdback=false&consent=full&upsell=false
//
// "Parse on load, validate all enum values, run decisioning engine, render."
// Invalid enum values are caught and reported — never silently coerced to a
// default. parseUrlParams() returns null on any missing-or-invalid required
// parameter rather than a partially-populated VisitorState; a partial state
// would let the decisioning engine run against a visitor that doesn't
// actually correspond to what Build 1 sent.
//
// contact_label is informational display metadata (the synthetic contact's
// label, e.g. "Contact B") — it is not a VisitorState field and is not
// parsed or encoded here.

import type { VisitorState } from "@kalder/shared";

const ROLE_VALUES = ["champion", "economic_buyer", "influencer", "user", "ratifier", "default"] as const;
const TIER_VALUES = ["HIGH", "MEDIUM", "LOW", "UNKNOWN"] as const;
const BJ_CONFIDENCE_VALUES = ["KNOWN", "INFERRED", "UNKNOWN"] as const;
const SOLUTION_VALUES = ["it_operations", "customer_engagement", "employee_experience", "risk_compliance", "ai_platform"] as const;
const STAGE_VALUES = ["targeted", "engaged", "prioritized", "qualified"] as const;
const COVERAGE_VALUES = ["pending", "constructed", "partial", "complete"] as const;
const CONSENT_VALUES = ["full", "functional_only", "declined"] as const;

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

function parseBoolean(value: string): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export type UrlParamValidationError = {
  param: string;
  reason: "missing" | "invalid_enum" | "invalid_boolean";
  value?: string;
};

export type ParseUrlParamsResult = { state: VisitorState; errors: null } | { state: null; errors: UrlParamValidationError[] };

/**
 * Parses and validates the full Build 1 -> Build 2 URL parameter schema into
 * a VisitorState. Returns errors (never a partial state) when any required
 * parameter is missing or fails enum/boolean validation.
 */
export function parseUrlParamsDetailed(searchParams: URLSearchParams): ParseUrlParamsResult {
  const errors: UrlParamValidationError[] = [];

  function requireEnum<T extends string>(param: string, allowed: readonly T[]): T | undefined {
    const raw = searchParams.get(param);
    if (raw === null) {
      errors.push({ param, reason: "missing" });
      return undefined;
    }
    if (!isOneOf(raw, allowed)) {
      errors.push({ param, reason: "invalid_enum", value: raw });
      return undefined;
    }
    return raw;
  }

  function requireBoolean(param: string): boolean | undefined {
    const raw = searchParams.get(param);
    if (raw === null) {
      errors.push({ param, reason: "missing" });
      return undefined;
    }
    const parsed = parseBoolean(raw);
    if (parsed === null) {
      errors.push({ param, reason: "invalid_boolean", value: raw });
      return undefined;
    }
    return parsed;
  }

  const role_classification = requireEnum("role", ROLE_VALUES);
  const confidence_tier = requireEnum("tier", TIER_VALUES);
  const differential_insufficient = requireBoolean("diff_insufficient");
  const buying_job_confidence = requireEnum("bj_confidence", BJ_CONFIDENCE_VALUES);
  const solution_category = requireEnum("solution", SOLUTION_VALUES);
  const buying_stage = requireEnum("stage", STAGE_VALUES);
  const tal_member = requireBoolean("tal");
  const solution_category_coverage_status = requireEnum("coverage", COVERAGE_VALUES);
  const holdback_group = requireBoolean("holdback");
  const upsell_override_active = requireBoolean("upsell");

  // bj_confirmed: optional. Absent or empty -> null (this is the documented
  // brief example: "&bj_confirmed=" with no value). Present and non-empty ->
  // that string, used as a JTBD code by callers; this module does not
  // validate it against §17 JTBD_CODES.
  const bjConfirmedRaw = searchParams.get("bj_confirmed");
  const buying_job_confirmed = bjConfirmedRaw === null || bjConfirmedRaw === "" ? null : bjConfirmedRaw;

  // consent: optional per VisitorState's "full" | "functional_only" |
  // "declined" | null union. Absent -> null (never permissive — matches the
  // decisioning engine's consent_gate treatment of null as not full/functional_only).
  // Present but invalid -> a real validation error, never silently null'd.
  const consentRaw = searchParams.get("consent");
  let visitor_consent_state: VisitorState["visitor_consent_state"] | undefined;
  if (consentRaw === null || consentRaw === "") {
    visitor_consent_state = null;
  } else if (isOneOf(consentRaw, CONSENT_VALUES)) {
    visitor_consent_state = consentRaw;
  } else {
    errors.push({ param: "consent", reason: "invalid_enum", value: consentRaw });
  }

  if (
    errors.length > 0 ||
    role_classification === undefined ||
    confidence_tier === undefined ||
    differential_insufficient === undefined ||
    buying_job_confidence === undefined ||
    solution_category === undefined ||
    buying_stage === undefined ||
    tal_member === undefined ||
    solution_category_coverage_status === undefined ||
    holdback_group === undefined ||
    upsell_override_active === undefined ||
    visitor_consent_state === undefined
  ) {
    return { state: null, errors };
  }

  return {
    state: {
      role_classification,
      confidence_tier,
      differential_insufficient,
      buying_job_confidence,
      buying_job_confirmed,
      solution_category,
      buying_stage,
      tal_member,
      solution_category_coverage_status,
      holdback_group,
      visitor_consent_state,
      upsell_override_active,
    },
    errors: null,
  };
}

/**
 * Parses the Build 1 -> Build 2 URL parameter schema into a VisitorState.
 * Returns null on any missing or invalid parameter — never a partial state.
 * Callers that need to report which specific parameter failed should use
 * parseUrlParamsDetailed() instead.
 */
export function parseUrlParams(searchParams: URLSearchParams): VisitorState | null {
  return parseUrlParamsDetailed(searchParams).state;
}

/**
 * Encodes a VisitorState as a URL query string per the Build 1 -> Build 2
 * schema, for Build 1's "Send to Simulator" button. null values
 * (buying_job_confirmed, visitor_consent_state) are encoded as empty params
 * per the brief's own documented example ("&bj_confirmed=").
 */
export function encodeUrlParams(state: VisitorState): string {
  const params = new URLSearchParams();
  params.set("role", state.role_classification);
  params.set("tier", state.confidence_tier);
  params.set("diff_insufficient", String(state.differential_insufficient));
  params.set("bj_confidence", state.buying_job_confidence);
  params.set("bj_confirmed", state.buying_job_confirmed ?? "");
  params.set("solution", state.solution_category);
  params.set("stage", state.buying_stage);
  params.set("tal", String(state.tal_member));
  params.set("coverage", state.solution_category_coverage_status);
  params.set("holdback", String(state.holdback_group));
  params.set("consent", state.visitor_consent_state ?? "");
  params.set("upsell", String(state.upsell_override_active));
  return params.toString();
}
