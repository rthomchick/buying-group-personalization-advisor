// AppSessionState — React context and sessionStorage persistence
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Session State Shape"
// and knowledge/specs/kalder_layer2_decisions_log_L2E_builds.md, "Session State (locked)".
//
// Locked decisions held here:
// - Client-side state only: sessionStorage, NEVER localStorage — session state is
//   intentionally ephemeral (decisions log: "Session State (locked)").
// - Mode switches freeze and restore state without loss; Advisory conversation
//   history is preserved across mode switches.
// - dataModelVersion is stamped "0.2.0" on every session and is non-optional.
// - POC is single-user, single-session (S-08 — multi-tenant is a production
//   infrastructure requirement, not in scope here).

export const DATA_MODEL_VERSION = "0.2.0" as const;

export type WorkflowId = "onboarding_18step" | "content_commissioning_12step" | "signal_monitoring_10step";

export type StepStatus = "not_started" | "in_progress" | "complete" | "deferred" | "hold_active" | "flag_pending";

// HOLD = integrity interrupt. Non-bypassable. Resolution must be explicitly
// confirmed by the practitioner — silent advancement is prohibited.
export type HoldRecord = {
  holdCode: string; // e.g. "H-02"
  stepId: number;
  description: string;
  resolutionInstruction: string;
  corpusAuthority: string;
  resolved: boolean;
  resolution: string | null; // practitioner-entered resolution text; null until resolved
  resolvedAtTimestamp: string | null; // ISO-8601
};

// FLAG = advisory interrupt. Advanceable after practitioner acknowledgment.
// Available only after all HOLDs on the current step are resolved.
export type FlagRecord = {
  flagCode: string; // e.g. "F-04"
  stepId: number;
  description: string;
  corpusAuthority: string;
  consequence: string; // named scope-reduction consequence
  acknowledged: boolean;
  acknowledgedAtTimestamp: string | null; // ISO-8601
};

export type DeferralOption = "not_yet_available" | "consciously_proceeding_without" | "cancel_deferral";

export type DeferralRecord = {
  stepId: number;
  option: DeferralOption;
  consequence: string; // named scope-reduction consequence shown before confirmation
  confirmedAtTimestamp: string; // ISO-8601
};

export type ConfigurationGapRecord = {
  gapId: string;
  trigger: string; // e.g. "F-04"
  attribute: string;
  consequence: string;
  status: "persistent_unresolved" | "resolved";
  timestamp: string; // ISO-8601
};

export type GuidedWorkflowState = {
  workflowId: WorkflowId;
  currentStep: number;
  completedSteps: number[];
  stepStatuses: Record<number, StepStatus>;
  activeHolds: HoldRecord[];
  activeFlags: FlagRecord[];
  // Append-only history. resolveHold()/acknowledgeFlag() in state-machine.ts
  // push into these before removing the record from activeHolds/activeFlags.
  // Never cleared — this is the compliance record required by the audit log
  // ("every FLAG acknowledgment timestamped, every HOLD resolution captured").
  // activeHolds/activeFlags alone do NOT preserve history across step
  // advancement: resolveHold() filters resolved holds out of activeHolds, and
  // advanceToNextStep() resets activeFlags to [] on every advance.
  resolvedHolds: HoldRecord[];
  acknowledgedFlags: FlagRecord[];
  deferralLog: DeferralRecord[];
  configurationGapRecords: ConfigurationGapRecord[];
  dataModelVersion: typeof DATA_MODEL_VERSION;
  sessionStartTimestamp: string; // ISO-8601
  practitionerId: string;
};

export type MessageRole = "practitioner" | "advisor";

export type Message = {
  role: MessageRole;
  content: string;
  timestamp: string; // ISO-8601
};

export type ProblemType = "PT-1" | "PT-2" | "PT-5";
export type DiagnosticConfidence = "HIGH" | "MEDIUM" | "LOW";

export type AdvisoryContext = {
  activeProblemType: ProblemType | null;
  conversationHistory: Message[];
  diagnosticConfidence: DiagnosticConfidence | null;
};

export type QueryRecord = {
  query: string;
  normalizedQuery: string;
  timestamp: string; // ISO-8601
};

export type ActiveMode = "reference" | "advisory" | "guided";

export type AppSessionState = {
  activeMode: ActiveMode;
  dataModelVersion: typeof DATA_MODEL_VERSION;
  guidedWorkflow: GuidedWorkflowState | null;
  advisoryContext: AdvisoryContext;
  referenceHistory: QueryRecord[];
  practitionerId: string;
};

const SESSION_STORAGE_KEY = "kalder_app_session_state";

export function createInitialSessionState(practitionerId: string): AppSessionState {
  return {
    activeMode: "reference",
    dataModelVersion: DATA_MODEL_VERSION,
    guidedWorkflow: null,
    advisoryContext: {
      activeProblemType: null,
      conversationHistory: [],
      diagnosticConfidence: null,
    },
    referenceHistory: [],
    practitionerId,
  };
}

function isBrowserSessionStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

/**
 * Persists session state to sessionStorage. Never falls back to localStorage —
 * session state is intentionally ephemeral (locked decision). If sessionStorage
 * is unavailable (e.g. server-side rendering context), this is a no-op; callers
 * running on the client are responsible for ensuring persistence actually occurs.
 */
export function saveSessionState(state: AppSessionState): void {
  if (!isBrowserSessionStorageAvailable()) return;
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
}

/**
 * Loads session state from sessionStorage. Returns null if no state has been
 * saved yet or sessionStorage is unavailable — callers must create a fresh
 * session via createInitialSessionState() in that case.
 */
export function loadSessionState(): AppSessionState | null {
  if (!isBrowserSessionStorageAvailable()) return null;
  const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  const parsed = JSON.parse(raw) as AppSessionState;

  if (parsed.dataModelVersion !== DATA_MODEL_VERSION) {
    throw new Error(
      `Session state data model version mismatch: stored "${parsed.dataModelVersion}", ` +
        `expected "${DATA_MODEL_VERSION}". H-06 HOLD condition — do not silently migrate.`,
    );
  }

  return parsed;
}

export function clearSessionState(): void {
  if (!isBrowserSessionStorageAvailable()) return;
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Switches activeMode while preserving all other session state. Mode switches
 * must freeze and restore state without loss — this is a locked decision, not
 * a convenience default.
 */
export function switchMode(state: AppSessionState, mode: ActiveMode): AppSessionState {
  return { ...state, activeMode: mode };
}
