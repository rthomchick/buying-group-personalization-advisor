# Kalder Stack Integration Specification
## Build 3 — Production Deployment Reference

**Version:** 1.0  
**Data model:** `kalder_data_model_v0.2.0`  
**Corpus:** Kalder v1.0 (9 documents, council-approved)  
**Status:** Final — enterprise sales artifact  
**Companion documents:** Kalder AI Advisor (Build 1), Website Experience Simulator (Build 2)

---

## Reader Navigation Guide

This document serves three distinct audiences. Each audience has a defined set of sections — read only the sections that apply to your role.

| If you are… | Read these sections |
|---|---|
| **Marketing Technology Director / VP of Marketing Operations** | Executive Summary (§0), Stack Architecture Overview (§1), Implementation Prerequisites and Readiness Framework (§9), POC-to-Production Gap Reference (§10) |
| **Platform Engineer / MarTech Architect** | Stack Architecture Overview (§1), AEP Configuration (§2), Adobe Target Configuration (§3), Sanity CMS Configuration (§4), AEP → Salesforce → Outreach Integration (§5), AEP → Marketo Configuration (§6), Kafka Pipeline (§7), Consent Architecture (§8), Prerequisites (§9) |
| **Procurement / InfoSec Reviewer** | Consent Architecture (§8), with supporting context from Stack Architecture Overview (§1) |

Sections outside your reader category are not summaries of the sections you read — they are specifications written for a different technical audience. Skipping them is not an omission; it is correct use of this document.

---

## Table of Contents

- [Section 0 — Executive Summary](#section-0--executive-summary)
- [Section 1 — Stack Architecture Overview](#section-1--stack-architecture-overview)
- [Section 2 — AEP Real-Time CDP B2B Edition Configuration](#section-2--aep-real-time-cdp-b2b-edition-configuration)
- [Section 3 — Adobe Target Configuration](#section-3--adobe-target-configuration)
- [Section 4 — Sanity CMS Content Graph Configuration](#section-4--sanity-cms-content-graph-configuration)
- [Section 5 — AEP → Salesforce → Outreach Integration](#section-5--aep--salesforce--outreach-integration)
- [Section 6 — AEP → Marketo Connector Configuration](#section-6--aep--marketo-connector-configuration)
- [Section 7 — Kafka Pipeline: Opportunity Stage](#section-7--kafka-pipeline-opportunity-stage)
- [Section 8 — Consent Architecture](#section-8--consent-architecture)
- [Section 9 — Implementation Prerequisites and Readiness Framework](#section-9--implementation-prerequisites-and-readiness-framework)
- [Section 10 — POC-to-Production Gap Reference](#section-10--poc-to-production-gap-reference)

---

## Section 0 — Executive Summary

**Primary reader: Marketing Technology Director / VP of Marketing Operations**

This section answers four questions: what the full stack integration enables that the POC does not; what systems integration requires and at what depth; what the three most significant prerequisites are; and what a realistic implementation timeline looks like. Platform Engineers should proceed to Section 2.

---

### 0.1 What Full Stack Integration Enables

The Kalder Buying Group Personalization program, as demonstrated in the POC, proves that the decisioning logic is correct. The POC classifies buying group contacts by role and confidence tier, applies the Document 5 decisioning rules accurately, and produces the correct web experience for each contact state. Every test case passes.

What the POC cannot demonstrate is operational scale: buying group classification running continuously against a live Salesforce account list, web experiences personalized in real time for anonymous visitors, sales alerts firing when convergence points are approached, and email nurture tracks adjusting as role confidence improves. Full stack integration provides all of this. The difference between the POC and production is not correctness — the logic is the same. The difference is data source, latency, and coverage.

Specifically, full stack integration activates:

- **Continuous behavioral scoring** against live Adobe Analytics event data for all TAL-matched visitors, rather than against synthetic signal inputs
- **Tier 1 ML classifier** for HIGH confidence assignments (champion and economic buyer identification from CRM historical patterns), eliminating the MEDIUM confidence ceiling that governs Tier 3 behavioral scoring alone
- **Real-time web personalization** via Adobe Target against live AEP audience segments, rather than via the Website Experience Simulator
- **Convergence point sales alerts** delivered to Salesforce CRM and Slack as buying groups approach alignment moments, triggering Outreach sequences for BDRs and AEs
- **Marketo email nurture** enrollment and track adjustment as contacts move through cohort stages
- **Firmographic enrichment** via Demandbase reverse-IP identification (after Track 2 DPA completion), enabling the firmographic bonus scoring pathway for early-stage classification
- **`progression_win_now` cohort activation** for accounts with Salesforce Stage 5–7 opportunities, enabling late-stage executive alignment content and elevated-priority risk/compliance alerts

### 0.2 Systems Required and Integration Depth

Nine integrations are required for full production capability. Each involves a distinct integration direction, configuration owner, and data payload.

| Integration | Direction | Depth |
|---|---|---|
| Adobe Analytics → AEP | Inbound | Adobe Analytics source connector; 20 behavioral event types mapped to AEP schema |
| Marketo → AEP | Inbound | Identity resolution only — email-to-contact_id mapping for known visitor linkage |
| AEP scoring pipeline | Internal | Seven-step classify_visitor() function; three-tier confidence hierarchy; holdback group assignment |
| AEP → Adobe Target | Outbound | Audience segment activation; four campaign cohorts; contact-plane and account-plane attributes |
| Sanity → Adobe Target | Outbound | Webhook-triggered offer catalog sync; coverage status recomputation |
| AEP → Marketo | Outbound | Two-mode connector: streaming (cohort transitions) + daily batch (attribute updates) |
| AEP → Salesforce | Outbound | Native CRM connector; convergence point alert payload delivery; 60-minute SLA |
| Salesforce → Outreach | Outbound | Salesforce field update triggers Outreach sequence; client-configured at onboarding |
| Kafka → AEP | Inbound | Opportunity stage pipeline; enables `progression_win_now` cohort differentiation |

No custom middleware is required. Every integration in the list above uses a native platform connector or a standard webhook mechanism.

### 0.3 Three Most Significant Prerequisites

These are not the only prerequisites (Section 9 specifies all of them), but they are the three most commonly underestimated — the ones that have slipped timelines in prior enterprise deployments.

**Prerequisite 1 — AEP Real-Time CDP B2B Edition licensing.** Standard AEP CDP cannot represent the composite `(contact_id, solution_category)` classification key that governs this program's data model. B2B Edition is required for the account-contact relationship model. This is not an add-on — it is a different SKU with a different licensing process. Confirm B2B Edition licensing before scheduling any implementation work. Standard edition implementations cannot be upgraded in place without data re-ingestion.

**Prerequisite 2 — Content commissioning timeline.** Full program content for a single solution category requires 6–10 weeks from checklist start to Level 3 go-live. Gate 0 — foundational Narrative and Audience node authoring — takes 2–3 weeks and cannot be parallelized or compressed. This timeline governs when the web personalization experience goes live, independent of all technical configuration work. Teams that complete technical configuration in week four and expect content to be ready are routinely surprised. Plan content commissioning as a parallel workstream beginning day one.

**Prerequisite 3 — Salesforce custom field provisioning.** Seven convergence points × 3 custom fields = minimum 21 Salesforce custom fields required before sales activation can go live. The `recommended_action` field must accommodate a minimum of 280 characters without truncation. Field provisioning requires Salesforce admin access and approval workflows that typically take 2–4 weeks in enterprise environments. This is Salesforce governance work, not Kalder configuration work — it cannot be accelerated by the implementation team.

### 0.4 Implementation Timeline

| Phase | Description | Typical Duration |
|---|---|---|
| Phase 1 — Pre-Activation Setup | AEP schema configuration, signal collection setup, holdback group assignment, consent management platform configuration, solution category registration | Weeks 1–3 |
| Phase 2 — Content Gate 0 | Foundational Narrative and Audience node authoring (critical path) | Weeks 1–3 (parallel with Phase 1) |
| Phase 3 — Channel Configuration | Marketo programs, Outreach sequence configuration, Salesforce custom field provisioning, Target activity configuration | Weeks 2–5 |
| Phase 4 — Level 3 Go-Live | Gate 1 content commissioning, six-condition go-live checklist, Program Manager authorization | Weeks 5–10 |
| Phase 5 — Ongoing Activation | Level 2 and Level 1 content commissioning, Tier 1 ML classifier training, `progression_win_now` Kafka pipeline activation | Weeks 8–16+ |

Tier 1 ML classifier training requires minimum 6 months of historical CRM data with MEDIUM+ confidence role assignments. Until training completes, HIGH confidence assignments are not possible. This is not a program defect — it is the correct behavior of a three-tier confidence architecture that requires empirical training data to activate its highest-authority tier.

### 0.5 POC-to-Production Gap Summary

Ten POC simplifications (S-01 through S-10) were made to enable demonstration without live stack dependencies. Each is documented in full in Section 10. The summary for executive review:

| POC Simplification | Production Requirement | Business Impact if Deferred |
|---|---|---|
| S-01: Python scoring vs. AEP pipeline | AEP Real-Time CDP streaming pipeline | No live personalization; classification offline only |
| S-02: No Tier 1 ML classifier | Tier 1 ML classifier (trained on CRM history) | HIGH confidence not achievable; Level 1 experience not activatable |
| S-03: Firmographic bonus suppressed | Demandbase DPA + Track 2 completion | Early-stage classification less precise |
| S-04: Salesforce mock vs. live write | AEP → Salesforce native connector | No BDR/AE alerts; convergence points not actioned |
| S-05: Outreach stub vs. live trigger | Outreach-Salesforce integration trigger | Sequences not fired; sales activation manual only |
| S-06: Marketo not demonstrated | AEP → Marketo two-mode connector | No email nurture enrollment or track adjustment |
| S-07: `progression_win_now` inactive | Kafka opportunity stage pipeline | Late-stage accounts undifferentiated from early-stage |
| S-08: Single-client only | Per-client configuration namespace | Multi-client deployment not possible |
| S-09: Static audit log export | Persistent audit data store | Compliance artifact not API-accessible |
| S-10: Manual index rebuild | Automated change record workflow | Data model changes require manual intervention |

---

## Section 1 — Stack Architecture Overview

**Primary readers: Marketing Technology Director / VP of Marketing Operations + Platform Engineer**

This section provides the authoritative stack diagram and integration narrative. Every system, every integration direction, and every data payload type is specified. Integration direction governs which system configures the connector and which configures the field mapping — this is Raab's requirement, and it is enforced throughout this document.

---

### 1.1 The Full Stack

The Kalder program operates across five functional layers. Every system that touches program data is shown.

```
┌─────────────────────────────────────────────────────────────┐
│  COLLECTION LAYER                                           │
│  Adobe Analytics ──→ AEP (behavioral events, 20 types)     │
│  Segment (Twilio) ──→ AEP (event routing)                  │
│  Kafka ──→ AEP (Salesforce opportunity stage, near-RT)      │
│  Marketo ──→ AEP (identity resolution: email → contact_id) │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  CDP + INTELLIGENCE LAYER                                   │
│  AEP Real-Time CDP B2B Edition                              │
│  - Unified contact + account profiles                       │
│  - Seven-step classify_visitor() scoring pipeline           │
│  - Tier 1 ML classifier integration                         │
│  - Four campaign cohort audience segments                   │
│  - Holdback group assignment (~10%)                         │
│  - 6sense (intent enrichment)                               │
│  - Demandbase (firmographic enrichment — Track 2 DPA req'd) │
└──────┬──────────────────────────────────┬───────────────────┘
       │                                  │
┌──────▼────────┐              ┌──────────▼───────────────────┐
│  ACTIVATION   │              │  SALES ACTIVATION            │
│  LAYER        │              │  AEP → Salesforce CRM        │
│  AEP → Target │              │  (convergence point alerts)  │
│  Sanity →     │              │  Salesforce → Outreach       │
│  Target       │              │  (sequence triggers)         │
│  (offer       │              │  AEP → Marketo               │
│  catalog sync)│              │  (cohort enrollment +        │
└──────┬────────┘              │   attribute sync)            │
       │                       └──────────────────────────────┘
┌──────▼────────────────────────────────────────────────────┐
│  WEB EXPERIENCE LAYER                                     │
│  Adobe Target — experience assembly at render time        │
│  Reads: AEP audience segment membership                   │
│         Sanity offer catalog (synced at content approval) │
│  Outputs: role × confidence × stage × solution_category   │
│           personalized page composition                   │
└───────────────────────────────────────────────────────────┘
```

### 1.2 Integration Direction and Configuration Ownership

For each of the nine integrations, the table below specifies direction, which system configures the connector, and which system configures the field mapping. Reversing these assignments is the most common source of field mapping failures in enterprise CDP implementations.

| # | Integration | Direction | Connector owner | Field mapping owner |
|---|---|---|---|---|
| I-01 | Adobe Analytics → AEP | Inbound to AEP | AEP (Analytics source connector) | AEP schema (§CA attribute map) |
| I-02 | Marketo → AEP | Inbound to AEP | AEP (Marketo source connector) | AEP identity graph (email → contact_id) |
| I-03 | AEP scoring pipeline | Internal | AEP (pipeline jobs) | classify_visitor() function (§12 SCORING_RULES) |
| I-04 | AEP → Adobe Target | Outbound from AEP | AEP (Target destination connector) | Target audience definitions (per §CA) |
| I-05 | Sanity → Adobe Target | Outbound from Sanity | Sanity (webhook) + sync pipeline | Offer catalog field mapping (Document 4 §8.3.2) |
| I-06 | AEP → Marketo | Outbound from AEP | AEP (Marketo destination connector) | Marketo program IDs (client-configured at onboarding) |
| I-07 | AEP → Salesforce | Outbound from AEP | AEP (Salesforce CRM destination connector) | Salesforce custom fields (client-provisioned at onboarding) |
| I-08 | Salesforce → Outreach | Outbound from Salesforce | Outreach (Salesforce integration) | Sequence IDs (client-configured at onboarding) |
| I-09 | Kafka → AEP | Inbound to AEP | Kafka (Salesforce Opportunity object schema) | AEP account profile (sfdc_opportunity_stage integer mapping) |

### 1.3 Data Flow by Layer

**Signal collection to AEP (I-01, I-02, I-09).** Adobe Analytics captures 20 behavioral event types from kalder.com page views and interactions. Events are routed to AEP via the Adobe Analytics source connector in real time. Marketo contributes one inbound flow — identity resolution — linking known visitor email addresses to resolved `contact_id` values in the AEP identity graph. This enables the contact-plane scoring model to assign behavioral signals to named individuals rather than anonymous cookies. Kafka provides a separate inbound stream carrying Salesforce opportunity stage data, enabling `progression_win_now` cohort differentiation independent of the behavioral scoring pipeline.

**CDP classification (I-03).** AEP runs the seven-step classify_visitor() function on each session that passes the quality gates. The function applies decay-weighted behavioral signals, applies the differential_insufficient check, assigns confidence tier, and writes all classified attributes to the AEP contact profile. Tier 1 ML classifier output (when active) is applied at Step 7 of the scoring pipeline, overriding Tier 3 behavioral assignments when a higher-authority Tier 1 classification is available. Holdback group assignment is set once at first TAL identification and persists — it is never reassigned.

**Activation (I-04, I-05, I-06, I-07, I-08).** AEP activates four audience segments to Adobe Target. Target evaluates activity priority against segment membership at each page request and selects the appropriate experience. Sanity provides the offer catalog — the content available for Target to serve within each activity — via webhook-triggered sync on every content approval event. AEP activates two outbound flows for sales and email: the Salesforce CRM destination connector writes convergence point alert payloads; the Marketo destination connector manages cohort enrollment and attribute sync.

---

## Section 2 — AEP Real-Time CDP B2B Edition Configuration

**Primary reader: Platform Engineer / MarTech Architect**

This section specifies the production AEP configuration that replaces POC Simplifications S-01 and S-02. Marketing Technology Directors should read Section 2.1 (licensing prerequisite) and skip to Section 9 for the full prerequisites framework.

---

### 2.1 B2B Edition Licensing Prerequisite

> **LICENSING REQUIREMENT — AEP Real-Time CDP B2B Edition required**
> Standard AEP CDP cannot represent the composite `(contact_id, solution_category)` classification key on which this program's data model is built. B2B Edition provides the account-contact relationship model — the data structure that associates a contact's classification (role, confidence tier, buying group stage) with a specific solution category at a specific account. Standard edition has no native object model for this relationship.
> This requirement must be confirmed before any configuration work begins. Standard edition implementations cannot be upgraded to B2B Edition without full data re-ingestion. If your current AEP license is standard edition, begin the SKU upgrade process before scheduling any schema or pipeline configuration.
> Authority: Document 8 Section 2; data model v0.2.0 composite key specification.

### 2.2 Schema Configuration

The AEP contact-plane and account-plane schemas must be configured to carry the full `CLIENT_ATTRIBUTE_MAP` (§CA) attribute registry. Thirty-six attributes are registered across three planes.

**Contact-plane attributes (scored per `(contact_id, solution_category)` key):**

| Canonical Attribute Name | Type | Allowed Values | Source Pipeline | Onboarding Required |
|---|---|---|---|---|
| `role_classification` | Enum | `champion` / `economic_buyer` / `influencer` / `user` / `ratifier` / `default` | AEP scoring pipeline (classify_visitor()) | No — computed |
| `confidence_tier` | Enum | `HIGH` / `MEDIUM` / `LOW` / `UNKNOWN` | AEP scoring pipeline | No — computed |
| `role_confidence_score` | Float | 0.0 – 100.0 | AEP scoring pipeline | No — computed |
| `fallback_level` | Integer | 1 / 2 / 3 / 4 / 5 | AEP pipeline (derived from confidence_tier and coverage_status) | No — computed |
| `differential_insufficient` | Boolean | `true` / `false` | AEP scoring pipeline | No — computed |
| `holdback_group` | Boolean | `true` / `false` | AEP pipeline (random assignment at first TAL identification) | No — computed |
| `visitor_consent_state` | Enum | `full` / `functional_only` / `declined` | CMP → AEP Edge Network | Yes — CMP must write before first session |
| `buying_job_confirmed` | Enum | `problem_identification` / `solution_exploration` / `requirements_building` / `supplier_selection` / null | AEP pipeline (from zero-party event) | No — event-driven |
| `buying_job_inferred` | Enum | same as above / null | AEP scoring pipeline (behavioral inference) | No — computed |
| `role_classification_zero_party` | Enum | role values / null | Segment event pipeline (progressive_disclosure response) | No — event-driven |

**Account-plane attributes:**

| Canonical Attribute Name | Type | Allowed Values | Source Pipeline | Onboarding Required |
|---|---|---|---|---|
| `tal_program_status` | Enum | `active_prospect` / `customer` / `suppressed` | TAL upload + CRM sync | Yes — TAL list required |
| `tal_solution_interest_flags` | Array | solution_category keys | 6sense intent data + analytics aggregation | No — computed |
| `tal_region` | Enum | `AMS` / `EMEA` / `APJ` | Salesforce CRM (RevOps-managed) | Yes — CRM field mapping |
| `tal_marquee` | Boolean | `true` / `false` | Client-provided (RevOps flag) | Yes |
| `tal_open_pipeline` | Boolean | `true` / `false` | Salesforce CRM (opportunity present) | Yes — CRM field mapping |
| `tal_channel` | Enum | `direct` / `msp` / `partner` | Salesforce CRM | Yes — CRM field mapping |
| `bg_stage` | Enum | `targeted` / `engaged` / `prioritized` / `qualified` | AEP pipeline (engagement signal aggregation) | No — computed |
| `bg_cohort` | Enum | `education` / `acquisition` / `progression_early_to_mature` / `progression_win_now` | AEP pipeline (from bg_stage + sfdc_opportunity_stage) | No — computed |
| `sfdc_opportunity_created` | Boolean | `true` / `false` | Salesforce CRM via Kafka pipeline | Yes — Salesforce field mapping |
| `sfdc_opportunity_stage` | String | Client-defined Salesforce stage values | Salesforce CRM via Kafka pipeline | Yes — stage-to-integer mapping table required |
| `sfdc_opportunity_stage_stale` | Boolean | `true` / `false` | AEP pipeline (24-hour staleness flag) | No — computed |
| `coverage_status` | Enum | `pending` / `constructed` / `partial` / `complete` | Sanity-to-AEP pipeline (minimum-rank rollup) | No — computed |

All attribute references throughout the program resolve through the `CLIENT_ATTRIBUTE_MAP` (§CA) at runtime. Do not hardcode canonical attribute names — map through §CA to allow client-specific field naming at onboarding.

### 2.3 Signal Collection Architecture

Twenty first-party behavioral signals are collected from Adobe Analytics. All twenty are classified as `legitimate_interest` signals — they do not require explicit visitor consent beyond the Track 1 LIA (see Section 8.1). One additional signal — `demandbase_firmographic_match` — is `explicit_consent_required` and is governed by Track 2 DPA review (see Section 8.1).

**Session quality gates must pass before any signal observations are recorded for a session:**

- Minimum session duration: 60 seconds
- Minimum page views: 2 (OR single-page session with ≥30 seconds dwell time)
- Human behavior pattern confirmation: bot-traffic exclusion via Analytics segment filter

Sessions that fail any quality gate produce no signal observations. Prior signal observations from qualifying sessions remain in the contact's observation history within their decay windows.

**Signal decay:** All signal observations carry time-decay weights per `DECAY_MULTIPLIERS` (§8):

| Recency window | Decay multiplier |
|---|---|
| 0–30 days | 1.0× |
| 31–60 days | 0.7× |
| 61–90 days | 0.5× |
| 91–180 days | 0.3× |
| Over 180 days | 0.0× (zero weight; not scored; retained until 365-day deletion) |

**The 20 legitimate_interest behavioral signals and their classification weights** are specified in Document 2 Section 3 and §12 SCORING_RULES. Configure each signal as a named AEP event type with the Analytics event name, AEP schema field, and pre-scoring filter rules from Document 2. Platform Engineers must map each signal to its §CA canonical attribute name — do not use Analytics variable names directly in the AEP schema.

### 2.4 Scoring Pipeline Implementation

The `classify_visitor()` function runs on each qualifying session. The seven-step sequence is authoritative from §12 SCORING_RULES and Document 2 Section 5. Implement exactly as specified — partial implementations (e.g., omitting the differential check or the confidence ceiling step) produce incorrect confidence tier assignments that propagate through all downstream systems.

**Seven steps:**

1. Retrieve all signal observations for `(contact_id, solution_category)` within 180-day decay window
2. Apply decay multipliers per §8 DECAY_MULTIPLIERS
3. Compute decay-adjusted per-role score for each of the five buying group roles
4. Check firmographic bonus eligibility (requires Track 2 DPA completion + `visitor_consent_state: full`)
5. Apply `differential_insufficient` check: if highest-scoring role score minus second-highest is < differential_threshold, set `differential_insufficient: true` → Level 3 override
6. Assign leading role as `role_classification`
7. Assign confidence tier: if Tier 1 ML classifier active and classifies this contact → use Tier 1 assignment; else if Tier 2 zero-party declaration present → use Tier 2; else apply Tier 3 behavioral tier (MEDIUM ceiling applies when Tier 1 absent — see Section 2.5)

**Scoring trigger:** Runs at session close. Re-runs immediately on zero-party declaration event (progressive_disclosure response) — the re-run must be synchronous with the declaration event so the visitor's next page load reflects their stated role.

**AEP attributes written per run:** `role_classification`, `confidence_tier`, `role_confidence_score`, `differential_insufficient`, `buying_job_inferred`, `fallback_level` (derived from confidence_tier + coverage_status).

### 2.5 Tier 1 ML Classifier Specification

> **COLD-START REQUIREMENT — read before activating the program**
> A client deploying the program without sufficient historical behavioral CRM data cannot activate Tier 1 at launch. Interim operating state during cold-start period: **Tier 3 behavioral scoring only; MEDIUM confidence ceiling applies; HIGH confidence assignments are not possible until classifier training completes.**
>
> **Minimum training data threshold:** 500 contacts with resolved CRM role assignments AND documented behavioral signal history in AEP (minimum 90 days of qualifying sessions). Fewer than 500 contacts produces a classifier with insufficient precision to safely override Tier 3 behavioral assignments — below this threshold, Tier 1 activation would degrade, not improve, overall classification accuracy.
>
> **Estimated timeline:** Tier 1 training data accumulation typically requires 4–8 months of live program operation under Tier 3 (MEDIUM ceiling) before the 500-contact threshold is reached. Training and validation requires an additional 4–6 weeks after threshold is reached. Earliest realistic Tier 1 activation: 5–9 months post go-live.
>
> **Milestone for Tier 1 activation:** Data Science Lead confirms 500+ resolved contacts with qualifying behavioral history → Training run and cross-validation → Analytics Lead validates accuracy above 80% on held-out test set → Platform Engineer activates Tier 1 integration point in Step 7 of classify_visitor().
>
> The MEDIUM confidence ceiling is not a program limitation — it is the correct behavior of a three-tier confidence system operating on Tier 3 data alone. Clients who expect HIGH confidence assignments at launch without historical classifier data are misinformed about the program's architecture. Surface this requirement at the first client conversation, not after go-live. Authority: Document 2, Section 9.3; POC Simplification S-02.

**Tier 1 integration point in scoring pipeline:** Step 7 of classify_visitor() checks for a Tier 1 ML classifier output on the `(contact_id, solution_category)` key before applying the Tier 3 MEDIUM ceiling. If a Tier 1 output is present and passes accuracy confidence threshold, it overrides the Tier 3 role_classification. If absent, Tier 3 governs with MEDIUM ceiling. The integration point is a conditional branch at Step 7 — no other steps change when Tier 1 activates.

**Training data source:** Historical CRM contact records with confirmed role assignments (from closed-won opportunity data, manual field rep annotations, or AE-confirmed buying group member roles) linked to AEP behavioral signal histories via the identity graph.

### 2.6 Holdback Group Assignment

Holdback group assignment is a one-time, permanent event. Configure before any contacts enter the pipeline.

- **Assignment rate:** ~10% of TAL-identified contacts
- **Assignment mechanism:** Random assignment at first TAL identification event; `holdback_group: true` set on the AEP contact profile
- **Persistence:** `holdback_group: true` persists permanently — it is never reassigned, not cleared post-sale, not overwritten by any scoring run
- **Effect:** Holdback contacts receive Level 5 default brand experience. `progressive_disclosure` slot is architecturally suppressed (see Section 3.5). Outreach sequence activation is NOT suppressed for holdback contacts — sales activation continues normally. The holdback prevents the contact from generating zero-party Tier 2 data, creating a measurement-clean control group
- **Measurement purpose:** The holdback group provides the baseline for Program Value (T1 metrics) — the causal inference foundation for "did the program produce revenue outcomes beyond what would have occurred without personalization?" without the holdback, this question cannot be answered causally. Authority: Document 7 Section 3.1; Document 5 §2.6

**Configuration gate:** Holdback group assignment must be configured and verified in AEP before the program goes live. If contacts enter the AEP pipeline before holdback assignment is configured, they are ineligible for holdback (they have already received their first personalized experience) and the measurement design is compromised. This gate cannot be retroactively remediated. Authority: Document 8 Section 11.2.

### 2.7 Data Retention Configuration

Configure rolling-window deletion for each data class. These are legal obligations, not operational preferences.

| Data Class | Retention Window | Storage System | Deletion Mechanism |
|---|---|---|---|
| Raw behavioral signals | 365 days | AEP event stream + Segment | Rolling window auto-expire |
| Scored role attributes | 180 days | AEP profile attributes | Rolling window auto-expire |
| Firmographic enrichment cache | 90 days | Demandbase cache in AEP | Rolling window auto-expire; suppressed from scoring immediately on consent withdrawal |
| CRM buying group enrichment fields | 730 days | Salesforce CRM (enrichment fields only) | DSR or contract termination — Step 4 cascade |

DSR deletion cascade (four steps, SLA clock starts at trigger event timestamp): Step 1 — AEP profile deletion, 72-hour SLA; Step 2 — Segment event suppression + deletion request, 72-hour SLA; Step 3 — Snowflake warehouse deletion, 168-hour SLA; Step 4 — Salesforce CRM enrichment field nulling, 168-hour SLA.

**Note on scoring decay vs. legal retention:** Signal observations older than 180 days contribute 0.0× to scoring (over_180_days decay multiplier). They are not deleted at 180 days — they remain in storage until the 365-day retention window expires. A compliance reviewer will find zero-weight signal observations in AEP. This is compliant and expected. Do not delete data at the scoring decay boundary — delete at the legal retention boundary. These are separate instruments and must be configured separately. Authority: Document 9 Section 6.3.

---

## Section 3 — Adobe Target Configuration

**Primary reader: Platform Engineer / MarTech Architect**

This section specifies the Target activity architecture that governs personalized experience delivery. Two non-negotiable architectural requirements are specified in callouts below. They are architectural — not configuration preferences — because their violation produces structural failures that no offer-level configuration can remediate.

---

### 3.1 Activity Priority Convention

Target evaluates activities in priority order. The four-digit priority scheme encodes the personalization axis, campaign cohort, and module type:

- **Thousands digit (1–6):** Personalization axis — 1 = differential_insufficient override, 2 = buying_job axis, 3 = confidence_tier axis, 4 = role axis, 5 = solution_category axis, 6 = account/default level
- **Hundreds digit (0–9):** Campaign cohort — 1 = education, 2 = acquisition, 3 = progression_early_to_mature, 4 = progression_win_now
- **Tens + units (01–99):** Module type index within axis and cohort

Priority is a uniqueness guarantee: every combination of axis × cohort × module type maps to exactly one four-digit priority number. A Platform Engineer adding new content for an existing module type never modifies existing activity priorities — the module type index stays fixed. New module types add new activities at the next available index.

### 3.2 Campaign Cohort Audience Definitions

Four AEP audience segments drive four Target audience gates. Each cohort's AEP segment condition is authoritative from Document 3 Section 2.3.

| Cohort | AEP Audience Gate | Fallback Level Routing |
|---|---|---|
| `education` | `tal_program_status = active_prospect AND bg_stage = targeted` | Level 4 (account-level) for TAL-identified; Level 5 (default) for non-TAL |
| `acquisition` | `tal_program_status = active_prospect AND bg_stage IN [engaged, prioritized] AND sfdc_opportunity_created = false OR null AND contact_engagement_event_count_180d >= 1` | Levels 1–4 per contact classification state |
| `progression_early_to_mature` | `tal_program_status = active_prospect AND bg_stage = qualified AND sfdc_opportunity_created = true AND sfdc_opportunity_stage IN [2,3,4] AND sfdc_opportunity_stage_stale = false` | Levels 1–4 per classification state |
| `progression_win_now` | `tal_program_status = active_prospect AND bg_stage = qualified AND sfdc_opportunity_created = true AND sfdc_opportunity_stage IN [5,6,7] AND sfdc_opportunity_stage_stale = false` | Levels 1–4; PENDING Kafka pipeline (see Section 7) |

### 3.3 `differential_insufficient` Override Activities (Priority 0)

When `differential_insufficient: true`, the contact cannot receive a role-influenced experience regardless of confidence tier. Target override activities at priorities 1001–1004 (one per cohort) fire before any role-axis or confidence-axis activity. These are Priority 0 activities — they precede all other content selection.

Audience condition for each: `bg_cohort = [cohort] AND differential_insufficient = true`. Experience: Level 3 (role-agnostic, buying-stage-appropriate content). Priority 0 routing is the correct response to scoring ambiguity — it is not a failure state.

### 3.4 `cta` Two-Offer-Set Architecture

> **REQUIRED — do not simplify**
> Configure HIGH `cta` (priorities x203 per cohort) and MEDIUM `cta` (priorities x213 per cohort) as **separate Target activities with mutually exclusive audience conditions.**
>
> **HIGH `cta` audience condition:** `confidence_tier = HIGH`  
> **MEDIUM `cta` audience condition:** `confidence_tier = MEDIUM`
>
> These must be separate activities — not two offers within a single activity. A single activity with both HIGH and MEDIUM `cta` offers would rely on offer-level filtering to prevent a MEDIUM-confidence visitor from receiving a HIGH-tagged role-assumptive CTA. Offer filtering is not an audience gate — it is applied after audience qualification. A MEDIUM-confidence visitor who qualifies for the activity via a misconfigured audience condition could receive a HIGH-tagged CTA.
>
> The structural separation via mutually exclusive audience conditions ensures that a MEDIUM-confidence visitor **never qualifies** for the HIGH `cta` activity. Audience non-membership is the binding constraint — it fires before offer selection. A future misconfiguration of offer filtering within either activity cannot create a cross-population serving event because the audience gate excludes the visitor before offer selection occurs.
>
> This separation is not optional. Simplifying to a single activity violates the two-constraint model (Document 5 Section 1) and creates a serving error that cannot be detected in campaign reporting. Authority: Document 5 Section 4.4; Document 2 Section 9.3 (INFERRED offers excluded at MEDIUM confidence).

### 3.5 Holdback Group Activities

Holdback group contacts receive the Level 5 default brand experience with one critical architectural difference: `progressive_disclosure` is explicitly suppressed — not absent from the offer catalog.

> **REQUIRED — do not simplify**
> The `progressive_disclosure` slot must be **explicitly suppressed in each holdback activity via Target audience configuration** (priorities x951–x954, one per cohort).
>
> **Why offer catalog absence is insufficient:** If `progressive_disclosure` suppression is implemented only by ensuring no holdback-visible `progressive_disclosure` offer exists in the Sanity offer catalog, a future content commissioning error — a reviewer who incorrectly tags a node as available to holdback visitors — could introduce a holdback-visible offer into the catalog. Target would then serve it to holdback contacts, breaking the measurement design by enabling Tier 2 zero-party declarations from contacts in the holdback group.
>
> **The required configuration:** Each holdback group activity (x951 through x954) must include an explicit Target audience exclusion for `progressive_disclosure` slot serving — independent of offer catalog state. The suppression must survive any offer catalog state, including a future catalog error.
>
> The `progressive_disclosure` slot must appear in the holdback group experience composition as a **labeled suppressed slot** — not as an absent slot. An absent slot is invisible to measurement review; a labeled suppressed slot is visible and confirms that the architectural suppression is operating correctly. Authority: Document 5 Section 2.6; Document 6 Section 3.7 Requirement 1; Document 8 Section 2.

### 3.6 Offer Catalog Governance

The offer catalog is maintained by the Sanity-to-Target sync pipeline (Document 8 Section 3.7). Every `Content Module` or `Experience` node that transitions to `status: approved` in Sanity triggers a webhook event. The sync pipeline:

1. Writes the node's selection metadata (`role`, `solution_category`, `buying_stage`, `fallback_level`, `confidence_tier_minimum`, `phase`) to the Target offer catalog
2. Recomputes coverage_status for the affected `(solution_category, role, buying_stage)` tuple
3. Executes the `phase: converge` pre-write exclusion check — converge-phase nodes are excluded from the offer catalog before any write executes

**The `phase: converge` exclusion is enforced at the sync pipeline pre-write check — not in Target.** No Target activity configuration is required to enforce this exclusion. If the sync pipeline pre-write check is bypassed or misconfigured, converge-phase nodes could enter the offer catalog and be served in individual-evaluation web experiences. Catalog integrity audit is a Document 8 operational procedure.

---

## Section 4 — Sanity CMS Content Graph Configuration

**Primary reader: Platform Engineer / MarTech Architect**

This section specifies the Sanity content graph schema, sync pipeline setup, coverage activation gates, and content generation context. The content graph is the offer catalog source — its configuration determines what Target can serve. Marketing Technology Directors should read Section 4.3 (commissioning timeline) and proceed to Section 9.

---

### 4.1 Ten Node Type Schema Configuration

The content graph is built from ten node types, specified in §16 CONTENT_GRAPH_NODE_TYPES. Each node type has a defined schema, cross-node reference constraints, and a required set of fields that must be populated before the node can enter `status: approved`.

| Node Type | Purpose | Key Fields | Cross-node references |
|---|---|---|---|
| `Audience` | Defines who a content strand addresses | role, solution_category, buying_stage | Referenced by Narrative |
| `JTBD` | Jobs-to-be-done buying job mapping | buying_job, solution_category, jtbd_code | Referenced by Content Module |
| `Problem` | Problem statement for solution category | solution_category, problem_statement | Referenced by Narrative |
| `Outcome` | Desired outcome for role × solution_category | role, solution_category, outcome_statement | Referenced by Narrative |
| `Narrative` | Through-line message pillar | solution_category, buying_stage, solution_claim, message_pillar | References Audience, Problem, Outcome |
| `Proof` | Proof points supporting Narrative claims | proof_type, solution_category, narrative_ref | References Narrative |
| `Asset` | Individual content objects | content_type, gating, confidence_tier_minimum, buying_job | Referenced by Content Module |
| `Content Module` | Assembled module for Target serving | module_type, role, solution_category, buying_stage, confidence_tier_minimum, phase, narrative_ref, jtbd_ref | References Narrative, JTBD, Asset |
| `Experience` | Multi-module composition for a specific state | fallback_level, solution_category, role, buying_stage | References Content Module |
| `Channel` | Delivery channel variant specifications | channel_type, sequence_id | Referenced by Content Module |

**Content-plane attributes (`confidence_tier_minimum`, `phase`) are stored in Sanity — not in AEP.** Target reads these fields from the synchronized offer catalog at activity resolution time. Do not configure `confidence_tier_minimum` as an AEP profile attribute. It is a content eligibility gate stored on the content node, not a visitor attribute.

### 4.2 Sanity-to-Target Sync Pipeline

**Trigger:** Webhook on every `status: approved` transition on any `Content Module`, `Experience`, or `Asset` node.

**Three automated GROQ validation functions** fire at every `status: approved` transition. All three must pass before the node enters approved state and the sync pipeline executes:

**Function 1 — Narrative status check:** Queries the referenced Narrative document's status field. Fails if Narrative is not `approved`. Error: `"Referenced Narrative node [id] must be in approved status before this Content Module can be approved."`

**Function 2 — JTBD solution_category match:** If `jtbd_ref` is present, queries the referenced JTBD document's solution_category. Fails if solution_category does not match. Error: `"Referenced JTBD node [id] belongs to solution_category [X]; this node's solution_category is [Y]. jtbd_ref must reference a JTBD node in the same solution_category."`

**Function 3 — Narrative scope check:** Queries the referenced Narrative document's solution_category and buying_stage. Fails if either does not match the Content Module's corresponding fields. Error: `"Referenced Narrative node [id] scope mismatch on [field]. Content Module approval blocked."`

**Performance requirement:** All three validation functions must complete within 2 seconds per node under simulated concurrent publication of 10 nodes. Test before production commissioning. If any function exceeds 2 seconds at 10 concurrent publications, optimize GROQ queries (index hints, projection narrowing) before opening the content graph for production use. Authority: Document 4 Section 8.6.

**Fields synchronized to Target offer catalog:** `role`, `solution_category`, `buying_stage`, `fallback_level`, `confidence_tier_minimum`, `phase`, `module_type`, node ID, Sanity asset URL.

**Coverage status recomputation:** Executes after each successful offer catalog write. Applies the `minimum_across_all_associated_entities` inheritance rule — the effective coverage_status for a solution category is the minimum coverage_status across all associated JTBD, Audience, and Content Module nodes.

### 4.3 Coverage Status Activation Gates

The four-state coverage hierarchy governs which fallback levels are available for a solution category:

| Coverage Status | Definition | Fallback Levels Activated |
|---|---|---|
| `pending` | No approved content for this solution category | Level 5 only (default experience) |
| `constructed` | Foundational nodes approved (Narrative, Audience, JTBD for all 4 buying jobs) but Level 3 threshold not yet met | Level 4 (account-level experience) only |
| `partial` | Level 3 content threshold met (≥3 ungated assets, ≥2 distinct buying_jobs); role-variant nodes do not yet exist; `pending_solution_fallback` deactivates at this state | Level 3 only — MEDIUM and HIGH confidence visitors route to Level 3, not Level 2 or Level 1; role-influenced experience requires `complete` |
| `complete` | Full role × stage matrix at full completeness threshold | Levels 1, 2, 3, and 4 |

> **CONTENT COMMISSIONING TIMELINE — plan accordingly**
>
> **Implementation timeline: 6–10 weeks from checklist start to Level 3 go-live.**
>
> **Gate 0 — Foundational node authoring (2–3 weeks):** Narrative and Audience node authoring, review, and approval. This is the critical path constraint. Gate 0 cannot be parallelized — Content Module authoring requires approved Narrative nodes. No resources can accelerate this gate; it is constrained by authoring, review, and approval sequencing.
>
> **Gate 1 — Level 3 commissioning (1–2 weeks after Gate 0):** 11 Content Module nodes generated, reviewed, approved, and synced to the Target offer catalog. Coverage status advances to `partial` on successful Gate 1 completion.
>
> **Level 2 and Level 1 commissioning** continue on the ongoing sprint cadence after Level 3 go-live.
>
> Teams that complete AEP and Target configuration in weeks 2–4 should expect to wait for Gate 0 completion before web personalization goes live. Technical configuration does not accelerate content readiness. Plan content commissioning as a separate workstream beginning in week 1, not after technical configuration is complete. Authority: Document 8 Section 11.

### 4.4 Kalder Compose Generation Context

Kalder Compose generates Content Module draft copy using structured context inputs. The following fields are required in the generation context per node type:

| Node Type | Required Generation Context Fields |
|---|---|
| `Content Module` — hero | role, solution_category, buying_stage, confidence_tier_minimum, solution_claim (from Narrative), message_pillar (from Narrative) |
| `Content Module` — cta | role, confidence_tier (HIGH or MEDIUM), jtbd_code, buying_job, desired next action |
| `Content Module` — benefits | role, solution_category, outcome_statement (from Outcome node), three primary benefit claims |
| `Asset` | content_type, buying_job, gating level, target_role, solution_category |

Generated content enters the review workflow at R1 (AI-generated, unreviewed). It must pass R2 (technical accuracy review), R3 (confidence_tier_minimum and metadata tagging review), and R4 (editorial and brand standards review) before entering `status: approved`. The R3 stage is where `confidence_tier_minimum` is set on each node — this field is a human judgment call, not a generated value.

---

## Section 5 — AEP → Salesforce → Outreach Integration

**Primary readers: Platform Engineer / MarTech Architect + Marketing Technology Director**

This section specifies the sales activation pipeline that replaces POC Simplifications S-04 and S-05. The routing architecture, Salesforce provisioning requirements, canonical alert payloads, and Outreach configuration are specified for Platform Engineers. The section closes with a one-page BDR Field Guide for BDRs and AEs who receive and act on alerts — that guide is written for sales practitioners, not engineers.

---

### 5.1 Routing Architecture

> **ROUTING CONFIRMED — AEP → Salesforce → Outreach**
> The data path for all convergence point alerts: AEP Real-Time CDP native Salesforce CRM destination connector writes alert fields to Salesforce custom fields. Salesforce → Outreach: Outreach Salesforce integration detects the CRM field update and activates the pre-configured sequence. No custom middleware required.

Three onboarding configuration requirements must be completed before sales activation goes live:

1. **Salesforce custom field provisioning** (see Section 5.2)
2. **Outreach-Salesforce integration trigger configuration** (see Section 5.4)
3. **60-minute SLA monitoring configuration** (see Section 5.6)

**Alert delivery SLA:** 60 minutes from AEP convergence point trigger event to Salesforce CRM task creation. The 60-minute window covers three pipeline components: AEP trigger → AEP connector write → Salesforce custom field update → Outreach sequence activation. If any component fails, the entire pipeline fails silently — AEP does not retry failed connector writes. Monitoring per Section 5.6 is required to detect silent failures.

### 5.2 Salesforce Custom Field Provisioning

Three custom fields are required per convergence point. Seven convergence points = minimum 21 Salesforce custom fields.

| Field | Data Type | Minimum Field Length | Canonical vs. Client-Configured |
|---|---|---|---|
| `convergence_point` | Text | 50 characters | Canonical — do not rename |
| `roles_active` | Text (multi-select or long text) | 150 characters | Canonical — do not rename |
| `recommended_action` | Long text area | **280 characters minimum** | Canonical — do not rename; do not truncate |

The `recommended_action` field character limit is not advisory. The longest canonical `recommended_action` text (see Section 5.3) requires 280 characters. A Salesforce custom field provisioned with fewer than 280 characters will truncate the canonical text. Truncation eliminates the action specificity that makes the alert useful rather than noise — a truncated `recommended_action` is indistinguishable from a generic notification. Verify the character limit on this field before marking sales activation go-live.

**Field names are client-configured — the data written to them is canonical.** Clients may name the Salesforce custom fields according to their internal naming conventions. The canonical text written to those fields by the AEP connector may not be modified.

### 5.3 Alert Payload Specification

Every convergence point alert produces a six-field payload. Three fields are canonical — owned by the program and not modified at onboarding. Three fields are client-configured.

| Field | Canonical / Client-Configured | Notes |
|---|---|---|
| `bg_stage` | **Canonical** | Current buying group stage at alert time |
| `convergence_point` | **Canonical** | Named convergence point being approached |
| `roles_active` | **Canonical** | Roles at MEDIUM+ confidence at this account |
| `blocker_risk` | **Canonical** | Named blocker conditions at this convergence point |
| `recommended_action` | **Canonical — must not be modified** | Specific practitioner action instruction |
| `crm_field` | Client-configured at onboarding | Salesforce field name — client naming convention |
| `sdr_sequence` / `alert_channel` | Client-configured at onboarding | Outreach sequence ID; delivery channels |

**Canonical `recommended_action` text per convergence point — reproduced verbatim:**

**`problem_validation`:**
> "Champion and EB are approaching problem alignment. Engage now with external validation content (benchmark report, peer references, analyst data) to reinforce urgency. Do not introduce solution content yet — the group is still in diverge phase. A sales touch at this point should share a relevant benchmark or named-account story, not pitch features."

**`requirements_framing`:**
> "Champion is building or expanding the requirements framework. This is the moment to understand which requirements the group is prioritizing and to confirm that your differentiators align with those priorities. Provide a requirements guide or solution comparison framework — not a demo request. The group is still evaluating criteria, not vendors."

**`solution_validation`:**
> "Economic Buyer is entering the evaluation. This role validates the Champion's recommendation against business outcomes. Prioritize ROI evidence — case studies with quantified outcomes, ROI calculators, or analyst validation — that the EB can use to build or stress-test the business case. Do not re-pitch to the Champion at this stage; support the EB's independent validation process."

**`business_value_alignment`:**
> "EB is building or stress-testing the business case. Provide a pre-built ROI model with inputs populated for their industry and company size. The goal is to make the EB's business case construction as easy as possible — not to control the narrative. An EB who builds their own business case using your model is more committed than one who receives a pre-built case from the vendor."

**`risk_compliance_validation`:**
> "Ratifier is entering the evaluation. This role's primary concern is risk — legal, security, procurement, or financial. Proactively provide the SOC 2 report, DPA template, and Trust Center summary before the Ratifier asks. Reactive Ratifier engagement is the most common failure mode at this convergence point. If the Ratifier has to request compliance documentation, the deal has already slowed. If purchasing_rules_overrule_group_decision fires at this stage, escalate immediately to executive sponsorship."

**`final_commitment`:**
> "Full buying group is aligned and approaching commitment. Remove remaining friction — proactively provide procurement guide, contract redline support, and implementation timeline. If buying_group_turnover is active at this stage, treat it as partial_reset: re-brief the new member on the full business case before re-engaging on commitment. If purchasing_rules_overrule_group_decision fires at this stage, escalate immediately — it is a full_reset blocker and requires executive-level engagement to resolve."

> **REQUIRED — Do not rewrite `recommended_action` text**
> The `recommended_action` field is a program output, not a template. It encodes the buying group model's interpretation of the specific buying moment. Clients who rewrite it to match preferred sales language remove the specificity that makes the alert useful rather than noise. The canonical text must appear unmodified in the CRM task. Confirm at onboarding that the Salesforce custom field character limit accommodates the full text without truncation. Authority: §SA SALES_ACTIVATION_CONFIG `onboarding_note`; Document 6 Section 7.1; Document 8 Section 6.8.

### 5.4 Outreach Sequence Trigger Configuration

One Outreach trigger configuration is required per active convergence point per cohort.

**Configuration steps:**
1. Configure Outreach Salesforce integration to monitor each convergence point's custom field for updates
2. Map each convergence point's field update to the appropriate pre-configured Outreach sequence ID
3. Configure `tal_channel` routing: `direct` accounts → standard sequences; `msp` and `partner` accounts → channel-specific sequences or partner-aware teams. Channel-variant configuration is required for all three channel types before sales activation goes live for non-direct accounts
4. Verify fallback: accounts without a configured channel-variant sequence fall back to `direct` routing (verify this is appropriate for your channel model)

**Per-cohort alert activation:**

| Cohort | Active convergence point alerts | Alert recipient |
|---|---|---|
| `education` | None | — |
| `acquisition` | `problem_validation`, `requirements_framing` | BDR (SDR-owned sequence) |
| `progression_early_to_mature` | `solution_validation`, `business_value_alignment`, `risk_compliance_validation` (standard priority) | AE (AE-owned sequence) |
| `progression_win_now` | `final_commitment`, `risk_compliance_validation` (elevated priority) | AE (AE-owned sequence) — PENDING Kafka pipeline |

### 5.5 Two Contact-Level Gates

Both gates must clear before any Outreach sequence activates for a contact. A contact that clears Gate 1 but fails Gate 2 receives no sequence — not a default sequence. The sales team should not expect sequences for contacts that fail either gate.

**Gate 1 — Confidence tier minimum:** `confidence_tier = MEDIUM` or higher. A contact with `confidence_tier = LOW` or `UNKNOWN` has not accumulated sufficient behavioral evidence for role-directed sales action. Sequences for low-confidence contacts produce noise without signal.

**Gate 2 — Differential sufficient:** `differential_insufficient = false`. A contact whose role score differential is below the differential threshold cannot be reliably classified as a specific role. Sequences directed at an ambiguous role classification send the wrong message to the wrong contact.

**Why didn't my sequence fire?** Check both gates before investigating Outreach or Salesforce configuration. Sequences do not fire — and should not — for contacts that fail either gate. Gate 1 and Gate 2 are visible in the AEP contact profile.

### 5.6 60-Minute Alert Delivery SLA

The three pipeline components and their monitoring checks:

| Component | Monitoring check | Action on failure |
|---|---|---|
| AEP trigger → AEP connector write | AEP activation log — confirm event delivery within 5 minutes of trigger | Check AEP activation job status; escalate to Platform Engineer |
| AEP connector → Salesforce field update | Salesforce field audit log — confirm update within 30 minutes of AEP event | Check AEP connector error log; escalate to Platform Engineer |
| Salesforce field update → Outreach sequence | Outreach sequence enrollment — confirm within 60 minutes of AEP trigger | Check Outreach Salesforce integration activity log; escalate to Outreach admin |

Alert pipeline health is checked weekly. Any convergence point with a missed SLA in the monitoring window must be investigated before marking the weekly check complete. Silent failures (no error visible, no sequence fired, no CRM task) require Platform Engineer escalation — the AEP connector does not retry failed writes.

---

### BDR Field Guide

**For BDRs and AEs — not for Platform Engineers**

This page is your complete reference for what alerts to expect, what they mean, and what to do when one arrives.

---

**How alerts reach you.** Alerts arrive in two places: as a CRM task in Salesforce, and (depending on your configuration) in your Slack SDR channel. Check both if you are not seeing expected alerts.

**When you will not receive an alert.** Alerts only fire for contacts who: (1) are classified at MEDIUM confidence or higher, AND (2) have a clear role classification (not ambiguous). An account with strong engagement but ambiguous role signals will not trigger an alert. This is correct behavior — an ambiguous classification produces an incorrect sales action. Wait for confidence to resolve.

**Education-cohort accounts** do not generate alerts. If an account is in early discovery with no identified buying group members, you will not receive an alert. Focus on discovery, not sequence activation.

---

**ALERT: `problem_validation`**

**When it fires:** An account in the acquisition cohort (no open opportunity yet) where the Champion has reached MEDIUM or higher confidence AND the Economic Buyer has been active in the last 30 days. The buying group is consuming problem-framing content.

**What this means:** The Champion and EB are approaching agreement that a problem worth solving exists. They are not yet evaluating solutions. Do not pitch features or request demos. The group needs external validation that the problem is real and significant.

**What to do:**
> "Champion and EB are approaching problem alignment. Engage now with external validation content (benchmark report, peer references, analyst data) to reinforce urgency. Do not introduce solution content yet — the group is still in diverge phase. A sales touch at this point should share a relevant benchmark or named-account story, not pitch features."

---

**ALERT: `requirements_framing`**

**When it fires:** Acquisition cohort. Champion is actively building or expanding requirements — consuming solution comparison, vendor evaluation, and criteria-building content.

**What this means:** The group is deciding what they need before deciding who can provide it. Your job is to help them build requirements that your solution satisfies.

**What to do:**
> "Champion is building or expanding the requirements framework. This is the moment to understand which requirements the group is prioritizing and to confirm that your differentiators align with those priorities. Provide a requirements guide or solution comparison framework — not a demo request. The group is still evaluating criteria, not vendors."

---

**ALERT: `solution_validation`**

**When it fires:** Progression (early-to-mature) cohort — an opportunity is open. Economic Buyer is entering the evaluation alongside the Champion.

**What this means:** The EB needs to validate that what the Champion recommends is real and justified. They are building or checking the business case independently of the Champion's recommendation.

**What to do:**
> "Economic Buyer is entering the evaluation. This role validates the Champion's recommendation against business outcomes. Prioritize ROI evidence — case studies with quantified outcomes, ROI calculators, or analyst validation — that the EB can use to build or stress-test the business case. Do not re-pitch to the Champion at this stage; support the EB's independent validation process."

---

**ALERT: `business_value_alignment`**

**When it fires:** Progression cohort. EB is actively building or stress-testing the business case — consuming ROI, financial justification, and value quantification content.

**What this means:** The EB is doing the math. Make it easy.

**What to do:**
> "EB is building or stress-testing the business case. Provide a pre-built ROI model with inputs populated for their industry and company size. The goal is to make the EB's business case construction as easy as possible — not to control the narrative. An EB who builds their own business case using your model is more committed than one who receives a pre-built case from the vendor."

---

**ALERT: `risk_compliance_validation`**

**When it fires:** Progression cohort (standard priority in early-to-mature; elevated priority in win-now). Ratifier is entering the evaluation — consuming security, compliance, procurement, and legal content.

**What this means:** The deal is real enough that the risk-checker has engaged. This stage kills more deals than any other — through slow Ratifier engagement, reactive documentation sharing, or procurement surprises. Move first.

**What to do:**
> "Ratifier is entering the evaluation. This role's primary concern is risk — legal, security, procurement, or financial. Proactively provide the SOC 2 report, DPA template, and Trust Center summary before the Ratifier asks. Reactive Ratifier engagement is the most common failure mode at this convergence point. If the Ratifier has to request compliance documentation, the deal has already slowed. If purchasing_rules_overrule_group_decision fires at this stage, escalate immediately to executive sponsorship."

**Note:** This alert fires at two priority levels. If the account has a Stage 5–7 Salesforce opportunity, the alert fires at elevated priority — a Ratifier block at this stage is a full-reset risk.

---

**ALERT: `final_commitment`**

**When it fires:** Win-now cohort (Stage 5–7 opportunity). Champion, Economic Buyer, and Ratifier are all active at MEDIUM+ confidence. The group is approaching commitment.

**What this means:** All three key roles are engaged and the deal is at the commitment stage. Your job now is friction removal — not new selling.

**What to do:**
> "Full buying group is aligned and approaching commitment. Remove remaining friction — proactively provide procurement guide, contract redline support, and implementation timeline. If buying_group_turnover is active at this stage, treat it as partial_reset: re-brief the new member on the full business case before re-engaging on commitment. If purchasing_rules_overrule_group_decision fires at this stage, escalate immediately — it is a full_reset blocker and requires executive-level engagement to resolve."

---

**Questions or missing alerts:** Contact your Marketing Ops Engineer. Bring the account name, the expected convergence point, and the date you expected to receive the alert. Do not modify Salesforce custom fields or Outreach sequence configurations — contact the MarTech team.

---

## Section 6 — AEP → Marketo Connector Configuration

**Primary reader: Platform Engineer / MarTech Architect**

This section specifies the Marketo connector configuration that replaces POC Simplification S-06.

---

### 6.1 Two-Mode Connector Architecture

Two operating modes run on the same AEP Real-Time CDP native Marketo Engage destination connector instance — not two separate connectors.

**Streaming mode:** Handles cohort transition events. Fires when a contact's `bg_cohort` changes. Latency target: under 5 minutes from AEP segment transition to Marketo program enrollment event. Streaming activation must be explicitly enabled on the connector — it is not the default mode.

**Daily batch mode:** Handles non-event-driven attribute updates — `role_classification`, `confidence_tier`, `bg_stage`, `differential_insufficient`. These update on the daily scoring cycle and do not generate transition events. Batch sync runs once per day (recommended window: 2:00–4:00 AM client primary timezone). The batch sync updates attribute values on enrolled contacts; it does not fire program entry or exit events.

**Both modes must be monitored independently.** A connector health check that confirms streaming activation is healthy does not independently confirm batch sync health. A connector failure affects both modes simultaneously, but a mode-specific failure (e.g., batch sync schedule misconfiguration) affects only one mode. Both modes require independent monitoring checks per Section 6.5.

### 6.2 Segment-to-Program Mapping

| Cohort | AEP Segment | Marketo Program | Entry Condition |
|---|---|---|---|
| `education` | education segment | **None — intentionally suppressed** | N/A |
| `acquisition` | acquisition segment | Client-configured at onboarding | Resolved contact_id required |
| `progression_early_to_mature` | progression_early_to_mature segment | Client-configured at onboarding | Resolved contact_id required |
| `progression_win_now` | progression_win_now segment | Client-configured at onboarding per Section 8.5 | Resolved contact_id required; PENDING Kafka pipeline |

**Education cohort note:** No Marketo program for the `education` cohort is intentional — not a configuration gap. Do not create an education Marketo program. When an education-cohort account transitions to `engaged` and the first contact is identified, enrollment fires directly in the `acquisition` Marketo program.

> **EXIT-BEFORE-ENTRY ORDERING REQUIRED**
> Configure the connector event sequencing to fire the program exit event before the program entry event for all cohort transitions. This is not the connector default — it must be explicitly set. A contact that enters a new program before exiting the prior program may be double-enrolled if Marketo's program transition logic processes both events simultaneously. Double-enrollment produces duplicate nurture sends and conflicting track assignments. Confirm exit-before-entry ordering is set before testing any cohort transition event.

### 6.3 `role_classification = default` Handling

Contacts enrolled in Marketo before their `role_classification` has resolved from `default` to a named role begin on the general solution-category track. Resolution occurs via three-step sequence:

1. Contact enrolls with `role_classification = default` → assigned to general solution-category nurture track
2. Daily batch sync delivers updated `role_classification` value when scoring resolves it
3. Marketo smart campaign detects the field change and reassigns contact to the role-specific nurture track

> **PRE-LAUNCH GATE — track reassignment smart campaign must be configured before any contacts enroll**
> If the smart campaign is not present when a contact's `role_classification` updates from `default` to a named role, the contact remains on the general track indefinitely **without error** — no alert fires, no enrollment event fails. The contact simply never receives role-specific nurture content. This failure is silent. Configure and test the smart campaign on a test contact before production enrollment begins. Test procedure: enroll a test contact with `role_classification = default`; trigger a batch sync that delivers a resolved role value; confirm the test contact transitions to the role-specific track within one processing cycle.

### 6.4 `progression_win_now` Ordering Constraint

The `progression_win_now` Marketo program must be active and confirmed before AEP fires the first `bg_cohort = progression_win_now` transition event. If the program is not active when the first transition event fires, contacts are unenrolled from the `progression_early_to_mature` program (exit event fires) and fail to enroll in `progression_win_now` (entry event finds no active program). This failure is not recoverable without manual re-enrollment for affected contacts. Activate and confirm the `progression_win_now` Marketo program as part of Section 7 go-live checklist, before enabling the Kafka pipeline that drives `progression_win_now` cohort assignment.

### 6.5 Connector Health Monitoring

Two monitoring checks — both required weekly:

**Enrollment lag check:** Confirm contacts whose AEP segment transitions in a given session are enrolled in Marketo within 30 minutes of the transition event. If any contact's enrollment lag exceeds 30 minutes: (1) Check AEP activation log for event delivery confirmation; (2) Check Marketo connector error log for failed delivery; (3) If no error visible in either log, escalate to Platform Engineer.

**Batch sync completion check:** Confirm daily batch sync completion in the AEP activation log each morning after the scheduled sync window closes. A completed sync shows success status and a row count. If two consecutive daily batch syncs fail: escalate to Platform Engineer immediately. Stale `role_classification` means contacts whose scoring has resolved from `default` are not receiving track reassignment triggers. Do not wait for a third failure.

---

## Section 7 — Kafka Pipeline: Opportunity Stage

**Primary reader: Platform Engineer / MarTech Architect**

This section specifies the Kafka `sfdc_opportunity_stage` pipeline that replaces POC Simplification S-07 and activates the `progression_win_now` cohort.

---

### 7.1 Pipeline Purpose

The Kafka pipeline carries Salesforce opportunity stage data to AEP at near-real-time latency. Its specific purpose is enabling differentiation between `progression_early_to_mature` (Stage 2–4 opportunities) and `progression_win_now` (Stage 5–7 opportunities). Without this pipeline, all `qualified` accounts with open opportunities default to `progression_early_to_mature` — Stage 5–7 accounts receive early-to-mature content and standard-priority alerts instead of final-commitment content and elevated-priority alerts. The business consequence of deferred activation is under-activation of late-stage deals.

**Three enabling capabilities unlocked by pipeline activation:**

1. `progression_win_now` AEP audience segment assignment for Stage 5–7 accounts
2. `final_commitment` convergence point alert at elevated priority for AE-owned sequences
3. `risk_compliance_validation` at elevated priority for late-stage Ratifier engagement

### 7.2 Salesforce StageName Mapping Table

The pipeline requires a client-provided integer mapping table — a mapping of each client-defined Salesforce opportunity StageName (string) to an integer in the range 1–7. This mapping is client-specific and must be confirmed before pipeline implementation.

**Validation requirement:** Map integers 5, 6, 7 explicitly to the client's Stage 5–7 StageName values. These are the qualifying values for `progression_win_now`. `sfdc_opportunity_stage IN [5, 6, 7]` is an enumerated set in the AEP segment definition — not a threshold. Stage values 1–4 must not be included in the `progression_win_now` segment definition even if the client's Salesforce schema assigns those integers to late-stage opportunity names. The client-confirmed mapping table governs.

**Staleness threshold:** 24 hours. `sfdc_opportunity_stage_stale = true` when `sfdc_opportunity_stage` has not been updated within 24 hours. This threshold is tighter than the 72-hour TAL staleness threshold — do not conflate them. The asymmetric risk: a stale Stage 6 account carrying `progression_early_to_mature` treatment is under-served but not harmed; a stale `progression_early_to_mature` account misclassified as `progression_win_now` receives premature high-touch activation that can signal inappropriate urgency to the buying group.

**Staleness fallback:** When `sfdc_opportunity_stage_stale = true`, carry forward the last known cohort assignment rather than defaulting to `progression_early_to_mature`. A stale Stage 6 account is more likely still at Stage 6 than to have regressed to Stage 3.

### 7.3 Five-Condition Go-Live Checklist

All five conditions must be confirmed before the interim fallback rule (all `qualified` accounts default to `progression_early_to_mature`) is removed.

| Condition | Responsible | Pass Criterion |
|---|---|---|
| 1 — Kafka pipeline writing correctly | Platform Engineer | `sfdc_opportunity_stage` shows correct integer value on ≥5 Salesforce accounts, including ≥1 with Stage 5+ opportunity |
| 2 — AEP segment validated | Platform Engineer | `progression_win_now` AEP segment returns ≥1 qualifying account in segment UI |
| 3 — Target x4xx activities serving | Platform Engineer | Test account in `progression_win_now` segment receives Target serve from an x4xx activity |
| 4 — Marketo program active and enrolling | Marketing Ops Engineer | `progression_win_now` Marketo program is active and ≥1 test contact has transitioned from `progression_early_to_mature` |
| 5 — Outreach alerts configured | Marketing Ops Engineer | `final_commitment` and elevated `risk_compliance_validation` Salesforce fields provisioned; test sequence triggered per alert type |

> **REQUIRED — Atomic removal of interim fallback rule**
> The interim fallback rule and the `progression_win_now` activation rule must not be active simultaneously. Remove the interim fallback atomically with `progression_win_now` rule activation. Simultaneous active rules produce double-cohort assignment for Stage 5–7 accounts: the same account enters both `progression_early_to_mature` and `progression_win_now` sequences, generating duplicate alert payloads and conflicting Marketo program enrollments. The Platform Engineer confirms atomic removal before any go-live checklist condition is marked passed. Authority: Document 8 Section 8.8.

---

## Section 8 — Consent Architecture

**Primary readers: Procurement / InfoSec Reviewer + Platform Engineer / MarTech Architect**

This section specifies the consent and privacy architecture governing signal collection, processing, and deletion. Procurement and InfoSec reviewers should read Sections 8.1 through 8.5 in full. Platform Engineers should read all subsections and implement per the specifications in Document 9 (Privacy and Consent Architecture) and Document 8 Section 10.

---

### 8.1 Two-Track Signal Consent Structure

Signal consent is structured across two tracks based on the lawful basis available for each signal type.

**Track 1 — Legitimate Interest (LIA complete; all 20 first-party signals):** The twenty first-party behavioral signals collected from kalder.com page interactions are processed under GDPR Article 6(1)(f) (legitimate interest) and fall outside CCPA opt-out scope. A Legitimate Interest Assessment (LIA) is documented and retained per Document 9 Section 7. These signals may be collected from any visitor whose `visitor_consent_state` is `functional_only` or `full`. They do not require explicit visitor opt-in.

**Track 2 — DPA Required (one signal: `demandbase_firmographic_match`):** The Demandbase reverse-IP firmographic enrichment signal requires: (1) completion of a Data Processing Agreement (DPA) review with Demandbase confirming a 90-day maximum retention window, AND (2) `visitor_consent_state: full` (explicit consent from the visitor). Both conditions must be satisfied before `demandbase_firmographic_match` activates. Track 2 DPA review is a named prerequisite — it is not a day-one activity and it is not satisfied by a Demandbase service agreement alone. A Demandbase DPA specifying a retention window exceeding 90 days does not satisfy the Track 2 gate and must be renegotiated. Authority: Document 9 §P; data model v0.2.0 AR-03.

**Firmographic bonus pathway:** The firmographic scoring bonus (applied in Step 4 of classify_visitor()) activates only when BOTH conditions are met: Track 2 DPA review complete AND `visitor_consent_state: full`. The firmographic bonus is suppressed under `functional_only` even if Track 2 DPA is complete — explicit consent is required at the individual visitor level, not only at the vendor contract level.

### 8.2 `visitor_consent_state` Pre-Pipeline Gate

`visitor_consent_state` is read before any signal collection or scoring executes in a session. Four scenarios govern the read:

| Scenario | Behavior |
|---|---|
| `null` or absent | Apply `declined` behavior — no signal collection, no scoring, Level 5 experience. Null is never permissive. |
| `declined` | No signal collection, no scoring, Level 5 experience. |
| `functional_only` | 20 `legitimate_interest` signals collected and scored. `explicit_consent_required` signals suppressed. |
| `full` | All signals collected and scored (subject to Track 2 DPA completion for firmographic signal). |

**CMP configuration requirement:** The consent management platform must write `visitor_consent_state` to the AEP contact profile before the visitor's second page load. A visitor whose consent state is not written before the second page load receives `declined` treatment for their first session. The CMP is the authoritative source for consent state — not the AEP pipeline, not Demandbase.

**Mid-session consent update:** If a visitor updates consent during an active session, the update propagates to the AEP profile. The current session continues under the prior consent state. The new state applies at next session start only. Signals collected in the current session under the prior consent state are not retroactively suppressed. This is defined operational behavior, not a gap.

**Consent withdrawal:** Triggers the four-step deletion cascade (Section 8.4). The withdrawal must be logged with a timestamp before any cascade step begins.

### 8.3 GDPR Jurisdiction Determination

> **GDPR jurisdiction is determined by visitor IP address — NOT by `tal_region`.**
>
> A visitor browsing from a UK office whose account carries `tal_region = AMS` receives GDPR suppression. The consent management platform detects IP jurisdiction — not Demandbase reverse-IP, which is an account identification function, not a jurisdiction detection function.
>
> `tal_region` is an account-level commercial attribute that governs campaign routing and content localization. It does not govern consent scope. A US-headquartered enterprise account with a London office has `tal_region = AMS` because the AMS team owns that account commercially. The London office employee browsing kalder.com has an IP address that resolves to a UK jurisdiction — they receive GDPR treatment regardless of the account's `tal_region = AMS`.
>
> This is the most common misconfiguration in multi-region consent architecture. The resolution is to confirm that the CMP is configured to perform IP-based jurisdiction detection for every session independently — not to inherit jurisdiction from the account's `tal_region` attribute. Authority: Document 9 Section 4.2; Document 3 Section 7.3; Document 8 Section 10.3.

**GDPR treatment for EU / UK / EEA visitors:**
- 20 `legitimate_interest` first-party signals: processed under GDPR Article 6(1)(f) without requiring affirmative consent action from the visitor
- `demandbase_firmographic_match` (`explicit_consent_required`): requires GDPR Article 6(1)(a) consent (freely given, specific, informed, unambiguous) before collection or processing
- Default consent state for GDPR-jurisdiction visitors without explicit consent: `functional_only`

**CCPA treatment for California-resident visitors:**
- 20 `legitimate_interest` signals: unaffected by CCPA opt-out (first-party behavioral signals on owned web property; not sale or sharing of personal information)
- `demandbase_firmographic_match`: requires opt-out notice before activation
- CCPA jurisdiction is determined by California IP address — not by any account-plane attribute

**Default treatment (undeterminable jurisdiction):** Apply `functional_only`. Do not default to `full` on indeterminate jurisdiction. If the CMP cannot resolve jurisdiction before the consent interface must be displayed, the default rule governs immediately — no wait period.

### 8.4 DSR Deletion Cascade

**Trigger events:** Three events trigger the deletion cascade: (a) consent withdrawal (`visitor_consent_state` set to `declined`); (b) data subject request (DSR) under GDPR Article 17 or CCPA deletion right; (c) contract termination.

**SLA clock:** Starts at trigger event timestamp. Runs continuously — not on a business-day basis, not suspended by internal investigation. A consent withdrawal recorded at 11:58 PM starts a 72-hour clock that expires at 11:58 PM two days later.

| Step | System | Action | SLA |
|---|---|---|---|
| 1 | AEP | Delete all scored role profile attributes (`role_confidence_score`, `role_classification`, `bg_stage`, associated buying group attributes) | 72 hours |
| 2 | Segment | Suppress future signal collection; submit historical event deletion request | 72 hours |
| 3 | Snowflake | `DELETE` on `visitor_signals` and `visitor_scores` tables for subject visitor_id | 168 hours (7 days) |
| 4 | Salesforce CRM | Null buying group enrichment fields on subject contact record; base contact record retained per CRM policy | 168 hours (7 days) |

**Deletion confirmation record:** Generated by the Data Privacy Officer after all four steps complete. Must include: subject identifier, trigger event type, trigger event timestamp, step-level completion timestamps (one per step and system), record generation timestamp. A deletion confirmation record generated before all four steps complete is not valid for audit purposes.

**Scoring decay vs. legal deletion:** Signal observations older than 180 days contribute 0.0× to scoring (over_180_days decay multiplier) but are not deleted at 180 days. Physical deletion occurs at the 365-day retention window boundary. A compliance reviewer will find zero-weight signal observations in AEP within the 365-day window — this is compliant and expected behavior. Do not delete data at the scoring decay boundary; delete at the legal retention boundary. Authority: Document 9 Section 6.3.

### 8.5 Data Retention Schedule

| Data Class | Retention Window | Storage Location | Deletion Trigger |
|---|---|---|---|
| Raw behavioral signals | 365 days | Segment event stream; AEP event stream | Rolling window auto-expire; also on DSR or consent withdrawal |
| Scored role attributes | 180 days | AEP profile attributes | Rolling window auto-expire; also on consent withdrawal or DSR |
| CRM buying group enrichment fields | 730 days | Salesforce CRM (enrichment fields only) | DSR or contract termination — Step 4 cascade |
| Firmographic enrichment cache | **90 days** | Demandbase cache in AEP | Rolling window auto-expire; suppressed from scoring immediately on consent withdrawal |

The 90-day firmographic enrichment retention window is a **legal obligation** and the binding standard for Track 2 DPA compliance. A Demandbase DPA specifying a retention window exceeding 90 days for this data class does not satisfy the Track 2 DPA gate condition and must be renegotiated. Authority: Document 9 Section 6.3.

**Quarterly compliance check:** The Data Engineer runs a quarterly audit confirming rolling window deletion is executing on schedule for each data class. A retention window that expires without the associated deletion executing is a compliance failure — not a technical incident.

---

## Section 9 — Implementation Prerequisites and Readiness Framework

**Primary readers: Marketing Technology Director / VP of Marketing Operations + Platform Engineer**

This section specifies everything the client must have, confirm, or configure before the program can go live. Marketing Technology Directors should read Sections 9.1 and 9.2. Platform Engineers should read all subsections.

---

### 9.1 Licensing Prerequisites

Each system below specifies the scope reduction that results if the license is absent. These are honest statements of program capability with and without each system.

| System | License Required | Scope reduction if absent |
|---|---|---|
| **AEP Real-Time CDP B2B Edition** | Required — B2B Edition specifically | Program cannot run; standard edition cannot represent composite classification key |
| **Adobe Target Premium** | Required | Experience personalization not possible; web experience reverts to static pages |
| **Sanity CMS** with webhook support | Required | Offer catalog sync not possible; Target content cannot update without manual intervention |
| **Marketo Engage** | Required for email activation | Email nurture enrollment and cohort track management not possible; web personalization continues |
| **Outreach** with Salesforce integration | Required for sales sequence activation | Convergence point alerts fire to Salesforce CRM only; sequences must be triggered manually by BDRs |
| **Demandbase** | Required for firmographic enrichment | Firmographic bonus scoring pathway not available; Tier 3 behavioral scoring only for anonymous visitors; early-stage classification less precise |
| **6sense** | Recommended for intent enrichment | `tal_solution_interest_flags` not populated; account-level personalization at Level 4 relies on web behavioral signals only |
| **Kalder Compose** | Required for AI-assisted content generation | Content commissioning requires manual drafting for all Content Module nodes; 6–10 week timeline may extend |

### 9.2 Minimum Viable Client Data Set

Client-provided data inputs are classified into three categories: Category A (blocking — program cannot start without these), Category B (deferrable — program scope is reduced without these, consequences are named), and Category C (Advisor-derivable — the AI Advisor produces these from client inputs during onboarding).

**Category A — 9 blocking items (required before program launch):**

1. **Target Account List (TAL)** — Minimum 300 accounts with Salesforce Account IDs and `tal_region` values. No TAL = no buying group identification = no program.
2. **Solution category name(s)** — At least one solution category key registered in §1d SOLUTION_CATEGORIES
3. **`TITLE_ROLE_MAP` minimum** — 10 title entries per solution category spanning all 5 buying group roles
4. **`visitor_consent_state` CMP configuration** — Confirmed that the consent management platform writes this attribute to AEP before any visitor's second page load
5. **Salesforce field mapping** — `tal_region`, `tal_open_pipeline`, `tal_channel`, `sfdc_opportunity_created` field mappings confirmed in Salesforce for AEP ingestion
6. **Adobe Analytics event configuration** — At least 5 of the 20 behavioral signal event types confirmed firing correctly in Analytics to AEP
7. **Holdback group configuration** — Confirmed before any contacts enter the pipeline (cannot be retroactively applied)
8. **Salesforce custom field provisioning** — 21 minimum custom fields for convergence point alerts (3 fields × 7 convergence points); `recommended_action` field minimum 280 characters
9. **Content authority** — Named Content Ops Lead with authority to commission, review, and approve Content Module nodes in Sanity

**Category B — 8 deferrable items (named consequence per item):**

| Item | Consequence of deferral |
|---|---|
| `TITLE_ROLE_MAP` > 10 entries per role | Classification bias toward roles with more title entries; Tier 1 classifier accuracy reduced |
| Marketo program IDs | Email nurture enrollment not possible; web personalization continues |
| Outreach sequence IDs | Convergence point alerts fire to Salesforce only; manual sequence activation required |
| Track 2 DPA (Demandbase) | Firmographic bonus pathway suppressed; MEDIUM confidence ceiling remains for anonymous visitors |
| Tier 1 ML classifier training data | HIGH confidence not achievable; see Section 9.4 |
| `sfdc_opportunity_stage` mapping table | `progression_win_now` cohort not activatable; Stage 5–7 accounts treated as early-to-mature |
| `tal_marquee` and `tal_open_pipeline` flags | Alert routing for marquee and open-pipeline priority accounts uses default priority |
| `tal_channel` configuration (`msp` / `partner`) | Non-direct channel accounts receive direct routing sequences |

**Category C — 6 Advisor-derivable inputs (AI Advisor produces during onboarding):**

1. `JTBD_CODES` (4 minimum per solution category) — generated from solution category description and buying job values
2. Narrative `solution_claim` and `message_pillar` — derived from client-provided positioning documents
3. Sanity node type schema — pre-configured per standard template; client confirms solution category naming
4. Content Module generation contexts — produced by Kalder Compose from Audience + JTBD + Narrative nodes
5. `CLIENT_ATTRIBUTE_MAP` field mappings — Advisor maps client CRM field names to canonical §CA attribute names
6. Initial `fallback_level` routing verification — Advisor validates routing logic against synthetic contact states

### 9.3 Technical Prerequisites by Role

**Platform Engineer pre-checklist (confirm before implementation begins):**

- [ ] AEP Real-Time CDP B2B Edition license confirmed (not standard edition)
- [ ] Adobe Target Premium license confirmed
- [ ] AEP → Salesforce native CRM connector access confirmed
- [ ] AEP → Adobe Target destination connector access confirmed
- [ ] AEP → Marketo Engage destination connector access confirmed
- [ ] Kafka cluster access and Salesforce Opportunity object event schema confirmed
- [ ] Sanity webhook endpoint URL obtained and confirmed reachable from AEP sync pipeline
- [ ] `CLIENT_ATTRIBUTE_MAP` (§CA) attribute names mapped to client-specific AEP field names
- [ ] Holdback group assignment mechanism configured before any TAL contacts enter AEP pipeline

**Marketing Ops Engineer pre-checklist:**

- [ ] CMP confirmed to write `visitor_consent_state` to AEP before visitor's second page load
- [ ] `visitor_consent_state = null` confirmed to default to `declined` treatment
- [ ] Marketo smart campaign for `role_classification = default` → named role track reassignment configured and tested
- [ ] Exit-before-entry event sequencing confirmed on Marketo connector
- [ ] Weekly monitoring cadence scheduled (signal volume, scoring pipeline, Marketo enrollment lag, batch sync, Salesforce alert delivery)

**Content Ops Lead pre-checklist:**

- [ ] Named Content Ops Lead assigned with Sanity publishing authority
- [ ] `TITLE_ROLE_MAP` minimum entries confirmed across all five roles for each solution category
- [ ] `JTBD_CODES` provisioned (minimum 4 per solution category, one per buying job value)
- [ ] Content commissioning sprint calendar established (weeks 1–10 from Gate 0)
- [ ] R1–R4 review workflow configured in Sanity with named reviewers per stage

### 9.4 Tier 1 ML Classifier Cold-Start Path

This subsection supplements Section 2.5 with the full activation timeline for Marketing Technology Directors and Platform Engineers.

**Interim operating state:** From go-live until Tier 1 classifier training completes — Tier 3 behavioral scoring only; MEDIUM confidence ceiling; HIGH confidence assignments not possible; Level 1 experience not activatable. The program runs fully on Tier 3 during this period. This is the correct operating state, not a reduced-capability state — Tier 3 behavioral scoring is the primary classification mechanism for early-stage and mid-stage contacts regardless of Tier 1 availability.

**Minimum training data threshold:** 500 contacts with resolved CRM role assignments AND documented behavioral signal history in AEP (minimum 90 days of qualifying sessions). This threshold is empirically derived from the precision requirement — fewer than 500 resolved contacts produces insufficient precision to safely override Tier 3 behavioral assignments.

**Timeline milestones:**

| Milestone | Typical Timing Post-Launch |
|---|---|
| First 100 resolved contacts with 90-day signal history | Months 3–5 |
| 500-contact threshold reached | Months 5–9 |
| Classifier training run | 2–4 weeks after threshold |
| Cross-validation and accuracy review | 2–4 weeks after training |
| Tier 1 activation (if accuracy ≥80% on held-out test set) | Months 7–12 |

**Who owns each milestone:** Data Science Lead (training and validation); Analytics Lead (accuracy review and activation recommendation); Platform Engineer (Step 7 integration point activation in classify_visitor()).

### 9.5 Content Commissioning Timeline

The full Document 8 Section 11 commissioning checklist in project plan format:

| Phase | Activities | Duration | Parallelizable? |
|---|---|---|---|
| Phase 1 — Pre-Activation Setup | Data model registration, §CA client attribute configuration, consent classification, holdback verification, threshold initialization | 2–3 weeks | Yes — parallel with Phase 2 |
| Phase 2 — Gate 0 (Critical Path) | Narrative and Audience node authoring and approval | 2–3 weeks | **No — cannot be parallelized; blocks all downstream commissioning** |
| Phase 3 — Gate 1 (Level 3) | 11 Content Module nodes generated, reviewed (R1–R4), approved, and synced | 1–2 weeks after Gate 0 | Partial — R1–R3 review can overlap across nodes |
| Phase 4 — Channel Configuration | Marketo programs, Outreach channel variants, suppression smart campaigns | Concurrent with Phase 3 | Yes |
| Phase 5 — Go-Live Authorization | Six-condition checklist; Program Manager sign-off | 1 day | — |

**Gate 0 is the critical path constraint.** Every subsequent commissioning phase depends on approved Narrative and Audience nodes. Resources cannot be added to accelerate Gate 0 — it is constrained by authoring, review, and approval sequencing, not by headcount. The 2–3 week Gate 0 timeline is the minimum under optimal conditions.

**Level 2 and Level 1 commissioning** continue on the ongoing sprint cadence after Level 3 go-live. Full Level 1 activation (HIGH confidence experience available) additionally requires Tier 1 classifier training (see Section 9.4).

### 9.6 GROQ Validation Load Test (D8-Flag-05)

> **PLATFORM READINESS GATE — one-time, pre-production**
> **Owner:** Platform Engineer
> **Timing:** Completed once, before the first production commissioning
> cycle opens for any client. This is not a per-node content gate — it
> does not recur per Content Module approval and is not part of the
> Section 4.2 Phase 3 approval flow itself. It is a platform readiness
> task that must be satisfied before that flow is opened for production
> use.
>
> **Condition:** All three GROQ cross-document validation functions
> (Section 4.2; Document 8 §3.6 Functions 1–3; Commissioning Step 10)
> must pass under a load simulation of 10 simultaneous `status:
> approved` transitions, with a 2-second per-node ceiling for each
> function.
>
> **Pass criterion:** All three functions complete within the 2-second
> ceiling under the 10-concurrent-transition load. No transition is
> blocked by timeout.
>
> **Failure disposition:** If any function exceeds the ceiling under
> load, this is a launch gate, not a monitoring item — the Platform
> Engineer must investigate and resolve (GROQ query optimization: index
> hints, projection narrowing) before production commissioning opens.
> Production commissioning must not open with a known-failing or
> untested function.
>
> Authority: Document 8 §3.6 (GROQ validation functions);
> Commissioning Step 10.

---

## Section 10 — POC-to-Production Gap Reference

**Primary readers: Marketing Technology Director + Platform Engineer**

This section maps all ten POC simplifications (S-01 through S-10) to their production replacements and the Build 3 section that specifies each replacement. The first table (Executive View) is written for Marketing Technology Directors. The second table (Technical Detail) is written for Platform Engineers.

---

### 10.1 Executive View — What the POC Simplified and Why It Matters

| # | What the POC did instead | What production requires | Business impact if deferred |
|---|---|---|---|
| S-01 | Python scoring engine against synthetic signal inputs | AEP Real-Time CDP B2B Edition streaming pipeline against live Analytics events | Personalization based on synthetic data; no live visitor classification; no real-time experience adaptation |
| S-02 | No Tier 1 ML classifier; MEDIUM confidence ceiling in effect | Tier 1 ML classifier trained on CRM historical data; enables HIGH confidence assignments | Level 1 (role-confirmed, highest-confidence) experience not deliverable; 5–9 months to classifier readiness |
| S-03 | Firmographic bonus scoring pathway suppressed | Demandbase DPA complete + `visitor_consent_state: full` required | Early-stage anonymous visitor classification less precise; Champion vs. Influencer ambiguity higher |
| S-04 | Salesforce CRM task rendered as mock | AEP → Salesforce native connector; live field writes; 60-minute SLA | BDRs and AEs receive no convergence point alerts; sales intelligence layer inactive |
| S-05 | Outreach sequence trigger rendered as stub | Outreach-Salesforce integration live trigger configuration | Sales sequences not activated on convergence point events; manual follow-up required |
| S-06 | Marketo enrollment not demonstrated | AEP → Marketo two-mode connector | No email nurture enrollment; cohort-stage content delivered via web only |
| S-07 | `progression_win_now` cohort inactive | Kafka `sfdc_opportunity_stage` pipeline + five-condition go-live checklist | Stage 5–7 accounts treated as early-to-mature; late-stage executive alignment content and elevated alerts not delivered |
| S-08 | Single-client configuration | Per-client configuration namespace; separate retrieval index instances per tenant | Program cannot serve multiple enterprise clients simultaneously |
| S-09 | Onboarding audit log as static JSON export | Persistent audit data store with API access; governed retention policy | Compliance artifact not accessible to InfoSec reviewers without manual export |
| S-10 | Manual index rebuild | Automated change record workflow triggered by approved data model change record | Data model changes require manual Pipeline Engineer intervention; risk of version mismatch |

### 10.2 Technical Detail — Production Specification by POC Simplification

| # | POC simplification | Production replacement | Build 3 section | Corpus authority |
|---|---|---|---|---|
| S-01 | Python scoring engine + synthetic inputs | AEP Real-Time CDP B2B Edition streaming pipeline; seven-step classify_visitor() via AEP pipeline jobs; Adobe Analytics source connector for live event ingestion | §2.3, §2.4 | Document 2 §12 SCORING_RULES |
| S-02 | No Tier 1 classifier; MEDIUM ceiling | Tier 1 ML classifier integrated at Step 7 of classify_visitor(); 500-contact minimum training threshold; 5–9 month activation timeline | §2.5, §9.4 | Document 2 Section 9.3 |
| S-03 | Firmographic bonus suppressed | Demandbase `firmographic_match` activated after Track 2 DPA review (90-day max retention confirmed) AND `visitor_consent_state: full`; both conditions required | §8.1 | Document 9 §P; data model v0.2.0 AR-03 |
| S-04 | Salesforce CRM task mock | AEP Real-Time CDP native Salesforce CRM destination connector; three custom fields per convergence point; 60-minute SLA; 21 minimum custom fields | §5.1, §5.2 | Document 8 Section 6.1; §SA SALES_ACTIVATION_CONFIG |
| S-05 | Outreach sequence stub | Outreach Salesforce integration trigger; one trigger per active convergence point per cohort; `tal_channel` routing; two contact-level gates | §5.4, §5.5 | Document 8 Section 6.6; Document 3 Section 6.4 |
| S-06 | Marketo not demonstrated | AEP → Marketo Engage native destination connector; streaming mode (cohort transitions < 5 minutes) + daily batch mode (attribute updates); exit-before-entry ordering required | §6.1, §6.2 | Document 3 Section 6.3; Document 8 Section 9 |
| S-07 | `progression_win_now` inactive | Kafka `sfdc_opportunity_stage` pipeline; client StageName-to-integer mapping; 24-hour staleness threshold; five-condition go-live checklist; atomic fallback rule removal | §7.1, §7.2, §7.3 | Document 3 Section 2.4; Document 8 Section 8 |
| S-08 | Single-client only | Per-client configuration namespace in AEP, Pinecone, and Sanity; separate retrieval index instances per tenant; tenant ID in all audit log records | Not corpus-specified — production infrastructure requirement | — |
| S-09 | Static JSON audit log | Persistent audit data store with client tenant association; API-accessible with query by contact_id, session_id, and date range; governed retention policy per Document 9 | §8.4, §8.5 | Document 9; Document 8 Section 10 |
| S-10 | Manual index rebuild | Automated change record workflow; index rebuild triggered by approved data model change record; version constant `v0.2.0` pinned in all Advisor outputs; version increment required on any data model change affecting integration specifications | Not fully corpus-specified — governed by data model change record protocol and L2-D decision | Data model change record protocol |

---

## Document Version and Authority

**Build 3 version:** 1.0  
**Corresponds to:** `kalder_data_model_v0.2.0` | Corpus v1.0 (9 documents)  
**Version increment required:** Any data model change that affects integration specifications requires a Build 3 version increment. The version constant displayed in all Advisor outputs must match the Build 3 version in production.

**Corpus is the authoritative source of truth.** Where this document summarizes or references corpus specifications, the corpus document governs in any conflict. Section numbers cited throughout this document are authoritative corpus section references. Practitioners who encounter apparent conflicts between this specification and the corpus should treat the corpus document and section as the binding specification.

---

*End of Kalder Stack Integration Specification — Build 3 v1.0*
