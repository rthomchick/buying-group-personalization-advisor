# Document 9 — Privacy and Consent Architecture

**Document:** 9 of 9 — Kalder Personalization Hub Corpus
**Status:** Complete — All sections approved
**Depends on:** Buying Group Role Architecture (Document 1); Signal Definition and Confidence Model (Document 2); `kalder_data_model.py` (§P, §8)
**Primary audience:** Chief Privacy Officer, InfoSec Director, procurement legal reviewer evaluating Kalder as a vendor. This document is designed to be read independently of all other corpus documents.

---

## Section 1 — Document Scope and Legal Framework

### 1.1 Why Privacy Architecture Is a Standalone Document

Two structural problems arise when consent architecture is embedded in technical documentation.

The first is an audience problem. Legal, InfoSec, and procurement teams evaluate consent architecture independently of marketing strategy and signal design. When consent classifications are distributed across signal-weight specifications, geographic suppression rules are embedded in a scoring confidence model, and retention schedules appear inside an operational runbook, a legal reviewer must read engineering documentation to answer a legal question. That coupling is unacceptable in an enterprise vendor evaluation context. The consent framework must be readable, navigable, and complete without requiring the reader to understand the scoring pipeline it governs.

The second is a change-management problem. Consent requirements change: regulations update, new jurisdictions are added, Data Processing Agreements are renegotiated. When consent architecture lives inside the document that also governs signal weights, confidence thresholds, and scoring logic, a regulatory change requires editing a document whose scope extends well beyond the legal domain. These are separate governance domains. Changes to one should not require review authority over the other.

Document 9 governs the legal basis for data collection and processing, the consent mechanism implementation, the LIA documentation framework, the DPA governance structure, the geographic handling rules, and the process for extending consent rules to new jurisdictions.

---

### 1.2 Scope: What This Document Governs

**Signal consent classification:** Document 9 is the authoritative governance document for the legal basis, PII involvement, and cross-site tracking status of all 20 behavioral signals in `CROSS_ROLE_WEIGHTS` and the `demandbase_firmographic_match` enrichment signal. Signal-level classifications are maintained in this document and referenced by the data model (`SIGNAL_CONSENT_REQUIREMENTS` in `kalder_data_model.py §P`); in any conflict between the two, Document 9 governs.

**The `pending_consent_classification_default` rule:** Any signal not formally classified in the program's signal consent registry defaults to `functional_only` treatment — signals classified as `explicit_consent_required` are suppressed under this default; signals classified as `legitimate_interest` may be collected. The Data Privacy Officer owns the classification process for any new signal addition. This document specifies the rule and its ownership. The rule is specified in full in Section 3.

**The consent-state gating model:** Document 9 specifies how `visitor_consent_state` — the three-valued attribute (`full`, `functional_only`, `declined`) — determines which signals may be collected and which scoring pathways may execute. The consent management platform (CMP) is the collection mechanism; Adobe Experience Platform (AEP) is the storage mechanism. Consent events are ingested from the CMP to AEP via the AEP consent event ingestion path; the technical implementation of this ingestion is governed by Document 8 (Operational Runbook), Section 10. Document 9 governs what each consent state means for legal purposes. The full behavioral specification is in Section 2.

**Geographic handling rules:** Document 9 specifies the treatment of visitors in GDPR jurisdictions (EU, UK, EEA), CCPA jurisdictions (California), and default jurisdictions where neither regulation applies. It also governs the process for adding new jurisdictions to the consent framework. Geographic handling specifications are in Section 4.

**Data retention schedule:** Document 9 specifies the legal retention window for each data class: raw signal data, scored AEP profile attributes, Snowflake behavioral records, and CRM-matched contact records. It governs the relationship between scoring decay windows (specified in `kalder_data_model.py §8`) and legal retention limits, which operate on independent schedules. Retention specifications are in Section 6.

**The deletion and anonymization path:** Document 9 specifies the legal obligations fulfilled by the program's four-step deletion cascade — data subject requests (DSR) and consent withdrawal obligations under applicable regulation. The cascade covers Segment, AEP, Snowflake, and Salesforce. Legal obligations and cascade triggers are specified in Section 6.

**LIA documentation framework:** Document 9 specifies the three-part Legitimate Interest Assessment test (purpose, necessity, balancing), the role responsible for completing it, and the retention requirement for completed LIA records. The LIA framework is specified in Section 7.

**Third-party enrichment governance:** Document 9 governs the Data Processing Agreement structure for Demandbase and 6sense, the activation gate that must be satisfied before `demandbase_firmographic_match` can contribute to scoring, and the disclosure obligations associated with Track 2 status. Third-party enrichment governance is specified in Section 5.

---

### 1.3 Scope: What This Document Does Not Govern

**Experience delivery consequences of `visitor_consent_state`:** What each consent state value means for content personalization level, Adobe Target activity eligibility, and experience tier assignment is governed by Document 5 (Personalization Decisioning Rules). Document 9 specifies the legal basis for each consent state; Document 5 specifies what the program delivers under each state.

**Operational execution of the deletion cascade:** Step-level ownership, SLAs, deletion confirmation record generation, and the roles responsible for each cascade step (Marketing Ops Engineer, Data Engineer, Data Privacy Officer) are governed by Document 8 (Operational Runbook), Section 10. Document 9 specifies the legal triggers and obligations the cascade fulfills; Document 8 specifies how it is executed.

**Technical implementation of consent state propagation:** How `visitor_consent_state` is written to the AEP profile, read at session start, and enforced in real time through the Segment event pipeline — including the attribute schema and the CMP-to-AEP integration — is governed by Document 8 (Operational Runbook), Section 10.

**Marketo suppression and Outreach sequence gating:** The configuration of the Marketo suppression smart campaign and the Outreach sequence consent gate — the operational controls that suppress downstream activation for visitors in non-consented states — are governed by Document 8 (Operational Runbook), Section 10.

**Measurement of consent state effects:** The methodology for monitoring consent state distribution across the visitor population and analyzing the downstream effects on signal coverage and classification accuracy is governed by Document 7 (Measurement and Experimentation Framework). Document 9 does not specify measurement methodology.

---

### 1.4 Two-Track Consent Classification and the Default Rule

Three concepts introduced here recur throughout Document 9 and must be understood before reading any subsequent section.

**Track 1 (complete):** Legitimate Interest Assessment is complete for all 20 first-party behavioral signals in the program's scoring inventory. All 20 signals are collected on Kalder-owned web properties, involve no personally identifiable information, and involve no cross-site tracking. The lawful basis is legitimate interest under GDPR Article 6(1)(f). LIA documentation has been completed by the data and marketing operations team and is retained as required by applicable jurisdiction. These signals may be collected under both `full` and `functional_only` consent states. They are not suppressed in GDPR jurisdictions absent explicit consent. The program subjects covered by these signals are professional contacts acting in a B2B work capacity; this context is material to the balancing test component of the LIA and is documented in the retained LIA records.

**Track 2 (pending):** Legal review is pending for `demandbase_firmographic_match`, a Demandbase reverse-IP firmographic enrichment signal. This signal involves third-party data processing, involves PII, and involves cross-site tracking. It is classified as `explicit_consent_required`. Until Track 2 completes, the signal is suppressed program-wide — it is not collected, not scored, and the scoring pathway that depends on it (the firmographic confirmation bonus) does not activate. Full activation requires three conditions to be satisfied simultaneously: Track 2 legal review completion, Data Processing Agreement (DPA) execution with Demandbase, and implementation of a GDPR-compliant consent mechanism for EU, UK, and EEA visitors. These three conditions are not a sequence — they are simultaneous independent gates. All three must be open at the moment of activation. A program change record governs the activation transition.

**The `pending_consent_classification_default` rule:** Any signal not present in the program's formal signal consent classification registry defaults to `functional_only` treatment. Under `functional_only` treatment, signals classified as `explicit_consent_required` are suppressed; signals classified as `legitimate_interest` may be collected. This rule is not a transitional placeholder — it is a permanent structural safeguard that ensures no new signal can be activated with `explicit_consent_required` behavior before the Data Privacy Officer completes a formal classification review. The Data Privacy Officer owns the classification process. A program change record governs any addition to the classification registry.

Finally, this document governs the treatment of visitors whose `visitor_consent_state` is null or absent at the time of their first site interaction. That rule is specified in Section 2. It is noted here because a legal or InfoSec reviewer should know from the outset that the program has a defined, non-permissive position on this edge state. The absence of a consent record is not a permissive state.

---

## Section 2 — Consent State Model

### 2.1 Overview

Section 2 defines the three consent states as legal constructs, specifies the mechanisms by which consent is obtained and stored, and establishes the governing rules for four edge states that arise from the operational realities of CMP-to-AEP event delivery and visitor behavior during active sessions. `visitor_consent_state` must be evaluated before any signal collection or scoring executes. This is an architectural constraint, not an operational preference: evaluating consent state after signal collection has begun creates a compliance gap that cannot be corrected retroactively. Signals collected without confirmed lawful basis cannot be un-collected.

The four edge states — null/absent consent record, CMP event delivery failure, mid-session consent state change, and partial consent withdrawal — each require a governing rule that is non-permissive by default. Those rules are specified in Sections 2.3 and 2.5 through 2.7. Signal consent classification (Section 3), geographic handling (Section 4), the Track 2 activation gate (Section 5), data retention (Section 6), and LIA documentation (Section 7) are outside the scope of this section.

---

### 2.2 The Three Consent States

#### 2.2.1 `full`

`full` is the consent state in which the visitor has provided consent authorizing all signal classes, or in which all applicable signal classes are authorized without requiring explicit consent. Under `full`, all 20 behavioral signals classified as `legitimate_interest` may be collected and scored. The `demandbase_firmographic_match` signal (classified as `explicit_consent_required`) may also be collected and scored under `full` — subject to Track 2 completion (Section 5). The legal basis for `legitimate_interest` signals is GDPR Article 6(1)(f); no affirmative consent action by the visitor is required for these signals. The legal basis for `explicit_consent_required` signals, when Track 2 is complete and consent has been obtained, is GDPR Article 6(1)(a).

#### 2.2.2 `functional_only`

`functional_only` is the consent state in which the visitor's consent is limited to signals that do not require explicit consent — specifically, all signals classified as `legitimate_interest`.

**Permitted:** All 20 behavioral signals classified as `legitimate_interest` (Track 1 complete). These signals may be collected and scored without an affirmative consent action from the visitor. The lawful basis is legitimate interest under GDPR Article 6(1)(f). In a B2B context, `legitimate_interest` processing on an enterprise software vendor's owned web properties — where visitors are professional contacts reviewing vendor information in a work capacity — satisfies the purpose, necessity, and balancing tests of the LIA. The LIA documentation for these 20 signals is retained as specified in Section 7.

**Suppressed:** All signals classified as `explicit_consent_required`. Currently, this class contains one signal: `demandbase_firmographic_match`. The firmographic confirmation bonus scoring pathway does not execute under `functional_only`. If additional signals are classified as `explicit_consent_required` in future program change records, they are suppressed under `functional_only` without requiring a revision to this specification.

**Note for legal reviewers:** `functional_only` is not a degraded or non-consented state for the 20 `legitimate_interest` behavioral signals. These signals are authorized under legitimate interest, which does not require an affirmative consent action. A visitor in `functional_only` state has provided full lawful authorization for the processing of the 20 behavioral signals. The distinction between `full` and `functional_only` is solely whether the visitor has also authorized `explicit_consent_required` signal processing.

#### 2.2.3 `declined`

`declined` is the consent state in which the visitor has declined consent or opted out of signal collection. Under `declined`, no behavioral signals may be collected and no scoring executes. The visitor receives the unpersonalized experience (Level 5) regardless of Target Account List status, prior classification history, or any other program state. Prior classification history — role confidence scores, buying group stage, solution category interest signals — is not used to personalize any element of the experience when `visitor_consent_state` is `declined`. Prior classification data remains in the AEP profile until the deletion cascade executes following consent withdrawal; the legal obligations and SLAs governing that deletion are specified in Section 6. The experience delivery consequences of `declined` are specified in Document 5 (Personalization Decisioning Rules).

Note for measurement reviewers: `declined` visitors produce no signal data and cannot contribute to controlled experiment analysis. This is a structural characteristic of the consent model, not a data gap. Any measurement methodology that requires full population coverage must account for the excluded `declined` segment as a consent-bounded constraint.

---

### 2.3 The Null/Absent State

**Governing rule:** A null or absent `visitor_consent_state` is treated as `declined`. No signal collection executes. No scoring executes. The visitor receives the Level 5 unpersonalized experience. This rule applies regardless of the visitor's geographic jurisdiction, TAL status, or any other program attribute.

**Legal basis for the rule:** The absence of a consent record is not a permissive state. A program that collects behavioral signals from visitors whose consent status cannot be confirmed has no confirmed lawful basis for that collection. The governing rule is therefore non-permissive by legal obligation, not by conservative design choice.

**The rule applies under the following conditions:**

- First-time visitors who have not yet interacted with the consent management platform
- Returning visitors whose consent record has been deleted following a DSR or consent withdrawal
- Visitors whose consent record exists in the CMP but has not yet been written to the AEP profile (see Section 2.5)
- Visitors whose consent record was corrupted or invalidated in the AEP profile

**CMP obligation:** The consent management platform must present the consent interface and write the resulting consent event to AEP before the visitor's first behavioral signal can be collected. A CMP that defers consent collection to a second page view or delivers an after-the-fact prompt creates a window in which signal collection could execute before consent is established. This is not compliant with the null/absent governing rule.

---

### 2.4 Consent Acquisition and Storage

**Collection mechanism:** The consent management platform (CMP) is responsible for presenting the consent interface to the visitor, recording the visitor's consent selection, and emitting a consent event to AEP. The CMP is the authoritative source of the visitor's consent decision at the moment of collection.

**Storage mechanism:** Adobe Experience Platform (AEP) is the authoritative storage mechanism for `visitor_consent_state`. The attribute is stored in the visitor's AEP profile as part of the contact-plane attribute schema defined in `CLIENT_ATTRIBUTE_MAP`. The attribute accepts three values: `full`, `functional_only`, `declined`.

**Write path:** The CMP emits a consent event of type `consent_preferences_updated` to the AEP Edge Network via the Experience Platform Web SDK or equivalent ingestion path. AEP processes the event and writes the `visitor_consent_state` value to the visitor's profile. The consent event must include the visitor identity key sufficient for AEP to resolve the event to an existing profile or create a new profile. The attribute is available for pipeline read after the profile write completes.

**Read mechanism:** At session start, the signal collection pipeline reads `visitor_consent_state` from the AEP visitor profile via profile lookup before any signal collection or scoring executes. The attribute is the first gate evaluated in the signal pipeline. If the profile lookup does not return a `visitor_consent_state` value, the null/absent rule in Section 2.3 governs.

**Consent state update:** When a visitor changes their consent selection — upgrading from `functional_only` to `full`, or downgrading from `full` to `functional_only` or `declined` — the CMP emits a new `consent_preferences_updated` event. AEP processes the event and overwrites the existing `visitor_consent_state` value. The updated value governs all subsequent signal collection and scoring. The behavioral consequences of mid-session consent state changes are specified in Section 2.6.

---

### 2.5 Edge State: CMP Event Delivery Failure

**Governing rule:** If the signal collection pipeline executes a `visitor_consent_state` profile lookup and AEP does not return a value — whether because the consent event has not yet been delivered, because AEP processing is delayed, or because the CMP itself has failed — the pipeline applies the null/absent rule: treat as `declined`. No signal collection executes. The visitor receives the Level 5 unpersonalized experience for the duration of the session or until a successful profile lookup returns a valid `visitor_consent_state` value.

**No wait behavior:** The pipeline does not hold or queue signal collection while waiting for a consent event to arrive. The pre-pipeline gate evaluates at session start. If no valid `visitor_consent_state` is present at the moment of evaluation, the null/absent rule governs immediately.

**Recovery behavior:** If the consent event is delivered and the AEP profile is updated during an active session in which the pipeline has already applied the null/absent rule, the updated `visitor_consent_state` value governs from the next session start. Signals from pages in the current session during which the null/absent rule applied are not retroactively collected.

**Visitor experience during failure:** During a CMP event delivery failure, the visitor receives the Level 5 unpersonalized experience — the same experience a `declined` visitor receives. The visitor does not receive an error state distinct from the unpersonalized baseline. A visitor who has consented but whose consent event has not yet been delivered is temporarily indistinguishable from a visitor who has declined, from the pipeline's perspective. The correct resolution is CMP reliability, not pipeline permissiveness.

**CMP reliability obligation:** The CMP must be capable of delivering the consent event to AEP within the visitor's first page interaction, before the visitor navigates to a second page. A CMP that consistently fails to deliver consent events before the visitor's second page load creates a structural compliance gap: visitors who have provided consent are systematically treated as `declined` across their first-page experience. This is a CMP configuration and reliability requirement.

---

### 2.6 Edge State: Mid-Session Consent State Change

**Governing rule:** A consent state change takes effect at the next session start following the CMP event delivery and AEP profile write. Signals collected on the current page before the state change event is processed are governed by the consent state that was active at the start of that session. Signals collected in subsequent sessions after the state change are governed by the new consent state.

**Layer of enforcement:** The AEP visitor profile is the source of truth for `visitor_consent_state`. The state change takes effect when the AEP profile write completes and the updated attribute is available for pipeline read on the next session start evaluation. Adobe Target activity eligibility and signal collection suppression are enforced at the AEP pipeline layer, not at the Adobe Target layer independently.

**Already-collected signals:** Signals collected during the current session before the consent state change was processed are not retroactively invalidated from the current page's signal buffer. However, they are not scored or applied to the visitor's profile if the new `visitor_consent_state` suppresses their signal class. The scoring engine evaluates the consent state at the moment scoring executes, not at the moment the signal was collected.

**Opt-out during session (`full` or `functional_only` → `declined`):** If the visitor's state changes to `declined` during an active session, signal collection is suppressed from the next session start. Signals collected in the current session before the state change are not scored. The visitor's existing role confidence scores and buying group attributes are not deleted at the moment of opt-out; they remain in the AEP profile subject to the deletion cascade triggered by the consent withdrawal. The deletion cascade is governed by Document 8 (Operational Runbook), Section 10; the legal obligations it fulfills are specified in Section 6 of this document.

**Intra-session personalization window:** Between the moment the visitor opts out and the next session start, the visitor remains in an active session that was initiated under a prior consent state. Adobe Target activities and content personalization that were already rendered on the current page are not reversed mid-page. The visitor receives the unpersonalized experience from the next session start. This intra-session window is a defined architectural boundary, not a compliance gap; it is bounded by the session lifecycle and does not permit new signal collection or scoring after the opt-out event is processed.

---

### 2.7 Edge State: Partial Consent Withdrawal (`full` → `functional_only`)

The `full` → `functional_only` transition is not an opt-out. It is a narrowing of consent scope. The four-step deletion cascade specified in Document 8 (Operational Runbook), Section 10 does not trigger on this transition; that cascade is triggered by consent withdrawal to `declined` or by a data subject request.

**Governing rule for future collection:** From the next session start after the state change, `explicit_consent_required` signals are suppressed. The firmographic confirmation bonus pathway does not execute. The pipeline operates as specified for `functional_only` state.

**Governing rule for previously collected `explicit_consent_required` data:** Signal data classified as `explicit_consent_required` that was collected while the visitor's state was `full` is suppressed from further scoring pipeline use. It is not physically deleted at the moment of state change. Physical deletion follows the data retention schedule specified in Section 6. Until the retention window expires and deletion executes, the data exists in storage but does not contribute to scoring or personalization decisions.

**What is not triggered:** The `full` → `functional_only` transition does not trigger the four-step deletion cascade. A visitor narrowing from `full` to `functional_only` is restricting the scope of authorized processing, not withdrawing consent entirely.

**Retention forward reference:** The retention implications of `explicit_consent_required` data collected under `full` and subsequently suppressed under `functional_only` are specified in Section 6 (Data Retention and Deletion Architecture).

---

## Section 3 — Signal Consent Classification

### 3.1 Overview

Section 3 is the authoritative consent classification record for all signals in the program's scoring inventory. The classifications in this section govern which signals may be collected under each `visitor_consent_state` value, as specified in Section 2. A legal reviewer evaluating the program's consent architecture can determine the lawful basis, PII involvement, cross-site tracking status, and current activation state of any signal in the program from this section alone, without reference to any other corpus document or the data model.

The program's scoring inventory is classified on two tracks. Track 1 is complete: all 20 first-party behavioral signals in `CROSS_ROLE_WEIGHTS` have been assessed against the classification criteria in Section 3.2, satisfy all three criteria, and are classified as `legitimate_interest` under the `LI_FIRST_PARTY` template defined in Section 3.3. Track 2 is pending: `demandbase_firmographic_match` — a signal outside `CROSS_ROLE_WEIGHTS` — requires legal review before activation and is classified as `explicit_consent_required`. The Track 2 compound activation gate is specified in Section 5. Section 5 also specifies the governing rule for mid-program Track 2 completion — the edge state in which all three activation conditions are satisfied after the program is in active operation.

---

### 3.2 Classification Criteria

A signal qualifies for the `legitimate_interest` / LIA track if and only if it satisfies all three of the following criteria:

1. **First-party collection.** The signal is collected exclusively on Kalder-owned web properties. It does not involve collection by a third-party data provider, third-party tracking pixel, or data exchange with any external entity.

2. **No PII involvement.** The signal does not capture, process, or derive personally identifiable information. Behavioral engagement signals — page views, downloads, tool interactions, form submissions that do not capture contact fields — satisfy this criterion. Form submissions that capture email addresses, names, or other contact identifiers do not satisfy this criterion.

3. **No cross-site tracking.** The signal does not involve tracking visitor behavior across domains not owned by Kalder. It does not rely on third-party cookies, cross-site identifier resolution, or data sourced from a third-party identity graph.

The test is conjunctive. Failure of any single criterion places the signal on the `explicit_consent_required` track regardless of the other two. A signal satisfying two of three criteria does not qualify for the LIA track. A signal satisfying all three proceeds to LIA documentation under Track 1 (Section 7). A signal failing any criterion is classified as `explicit_consent_required` and requires legal review before activation.

Signals not yet evaluated against these criteria are governed by the `pending_consent_classification_default` rule specified in Section 3.4.

---

### 3.3 The LI_FIRST_PARTY Template

All 20 Track 1 signals share a common classification profile. That profile is defined here as the `LI_FIRST_PARTY` template and is the authoritative source of the values appearing in the Track 1 rows of the classification table in Section 3.5.

**Lawful basis:** `legitimate_interest` — GDPR Article 6(1)(f). Processing is necessary for the legitimate interests of the data controller (delivering relevant information to professional contacts in a B2B research context), and those interests are not overridden by the data subject's interests or fundamental rights. The LIA documentation for this determination is retained as specified in Section 7.

**PII involved:** False. No personally identifiable information is captured or derived by any signal in this template class.

**Cross-site tracking:** False. All signals in this template class are collected exclusively on Kalder-owned web properties using first-party instrumentation.

**GDPR suppressed without consent:** False. Signals in this template class are not suppressed in GDPR jurisdictions absent explicit consent. The lawful basis is legitimate interest, which does not require an affirmative consent action. Geographic handling rules for GDPR jurisdictions are specified in Section 4.

**CCPA opt-out affects:** False. Signals in this template class do not involve the sale or sharing of personal information as defined under CCPA. They are not subject to CCPA opt-out rights.

The LIA balancing test for signals in this template class was completed in the context of a B2B enterprise software vendor website, where visitors are professional contacts reviewing vendor information in a work capacity — a context material to the determination that data subject interests do not override the controller's legitimate interest.

---

### 3.4 The `pending_consent_classification_default` Rule

**The rule:** Any signal key not present in `SIGNAL_CONSENT_REQUIREMENTS` (the program's signal consent classification registry, defined in `kalder_data_model_v0_2_0.md §P`) defaults to `functional_only` treatment. Under `functional_only` default treatment, the signal may be collected under `full` and `functional_only` consent states and is suppressed under `declined` — the same collection behavior as a classified `legitimate_interest` signal. Signals classified as `explicit_consent_required` are suppressed under `functional_only` default and cannot activate under it. This default is a permanent structural safeguard, not a transitional placeholder. It is enforced at the pipeline layer by the absence of an entry in `SIGNAL_CONSENT_REQUIREMENTS`; no manual configuration is required to apply it to a new signal. Pipeline implementations must handle the key-not-found case by applying `functional_only` treatment; a pipeline that throws an exception or defaults to a more permissive state on an unrecognized signal key is not compliant with this requirement.

**Operational behavior for new signals:** A new signal added to the program's scoring inventory after v0.2.0 is active under `functional_only` default from the moment it begins collecting data. It is not suppressed until classified. The default treats it as `legitimate_interest` — collecting data from visitors in `full` and `functional_only` consent states — until the Data Privacy Officer completes a formal classification review. Legal reviewers evaluating this program should understand the risk surface this creates: if a signal that should be classified `explicit_consent_required` begins collecting data under the default before classification review is complete, that collection period represents processing without a confirmed lawful basis for the signal class. This is not a compliance gap the default cures retroactively — it is a data governance event that must be logged in the program change record. The default is designed to prevent operational disruption from legitimate additions to the signal inventory; it is not a license to defer classification review on signals whose data processing characteristics have not been assessed.

**Governance process:** The Data Privacy Officer owns the classification process for any new signal. Classification review must be initiated before a new signal begins collecting data — the default is a safety net for unanticipated additions, not a license to defer review. When classification is complete, the Data Privacy Officer files a program change record specifying: the signal key, the classification determination, the lawful basis, and the effective date. The program change record is the mechanism by which `SIGNAL_CONSENT_REQUIREMENTS` is updated. Until the change record is filed and the registry is updated, the default governs. If the classification review determines a signal is `explicit_consent_required`, the signal must be suppressed immediately upon that determination; the Data Privacy Officer must file a program change record logging the default collection period as a governance event.

---

### 3.5 Signal Consent Classification Table

| Signal Key | Signal Label | Track | Lawful Basis | PII | Cross-Site | GDPR Suppressed Without Consent | CCPA Opt-Out Affects | Status |
|---|---|---|---|---|---|---|---|---|
| `case_study_download` | Case study / success story download | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `competitive_comparison_view` | Competitive comparison page view | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `demo_request` | Demo request submission | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `multi_solution_exploration` | 3+ solution areas explored (90-day window) | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `roi_calculator_usage` | ROI calculator / TCO tool interaction | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `pricing_page_view` | Pricing page view | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `executive_brief_download` | Executive brief or consensus brief download | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `use_case_exploration` | Use case page exploration (> 3 min) | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `product_tour_engagement` | Product tour / interactive demo engagement | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `webinar_registration` | Webinar registration or attendance | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `howto_training_content` | How-to / training content view | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `community_forum_engagement` | Community / forum engagement | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `security_whitepaper_download` | Security whitepaper download | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `compliance_governance_content` | Compliance / governance content view | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `technical_docs_deep` | Technical documentation deep engagement | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `faq_support_docs` | FAQ / support documentation view | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `diagnostic_assessment` | Diagnostic / self-assessment tool interaction | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `integration_catalog_view` | Integration catalog view | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `security_trust_center_visit` | Security Trust Center visit | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |
| `category_explainer_view` | Category explainer page view (60s+ dwell) | 1 | Legitimate interest — GDPR Art. 6(1)(f) | False | False | False | False | Active |

---
**— TRACK 2: PENDING LEGAL REVIEW —**

---

| Signal Key | Signal Label | Track | Lawful Basis | PII | Cross-Site | GDPR Suppressed Without Consent | CCPA Opt-Out Affects | Status |
|---|---|---|---|---|---|---|---|---|
| `demandbase_firmographic_match` | Demandbase reverse-IP firmographic enrichment | 2 — Pending legal review | `explicit_consent_required` — GDPR Art. 6(1)(a) when Track 2 complete and consent obtained | True | True | True | True | **Suppressed program-wide. Not collected. Not scored. Firmographic confirmation bonus pathway does not activate.** Pending simultaneously: Track 2 legal review, DPA execution with Demandbase, GDPR consent mechanism for EU/UK/EEA visitors. Mid-program activation — should Track 2 complete after program go-live — requires a program change record and does not take effect until all three gates are open. Full activation gate specified in Section 5. |

---

*Signal keys correspond to entries in `CROSS_ROLE_WEIGHTS` and `SIGNAL_CONSENT_REQUIREMENTS` in `kalder_data_model_v0_2_0.md §7` and `§P` respectively. In any conflict between the classifications in this table and the data model registry, this document governs. Conflict resolution process: Section 3.6.*

---

### 3.6 Conflict Resolution Governance

**Hierarchy:** Document 9 is the authoritative source of signal consent classification. `SIGNAL_CONSENT_REQUIREMENTS` in `kalder_data_model_v0_2_0.md §P` is the machine-readable implementation of the classifications in this table. When the two are in alignment — which is the expected state — `SIGNAL_CONSENT_REQUIREMENTS` is the operative control at the pipeline layer. When they conflict, Document 9 governs.

**Conflict identification and interim rule:** A conflict exists when the classification recorded in this table for any signal key does not match the corresponding entry in `SIGNAL_CONSENT_REQUIREMENTS`. Conflict identification is the responsibility of the Data Privacy Officer, who must compare the two sources at each program change record event. During the period between conflict identification and resolution, the more conservative classification governs at the pipeline layer — that is, the classification that results in greater suppression of signal collection. If Document 9 classifies a signal as `legitimate_interest` but the data model classifies it as `explicit_consent_required`, the data model's `explicit_consent_required` classification governs until the conflict is resolved. If Document 9 classifies a signal as `explicit_consent_required` but the data model classifies it as `legitimate_interest`, Document 9's `explicit_consent_required` classification governs and the data model must be updated before the signal is permitted to collect.

**Resolution process:** The Data Privacy Officer must file a program change record identifying the conflicting entries, the source of the conflict (authoring error, retroactive regulatory change, data model update without Document 9 update, or Document 9 update without data model update), and the correct classification. The program change record must specify the required update to whichever source is incorrect, the effective date, and the approving authority — the Data Privacy Officer for `legitimate_interest` determinations, legal counsel for `explicit_consent_required` determinations. The conflict is resolved when both Document 9 and `SIGNAL_CONSENT_REQUIREMENTS` reflect the correct classification and a change record is on file. Partial resolution — updating one source without the other — does not constitute resolution and must be logged as an open item.

---

## Section 4 — Geographic Handling Rules

### 4.1 Overview

Section 4 specifies the treatment of visitors in three mutually exclusive and exhaustive jurisdiction categories: GDPR (EU, UK, and EEA), CCPA (California, United States), and default (all other jurisdictions, including visitors whose jurisdiction cannot be determined). Every visitor to the program falls into exactly one of these categories at any given session. The categories are determined at session start by the mechanism specified in Section 4.2 and do not change mid-session. If the CMP's jurisdiction determination changes during an active session — for example, due to a VPN state change that reveals a different underlying IP address — the updated jurisdiction takes effect at the next session start, consistent with the session-boundary rule for consent state changes in Section 2.6.

The two named regulatory frameworks — GDPR and CCPA — impose structurally different requirements that must not be conflated. GDPR establishes a lawful basis requirement that must be satisfied before processing begins; CCPA establishes an opt-out right that the consumer must exercise before certain processing stops. These are distinct legal frameworks and are specified independently in Sections 4.3 and 4.4. The operational execution of geographic suppression — CMP configuration, IP-based jurisdiction detection, and the Marketing Ops Engineer procedures that implement these rules — is specified in Document 8 (Operational Runbook), Section 10.3. Section 4 specifies the governance rules those procedures implement.

---

### 4.2 Jurisdiction Determination

**Authoritative source:** The visitor's geographic jurisdiction is determined by IP-based detection performed by the consent management platform (CMP). The CMP is the authoritative source for jurisdiction determination. `tal_region` — the account-level commercial attribute that governs campaign routing and content localization — does not govern consent scope and must not be used as a proxy for jurisdiction. A visitor browsing from a UK office whose account carries `tal_region = AMS` receives GDPR treatment because jurisdiction is determined by the visitor's detected IP address, not the account's commercial region. The governance of jurisdiction-detection methodology — timeout configuration, IP resolution service, and fallback trigger configuration — is owned by Document 8 (Operational Runbook), Section 10.3.

**Operationally undefined jurisdiction:** A visitor's jurisdiction is operationally undefined under any of the following conditions: (a) the CMP fails to resolve an IP address to a known jurisdiction before the consent interface must be displayed; (b) the IP address resolves to a jurisdiction not covered by any named rule in this section; (c) CMP service failure occurs before jurisdiction resolution completes. Each of these conditions produces the same result: the default jurisdiction treatment in Section 4.5 governs immediately. No wait period applies — the fallback is deterministic and takes effect at the moment the jurisdiction-determination attempt fails or times out. The CMP must be configured with a timeout threshold after which the fallback triggers; the timeout specification is governed by Document 8 (Operational Runbook), Section 10.3.

**Latency rule:** If the CMP has not resolved the visitor's jurisdiction by the time the consent interface must be displayed on the visitor's first page interaction, the default jurisdiction treatment applies to the consent interface display. If the CMP resolves the jurisdiction after the consent interface has already been displayed under the default rule, the jurisdiction-specific consent interface is displayed at the next available opportunity — the next page load or the next session, consistent with the CMP's re-display configuration. Jurisdiction resolution after initial display does not retroactively invalidate consent collected under the default rule if the default rule's consent interface was more restrictive than the jurisdiction-specific interface.

---

### 4.3 GDPR Treatment (EU / UK / EEA)

**Lawful basis framework:** Two lawful bases apply to signals in this program for GDPR-jurisdiction visitors. First-party behavioral signals classified as `legitimate_interest` are processed under GDPR Article 6(1)(f). This lawful basis does not require an affirmative consent action from the visitor. The LIA documentation supporting this basis is retained as specified in Section 7. Signals classified as `explicit_consent_required` — currently `demandbase_firmographic_match` — require GDPR Article 6(1)(a) consent from the visitor before they may be collected or processed. Under Article 6(1)(a), consent must be freely given, specific, informed, and unambiguous.

**Effect on `visitor_consent_state`:** A GDPR-jurisdiction visitor who has not provided Article 6(1)(a) consent for `explicit_consent_required` signals is in `functional_only` state — the 20 `legitimate_interest` signals may be collected; `explicit_consent_required` signals are suppressed. A GDPR-jurisdiction visitor who has provided Article 6(1)(a) consent is in `full` state. A GDPR-jurisdiction visitor who has declined all processing is in `declined` state.

**What GDPR does not require:** GDPR does not require explicit consent for `legitimate_interest` processing. The 20 first-party behavioral signals are collected in GDPR jurisdictions under Article 6(1)(f) without requiring an affirmative consent action from the visitor. This is legally distinct from `explicit_consent_required` processing. The program does not treat GDPR-jurisdiction visitors as requiring explicit consent for all signal collection — only for `explicit_consent_required` signals. A legal reviewer evaluating this program's GDPR posture should note that `functional_only` is not a non-consented state for the 20 `legitimate_interest` signals; those signals are authorized under a lawful basis that does not require consent.

**Right to object:** Under GDPR Article 21, data subjects have the right to object to processing based on legitimate interest. A GDPR-jurisdiction visitor may object to the collection and processing of `legitimate_interest` signals. Upon receipt of a valid Article 21 objection, the program must cease processing those signals for that visitor unless it can demonstrate compelling legitimate grounds that override the visitor's interests. The operational handling of Article 21 objections is governed by Document 8 (Operational Runbook); the legal obligation is acknowledged here as a complete statement of the program's GDPR exposure on this point.

**`demandbase_firmographic_match` in GDPR jurisdictions:** `demandbase_firmographic_match` carries additional suppression requirements in GDPR jurisdictions beyond the standard `explicit_consent_required` treatment. Even if Track 2 legal review completes and the program-wide suppression is lifted, `demandbase_firmographic_match` may not activate for GDPR-jurisdiction visitors until: (a) the GDPR-compliant consent mechanism for EU, UK, and EEA visitors is implemented and confirmed operational; and (b) the visitor has provided Article 6(1)(a) consent via that mechanism. These requirements are part of the Track 2 compound activation gate; the full gate specification is in Section 5.

---

### 4.4 CCPA Treatment (California)

**Opt-out framework:** CCPA establishes a consumer right to opt out of the sale or sharing of personal information. It does not establish a pre-processing consent requirement — signals may be collected unless and until the visitor exercises the opt-out right. This is structurally distinct from GDPR's lawful basis requirement. A legal reviewer should note the operational consequence: under CCPA, `demandbase_firmographic_match` collection could lawfully begin before a California visitor exercises opt-out rights, provided the required opt-out notice has been delivered. Under GDPR, that same signal cannot be collected until Article 6(1)(a) consent is obtained.

**Signals affected by CCPA opt-out:** `demandbase_firmographic_match` is affected by CCPA opt-out. This signal involves the processing of personal information — reverse-IP firmographic enrichment via Demandbase, a third-party data provider — in a manner that constitutes sharing of personal information under CCPA. A California visitor who exercises the opt-out right causes `demandbase_firmographic_match` to be suppressed; the visitor's `visitor_consent_state` transitions to `functional_only` if previously `full`, or remains `functional_only` or `declined` as applicable.

**Signals not affected by CCPA opt-out:** All 20 `legitimate_interest` behavioral signals are not affected by CCPA opt-out. These signals are collected on Kalder-owned web properties, do not involve PII, and do not involve the sale or sharing of personal information as defined under CCPA. The CCPA opt-out right does not apply to processing that does not constitute sale or sharing of personal information. This determination is based on the signal characteristics specified in Section 3 — it is a legal determination, not a programmatic convenience.

**Opt-out notice requirement:** Before `demandbase_firmographic_match` may be activated for California visitors, a right-to-opt-out notice must be provided and the visitor must have been given the opportunity to exercise the opt-out right. This notice requirement is a precondition for Track 2 activation for California visitors and is part of the Track 2 compound activation gate. The full gate specification is in Section 5.

**Effect on `visitor_consent_state`:** A California visitor who has not exercised CCPA opt-out may be in `full` or `functional_only` state depending on other consent interactions. CCPA opt-out exercise transitions the visitor to `functional_only` state if `explicit_consent_required` signals were previously active, or leaves `functional_only` or `declined` state unchanged.

---

### 4.5 Default Jurisdiction Treatment

**Governing rule:** Visitors whose jurisdiction resolves to a jurisdiction other than EU/UK/EEA or California, and visitors whose jurisdiction cannot be determined per Section 4.2, are governed by the default jurisdiction treatment. The default `visitor_consent_state` for these visitors is `functional_only`. All 20 `legitimate_interest` signals may be collected; `explicit_consent_required` signals are suppressed. The default applies at session start and remains in effect for the duration of the session. Visitors in `functional_only` default produce signal data from the 20 `legitimate_interest` signals and contribute to classification scoring; they do not contribute to `explicit_consent_required` signal pathways or the firmographic confirmation bonus. Measurement methodologies that require analysis of consent-state distribution should account for the default-jurisdiction population as a distinct segment, as their `visitor_consent_state` reflects a governance default rather than an affirmative consent action.

**Legal basis for the default:** The default is `functional_only` — not `full` — because the program cannot confirm that the legal conditions for `explicit_consent_required` signal collection are satisfied in jurisdictions whose consent requirements have not been reviewed. Applying `functional_only` as the default ensures that no `explicit_consent_required` signal collects from a visitor whose jurisdiction has not been reviewed and confirmed to permit that collection. This is a legal governance decision, not a conservative design choice.

**Relationship to Track 2:** Under the default jurisdiction treatment, `demandbase_firmographic_match` is suppressed. Even if Track 2 completes and program-wide suppression is lifted, `demandbase_firmographic_match` will activate for default-jurisdiction visitors only after the jurisdiction extension process in Section 4.6 has been completed for their jurisdiction — or after it has been confirmed by legal counsel that no additional jurisdiction-specific requirements apply.

---

### 4.6 New Jurisdiction Extension Process

**Trigger conditions:** The extension process must be initiated under any of the following conditions: (a) a regulatory change creates new consent requirements in a jurisdiction where the program operates; (b) the program begins serving visitors from a new geographic market not covered by the existing named rules; (c) a client's enterprise deployment requires operations in a jurisdiction not currently governed by a named rule. Any of these conditions is a trigger — the process is not optional when a trigger condition is met.

**Process steps:**

1. The trigger condition is identified and logged by the Data Privacy Officer or legal counsel.
2. Legal counsel conducts a jurisdiction-specific consent review covering: applicable data protection law, lawful basis requirements for each signal class, opt-in or opt-out structure, and any jurisdiction-specific notice or DPA requirements.
3. Legal counsel produces a jurisdiction-specific handling specification covering the same dimensions as Sections 4.3 and 4.4: lawful basis framework, effect on `visitor_consent_state`, signals affected, and opt-out or consent notice requirements.
4. Legal counsel approves the jurisdiction-specific handling specification. The Data Privacy Officer co-approves.
5. A program change record is filed specifying: the jurisdiction, the consent review findings, the handling specification, the effective date, and the approving authorities.
6. Document 9 is updated to add the new jurisdiction as a named subsection at the same level as Sections 4.3 and 4.4. Document 8 (Operational Runbook), Section 10.3 is updated to add the operational execution procedures for the new jurisdiction.

**Interim treatment during extension process:** From the moment a trigger condition is identified to the moment the program change record is filed and the handling specification takes effect, visitors from the new jurisdiction are governed by the default jurisdiction treatment in Section 4.5. This is a bounded interim rule, not a permanent assignment. The interim period must not exceed the timeline specified in the program change record initiated at Step 5. A trigger condition that is identified but not logged does not start the clock; the log entry at Step 1 is the operative start of the interim period.

---

## Section 5 — Third-Party Enrichment Governance

### 5.1 Overview

This program uses two named third-party enrichment providers: Demandbase and 6sense. Third-party enrichment signals are governed by a Track 2 legal review and DPA execution requirement that applies before any third-party enrichment signal may activate, regardless of the visitor's `visitor_consent_state`. `demandbase_firmographic_match` is the only currently inventoried third-party enrichment signal; its current status is suppressed program-wide pending Track 2 completion. 6sense is a named provider whose intent enrichment signals, if added to the scoring inventory, would require independent Track 2 legal review and DPA execution before activation. The classification characteristics of all third-party enrichment signals — PII involvement, cross-site tracking, and `explicit_consent_required` status — place them outside the `LI_FIRST_PARTY` template and outside the scope of the Track 1 LIA process. They require legal review before any data collection begins.

The absolute prohibition governing this section is stated here and is not subject to exception: no third-party enrichment signal may activate before its DPA is executed and its Track 2 review is complete, regardless of what `visitor_consent_state` reports for any visitor. A visitor in `full` consent state does not authorize third-party enrichment signal collection in the absence of a completed DPA and Track 2 review. Visitor consent and program-level DPA governance are independent requirements; both must be satisfied. While the firmographic bonus pathway (`+30` from `firmographic_confirmation_bonus`) remains suppressed program-wide, Tier 3 role classification accuracy metric T3-07 operates on behavioral signals only; any measurement of firmographic amplification effects on T3-07 must account for the current suppressed state as a structural condition of the program, not a data gap.

---

### 5.2 DPA Governance Framework

Before any third-party enrichment provider's signals may activate in the scoring pipeline, a Data Processing Agreement meeting the following minimum requirements must be executed between the program controller and the provider.

1. **Data processing scope.** The DPA must specify the categories of personal data processed by the provider, the purposes for which the provider processes data on behalf of the program, and the legal basis for each processing purpose.

2. **Retention limits.** The DPA must specify the maximum retention window for personal data processed by the provider. The retention window specified in the DPA must be consistent with or more restrictive than the retention windows governing the same data class in Section 6 of this document. A DPA that specifies a longer retention window than Section 6 is non-compliant with this requirement and does not satisfy the DPA gate condition.

3. **Deletion obligations.** The DPA must specify the provider's obligations upon receipt of a data subject request (DSR) or consent withdrawal — including the timeline for deletion and the mechanism by which the provider confirms deletion to the program controller.

4. **Sub-processor disclosure.** The DPA must identify any sub-processors the provider uses to process personal data covered by the agreement and must include a mechanism for notifying the program controller of sub-processor changes before those changes take effect.

5. **Jurisdiction-specific obligations.** The DPA must address GDPR Article 28 requirements for EU, UK, and EEA data subjects and CCPA service provider obligations for California data subjects, as applicable to the provider's processing scope.

**Demandbase:** DPA not yet executed. This is the second of the three Track 2 gate conditions for `demandbase_firmographic_match`. The signal may not activate until a DPA meeting these minimum requirements is executed with Demandbase.

**6sense:** DPA not yet executed. No 6sense intent enrichment signal is currently in the scoring inventory. If 6sense signals are added, DPA execution meeting these minimum requirements is required before activation.

---

### 5.3 The Track 2 Compound Activation Gate

`demandbase_firmographic_match` activation is governed by a compound gate with three conditions. All three must be satisfied simultaneously. They are independent — satisfaction of one does not count toward or substitute for satisfaction of another. They are not sequential — there is no required order of completion. The gate is compound Boolean AND: activation is permitted only when all three conditions evaluate to true at the same moment.

1. **Track 2 legal review completion.** Legal review confirming the lawful basis for `demandbase_firmographic_match` collection and processing under applicable jurisdictions is complete. The Data Privacy Officer files the completion determination in the program change record.

2. **DPA execution with Demandbase.** A Data Processing Agreement meeting the minimum requirements specified in Section 5.2 is executed between the program controller and Demandbase. The executed DPA is on file with the Data Privacy Officer.

3. **GDPR consent mechanism implementation.** A GDPR-compliant consent mechanism is implemented and confirmed operational for EU, UK, and EEA visitors, enabling those visitors to provide Article 6(1)(a) consent for `explicit_consent_required` signal processing. This condition governs activation in GDPR jurisdictions specifically; see Section 5.4 for jurisdiction-specific gate layering.

**Compound gate rule:** These three conditions are not a sequence. Completing conditions 1 and 2 without condition 3 does not permit activation for any visitor population, including non-GDPR-jurisdiction visitors. Completing condition 3 without conditions 1 and 2 does not permit activation for any visitor population. The gate is open only when all three conditions are simultaneously satisfied. Any condition that was previously satisfied but subsequently fails — for example, a DPA that is executed and later terminated — re-closes the gate. Gate re-closure takes effect immediately; `demandbase_firmographic_match` is suppressed from the moment any previously satisfied condition subsequently fails.

---

### 5.4 Visitor Consent State and Gate Interaction

**When the gate is open (all three conditions satisfied):**

**Visitor in `full` consent state:** `demandbase_firmographic_match` may be collected and scored. The firmographic confirmation bonus pathway activates for eligible visitors per the scoring rules in `kalder_data_model.py §12`. This is the only visitor population for whom `demandbase_firmographic_match` is active when the gate is open.

**Visitor in `functional_only` consent state:** `demandbase_firmographic_match` is suppressed regardless of gate status. Track 2 completion does not activate the signal for `functional_only` visitors. The gate being open is a necessary condition for activation, not a sufficient one — the visitor must also be in `full` consent state. A `functional_only` visitor in any jurisdiction does not receive firmographic enrichment or the firmographic confirmation bonus until and unless they upgrade to `full` consent state. The suppression mechanism is the signal's `explicit_consent_required` classification, not a separate program rule; it follows directly from the consent state model in Section 2.

**Visitor in `declined` consent state:** No signals are collected. `demandbase_firmographic_match` is suppressed regardless of gate status.

**When the gate is closed (any condition unsatisfied):**

`demandbase_firmographic_match` is suppressed for all visitors in all jurisdictions regardless of `visitor_consent_state`. A visitor in `full` consent state whose profile would otherwise authorize `explicit_consent_required` signal collection receives no firmographic enrichment while the gate is closed. The scoring pipeline operates without the firmographic confirmation bonus for all visitors while the gate is closed. There is no partial activation state — the gate is binary.

**The dual-requirement rule:** Activation of `demandbase_firmographic_match` requires both gate open AND visitor in `full` consent state. These are independent conditions evaluated simultaneously at the moment of scoring. Gate status is a program-wide condition; consent state is a per-visitor condition. Neither substitutes for the other. A visitor in `full` consent state while the gate is closed receives no firmographic enrichment. The gate being open while a visitor is in `functional_only` state produces no firmographic enrichment for that visitor. Both conditions must be true at the moment of scoring for the signal to contribute.

---

### 5.5 Mid-Program Track 2 Activation

**Activation sequence:** When all three gate conditions are satisfied simultaneously, activation does not take effect automatically. The following sequence governs:

1. The Data Privacy Officer confirms all three conditions are satisfied simultaneously and prepares an activation determination.
2. The Data Privacy Officer files a program change record specifying: the satisfaction date for each of the three conditions, the effective activation date, and the `SIGNAL_CONSENT_REQUIREMENTS` registry update required in `kalder_data_model_v0_2_0.md §P`.
3. The data model registry is updated — `demandbase_firmographic_match`'s `track_2_status` field is updated from `pending_legal_review` to `complete` and the `[PENDING]` flag in Document 2, Section 9.4 is removed.
4. Activation takes effect at the next session start following the registry update confirmation. There is no instantaneous pipeline activation; the registry update is the operative switch, and it takes effect as the pipeline reads the updated registry on new session evaluations.
5. The Document 9 Track 2 status references in Sections 1.4, 3.5, and 5.3 are updated to reflect completion. The `[PENDING]` flag in Document 2, Section 9.4 is removed per that document's final publication pass specification.

**Propagation window:** Between the moment the program change record is filed (Step 2) and the moment the registry update is confirmed (Step 3), the gate conditions are satisfied but activation has not yet taken effect. During this propagation window, `demandbase_firmographic_match` remains suppressed. The propagation window is the defined interval between change record filing and registry update confirmation; it does not constitute a compliance gap.

**No retroactive scoring:** Activation takes effect from the moment the pipeline reads the updated registry on new session evaluations. Behavioral events from sessions that occurred before activation — including sessions during which the gate conditions were satisfied but the registry update had not yet completed — are not retroactively scored for `demandbase_firmographic_match`. The signal's contribution to the firmographic confirmation bonus applies only to sessions that begin after the registry update is confirmed.

---

### 5.6 6sense Intent Enrichment Governance

**Current status:** No 6sense intent enrichment signal is currently in the program's scoring inventory. 6sense is a named third-party enrichment provider subject to the DPA governance framework in Section 5.2. No 6sense signal may be added to the scoring inventory without completing the requirements specified in this section.

**Why 6sense requires Track 2 treatment:** 6sense intent data is account-level behavioral intent signal aggregated from third-party publisher networks. Unlike the 20 first-party behavioral signals — which are collected on Kalder-owned web properties, involve no PII, and involve no cross-site tracking — 6sense intent data is sourced from third-party networks, involves cross-site tracking of professional contacts across publisher domains, and is provided via a third-party data processing arrangement. These characteristics place 6sense signals outside all three criteria for the `legitimate_interest` / LIA track (Section 3.2) and require `explicit_consent_required` classification and independent Track 2 legal review before any 6sense signal may collect data or contribute to scoring.

**Activation requirements for 6sense signals:** If 6sense intent enrichment signals are added to the scoring inventory, activation requires independently:

1. Track 2 legal review completion for the specific 6sense signal or signals being added — separate from and independent of the Demandbase Track 2 review.
2. DPA execution with 6sense meeting the minimum requirements in Section 5.2.
3. GDPR consent mechanism implementation covering 6sense's data processing scope for EU, UK, and EEA visitors.

These three conditions constitute an independent Track 2 gate for 6sense, parallel in structure to the Demandbase gate but evaluated entirely independently. Completion of the Demandbase Track 2 gate does not satisfy or contribute to the 6sense Track 2 gate.

**Interim classification rule:** If 6sense intent data begins feeding the scoring pipeline before 6sense's classification review and DPA are complete — for example, due to a technical integration preceding governance completion — the `pending_consent_classification_default` rule (Section 3.4) applies by its terms: the signal is active under `functional_only` default from the moment it begins collecting. This is a data governance event and must be logged in the program change record immediately upon discovery. However, the `pending_consent_classification_default` rule's permissive treatment does not authorize processing that requires a DPA when no DPA exists. The default rule was designed for signals whose compliance characteristics have not yet been reviewed — not for signals whose DPA requirement is known and whose absence of a DPA is a known compliance gap. A 6sense signal is not merely unclassified in the way a new first-party signal might be unclassified; it is a signal whose third-party data processing characteristics are known and whose DPA requirement follows directly from those characteristics. For third-party enrichment signals specifically, the DPA execution requirement is a precondition that supersedes the `pending_consent_classification_default` permissive default — a 6sense signal collecting data under `functional_only` default without an executed DPA is non-compliant, regardless of the default rule's treatment of the signal's collection behavior.

---

## Section 6 — Data Retention and Deletion Architecture

### 6.1 Overview

Section 6 specifies the legal retention obligations for each data class produced by the program's pipeline, the four-step deletion cascade that fulfills deletion obligations under GDPR Article 17 and the CCPA deletion right, and the governing rules for four edge states: partial cascade failure, consent withdrawal trigger timing, partial consent withdrawal data handling, and the conditions under which anonymization applies in lieu of deletion. Each of these edge states has a governing rule that is specified in this section and is not addressed by the operational procedures in Document 8.

The scope boundary is precise: Section 6 specifies the legal obligations the cascade fulfills and the retention windows that govern data availability. Document 8 (Operational Runbook), Section 10.4 specifies the operational execution of the cascade — step-level ownership, practitioner responsibilities, and monitoring procedures. A practitioner executing a deletion must read Document 8; a legal reviewer evaluating the program's deletion obligations must read this section. The two-clock model underpins this section: scoring decay windows, governed by `DECAY_MULTIPLIERS` in `kalder_data_model.py §8`, and legal retention windows, governed by `DATA_RETENTION_SCHEDULE` in `kalder_data_model_v0_2_0.md §P`, are independent instruments operating on independent schedules. Section 6 governs the legal retention clock exclusively.

---

### 6.2 The Two-Clock Model: Scoring Decay vs. Legal Retention

**Scoring decay:** Scoring decay is a pipeline control. `DECAY_MULTIPLIERS` govern how the scoring engine weights signal observations based on their age — a signal observation older than 180 days receives a multiplier of 0.0× and contributes zero to the current role confidence score. Scoring decay governs what the scoring engine does with data; it does not govern whether the data exists. A signal observation at 0.0× multiplier has not been deleted — it exists in storage until the legal retention window expires and deletion executes.

**Legal retention:** Legal retention windows are storage controls. They govern when data must be physically deleted from each storage system. A retention window of 365 days for raw behavioral signals means the data must be deleted no later than 365 days after collection. Legal retention windows operate independently of scoring decay. A compliance reviewer auditing the program will find signal observations in Segment and Snowflake that are contributing zero to current scoring — this is expected and compliant. The data exists because the 365-day retention window has not yet expired; the signal contributes zero because the 180-day decay window has passed. Both instruments are operating correctly.

**Independent clocks:** The two clocks run independently and neither overrides the other. The scoring clock determines when data stops influencing personalization decisions. The legal clock determines when data must be deleted. For a given signal observation, the 180-day decay window governs when the observation reaches zero-weight; the 365-day legal retention window governs when it must be physically deleted. Data that is at 0.0× weight but within the legal retention window is not a compliance gap — it is data that has aged out of scoring utility but has not yet reached its legal deletion deadline. Both states are correct simultaneously.

---

### 6.3 Data Retention Schedule

| Data Class | Retention Window | Storage Location | Deletion Trigger | DPA Reference |
|---|---|---|---|---|
| Raw behavioral signals | 365 days | Segment event stream; AEP event stream | Rolling window — auto-expire at 365 days from collection; also deleted on DSR or consent withdrawal | Not applicable — first-party data class; not subject to third-party DPA |
| Scored role attributes (`role_confidence_score`, `role_classification`, `bg_stage`) | 180 days | AEP profile attributes | Rolling window — auto-expire at 180 days; also deleted on consent withdrawal or DSR | Not applicable — derived first-party attributes |
| CRM enriched records (buying group enrichment fields only) | 730 days | Salesforce CRM — buying group enrichment fields only; base contact record governed by client CRM retention policy | DSR or contract termination; Step 4 of deletion cascade nulls these fields; base contact record is not deleted by this program's cascade | Not applicable — enrichment fields only; client CRM policy governs base record |
| Firmographic enrichment cache | 90 days | Demandbase reverse-IP match results cached in AEP | Rolling window — auto-expire at 90 days; suppressed from scoring immediately on consent withdrawal; physically deleted at rolling window expiry | **DPA compliance reference:** The 90-day retention window in this row is the binding standard for Section 5.2 DPA compliance. A Demandbase DPA specifying a retention window exceeding 90 days for this data class does not satisfy the Section 5.2 DPA gate condition and must be renegotiated before activation. |

**Legal obligation statement:** The retention windows in this table are legal obligations, not guidelines. Data in each class must be deleted by the specified deadline. A retention window that expires without the associated deletion executing is a compliance failure, not a technical incident. The Data Engineer is operationally responsible for rolling window compliance monitoring per Document 8 (Operational Runbook), Section 10.6.

**Partial withdrawal data handling (`full` → `functional_only`):** `explicit_consent_required` signal data collected while a visitor's `visitor_consent_state` was `full` — specifically, `firmographic_enrichment_cache` data — is suppressed from further scoring pipeline use when the visitor transitions to `functional_only`. Suppression is a pipeline behavior, not a storage state: the data remains in its AEP cache storage location until the 90-day rolling window expires and deletion executes. The data is not moved, quarantined, or tagged differently at the moment of suppression. A legal reviewer auditing the program during the period between suppression and deletion will find `firmographic_enrichment_cache` data in AEP for a visitor in `functional_only` state; this is compliant — the data is within its retention window, it is not contributing to scoring, and no further action is required before the 90-day window expires. Physical deletion occurs at rolling window expiry per the `firmographic_enrichment_cache` row above. The `full` → `functional_only` transition does not trigger the four-step deletion cascade specified in Document 8 (Operational Runbook), Section 10.4 — that cascade is triggered by consent withdrawal to `declined` or by a DSR. Suppression from scoring is not equivalent to deletion for legal purposes.

---

### 6.4 Cascade Trigger and SLA Clock

**Trigger events:** Three events trigger the deletion cascade: (a) consent withdrawal — the visitor transitions `visitor_consent_state` to `declined`; (b) data subject request (DSR) submitted under applicable privacy law (GDPR Article 17, CCPA deletion right); (c) contract termination between the program controller and the enterprise client.

**SLA clock rule:** The SLA clock starts at the trigger event timestamp. For consent withdrawal, the trigger event is the moment the CMP records the visitor's withdrawal decision — not the moment the AEP profile is updated, not the next session start, and not the next business day. For DSR, the trigger event is the moment of DSR intake receipt as logged by the Data Privacy Officer. The 72-hour SLA for Steps 1 and 2 and the 168-hour SLA for Steps 3 and 4 run from these timestamps continuously — not on a business-day basis, not reset by time-of-day, and not suspended by internal escalation or investigation. A consent withdrawal recorded at 11:58 PM starts a 72-hour clock that expires at 11:58 PM two days later. There is no exception for weekends, holidays, or after-hours receipt. The SLA is a legal obligation; its calculation method is not subject to reasonable interpretation.

**Legal obligations discharged by each cascade step:**

**Step 1 (AEP — 72 hours):** Discharges the obligation to cease processing scored role attributes for the subject. Under GDPR Article 17(1) and the CCPA deletion right, this step removes the program's active personalization profile for the subject.

**Step 2 (Segment — 72 hours):** Discharges the obligation to suppress future signal collection and to submit deletion of historical event data. This step ensures no new data is collected and initiates deletion of the event record constituting the subject's behavioral history.

**Step 3 (Snowflake — 168 hours):** Discharges the obligation to delete behavioral records from the analytical warehouse. GDPR Article 17 and CCPA apply to all systems holding the subject's personal data — warehouse deletion is not optional and is not satisfied by Steps 1 and 2.

**Step 4 (Salesforce CRM — 168 hours):** Discharges the obligation to remove buying group enrichment fields from the CRM record. The base contact record is retained per the enterprise client's CRM retention policy; only the fields written by this program's pipeline are covered by this cascade step.

---

### 6.5 Deletion Confirmation Record

The deletion confirmation record is the audit artifact that confirms a DSR or consent withdrawal deletion obligation has been fulfilled. It is generated by the Data Privacy Officer only after all four cascade steps have completed and completion timestamps have been received from the Data Engineer for each step.

**Minimum required fields:**

1. Subject identifier — `visitor_id` or `contact_id` as applicable
2. Trigger event type — consent withdrawal, DSR, or contract termination
3. Trigger event timestamp — the exact timestamp from which SLA clocks were calculated
4. Step 1 completion timestamp and confirming system (AEP)
5. Step 2 completion timestamp and confirming system (Segment)
6. Step 3 completion timestamp and confirming system (Snowflake)
7. Step 4 completion timestamp and confirming system (Salesforce CRM)
8. Record generation timestamp — the moment the Data Privacy Officer generated the confirmation record

**What the record must not contain:** A deletion confirmation record generated before all four steps have completed is invalid for audit purposes. A single "deletion completed" notification without step-level timestamps does not constitute a valid deletion confirmation record under this specification. Enterprise clients receiving deletion confirmation records from this program should expect the eight-field format above; a record that omits step-level timestamps or completion-system identification does not satisfy audit documentation requirements and should be returned to the Data Privacy Officer for reissuance.

---

### 6.6 Partial Cascade Failure

**Legal status of partial completion:** A cascade that completes Steps 1 and 2 within their 72-hour SLA but stalls at Step 3 or Step 4 is a partial deletion — not a confirmed deletion. Partial completion does not fulfill the program's DSR or consent withdrawal obligation under GDPR or CCPA. The deletion obligation persists until all four steps complete.

**SLA behavior during partial completion:** The 168-hour SLA for Steps 3 and 4 continues to run during investigation and remediation. It is not tolled by the detection of a stall, by escalation to the Data Engineer, or by any internal investigation process. A controller cannot suspend a regulatory clock by investigating why its own system failed. A Step 3 that stalls at hour 100 and is resolved at hour 200 has missed its 168-hour SLA. The program must log the SLA breach and, where applicable, fulfill any regulatory notification obligations arising from the breach.

**Required actions on partial completion detection:**

1. Log the partial completion status immediately — which steps completed, which steps stalled, and the stall detection timestamp.
2. Do not generate a deletion confirmation record. A partial deletion confirmation record is invalid and must not be issued to the data subject or enterprise client.
3. Escalate to the Data Engineer for investigation of the stall cause.
4. Continue pursuing cascade completion — the legal obligation to complete deletion does not expire at SLA breach. SLA breach is a compliance event that must be logged; it is not a termination of the deletion obligation.
5. When all four steps complete, generate the deletion confirmation record per Section 6.5. The record must include the actual completion timestamps even if they exceed the SLA windows — the audit trail must reflect the actual timeline, not the required timeline.

**What partial completion provides:** Steps 1 and 2 completing within 72 hours provide material protection for the subject — the subject's AEP scoring profile is deleted and future signal collection is suppressed. These protections are operative from the moment each step completes. However, behavioral records remain in Snowflake until Step 3 completes and buying group enrichment fields remain in the CRM until Step 4 completes. The subject's data has not been fully deleted from the program's systems until all four steps complete, and no deletion confirmation record may be issued until that point.

---

### 6.7 Anonymization vs. Deletion

**When anonymization applies:** The program does not maintain a general policy of anonymizing data in lieu of deletion. Deletion is the standard path for all DSR and consent withdrawal obligations. Anonymization is applicable only for aggregate measurement data — specifically, cohort-level signal distribution records that do not contain or reference individual `visitor_id` or `contact_id` values and cannot be re-identified by any means available to the program. Such aggregate records, if they exist, are not covered by DSR deletion obligations because they do not constitute personal data.

**Irreversibility requirement:** Data is considered anonymized for legal purposes only if the anonymization is irreversible — the original individual cannot be re-identified from the anonymized record, or from the anonymized record in combination with any other data set the program controls or can reasonably access. Data that could be re-identified by joining against a separately retained identifier table — for example, a Snowflake table that retains `visitor_id` alongside the purportedly anonymized record — is not anonymized for legal purposes and does not satisfy a DSR deletion obligation. The irreversibility test applies at the time of the DSR, not at the time of anonymization; a data set that was irreversibly anonymized at creation but is now joinable against a subsequently created identifier table is not anonymized for legal purposes.

**Measurement implications:** Aggregate, irreversibly anonymized cohort records retained after DSR deletion may be used for program-level measurement analysis — for example, population-level signal distribution statistics — without identifying or re-processing the deleted subject's data. Individual-level records removed by the cascade are excluded from future measurement events from the moment of deletion. They are not imputed, filled, or replaced in measurement calculations. Measurement methodologies that rely on complete population coverage must treat deleted subjects as consent-bounded exclusions — a structural characteristic of the program's architecture — not as missing data to be estimated or adjusted for.

---

## Section 7 — LIA Documentation Framework

### 7.1 Overview

Section 7 specifies the Legitimate Interest Assessment (LIA) as the legal instrument that establishes and must maintain the Article 6(1)(f) lawful basis for all 20 first-party behavioral signals classified as `legitimate_interest` in Section 3. The LIA is not a one-time compliance exercise — it is a living legal record that must be updated when the trigger conditions specified in Section 7.4 are met. Document 9 governs the LIA process; the signal-level classification outcomes the LIA produced are recorded in Section 3 of this document and in `SIGNAL_CONSENT_REQUIREMENTS` in `kalder_data_model_v0_2_0.md §P`. The LIA documentation itself — the completed assessment records — is retained in the program's legal record, not in this corpus.

"Track 1 complete" means the following, operationally: the LIA has been completed for all 20 first-party behavioral signals, reviewed by legal counsel, and retained in the program's legal record. The signals are authorized to collect in `full` and `functional_only` consent states in all jurisdictions, including GDPR jurisdictions, under GDPR Article 6(1)(f). The `LI_FIRST_PARTY` classification template applied to all 20 signals (Section 3.3) reflects the LIA's findings. Enterprise clients evaluating this program as a vendor may rely on the Track 1 completion status as confirmation that the program's first-party behavioral signal collection has been assessed for lawful basis and found defensible under EU law for the current signal inventory and processing scope.

---

### 7.2 The Three-Part LIA Test

#### 7.2.1 Purpose Test

The purpose test asks: is the processing purpose legitimate? For this program, the processing purpose is the delivery of behaviorally relevant information to professional contacts engaged in enterprise software evaluation — adapting the content and experience of kalder.com to the visitor's apparent role, buying stage, and solution interest based on behavioral signals collected on Kalder-owned web properties. This purpose is legitimate under GDPR Article 6(1)(f): it serves the controller's commercial interest in effective communication with prospective enterprise buyers; it serves the data subject's interest in receiving information relevant to their evaluation process rather than generic content; and it does not pursue any purpose that would be unlawful or contrary to fundamental rights. The purpose test is satisfied for all 20 first-party behavioral signals.

#### 7.2.2 Necessity Test

The necessity test asks: is the processing necessary for the legitimate purpose? Necessity under GDPR does not mean the processing is the only possible means of achieving the purpose — it means the processing is proportionate and that less privacy-invasive alternatives would not achieve the same purpose. For this program: behavioral signal collection is the mechanism by which the system infers the visitor's role and buying stage — without behavioral signals, the system cannot adapt content to the visitor's context, and the personalization purpose cannot be achieved. The 20 signals are specifically scoped to behavioral engagement on Kalder-owned web properties; they do not involve PII, cross-site tracking, or enrichment from third-party data sources (Section 3.2 classification criteria). The signals constitute the minimum necessary data collection to achieve the personalization purpose — each signal reflects a discrete and purposeful engagement action by the visitor that carries legitimate inference value. The necessity test is satisfied for all 20 first-party behavioral signals.

#### 7.2.3 Balancing Test

The balancing test is the most substantive part of the LIA and the part most dependent on the specific processing context. The test asks: do the data subject's interests or fundamental rights override the controller's legitimate interest? The following factors inform the balance for this program.

**Processing context:** The program processes behavioral signals from professional contacts visiting a B2B enterprise software vendor website in a work capacity. This is materially different from consumer data processing: the data subjects are professional buyers conducting evaluation activities that are part of their job responsibilities. They are not consumers sharing personal lifestyle data; they are professionals accessing information relevant to a business decision. This context weighs in favor of the controller's legitimate interest — the processing is aligned with the purpose of the visit and the professional role of the data subject.

**Nature of data:** All 20 signals are behavioral engagement signals — page views, downloads, tool interactions, content engagement. No signal captures PII. No signal involves cross-site tracking. The non-PII, first-party nature of the data materially reduces the privacy risk to data subjects compared to processing that involves personal identifiers, location data, or cross-site behavioral profiling.

**Reasonable expectations:** Professional contacts visiting an enterprise software vendor website have a reasonable expectation that their engagement behavior may be used to adapt the information they receive. This expectation is consistent with standard B2B marketing practice, with the stated purpose of the vendor relationship, and with the nature of the visit itself — a contact who downloads a competitive comparison document or engages with an ROI calculator is signaling evaluation intent that the vendor may reasonably respond to.

**Safeguards and controls:** The program provides effective exercise of the Article 21 right to object for GDPR-jurisdiction visitors and the right to decline or withdraw consent for all visitors. The consent architecture in this document ensures that visitors who object to legitimate interest processing can exercise that right without consequence to their ability to access the site's content.

**Balance determination:** The data subjects' interests and fundamental rights do not override the controller's legitimate interest for the 20 first-party behavioral signals, given the B2B professional context, the non-PII nature of the data, the reasonable expectations of the data subjects, and the existence of effective safeguards. This determination was made at the time the LIA was completed and must be re-evaluated against the trigger conditions in Section 7.4 when any material change to the processing context occurs.

---

### 7.3 LIA Completion, Review, and Retention

**Who completes:** The Data Privacy Officer is responsible for completing the LIA for each signal or signal category, following the three-part test structure in Section 7.2. For the current 20 first-party behavioral signals, the LIA has been completed and reviewed by legal counsel. Both DPO completion and legal counsel review are required before `legitimate_interest` signals activate in GDPR jurisdictions. The data model's Track 1 startup-phase language — "LIA completed by data / marketing ops team, does not require legal sign-off" — reflects the operational decision made to clear the build blocker during program development. It does not describe the ongoing governance standard. For a program operating in GDPR jurisdictions, legal counsel review is a requirement, and the LIA on file reflects that review.

**Where retained:** Completed LIA records are retained in the program's legal record — a separate repository from this corpus, maintained by the Data Privacy Officer. The legal record is available to legal counsel, regulatory authorities upon request, and enterprise clients conducting due diligence on the program's consent architecture. This document references LIA completion status; it does not contain the LIA documents themselves. A legal reviewer who requires access to the completed LIA records for the 20 first-party behavioral signals should request them from the Data Privacy Officer.

**Retention period:** LIA records must be retained for the duration of the processing they authorize, plus a minimum post-processing period of five years — consistent with the applicable statute of limitations for data protection regulatory action in the primary GDPR jurisdictions in which the program operates. LIA records superseded by updated assessments must be retained alongside the updated records. The history of LIA determinations is part of the program's audit trail; prior assessments must not be destroyed upon update.

---

### 7.4 LIA Update Trigger Conditions

The following conditions require a LIA update before the triggering change takes effect. A change that triggers a LIA update may not proceed under the existing LIA authorization.

**Adding a new signal to the scoring inventory:** Before a new signal begins collecting data under the `legitimate_interest` track, a LIA must be completed for that signal. The `pending_consent_classification_default` rule (Section 3.4) permits new signals to collect under `functional_only` default pending classification review, but this default does not substitute for LIA completion for signals intended to operate as `legitimate_interest`. LIA completion must precede activation on the `legitimate_interest` track.

**Changing a signal's engagement threshold in a way that expands data collection:** If an existing signal's engagement threshold is changed such that more data is collected — for example, reducing a dwell-time threshold so that shorter page visits qualify — the LIA for that signal must be updated to confirm that the necessity and balancing determinations still hold under the expanded collection scope.

**Changing the downstream use of signal outputs:** If role classification scores or buying group stage attributes produced by the 20 signals begin being used for purposes beyond web personalization — for example, if scores are used to make automated decisions with legal or significant effects on data subjects — the LIA must be updated to address the new processing purpose. A purpose that was not assessed in the existing LIA is not authorized by that LIA.

**Adding a new GDPR jurisdiction:** When the program extends operations to a new GDPR jurisdiction under the process in Section 4.6, the LIA must be confirmed as applicable to that jurisdiction or a jurisdiction-specific LIA supplement must be completed. The existing LIA applies to EU, UK, and EEA jurisdictions collectively; extension to jurisdictions with materially different data protection frameworks requires a separate assessment.

**Material change to the processing context:** Any material change to the program's processing context — including changes to the types of data subjects served, changes to the controller entity, or changes to the relationship between the program and the enterprise client — requires a LIA review to confirm that the balancing determination in Section 7.2.3 still holds under the new context.

---

### 7.5 Relationship to Document 2 and the Classification Registry

Document 2 (Signal Definition and Confidence Model), Section 10.3 records the outcome of the LIA for each of the 20 first-party behavioral signals in the form of consent classification values in `SIGNAL_CONSENT_REQUIREMENTS`. Document 9 governs the LIA process that produced those values. Document 9 specifies how the LIA is conducted, reviewed, retained, and updated; Document 2 records what the LIA determined for each signal. A change to the LIA findings must be reflected in Document 2's classification table and in `SIGNAL_CONSENT_REQUIREMENTS` — via a program change record filed by the Data Privacy Officer — before the change takes effect in the pipeline.

If a LIA update determines that a signal previously classified as `legitimate_interest` no longer satisfies the balancing test — for example, because the processing purpose has changed or the processing context has materially shifted — the signal must be reclassified as `explicit_consent_required` and suppressed immediately. The reclassification follows the conflict resolution process in Section 3.6: Document 9 is updated first, the program change record is filed, and `SIGNAL_CONSENT_REQUIREMENTS` is updated to reflect the new classification. The signal is suppressed in the pipeline from the moment the reclassification is recorded in Document 9 — it does not remain active while the data model update is pending.

---

*Document 9 — Privacy and Consent Architecture is complete. All seven sections approved by council. This document is the ninth and final document in the Kalder Personalization Hub Corpus.*
