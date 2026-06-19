export type VisitorState = {
  // Classification plane
  role_classification: "champion" | "economic_buyer" | "influencer" | "user" | "ratifier" | "default";
  confidence_tier: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  differential_insufficient: boolean;

  // Buying job plane
  buying_job_confidence: "KNOWN" | "INFERRED" | "UNKNOWN";
  buying_job_confirmed: string | null; // JTBD code if KNOWN, null otherwise

  // Account/segmentation plane
  solution_category: "it_operations" | "customer_engagement" | "employee_experience" | "risk_compliance" | "ai_platform";
  buying_stage: "targeted" | "engaged" | "prioritized" | "qualified";
  tal_member: boolean;
  solution_category_coverage_status: "pending" | "constructed" | "partial" | "complete";

  // Edge state flags
  holdback_group: boolean;
  visitor_consent_state: "full" | "functional_only" | "declined" | null;
  upsell_override_active: boolean;
};

// Contact A — MEDIUM confidence Champion, honest Tier 3 ceiling, normal Level 2 operating state
// Source: kalder_layer2_decisions_log_L2E_builds.md § Synthetic Data Set
export const DEFAULT_VISITOR_STATE: VisitorState = {
  role_classification: "champion",
  confidence_tier: "MEDIUM",
  differential_insufficient: false,
  buying_job_confidence: "UNKNOWN",
  buying_job_confirmed: null,
  solution_category: "it_operations",
  buying_stage: "targeted",
  tal_member: true,
  solution_category_coverage_status: "partial",
  holdback_group: false,
  visitor_consent_state: "full",
  upsell_override_active: false,
};
