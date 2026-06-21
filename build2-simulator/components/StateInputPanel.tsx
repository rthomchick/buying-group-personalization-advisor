// Manual visitor state controls — dropdowns and toggles, real-time re-render
// Includes: Load Contact A / B / C buttons
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Manual
// State Input Panel" — dropdowns for all visitor state variables, real-time
// re-render on any change (no submit button), three pre-loaded contact
// buttons.

"use client";

import contactA from "@/data/contacts/contact_a.json";
import contactB from "@/data/contacts/contact_b.json";
import contactC from "@/data/contacts/contact_c.json";
import type { VisitorState } from "@kalder/shared";

export type StateInputPanelProps = {
  state: VisitorState;
  onChange: (state: VisitorState) => void;
};

const ROLE_VALUES = ["champion", "economic_buyer", "influencer", "user", "ratifier", "default"] as const;
const TIER_VALUES = ["HIGH", "MEDIUM", "LOW", "UNKNOWN"] as const;
const BJ_CONFIDENCE_VALUES = ["KNOWN", "INFERRED", "UNKNOWN"] as const;
const SOLUTION_VALUES = ["it_operations", "customer_engagement", "employee_experience", "risk_compliance", "ai_platform"] as const;
const STAGE_VALUES = ["targeted", "engaged", "prioritized", "qualified"] as const;
const COVERAGE_VALUES = ["pending", "constructed", "partial", "complete"] as const;
const CONSENT_VALUES = ["full", "functional_only", "declined"] as const;
const BOOLEAN_VALUES = ["false", "true"] as const;

function selectClass(): string {
  return "rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function StateInputPanel({ state, onChange }: StateInputPanelProps) {
  function set<K extends keyof VisitorState>(key: K, value: VisitorState[K]) {
    onChange({ ...state, [key]: value });
  }

  return (
    <div className="flex flex-col gap-4 border-r border-border bg-surface p-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground">Visitor State</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange(contactA.visitor_state as VisitorState)}
            className="rounded-md border border-kalder-accent/40 bg-kalder-accent/10 px-2 py-1 text-xs text-kalder-accent hover:bg-kalder-accent/20"
          >
            Load Contact A
          </button>
          <button
            type="button"
            onClick={() => onChange(contactB.visitor_state as VisitorState)}
            className="rounded-md border border-kalder-accent/40 bg-kalder-accent/10 px-2 py-1 text-xs text-kalder-accent hover:bg-kalder-accent/20"
          >
            Load Contact B
          </button>
          <button
            type="button"
            onClick={() => onChange(contactC.visitor_state as VisitorState)}
            className="rounded-md border border-kalder-accent/40 bg-kalder-accent/10 px-2 py-1 text-xs text-kalder-accent hover:bg-kalder-accent/20"
          >
            Load Contact C
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="role">
          <select className={selectClass()} value={state.role_classification} onChange={(e) => set("role_classification", e.target.value as VisitorState["role_classification"])}>
            {ROLE_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="tier">
          <select className={selectClass()} value={state.confidence_tier} onChange={(e) => set("confidence_tier", e.target.value as VisitorState["confidence_tier"])}>
            {TIER_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="differential_insufficient">
          <select
            className={selectClass()}
            value={String(state.differential_insufficient)}
            onChange={(e) => set("differential_insufficient", e.target.value === "true")}
          >
            {BOOLEAN_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="bj_confidence">
          <select
            className={selectClass()}
            value={state.buying_job_confidence}
            onChange={(e) => set("buying_job_confidence", e.target.value as VisitorState["buying_job_confidence"])}
          >
            {BJ_CONFIDENCE_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="bj_confirmed">
          <input
            className={selectClass()}
            type="text"
            value={state.buying_job_confirmed ?? ""}
            placeholder="JTBD code or empty"
            onChange={(e) => set("buying_job_confirmed", e.target.value === "" ? null : e.target.value)}
          />
        </Field>

        <Field label="solution">
          <select className={selectClass()} value={state.solution_category} onChange={(e) => set("solution_category", e.target.value as VisitorState["solution_category"])}>
            {SOLUTION_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="buying_stage">
          <select className={selectClass()} value={state.buying_stage} onChange={(e) => set("buying_stage", e.target.value as VisitorState["buying_stage"])}>
            {STAGE_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="tal_member">
          <select className={selectClass()} value={String(state.tal_member)} onChange={(e) => set("tal_member", e.target.value === "true")}>
            {BOOLEAN_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="coverage">
          <select
            className={selectClass()}
            value={state.solution_category_coverage_status}
            onChange={(e) => set("solution_category_coverage_status", e.target.value as VisitorState["solution_category_coverage_status"])}
          >
            {COVERAGE_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="holdback">
          <select className={selectClass()} value={String(state.holdback_group)} onChange={(e) => set("holdback_group", e.target.value === "true")}>
            {BOOLEAN_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="consent">
          <select
            className={selectClass()}
            value={state.visitor_consent_state ?? ""}
            onChange={(e) => set("visitor_consent_state", e.target.value === "" ? null : (e.target.value as VisitorState["visitor_consent_state"]))}
          >
            <option value="">null</option>
            {CONSENT_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="upsell">
          <select className={selectClass()} value={String(state.upsell_override_active)} onChange={(e) => set("upsell_override_active", e.target.value === "true")}>
            {BOOLEAN_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}
