# Kalder Layer 2 — Decisions Log: L2-E through Build 3 Scoping

**Document type:** Council-approved decisions log  
**Sessions covered:** L2-E (POC Infrastructure and Integration), Build 1 scoping, Build 2 scoping, Build 3 scoping  
**Status:** All decisions locked  
**Depends on:** L2-A through L2-D locked decisions (see `kalder_phase2_layer2_scoping_decisions.md` and session-opening prompt document)  
**Required by:** Future council sessions, developer brief, implementation work

---

## Prior Session State (carry forward without reopening)

All Layer 1 corpus documents (1–9) and `kalder_data_model_v0.2.0` are complete and council-approved. L2-A through L2-D are complete and locked. Key decisions from those sessions that govern this log:

- Three interaction modes: Reference, Advisory, Guided Workflow. Architectural divisions, not UI preferences.
- Three product tiers: Foundation (Reference only), Professional (Reference + Advisory), Enterprise (all three).
- Three distinct builds: Build 1 (Advisor Interface), Build 2 (Website Experience Simulator), Build 3 (Stack Integration Specification).
- Two-store retrieval architecture: Store 1 = vector index, Store 2 = structured data index.
- Three MVP Advisory Mode problem types: PT-1, PT-2, PT-5.
- 18-step onboarding workflow, 12-step content commissioning, 10-step signal monitoring — all fully mapped to corpus authority, FLAG/HOLD trigger conditions, and validation rules.
- Six FLAG codes (F-01 through F-06), six HOLD codes (H-01 through H-06). HOLD governs advanceability; non-bypassable.
- Data model pinned at `v0.2.0`. Version constant displayed in all Advisor outputs.

---

## L2-E: POC Infrastructure and Integration

### POC Scenario Selection (locked)

**Solution category:** `it_operations`  
**Role:** Champion  
**Cohort:** Acquisition  

**Rationale:** IT Operations has the most complete `JTBD_CODES` coverage and the clearest role signal differentiation. Champion vs. Influencer is the most common scoring ambiguity in IT Operations — both consume technical content — making it the most realistic test of the `differential_insufficient` mechanism. Acquisition cohort avoids the PENDING-SA-2 Kafka dependency that gates `progression_win_now`.

---

### Synthetic Data Set (locked)

Three contact records required. All three must be pre-populated with signal observation *inputs*; the pipeline executes against those inputs and produces outputs. Pre-configured confidence tier outputs are invalid POC substitution.

**Contact A — MEDIUM confidence Champion (honest Tier 3 ceiling)**
- Tier 3 behavioral score: 65–75. `confidence_tier: MEDIUM`. `differential_insufficient: False`.
- Champion leads Influencer by ≥15 points. Routes to Level 2 (role-influenced experience).
- Demonstrates the most common real-world state: substantive engagement, no Tier 1 or Tier 2 confirmation.
- Note: Tier 3 alone never produces HIGH confidence (MEDIUM ceiling per Document 2 Section 9.5). HIGH requires Tier 1 ML classifier or Tier 2 zero-party self-identification. The POC honestly demonstrates this ceiling rather than simulating a Tier 2 event.

**Contact B — `differential_insufficient: True` (Champion/Influencer ambiguous)**
- Signal observations: mixed Champion and Influencer signals. Champion scores 45, Influencer 38 — within the 10-point minimum differential.
- Pipeline output: score capped at 49. `differential_insufficient: True`. `confidence_tier: LOW`. Routes to Level 3 via Priority 0 override.
- Progressive disclosure module activates. This is the demo's most important record.
- **Upgrade path (same contact, subsequent session):** Contact B responds to progressive disclosure; self-identifies as Champion. Tier 2 pathway activates: `differential_insufficient` cleared to `False`, `confidence_tier` upgrades to MEDIUM, fallback level upgrades to 2. This before/after moment is the demo's central sequence.

**Contact C — `holdback_group: True` (Kohavi measurement control requirement)**
- Same behavioral signal profile as Contact A (MEDIUM behavioral score, 65–75). `holdback_group: True`.
- Does not receive progressive disclosure. Accumulates signal but cannot benefit from Tier 2 upgrade.
- Demonstrates measurement asymmetry: holdback contacts correctly excluded from progressive disclosure; confidence accumulates more slowly.

**Account-plane `CLIENT_ATTRIBUTE_MAP` pre-population:**
```
tal_domain: "synthco.com"
tal_member: True
tal_program_status: "active_prospect"
tal_marquee: False
tal_account_type_source: "enterprise"
tal_region: "north_america"
tal_upsell_override_active: False
tal_channel: "direct"
```
`tal_program_status: "active_prospect"` triggers the trial/POC exception in Document 2 Section 4.3 Filter 2, keeping the contact out of post-sale suppression.

---

### Program Capabilities In/Out of POC Boundary (locked)

**Demonstrated end-to-end:**
- Full seven-step classification pipeline against synthetic signal observations
- Priority 0 `differential_insufficient` override and Level 3 routing
- Five-level fallback cascade decisioning (Levels 1–3 demonstrated; Level 4 via stub; Level 5 via default state)
- Progressive disclosure module activation for Contact B
- Guided Workflow: onboarding intake phases 1–2 demonstrated live; steps 7–18 available and navigable
- Advisory Mode PT-1 (Classification State Diagnosis) demonstrated against three synthetic contacts
- Reference Mode: spot queries against `JTBD_CODES`, `CROSS_ROLE_WEIGHTS`, `MODULE_TYPES`
- Convergence point alert payload rendering for `problem_validation` and `risk_compliance_validation`
- Audit log export (JSON format, static file, onboarding session record)

**Represented by stubs (valid POC substitution, documented in simplification register):**
- Firmographic bonus pathway (Track 2 consent gate; legitimately suppressed — S-03)
- Level 4 account-level experience (stub renders firmographic personalization description)
- Outreach sequence trigger (labeled stub with sequence ID and canonical trigger condition — S-05)
- Salesforce field write (rendered CRM task mock — S-04)
- AEP real-time streaming connector (replaced by Python pipeline against static synthetic inputs — S-01)
- `progression_win_now` cohort (PENDING-SA-2 Kafka dependency — S-07)

**Explicitly out of boundary (deferred to Build 3):**
- Live AEP → Salesforce → Outreach pipeline
- Marketo program enrollment
- Kafka `sfdc_opportunity_stage` pipeline
- Track 2 legal review and firmographic bonus activation
- Multi-client tenant isolation
- Production data governance and DSR deletion cascade

---

### Four Document 5 Edge States — All In Boundary (locked)

All four must be demonstrable. None deferred.

1. `differential_insufficient: True` — Level 3 override, progressive disclosure activation
2. `pending_solution_fallback` — coverage constraint; Level 3 routing; stored-vs-routed tier distinction explicit
3. `visitor_consent_state: declined` — consent gate suppression; firmographic-only routing
4. `holdback_group: True` — progressive disclosure suppression; measurement asymmetry labeled

---

### Classification Pipeline Implementation (locked)

**Execution layer:** Python. Scoring engine function `classify_visitor(contact_id, signal_observations, ca_attributes)` traverses `CROSS_ROLE_WEIGHTS`, `CONFIDENCE_TIERS`, `SCORING_RULES`, and `FALLBACK_CASCADE` from `kalder_data_model.py`.

**All seven steps execute against real logic.** No hardcoded demo outputs. The only stubbed step is Step 4 (firmographic bonus) — suppressed due to Track 2 consent pending. Its absence is accurate, not an omission.

**Visibility layer:** Streamlit. Renders step-by-step scoring trace showing intermediate values at each of the seven steps, including the `differential_insufficient` flag evaluation. Final visitor state object displayed. "Send to Simulator" button passes state to Build 2 via URL parameters.

**Scoring trace display is mandatory.** A VP observer must see why a given visitor received a given confidence tier. The trace for Contact B must show the Step 3 differential check firing explicitly.

---

### Data Model Version Pinning (locked)

- `DATA_MODEL_VERSION = "0.2.0"` declared as constant at top of scoring engine module.
- Version stamp displayed in Advisor UI header and written to every audit log.
- H-06 HOLD surfaces version mismatches when a Guided Workflow step references an attribute not present in the indexed version.
- Index rebuild for POC: manual trigger (acceptable for single-version POC; documented as S-10).

---

### Audit Log Format (locked)

- JSON export, session-scoped, exportable at any step and at onboarding completion.
- File named: `kalder_audit_{tal_domain}_{session_timestamp}.json`
- Minimum required fields: `session_id`, `data_model_version`, `session_start_timestamp`, `session_end_timestamp`, `practitioner_id` (self-declared), `client_domain`, `steps_completed` (array with per-step status, flag codes, hold codes, hold resolution, deferral consequence, timestamp), `configuration_gap_records`, `deferral_count`, `holds_resolved_count`, `flags_acknowledged_count`.
- Practitioner identity: self-declared text field at session start. Not authentication — attribution.
- Constitutes a credible compliance artifact: every FLAG acknowledgment timestamped, every HOLD resolution captured, every deferral carries named consequence, data model version stamped.
- POC audit log is a static file export (not a persistent data store — documented as S-09).

**Marketo program IDs:** Category B deferrable inputs for the POC. Absence produces F-03 FLAG with named scope-reduction consequence and a Configuration Gap Record. Not Category A blocking inputs at POC scope.

---

### POC Simplification Register (locked — S-01 through S-10)

| # | What is simplified | Why valid for POC | Production replacement | Corpus authority |
|---|---|---|---|---|
| S-01 | AEP pipeline replaced by Python scoring engine against synthetic signal inputs | Scoring logic identical; only data source differs | AEP Real-Time CDP B2B Edition streaming pipeline | Document 2, §12 `SCORING_RULES` |
| S-02 | No Tier 1 ML classifier; MEDIUM confidence ceiling | Tier 3 is the primary path for early-stage contacts; MEDIUM ceiling is the accurate Tier 3 behavior | Tier 1 ML classifier trained on historical CRM data; HIGH confidence requires Tier 1 or Tier 2 | Document 2, Section 9.3 |
| S-03 | Firmographic bonus pathway suppressed | Track 2 consent review genuinely pending; suppression is operationally accurate | Demandbase `firmographic_match` activated after Track 2 DPA review | Document 9 §P; data model v0.2.0 AR-03 |
| S-04 | Salesforce field write replaced by rendered CRM task mock | Alert payload fully specified in `§SA`; routing logic documentable without live CRM | AEP Real-Time CDP native Salesforce connector; three custom fields per convergence point; 60-minute SLA ceiling | Document 8, Section 6.1; `§SA SALES_ACTIVATION_CONFIG` |
| S-05 | Outreach sequence trigger replaced by labeled stub | Sequence library is client-configured at onboarding; cannot demonstrate without client credentials | Outreach Salesforce integration; sequence ID `tal_channel`-routed; activates on Salesforce field update | Document 8, Section 6.6; Document 3, Section 6.4 |
| S-06 | Marketo program enrollment not demonstrated | Category B deferrable; email enrollment scope reduced but does not block classification or web experience demonstration | Marketo two-mode connector (streaming for cohort transitions, daily batch for attribute updates); program IDs configured at onboarding | Document 3, Section 6.3; Document 8, Section 9 |
| S-07 | `progression_win_now` cohort not active | PENDING-SA-2 Kafka dependency; accurately reflects production status | Kafka `sfdc_opportunity_stage` pipeline confirmation; cohort activates on Salesforce opportunity stage update | Document 3, Section 6.4 PENDING; Document 8, Section 6.6 |
| S-08 | Multi-client tenant isolation not implemented | POC is single-client; tenant isolation is infrastructure, not logic | Per-client configuration namespacing; separate retrieval index instances per tenant | Not corpus-specified; production infrastructure requirement |
| S-09 | Onboarding audit log is static JSON export, not persistent data store | Captures all compliance-relevant fields; sufficient for enterprise review at POC scope | Persistent audit data store with client tenant association; API-accessible; governed retention policy | Document 9; Alfonso requirement L2-D |
| S-10 | Retrieval index rebuild is manual trigger | Appropriate for single-version POC; version governance demonstrated by version pinning and H-06 HOLD | Automated change record workflow; index rebuild triggered by approved data model change record | Data model change record protocol; L2-D open item |

---

### Sales Activation Representation in POC (locked)

Two convergence points rendered as Salesforce CRM task mocks: `problem_validation` and `risk_compliance_validation`.

These two show the full range: early-stage BDR activation and late-stage deal risk. Both render all six canonical fields from `§SA SALES_ACTIVATION_CONFIG`: `convergence_point`, `alert_type`, `roles_active`, `alert_summary`, `recommended_action`, `sequence_triggered`.

Canonical `recommended_action` text used verbatim from `§SA`. Non-modification requirement applies.

Outreach sequence trigger: labeled stub with sequence ID and canonical trigger condition. The VP does not need to see Outreach open — they need to see the routing logic is complete and the payload is accurate.

---

## Build 1: Advisor Interface Implementation Specification

### Technology Stack (locked)

**Framework:** Next.js + Anthropic Claude API (claude-sonnet-4-6), deployed to Vercel.  
**Python scoring engine:** Next.js API route or lightweight sidecar service.  
**Rationale:** Production-quality UI; three-mode architecture maps cleanly to page/component structure; Claude API is the Advisory Mode reasoning layer; Vercel deployment is zero-config. Streamlit was rejected — it produces a prototype appearance that undermines the Priority 4 VP demo target.

---

### Application Architecture (locked)

**Frontend (Next.js):** Mode shell (session-persistent mode selector), Reference Mode view, Advisory Mode view, Guided Workflow view.

**API layer (Next.js API routes):**
- `/api/reference` — query normalizer → retrieval router → Store 1/Store 2
- `/api/advisory` — context assembly → Claude API call → output parser
- `/api/guided` — step validation → FLAG/HOLD evaluator → state manager
- `/api/classify` — Python scoring engine (`classify_visitor()` call)
- `/api/audit` — session audit log read/write/export

**Retrieval layer:**
- Store 1: Pinecone vector index (corpus sections; `text-embedding-3-small`; namespace `kalder-v0-2-0`; minimum cosine similarity 0.75)
- Store 2: JSON structured data tables loaded at API startup (five priority tables: `jtbd_codes.json`, `cross_role_weights.json`, `client_attribute_map.json`, `module_types.json`, `decay_multipliers.json`; additional tables: `confidence_tiers.json`, `fallback_cascade.json`, `scoring_rules.json`, `sales_activation_config.json`)

**Session state:** Client-side React state + `sessionStorage`. Mode switch preserves all state. Data model version stamp initialized at session start.

**Data model version stamp:** `DATA_MODEL_VERSION = "0.2.0"` displayed in UI header, in every Advisory Mode output, and in every audit log. Non-optional.

---

### Reference Mode (locked)

**Four-stage pre-retrieval pipeline:**
1. Query normalizer — strips filler words, normalizes capitalization, expands abbreviations
2. Disambiguation registry — six-term registry; fires clarification prompt before retrieval if ambiguous term detected

| Term | Prompt |
|---|---|
| `confidence` | Classification confidence (scoring pipeline output) vs. Diagnostic confidence (Advisor output reliability)? |
| `stage` | Buying Group Stages (`§5 BG_STAGES`) vs. Buying Job stages? |
| `fallback` | Five-level Fallback Cascade (experience routing) vs. fallback logic within a specific rule? |
| `priority` | Adobe Target activity priority (four-digit scheme) vs. user priority type (Priority 1–4)? |
| `cohort` | Campaign Cohorts (`§6`) vs. holdback group? |
| `role` | Buying Group Roles vs. data authority roles (Tier 1/2/3)? |

3. Context resolution — section key references (`§CA`, `§12`, `§SA`) route directly to Store 2, bypassing vector retrieval
4. Route decision — QT-1 (Store 2 record lookup), QT-2 (Store 1 corpus section), QT-3 (Store 2 parameter lookup), QT-4 (Store 1 + Store 2 cross-document), QT-5 (Store 1 operational procedure), QT-6 (Store 1 + Store 2 edge case)

**Output template:**
```
[ANSWER]    {direct answer, 1–4 sentences, corpus-accurate}
[SOURCE]    {document title}, {section identifier} | Data Model {§section key} v0.2.0
[RELATED]   {0–2 cross-references}
```

**Below-threshold retrieval:** Labeled explicitly as low-confidence. Never silently returned as authoritative. Never hallucinated.

---

### Advisory Mode (locked)

**Entry point:** Problem type selector (not free-text). Three MVP problem types:
- PT-1: Classification State Diagnosis — "A contact's confidence tier or experience level isn't what I expected."
- PT-2: Cohort Performance Diagnosis — "A cohort metric is underperforming or has shifted unexpectedly."
- PT-5: Sales Escalation Readiness — "I need to know whether a contact or account is ready for sales activation."

**System prompt construction (three layers, dynamic — not static):**
1. Base instruction layer (static): reasoning constraints, named-state detection requirements, output format specification, version stamp
2. Problem-type corpus injection (dynamic, retrieved per query): relevant corpus sections for the active problem type
3. User context injection (dynamic): practitioner-elicited inputs appended as structured context

**Alfonso's non-negotiable:** The system prompt is constructed from corpus retrieval outputs at query time. A hardcoded Advisory Mode system prompt is a Failure Mode A instance.

**All seven reasoning steps (R1-1 through R1-7 for PT-1) must execute before diagnosis.** Shortcutting to diagnosis after two steps is Failure Mode A regardless of whether the answer seems obvious.

**Miller's requirement:** Step R1-7 (signal-to-action) must always execute. An Advisory output that stops at classification state diagnosis without connecting to BDR sequence, content intervention, or sales escalation path is incomplete.

**Named-state detection is mandatory in every output:**
- `differential_insufficient = True`: must be explicitly detected and named
- `pending_solution_fallback`: must be explicitly detected and named
- Treating either as a generic low-confidence or coverage-gap state is Failure Mode C (disqualifying)

**Output template (six sections, rendered as collapsible cards):**
```
DIAGNOSTIC CONFIDENCE: [HIGH / MEDIUM / LOW]    Data model: v0.2.0
▼ PROBLEM RESTATEMENT
▼ CORPUS SECTION TRAVERSAL    (all steps, labeled)
▼ NAMED STATE CHECK           (non-collapsible by default)
▼ DIAGNOSIS
▼ RECOMMENDED ACTIONS         (each action → corpus authority)
▼ DIAGNOSTIC CONFIDENCE       (rationale; Norris addendum if applicable)
```

**NAMED STATE CHECK section is non-collapsible by default.** Its permanent visibility enforces the L2-C requirement that named program states are never silently skipped.

**Norris addendum:** TAL quality distribution report absence caps PT-2 diagnostic confidence at MEDIUM.

**Mid-Guided Advisory queries:** Inline Advisory queries during Guided Workflow render in a side panel without exiting the step card. Guided Workflow state fully preserved. Full Advisory Mode quality standards apply — not a degraded inline version.

---

### Guided Workflow Mode (locked)

**State machine.** `GuidedWorkflowState` tracks: `workflowId`, `currentStep`, `completedSteps`, `stepStatuses`, `activeHolds`, `activeFlags`, `deferralLog`, `configurationGapRecords`, `dataModelVersion`, `sessionStartTimestamp`, `practitionerId`.

**HOLD governs advanceability.** "Next Step" control is disabled (grayed, unclickable) whenever `activeHolds.length > 0`. Non-bypassable. FLAG acknowledgment available only after all HOLDs on the current step are resolved. HOLD cards render above FLAG cards.

**Three workflow instances:**
- Onboarding (18 steps): fully demonstrated in POC; all steps available and navigable
- Content node commissioning (12 steps): available; not primary demo path
- Signal monitoring (10 steps): available; maps to Document 8 Section 5

**Step card five zones:** Title/authority, Why This Matters, HOLD cards, FLAG cards, input zone + controls ("Ask Advisor", "Defer this step" dropdown, "Next Step", running deferral count).

**"Why This Matters" zone:** First-person operational statement from `§CA null_behavior`. Not optional copy — the adoption engine. Must describe what happens to the program if this attribute is missing or deferred.

**"Defer this step" control:** Dropdown, not button. Requires explicit consequence acknowledgment before deferral confirms. Running deferral count displayed in footer at all times.

**Completion screen:** Session summary (steps completed, deferred, HOLDs resolved, FLAGs acknowledged, persistent configuration gaps). Open gaps prioritized by program impact: CRITICAL (blocks activation), HIGH (reduces scope), MODERATE (advisory). Export audit log button. This screen is the most important screen in the workflow — the practitioner leaves with a clear action list, not a vague sense of follow-up.

---

### Session State (locked)

Client-side React state + `sessionStorage`. Not `localStorage` — session state is intentionally ephemeral. Mode switches freeze and restore state without loss. Advisory conversation history preserved across mode switches.

**POC is single-user, single-session.** Multi-user, multi-tenant state is a production infrastructure requirement (S-08). Client-side state is the honest POC boundary.

---

### 30-Minute Demo Sequence (locked)

- Minutes 0–5: Context orientation. Three modes described, no demo yet.
- Minutes 5–12: Reference Mode. Two live queries: one corpus semantic (progressive disclosure `confidence_tier_minimum`), one Store 2 structured lookup (IT Operations Champion PI JTBD codes). Disambiguation registry fires if applicable — that is a feature demonstration, not friction.
- Minutes 12–22: Advisory Mode. PT-1 against Contact B (`differential_insufficient: True`). Walk six-section output. Show NAMED STATE CHECK expanded with `differential_insufficient: True` labeled. Show upgrade path after simulated Tier 2 self-identification.
- Minutes 22–28: Guided Workflow. Onboarding workflow. Navigate to `tal_account_type_source` step. Intentionally enter invalid value to trigger H-02 HOLD. Show Next Step disabled. Resolve HOLD. Acknowledge F-04 FLAG. Show running deferral count. Export audit log.
- Minutes 28–30: Bridge to Build 2. "Let me show you what Contact B actually sees on the website."

---

## Build 2: Website Experience Simulator Implementation Specification

### Governing Design Constraint (locked)

Build 2 is a decisioning transparency tool that happens to render a web experience alongside its reasoning — not primarily a web experience prototype. Alfonso's requirement: a VP of Demand Gen watching the simulator for the first time must be able to see not just what the buyer experiences but why. The "why" is the product's differentiation argument made concrete.

**Dual-panel architecture is mandatory.** Left panel: buyer view (experience composition). Right panel: decisioning trace (step-by-step routing evaluation with corpus authority). Both always visible. Neither optional.

---

### Technology and Deployment (locked)

**Framework:** React (Next.js), deployed to Vercel as a standalone application.  
**Subdomain:** Separate from Build 1 (e.g., `simulator.kalder-poc.vercel.app`).  
**Interface contract:** Visitor state URL parameter schema is the only coupling between Build 1 and Build 2.  
**All decisioning logic runs client-side** in JavaScript. No server calls required for the core simulation.  
**Static content file:** Pre-authored IT Operations / Champion content variant descriptions loaded from a static JSON file at startup. Placeholder rendering for all other role/solution combinations.

---

### Visitor State Object (locked)

Twelve input fields (classification plane, buying job plane, account/segmentation plane, edge state flags). Three derived outputs computed by the simulator's decisioning engine — NOT accepted as inputs: `fallback_level`, `pending_solution_fallback`, `three_axis_active`.

**Decisioning engine validates pipeline-passed state.** If Build 1 passes a `fallback_level`, the simulator's engine computes it independently and flags discrepancy. The simulator's decisioning engine is authoritative — it does not blindly accept pipeline output.

**URL parameter schema (pipeline-fed input mode):**
```
?role=champion&tier=MEDIUM&diff_insufficient=false&bj_confidence=UNKNOWN
&solution=it_operations&stage=targeted&tal=true&coverage=partial
&holdback=false&consent=full&upsell=false
```

---

### Decisioning Engine (locked)

JavaScript implementation of Document 5 Section 1.6 routing sequence. Eight explicit steps in strict order. No shortcuts. Every step produces a labeled trace entry with corpus authority citation.

**Step sequence:**
0. Consent gate (`visitor_consent_state` null or `declined` → firmographic-only routing)
1. TAL membership check (`tal_member: false` → Level 5)
2. Priority 0: `differential_insufficient` check (if `true` → Level 3 override; halt evaluation)
3. Coverage check (`pending`/`constructed` → `pending_solution_fallback` active; Levels 1 and 2 unavailable)
4. Holdback check (`holdback_group: true` forces Level 5 for all module slots regardless of computed `fallback_level`. Experience level routing does NOT continue normally — Level 5 is the holdback experience. Corpus authority: Document 5 §7.1–7.7.)
5. Level 1 check (not pending AND `confidence_tier: HIGH` → Level 1)
6. Level 2 check (not pending AND `confidence_tier: MEDIUM` → Level 2)
7. Level 3 check (solution interest present → Level 3)
8. Default → Level 4

**`pending_solution_fallback` display requirement (Alfonso):** When active, the right panel must make two things explicitly visible: (a) the visitor's actual `confidence_tier` is MEDIUM and is stored in AEP unchanged; (b) Level 3 routing is a coverage constraint, not a classification judgment. Upgrade path note required: "When `solution_category_coverage_status` advances to `partial`, Level 2 activates automatically."

---

### Module Rendering by Fallback Level (locked)

Follows Document 4 Section 5.3 and Document 5 Sections 3 and 8 exactly.

| Module type | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| `hero` | Role × solution × stage | Role-influenced | Solution | Brand default | Brand default |
| `benefits` | Role × solution | Role-influenced | Solution | Brand default (solution-agnostic) | Generic |
| `cta` | Role × tier × buying_job | Role-influenced | Brand/solution | Brand awareness | Generic |
| `gated_assets` | Role × buying_job × stage | Role-influenced | Not rendered | Not rendered | Not rendered |
| `proof` | Role × solution × buying_job | Role-influenced | Not rendered | Not rendered | Not rendered |
| `narrative` | Role × solution × stage | Role-influenced | Solution | Brand value prop | Brand default |
| `problem_framing` | Role × solution | Role-influenced | Not rendered | Not rendered | Not rendered |
| `outcomes` | Role × solution × stage | Role-influenced | Not rendered | Not rendered | Not rendered |
| `use_cases` | Role × solution × buying_job | Role-influenced | Not rendered | Not rendered | Not rendered |
| `trust_signals` | Role × solution | Role-influenced | Brand | Brand | Not rendered |
| `progressive_disclosure` | **SUPPRESSED (active)** | Role confirmation | Role identification | TAL-context invitation | Not rendered |

**`progressive_disclosure` suppression rules:**
- Level 1: **Active suppression** — not absent from the offer catalog, architecturally turned off. Display as "SUPPRESSED — Level 1 (active suppression by design)" not as absent.
- `holdback_group: True`: **Suppressed** — display slot as "SUPPRESSED — holdback control condition" not as absent. VP must see the slot exists architecturally and is intentionally withheld.

---

### Four Edge States — All Fully Implemented (locked)

**Edge state 1: `differential_insufficient: True`**
- Routing: Priority 0 override fires. Level 3. `confidence_tier` not evaluated.
- Right panel: Priority 0 override highlighted prominently. Step-by-step: Champion 45, Influencer 38, differential 7 < minimum 10, score capped at 49, `differential_insufficient: True` set, Level 3 assigned.
- Key framing: "This is not a low-confidence state — it is an ambiguous-role state. The visitor has substantial behavioral engagement. The program is protecting against role misclassification."
- Upgrade path: "Simulate Progressive Disclosure Response" button. Fires zero-party Champion self-identification. Re-runs decisioning engine. Right panel updates showing re-routing to Level 2.

**Edge state 2: `pending_solution_fallback`**
- Routing: Coverage status `pending` → `pending_solution_fallback` active → Level 1/2 unavailable → Level 3 assigned.
- Right panel: Stored `confidence_tier` (MEDIUM) displayed separately from routing outcome (Level 3). Upgrade path note required.

**Edge state 3: `visitor_consent_state: declined`**
- Routing: Consent gate fires immediately. No behavioral signal collection. Firmographic-only. Level 4 (if `tal_member: True`) or Level 5.
- Right panel: "Behavioral signal collection requires visitor consent. This is a privacy-first architecture decision, not a technical gap."
- Garcia's framing requirement: Must be labeled as a design choice, not a limitation.

**Edge state 4: `holdback_group: True`**
- Routing: `holdback_group: true` forces Level 5 (full default brand experience, all module slots) regardless of Contact C's computed `confidence_tier`/`fallback_level`. Experience level routing does NOT continue normally. Corpus authority: Document 5 §7.1–7.7 — holdback is implemented as Target activities at priority 5950–5954, which fire before the Level 4 account activity specifically to prevent any partial-personalization experience from reaching the control group. Contact C's classification scoring still runs normally and is stored in AEP (per §7.7); only experience delivery is withheld.
- Right panel: Kohavi measurement asymmetry statement required. "This contact cannot produce a zero-party self-identification event, so they cannot benefit from the Tier 2 confidence upgrade. This asymmetry is documented in Document 7 and must be accounted for in lift calculations."
- Left panel: Full Level 5 default experience rendered. The `progressive_disclosure` slot does not render at Level 5 (per §7.7) — labeled "SUPPRESSED — holdback control condition" (not absent) so the VP can see the slot exists architecturally and is intentionally withheld, not missing from the composition.

---

### Input Modes (locked)

**Mode 1 — Pipeline-fed:** URL parameters from Build 1 "Send to Simulator" button. Contact identity passed as parameter and displayed in simulator header.

**Mode 2 — Manual state input panel:** Dropdowns and toggles for all visitor state variables. Real-time re-rendering on any state change. Three pre-loaded synthetic contact buttons (Load Contact A, Load Contact B, Load Contact C).

**Comparison mode:** Split-screen toggle. Two visitor states side-by-side. Both decisioning traces and both experience compositions visible simultaneously. Read-only (no input panel). States set before entering comparison mode.

**"What Would Change If..." scenario toggles:**
- What if coverage advances to `partial`? → Toggles coverage status, re-renders
- What if the contact responds to progressive disclosure? → Simulates zero-party event, re-renders
- What if this contact is in the holdback group? → Toggles holdback, re-renders
- What if consent is declined? → Sets consent to declined, re-renders

---

### Right Panel Structure (locked)

Displays: visitor state as received, routing evaluation (each step labeled with ✓/✗ and corpus authority), experience assigned (with pending_solution_fallback note if active), module composition (each module type with variant description and axis notation), three-axis status.

Every corpus authority reference cites document and section. Corpus version stamp `v0.2.0` in every panel header.

---

### Demo Sequence for Build 2 (locked)

Build 2 is entered from Build 1 demo at minute 28 via "Send to Simulator" button with Contact B's state. Opens immediately with Level 3 experience (left) and Priority 0 override trace (right). VP explores state transitions via scenario toggles and comparison mode. Ends when VP is ready to discuss implementation — transition to Build 3.

**Three beliefs the VP must leave the Build 2 demo holding:**
1. The program does not guess. Every experience is traceable to a ruleset grounded in how B2B buying actually works.
2. The program handles failure correctly. When classification is ambiguous, it routes to the appropriate fallback and activates the resolution mechanism.
3. The program is measurable. The holdback group is visible, the measurement asymmetry is labeled, and the reason is explained.

---

## Build 3: Stack Integration Specification

### Nature and Purpose (locked)

**Build 3 is a documentation artifact, not a deployed application.** It is the enterprise sales artifact that demonstrates production-grade program operating system credibility. It exists alongside Build 1 (the product) and Build 2 (the demo) — not as a substitute for either.

**Primary function:** Specify the production replacements for POC Simplifications S-01 through S-10 in enough depth that an enterprise client's technical team can evaluate the gap between the POC and their production environment.

**Governing principle (Brinker):** A literal stack integration specification serves only the Platform Engineer. Build 3 must serve three reader audiences without becoming a compromise. Structure must let each audience navigate directly to relevant sections without reading sections intended for another audience.

---

### Three Reader Audiences (locked)

**Reader 1 — Marketing Technology Director / VP of Marketing Operations:** Reads Executive Summary, Stack Architecture Overview, Prerequisites and Readiness Framework, POC-to-Production Gap Reference. Does not read connector configuration tables.

**Reader 2 — Platform Engineer / MarTech Architect:** Reads connector configurations, field mapping specifications, validation checklists, AEP schema requirements. This is the reader Alfonso's corpus fidelity requirement serves.

**Reader 3 — Procurement / InfoSec Reviewer:** Reads data plane section and consent architecture section. Does not read Target activity configurations.

---

### Ten-Section Structure (locked)

**Section 0 — Executive Summary** *(Reader 1)*  
Three-page overview. Answers: what does full stack integration enable that the POC does not; what systems does integration require at what depth; what are the three most significant prerequisites; what is the realistic implementation timeline. Includes POC-to-production gap table (S-01 through S-10, non-technical format) and four-phase implementation timeline.

**Section 1 — Stack Architecture Overview** *(Readers 1 and 2)*  
Single authoritative diagram plus narrative. Every system, every integration, every data flow direction explicitly labeled. Raab's requirement: direction of each integration must be explicit — determines which system configures the connector and which configures the field mapping.

Nine integrations documented: Adobe Analytics → AEP, Marketo → AEP (identity resolution), AEP scoring pipeline (internal), AEP → Adobe Target, Sanity → Adobe Target (via webhook → sync pipeline), AEP → Marketo (two-mode connector), AEP → Salesforce (alert delivery), Salesforce → Outreach (sequence trigger), Kafka → AEP (opportunity stage).

**Section 2 — AEP Real-Time CDP B2B Edition Configuration** *(Reader 2 primary)*  
Production replacement for S-01 and S-02. Seven subsections:
- 2.1: B2B Edition licensing prerequisite (account-contact relationship model required; standard CDP cannot represent composite classification key)
- 2.2: Schema configuration (36 `CLIENT_ATTRIBUTE_MAP` attributes across three planes; full registry from Document 8 Section 2 reproduced)
- 2.3: Signal collection architecture (19 behavioral signals; data source, Analytics event name, AEP schema field, pre-scoring filter rules per signal)
- 2.4: Scoring pipeline implementation (seven-step `classify_visitor()` function; scoring trigger; AEP attributes written per run; re-scoring trigger for zero-party events)
- 2.5: Tier 1 ML classifier specification (training data requirements; integration point in scoring pipeline; Norris cold-start requirement: minimum data threshold named honestly; interim operating state defined — Tier 3 only, MEDIUM ceiling)
- 2.6: Holdback group assignment (~10% rate; random assignment at first TAL identification event; must be configured before any contacts enter pipeline)
- 2.7: Data retention (365-day raw signal, 90-day zero-party, DSR deletion cascade four-step SLAs: 72-hour AEP/Salesforce/Marketo, 168-hour Outreach)

**Section 3 — Adobe Target Configuration** *(Reader 2)*  
Production replacement governed by Document 5 Section 4. Six subsections:
- 3.1: Four-digit activity priority convention (thousands = axis, hundreds = cohort, tens+units = module index; full activity count per cohort; sustainability guarantee — new content never requires modifying existing activities)
- 3.2: Campaign cohort audience definitions (four cohorts; AEP audience gate conditions from Document 3 Section 2.3; Target activities per cohort; fallback level routing)
- 3.3: `differential_insufficient` override activities (priorities 1001–1004; Priority 0 routing; Level 3 experience)
- 3.4: `cta` two-offer-set configuration (HIGH at index 03, MEDIUM at index 13; mutually exclusive audience conditions; Alfonso "REQUIRED" callout — do not simplify)
- 3.5: Holdback group activities (priorities 5951–5954; `progressive_disclosure` explicit suppression required — offer catalog absence is insufficient protection; Alfonso "REQUIRED" callout)
- 3.6: Offer catalog governance (Sanity webhook sync; `phase: converge` exclusion enforced at sync pipeline pre-write, not in Target; catalog integrity audit procedure)

**Section 4 — Sanity CMS Content Graph Configuration** *(Reader 2 primary)*  
Four subsections:
- 4.1: Ten node type schema configuration (schema definitions; cross-node reference constraints; three automated GROQ validation functions)
- 4.2: Sanity-to-Target sync pipeline setup (webhook trigger; fields synchronized; coverage status recomputation; performance requirement: all GROQ validation functions ≤2 seconds per node under 10 concurrent publications)
- 4.3: Coverage status activation gates (four-state hierarchy; Norris timeline requirement: 6–10 weeks from checklist start to Level 3 go-live stated prominently, not in footnote; Gate 0 = 2–3 week critical path)
- 4.4: Kalder Compose generation context specification (generation context fields per node type; R1–R4 review stages; sprint planning conventions from Document 8 Section 3.2)

**Section 5 — AEP → Salesforce → Outreach Integration** *(Reader 2 primary; Reader 1 summary)*  
Production replacement for S-04 and S-05. Shea leads. Six subsections:
- 5.1: Routing architecture confirmation (AEP Real-Time CDP native Salesforce connector → Salesforce custom fields → Outreach Salesforce integration; no custom middleware)
- 5.2: Salesforce custom field provisioning (three fields per convergence point: `convergence_point`, `roles_active`, `recommended_action`; seven convergence points = 21 minimum custom fields; character limit validation for `recommended_action`)
- 5.3: Alert payload specification (six canonical fields per convergence point; canonical `recommended_action` text reproduced verbatim; non-modification requirement explicit — rewriting `recommended_action` eliminates specificity that makes the alert useful)
- 5.4: Outreach sequence trigger configuration (one trigger per active convergence point per cohort; `tal_channel` variant configuration; two contact-level gates documented)
- 5.5: Two contact-level gates — practitioner guidance (Document 8 Section 6.5 "Why didn't my sequence fire?" guidance reproduced in plain language for BDR/AE audience)
- 5.6: 60-minute alert delivery SLA (AEP trigger → Salesforce write → Outreach activation; three pipeline components; monitoring check)
- **Section 5 closes with one-page BDR field guide** (Miller requirement): what alerts to expect, what each means, and canonical `recommended_action` per convergence point. For BDRs and AEs, not for Platform Engineers.

**Section 6 — AEP → Marketo Connector Configuration** *(Reader 2)*  
Production replacement for S-06. Four subsections:
- 6.1: Two-mode connector architecture (streaming <5 minutes for cohort transitions; daily batch for `role_classification`, `confidence_tier`, `bg_stage`, `differential_insufficient`; both modes on same connector instance; both monitored independently)
- 6.2: Segment-to-program mapping (four cohorts; education suppressed — intentional; exit-before-entry sequencing required — not connector default; must be explicitly configured)
- 6.3: `role_classification = default` handling (three-step sequence: enroll on general track → batch sync delivers resolved value → smart campaign reassigns; silent failure mode named: smart campaign absent produces no error; pre-launch gate required)
- 6.4: `progression_win_now` ordering constraint (Marketo program must be active before AEP fires transition events; contacts unrolled if order violated; not recoverable without manual intervention)

**Section 7 — Kafka Pipeline (Opportunity Stage)** *(Reader 2)*  
Production replacement for S-07. Three subsections:
- 7.1: Pipeline purpose (reads Salesforce Stage 5–7 opportunity data; writes to AEP as integer-mapped `sfdc_opportunity_stage`; enables `progression_win_now` cohort assignment and elevated-priority convergence point alerts)
- 7.2: Salesforce StageName mapping table (client-provided at onboarding; client-specific; validation requirement: segment must return ≥1 qualifying account in AEP before downstream activation)
- 7.3: Five-condition go-live checklist (from Document 8 Section 8.8); atomic removal requirement for interim fallback rule (both rules must not be active simultaneously)

**Section 8 — Consent Architecture** *(Reader 3 primary; Reader 2 supporting)*  
Garcia leads. Production replacement for S-03 and S-09 compliance dimensions. Five subsections:
- 8.1: Two-track signal consent structure (Track 1: LIA complete for all 19 first-party signals; Track 2: DPA review required for `demandbase_firmographic_match`; both Track 2 completion AND `visitor_consent_state: full` required for firmographic bonus)
- 8.2: `visitor_consent_state` pre-pipeline gate (four scenarios; null/absent = declined, never permissive; CMP must deliver consent event before visitor's second page load)
- 8.3: GDPR jurisdiction determination (by visitor IP address, **not** by `tal_region` — must appear prominent; most common misconfiguration in multi-region consent architecture)
- 8.4: DSR deletion cascade (four steps; 72-hour SLA for AEP/Salesforce/Marketo; 168-hour SLA for Outreach; deletion confirmation record is the legal artifact)
- 8.5: Data retention (365-day raw signal; 90-day zero-party; quarterly compliance check; named error condition for retention pipeline failure)

**Section 9 — Implementation Prerequisites and Readiness Framework** *(Readers 1 and 2)*  
Norris leads. Five subsections:
- 9.1: Licensing prerequisites (AEP Real-Time CDP B2B Edition, Adobe Target premium, Sanity CMS with webhook support, Marketo Engage, Outreach with Salesforce integration, Demandbase, Kalder Compose; each states scope reduction if license is absent)
- 9.2: Minimum Viable Client Data Set (Category A — 9 blocking items; Category B — 8 deferrable with named consequences; Category C — 6 Advisor-derivable)
- 9.3: Technical prerequisites by role (Platform Engineer pre-checklist; Marketing Ops Engineer pre-checklist; Content Ops Lead pre-checklist)
- 9.4: Tier 1 ML classifier cold-start path (minimum training data threshold; interim operating state = Tier 3 behavioral only, MEDIUM ceiling; timeline to classifier training and validation; milestone for Tier 1 activation)
- 9.5: Content commissioning timeline (6–10 weeks checklist-to-Level-3; Gate 0 = 2–3 weeks critical path; Gate 1 = additional 2–4 weeks; full Document 8 Section 11 checklist in project plan format)

**Section 10 — POC-to-Production Gap Reference** *(Readers 1 and 2)*  
Cross-reference table mapping S-01 through S-10 to the Build 3 section that specifies the production replacement. Closes the loop between Build 1/Build 2 and Build 3 explicitly.

---

### Non-Negotiable Requirements (locked)

1. Section 2.5 must name the Tier 1 ML classifier cold-start problem with a defined interim operating state
2. Section 3 must include `cta` two-offer-set and `progressive_disclosure` holdback suppression as explicit "REQUIRED — do not simplify" callouts
3. Section 4.3 must state the 6–10 week commissioning timeline prominently (not in a footnote)
4. Section 5.3 must reproduce canonical `recommended_action` text verbatim with the non-modification requirement explicit
5. Section 8.3 must state GDPR jurisdiction-by-IP (not `tal_region`) as the primary statement, not a note
6. Section 5 must close with a one-page BDR field guide (Miller requirement)
7. Section 10 maps all ten L2-E POC simplifications to their production replacements and Build 3 sections

---

### Format and Versioning (locked)

**Authoring format:** Structured markdown (annotatable, project-repository-compatible for Platform Engineer use).  
**Delivery format:** PDF export for executive delivery.  
**Version:** Build 3 v1.0 corresponds to `kalder_data_model_v0.2.0` and corpus v1.0.  
**Version increment required** on any data model change that affects integration specifications.

---

*End of decisions log. All decisions locked. Next build actions: implement Build 1, Build 2, and Build 3 per specifications above.*
