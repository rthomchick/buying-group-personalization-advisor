export type AuditStepStatus = "complete" | "deferred" | "hold_resolved" | "flagged_acknowledged";

export type AuditStepRecord = {
  step_id: number;
  step_title: string;
  corpus_authority: string;
  status: AuditStepStatus;
  flag_codes: string[];
  hold_codes: string[];
  hold_resolution: string | null;
  deferral_consequence: string | null;
  timestamp: string; // ISO-8601
};

export type ConfigurationGapRecord = {
  gap_id: string;
  trigger: string;
  attribute: string;
  consequence: string;
  status: "persistent_unresolved" | "resolved";
  timestamp: string; // ISO-8601
};

export type AuditLog = {
  session_id: string;
  data_model_version: "0.2.0";
  session_start_timestamp: string; // ISO-8601
  session_end_timestamp: string | null; // ISO-8601; null when exported mid-session
  practitioner_id: string;
  client_domain: string; // tal_domain value
  steps_completed: AuditStepRecord[];
  configuration_gap_records: ConfigurationGapRecord[];
  deferral_count: number;
  holds_resolved_count: number;
  flags_acknowledged_count: number;
};
