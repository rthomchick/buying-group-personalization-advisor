# Kalder AI Advisor — Developer Brief
## Build 1, Build 2, and Build 3 Implementation Reference

**Version:** 1.0  
**Data model:** `kalder_data_model_v0.2.0`  
**Corpus:** Kalder v1.0 (9 documents, council-approved)  
**Status:** Ready for implementation  

---

## What You're Building

Three distinct deliverables. They are related but independently deployable.

**Build 1 — Advisor Interface**  
A deployed web application implementing three interaction modes (Reference, Advisory, Guided Workflow) against the Kalder corpus. No martech stack prerequisites. This is the product.

**Build 2 — Website Experience Simulator**  
A front-end prototype that accepts a visitor classification state and renders the personalized web experience that visitor would receive, applying Document 5 decisioning rules without a live AEP/Target/Sanity stack. This is the Layer 3 demonstration vehicle.

**Build 3 — Stack Integration Specification**  
A structured markdown document (exported to PDF) specifying how an enterprise client with a full martech stack integrates the program into production. This is the enterprise sales artifact.

**Build 1 and Build 2 are deployed applications. Build 3 is a document.**

---

## Technology Decisions

| Build | Framework | Deployment | Key dependencies |
|---|---|---|---|
| Build 1 | Next.js | Vercel | Anthropic Claude API (claude-sonnet-4-6), Pinecone, OpenAI Embeddings |
| Build 2 | Next.js (React) | Vercel (separate subdomain) | No external API calls for core simulation |
| Build 3 | Markdown | PDF export | No deployment |

**Build 1 Python scoring engine:** Implemented as a Next.js API route or lightweight Python sidecar service. Uses `kalder_data_model.py` structures directly.

**Build 1 and Build 2 are separate deployed applications.** The only coupling between them is the visitor state URL parameter schema. They do not share code or a backend.

---

## POC Demo Scenario

All POC-specific content is scoped to:
- **Solution category:** `it_operations`
- **Role:** Champion
- **Cohort:** Acquisition

**Three synthetic contact records** (pre-built, loadable via buttons in both builds):

| Contact | `confidence_tier` | `differential_insufficient` | `holdback_group` | Key demo purpose |
|---|---|---|---|---|
| Contact A | MEDIUM | false | false | Normal operating state; Level 2 experience |
| Contact B | LOW (capped at 49) | **true** | false | Priority 0 override → Level 3; upgrade path demo |
| Contact C | MEDIUM | false | **true** | Holdback measurement control; `progressive_disclosure` suppressed |

**Account attributes (pre-populated for all three contacts):**
```
tal_domain: "synthco.com"
tal_member: true
tal_program_status: "active_prospect"
tal_marquee: false
tal_account_type_source: "enterprise"
tal_region: "north_america"
tal_upsell_override_active: false
tal_channel: "direct"
```

---

---

# BUILD 1: ADVISOR INTERFACE

---

## Application Structure

```
/app
  /page.tsx                    ← Mode shell and routing
  /reference/page.tsx          ← Reference Mode view
  /advisory/page.tsx           ← Advisory Mode view
  /guided/page.tsx             ← Guided Workflow view
/api
  /reference/route.ts          ← Pre-retrieval pipeline → Store 1/Store 2
  /advisory/route.ts           ← Context assembly → Claude API → output parser
  /guided/route.ts             ← Step validation → FLAG/HOLD evaluator
  /classify/route.ts           ← Python scoring engine call
  /audit/route.ts              ← Audit log read/write/export
  /audit/export/route.ts       ← JSON file download
/lib
  /retrieval/
    normalizer.ts              ← Query normalization
    disambiguation.ts          ← Six-term registry
    router.ts                  ← QT-1 through QT-6 routing
    vector.ts                  ← Pinecone client
    structured.ts              ← JSON table lookups
  /advisory/
    prompt-builder.ts          ← Dynamic system prompt assembly
    output-parser.ts           ← Six-section output parsing
  /guided/
    state-machine.ts           ← GuidedWorkflowState management
    flag-hold-evaluator.ts     ← FLAG/HOLD trigger logic
    audit-logger.ts            ← Session audit log
  /scoring/
    classify-visitor.py        ← Python scoring engine (or call to sidecar)
/data
  /corpus/                     ← Pinecone-indexed corpus chunks
  /structured/
    jtbd_codes.json            ← 131 records
    cross_role_weights.json    ← 19 records
    client_attribute_map.json  ← 36 records
    module_types.json          ← 11 records
    decay_multipliers.json     ← 4 records
    confidence_tiers.json
    fallback_cascade.json
    scoring_rules.json
    sales_activation_config.json
  /workflows/
    onboarding_18step.json     ← Step definitions for onboarding workflow
    commissioning_12step.json
    monitoring_10step.json
  /synthetic/
    contact_a.json
    contact_b.json
    contact_c.json
```

---

## Session State Shape

```typescript
type GuidedWorkflowState = {
  workflowId: "onboarding_18step" | "content_commissioning_12step" | "signal_monitoring_10step";
  currentStep: number;
  completedSteps: number[];
  stepStatuses: Record<number, "not_started" | "in_progress" | "complete" | 
                                  "deferred" | "hold_active" | "flag_pending">;
  activeHolds: HoldRecord[];
  activeFlags: FlagRecord[];
  deferralLog: DeferralRecord[];
  configurationGapRecords: ConfigurationGapRecord[];
  dataModelVersion: "0.2.0";
  sessionStartTimestamp: string;
  practitionerId: string;
}

type AppSessionState = {
  activeMode: "reference" | "advisory" | "guided";
  dataModelVersion: "0.2.0";
  guidedWorkflow: GuidedWorkflowState | null;
  advisoryContext: {
    activeProblemType: "PT-1" | "PT-2" | "PT-5" | null;
    conversationHistory: Message[];
    diagnosticConfidence: "HIGH" | "MEDIUM" | "LOW" | null;
  };
  referenceHistory: QueryRecord[];
  practitionerId: string;
}
```

Store in React context + `sessionStorage`. Not `localStorage`.

---

## Reference Mode: Pre-Retrieval Pipeline

Every query passes through four stages before hitting a retrieval store.

### Stage 1: Query Normalizer
Strip filler words, normalize capitalization, expand abbreviations:
- "§CA" → "CLIENT_ATTRIBUTE_MAP"
- "what's the min" → "minimum"
- "diff_insufficient" → "differential_insufficient"

### Stage 2: Disambiguation Registry

```typescript
const DISAMBIGUATION_REGISTRY: Record<string, string> = {
  "confidence": "Are you asking about Classification confidence (HIGH/MEDIUM/LOW/UNKNOWN — scoring pipeline output) or Diagnostic confidence (HIGH/MEDIUM/LOW — Advisor output reliability)?",
  "stage": "Are you asking about Buying Group Stages (§5 BG_STAGES: targeted/engaged/prioritized/qualified) or Buying Job stages (problem_identification → supplier_selection)?",
  "fallback": "Are you asking about the five-level Fallback Cascade (Level 1–5 experience routing) or fallback logic within a specific decisioning rule?",
  "priority": "Are you asking about Adobe Target activity priority (four-digit scheme) or user priority type (Priority 1–4 in the Advisor user model)?",
  "cohort": "Are you asking about Campaign Cohorts (§6: education/acquisition/progression_early_to_mature/progression_win_now) or the holdback group?",
  "role": "Are you asking about Buying Group Roles (champion/economic_buyer/influencer/user/ratifier) or data authority roles (Tier 1/Tier 2/Tier 3)?"
}
```

If normalized query contains a registered term, return disambiguation prompt. Halt retrieval until resolved.

### Stage 3: Context Resolution
If query contains a section key (`§CA`, `§12`, `§SA`, `§4`, etc.), route directly to Store 2 structured lookup. Bypass vector retrieval entirely.

### Stage 4: Query Type Routing

| QT | Store | Trigger |
|---|---|---|
| QT-1 | Store 2 | Specific record lookup (JTBD code, §CA attribute, CROSS_ROLE_WEIGHTS row) |
| QT-2 | Store 1 | Corpus section content ("what does Document 5 say about...") |
| QT-3 | Store 2 | Data model parameter ("minimum_cumulative_score value") |
| QT-4 | Store 1 + Store 2 | Cross-document reasoning |
| QT-5 | Store 1 | Operational procedure (Document 8 sections) |
| QT-6 | Store 1 + Store 2 | Edge case or exception lookup |

### Store 1: Vector Index

- Provider: Pinecone (serverless tier)
- Embedding model: `text-embedding-3-small`
- Namespace: `kalder-v0-2-0`
- Minimum cosine similarity threshold: **0.45** (calibrated against text-embedding-3-small on Kalder corpus)
- Below threshold: return low-confidence notice alongside results. Never silently return low-confidence results as authoritative.

Chunk metadata shape:
```json
{
  "document_id": "doc2",
  "section_key": "§5",
  "section_title": "Section 5: Scoring Pipeline",
  "subsection": "5.2 Seven-Step Sequence",
  "chunk_text": "...",
  "depends_on": ["§7", "§8", "§12"],
  "required_by": ["doc5_s1", "doc8_s6"]
}
```

### Reference Mode Output Format
```
[ANSWER]
{direct answer, 1–4 sentences, corpus-accurate}

[SOURCE]
{document title}, {section identifier} | Data Model {§section key} v0.2.0

[RELATED]
{0–2 cross-references}
```

**Never hallucinate. Never return below-threshold results without labeling them.**

---

## Advisory Mode: System Prompt Construction

The system prompt is **built at query time from three layers**. It is not a static file.

### Layer 1: Base Instruction (static)
```
You are the Kalder Buying Group Personalization AI Advisor operating in Advisory Mode.
You are reasoning against the Kalder corpus (v0.2.0) to diagnose a [PROBLEM_TYPE] query.

REQUIRED: Traverse all reasoning steps in sequence before producing a diagnosis.
REQUIRED: Detect and explicitly name the following program states if present:
  - differential_insufficient = True
  - pending_solution_fallback
Treating these as generic low-confidence or coverage-gap states is a disqualifying error.

Every claim must cite a corpus section or data model section key.

Output format (six named sections):
PROBLEM_RESTATEMENT | CORPUS_SECTION_TRAVERSAL | NAMED_STATE_CHECK | 
DIAGNOSIS | RECOMMENDED_ACTIONS | DIAGNOSTIC_CONFIDENCE

Data model version: 0.2.0
```

### Layer 2: Problem-Type Corpus Injection (dynamic — retrieved per query)

**PT-1 (Classification State Diagnosis) — retrieve and inject:**
- Document 2, Section 5 (seven-step scoring sequence)
- Document 2, Section 9 (three-tier data authority)
- `§12 SCORING_RULES` key parameters
- `§3 CONFIDENCE_TIERS` tier definitions
- `§4 FALLBACK_CASCADE` Level 1–5 trigger conditions
- Document 5, Section 1.2 (`differential_insufficient` Priority 0 override)
- Document 5, Section 3 (progressive disclosure activation)

**PT-2 (Cohort Performance Diagnosis) — retrieve and inject:**
- Document 3, Section 2 (cohort definitions and AEP audience gates)
- Document 7 (measurement framework; Norris addendum: TAL quality distribution report absence caps confidence at MEDIUM)
- Document 5, Section 1 (fallback cascade; `pending_solution_fallback` definition)
- `§6 CAMPAIGN_COHORTS`
- Document 8, Section 5 (signal monitoring)

**PT-5 (Sales Escalation Readiness) — retrieve and inject:**
- Document 3, Section 6.4 (two contact-level gates)
- Document 6, Section 7 (convergence point architecture; per-cohort alert activation)
- `§SA SALES_ACTIVATION_CONFIG` (alert payloads)
- Document 8, Section 6 (sales activation workflow)

### Layer 3: User Context (dynamic — from practitioner input)
Practitioner's elicited inputs appended as structured context before the Claude API call.

### Advisory Mode Output Rendering

Six sections rendered as **collapsible cards**. **NAMED STATE CHECK is non-collapsible by default.**

```
┌──────────────────────────────────────────────┐
│ DIAGNOSTIC CONFIDENCE: [HIGH/MEDIUM/LOW]     │
│ Data model: v0.2.0                           │
├──────────────────────────────────────────────┤
│ ▼ PROBLEM RESTATEMENT                        │
├──────────────────────────────────────────────┤
│ ▼ CORPUS SECTION TRAVERSAL                  │
│   Step R1-1: [check] → [result]              │
│   ...                                        │
│   Step R1-7: [signal-to-action step]         │
├──────────────────────────────────────────────┤
│ ■ NAMED STATE CHECK  [non-collapsible]       │
│   differential_insufficient: [True/False/    │
│     Not determinable]                        │
│   pending_solution_fallback: [Active/Not     │
│     active/Not determinable]                 │
├──────────────────────────────────────────────┤
│ ▼ DIAGNOSIS                                  │
├──────────────────────────────────────────────┤
│ ▼ RECOMMENDED ACTIONS                        │
│   1. {action} → {corpus authority}           │
├──────────────────────────────────────────────┤
│ ▼ DIAGNOSTIC CONFIDENCE                      │
│   [HIGH/MEDIUM/LOW] — {rationale}            │
└──────────────────────────────────────────────┘
```

---

## Guided Workflow Mode: Step Card Specification

### HOLD/FLAG Rules (non-negotiable)

- **HOLD** = integrity interrupt. "Next Step" control **disabled** (grayed, unclickable). Cannot be bypassed.
- **FLAG** = advisory interrupt. Step is advanceable after practitioner acknowledgment. Available only after all HOLDs on the current step are resolved.
- **Display order:** HOLD cards above FLAG cards, always.
- **HOLD resolution:** Must be explicitly confirmed by the Advisor. Silent advancement is prohibited.

### Step Card Layout

```
┌────────────────────────────────────────────────┐
│ Step {N} of {total} — {step_title}             │
│ Corpus authority: {authority_reference}         │
├────────────────────────────────────────────────┤
│ WHY THIS MATTERS                               │
│ {First-person operational statement from §CA   │
│  null_behavior. "If this attribute is          │
│  missing, X happens to your program."}         │
├────────────────────────────────────────────────┤
│ [HOLD CARDS — render if activeHolds.length > 0]│
│ ⛔ HOLD H-0x                                    │
│ {description} | Resolution: {instruction}      │
│ [Enter resolution] [Confirm Resolution]         │
├────────────────────────────────────────────────┤
│ [FLAG CARDS — render only if no active HOLDs]  │
│ ⚑ FLAG F-0x                                    │
│ {description} | Authority: {citation}          │
│ Consequence: {named scope reduction}            │
│ [Acknowledge]                                   │
├────────────────────────────────────────────────┤
│ INPUT ZONE                                     │
│ {input fields; mapping-table validation where  │
│  required}                                     │
├────────────────────────────────────────────────┤
│ [Ask Advisor]  [Defer this step ▾]  [Next →]   │
│ ← Previous          Running deferrals: {N}     │
└────────────────────────────────────────────────┘
```

**"Defer this step" is a dropdown, not a button.** Options: "Defer — not yet available" | "Defer — consciously proceeding without" | "Cancel deferral." Selecting a defer option shows the named scope-reduction consequence before confirming. Practitioner must read and confirm.

**"Ask Advisor" opens inline Advisory panel.** Half-screen right panel. Step card remains fully visible and interactive on the left. Guided Workflow state is fully preserved.

### Completion Screen

```
Onboarding Session Complete
{timestamp} | Data model: v0.2.0

SESSION SUMMARY
Steps completed:    {N}/18
Steps deferred:     {N}
HOLDs resolved:     {N}
FLAGs acknowledged: {N}
Config gaps:        {N} persistent

OPEN GAPS — PRIORITIZED BY PROGRAM IMPACT
CRITICAL (blocks activation): {attribute} — {consequence} → {next step}
HIGH (reduces scope): ...
MODERATE (advisory): ...

[Export Audit Log (JSON)]    [Return to Advisor]
```

**Gap priority logic:**
- CRITICAL: Category A blocking inputs unresolved (H-01 HOLDs that were resolved by deferral — which is not possible; flag for review)
- HIGH: Category B deferrable inputs with scope-reduction consequences
- MODERATE: Configuration Gap Records from F-04 FLAGs (Track 2 pending)

---

## Python Scoring Engine

The scoring engine is a Python function that executes the seven-step classification sequence from Document 2, Section 5 against `kalder_data_model.py` structures.

```python
# Minimum implementation skeleton
# Import structures from kalder_data_model.py

def classify_visitor(
    contact_id: str,
    signal_observations: list[dict],  # [{signal_name, timestamp, solution_category}, ...]
    ca_attributes: dict                # CLIENT_ATTRIBUTE_MAP values for this contact
) -> dict:
    """
    Executes Document 2 Section 5 seven-step scoring sequence.
    Returns full classification result with trace.
    """
    
    # Step 1: Aggregate decay-adjusted weights per role
    # Apply §8 DECAY_MULTIPLIERS to each signal observation based on timestamp
    # Apply §7 CROSS_ROLE_WEIGHTS per-role weights
    # Sum to produce five cumulative scores (one per role)
    
    # Step 2: Score floor check
    # §12 minimum_cumulative_score: 25
    # If max score < 25: return UNKNOWN, halt
    
    # Step 3: Role differential check
    # §12 minimum_role_differential: 10
    # If top role does not lead second role by ≥10: cap at 49, set differential_insufficient=True
    
    # Step 4: Firmographic bonus (SUPPRESSED in POC — Track 2 pending)
    # Production: if firmographic_role matches classified_role, add +30
    # POC: skip this step; document as S-03
    
    # Step 5: Tier assignment
    # §3 CONFIDENCE_TIERS: HIGH ≥80 (Tier 1/2 required), MEDIUM 50–79, LOW <50, UNKNOWN
    # NOTE: Tier 3 behavioral alone never produces HIGH. Score 80+ behavioral = MEDIUM.
    
    # Step 6: Fallback level derivation
    # §4 FALLBACK_CASCADE
    
    # Step 7: Priority 0 differential_insufficient override
    # If differential_insufficient=True: fallback_level=3 regardless of confidence_tier
    
    return {
        "contact_id": contact_id,
        "role_classification": classified_role,
        "confidence_tier": tier,
        "role_confidence_score": score,
        "differential_insufficient": differential_insufficient,
        "fallback_level": fallback_level,
        "scoring_trace": trace,  # Step-by-step intermediate values
        "data_model_version": "0.2.0"
    }
```

**The scoring trace is mandatory output.** Every step must produce a trace entry. The Streamlit visibility layer renders the trace as the demo's primary transparency mechanism.

### Streamlit Visibility Layer

The Streamlit app wraps the Python scoring engine and renders:
1. Signal observation input panel (pre-populated with synthetic data; editable by facilitator)
2. Step-by-step scoring trace (each of the seven steps as it executes, with intermediate values)
3. Final visitor state object
4. "Send to Simulator" button → encodes visitor state as URL parameters → opens Build 2

---

## Audit Log Schema

```json
{
  "session_id": "uuid",
  "data_model_version": "0.2.0",
  "session_start_timestamp": "ISO-8601",
  "session_end_timestamp": "ISO-8601",
  "practitioner_id": "string (self-declared at session start)",
  "client_domain": "string (tal_domain value)",
  "steps_completed": [
    {
      "step_id": 1,
      "step_title": "string",
      "corpus_authority": "§CA CLIENT_ATTRIBUTE_MAP",
      "status": "complete | deferred | hold_resolved | flagged_acknowledged",
      "flag_codes": ["F-04"],
      "hold_codes": [],
      "hold_resolution": "string or null",
      "deferral_consequence": "string or null",
      "timestamp": "ISO-8601"
    }
  ],
  "configuration_gap_records": [
    {
      "gap_id": "string",
      "trigger": "F-04",
      "attribute": "string",
      "consequence": "string",
      "status": "persistent_unresolved | resolved",
      "timestamp": "ISO-8601"
    }
  ],
  "deferral_count": 0,
  "holds_resolved_count": 0,
  "flags_acknowledged_count": 0
}
```

Export endpoint: `GET /api/audit/export` → triggers browser download of `kalder_audit_{tal_domain}_{session_timestamp}.json`.

---

---

# BUILD 2: WEBSITE EXPERIENCE SIMULATOR

---

## Application Structure

```
/app
  /page.tsx                     ← Main simulator view (dual-panel)
  /comparison/page.tsx          ← Split-screen comparison mode
/components
  /ExperiencePanel.tsx          ← Left panel: buyer view
  /DecisioningPanel.tsx         ← Right panel: decisioning trace
  /StateInputPanel.tsx          ← Manual visitor state controls
  /ModuleCard.tsx               ← Individual module slot renderer
  /TraceStep.tsx                ← Individual routing step display
  /EdgeStateToggles.tsx         ← "What Would Change If..." controls
/lib
  /decisioning-engine.ts        ← Document 5 Section 1.6 routing logic
  /three-axis.ts                ← Buying job axis evaluation
  /module-renderer.ts           ← Module set selection by fallback level
/data
  /content-variants/
    it_ops_champion.json        ← Pre-authored content descriptions (POC demo scenario)
  /contacts/
    contact_a.json
    contact_b.json
    contact_c.json
```

---

## Visitor State Type

```typescript
type VisitorState = {
  // Classification plane
  role_classification: "champion" | "economic_buyer" | "influencer" | 
                       "user" | "ratifier" | "default";
  confidence_tier: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  differential_insufficient: boolean;
  
  // Buying job plane
  buying_job_confidence: "KNOWN" | "INFERRED" | "UNKNOWN";
  buying_job_confirmed: string | null;  // JTBD code or null
  
  // Account plane
  solution_category: "it_operations" | "customer_engagement" | 
                     "employee_experience" | "risk_compliance" | "ai_platform";
  buying_stage: "targeted" | "engaged" | "prioritized" | "qualified";
  tal_member: boolean;
  solution_category_coverage_status: "pending" | "constructed" | "partial" | "complete";
  
  // Edge state flags
  holdback_group: boolean;
  visitor_consent_state: "full" | "functional_only" | "declined" | null;
  upsell_override_active: boolean;
}

// These are COMPUTED by the decisioning engine, NOT accepted as inputs
type DecisioningResult = {
  fallback_level: 1 | 2 | 3 | 4 | 5;
  pending_solution_fallback: boolean;
  three_axis_active: boolean;
  three_axis_mode: "KNOWN" | "INFERRED" | "TWO_AXIS_PLUS_PRIOR" | null;
  differential_override: boolean;
  consent_suppressed: boolean;
  routing_path: string;
  trace: TraceStep[];
}
```

---

## Decisioning Engine (complete routing sequence)

```typescript
function runDecisioningEngine(state: VisitorState): DecisioningResult {
  const trace: TraceStep[] = [];

  // Step 0: Consent gate
  if (!state.visitor_consent_state || state.visitor_consent_state === "declined") {
    return result({
      fallback_level: state.tal_member ? 4 : 5,
      consent_suppressed: true,
      routing_path: "consent_gate",
      trace: [...trace, step("consent_gate", "SUPPRESSED — firmographic-only routing",
        "Document 5 §1.7; Document 8 §10.2; Document 9")]
    });
  }
  trace.push(step("consent_gate", "PASS", "Document 9; Document 8 §10.2"));

  // Step 1: TAL membership
  if (!state.tal_member) {
    return result({ fallback_level: 5, routing_path: "non_tal",
      trace: [...trace, step("tal_check", "FAIL → Level 5", "§4 FALLBACK_CASCADE")] });
  }
  trace.push(step("tal_check", "PASS — tal_member: true", "§4 FALLBACK_CASCADE"));

  // Step 2: Priority 0 — differential_insufficient override
  // IMPORTANT: Evaluated BEFORE any fallback level rule
  if (state.differential_insufficient) {
    return result({
      fallback_level: 3,
      differential_override: true,
      routing_path: "differential_insufficient_override",
      trace: [...trace, step("p0_differential_check",
        "OVERRIDE ACTIVE → Level 3. confidence_tier NOT evaluated.",
        "Document 5 §1.2")]
    });
  }
  trace.push(step("p0_differential_check", "PASS (false) — override not active",
    "Document 5 §1.2"));

  // Step 3: Coverage check
  const pendingCoverage = ["pending", "constructed"]
    .includes(state.solution_category_coverage_status);
  if (pendingCoverage) {
    trace.push(step("coverage_check",
      `pending_solution_fallback ACTIVE — ${state.solution_category_coverage_status}. ` +
      `Levels 1 and 2 UNAVAILABLE. Stored confidence_tier (${state.confidence_tier}) ` +
      `is unaffected — this is a routing constraint, not a classification judgment.`,
      "Document 5 §10; Document 4 §7.2"));
  } else {
    trace.push(step("coverage_check",
      `coverage: ${state.solution_category_coverage_status} — Levels 1 and 2 reachable`,
      "Document 5 §1.1"));
  }

  // Step 4: Holdback check (does NOT affect experience level — only progressive_disclosure)
  if (state.holdback_group) {
    trace.push(step("holdback_check",
      "holdback_group: true — progressive_disclosure SUPPRESSED. " +
      "Experience level routing continues normally. " +
      "Measurement asymmetry: this contact cannot benefit from Tier 2 zero-party upgrade.",
      "Document 5 §2.6; Document 6 §3.6; Document 7"));
  }

  // Step 5: Level 1 check
  if (!pendingCoverage && state.confidence_tier === "HIGH") {
    trace.push(step("level_1_check", "PASS → Level 1", "Document 5 §1.3"));
    return result({ fallback_level: 1, pending_solution_fallback: pendingCoverage,
      three_axis_active: evalThreeAxis(state, 1).active,
      routing_path: "level_1", trace });
  }
  trace.push(step("level_1_check",
    pendingCoverage ? "FAIL — pending_solution_fallback active"
                    : `FAIL — confidence_tier: ${state.confidence_tier}`,
    "Document 5 §1.3"));

  // Step 6: Level 2 check
  if (!pendingCoverage && state.confidence_tier === "MEDIUM") {
    trace.push(step("level_2_check", "PASS → Level 2", "Document 5 §1.3"));
    return result({ fallback_level: 2, pending_solution_fallback: pendingCoverage,
      three_axis_active: evalThreeAxis(state, 2).active,
      routing_path: "level_2", trace });
  }
  trace.push(step("level_2_check", "FAIL", "Document 5 §1.3"));

  // Step 7: Level 3 check (solution interest = non-null solution_category in simulator)
  if (state.solution_category) {
    trace.push(step("level_3_check", "PASS → Level 3 (solution interest identified)",
      "Document 5 §1.3; §4 FALLBACK_CASCADE"));
    return result({ fallback_level: 3, pending_solution_fallback: pendingCoverage,
      three_axis_active: false, routing_path: "level_3", trace });
  }

  // Step 8: Level 4 default
  trace.push(step("level_4_check", "PASS → Level 4 (TAL identified, no solution signal)",
    "§4 FALLBACK_CASCADE"));
  return result({ fallback_level: 4, pending_solution_fallback: pendingCoverage,
    three_axis_active: false, routing_path: "level_4", trace });
}
```

**The decisioning engine is the most important code in Build 2.** No shortcuts, no merged steps.

---

## Module Rendering Table

Implement exactly as specified. No improvisation.

```typescript
const MODULE_RENDERING: Record<number, Record<string, ModuleState>> = {
  1: { // Level 1 — Role-Specific
    hero: "role × solution × stage",
    benefits: "role × solution",
    cta: "role × confidence_tier × buying_job",
    gated_assets: "role × buying_job × stage",
    proof: "role × solution × buying_job",
    narrative: "role × solution × stage",
    problem_framing: "role × solution",
    outcomes: "role × solution × stage",
    use_cases: "role × solution × buying_job",
    trust_signals: "role × solution",
    progressive_disclosure: "SUPPRESSED_ACTIVE"  // active suppression, not absence
  },
  2: { // Level 2 — Role-Influenced (same modules, influenced not assumptive)
    // ...same as Level 1 but content tone is suggestive/educational
    progressive_disclosure: "role_confirmation_prompt"
  },
  3: { // Level 3 — Solution-Interest
    hero: "solution",
    benefits: "solution",
    cta: "brand/solution",
    narrative: "solution",
    trust_signals: "brand",
    proof: "NOT_RENDERED",
    gated_assets: "NOT_RENDERED",
    outcomes: "NOT_RENDERED",
    use_cases: "NOT_RENDERED",
    problem_framing: "NOT_RENDERED",
    progressive_disclosure: "role_identification_prompt"  // suppressed if holdback
  },
  4: { // Level 4 — Account-Level
    hero: "brand_default",
    benefits: "brand_default_solution_agnostic",
    cta: "brand_awareness",
    narrative: "brand_value_prop",
    trust_signals: "brand",
    proof: "NOT_RENDERED",
    gated_assets: "NOT_RENDERED",
    outcomes: "NOT_RENDERED",
    use_cases: "NOT_RENDERED",
    problem_framing: "NOT_RENDERED",
    progressive_disclosure: "tal_context_invitation"  // suppressed if holdback
  },
  5: { // Level 5 — Default Brand
    // All modules at brand default
    progressive_disclosure: "NOT_RENDERED"
  }
};
```

**`progressive_disclosure` rendering rules:**
- If `holdback_group: true` AND level ≠ 1 AND level ≠ 5: render slot as `SUPPRESSED_HOLDBACK` (visible in left panel as labeled suppressed slot)
- If level = 1: render as `SUPPRESSED_ACTIVE` (architecturally suppressed, not absent)
- If level = 5: `NOT_RENDERED`

---

## URL Parameter Schema (Build 1 → Build 2 interface)

```
https://simulator.kalder-poc.vercel.app/
  ?contact_label=Contact+B
  &role=champion
  &tier=LOW
  &diff_insufficient=true
  &bj_confidence=UNKNOWN
  &bj_confirmed=
  &solution=it_operations
  &stage=targeted
  &tal=true
  &coverage=partial
  &holdback=false
  &consent=full
  &upsell=false
```

Parse on load, validate all enum values, run decisioning engine, render.

---

## Input Controls

### Manual State Input Panel

```tsx
// Dropdowns for all visitor state variables
// Real-time re-render on any change (no submit button needed)
<select name="role"> champion | economic_buyer | influencer | user | ratifier | default </select>
<select name="tier"> HIGH | MEDIUM | LOW | UNKNOWN </select>
<select name="differential_insufficient"> false | true </select>
<select name="solution"> it_operations | customer_engagement | employee_experience | risk_compliance | ai_platform </select>
<select name="buying_stage"> targeted | engaged | prioritized | qualified </select>
<select name="coverage"> pending | constructed | partial | complete </select>
<select name="holdback"> false | true </select>
<select name="consent"> full | functional_only | declined </select>
<select name="bj_confidence"> UNKNOWN | INFERRED | KNOWN </select>

// Pre-loaded contact buttons
<button onClick={() => loadContact(contactA)}>Load Contact A</button>
<button onClick={() => loadContact(contactB)}>Load Contact B</button>
<button onClick={() => loadContact(contactC)}>Load Contact C</button>
```

### "What Would Change If..." Toggles

```tsx
// Four scenario buttons — apply named state change, re-render immediately
<button onClick={() => applyScenario({ solution_category_coverage_status: "partial" })}>
  What if coverage advances to 'partial'?
</button>

<button onClick={() => applyScenario({
  differential_insufficient: false,
  confidence_tier: "MEDIUM",
  buying_job_confidence: "KNOWN",
  buying_job_confirmed: "IT-ACQ-CH-PI-1"
})}>
  What if the contact responds to progressive disclosure?
</button>

<button onClick={() => applyScenario({ holdback_group: true })}>
  What if this contact is in the holdback group?
</button>

<button onClick={() => applyScenario({ visitor_consent_state: "declined" })}>
  What if consent is declined?
</button>
```

---

## Edge State Display Requirements

These are non-negotiable display requirements. Do not abbreviate.

### `differential_insufficient: true`
Right panel must show:
- "OVERRIDE ACTIVE" label prominently
- Step 2 trace showing: Champion score, Influencer score, differential calculated, threshold (10), result (FAIL), score capped at 49, `differential_insufficient: true` set
- "This is not a low-confidence state — it is an ambiguous-role state."
- Upgrade path: "Simulate Progressive Disclosure Response" button → fires zero-party Champion event → re-runs engine → shows Level 2 routing

### `pending_solution_fallback`
Right panel must show:
- `confidence_tier` stored value (e.g., MEDIUM) displayed separately from routing outcome (Level 3)
- "pending_solution_fallback: ACTIVE"
- "Visitor's actual confidence_tier (MEDIUM) is stored in AEP and unaffected by this constraint."
- "When coverage_status advances to 'partial', Level 2 activates automatically. No re-accumulation required."

### `visitor_consent_state: declined`
Right panel must show:
- Consent gate step labeled as first step that fired
- "No behavioral signal collected or scored."
- "Behavioral signal collection requires visitor consent. This is a privacy-first architecture decision, not a technical gap."

### `holdback_group: true`
Right panel must show:
- "holdback_group: true — progressive_disclosure SUPPRESSED"
- "Experience level routing continues normally."
- "This contact cannot produce a zero-party self-identification event, so they cannot benefit from the Tier 2 confidence upgrade. This measurement asymmetry is documented in Document 7. Corpus authority: Document 5 §2.6; Document 6 §3.6."

Left panel must show `progressive_disclosure` slot as labeled suppressed slot — **not absent from the composition**.

---

---

# BUILD 3: STACK INTEGRATION SPECIFICATION

---

## Overview

Build 3 is a **markdown document** (exported to PDF). It is not a deployed application.

**File:** `kalder_stack_integration_spec_v1.0.md`  
**Export:** `kalder_stack_integration_spec_v1.0.pdf`

---

## Document Outline

```
Section 0  — Executive Summary (3 pages; Reader 1)
Section 1  — Stack Architecture Overview (Reader 1 + 2)
Section 2  — AEP Real-Time CDP B2B Edition Configuration (Reader 2)
Section 3  — Adobe Target Configuration (Reader 2)
Section 4  — Sanity CMS Content Graph Configuration (Reader 2)
Section 5  — AEP → Salesforce → Outreach Integration (Reader 2 + 1)
Section 6  — AEP → Marketo Connector Configuration (Reader 2)
Section 7  — Kafka Pipeline: Opportunity Stage (Reader 2)
Section 8  — Consent Architecture (Reader 3 + 2)
Section 9  — Implementation Prerequisites and Readiness Framework (Reader 1 + 2)
Section 10 — POC-to-Production Gap Reference (Reader 1 + 2)
```

---

## Critical Non-Negotiable Requirements by Section

### Section 2.5 — Tier 1 ML Classifier
**Must include cold-start problem statement:**
> "A client deploying the program without sufficient historical behavioral CRM data cannot activate Tier 1 at launch. Interim operating state: Tier 3 behavioral scoring only; MEDIUM confidence ceiling applies; HIGH confidence assignments not possible until classifier training completes."
> Define minimum training data threshold and estimated time to activation.

### Section 3 — Adobe Target Configuration
**Two "REQUIRED — do not simplify" callouts mandatory:**

> **REQUIRED — `cta` Two-Offer-Set Architecture**  
> Configure HIGH `cta` (priority x203) and MEDIUM `cta` (priority x213) as separate activities with mutually exclusive audience conditions. A single activity would structurally allow a MEDIUM-confidence visitor to receive a HIGH-tagged role-assumptive CTA. The separation is not optional.

> **REQUIRED — `progressive_disclosure` Holdback Suppression**  
> The `progressive_disclosure` slot must be **explicitly suppressed** in holdback group activities via Target audience configuration. Offer catalog absence is insufficient protection — a future commissioning error could introduce a holdback-visible offer if the suppression is not architectural. Add the explicit suppression to each x951–x954 holdback activity.

### Section 4.3 — Content Commissioning Timeline
**Must appear as a prominent callout, not a footnote:**
> **Implementation timeline: 6–10 weeks from checklist start to Level 3 go-live.**  
> Gate 0 (foundational node authoring) is the critical path constraint at 2–3 weeks. This timeline cannot be compressed by adding resources — it is constrained by authoring, review, and validation sequencing. Plan accordingly.

### Section 5.3 — Alert Payload
**Must reproduce canonical `recommended_action` text for each convergence point** with this callout:
> **REQUIRED — Do not rewrite `recommended_action` text**  
> The `recommended_action` field is a program output, not a template. It encodes the buying intelligence's interpretation of the specific buying moment. Clients who rewrite it to match preferred sales language remove the specificity that makes the alert useful rather than noise. The canonical text must appear unmodified in the CRM task.

### Section 5 — BDR Field Guide (one-page, end of section)
**Miller requirement — non-negotiable.** One page. For BDRs and AEs, not Platform Engineers. Contains:
- What alerts to expect (convergence point name, trigger condition, cohort)
- What each alert means in plain language
- Canonical `recommended_action` for each convergence point

### Section 8.3 — GDPR Jurisdiction
**Must appear as the primary statement, not a note:**
> **GDPR jurisdiction is determined by visitor IP address — NOT by `tal_region`.**  
> A visitor browsing from a UK office whose account carries `tal_region = AMS` receives GDPR suppression. The consent management platform detects IP jurisdiction; Demandbase reverse-IP is an account identification function, not a jurisdiction detection function. This is the most common misconfiguration in multi-region consent architecture.

### Section 10 — POC-to-Production Gap Reference

| POC simplification | Production replacement | Build 3 section |
|---|---|---|
| S-01: Python scoring engine | AEP Real-Time CDP B2B streaming pipeline | §2.4 |
| S-02: No Tier 1 classifier; MEDIUM ceiling | Trained ML classifier; HIGH confidence enabled | §2.5 |
| S-03: Firmographic bonus suppressed | Track 2 DPA + `consent:full` → firmographic bonus | §8.1 |
| S-04: Salesforce CRM task mock | AEP → Salesforce native connector; live writes | §5.1–5.3 |
| S-05: Outreach sequence stub | Live Outreach trigger via Salesforce integration | §5.4 |
| S-06: Marketo enrollment not demonstrated | AEP → Marketo two-mode connector | §6 |
| S-07: `progression_win_now` inactive | Kafka `sfdc_opportunity_stage` pipeline | §7 |
| S-08: No tenant isolation | Per-client namespacing; separate index instances | Production infrastructure |
| S-09: Static JSON audit log | Persistent audit store with API and retention policy | §8.5 |
| S-10: Manual index rebuild | Automated change record workflow | §2 governance |

---

## Key Numbers to Include in Build 3

These values must be stated explicitly and sourced:

| Value | Figure | Source |
|---|---|---|
| `CLIENT_ATTRIBUTE_MAP` attributes | 36 (across 3 planes) | Document 8, Section 2 / §CA |
| Behavioral signals in `CROSS_ROLE_WEIGHTS` | 19 | Document 2 / §7 |
| JTBD codes | 131 (across 5 solution categories) | §17 JTBD_CODES |
| Campaign cohorts | 4 (education, acquisition, progression_early_to_mature, progression_win_now) | §6 |
| Target activity priority ranges | 6 (1000–1999 through 6000–6999) | Document 5, Section 4.2 |
| Content graph node types | 10 | §16 CONTENT_GRAPH_NODE_TYPES |
| Module types | 11 | §10 MODULE_TYPES |
| Convergence points | 7 (5 active + 2 progression_win_now) | §18 / §SA |
| Salesforce custom fields minimum | 21 (3 per convergence point × 7) | Document 8, Section 6.2 |
| AEP deletion SLA | 72 hours | Document 9 |
| Outreach deletion SLA | 168 hours | Document 9 |
| Alert delivery SLA ceiling | 60 minutes | Document 8, Section 6.1 |
| Marketo streaming mode latency target | <5 minutes | Document 8, Section 9.1 |
| Content commissioning timeline | 6–10 weeks | Document 8, Section 11 |
| Gate 0 duration | 2–3 weeks | Document 8, Section 11 |
| Raw signal retention | 365 days | Document 9 |
| Zero-party declaration retention | 90 days | Document 2, Section 9.4 |
| Score floor threshold | 25 (minimum cumulative score) | §12 SCORING_RULES |
| Role differential minimum | 10 points | §12 SCORING_RULES |
| HIGH confidence threshold | ≥80 (with Tier 1/Tier 2 confirmation) | §3 CONFIDENCE_TIERS |
| MEDIUM confidence range | 50–79 | §3 CONFIDENCE_TIERS |
| `differential_insufficient` cap | 49 | §12 SCORING_RULES AR-03 |
| Holdback group assignment rate | ~10% | §CA; Document 8, Section 11 |

---

## Versioning

Build 3 is versioned. Version increment required on any data model or corpus change that affects integration specifications.

```
Build 3 v1.0 — kalder_data_model_v0.2.0 — Corpus v1.0
```

---

*End of developer brief. All specifications are locked. Build 1 and Build 2 are deployable from these specs. Build 3 is authorable from these specs plus the full corpus.*
