# Document 3: Audience and Segmentation Architecture
## Kalder Buying Group Personalization Program

**Document version:** 1.0 (consolidated — all sections approved)
**Date:** June 2026
**Status:** Approved
**Depends on:** Buying Group Role Architecture (Document 1), Signal Definition and Confidence Model (Document 2), `kalder_data_model.py` v0.2.0

---

**Sections in this document:**

- Section 1: Document Scope and Canonical Status
- Section 2: TAL Architecture and Governance
- Section 3: Buying Group Stages and Cohort Entry Logic
- Section 4: Account-Level vs. Contact-Level Segmentation
- Section 5: Identification Layers and Personalization Availability
- Section 6: Anonymous-to-Known Contact Promotion
- Section 7: Segment-to-Channel Mapping
- Section 8: Geographic Segmentation
- Section 9: Exclusion and Suppression Logic

---

## Section 1 — Document Scope and Canonical Status

Document 3 is the single authoritative source for audience architecture, TAL governance, buying group stage definitions, cohort entry logic, identification layer structure, segment-to-channel mapping, geographic segmentation, and exclusion and suppression logic in the Kalder Buying Group Personalization Program. It defines how the program identifies which accounts and contacts qualify for personalization treatment, at what depth, and through which channels. No other corpus document re-specifies TAL governance rules, re-defines cohort entry conditions, or extends the segment-to-channel activation map.

Three adjacent decisions are explicitly out of scope here. The role definitions and confidence tier thresholds that determine which contacts qualify for contact-level personalization are owned by Document 1 (Buying Group Role Architecture). The scoring pipeline that produces `confidence_tier` and `role_classification` from behavioral signals is owned by Document 2 (Signal Definition and Confidence Model). The runtime decisioning logic that translates AEP audience membership into Adobe Target experience selection is owned by Document 5 (Personalization Decisioning Rules).

The audience architecture in this document is the human-readable authority from which AEP audience segment definitions, Marketo program enrollment rules, and Outreach sequence triggers are derived. The canonical machine-readable entity definitions are in `kalder_data_model.py §5 COVERAGE_STATUS`, `§6 SEGMENT_DEFINITIONS`, and `§14 CHANNEL_ACTIVATION_MAP`. Any discrepancy between this document's segment definitions and the data model is a defect — the data model governs entity definitions; this document governs their strategic rationale and operational governance.

**What this document owns:** TAL architecture and governance (Section 2), buying group stages and cohort entry logic (Section 3), account-level vs. contact-level segmentation (Section 4), identification layers and personalization availability (Section 5), anonymous-to-known contact promotion (Section 6), segment-to-channel mapping (Section 7), geographic segmentation (Section 8), and exclusion and suppression logic (Section 9).

**Delegation — what this document does not re-specify:**
- Buying group role definitions and behavioral signatures → Document 1
- Signal weight matrix, seven-step scoring sequence, and confidence tier thresholds → Document 2
- Content node schemas, tagging taxonomy, and offer catalog structure → Document 4
- Runtime experience selection logic, fallback cascade routing, and Adobe Target activity configuration → Document 5
- Buying group stage strategic definitions, convergence points, and JTBD code library → Document 6
- Lift measurement methodology, segment-level analysis breakdowns, and experimentation design → Document 7
- Operational workflow for list hygiene, suppression management, and DSR execution → Document 8
- Legal basis for signal collection, consent-state gating conditions, and geographic suppression legal framework → Document 9

**Coverage status note.** TAL architecture and suppression logic apply uniformly across all five solution categories. Segment-to-channel activation varies by solution category coverage status — pending categories activate at Level 3 ceiling per `pending_solution_fallback`. Section 9 specifies geographic suppression rules; the legal framework that governs those rules is in Document 9.

**Section numbering note.** Prose cross-references within this document have been reconciled to current heading numbers (cross-reference cleanup pass, 2026-06-21). Heading numbers are authoritative.

---

## Section 2: TAL Architecture and Governance

---

### 1.1 The TAL as a Consumed Program Input

The Target Account List is a managed upstream input to the personalization program. TAL governance — including ICP criteria, firmographic qualification thresholds, capacity limits, and the RevOps process that maintains the list — is owned by Revenue Operations and executed upstream of everything described in this document. This section specifies none of that. It specifies the data contract the personalization program requires from TAL data, how the program behaves when it receives that data, and how it behaves when TAL data is unavailable or ambiguous.

TAL membership is binary from the program's perspective: an account is in-TAL or it is not. Accounts outside the TAL receive no personalization treatment. This is not a degraded state — it is the correct program behavior for accounts that have not been qualified as buying-group prospects.

Kalder's TAL consists of approximately 30,000 accounts.

---

### 1.2 The TAL Data Contract

The personalization program requires the following attributes on every TAL account record in AEP. All attribute names are in the Kalder canonical namespace defined in `CLIENT_ATTRIBUTE_MAP` (§CA). These attributes populate via the Salesforce CRM → AEP account profile sync path, with the Kafka streaming pipeline carrying any CRM record updates into AEP at near real-time latency.

**Canonical TAL account attributes (to be added to `CLIENT_ATTRIBUTE_MAP`):**

| Attribute | Allowed Values | Purpose |
|---|---|---|
| `tal_member` | `true` / `false` | Primary gate: TAL membership flag. Evaluated before any scoring or personalization logic executes. |
| `tal_program_status` | `active_prospect` / `post_sale` / `out_of_program` | Program state classification. Determines which personalization treatment the account receives. |
| `tal_account_type_source` | `suspect` / `prospect` / `customer` / `customer_via_partner` / `customer_subsidiary` | The upstream Salesforce account type that produced the current `tal_program_status` assignment. Retained for audit and transition tracking. |
| `tal_upsell_override_active` | `true` / `false` | Indicates whether a `post_sale` account has an active upsell program override. Only relevant when `tal_program_status` = `post_sale`. |
| `tal_solution_interest_flags` | One or more solution category keys (e.g., `customer_engagement`, `it_operations`) | Account-level solution interest signal used for Level 4 personalization when contact-level classification is unavailable. |
| `tal_region` | `AMS` / `EMEA` / `APJ` | Geographic segmentation dimension for regional campaign manager assignment and treatment differentiation. |
| `tal_marquee` | `true` / `false` | Priority tier flag. Used for content inventory allocation and campaign prioritization. Does not change program logic. |
| `tal_new_logo_eligible` | `true` / `false` | Acquisition eligibility gate. Suppressed from acquisition personalization when `false`. |
| `tal_open_pipeline` | `true` / `false` | Proxy for active opportunity. Informs cohort assignment and channel activation priority. |
| `tal_account_domain` | String (domain URL) | Input for Demandbase reverse-IP account matching. Must match the domain Demandbase resolves from visitor IP. |
| `tal_channel` | `direct` / `msp` / `partner` | Channel routing dimension for sales activation and Outreach sequence selection. |
| `tal_last_refreshed_at` | ISO 8601 timestamp | Staleness tracking. Compared to staleness threshold at program execution time. |

**Refresh cadence and data path:** CRM record updates in Salesforce propagate to AEP via the Kafka streaming pipeline. The expected refresh window is near real-time for status changes (account type updates, customer conversion events) and daily batch for firmographic attribute updates. `tal_last_refreshed_at` must be written by the pipeline on every successful sync and is the authoritative freshness indicator.

**Staleness threshold:** A TAL account record is considered current when `tal_last_refreshed_at` is within 72 hours of the current session start. Records that exceed the 72-hour threshold are treated as stale.

---

### 1.3 Account Status Classification

The upstream Salesforce account type taxonomy is collapsed into three program-relevant states that govern personalization treatment. This collapse happens in AEP via a computed attribute derived from `tal_account_type_source`.

| Program State | Source Account Types | Personalization Treatment |
|---|---|---|
| `active_prospect` | `suspect`, `prospect` | Full program activation — all pre-scoring filters apply, all signal scoring executes, all cohort assignment and channel activation are available. |
| `post_sale` | `customer`, `customer_via_partner`, `customer_subsidiary` | Pre-purchase behavioral scoring suppressed. Acquisition personalization suppressed. Visitor receives Level 4 account-level experience by default (TAL-identified, no acquisition personalization). If a upsell override is active (`tal_upsell_override_active` = `true`), visitor receives the upsell personalization experience instead. |
| `out_of_program` | Accounts removed from TAL (i.e., `tal_member` = `false`) | No scoring. No cohort assignment. No channel activation. Level 5 default brand experience only. |

**Post-sale suppression in AEP:** When `tal_program_status` = `post_sale`, AEP excludes the account from all audience segments that feed the acquisition personalization pipeline. The suppression is applied at the AEP segment evaluation layer — contacts at `post_sale` accounts do not appear in activation audiences for Adobe Target (web), Marketo (email), or Outreach (sales). This is consistent with the Filter 2 post-sale customer suppression defined in Document 2, Section 4.3, which specifies that account-level suppression applies regardless of individual contact behavioral profile.

**Upsell override:** When a `post_sale` account is enrolled in an active upsell program, a RevOps operator (with CRM write access to the relevant Salesforce fields) sets `tal_upsell_override_active` = `true` on the account record. This flag activates a separate upsell personalization audience in AEP. The upsell audience is distinct from the acquisition audience: it activates upsell-specific content variants and Outreach sequences configured for existing customers, not acquisition-stage prospects. The acquisition personalization pipeline remains suppressed. No individual marketing ops practitioner can activate the upsell override — it requires CRM write access to the Salesforce account record, which is a RevOps-gated permission.

**Exception — pre-sale trial and POC accounts:** Contacts at accounts in an active free trial or proof-of-concept engagement are not subject to `post_sale` suppression. Trial and POC engagements generate genuine pre-sale User and Influencer signals — a contact evaluating Kalder in a structured trial is exactly the behavioral evidence the scoring model is designed to capture and must not be filtered out as post-sale noise. The exception is determined by Salesforce opportunity stage, not by CRM account type alone. An account classified as `customer` in Salesforce that has an active POC or trial opportunity stage passes the exception and receives `active_prospect` treatment in AEP. Account type is insufficient to make this determination — the Salesforce opportunity stage field must be checked explicitly. The implementation specification for the opportunity stage check is in Document 8 (Operational Runbook). [Source: Document 2, Section 4.3]

---

### 1.4 The Demandbase Reverse-IP Identification Mechanism

Demandbase serves two distinct functions in this program. These functions are architecturally separate, gated independently, and must never be conflated in implementation or reporting.

**Function 1 — Account identification (TAL membership check):** Demandbase resolves the account associated with a visitor's IP address by matching the IP to a known account domain. The resolved domain is compared to `tal_account_domain` values in AEP to confirm TAL membership. This function is not gated on Track 2 legal review and is available now. When Demandbase resolves a visitor's IP to a TAL account domain, the visitor is identified at the account level and receives a minimum of Level 4 personalization. When no match is found, the visitor is unresolved and receives Level 5.

**Function 2 — Title-match enrichment (`demandbase_firmographic_match` signal):** When Demandbase resolves a visitor's job title to a matching entry in `TITLE_ROLE_MAP` (§19), it fires the `demandbase_firmographic_match` signal, which applies a +30 firmographic confirmation bonus to the visitor's behavioral score for the matched role. This function is classified as `explicit_consent_required` [data model §P] and is currently suppressed pending Track 2 legal review (v0.2.0 §P, `track_2_status: pending_legal_review`). The bonus pathway does not execute. Visitor scores are not reduced as a result — the bonus simply does not apply. This function activates only when Track 2 legal review is complete, a Data Processing Agreement with Demandbase is executed, and a GDPR-compliant consent mechanism is implemented for EU, UK, and EEA visitors.

A visitor whose IP resolves to a TAL account domain is account-identified and eligible for Level 4 personalization regardless of Track 2 status. The title-match bonus is a separate, currently suppressed function that does not block account-level identification.

---

### 1.5 Johnson's Implementability Test

A marketing operations practitioner should be able to determine an account's program state and correct personalization treatment by inspecting two attributes in the AEP account profile — without opening Salesforce, Demandbase, or any other system.

| Attribute | Value to Check | Program State | Personalization Treatment |
|---|---|---|---|
| `tal_member` | `false` | `out_of_program` | Level 5 default brand. No scoring. No activation. |
| `tal_member` | `true` AND `tal_program_status` = `active_prospect` | `active_prospect` | Full program activation. |
| `tal_member` | `true` AND `tal_program_status` = `post_sale` AND `tal_upsell_override_active` = `false` | `post_sale` (suppressed) | Level 5 default brand. Acquisition pipeline suppressed. |
| `tal_member` | `true` AND `tal_program_status` = `post_sale` AND `tal_upsell_override_active` = `true` | `post_sale` (upsell active) | Upsell personalization audience active. Acquisition pipeline still suppressed. |

No other attribute is required to determine program state. `tal_program_status` is the single computed field that governs treatment; `tal_upsell_override_active` is the single exception flag. All other TAL attributes (`tal_region`, `tal_marquee`, `tal_solution_interest_flags`, etc.) inform content selection within an active program state — they do not change the program state itself.

**Trial/POC exception note:** Accounts with a source `tal_account_type_source` of `customer`, `customer_via_partner`, or `customer_subsidiary` that have an active trial or POC opportunity stage in Salesforce will carry `tal_program_status` = `active_prospect` despite their customer account type. A practitioner seeing `active_prospect` on a customer-type account should verify whether a trial/POC opportunity stage is active in Salesforce before investigating a data error. This is expected behavior, not a sync anomaly.

---

### 1.6 Non-TAL Behavior

The following behaviors apply to all visitors whose IP cannot be resolved to a TAL account, stated as explicit enumerated rules:

1. Visitors whose IP does not resolve to any TAL account domain receive the Level 5 default brand experience.
2. No behavioral signal scoring is performed for non-TAL visitors. Signal observations are captured in the Segment event stream (the behavioral record is retained) but are not forwarded to the scoring engine.
3. No cohort assignment is performed for non-TAL accounts.
4. No channel activation — Adobe Target audience activation, Marketo enrollment, or Outreach sequence triggering — is performed for non-TAL accounts.
5. A visitor with a `declined` consent state has all behavioral signal collection and scoring suppressed, regardless of TAL membership. A TAL-matched visitor with `declined` consent receives Level 4 (account-level identification; no behavioral personalization). A non-TAL visitor with `declined` consent receives Level 5. Demandbase reverse-IP resolution is not itself a behavioral signal and is not blocked by `declined` consent state at the point of resolution — however, the `firmographic_enrichment_cache` that stores Demandbase match results is suppressed immediately on consent withdrawal [data model §P.4]. A returning visitor whose cache was purged following a prior consent withdrawal may not resolve to a TAL account until a new Demandbase match fires in their next session. See Section 1.7, Demandbase consent cache expiry failure mode.

---

### 1.7 Failure Modes

**Stale TAL data.** When a TAL account's `tal_last_refreshed_at` exceeds the 72-hour staleness threshold, the program carries forward the last known `tal_program_status` with a `tal_data_stale: true` flag appended to the AEP account profile. The program does not treat a stale account as `out_of_program`. Rationale: the most common cause of staleness is a pipeline lag, not a genuine status change. Treating a stale active prospect as `out_of_program` would suppress personalization for accounts that are correctly in-program, producing a false degradation in experience quality. The staleness flag is surfaced in the operational monitoring dashboard and triggers a pipeline health alert to the data team when the stale account count exceeds the threshold defined in Document 8 (Operational Runbook). Personalization resumes without operator action once the pipeline sync completes and `tal_last_refreshed_at` is updated.

**Demandbase reverse-IP no-match.** When Demandbase cannot resolve a visitor's IP to any known account domain, no account identification occurs. The outcome is Level 5 default brand experience. This is a deterministic, expected outcome — not an error condition. A significant fraction of kalder.com traffic will produce no-match results (employees on residential ISPs, VPN users, mobile network traffic, non-TAL accounts). The program does not retry or attempt alternate resolution paths when Demandbase returns no match.

**Demandbase consent cache expiry.** The `firmographic_enrichment_cache` in AEP has a 90-day retention window [data model §P.4] and is suppressed immediately on consent withdrawal. When a visitor's cache expires or is purged, the link between the visitor's IP and the resolved account domain is lost — even though the TAL account record itself has not changed and remains current. This failure mode is distinct from TAL data staleness: the TAL has not been updated; the Demandbase cache that connected the visitor to the account has expired. The outcome: the visitor is treated as unresolved until a new Demandbase reverse-IP match fires in a subsequent session. If a new match resolves in that session, the visitor receives Level 4 or higher (depending on their accumulated scoring profile). If no match resolves, the visitor receives Level 5. No manual intervention is required — cache repopulation occurs automatically when Demandbase processes the next session from that IP.

**Mid-session status change.** When an account's `tal_program_status` changes while a session is in progress (for example, a CRM record updates from `prospect` to `customer_subsidiary` during an active browsing session), the program takes no action within the current session. Session-level TAL status is locked at session start and does not change mid-session. The updated status is consumed at the next session start, when the fallback cascade is re-evaluated from current AEP profile state. This behavior is consistent with the cascade transition model specified in Document 1, Section 3: cascade level is stable within a session and re-evaluated at session start.

---

### Data Model Update Note

The following canonical TAL account attributes must be added as entries in `CLIENT_ATTRIBUTE_MAP` (§CA) in the next implementation pass of `kalder_data_model.py`:

`tal_member`, `tal_program_status`, `tal_account_type_source`, `tal_upsell_override_active`, `tal_solution_interest_flags`, `tal_region`, `tal_marquee`, `tal_new_logo_eligible`, `tal_open_pipeline`, `tal_account_domain`, `tal_channel`, `tal_last_refreshed_at`

These attributes represent the data contract between the Salesforce CRM source of truth and the personalization program's AEP execution layer. Once added to `CLIENT_ATTRIBUTE_MAP`, all program logic referencing TAL account state must resolve through that map at runtime, not by reading hardcoded strings directly. This ensures that AEP schema changes and multi-client deployments can be managed from a single configuration point.

---

## Section 3: Buying Group Stages and Cohort Entry Logic

---

### 2.1 Stage-to-Cohort Architecture Overview

Buying group stages and campaign cohorts are related but distinct instruments. Stages — `targeted`, `engaged`, `prioritized`, `qualified` — are buyer-centric pipeline measures derived from the Forrester B2B Revenue Waterfall. They track how far a buying group has progressed from identification toward purchase readiness. Cohorts are program-treatment units: they determine which channel mix, content type, and activation intensity an account receives. A stage change signals that the buyer's situation has changed; a cohort assignment determines what the program does about it.

The mapping from stages to cohorts is not one-to-one. Two stages feed the same cohort, and one stage feeds two different cohorts depending on a Salesforce opportunity condition. The table below establishes this architecture before each element is specified in detail.

| `bg_stage` | Forrester Equivalent | Cohort | Differentiator |
|---|---|---|---|
| `targeted` | Suspect / MQL | `education` | Sole entry path to education cohort |
| `engaged` | Engaged Account | `acquisition` | Many-to-one with `prioritized` → acquisition |
| `prioritized` | Prioritized Account | `acquisition` | Many-to-one with `engaged` → acquisition |
| `qualified` | Qualified Opportunity | `progression_early_to_mature` OR `progression_win_now` | Salesforce opportunity stage (Stage 2–4 vs. Stage 5–7) is the only differentiator; see Section 2.4 |

Two design choices encoded in this table deserve explicit statement. First, both `engaged` and `prioritized` map to the acquisition cohort. This is intentional: the distinction between these two stages is meaningful for content depth and sales engagement intensity, but both populations are in the same program phase — moving toward a qualified opportunity — and receive the same broad treatment type. The stage granularity is preserved in the `bg_stage` attribute for content selection and measurement, but it does not drive a separate cohort assignment. Second, the `qualified` stage splits into two cohorts, and `bg_stage` alone is insufficient to determine which one applies. This is the differentiation problem addressed directly in Section 2.4.

A note on `ENGAGEMENT_THRESHOLDS` and this architecture: the buying group health score derived from `§14 ENGAGEMENT_THRESHOLDS` (`LOW_ENGAGEMENT`, `MEDIUM_ENGAGEMENT`, `HIGH_ENGAGEMENT`) is a seller-centric measure of opportunity health — it aggregates member engagement intensity to assess deal urgency from the seller's perspective. It is not a substitute for `bg_stage` and must not be conflated with it. A `targeted` account can have a HIGH_ENGAGEMENT score (a single highly engaged Economic Buyer driving it). A `qualified` account can have a LOW_ENGAGEMENT score (group members disengaging after opportunity creation). Stage governs cohort assignment; engagement health governs activation intensity and the guard rail specified in Section 2.5.

---

### 2.2 The Four Buying Group Stages

The `bg_stage` attribute is an AEP account-level computed attribute. Its value is derived from a combination of CRM-sourced signals (Salesforce opportunity data via Kafka) and behavioral event data (Segment contact engagement events). It is updated by the AEP pipeline when the underlying conditions change, as specified in Section 2.5. Stage assignment runs only for accounts with `tal_program_status` = `active_prospect`.

**`targeted`** — Forrester equivalent: Suspect / Marketing Qualified Account. This is the entry stage for all in-TAL `active_prospect` accounts. An account enters `targeted` at the moment its TAL membership is confirmed and `tal_program_status` is set to `active_prospect`. No behavioral engagement is required. AEP entry condition: `tal_member` = `true` AND `tal_program_status` = `active_prospect` AND no `contact_engagement_event` associated with this account in AEP within the last 180 days AND no Salesforce opportunity record linked to this account. Double-diamond phase: diverge — buying group members, if identified, are in problem identification mode or have not yet engaged. Personalization intent: establish awareness, surface Kalder's relevance to the account's industry and firmographic profile, generate the first behavioral engagement that will move the account to `engaged`.

**`engaged`** — Forrester equivalent: Engaged Account. The account has produced its first confirmed contact engagement event — at least one contact at this account has engaged with kalder.com content in a way that passes the signal quality gates in Document 2, Section 4. AEP entry condition: `tal_program_status` = `active_prospect` AND at least one `contact_engagement_event` (distinct contact, quality-passing signal) associated with this account recorded in AEP within the last 180 days AND no Salesforce opportunity record linked to this account. Double-diamond phase: diverge, transitioning to converge — buying group members are in solution exploration or requirements framing. Personalization intent: deepen engagement across additional buying group members, accelerate toward a second distinct-contact engagement event that elevates the account to `prioritized`, and surface solution-category content that can generate a Salesforce hand-raiser event or SDR-qualified interest.

**`prioritized`** — Forrester equivalent: Prioritized Account. The buying group has demonstrated multi-member engagement sufficient to indicate an active evaluation in progress. AEP entry condition: `tal_program_status` = `active_prospect` AND at least two distinct-contact `contact_engagement_event` records associated with this account in AEP within the last 90 days, OR at least one `hand_raiser_event` (form fill, demo request, contact us submission) from a contact at this account within the last 90 days AND no Salesforce opportunity record. Double-diamond phase: converge — the group is narrowing toward requirements framing or solution validation convergence points. Personalization intent: enable the full buying group to complete evaluation requirements, support internal selling with convergence-enabling content, and generate the opportunity creation event that transitions the account to `qualified`.

**`qualified`** — Forrester equivalent: Qualified Opportunity. A Salesforce opportunity record associated with this account exists and has reached a qualifying stage threshold, delivered to AEP via the Kafka pipeline. AEP entry condition: `tal_program_status` = `active_prospect` AND `sfdc_opportunity_created` = `true` AND `sfdc_opportunity_stage` is a valid non-zero stage value in Salesforce. The precise cohort assignment within `qualified` — `progression_early_to_mature` or `progression_win_now` — is determined by `sfdc_opportunity_stage` value, as specified in Section 2.4. Stage assignment from Salesforce opportunity data is a CRM-sourced pipeline function and is not gated on `visitor_consent_state` — a visitor with a `declined` consent state may be assigned `bg_stage: qualified` based on CRM data. What `declined` suppresses is behavioral signal collection and scoring, not administrative stage classification derived from CRM records. Double-diamond phase: converge — the group is aligned on solution selection and is completing business value alignment, risk validation, and final commitment convergence points. Personalization intent: remove friction from the final buying group convergence points, provide role-specific validation content, and support the AE with executive alignment and procurement navigation materials.

---

### 2.3 The Four Campaign Cohorts

Each cohort entry requires `tal_program_status` = `active_prospect`. The AEP segment definition for each cohort is stated below as the exact attribute conditions that produce cohort membership in AEP. Channel mapping is summarized here; full channel activation specifications are in Section 7.

**`education` — Priority: 4 (lowest)**

*Entry criteria:* `bg_stage` = `targeted`.

*AEP segment definition:*

| Attribute | Condition |
|---|---|
| `tal_program_status` | = `active_prospect` |
| `bg_stage` | = `targeted` |
| `sfdc_opportunity_created` | = `false` OR null |
| `contact_engagement_event_count_180d` | = 0 |

*Activation intent:* Establish Kalder's presence and relevance with TAL accounts that have not yet produced any behavioral engagement. The goal is the first engagement event that transitions the account to `engaged`. This cohort contains the largest absolute number of accounts (the majority of a 30,000-account TAL will be in early stages at any given time) but receives the lowest activation intensity.

*Content focus:* Problem-centric, educational, largely ungated. Industry research, thought leadership, platform explainers, PAITW (Put AI to Work) brand content. Light product mention. Content is optimized for reach — broadly shareable formats that can circulate within a prospect organization before any contact is identified. No role-specific variants are required at this stage, though account-level firmographic signals (industry vertical, company size) should inform content selection at Level 4.

*Channel mapping (summary):* Adobe Target (web personalization at Level 4 account-level); no Marketo email enrollment (no identified contact yet in most cases); no Outreach SDR sequence activation. Paid media and off-platform channels (LinkedIn, display) are managed separately by the media team and are not specified here.

---

**`acquisition` — Priority: 3**

*Entry criteria:* `bg_stage` = `engaged` OR `bg_stage` = `prioritized`.

*AEP segment definition:*

| Attribute | Condition |
|---|---|
| `tal_program_status` | = `active_prospect` |
| `bg_stage` | = `engaged` OR `prioritized` |
| `sfdc_opportunity_created` | = `false` OR null |
| `contact_engagement_event_count_180d` | >= 1 |

*Note: `contact_engagement_event_count_180d >= 1` is the minimum entry condition for `engaged` accounts. For `prioritized` accounts, this condition is satisfied by definition — `prioritized` entry requires either two distinct-contact qualifying events within 90 days or one hand-raiser event within 90 days, both of which exceed the `>= 1` threshold. The `bg_stage` attribute carries the `engaged` vs. `prioritized` distinction within the shared acquisition cohort; content depth selection and measurement should reference `bg_stage` to distinguish the two populations, not the `contact_engagement_event_count_180d` value alone.*

*Activation intent:* Convert engaged TAL accounts into qualified opportunities by completing the buying group, accelerating convergence points, and generating the opportunity creation event. The acquisition cohort receives higher activation intensity than education — identified contacts are known, Marketo enrollment is available, and SDR outreach is appropriate for `prioritized` accounts with `tal_open_pipeline` = `false` that haven't yet generated a Salesforce opportunity.

*Content focus:* Solution-category education, evaluation frameworks, buyer guides and playbooks, analyst reports, solution demos, ROI tools, customer stories. Mix of gated and ungated. Content is increasingly role-differentiated as contacts accumulate higher role confidence scores. `engaged` accounts lean toward category and solution exploration content; `prioritized` accounts lean toward requirements framing and solution validation content — the `bg_stage` attribute informs content depth selection within the cohort even though both stages share a single cohort assignment.

*Channel mapping (summary):* Adobe Target (web personalization at Level 1–3 based on contact confidence tier); Marketo (nurture enrollment for identified contacts at `engaged` and `prioritized` accounts); Outreach (SDR sequences activated for `prioritized` accounts with `tal_marquee` = `true` or `tal_open_pipeline` = `true` — where `tal_open_pipeline` = `true` applies to accounts with active pipeline activity that has not yet generated a confirmed Salesforce opportunity record, i.e., `sfdc_opportunity_created` = `false` or null; accounts with `sfdc_opportunity_created` = `true` have transitioned to `qualified` and are governed by AE-owned sequences, not SDR sequences).

---

**`progression_early_to_mature` — Priority: 2**

*Entry criteria:* `bg_stage` = `qualified` AND `sfdc_opportunity_stage` in {Stage 2, Stage 3, Stage 4}.

*AEP segment definition:*

| Attribute | Condition |
|---|---|
| `tal_program_status` | = `active_prospect` |
| `bg_stage` | = `qualified` |
| `sfdc_opportunity_created` | = `true` |
| `sfdc_opportunity_stage` | IN [2, 3, 4] |
| `sfdc_opportunity_stage_stale` | = `false` (or null — treat null as current pending pipeline confirmation) |

*Activation intent:* Deepen the buying group's engagement across all required roles as the opportunity matures through solution validation and business value alignment convergence points. Ensure the full buying group — not just the Champion — has the materials they need to align and advance toward late-stage commitment.

*Content focus:* Technical validation reports, competitive differentiation materials, business case and ROI validation content, product/solution-specific webinars, customer references, implementation and enablement guides. Highly personalized by role — a Ratifier at this stage needs risk and compliance content; an Economic Buyer needs business value alignment and ROI confirmation; an Influencer needs solution validation. High-touch, largely gated.

*Channel mapping (summary):* Adobe Target (web at Level 1–2, role-specific); Marketo (role-specific nurture tracks); Outreach (AE-owned sequences; SDR sequences de-escalated in favor of AE direct engagement).

---

**`progression_win_now` — Priority: 1 (highest)**

*Entry criteria:* `bg_stage` = `qualified` AND `sfdc_opportunity_stage` in {Stage 5, Stage 6, Stage 7}.

*AEP segment definition:*

| Attribute | Condition |
|---|---|
| `tal_program_status` | = `active_prospect` |
| `bg_stage` | = `qualified` |
| `sfdc_opportunity_created` | = `true` |
| `sfdc_opportunity_stage` | IN [5, 6, 7] |
| `sfdc_opportunity_stage_stale` | = `false` (or null — treat null as current pending pipeline confirmation) |

*Activation intent:* Remove the final friction points between the buying group and a signed agreement. Deliver executive alignment support, procurement navigation materials, and deal-closing content to all required convergence point participants — Economic Buyer, Ratifier, and Champion — at the precise time they are needed.

*Content focus:* Executive briefs and buy-in materials, legal and procurement guides, contract support materials, customer reference calls, implementation readiness content, success plans. The smallest content inventory by volume but the highest investment per asset. Every content node in this cohort should be mapped to a specific final-stage convergence point (Business Value Alignment, Risk & Compliance Validation, Final Commitment).

*Channel mapping (summary):* Adobe Target (web — opportunistic, not the primary channel at this stage; contacts in late-stage deals are in direct sales engagement); Marketo (deal-acceleration sequences, executive-level communications); Outreach (AE-orchestrated; high-touch direct sequences targeting Economic Buyer and Ratifier specifically).

---

### 2.4 The Progression Cohort Differentiation

**The problem.** Both `progression_early_to_mature` and `progression_win_now` share `bg_stage` = `qualified` as their entry criterion. The `bg_stage` attribute alone cannot distinguish between them. The only differentiator is Salesforce opportunity stage — Stage 2–4 maps to `progression_early_to_mature`; Stage 5–7 maps to `progression_win_now`. An account incorrectly assigned to `progression_win_now` receives late-stage, high-touch executive content and AE activation sequences at the wrong time in the deal cycle, which can signal premature urgency to the buying group and damage trust.

**The implementation approach.** The preferred approach is extending the existing Kafka pipeline — which already carries ML classifier outputs and CRM role assignments from Salesforce to AEP at near-real-time latency — to additionally carry a computed `sfdc_opportunity_stage` attribute at the account level. When an opportunity's Salesforce stage updates, the Kafka event triggers an AEP profile write that updates `sfdc_opportunity_stage` and clears any prior `sfdc_opportunity_stage_stale` flag. [PENDING: Document 8 owner to confirm pipeline feasibility and implementation specification for the `sfdc_opportunity_stage` Kafka event schema and AEP write rule.]

**Fallback if pipeline is not yet available.** Until the Kafka pipeline extension is confirmed and implemented, all `qualified` accounts are assigned to `progression_early_to_mature` by default. No account is assigned to `progression_win_now` during this interim period. This is a conservative fallback that accepts under-activation of late-stage deals in exchange for eliminating incorrect win-now activation.

**Staleness threshold.** The `sfdc_opportunity_stage` staleness threshold is 24 hours — tighter than the 72-hour TAL data threshold specified in Section 1.2. The rationale is asymmetric risk: a `progression_win_now` account that receives early-to-mature content because the pipeline lagged is under-served but not harmed; a `progression_early_to_mature` account that is misclassified as `progression_win_now` due to stale data receives premature high-touch activation that can actively damage the deal. The tighter threshold limits the window during which a stale `sfdc_opportunity_stage` could produce a misclassification.

The decision matrix below specifies the deterministic program response for each staleness scenario.

| `sfdc_opportunity_stage` state | `sfdc_opportunity_stage_stale` | Program Response |
|---|---|---|
| Current (within 24 hours) | `false` | Normal cohort assignment: Stage 2–4 → `progression_early_to_mature`; Stage 5–7 → `progression_win_now` |
| Stale (exceeds 24 hours) | `true` | Carry forward last known cohort assignment; do not downgrade to a lower-priority cohort |
| Missing or null | n/a | [PENDING: pipeline not yet available] → default to `progression_early_to_mature` for all qualified accounts |

**Staleness fallback rationale.** When `sfdc_opportunity_stage_stale` = `true`, the program carries forward the last known cohort assignment rather than defaulting to `progression_early_to_mature`. The rationale: a stale Stage 6 account is more likely still at Stage 6 than to have regressed to Stage 3. Carrying forward the last known assignment is more accurate in expectation than defaulting to a lower-priority cohort, and it avoids surfacing early-stage content to a buying group that is actively closing. The staleness flag is available to the AE and demand gen manager in the AEP account profile and in the operational monitoring dashboard, alerting them to verify current stage in Salesforce directly.

**Misassignment risk statement.** An account incorrectly assigned to `progression_win_now` due to stale or erroneous `sfdc_opportunity_stage` data will receive high-touch executive alignment content, AE-owned Outreach sequences, and referral contact activation intended for final-commitment-stage buying groups. Deploying this activation prematurely can signal urgency that the deal is not ready to sustain, potentially triggering a buying group loop-back to an earlier convergence point or alerting the Economic Buyer that the vendor perceives more urgency than they do. This is the highest-consequence misassignment in the program. Pipeline monitoring specifications to detect and alert on `sfdc_opportunity_stage` staleness are in Document 8 (Operational Runbook).

---

### 2.5 Stage Transition Logic and the §14 Guard Rail

**Stage re-evaluation cadence.** `bg_stage` is re-evaluated by the AEP pipeline when underlying conditions change — specifically, when a new `contact_engagement_event` is recorded in AEP or when the Kafka pipeline delivers an updated Salesforce opportunity record. Unlike the cascade level specified in Document 1 (which is session-locked and re-evaluated at session start), `bg_stage` is an account-level computed attribute that updates continuously as pipeline data arrives. A contact engagement event that fires at 2:00 PM will update `bg_stage` before the account's next kalder.com session, not at its start.

**Transition triggers.** The specific events that drive each stage transition are:

`targeted` → `engaged`: The first qualifying `contact_engagement_event` associated with an account passes the Document 2, Section 4 signal quality gates and is recorded in AEP within a 180-day window. "Qualifying" means the event originates from a distinct contact (not the same visitor across multiple sessions in a short window), passes the cross-category isolation filter, and meets the session quality gate minimum.

`engaged` → `prioritized`: Either (a) a second distinct-contact `contact_engagement_event` is recorded in AEP within 90 days of the first qualifying event, establishing multi-member engagement; or (b) a `hand_raiser_event` — any form fill, demo request, or contact-us submission from a contact at this account — is recorded in AEP, regardless of whether a second distinct contact has engaged. For this purpose, a "distinct contact" is defined as a distinct `contact_id` as resolved by the identity resolution pipeline — two sessions from the same device or browser that have been stitched to a single `contact_id` count as one contact, not two, and do not satisfy the two-contact threshold. An anonymous visitor who has not yet been resolved to a `contact_id` does not count toward the two-contact threshold, even if their session passes all signal quality gates; their contribution to the buying group's contact count is deferred until identity resolution occurs.

`engaged` or `prioritized` → `qualified`: A Salesforce opportunity record associated with this account is created with a non-zero qualifying stage and the Kafka pipeline delivers the `sfdc_opportunity_created` = `true` event to AEP. The opportunity creation event overrides the `engaged`/`prioritized` distinction — any account with a Salesforce opportunity becomes `qualified` regardless of its prior behavioral stage.

`qualified` → cohort differentiation: `sfdc_opportunity_stage` determines `progression_early_to_mature` vs. `progression_win_now`, per Section 2.4. Stage movement within the qualified tier (e.g., Stage 3 → Stage 6 in Salesforce) triggers a cohort reassignment from `progression_early_to_mature` to `progression_win_now` when the Kafka event delivers the updated stage.

**The HIGH_ENGAGEMENT single-Economic Buyer guard rail.** The `§14 ENGAGEMENT_THRESHOLDS` engagement score for a buying group is computed by aggregating the engagement scores of identified members. When this aggregate reaches `HIGH_ENGAGEMENT` (score ≥ 70), it signals strong deal health — the buying group is highly engaged with Kalder content. However, if the `HIGH_ENGAGEMENT` status is produced entirely by a single Economic Buyer with no other buying group members at `MEDIUM_ENGAGEMENT` or above, the health signal may be misleading. A single highly engaged EB with no Champion or Influencer engagement is not the same as a broadly engaged buying group approaching a convergence point.

In this condition, the program sets `bg_health_single_eb_elevated` = `true` on the AEP account profile. This is an annotation, not a suppressor: the engagement tier remains `HIGH_ENGAGEMENT` and cohort assignment is unchanged. The flag does not reduce activation intensity and does not change the content a visitor receives. Its purpose is to make the single-EB pattern visible in reporting and in the AE's view of account health, so that human judgment — not automated suppression — determines whether the `HIGH_ENGAGEMENT` signal reflects genuine deal health or a pattern that requires broadening the buying group.

The measurement responsibility for validating whether `bg_health_single_eb_elevated` accounts progress through convergence points at the same rate as multi-member `HIGH_ENGAGEMENT` accounts sits with Document 7 (Measurement and Experimentation Framework). If the data shows that single-EB HIGH_ENGAGEMENT accounts underperform, Document 7 will recommend whether to adjust content selection, activation intensity, or the guard rail mechanism itself.

`bg_health_single_eb_elevated` must be added to `CLIENT_ATTRIBUTE_MAP` (§CA).

---

### Data Model Update Note

The following attributes defined in this section must be added as entries in `CLIENT_ATTRIBUTE_MAP` (§CA) in the next implementation pass of `kalder_data_model.py`:

`bg_stage`, `sfdc_opportunity_created`, `sfdc_opportunity_stage`, `sfdc_opportunity_stage_stale`, `contact_engagement_event_count_180d`, `hand_raiser_event`, `bg_cohort`, `bg_health_single_eb_elevated`

`bg_stage` and `bg_cohort` are account-level computed attributes updated by the AEP pipeline. All other attributes are either pipeline-sourced (Salesforce via Kafka) or derived from Segment event aggregations. Once added to `CLIENT_ATTRIBUTE_MAP`, all program logic referencing stage and cohort state must resolve through that map at runtime.

[PENDING: Document 8 owner to confirm the Kafka event schema and AEP write rule for `sfdc_opportunity_stage` and `sfdc_opportunity_stage_stale` before implementation begins. The fallback behavior (all `qualified` accounts treated as `progression_early_to_mature`) remains in effect until this confirmation is received.]

---

## Section 4: Account-Level vs. Contact-Level Segmentation

---

### 3.1 The Two Decision Planes

Every personalization decision in this program is made at one of two planes: the account plane or the contact plane. These planes are computationally and logically separate. Account-plane decisions are evaluated once per account and shared uniformly across all contacts at that account. Contact-plane decisions are evaluated independently per `(contact_id, solution_category)` composite key — the same account may have contacts at vastly different classification depths simultaneously, and each is evaluated without reference to the others.

**Account-plane attributes** (stored on the AEP account profile):

| Group | Attribute | Governs |
|---|---|---|
| **TAL** | `tal_member` | TAL membership gate — prerequisite for all program activity |
| | `tal_program_status` | Program state: `active_prospect`, `post_sale`, or `out_of_program` |
| | `tal_account_type_source` | Upstream Salesforce account type; retained for audit and transition tracking |
| | `tal_upsell_override_active` | Post-sale upsell program activation flag |
| | `tal_solution_interest_flags` | Account-level solution category interest aggregate; drives Level 4 content selection |
| | `tal_region` | Geographic segmentation for regional campaign assignment |
| | `tal_marquee` | Priority tier flag for content inventory allocation |
| | `tal_new_logo_eligible` | Acquisition eligibility gate |
| | `tal_open_pipeline` | Active pipeline proxy; informs SDR activation eligibility |
| | `tal_account_domain` | Demandbase reverse-IP matching input |
| | `tal_channel` | Channel routing for sales activation (direct / msp / partner) |
| | `tal_last_refreshed_at` | TAL data staleness tracking timestamp |
| **Stage / Cohort** | `bg_stage` | Buying group pipeline stage: `targeted`, `engaged`, `prioritized`, `qualified` |
| | `bg_cohort` | Campaign treatment assignment: `education`, `acquisition`, `progression_early_to_mature`, `progression_win_now` |
| | `contact_engagement_event_count_180d` | Rolling 180-day qualifying engagement event count; drives `targeted` → `engaged` transition |
| | `hand_raiser_event` | Hand-raiser event flag; drives `engaged` → `prioritized` transition |
| **Pipeline** | `sfdc_opportunity_created` | Salesforce opportunity existence flag; triggers `qualified` stage assignment |
| | `sfdc_opportunity_stage` | Salesforce opportunity stage value; differentiates the two progression cohorts |
| | `sfdc_opportunity_stage_stale` | Staleness flag for `sfdc_opportunity_stage` (24-hour threshold) |
| **Health / Flag** | `bg_health_single_eb_elevated` | Annotation flag: HIGH_ENGAGEMENT driven solely by a single Economic Buyer |

**Contact-plane attributes** (keyed to `(contact_id, solution_category)` — each contact may have independent classifications across multiple solution categories simultaneously):

| Attribute | Governs |
|---|---|
| `role_classification` | Assigned buying group role: `champion`, `economic_buyer`, `influencer`, `user`, `ratifier`, or `default` |
| `confidence_tier` | Role classification certainty: `HIGH`, `MEDIUM`, `LOW`, or `UNKNOWN` |
| `role_confidence_score` | Numeric score 0–100 underlying the tier assignment; 100 when Tier 1 ML classifier governs |
| `differential_insufficient` | Ambiguity flag: `True` when top role leads second by fewer than 10 points; score capped at 49 |
| `buying_job_confirmed` | Tier 2 zero-party declared buying job (KNOWN state); null if not declared |
| `buying_job_inferred` | Tier 3 behavioral buying job inference (INFERRED state); null if not inferred |
| `fallback_level` | Experience depth assigned by cascade routing: integer 1–5 |
| `classification_mismatch` | Data quality flag: `True` when Tier 1 ML role and Tier 3 behavioral top scorer disagree |
| `solution_category` | Second component of the composite key; establishes which solution context this classification applies to |

Account-plane attributes supply the authorization envelope — which accounts are in-program, at what stage, and eligible for which channel activations. Contact-plane attributes supply the precision filter — which specific individuals within those accounts receive which depth and type of personalization.

---

### 3.2 How the Planes Combine at Decisioning Time

The two planes are read sequentially: AEP determines eligibility; Adobe Target determines depth.

AEP evaluates account-plane attributes to determine audience membership. An account's `bg_cohort`, `tal_program_status`, `sfdc_opportunity_stage`, and related attributes determine which AEP audience segments the account belongs to, and by extension which contacts at that account are eligible for which channel activations. AEP operates on account segments. It does not make contact-level experience decisions.

Adobe Target evaluates contact-plane attributes at session start to determine experience depth. It reads the contact's `fallback_level` and `role_classification` from the AEP contact profile — values the AEP pipeline has populated from the contact-plane scoring pipeline — and applies them to select which content variant, content depth, and CTA the contact receives. Adobe Target does not evaluate account-plane cohort membership directly; it reads the pre-computed contact-plane outputs.

The dependency is one-directional and gated: an account must first pass the AEP account-plane gate (`tal_program_status` = `active_prospect`, `bg_cohort` assigned) before any contact at that account is eligible for personalization above Level 5. A contact at an AEP-eligible account then receives the experience depth that Adobe Target determines from their individual contact-plane classification state.

One consequence of this architecture: a contact's experience depth can change between sessions as their contact-plane attributes update — without any change to the account's cohort or stage. Conversely, an account-plane cohort transition (e.g., `acquisition` → `progression_early_to_mature`) immediately changes which channel activations the account is eligible for, even before any individual contact's classification state changes.

Detail on Adobe Target rule syntax and AEP segment query definitions is deferred to Section 7.

---

### 3.3 The `differential_insufficient` Gate

Account-plane cohort assignment is a necessary but not sufficient condition for contact-level sales activation.

`bg_cohort` governs which channel activations an account is eligible for: an account in `acquisition` is eligible for Marketo nurture enrollment and SDR-owned Outreach sequences; an account in `progression_win_now` is eligible for AE-owned Outreach sequences. These are account-level authorizations. But the contact who actually receives a sales activation sequence must clear a separate contact-level threshold: `confidence_tier` must be `MEDIUM` or above, per `SALES_ACTIVATION_CONFIG` (§SA).

`differential_insufficient: True` is a `LOW`-tier state, not `MEDIUM`. A contact carrying this flag has a score capped at 49 because the scoring engine determined that the top-scoring role and the second-highest-scoring role are within 10 points of each other — the system cannot reliably distinguish which role this person holds. Their `confidence_tier` is `LOW`, regardless of the raw score value before the cap was applied. Treating this contact as `MEDIUM` for sales activation purposes would mean acting on an ambiguous classification signal.

The correct program response when `differential_insufficient: True`:

- Do not fire an Outreach sales activation sequence for this contact.
- Do not enroll this contact in a role-specific Marketo nurture track.

The recommended action — a progressive disclosure prompt to resolve the role ambiguity and produce a zero-party declaration — is specified in Document 5 (Personalization Decisioning Rules). The implementation mechanic — how Adobe Target and Marketo check `differential_insufficient` before activating — is specified in Document 8 (Operational Runbook).

**Account-plane cohort assignment is a necessary but not sufficient condition for contact-level sales activation. The contact's `confidence_tier` must be `MEDIUM` or above and `differential_insufficient` must be `False` before an Outreach sequence fires.**

This rule applies at the contact level independently for every member of the buying group. An account in `progression_win_now` may have three identified contacts: a HIGH-confidence Champion (`differential_insufficient: False`), a MEDIUM-confidence Influencer (`differential_insufficient: False`), and a LOW-confidence ambiguous contact (`differential_insufficient: True`). The first two contacts are eligible for AE-owned sequences. The third is not — the account's cohort assignment does not override the contact-level gate.

---

### 3.4 Solution Category as the Bridge

Solution category appears at both planes but serves a different function at each. The two must not be conflated.

**At the account plane:** `tal_solution_interest_flags` is a multi-valued account-level attribute listing the solution categories in which the account has demonstrated behavioral interest at the aggregate level. It is populated when any contact at the account engages with content in a specific solution category URL space. It drives Level 4 content selection — solution-relevant content can be surfaced for a TAL-matched visitor before any individual contact at that account has been classified into a role. It is an account-level aggregate and does not carry individual contact-level precision. Population of `tal_solution_interest_flags` is gated on `visitor_consent_state` — the behavioral engagement events that feed the aggregate are subject to the same consent classification as all first-party behavioral signals (Track 1 LIA complete; `declined` visitors do not contribute observations).

**At the contact plane:** `solution_category` is the second component of the `(contact_id, solution_category)` composite classification key established in Document 2. It makes role classification, confidence tier, buying job inference, and all other contact-level classification outputs solution-context-specific. The same contact may carry valid, simultaneous, independent classifications in multiple solution categories. A contact with a HIGH Champion classification in `customer_engagement` does not inherit any classification in `risk_compliance` — even if both appear in the account's `tal_solution_interest_flags`. Contact-plane classifications are partitioned by solution category; they do not aggregate or bleed across categories.

The distinction matters operationally: `tal_solution_interest_flags` answers "which solution areas is this account interested in?" — an account-level signal used to serve Level 4 content before any contact is classified. `solution_category` on the contact plane answers "in which solution context has this specific contact been classified?" — a contact-level precision signal used once role confidence is established.

**The `bg_health_single_eb_elevated` pattern** illustrates an important design convention the program uses elsewhere: a contact-plane condition — a single Economic Buyer at `HIGH_ENGAGEMENT` with no other buying group members at `MEDIUM_ENGAGEMENT` or above — is aggregated into an account-plane annotation. The flag is stored on the AEP account profile (account plane) but is derived from inspecting the contact-level engagement scores of the identified buying group members (contact plane). Practitioners implementing reporting or alert logic should recognize this pattern: not every attribute on the account profile is derived purely from account-level data. Some account-plane attributes are the output of contact-plane signal aggregation, and the derivation chain must be preserved when interpreting them.

---

## Section 5: Identification Layers and Personalization Availability

---

### 4.1 Overview — The Three Identification Layers

What the program knows about a visitor determines what it can serve. Identification layer is the shorthand for that state: it describes the combination of account-level resolution, contact-level resolution, and available data authority tiers that are currently active for a given visitor. As identification improves, the program's ability to personalize with precision improves alongside it.

Three layers are defined. Each is a stable operational state with a defined maximum personalization depth. Visitors can move between layers — promotion mechanics are specified in Section 6.

| Layer | Identification State | Identity Resolved? | Max Personalization Depth | Confidence Ceiling |
|---|---|---|---|---|
| **1 — Anonymous Account-Level** | Demandbase reverse-IP resolves visitor IP to a known TAL account domain; no `contact_id` resolved | Account only — `contact_id` is a temporary anonymous identifier | Level 2 (MEDIUM, via Tier 3 behavioral accumulation); Level 1 not reachable without stable `contact_id` | MEDIUM (Tier 3 behavioral ceiling; Tier 1 and Tier 2 require stable `contact_id`) |
| **2 — Anonymous Behavioral** | No Demandbase account match; browser/device identifier tracks signal observations across sessions | Neither account nor contact | Level 5 only (default brand) | None — TAL filter cannot be satisfied; scoring does not execute |
| **3 — Known Contact** | `contact_id` resolved via CRM match or zero-party self-identification; all three data authority tiers potentially active | Account and contact — `(contact_id, solution_category)` composite key is stable | Level 1 (HIGH confidence, role-specific), subject to `pending_solution_fallback` constraint | HIGH (Tier 1 ML classifier or Tier 2 zero-party + behavioral confirmation) |

A practitioner reading an AEP profile can determine a visitor's current layer from three attributes: whether `tal_member` = `true` (a Demandbase match has resolved the account), whether a stable `contact_id` is present in the profile, and the current `confidence_tier` value in the contact-plane classification output.

---

### 4.2 Layer 1 — Anonymous Account-Level

**How Layer 1 is established.** Demandbase reverse-IP resolution matches the visitor's IP address to a known account domain in the `tal_account_domain` field of an AEP account profile. TAL membership is confirmed. The visitor has not submitted a form, responded to a progressive disclosure prompt, or been matched to a Salesforce contact record — no stable `contact_id` has been resolved. The program knows who the account is but not which person at that account is visiting.

**Behavioral scoring at Layer 1.** This is not a no-scoring state. Signal observations from a Layer 1 session that pass the TAL status filter and subsequent pre-scoring filters (post-sale suppression, cross-category isolation, session quality gates — Document 2, Section 4) are forwarded to the scoring engine. The `contact_id` component of the `(contact_id, solution_category)` composite classification key is a temporary anonymous identifier — a Segment anonymous ID or device identifier — that accumulates a signal history under that key across sessions. The classification output this produces is real and governs personalization at whatever depth the accumulated signal supports. If a Layer 1 visitor accumulates sufficient behavioral signal, they can reach MEDIUM `confidence_tier` and receive a Level 2 experience. What is missing at Layer 1 is not scoring — it is a stable identity anchor that would enable the two higher-authority data tiers.

**Personalization depth available at Layer 1.**

Minimum personalization, available from the first session in which a Demandbase match resolves: Level 4 (account-level experience). `tal_solution_interest_flags`, industry vertical, and account firmographics are immediately available for content selection, regardless of behavioral signal accumulation.

Maximum personalization, with behavioral accumulation: Level 3 (solution-interest, LOW confidence) or Level 2 (MEDIUM, if signal accumulates to the MEDIUM threshold via Tier 3 behavioral inference). Level 1 is not reachable at Layer 1 without a stable `contact_id`, because Tier 1 ML classifier output requires a CRM-confirmed contact record, and Tier 2 zero-party self-identification requires a form submission that would simultaneously promote the visitor to Layer 3.

**Current operational constraint — firmographic bonus pathway.** The firmographic title-match enrichment function — the Demandbase `demandbase_firmographic_match` signal that applies a +30 bonus to a matched role's behavioral score — is classified `explicit_consent_required` with `track_2_status: pending_legal_review` [data model §P v0.2.0]. The +30 bonus pathway is suppressed until Track 2 legal review completes and a GDPR-compliant consent mechanism is implemented. Under current Track 2 pending status, a Layer 1 visitor cannot receive the firmographic bonus even if their title matches a known role mapping. This makes MEDIUM confidence attainable only through behavioral signal accumulation alone, which is a higher volume of signals than the bonus-assisted pathway would require. This constraint is temporary and architectural: once Track 2 activates, the firmographic bonus will apply at Layer 1 and the effective confidence ceiling may be reached with fewer sessions. The Demandbase reverse-IP account identification function — the TAL membership check that establishes Layer 1 in the first place — is a separate function, is not Track 2 gated, and is available now.

**Consent interaction at Layer 1.** Visitors with `visitor_consent_state` = `declined` receive the account-level experience (Level 4) when a TAL match exists; no behavioral signal observations are collected or scored. Visitors with `full` or `functional_only` consent receive behavioral scoring on all 19 first-party behavioral signals, subject to the Track 2 constraint above. Note that the firmographic bonus suppression has two independent causes: Track 2 pending status suppresses the bonus for all visitors regardless of consent state; `functional_only` consent state additionally suppresses all `explicit_consent_required` signals, including `demandbase_firmographic_match`, meaning the firmographic bonus would remain suppressed for `functional_only` visitors even after Track 2 completes. Both Track 2 completion and `full` consent state are required for the firmographic bonus to activate. The `firmographic_enrichment_cache` in AEP retains the Demandbase reverse-IP match result for 90 days; consent withdrawal purges the cache, which can cause a returning visitor to be treated as unidentified until a new Demandbase match resolves in a subsequent session [Section 1.7].

**Promotion.** When a Layer 1 visitor submits a form, responds to a progressive disclosure prompt, or is matched to a CRM contact record, they promote to Layer 3. The promotion mechanics — trigger event, behavioral history stitching, anonymous identifier to stable `contact_id` migration, and decay recalculation — are specified in Section 6.

---

### 4.3 Layer 2 — Anonymous Behavioral

**How Layer 2 is established.** A visitor has accumulated behavioral signal observations tracked via browser cookie or device identifier across one or more sessions, but Demandbase reverse-IP resolution has not produced a match to any known TAL account domain. No account has been identified and no `contact_id` has been resolved.

**Why scoring cannot execute at Layer 2.** The first of the four pre-scoring filters [Document 2, Section 4.2] requires confirmed TAL account membership before any signal observations are forwarded to the scoring engine. At Layer 2, Demandbase has returned no account match, so the TAL filter cannot be satisfied. Signal observations are captured by the Segment event stream — the behavioral record is retained with original timestamps — but they are not forwarded to the scoring engine and do not produce any role classification. This is not a data loss. The history is preserved and its timestamps are intact.

**What retained Layer 2 signals are worth.** If a subsequent session produces a Demandbase match that promotes the visitor to Layer 1, the retained Segment event stream history — with original observation timestamps — becomes available to the scoring pipeline. Per CR-05 [data model §8 CR-05], signals in the 181–365 day range receive the `anonymous_visitor_long_decay` multiplier (0.2×) while the visitor remains anonymous. At the moment of Layer 1 promotion, those same signals are rescored using identified-visitor decay rules, which apply `over_180_days: 0.0×` — the 0.2× anonymous continuity multiplier does not persist after identification. Signals within the standard decay windows (0–90 days at 1.0×, 91–180 days at 0.7×) carry their original timestamps and weights directly into the first Layer 1 scoring run without any recalculation. The net effect is that behavioral history accumulated during Layer 2 can meaningfully accelerate the scoring pipeline at Layer 1 promotion — in some cases providing enough signal to immediately reach MEDIUM confidence in the first identified session — but distant Layer 2 history (181–365 days) is deliberately discounted to prevent stale anonymous observations from inflating the initial identified score.

**Personalization depth at Layer 2.** Level 5 only — the default brand experience with no personalization. No account identification means no account-level content selection, no `tal_solution_interest_flags`, and no role classification. Layer 2 visitors receive the same experience as any non-TAL visitor.

**Consent interaction at Layer 2.** Visitors with `visitor_consent_state` = `declined` at Layer 2 cannot build a behavioral signal record. Signal collection is suppressed from the first declined session, which means the Segment event stream receives no observations during the declined period. A declined visitor who subsequently changes their consent state to `full` or `functional_only` will have no pre-consent behavioral history available to the scoring pipeline — nothing was collected, so nothing can be stitched. The Layer 2 behavioral accumulation that typically accelerates scoring at promotion is absent for visitors with a prior declined period.

**Promotion.** If a Demandbase match resolves in a subsequent session, the retained Layer 2 behavioral history becomes available to the scoring pipeline and the visitor is promoted to Layer 1. If a form fill or CRM match occurs simultaneously with or prior to a Demandbase match, the visitor promotes directly to Layer 3, bypassing Layer 1 entirely. The promotion mechanics are specified in Section 6.

---

### 4.4 Layer 3 — Known Contact

**How Layer 3 is established.** A stable `contact_id` has been resolved by one of two paths: a CRM match, in which the Kafka pipeline delivers a match between a session identifier and a Salesforce contact record to AEP; or zero-party self-identification, in which the visitor submits a form, responds to a progressive disclosure prompt, or accesses gated content with a contact identifier. Once a stable `contact_id` is in place, the `(contact_id, solution_category)` composite classification key is stable and all three data authority tiers are potentially active.

**Data authority tiers at Layer 3.**

Tier 1 (ML classifier): available for Champion, Economic Buyer, and Influencer at v1 launch; User and Ratifier are pending. When a Tier 1 classification exists for a `(contact_id, solution_category)` key, it governs the role assignment and can produce HIGH `confidence_tier` without behavioral signal volume. Tier 1 output is CRM-confirmed and does not decay.

Tier 2 (zero-party self-identification): available for all five roles. When combined with behavioral confirmation, produces HIGH `confidence_tier`. Zero-party declarations decay after 90 days from the date of self-identification and require re-confirmation.

Tier 3 (behavioral inference): available for all five roles. Behavioral signals accumulated during Layers 1 and 2 — with their original timestamps — carry forward into the Layer 3 scoring profile per the promotion mechanics in Section 6. Tier 3 alone is capped at MEDIUM `confidence_tier` regardless of score value.

**Personalization depth at Layer 3.** Level 1 (HIGH confidence, role-specific) is the maximum — subject to two independent constraints operating simultaneously. First, `confidence_tier` must be HIGH, which requires Tier 1 or Tier 2 + behavioral confirmation. MEDIUM tier at Layer 3 produces Level 2; LOW and UNKNOWN produce Levels 3–4 through the cascade routing sequence [Document 1, Section 8.8]. Second, the active solution category's content coverage must not be `pending_solution_fallback`. A Layer 3 visitor classified at HIGH confidence in a solution category with `coverage_status: pending` receives the best available general content for that area — functionally Level 3 or below — because role-specific content inventory for that category is not yet available [Document 1, pending_solution_fallback]. At v1 launch, Customer Engagement is the only fully covered solution category; four others carry pending or partial coverage. Both constraints must be satisfied independently — HIGH confidence is necessary but not sufficient for a Level 1 experience.

**Consent interaction at Layer 3.** CRM match via the Kafka pipeline is not gated on `visitor_consent_state` — a `declined` visitor's `contact_id` may be resolved if they appear in the CRM, and account-plane attributes remain current. However, no contact-plane behavioral scoring executes for a `declined` visitor regardless of `contact_id` resolution status. A `declined` known contact at a TAL account receives Level 4 (account-level, no behavioral personalization) — the same operational ceiling as a Layer 1 `declined` visitor. Visitors with `functional_only` consent receive behavioral scoring on all 19 first-party signals; the firmographic bonus pathway remains suppressed regardless of consent state until Track 2 legal review completes.

**Promotion.** Layer 3 is the terminal identification layer — there is no Layer 4. Behavioral history stitching at Layer 3 promotion — how pre-promotion anonymous signals accumulated during Layers 1 and 2 are merged into the stable `contact_id` profile — is specified in Section 6.

---

### 4.5 Experience Coherence at Layer Transitions

A visitor moving from Layer 2 to Layer 1, or from Layer 1 to Layer 3, should experience each transition as a natural increase in relevance — content that better reflects their interests and context — rather than a disjointed pivot to a different type of experience. The program's goal is that identification improvements are invisible to the visitor except insofar as the experience becomes more useful. For content strategists and web experience architects, this means that the content available at Level 4 and Level 3 must read coherently as lower-depth versions of what a Level 2 or Level 1 visitor in the same solution area would see, not as categorically different content. The session in which a promotion event occurs presents a specific design challenge: the visitor's layer may change mid-session, and the question of whether to update the experience in-session or wait for the next session start requires a defined rule. That rule, along with the full experience design specification for layer transitions, is owned by Document 5 (Personalization Decisioning Rules). This section names the coherence requirement; Document 5 specifies how it is met.

---

## Section 6: Anonymous-to-Known Contact Promotion

---

### 5.1 Overview

Promotion is the pipeline event by which a visitor moves from a lower identification layer to a higher one. Each promotion path has a defined trigger event, a behavioral history stitching operation, a decay recalculation step, and a resulting AEP profile state. This section specifies all three paths and the failure modes that arise when those mechanics encounter data quality problems.

One timing rule governs all three paths and must be stated before the paths are specified individually: a promotion event triggers an AEP profile update and a scoring pipeline run. These operations are not guaranteed to complete within the current session. **The new classification produced by the promotion is available to Adobe Target at the start of the next session in which the visitor appears, not necessarily within the current session.** The in-session experience behavior during the window between a promotion event and the next session start is an experience design decision owned by Document 5 (Personalization Decisioning Rules). Section 6 specifies what the pipeline can and cannot support; Document 5 decides what to serve.

---

### 5.2 Path A — Layer 2 → Layer 1

**Trigger:** Demandbase reverse-IP resolves the visitor's IP address to a known TAL account domain in a session where no prior account resolution exists. This may be the visitor's first session or a return session after prior Layer 2 behavioral accumulation.

**Pipeline sequence:**

Step 1 — Account resolution. Demandbase resolves the visitor's IP to an account domain. AEP account profile lookup confirms TAL membership: `tal_member` = `true`, `tal_program_status` = `active_prospect` (or `post_sale` — Section 1.3 suppression rules apply). If TAL membership is not confirmed, promotion does not occur and the visitor remains at Layer 2.

Step 2 — TAL filter satisfaction. The Segment anonymous ID (the browser or device identifier used during Layer 2) is now linkable to an AEP account profile. The TAL status filter — the first of the four pre-scoring filters [Document 2, Section 4.2] — can be satisfied for the first time. Retained Layer 2 behavioral observations, captured in the Segment event stream under the anonymous device identifier with their original timestamps, become eligible to enter the scoring pipeline.

Step 3 — Decay recalculation. Behavioral signals from Layer 2 are rescored at promotion using the following rules, applied by original observation timestamp:

- Signals 0–90 days old: `last_90_days` multiplier (1.0×). Original timestamps and weights carry forward without adjustment.
- Signals 91–180 days old: `91_to_180_days` multiplier (0.7×). Original timestamps carry forward.
- Signals 181–365 days old: rescored from `anonymous_visitor_long_decay` (0.2×) to `over_180_days` (0.0×) per CR-05 [data model §8 CR-05]. The 0.2× continuity multiplier that preserved weak signal history while the visitor was anonymous does not persist after identification. These signals contribute zero weight to the first Layer 1 scoring run. This is the correct behavior — the anonymous continuity multiplier exists to preserve score history across anonymous return sessions, not to carry stale observations into an identified profile.
- Signals older than 365 days: not retained. The raw behavioral signal retention window is 365 days [data model §P.4].

Step 4 — Scoring. The composite classification key for Layer 1 is `(anonymous_id, solution_category)` — the temporary anonymous identifier. Scoring produces contact-plane attributes under this key. A stable `contact_id` does not yet exist; Tier 1 and Tier 2 data authority pathways are not yet open.

**AEP profile state after Path A:** `tal_member` = `true`; account-plane attributes (`bg_stage`, `bg_cohort`, and all Section 2 and 3 attributes) are now computable and begin updating; contact-plane attributes are keyed to `(anonymous_id, solution_category)` and reflect accumulated behavioral scoring; no stable `contact_id` exists.

**Timestamp preservation:** The Segment event pipeline must preserve original observation timestamps when forwarding Layer 2 event history to the Layer 1 scoring run. Assigning the Path A promotion timestamp to pre-promotion events would apply `current_session` weights (1.5×) to observations that are weeks or months old, producing an inflated score on the first Layer 1 scoring run. [PENDING: Document 8 owner to specify the Segment event pipeline timestamp preservation implementation for Path A promotion events.]

---

### 5.3 Path B — Layer 1 → Layer 3

**Trigger:** A Layer 1 visitor (already account-identified via Demandbase) generates a contact identifier event through one of three mechanisms: a form fill submission (demo request, contact us form, or gated content download) captured by Segment as a form submission event carrying a contact identifier; a progressive disclosure prompt response captured by Segment carrying a self-declared role and a contact identifier; or a CRM contact match delivered by the Kafka pipeline — the pipeline identifies a match between the Segment anonymous ID or a session attribute and a Salesforce contact record and delivers the resolved `contact_id` to AEP.

**Pipeline sequence:**

Step 1 — Contact identifier arrival. The contact identifier event arrives in AEP via the Segment event stream (form fill, progressive disclosure) or the Kafka pipeline (CRM match). AEP initiates the identity stitching job.

Step 2 — Anonymous identifier association. The Segment anonymous ID accumulated during Layer 1 — and any prior Layer 2 history linked to it — is associated with the resolved `contact_id`. The `(contact_id, solution_category)` composite classification key becomes stable. Contact-plane attributes previously keyed to `(anonymous_id, solution_category)` are migrated to `(contact_id, solution_category)`.

Step 3 — Decay recalculation. The same decay rules as Path A apply to signals in the 181–365 day range: those scored under `anonymous_visitor_long_decay` (0.2×) are rescored to `over_180_days` (0.0×) at the moment of `contact_id` establishment, per CR-05. Signals 0–180 days old carry their original timestamps and decay weights directly into the `contact_id` profile without recalculation.

Step 4 — Data authority tier activation. Tier 1 (ML classifier) and Tier 2 (zero-party self-identification) pathways are now open. If the Kafka pipeline has already produced a Tier 1 classification for this `contact_id` based on CRM data, it takes precedence over behavioral inference per the three-tier authority hierarchy [Document 1]. If the promotion was triggered by a progressive disclosure response, the declared role and solution category are written to the contact profile as a Tier 2 zero-party signal, initiating the Tier 2 behavioral confirmation requirement for HIGH confidence.

Step 5 — Stage transition check. If the Layer 1 → Layer 3 promotion was triggered by a form fill or progressive disclosure (as opposed to a background CRM match), the `hand_raiser_event` flag fires on the AEP account profile. Per Section 2.5, a `hand_raiser_event` from a contact at this account may trigger an `engaged` → `prioritized` `bg_stage` transition on the account plane, if the account was previously in the `engaged` stage. The `bg_stage` update happens on the account plane independently of the contact-plane stitching operation.

**Timestamp preservation requirement:** The Segment event pipeline must preserve original observation timestamps when writing pre-promotion events to the `contact_id` profile. Assigning the Path B promotion timestamp to pre-promotion events would cause the scoring engine to treat signals that fired days or weeks ago as `current_session` events (1.5×), significantly inflating the initial `contact_id` score. [PENDING: Document 8 owner to specify the Segment event pipeline timestamp preservation implementation for Path B stitching operations.]

**AEP profile state after Path B:** Stable `contact_id` in place; `(contact_id, solution_category)` composite key active; all three data authority tiers potentially active; account-plane attributes (`bg_stage`, `bg_cohort`) continue updating independently — Path B does not reset or modify account-plane attributes; new classification available to Adobe Target at the next session start.

---

### 5.4 Path C — Layer 2 → Layer 3 (Direct)

**Trigger:** A Layer 2 visitor (no prior Demandbase account resolution) generates a contact identifier event — form fill, progressive disclosure, or CRM match via Kafka — before any TAL account identification has occurred.

**Pipeline sequence:**

Step 1 — Contact identifier resolution. The contact identifier event arrives. The `contact_id` is resolved.

Step 2 — Account identification via CRM association. AEP checks whether the CRM contact record carries an account association (`sfdc_account_id`). If yes, AEP uses the CRM account association to confirm TAL membership. This is CRM-sourced account identification, not Demandbase-sourced. CRM account association is Tier 1 data and takes authority precedence over Demandbase reverse-IP resolution. If the CRM-associated account is confirmed as TAL-member, the visitor simultaneously receives account-plane identification (satisfying the TAL filter) and contact-plane identification, arriving at Layer 3 without a Layer 1 intermediate.

Step 3 — Behavioral history stitching. Retained Layer 2 Segment event stream history carries forward with original timestamps to the `contact_id` profile, subject to the same decay recalculation rules as Paths A and B: 0–180 day signals at standard weights; 181–365 day signals rescored from 0.2× to 0.0× per CR-05.

Step 4 — Incomplete account identification. If the CRM contact record does not carry a usable account association, or the associated account is not in the TAL, account-plane identification remains incomplete. The visitor holds a resolved `contact_id` but the TAL status filter cannot be satisfied. The behavioral history and contact-plane classification key exist but scoring cannot execute. The visitor is in a transitional state: `contact_id` resolved, TAL filter unmet. A subsequent Demandbase match or CRM account association update resolves this state. No attempt is made to infer TAL membership from any source other than the CRM account association or Demandbase reverse-IP resolution.

**Account mismatch resolution rule:** When the CRM contact record's account association (Account A) differs from the account Demandbase has resolved from the visitor's IP (Account B — e.g., the visitor is browsing from a partner's office, a VPN exit node, or a co-working space shared with another TAL account), CRM account association governs. TAL membership is checked against Account A. Demandbase-resolved Account B is not used for TAL verification in this scenario. If Account A is in the TAL, the visitor is account-identified against Account A's profile. If Account A is not in the TAL, the visitor is not TAL-identified regardless of Account B's TAL status. **CRM account association is authoritative for TAL identification when it conflicts with Demandbase reverse-IP account resolution.** This rule is the most likely source of silent misclassification in Path C and must be implemented as an explicit check, not a default fallback.

**Consent handling at Path C:** CRM match via Kafka is not gated on `visitor_consent_state` — the `contact_id` may be resolved and the CRM account association confirmed regardless of the visitor's consent state [Section 4.4]. However, a visitor with `visitor_consent_state` = `declined` who arrives at Layer 3 via Path C receives no behavioral scoring. The TAL filter is satisfied and account-plane attributes are current, but the contact-plane scoring pipeline does not execute. The visitor receives Level 4 (account-level, no behavioral personalization) — the same ceiling as a Layer 1 `declined` visitor.

**AEP profile state after Path C:** Same as Path B. If account identification via CRM association was incomplete, the profile holds a `contact_id` with a `tal_member` = `false` or unresolved state until a subsequent resolution event fires.

---

### 5.5 Failure Modes

#### Failure Mode 1 — Stitching Delay

**Scenario:** The Kafka pipeline or AEP identity stitching job has initiated but not completed when the next scoring run fires. The `contact_id` exists in AEP but contact-plane attributes are still keyed to the anonymous identifier — the `(contact_id, solution_category)` key has no prior behavioral history populated yet.

**Program response:** Hold the last known classification state from the anonymous identifier profile until stitching completes. Do not score the `contact_id` with zero prior behavioral history — doing so would produce an artificially low `confidence_tier` and potentially downgrade a visitor from a Level 2 experience to Level 4 or Level 5 in the session immediately following their promotion event. A `stitching_pending` = `true` flag on the AEP contact profile signals the transitional state to Adobe Target and to the operational monitoring dashboard. Rationale: a one-session hold at the visitor's prior classification level is a smaller error than a potentially significant experience downgrade on the session immediately following identification. Scoring resumes on the next scoring cycle after stitching completion is confirmed and `stitching_pending` is cleared. If the stitching job has not confirmed completion within 24 hours of initiation, a pipeline health alert fires to the data team per the monitoring specifications in Document 8 (Operational Runbook).

`stitching_pending` must be added to `CLIENT_ATTRIBUTE_MAP` (§CA).

#### Failure Mode 2 — Multi-Contact Match

**Scenario:** The Segment anonymous identifier resolves to more than one CRM contact record — for example, because the same device, browser, or IP has been used by multiple employees at the same account, or because the same email address is associated with multiple Salesforce contact records.

**Program response:** Apply the following resolution sequence:

1. If exactly one of the matched contacts has an active Salesforce opportunity associated with the relevant solution category, stitch to that contact.
2. If multiple contacts have active opportunities in the relevant solution category, or none do, stitch to the contact with the most recent Salesforce activity date.
3. If the matched contacts cannot be resolved by the above criteria — tied activity dates, no distinguishing data — do not stitch. Retain the behavioral history under the anonymous identifier. Set `multi_match_unresolved` = `true` on the anonymous identifier's AEP record and await a more specific contact signal (form fill with email address, progressive disclosure response with declared role). When a more specific signal arrives, re-run the resolution sequence from Step 1 against the narrowed candidate set.

The behavioral history is not duplicated to multiple `contact_id` profiles. Stitching is a one-to-one operation.

`multi_match_unresolved` must be added to `CLIENT_ATTRIBUTE_MAP` (§CA).

#### Failure Mode 3 — Account Mismatch (CRM vs. Demandbase)

**Scenario:** The visitor's CRM contact record associates them with Account A, but the active Demandbase reverse-IP match for their current session resolves to Account B. This arises when a contact browses from a partner organization's office, a VPN exit node registered to another company, or a co-working space with a shared IP range that resolves to a different TAL account.

**Program response:** CRM account association governs, per the rule stated in Section 5.4. TAL membership is checked against the CRM-associated Account A. The session-level Demandbase match to Account B is not used for TAL verification and does not trigger account-plane attribute updates for Account B. If Account A is in the TAL, the visitor's account-plane profile is Account A's profile. If Account A is not in the TAL, the visitor is not TAL-identified in this session.

This failure mode does not require a flag — the CRM governance rule produces a deterministic outcome in every case. What it does require is that the implementation checks for the CRM account association before falling back to Demandbase resolution. [PENDING: Document 8 owner to confirm the priority check sequence in the AEP account identification rule when both CRM and Demandbase account associations are present.]

---

### Data Model Update Note

The following attributes defined or introduced in this section must be added as entries in `CLIENT_ATTRIBUTE_MAP` (§CA) in the next implementation pass of `kalder_data_model.py`:

`stitching_pending`, `multi_match_unresolved`

Both are transient state flags written to the AEP contact or anonymous identifier profile during promotion pipeline operations. `stitching_pending` is a boolean that must be monitorable by the operational dashboard; its 24-hour SLA is specified in Document 8. `multi_match_unresolved` is a boolean that persists on the anonymous identifier record until a resolution event fires and stitching completes.

Two Document 8 items remain open from this section:

1. [PENDING: Document 8 owner to specify Segment event pipeline timestamp preservation implementation for Path A (Layer 2 → Layer 1) and Path B (Layer 1 → Layer 3) promotion events.]
2. [PENDING: Document 8 owner to confirm the priority check sequence in the AEP account identification rule when both CRM account association and Demandbase reverse-IP resolution are present simultaneously (Failure Mode 3 / Path C account mismatch).]

---

## Section 7: Segment-to-Channel Mapping

---

### 6.1 Overview — The Activation Architecture

Channel activation in this program is a two-gate operation. AEP computes audience segment membership from account-plane and contact-plane attributes and publishes that membership to each channel. Each channel uses segment membership as its eligibility gate. Within that gate, the channel reads contact-plane attributes — `fallback_level`, `role_classification`, `confidence_tier`, `differential_insufficient` — to determine the specific experience, nurture track, or sequence to activate.

This is the instantiation of the Section 3.2 two-plane architecture. "AEP determines eligibility" means AEP evaluates `bg_cohort`, `tal_program_status`, `bg_stage`, `sfdc_opportunity_created`, and associated conditions (the Section 2.3 AEP segment definitions) to produce a segment membership record for each account and contact. "Target determines depth" means Adobe Target uses that segment membership as an audience gate on a Target activity, then reads `fallback_level` and `role_classification` from the AEP contact profile to select the specific content variant within that gate. The gate is account-plane; the depth decision is contact-plane. This resolves the Section 3.2 flag: AEP segment membership on a Target activity does not contradict the two-plane architecture — it is the mechanism by which account-plane eligibility is communicated to Target without requiring Target to evaluate account attributes directly.

| Channel | What AEP Publishes | What the Channel Reads | Primary Gate | Latency Model |
|---|---|---|---|---|
| **Adobe Target** | Audience segment membership per contact (derived from `bg_cohort` and `tal_program_status`) | `fallback_level`, `role_classification`, `differential_insufficient` from AEP contact profile | AEP segment membership (account-plane cohort, encoded) | Session start — profile reflects last completed scoring run |
| **Marketo** | Segment entry/exit events per contact, including `bg_cohort`, `bg_stage`, `role_classification`, `confidence_tier` | `role_classification`, `confidence_tier`, `bg_stage` for nurture track selection | AEP segment membership (cohort transition events) | Near-real-time for entry/exit events; [PENDING: batch sync cadence — see §6.3] |
| **Outreach** | Convergence point alert payload (via Salesforce CRM as intermediary) | Account state (`bg_stage`, `bg_cohort`), contact state (`confidence_tier`, `role_classification`, `differential_insufficient`) | MEDIUM+ `confidence_tier` AND `differential_insufficient` = `False` | [PENDING: AEP → Salesforce → Outreach routing — see §6.4] |

---

### 6.2 Adobe Target — Web Personalization Activation

Adobe Target is the delivery layer for the fallback cascade. Each cohort maps to a Target activity with an AEP audience segment as its entry condition. Within that activity, Target reads the contact's `fallback_level` and `role_classification` to select the specific content variant.

**Rule evaluation order.** Target evaluates fallback level rules from Level 1 (most specific, highest confidence) to Level 5 (default brand). A visitor is served the highest level for which all conditions are met. Evaluation stops at the first matching level — it is not exhaustive. Rule evaluation order must match the fallback level sequence: higher levels evaluated first.

**The `differential_insufficient` override.** When `differential_insufficient` = `True`, the contact's `confidence_tier` is LOW regardless of the raw score that triggered the flag. Role-specific content cannot be reliably selected when two roles scored within 10 points of each other. The Target rule for this override: when `differential_insufficient` = `True`, serve solution-interest content at Level 3 regardless of the contact's `fallback_level` value. This override takes precedence over the fallback level rule evaluation sequence. A contact with `fallback_level` = 2 (indicating a MEDIUM behavioral accumulation under a temporary anonymous ID, for example) but `differential_insufficient` = `True` is served Level 3 content — not Level 2 role-influenced content — because the role distinction that Level 2 requires cannot be made.

**Latency.** Target reads the AEP contact profile at session start. The profile reflects the state written by the most recent scoring run before the session began. A promotion event (Section 6) produces a new classification available at the next session start, not within the current session.

**Per-cohort Target activation:**

**`education` cohort.** AEP audience gate: `tal_program_status` = `active_prospect` AND `bg_stage` = `targeted` AND `sfdc_opportunity_created` = `false` OR null AND `contact_engagement_event_count_180d` = 0 [Section 2.3]. Target activity: education-stage web experience. Most visitors in this cohort have no resolved `contact_id`; they receive Level 4 (account-level experience based on `tal_solution_interest_flags`, industry vertical, and account firmographics). When a contact is identified within this cohort — an early identification before any engagement event fires — Target reads their `fallback_level` and serves accordingly.

**`acquisition` cohort.** AEP audience gate: `tal_program_status` = `active_prospect` AND `bg_stage` = `engaged` OR `prioritized` AND `sfdc_opportunity_created` = `false` OR null AND `contact_engagement_event_count_180d` >= 1 [Section 2.3]. Target activity: acquisition-stage web experience. Target reads `fallback_level` (Level 1–4 depending on contact classification state), `role_classification` (determines which role-specific or role-influenced content variant is served at Levels 1–2), and `differential_insufficient` (triggers Level 3 override when `True`). Within the acquisition cohort, Target also reads `bg_stage` (`engaged` vs. `prioritized`) to inform content depth selection — `prioritized` contacts receive requirements-framing and solution-validation content depth; `engaged` contacts receive solution-exploration depth. This is a content selection input, not a separate Target audience rule.

**`progression_early_to_mature` cohort.** AEP audience gate: `tal_program_status` = `active_prospect` AND `bg_stage` = `qualified` AND `sfdc_opportunity_created` = `true` AND `sfdc_opportunity_stage` IN [2, 3, 4] AND `sfdc_opportunity_stage_stale` = `false` [Section 2.3]. Target activity: progression-stage web experience (early-to-mature variant). Target reads `fallback_level`, `role_classification`, and `differential_insufficient`. At this stage, most identified contacts will have accumulated sufficient signal for Level 1 or Level 2; Target prioritizes role-specific validation, business case, and competitive differentiation content variants.

**`progression_win_now` cohort — PENDING.** The `progression_win_now` Target activity is not active until the Kafka `sfdc_opportunity_stage` pipeline is confirmed and implemented [Section 2.4 PENDING]. Until confirmed, all `qualified` accounts with `sfdc_opportunity_created` = `true` activate the `progression_early_to_mature` Target activity regardless of opportunity stage. The `progression_win_now` Target activity will be activated as a distinct activity at the point the pipeline feasibility is confirmed and the AEP segment definitions for Salesforce Stage 5–7 can be evaluated. [PENDING: Document 8 owner to confirm Kafka pipeline feasibility for `sfdc_opportunity_stage` and trigger activation of the `progression_win_now` Target activity.]

---

### 6.3 Marketo — Email Activation

Marketo program enrollment is driven by AEP segment entry and exit events. When a contact's `bg_cohort` changes — from `education` to `acquisition`, or from `acquisition` to `progression_early_to_mature` — the AEP → Marketo connector fires an exit event from the prior program and an entry event to the new program. This transition is automated via Real-Time CDP B2B Edition segment membership events, not a manual step. [PENDING: Document 8 owner to confirm the AEP → Marketo connector configuration for program exit/entry automation and specify the expected batch sync cadence for non-event-driven attribute updates.]

**`education` cohort — Marketo suppressed.** No Marketo program enrollment exists for the education cohort. Most accounts at this stage have no identified contacts. Attempting to enroll unidentified visitors in a Marketo program is not possible; enrollment requires a resolved contact identifier. When an account in the education cohort transitions to `engaged` and the first contact is identified, enrollment fires directly in the `acquisition` Marketo program — not in a separate education program. There is no education-specific Marketo program. Practitioners should not expect one.

**`acquisition` cohort.** AEP triggers enrollment when `bg_cohort` = `acquisition` and a resolved `contact_id` exists. Marketo reads `role_classification` to assign the contact to the appropriate role-specific nurture track (Champion track, Economic Buyer track, Influencer track). When `role_classification` = `default` (UNKNOWN or LOW confidence), the contact enrolls in a general solution-category track — no role-specific differentiation — until role confidence improves and a re-enrollment to a role-specific track fires. `confidence_tier` informs content depth within the role track: MEDIUM confidence contacts receive more pointed solution-validation content than contacts approaching the MEDIUM threshold. Within the acquisition cohort, `bg_stage` (`engaged` vs. `prioritized`) also informs nurture content depth: `prioritized` contacts receive requirements-framing content and evaluation guides; `engaged` contacts receive category-education and solution-exploration content.

**`progression_early_to_mature` cohort.** AEP triggers a program transition when `bg_cohort` moves from `acquisition` to `progression_early_to_mature`. The contact exits the acquisition Marketo program and enters the progression program. Marketo reads `role_classification` for role-specific progression track assignment: Champion-track contacts receive executive alignment and convergence-enabling content; Economic Buyer contacts receive ROI validation and business value alignment content; Influencer contacts receive technical validation and solution validation content; Ratifier contacts receive risk, compliance, and procurement content. `confidence_tier` remains the depth gate — MEDIUM+ contacts receive the full role-specific progression track.

**`progression_win_now` cohort — PENDING.** The `progression_win_now` Marketo program is not active until the Kafka pipeline is confirmed [Section 2.4 PENDING]. Contacts whose accounts should be in `progression_win_now` remain enrolled in the `progression_early_to_mature` Marketo program until confirmation. At confirmation, AEP will fire a program transition event moving contacts to the `progression_win_now` program.

---

### 6.4 Outreach — Sales Activation

Outreach sequence activation flows through Salesforce CRM as an intermediary: AEP publishes convergence point alert payloads to Salesforce (via the AEP → Salesforce connector or the Kafka pipeline's outbound path), and Salesforce triggers the corresponding Outreach sequence based on CRM field updates. [PENDING: Document 8 owner to confirm the AEP → Salesforce → Outreach routing implementation, including whether the alert payload is delivered via the Real-Time CDP connector, a Kafka outbound event, or a Salesforce workflow triggered by AEP segment membership changes.]

**The two contact-level gates.** Before any Outreach sequence fires for a contact, two conditions must both be true, per `SALES_ACTIVATION_CONFIG` (§SA) and Section 3.3:

1. `confidence_tier` must be `MEDIUM` or `HIGH`.
2. `differential_insufficient` must be `False`.

A contact with `differential_insufficient` = `True` has a LOW-tier classification — the scoring engine capped their score at 49 because two roles scored within 10 points. Acting on this signal with a sales sequence would be acting on an ambiguous classification. The correct response for this contact is a progressive disclosure prompt (Document 5), not a sales sequence. A BDR or AE who does not see a sequence trigger for a contact where they expected one should verify both gates in the AEP contact profile before concluding the account is not eligible. The contact may be in the right cohort but failing the contact-level confidence gate.

**`tal_channel` routing.** The `tal_channel` attribute (`direct`, `msp`, `partner`) on the AEP account profile routes the sequence to the appropriate SDR or AE owner and may select a different sequence variant configured at onboarding. `direct` accounts follow the standard sequence paths specified below. `msp` and `partner` accounts may be routed to channel-specific sequences or to partner-aware SDR teams. Sequence-level configuration for `msp` and `partner` routing is specified in Document 8 (Operational Runbook).

**Per-cohort Outreach activation:**

**`education` cohort.** No Outreach activation. The education cohort contains accounts with no identified contacts at sufficient confidence. There is no sequence trigger for a contact with `fallback_level` = 4 or 5 and no behavioral signal history. SDR teams should not expect sequence triggers for education-cohort accounts.

**`acquisition` cohort.** SDR-owned sequences. Convergence point alert: `problem_validation` and `requirements_framing` alerts are active for this cohort — a contact at a `prioritized` account with MEDIUM+ Champion or Economic Buyer confidence approaching a Problem Validation or Requirements Framing convergence point triggers an SDR alert payload. The payload carries `bg_stage`, the approaching convergence point, `roles_active` (list of MEDIUM+ classified contacts), and the recommended next action [data model §SA]. `tal_marquee` = `true` accounts receive elevated SDR priority. `tal_open_pipeline` = `true` accounts (with `sfdc_opportunity_created` = `false`) trigger SDR sequence activation; accounts with `sfdc_opportunity_created` = `true` have transitioned to `qualified` and are governed by AE-owned sequences [Section 2.3 note].

**`progression_early_to_mature` cohort.** AE-owned sequences; SDR sequences de-escalated. Convergence point alerts active: `solution_validation`, `business_value_alignment`, and `risk_compliance_validation`. An AE alert fires when a contact at a `qualified` account with MEDIUM+ confidence shows behavioral patterns consistent with an approaching convergence point. SDR sequences that were active during `acquisition` are suppressed at cohort transition — the account moves from SDR-territory to AE-territory. The AE receives the convergence point alert with the current `bg_stage`, the approaching convergence point, the `roles_active` list, and the recommended action from the alert payload.

**`progression_win_now` cohort — PENDING.** AE-orchestrated high-touch sequences are not active until the Kafka `sfdc_opportunity_stage` pipeline is confirmed [Section 2.4 PENDING]. Accounts that should be in `progression_win_now` receive `progression_early_to_mature` Outreach sequences until confirmation. At confirmation, AEP will reassign these accounts to the `progression_win_now` cohort and the `final_commitment` and `risk_compliance_validation` convergence point alerts will activate at the elevated priority level appropriate for Stage 5–7 opportunities. Note: `risk_compliance_validation` is also active for `progression_early_to_mature` accounts — it appears in both progression cohorts. At `progression_win_now` it fires with elevated urgency given the advanced deal stage and the high loop-back severity of a late Ratifier block.

---

### 6.5 Cohort-to-Channel Activation Summary

| Cohort (Priority) | Adobe Target | Marketo | Outreach |
|---|---|---|---|
| **`progression_win_now` (1)** | **PENDING** — activity not active until Kafka pipeline confirmed; `progression_early_to_mature` activity serves in interim | **PENDING** — program not active; contacts enrolled in `progression_early_to_mature` program in interim | **PENDING** — AE high-touch sequences not active; `progression_early_to_mature` AE sequences serve in interim. Gate when active: MEDIUM+ `confidence_tier`, `differential_insufficient` = `False`. Latency: [PENDING routing] |
| **`progression_early_to_mature` (2)** | **Active.** Gate: AEP segment membership (`qualified`, Stage 2–4, `sfdc_opportunity_stage_stale` = `false`). Reads: `fallback_level`, `role_classification`, `differential_insufficient`. Latency: next session start | **Active.** Gate: AEP segment membership + resolved `contact_id`. Reads: `role_classification`, `confidence_tier`. Program transition automated via AEP segment exit/entry. Latency: near-real-time for entry/exit [PENDING batch cadence] | **Active.** Gate: MEDIUM+ `confidence_tier`, `differential_insufficient` = `False`. AE-owned sequences; SDR de-escalated. Convergence points: `solution_validation`, `business_value_alignment`, `risk_compliance_validation`. Latency: [PENDING routing] |
| **`acquisition` (3)** | **Active.** Gate: AEP segment membership (`engaged` or `prioritized`, `sfdc_opportunity_created` = `false`). Reads: `fallback_level`, `role_classification`, `bg_stage`, `differential_insufficient`. Latency: next session start | **Active** (when `contact_id` resolved). Gate: AEP segment membership + resolved `contact_id`. Reads: `role_classification`, `confidence_tier`, `bg_stage`. No enrollment for unidentified contacts. Latency: near-real-time for entry/exit [PENDING batch cadence] | **Active** (`prioritized` accounts only). Gate: MEDIUM+ `confidence_tier`, `differential_insufficient` = `False`, `tal_open_pipeline` = `true` OR `tal_marquee` = `true`. SDR-owned. Convergence points: `problem_validation`, `requirements_framing`. Latency: [PENDING routing] |
| **`education` (4)** | **Active.** Gate: AEP segment membership (`targeted`, no engagement events). Reads: account-plane only — `tal_solution_interest_flags`, firmographics. Most visitors receive Level 4; no contact-level depth decisions until identification. Latency: next session start | **Suppressed.** No education Marketo program. First contact identified at this account enrolls in `acquisition` program when account transitions to `engaged`. | **Suppressed.** No Outreach activation. No contacts at sufficient confidence for sequence trigger. |

---

### Data Model Update Note

No new AEP attributes are introduced in Section 7. All attributes referenced — `bg_cohort`, `bg_stage`, `tal_channel`, `tal_marquee`, `tal_open_pipeline`, `sfdc_opportunity_created`, `sfdc_opportunity_stage`, `sfdc_opportunity_stage_stale`, `role_classification`, `confidence_tier`, `differential_insufficient`, `fallback_level`, `tal_solution_interest_flags` — are defined in prior sections and flagged for `CLIENT_ATTRIBUTE_MAP` (§CA) addition in their originating sections.

Three Document 8 items remain open from this section:

1. [PENDING: Document 8 owner to confirm Kafka pipeline feasibility for `sfdc_opportunity_stage` and trigger activation of `progression_win_now` Target activity, Marketo program, and Outreach AE sequences.]
2. [PENDING: Document 8 owner to confirm AEP → Marketo connector configuration for automated program exit/entry on `bg_cohort` transition and specify the batch sync cadence for non-event-driven attribute updates.]
3. [PENDING: Document 8 owner to confirm AEP → Salesforce → Outreach routing implementation for convergence point alert delivery, including the data path (Real-Time CDP connector, Kafka outbound, or Salesforce workflow) and expected alert-to-sequence-trigger latency.]

---

## Section 8: Geographic Segmentation

---

### 7.1 Geography as Localization, Not Segmentation

Geography is a content localization attribute and campaign routing dimension in this program — it is not a segmentation dimension that creates additional AEP audience definitions. The four campaign cohorts defined in Section 2 are global: every `active_prospect` TAL account in every region is evaluated against the same cohort entry conditions and assigned to the same four cohort segments. The `tal_region` attribute (AMS / EMEA / APJ) is applied within those existing audiences to route accounts to the appropriate regional campaign manager and to select region-specific content variants where they exist. This design is deliberate. Creating separate AEP audience segments per region — twelve segments instead of four — would introduce audience maintenance overhead, increase the risk of inconsistent cohort definitions drifting across regional variants, and complicate measurement by fragmenting the unified cohort baselines that Document 7 (Measurement and Experimentation Framework) depends on. Geography localizes; it does not segment.

---

### 7.2 The `tal_region` Attribute and Regional Treatment

`tal_region` is set on the AEP account profile by RevOps, sourced from Salesforce CRM, and reflects the account's commercial region — the region that owns the customer relationship and campaign activation decisions for that account. It is not inferred from visitor IP address and is not updated by the program at runtime.

| Region | Campaign Manager Routing | Content Localization at v1 Launch | Consent Constraints | Material Treatment Differences |
|---|---|---|---|---|
| **AMS** (Americas) | AMS demand gen team owns campaign activation decisions. SDR and AE sequence assignments follow AMS territory mapping configured in Outreach at onboarding. | English-language content only at v1. US customer references and case studies prioritized. | CCPA applies to California-resident visitors regardless of `tal_region` value — see Section 7.3. No additional regional consent constraint above the global program baseline. | No regional suppression rules. Full cohort activation applies. |
| **EMEA** (Europe, Middle East, Africa) | EMEA demand gen team owns campaign activation decisions. EMEA accounts in `tal_marquee` = `true` receive elevated priority routing to EMEA field marketing. | EMEA-localized content variants required for high-traffic solution pages and key campaign assets where they exist. UK and EU customer references prioritized for EMEA accounts. Localization depth beyond English-language EMEA variants is a v2 content roadmap item. | GDPR applies to visitors whose IP address resolves to an EU, UK, or EEA jurisdiction — see Section 7.3. This is independent of `tal_region = EMEA`; not all EMEA accounts have EU/UK/EEA visitor IP addresses, and some non-EMEA accounts do. | `explicit_consent_required` signals (including `demandbase_firmographic_match`) are suppressed for visitors in EU/UK/EEA IP jurisdictions per Document 2, Section 10.4 — regardless of account `tal_region`. |
| **APJ** (Asia-Pacific and Japan) | APJ demand gen team owns campaign activation decisions. APJ accounts in `progression_early_to_mature` and `progression_win_now` cohorts are routed to APJ field marketing for AE-coordinated sequence activation. | APJ-specific customer references and regional case studies prioritized where inventory exists. At v1, APJ content localization is limited to customer reference selection; translated or locally adapted assets are a v2 roadmap item. | No GDPR or CCPA regional constraint for most APJ jurisdictions at v1 launch. Japan's Act on the Protection of Personal Information (APPI) and other APJ privacy regulations are in scope for Document 9 (Privacy and Consent Architecture) review; no APJ-specific signal suppression rules are implemented at v1 beyond the global consent baseline. | APJ session time zones require time-zone-aware email scheduling in Marketo. APJ accounts receive email sends scheduled to APJ business hours, not AMS or EMEA business hours. |

---

### 7.3 The GDPR Jurisdiction Gap

Two attributes govern geographic treatment in this program. They are distinct, measure different things, and must not be used interchangeably.

`tal_region` is an account-level commercial attribute. It reflects where RevOps has assigned the account for campaign management purposes — the region that owns the customer relationship. A US-headquartered enterprise account with a London office has `tal_region = AMS` because the AMS team owns that account commercially. A visitor from that account browsing kalder.com from the London office carries `tal_region = AMS` for all campaign routing and content localization decisions.

GDPR consent scope is a visitor-level, session-level determination. It is based on the visitor's detected IP address at the time of the session — not on the account's `tal_region`. The same London-office visitor whose account carries `tal_region = AMS` is browsing from an IP address that resolves to a UK jurisdiction. That visitor receives GDPR-scoped consent handling: `explicit_consent_required` signals are suppressed, `functional_only` is applied as the default consent state if `visitor_consent_state` has not been explicitly set, and the 19 first-party behavioral signals classified as `legitimate_interest` may be collected under the Track 1 LIA [Document 2, Section 10.4]. The account's `tal_region = AMS` value has no bearing on this determination.

The program applies GDPR consent rules to any visitor whose detected IP address resolves to an EU, UK, or EEA jurisdiction. This applies regardless of the account's `tal_region` value and regardless of whether the account is commercially managed by the EMEA team. The mechanism for IP-based jurisdiction detection is the consent management platform — not Demandbase reverse-IP, which is an account identification function, not a jurisdiction detection function. Similarly, CCPA applies to California-resident visitors based on IP jurisdiction, not on `tal_region = AMS` or any other account-plane attribute.

The full GDPR and CCPA consent implementation — including the consent management platform configuration, the LIA documentation process, signal suppression mechanics, and deletion cascade — is governed by Document 9 (Privacy and Consent Architecture). Section 7's obligation is to establish the distinction between `tal_region` and IP-based jurisdiction scoping and to confirm that the program does not use `tal_region` as a proxy for GDPR applicability.

---

### 7.4 `tal_region` as a Content Selection Input

Adobe Target reads `tal_region` from the AEP account profile as an input to content node selection within the existing cohort-level Target activities. It does not create new Target activities per region. A `progression_early_to_mature` account with `tal_region = EMEA` activates the same `progression_early_to_mature` Target activity as an AMS account in the same cohort — `tal_region` determines which content variant within that activity is served, specifically for content nodes that have region-specific versions (EMEA customer case studies, APJ customer references, regionally relevant social proof). Where no region-specific variant exists for a content node, the global default content is served. Target content variant selection by region is a selection parameter, not an audience gate.

Marketo reads `tal_region` for two purposes: campaign routing to the regional campaign manager who owns the account, and time-zone-aware email scheduling. Regional routing is a workflow configuration within the existing cohort Marketo programs — it determines which campaign manager's queue receives the account notification and which send-time rule applies to email scheduling. No new Marketo programs are created per region. An account moving from `acquisition` to `progression_early_to_mature` transitions between Marketo programs (as specified in Section 6.3) regardless of its `tal_region`; the regional routing configuration within each program handles the rest.

---

## Section 9: Exclusion and Suppression Logic

---

### 8.1 Suppression Architecture — Three Levels

This section consolidates every suppression rule in the program into a single authoritative reference. Three levels of suppression operate in this program, and they are categorically different in nature, ownership, and testability.

**Account-level program suppression** governs which accounts receive program activity based on their CRM-sourced status attributes. It is an operational quality control mechanism: it prevents the program from scoring, classifying, or activating acquisition personalization for accounts that should not receive it (post-sale customers, non-TAL accounts, acquisition-ineligible accounts). Owned by Marketing Ops and RevOps.

**Page-level and surface-level suppression** governs which pages on kalder.com contribute signals to the scoring pipeline and which pages may receive personalization above Level 5. It prevents non-commercial page types (careers, investor relations, legal) from becoming scoring surfaces and prevents post-sale behavioral patterns on support surfaces from contaminating pre-purchase classification scores. Owned by Marketing Ops and Web Analytics.

**Consent-based suppression** governs signal collection and scoring for visitors who have declined consent. This is a legal compliance mechanism, not an operational quality control mechanism. It is fully specified in Document 9 (Privacy and Consent Architecture) and cross-referenced in Section 1.6, Rule 5. Consent-based suppression is not part of the program suppression architecture specified in this section — it operates independently of account status and page type, and its implementation is governed by the consent management platform specified in Document 9.

---

### 8.2 Account-Level Program Suppression

The following table consolidates all account-level suppression rules established in prior sections. The AEP implementation mechanism column specifies how each rule is enforced in the data layer.

| Suppression Condition | Accounts Affected | Treatment | AEP Implementation Mechanism | Override Available? |
|---|---|---|---|---|
| `tal_program_status` = `post_sale` | CRM account type: `customer`, `customer_via_partner`, `customer_subsidiary` (excluding trial/POC exception) | Pre-purchase behavioral scoring suppressed; acquisition personalization suppressed; account receives Level 4 (TAL-identified, no acquisition personalization) | **AEP segment exclusion** — `post_sale` accounts are excluded from all acquisition audience segment definitions at the segment evaluation layer; contacts at these accounts do not appear in acquisition Target, Marketo, or SDR Outreach audiences | Yes — `tal_upsell_override_active` = `true` activates a separate upsell personalization audience; acquisition pipeline remains suppressed |
| `tal_program_status` = `out_of_program` | Accounts removed from the TAL (`tal_member` = `false`) | All program activity suppressed; no scoring; no cohort assignment; no channel activation; Level 5 only | **Profile attribute flag** — `tal_member` = `false` prevents audience segment membership; no AEP segment evaluates to true for an out-of-program account | No |
| `tal_member` = `false` (non-TAL visitor) | All visitors whose IP does not resolve to a TAL account domain | Level 5 only; no behavioral scoring; no cohort assignment; no channel activation | **Profile attribute flag** — `tal_member` = `false` is the entry gate for all program logic; its absence prevents all downstream segment evaluation | No |
| `tal_new_logo_eligible` = `false` | TAL accounts that are not eligible for new-logo acquisition programs | Account passes TAL filter and cohort assignment but is excluded from acquisition channel activation (Marketo nurture enrollment, SDR Outreach sequences) | **Activation-layer rule** — account-plane cohort assignment proceeds normally, but the channel activation rules in Adobe Target, Marketo, and Outreach include an explicit check for `tal_new_logo_eligible` = `true` before firing acquisition-mode activation (This is a channel-level filter, not an AEP segment condition — do not add `tal_new_logo_eligible` to the Section 2.3 AEP segment attribute definitions.) | No override specified at v1 |
| Trial/POC exception (active POC or trial Salesforce opportunity stage on a `customer`-type account) | Accounts whose CRM type would place them in `post_sale` but who have an active POC or trial opportunity stage in Salesforce | Receive `active_prospect` treatment — full program activation; pre-purchase scoring applies; acquisition personalization active | **Computed attribute override** — the Kafka pipeline evaluates the Salesforce opportunity stage field and writes `tal_program_status` = `active_prospect` to the AEP account profile, overriding the CRM account type-derived `post_sale` status; account type alone is insufficient to determine treatment [Section 1.3] | n/a — exception is itself the override |

---

### 8.3 Page-Level and Surface-Level Suppression

All page-level suppressions apply to all visitors regardless of identity or TAL status. A HIGH-confidence Champion navigating to a careers page receives Level 5 on that page. The visitor's classification state is not affected — it was set at session start and remains unchanged. What changes is the experience served and, for scoring surfaces, whether the session's engagement observations contribute to the scoring pipeline.

**Careers pages.** No personalization above Level 5. No signal collection. No scoring update from engagement on these pages.
Implementation: Segment event filter configured at the careers page URL path — engagement events from these pages are tagged with the careers surface designation and filtered from the scoring engine input. Adobe Target excludes these pages from all personalization activities via URL-pattern exclusion rules. Applies to all visitors regardless of identity or TAL status.

**Investor relations (IR) pages.** Same rule as careers pages — no personalization above Level 5, no signal collection, no scoring update.
Implementation: Segment event filter on IR page URL path; Adobe Target URL-pattern exclusion. Applies to all visitors.

**Press and media pages.** Same rule — no personalization above Level 5, no signal collection, no scoring update.
Implementation: Segment event filter on press/media URL path; Adobe Target URL-pattern exclusion. Applies to all visitors.

**Legal and privacy pages.** Same rule — no personalization above Level 5, no signal collection, no scoring update.
Implementation: Segment event filter on legal/privacy URL path; Adobe Target URL-pattern exclusion. Applies to all visitors.

**Community and support forum surfaces.** This suppression is different in kind from the four above. The rule is not "no personalization" — it is "no acquisition scoring contribution." A visitor navigating a community or support forum page receives their current personalization level, which was determined at session start from their existing profile state. What is suppressed is the contribution of that page's engagement to the visitor's role confidence score. Community forum and knowledge base surfaces carry `exclusion_flag: suppress_acquisition_scoring` in `WEBSITE_SURFACES` (§20 WEBSITE_SURFACES) [Document 2, Section 4.3]. The `get_signal_suppression_surfaces()` function returns these surfaces, and the scoring engine applies the exclusion before forwarding signal observations to the classification pipeline.
Implementation: the pre-scoring pipeline filter applied by the scoring engine reads the `exclusion_flag` on the originating surface for each signal observation. Observations from `community_forum_surface`, `knowledge_base_surface`, and related support surfaces with `exclusion_flag: suppress_acquisition_scoring` are filtered before the scoring engine processes them. This is not a Segment event filter — the events are collected and the behavioral record is retained; the suppression occurs at the pre-scoring filter layer. Applies to all visitors; a pre-sale visitor browsing the community forum generates a behavioral record but no scoring contribution from those pages.

---

### 8.4 Suppression Governance and Testability

**Governance.** The account-level program suppression list is owned by Marketing Ops, with RevOps holding authority over account status decisions (`tal_program_status`, `tal_new_logo_eligible`). Changes to account-level suppression logic — adding new suppression conditions, modifying override rules — require a documented change request approved by both Marketing Ops and RevOps before deployment. The page-level and surface-level suppression list is owned by Marketing Ops in coordination with the Web Analytics team. When new pages are added to kalder.com that belong to a suppressed category (careers, IR, press, legal), the Web Analytics team is responsible for ensuring the new URL paths are added to the Segment filter configuration and the Adobe Target exclusion rules before the pages go live. A validation cycle must be completed before any suppressed page launches in production.

**Testability.** For each suppression type, the following validation procedures specify how the team confirms the rule is working:

*Account-level suppression — post_sale:* Query AEP audience segment membership for a designated `post_sale` test account. The account must not appear in any acquisition audience segment (education, acquisition, progression cohorts). Run this validation on every AEP audience publish cycle. If the `post_sale` test account appears in any acquisition segment, the segment exclusion logic has failed and must be investigated before the next campaign activation.

*Account-level suppression — non-TAL / out_of_program:* Confirm that the test account with `tal_member` = `false` returns no segment membership records in AEP. This is a negative assertion — no audience membership should exist for the test account at all.

*Account-level suppression — tal_new_logo_eligible = false:* Confirm that a test account with `tal_new_logo_eligible` = `false` does not receive Marketo nurture enrollment or Outreach SDR sequence triggers, even if its `bg_cohort` = `acquisition`. The activation-layer rule must fire correctly at the channel level, not at the AEP segment level — the account may appear in the AEP acquisition segment but must be excluded from the activation step.

*Trial/POC exception — computed attribute override:* Confirm that a test account with CRM account type `customer` and an active POC opportunity stage in Salesforce carries `tal_program_status` = `active_prospect` in the AEP account profile, not `post_sale`. The Kafka pipeline override must be validated after every CRM sync cycle that touches the test account record.

*Page-level suppression — careers, IR, press, legal:* Validate using a Segment debugger session: a TAL-matched test visitor with a resolved `contact_id` navigates to a careers page. The Segment debugger must show zero scoring events forwarded to the scoring engine from that page navigation. Adobe Target must not activate any personalization activity on that page — the visitor receives the Level 5 default experience. Run this validation whenever a new URL path is added to the careers, IR, press, or legal suppression list.

*Community/support surface signal suppression:* Validate by running a test scoring session: a test contact who visits only community forum pages in a session should show zero change to their `role_confidence_score` and `confidence_tier` after the session completes. The behavioral record in Segment should show the community forum engagement events, confirming they were collected. The AEP contact profile should show no scoring delta, confirming the pre-scoring filter applied the `exclusion_flag` correctly before observations reached the scoring engine.

---

### 8.5 Suppression Interaction with Promotion Events

Suppression rules interact with the promotion mechanics specified in Section 6 at one edge case worth stating explicitly. If a visitor is mid-session on a promotion path — for example, a contact is in the middle of a Path B (Layer 1 → Layer 3) promotion triggered by a form fill — and the Kafka pipeline simultaneously delivers a `tal_program_status` change (e.g., the account has just been marked `post_sale` due to a contract close during the session), the session-level suppression lock applies. Per Section 1.7, session-level account status is locked at session start; re-evaluation occurs at the next session start. The promotion event that occurred mid-session is processed, but the suppression rule does not activate until the next session. This behavior is consistent with the cascade level stability rule established in Document 1 — session-level state does not change mid-session regardless of what arrives via pipeline during that session. The next session start evaluates the current AEP profile state and applies the `post_sale` suppression at that point.
---

## Cross-Reference Table

| Document | Relationship | Specific Dependency |
|---|---|---|
| `kalder_data_model.py` | Document 3 depends on this | `§5 COVERAGE_STATUS` (coverage status per solution category governing channel activation depth), `§6 SEGMENT_DEFINITIONS` (AEP audience segment specifications), `§14 CHANNEL_ACTIVATION_MAP` (segment-to-channel activation rules), `§CA CLIENT_ATTRIBUTE_MAP` (TAL account and contact attribute registry — `tal_member`, `tal_program_status`, `bg_cohort`, `bg_stage`, `confidence_tier`, `role_classification`, and all attributes registered via §CA flags in Sections 2–9) |
| Document 1 — Buying Group Role Architecture | Document 3 depends on this | Role definitions and confidence tier activation gates that determine which contacts qualify for each segment tier and which channels activate at each level |
| Document 2 — Signal Definition and Confidence Model | Document 3 depends on this | Seven-step scoring sequence, confidence tier outputs, and identification layer definitions (`tal_member`, Layer 1/2/3 architecture) that govern segment entry conditions and promotion path mechanics |
| Document 4 — Content Model and Taxonomy | Depends on Document 3 | Campaign cohort definitions (Section 3) and `tal_new_logo_eligible` suppression flag that govern channel-level content distribution scope |
| Document 5 — Personalization Decisioning Rules | Depends on Document 3 | TAL membership criteria, Demandbase Layer 1 identification, AEP audience gates, and firmographic plane attributes that activate Adobe Target activities and govern the firmographic-first path |
| Document 6 — Buying Group Journey and Convergence Model | Depends on Document 3 | Stage-to-cohort mapping (Section 3) and convergence point proximity signals that inform cohort assignment logic and channel activation thresholds |
| Document 7 — Measurement and Experimentation Framework | Depends on Document 3 | Segment definitions and cohort architecture that define measurement dimensions, holdback group structure, and segment-level analysis breakdowns for lift calculation |
| Document 8 — Operational Runbook | Depends on Document 3 | TAL data contract (Section 2), suppression governance rules (Section 9), and `CLIENT_ATTRIBUTE_MAP` entries that Document 8 implements operationally via list hygiene and DSR execution procedures |
| Document 9 — Privacy and Consent Architecture | Document 3 depends on this | Legal basis for cross-session behavioral inference, consent-state gating on signal collection, and geographic suppression legal framework that governs the rules specified in Section 8 |
