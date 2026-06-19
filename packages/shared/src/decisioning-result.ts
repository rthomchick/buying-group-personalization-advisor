export type TraceStep = {
  step: string;        // step identifier, e.g. "consent_gate", "p0_differential_check"
  result: string;      // human-readable outcome
  corpus_authority: string; // e.g. "Document 5 §1.2"
  value?: string | boolean | number; // input value that determined the outcome
};

export type ThreeAxisResult = {
  active: boolean;
  mode: "KNOWN" | "INFERRED" | "TWO_AXIS_PLUS_PRIOR" | null;
  jtbd_code: string | null;
};

// Computed by the decisioning engine — NOT accepted as visitor input
export type DecisioningResult = {
  fallback_level: 1 | 2 | 3 | 4 | 5;
  pending_solution_fallback: boolean;
  three_axis_active: boolean;
  three_axis_result: ThreeAxisResult;
  differential_override: boolean;
  consent_suppressed: boolean;
  routing_path: string;
  trace: TraceStep[];
};
