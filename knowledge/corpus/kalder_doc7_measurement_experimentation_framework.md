# Document 7: Measurement and Experimentation Framework

**Kalder Personalization Corpus | Version: Locked Draft | Sections 1–7 Complete**
**Depends on:** Document 1 (Buying Group Role Architecture), Document 2 (Signal Definition and Confidence Model), Document 3 (Audience and Segmentation Architecture), Document 4 (Content Model and Taxonomy), Document 5 (Personalization Decisioning Rules), Document 6 (Buying Group Journey and Convergence Model), `kalder_data_model.py` §3, §11, §14
**Required by:** Document 8 (Operational Runbook)

---

## Section 1 — Document Scope and Canonical Status

Document 7 is the single authoritative source for the program's measurement architecture, metric hierarchy, experimentation standards, attribution model, known limitations, reporting cadence, and holdback design in the Kalder Buying Group Personalization Program. It owns the 24 metrics organized into three tiers (T1 Program Outcomes, T2 Buying Group Health, T3 Personalization Performance), the statistical methodology governing lift calculations, and the operational reporting procedures that keep measurements actionable. No other corpus document re-specifies metric definitions, re-designs the holdback structure, or extends the experimentation standards.

Five adjacent decisions are explicitly out of scope here. The role definitions and confidence tier thresholds that measurement must track but not redefine are owned by Document 1 (Buying Group Role Architecture). The scoring pipeline outputs that become measurement inputs (confidence tier, classification accuracy) are owned by Document 2 (Signal Definition and Confidence Model). The audience segment definitions and cohort architecture that form the measurement's population structure are owned by Document 3 (Audience and Segmentation Architecture). The content coverage completeness architecture and `pending_solution_fallback` event log that this document measures against are owned by Document 4 (Content Model and Taxonomy). The holdback group specification, fallback level routing outcomes, and progressive disclosure periodization boundary this document references are owned by Document 5 (Personalization Decisioning Rules) and Document 6 (Buying Group Journey and Convergence Model) respectively.

The metric definitions and statistical methodology in this document are the human-readable authority from which Snowflake reporting queries, Looker dashboard specifications, and quarterly review templates are derived. The canonical machine-readable entity definitions are in `kalder_data_model.py §11 METRIC_DEFINITIONS` and `§14 ENGAGEMENT_THRESHOLDS`. Any discrepancy between this document's metric specifications and the data model is a defect — the data model governs entity definitions; this document governs their diagnostic interpretation and operational application.

**What this document owns:** The rationale for the measurement architecture (Section 2), metric hierarchy and all 24 metric definitions (Section 3), experimentation standards and statistical thresholds (Section 4), attribution model and Champion Attribution Gap resolution (Section 5), known measurement limitations and mitigations (Section 6), reporting cadence and escalation protocol (Section 7), and holdback design and lift measurement methodology (Section 8).

**Delegation — what this document does not re-specify:**
- Buying group role definitions and behavioral signatures that measurements track → Document 1
- Signal scoring pipeline, confidence tier thresholds, and classification sequence → Document 2
- Audience segment definitions, cohort entry conditions, and TAL governance → Document 3
- Content coverage completeness hierarchy and `pending_solution_fallback` event log → Document 4
- Holdback group specification, fallback level routing, and Adobe Target activity configuration → Document 5
- Buying group stage model, convergence point velocity definition, and progressive disclosure periodization boundary → Document 6
- Operational implementation of reporting pipelines, dashboard build-out, and incident response for measurement failures → Document 8
- Consent-state conditions that affect data availability for measurement and analysis → Document 9

**Section numbering note.** Prose cross-references within this document have been reconciled to current heading numbers (cross-reference cleanup pass, 2026-06-21). Heading numbers are authoritative.

---

## Section 2: Why This Measurement Architecture

---

### 1.1 The Attribution Problem in Multi-Person Buying Groups

Enterprise software purchases do not have a single buyer. They have a buying group: a Champion who identifies the problem and builds the internal case, an Economic Buyer who controls the budget and makes the final call, Influencers who shape requirements, Users who evaluate fit, and Ratifiers who approve compliance and risk. Each role has a distinct information journey and produces distinct behavioral signals on kalder.com before a purchase closes.

Standard marketing attribution does not account for this structure. Last-touch attribution assigns 100% of conversion credit to the final event before a deal closes — typically a form submission, a demo booking, or a direct meeting request from the Economic Buyer. The problem is structural: the Economic Buyer's conversion event does not initiate in a vacuum. It is causally downstream of the Champion's content journey — competitive comparison page views, case study downloads, solution briefs forwarded to the EB via email or Slack — none of which produce a trackable conversion event attributable to the EB. Last-touch sees only the endpoint. Everything that produced that endpoint is credited at zero.

The investment consequence of this failure is systematic. A marketing team optimizing channel mix and content investment on last-touch data will continuously over-invest in assets that produce EB conversion events — demo request landing pages, ROI calculators, proposal templates — and chronically under-invest in the Champion-stage content that makes those conversion events possible. This is not a marginal measurement error; it is a structural bias that compounds over planning cycles and produces content portfolios misaligned with how buying groups actually advance.

Call this the **Champion Attribution Gap**: the systematic under-crediting of early-journey, non-converting role content in multi-person buying group contexts.

The program addresses this by aggregating outcomes at the account level, not the contact level. Credit is assigned to the buying group's collective journey — from initial account identification (`targeted`) through engagement (`engaged`), prioritization (`prioritized`), and qualification (`qualified`). A Champion's case study downloads and an Economic Buyer's demo request are both contributions to the same account-level progression event. When a cohort of accounts advances from `engaged` to `prioritized` at a higher rate than a holdback cohort, that advancement reflects the combined effect of the program's engagement with every buying group member who contributed to it.

This resolves the attribution question for measuring the program's effect on group-level outcomes. It does not eliminate all confounding. Accounts that progress may have had stronger pre-existing intent. The TAL may be skewed toward late-stage buyers. Selection bias is real. These limitations are addressed in the statistical methodology in Section 6; they are acknowledged here so that the account-level aggregation model is understood for what it is — a necessary improvement over last-touch, not a complete causal identification strategy.

---

### 1.2 Seller vs. Buyer Metrics: Two Instruments, One Scale, Different Questions

The program produces two distinct 0–100 scoring systems. Both use the same numeric range. They measure different things, answer different questions, and belong to different organizational audiences. Using one as a proxy for the other produces decisions that are wrong in predictable and avoidable ways.

The **Engagement Score** (`ENGAGEMENT_THRESHOLDS`, §14 of the data model) answers the question a revenue team asks: how urgently should we pursue this account? It aggregates individual member engagement intensity across identified buying group contacts to produce a deal-health signal at the account level. The tiers — `LOW_ENGAGEMENT` (0–39), `MEDIUM_ENGAGEMENT` (40–69), `HIGH_ENGAGEMENT` (70–100) — are calibrated to activation intensity. A `HIGH_ENGAGEMENT` account triggers BDR outreach, sales alerts, and convergence point monitoring. A `LOW_ENGAGEMENT` account with no active opportunity receives education-cohort content and no sales activation. The Engagement Score is a seller-centric instrument. Its owner is the Sales and Revenue Operations team.

The **Role Confidence Score** (`CONFIDENCE_TIERS`, §3 of the data model) answers a different question: how precisely can the personalization engine target this visitor? It reflects classification certainty for a specific contact in a specific solution category context. The tiers — `UNKNOWN` (<25), `LOW` (25–49), `MEDIUM` (50–79), `HIGH` (≥80) — govern which fallback level the content delivery system uses. A `HIGH` confidence visitor receives a fully personalized Level 1 experience. An `UNKNOWN` confidence visitor receives an industry vertical fallback. The Role Confidence Score is a buyer-centric instrument. Its owner is the Analytics and Content Operations team.

The numeric ranges do not align. A score of 72 is `HIGH_ENGAGEMENT` but `MEDIUM` confidence. A score of 45 is `LOW` confidence but `MEDIUM_ENGAGEMENT`. These are not equivalent assessments in different vocabularies; they are measurements of different things that happen to use the same scale. The data model carries an explicit cross-reference comment at the top of both §3 and §14 requiring engineers to namespace which scale they are working on before using either value.

The operational stakes of conflating these instruments: if a sales team routes outreach based on Role Confidence Score instead of Engagement Score, they will over-pursue accounts whose visitors the classification engine happens to know well, regardless of whether those accounts are showing commercial momentum. If the content operations team uses Engagement Score as a proxy for personalization readiness, they will assume highly engaged accounts have well-classified visitors — which is not guaranteed. High engagement without high confidence means the program is seeing a lot of activity it cannot yet interpret. Each instrument prevents a different category of decision from going wrong. Neither can substitute for the other.

---

### 1.3 The Three-Tier Metric Architecture

Document 7 organizes the program's 24 metrics into three tiers. The tiers are not ranked by importance. They are separated by audience, cadence, data source, and the question each tier is designed to answer. Collapsing them into a single reporting surface obscures the diagnostic logic the architecture is designed to support.

**T1 — Program Outcomes** sits at the top of the hierarchy by reporting cadence, not by measurement priority. T1 metrics are sourced from Salesforce, reviewed quarterly, and owned by Finance and executive stakeholders. The question T1 answers is: is the personalization program producing business outcomes at the opportunity and account level? T1 metrics include account-level pipeline attribution, qualified opportunity rate within personalized cohorts, and the cohort progression rate (T2-01) elevated to overall evaluation criterion. Finance and Sales recognize T1 metrics because they map directly to CRM events and revenue stages they already track.

**T2 — Buying Group Health** sits in the middle of the hierarchy. T2 metrics are sourced from AEP and Salesforce, reviewed monthly, and owned by Marketing Operations and Analytics teams. The question T2 answers is: are the buying group engagement signals that should produce T1 outcomes actually developing at the rates the program predicts? T2 includes role coverage metrics (what proportion of TAL accounts have identified contacts in key buying roles), engagement velocity (how quickly accounts are advancing through stages), and classification accuracy for the role confidence model. T2 metrics exist specifically to detect program health problems before they appear in quarterly T1 results.

**T3 — Personalization Performance** sits closest to the execution layer. T3 metrics are sourced from Adobe Target, Segment event data, and Snowflake, reviewed weekly and monthly, and owned by Analytics and Content Operations teams. The question T3 answers is: is the experience engine delivering personalized content that converts engaged visitors at a higher rate than non-personalized fallbacks? T3 includes session-to-engagement conversion rates by confidence tier, progressive disclosure completion rates by role, and content module performance by buying stage.

The tiers are independent. Strong T3 lift does not guarantee T2 stage progression. Strong T2 signals do not guarantee T1 outcomes. This independence is not a design flaw; it is the diagnostic structure the architecture requires. When T1 outcomes miss targets, the failure does not lie in the same place every time, and the tier architecture enables the program to tell them apart. A T1 miss with strong T2 signals points toward a late-stage sales problem: the buying group is engaged and progressing through the pipeline, but the sales motion or competitive environment is preventing deals from closing. The measurement program has nothing to offer there except the evidence that the problem is downstream of marketing's contribution. A T1 miss with weak T2 signals and strong T3 lift points toward a coverage problem: the experience engine is personalizing effectively for the visitors it reaches, but it is not reaching enough of the buying group to produce the stage progression the program requires. Section 7 specifies the full diagnostic protocol and escalation cadences; what the tier architecture establishes is the structural precondition for that diagnosis to be possible at all.

---

### 1.4 The Overall Evaluation Criterion

A program with 24 metrics produces a prioritization problem: when the program is working, which metric demonstrates it? When the program is failing, which metric confirms it? The OEC designation — Overall Evaluation Criterion — resolves that question by nominating a single summary metric whose movement determines whether the program is working. The program's OEC is **T2-01: Cohort Progression Rate**, the percentage of accounts in a personalized cohort that advance from one buying group stage to the next within a defined measurement window, compared against the holdback cohort.

The structural argument for this designation has four components. First, T2-01 is measured at the account and buying group level, not the individual visitor level. This is the correct unit of analysis for a program whose entire design premise is that buying decisions are made by groups, not individuals. A metric that rewards individual session engagement can be gamed by a single highly active visitor; T2-01 requires coordinated progression across a buying group, which is harder to produce accidentally and more meaningful when it occurs.

Second, T2-01 aggregates across roles. An account advancing from `engaged` to `prioritized` in the Kalder program requires engagement evidence from multiple contacts in multiple roles, not a single contact's extended activity. The metric therefore captures the multi-role engagement the program is designed to produce — and will not move on the strength of a single enthusiastic Champion without corroborating signals from the rest of the group.

Third, T2-01 tracks the full journey arc. Stage progression covers the transition through all four defined stages — `targeted`, `engaged`, `prioritized`, `qualified` — making it sensitive to program effects at any point in the pipeline, not just at the conversion endpoint where last-touch attribution collapses the entire journey.

Fourth, T2-01 is anchored to CRM events that Finance and Sales already recognize as meaningful. Stage transitions derive from Salesforce opportunity data and behavioral event thresholds specified in the data model (`§5 BG_STAGES`). When T2-01 moves, Finance can trace the movement to pipeline events they already track. This is not a secondary benefit; executive credibility for a personalization program depends on metrics that connect to instruments the business already trusts.

T2-01 has a known and documented limitation: quarterly cadence constrains its sensitivity. Kohavi's criterion for OEC selection requires the metric to be measurable with sufficient frequency to detect the minimum effect the program cares about. At quarterly cadence, the program requires at least two quarters of data — and in practice three to four — before T2-01 can detect a meaningful cohort difference with statistical confidence. A program that causes real stage acceleration will not show it in the first measurement window.

This limitation is addressed through two mechanisms. T2-01a, T2-01b, and T2-01c are stage-specific sub-metrics whose underlying trigger events — member identification, opportunity creation, and late-stage deal advancement — are CRM events that occur continuously. Although the formal aggregation window is quarterly, monitoring these events in near-real-time enables earlier detection of progression at specific pipeline transitions before overall cohort advancement is statistically visible. T3-02 — session-to-role-engagement conversion rate for personalized versus holdback visitors — serves as the primary T3 metric for shorter-cycle feedback, providing directional signal that the experience engine is performing between quarterly OEC readings.

One governance implication follows from this structure. When T2-01 and T3-02 diverge — when T3 shows statistically significant experience lift but T2-01 cohort progression is flat — the program investigates the gap. It does not declare success. T3 lift that does not translate into buying group stage advancement is informative, but it is not evidence that the program is working in the sense that matters: moving accounts toward qualified opportunities at a higher rate than the control condition. The gap between T3 lift and T2-01 progression is a diagnostic signal, most often pointing to visitor pool composition problems (the program is personalizing for visitors who are not in the buying group) or mid-funnel conversion failure (the buying group is engaging with personalized content but the content is not producing the coordinated action that drives stage transitions). Investigating that gap is part of the measurement program. Treating T3 lift as a sufficient proxy for T2-01 is not.

---

## Section 3: Metric Hierarchy

---

### 2.1 How to Read the Metric Inventory

Each metric entry in Sections 2.2 through 2.4 is specified using six standard fields and one "so what" field. The six standard fields are: **Metric ID and Name** (the unique identifier and plain-language name used consistently across all program reporting surfaces); **Definition** (the precise computation or measurement specification — ambiguous definitions produce ambiguous dashboards); **Data Source** (the system of record from which the metric is drawn — source conflicts between AEP, Salesforce, and Segment are resolved by Document 8 Section 5's weekly monitoring protocol); **Owner** (the role title responsible for monitoring the metric, flagging misses, and escalating failures — owner is a role, not an individual name); **Target** (the numeric or directional threshold that defines pass/fail for the metric, either a hard number or "Pending baseline"); and **Cadence** (the frequency at which the metric is formally reviewed in the program operating cadence).

The **so what** field is not a definition restatement. It specifies the decision the metric enables: who makes that decision, what the decision is, and what triggers a response. A metric without a decision owner is a number on a dashboard. The so what field is what makes it a management instrument.

Fourteen of the 24 metrics carry a target of "Pending baseline." This is not a permanent state. Baselines cannot be set before live program data exists — a pre-launch target is a guess, and a missed guess produces false alarm escalations. At the end of the first full quarter of live program data, the Analytics and Data Science Lead produces a baseline proposal document covering all pending metrics. The executive stakeholder and Revenue Operations Lead jointly approve the proposed baselines. Approved baselines are recorded in the program change record with the approval date, approving parties, and the first measurement period to which the approved baseline applies as the forward target. The full governance protocol for this process is specified in Section 2.5.

---

### 2.2 Tier 1: Program Outcomes

T1 metrics measure whether the personalization program is producing business outcomes at the opportunity and account level. Data source is Salesforce. Cadence is quarterly unless noted. Owner for all T1 metrics is the Analytics and Data Science Lead.

---

**T1-01 — Stage 2 to Stage 5 Conversion Rate**

- **Definition:** Percentage of opportunities advancing from Stage 2 (Discovery) to Stage 5 (Economic Buyer Validated) within a measurement quarter.
- **Data Source:** Salesforce.
- **Owner:** Analytics and Data Science Lead.
- **Target:** 20% increase quarter-over-quarter.
- **Cadence:** Quarterly.
- **So what:** Measures whether the personalization program is accelerating the critical pipeline transition where Economic Buyer validation occurs. A 20% QoQ increase indicates the program is producing faster EB engagement. A flat or declining rate despite strong T2 signals triggers a review of late-stage content effectiveness and sales handoff quality — not a review of early-stage acquisition content, which is a different failure mode.

---

**T1-02 — Win Rate — BG-Engaged**

- **Definition:** Percentage of Stage 2+ opportunities reaching Closed Won, segmented by buying group engagement level (Medium+ versus Low/None) at the time of opportunity creation.
- **Data Source:** Salesforce.
- **Owner:** Analytics and Data Science Lead.
- **Target:** 7%+ increase year-over-year.
- **Cadence:** Quarterly.
- **So what:** Isolates whether deals with broader buying group engagement win at higher rates than deals with minimal BG engagement. A sustained differential across four or more quarters justifies the program's investment in multi-role coverage. Absence of a differential after four quarters indicates either a measurement failure (buying group engagement is not being correctly attributed to deals) or a program design failure (multi-role engagement is not producing the commercial advantage the program hypothesizes).

---

**T1-03 — BG Contact Density on Opportunities**

- **Definition:** Percentage of Stage 2+ opportunities with two or more engaged buying group contacts attached.
- **Data Source:** Salesforce.
- **Owner:** Analytics and Data Science Lead.
- **Target:** 80%+. This is the only T1 metric with a hard target rather than a pending baseline. The 80%+ threshold is a structural program condition, not a baseline-calibrated outcome. It defines the minimum contact density required for the program's attribution logic to hold: if fewer than 80% of qualified opportunities have multi-contact buying group engagement, T1-01 and T1-02 outcomes cannot be attributed to personalization with any confidence.
- **Cadence:** Monthly.
- **So what:** The program's structural precondition metric. A drop below 80% triggers a review of contact identification and engagement coverage — not a review of content performance. The question is whether the program is reaching enough of the buying group before opportunity creation, not whether the content it delivers is effective.

---

**T1-04 — Average Deal Size — BG-Engaged vs. Non-BG**

- **Definition:** Mean net new annual contract value (NNACV) for opportunities with buying group engagement level Medium+ versus Low or no BG engagement.
- **Data Source:** Salesforce.
- **Owner:** Analytics and Data Science Lead.
- **Target:** Pending baseline.
- **Cadence:** Quarterly.
- **So what:** Investment allocation. If BG-engaged deals are materially larger than non-BG deals after two quarters of data, the program justifies increased investment in contact identification and engagement coverage. If the differential is not statistically meaningful, the investment case shifts from deal size to pipeline velocity (T1-05). T1-04 and T1-05 together constitute the program's financial justification layer; the Analytics and Data Science Lead presents both metrics jointly to Finance when making investment recommendations.

---

**T1-05 — Pipeline Velocity — BG-Engaged**

- **Definition:** Median days from Stage 2 to Stage 5, segmented by buying group engagement level.
- **Data Source:** Salesforce.
- **Owner:** Analytics and Data Science Lead.
- **Target:** Pending baseline.
- **Cadence:** Quarterly.
- **So what:** Velocity is the business case metric when deal size differential (T1-04) is not yet statistically meaningful. A consistent velocity advantage for BG-engaged opportunities — even before T1-04 is calibrated — demonstrates the program's value to pipeline efficiency and provides the Finance team an ROI argument that does not depend on deal size premium. A velocity advantage of 15%+ for BG-engaged deals constitutes a standalone investment justification.

---

**T1-06 — Net New Pipeline — TAL**

- **Definition:** Total pipeline value within the target account list, broken out by solution category and campaign cohort.
- **Data Source:** Salesforce + AEP (cohort tag).
- **Owner:** Analytics and Data Science Lead.
- **Target:** Pending baseline.
- **Cadence:** Monthly.
- **So what:** The program's contribution to the revenue pipeline at the population level, not just individual deal health. Rising TAL pipeline by cohort indicates the program is generating new pipeline, not only improving existing deal quality. Flat TAL pipeline combined with improving T1-01 indicates the program is optimizing existing pipeline but not yet generating net new — a pattern that signals the education cohort content or account identification is underperforming, not the late-stage content.

---

### 2.3 Tier 2: Buying Group Health

T2 metrics measure whether the buying group engagement signals that should produce T1 outcomes are developing at the rates the program predicts. Data sources are AEP and Salesforce unless noted. Owner for all T2 metrics is the Analytics and Data Science Lead.

---

**T2-01 — Cohort Progression Rate (OEC)**

- **Definition:** Net percentage of buying groups advancing from one campaign cohort to the next within a measurement quarter, compared against the holdback cohort.
- **Data Source:** Salesforce + AEP.
- **Owner:** Analytics and Data Science Lead.
- **Target:** Pending baseline.
- **Cadence:** Quarterly.
- **OEC Designation:** T2-01 is the program's Overall Evaluation Criterion — the single summary metric whose movement determines whether the program is working. An account's buying group is counted as progressing when it fires at least one sub-metric progression event (T2-01a, T2-01b, or T2-01c) within the quarter. Sub-metrics are monitored individually to identify which pipeline transition is lagging; T2-01 aggregates them as a logical OR at the account level. The underlying trigger events occur continuously via the Salesforce-to-AEP Kafka pipeline; near-real-time sub-metric monitoring enables earlier detection of progression than waiting for the quarterly T2-01 aggregation.
- **So what:** The program's summary judgment metric. When T2-01 rises relative to the holdback cohort, the program is accelerating buying group advancement. When T2-01 is flat despite strong T3 signals, the program investigates whether the visitor pool matches the buying group (visitor pool composition problem) or whether engaged visitors are not translating to group-level stage transitions (mid-funnel conversion problem). T3 lift that does not produce T2-01 movement is not evidence the program is working.

---

**T2-01a — Education → Acquisition Progression**

- **Definition:** Buying group member identification event — the buying group gained two or more identified members with engagement, triggering cohort advancement from education to acquisition.
- **Data Source:** Salesforce + Kafka.
- **Owner:** Analytics and Data Science Lead.
- **Target:** Pending baseline.
- **Cadence:** Quarterly (event monitored continuously; formally aggregated quarterly).
- **So what:** Indicates whether the program is generating the initial buying group membership identification that enables all downstream activity. A lagging T2-01a rate relative to T2-01b and T2-01c indicates the program is losing accounts at the earliest pipeline transition — education content or account identification is failing before buying group engagement can begin.

---

**T2-01b — Acquisition → Progression Transition**

- **Definition:** Opportunity creation event — the buying group reached qualified status with a Stage 1+ Salesforce opportunity created.
- **Data Source:** Salesforce.
- **Owner:** Analytics and Data Science Lead.
- **Target:** Pending baseline.
- **Cadence:** Quarterly (event monitored continuously; formally aggregated quarterly).
- **So what:** The transition from marketing-owned to sales-owned pipeline. A lagging T2-01b rate indicates the program is building buying group engagement but not converting it to qualified pipeline. The diagnostic question is whether the sales team is failing to action BG signals or whether the engagement is not reaching the Economic Buyer and Champion combination required to trigger opportunity creation. These are different failure modes with different corrective actions. The diagnostic is T2-02 (Champion Identification Rate) and T2-03 (Multi-Role BG Coverage) read jointly: if both are healthy for lagging-T2-01b accounts, the failure mode is sales-side — BG signals are present but not being actioned. If T2-02 or T2-03 is low for those same accounts, the failure mode is coverage — the Champion and Economic Buyer have not yet been identified, and opportunity creation is lagging because the signals that trigger sales engagement haven't been generated.

---

**T2-01c — Progression Early-to-Mature → Win Now**

- **Definition:** Deal execution event — the opportunity advanced from Stage 2–4 to Stage 5+, indicating Economic Buyer validation has occurred.
- **Data Source:** Salesforce.
- **Owner:** Analytics and Data Science Lead.
- **Target:** Pending baseline.
- **Cadence:** Quarterly (event monitored continuously; formally aggregated quarterly).
- **So what:** Late-stage acceleration signal. A lagging T2-01c rate — when T2-01a and T2-01b are healthy — indicates the program is generating and qualifying pipeline but not accelerating late-stage deals. This pattern points to content effectiveness failure at the progression cohort: the program's converge-phase content or late-stage Economic Buyer targeting is underperforming. It is not an acquisition problem and should not trigger a review of education or acquisition content.

---

**T2-02 — Champion Identification Rate**

- **Definition:** Percentage of qualified opportunities with an identified Champion contact at MEDIUM+ role confidence.
- **Data Source:** Salesforce + AEP.
- **Owner:** Analytics and Data Science Lead.
- **Target:** Pending baseline.
- **Cadence:** Monthly.
- **So what:** The Champion is the through-line carrier of the buying group journey — the role who builds the internal case and drives convergence. Low Champion identification rate at qualified opportunities means the program is closing deals without knowing who drove them. This limits the program's ability to identify the content patterns that produce wins, calibrate Champion-specific content investment, and replicate winning patterns at scale.

---

**T2-03 — Multi-Role BG Coverage**

- **Definition:** Percentage of qualified opportunities with contacts identified at MEDIUM+ role confidence across three or more distinct buying group roles.
- **Data Source:** Salesforce + AEP.
- **Owner:** Analytics and Data Science Lead.
- **Target:** Pending baseline.
- **Cadence:** Monthly.
- **So what:** Breadth of buying group coverage. Low multi-role coverage means the program is personalizing for one or two roles while the remainder of the buying group receives generic content — which undermines the program's core premise that multi-role coverage drives deal outcomes. T2-03 is the metric that identifies which role coverage gaps to prioritize in the content commissioning backlog. A role that appears in fewer than 50% of qualified opportunities at MEDIUM+ confidence is a commissioning priority.

---

**T2-04 — Buying Job Coverage**

- **Definition:** Percentage of buying groups with at least one buying job at INFERRED or KNOWN confidence by stage transition.
- **Data Source:** AEP.
- **Owner:** Analytics and Data Science Lead.
- **Target:** Pending baseline.
- **Cadence:** Monthly.
- **So what:** Three-axis personalization activation rate. If Buying Job Coverage is low, the program is defaulting to two-axis (role × stage) personalization and missing the precision gains of three-axis (role × stage × buying job) targeting for HIGH-confidence visitors. Low coverage triggers one of two reviews: buying job inference model calibration (if signals are present but inference is failing) or content library gap analysis (if inference is working but three-axis content variants do not exist for the inferred buying job).

---

**T2-05 — Progressive Disclosure Response Rate**

- **Definition:** Percentage of eligible visitors responding to progressive disclosure prompts, broken out by variant: Level 2 (role confirmation), Level 3 (explicit role selection), Level 4 (evaluation context).
- **Data Source:** Segment + AEP.
- **Owner:** Analytics and Data Science Lead.
- **Target:** Pending baseline.
- **Cadence:** Monthly.
- **Cross-variant constraint:** Cross-variant benchmarking is invalid by design. Level 2 asks for confirmation of an already-inferred state (lowest cognitive commitment; highest expected response rate). Level 3 asks for explicit role selection from five options (higher commitment; lower expected rate). Level 4 asks for evaluation context from a visitor who has seen limited content (lowest expected rate). Variant-specific baselines must be established independently. Level 4 response rates must not be compared to Level 2 baselines.
- **So what:** Value exchange effectiveness. If Level 2 response rates are low, the prompt design is failing to convert visitors who are strong candidates for zero-party classification. If Level 3 response rates collapse relative to Level 2, the five-role selection interface requires UX revision. Progressive disclosure is the primary mechanism for reaching HIGH role confidence; a sustained low response rate at any level constrains the ceiling on three-axis personalization activation.

---

**T2-06 — Role Classification Accuracy**

- **Definition:** Accuracy of behavioral role classification against declared or CRM-matched ground truth, aggregated from weekly Check 7 snapshots from Document 8 Section 5. Specifically: the percentage of behaviorally classified visitors whose classification matches their CRM role label when CRM data subsequently becomes available. Weekly snapshots from Document 8 Section 5 are required inputs and must be preserved regardless of whether an escalation occurred in a given week.
- **Data Source:** Signal model vs. Salesforce CRM. T2-06 is computed monthly by aggregating the weekly Check 7 role confidence distribution snapshots from Document 8 Section 5. Weekly snapshots are required inputs and must be preserved in the monitoring record regardless of whether an escalation occurred; the monthly T2-06 computation draws from these preserved snapshots, not from a fresh monthly query.
- **Owner:** Analytics and Data Science Lead.
- **Target:** 60% minimum.
- **Cadence:** Monthly.
- **Distinction from T3-07:** T2-06 measures whether the overall role classification system is producing reliable outputs at the buying group health level. It uses CRM retrospective match as its computation method. T3-07 measures behavioral classification accuracy for anonymous TAL visitors specifically, using a randomized progressive disclosure experiment as its primary validation method and treating CRM retrospective match as secondary due to survivor bias. These are not the same metric and must not be used interchangeably.
- **So what:** Signal model health. A T2-06 score below 60% for any role triggers a signal weight review for that role. The Analytics and Data Science Lead flags the specific role with the lowest accuracy; the Platform Engineer investigates whether the degradation is a model drift issue or a data pipeline issue. The two failure modes require different responses and must be distinguished before any remediation action is taken.

---

**T2-07 — Coverage Gap Resolution Rate**

- **Definition:** Percentage of `pending_solution_fallback` escalations resolved within one commissioning sprint cycle.
- **Data Source:** AEP (fallback event log) + Content Ops sprint record.
- **Owner:** Analytics and Data Science Lead.
- **Target:** Pending baseline.
- **Cadence:** Monthly.
- **So what:** Sprint prioritization signal. If the resolution rate drops below one sprint cycle, the content gap backlog is growing faster than production capacity. Content Ops must either add sprint capacity, deprioritize lower-coverage solution categories, or accept that specific role × solution category combinations will remain in fallback for an extended period. The decision about which gap to accept is a commissioning prioritization call, not a measurement call; T2-07 surfaces when that decision is required.

---

**T2-08 — Holdback Parity Check**

- **Definition:** Comparison of buying group stage progression rates between holdback and treatment populations.
- **Data Source:** AEP + Salesforce.
- **Owner:** Analytics and Data Science Lead.
- **Target:** No lift expected — parity is the pass condition.
- **Cadence:** Quarterly.
- **Pass/fail logic:** T2-08 passes when treatment and holdback cohorts show statistically equivalent stage progression rates before the program has had sufficient time to produce divergence. A pass confirms that holdback assignment (10% deterministic hash, not reassignable) is correctly distributing accounts across control and treatment. A fail means the holdback assignment mechanism is broken and all lift calculations in the program are invalid until corrected. T2-08 is not a lift metric. A T2-08 pass is not evidence the program is working. A T2-08 fail is not evidence the program is not working. T2-08 measures randomization integrity only.
- **So what:** Measurement integrity gate. If T2-08 fails at any quarterly review, all T2-01 lift calculations for that quarter are suspended pending investigation. No program performance conclusions may be drawn from T2-01 or its sub-metrics while T2-08 is in a fail state.

---

**T2-09 — Convergence Point Progression Rate**

- **Definition:** Percentage of opportunities that advance from one convergence point to the next within 30 days of convergence-enabling content (consensus brief, executive brief, risk mitigation plan) being served to the buying group. Proxy signals: Champion re-engagement after content distribution (indicating internal distribution occurred); multi-role account engagement within a 7-day window after a consensus brief is served; Salesforce opportunity stage advancement within 30 days.
- **Data Source:** AEP + Salesforce (convergence point events).
- **Owner:** Analytics and Data Science Lead.
- **Target:** Pending baseline.
- **Cadence:** Monthly.
- **So what:** Converge-phase effectiveness. T2-09 is the only T2 metric that measures the converge phase of the double-diamond model. It tests whether content served at convergence points is moving the buying group toward group-level alignment rather than producing individual role engagement that does not advance the collective decision. A low T2-09 rate with strong individual T3 engagement indicates the program is activating individual roles but failing at the convergence function that drives opportunity stage advancement.

---

### 2.4 Tier 3: Personalization Performance

T3 metrics measure whether the experience engine is delivering personalized content that converts engaged visitors at higher rates than non-personalized fallbacks. Data sources are Adobe Target, Segment, and Snowflake unless noted. Cadence is monthly per activity unless noted.

---

**T3-01 — Conversion Rate by Identification Layer**

- **Definition:** Conversion rate segmented by identification layer: Account-level identification only; Buying Group Stage identification; Role-level identification.
- **Data Source:** Segment / Snowflake.
- **Owner:** T&O Lead.
- **Target:** Pending baseline.
- **Cadence:** Monthly per activity.
- **So what:** Quantifies the incremental value of each identification layer. If role-identified visitors convert at materially higher rates than account-only-identified visitors, the program's investment in progressive disclosure and role classification is justified by a measurable behavioral effect. If the conversion lift from role identification over account identification is not statistically meaningful, the program investigates whether role-specific content is sufficiently differentiated from account-level content to produce a distinct behavioral response.

---

**T3-02 — Personalization Lift vs. Default**

- **Definition:** Conversion rate lift of the personalized experience versus the default experience, per Adobe Target activity.
- **Data Source:** Adobe Target + Segment.
- **Owner:** T&O Lead.
- **Target:** Statistically significant at 95% confidence.
- **Cadence:** Monthly per activity.
- **Primary T3 metric designation:** T3-02 is the program's primary T3 metric and shortest-cycle feedback signal between quarterly OEC readings. It is not the OEC. It measures visitor-level experience outcomes, not account-level buying group outcomes. When T3-02 shows statistically significant lift but T2-01 is flat, the program investigates visitor pool composition (whether the visitors receiving personalized experiences are members of the actual target buying groups) or mid-funnel conversion failure (whether individual conversion events are translating to group-level stage transitions).
- **So what:** Experience effectiveness at the activity level. T3-02 determines whether individual personalization activities are worth continuing, scaling, or retiring. An activity that does not reach 95% significance after three full months of qualified traffic is a candidate for redesign, not for extended runtime.

---

**T3-03 — ePDF Engagement Depth**

- **Definition:** Scroll depth, page views, and time-on-page for embedded PDF content served through the personalization engine.
- **Data Source:** Segment (custom events).
- **Owner:** T&O Lead.
- **Target:** Pending baseline.
- **Cadence:** Monthly.
- **So what:** Content effectiveness for the highest-investment asset type. ePDF content requires the most production effort per asset in the content inventory. Low engagement depth — visitors opening embedded PDFs but not scrolling past the first third — indicates a role-match problem (wrong content served to wrong role) or a content quality problem (correct content, insufficient relevance). The diagnostic between these two failure modes is T3-04: if the same content produces high engagement for one role and low for another, it is a role-match problem; if it underperforms across all roles, it is a content quality problem.

---

**T3-04 — Engagement by Role**

- **Definition:** Engagement metrics (session duration, page depth, return visit rate, content interaction events) segmented by classified role for personalized experiences.
- **Data Source:** Segment + AEP segment.
- **Owner:** T&O Lead.
- **Target:** Pending baseline.
- **Cadence:** Monthly.
- **So what:** Role-specific content effectiveness. If Economic Buyer-classified visitors are engaging deeply with Champion-oriented content, the classification model has a confusion problem between those two roles. If Champion-classified visitors are bouncing from Champion-specific content, the content is misaligned with Champion behavioral expectations as established in Document 1 (Buying Group Role Architecture). T3-04 is the primary diagnostic for distinguishing classification model failure from content design failure.

---

**T3-05 — Form Capture Rate**

- **Definition:** Form conversion rate for role identification and progressive disclosure forms.
- **Data Source:** Segment.
- **Owner:** T&O Lead.
- **Target:** Pending baseline.
- **Cadence:** Monthly.
- **So what:** Zero-party data acquisition rate. A sustained low T3-05 rate constrains the number of visitors who can reach HIGH role confidence, which requires zero-party confirmation combined with behavioral corroboration. HIGH role confidence is the prerequisite for Level 1 personalization (the program's most targeted experience). A sustained low T3-05 rate triggers a value exchange design review — whether the progressive disclosure prompts are offering sufficient value to motivate completion — before any other intervention.

---

**T3-06 — Auto-Personalization Lift Validation**

- **Definition:** Conversion rate lift of Adobe Target's Auto-Personalization (AP) model-selected experiences versus manually allocated experiences, per activity.
- **Data Source:** Adobe Target.
- **Owner:** T&O Lead.
- **Target:** Statistically significant lift.
- **Cadence:** Quarterly (post-AP launch).
- **Activation condition:** This metric is not active until the AP model has launched. Pre-AP launch, T3-06 is reported as "not yet active." Do not include T3-06 in quarterly reporting prior to AP launch.
- **So what:** Model trust. If AP-selected experiences do not outperform manual allocation at statistical significance after two quarters of operation, the ML model is not outperforming human judgment for this activity. The program then reviews the AP training data, the feature set, and whether the activity has sufficient traffic volume to train the model effectively before adding any further model complexity.

---

**T3-07 — Anonymous Behavioral Targeting Accuracy**

- **Definition:** Accuracy of behavioral role classification for anonymous TAL visitors — the percentage of visitors for whom the behavioral inference model's role prediction matches their declared role.
- **Data Source:** Signal model vs. progressive disclosure declared role (primary); signal model vs. subsequent Salesforce CRM match (secondary).
- **Owner:** Analytics and Data Science Lead.
- **Target:** Pending baseline.
- **Cadence:** Quarterly.
- **Primary validation method:** Randomized progressive disclosure experiment. For a statistically defined sample of anonymous visitors at MEDIUM+ role confidence, the program surfaces a role-confirmation prompt and compares the declared role to the inferred role. This provides an unbiased accuracy estimate unaffected by the survivor bias present in CRM retrospective matching. Power calculation inputs (data model v0.2.0 §11 CR-10): target accuracy differential of 15 percentage points; minimum confidence interval of 95%; minimum sample size computed from the expected MEDIUM+ visitor base rate by the Analytics and Data Science Lead before the first validation run. "TBD — set at baseline" is not an acceptable steady-state answer for minimum sample size.
- **Secondary validation method:** CRM retrospective match — signal model prediction versus subsequent Salesforce CRM match for visitors who later identified. Retained as supplementary signal. Acknowledged to carry survivor bias: only contacts who eventually identify are matchable, which systematically underrepresents classification accuracy for visitors who never convert.
- **Distinction from T2-06:** T3-07 measures classification accuracy for anonymous TAL visitors using a randomized experiment as the primary method. T2-06 measures overall classification system accuracy at the buying group health level using CRM retrospective match as its computation method. These metrics are not interchangeable and must not be reported as equivalent.
- **So what:** Signal model calibration. A T3-07 accuracy rate above the established baseline confirms the behavioral classification model is reliably identifying anonymous visitor roles, and that three-axis personalization content served to HIGH-confidence visitors is reaching the correct roles. A sustained drop below baseline triggers a signal weight review for the specific roles with the lowest accuracy rates, not a global model retrain.

---

### 2.5 Baseline Governance Protocol

Fourteen of the 24 metrics in this section carry a target of "Pending baseline." The following protocol governs when and how baselines are set, who approves them, and what happens when an approved baseline is subsequently missed.

**When baselines are set.** The Analytics and Data Science Lead produces a baseline proposal document at the end of the first full quarter of live program data. "First full quarter" means the first complete 13-week period in which the program was fully operational — all holdback assignments active, all Target activities live, and all AEP pipelines confirmed running. Partial quarters during ramp do not qualify.

**Who proposes baselines.** The Analytics and Data Science Lead. The baseline proposal document specifies, for each pending metric: the observed value from the first full quarter, the proposed forward target and the rationale for its direction and magnitude, and the confidence interval within which the proposed target falls. The document is distributed to the executive stakeholder and Revenue Operations Lead no later than two weeks after the quarter closes.

**Who approves baselines.** The executive stakeholder and Revenue Operations Lead, acting jointly. Neither party approves unilaterally. Disagreements between the two approving parties are escalated to the program executive sponsor for resolution within five business days of the escalation.

**Where approved baselines are recorded.** In the program change record, with four required fields: the approved baseline value for each metric, the approval date, the names and titles of the approving parties, and the first measurement period to which the baseline applies as the forward target. The change record entry is the authoritative source. Dashboard configurations are updated to reflect approved baselines within one week of the change record entry date.

**What triggers escalation when baselines are missed.** When any baselined metric misses its approved target by more than 20% for two consecutive quarters, the Analytics and Data Science Lead produces a diagnostic memo within three weeks of the second consecutive miss. The memo identifies whether the miss is: (a) a program performance failure — the personalization program is not producing the expected effect; (b) a measurement failure — the metric is not accurately capturing the underlying reality it was designed to measure; or (c) a market condition outside the program's control — external factors are suppressing outcomes that the program cannot offset. The memo is presented to the executive stakeholder and Revenue Operations Lead in a dedicated review session. The review session produces one of three outcomes: a corrective action plan with owner and deadline; a target recalibration with rationale entered into the program change record; or a formal program escalation to the executive sponsor if the diagnostic memo cannot distinguish between failure modes (a) and (b).

---

## Section 4: Experimentation Standards

---

### 3.1 Confidence Interval Standard

The minimum confidence interval for all lift claims in this program is 95% (alpha = 0.05). A lift claim is any assertion that a personalized experience outperforms the control condition that is used to make or justify a program investment decision — including activity continuation, content variant scaling, audience expansion, and budget allocation. The 95% CI requirement is not a reporting preference; it is the threshold below which a result may not be characterized as a finding.

The 95% CI requirement governs three metrics: T3-02 (Personalization Lift vs. Default), T3-06 (Auto-Personalization Lift Validation), and the T3-07 randomized progressive disclosure accuracy experiment. It does not govern T2-08 (Holdback Parity Check). T2-08 is a statistical equivalence test — its pass condition is parity between treatment and holdback cohorts, not directional significance — and directional thresholds do not apply to equivalence testing.

Results that have not reached 95% CI are directional signals. In monthly and quarterly reporting, directional signals appear in a designated "directional signals" section with an explicit label identifying their status. A directional signal may not be cited in an investment recommendation, an activity retirement decision, or a program performance claim. The label must read: "Directional signal — below 95% CI threshold. Not decision-ready." Removing or softening this label in any reporting deliverable requires written approval from the Analytics and Data Science Lead and produces a revision note in the program change record.

---

### 3.2 Holdback Group as Control Condition

The holdback group is the program-wide control condition against which all personalization lift is measured. Ten percent of TAL contacts per cohort are assigned to holdback at first TAL identification. Assignment is deterministic: a hash of the visitor's stable identifier — `contact_id` for identified visitors, anonymous identifier for unidentified TAL-matched visitors — produces a value in the range [0, 100). Visitors whose hash value falls in [0, 10) are assigned to holdback. The `holdback_group` attribute is written to the visitor's AEP profile at first TAL identification and does not change for the duration of the pre-sale lifecycle. Cohort transitions — moving from education to acquisition to progression — do not reset holdback assignment.

The program maintains four cohort-level holdback groups: `holdback_education`, `holdback_acquisition`, `holdback_progression_early`, and `holdback_progression_win_now`. All four use the same assignment mechanism. A holdback visitor in any cohort receives the Level 5 default brand experience — the same experience a non-TAL visitor would receive — regardless of their classification state. Signal collection and scoring continue normally for holdback visitors; holdback suppresses personalized experience delivery, not behavioral data collection.

This is a valid control condition because the holdback visitor is a TAL-identified, classifiable member of the addressable population who receives the counterfactual experience: what the buying group member would have experienced if the personalization program had not existed. This is cleaner than a pre-post comparison, which confounds program effects with seasonal variation and market changes, and cleaner than a matched-account comparison, which cannot control for the unobservable selection factors that put accounts on the TAL in the first place.

**`progression_win_now` exception.** Unlike the other three cohort holdback groups, `holdback_progression_win_now` may be reduced below the standard 90-day minimum to a floor of 5% upon Revenue team review at 30 days post-activation, if the holdback group is creating measurable revenue risk. This exception is cohort-specific. It does not constitute precedent for reducing any other cohort's holdback percentage within the 90-day window.

**What invalidates the control condition.** T2-08 failure. When T2-08 fails at a quarterly review, the holdback assignment mechanism has produced a non-random split between treatment and holdback. All lift calculations from the affected quarter are suspended — not only calculations from the period after the failure was detected, because the imbalance may have been present since quarter start. No lift-based program performance claims may be made while T2-08 is in a fail state. Resolution requires investigation of the hash assignment mechanism and written confirmation that the `holdback_group` attribute is writing correctly to AEP profiles before the next quarter's lift calculation proceeds.

**Compound holdback state.** A visitor who is simultaneously assigned to holdback and routing through `pending_solution_fallback` (a solution category without complete content coverage) represents a compound measurement state. These visitors are in the control group for lift measurement and unable to receive Level 1 or Level 2 experiences regardless of holdback status — both conditions suppress the same experience tier independently. When analyzing Level 3 lift measurements, the `pending_solution_fallback` event log must be joined to the holdback assignment log on visitor identifier to isolate compound-state visitors. Unadjusted Level 3 lift that includes compound-state visitors in the holdback group conflates the holdback control effect with the content coverage gap effect. The compound-state population must be excluded from, or separately reported in, all holdback lift analyses.

---

### 3.3 OEC Primacy Rule

T2-01 (Cohort Progression Rate) is the program's Overall Evaluation Criterion. The OEC primacy rule is a governance rule: when T3-02 shows statistically significant lift but T2-01 is flat or negative for the same measurement period, the program does not declare success.

The failure mode this rule prevents is a category error. T3 lift measures visitor-level conversion outcomes. T2-01 measures account-level buying group stage advancement. These are different things. T3 lift that does not produce T2-01 movement is a diagnostic signal indicating one of two problems: visitor pool composition mismatch — the visitors receiving personalized experiences are not in the actual buying groups for the target accounts — or conversion aggregation failure — buying group members are engaging with personalized content but that engagement is not producing the coordinated action that drives stage transitions. Either case requires investigation. Neither case permits a success declaration.

**Investment scaling rule.** Increasing investment in a personalization activity — adding content variants, expanding Target audiences, adding budget — requires both T3-02 statistical significance at 95% CI and at least one full quarter of T2-01 data in the same cohort before the investment decision is made. T3-02 statistical significance alone is not sufficient justification for investment scaling. A result showing T3-02 lift without accompanying T2-01 cohort data is directional; it may inform roadmap prioritization but may not authorize budget commitment or content production expansion.

---

### 3.4 Power Calculation Framework

The 10% holdback percentage is the v1 starting hypothesis. It was set without baseline traffic data. Document 7's power calculation governs whether that percentage is sufficient: if the power calculation shows that 10% holdback produces insufficient sample at the treatment side to detect the minimum effect the program cares about at 80% power, the holdback percentage must be adjusted upward. The adjustment governance is specified in Document 5, Section 7.3 (5%–20% range requires Analytics Lead proposal plus change record entry; above 20% requires council review). Whether adjustment is required is determined here.

For both T3-02 (binary conversion event lift) and T2-01 (cohort progression rate comparison), the two-proportion z-test applies. The required minimum sample size per group is:

**n = 2 × ((z_α/2 + z_β)² × p(1−p)) / δ²**

Where: p = baseline conversion or progression rate, observed from the first full quarter of live data; δ = minimum detectable effect, the smallest lift the program would act upon; z_α/2 = 1.96 (two-tailed, alpha = 0.05); z_β = 0.84 (power = 80%). The working assumption for the T2-01 MDE is a 5 percentage point difference in cohort progression rate between treatment and holdback. This assumption must be confirmed at baseline when observed progression rates become available. The Analytics Lead may revise the MDE with documented rationale; any revision is entered in the program change record before the revised MDE is used in a power calculation.

**Critical distinction for T2-01.** T2-01 is an account-level metric. In the power calculation, n refers to accounts — buying groups — not individual visitors or sessions. Multiple visitors from the same buying group share account-level outcomes; they are correlated observations, not independent ones. A power calculation that substitutes visitor counts for account counts on an account-level OEC will produce an inflated power estimate and an insufficient actual sample. The Analytics Lead must use account counts when computing the T2-01 power calculation.

**Novelty effect window.** The first 60–90 days of any new personalization activity exhibit novelty effects that inflate measured lift. Results from within the novelty window are observational only. The following decisions may not be made on novelty-window results for any cohort other than `progression_win_now`: holdback percentage reduction; activity retirement; investment scaling. The `progression_win_now` exception applies only to the 30-day Revenue team review of holdback percentage, and only when measurable revenue risk is present. Novelty-window lift must be labeled as observational in all reports and may not appear in the "decision-ready findings" section of any reporting deliverable.

**Holdback reduction prohibition.** No cohort's holdback percentage may be reduced below 5% within the first 90 days of v1 launch. This applies even when the power calculation shows 10% is more than sufficient. Reducing holdback within the novelty window creates a statistical artifact: the pre-reduction and post-reduction periods have different control group sizes, which complicates quarter-level lift aggregation and renders the quarter's T2-01 calculation unreliable.

---

### 3.5 Adobe Target A/B Testing Conventions

Four conventions govern all Adobe Target activities in the program. Violations produce the consequences specified below; they are not discretionary.

**(a) Pre-specification requirement.** Every Target activity must have a primary conversion metric defined and recorded in the activity documentation before the activity launches. The primary metric must correspond to one of the 24 metrics specified in Section 2; for experience lift activities, this is T3-02. An activity whose primary metric is defined after launch has its results quarantined: they may not be used in any reporting, investment decision, or program performance claim until the activity is re-run with a pre-specified metric and the re-run reaches the power calculation minimum sample size.

**(b) Minimum traffic threshold — no peeking.** Results may not be read or acted upon until the sample size required by the power calculation for that activity's primary metric is reached. Target's automatic significance notification is not a substitute for the power calculation minimum — it may fire before the minimum sample is reached and must not be treated as a trigger for action. Any result observed before the minimum sample size is reached is observational only, regardless of what Target's reporting surface shows. The Analytics Lead is responsible for confirming that the power calculation minimum has been reached before including any activity's results in formal reporting.

**(c) Activity naming convention.** All Target activities must follow the naming pattern `[CohortCode]-[AxisCode]-[SolutionCode]-[RoleCode]-[ActivityNumber]`. This naming convention is required for cross-referencing between Target reporting and Section 2 metric IDs. An activity that does not follow the convention may not be included in formal reporting until renamed. The full convention definition is in Document 8.

**(d) Holdback exclusion enforcement.** All Target activities in the 1000–6999 priority range must include an explicit audience exclusion for visitors where `holdback_group = True`. The holdback activities at priorities 5951–5954 serve the Level 5 default to holdback visitors; no personalization activity at any other priority range may serve to holdback visitors. The exclusion must be implemented as an explicit audience condition in the Target activity — not as the assumed result of the holdback activities intercepting traffic first. A misconfigured activity cascade could allow a personalization activity to serve a holdback visitor if a holdback gate failed to fire; the explicit audience exclusion is the failsafe that prevents this.

---

## Section 5: Attribution Model

---

### 4.1 Why Last-Touch Attribution Fails (Summary for Section 4 Context)

Last-touch attribution assigns 100% of conversion credit to the final trackable event before a deal closes. In buying groups, this systematically erases upstream role contributions — the Champion's content journey, the Influencer's requirements validation, the Ratifier's compliance review — from the attribution record, producing an investment model that chronically under-funds the content that makes conversions possible. This program therefore attributes credit to the buying group's collective journey and assigns primary outcomes at the account level, not to the converting contact's last action. Section 2 contains the full argument; Section 5 specifies the mechanics that operationalize it.

---

### 4.2 The Attribution Unit: Account, Not Contact

All T1 (Program Outcomes) and T2 (Buying Group Health) attribution operates at the account level. An "account" in this context is a Salesforce account record with one or more identified TAL contacts in the relevant campaign cohort. Attribution events for T1 and T2 — opportunity creation, Salesforce stage transitions, deal close — belong to accounts and are analyzed at the account level.

Individual contact-level conversion events — form submissions, demo bookings, progressive disclosure responses — are inputs to three things: session-level T3 metrics (Personalization Performance), behavioral signal collection that updates the contact's classification profile, and the contact's contribution to their buying group's collective engagement evidence. They are not the primary attribution unit for T1 or T2 outcome measurement. A Champion who submits a form and triggers a T3-02 measurement event does not thereby cause their account's next Salesforce stage transition to be attributed to that form submission. The T3 and T1/T2 attribution chains are independent. They may co-occur; one does not determine the other.

Account-level attribution does not require every contributing contact's session to be individually tracked. The buying group's collective outcome — the stage transition, the opportunity creation — is the attribution event. Individual sessions that contributed to it, including the Champion's dark social content forwarding that brought the Economic Buyer to kalder.com, do not need to be captured and individually credited. This is a structural advantage of account-level attribution: it is robust to the untrackable sharing behavior that makes last-touch systematically incomplete in buying group contexts.

---

### 4.3 Account-Level Holdback Aggregation: The v1 Majority Rule

Individual holdback assignment at 10% produces accounts with mixed treatment and holdback populations across their identified contacts. The majority rule converts individual-level assignment to account-level classification for T1 and T2 outcome attribution.

**The v1 rule:** An account is classified as "in holdback" for T1 and T2 outcome attribution when 50% or more of its identified contacts in the relevant campaign cohort are holdback-assigned. Accounts where fewer than 50% of identified contacts are holdback-assigned are classified as "in treatment."

**The rationale:** The majority rule provides a deterministic, computable account-level classification without requiring the program to model how individual holdback contacts influence a buying group's collective outcomes — a modeling problem with no clean solution at v1 data volumes. It is the simplest threshold that produces a binary treatment/control classification at the account level.

**The limitation:** The majority rule treats a 51%-holdback account identically to a 100%-holdback account. Accounts near the 50% threshold are the most likely sources of misattribution, and this problem is most acute for accounts with small identified contact counts. A two-contact account with one holdback contact and one treatment contact sits exactly at the 50% threshold; a single new contact identification can flip the account's arm classification. The Analytics Lead must report the proportion of TAL accounts within 10 percentage points of the 50% threshold each quarter and assess whether this proportion is material enough to affect the sensitivity of the T2-01 lift calculation.

**The upgrade condition:** When the proportion of TAL accounts with fewer than three identified contacts falls below 20% of the active TAL population — indicating sufficient contact density across the majority of accounts to support finer-grained attribution without material majority-rule misattribution risk — the Analytics Lead may propose a weighted attribution model to the council for review. The weighted model would assign accounts a treatment weight proportional to the fraction of their identified contacts in the treatment arm rather than a binary classification. Any revision to the majority rule requires a program change record entry with the Analytics Lead's rationale and council approval before implementation.

**Quarter-start freeze:** The majority holdback classification for each account is computed once at the start of each measurement quarter and held stable for the duration of that quarter's T1 and T2 analysis. If a new contact is identified mid-quarter and shifts an account's holdback proportion across the 50% threshold, the account retains its quarter-start classification for that quarter's outcome attribution. The reclassification takes effect in the following quarter. Mid-quarter reclassification would corrupt the lift calculation by changing an account's arm assignment after some of its outcome events have already been recorded under the original classification.

---

### 4.4 Mixed-Assignment Accounts: The Expected Condition

A mixed-assignment account has at least one holdback-assigned contact and at least one treatment-assigned contact among its identified TAL contacts. Given 10% individual holdback assignment and the buying group sizes typical of the program's TAL, mixed-assignment accounts are the expected modal condition, not an exception. In a five-contact buying group with 10% individual holdback probability, approximately 41% of accounts will be mixed-assignment.

The treatment for mixed-assignment accounts operates at two distinct levels, which must not be conflated.

At the **account level** (T1 and T2 attribution), the majority rule applies. The account is classified as holdback or treatment based on the proportion of holdback-assigned contacts among its identified contacts at quarter start. All T1 and T2 outcome events for the account — opportunity creation, stage transitions — are attributed to that arm classification for the quarter.

At the **contact level** (T3 session analysis), individual contacts retain their own holdback or treatment assignment for session-level metrics. A holdback contact at a majority-treatment account contributes their behavioral signals to the signal model normally — signal collection is unaffected by holdback status — but their session-level conversion events are attributed to the control arm in T3 analysis, because that contact received the Level 5 default, not a personalized experience. A treatment contact at a majority-holdback account contributes their session-level conversion events to the treatment arm in T3 analysis; the account's T1/T2 outcome remains attributed to the control arm under the majority rule.

This separation — account-level majority rule for T1/T2, individual assignment for T3 — is the correct structure because T1/T2 outcomes are group decisions and T3 outcomes are individual session events. The attribution model reflects the nature of the event being measured, not a single consistent assignment rule applied uniformly.

---

### 4.5 Holdback Contact Conversion: Control Event Classification

A holdback contact who converts — submits a form, books a meeting, or triggers an opportunity creation event at a majority-holdback account — is a control-arm event for T1 and T2 attribution, regardless of what other contacts at the same account have done.

This rule has a specific and consequential application: a holdback contact's conversion does not contribute to the treatment arm's lift numerator, even if the account has other contacts receiving personalization. The account's T1/T2 attribution follows the majority rule; the individual holdback contact's conversion event is a data point in the control arm, providing evidence of what accounts without personalization can achieve.

For T3 session-level metrics, the holdback contact's session outcomes are attributed to the control arm regardless of the account's majority-rule classification. A holdback contact's form submission at a majority-treatment account is simultaneously a control-arm T3 event and a treatment-arm T1/T2 event. These are not contradictions — they reflect two different units of analysis operating simultaneously on the same underlying event.

The failure mode this rule prevents: a reporting analyst who includes a holdback contact's conversion in the treatment arm's T3 lift numerator because other contacts at the same account received personalization. This inflates T3 lift for activities that happened to serve treatment contacts at accounts where the converting contact was in holdback — producing a systematic overstatement of experience effectiveness that compounds across quarters if not corrected at the analysis layer.

---

### 4.6 Three-Axis Slot Attribution Asymmetry

Four module types in the personalization engine participate in three-axis (role × stage × buying job) personalization: `cta`, `gated_assets`, `proof`, and `use_cases`. Holdback visitors structurally cannot receive three-axis personalization on these module types. Progressive disclosure — the mechanism that produces KNOWN buying job state — is suppressed for holdback visitors. A holdback visitor at HIGH role confidence can reach INFERRED buying job state through behavioral inference but cannot reach KNOWN state. A holdback visitor at MEDIUM role confidence cannot reach three-axis personalization at all, because INFERRED state is also excluded at MEDIUM by the asymmetry rule in Document 5, Section 2.2.

The attribution consequence is directional and systematic: an unadjusted lift comparison on these four module types between holdback and treatment populations will understate treatment performance. The treatment group receives buying-job-specific content on `cta`, `gated_assets`, `proof`, and `use_cases` slots that holdback visitors cannot access, creating a structural asymmetry in what the two groups receive — not a probabilistic difference that averages out with sufficient sample, but a permanent ceiling imposed by the holdback design itself.

Any T3-02 or T3-04 analysis that includes these four module types without applying the Section 8 adjustment methodology must be labeled as unadjusted and may not be used in investment recommendations or program performance claims. Section 8 of this document specifies the adjustment methodology. Section 5 establishes the attribution constraint that makes adjustment necessary; Section 8 provides the correction.

---

## Section 6: Known Measurement Limitations and Mitigations

---

### 5.1 Survivor Bias in CRM Retrospective Matching

**The threat.** T3-07's secondary validation method — CRM retrospective match — measures classification accuracy only for anonymous visitors who subsequently become identified Salesforce contacts. Visitors who were classified behaviorally but never converted to known contacts are excluded from this pool. This exclusion is structural, not random: converting visitors are more engaged and more accurately classifiable than non-converting visitors. The secondary validation therefore systematically overstates classification accuracy for the full anonymous visitor population. The overstatement is directionally worst for exactly the visitors the program most needs to classify — those who show behavioral signals but never submit a form, book a meeting, or otherwise create a CRM identity record.

A specific compound-state sub-case compounds the problem. Visitors who are simultaneously in holdback (`holdback_group = True`) AND routing through `pending_solution_fallback` — meaning they received neither a personalized experience nor the progressive disclosure module — who subsequently convert and enter the CRM retrospective match pool are anomalous in that pool. Their classification accuracy reflects neither normal holdback visitor behavior nor normal treatment visitor behavior. When computing T3-07 secondary validation accuracy, the Analytics Lead must identify the compound-state population by joining the `pending_solution_fallback` event log to the holdback assignment log on visitor identifier. The compound-state population must be excluded from or reported separately in the secondary validation match pool before any accuracy figure from the secondary method is presented.

**The mitigation.** The randomized progressive disclosure experiment is the primary T3-07 validation method precisely because it is not subject to survivor bias. The secondary CRM retrospective match method is retained as a supplementary signal only. Every T3-07 report must label which validation method produced which accuracy figure. The secondary method's result must be presented with a stated survivor bias caveat reading: "Secondary method — CRM retrospective match. Accuracy figure reflects converting visitors only and overstates true accuracy for the full anonymous visitor population." The secondary method's result must not be cited as the accuracy estimate for the full anonymous visitor population in any reporting deliverable, investment recommendation, or program performance claim. T2-06 (Role Classification Accuracy), which also uses CRM retrospective match as its computation method, inherits the same directional bias: T2-06 accuracy figures overstate true classification accuracy for the full classified visitor pool for the same structural reason.

**What remains valid.** T3-07 primary validation using the progressive disclosure experiment is unaffected by survivor bias and is the authoritative accuracy estimate. The 60% minimum accuracy threshold applies to the primary method's output, not the secondary. T2-06 remains a valid monitoring metric for detecting trend changes in classification accuracy — a sustained decline in T2-06 is a meaningful signal even if the absolute value overstates true accuracy. The direction and relative magnitude of T2-06 changes are interpretable; the absolute value is not.

---

### 5.2 Novelty Effects in Early Deployment

**The threat.** The first 4–8 weeks of any new personalization activity may produce elevated conversion lift that does not reflect the activity's steady-state performance. This novelty inflation is a real behavioral effect — visitors experiencing a new personalized experience for the first time engage more deeply than they will once the experience is familiar. It is not a measurement error; it is a behavioral phenomenon that does not persist. Results within the novelty window therefore overstate the sustainable lift the program will produce once visitors have acclimated to the experience.

The novelty window per Section 3.4 is 60–90 days from activity launch. The novelty effect is expected to dissipate between weeks 8 and 12 for web personalization activities at B2B visit frequencies, where individual visitor return rates are lower than in B2C contexts — meaning the novelty pool refreshes more slowly and the effect takes longer to fully dissipate than in higher-frequency B2C contexts.

Lift trend shape, not just lift magnitude, is the primary diagnostic for distinguishing genuine performance from novelty effect dissipation. A lift that peaks in weeks 2–4 and declines toward weeks 8–12 is consistent with a novelty effect dissipating to a lower steady-state. A lift that holds flat or continues to increase from week 4 through week 12 is more likely to reflect genuine steady-state performance. The Analytics Lead must include a weekly lift trend chart — not only quarterly aggregates — in the first two quarterly T3-02 reports for any new activity to enable this diagnostic.

**The mitigation.** The monthly T3 report must include an activity age column for every T3-02 result, flagging all activities within their first 90 days with the label "Novelty window — observational only." The Analytics Lead must present novelty-window results and post-novelty results in separate sections of every reporting deliverable; they must not be pooled without explicit labeling. Month-over-month comparisons that mix novelty-window and post-novelty activities without flagging will systematically inflate reported lift for the program overall and are not permitted. No investment decisions — activity scaling, content variant expansion, budget increase — may be based on novelty-window results, per Section 3.3.

**What remains valid.** Novelty-window results are valid for operational monitoring. An activity that shows strongly negative lift within the novelty window may be investigated and retired before the window closes — novelty effects inflate positive signals, not negative ones. A clearly failing activity does not require the full 90-day window to be confirmed as failing.

---

### 5.3 Simpson's Paradox in Segment-Level Analysis

**The threat.** Aggregate lift across the full treatment population can mask negative lift in specific subgroups. A program showing 8% aggregate lift on T3-02 may simultaneously be producing negative lift for Ratifier-classified visitors or for the `it_operations` solution category. These subgroups may be numerically smaller but are precisely the subgroups the program is designed to serve at critical convergence points. An investment decision based on aggregate lift alone is correct on average but may be wrong for specific roles and solution categories — including the roles and categories where content investment is most consequential for deal outcomes.

**The mitigation.** Before any T3-02, T3-04, or T2-01 lift finding is presented in a reporting deliverable, the Analytics Lead must produce a subgroup disaggregation table covering three dimensions: confidence tier (HIGH, MEDIUM, LOW); role (`champion`, `economic_buyer`, `influencer`, `user`, `ratifier`); and campaign cohort (`education`, `acquisition`, `progression_early_to_mature`, `progression_win_now`). The subgroup table is a required section of every lift reporting deliverable, not an appendix. An aggregate lift finding not accompanied by the subgroup table is an incomplete report and must not be used for investment or program decisions until the table is produced.

When a subgroup shows negative lift while the aggregate is positive, the subgroup finding must appear alongside the aggregate in the report with a flag: "Subgroup divergence present — potential Simpson's paradox case." The aggregate result carries the label "Aggregate only — subgroup divergence present" until the Analytics Lead completes a subgroup investigation. The investigation must determine whether the negative subgroup lift reflects a classification error (wrong visitors served wrong content), a content design failure for that role or category, or a program failure specific to that subgroup. The investigation result and its conclusion must be recorded in the program change record before the aggregate result may be used for any investment decision.

**What remains valid.** Aggregate lift remains a valid program-level summary statistic and the appropriate entry point for analysis. A program where all subgroups show positive lift and the aggregate is positive is a clean result that does not require further disaggregation beyond the required table. The subgroup table converts the summary statistic into an actionable finding; it does not replace the summary statistic.

---

### 5.4 Progressive Disclosure Periodization Boundary

**The threat.** The progressive disclosure module was commission-blocked until Document 6 Section 3 approval. During the pre-approval period, T2-05 (Progressive Disclosure Response Rate) and any classification lift analysis that depends on progressive disclosure contributions reflect a program without its primary zero-party classification mechanism. Post-approval data reflects the module's full contribution. Any analysis that pools pre-approval and post-approval data in the same measurement window without accounting for the module's absence will understate the program's post-approval classification performance and may incorrectly attribute the post-approval improvement to other program changes rather than to the progressive disclosure module's activation.

**The mitigation.** The approval date of Document 6 Section 3 is the measurement periodization boundary. The Analytics Lead must record this date in the program change record at the time of approval. All T2-05 and T3-07 classification lift analyses must be windowed to post-approval data unless the analysis explicitly accounts for the boundary with a structural adjustment. Any report that includes pre-approval data alongside post-approval data must carry the label: "Analysis spans the Document 6 Section 3 periodization boundary. Pre-approval period data is included; the absence of the progressive disclosure module during the pre-approval period affects classification rate comparisons."

Secondary boundary events must be tracked using the same protocol. If the progressive disclosure module is disabled post-approval for any reason — a Target configuration change, a content review suspension — the Analytics Lead must record a second periodization boundary event in the program change record at the time of disablement and again at restoration. Each boundary event must be accounted for in any multi-period classification lift analysis. The program change record is the authoritative source for boundary event dates; analysts must consult it before constructing any measurement window that spans more than one quarter.

**What remains valid.** T1 metrics and all Salesforce-sourced T2 metrics — T2-01 through T2-04, T2-08, T2-09 — are unaffected by the periodization boundary. TAL engagement analysis, signal weight validation, and behavioral classification accuracy as measured by T2-06 are unaffected as long as they do not depend on progressive disclosure-generated zero-party signals. Pre-approval data is available and valid for these analyses without boundary adjustment.

---

### 5.5 TAL Quality as a Confound in T1 Miss Diagnosis

**The threat.** The three-tier diagnostic architecture supports three failure mode diagnoses for a T1 miss: strong T2 with T1 miss indicates a late-stage sales problem; weak T2 with strong T3 and T1 miss indicates a program coverage failure; weak T2 with weak T3 and T1 miss indicates multiple potential failures. A fourth failure mode exists that the tier architecture cannot distinguish from a program coverage failure without an external check: TAL quality failure. If the target account list contains accounts that are not in active evaluation cycles — wrong firmographic profile, already contracted with a competing product, in a renewal cycle, or without identifiable buying group members — then T2 signals will be weak not because the program failed to reach the buying group, but because a buying group in active evaluation does not exist at those accounts. The program's personalization capability cannot compensate for a TAL that does not contain the accounts the program is designed to serve. A TAL account with no identifiable buying group members is a structural ceiling on program reach that no content investment can overcome.

The diagnostic threshold: a TAL where more than 30% of accounts remain at `targeted` stage — no `contact_engagement_event` associated with the account in AEP within 180 days after TAL identification — after two full quarters of program operation indicates a potential TAL quality problem. This threshold is a starting hypothesis; the Analytics Lead may propose revisions to the program change record after observing the first two quarters' stage distribution.

**The mitigation.** The Analytics Lead produces a quarterly TAL quality report in conjunction with Revenue Operations. The report compares the actual stage distribution of TAL accounts to the expected distribution based on program volume and TAL size. When the 30% threshold is exceeded, the Analytics Lead presents the distribution to Revenue Operations before diagnosing a T1 miss as a program coverage problem. TAL quality failure and program coverage failure have materially different remediation paths: TAL quality failure requires Revenue Operations to refresh or requalify the account list; program coverage failure requires content and activation investment. The quarterly TAL quality report is the instrument that enables the correct path to be selected. Proceeding to remediation without this report when the 30% threshold is exceeded is not permitted.

**What remains valid.** The three-tier diagnostic framework is correct for accounts in active evaluation cycles. A T1 miss for accounts that are active in the program — at `engaged` or `prioritized` stage — is not explained by TAL quality and must be diagnosed using the tier framework. TAL quality is an upstream input condition, not a program design failure; a clean TAL with a T1 miss points to the program, not the list.

---

### 5.6 Variant-Specific Progressive Disclosure Response Rate Baselines

**The threat.** The three progressive disclosure variants — Level 2 role confirmation, Level 3 role selection, Level 4 evaluation context — produce materially different response rates by design. Level 2 has the lowest cognitive commitment and the highest expected response rate; the visitor is asked only to confirm an already-inferred state. Level 4 has the lowest expected response rate: the visitor has seen little content and is being invited to declare evaluation context without the benefit of role confirmation or selection framing. Cross-variant benchmarking is invalid: a reporting approach that diagnoses Level 4 as underperforming because its response rate is lower than Level 2's is applying the wrong baseline. It will consistently trigger UX revision reviews for Level 4 that are not warranted, while potentially masking genuine Level 4 underperformance relative to its own expected range.

**The mitigation.** T2-05 must be reported by variant in every monthly reporting deliverable. Each variant's response rate must be compared only to its own prior-period rate and its own established baseline. Cross-variant comparison in a single table is permitted only when the table explicitly labels each variant's expected rate differential and presents each variant against its variant-specific baseline, not against a shared program baseline. Variant-specific baselines are established independently in the first 90 days after Document 6 Section 3 approval; no cross-variant comparison may be made until each variant has its own baseline from at least one full quarter of post-approval data.

The quarterly T3-07 report must include variant-specific response rates alongside the classification accuracy result. This is required because variant response rates directly affect the composition of the T3-07 primary validation sample: a low Level 3 response rate means the primary validation sample is weighted toward Level 2 confirmations and may not accurately represent model accuracy for visitors at lower confidence states. An unweighted T3-07 accuracy figure that draws primarily from Level 2 confirmations will overstate model accuracy for MEDIUM-confidence visitors and must be flagged as such.

**What remains valid.** Within-variant trend analysis is valid from the first full quarter after each variant's baseline is established. A Level 4 response rate that is declining relative to its own prior-period baseline is a valid signal that the Level 4 prompt requires UX revision, entirely independent of how it compares to Level 2 or Level 3. Variant-specific baselines enable this diagnosis; cross-variant comparison obscures it.

---

## Section 7: Reporting Cadence

---

### 6.1 Why Three Cadences

The program operates on three reporting cadences because its audiences ask fundamentally different questions on fundamentally different timescales. The weekly cadence serves an operational audience — the Analytics Lead and Marketing Ops Engineer — asking whether the program's pipelines are running correctly this week. The monthly cadence serves a marketing audience — Marketing Operations and the Demand Generation Lead — asking whether buying group health signals are developing at the rates the program predicts. The quarterly cadence serves an executive and finance audience asking whether the program is producing business outcomes and justifying continued investment. These questions require different data, different analysis windows, and different decision-making authority. A consolidated report that combines all three tiers forces executive stakeholders to wait too long for operational information and forces operational practitioners to act on strategic metrics that require a full quarter to be interpretable.

The three cadences are not independent. The weekly operational record is the input data source for the monthly T2 computation. The monthly T2 computation feeds the quarterly T1 assessment. Gaps or failures at the weekly level propagate forward: a missing weekly Check 7 snapshot produces an incomplete T2-06 computation; a T2-08 failure detected in the quarterly cycle traces back to holdback distribution data that must be present in the weekly record.

The weekly T3 operational monitoring check procedures are specified in Document 8 Section 5. Section 6.2 of this document specifies the outputs and record-keeping requirements produced by those checks, without duplicating the check procedures themselves. Document 8 Section 5.4 designates monthly and quarterly cadences as owned by the Analytics and Data Science Lead and governed by Document 7. Section 7 is the governing specification.

---

### 6.2 Weekly T3 Operational Record

**Owner:** Analytics and Data Science Lead.
**Audience:** Analytics and Data Science Lead and Marketing Ops Engineer. Not distributed to leadership.
**Cadence:** Produced and logged following each Document 8 Section 5 monitoring session.

The weekly record is an operational log, not a distributed report. Its function is to create a retrievable record of program pipeline health for each week and to serve as the input data source for the monthly T2 program report.

**Required content:**

1. Results of Document 8 Section 5 Checks 1–8: normal or escalated status for each check, with the check date and the practitioner who executed it.
2. Any escalations triggered during the week: the check that triggered the escalation, the routing destination per Document 8 Section 5.3, and the current resolution status at the time of logging.
3. The weekly role confidence distribution snapshot from Check 7: the `LOW`/`UNKNOWN` proportion by role for the week. This snapshot is a required input for the monthly T2-06 computation and must be preserved in the monitoring record regardless of whether Check 7 triggered an escalation. A week in which no Check 7 snapshot is preserved is a gap in the T2-06 computation chain that must be flagged and addressed before the monthly report is finalized.

The weekly record has no leadership-facing escalation trigger of its own. Escalations from individual checks are routed per Document 8 Section 5.3. The Analytics and Data Science Lead must confirm that weekly records are retrievable before beginning the monthly T2 computation.

---

### 6.3 Monthly T2 Program Report

**Owner:** Analytics and Data Science Lead.
**Audience:** Marketing Operations, Demand Generation Lead, and Analytics and Data Science Lead.
**Cadence:** Produced within 10 business days of each month's close.

The following five sections are required content. None are optional and none may be moved to an appendix. A monthly T2 report missing any of these sections is incomplete and must not be distributed until the missing section is produced.

**Section A — T2 Metric Scorecard.** All monthly T2 metrics from Section 2 with current value, prior period value, trend direction, and target status. Quarterly T2 metrics show their current quarter cumulative value and the percentage of the quarter elapsed.

**Section B — T3 Activity Table.** All active Target activities with: T3-02 result; activity age in weeks; novelty window flag — all activities within their first 90 days carry the label "Novelty window — observational only"; confidence interval status (95% CI reached / not reached); and a directional signals subsection for results below 95% CI carrying the label "Directional signal — below 95% CI threshold. Not decision-ready."

**Section C — Subgroup Disaggregation Table.** For every T3-02 result that has reached 95% CI: the subgroup lift table across confidence tier (HIGH, MEDIUM, LOW), role (`champion`, `economic_buyer`, `influencer`, `user`, `ratifier`), and campaign cohort (`education`, `acquisition`, `progression_early_to_mature`, `progression_win_now`). Section C must appear before any T3-02 result in Section B is interpreted as a program performance finding. When any subgroup shows negative lift while the aggregate is positive, the corresponding aggregate result in Section B carries the flag: "Aggregate only — subgroup divergence present — see Section C."

**Section D — T2-06 Computation.** The monthly Role Classification Accuracy aggregated from the four weekly Check 7 snapshots. The Analytics and Data Science Lead records which weeks' snapshots were used, confirms all four are present, and flags any week where a snapshot was missing with the method used to handle the gap. A month where fewer than three of four weekly snapshots are present must carry the label "T2-06 computation incomplete — fewer than three of four required weekly snapshots available. Accuracy figure is a partial estimate."

**Section E — Progressive Disclosure Variant Response Rates.** T2-05 by variant (Level 2, Level 3, Level 4), each compared to its own established baseline. Cross-variant comparison is not included in the monthly report. Each variant's result carries its variant-specific baseline value as the reference point.

**Monthly escalation triggers:**

- Any T2 metric missing its target by more than 20% for two consecutive months: the Analytics and Data Science Lead initiates a diagnostic memo per Section 2.5 and distributes it to the executive stakeholder and Revenue Operations within 15 business days of the second consecutive miss.
- Any T3-02 activity not reaching 95% CI after three full months of qualified traffic: the Analytics and Data Science Lead flags the activity for redesign review and distributes the flag and recommendation to the Demand Generation Lead within 5 business days.
- T2-05 Level 4 response rate declining for two consecutive months relative to its own established baseline: the Analytics and Data Science Lead flags for UX review and distributes the flag and recommendation to the Content Operations Lead within 5 business days.

---

### 6.4 Quarterly T1 Business Outcomes and T3-07 Accuracy Validation

**Owner:** Analytics and Data Science Lead.
**Audience:** Executive stakeholder, Finance, Revenue Operations, and Marketing Operations.
**Cadence:** Produced within 15 business days of each quarter's close.

The following eight steps must be completed in sequence before the quarterly report is distributed. No step may be skipped and no subsequent step may proceed while a prior step's required condition is unresolved.

**Step 1 — Quarter-start freeze verification.** The Analytics and Data Science Lead confirms that the majority-rule holdback classification computed at the start of the closing quarter was recorded in the program change record and that no mid-quarter reclassification events affected T1/T2 outcome attribution without documentation. If the quarter-start freeze record is missing, T1 and T2 outcome calculations for the quarter are held pending an investigation of whether any accounts crossed the 50% holdback threshold mid-quarter. The investigation result is recorded in the program change record before any lift attribution proceeds.

**Step 2 — T2-08 parity check.** Compute T2-08 (Holdback Parity Check) for the quarter. If T2-08 passes, proceed to Step 3. If T2-08 fails, stop and execute the T2-08 failure protocol in Section 6.5 before proceeding to any other quarterly results.

**Step 3 — TAL quality check.** Produce the quarterly TAL quality distribution per Section 5.5: the proportion of TAL accounts at each stage, with the proportion at `targeted` with no engagement event after 180 days highlighted. Route the distribution to Revenue Operations before diagnosing any T1 miss. Revenue Operations must confirm whether TAL quality is adequate before the tier-divergence assessment in Step 7 is applied to any T1 miss. This step must be completed before Step 7 in any quarter where T1 outcomes miss their targets.

**Step 4 — T1 metric scorecard.** All six T1 metrics (T1-01 through T1-06) with: current quarter value; target; variance from target; and trend direction (improving / stable / declining) over the last three quarters.

**Step 5 — T2-01 OEC result.** The Cohort Progression Rate vs. the holdback cohort, with the sub-metric breakdown (T2-01a, T2-01b, T2-01c) identifying which pipeline transition fired most frequently and which lagged. The power calculation minimum sample check: the Analytics and Data Science Lead confirms the holdback cohort contained sufficient accounts to detect the MDE at 80% power for the quarter. If the minimum was not met, the T2-01 result carries the label "Underpowered — below minimum sample for 80% power at specified MDE."

**Step 6 — T3-07 accuracy validation.** Primary method result: the randomized progressive disclosure experiment accuracy with sample size and confidence interval. Secondary method result: the CRM retrospective match accuracy with the survivor bias caveat per Section 5.1 and a compound-state exclusion note. Compound-state contamination check: the Analytics and Data Science Lead computes the proportion of compound-state visitors (holdback + `pending_solution_fallback`) in the secondary validation match pool by joining the `pending_solution_fallback` event log to the holdback assignment log on visitor identifier. If the compound-state population exceeds 15% of the match pool, the secondary method result is suspended — it is not reported as an accuracy estimate — and the pool composition is documented in its place. The primary method result is the authoritative accuracy figure in all cases.

**Step 7 — Tier-divergence assessment.** Compare T2-01, T3-02, and T1 outcomes and apply the divergence decision protocol from Section 6.6. This step produces one of four plain-language findings for the executive summary: (a) all tiers moving in expected direction — program is working; (b) T3 lift present, T2-01 flat — investigation triggered, program status indeterminate; (c) T2-01 positive, T1 flat — routed to Revenue Operations, not a program failure; (d) multiple tier misalignment — compound investigation triggered per Scenario C in Section 6.6. The finding from Step 7 is the lead item in the executive summary of the quarterly report.

**Step 8 — Investment recommendation.** The Analytics and Data Science Lead presents the quarterly result and investment recommendation to the executive stakeholder and Finance. The recommendation must state whether the program has met the investment scaling threshold from Section 3.3: T3-02 statistical significance at 95% CI AND at least one full quarter of T2-01 data in the relevant cohort. If neither condition is met, the recommendation is to maintain current investment level and complete baseline establishment before any scaling decision is made.

---

### 6.5 T2-08 Failure Protocol

T2-08 failure at the quarterly review suspends all lift calculations from the affected quarter. The following four steps must be executed in sequence.

**Step 1.** The Analytics and Data Science Lead notifies the Platform Engineer immediately upon detecting T2-08 failure. Notification must include: the parity check result; the cohort or cohorts affected; and the quarter-start holdback distribution recorded in the program change record, or the explicit note that no quarter-start record was found.

**Step 2.** The Platform Engineer investigates the hash assignment mechanism and confirms whether the `holdback_group` attribute has been writing correctly to AEP profiles throughout the quarter. The Platform Engineer produces a root cause assessment within 10 business days of notification.

**Step 3.** Two possible findings from Step 2: (a) The hash assignment is confirmed correct and the imbalance is a statistical artifact within expected variance — the Analytics and Data Science Lead may present the quarter's lift data to the executive stakeholder with a disclosed limitation and a recommendation for how to interpret the data. The executive stakeholder decides whether to accept the data with disclosed limitations or to declare the quarter unrecoverable. This decision is recorded in the program change record. (b) The hash assignment has been writing incorrectly — the quarter is declared unrecoverable immediately. No lift-based performance claims from that quarter may be made. The program change record records the root cause, the date from which the incorrect assignment began, and the date from which a corrected assignment is confirmed clean.

**Step 4 — Maximum resolution timeline.** If the Platform Engineer has not delivered the root cause assessment within 20 business days of T2-08 failure detection, the quarter is declared unrecoverable and the program proceeds to the following quarter's measurement cycle. The 20-business-day limit exists to prevent indefinite suspension of program performance assessment. A quarter declared unrecoverable under this timeline carries the notation "Timeout — root cause not delivered within 20-business-day window" in the program change record rather than a confirmed technical failure classification.

---

### 6.6 Tier-Divergence Decision Protocol

Three named scenarios govern how the program responds when the tier metrics diverge. Each scenario names the investigator, the decision-maker, the decision timeline, and the required output.

**Scenario A — T3-02 statistically significant, T2-01 flat or negative.** The Analytics and Data Science Lead initiates investigation within 5 business days of the quarterly report distribution. Two diagnostic paths: (1) Visitor pool composition check — for accounts where T3-02 conversions are occurring, the Analytics and Data Science Lead runs the account-level join to determine what proportion have matching buying group stage progression. (2) Mid-funnel conversion check — the Analytics and Data Science Lead determines whether individual T3 conversion events correlate with T2-01 progression events at the same accounts within 90 days. The Analytics and Data Science Lead presents findings to the Demand Generation Lead within 30 days of the quarterly report. The Demand Generation Lead decides whether corrective action affects targeting (visitor pool composition problem) or content and experience design (mid-funnel conversion problem). The Demand Generation Lead's decision is recorded in the program change record within 45 days of the quarterly report. No program performance claim of "the program is working" may be made until either T2-01 confirms T3 lift is producing group-level outcomes, or the Demand Generation Lead has closed the investigation with a documented corrective action.

**Scenario B — T2-01 cohort progression positive, T1 outcomes flat.** The Analytics and Data Science Lead routes the finding to Revenue Operations and the Demand Generation Lead within 15 business days of the quarterly report, alongside the TAL quality check output from Step 3. If TAL quality is confirmed adequate, Revenue Operations owns the diagnosis. Two paths: (1) Sales motion failure — buying groups are progressing through pipeline stages but the sales motion is not converting engagement to closed deals; corrective action is a Sales leadership decision. (2) Late-stage content failure — the program is not supporting final convergence points with sufficient or sufficiently targeted content; corrective action is a Demand Generation and Content Operations decision. Revenue Operations determines which path applies and notifies the Analytics and Data Science Lead. The determination is recorded in the program change record within 30 days of routing.

**Scenario C — T2-01 flat, T3-02 statistically significant, T1 miss (compound failure).** The Analytics and Data Science Lead executes the Scenario A investigation (30-day timeline) AND simultaneously routes to Revenue Operations for the TAL quality check. Neither investigation closes independently — both must complete before a corrective action is selected. The Analytics and Data Science Lead presents a joint findings memo to the executive stakeholder and Demand Generation Lead after both investigations are complete. The executive stakeholder approves the corrective action. No investment scaling decisions may be made while a Scenario C compound investigation is open.

---

## Section 8: Holdback Design and Lift Measurement Methodology

---

### 7.1 Holdback Group in Lift Calculations: Operating Reference

Section 8 builds on the holdback design specified in Section 4 (holdback group as control condition, assignment mechanism, four cohort groups, T2-08 validity gate) and the majority-rule attribution specified in Section 5 (account-level holdback classification, quarter-start freeze). Both sections are incorporated by reference; Section 8 does not re-specify their contents. Section 8's contribution is the lift calculation methodology applied to that design.

**Cohort-level aggregation.** Cohort-level lift is computed independently for each of the four cohort holdback groups: `holdback_education`, `holdback_acquisition`, `holdback_progression_early`, and `holdback_progression_win_now`. Aggregate lift across cohorts is a weighted average of cohort-level lift estimates, weighted by the number of accounts in each cohort at the start of the measurement quarter. The weighted average and the cohort-level breakdown must both appear in every lift report: the cohort breakdown identifies where lift is concentrated; the weighted average is the program-level summary. Reporting the weighted average without the cohort breakdown conceals which pipeline segments are driving program performance.

**T2-08 validity gate.** Section 8 lift calculations for a given quarter are only valid when T2-08 (Holdback Parity Check) has passed for that quarter per Section 6.4 Step 2. If T2-08 fails, all Section 8 lift calculations for that quarter are suspended per Section 6.5. No lift report produced under Section 8 methodology may be distributed for a quarter where T2-08 has not been confirmed passing.

**Sales activation asymmetry.** Holdback visitors who reach MEDIUM+ role confidence through behavioral signal accumulation are eligible for Outreach sequence activation per Document 6 Section 7.7. This creates a named asymmetry in the holdback design: holdback visitors are not receiving web personalization, but some may be receiving sales-side activation. When interpreting T1 and T2 outcome lift — particularly in the `progression_early_to_mature` and `progression_win_now` cohorts where sales activation is most consequential for deal advancement — the Analytics Lead must note in the quarterly report whether any holdback accounts received Outreach activation during the measurement period. These accounts are partially treated, not pure controls. This does not invalidate the holdback design or the lift calculation; it is a known characteristic that limits the interpretation of T1 and T2 lift as "pure web personalization lift." Sales activation configuration is specified in Document 6 and Document 8; Section 8 names the asymmetry and its interpretive consequence.

---

### 7.2 Standard Lift Calculation: Non-Three-Axis Module Types

For module types that do not include `buying_job` in their `intended_axes` — `hero`, `benefits`, `narrative`, `problem_framing`, `outcomes`, `trust_signals`, and `progressive_disclosure` — standard holdback lift applies without adjustment.

**Standard lift formula:**

> Lift = (treatment conversion rate − holdback conversion rate) / holdback conversion rate

This is the T3-02 calculation for these module types. No adjustment is required because the content difference between treatment and holdback populations on these slots is structurally clean: personalized content versus the Level 5 brand default. The holdback group receives the same content type it would have received without the program; the treatment group receives role-specific or solution-category-specific content. No structural asymmetry in content specificity exists between the two populations for these module types.

`progressive_disclosure` is included in this list, which requires explanation. The `progressive_disclosure` module is measured by T2-05 (response rate) and T3-07 (classification accuracy), not by T3-02 lift on the slot. Holdback visitors never receive this module; there is no treatment/holdback comparison on whether the slot fires, because it never fires for holdback visitors by design. The three-axis adjustment in Section 7.3 addresses the downstream effect that the absence of progressive disclosure creates on `cta`, `gated_assets`, `proof`, and `use_cases` slot performance — not the `progressive_disclosure` slot itself.

---

### 7.3 Three-Axis Slot Adjustment: Methodology

This section delivers the lift adjustment methodology that Document 5 Section 2.6 and Document 6 Section 6.6 explicitly delegated to Document 7.

#### 7.3.1 The Asymmetry

KNOWN buying job state (`buying_job_confirmed` attribute set and non-expired) is structurally unavailable to holdback visitors because progressive disclosure never fires for them. Holdback visitors at HIGH role confidence can reach INFERRED buying job state through behavioral inference, but cannot reach KNOWN state. Holdback visitors at MEDIUM role confidence cannot reach three-axis personalization at all — KNOWN is structurally unavailable and INFERRED is excluded at MEDIUM by the decisioning rules in Document 5 Section 2.2.

The four affected module types — `cta`, `gated_assets`, `proof`, and `use_cases` — all carry `buying_job` in their `intended_axes`. For these slots, a portion of the treatment group received buying-job-specific content that the holdback group could not have received under any condition. An unadjusted lift comparison on these four module types conflates two distinct effects: (a) lift from role-and-stage personalization versus no personalization, which is the program's fundamental value question; and (b) incremental lift from buying-job-specific personalization versus role-and-stage personalization, which is the value question specific to the progressive disclosure module and buying job inference model. The adjustment separates these effects so each can be answered independently.

#### 7.3.2 Impression-Level Decomposition

The classification step must be performed at the impression level, not the visitor level. A single visitor may contribute impressions to both sub-populations within a quarter — if their `buying_job_confirmed` attribute was first set mid-quarter, expired and was re-established mid-quarter, or if they visited across both KNOWN and non-KNOWN states during the quarter. Each impression is classified at the time of impression delivery: the buying job state that was active at page load for the session in which the impression was served. End-of-quarter visitor state must not be used to backfill impression classification.

Two sub-populations within the treatment group are defined at impression level:

- **Three-axis impressions:** Impressions where `buying_job_confirmed` was set, non-expired, and valid at impression delivery time. These impressions received buying-job-specific content on the affected module slot.
- **Two-axis + prior impressions:** All other treatment impressions — INFERRED at HIGH confidence, UNKNOWN at any confidence, MEDIUM at any buying job state. These impressions received role-and-stage content with `PROBABLE_JOB_PRIORS` variant selection where applicable.

The holdback group is entirely two-axis + prior by structural definition. KNOWN state is unavailable to holdback visitors; holdback visitors at HIGH + INFERRED receive the INFERRED buying job content variant, which is comparable to the treatment's two-axis + prior population for these module types.

#### 7.3.3 The Adjustment Calculation

**Step 1.** For each of the four affected module types (`cta`, `gated_assets`, `proof`, `use_cases`), classify all treatment impressions in the measurement quarter as three-axis or two-axis + prior per Section 7.3.2. Record impression counts and conversion outcomes for each sub-population.

**Step 2.** Compute two lift figures:

- **Adjusted holdback lift:** (two-axis + prior treatment conversion rate − holdback conversion rate) / holdback conversion rate. This is the apples-to-apples comparison: same content specificity level in treatment versus control. It measures whether personalization at the role-and-stage level outperforms no personalization.

- **Three-axis incremental lift:** (three-axis treatment conversion rate − two-axis + prior treatment conversion rate) / two-axis + prior treatment conversion rate. This is a within-treatment comparison. It measures the incremental conversion value of buying-job specificity on top of role-and-stage targeting.

**Step 3.** Compute weighted total lift:

> Total adjusted lift = (proportion of treatment impressions that were three-axis × three-axis incremental lift) + (proportion of treatment impressions that were two-axis + prior × adjusted holdback lift)

Weights use impression counts, not visitor counts. A visitor who returned five times with KNOWN buying job state contributes five three-axis impressions; their share of the three-axis sub-population reflects their actual contribution to the program's total delivery.

**Step 4 — Reporting requirement.** The quarterly T3-02 report for `cta`, `gated_assets`, `proof`, and `use_cases` module types must present all three figures — adjusted holdback lift, three-axis incremental lift, and weighted total lift — with the impression counts supporting each. Each figure answers a distinct decision question:

- **Adjusted holdback lift:** Does role-and-stage personalization outperform no personalization? This is the program's fundamental value question.
- **Three-axis incremental lift:** Does buying-job specificity produce additional conversion improvement beyond role-and-stage targeting? This is the ROI question for the progressive disclosure module and the buying job inference model.
- **Weighted total lift:** What is the program's overall performance on three-axis slots? This is the T3-02 summary figure for these module types.

Unadjusted lift on these four module types must not appear as a standalone figure in any reporting deliverable. If computed for diagnostic purposes, it must carry the label: "Unadjusted — not for investment decisions."

---

### 7.4 Progressive Disclosure Variant-Specific Baseline Establishment

This section satisfies the third measurement obligation passed from Document 6 Section 3.6.

**Why cross-variant benchmarking is invalid.** Level 2 asks a visitor to confirm a role the system has already inferred — the lowest cognitive commitment of the three variants, producing the highest expected response rate. Level 3 asks a visitor to self-identify their role from five options without prior framing — higher commitment, lower expected rate. Level 4 asks a visitor with limited prior engagement to declare their evaluation context — a lower-commitment ask but from the visitor with the least established engagement, producing the lowest expected response rate. These are structurally different asks from visitors at different points in their engagement with kalder.com. A Level 4 response rate that is lower than Level 2's is a designed-in condition, not a performance defect. Applying Level 2's baseline to Level 4 will produce persistent false-negative diagnoses of Level 4 underperformance and trigger UX revision reviews that are not warranted.

**Baseline establishment procedure:**

1. Baseline measurement begins on the approval date of Document 6 Section 3, which is the periodization boundary established in Section 5.4. The Analytics Lead records this date in the program change record as the baseline measurement start date.

2. The Analytics Lead collects weekly response rates for each variant (Level 2, Level 3, Level 4) independently for 90 days post-approval. Weekly response rates are recorded in the weekly T3 operational log per Section 6.2.

3. At the 90-day mark, the Analytics Lead produces a variant baseline proposal containing: observed weekly response rates for each variant across the 90-day window; the mean and standard deviation for each variant; and the proposed baseline value for each variant (the 90-day mean, unless the Analytics Lead documents a rationale for a different value — such as an identified outlier period that skewed the mean). The proposal must treat each variant independently; no cross-variant comparison is included in the proposal.

4. The baseline proposal is distributed to the Demand Generation Lead and the executive stakeholder for approval within 5 business days of the 90-day mark.

5. Approved baselines are recorded in the program change record with the approval date, the approving parties, and the 90-day measurement window dates.

**After baseline establishment.** T2-05 is reported against variant-specific baselines in every monthly T2 report per Section 6.3 Section E. Cross-variant comparison is not included in the monthly report. If a cross-variant comparison is produced for diagnostic purposes, it must be accompanied by an explanatory note identifying the expected rate differential between variants by design and the specific diagnostic question the comparison is intended to answer.

---

### 7.5 Periodization Boundary in Holdback Lift Calculations

Section 5.4 established the Document 6 Section 3 approval date as the measurement periodization boundary for progressive disclosure-related metrics. Section 7.5 specifies how this boundary applies to holdback lift calculations.

**The rule.** The measurement window for T2-05 and T3-07 holdback lift comparisons begins no earlier than the approval date of Document 6 Section 3. Pre-approval data for these metrics is excluded from holdback versus treatment comparisons. This applies to all T2-05 variant response rate computations and to all T3-07 primary and secondary validation accuracy calculations.

**For a quarter that spans the boundary.** If the Document 6 Section 3 approval date falls within a measurement quarter, the Analytics Lead constructs a split measurement window. The post-approval window (approval date to quarter-end) is used for T2-05 and T3-07 holdback lift calculations. The pre-approval window data is preserved and may be reported as context — specifically, as the program's baseline classification rate before progressive disclosure was active — but must not be included in the holdback lift figures for these metrics. The split must be documented in the quarterly report with the approval date, the length of each window, and the account or impression counts in the post-approval window used for the calculation. A post-approval window shorter than 30 days produces insufficient sample for reliable accuracy estimation; the Analytics Lead must flag the T3-07 result as "Boundary quarter — post-approval window insufficient. Estimate is directional only."

**For all other metrics and module types.** The periodization boundary does not affect Section 8 lift calculations for non-progressive-disclosure module types. T3-02 lift on `hero`, `benefits`, `cta`, `gated_assets`, `proof`, `use_cases`, `narrative`, `problem_framing`, `outcomes`, and `trust_signals` is not subject to the periodization boundary. These module types were commissionable and active before Document 6 Section 3 approval; their holdback versus treatment comparison is clean across the full quarter window regardless of where the boundary falls.
---

## Cross-Reference Table

| Document | Relationship | Specific Dependency |
|---|---|---|
| `kalder_data_model.py` | Document 7 depends on this | `§3 CONFIDENCE_TIERS` (confidence tier thresholds used in T3 session-to-engagement breakdowns), `§11 METRIC_DEFINITIONS` (canonical metric IDs, formulas, and thresholds for all 24 T1/T2/T3 metrics), `§14 ENGAGEMENT_THRESHOLDS` (Engagement Score tier boundaries used in T2 buying group health metrics) |
| Document 1 — Buying Group Role Architecture | Document 7 depends on this | Role definitions that govern T3 role-content affinity analysis (T3-04) and the role coverage metric (T2-02); behavioral signatures that distinguish classification model failure from content design failure |
| Document 2 — Signal Definition and Confidence Model | Document 7 depends on this | Confidence tier scoring outputs that define T3 personalization performance breakdowns; classification accuracy definition that governs T3-07 (progressive disclosure accuracy experiment) |
| Document 3 — Audience and Segmentation Architecture | Document 7 depends on this | Cohort architecture (education, acquisition, progression cohorts and holdback subdivisions) that defines the population structure for all T1 and T2 lift calculations; segment definitions that govern T2-08 holdback parity check |
| Document 4 — Content Model and Taxonomy | Document 7 depends on this | Coverage completeness architecture and `pending_solution_fallback` event log that define T2-06 (coverage gap resolution rate) and govern compound holdback state analysis |
| Document 5 — Personalization Decisioning Rules | Document 7 depends on this | Holdback group specification (Section 8), fallback level routing outcomes that define T3 measurement segment taxonomy, and the 5%–20% holdback adjustment governance referenced in Section 8 |
| Document 6 — Buying Group Journey and Convergence Model | Document 7 depends on this | Stage model that defines cohort progression rate (T2-01 OEC), convergence point velocity metrics, and the Document 6 Section 3 approval date that establishes the progressive disclosure periodization boundary in Section 8 |
| Document 8 — Operational Runbook | Depends on Document 7 | Reporting cadence (Section 7), escalation protocol, and measurement pipeline implementation that Document 8 operationalizes; T2-08 failure response procedure that Document 8 must implement as an incident type |
| Document 9 — Privacy and Consent Architecture | Document 7 depends on this | Consent-state conditions that determine which visitor populations are available for measurement and what data may be retained for longitudinal cohort analysis |
