# Kalder Personalization Hub — Corpus Architecture
**Prepared by:** Buying Group Personalization Advisory Council
**Status:** Approved — greenfield corpus prescription
**Last updated:** June 2026

---

## Design Principles

This corpus is written for two audiences simultaneously: practitioners who read documents directly, and retrieval systems that index them for RAG. These audiences have different needs that pull in opposite directions — practitioners need narrative context and judgment; retrieval systems need tight scope boundaries, explicit entity references, and consistent terminology. The prescription below resolves this tension by separating *operational* documents (written for practitioners) from *specification* documents (written to be authoritative sources of truth for both humans and machines).

Every document in this corpus must:

- Reference canonical entity names as defined in `kalder_data_model.py` — no paraphrasing of solution names, role labels, metric codes, or signal identifiers
- Open with a scope statement that explicitly defines what the document covers and what it delegates to other documents
- Close with a cross-reference table pointing to the documents that depend on it and the documents it depends on
- Use consistent section headers across documents so retrieval systems can locate equivalent sections across the corpus without semantic disambiguation

---

## The Nine Documents

### 1. Buying Group Role Architecture

**What it is:** The canonical definition of who participates in a B2B buying group at Kalder's target accounts, what each role does, how roles are classified, and how the same individual can occupy different roles in different solution contexts.

**Why it's standalone:** Role definitions are the ontological foundation that every other document references. In the original corpus, role definitions were distributed across multiple documents — each re-stated and slightly re-framed the same concepts. For RAG retrieval, ambiguous or distributed entity definitions produce conflicting results. This document is the single authoritative source.

**Core contents:**
- The five buying group roles (Champion, Economic Buyer, Influencer, User, Ratifier) — canonical definitions, behavioral hypotheses, primary indicators, counter-indicators
- Context-dependency principle — role is assigned per contact-in-solution-context, not globally per contact
- Role classification methodology — the three-tier data authority hierarchy (CRM-confirmed ML classifier → zero-party self-identification → behavioral inference)
- Confidence tier model — HIGH / MEDIUM / LOW / UNKNOWN, gating rules, and what each tier unlocks
- Relationship between Role Confidence and Buying Job Confidence — how they interact, how they're computed independently, and when three-axis personalization activates
- Role-to-convergence-point mapping — which roles gate which convergence points

**Depends on:** `kalder_data_model.py` (§2, §3, §12, §13)
**Required by:** All eight remaining documents

---

### 2. Signal Definition and Confidence Model

**What it is:** The authoritative specification of every signal the program uses — its definition, weight by role, decay behavior, consent classification, and contribution to confidence scoring.

**Why it's standalone:** Signal definitions must be machine-readable as well as human-readable. In a RAG context, this document answers questions like "what is the weight of a demo request for an Economic Buyer" or "what signals decay to zero after 180 days." That requires precise, tabular structure — not discursive prose embedded in a broader strategy document.

**Core contents:**
- Signal inventory — all 19 signals in `CROSS_ROLE_WEIGHTS`, with label, definition, and per-role weights
- Signal recency and decay model — the four decay windows and their multipliers, with distinction between CRM-confirmed and anonymous visitor behavior
- Consent classification — legal basis per signal (`legitimate_interest` vs. `explicit_consent_required`), PII involvement, cross-site status, and the `pending_consent_classification_default` rule
- Conditional weight modifiers — the disambiguation rules that adjust weights when signals co-occur (e.g., Ratifier / InfoSec-Influencer disambiguation)
- Classification scoring rules — cumulative score thresholds, minimum differential, firmographic bonus guard rail, signal diversity requirement
- Buying Job Confidence model — KNOWN / INFERRED / UNKNOWN states, inference signals, and the JTBD prior hierarchy
- Fallback cascade — the five-level degradation path when classification signals are absent or insufficient

**Depends on:** Buying Group Role Architecture (#1), `kalder_data_model.py` (§3, §4, §7, §8, §12, §13, §P)
**Required by:** Audience and Segmentation Architecture (#3), Personalization Decisioning Rules (#5), Measurement and Experimentation Framework (#7)

---

### 3. Audience and Segmentation Architecture

**What it is:** How accounts and contacts are classified into cohorts, what the TAL structure looks like, and how segmentation criteria map to activation channels.

**Why it's standalone:** Segmentation is architecturally distinct from role classification. Role answers "who is this person in this buying group?" Segmentation answers "which accounts get which program treatment, and through which channels?" Conflating the two produces audience definitions that are simultaneously over-specified (too many dimensions to activate) and under-specified (no clear mapping to a channel or campaign type).

**Core contents:**
- TAL architecture — the 30,000-account TAL, how it's maintained, and what TAL membership gates
- The four campaign cohorts — definition, criteria, activation priority, and channel mapping for each
- Account-level vs. contact-level segmentation — what is decided at the account level (cohort, solution category interest, stage) vs. what is decided at the contact level (role, confidence tier, buying job)
- Identification layers — anonymous account-level, anonymous behavioral, known contact — and what personalization is available at each layer
- Segment-to-channel mapping — how AEP audience segments activate to Adobe Target (web), Marketo (email), and Outreach (sales)
- Geographic segmentation — AMS / EMEA / APJ treatment differences and regional campaign manager ownership
- Exclusion and suppression logic — TAL status filter for post-sale surfaces, career and investor relations page suppression

**Depends on:** Buying Group Role Architecture (#1), Signal Definition and Confidence Model (#2), `kalder_data_model.py` (§5, §6, §14)
**Required by:** Content Model and Taxonomy (#4), Personalization Decisioning Rules (#5), Measurement and Experimentation Framework (#7)

---

### 4. Content Model and Taxonomy

**What it is:** The schema for content nodes in the Sanity content graph, the tagging taxonomy, and the rules governing how nodes compose into assembled page experiences.

**Why it's standalone:** For Kalder, the content model and the page fragment architecture are the same document — because the knowledge-centric content model (pages assembled from graph nodes at render time) makes the AEM-era distinction between content tagging and fragment architecture irrelevant. One document covers both the node schema and the assembly rules.

**Core contents:**
- Content node type schema — the ten node types from §16 (Audience, JTBD, Problem, Outcome, Narrative, Proof, Asset, Content Module, Experience, Channel) with field definitions and required metadata
- Content type taxonomy — the 30 content types and 7 formats from §9, with buying job mapping, campaign stage, phase (diverge / converge), and gating status
- Tagging taxonomy — the required metadata fields on every content node: `role`, `solution_category`, `buying_stage`, `jtbd_code`, `phase`, `confidence_tier_minimum`
- Through-line requirement — all role variants for a given solution-stage must share the same `solution_claim` and `message_pillar`; individual personalization must not create information asymmetry inside the buying group
- Module types and composition rules — the eleven module types from §10, their personalization axes (`intended_axes`), and the conflict resolution policy
- Converge content rules — Consensus Briefs and other converge content types are generated after approved diverge content, never independently; they are distributed internally by Champions, not served via Adobe Target
- Kalder Compose integration — how the generate → review → approve → publish workflow populates Sanity nodes; the role of human review as the quality gate

**Depends on:** Buying Group Role Architecture (#1), Buying Group Journey and Convergence Model (#6), `kalder_data_model.py` (§9, §10, §16, §17)
**Required by:** Personalization Decisioning Rules (#5), Operational Runbook (#8)

---

### 5. Personalization Decisioning Rules

**What it is:** The logic layer between a classified visitor and a content selection — the specification that Adobe Target is configured from.

**Why it's standalone:** This document does not exist as a standalone in the original corpus. Decisioning rules were implied across multiple documents — the playbook, the measurement plan, the signal definition. For a system that must be configured, audited, and debugged, those rules need a single authoritative home. This is also the document most likely to be queried by a RAG system answering questions about why a specific visitor received a specific experience.

**Core contents:**
- Confidence tier activation gates — what personalization is available at UNKNOWN, LOW, MEDIUM, and HIGH role confidence
- Two-axis vs. three-axis content selection — when role × stage suffices and when buying job is required as the third axis
- Module-level decisioning rules — per module type, the selection logic, fallback behavior, and conflict resolution
- Firmographic-first path — what happens when Demandbase resolves a visitor to a known account before behavioral signals accumulate
- Anonymous visitor handling — what a visitor with no role classification sees, and how the default experience is defined
- Holdback group specification — what percentage of traffic receives the default experience for lift measurement, and how holdback groups are segmented
- Edge cases and suppression rules — post-sale surfaces, careers pages, investor relations, multi-solution visitors
- `pending_solution_fallback` behavior — what happens when a visitor's solution interest maps to a pending coverage entry

**Depends on:** Buying Group Role Architecture (#1), Signal Definition and Confidence Model (#2), Audience and Segmentation Architecture (#3), Content Model and Taxonomy (#4), `kalder_data_model.py` (§3, §4, §10, §12, §20)
**Required by:** Operational Runbook (#8), Measurement and Experimentation Framework (#7)

---

### 6. Buying Group Journey and Convergence Model

**What it is:** The buying group stage model, the double-diamond structure, convergence points, and the JTBD code library — the strategic layer that content authors, demand gen, and sales use to understand where buyers are and what they need.

**Why it's standalone:** This is the most frequently retrieved context in a RAG scenario. Any question about content strategy, campaign planning, sales activation, or measurement touches the buying journey model. It needs clean, unambiguous definitions that can be surfaced in isolation without the surrounding narrative of a larger document. It is also the document that bridges the strategic framework (what are buyers doing?) with the operational tooling (what content do we serve?).

**Core contents:**
- The four buying group stages — Education, Acquisition, Progression, Expansion — definitions, entry criteria, and exit criteria
- Double-diamond structure — diverge phase (role-specific JTBD enablement) and converge phase (group alignment toward a convergence point) within each stage; content phase annotation (`phase: diverge` vs. `phase: converge`)
- The six convergence points — canonical definitions, trigger conditions, role participation map, common blockers, loop-back risk, and recommended seller actions
- JTBD code library — all 131 JTBD codes organized by solution category, with coverage status (`source-validated` vs. `constructed`), probable job priors, and signal indicators
- Buying job inference model — how behavioral patterns map to JTBD codes, and how JTBD confidence state is determined
- Sales activation integration — how convergence point proximity triggers BDR / AE alerts, what the canonical alert payload contains, and which fields are client-configured at onboarding

**Depends on:** Buying Group Role Architecture (#1), Signal Definition and Confidence Model (#2), `kalder_data_model.py` (§5, §17, §18, §SA)
**Required by:** Content Model and Taxonomy (#4), Personalization Decisioning Rules (#5), Measurement and Experimentation Framework (#7), Operational Runbook (#8)

---

### 7. Measurement and Experimentation Framework

**What it is:** The metric hierarchy, experimentation standards, holdback design, and validation methodology for the personalization program.

**Why it's standalone:** Measurement is the proof layer of the program. It must be readable by Analytics, Finance, and executive stakeholders who will not read any other document in the corpus. It must also be precise enough to configure Looker dashboards and Adobe Target reporting without interpretation.

**Core contents:**
- Metric hierarchy — all 24 metrics across T1 (business outcomes), T2 (program performance), and T3 (personalization performance), with owner, cadence, data source, and target
- Seller vs. buyer metric distinction — Engagement Score (opportunity health, seller-centric) vs. Role Confidence Score (personalization certainty, buyer-centric); why they must never be conflated
- Experimentation standards — minimum confidence interval (95%), holdback group design, minimum detectable effect, power calculation inputs
- T3-07 validation methodology — randomized progressive disclosure experiment as primary method; CRM retrospective match as secondary; survivor bias acknowledgment and mitigation
- Attribution model — how conversion credit is assigned across buying group members, and why standard last-touch attribution fails in multi-person buying group contexts
- Reporting cadence — what is reviewed weekly (T3 operational), monthly (T2 program), and quarterly (T1 business outcomes + T3-07 accuracy validation)
- Known measurement limitations — the survivor bias problem, novelty effects in early deployment, Simpson's paradox risk in segment-level analysis

**Depends on:** All five preceding documents, `kalder_data_model.py` (§11, §14)
**Required by:** Operational Runbook (#8)

---

### 8. Operational Runbook

**What it is:** How the program runs week to week — who owns what, how content nodes are commissioned and approved, how signals are monitored, and how the sales handoff works.

**Why it's standalone:** The original corpus distributed operational guidance across the playbook, measurement plan, and strategy document. Practitioners — content strategists, demand gen managers, marketing ops — do not read strategy documents to find out what they're supposed to do on Tuesday. Operational guidance belongs in one document that is explicitly written for execution, not alignment.

**Core contents:**
- Program org chart — role titles, accountabilities, and escalation paths (no named individuals)
- Content node commissioning workflow — how a content brief moves from JTBD gap identification through Kalder Compose generation to human review to Sanity publication
- Weekly signal monitoring — what metrics are reviewed, by whom, and what thresholds trigger an escalation
- Coverage gap management — how `pending_solution_fallback` events are monitored, how the escalation threshold is calibrated, and how coverage gaps are prioritized for remediation
- Sales activation workflow — how convergence point proximity alerts are generated, routed to Outreach, and actioned by BDRs and AEs
- Consent and suppression management — how `visitor_consent_state` is maintained, how geographic suppression rules are applied, and how DSR (data subject request) deletion is executed
- Onboarding checklist — the configuration steps required before a new solution category can be activated for personalization (title map completion, JTBD coverage, consent classification, holdback group setup)
- Incident response — what happens when signal collection fails, when classification accuracy drops below threshold, or when a content node is found to contain an error post-publication

**Depends on:** All seven preceding documents
**Required by:** Nothing — this is the terminal document in the dependency chain

---

### 9. Privacy and Consent Architecture

**What it is:** The standalone consent framework — signal classification by legal basis, geographic handling rules, data retention schedule, deletion paths, and consent-state gating logic.

**Why it's standalone:** Enterprise buyers — legal, procurement, InfoSec — evaluate privacy architecture independently of marketing strategy. Embedding it in the data model or the signal definition document means those stakeholders must read technical documentation to find the answers they need. It also means that when consent requirements change (a regulation updates, a new jurisdiction is added), the change must be made in a document that is also the source of truth for signal weights and confidence scoring — an unacceptable coupling. Privacy architecture earns its own document.

**Core contents:**
- Signal consent classification — legal basis (`legitimate_interest` vs. `explicit_consent_required`), PII involvement, and cross-site status for all 19 signals; the LIA documentation for first-party behavioral signals; the DPA reference for third-party enrichment signals (Demandbase, 6sense)
- `pending_consent_classification_default` — the rule that unclassified signals default to `functional_only` treatment until classified; the owner and process for classification
- Consent-state gating model — how `visitor_consent_state` (full / functional_only / declined) gates signal collection and scoring; the attribute schema and how it is set and updated
- Geographic handling rules — GDPR (EU/UK) and CCPA (California) treatment differences; which signals are suppressed per jurisdiction when consent is not granted
- Data retention schedule — retention windows for raw signal data, scored AEP attributes, Snowflake behavioral records, and CRM-matched contact records; the relationship between scoring decay windows (§8) and legal retention limits
- Deletion and anonymization path — how a visitor's signal history is deleted on consent withdrawal or DSR, including cascade behavior across Segment, AEP, Snowflake, and Salesforce
- Third-party enrichment governance — Demandbase and 6sense data processing scope, DPA status, and the activation gate (Track 2 legal review must complete before firmographic bonus and intent enrichment signals activate)

**Depends on:** Signal Definition and Confidence Model (#2), `kalder_data_model.py` (§P, §8)
**Required by:** Signal Definition and Confidence Model (#2, cross-reference), Operational Runbook (#8)

---

## Authoring Sequence

The dependency chain determines authoring order. Each document can only be written once the documents it depends on are complete.

```
1. Buying Group Role Architecture
   └─► 2. Signal Definition and Confidence Model
         └─► 3. Audience and Segmentation Architecture
               └─► 4. Content Model and Taxonomy
                     └─► 6. Buying Group Journey and Convergence Model
                           └─► 5. Personalization Decisioning Rules
                                 └─► 7. Measurement and Experimentation Framework
                                       └─► 8. Operational Runbook

   (parallel track, unblocked after #2)
   └─► 9. Privacy and Consent Architecture
```
