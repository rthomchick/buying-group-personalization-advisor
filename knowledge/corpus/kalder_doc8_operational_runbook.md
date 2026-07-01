## Section 1: Roles, Accountability, and Navigation

---

### 1.1 Purpose and Scope

Document 8 is the operational runbook for the Kalder Buying Group Personalization Program. It governs the procedures by which content is commissioned, signals are monitored, sales sequences are activated, consent obligations are met, and incidents are resolved. All operational work described in Sections 2 through 12 is executed by the role titles defined in this section. No named individuals appear in Document 8; role titles are the unit of accountability throughout.

The program's operational structure spans five functional areas. Content Operations owns the commissioning lifecycle — from sprint planning through Sanity publication. Marketing Technology owns the platform stack: AEP pipeline configuration, Adobe Target activity management, Marketo connector operation, and Outreach alert configuration. Measurement and Data owns signal monitoring, classification accuracy, and coverage verification. Data and Privacy owns DSR execution, data retention compliance, and consent classification. Sales Activation bridges the program and the field, receiving convergence point alerts and executing the recommended actions the program produces.

Cross-functional decisions — including go-live authorization for new solution categories, incident escalation that crosses functional boundaries, and corpus governance — are the responsibility of the Program Manager. Section 1 is the vocabulary reference for all subsequent sections; when a section names a role, the definition and accountability for that role is found here.

---

### 1.2 Role Inventory and Accountabilities

| Role | Functional Area | Primary Accountabilities |
|---|---|---|
| Program Manager | Cross-functional | Go-live authorization (§11.6); incident escalation lead for cross-functional incidents; corpus governance; new solution category approval |
| Content Ops Lead | Content Operations | Sprint planning and commissioning workflow (§§3–4, 7); coverage gap sprint initiation; Sanity node review queue management and publication |
| Content Strategy Lead | Content Operations | Through-line compliance review (Stage R2, §3.5); post-publication content error assessment (§12.4); escalation point for factual accuracy disputes |
| Platform Engineer | Marketing Technology | AEP pipeline configuration and monitoring; Adobe Target activity management; Sanity-to-Target sync pipeline operation; Kafka pipeline configuration (§§6, 8); connector configurations (§9); incident response lead for pipeline failures (§§12.2, 12.5) |
| Marketing Ops Engineer | Marketing Technology | Marketo connector configuration and enrollment health monitoring (§9); Outreach alert configuration and payload verification (§6); visitor consent state maintenance and geographic suppression (§10); escalation threshold management (§5) |
| Analytics Lead | Measurement and Data | Weekly signal monitoring — Checks 2, 3, 7, and 8 (§5); classification accuracy monitoring and incident lead (§12.3); coverage status verification; threshold calibration (§7) |
| Data Engineer | Data and Privacy | DSR deletion cascade execution (§10.4); data retention compliance monitoring (§10.6); pipeline health investigation support (§§12.2, 12.5) |
| Data Privacy Officer | Privacy and Compliance | DSR intake logging and deletion confirmation record generation (§10.4); consent classification sign-off at onboarding (§11.2) |

**CRM Administrator.** This is a client-side role, not Kalder program staff. This role executes Salesforce-side steps in the DSR deletion cascade (§10.4 Step 4) and assists with Salesforce field configuration at onboarding (§11.2 Item 4). Client organizations must designate a CRM Administrator before program go-live.

---

### 1.3 Escalation Paths

| Escalation Scenario | Primary Contact | Escalate If Unresolved |
|---|---|---|
| Content factual accuracy dispute | Content Ops Lead | Content Strategy Lead |
| Content node error post-publication | Content Ops Lead | Content Strategy Lead → legal representative (if liability) |
| AEP pipeline failure or signal collection failure | Platform Engineer | Data Engineer → AEP platform support |
| Sanity-to-Target sync pipeline failure | Platform Engineer | AEP platform support or Sanity platform support depending on sub-type (§12.5) |
| Classification accuracy drop | Analytics Lead | Data Scientist → Platform Engineer |
| DSR request received | Data Privacy Officer | Program Manager if DSR cannot be completed within SLA |
| Consent incident (visitor consent state misconfiguration or withdrawal gap) | Marketing Ops Engineer | Data Privacy Officer → Platform Engineer |
| Outreach alert payload error | Marketing Ops Engineer | Platform Engineer → Content Ops Lead (if buying moment affected) |
| Sales activation gate population drop | Analytics Lead | Platform Engineer |
| New incident type not covered in §12 | Program Manager | Platform vendor support as applicable |

---

### 1.4 Section-to-Role Quick Reference

| Section | Title | Primary Practitioner(s) |
|---|---|---|
| §2 | CLIENT_ATTRIBUTE_MAP Finalization | Marketing Ops Engineer, Platform Engineer |
| §3 | Diverge Content Commissioning | Content Ops Lead, Platform Engineer |
| §4 | Converge Content Commissioning | Content Ops Lead, Platform Engineer |
| §5 | Weekly Signal Monitoring | Analytics Lead, Marketing Ops Engineer |
| §6 | Sales Activation Workflow | Marketing Ops Engineer, Platform Engineer |
| §7 | Coverage Gap Management | Content Ops Lead, Analytics Lead |
| §8 | `progression_win_now` Cohort Activation | Platform Engineer, Marketing Ops Engineer |
| §9 | AEP → Marketo Connector Configuration | Marketing Ops Engineer |
| §10 | Consent and Suppression Management | Marketing Ops Engineer, Data Engineer, Data Privacy Officer |
| §11 | New Solution Category Onboarding Checklist | Program Manager, Content Ops Lead, Platform Engineer, Marketing Ops Engineer, Data Privacy Officer |
| §12 | Incident Response Procedures | Role varies by incident type — see §12 scenario lead |

---

*End of Section 1. Sections 2–12 contain the operational procedures this section's roles are responsible for executing.*

---

## Section 2: CLIENT_ATTRIBUTE_MAP (§CA) Finalization

> **Document position:** Document 8, Section 2 — first operational output of the Operational Runbook
> **Locking prerequisite for:** Sections 3 (Target activity configuration), 4 (Marketo connector), 5 (Outreach routing), 6 (coverage monitoring), and all subsequent Document 8 sections
> **Depends on:** `kalder_data_model.py` §CA v0.2.0; Documents 2–6 (full corpus)
> **Resolves:** PENDING-SA-3 (primary_solution_interest §CA registration), PENDING-D6-Sync council determination (role_classification_zero_party §CA registration)

---

### 2.1 §CA Purpose and Governance

The `CLIENT_ATTRIBUTE_MAP` (§CA) is the canonical registry of every AEP profile attribute, contact-plane scoring attribute, and content-plane offer catalog field that the Kalder Buying Group Personalization Program reads, writes, or evaluates at runtime. It maps canonical attribute names — used throughout the corpus — to their authoritative type definitions, source pipelines, read mechanisms, and null behaviors.

The registry exists to enforce a single source of truth across a multi-system activation stack (Adobe Experience Platform, Adobe Target, Marketo, Outreach, Salesforce). Each system in that stack reads attributes by name. Without a locked canonical registry, attribute name drift between documents and system configurations produces silent misroutes — Target reads a stale value, Outreach gates on a field that no longer exists, or a new attribute enters production without a defined null behavior.

**Ownership model.** The Marketing Ops engineer is the §CA registry owner. The Data Architect reviews and approves all additions before production use. No attribute enters the registry without both sign-offs.

The three operational governance rules are stated in full in Section 2.5.

---

### 2.2 Complete Finalized Registry

The registry is organized by plane. Within each plane, attributes appear in a structured table. Column definitions:

- **Canonical Attribute Name** — the exact string used in AEP profile fields, Target mbox parameters, and corpus documents. This name is the authoritative reference; any system that uses a different string for the same concept is misconfigured.
- **Type** — the data type of the attribute value.
- **Allowed Values / Range** — the complete enumerated set or numeric range. Values outside this set are invalid and must not be written to AEP.
- **Source Pipeline** — the system and mechanism that writes this attribute to AEP.
- **Adobe Target Read Mechanism** — the exact pattern by which Target reads this attribute at session start.
- **Null / Absent Behavior** — the system behavior when the attribute is null, absent, or unset. This column is mandatory for every attribute that can legally be null.
- **Onboarding Configuration Required** — whether a client-side configuration step is required at onboarding, and what that configuration is.

---

#### 2.2.1 Account-Plane Attributes

Account-plane attributes are stored on the AEP account profile and evaluated once per account. All contacts at a given account share the same account-plane attribute values. These attributes govern TAL eligibility, buying group stage, cohort assignment, and pipeline state.

| Canonical Attribute Name | Type | Allowed Values / Range | Source Pipeline | Adobe Target Read Mechanism | Null / Absent Behavior | Onboarding Configuration Required |
|---|---|---|---|---|---|---|
| `tal_member` | Boolean | `true` / `false` | Salesforce CRM → AEP account profile via Kafka streaming pipeline | Pre-computed AEP audience membership boolean; Target reads audience membership flag, not attribute directly | If absent, visitor is treated as non-TAL; no personalization above Level 5 activates | Yes — client provides Salesforce account field mapping to Kafka pipeline configuration at onboarding |
| `tal_program_status` | Enum (string) | `active_prospect` / `post_sale` / `out_of_program` | AEP pipeline (derived from Salesforce account type via Kafka) | Pre-computed AEP audience membership; audience segment gates downstream experience routing | If null, visitor is treated as `out_of_program`; no personalization above Level 5 activates | Yes — client confirms Salesforce account type values that map to each status tier |
| `tal_upsell_override_active` | Boolean | `true` / `false` | Salesforce via Kafka pipeline or manual override | Pre-computed AEP audience membership boolean | If null, treated as `false`; no upsell experience activates | Yes — client configures Salesforce field that triggers upsell override flag |
| `tal_solution_interest_flags` | Array of strings | Array of solution category keys: `it_operations` / `customer_engagement` / `employee_experience` / `risk_compliance` / `ai_platform` | AEP pipeline (aggregated from behavioral signals across scoring window) | Pre-computed AEP audience membership; Target reads aggregated solution interest as audience membership booleans per solution category | If null or empty array, no solution-specific Level 4 personalization activates; visitor routes to brand-level Level 4 or Level 5 | No — computed by AEP pipeline from behavioral signal aggregation; no client field mapping required |
| `tal_region` | String | Salesforce account region value (client-specific enumeration) | Salesforce account record via Kafka | Pre-computed AEP audience membership; used for geographic campaign segment assignment | If null, regional campaign assignment is skipped; visitor receives non-regional content | Yes — client provides region field name and value enumeration from Salesforce account schema |
| `tal_marquee` | Boolean | `true` / `false` | Salesforce account record via Kafka | Pre-computed AEP audience membership boolean | If null, treated as `false`; standard content inventory allocation applies | Yes — client identifies Salesforce field that designates marquee account tier |
| `tal_open_pipeline` | Boolean | `true` / `false` | Salesforce account record via Kafka | Pre-computed AEP audience membership boolean | If null, treated as `false`; SDR activation eligibility not extended | Yes — client identifies Salesforce field that represents open pipeline status |
| `tal_channel` | Enum (string) | `direct` / `msp` / `partner` | Salesforce account record via Kafka | Pre-computed AEP audience membership; used as routing attribute for Outreach sales activation sequences | If null, channel routing falls back to `direct`; Outreach sequence selection uses direct-channel variant | Yes — client configures Salesforce channel field mapping at onboarding |
| `bg_stage` | Enum (string) | `targeted` / `engaged` / `prioritized` / `qualified` | AEP pipeline (computed from account-level engagement signals and Salesforce opportunity state per Document 3, Section 2) | Pre-computed AEP audience membership boolean per stage value | If null, visitor is treated as `targeted`; minimum personalization depth applies for TAL-identified accounts | No — computed by AEP pipeline from qualifying signal thresholds; no client field mapping required |
| `bg_cohort` | Enum (string) | `education` / `acquisition` / `progression_early_to_mature` / `progression_win_now` | AEP pipeline (computed from `bg_stage`, `sfdc_opportunity_stage`, and account-level signals per Document 3, Section 2) | Pre-computed AEP audience membership boolean per cohort value; Target reads cohort as audience membership, not raw attribute | If null, cohort assignment is pending; account receives `education` treatment until pipeline assigns a cohort value | No — computed by AEP pipeline; no client field mapping required |
| `sfdc_opportunity_created` | Boolean | `true` / `false` | Salesforce CRM via Kafka streaming pipeline (opportunity creation event triggers write) | Pre-computed AEP audience membership boolean | If null, treated as `false`; `qualified` stage assignment is not triggered | Yes — client confirms Salesforce opportunity object name and creation event schema for Kafka pipeline |
| `sfdc_opportunity_stage` | String | Salesforce opportunity stage value (client-specific enumeration; maps to `progression_early_to_mature` or `progression_win_now` cohort) | Salesforce CRM via Kafka streaming pipeline | Pre-computed AEP audience membership; used to differentiate the two progression cohorts at cohort assignment time | If null, all `qualified` accounts are treated as `progression_early_to_mature` until the Kafka `sfdc_opportunity_stage` pipeline is confirmed per Document 8 Section 7. This is the confirmed interim behavior; it remains in effect until Section 7 activates the `progression_win_now` cohort. | Yes — client provides Salesforce opportunity stage field mapping and identifies which stage values correspond to each progression cohort |
| `sfdc_opportunity_stage_stale` | Boolean | `true` / `false` | AEP pipeline (staleness flag; set when `sfdc_opportunity_stage` has not been updated within 24-hour SLA threshold) | Pre-computed AEP audience membership boolean; read as a quality gate before cohort assignment executes | If null, treated as `false`; staleness is not assumed; pipeline continues to use available `sfdc_opportunity_stage` value | No — computed by AEP pipeline from timestamp comparison; no client field mapping required |
| `contact_engagement_event_count_180d` | Integer | 0 to unbounded; qualifying threshold is defined in Document 3, Section 2 stage transition rules | Segment event aggregation (rolling 180-day count of qualifying engagement events, keyed to account) | Pre-computed AEP audience membership; Target does not read raw integer — AEP evaluates threshold condition and writes stage membership | If null or zero, account remains at `targeted` stage; `targeted` → `engaged` transition does not fire | No — Segment event pipeline aggregates events automatically; client configures qualifying event types at Segment implementation |
| `hand_raiser_event` | Boolean | `true` / `false` | Segment event pipeline (set on qualifying hand-raiser event per Document 3, Section 2 trigger conditions) | Pre-computed AEP audience membership boolean | If null, treated as `false`; `engaged` → `prioritized` transition does not fire | No — Segment pipeline sets flag on qualifying event; client configures which event types qualify as hand-raiser at Segment implementation |
| `bg_health_single_eb_elevated` | Boolean | `true` / `false` | AEP pipeline annotation (derived from inspection of contact-plane engagement scores for identified buying group members; set when a single Economic Buyer contact is at HIGH_ENGAGEMENT with no other members at MEDIUM_ENGAGEMENT or above) | Pre-computed AEP audience membership boolean | If null, treated as `false`; no guard rail behavior activates; standard experience applies | No — computed by AEP pipeline from contact-plane engagement scores; no client field mapping required |
| `primary_solution_interest` | String | `it_operations` / `customer_engagement` / `employee_experience` / `risk_compliance` / `ai_platform` / `null` | AEP pipeline (computed from `tal_solution_interest_flags`; ranking logic selects the solution category with the highest aggregate signal weight across a rolling 180-day window aligned with Document 2 decay windows; updated on each scoring run) | Visitor profile attribute lookup at session start; Target reads this attribute from the AEP visitor profile at mbox request time for the `progressive_disclosure` Level 4 activity specifically | If null: (a) `progressive_disclosure` slot falls back to cross-category brand prompt node at Level 4; (b) Level 4 solution-category coverage evaluation falls back to `tal_solution_interest_flags` for account-level coverage selection. Null does not mean no solution interest — it means the ranking computation has not yet run or has not produced a dominant signal. Treat null as uncomputed, not as empty. | No — computed by AEP pipeline from existing `tal_solution_interest_flags` aggregation; no additional client field mapping required |
| `tal_account_type_source` | Enum (string) | `suspect` / `prospect` / `customer` / `customer_via_partner` / `customer_subsidiary` | Salesforce CRM via Kafka streaming pipeline | Not read by Target for experience decisions — pipeline input used by AEP to derive `tal_program_status`; not surfaced as an audience membership boolean | If null, `tal_program_status` computation cannot execute; account remains unclassified; no personalization above Level 5 activates until the field is populated | Yes — client provides Salesforce account type field name and confirms which Salesforce values map to each enum value for the Kafka pipeline configuration |
| `tal_new_logo_eligible` | Boolean | `true` / `false` | Salesforce CRM via Kafka streaming pipeline | Pre-computed AEP audience membership boolean | If null, treated as `false`; acquisition personalization is suppressed; visitor receives standard non-acquisition experience | Yes — client identifies the Salesforce field that designates new logo eligibility and confirms its population logic at onboarding |
| `tal_account_domain` | String | Domain URL string (e.g., `kalder.com`) | Salesforce CRM via Kafka streaming pipeline | Not read by Target — identity resolution input used for Demandbase reverse-IP matching; not surfaced as an audience membership boolean or mbox parameter | If null, Demandbase reverse-IP matching cannot execute for this account; visitor routes to Level 5 until the domain is populated and the identity resolution pipeline can resolve a TAL match | Yes — client confirms which Salesforce field holds the canonical account domain URL; field must contain a resolvable domain string, not a full URL with path |
| `tal_last_refreshed_at` | ISO 8601 timestamp | Valid UTC timestamp string | Kafka pipeline (written on every successful Salesforce CRM sync event) | Not read by Target — staleness monitoring input only; evaluated by operational monitoring layer, not by experience routing | If null, staleness check cannot execute; operational monitoring alert fires; the absence of a refresh timestamp is treated as a data pipeline error, not as a staleness signal | No — written automatically by the Kafka pipeline on every successful sync; no client configuration required beyond initial pipeline setup |
| `solution_category_coverage_status` | Enum (string) per solution category | `below_level_1` / `level_1` / `level_2` / `level_3` (values from COVERAGE_STATUS_HIERARCHY per Document 4, Section 7.2) | Source data originates in Sanity content graph; coverage tracking pipeline writes computed value to AEP account profile per solution category on Sanity webhook trigger per Document 4, Section 8.5. Updated within minutes of any `Content Module` node `status: approved` transition. | Visitor profile attribute lookup at session start; Target reads the AEP account-profile value for the visitor's active solution category to determine coverage eligibility gate | If null for a given solution category, that category is treated as `below_level_1`; `pending_solution_fallback` behavior activates for visitors with interest in that category | No — coverage tracking pipeline updates this attribute automatically via Sanity webhook; no manual client configuration required after initial pipeline setup |

---

#### 2.2.2 Contact-Plane Attributes

Contact-plane attributes are keyed to the `(contact_id, solution_category)` composite key. The same contact may carry independent and simultaneous classification states across multiple solution categories. All contact-plane attributes are evaluated independently per composite key; they do not aggregate or bleed across solution categories.

| Canonical Attribute Name | Type | Allowed Values / Range | Source Pipeline | Adobe Target Read Mechanism | Null / Absent Behavior | Onboarding Configuration Required |
|---|---|---|---|---|---|---|
| `visitor_consent_state` | Enum (string) | `full` / `functional_only` / `declined` | Consent management platform via AEP (consent events are ingested by AEP and written to the visitor profile) | Pre-pipeline gate — evaluated before any signal collection or scoring executes; not a standard mbox parameter; read by the AEP pipeline before any event forwarding to the scoring engine. Evaluated before any other §CA attribute; this is the first gate in the signal pipeline. Document 9 (Privacy and Consent Architecture) governs consent collection implementation; §CA governs the attribute's behavioral consequences in the scoring and activation pipeline. | If null or absent, treat as `declined` — no signal collection, no scoring, Level 5 experience. Do not default to `functional_only` on null. The absence of a consent record is not a permissive state. | Yes — client configures the consent management platform integration and confirms which consent events map to each of the three states (`full`, `functional_only`, `declined`) at onboarding |
| `buying_job_confirmed` | Enum (string) | `problem_identification` / `solution_exploration` / `requirements_building` / `supplier_selection` / `null` | Zero-party declaration via progressive disclosure prompt response; written by Segment event pipeline via AEP Edge Network streaming ingestion | Visitor profile attribute lookup at session start | If null, KNOWN state is not active; scoring falls back to Tier 3 behavioral inference; `buying_job_inferred` governs | No — written by Segment event pipeline on progressive disclosure response; write path is zero-party by definition |
| `buying_job_inferred` | Enum (string) | `problem_identification` / `solution_exploration` / `requirements_building` / `supplier_selection` / `null` | Tier 3 behavioral inference via AEP scoring pipeline (signal weight aggregation per Document 2, Section 7) | Visitor profile attribute lookup at session start | If null, INFERRED state is not active; three-axis content selection falls back to two-axis (no buying job axis); per-module-type deterministic fallback rules apply per Document 5, Section 2.5 | No — computed by AEP scoring pipeline |
| `role_confidence_score` | Integer | 0–100; set to 100 when Tier 1 ML classifier governs | Tier 3 behavioral scoring engine (`§12 SCORING_RULES` in `kalder_data_model.py`) | Visitor profile attribute lookup; used by scoring pipeline; Target does not read raw score — reads `confidence_tier` derived from score | If null, `confidence_tier` defaults to `UNKNOWN`; scoring pipeline has not yet run for this composite key | No — computed by AEP scoring pipeline |
| `role_classification` | Enum (string) | `champion` / `economic_buyer` / `influencer` / `user` / `ratifier` / `default` | Composite: Tier 1 ML classifier, Tier 2 zero-party self-identification, or Tier 3 behavioral scoring per authority adjudication rules in Document 2, Section 9 | Visitor profile attribute lookup at session start | If null or `default`, Level 3 or below applies; role-specific content is not served; `default` is the valid pre-classification value, not an error state | No — computed by AEP scoring pipeline |
| `confidence_tier` | Enum (string) | `HIGH` / `MEDIUM` / `LOW` / `UNKNOWN` | AEP scoring pipeline (`§3 CONFIDENCE_TIERS` tier assignment after full scoring sequence per Document 2, Section 5) | Visitor profile attribute lookup at session start; primary routing input for Target fallback level selection | If null, treated as `UNKNOWN`; Level 3 or below applies; pre-pipeline gate has not yet evaluated this contact | No — computed by AEP scoring pipeline |
| `fallback_level` | Integer | 1 / 2 / 3 / 4 / 5 | AEP scoring pipeline (derived from `confidence_tier` + solution interest signal per Document 2, Section 8.8 routing sequence; real-time recomputation triggered by `role_classification_zero_party` write events for the affected composite key) | Visitor profile attribute lookup at session start; primary Target experience routing input | If null, Target defaults to Level 5 brand experience; scoring pipeline has not yet assigned a fallback level for this composite key | No — computed by AEP scoring pipeline |
| `differential_insufficient` | Boolean | `true` / `false` | AEP scoring pipeline (set when the top-scoring role leads the second-highest-scoring role by fewer than 10 points; score capped at 49 when set; see Document 2, Section 5) | Visitor profile attribute lookup at session start; evaluated as Priority 0 override rule before fallback level routing | If null, treated as `false`; Priority 0 override is not active; standard fallback level routing applies. When `true`: score is capped at 49; Outreach sequence gate fails regardless of `confidence_tier` value; visitor routes to Level 3 experience (solution-category axis only; no role-specific content) per Document 5 Section 1.2 Priority 0 override rule. No further escalation is attempted until signal accumulation resolves the ambiguity. | No — computed by AEP scoring pipeline |
| `classification_mismatch` | Boolean | `true` / `false` | AEP scoring pipeline (set when Tier 1 ML classifier role and Tier 3 behavioral top-scoring role disagree per Document 2, Section 9) | Visitor profile attribute lookup; used by Data Quality monitoring; Target does not evaluate this attribute for experience routing | If null, treated as `false`; no mismatch flag is active; data quality alert does not fire | No — computed by AEP scoring pipeline |
| `solution_category` | String | `it_operations` / `customer_engagement` / `employee_experience` / `risk_compliance` / `ai_platform` | Established at signal collection time by the AEP event pipeline; forms the second component of the `(contact_id, solution_category)` composite key | Component of composite key used in visitor profile attribute lookup; Target reads solution category to select solution-specific content variants | If null, contact-plane classification cannot execute; composite key is not resolvable; visitor routes to account-plane experience (Level 4 or Level 5) | No — established automatically from signal collection event properties |
| `stitching_pending` | Boolean | `true` / `false` | AEP identity resolution pipeline (set during anonymous-to-known contact promotion; transitional state; 24-hour SLA before Data team alert fires) | Visitor profile attribute lookup; when `true`, Target holds prior classification state from anonymous identifier profile and does not apply any new contact-plane classification values until stitching completes | If null, treated as `false`; identity stitching is not in progress; contact-plane attributes are authoritative. When `true`: Target holds prior classification state; a 24-hour SLA applies; if stitching is not complete within 24 hours, the Data team alert fires per Document 8 monitoring configuration | No — set automatically by AEP identity resolution pipeline |
| `holdback_group` | Boolean | `true` / `false` | AEP identity resolution pipeline (set at first TAL identification using deterministic hash assignment; permanent for pre-sale lifecycle; carries forward from anonymous to identified contact on identity stitching) | Visitor profile attribute lookup at session start; evaluated before any personalization or progressive disclosure experience is served | If null, treated as `false` (visitor is not in holdback; receives personalization). When `true`: visitor receives Level 5 default brand experience only; `progressive_disclosure` slot is architecturally suppressed regardless of offer catalog state; sales activation via Outreach is not suppressed; attribute persists post-sale but is not evaluated post-sale. This suppression is an architectural enforcement requirement, not a content convention — Target activity configuration must explicitly suppress the `progressive_disclosure` slot for holdback visitors. | No — set automatically by AEP identity resolution pipeline at TAL identification time |
| `role_classification_zero_party` | String | `champion` / `economic_buyer` / `influencer` / `user` / `ratifier` / `null` | Segment event pipeline via AEP Edge Network streaming ingestion on progressive disclosure prompt response | **Named implementation departure from standard pre-computed audience-membership architecture.** Target reads this attribute via Edge profile attribute lookup at mbox request time for the `progressive_disclosure` activity specifically — not as a pre-computed audience membership boolean. When populated, triggers real-time fallback level recomputation pipeline for the affected `(contact_id, solution_category)` key. | If null, no zero-party role declaration has been received; behavioral classification (`role_classification`) governs. Write path is consent-appropriate — zero-party declaration is explicit by definition; no consent gate check is required beyond the visitor's act of responding to the progressive disclosure prompt. | No — written by Segment event pipeline on progressive disclosure prompt response; no client configuration beyond Segment event schema alignment |

---

#### 2.2.3 Content-Plane Attributes

Content-plane attributes are fields on Sanity CMS content nodes — specifically `Asset` nodes and `Content Module` nodes. They are read by Adobe Target from the offer catalog at activity resolution time. They are **not** visitor profile attributes and are **not** stored in AEP. All entries in this table are read exclusively from the offer catalog; there are no exceptions. Do not configure these as AEP profile attributes; doing so would create a misconfiguration that Target cannot resolve against the offer catalog.

| Canonical Attribute Name | Type | Allowed Values / Range | Source Pipeline | Adobe Target Read Mechanism | Null / Absent Behavior | Onboarding Configuration Required |
|---|---|---|---|---|---|---|
| `confidence_tier_minimum` | Enum (string) | `HIGH` / `MEDIUM` / `LOW` / `UNKNOWN` | Set by human reviewer at Stage R3 of the Document 4 commissioning workflow; stored as a field on the Sanity `Content Module` node and `Asset` node | **Read from the offer catalog field, not from the visitor AEP profile.** Target reads `confidence_tier_minimum` from the Sanity offer catalog entry at activity resolution time and applies it as a content eligibility gate. Mapping to fallback level: `HIGH` → Level 1 only; `MEDIUM` → Levels 1–2; `LOW` → Levels 1–3; `UNKNOWN` → all levels (1–5). | If null on an `Asset` or `Content Module` node, the content node is ineligible for serving until `confidence_tier_minimum` is set by a human reviewer. A null `confidence_tier_minimum` is not a default-to-all-levels state; it is a commissioning-incomplete state. | Yes — client configures the Sanity field schema to include `confidence_tier_minimum` as a required field on `Content Module` and `Asset` node types; reviewer training must include the four allowed values and their fallback-level mappings |

---

### 2.3 Net-New Additions Summary

The following table is the audit trail for every attribute flagged across Documents 2–6 and the PENDING-D6-Sync council determination. Every flagged attribute is accounted for: either registered in §CA Section 2.2 above, confirmed as already present in the baseline, or designated as excluded per Section 2.4.

| Attribute | Flagged In | Document 8 §CA Entry Status |
|---|---|---|
| `bg_cohort` | Document 3, §2 Data Model Update Note | Registered — Account-Plane (Section 2.2.1) |
| `sfdc_opportunity_created` | Document 3, §2 Data Model Update Note | Registered — Account-Plane (Section 2.2.1) |
| `sfdc_opportunity_stage` | Document 3, §2 Data Model Update Note | Registered — Account-Plane (Section 2.2.1) |
| `sfdc_opportunity_stage_stale` | Document 3, §2 Data Model Update Note | Registered — Account-Plane (Section 2.2.1) |
| `contact_engagement_event_count_180d` | Document 3, §2 Data Model Update Note | Registered — Account-Plane (Section 2.2.1) |
| `hand_raiser_event` | Document 3, §2 Data Model Update Note | Registered — Account-Plane (Section 2.2.1) |
| `bg_health_single_eb_elevated` | Document 3, §2 Data Model Update Note | Registered — Account-Plane (Section 2.2.1) |
| `stitching_pending` | Document 3, §5.5 Failure Mode 1 | Registered — Contact-Plane (Section 2.2.2) |
| `multi_match_unresolved` | Document 3, §5.5 Failure Mode 2 | Excluded — see Section 2.4 |
| `holdback_group` | Document 5, §7.4 [CA FLAG] | Registered — Contact-Plane (Section 2.2.2) |
| `confidence_tier_minimum` | Document 4, §1 [CA FLAG] and §3.3 | Registered — Content-Plane (Section 2.2.3) |
| `solution_category_coverage_status` | Document 4, §1 [CA FLAG] | Registered — Account-Plane (Section 2.2.1); relocated from Section 2.2.3 per Revision 3 |
| `primary_solution_interest` | Document 6, §3; PENDING-SA-3 | Registered — Account-Plane (Section 2.2.1) |
| `role_classification_zero_party` | PENDING-D6-Sync council determination | Registered — Contact-Plane (Section 2.2.2) |
| `tal_account_type_source` | Document 3, §1.2 TAL data contract table | Registered — Account-Plane (Section 2.2.1) |
| `tal_new_logo_eligible` | Document 3, §1.2 TAL data contract table | Registered — Account-Plane (Section 2.2.1) |
| `tal_account_domain` | Document 3, §1.2 TAL data contract table | Registered — Account-Plane (Section 2.2.1) |
| `tal_last_refreshed_at` | Document 3, §1.2 TAL data contract table | Registered — Account-Plane (Section 2.2.1) |
| `tal_member` | Document 3, §3.1 account-plane table | Registered — Account-Plane (Section 2.2.1) |
| `tal_program_status` | Document 3, §3.1 account-plane table | Registered — Account-Plane (Section 2.2.1) |
| `tal_upsell_override_active` | Document 3, §3.1 account-plane table | Registered — Account-Plane (Section 2.2.1) |
| `tal_solution_interest_flags` | Document 3, §3.1 account-plane table | Registered — Account-Plane (Section 2.2.1) |
| `tal_region` | Document 3, §3.1 account-plane table | Registered — Account-Plane (Section 2.2.1) |
| `tal_marquee` | Document 3, §3.1 account-plane table | Registered — Account-Plane (Section 2.2.1) |
| `tal_open_pipeline` | Document 3, §3.1 account-plane table | Registered — Account-Plane (Section 2.2.1) |
| `tal_channel` | Document 3, §3.1 account-plane table | Registered — Account-Plane (Section 2.2.1) |
| `differential_insufficient` | Document 3, §3.1 contact-plane table | Registered — Contact-Plane (Section 2.2.2) |
| `fallback_level` | Document 3, §3.1 contact-plane table | Registered — Contact-Plane (Section 2.2.2) |
| `classification_mismatch` | Document 3, §3.1 contact-plane table | Registered — Contact-Plane (Section 2.2.2) |
| `solution_category` | Document 3, §3.1 contact-plane table | Registered — Contact-Plane (Section 2.2.2) |
| `buying_job_confirmed` | Existing §CA baseline; Document 2, §7 | Confirmed — Contact-Plane (Section 2.2.2); no change to specification |
| `buying_job_inferred` | Existing §CA baseline; Document 2, §7 | Confirmed — Contact-Plane (Section 2.2.2); no change to specification |
| `role_confidence_score` | Existing §CA baseline | Confirmed — Contact-Plane (Section 2.2.2); no change to specification |
| `bg_stage` | Existing §CA baseline; Document 3, §2 | Confirmed — Account-Plane (Section 2.2.1); no change to specification |
| `role_classification` | Existing §CA baseline | Confirmed — Contact-Plane (Section 2.2.2); no change to specification |
| `confidence_tier` | Existing §CA baseline | Confirmed — Contact-Plane (Section 2.2.2); no change to specification |
| `visitor_consent_state` | Existing §CA baseline | Registered as full row entry — Contact-Plane (Section 2.2.2); specification expanded from baseline to include complete seven-column entry per Revision 2 |

---

### 2.4 Attributes Not Requiring §CA Registration

The following attributes were flagged in upstream documents or evaluated during the council determination process but are excluded from §CA registration. Exclusion is not a demotion — these attributes exist and are used. The exclusion means they are not read by Adobe Target, Marketo, Outreach, or any activation channel as profile attributes, and therefore do not require the canonical registration and governance overhead that §CA provides.

**`jtbd_ref`** — Sanity internal reference field on `Content Module` nodes linking to the associated buying job record in the Sanity content graph. This is a Sanity-internal relational key, not an AEP profile attribute. Target reads the resolved buying job framing from the offer catalog, not the raw reference field. No §CA entry required; governed by Document 4 content graph schema.

**`multi_match_unresolved`** — AEP identity resolution pipeline internal diagnostic flag. Set when an anonymous identifier resolves to multiple CRM contact records and resolution criteria are insufficient to produce a single authoritative stitch. This flag is not read by Target, Marketo, Outreach, or Salesforce for experience or activation decisions. It is a pipeline health signal read exclusively by the operational monitoring layer. It will be documented in Document 8 Section 6 (coverage monitoring) as a monitoring attribute, but it carries no downstream channel activation implication and does not require §CA registration. Council determination: exclude from §CA; document in Section 6 monitoring inventory.

**`narrative_ref`** — Sanity internal reference field on `Content Module` nodes linking to the associated `Narrative` node in the content graph. Same exclusion rationale as `jtbd_ref`: Sanity-internal relational key, not an AEP profile attribute. No §CA entry required; governed by Document 4 content graph schema and Document 4 Section 4 Through-Line Requirement.

**`buying_job_confirmed` and `buying_job_inferred` (re-registration exclusion)** — Both attributes are present in the pre-existing §CA baseline and confirmed in Section 2.2.2 above. They are not re-registered as net-new entries. The Section 2.3 audit trail records them as Confirmed, not as new additions.

---

### 2.5 §CA Governance Rules

The following three rules govern post-lock additions, conflict resolution, and amendment procedures. They are stated in full operational language with the responsible role named for each required action.

**Rule 1 — Pre-activation registration requirement.** No attribute may be referenced in Adobe Target activity configuration, Marketo audience definitions, Outreach routing rules, or Salesforce integration mappings without a valid §CA entry. Before any platform engineer configures an attribute-based rule in any activation system, the Marketing Ops engineer must confirm that the attribute appears in the §CA registry with a complete entry across all seven columns in the applicable plane table. If the attribute is not present in the registry, the engineer must stop and initiate the §CA amendment process described in Rule 3. Proceeding with an unregistered attribute is a governance violation; the resulting configuration is invalid regardless of whether it functions technically.

**Rule 2 — §CA governs conflicts.** If a discrepancy exists between the §CA entry for an attribute and the configuration of that attribute in any activation system — including the attribute type, allowed values, null behavior, or read mechanism — the §CA entry is authoritative. The activation system configuration must be corrected to match the §CA entry. The Marketing Ops engineer is responsible for identifying and correcting such discrepancies upon detection. The Data Architect must review any correction that changes the type, allowed values, or read mechanism of an attribute to confirm the correction is consistent with upstream source pipeline behavior before the corrected configuration is promoted to production.

**Rule 3 — Post-lock amendment procedure.** New attributes identified after Section 2 locks may not be added to §CA informally. The Marketing Ops engineer must author a §CA amendment that provides a complete seven-column entry for the candidate attribute across the applicable plane table, specifies the upstream source document or pipeline change that requires the new attribute, and confirms the attribute name does not conflict with any existing §CA entry. The Data Architect must review and approve the amendment before the attribute is registered. After Data Architect approval, the Marketing Ops engineer publishes the amendment as a versioned §CA update and notifies all teams operating activation systems that depend on §CA. No system may read or write the new attribute in production until the amendment is published and distributed.

---

*End of Section 2. §CA is now locked. All subsequent Document 8 sections may reference §CA attributes. No attribute may be added to §CA after this section locks without a formal amendment reviewed by the Marketing Ops engineer and Data Architect.*

---

## Section 3: Diverge Content Commissioning Workflow

> **Document position:** Document 8, Section 3 — first workflow section of the Operational Runbook
> **Depends on:** §CA (Section 2, locked); Document 4 Sections 8.1–8.6 (commissioning workflow specification); Document 5 Section 3.11 (progressive_disclosure level activation); Document 6 Section 3 (progressive disclosure UX specification)
> **Audience:** Content Ops Lead / Content Strategist (sprint planning, generation context assembly, review queue management, Sanity publication); Platform Engineer (Sanity-to-Target sync pipeline configuration, catalog integrity validation, Edge write architecture)
> **Resolves:** D8-Flag-02 (Sanity webhook trigger), D8-Flag-04 (phase: converge enforcement — sync pipeline), D8-Flag-05 (GROQ validation performance), D8-Flag-07 (progressive_disclosure commissioning unblocked), D8-Flag-08 (recommended source modules for converge content), D8-Flag-10 (long-form vs. short-form track), D8-Flag-11 (confidence_tier_minimum human reviewer assignment)

---

### 3.1 Section Overview

This section specifies the end-to-end operational workflow for commissioning diverge-phase content nodes: `Content Module` nodes (all module types, including `progressive_disclosure`), `Narrative` nodes, `Audience` nodes, `JTBD` nodes, `Proof` nodes, and `Asset` nodes. It covers the four phases of the commissioning lifecycle — Phase 1: Generate, Phase 2: Review, Phase 3: Approve, Phase 4: Publish/Sync — along with prerequisite gates, sprint planning conventions, platform engineering configuration requirements, and sprint closure procedures.

**What this section does not cover.** Converge-phase nodes (`consensus_brief`, `executive_brief`) follow a variant workflow specified in Section 4. `Channel` nodes are configured once at program setup and are not subject to routine commissioning. Buying group concepts, role definitions, and stage transitions are defined in Documents 1–3 and are not reproduced here.

**Practitioners.** Two practitioners jointly operate this workflow. The Content Ops Lead / Content Strategist runs commissioning sprints, assembles generation contexts, operates Kalder Compose, manages the review queue, and owns Sanity publication. The Platform Engineer configures and maintains the Sanity-to-Target sync pipeline, validates offer catalog integrity, implements the `role_classification_zero_party` Edge write architecture, and confirms the `fallback_level` recomputation trigger. Every step in this section identifies the responsible practitioner.

---

### 3.2 Sprint Planning

**Responsibility: Content Ops Lead**

A commissioning sprint targets one or more `(solution_category, role, buying_stage)` tuples to advance coverage toward the next threshold defined in Document 4 Section 7. Sprint planning begins with a coverage gap query and concludes with a locked node list before any generation work begins.

1. Query the Sanity operational dashboard for the current `coverage_status` per `(solution_category, role, buying_stage)` tuple across all active solution categories.
2. Identify tuples where `coverage_status` is below the next activation threshold — the gap summary produced by the Document 4 Section 7.4 escalation pipeline provides this in commissioning-ready format. If no alert has fired, run the gap query directly against Sanity.
3. Prioritize tuples using the sequencing guidance in Document 4 Section 7.5: `customer_engagement` and `employee_experience` carry High priority; `risk_compliance` and `ai_platform` carry Medium. Within a solution category, prioritize `(role, buying_stage)` pairs whose gap blocks the coverage level gate for the largest number of missing module types.
4. For each targeted tuple, confirm which module types are missing: `hero`, `benefits`, `cta`, `problem_framing`, `narrative` (module slot), `proof`, `use_cases`, `outcomes`, `trust_signals`, `gated_assets`, and `progressive_disclosure` where applicable.
5. Assemble the node list for the sprint: a complete enumeration of `(solution_category, role, buying_stage, module_type)` combinations to be commissioned. This list is the sprint scope contract — no node outside this list is commissioned during the sprint without explicit scope change.
6. Confirm the sprint node list with the Platform Engineer before generation begins. The Platform Engineer needs advance notice to prepare for the sync pipeline volume the sprint will produce at approval time.

---

### 3.3 Phase 1 Prerequisite Checks

**Responsibility: Content Ops Lead (with Platform Engineer confirmation on prerequisite 3)**

Before invoking Kalder Compose for any `Content Module` node, the following four prerequisite gates must pass in order. Each gate is a binary check with a defined routing outcome on failure. The first failed gate routes the workflow to the appropriate foundational node commissioning path; gates below a failed gate are not evaluated.

> **GATE 0 DELAY — Required reading before sprint planning begins**
> Gate 0 prerequisites — authoring and approving the four `Narrative` nodes and five `Audience` nodes for a new solution category — require approximately **two to three weeks** before `Content Module` commissioning can begin. Kalder Compose generation for `Content Module` nodes cannot begin in parallel with `Narrative` node authoring. New solution category onboarding plans must account for this gate delay at the start of the commissioning sequence. A sprint plan that schedules `Content Module` generation in week 1 of a new solution category launch will fail at Gate 1.

1. **Gate 1 — `Narrative` node prerequisite.** Confirm that an approved `Narrative` node exists for the `(solution_category, buying_stage)` pair targeted by the `Content Module` being commissioned. Query Sanity: `_type == "narrative" && solution_category == [target] && buying_stage == [target] && status == "approved"`. If no approved `Narrative` node is found, route to `Narrative` node commissioning (Document 4, Section 8.3.1) before proceeding.

   > **BLOCKING CONDITION**
   > If the governing `Narrative` node is in `status: under_review`, `Content Module` commissioning for this `(solution_category, buying_stage)` pair is blocked. Do not proceed until the `Narrative` node returns to `status: approved`.

2. **Gate 2 — `Audience` node prerequisite.** Confirm that an approved `Audience` node exists for the `(solution_category, role)` pair. `Audience` node authoring is human-authored; if not present, route to `Audience` node authoring first. Expected time: one to two days per solution category for all five roles.

3. **Gate 3 — `JTBD` node prerequisite.** For `Content Module` nodes of module types where `jtbd_ref` is required (module types with `buying_job` in `intended_axes` per Document 4, Section 5), confirm that an approved `JTBD` node exists for the target `jtbd_code` and `solution_category`. If not present, route to `JTBD` node commissioning first. The Platform Engineer must confirm that the `JTBD` node's `solution_category` field matches the target `Content Module`'s `solution_category` — this is the cross-document integrity check that GROQ validation Function 2 will enforce at approval time.

4. **Gate 4 — `supporting_claims` seeding prerequisite.** Confirm that the governing `Narrative` node's `supporting_claims` array contains at least five entries. If fewer than five entries are present, invoke Kalder Compose in `supporting_claims` seeding mode: Compose generates a candidate pool of 8–12 role-differentiated supporting claims derived from the `Narrative` node's `solution_claim` and `message_pillar`. The Content Ops Lead reviews the pool, curates it to a minimum of five entries, and updates the `Narrative` node's `supporting_claims` array before returning to `Content Module` generation.

---

### 3.4 Phase 1: Generate

**Responsibility: Content Ops Lead**

After all four prerequisite gates pass, Kalder Compose is invoked to generate a draft node.

1. Open the Kalder Compose generation interface and select the target `(solution_category, role, buying_stage, module_type)` combination from the sprint node list.
2. Confirm the generation context is correctly assembled. Compose pre-populates the context from the approved parent nodes; the Content Ops Lead verifies: `module_type`, `role`, `solution_category`, `buying_stage`, `jtbd_code` (if applicable per Document 4, Section 5 `intended_axes`), the governing `Narrative` node's `solution_claim`, `message_pillar`, and `supporting_claims` array. The `supporting_claims` array is the permitted secondary claim pool; Compose is instructed to draw from it and not introduce claims outside it.
3. If `jtbd_code` is applicable for this module type, confirm it is populated in the generation context before invoking Compose. An absent `jtbd_code` for a module type that requires `jtbd_ref` will produce a draft that will fail GROQ validation Function 2 at approval time.
4. Invoke Compose. Compose outputs a draft `content_body` and populates the following fields in the Sanity draft record: `module_type`, `role`, `solution_category`, `buying_stage`, `phase`, `narrative_ref`, `jtbd_ref` (if applicable), `label`, `content_body`.
5. Confirm that three fields remain unpopulated in the Sanity draft record — these require human reviewer judgment during Phase 2 and must not be populated by Compose: `confidence_tier_minimum`, `proof_refs`, `asset_refs`.
6. Save the node. Sanity sets `status: draft` on save. The node enters the review queue.

---

### 3.5 Phase 2: Review

**Responsibility: Content Ops Lead (all stages)**

Review stages are applied as a named, ordered sequence. Each stage produces a binary outcome: pass or return to draft. A node that fails any stage returns to `status: draft`; the failure reason is recorded in the review log before the reviewer advances to the next node in the queue.

The review queue surfaces each node's `module_type` so the reviewer can identify the applicable track before beginning:

| Module Type | Review Track | Stages Applied |
|---|---|---|
| All types except `cta` and `problem_framing` | Long-form | R1 → R2 → R3 → R4 (sequential) |
| `cta` | Short-form | Combined R2/R4 → R3 |
| `problem_framing` | Short-form | Combined R2/R4 → R3 |

**Stage R1 — Factual accuracy review** *(long-form track only)*

Does the `content_body` contain any claim that cannot be substantiated by the referenced `Narrative` node's `solution_claim`, `message_pillar`, `supporting_claims`, or a linked `Proof` node? Claims of the form "reduces time-to-deployment by X%" or "achieves Y metric within Z months" must trace to a specific `Proof` node or a `supporting_claims` entry. Unsubstantiated quantitative claims return the node to `status: draft`. The reviewer flags the specific claim and the required substantiation source in the review log.

**Supporting claims empty-array condition.** If the referenced `Narrative` node's `supporting_claims` array is empty at the time of R1 review, the reviewer applies the without-extension constraint: the `content_body` may include claims that directly instantiate the `solution_claim` or `message_pillar` in more specific or role-contextualized language, but may not introduce capability dimensions not present in `solution_claim` or `message_pillar`. The reviewer flags the `Narrative` node for `supporting_claims` expansion and records the condition in the review log before advancing the module.

**Stage R2 — Through-line review** *(both tracks; combined with R4 for short-form)*

Two checklist items:

1. Claim inventory check. Does the `content_body` introduce any claim not derivable from the referenced `Narrative` node's `solution_claim`, `message_pillar`, or `supporting_claims` array? If yes, the unapproved claim must either be removed from `content_body` or escalated to the Content Ops Lead as a candidate for addition to the `Narrative` node's `supporting_claims` array. The node returns to `status: draft` in either case until the claim is resolved.
2. One-sentence compatibility test. If a Champion and an Economic Buyer each read their respective `Content Module` nodes for the same `(solution_category, buying_stage)` pair and described Kalder's core capability to a third party in one sentence, would their sentences be compatible? The reviewer must be able to write two such sentences — one for the module under review and one for the corresponding role-opposite module — and confirm compatibility. Incompatible framing returns the node to `status: draft`.

**Stage R3 — Tagging completeness review** *(both tracks)*

The reviewer performs three tasks at this stage:

1. Confirm that all Compose-populated tag fields are correct: `role`, `solution_category`, `buying_stage`, `jtbd_code` (if applicable), `phase` (`diverge` for modules intended for Adobe Target serving; `converge` for Champion distribution). If any Compose-populated value is incorrect, return to `status: draft` for correction.

2. Assign `confidence_tier_minimum`. This is a human reviewer assignment — Compose does not populate this field. Apply the following decision rule:

   - **`HIGH`** — The module has strong role-specificity claims and is appropriate only for visitors at HIGH confidence. The content would be presumptuous or confusing to a visitor who has not committed to that role.
   - **`MEDIUM`** — The module is appropriate for visitors who have indicated solution interest but whose role is not fully confirmed. The content is role-appropriate but does not assume commitment.
   - **`LOW`** — The module is appropriate for any TAL-identified visitor with solution interest, regardless of confidence depth.
   - **`UNKNOWN`** — The module is appropriate for any visitor at any classification state, including unidentified. Use for brand-default and Level 4 content.

   > **ENFORCEMENT — confidence_tier_minimum null is not a valid exit state from R3**
   > A node may not advance to `status: approved` with a null `confidence_tier_minimum` field. The reviewer must assign one of the four values before approval proceeds. A null value at approval time is a Sanity schema error that will block the approval transition. If the reviewer is uncertain which value applies, the default escalation path is to the Content Ops Lead for determination before the node advances.

3. Populate `proof_refs` and `asset_refs` if applicable. Link the `Proof` nodes and `Asset` nodes that substantiate or accompany this `Content Module`. These linkages are the reviewer's responsibility; Compose does not populate them.

**Legal review branch — `Proof` nodes with `proof_type: customer_reference`**

When a `Proof` node with `proof_type: customer_reference` is required by a `Content Module` under review, the following four-step procedure applies:

1. The `Proof` node enters `status: under_review` pending legal review. The Content Ops Lead notifies the legal team and records the pending status in the review log.
2. The `Content Module` that would reference this `Proof` node proceeds through R3 and the full review sequence to `status: approved` with `proof_refs` omitted for this specific `Proof` node. The module is not held pending legal completion.
3. When legal review completes and the `Proof` node enters `status: approved`, the Content Ops Lead updates the relevant `Content Module` nodes to add the `proof_ref` reference. Each updated `Content Module` re-enters `status: under_review` for targeted R3 review only — the R3 review confirms the reference is correctly linked and the `content_body` accurately reflects the proof claim. R1, R2, and R4 are not re-applied.
4. Each re-approved `Content Module` triggers a new Publish/Sync event that updates the Target offer catalog entry for that node. The Platform Engineer confirms the catalog update reflects the added `proof_ref`.

**Stage R4 — Brand voice review** *(both tracks; combined with R2 for short-form)*

Standard editorial quality check: grammar, tone, brand vocabulary. This stage does not overlap with or substitute for R1 or R2. A module may fail R4 after passing R1 and R2; passing R4 does not imply R1 or R2 have been applied. Short-form modules apply R4 in the same pass as R2.

---

### 3.6 Phase 3: Approve

**Responsibility: Content Ops Lead (approval action); Sanity (automated validation)**

After all review stages applicable to the module's track pass, the Content Ops Lead advances the node from `status: under_review` to `status: approved` in Sanity. The approval transition triggers three automated GROQ cross-document validation functions. If any function fails, the approval transition is blocked and the node returns to `status: under_review`.

1. **Function 1 — `Narrative` status check.** Queries the referenced `Narrative` document's `status` field. If not `approved`, blocks the transition. Error: "Narrative node [id] is not in status: approved. Content Module approval blocked."
2. **Function 2 — `JTBD` solution category match.** If `jtbd_ref` is present, queries the referenced `JTBD` document's `solution_category` field. If it does not match the `Content Module`'s `solution_category`, blocks the transition. Error: "JTBD node [id] solution_category [value] does not match Content Module solution_category [value]. Content Module approval blocked."
3. **Function 3 — `Narrative` scope check.** Queries the referenced `Narrative` document's `solution_category` and `buying_stage` fields. If either does not match the `Content Module`'s corresponding fields, blocks the transition. Error: "Narrative node [id] scope mismatch on [field]. Content Module approval blocked."

> **PERFORMANCE REQUIREMENT — D8-Flag-05**
> All three validation functions are implemented as GROQ cross-document queries and must be tested under realistic load before production commissioning begins. Testing procedure: run a simulation of 10 simultaneous `status: approved` transitions on `Content Module` nodes with varied `narrative_ref` and `jtbd_ref` references and measure end-to-end validation time per node. If any function exceeds 2 seconds per node at 10 concurrent publications, the GROQ query must be optimized (index hints, projection narrowing) before production deployment. The Platform Engineer owns this test; results must be documented before the content graph is opened for production commissioning. This requirement resolves D8-Flag-05.

Node enters `status: approved` on passing all three validation checks.

---

### 3.7 Phase 4: Publish/Sync

**Responsibility: Platform Engineer (pipeline implementation and integrity monitoring); Sanity (event emission)**

On every `status: approved` transition, Sanity emits an event. The sync pipeline processes this event and executes two operations: offer catalog write and coverage status recomputation.

**Offer catalog write.** The pipeline writes the following fields from the approved node to the Adobe Target offer catalog:

| Field Written to Catalog | Source |
|---|---|
| `module_type` | Direct from Sanity node |
| `role` | Direct from Sanity node |
| `solution_category` | Direct from Sanity node |
| `buying_stage` | Direct from Sanity node |
| `phase` | Direct from Sanity node |
| `confidence_tier_minimum` | Direct from Sanity node |
| `jtbd_code` | Derived: if `jtbd_ref` is present, resolved from the referenced `JTBD` node's `jtbd_code` string field; null if `jtbd_ref` is absent |
| `fallback_level` | Derived: `HIGH` → Level 1; `MEDIUM` → Levels 1–2; `LOW` → Levels 1–3; `UNKNOWN` → all levels (1–5) |

**`phase: converge` pre-write exclusion check (D8-Flag-04).** Before writing any node to the Target offer catalog, the pipeline evaluates the node's `phase` field. If `phase: converge`, the node is excluded from the offer write and the following log entry is created: `"Node [id] excluded from Target offer catalog: phase: converge."` This check is synchronous and executes before any offer write, regardless of how the node's `Experience` node relationships are configured.

> **ENFORCEMENT CONFIRMATION — phase: converge exclusion**
> The `phase: converge` pre-write check is enforced by the sync pipeline, not by Target activity configuration. This is a single-point enforcement: the sync pipeline is the sole mechanism. No Target activity rule is required to duplicate it. A future pipeline change that removes the pre-write check is the only way this exclusion can be breached — which is why weekly catalog integrity audits (below) are required. This is a permanent operational dependency, not a launch gate: it does not resolve after go-live, it recurs for the life of the program. If the weekly audit is not performed, a breach of the pre-write check would go undetected, and diverge-only Content Module nodes carrying phase: converge could be served to converge-stage accounts without detection (Commissioning Step 11). This design resolves D8-Flag-04.

**Coverage status recomputation.** The same `status: approved` event triggers the coverage tracking pipeline (Document 4, Section 8.5 — D8-Flag-02). The pipeline:

1. Identifies the `(solution_category, role, buying_stage)` tuple of the transitioning node.
2. Queries Sanity for the current `status: approved` node count per module type for that tuple (`phase: diverge` nodes only).
3. Evaluates the tuple against Document 4, Section 7.3 thresholds.
4. Writes the computed `coverage_status` back to the tuple's coverage tracking record in Sanity.
5. Rolls up to the solution-category-level effective `coverage_status` per the `COVERAGE_STATUS_HIERARCHY` minimum-rank rule.
6. Writes the solution-category effective `coverage_status` to the `solution_category_coverage_status` AEP attribute (§CA, Section 2.2.1).

**Weekly catalog integrity audit.** The Platform Engineer runs a weekly query against the Target offer catalog for any offer where `phase = converge`. Any result is a pipeline misconfiguration requiring immediate investigation and root-cause documentation. The investigation must identify which sync pipeline event produced the converge node write and whether the pre-write check was bypassed or misconfigured. Root-cause documentation is filed before the next commissioning sprint begins.

---

### 3.8 Progressive Disclosure Response Write Architecture

**Responsibility: Platform Engineer (implementation and testing)**

The `progressive_disclosure` module type requires a platform-side implementation that differs from all other module types. This section specifies the three components of that implementation. Section 3.9 specifies the content commissioning requirements for `progressive_disclosure` nodes specifically.

> **IMPLEMENTATION DEPARTURE — Edge Profile Attribute Read for `role_classification_zero_party`**
> This is the only §CA attribute that Target reads via Edge profile attribute lookup. All other §CA attributes are read via pre-computed AEP audience membership. Platform Engineers who configure the `progressive_disclosure` Target activity using the standard audience-membership pattern will silently fail to reflect zero-party declarations within the session. The departure is named in §CA (Section 2.2.2) and must be implemented as specified below.

**3.8.1 — Edge Write**

When a visitor responds to a `progressive_disclosure` prompt, the selected role key must be written to `role_classification_zero_party` (§CA, Section 2.2.2) via the Segment event pipeline through AEP Edge Network streaming ingestion.

1. Configure the Segment event that fires on `progressive_disclosure` prompt response to include the `role_key` selected by the visitor as the payload field that maps to `role_classification_zero_party`.
2. Configure the AEP Edge Network streaming ingestion rule to receive this event and write the `role_key` value to the `role_classification_zero_party` field on the visitor's contact-plane profile.
3. Confirm the write path does not require a consent gate check beyond the visitor's act of responding to the prompt. Zero-party declaration is explicit consent by definition.
4. Confirm the write executes synchronously within the page session — the same Segment event that fires on prompt response must complete the Edge write before the visitor navigates to the next page. This is the synchronous write requirement from Document 6, Section 3.3.

**3.8.2 — `fallback_level` Recomputation Trigger**

A write to `role_classification_zero_party` triggers real-time `fallback_level` recomputation for the affected `(contact_id, solution_category)` key. The Platform Engineer must implement and confirm this trigger before the `progressive_disclosure` Target activity is promoted to production.

1. Configure the AEP Edge pipeline to evaluate `role_classification_zero_party` writes as Tier 2 zero-party classification events, initiating the Tier 2 classification path per Document 2, Section 9.4.
2. Confirm that the recomputed `fallback_level` value is available to Target at the next page navigation. The visitor's experience at the next page must reflect the updated classification — not the pre-response classification.
3. Confirm that the recomputation pipeline handles the composite key correctly: the write to `role_classification_zero_party` affects only the `(contact_id, solution_category)` key where the prompt was served. It does not affect classification for other solution categories.

> **REQUIRED PRE-LAUNCH CONFIRMATION — fallback_level recomputation trigger**
> The Platform Engineer must confirm the `fallback_level` recomputation trigger is implemented and tested before the `progressive_disclosure` activity is promoted to production. If the trigger cannot be implemented within a single page-navigation window, the maximum latency must be documented in the platform configuration notes before go-live. Untested recomputation trigger is a launch blocker.

**3.8.3 — Transitional State Handling**

Between the moment the visitor submits a `progressive_disclosure` response and the moment the `fallback_level` recomputation completes and is available to Target, the visitor's profile is in a transitional state.

1. During the transitional window, Target continues to serve the visitor's pre-response experience. This is the correct behavior — do not implement a "hold" that suppresses content during the recomputation window.
2. Apply the round-up-on-ambiguity rule: if the recomputation pipeline encounters an edge condition where the new `role_classification_zero_party` value produces a `fallback_level` that is ambiguous between two levels (for example, behavioral signals disagree with the zero-party declaration), resolve to the higher-confidence level. The Tier 2 authority (zero-party declaration) takes precedence over Tier 3 (behavioral inference) per Document 2, Section 9 authority adjudication rules.
3. Log the transitional state event with `contact_id`, `solution_category`, `pre_response_fallback_level`, and `post_recomputation_fallback_level` for audit trail purposes.

---

### 3.9 Module-Type-Specific Commissioning Notes

**Responsibility: Content Ops Lead (content commissioning); Platform Engineer (activity configuration)**

The following notes apply to module types with commissioning requirements that differ from or extend the standard workflow. Module type specifications — `intended_axes`, fallback behavior per level, and `confidence_tier_minimum` conventions — are defined in Document 4, Section 5. Per-module-type Target serving behavior is specified in Document 5, Section 3. These are not reproduced here.

| Module Type | Special Handling Required |
|---|---|
| `progressive_disclosure` | Level 1 suppression (Platform Engineer); cross-category brand prompt node (Content Ops Lead); Edge write architecture (Section 3.8) |
| `cta` | Short-form review track; four nodes per `buying_job` value at Level 1; `jtbd_ref` required for all four |
| `gated_assets` | Minimum five approved `Asset` nodes per `(solution_category, role, buying_stage)` for Level 1; `Asset` nodes commissioned separately |
| `proof` | `proof_type: customer_reference` triggers legal review branch (Section 3.5); `proof_type: quantitative_outcome` and `peer_case` may use Compose assist |
| `problem_framing` | Short-form review track; one node per role × stage pair sufficient |
| `narrative` (module slot) | Compose-assisted, long-form review track; standard Phase 1–4 workflow applies. This is a `Content Module` node of `module_type: narrative` — a page slot that carries narrative-style content for a specific role × stage combination. It is distinct from the `Narrative` node (human-authored, Document 4 Section 8.3.1). Do not apply the `Narrative` node commissioning path to this module type. |

**`progressive_disclosure` — Level 1 Suppression**

Platform Engineers must not commission Level 1 `progressive_disclosure` content. The slot is architecturally suppressed at Level 1 — this is a design decision, not an offer catalog gap. A Level 1 offer in the catalog would be served if the suppression is not implemented correctly. The Target activity for `progressive_disclosure` must include an explicit audience exclusion for `confidence_tier = HIGH` visitors. The absence of a Level 1 offer in the catalog is not sufficient protection: if the audience exclusion is misconfigured, a `confidence_tier = HIGH` visitor could receive a lower-level prompt. The explicit audience exclusion and the absence of Level 1 catalog offers are both required.

**`progressive_disclosure` — Cross-Category Brand Prompt Node**

The cross-category brand prompt node is a required commissioning deliverable at v1 — it is not optional. A Level 4 visitor arriving at the homepage with no solution signal receives no `progressive_disclosure` prompt if this node is absent, deactivating the primary conversion mechanism for the highest-volume Level 4 entry path. This node must be commissioned and approved before the `progressive_disclosure` Target activity is activated at Level 4. The Content Ops Lead is responsible for scheduling this node in the first commissioning sprint that includes `progressive_disclosure` work. The node's `confidence_tier_minimum` value is `UNKNOWN` per Document 4, Section 5 `progressive_disclosure` specification and Document 6, Section 3.

The prompt copy specifications for all three `progressive_disclosure` variant levels are owned by Document 6, Section 3. Commission prompt content in accordance with those specifications. Do not author prompt copy from Document 4 or Document 5 alone.

---

### 3.10 Sprint Closure

**Responsibility: Content Ops Lead (items 1–2); Platform Engineer (items 3–5)**

A sprint is not closed until all five closure conditions are confirmed. The Content Ops Lead and Platform Engineer jointly sign off on sprint closure.

1. All nodes in the sprint node list are in `status: approved` in Sanity. Any node that did not reach `status: approved` during the sprint is carried forward to the next sprint with its failure reason documented.
2. The `solution_category_coverage_status` AEP attribute reflects the updated coverage state for all solution categories affected by this sprint. The Content Ops Lead queries the §CA-registered `solution_category_coverage_status` value (Section 2.2.1) for each affected category and confirms it matches the expected post-sprint state.
3. The operational dashboard shows correct tuple-level coverage for all `(solution_category, role, buying_stage)` pairs commissioned in the sprint. The Platform Engineer runs the tuple-level coverage query against Sanity and confirms the results match the sprint deliverables.
4. The `pending_solution_fallback` event rate for solution categories advanced during this sprint begins declining within 48 hours of the sprint's final approval events. The Platform Engineer monitors the coverage gap escalation metric from Document 4, Section 7.4 for the 48-hour window after the sprint's last node approval. If the event rate does not decline, the Platform Engineer investigates whether the sync pipeline correctly processed all approval events and whether the AEP attribute update propagated to Target.
5. Any `phase: converge` exclusion log entries produced during the sprint are reviewed and confirmed as expected exclusions (converge nodes commissioned as part of a concurrent Section 4 workflow). Any unexpected exclusion log entry is investigated before the sprint is closed.

> **SPRINT CLOSURE CHECKLIST**
> Content Ops Lead confirms: (a) all sprint nodes at `status: approved`; (b) `solution_category_coverage_status` AEP attribute reflects updated state.
> Platform Engineer confirms: (c) operational dashboard shows correct tuple-level coverage; (d) `pending_solution_fallback` event rate declining within 48 hours; (e) all `phase: converge` exclusion log entries accounted for.

---

*End of Section 3. D8-Flag-02 (Sanity webhook trigger), D8-Flag-04 (phase: converge enforcement point — sync pipeline confirmed), D8-Flag-05 (GROQ validation performance requirement), D8-Flag-07 (progressive_disclosure commissioning unblocked), D8-Flag-08 (recommended source modules for converge content), D8-Flag-10 (long-form vs. short-form track), and D8-Flag-11 (confidence_tier_minimum human reviewer assignment) are resolved. Section 4 (Converge Content Delivery Workflow) proceeds from this section's locked diverge-phase commissioning foundation.*

---

## Section 4: Converge Content Commissioning Workflow

> **Document position:** Document 8, Section 4
> **Depends on:** §CA (Section 2, locked); Section 3 (Diverge Commissioning, locked); Document 4 Sections 6–8.4; Document 6 Section 7 (convergence point architecture)
> **Audience:** Content Ops Lead / Content Strategist (primary); Platform Engineer (log verification and delivery surface confirmation only)
> **Scope:** `consensus_brief` and `executive_brief` `Content Module` nodes (`phase: converge`), commission trigger thresholds, prerequisite checks, generation, review, approval, and Champion delivery surface operation. Does not cover diverge-phase commissioning (Section 3), sales activation alert routing (Section 6), or the design and UX specification of the Kalder Compose delivery interface (Layer 2 product specification, outside Document 8 scope).

---

### 4.1 How This Section Differs from Section 3

The converge content commissioning workflow follows the same four-phase structure as the diverge workflow (Generate → Review → Approve → Publish). Three structural differences apply throughout:

1. **Prerequisite checks include a diverge coverage gate per convergence point.** Before generation can begin, the workflow confirms that approved diverge `Content Module` nodes exist for all Required roles at the target convergence point. This gate is in addition to the `Narrative` node and `JTBD` node prerequisites that govern diverge commissioning.
2. **Generation context draws from multiple approved source modules.** Kalder Compose synthesizes from the approved diverge `Content Module` nodes for each Required role, plus the governing `Narrative` node. This is a multi-source context, not a single-tuple generation prompt.
3. **No sync to Adobe Target — publication endpoint is the Champion delivery surface only.** Approved converge nodes are made available in the Kalder Compose delivery interface for Champions. They are never written to the Adobe Target offer catalog.

> **ENFORCEMENT REFERENCE — phase: converge exclusion**
> The `phase: converge` pre-write exclusion that prevents converge nodes from entering the Target offer catalog is enforced by the sync pipeline confirmed in Section 3.7. No additional configuration in this section is required to enforce that exclusion. The sync pipeline's pre-write check fires on every `status: approved` event, regardless of `phase` value, and produces the exclusion log entry for any `phase: converge` node before any catalog write can occur.

---

### 4.2 Commission Triggers

**Responsibility: Content Ops Lead**

Converge content must be available before convergence point proximity alerts fire. A Champion who receives an alert that their buying group is approaching a convergence point but finds no brief available in the delivery interface has received a signal without an instrument. Retroactive commissioning after an alert means the convergence moment passes without the prepared content it is designed to support. The following thresholds are concrete operational triggers, not principles.

**`consensus_brief` trigger:** When 20% or more of active TAL accounts in a solution category have reached `engaged` or `prioritized` `bg_stage`, initiate a `consensus_brief` commissioning sprint for that category.

**`executive_brief` trigger:** When 10% or more of active TAL accounts in a solution category have reached `qualified` `bg_stage`, initiate an `executive_brief` commissioning sprint for that category.

These thresholds are monitored via the account-plane `bg_stage` distribution report available in the operational dashboard. The Content Ops Lead checks this report at the start of each weekly monitoring cycle per Section 5.

---

### 4.3 Prerequisite Checks

**Responsibility: Content Ops Lead**

Three prerequisite gates must pass before Kalder Compose is invoked for any converge `Content Module`. Gates are evaluated in order; the first failure routes to the specified remediation path.

**Gate 1 — Required role diverge coverage.** For the target convergence point, confirm that at least one approved `phase: diverge` `Content Module` node exists for each Required role in the table below. Query Sanity for `_type == "contentModule" && phase == "diverge" && solution_category == [target] && buying_stage == [target] && role == [required_role] && status == "approved"` for each Required role at the target convergence point.

| Convergence Point | Convergence Point Key | Brief Type | Required Roles — Minimum Diverge Coverage Required |
|---|---|---|---|
| Problem Validation | `problem_validation` | `consensus_brief` | `champion`, `economic_buyer` |
| Requirements Framing | `requirements_framing` | `consensus_brief` | `champion`, `influencer`, `user` |
| Solution Validation | `solution_validation` | `consensus_brief` | `champion`, `influencer`, `user` |
| Business Value Alignment | `business_value_alignment` | `executive_brief` | `champion`, `economic_buyer` |
| Risk & Compliance Validation | `risk_compliance_validation` | `executive_brief` | `champion`, `economic_buyer`, `ratifier` |
| Final Commitment | `final_commitment` | `executive_brief` | `champion`, `economic_buyer`, `ratifier` |

> **BLOCKING CONDITION**
> If approved diverge modules are absent for any Required role at the target convergence point, generation is blocked. The block reason is surfaced in the Kalder Compose interface: "BLOCKED: Missing approved diverge modules for [role] at [convergence_point]. Commission diverge modules per Section 3 before generating converge content." Do not proceed until the missing diverge coverage is in place.

**Gate 2 — `Narrative` node prerequisite.** Confirm that an approved `Narrative` node exists for the `(solution_category, buying_stage)` pair. This is the same gate as Section 3.3 Gate 1. The `Narrative` node must be in `status: approved`; a node in `status: under_review` is a blocking condition identical to the Section 3 diverge blocking condition.

**Gate 3 — `executive_brief` economic buyer and ratifier coverage (additional check).** For `executive_brief` generation specifically, Gate 1 alone is not sufficient. Confirm that approved diverge `Content Module` nodes exist specifically for `economic_buyer` and `ratifier` roles, independent of the convergence point's Required role list. The `executive_brief` is designed for the Economic Buyer and Ratifier specifically — its framing, vocabulary, and emphasis must draw from content authored for those roles. An `executive_brief` generated without approved `economic_buyer` and `ratifier` diverge modules cannot produce appropriately calibrated financial justification and compliance framing regardless of whether other Required roles are covered. Gate 3 is a named additional check and is not satisfied by Gate 1 alone.

---

### 4.4 Source Module Selection

**Responsibility: Content Ops Lead**

After all three prerequisite gates pass, the Content Ops Lead assembles the generation context by selecting the source diverge modules Kalder Compose will synthesize from.

1. For each Required role at the target convergence point, identify available approved diverge `Content Module` nodes for the `(solution_category, buying_stage)` pair.
2. Evaluate whether the recommended input set is met for each Required role. The recommended input set is: the `narrative` module slot node plus at minimum one `proof` or `gated_assets` module node. The minimum input set (one approved diverge module per Required role of any module type) is the generation gate; the recommended set is the quality standard for coherent synthesis.
3. If the recommended input set is not complete for any Required role, the Kalder Compose interface surfaces the following prompt before generation proceeds:

   > "Recommended input set for [role] is not complete. Available: [module types present]. Proceeding with minimum set will produce a brief without evidentiary support for this role's perspective. Confirm to proceed or commission additional diverge nodes first."

4. The Content Ops Lead's confirmation decision — whether to proceed with the minimum set or return to diverge commissioning — is logged in the review record. The decision and the available module type set at the time of the decision are both recorded.
5. If additional diverge modules are to be commissioned before proceeding, route to Section 3 for the relevant role and module types, then return to Section 4 Gate 1 after those nodes reach `status: approved`.
6. Finalize the source module selection. The generation context includes: the governing `Narrative` node and all selected diverge `Content Module` nodes for each Required role.

---

### 4.5 Phase 1: Generate

**Responsibility: Content Ops Lead**

1. Open the Kalder Compose generation interface and select `consensus_brief` or `executive_brief` as the target `module_type`.
2. Confirm the generation context assembled in Section 4.4 is correctly loaded: governing `Narrative` node, selected diverge source modules per Required role, target `solution_category`, `buying_stage`, and `convergence_point` key.
3. Invoke Compose. Compose synthesizes from the multi-source generation context and outputs a draft `content_body`.
4. Confirm that Compose populates the following fields in the Sanity draft record:

   | Field | Value |
   |---|---|
   | `module_type` | `consensus_brief` or `executive_brief` |
   | `solution_category` | Target solution category |
   | `buying_stage` | Target buying stage |
   | `phase` | `converge` |
   | `narrative_ref` | Document ID of the governing `Narrative` node |
   | `label` | Compose-generated descriptive label |
   | `content_body` | Synthesized draft |
   | `primary_role_affinity` | `champion` (for both brief types — designates distributing role) |
   | `convergence_point` | Canonical key from the table in Section 4.3 (e.g., `problem_validation`, `risk_compliance_validation`) |

5. Confirm that `confidence_tier_minimum` is null in the draft record. Compose must not populate this field on `phase: converge` nodes. If Compose populates it, clear it before saving.
6. Save the node. Sanity sets `status: draft`. The node enters the review queue.

---

### 4.6 Phase 2: Review

**Responsibility: Content Ops Lead**

All `consensus_brief` and `executive_brief` nodes follow the long-form review track. The same stage sequence as Section 3.5 applies with the following expansions.

**Stage R1 — Factual accuracy review (expanded criterion)**

The standard R1 criterion applies. For converge content, the criterion is expanded: every claim in the `content_body` must trace to either a `supporting_claims` entry in the governing `Narrative` node or to the `content_body` of one of the specified source diverge modules used in generation. Claims not traceable to either source are unauthorized additions. A `consensus_brief` does not introduce new vendor claims — its function is synthesis, not origination. The reviewer checks each substantive claim against the generation source set and flags any claim without a traceable source for removal or escalation.

**Stage R2 — Through-line and role representation review (expanded criterion)**

The standard R2 through-line criterion applies. For converge content, a named additional check is required per the role representation standard: the reviewer must identify, for each Required role at the target convergence point, at least one passage in the `content_body` that specifically addresses that role's evaluation perspective. If any Required role's perspective is absent from the `content_body`, the brief fails R2 regardless of through-line compliance. The reviewer records, for each Required role, the specific paragraph or passage — identified by position (e.g., paragraph 2) or opening phrase — that addresses that role's evaluation perspective in the review log before advancing to R3. A log entry that notes only that a role is "represented" without identifying the specific passage does not satisfy this requirement.

**Stage R3 — Tagging completeness review**

The standard R3 criterion applies with one mandatory reversal for converge content:

> **REQUIRED — `confidence_tier_minimum` must be null on converge nodes**
> Converge content is not served by Adobe Target and does not gate on confidence tier. A non-null `confidence_tier_minimum` on a converge node is a tagging error that misrepresents the node's serving path. The reviewer must confirm `confidence_tier_minimum` is null before advancing to approval. If the field is populated, the reviewer clears it and records the correction in the review log. A converge node with a non-null `confidence_tier_minimum` must not enter `status: approved`.

The reviewer also confirms: `phase` is `converge`; `convergence_point` key matches the target convergence point in Section 4.3; `primary_role_affinity` is `champion`; `narrative_ref` is correctly set.

**Stage R4 — Brand voice review**

Standard R4 criterion applies without modification.

---

### 4.7 Phase 3: Approve

**Responsibility: Content Ops Lead (approval action); Sanity (automated validation)**

After all review stages pass, the Content Ops Lead advances the node from `status: under_review` to `status: approved`. The approval transition triggers Sanity's cross-document GROQ validation functions. For converge content, Function 1 and Function 3 apply; Function 2 does not.

**Function 1 — `Narrative` status check.** Queries the referenced `Narrative` document's `status` field. If not `approved`, blocks the transition. The same function as Section 3.6 Function 1.

**Function 3 — `Narrative` scope check.** Queries the referenced `Narrative` document's `solution_category` and `buying_stage` fields. If either does not match the converge node's corresponding fields, blocks the transition.

> **CROSS-MODULE CONSISTENCY REQUIREMENT**
> The `narrative_ref` on the converge node must reference the same `Narrative` document as the source diverge modules for this `(solution_category, buying_stage)` pair. A mismatch on `solution_category`, `buying_stage`, or `Narrative` document ID is a blocking validation error. The converge node cannot enter `status: approved` until the mismatch is resolved. A converge node whose `narrative_ref` points to a different `Narrative` than its source diverge modules cannot guarantee through-line coherence; the Sanity scope check enforces this structurally.

**Function 2 — `JTBD` check.** Function 2 does not apply to converge content. `consensus_brief` and `executive_brief` nodes do not carry `jtbd_ref` — converge content is not organized around individual buying job axes. The `buying_job` axis governs diverge content selection; converge synthesis draws from the approved diverge outputs, not from JTBD targeting directly.

Node enters `status: approved` on passing Functions 1 and 3.

---

### 4.8 Phase 4: Champion Delivery Surface

**Responsibility: Content Ops Lead (availability confirmation); Platform Engineer (log verification and surface investigation)**

Converge nodes have a different Phase 4 than diverge nodes. There is no offer catalog write. The approved node is published to the Champion delivery surface — the Kalder Compose delivery interface — where Champions can access it filtered by their active `solution_category` context.

1. On `status: approved` transition, Sanity emits an event. The sync pipeline processes the event and executes the `phase: converge` pre-write exclusion check (Section 3.7). The node is not written to the Target offer catalog.

2. **Log entry confirmation.** The Content Ops Lead confirms that the `phase: converge` exclusion log entry is present for each newly approved converge node: `"Node [id] excluded from Target offer catalog: phase: converge."` If no log entry is present, the Platform Engineer investigates whether the sync pipeline processed the approval event correctly before the sprint is closed.

3. **Delivery surface availability.** The approved converge node must appear in the Champion delivery interface within 15 minutes of approval. The Content Ops Lead confirms availability by verifying the node is visible in the delivery interface for the correct `solution_category` context. If the node does not appear within 15 minutes, the Platform Engineer investigates the delivery surface pipeline and documents the root cause before the sprint is closed.

4. **Access model.** The program does not push content to Champions. Champions access the delivery interface directly. No notification, email, or push mechanism is required or expected from the commissioning workflow. The program's operational responsibility ends when delivery surface availability is confirmed.

---

### 4.9 Downstream Measurement

**Responsibility: Content Ops Lead (awareness); Document 7 (attribution methodology)**

After delivery surface availability is confirmed in Section 4.8, the commissioning workflow for this converge node is complete. The Content Ops Lead does not follow up with Champions regarding usage. Champion content selection and distribution are Champion-driven; the program's role is to make content available at the right convergence point threshold, not to manage its downstream use.

The downstream measurement signal for converge content effectiveness is the Economic Buyer dark social arrival pattern — an Economic Buyer arriving at kalder.com without a classifiable referral path, shortly after a Champion session at the same account, landing on high-value content. This pattern is evidence of internal sharing: the Champion distributed the brief, the Economic Buyer engaged with it, and arrived on-site through a private channel (email, Slack, Teams). Document 7 owns the attribution methodology for identifying and measuring this pattern. The commissioning workflow does not produce or interpret this signal; it creates the condition for the signal to occur.

---

*End of Section 4. The converge content commissioning workflow is complete. Section 5 (Weekly Signal Monitoring) and Section 7 (Coverage Gap Management) specify the ongoing operational monitoring that governs when subsequent commissioning sprints are triggered. Section 6 (Sales Activation Workflow) specifies the convergence point alert system that converge content is designed to prepare Champions for.*

---

## Section 5: Weekly Signal Monitoring

> **Document position:** Document 8, Section 5
> **Depends on:** §CA (Section 2, locked); Sections 3–4 (commissioning workflows, locked); Document 4 Section 7.4 (coverage gap monitoring); Document 7 (metric definitions and monthly/quarterly cadences)
> **Audience:** Analytics Lead (signal health, classification accuracy, coverage checks); Marketing Ops Engineer (pipeline health checks)

---

### 5.1 Overview

The weekly monitoring cycle is a joint operation between the Analytics Lead and the Marketing Ops Engineer, executed in parallel. It covers eight checks across signal health, coverage status, pipeline integrity, and sales activation gate population. The cycle produces no deliverables — its outputs are either a confirmation that all checks are normal, a log entry for a trend to monitor, or a routed escalation. Metric definitions, targets, and historical baselines are owned by Document 7 and are not reproduced here. Sprint prioritization and remediation after a gap is identified are owned by Section 7; this section routes to Section 7 when escalation conditions are met.

---

### 5.2 Weekly Review Sequence

The eight checks below are executed weekly. Check 1 is the Content Ops Lead's responsibility. Checks 2, 3, 7, and 8 are the Analytics Lead's responsibility. Checks 4, 5, 6 are the Marketing Ops Engineer's responsibility. Both practitioners begin their checks in parallel at the start of the weekly review session.

---

**Check 1 — Commission Trigger Review**

**Responsibility:** Content Ops Lead
**Time:** 5 minutes
**Data source:** `bg_stage` distribution report in the operational dashboard (AEP-sourced); displays account count per `bg_stage` per active solution category as a percentage of total active TAL accounts in that category.
**Normal result:** No solution category is at or above a commission threshold without an active commissioning sprint already in progress for the corresponding brief type.
**Escalation condition:** Any solution category where 20% or more of active TAL accounts are at `engaged` or `prioritized` `bg_stage` and no active `consensus_brief` commissioning sprint is in progress; OR any solution category where 10% or more of active TAL accounts are at `qualified` `bg_stage` and no active `executive_brief` commissioning sprint is in progress.
**Escalation action:** Route to Section 4.2 and initiate the appropriate commissioning sprint. Record the solution category, the triggering metric, and the sprint initiation date in the weekly review log.

---

**Check 2 — Coverage Status Verification**

**Responsibility:** Analytics Lead
**Time:** 10 minutes
**Data source:** `solution_category_coverage_status` AEP attribute (§CA, Section 2.2.1) queried via the operational dashboard for all five solution categories; cross-checked against Sanity tuple-level coverage data via direct Sanity query for `coverage_status` per `(solution_category, role, buying_stage)` tuple.
**Normal result:** The AEP attribute value and the Sanity tuple-level rollup agree for all five solution categories. No discrepancy between the AEP-reported coverage state and the Sanity content graph state.
**Escalation condition:** The `solution_category_coverage_status` AEP attribute shows a different status than the Sanity tuple-level data for any solution category — the AEP attribute has not updated to reflect a coverage change that is already present in Sanity, or vice versa.
**Escalation action:** Escalate to Platform Engineer. The coverage tracking pipeline may have missed a Sanity webhook event (Section 3.7, D8-Flag-02). The Platform Engineer investigates whether the webhook trigger fired and whether the AEP write completed. Document the discrepancy, affected solution category, and the timestamp of the last confirmed sync in the escalation record.

---

**Check 3 — `pending_solution_fallback` Event Rate**

**Responsibility:** Analytics Lead
**Time:** 10 minutes
**Data source:** 7-day rolling `pending_solution_fallback` event count per solution category, operational monitoring dashboard (Snowflake-sourced). Sourced from the logging requirement in `§4 SCORING_RULES` per the data model.
**Normal result:** All solution categories are below their calibrated escalation threshold. For any category that exceeded its threshold during the week, the automatic alert to `slack_data_team_channel` has already fired per Document 4 Section 7.4.
**Calibrated threshold note:** The starting hypothesis is 50 events per 7 days per solution category per data model `§4 escalation_threshold`. This threshold must be calibrated within 30 days of v1 launch using the 2× rolling-average baseline procedure specified in Document 4 Section 7.4.2. Until calibration is complete, the 50-event starting value applies.
**Escalation condition:** Two distinct conditions require different escalation paths:
- **(a)** Any solution category exceeds its calibrated threshold AND no automatic alert was received in `slack_data_team_channel` for that category — the escalation mechanism itself has failed.
- **(b)** Any solution category exceeds its calibrated threshold AND the automatic alert did fire — coverage gap requires remediation.
**Escalation action:**
- For (a): Escalate immediately to Platform Engineer — the automatic alert pipeline has failed and must be restored before the next weekly review. Log the affected category and the threshold breach date.
- For (b): Route to Section 7 for coverage gap sprint prioritization. The alert payload from Document 4 Section 7.4.3 includes the `gap_summary` field specifying which `(role, buying_stage)` combinations and module types to produce.

---

**Check 4 — `stitching_pending` SLA**

**Responsibility:** Marketing Ops Engineer
**Time:** 5 minutes
**Data source:** AEP contact profiles where `stitching_pending = True` (§CA, Section 2.2.2), queried via AEP segment query or operational dashboard. Filter for records where the stitching initiation timestamp exceeds 24 hours from the time of query.
**Normal result:** No contact has `stitching_pending = True` persisting beyond 24 hours. Per §CA Section 2.2.2, the 24-hour SLA alert should have fired automatically to the Data team; confirm the alert was received.
**Escalation condition:** Any contact with `stitching_pending = True` persisting beyond 24 hours — regardless of whether the automatic alert fired. If the alert fired but stitching has not completed, the SLA has been breached and the condition is still active.
**Escalation action:** Escalate to Platform Engineer with the affected `contact_id` and stitching initiation timestamp. The Platform Engineer investigates the Kafka pipeline or AEP identity stitching job. Resolution must be confirmed before the next weekly review. If the automatic 24-hour SLA alert did not fire, include that in the escalation record as a secondary pipeline failure.

---

**Check 5 — TAL Data Staleness**

**Responsibility:** Marketing Ops Engineer
**Time:** 5 minutes
**Data source:** AEP account profiles where `tal_last_refreshed_at` (§CA, Section 2.2.1) exceeds 72 hours from the time of query, queried via operational dashboard. Compare stale account count to the prior week's count.
**Normal result:** Stale account count is zero or within the historical trend baseline established in the first four weeks of production operation. Week-over-week count is stable.
**Escalation condition:** Two distinct conditions:
- **(a)** Single-week spike: stale count exceeds the threshold defined in Section 12.7 (TAL Data Staleness Spike).
- **(b)** Trend condition: stale count rises week-over-week for three consecutive weekly reviews, regardless of whether the Section 12 threshold has been reached.
**Escalation action:**
- For (a): Initiate Section 12 incident response immediately. Escalate to Platform Engineer for Kafka pipeline investigation in parallel.
- For (b) without (a): Escalate to Platform Engineer for Kafka pipeline investigation. Log the three-week trend with week-over-week counts in the escalation record. Section 12 incident response is not triggered until the threshold is breached.
- Single-week spike below Section 12 threshold and no three-week trend: log the count and monitor next week.

---

**Check 6 — `multi_match_unresolved` Monitoring**

**Responsibility:** Marketing Ops Engineer
**Time:** 5 minutes
**Data source:** AEP anonymous identifier records where `multi_match_unresolved = True` — note this attribute is excluded from §CA as a monitoring-only attribute per Section 2.4 and is not read by any activation channel. Query via operational dashboard. Note count, record age distribution, and whether any affected records are associated with accounts at `bg_stage: qualified`.
**Normal result:** Count is stable week-over-week. No records older than 14 days. No records associated with accounts at `bg_stage: qualified`.
**Escalation condition:** Two distinct conditions require different escalation paths:
- **(a)** Any `multi_match_unresolved` record is associated with an account at `bg_stage: qualified` — regardless of record age.
- **(b)** Count rising week-over-week for three consecutive weekly reviews.
**Escalation action:**
- For (a): Escalate immediately to Platform Engineer. Late-stage accounts with unresolved contact stitching have active convergence point alert exposure — a Champion at a `qualified`-stage account may be triggering alerts while the economic buyer's contact record cannot be stitched. This is the highest-priority condition in Check 6.
- For (b) without (a): Escalate to Platform Engineer for Salesforce duplicate contact investigation. Rising `multi_match_unresolved` counts typically indicate duplicate contact records in the CRM that require CRM-side cleanup before AEP resolution criteria can match uniquely.

---

**Check 7 — Classification Accuracy Spot Check**

**Responsibility:** Analytics Lead
**Time:** 10 minutes
**Data source:** Current week's `role_confidence_score` (§CA, Section 2.2.2) and `confidence_tier` distribution for classified contacts, via Snowflake or operational dashboard. Compare the proportion of contacts at `LOW` or `UNKNOWN` confidence tier to the prior week's proportion.
**Normal result:** `LOW`/`UNKNOWN` proportion is stable week-over-week within the established monitoring threshold.
**Escalation condition:** For any role, the `LOW`/`UNKNOWN` proportion increases by more than 5 percentage points absolute AND more than 20% relative from the prior week's baseline — whichever is smaller triggers logging. A single-week shift meeting either criterion alone: log and monitor next week. A shift that persists for two consecutive weeks, or exceeds 10 percentage points absolute in a single week: escalate.
**Escalation action:** Two-week persistence or 10-point single-week shift → escalate to Platform Engineer. Signal collection failure or signal weight drift investigation required. Provide the prior two weeks' distribution snapshots with the escalation record.
**Monthly bridge note:** Preserve the weekly `LOW`/`UNKNOWN` distribution snapshot. This data feeds the T2-06 (Role Classification Accuracy) monthly computation per Document 7. Do not discard weekly snapshots after escalation review — they are required inputs for the monthly cadence regardless of whether an escalation occurred.

---

**Check 8 — Sales Activation Gate Population**

**Responsibility:** Analytics Lead
**Time:** 5 minutes
**Data source:** Count of contacts at `confidence_tier: MEDIUM` or `HIGH` with `differential_insufficient = False` (§CA, Section 2.2.2) per active solution category, queried via AEP segment query or operational dashboard. Compare to the prior week's count.
**Normal result:** Count is stable week-over-week. Any change is proportional to the change in total active TAL account count for the same period (within 5%).
**Escalation condition:** Count drops more than 20% week-over-week while TAL account count is stable — defined as within 5% change in total active TAL accounts over the same period.
**Escalation action:** Escalate to Platform Engineer. A drop of this magnitude while TAL count is stable indicates signal collection degradation or a scoring pipeline anomaly, not a natural visitor behavior shift. The Platform Engineer investigates before the next weekly review. Provide the week-over-week count, the TAL account count for both weeks, and the solution categories affected.

---

**Total estimated time:** Analytics Lead — 35 minutes. Marketing Ops Engineer — 20 minutes. Combined parallel execution: under 40 minutes.

---

### 5.3 Escalation Path Reference

| Check | Escalation Path |
|---|---|
| 1 — Commission Trigger | Section 4.2 → Content Ops Lead initiates commissioning sprint |
| 2 — Coverage Status Verification | Platform Engineer — coverage tracking pipeline investigation |
| 3 — fallback event rate (alert fired) | Section 7 → coverage gap management sprint prioritization |
| 3 — fallback event rate (alert not fired) | Platform Engineer — escalation mechanism failure investigation |
| 4 — `stitching_pending` SLA | Platform Engineer — Kafka / identity stitching investigation |
| 5 — TAL staleness (single spike below threshold) | Log and monitor |
| 5 — TAL staleness (three-week trend or threshold breach) | Platform Engineer — Kafka investigation; Section 12 if threshold exceeded |
| 6 — `multi_match_unresolved` (qualified account) | Platform Engineer — immediate |
| 6 — `multi_match_unresolved` (three-week trend) | Platform Engineer — Salesforce duplicate contact investigation |
| 7 — Classification accuracy (2-week persistence or 10-pt shift) | Platform Engineer — signal collection or weight drift investigation |
| 8 — Sales activation gate drop | Platform Engineer — signal collection or scoring pipeline investigation |

---

### 5.4 Monthly and Quarterly Cadence Reference

Section 5 covers the weekly T3 operational monitoring cadence only. Monthly (T2) and quarterly (T1 and T3-07) cadences are owned by the Analytics and Data Science Lead and governed by Document 7. The weekly checks feed two higher-cadence computations: Check 7 weekly distribution snapshots are required inputs for the T2-06 (Role Classification Accuracy) monthly metric; those same snapshots feed the T3-07 quarterly classification trend analysis. Weekly snapshots must be preserved in the monitoring record regardless of whether an escalation occurred in a given week.

---

*End of Section 5. Section 6 (Sales Activation Workflow) and Section 7 (Coverage Gap Management) are the primary escalation destinations from this section's monitoring checks. Section 12 (Incident Response) governs conditions that exceed the thresholds specified here.*

---

## Section 6: Sales Activation Workflow

> **Document position:** Document 8, Section 6
> **Resolves:** PENDING-SA-1, PENDING-SA-4, PENDING-D3-3, PENDING-D3-4, PENDING-D3-5
> **Depends on:** §CA (Section 2, locked); Sections 3–5 (locked); Document 6 Section 7 (convergence point architecture); §SA SALES_ACTIVATION_CONFIG (data model)
> **Audience (dual):** BDRs and AEs — receive and act on alerts; have not read the corpus. Platform Engineers and Marketing Ops Engineers — configure and maintain the routing architecture. Both audiences are served in this section. Corpus terms are defined plainly at first use for sales practitioners.

---

### 6.1 Routing Architecture

**For Platform Engineers.** This section confirms the data path by which buying group signals flow from the personalization platform to the BDR or AE's tooling. The path is: Adobe Experience Platform (AEP) — the platform that tracks visitor behavior and classifies buying group members — writes alert data to Salesforce CRM, which then triggers an Outreach sales engagement sequence.

> **ROUTING CONFIRMED — AEP → Salesforce → Outreach**
> The data path for all convergence point alerts: AEP Real-Time CDP native Salesforce CRM destination connector writes alert fields to Salesforce custom fields. Salesforce → Outreach: Outreach Salesforce integration detects the CRM field update and activates the pre-configured sequence. No custom middleware required. This resolves PENDING-SA-1 and PENDING-D3-3.

Three onboarding configuration requirements must be completed before sales activation goes live:

1. **Salesforce custom field provisioning.** Three Salesforce custom fields must be provisioned per convergence point to carry `convergence_point`, `roles_active`, and `recommended_action`. These fields receive the alert payload written by the AEP Real-Time CDP connector. Field names are client-configured at onboarding; the data written to them is canonical and must not be modified (Section 6.8).
2. **Outreach-Salesforce integration trigger configuration.** The Outreach Salesforce integration must be configured to trigger the appropriate sequence when each convergence point's Salesforce custom field is updated. One trigger configuration per active convergence point per cohort is required.
3. **`recommended_action` character limit validation.** The Salesforce custom field provisioned for `recommended_action` must accommodate the full canonical text length. A character limit validation step is required at onboarding — if the field truncates the text, the action specificity that makes the alert useful is silently lost. Confirm character limit before integration testing begins.

---

### 6.2 Latency SLA

**For Platform Engineers.** The alert delivery SLA defines the maximum acceptable elapsed time from when the trigger condition is met in AEP to when the Outreach sequence is active and the BDR or AE has received the CRM task.

> **LATENCY SLA CONFIRMED — 60 minutes standard**
> Standard SLA: 60 minutes from trigger condition met in AEP to Outreach sequence active. Nominal latency under normal operating conditions: 5–20 minutes. The 60-minute ceiling provides buffer for AEP segment re-evaluation delays, Real-Time CDP connector batch windows, and Salesforce-to-Outreach field propagation. This resolves PENDING-SA-4.

**SLA breach definition.** Any elapsed time from trigger condition met to Outreach sequence active that exceeds 60 minutes is a pipeline degradation event and must be logged.

**High-severity breach escalation.** Risk & Compliance Validation and Final Commitment convergence point breaches trigger immediate escalation to the Platform Engineer, regardless of time of day. These two convergence points are deal-critical: a late alert at Final Commitment means a Champion has potentially entered a closing conversation without the instruments the program was designed to provide. Standard-severity breaches (all other convergence points) are logged and reviewed at the next weekly monitoring session.

**Weekly monitoring requirement.** The Platform Engineer queries the time delta between AEP trigger event timestamp and Outreach sequence activation timestamp for all alerts delivered during the week. All breaches are logged with: convergence point, account, elapsed delta, and breach severity tier (high-severity or standard). Breach log is reviewed at the weekly monitoring session per Section 5.

---

### 6.3 Timestamp Preservation

**For Marketing Ops Engineers.** Behavioral signals from kalder.com visitors are timestamped when they occur. When a visitor moves from anonymous (unidentified) to known (identified, typically after a form fill), their prior anonymous behavioral history is stitched to their contact record. The timestamp on those prior events must reflect when they actually happened, not when the stitching occurred, so that the scoring engine correctly calculates how recent (and therefore how relevant) each signal is.

> **TIMESTAMP PRESERVATION CONFIRMED — `originalTimestamp`**
> AEP streaming ingestion uses the Segment event's `originalTimestamp` field as the authoritative event time for scoring decay calculations. This resolves PENDING-D3-4.

**Marketing Ops Engineer confirmation gate.** Before production scoring begins, the Marketing Ops Engineer must verify that the AEP source connector for Segment events is configured to use `originalTimestamp` as the event time source — not the server-side ingestion time. This is a one-time configuration verification at launch, not an ongoing procedure.

**Consequence of misconfiguration.** If the connector uses server-side ingestion time instead of `originalTimestamp`, signals from days or weeks prior to identity stitching will be weighted as `current_session` events (1.5× weight). The first post-promotion scoring run will produce artificially inflated confidence scores for newly identified contacts. The inflation is not self-correcting: subsequent scoring runs will decay correctly from the incorrect baseline, not from the correct original event times. Misconfiguration must be caught and corrected before the first production scoring run.

---

### 6.4 CRM / Demandbase Identity Priority

**For Marketing Ops Engineers.** When a visitor arrives at kalder.com, the program attempts to identify which company they work for. It uses two methods: Demandbase, which infers the company from the visitor's IP address, and direct CRM association, which matches the visitor to a known contact in Salesforce. When both methods produce a result — and they sometimes disagree — the program needs a rule for which one governs.

> **IDENTITY PRIORITY CONFIRMED — CRM governs over Demandbase**
> When both CRM account association and Demandbase reverse-IP resolution are present for the same visitor, the CRM-associated account governs for TAL identification and all account-plane attribute reads. This resolves PENDING-D3-5.

**Implementation.** Standard AEP identity namespace priority configuration. Set the CRM contact namespace above the Demandbase IP resolution namespace in the AEP identity resolution rules. The Marketing Ops Engineer confirms the namespace priority order at implementation before production traffic is processed.

**Why this matters.** A contact browsing from a partner's office, a conference venue, or a VPN exit node may resolve to the wrong Target Account List (TAL) account via Demandbase IP inference. CRM association is more reliable because it uses a known contact-to-account relationship, not an IP-to-company inference. Setting CRM above Demandbase prevents misclassification of contacts at shared network locations and ensures the correct account's buying group context governs the visitor's experience and activation eligibility.

---

### 6.5 The Two Contact-Level Gates

**For BDRs and AEs.** A convergence point alert fires when an account's buying group is approaching a significant moment in the evaluation — a point where the group needs to align or make a decision. But not every contact at an eligible account automatically gets a sales sequence. Two individual-level conditions must both be true for a specific contact before their sequence fires.

**Gate 1 — Role confidence must be sufficient.** The program tracks how each person at an account browses and engages with content and builds a profile of what role they likely hold in the evaluation (Champion, Economic Buyer, Influencer, User, or Ratifier). When that profile is strong enough — meaning the program has enough behavioral evidence to be confident in the classification — Gate 1 is passed. When the evidence is still accumulating, Gate 1 is not passed and no sequence fires for that contact, even if the account-level alert has already fired.

**Gate 2 — Classification must not be ambiguous.** Sometimes two roles score very close to each other for the same contact. When the scoring is too close to call, the program holds back rather than activate on an uncertain classification.

> **WHY DIDN'T MY SEQUENCE FIRE?**
>
> **Gate 1 fails — confidence not sufficient.** The contact's behavioral activity has not reached the threshold for a stable role classification. Progressive disclosure — an in-session role prompt that appears on kalder.com and invites the visitor to self-identify — may be eligible for this contact and can accelerate confidence accumulation. Ask your Marketing Ops Engineer whether the contact is eligible for a progressive disclosure prompt in their next session on kalder.com — if so, the prompt will appear automatically and invite them to self-identify. No sequence fires until confidence clears.
>
> **Gate 2 fails — classification is ambiguous.** The contact's behavioral activity pointed nearly equally toward two roles, and the program held back rather than act on an uncertain classification. No sequence fires. Ask your Marketing Ops Engineer to check whether the contact's classification has resolved since the last review. A progressive disclosure response from the contact — if prompted — resolves ambiguity by providing a direct self-identification.
>
> **Both gates pass but no sequence fires.** Contact your Platform Engineer. The AEP → Salesforce connection may not have written the alert field correctly. This is a pipeline issue, not a classification issue.

---

### 6.6 Per-Cohort Activation Map

**For BDRs and AEs.** Accounts in the program are organized into four groups (cohorts) based on where they are in the buying journey. Each cohort has a specific set of convergence point alerts that fire — and specific alert recipients and sequence owners.

| Cohort | Active Convergence Point Alerts | Alert Recipient | Alert Delivery Channels | Sequence Owner |
|---|---|---|---|---|
| `education` | None | — | — | — |
| `acquisition` | `problem_validation`, `requirements_framing` | BDR | CRM task + Slack (`slack_sdr_channel`) | SDR-owned |
| `progression_early_to_mature` | `solution_validation`, `business_value_alignment`, `risk_compliance_validation` | AE | CRM task + Slack (`slack_sdr_channel`) | AE-owned |
| `progression_win_now` | `final_commitment`, `risk_compliance_validation` (elevated priority) | AE | CRM task + Slack (`slack_sdr_channel`) | AE-owned |

**`education` cohort:** Accounts in the education cohort are in early engagement — the program does not yet have enough buying group signal to fire convergence point alerts. BDRs should not expect alerts for education-cohort accounts.

**`progression_win_now` interim behavior:** `progression_win_now` alerts are not active until the Kafka `sfdc_opportunity_stage` pipeline is confirmed per Section 8. Until confirmed: accounts that should be in `progression_win_now` receive `progression_early_to_mature` sequences and standard-priority `risk_compliance_validation` alerts.

**`risk_compliance_validation` in two cohorts:** This alert appears for both `progression_early_to_mature` and `progression_win_now` accounts but fires at different priority levels. In `progression_early_to_mature`, it fires at standard priority. In `progression_win_now`, it fires at elevated priority — a late Ratifier block in an advanced-stage deal carries full-reset risk that does not exist at earlier stages.

---

### 6.7 Alert Payload Fields

**For BDRs and AEs.** When an alert arrives in your CRM task or Slack notification, it carries six fields. The table below explains what each field contains, whether it is standard across all clients (canonical) or configured by your organization (client-configured), and where it appears in your tooling.

| Field | Contents | Canonical / Client-Configured | Where It Appears in Your Tooling |
|---|---|---|---|
| `bg_stage` | The account's buying group pipeline stage at the time the alert fires (`targeted`, `engaged`, `prioritized`, or `qualified`) | Canonical | CRM task, Slack alert |
| `convergence_point` | The convergence point being approached — the specific buying group alignment moment that triggered the alert | Canonical | CRM task, Slack alert |
| `roles_active` | The list of roles at this account that are currently at MEDIUM or higher confidence — the contacts the program believes are actively involved in the evaluation | Canonical | CRM task, Slack alert |
| `blocker_risk` | Named blocker conditions that pose risk at this convergence point — either blockers already signaled by the contact's behavior or blockers the AE should watch for proactively | Canonical | CRM task, Slack alert |
| `recommended_action` | What to do next — specific action guidance authored by the program for this convergence point | Canonical — **do not modify** | CRM task and Slack alert. Not included in the Outreach sequence email body. |
| `crm_field` | The Salesforce custom field to which the alert payload is written | Client-configured | Configured at onboarding per Section 6.1 |

---

### 6.8 `recommended_action` Non-Modification Rule

**For onboarding teams and sales operations.** The `recommended_action` field contains specific, convergence-point-calibrated guidance authored by the program. It is not a template to be adapted — it is an operational instruction.

> **REQUIRED — `recommended_action` text must not be reworded**
> The `recommended_action` text is authored by the program and encodes the buying group model's interpretation of the specific buying moment. Its action specificity is what makes the alert useful rather than noise. An onboarding team that rewrites this text to match preferred sales language removes the specificity. The canonical text must appear in full and unmodified in the CRM task. Confirm at onboarding that the Salesforce custom field character limit accommodates the full text without truncation. Authority: §SA SALES_ACTIVATION_CONFIG `onboarding_note`.

**For context.** When a Risk & Compliance Validation alert fires, for example, the `recommended_action` instructs the AE to proactively share the SOC 2 report, DPA template, and Trust Center summary — because reactive Ratifier engagement is the most common failure mode at that convergence point. Changing this to "follow up with the prospect" eliminates the specificity that converts the alert from a notification into an action. The canonical text remains unchanged across all accounts.

---

### 6.9 `tal_channel` Routing

**For Platform Engineers and sales operations.** The `tal_channel` attribute on each account (`direct`, `msp`, or `partner`) routes convergence point alerts to the appropriate sales team and may activate a channel-specific Outreach sequence variant.

1. **`direct` accounts** follow the standard cohort-to-sequence paths specified in Section 6.6: `acquisition` alerts route to SDR-owned sequences; `progression` alerts route to AE-owned sequences.
2. **`msp` and `partner` accounts** route to channel-specific sequences or to partner-aware SDR and AE teams. The canonical alert payload — all six fields in Section 6.7 — applies without modification across all channel variants. What changes is the sequence triggered and the alert recipient, both of which are client-configured at onboarding.

**Fallback behavior.** A `direct`, `msp`, or `partner` account without the appropriate sequence variant configured for its channel falls back to `direct` routing. This means a `partner` account with no partner-channel sequence configured will receive the standard direct-channel sequence — which may be inappropriate for the channel relationship. Onboarding must include channel-variant configuration for all three channel types before sales activation goes live. Cross-reference Section 11 for the channel-variant configuration step in the onboarding checklist.

---

### 6.10 `classification_mismatch` Advisory Notification

**For AEs.** Occasionally the program's behavioral classification of a contact (based on how they browse kalder.com) and the firmographic title data from a third-party provider disagree about what role that contact holds. When this happens, the program sends an advisory notification — an informational alert, not an action trigger.

The `classification_mismatch` notification is not a convergence point alert. It does not trigger an Outreach sequence. It does not block or modify any sequence that is already active. It fires on contact attribute state — specifically when the `classification_mismatch` flag is set — not on buying group proximity to a convergence point. It is delivered to the assigned AE only.

The exact notification language is locked in Document 5, Section 9.6 and must not be modified at onboarding. The notification tells the AE which role the program's behavioral classification assigned and which role the firmographic title data suggests, and notes that the two disagree.

**AE action.** Review the contact's recent page activity on kalder.com to assess which role framing is more accurate for this specific individual. The behavioral classification governs the contact's kalder.com experience and governs Outreach sequence targeting — the firmographic title data is supplementary intelligence for conversation calibration only. If the AE believes the firmographic role is correct, they can provide that feedback through the designated feedback channel; the behavioral classification remains operative until signal accumulation or a zero-party self-identification resolves the mismatch.

---

### 6.11 Holdback Group and Sales Activation

**For AEs and Platform Engineers.** A portion of TAL contacts — assigned deterministically at first identification — are placed in a holdback group. This group is used for measurement purposes: comparing the program's effect on contacts who receive personalization against those who do not. Holdback contacts receive a standard brand-level experience on kalder.com rather than role-specific personalized content.

Holdback status (`holdback_group = True`) suppresses progressive disclosure prompts on kalder.com. It does not suppress Outreach sequence activation. The same two gates from Section 6.5 apply identically to holdback contacts: if `confidence_tier` is `MEDIUM` or `HIGH` and `differential_insufficient` is `False`, the holdback contact is eligible for Outreach sequence activation through behavioral accumulation alone.

**The known asymmetry.** Holdback contacts are less likely to reach MEDIUM+ confidence than comparable contacts in the treatment group. The reason: progressive disclosure is the primary mechanism by which contacts with ambiguous or near-threshold behavioral scores upgrade to MEDIUM+ confidence through a zero-party role declaration. Holdback contacts cannot use this mechanism. Their path to MEDIUM+ confidence is through behavioral signal accumulation only — slower and less certain than the zero-party upgrade path. This asymmetry is a known characteristic of the holdback design, not a pipeline error. Lower sales activation rates for holdback contacts relative to treatment contacts are expected and are part of the measurement design.

**Diagnostic path for AEs.** If a holdback contact is not appearing in an expected sequence:

1. Confirm `confidence_tier` is `MEDIUM` or `HIGH` for the contact in the AEP profile.
2. Confirm `differential_insufficient` is `False` for the contact.
3. If both gates pass and the holdback contact is still not receiving sequences, contact the Platform Engineer — the AEP → Salesforce connection may not have written the alert field correctly for this contact.

---

*End of Section 6. PENDING-SA-1, PENDING-SA-4, PENDING-D3-3, PENDING-D3-4, and PENDING-D3-5 are resolved. PENDING-SA-2 (progression_win_now Kafka pipeline) is resolved in Section 8. Section 7 (Coverage Gap Management) and Section 8 (progression_win_now Cohort Activation) follow.*

---

## Section 7: Coverage Gap Management

> **Document position:** Document 8, Section 7
> **Resolves:** D8-Flag-09 (Level 3 ungated Asset threshold query), D8-Flag-12 (tuple-level coverage monitoring versus CLIENT_ATTRIBUTE_MAP)
> **Depends on:** §CA (Section 2, locked); Section 3 (Diverge Commissioning); Section 5 (Weekly Monitoring); Document 4 Sections 7.4–7.5 (coverage gap escalation and category priority)
> **Audience:** Content Ops Lead (alert reading, backlog building, sprint initiation); Analytics Lead (gap verification query, threshold calibration)
> **Entry point:** Section 5 Check 3 escalation — a `pending_solution_fallback` threshold breach has been confirmed and routed here
> **Exit point:** A prioritized sprint node list handed to Section 3.2 Step 5

---

### 7.1 Overview

Section 7 is the bridge between a Section 5 monitoring escalation and a Section 3 commissioning sprint. When Check 3 of the weekly monitoring cycle confirms that a `pending_solution_fallback` event count has exceeded its calibrated threshold for a solution category, the Content Ops Lead and Analytics Lead jointly execute the procedure in this section. The output is a prioritized sprint node list — a complete enumeration of `(solution_category, role, buying_stage, module_type)` combinations ready for Section 3 sprint planning.

This section does not cover sprint execution. It ends at the sprint initiation handoff. Everything that follows — generation context assembly, review, approval, publish — is Section 3.

---

### 7.2 Reading the Alert Payload

**Responsibility: Content Ops Lead**

When the threshold breach alert fires, it arrives with a four-field payload. The `gap_summary` field is the primary sprint backlog input; the other three fields provide context and urgency signal.

| Field | Contents | How the Practitioner Uses It |
|---|---|---|
| `solution_category` | The solution category triggering the alert | Identifies which category's sprint to initiate |
| `current_coverage_status` | The current effective `coverage_status` for the category | Identifies which coverage level gate the sprint must advance through |
| `fallback_event_count_7d` | The 7-day event count that triggered the threshold | Provides urgency signal; higher counts mean more visitors are currently underserved |
| `gap_summary` | Specific `(role, buying_stage)` combinations and missing module types, with required count and present count per module type | The primary sprint backlog input — specific enough to become a content brief without additional investigation |

> **REQUIRED — Do not proceed without a valid `gap_summary`**
> If the `gap_summary` field is absent or malformed in the alert payload, do not attempt to reconstruct the gap from the dashboard or from memory. Escalate to the Platform Engineer — the alert pipeline is not correctly populating `gap_summary` from the coverage tracking pipeline output. Do not initiate a sprint until a valid `gap_summary` is confirmed.

---

### 7.3 Gap Verification Query

**Responsibility: Analytics Lead**

Before the Content Ops Lead builds the sprint backlog, the Analytics Lead runs a gap verification query against Sanity to confirm the `gap_summary` reflects the current state of the content graph. The alert payload is computed at threshold breach time; by the time the weekly review session occurs, some nodes may have been commissioned and approved in the intervening days.

1. For each `(solution_category, role, buying_stage, module_type)` tuple listed in the `gap_summary`, query Sanity for existing nodes matching those four fields.
2. For each tuple, classify the result into one of four states: (a) absent — no node exists; (b) commissioning-incomplete — node exists with `confidence_tier_minimum: null`; (c) in-progress — node exists with `status: under_review`; (d) approved — node exists with `status: approved`. Approved nodes are false positives in the gap summary; remove them from the sprint backlog.
3. Return the verified gap list to the Content Ops Lead with each tuple classified. The Content Ops Lead uses this classification to build the sprint backlog in Section 7.4.

> **EDGE CASES IN GAP VERIFICATION**
>
> **(a) Node exists with `confidence_tier_minimum: null`.** The node is not absent — it exists in Sanity but is commissioning-incomplete. Do not add it to the sprint backlog as a new commission. Return it to the review queue for Stage R3 `confidence_tier_minimum` assignment per Section 3.5. Record this as a review-queue item, not a generation item, in the gap verification output.
>
> **(b) Node exists with `status: under_review`.** The node is in progress. Do not re-commission it. Add a "review pending" flag to the sprint backlog entry for tracking purposes — this gap will close when the review completes, not when a new node is generated. Flagged entries are excluded from the sprint node count but are tracked until the review resolves.
>
> **(c) `gap_summary` is absent or malformed.** Do not attempt to reconstruct the gap. Escalate to the Platform Engineer per Section 7.2. Gap verification cannot proceed without a valid `gap_summary`.

---

### 7.4 Sprint Backlog Prioritization

**Responsibility: Content Ops Lead**

After the verified gap list is returned from the Analytics Lead, the Content Ops Lead builds and prioritizes the sprint backlog. Prioritization uses three criteria applied in order. When criterion 1 produces a tie, apply criterion 2. When criteria 1 and 2 both produce a tie, apply criterion 3.

**Prioritization rule 1 — Coverage level gate proximity (critical-path gaps first).** Commission gaps that are blocking the next coverage level threshold before gaps that are below a lower threshold. A solution category at `level_2` whose gap is preventing `level_3` activation takes priority over a category at `level_1` that needs `level_2` work. The `current_coverage_status` field from the alert payload identifies where each category currently sits.

**Prioritization rule 2 — Solution category traffic volume priority.** Within ties on rule 1, apply the Document 4 Section 7.5 category priority tiers: `customer_engagement` and `employee_experience` are High priority; `risk_compliance` and `ai_platform` are Medium priority. High-priority categories take precedence over Medium-priority categories at the same coverage gate position.

**Prioritization rule 3 — `pending_solution_fallback` event rate.** Within ties on rules 1 and 2, the solution category with the higher `fallback_event_count_7d` (from the alert payload) takes precedence. A higher event count means more visitors are currently receiving an unserved experience — that gap has more active consequence than a gap with lower volume at the same priority tier.

**Sprint maximum.** A single sprint cycle takes a maximum of 12 nodes. If the verified gap list produces more than 12 node entries after applying the three prioritization rules, the top 12 enter the current sprint and the remainder carry forward in priority order to the next sprint. Do not attempt to commission more than 12 nodes per sprint cycle — the review capacity constraint is the binding limit, not the generation capacity.

---

### 7.5 Level 3 Asset Threshold Verification

**Responsibility: Analytics Lead (query); Content Ops Lead (backlog entry)**

When a `gap_summary` entry indicates a Level 3 gap involving the `gated_assets` module type, the standard module-count check is not sufficient. Level 3 activation requires that approved ungated `Asset` nodes meet a two-condition threshold, not just a count threshold. Run the following query before adding a Level 3 Asset gap entry to the sprint backlog.

**Query conditions (all three must apply to the result set):**

1. `solution_category` matches the target solution category
2. `gating: ungated`
3. `status: approved`

**Two-condition qualifying check (both must pass):**

1. Total result set count is 3 or greater.
2. Distinct `buying_job` value count in the result set is 2 or greater.

Both conditions must pass for Level 3 Asset coverage to be satisfied. Passing condition 1 alone — having three or more approved ungated Assets — is not sufficient if those Assets all carry the same `buying_job` value.

> **NAMED CASE — single `buying_job` result set**
> A result set of three ungated approved Assets all tagged `buying_job: supplier_selection` does not satisfy the Level 3 threshold — the distinct `buying_job` count is 1, not 2. The sprint backlog entry for this gap must specify the missing `buying_job` value required, not just "add 1 Asset." The Content Ops Lead records the present `buying_job` values and the required `buying_job` value in the backlog entry so the generation brief is specific from the start.

This requirement resolves D8-Flag-09.

---

### 7.6 Threshold Calibration

**Responsibility: Analytics Lead**

The `pending_solution_fallback` escalation threshold is initialized at 50 events per 7 days per solution category (per data model `§4 escalation_threshold`). This starting value must be replaced with a calibrated threshold within 30 days of v1 launch. The following five-step procedure produces the calibrated threshold.

1. **Collect the observation window.** During the 30-day post-launch window, record the daily `pending_solution_fallback` event count per solution category. Preserve the daily granularity — the rolling average computation in Step 2 requires it.

2. **Compute the steady-state rolling average.** Calculate the 7-day rolling average of daily event counts across the 30-day window. Apply the following caveat before computing: if the observation period includes a known traffic spike event — a product announcement, an outbound email campaign, or any event expected to drive atypical inbound volume — exclude the spike days from the rolling average calculation before applying the multiplier. Use the non-spike days as the steady-state baseline. A calibrated threshold derived from spike-day data will be permanently too high, causing the escalation mechanism to miss genuine coverage gaps during steady-state traffic.

3. **Apply the 2× multiplier.** Multiply the steady-state 7-day rolling average by 2 to produce the calibrated threshold. This multiplier provides buffer for natural week-over-week traffic variation without suppressing escalation for genuine coverage gaps. The Platform Engineer confirms the alert pipeline reflects the updated thresholds before the observation period ends — not after. Waiting until after means the pipeline runs uncalibrated into steady-state traffic.

4. **Set the calibrated threshold per category.** Each solution category receives its own calibrated threshold. Categories with lower traffic produce lower steady-state event counts and therefore lower calibrated thresholds — a single threshold across all categories would be too high for low-traffic categories and too low for high-traffic categories.

5. **Document and hand off.** Record the calibrated threshold value per category, the observation window dates, any spike days excluded, and the resulting steady-state baseline. Deliver to the Platform Engineer for pipeline configuration. The Analytics Lead retains the calibration record for the next recalibration cycle (60-day post-launch review, then quarterly per Document 4 Section 7.4.2).

---

### 7.7 Sprint Initiation and Section 3 Handoff

**Responsibility: Content Ops Lead**

After the sprint backlog is prioritized and any Level 3 Asset threshold checks are complete, the Content Ops Lead prepares the sprint node list and initiates the Section 3 sprint.

1. Convert the prioritized sprint backlog into a sprint node list: a complete enumeration of `(solution_category, role, buying_stage, module_type)` combinations, limited to the top 12 entries per Section 7.4. Each entry carries its prioritization tier (rule 1 gate position, rule 2 category priority, rule 3 event rate) for reference during sprint review.
2. For any backlog entry flagged as "review pending" (node in `status: under_review`), do not include it in the sprint node list. Record it in the sprint tracking log with expected review completion date and a note that the gap will close without a new commission.
3. For any backlog entry flagged as "commissioning-incomplete" (node with `confidence_tier_minimum: null`), do not include it in the sprint node list. Record the Sanity node ID and route it to the review queue for Stage R3 assignment per Section 3.5.
4. Confirm the sprint node list with the Platform Engineer before generation begins, per Section 3.2 Step 6. The Platform Engineer needs advance notice of the expected approval volume and timing to prepare the sync pipeline.
5. Hand the sprint node list to Section 3.2 Step 5. Section 7 is complete at this handoff. Sprint execution proceeds entirely within Section 3.

---

*End of Section 7. D8-Flag-09 (Level 3 ungated Asset threshold query) and D8-Flag-12 (tuple-level coverage monitoring versus CLIENT_ATTRIBUTE_MAP) are resolved. Section 8 (progression_win_now Cohort Activation) and Section 3 (Diverge Content Commissioning Workflow) are the primary action destinations from this section.*

---

## Section 8: progression_win_now Cohort Activation

> **Document position:** Document 8, Section 8
> **Resolves:** PENDING-SA-2, PENDING-D3-1
> **Depends on:** §CA (Section 2, locked); Section 6 (Sales Activation Workflow); Document 3 Section 2.4 (progression_win_now AEP segment definition); Document 5 (Target activity priority scheme)
> **Audience:** Platform Engineer (Sections 8.2–8.4, 8.8); Marketing Ops Engineer (Sections 8.5–8.6, 8.8); AEs (Section 8.7 only)
> **Scope:** One-time activation sequence. This section executes once when the pipeline is confirmed ready. It does not repeat. After go-live, `progression_win_now` operates through the same weekly monitoring and commissioning cycles as all other cohorts (Sections 5 and 7).

---

### 8.1 Pre-Conditions

> **PIPELINE CONFIRMED — Kafka `sfdc_opportunity_stage` extension feasible**
> The Kafka `sfdc_opportunity_stage` pipeline extension is confirmed feasible for v1 implementation. This resolves PENDING-SA-2 and PENDING-D3-1.

Before any configuration step in Sections 8.2–8.8 begins, all three pre-conditions below must pass. Each is a binary check — pass or fail, no partial credit. A single failed pre-condition blocks the entire activation sequence.

1. The Kafka pipeline extension for `sfdc_opportunity_stage` has been implemented and its output has been verified against a Salesforce test account with a known Opportunity stage value. The AEP account profile for the test account shows the correct integer value for that stage.
2. The client has provided and confirmed the Salesforce StageName-to-integer mapping table — the mapping of each client-defined Salesforce opportunity stage string to an integer value in the range 2–7.
3. `sfdc_opportunity_stage` is writing correctly to the AEP account profile for at least one test account. The profile shows the integer value, not the Salesforce StageName string. A profile showing a string value indicates the mapping rule has not applied correctly.

All three pre-conditions must pass before any step in Sections 8.2–8.8 begins.

---

### 8.2 Kafka Pipeline Extension

**Responsibility: Platform Engineer**

1. Add the `StageName` field to the Kafka event schema for the Salesforce Opportunity object. Confirm the event fires on every `StageName` field update in Salesforce — not only on new opportunity creation. A configuration that fires only on creation will miss stage progression events, which are the primary driver of `progression_win_now` cohort assignment.
2. Implement the stage-to-integer mapping rule in the AEP pipeline using the client-confirmed mapping table from pre-condition 2. Write the result to `sfdc_opportunity_stage` (§CA, Section 2.2.1) as an integer on the AEP account profile. Confirm the write uses the account-plane profile, not the contact-plane profile — `sfdc_opportunity_stage` is an account-plane attribute.
3. Implement the 24-hour staleness check: set `sfdc_opportunity_stage_stale = True` (§CA, Section 2.2.1) when `sfdc_opportunity_stage` has not been updated within 24 hours of the most recent expected sync window. The 24-hour threshold for `sfdc_opportunity_stage_stale` is tighter than the 72-hour TAL staleness threshold governing `tal_last_refreshed_at`. Do not conflate them — a `sfdc_opportunity_stage_stale` check set to 72 hours will allow outdated opportunity stage data to persist in the `progression_win_now` AEP segment for up to three days before flagging.

---

### 8.3 AEP Segment Definition

**Responsibility: Platform Engineer**

Define the `progression_win_now` AEP audience segment using the following gate, sourced from Document 3 Section 2.4:

```
tal_program_status = active_prospect
AND bg_stage = qualified
AND sfdc_opportunity_created = true
AND sfdc_opportunity_stage IN [5, 6, 7]
AND sfdc_opportunity_stage_stale = false
```

**Implementation notes:**

`sfdc_opportunity_stage IN [5, 6, 7]` is an enumerated set, not a threshold. Stage values 1, 2, 3, and 4 do not qualify for `progression_win_now` and must not be included in the segment definition, even if a client's Salesforce stage schema assigns those integers to late-stage opportunity names. The mapping table confirmed in pre-condition 2 is the authoritative source for which integer values correspond to which Salesforce stages — confirm the mapping before finalizing the segment.

**Validation requirement:** The segment must return at least one qualifying test account in the AEP segment UI before any downstream channel activation in Sections 8.4–8.6 proceeds. A segment returning zero accounts at validation time indicates either that the Kafka pipeline has not yet written `sfdc_opportunity_stage` to qualifying accounts or that the mapping table has not applied correctly.

---

### 8.4 Target Activity Creation

**Responsibility: Platform Engineer**

Create the `progression_win_now` Target activity set using the x4xx priority scheme. The creation pattern mirrors the `progression_early_to_mature` x3xx activity set with the hundreds digit changed from 3 to 4, the AEP audience gate updated to the `progression_win_now` segment, and the content inventory drawn from the `progression_win_now` content set.

**x4xx activity priority inventory:**

| Priority Range | Activity Type |
|---|---|
| `1004` | Override |
| `1401`–`1411` | `buying_job`-axis activities |
| `2401`–`2411` | `bg_stage`-axis activities |
| `3401`–`3413` | `confidence_tier`-axis activities (including `cta HIGH` at `3403`; `cta MEDIUM` at `3413`) |
| `4401`–`4411` | `role`-axis activities |
| `5401`–`5411` | `solution_category`-axis activities |
| `6004` | Level 4 account activity |

**Validation requirement:** At least one test account confirmed in the `progression_win_now` AEP segment must receive a Target serve from an x4xx activity before go-live. Verify in Target activity reporting. A test account receiving serves only from x3xx activities indicates the `progression_win_now` audience gate has not been applied to the x4xx activity set or that the test account is not yet in the `progression_win_now` segment.

---

### 8.5 Marketo Program Activation

**Responsibility: Marketing Ops Engineer**

> **ORDERING CONSTRAINT — Activate Marketo program before AEP fires transition events**
> The Marketo `progression_win_now` program must be set to active status before AEP fires cohort transition events. A contact whose transition event fires before the program is active will exit `progression_early_to_mature` with no destination program. They will not hold in `progression_early_to_mature` — they will be unrolled from the Marketo nurture track entirely until manually re-enrolled. This is not a recoverable state without manual intervention.

1. Set the Marketo `progression_win_now` program to active status. Confirm the program is active and accepting new contacts in the Marketo UI before proceeding.
2. Notify the Platform Engineer that the Marketo program is confirmed active. The Platform Engineer proceeds with the AEP transition event step only after receiving this confirmation.
3. AEP identifies all contacts currently enrolled in `progression_early_to_mature` whose account has `sfdc_opportunity_stage IN [5, 6, 7]` and fires program exit events from `progression_early_to_mature` and program entry events to `progression_win_now` for each contact. The Marketing Ops Engineer monitors the transition event log to confirm contacts are entering `progression_win_now` correctly.

---

### 8.6 Outreach Alert Activation

**Responsibility: Marketing Ops Engineer**

Two Outreach alert configurations activate with `progression_win_now`: a new `final_commitment` alert and a new elevated-priority variant of the `risk_compliance_validation` alert.

**`final_commitment` alert configuration.** Follow the Section 6.1 pattern:

1. Provision the three Salesforce custom fields for `final_commitment`: fields carrying `convergence_point`, `roles_active`, and `recommended_action`.
2. Configure the Outreach Salesforce integration to trigger the `final_commitment` sequence on the Salesforce field update event for `final_commitment`.
3. Confirm the `recommended_action` canonical text from `§SA SALES_ACTIVATION_CONFIG` appears unmodified in the CRM task per Section 6.8. Confirm the Salesforce field character limit accommodates the full text without truncation.

**`risk_compliance_validation` elevated priority variant configuration.**

1. Create a separate Outreach sequence variant for `progression_win_now` `risk_compliance_validation` — this is distinct from the `progression_early_to_mature` standard-priority variant. Do not reuse the `progression_early_to_mature` sequence; the elevated-priority variant must have its own sequence identifier.
2. Configure the Slack notification for `progression_win_now` `risk_compliance_validation` alerts to mark the alert as elevated priority. The `progression_early_to_mature` Slack notification for the same convergence point is unchanged.
3. Confirm the `recommended_action` canonical text appears unmodified in the CRM task for both alert types.

**Note for AEs.** The `recommended_action` text for both `final_commitment` and `risk_compliance_validation` alerts appears in the CRM task and Slack alert. It does not appear in the Outreach sequence email body. This is consistent with Section 6.7.

---

### 8.7 Transition of Existing Accounts

**Responsibility: Platform Engineer (transition event log); Marketing Ops Engineer (AE notification)**

Accounts that have been in Stage 5–7 in Salesforce but were previously assigned to `progression_early_to_mature` sequences (because the `progression_win_now` cohort was inactive) will receive an initial batch of elevated-priority alerts immediately after the pipeline activates. AEs must be notified before go-live, not after.

**AE advance notification — send before pipeline go-live.**

The notification must state:

The Marketing Ops Engineer sends this notification via email or Slack to the AE team distribution list at least 48 hours before the planned go-live date. Do not send after go-live — AEs who receive backlog alerts before the notification will misinterpret them as stale data.

1. The `progression_win_now` pipeline is activating on [date].
2. An initial batch of elevated-priority `final_commitment` and `risk_compliance_validation` alerts will arrive for accounts that have been in Stage 5–7 but were previously assigned to `progression_early_to_mature` sequences.
3. These backlog alerts represent accounts whose urgency is genuine but whose timing context is pipeline catch-up — the Stage 5–7 conditions have been true for some time, not triggered by a new event. AEs should treat the alert payload's `recommended_action` as current guidance while recognizing that some of these accounts may already be in conversations that reflect the convergence point the alert is describing.

**Transition event monitoring.** The Platform Engineer monitors the transition event log after pipeline go-live. All qualifying accounts — those with `sfdc_opportunity_stage IN [5, 6, 7]` that were previously in `progression_early_to_mature` — must receive a cohort transition event within 24 hours of pipeline activation. Accounts that have not transitioned within 24 hours are flagged for manual investigation.

---

### 8.8 Go-Live Checklist

All five conditions below must be confirmed before the interim fallback rule is removed.

| Condition | Responsible | Pass Criterion |
|---|---|---|
| 1 — Kafka pipeline writing correctly | Platform Engineer | `sfdc_opportunity_stage` shows the correct integer value on at least five Salesforce accounts, including at least one account with a Stage 5 or higher opportunity |
| 2 — AEP segment validated | Platform Engineer | `progression_win_now` AEP segment returns at least one qualifying account in the segment UI |
| 3 — Target x4xx activities serving | Platform Engineer | Test account in `progression_win_now` segment receives a Target serve from an x4xx activity; verified in Target activity reporting |
| 4 — Marketo program active and enrolling | Marketing Ops Engineer | `progression_win_now` Marketo program is in active status and at least one test contact has successfully transitioned from `progression_early_to_mature` |
| 5 — Outreach alerts configured | Marketing Ops Engineer | `final_commitment` and elevated `risk_compliance_validation` Salesforce custom fields are provisioned; test sequence triggered on a test contact for each alert type |

> **REQUIRED — Atomic removal of interim fallback rule**
> The interim fallback rule (all `qualified` accounts default to `progression_early_to_mature`) and the `progression_win_now` activation rule must not both be active simultaneously. Remove the interim fallback atomically with the `progression_win_now` rule activation. Simultaneous active rules produce double-cohort assignment for Stage 5–7 accounts: the same account enters both `progression_early_to_mature` and `progression_win_now` sequences, generating duplicate alert payloads and conflicting Marketo program enrollments. The Platform Engineer is responsible for confirming the atomic removal before any go-live checklist conditions are marked passed.

---

*End of Section 8. PENDING-SA-2 and PENDING-D3-1 (progression_win_now Kafka `sfdc_opportunity_stage` pipeline) are resolved. The `progression_win_now` cohort is now active across Adobe Target, Marketo, and Outreach following go-live checklist confirmation. Section 9 (AEP → Marketo Connector Configuration) resolves PENDING-D3-2.*

---

## Section 9: AEP → Marketo Connector Configuration

> **Document position:** Document 8, Section 9
> **Resolves:** PENDING-D3-2 — the final open PENDING item in the corpus
> **Depends on:** §CA (Section 2, locked); Section 8.5 (Marketo program activation sequence); Document 3 Section 6.3 (education cohort Marketo suppression)
> **Audience:** Marketing Ops Engineer (primary — connector configuration and enrollment health monitoring); Platform Engineer (secondary — escalation path for connector failures)
> **Scope:** AEP → Marketo connector configuration only. Does not cover Marketo program content or nurture track creative (Demand Gen scope); AEP → Salesforce connector (Section 6); Kafka pipeline (Sections 6 and 8); Adobe Target configuration (Sections 3 and 8).

---

### 9.1 Connector Overview

> **CONNECTOR CONFIRMED — AEP Real-Time CDP native Marketo Engage destination connector**
> Two modes, one connector: streaming activation for cohort transition events (program entry/exit); daily batch sync for non-event-driven attribute updates. This resolves PENDING-D3-2.

Both operating modes use the same AEP Real-Time CDP native Marketo Engage destination connector — not two separate connectors. Streaming activation and daily batch sync are configured as two activation flows on the same connector instance. This matters for monitoring: a connector failure affects both modes simultaneously; a monitoring check that confirms streaming activation is healthy does not independently confirm batch sync health. Both modes must be monitored separately per Section 9.6.

**Streaming mode** handles cohort transition events — program entry and exit events that fire when a contact's `bg_cohort` changes. Latency target: under 5 minutes from AEP segment transition to Marketo program enrollment event.

**Batch mode** handles non-event-driven attribute updates: `role_classification`, `confidence_tier`, `bg_stage`, and `differential_insufficient`. These attributes update on the daily scoring cycle and do not generate transition events. The batch sync writes their current values to Marketo once per day.

---

### 9.2 Segment-to-Program Mapping

The Marketing Ops Engineer configures the following segment-to-program mapping in the AEP Marketo Engage destination connector. Marketo Program IDs are client-configured at onboarding except where noted.

| Cohort | AEP Audience Segment | Marketo Program ID | Entry Condition | Attributes Read at Enrollment |
|---|---|---|---|---|
| `education` | `education` segment | None — Marketo suppressed | N/A — no enrollment | N/A |
| `acquisition` | `acquisition` segment | Configured at onboarding | Resolved `contact_id` required | `role_classification`, `confidence_tier`, `bg_stage` |
| `progression_early_to_mature` | `progression_early_to_mature` segment | Configured at onboarding | Resolved `contact_id` required | `role_classification`, `confidence_tier` |
| `progression_win_now` | `progression_win_now` segment | Configured at onboarding per Section 8.5 | Resolved `contact_id` required | `role_classification`, `confidence_tier` |

**Education cohort note.** The absence of a Marketo program for the `education` cohort is an intentional design decision per Document 3 Section 6.3 — not a configuration gap. Do not create an `education` Marketo program. Contacts in the `education` cohort receive no Marketo nurture enrollment; they are served by the Adobe Target personalization experience only until their `bg_cohort` advances.

---

### 9.3 Streaming Mode Configuration

**Responsibility: Marketing Ops Engineer**

1. Enable streaming activation mode on the Marketo Engage destination connector in AEP. Confirm the connector shows streaming activation as active before configuring the segment-to-program mapping.
2. Map each AEP cohort segment to its Marketo program ID per the Section 9.2 table. Do not map the `education` segment — it has no Marketo program destination.
3. Configure exit-before-entry event sequencing for all cohort transitions.

   > **EXIT-BEFORE-ENTRY ORDERING REQUIRED**
   > Configure the connector event sequencing to fire the program exit event before the program entry event for all cohort transitions. A contact that enters a new program before exiting the prior program may be double-enrolled if Marketo's program transition logic processes both events simultaneously. The exit-before-entry ordering must be explicitly set in the connector event sequencing configuration — it is not the default behavior. Confirm exit-before-entry is set before testing any cohort transition.

---

### 9.4 Batch Mode Configuration

**Responsibility: Marketing Ops Engineer**

1. Enable scheduled batch sync on the same Marketo Engage destination connector instance used for streaming activation in Section 9.3.
2. Configure the following attribute fields for batch sync, using exact §CA canonical names: `role_classification`, `confidence_tier`, `bg_stage`, `differential_insufficient`. Do not add attributes outside this list without a §CA amendment per Section 2.5 Rule 3.
3. Set the batch sync schedule to run daily. The sync window is configurable at onboarding; the recommended window is 2:00–4:00 AM in the client's primary operating timezone. This off-peak window minimizes interference with active Marketo email sends and Marketo's internal processing queue, which runs heavier during business hours.

The batch sync updates attribute values on enrolled contacts — it does not fire program entry or exit events. Contacts that change `role_classification` via batch sync are reassigned to their new nurture track by a Marketo smart campaign, not by the connector. The connector writes the updated value; the smart campaign detects the field change and executes the track reassignment. Both components must be in place for track reassignment to function.

---

### 9.5 `role_classification = default` Handling

**Responsibility: Marketing Ops Engineer**

Contacts enrolled in Marketo before their `role_classification` has resolved from `default` to a named role begin on the general solution-category track. The daily batch sync delivers the updated `role_classification` value once it resolves, and a Marketo smart campaign detects the field change and reassigns the contact to the role-specific nurture track.

This three-step sequence — enrollment on general track, batch sync delivers resolved value, smart campaign reassigns to role track — functions silently and correctly when all components are in place. The pre-launch gate below governs the most common failure mode.

> **PRE-LAUNCH GATE — Track reassignment smart campaign must be configured before any contacts enroll**
> If the smart campaign is not present when a contact's `role_classification` updates from `default` to a named role, the contact remains on the general track indefinitely without error. This failure is silent — no alert fires, no enrollment event fails. The contact simply never receives role-specific nurture content. The Marketing Ops Engineer must confirm the smart campaign is configured and tested on a test contact before production enrollment begins. Test procedure: enroll a test contact with `role_classification = default`; trigger a batch sync that delivers a resolved role value; confirm the test contact transitions to the role-specific track within one processing cycle.

---

### 9.6 Connector Health Monitoring

**Responsibility: Marketing Ops Engineer (checks); Platform Engineer (escalation)**

Two monitoring checks are required. Both are checked at the weekly monitoring session per Section 5; enrollment lag is also checked within 24 hours of any cohort transition event batch.

1. **Enrollment lag check.** Confirm that contacts whose AEP segment transitions in a given session are enrolled in the destination Marketo program within 30 minutes of the transition event. If any contact's enrollment lag exceeds 30 minutes:
   1. Check the AEP activation log for the event delivery confirmation — confirm the event was sent by AEP.
   2. Check the Marketo connector error log for a failed delivery — confirm Marketo received and processed the event.
   3. If no error is visible in either log and the contact is still not enrolled, escalate to the Platform Engineer. A lag with no visible error in either log indicates a connector processing issue that requires platform-level investigation.

2. **Batch sync completion check.** Confirm daily batch sync completion in the AEP activation log each morning after the scheduled sync window closes. A completed sync shows a success status and a row count in the activation log. If a sync shows no completion record or a failure status:
   1. Log the failure date and the affected sync window.
   2. If two consecutive daily batch syncs fail, Marketo's `role_classification` and `confidence_tier` values may be stale by up to 48 hours. Escalate to the Platform Engineer immediately — do not wait for a third failure. Stale `role_classification` means contacts whose scoring has resolved from `default` to a named role have not received their track reassignment trigger, and `differential_insufficient` values may not reflect the current scoring state for active sales sequences.

---

*End of Section 9. PENDING-D3-2 (AEP → Marketo connector batch sync cadence) is resolved. This is the final PENDING item in the corpus. Sections 10 (Consent and Suppression Management), 11 (New Solution Category Onboarding Checklist), and 12 (Incident Response Procedures) complete Document 8.*

---

## Section 10: Consent and Suppression Management

> **Document position:** Document 8, Section 10
> **Depends on:** §CA (Section 2, locked); Section 6 (AEP → Salesforce connector path); Document 9 (Privacy and Consent Architecture — legal framework authority)
> **Audience:** Marketing Ops Engineer (visitor_consent_state maintenance, Marketo suppression, geographic suppression); Data Engineer (DSR deletion cascade, data retention compliance); Data Privacy Officer / legal representative (DSR intake, deletion confirmation records)

---

### 10.1 Overview

Section 10 operationalizes the consent and suppression architecture across the confirmed stack. Three practitioners carry distinct operational responsibilities:

- **Marketing Ops Engineer** — maintains `visitor_consent_state` propagation, configures Marketo suppression smart campaigns, applies geographic suppression rules per jurisdiction.
- **Data Engineer** — executes the DSR deletion cascade steps 1–4, monitors rolling data retention window compliance, investigates retention errors.
- **Data Privacy Officer / legal representative** — receives and logs DSR intake requests, generates deletion confirmation records after all four cascade steps complete.

Document 9 (Privacy and Consent Architecture) governs the legal framework — legal basis determinations, LIA documentation requirements, DPA governance, and the process for extending consent rules to new jurisdictions. Section 10 does not reproduce that framework. It specifies the operational execution of the consent architecture against the stack confirmed in Document 8.

---

### 10.2 `visitor_consent_state` Maintenance

**Responsibility: Marketing Ops Engineer**

`visitor_consent_state` (§CA, Section 2.2.2) is the pre-pipeline gate attribute. It is read before any signal collection or scoring executes. The following four scenarios govern how the attribute is read and applied at session time.

1. **Null consent state.** If `visitor_consent_state` is null or absent at session start, the system applies `declined` behavior — no signal collection, no scoring, Level 5 experience. The consent management platform must set the attribute before the first session begins. The absence of a consent record is not a permissive default — it is treated as `declined` per §CA Section 2.2.2. The Marketing Ops Engineer confirms at onboarding that the consent management platform is configured to write `visitor_consent_state` to the AEP profile before any visitor session processes.

2. **Returning visitor with stored consent state.** AEP reads `visitor_consent_state` at session start from the visitor's AEP profile. No additional prompt is required if a stored state is present and current. The consent management platform governs when re-consent prompts are required; §CA Section 2.2.2 governs what each stored value means for the scoring pipeline.

3. **Mid-session consent update.** If a visitor updates their consent state during an active session — upgrading from `functional_only` to `full`, or downgrading from `full` to `functional_only` — the update propagates to the AEP profile. The current session continues under the prior consent state. The new state applies at next session start only. Signals already collected in the current session under the prior consent state are not retroactively suppressed. This is the defined operational behavior; it is not a gap.

4. **Consent withdrawal.** If a visitor withdraws consent entirely — setting `visitor_consent_state` to `declined` — the withdrawal triggers the deletion cascade per Section 10.4 and the mid-campaign suppression procedure per Section 10.5. The withdrawal event must be logged with a timestamp before any cascade step begins.

---

### 10.3 Geographic Suppression

**Responsibility: Marketing Ops Engineer**

> **GDPR JURISDICTION IS DETERMINED BY VISITOR IP ADDRESS — NOT BY `tal_region`**
> GDPR suppression applies to any visitor whose detected IP address resolves to an EU, UK, or EEA jurisdiction, regardless of the account's `tal_region` value. A visitor browsing from a UK office whose account carries `tal_region = AMS` receives GDPR suppression. `tal_region` governs campaign routing and content localization; it does not govern consent scope. The consent management platform detects IP jurisdiction — not Demandbase reverse-IP, which is an account identification function, not a jurisdiction detection function.

**GDPR suppression procedure.** For visitors in GDPR jurisdictions:

1. Suppress `demandbase_firmographic_match` regardless of `visitor_consent_state` value until Track 2 DPA review completes per Document 2. This suppression applies even for visitors with `visitor_consent_state = full` — the DPA gap governs at the vendor level, not the individual consent level.
2. Apply signal collection and scoring only to the `legitimate_interest` signal subset per Document 9 Section 4. Do not activate `explicit_consent_required` signals until `visitor_consent_state = full` is confirmed.
3. Confirm the consent management platform is routing GDPR-jurisdiction visitors to the appropriate consent prompt and writing the resulting state to AEP before any session processing occurs.

**CCPA suppression procedure.** For visitors in CCPA jurisdictions:

1. The 19 `legitimate_interest` signals are unaffected by CCPA opt-out. These signals may be collected and scored regardless of opt-out status.
2. `explicit_consent_required` signals require opt-out notice before activation. Confirm the consent management platform has delivered opt-out notice before any `explicit_consent_required` signal is activated for CCPA-jurisdiction visitors.
3. Document 9 Section 5 governs the signal classification boundary between `legitimate_interest` and `explicit_consent_required` for CCPA purposes.

**Default suppression procedure.** When jurisdiction is undeterminable — the visitor's IP address does not resolve to a recognizable jurisdiction or the consent management platform cannot classify it — apply `functional_only` behavior as the default. Do not default to `full` on indeterminate jurisdiction.

---

### 10.4 DSR Deletion Cascade

**Responsibility: Data Engineer (Steps 1–4); Data Privacy Officer / legal representative (intake and confirmation)**

When a DSR deletion request is received, the Data Privacy Officer logs the intake with: subject visitor_id or contact_id, request receipt timestamp, request type, and requestor identity. The Data Privacy Officer logs the intake and initiates the cascade immediately — the SLA clock starts at intake receipt, not 24 hours after intake. Any delay in cascade initiation reduces the effective time available to complete Steps 3 and 4 within their 168-hour SLAs.

| Step | System | Action | Responsible | SLA |
|---|---|---|---|---|
| 1 | AEP | Delete all `scored_role_attributes` profile attributes for the subject visitor | Data Engineer | 72 hours from trigger |
| 2 | Segment | Suppress future event collection for the subject visitor_id; submit historical event deletion request to Segment | Data Engineer | 72 hours from trigger |
| 3 | Snowflake | `DELETE` on `visitor_signals` and `visitor_scores` tables for the subject `visitor_id` | Data Engineer | 168 hours (7 days) from trigger |
| 4 | Salesforce CRM | Null buying group enrichment fields on the subject contact record; retain the base contact record | Data Engineer / CRM Admin | 168 hours (7 days) from trigger |

> **PARTIAL COMPLETION IS NOT CONFIRMED DELETION**
> A cascade that completes Steps 1 and 2 within 72 hours but stalls at Step 3 or Step 4 is not a confirmed deletion and must not be reported as one. All four steps must complete before the deletion confirmation record is generated. A deletion confirmation record generated before all four steps complete is invalid for DSR audit purposes.

**Deletion confirmation record.** The Data Privacy Officer generates the confirmation record only after receiving completion timestamps for all four steps from the Data Engineer. The record must include: step identifiers (1–4), system names, completion timestamps for each step, subject `visitor_id` or `contact_id`, and trigger event type and date.

---

### 10.5 Mid-Campaign Consent Withdrawal

**Responsibility: Marketing Ops Engineer**

When a visitor's `visitor_consent_state` transitions to `declined` during an active Marketo or Outreach engagement, two suppression rules apply immediately. Both are pre-launch gates — they must be configured before production enrollment begins.

> **PRE-LAUNCH GATE — Marketo suppression smart campaign**
> A Marketo suppression smart campaign must be configured at onboarding. The smart campaign fires on `visitor_consent_state = declined` and immediately exits the contact from all active Marketo programs. This is a consent obligation, not an optional configuration. A contact who remains in an active Marketo program after withdrawing consent is a compliance breach. The Marketing Ops Engineer must confirm the smart campaign is configured and tested on a test contact before any production contacts enroll in Marketo programs.

> **OUTREACH CONSENT GATE — Check at sequence trigger time**
> The Outreach integration must check `visitor_consent_state` from the Salesforce CRM record at sequence trigger time, via the AEP → Salesforce connector path confirmed in Section 6. If `visitor_consent_state = declined` in the CRM record at the moment a sequence trigger evaluates, the trigger is blocked regardless of whether the contact otherwise meets both sales activation gates in Section 6.5. Sequence triggers that do not check `visitor_consent_state` at trigger time are not compliant with this requirement. The Marketing Ops Engineer confirms the trigger-time check is implemented and tested before Outreach sequences go live.

**Timing note.** The AEP → Salesforce connector propagation latency for `visitor_consent_state` updates follows the same path as other alert writes (Section 6.2 nominal 5–20 minutes). During the propagation window, a sequence trigger that evaluates before the CRM field updates may fire before the withdrawal is reflected. The Marketing Ops Engineer confirms the acceptable propagation latency with the Data Privacy Officer before go-live. Any sequence that fires during the propagation window for a contact who has withdrawn consent must be immediately cancelled and logged as a consent protocol exception by the Marketing Ops Engineer.

---

### 10.6 Data Retention Operating Procedure

**Responsibility: Data Engineer (retention monitoring); Marketing Ops Engineer (quarterly check)**

**Scoring decay versus data retention.** A signal with an `over_180_days` decay multiplier of 0.0× is not deleted. It receives zero weight in scoring calculations, but the underlying event record persists in Snowflake until the 365-day `raw_behavioral_signals` retention window expires. Scoring decay and data deletion are independent processes operating on different timelines. Do not conflate them: a contact with all signals at 0.0× weight is not data-clean — their event records are present in Snowflake until the 365-day window elapses.

**Quarterly retention monitoring check.** The Marketing Ops Engineer or Data Engineer confirms rolling retention window compliance quarterly. The check queries `raw_behavioral_signals` for any event record whose timestamp exceeds 365 days from the query date. The expected result is zero records. If any records are returned:

1. Log the count, affected `visitor_id` values, and the oldest event timestamp found.
2. Escalate to the Data Engineer for investigation.

> **NAMED ERROR CONDITION**
> Signal data present in `raw_behavioral_signals` after the 365-day retention window has expired is a pipeline error requiring investigation — not expected behavior. The retention deletion job has failed or has not been configured. This is not a regulatory exception or a scoring anomaly. The Data Engineer investigates the retention deletion pipeline and confirms remediation before the next quarterly check.

---

*End of Section 10. Section 11 (New Solution Category Onboarding Checklist) and Section 12 (Incident Response Procedures) complete Document 8.*

---

## Section 11: New Solution Category Onboarding Checklist

> **Document position:** Document 8, Section 11
> **Depends on:** §CA (Section 2); Sections 3, 6–10 (all locked); Document 1 Section 5 (role keys); Document 2 Section 10.1 (consent classification defaults); Document 4 Section 7.5 (Level 3 node requirements); Document 6 Section 5 (JTBD code structure)
> **Audience:** Program Manager (checklist owner, go-live authorization); Content Ops Lead (Narrative and Audience node authoring, Gate 1 commissioning); Platform Engineer (data model registration, AEP configuration, holdback verification, escalation threshold); Marketing Ops Engineer (Marketo and Outreach configuration); Data Privacy Officer (consent classification sign-off)

---

### 11.1 Overview

This checklist governs everything from the decision to add a new solution category to Level 3 (Gate 1) production activation. Total elapsed time from checklist start to Level 3 go-live: **6–10 weeks**. The primary constraint is the Gate 0 foundational node authoring phase, which requires 2–3 weeks and cannot be parallelized with Content Module commissioning.

**Phase map:**

| Phase | Content | Typical Duration |
|---|---|---|
| 11.2 — Phase 1: Pre-Activation Setup | Data model registration, client attribute configuration, consent classification, holdback verification, threshold initialization | 2–3 weeks (concurrent with Phase 2) |
| 11.3 — Phase 2: Gate 0 — Foundational Node Authoring | Narrative and Audience node authoring and approval | 2–3 weeks |
| 11.4 — Phase 3: Gate 1 — Level 3 Commissioning | 11 content nodes generated, reviewed, approved, and synced | 1–2 weeks |
| 11.5 — Phase 4: Channel Configuration | Marketo, Outreach channel variant, suppression smart campaign | Concurrent with Phase 3 |
| 11.6 — Phase 5: Go-Live Authorization | Six-condition checklist, Program Manager sign-off | 1 day |

Gates 2 and 3 — Level 2 and Level 1 activation — continue on the ongoing commissioning cadence after go-live via Sections 3 and 7.

---

### 11.2 Phase 1: Pre-Activation Setup

**Pre-activation setup runs in the first 2–3 weeks, concurrent with Phase 2 foundational node authoring.**

1. **`§1d SOLUTION_CATEGORIES` registration.** *Platform Engineer.* Register the new solution category key in `§1d SOLUTION_CATEGORIES` in the data model. Set `coverage_status: pending`. Key naming convention: lowercase, underscore-separated, maximum 25 characters (e.g., `it_operations`, `customer_engagement`). Confirm the key matches the value that will be used in all AEP audience segments, Sanity content nodes, and Target activity configurations — a key mismatch between systems produces silent routing failures.

2. **`§19 TITLE_ROLE_MAP` completion.** *Content Ops Lead.* Add a minimum of 10 title entries spanning all five buying group roles (`champion`, `economic_buyer`, `influencer`, `user`, `ratifier`) for the new solution category. Cross-reference Document 1 Section 5 for authoritative role key values. The TITLE_ROLE_MAP is the primary input for Tier 1 ML classification — an undersized or role-skewed map produces classification bias toward the roles with more title entries.

3. **`§17 JTBD_CODES` provisioning.** *Content Ops Lead.* Provision a minimum of 4 JTBD codes for the new solution category — one per buying job value (`problem_identification`, `solution_exploration`, `requirements_building`, `supplier_selection`). Minimum `coverage_status: constructed` at this stage. Cross-reference Document 6 Section 5 for JTBD code structure and naming conventions. JTBD codes must be in place before `cta` Content Module generation begins (Phase 3 Item 4).

4. **`§CA` client attribute configuration.** *Platform Engineer / Marketing Ops Engineer.* Four §CA attributes require client-provided configuration input before AEP pipeline activation. Obtain and confirm each before pipeline go-live:
   - `sfdc_opportunity_stage` — client provides the Salesforce StageName-to-integer mapping table (see §CA Section 2.2.1 and Section 8.2).
   - `tal_region` — client provides the complete region value enumeration from their Salesforce account schema (see §CA Section 2.2.1).
   - `tal_channel` — client confirms the Salesforce field that holds the channel designation and confirms which values map to `direct`, `msp`, and `partner` (see §CA Section 2.2.1).
   - `tal_account_type_source` — client provides the Salesforce account type field mapping and confirms which values map to each enum value (see §CA Section 2.2.1).

5. **Holdback group verification.** *Platform Engineer.* Confirm the `holdback_group` attribute (§CA Section 2.2.2) is writing correctly to newly TAL-identified contacts at approximately 10% assignment rate. Holdback Target activities at priorities 5951–5954 activate automatically for any TAL-identified visitor — no additional configuration is required per new solution category. Note: the `progression_win_now` holdback (priority 5954) is pending activation per Section 8 and is not yet active. Confirm holdback write rate against a sample of new contacts in the AEP profile viewer before proceeding to Phase 2.

6. **Consent classification.** *Data Privacy Officer.* Confirm all behavioral signals associated with the new solution category are classified in `SIGNAL_CONSENT_REQUIREMENTS` per Document 2 Section 10. Unclassified signals default to `functional_only` treatment per Document 2 Section 10.1 `PENDING_CONSENT_CLASSIFICATION_DEFAULT` — this is a structural safeguard, not a deployment blocker, but any signal intended to activate as `explicit_consent_required` must be classified before go-live. The Data Privacy Officer signs off on consent classification before go-live authorization (Phase 5).

7. **Escalation threshold initialization.** *Platform Engineer.* Set the `pending_solution_fallback` event threshold for the new solution category to 50 events per 7 days in the `§4 escalation_threshold` configuration. The 30-day post-launch calibration procedure in Section 7.6 applies after go-live. Do not attempt to pre-calibrate before production traffic is observed.

---

### 11.3 Phase 2: Gate 0 — Foundational Node Authoring

**Gate 0 authoring is the critical-path constraint for the entire onboarding timeline. Begin this phase as soon as the solution category decision is confirmed — do not wait for Phase 1 completion.**

> **GATE 0 BLOCKING CONDITION**
> Content Module commissioning cannot begin until all four Narrative nodes and all five Audience nodes are in `status: approved`. This gate delay typically requires 2–3 weeks. Do not schedule Content Module commissioning work in parallel with Narrative node authoring — the prerequisite checks in Section 3.3 will block Kalder Compose generation until Gate 0 is complete. A sprint plan that schedules Content Module generation in the same week as Narrative node authoring will fail at Section 3.3 Gate 1.

1. **Author 4 Narrative nodes.** *Content Ops Lead.* One node per buying stage (`targeted`, `engaged`, `prioritized`, `qualified`). Each node requires at minimum: `solution_claim`, `message_pillar`, and a `supporting_claims` array with 5 or more entries. Human-authored — Kalder Compose does not generate Narrative nodes. Cross-reference Document 4 Section 8.3.1 for Narrative node field specifications.

2. **Author 5 Audience nodes.** *Content Ops Lead.* One node per buying group role (`champion`, `economic_buyer`, `influencer`, `user`, `ratifier`). Human-authored. Cross-reference Document 4 Section 8.3.2 for Audience node field specifications.

3. **Advance all 4 Narrative nodes to `status: approved`.** *Content Ops Lead.* Each node passes standard editorial review before approval. Do not advance any Narrative node to `status: approved` without confirming `supporting_claims` has at least 5 entries — Content Module generation for any buying stage referencing a sparse `supporting_claims` array will produce weak through-line compliance at Stage R2.

4. **Advance all 5 Audience nodes to `status: approved`.** *Content Ops Lead.*

5. **Gate 0 confirmation.** *Content Ops Lead.* Confirm: (a) all 4 Narrative nodes are at `status: approved`; (b) all 5 Audience nodes are at `status: approved`; (c) JTBD nodes for the new category are at minimum `coverage_status: constructed`; (d) at least one TITLE_ROLE_MAP entry is present for each of the five roles. Phase 3 does not begin until all four conditions are confirmed.

---

### 11.4 Phase 3: Gate 1 — Level 3 Commissioning

**11 nodes total: 8 Content Module nodes + 3 Asset nodes**, per Document 4 Section 7.5 Level 3 commissioning requirements. All 11 nodes follow the Section 3 workflow (Phases 1–4: Generate, Review, Approve, Publish/Sync).

1. **1 `hero` Content Module node.** *Content Ops Lead.* Solution-category-level, no role specificity. `confidence_tier_minimum: UNKNOWN`. Standard long-form review track.

2. **1 `benefits` Content Module node.** *Content Ops Lead.* Solution-category-level. `confidence_tier_minimum: UNKNOWN` or `LOW` depending on specificity of claims per Section 3.5 Stage R3 decision rule.

3. **1 `narrative` module slot Content Module node.** *Content Ops Lead.* Solution-category-level. References an approved Narrative node. Compose-assisted, long-form review track per Section 3.9.

4. **4 `cta` Content Module nodes.** *Content Ops Lead.* One per buying job value: `problem_identification`, `solution_exploration`, `requirements_building`, `supplier_selection`. `jtbd_ref` is required on all four — confirm JTBD codes from Phase 1 Item 3 are at minimum `coverage_status: constructed` before generating these nodes. Short-form review track per Section 3.5.

5. **1 `problem_framing` Content Module node.** *Content Ops Lead.* Solution-category-level. Short-form review track.

6. **3 ungated `Asset` nodes.** *Content Ops Lead.* Total count ≥ 3 AND distinct `buying_job` value count ≥ 2. This is the Level 3 Asset threshold from Section 7.5 — both conditions must pass independently. A result set of 3 Assets all tagged the same `buying_job` value does not satisfy this threshold. Record the `buying_job` values present in the Asset set before approval to confirm the distinct-count condition.

7. **Sanity publication and sync confirmation.** *Platform Engineer.* After all 11 nodes reach `status: approved`, confirm: (a) sync pipeline has written all 11 nodes to the Target offer catalog; (b) no `phase: converge` exclusion log entries exist for any of the 11 nodes (all 11 are `phase: diverge`); (c) coverage tracking pipeline has updated `solution_category_coverage_status` in AEP for the new category.

8. **Gate 1 confirmation.** *Platform Engineer / Analytics Lead.* Confirm the `solution_category_coverage_status` AEP attribute shows `level_1` or higher for the new solution category. Monitor `pending_solution_fallback` event count for the new category in the 48 hours following the final node approval — a declining event rate confirms the coverage tracking pipeline and Target activity configuration are functioning correctly.

---

### 11.5 Phase 4: Channel Configuration

**Channel configuration runs concurrently with Phase 3. All four items must be confirmed before go-live authorization.**

1. **Marketo segment-to-program mapping.** *Marketing Ops Engineer.* Map the new solution category's AEP cohort segments to Marketo program IDs per Section 9.2 and Section 9.3 Step 2. Confirm the track reassignment smart campaign from Section 9.5 is configured and tested for the new category before any contacts enroll. The PRE-LAUNCH GATE in Section 9.5 applies — a missing smart campaign produces silent track-assignment failure.

2. **Marketo suppression smart campaign.** *Marketing Ops Engineer.* Confirm the `visitor_consent_state = declined` suppression smart campaign from Section 10.5 is active and correctly scoped to include the new solution category's Marketo programs. A new Marketo program that is not covered by the suppression smart campaign is a consent compliance gap.

3. **Outreach channel variant configuration.** *Marketing Ops Engineer.* If any accounts in the new solution category's TAL carry `tal_channel = msp` or `tal_channel = partner`, configure channel-specific Outreach sequence variants before convergence point alerts activate.

   > **CHANNEL VARIANT FALLBACK CONSEQUENCE**
   > An account without a channel variant configured for its `tal_channel` value falls back to `direct` routing — an `msp` or `partner` account receives the direct-channel sequence, which may be inappropriate for the channel relationship. Confirm channel variant configuration is complete for all `tal_channel` values present in the new solution category's TAL before any convergence point alerts activate for those accounts.

4. **Outreach `recommended_action` confirmation.** *Marketing Ops Engineer.* Confirm the canonical `§SA SALES_ACTIVATION_CONFIG` `recommended_action` text appears unmodified in the Salesforce CRM task fields for all convergence point alerts active for the new solution category. Cross-reference Section 6.8 for the non-modification rule and character limit validation requirement.

---

### 11.6 Phase 5: Go-Live Authorization

**The Program Manager reviews all six conditions below before authorizing production activation.**

| Condition | Responsible | Pass Criterion |
|---|---|---|
| 1 — Data model and AEP configuration complete | Platform Engineer | `§1d SOLUTION_CATEGORIES` registered; all four client attributes confirmed in §CA; holdback writing at ~10% rate; escalation threshold initialized |
| 2 — Gate 0 foundational nodes approved | Content Ops Lead | All 4 Narrative nodes and all 5 Audience nodes in `status: approved` in Sanity |
| 3 — Gate 1 Level 3 nodes approved and synced | Content Ops Lead / Platform Engineer | All 11 nodes in `status: approved`; `solution_category_coverage_status` shows `level_1` or higher in AEP; `pending_solution_fallback` event rate declining |
| 4 — Consent classification confirmed | Data Privacy Officer | All signals for new category classified in `SIGNAL_CONSENT_REQUIREMENTS`; any `explicit_consent_required` signals confirmed classified before go-live |
| 5 — Channel configuration complete | Marketing Ops Engineer | Marketo programs active with suppression smart campaign and track reassignment smart campaign confirmed; Outreach channel variants configured for all `tal_channel` values present; `recommended_action` text confirmed unmodified |
| 6 — Outreach trigger-time consent check active | Marketing Ops Engineer | Outreach sequence trigger-time `visitor_consent_state` check confirmed active and tested per Section 10.5; verified that a sequence trigger evaluating against a contact with `visitor_consent_state = declined` in Salesforce is blocked |

> **AUTHORIZATION RULE**
> The Program Manager authorizes production activation only when all six go-live conditions are confirmed. A solution category with any unconfirmed go-live condition is not authorized for production personalization and must not be surfaced to TAL-identified visitors as a personalization context. Partial activation — for example, surfacing Level 3 web experiences before consent classification is confirmed — is not permitted.

After go-live authorization, Gates 2 and 3 — Level 2 and Level 1 — proceed through the standard Section 3 commissioning workflow and Section 7 gap management procedure. Section 11 is complete at go-live authorization.

---

*End of Section 11. Section 12 (Incident Response Procedures) is the final section of Document 8.*

---

## Section 12: Incident Response Procedures

---

### 12.1 Overview

Section 12 is read during a live incident. Each scenario is self-contained — do not cross-reference prior sections to find the procedure. Named decision branches replace judgment calls. Follow the steps in order.

**Severity definitions:**

**Critical** — Active personalization disabled for all TAL visitors; sales activation completely blocked; DSR deletion outside SLA window.

**High** — Personalization degraded for a significant visitor subset; classification accuracy declining persistently; sales activation delayed beyond the 60-minute SLA for high-severity convergence points; content node with known errors being actively served.

**Medium** — Localized pipeline failure affecting a subset of solution categories; content error detected before significant visitor exposure; single batch sync failure.

**Incident record format.** Every incident is logged with these fields before the response begins. Do not begin response steps without opening the record.

```
Incident ID:
Severity:
Detection source:
Affected system(s):
Affected solution category / contact scope:
Incident lead:
Supporting practitioners:
Record opened (timestamp):
```

---

### 12.2 Signal Collection Failure

**Severity:** High to Critical depending on scope.

**Detection:** Section 5 Check 3 alert mechanism failure; Section 5 Check 7 two-week persistence of >5pp absolute and >20% relative LOW/UNKNOWN increase, or single-week 10-point shift; Section 5 Check 8 >20% gate population drop with TAL count stable; direct observation of zero events in the AEP event stream for 24 or more hours.

**Immediate Response:**

1. Platform Engineer checks the AEP activation log. Compare incoming event volume against scored profile update volume for the affected solution category.

   **Sub-type A — Segment-to-AEP pipeline failure:** Incoming event volume is zero or below baseline. Check the Segment source health dashboard. Check the AEP streaming ingestion connector status. Proceed from Step 2 with Sub-type A in the record.

   **Sub-type B — AEP scoring pipeline failure:** Incoming event volume is normal but scored profile updates are not completing. Check the AEP scoring pipeline job status in the AEP Data Engineering workspace. Proceed from Step 2 with Sub-type B in the record.

2. Regardless of sub-type: Marketing Ops Engineer pauses any manual Outreach sequence triggers for affected contacts until pipeline health is confirmed. Do not activate sequences against confidence tier values that may be stale.

3. Platform Engineer notifies the Analytics Lead of the affected solution categories and estimated contact scope.

4. Platform Engineer and Data Engineer jointly attempt pipeline restoration. Time limit: 2 hours from Step 1 before external escalation.

5. If restoration is not achieved within 2 hours, escalate per path below.

**Escalation Path:** Data Engineer → Platform Engineer → AEP platform support if isolation fails within 2 hours.

**Resolution:** Pipeline producing scoring output confirmed in AEP activation log. Section 5 Check 7 and Check 8 metrics returning toward baseline over 7-day observation window.

**Post-Incident Review:** Root cause documented. Section 5 monitoring thresholds reviewed to assess whether earlier detection was possible.

---

### 12.3 Classification Accuracy Drop

**Severity:** High.

**Detection:** Section 5 Check 7 escalation — two-week persistence of >5pp absolute AND >20% relative increase in LOW/UNKNOWN proportion, or single-week 10-point shift.

**Immediate Response:**

1. Analytics Lead pulls the distribution snapshots from both triggering weeks from the weekly monitoring record.

   **Path A — Signal collection degradation:** Check total incoming signal event count alongside the accuracy drop. If total signal volume is also declining, stop here and route to Scenario 12.2. Classification accuracy loss driven by signal volume loss is a pipeline failure, not a model drift.

   **Path B — Scoring model drift:** Signal collection volume is normal but role confidence scores are declining. The issue is in the scoring model or signal weight configuration. Continue with Steps 2–5.

2. Path B only: Analytics Lead reviews the scoring model configuration for weight drift. Do not adjust weights during active investigation — a concurrent change makes root cause attribution impossible. Record the current weight values in the incident record before any review.

3. Analytics Lead documents the specific roles and solution categories showing the sharpest LOW/UNKNOWN increase. This scoping data is required for the Data Scientist escalation if Step 4 does not resolve.

4. If the root cause cannot be identified in the scoring configuration within 4 hours, notify the Platform Engineer and escalate per path below.

5. If the root cause is identified: Analytics Lead documents the specific configuration change required. Change is reviewed before implementation — do not apply scoring configuration changes without a second practitioner confirming the change is scoped correctly.

**Escalation Path:** Analytics Lead → Data Scientist for scoring model review → Platform Engineer for pipeline investigation if neither path resolves within 4 hours.

**Resolution:** Root cause identified and corrected. Two consecutive clean weeks on Section 5 Check 7 before resolution is declared.

**Post-Incident Review:** Whether the drift was predictable from earlier trend data in weekly snapshots. Scoring model configuration change controls reviewed.

---

### 12.4 Content Node Error Post-Publication

**Severity:** High if content is actively served. Medium if detected before significant visitor exposure.

**Detection:** AE, BDR, or visitor report; Content Strategist review; internal stakeholder flag.

**Immediate Response:**

1. Content Ops Lead locates the specific node ID in Sanity and confirms the error in the node's `content_body` or tag fields.

2. Platform Engineer sets the node to `status: under_review` in Sanity immediately.

   > **SYNC PIPELINE LATENCY NOTE**
   > The `status: under_review` transition triggers a sync pipeline event that removes the offer from the Target catalog. This removal is not instantaneous — allow up to 10 minutes for the offer to stop serving. Platform Engineer confirms the offer is no longer appearing in Target activity reporting before marking immediate response complete.

3. Content Ops Lead assesses error type and notifies accordingly.

   **Factual or liability error:** Content Ops Lead notifies Content Strategy Lead and legal representative within 2 hours of detection.

   **Minor editorial error (typo, formatting):** Content Ops Lead notifies Content Strategy Lead only.

   **Systematic error — multiple nodes from same sprint:** Content Ops Lead sets all nodes from the affected commissioning sprint to `status: under_review` pending audit. Escalate immediately to Content Strategy Lead regardless of individual error severity.

4. Content Ops Lead confirms the erroneous offer has stopped serving in Target activity reporting before closing the immediate response.

5. Do not delete the node. Set to `status: under_review` for correction and re-approval. Deletion triggers a full recommission; review-and-re-approve is faster and preserves publishing history.

**Escalation Path:** Content Ops Lead → Content Strategy Lead → legal representative if severity warrants.

**Resolution:** Corrected node passes full R1–R4 review sequence and is re-approved. Sync pipeline writes the corrected version to the Target catalog. Platform Engineer confirms the corrected node is serving in Target activity reporting.

**Post-Incident Review:** Which review stage should have caught the error. If R1 was passed incorrectly, Stage R1 factual accuracy checklist reviewed. If the error was introduced post-approval, content editing access controls reviewed.

---

### 12.5 Sanity-to-Target Sync Pipeline Failure

**Severity:** Medium to High depending on the number of affected nodes.

**Detection:** Section 5 Check 2 escalation; Section 3.10 sprint closure condition 4 failure (`pending_solution_fallback` not declining 48 hours post-sprint); Platform Engineer's weekly catalog integrity audit showing no new offers after confirmed approvals; Content Ops Lead reports approved nodes not appearing in Target.

**Immediate Response:**

1. Platform Engineer checks both logs for the affected node IDs.
   - Sanity webhook delivery log: did the webhook fire for the node's `status: approved` transition?
   - AEP activation log: did the sync pipeline receive and process the webhook event?

   **Sub-type A — Webhook did not fire:** No delivery log record exists for the approval event. Platform Engineer manually retriggers the Sanity webhook for the affected node IDs. Proceed to Step 2.

   **Sub-type B — Webhook fired, sync pipeline failed:** Delivery log record exists but the Target catalog shows no update. Platform Engineer investigates the sync pipeline processing error in the AEP activation log and resolves the blocking error before reprocessing. Proceed to Step 2.

2. Platform Engineer reprocesses all affected node IDs through the sync pipeline after the root cause is resolved.

3. Platform Engineer confirms all affected nodes are present in the Target offer catalog.

4. Platform Engineer confirms the coverage tracking pipeline has updated `solution_category_coverage_status` in AEP for all affected solution categories.

5. If isolation fails within 2 hours, escalate per path below.

**Escalation Path:** Platform Engineer → Sanity platform support (Sub-type A) or AEP platform support (Sub-type B) if isolation fails within 2 hours.

**Resolution:** All affected nodes confirmed in the Target offer catalog. Section 5 Check 2 shows AEP and Sanity data in agreement. `solution_category_coverage_status` updated in AEP.

**Post-Incident Review:** Webhook delivery reliability reviewed. Consideration of a 24-hour node-approval-to-catalog-write monitoring window added to the production monitoring backlog if not already present.

---

### 12.6 Outreach Alert with Incorrect `recommended_action` Payload

**Severity:** High.

**Detection:** AE or BDR reports `recommended_action` text in CRM task or Slack alert does not match expected canonical §SA text; internal audit finds modified or truncated field; field is blank or shows an unresolved merge field token.

**Immediate Response:**

1. Marketing Ops Engineer pulls the full alert payload from the Salesforce CRM task for the affected alert and identifies the error type:

   **Truncation:** Text is present but cut at the Salesforce field character limit.
   **Placeholder:** Salesforce merge field token appears rather than resolved text.
   **Substitution:** Canonical text has been replaced by client-authored text.
   **Blank:** No text in the `recommended_action` field.

2. Marketing Ops Engineer and the affected AE or BDR jointly confirm: was the alert acted on before the error was detected?

   **Acted on with incorrect guidance:** Marketing Ops Engineer sends the full canonical §SA `recommended_action` text directly to the AE or BDR immediately via Slack or email. Do not require the AE to look it up. The AE reviews the canonical action against what was done and documents the gap in the incident record. If the incorrect action may have been premature for the buying moment — for example, an AE who delivered a closing-focused action from a `final_commitment` alert when the actual convergence point was `business_value_alignment` — notify the Content Ops Lead, who assesses whether a recovery conversation or corrective follow-up is warranted.

   **Not yet acted on:** AE or BDR receives the canonical §SA text directly from the Marketing Ops Engineer before taking any action.

3. If the error affects multiple alerts — indicating a systematic onboarding misconfiguration rather than an isolated incident — Marketing Ops Engineer suspends further Outreach sequence triggers for the affected convergence points until Salesforce field configuration is corrected.

4. Platform Engineer or Marketing Ops Engineer corrects the Salesforce field configuration per the error type identified in Step 1: character limit for Truncation; field mapping for Placeholder; text content restoration for Substitution or Blank.

5. Marketing Ops Engineer confirms the full canonical §SA `recommended_action` text appears unmodified in the corrected CRM task field per Section 6.8. Character limit validation re-run per the Section 6.1 onboarding configuration requirement.

**Escalation Path:** Marketing Ops Engineer → Platform Engineer (field configuration errors) → Content Ops Lead (if incorrect action may have harmed a buying moment).

**Resolution:** All affected Salesforce fields confirmed showing the full canonical §SA `recommended_action` text. Character limit validation confirmed passing.

**Post-Incident Review:** How the error survived Section 11.6 Condition 5 and Section 6.1 onboarding verification. Character limit validation step reviewed and strengthened if needed.

---

### 12.7 TAL Data Staleness Spike

**Severity:** High to Critical depending on scope.

**Detection:** Section 5 Check 5 escalation condition (a) — single-week stale account count (accounts where `tal_last_refreshed_at` exceeds 72 hours per Document 3, Section 1.2) exceeds 5% of active TAL accounts, with a 25-account absolute floor (the threshold does not fire below 25 stale accounts regardless of TAL size).

**Immediate Response:**

1. Platform Engineer checks the Kafka pipeline carrying Salesforce CRM record updates into AEP (Document 3, Section 1.2 refresh path). Compare the volume of successful sync events against the expected refresh cadence — near real-time for status changes, daily batch for firmographic attribute updates.

   **Sub-type A — Kafka pipeline failure:** Sync events are not completing, or `tal_last_refreshed_at` is not being written on successful sync. Check the Kafka pipeline job status and the Salesforce CRM connector health. Proceed from Step 2 with Sub-type A in the record.

   **Sub-type B — Salesforce-side failure:** The Kafka pipeline is processing normally but the source CRM records are not updating. Check Salesforce account record modification timestamps for the affected accounts to confirm whether the staleness originates upstream of the pipeline. Proceed from Step 2 with Sub-type B in the record.

2. Regardless of sub-type: Platform Engineer notifies the Marketing Ops Engineer of the affected account scope and estimated proportion of TAL impacted.

3. Platform Engineer and Data Engineer jointly attempt pipeline restoration. Time limit: 2 hours from Step 1 before external escalation.

4. If restoration is not achieved within 2 hours, escalate per path below.

**Escalation Path:** Data Engineer → Platform Engineer → AEP platform support if isolation fails within 2 hours. (Salesforce platform support if Sub-type B is confirmed and the failure is isolated to the CRM source rather than the Kafka pipeline.)

**Resolution:** Stale account count returns below the Section 5 Check 5 threshold on two consecutive weekly reviews. If the threshold is recalibrated while this incident is open, resolution is evaluated against the threshold value in effect at the time the incident record was opened, not any recalibrated value.

**Post-Incident Review:** Root cause documented. Section 5 Check 5 threshold and floor reviewed to assess whether earlier detection was possible.

> **CALIBRATION NOTE — initial hypothesis, not a fixed value**
> The 5% / 25-account threshold is a starting hypothesis set without baseline production data, parallel to the calibration procedure in Document 4, Section 7.4.2. It must be reviewed against the first four weeks of production monitoring data referenced in Section 5 Check 5's normal-result baseline. If the observed baseline stale-account rate differs materially from the assumption underlying this threshold, the value and floor must be recalibrated before the threshold is treated as final. Until recalibration, the 5% / 25-account value applies.

---

*End of Section 12. Document 8 (Operational Runbook) is complete. All nine documents of the Kalder Buying Group Personalization corpus are locked.*
