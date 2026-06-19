# Kalder Onboarding Workflow — Canonical 18-Step Specification

**Document type:** Implementation specification — Guided Workflow step definitions  
**Authority:** L2-D locked decisions; `kalder_data_model.py §CA`; Document 8 Section 11  
**Data model version:** v0.2.0  
**Status:** Canonical — use this file to populate `onboarding_18step.json`

---

## Governing Rules (carry forward from L2-D)

- **HOLD** = integrity interrupt. Step is non-advanceable until resolved. H-01 through H-06.
- **FLAG** = advisory interrupt. Step is advanceable after practitioner acknowledgment. F-01 through F-06.
- HOLD cards render above FLAG cards always.
- FLAG acknowledgment is available only after all HOLDs on the current step are resolved.
- Every FLAG must cite a corpus authority. A FLAG without a citation is a design defect.
- HOLD resolution must be explicitly confirmed by the Advisor. Silent advancement is prohibited.
- "Why This Matters" is drawn from `§CA null_behavior` for the attribute governed by that step, written in first-person operational terms.

---

## FLAG Code Reference

| Code | Type | Trigger condition |
|---|---|---|
| F-01 | Advisory | Practitioner is deviating from a corpus default |
| F-02 | Advisory | Optional attribute is null and its absence degrades program scope |
| F-03 | Advisory | Practitioner has explicitly deferred a step |
| F-04 | Advisory | Consent classification gap — non-blocking; produces persistent Configuration Gap Record |
| F-05 | Advisory | Downstream dependency unconfirmed |
| F-06 | Advisory | Advisor-derivable value overridden by practitioner |

## HOLD Code Reference

| Code | Type | Trigger condition |
|---|---|---|
| H-01 | Integrity | Blocking `onboarding_required: True` attribute missing or incompletely mapped |
| H-02 | Integrity | Value entered is outside `allowed_values` for the attribute |
| H-03 | Integrity | Consent gate blocking activation scope (Track 2 claimed complete without DPA confirmation) |
| H-04 | Integrity | Prerequisite step incomplete |
| H-05 | Integrity | Blocking client data input absent |
| H-06 | Integrity | Data model version mismatch detected |

---

## Six-Phase Structure

| Phase | Steps | Focus |
|---|---|---|
| Phase 1 — Account Identification Foundation | 1–3 | Core TAL membership and account identity attributes |
| Phase 2 — Account Segmentation Configuration | 4–7 | Program status, region, channel, pipeline attributes |
| Phase 3 — Contact Routing Configuration | 8–10 | Contact-plane and opportunity stage routing |
| Phase 4 — Consent Architecture Configuration | 11–13 | Consent state, signal classification, Track 2 status |
| Phase 5 — Sales Activation Configuration | 14–16 | Salesforce custom fields, Outreach sequences, alert delivery |
| Phase 6 — Structural Checks | 17–18 | AEP connector confirmation, data model version validation |

---

## Step Definitions

---

### PHASE 1 — Account Identification Foundation

---

#### Step 1 — `tal_domain`
**Corpus authority:** `§CA CLIENT_ATTRIBUTE_MAP` → `tal_domain`; Document 3 Section 1.2  
**Input required:** Client provides the account domain string (e.g., `synthco.com`)  
**Validation rule:** Must be a non-empty string; must match the domain used in Salesforce CRM account records; Demandbase reverse-IP matching depends on this value  
**Why this matters:** "If `tal_domain` is missing, Demandbase reverse-IP matching cannot execute for this account. Anonymous visitors browsing from this account's office will not be identified as TAL members and will route to Level 5 default experience until the domain is populated. Every Level 4 and above experience for anonymous visitors at this account depends on this field."

**HOLD trigger:** H-01 — fires if `tal_domain` is null or empty at step submission. Resolution: practitioner enters the domain string and confirms. `onboarding_required: True` — cannot advance without this value.  
**FLAG trigger:** None at this step.  
**Deferral consequence:** If deferred — anonymous visitor identification via Demandbase reverse-IP is suppressed for this account. No personalization above Level 5 activates for anonymous visitors.

---

#### Step 2 — `tal_member`
**Corpus authority:** `§CA CLIENT_ATTRIBUTE_MAP` → `tal_member`; Document 3 Section 1.1  
**Input required:** Confirmation that the account is confirmed in the TAL (`true`)  
**Validation rule:** Must be `true` or `false`; only `true` accounts proceed through onboarding; `false` value triggers advisory prompt  
**Why this matters:** "If `tal_member` is false or absent, this account receives no personalization above Level 5. TAL membership is the primary gate for all program activity — every scoring, classification, and content selection decision downstream depends on this flag being true."

**HOLD trigger:** H-01 — fires if value is null. H-02 — fires if value is outside `[true, false]`.  
**FLAG trigger:** F-01 — fires if practitioner sets `tal_member: false` (deviates from the expected state for an account being onboarded; Advisor prompts confirmation that onboarding should proceed for a non-TAL account).  
**Deferral consequence:** Cannot be deferred. `tal_member` is a Category A blocking input. If false, onboarding should not proceed.

---

#### Step 3 — `tal_account_type_source` (mapping-table validation)
**Corpus authority:** `§CA CLIENT_ATTRIBUTE_MAP` → `tal_account_type_source`; Document 8 Section 11.2 Item 4  
**Input required:** Client provides the Salesforce account type field value; practitioner selects the mapping to canonical enum  
**Validation rule:** Mapping-table validation required. Input must resolve to one of: `suspect / prospect / customer / customer_via_partner / customer_subsidiary`. Free-text entry not accepted — practitioner selects from mapping table.  
**Why this matters:** "If `tal_account_type_source` is null, `tal_program_status` computation cannot execute. The account remains unclassified and receives no personalization above Level 5. This field is the upstream Salesforce type that tells the program whether this account is a prospect, an existing customer, or a partner-referred account — which determines which personalization treatment applies."

**HOLD trigger:** H-01 — fires if null. H-02 — fires if the entered value does not resolve through the mapping table to a valid canonical enum value.  
**FLAG trigger:** F-06 — fires if practitioner overrides the Advisor-suggested mapping with a different canonical value (Advisor derives suggested mapping from Salesforce field; override is logged).  
**Deferral consequence:** If deferred — `tal_program_status` computation is blocked. Account receives no personalization above Level 5 until resolved.

---

### PHASE 2 — Account Segmentation Configuration

---

#### Step 4 — `tal_program_status` (mapping-table validation)
**Corpus authority:** `§CA CLIENT_ATTRIBUTE_MAP` → `tal_program_status`; Document 3 Section 1.2  
**Input required:** Confirm the account's current program status; select from mapping table  
**Validation rule:** Mapping-table validation required. Must resolve to: `active_prospect / post_sale / out_of_program`. Only `active_prospect` accounts proceed to full personalization. `post_sale` accounts receive upsell treatment path. `out_of_program` accounts receive no personalization.  
**Why this matters:** "If `tal_program_status` is null, this account is treated as out-of-program. No personalization above Level 5 activates. The program status determines the entire treatment path — acquisition personalization, upsell personalization, or suppression."

**HOLD trigger:** H-01 — fires if null. H-02 — fires if value does not resolve through mapping table to a valid canonical enum.  
**FLAG trigger:** F-01 — fires if practitioner sets `post_sale` (program behavior shifts to upsell path; Advisor describes scope change). F-01 — fires if practitioner sets `out_of_program` (personalization is fully suppressed; Advisor confirms intent).  
**Deferral consequence:** Cannot be meaningfully deferred — program status is required for all downstream routing.

---

#### Step 5 — `tal_region`
**Corpus authority:** `§CA CLIENT_ATTRIBUTE_MAP` → `tal_region`; Document 3 Section 7; Document 8 Section 11.2 Item 4  
**Input required:** Client provides the complete region value enumeration from their Salesforce account schema; practitioner confirms at least one value is supplied  
**Validation rule:** Structural validation only — at least one value must be supplied. Content validation is not performed (client region names are client-specific). Value is stored as provided.  
**Why this matters:** "If `tal_region` is null, regional campaign assignment is skipped for this account. The visitor receives non-regional content — they may receive content campaigns designed for a different market. For accounts in EMEA or APAC, this may also affect consent behavior if regional consent rules differ."

**HOLD trigger:** H-01 — fires if no region value is supplied (structural validation: at least one value required).  
**FLAG trigger:** F-04 — fires if `tal_region` value appears to be in a GDPR jurisdiction (EU/UK/EEA country names detected); Advisor notes that GDPR jurisdiction is determined by visitor IP address at runtime, not by `tal_region` — this is informational, not a blocking condition.  
**Deferral consequence:** If deferred — regional campaign assignment is suppressed. Visitor receives non-regional content. Scope reduction is moderate.

---

#### Step 6 — `tal_marquee`
**Corpus authority:** `§CA CLIENT_ATTRIBUTE_MAP` → `tal_marquee`  
**Input required:** Confirm whether this account is a marquee (priority tier) account (`true / false`)  
**Validation rule:** Must be `true` or `false`  
**Why this matters:** "If `tal_marquee` is null, it is treated as false and standard content inventory allocation applies. Marquee accounts receive priority content commissioning and elevated personalization investment. If this account qualifies for marquee status and the flag is missing, it will receive standard treatment until corrected."

**HOLD trigger:** H-02 — fires if value is outside `[true, false]`.  
**FLAG trigger:** F-02 — fires if practitioner sets `false` for an account that Advisor identifies as likely marquee-eligible based on account size or TAL tier indicators. Consequence: standard content inventory allocation applies; marquee content investment is not triggered.  
**Deferral consequence:** If deferred — treated as false. Standard allocation applies.

---

#### Step 7 — `tal_channel`
**Corpus authority:** `§CA CLIENT_ATTRIBUTE_MAP` → `tal_channel`; Document 8 Section 6.9  
**Input required:** Client confirms the channel designation for this account; practitioner selects from `direct / msp / partner`  
**Validation rule:** Must be one of `direct / msp / partner`. Client confirms which Salesforce field holds the channel designation.  
**Why this matters:** "If `tal_channel` is null, channel routing falls back to `direct`. An MSP or partner account with no channel value will receive the direct-channel Outreach sequence — which may be inappropriate for the channel relationship. Sales activation alerts will route to the wrong team."

**HOLD trigger:** H-01 — fires if null. H-02 — fires if value is outside `[direct, msp, partner]`.  
**FLAG trigger:** F-05 — fires if `msp` or `partner` is selected but no channel-variant Outreach sequence has been confirmed configured. Consequence: sales activation will fall back to `direct` routing until channel-variant sequences are configured.  
**Deferral consequence:** If deferred — `direct` routing applies to all sales activation alerts. MSP/partner channel routing is unavailable.

---

### PHASE 3 — Contact Routing Configuration

---

#### Step 8 — `tal_new_logo_eligible`
**Corpus authority:** `§CA CLIENT_ATTRIBUTE_MAP` → `tal_new_logo_eligible`  
**Input required:** Confirm whether this account is eligible for acquisition (new logo) personalization (`true / false`)  
**Validation rule:** Must be `true` or `false`  
**Why this matters:** "If `tal_new_logo_eligible` is null, it is treated as false. Acquisition personalization is suppressed — the account receives standard non-acquisition experience even if it is an active prospect. For accounts where acquisition is the program goal, this field must be true."

**HOLD trigger:** H-02 — fires if value is outside `[true, false]`.  
**FLAG trigger:** F-02 — fires if practitioner sets `false` for a `tal_program_status: active_prospect` account. Consequence: acquisition personalization suppressed; account receives standard (non-acquisition) experience.  
**Deferral consequence:** If deferred — treated as false. Acquisition personalization suppressed.

---

#### Step 9 — `tal_open_pipeline`
**Corpus authority:** `§CA CLIENT_ATTRIBUTE_MAP` → `tal_open_pipeline`; Document 8 Section 6  
**Input required:** Confirm whether this account has open pipeline (`true / false`)  
**Validation rule:** Must be `true` or `false`  
**Why this matters:** "If `tal_open_pipeline` is null, it is treated as false. SDR activation eligibility is not extended to this account. If there is an active pipeline opportunity, this flag must be true for SDR-activation convergence point alerts to fire."

**HOLD trigger:** H-02 — fires if value is outside `[true, false]`.  
**FLAG trigger:** F-02 — fires if practitioner sets `false` for an account with `sfdc_opportunity_created: true`. Consequence: SDR activation eligibility inconsistency flagged; Advisor recommends reconciliation with Salesforce CRM state.  
**Deferral consequence:** If deferred — treated as false. SDR activation eligibility not extended.

---

#### Step 10 — `sfdc_opportunity_created` and `sfdc_opportunity_stage`
**Corpus authority:** `§CA CLIENT_ATTRIBUTE_MAP` → `sfdc_opportunity_created`, `sfdc_opportunity_stage`; Document 8 Section 8  
**Input required:** (a) Confirm whether a Salesforce opportunity exists for this account. (b) If yes, confirm the Salesforce StageName-to-integer mapping table for opportunity stage routing.  
**Validation rule:** `sfdc_opportunity_created` must be `true / false`. If `true`, the StageName mapping table must be provided — maps client's Salesforce stage names to the integer encoding `[5, 6, 7]` that governs `progression_win_now` cohort assignment. Mapping table validation required — at least one stage name must resolve to the integer range.  
**Why this matters:** "If `sfdc_opportunity_created` is null, the `qualified` stage assignment does not trigger. If the StageName mapping is missing or incomplete, all qualified accounts are treated as `progression_early_to_mature` — they never enter the `progression_win_now` cohort and never receive elevated-priority convergence point alerts. Late-stage deals receive the same alert priority as early-stage accounts."

**HOLD trigger:** H-01 — fires if `sfdc_opportunity_created: true` is set but the StageName mapping table is absent. H-05 — fires if practitioner indicates opportunity stage routing is required but cannot provide the mapping table.  
**FLAG trigger:** F-03 — fires if practitioner defers the StageName mapping. Consequence: `progression_win_now` cohort activation is blocked; all qualified accounts remain in `progression_early_to_mature` until mapping is provided.  
**Deferral consequence:** If deferred — `progression_win_now` cohort is inactive. Documented as S-07 in POC simplification register. Named gap written to Configuration Gap Record.

---

### PHASE 4 — Consent Architecture Configuration

---

#### Step 11 — `visitor_consent_state` default configuration
**Corpus authority:** `§CA CLIENT_ATTRIBUTE_MAP` → `visitor_consent_state`; Document 9; `§P SIGNAL_CONSENT_REQUIREMENTS`  
**Input required:** (a) Confirm the CMP (consent management platform) in use. (b) Confirm that the CMP delivers `visitor_consent_state` values to AEP before the visitor's second page load. (c) Confirm the default state for visitors who have not yet responded to the consent prompt.  
**Validation rule:** Default state must be `declined` — null or absent is never treated as `functional_only`. CMP delivery timing must be confirmed. Any claim that null is treated as `functional_only` triggers H-03.  
**Why this matters:** "If `visitor_consent_state` is null or absent, it is treated as `declined` — no signal collection, no scoring, Level 5 experience. This is not configurable. If the CMP does not deliver the consent state before the second page load, visitors who have consented will receive Level 5 treatment on their first session. CMP timing must be confirmed before go-live."

**HOLD trigger:** H-03 — fires if practitioner claims that null consent state is treated as `functional_only` (this is a consent architecture violation; non-advanceable until corrected). H-05 — fires if CMP identity cannot be confirmed.  
**FLAG trigger:** F-04 — fires if CMP delivery timing cannot be confirmed as pre-second-page-load. Consequence: first-session consent misclassification risk; persistent Configuration Gap Record created.  
**Deferral consequence:** Cannot be deferred. Consent architecture is a Category A blocking input for the program to operate lawfully.

---

#### Step 12 — Track 2 signal consent status
**Corpus authority:** Document 9 `§P SIGNAL_CONSENT_REQUIREMENTS`; Track 2 definition (Demandbase firmographic enrichment signal)  
**Input required:** (a) Declare Track 2 status: `complete` (DPA review done) or `pending` (DPA review in progress). (b) If `complete`, confirm DPA documentation is available.  
**Validation rule:** If `complete` is declared, DPA confirmation must be provided or referenced. Claiming `complete` without DPA confirmation triggers H-03. If `pending`, step advances with F-04 FLAG and Configuration Gap Record.  
**Why this matters:** "If Track 2 DPA review is pending, the firmographic bonus pathway is suppressed. Demandbase `firmographic_match` signal cannot contribute to role confidence scoring. Contacts who would have reached MEDIUM confidence via firmographic confirmation will remain at their Tier 3 behavioral score. This is the correct behavior — it is documented as POC Simplification S-03."

**HOLD trigger:** H-03 — fires if practitioner declares Track 2 `complete` but cannot confirm DPA documentation exists. Non-advanceable until DPA reference is provided or status is corrected to `pending`.  
**FLAG trigger:** F-04 — fires if Track 2 status is `pending`. This is non-blocking. Persistent Configuration Gap Record created: "Track 2 DPA review pending. Firmographic bonus pathway suppressed. Demandbase `firmographic_match` signal inactive." Consequence: firmographic bonus inactive until Track 2 complete.  
**Deferral consequence:** If entire step is deferred — treated as `pending`. Same consequence as F-04 FLAG above.

---

#### Step 13 — Signal activation scope confirmation
**Corpus authority:** `§P SIGNAL_CONSENT_REQUIREMENTS`; Document 2 Section 10; Document 9  
**Input required:** Confirm that all 20 behavioral signals in `CROSS_ROLE_WEIGHTS` are classified in `SIGNAL_CONSENT_REQUIREMENTS`. Advisor reads the classification from `§P` and surfaces any unclassified signals.  
**Validation rule:** All signals must have an explicit consent classification (`legitimate_interest` or `explicit_consent_required`). Unclassified signals default to `functional_only` treatment per `PENDING_CONSENT_CLASSIFICATION_DEFAULT` — this is a structural safeguard, not the practitioner's intended state. Any signal intended to operate under `legitimate_interest` must be explicitly classified.  
**Why this matters:** "Unclassified behavioral signals default to `functional_only` treatment. If a signal you intend to use for classification falls back to `functional_only`, it will not contribute to scoring for visitors who have given only functional consent. Your confidence tier distribution will be lower than expected."

**HOLD trigger:** None — unclassified signals produce a FLAG, not a HOLD. The `PENDING_CONSENT_CLASSIFICATION_DEFAULT` safeguard prevents an unclassified signal from being used without consent; the program continues safely.  
**FLAG trigger:** F-04 — fires for each signal that is unclassified or has classification status `pending`. Consequence per signal: that signal defaults to `functional_only`; scoring contribution reduced for non-full-consent visitors. Persistent Configuration Gap Record created per unclassified signal.  
**Deferral consequence:** If deferred — all signals default to `functional_only`. Scoring accuracy is reduced for visitors without full consent.

---

### PHASE 5 — Sales Activation Configuration

---

#### Step 14 — Salesforce custom field provisioning confirmation
**Corpus authority:** Document 8 Section 6.1; `§SA SALES_ACTIVATION_CONFIG`  
**Input required:** Confirm that the three custom fields per convergence point have been provisioned in Salesforce: `convergence_point`, `roles_active`, `recommended_action`. Confirm character limit on `recommended_action` field accommodates full canonical text without truncation.  
**Validation rule:** All three fields must be confirmed provisioned for each active convergence point. Character limit on `recommended_action` must be confirmed (canonical text requires minimum 280 characters for the longest convergence point). Truncation is a hard failure — it removes the specificity that makes the alert useful.  
**Why this matters:** "If Salesforce custom fields are not provisioned, the AEP → Salesforce connector cannot write alert data. Convergence point alerts will fail silently — the AEP pipeline will attempt the write, receive an error, and not retry. BDRs and AEs will not receive alerts. If `recommended_action` is truncated, the alert loses the specific guidance that distinguishes it from a generic notification."

**HOLD trigger:** H-05 — fires if practitioner cannot confirm that custom fields are provisioned. Non-advanceable until provisioning is confirmed or an explicit deferral is chosen.  
**FLAG trigger:** F-05 — fires if character limit on `recommended_action` has not been verified. Consequence: truncation risk; canonical alert text may be cut off in CRM display.  
**Deferral consequence:** If deferred — sales activation alerts cannot fire. AEP → Salesforce write will fail. Entire convergence point alert pathway is blocked. Named gap: "Salesforce custom field provisioning unconfirmed."

---

#### Step 15 — Outreach sequence configuration
**Corpus authority:** Document 8 Section 6.6; Document 3 Section 6.4  
**Input required:** (a) Confirm which Outreach sequence IDs are configured for each active convergence point. (b) Confirm channel-variant sequences are configured for `msp` and `partner` accounts if applicable. (c) Confirm two contact-level gates are implemented: Gate 1 (`confidence_tier: MEDIUM` or higher) and Gate 2 (`differential_insufficient: false`).  
**Validation rule:** At least one sequence ID must be confirmed per active convergence point. Gate 1 and Gate 2 must both be confirmed as configured in the Outreach/Salesforce integration before sales activation goes live.  
**Why this matters:** "If Outreach sequences are not configured, convergence point alerts will write to Salesforce but no sequence will activate. The BDR or AE receives no action prompt. If Gate 1 or Gate 2 is not implemented, LOW-confidence contacts or role-ambiguous contacts may receive sales outreach prematurely — which is a program quality failure and a trust risk with the prospect."

**HOLD trigger:** H-05 — fires if no sequence IDs can be confirmed for any active convergence point.  
**FLAG trigger:** F-05 — fires if channel-variant sequences for `msp` or `partner` accounts are not confirmed configured (when `tal_channel` is `msp` or `partner`). Consequence: channel routing falls back to `direct`. F-05 — fires if Gate 1 or Gate 2 configuration cannot be confirmed. Consequence: sequence activation gate may not enforce; over-activation risk.  
**Deferral consequence:** If deferred — sequences are stubs. Documented as S-05 in POC simplification register.

---

#### Step 16 — Alert delivery SLA confirmation
**Corpus authority:** Document 8 Section 6.1  
**Input required:** Confirm the AEP → Salesforce connector is configured and the 60-minute SLA ceiling is understood. Confirm Salesforce → Outreach integration latency is within SLA.  
**Validation rule:** AEP → Salesforce connector must be confirmed active (or deferred with explicit consequence). 60-minute SLA ceiling must be acknowledged.  
**Why this matters:** "If the AEP → Salesforce connector is not confirmed active, alert delivery cannot be validated. The 60-minute SLA ceiling governs the entire path from AEP convergence point trigger to Outreach sequence activation. Alerts that arrive after 60 minutes may miss the buying moment they were designed to capture."

**HOLD trigger:** H-05 — fires if AEP → Salesforce connector is not confirmed active and practitioner has not chosen explicit deferral.  
**FLAG trigger:** F-03 — fires if practitioner defers connector confirmation. Consequence: sales activation pathway unvalidated; entire alert delivery chain is a stub until confirmed.  
**Deferral consequence:** If deferred — sales activation pathway is unconfirmed. Documented as S-04 in POC simplification register.

---

### PHASE 6 — Structural Checks

---

#### Step 17 — AEP → Salesforce connector confirmation
**Corpus authority:** Document 8 Section 2; `§CA CLIENT_ATTRIBUTE_MAP` source pipeline entries  
**Input required:** Confirm that the AEP Real-Time CDP native Salesforce CRM destination connector is active and writing to the correct Salesforce org. Confirm the connector has been tested with a sample account record.  
**Validation rule:** This is a structural check — confirmation is binary (confirmed / not confirmed). A confirmed connector with a test write record satisfies the check. An unconfirmed connector triggers H-01.  
**Why this matters:** "The AEP → Salesforce connector is the integration that makes every account-plane attribute visible to the sales team. Without it, `tal_member`, `tal_program_status`, `bg_cohort`, `bg_stage`, and all convergence point alert fields cannot reach Salesforce CRM. BDRs and AEs work in Salesforce — if the connector is not active, they are blind to buying group intelligence."

**HOLD trigger:** H-01 — fires if connector cannot be confirmed active. This is a Category A blocking input from L2-D. Non-advanceable without confirmation or explicit deferral with named consequence.  
**FLAG trigger:** F-05 — fires if connector is confirmed active but test write has not been performed. Consequence: connector configuration may contain errors that are only visible at write time.  
**Deferral consequence:** If deferred — entire sales activation pathway is unvalidated. No account-plane attributes reach Salesforce. Documented as Category A consequence.

---

#### Step 18 — Data model version validation
**Corpus authority:** Data model `v0.2.0`; L2-D version governance decisions  
**Input required:** Advisor reads the current data model version from the retrieval index and confirms it matches `v0.2.0`. Practitioner acknowledges the version stamp that will appear in all Advisor outputs and audit log records from this session.  
**Validation rule:** Retrieval index version must match `v0.2.0`. If a mismatch is detected (index references a different version), H-06 fires. If the version matches, practitioner acknowledges and the step completes.  
**Why this matters:** "Every Advisor output and audit log record is stamped with the data model version active at session time. If the retrieval index version does not match the expected version, any advisory output from this session may reference rules, attributes, or thresholds that differ from the client's production configuration. A version mismatch is a traceability failure — not a program error, but a record-keeping gap that makes audit log review unreliable."

**HOLD trigger:** H-06 — fires if the retrieval index version does not match `v0.2.0`. Non-advanceable until the version mismatch is resolved (index rebuild required) or explicitly acknowledged with named consequence.  
**FLAG trigger:** F-01 — fires if practitioner overrides the version acknowledgment without confirming the mismatch has been resolved (deviation from corpus default).  
**Deferral consequence:** Cannot be deferred. Version validation is a structural check with no valid deferral path. If H-06 fires, the onboarding session must pause until the index is rebuilt or the version discrepancy is documented with explicit approval.

---

## Summary Table

| Step | Title | Phase | `onboarding_required` attribute | HOLD codes | FLAG codes |
|---|---|---|---|---|---|
| 1 | `tal_domain` | 1 | `tal_domain` | H-01 | None |
| 2 | `tal_member` | 1 | `tal_member` | H-01, H-02 | F-01 |
| 3 | `tal_account_type_source` | 1 | `tal_account_type_source` | H-01, H-02 | F-06 |
| 4 | `tal_program_status` | 2 | `tal_program_status` | H-01, H-02 | F-01 |
| 5 | `tal_region` | 2 | `tal_region` | H-01 | F-04 |
| 6 | `tal_marquee` | 2 | `tal_marquee` | H-02 | F-02 |
| 7 | `tal_channel` | 2 | `tal_channel` | H-01, H-02 | F-05 |
| 8 | `tal_new_logo_eligible` | 3 | `tal_new_logo_eligible` | H-02 | F-02 |
| 9 | `tal_open_pipeline` | 3 | `tal_open_pipeline` | H-02 | F-02 |
| 10 | `sfdc_opportunity_created` + `sfdc_opportunity_stage` | 3 | `sfdc_opportunity_created`, `sfdc_opportunity_stage` | H-01, H-05 | F-03 |
| 11 | `visitor_consent_state` default configuration | 4 | `visitor_consent_state` | H-03, H-05 | F-04 |
| 12 | Track 2 signal consent status | 4 | (consent architecture) | H-03 | F-04 |
| 13 | Signal activation scope confirmation | 4 | (§P classification) | None | F-04 |
| 14 | Salesforce custom field provisioning | 5 | (§SA integration) | H-05 | F-05 |
| 15 | Outreach sequence configuration | 5 | (§SA integration) | H-05 | F-05 |
| 16 | Alert delivery SLA confirmation | 5 | (§SA integration) | H-05 | F-03 |
| 17 | AEP → Salesforce connector confirmation | 6 | (structural) | H-01 | F-05 |
| 18 | Data model version validation | 6 | (structural) | H-06 | F-01 |

---

## Notes for Claude Code

1. Each step in `onboarding_18step.json` should include: `step_id`, `phase`, `step_title`, `corpus_authority`, `attribute` (the §CA key or integration reference), `input_required`, `validation_rule`, `why_this_matters`, `hold_triggers` (array of `{code, condition}`), `flag_triggers` (array of `{code, condition, consequence}`), `deferral_consequence`, `category` (A/B/C per L2-D Minimum Viable Client Data Set).

2. Steps 1, 2, 3, 4, 7, 11, 17 involve attributes classified as **Category A blocking inputs** in L2-D. Their `category` field should be `"A"`. Deferral of Category A inputs is technically possible via the deferral dropdown but produces a CRITICAL gap on the completion screen.

3. Steps 12 and 13 are **consent architecture steps** governed by Garcia's privacy-first principle. Step 12's F-04 FLAG produces a **persistent Configuration Gap Record** that is not cleared by practitioner acknowledgment — it persists in the audit log as an unresolved gap until Track 2 DPA review completes.

4. Step 18 is the only step where deferral is explicitly disallowed. The step card should not render a "Defer this step" control for Step 18.

5. The `data_model_version` on the step 18 card is read from the application's `DATA_MODEL_VERSION` constant (`"0.2.0"`), not from user input.
