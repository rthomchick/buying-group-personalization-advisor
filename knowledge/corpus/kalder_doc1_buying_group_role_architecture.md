# Buying Group Role Architecture

**Document:** 1 of 9 — Kalder Personalization Hub Corpus
**Status:** Approved
**Last updated:** June 2026
**Depends on:** `kalder_data_model.py`
**Required by:** All eight remaining corpus documents

---

## Document Scope and Canonical Status

This document is the single authoritative source for buying group role definitions across all 15 Kalder solutions and all 5 solution categories. All other corpus documents that reference Champion, Economic Buyer, Influencer, User, or Ratifier draw from this document. No other document in the corpus re-defines these roles or extends their definitions.

Three decisions that are adjacent to role architecture are explicitly out of scope here. Signal weights and confidence scoring thresholds are owned by Document 2 (Signal Definition and Confidence Model). Content recommendations by role are owned by Document 4 (Content Model and Taxonomy). The logic governing how a classified visitor is matched to a specific experience is owned by Document 5 (Personalization Decisioning Rules).

The role definitions in this document are the human-readable companion to `kalder_data_model.py §2 ROLES`, which is the machine-readable canonical source. Practitioners read this document; retrieval systems and classification logic read the data model. Both must agree. Any discrepancy between this document and the data model is a defect — the data model governs.

This document defines buying group roles as the program classifies them from available signals, not as they exist in full across a buying group. At any given time, most buying group activity is invisible to the program. The full treatment of classification methodology, including what the program can and cannot observe, is in Section 4.

**Coverage status disclosure.** Customer Engagement role definitions are source-validated against Forrester JTBD research and the CRM Buying Group Planning deck (November 2025). Role definitions for IT & Operations, Employee Experience, Risk & Compliance, and AI Platform are constructed from analyst frameworks and buying group type descriptions. The `coverage_status` field on each entry in `kalder_data_model.py §1c SOLUTIONS` and `§1d SOLUTION_CATEGORIES` distinguishes source-validated from constructed entries. Constructed entries are high-quality synthesis, not fabrications, but they carry a lower evidentiary basis than the Customer Engagement definitions and should be treated accordingly when configuring confidence thresholds and content routing rules.

---

## The Context-Dependency Principle

Role is a property of a contact in a specific solution context, not a property of a contact. As encoded in `kalder_data_model.py §2 ROLES`: "Role assignment is solution-specific, not person-fixed." The same individual may participate in multiple concurrent buying groups at the same account, occupying different roles in each. A classification system that ignores context and resolves a single role per contact will produce incorrect classifications — and incorrect personalization — every time those contexts diverge.

At v1 launch, "solution context" resolves to solution category, not to individual solution or product. The five categories defined in `§1d SOLUTION_CATEGORIES` (IT & Operations, Customer Engagement, Employee Experience, Risk & Compliance, AI Platform) are the operative units of classification. The active solution category context for any given page visit is determined by the `solution_category` assignment on each website surface in `§20 WEBSITE SURFACE TAXONOMY`. A visitor on a Customer Engagement solution page and the same visitor on an IT & Operations solution page are evaluated independently, against different title maps and different JTBD profiles.

The failure case is concrete. Consider a VP of Engineering at a mid-market financial services firm. In an IT & Operations buying group, this person is likely a Champion — the technical authority driving the evaluation and shaping requirements. In an AI Platform buying group at the same account, this same person may be the Economic Buyer — the executive with budget authority who is evaluating strategic platform direction rather than implementation specifics. If the classification system carries the IT & Operations Champion classification into an AI Platform page visit and serves Champion-targeted content — hands-on technical depth, implementation detail, peer validation — the experience is wrong. The system is offering the wrong thing to someone in the middle of a different decision at a different level of the organization. Wrong personalization is not a neutral outcome. It signals that the system has misread the visitor, and it is worse than serving no personalization at all.

The classification system must resolve and store role at the `(contact_id, solution_category)` composite key level. A `contact_id` alone is not a valid classification key. A contact may hold valid simultaneous classifications across multiple solution categories; each classification is independent and correct within its context. The experience served on any page is governed exclusively by the `solution_category` that page belongs to in `§20`.

The full specification of how the system enforces this principle — including conflict resolution logic and fallback behavior when no category-specific classification exists — is in Section 4 (Classification Methodology).

---

## The Five Buying Group Roles

---

### Champion

#### Definition
The Champion is the internal driver of the buying process — the individual whose day-to-day work is most directly affected by the problem and who owns the evaluation on behalf of their organization. Their primary motivation is to find a solution that works operationally and to build the internal case for it.

#### Behavioral Signature
Champions exhibit the highest session frequency and depth of any role. They return repeatedly to the same solution category over multiple weeks, progressively deepening their exploration from category-level content toward solution-specific and product-level pages. Within a session, they navigate laterally across related products within a single solution area rather than jumping between solution categories. They commonly download evaluation frameworks, requirement templates, and peer customer stories — content that helps them build a credible internal recommendation. Demo requests from Champions tend to be self-initiated and accompanied by prior deep-content engagement, not first-touch.

#### Primary Indicators
- Multiple return sessions to the same solution category over a 30–90 day window
- Deep navigation within a solution area: product page views combined with technical documentation access
- Case study and competitive comparison downloads
- Requirement framework or evaluation guide downloads
- Demo request following multi-session engagement pattern
- Peer review site referral (`community_referral` signal) arriving at a product or solution page

#### Counter-Indicators
- ROI calculator completion with pricing page views in the same or immediately following session — this is Economic Buyer behavior; a Champion exhibiting this pattern is shifting role and the classification must update accordingly
- Single-session, breadth-first browsing across multiple solution categories — this is Influencer behavior, not Champion behavior
- Security Trust Center or legal/compliance page visits without accompanying product engagement — this is Ratifier behavior
- First-touch arrival via a forwarded link with no prior session history — this is the typical Economic Buyer entry pattern

A Champion who shifts to ROI calculator and pricing page engagement is exhibiting Economic Buyer behavior in that moment. The classification system must respond to this signal shift and not lock the contact into a Champion classification based on prior session history.

#### Double-Diamond Role
In the diverge phase, Champions conduct the bulk of independent vendor evaluation: they consume case studies, build requirements, run solution comparisons, and collect peer references. They are the most active individual contributors to the research phase of each buying stage and typically accumulate the highest signal density of any role in the buying group.

In the converge phase, the Champion is the primary group coordinator. They gate Problem Validation (the group agreeing the problem is real and worth solving), Requirements Framing (the group aligning on evaluation criteria), Solution Validation (confirming Kalder meets functional requirements), and Business Value Alignment (the group aligning on ROI and measurable outcomes). They are also a required participant at Risk & Compliance Validation and Final Commitment. The Champion typically distributes Consensus Briefs internally — they are the internal communication channel through which group alignment is built.

#### Classification Notes
The ML classifier covers Champion at v1 launch with source-validated training data for the Customer Engagement solution category; IT & Operations is constructed. Behavioral-only classification for the Champion role is capped at MEDIUM confidence because HIGH confidence requires either CRM-confirmed ML classifier output or zero-party self-identification combined with behavioral confirmation. A contact classified as Champion via behavioral inference alone may have genuine Champion role signals; the MEDIUM ceiling reflects the absence of firmographic confirmation or CRM ground truth, not a weak signal pattern. Firmographic title confirmation via Demandbase is available for most Champion titles and is the primary path to HIGH confidence in the absence of CRM-confirmed ML output; the MEDIUM ceiling applies to behavioral signals alone.

---

### Economic Buyer

#### Definition
The Economic Buyer is the individual with budget authority and accountability for the outcome of the purchase decision. Their primary motivation is not product fit — it is value confirmation and risk containment at the organizational level.

#### Behavioral Signature
The Economic Buyer's most distinctive behavioral characteristic is their arrival pattern: they frequently arrive via a forwarded link from the Champion rather than through organic discovery, direct navigation, or paid search. This has a direct implication for attribution — sessions without a classifiable referral path that land directly on high-value content (ROI calculators, executive briefs, pricing pages) should be treated as potential EB arrivals, not misattributed to direct or dark social. Session depth is shallow relative to the Champion: the Economic Buyer tends to complete one or two high-signal interactions per visit rather than multi-page explorations. They have a strong affinity for ROI and business value content, and their engagement with that content is typically the culmination of a brief, purposeful session rather than part of a broader research pattern. Return visit frequency is lower than the Champion but visit-level intent is higher.

#### Primary Indicators
- ROI calculator completion
- Executive brief or business case download
- Pricing page view combined with ROI or business value content in the same session
- Low session depth (two to four pages) with high-value content concentration
- Forwarded-link arrival (no referrer or internal referral) landing directly on ROI or business case content
- `executive_brief_download` signal following multi-role engagement at the account level

#### Counter-Indicators
- Deep product documentation access or technical specification page views — this is Influencer or Champion behavior
- Multiple return sessions with progressive solution exploration — this is Champion behavior
- Peer review site referral arrivals — Economic Buyers rarely arrive through community or peer channels
- ROI calculator access as the first interaction in a first-ever session from organic search — without supporting account-level signals, this is insufficient; the firmographic bonus requires a minimum behavioral floor before it can elevate confidence

#### Double-Diamond Role
In the diverge phase, the Economic Buyer independently validates the strategic and financial dimensions of the evaluation: sizing the problem in organizational terms, confirming the solution category is the right class of investment, and stress-testing the business case the Champion is building. They are not conducting product evaluation; they are evaluating whether the product evaluation is worth completing.

In the converge phase, the Economic Buyer is a required participant at Problem Validation (confirming the problem is worth solving at an investment level), Business Value Alignment (where their participation is the primary signal that the group is close to a purchase decision), Risk & Compliance Validation, and Final Commitment. Their absence from Business Value Alignment is a deal risk indicator: it typically signals that the Champion is building a case the EB has not yet bought into.

#### Classification Notes
The ML classifier covers Economic Buyer at v1 launch. Behavioral-only classification is capped at MEDIUM confidence for the same structural reason as Champion: HIGH requires CRM confirmation or zero-party self-identification. The primary classification challenge for the Economic Buyer is the overlap with the Champion in early-stage sessions, where both roles consume problem-framing and category-level content. The primary behavioral discriminator is ROI calculator usage: a Champion who completes an ROI calculator is shifting toward Economic Buyer behavior; an Economic Buyer who never touches the ROI calculator but shows deep product page engagement is behaving like a Champion. The classification system must weight the ROI calculator signal accordingly and allow reclassification when the behavioral pattern shifts.

---

### Influencer

#### Definition
The Influencer is a subject matter expert or functional stakeholder whose technical or operational judgment shapes the group's evaluation criteria and solution requirements. Their primary motivation is to ensure the selected solution will work for their team — technically, operationally, and within their existing systems.

#### Behavioral Signature
The Influencer's distinctive behavioral pattern is breadth-first exploration across multiple solutions within a category, or across related solution categories, before narrowing depth. Where a Champion revisits the same solution area repeatedly, an Influencer in early stages often samples widely — arriving at a solution page, navigating to a related product or integration documentation, then crossing into a different solution area in the same session. As the evaluation matures, Influencer sessions shift toward solution-specific technical depth: integration catalog pages, technical documentation, architecture reference content, and competitive differentiation materials. Influencers are heavy consumers of third-party validation content — analyst reports, peer review site referrals, and customer stories with technical depth. Webinar attendance is a stronger Influencer signal than it is for other roles, particularly for solution-specific or technical deep-dive events.

#### Primary Indicators
- Analyst report and third-party validation content downloads
- Competitive comparison page views and competitive comparison content downloads
- Integration catalog page views (`integration_catalog_view` signal)
- Technical documentation access (`technical_docs_deep` signal)
- Breadth-first browsing: multiple solution areas visited in a single session before narrowing
- Peer review site referral arrivals (`community_referral` signal) leading to technical or product pages
- Webinar registration and attendance for solution-specific or technical content

#### Counter-Indicators
- ROI calculator completion — this is Economic Buyer behavior
- Executive brief downloads as the primary or sole content interaction — this is Economic Buyer behavior
- Single solution focus from first session with no cross-category exploration — this is consistent with Champion behavior for an established evaluation
- Security Trust Center visits without any technical or integration content — this is Ratifier behavior, not Influencer

#### Double-Diamond Role
In the diverge phase, the Influencer conducts technical and operational due diligence: evaluating integration fit, stress-testing product capabilities against team workflows, and identifying requirements that the Champion may not have surfaced. They are the role most likely to find disqualifying technical gaps or to surface integration dependencies that affect the business case.

In the converge phase, the Influencer is a required participant at Requirements Framing (defining what "good" looks like technically and operationally), Solution Validation (confirming Kalder meets the functional and technical requirements the group has set), and Business Value Alignment. They are not required at the final financial and procurement convergence points, but their absence at Solution Validation before Business Value Alignment is a friction risk — a group that advances to financial alignment before technical validation is complete routinely loops back.

#### Classification Notes
The ML classifier covers Influencer at v1 launch. Behavioral-only confidence for anonymous Influencer visitors is capped at MEDIUM. The ceiling exists because depth-within-a-solution versus breadth-across-solutions is the discriminating signal between Influencer and Champion, and observing that pattern reliably requires either multiple sessions or firmographic title confirmation. A single session of cross-solution browsing is insufficient to distinguish an Influencer from a new-to-category Champion doing initial orientation. The classification system requires either two or more sessions establishing the breadth-then-depth pattern, or firmographic title data confirming a function associated with Influencer behavior (IT architecture, finance, operations, or workforce management), before MEDIUM confidence is warranted for anonymous visitors.

---

### User

#### Definition
The User is an individual contributor or frontline manager who will operate the solution after purchase. Their primary motivation is workflow fit: they need to confirm the tool will work in their day-to-day operations, not create additional friction, and integrate with the systems they already use.

#### Behavioral Signature
Users exhibit a distinctive content pattern: they consume product feature documentation, workflow-specific use case content, and how-it-works explainer material rather than evaluation or business case content. They are the role most likely to visit product documentation and support knowledge base pages. Session depth for Users tends to be moderate but focused — they do not browse broadly, but they do explore specific feature areas in depth when evaluating workflows that affect their team. User webinar attendance skews toward hands-on product demonstrations and use-case-specific sessions rather than strategic or executive content. Demo requests from Users typically co-occur with product documentation access in the same session, suggesting they are seeking workflow confirmation rather than initial product discovery.

#### Primary Indicators
- Product feature documentation page views
- Workflow-specific use case content downloads
- How-it-works explainer and product demo video engagement
- Support knowledge base page views
- Demo request co-occurring with product documentation access in the same session
- Webinar registration for hands-on product demonstration sessions

#### Counter-Indicators
- ROI calculator completion — this is Economic Buyer behavior
- Analyst report or competitive comparison downloads — this is Influencer behavior
- Executive brief or business case downloads — this is Economic Buyer behavior
- Security Trust Center or procurement documentation visits — this is Ratifier behavior
- Breadth-first cross-solution browsing — this is Influencer behavior

#### Double-Diamond Role
In the diverge phase, Users evaluate operational fit: they are testing whether the solution will actually work for the people who have to use it every day. They surface workflow friction points, integration gaps visible at the user interface level, and adoption requirements that neither Champion nor Economic Buyer will identify from their vantage point.

In the converge phase, Users are required participants at Requirements Framing and Solution Validation. Their contributions to these convergence points are operationally grounding: they ensure that what has been specified is actually deliverable in practice. The User veto is consistently underweighted in personalization programs and surfaces as a late-stage friction event. A strong negative recommendation from the User role — based on demo evaluation, workflow assessment, or peer community feedback — can stall a deal that Champion and Economic Buyer have already aligned on. The friction appears late and without a clear preceding signal because User engagement volume is lower than Champion or Influencer, and the negative signal is rarely surfaced in CRM until a deal slips. Content enabling Users to validate fit early reduces this risk; content that only targets Champion and Economic Buyer leaves it unmanaged.

#### Classification Notes
The ML classifier does not cover User at v1 launch; labeled training data is insufficient. User classification at launch is behavioral-only, capped at MEDIUM confidence. The primary operational challenge for User classification is post-sale noise: customers who have already purchased and are using Kalder in production visit kalder.com with behavioral patterns that overlap with pre-purchase Users — they access product documentation, watch feature explainers, and attend product webinars. Without account-level CRM status (active customer vs. active prospect), the classifier cannot reliably distinguish pre-purchase User evaluation from post-sale product usage. The mitigation is to apply a customer account suppression filter using CRM customer status before scoring behavioral signals as pre-purchase User indicators. Accounts identified as active customers in Salesforce should be excluded from User role scoring on kalder.com to prevent post-sale activity from inflating pre-purchase confidence scores.

---

### Ratifier

#### Definition
The Ratifier is the organizational gatekeeper who must approve the purchase on non-product grounds — procurement policy, security and compliance requirements, legal review, or capital authorization. Their primary motivation is to confirm the purchase does not create organizational or regulatory risk.

#### Behavioral Signature
The Ratifier arrives late in the buying process and exhibits a narrow, purposeful session pattern. Unlike the Champion or Influencer, who accumulate signal across many sessions over weeks, the Ratifier typically produces a concentrated burst of high-intent activity within a short window — two to four sessions over one to three weeks, all focused on security, compliance, trust, procurement, or legal documentation. They do not explore the product or solution areas. A Ratifier visiting kalder.com is not evaluating whether the solution is good — that decision has already been made by others. They are evaluating whether the purchase is permissible and whether the vendor meets the compliance and governance standards their organization requires. Session recency is a strong Ratifier classifier signal: late-stage arrival combined with Security Trust Center access is the canonical Ratifier pattern.

#### Primary Indicators
- Security Trust Center page views (`security_trust_center_visit` signal — highest single-signal Ratifier weight in `CROSS_ROLE_WEIGHTS`: 22)
- Compliance documentation and certification page views
- Legal and data processing documentation access
- Procurement and purchasing terms page views
- Low session frequency (two to four sessions total) concentrated within a narrow time window
- Late-stage arrival relative to account-level engagement history: Ratifier session appears after Champion and Economic Buyer have accumulated substantial signal

#### Counter-Indicators
- Security Trust Center visit co-occurring with integration catalog or technical documentation access in the same session — this is InfoSec Influencer behavior; the `CONDITIONAL_WEIGHT_MODIFIERS` `infosec_influencer_disambiguation` rule reduces Ratifier weight from 22 to 10 and increases Influencer weight from 5 to 15 in this pattern
- Product feature documentation or use case content access — this is User or Champion behavior
- ROI calculator or executive brief engagement — this is Economic Buyer behavior
- Early arrival in the account-level engagement timeline with no prior Champion or EB signals — Ratifiers do not arrive before the group has formed

#### Double-Diamond Role
In the diverge phase, Ratifiers conduct compliance and procurement due diligence independently: reviewing security certifications, data residency documentation, legal terms, and procurement policy compatibility. This activity is largely invisible to the program until the Ratifier arrives on kalder.com, which means the system must be prepared to serve compliance-enabling content immediately upon first Ratifier session — there is no gradual signal accumulation to respond to.

In the converge phase, the Ratifier gates Risk & Compliance Validation and Final Commitment — the two latest convergence points in the buying process. The late-stage loop-back risk is the highest-severity friction event in the buying process: a Ratifier-triggered loop-back at either of these convergence points — purchasing rules overruling the group decision, a legal flag on contract terms, or a capital review board intervention — occurs after Champion and Economic Buyer have already aligned and can unwind months of evaluation work. It is also the most difficult to recover from because it introduces organizational process constraints that content cannot resolve. Early content enablement for the Ratifier is the primary mitigation: surfacing compliance documentation, security certifications, and procurement readiness materials before the Ratifier reaches a blocking concern reduces the probability of a loop-back trigger.

#### Classification Notes
The ML classifier does not cover Ratifier at v1 launch; labeled training data is insufficient. Ratifier classification at launch is behavioral-only, capped at MEDIUM confidence. The primary disambiguation challenge is the InfoSec Influencer overlap: Security Trust Center visits are the strongest single Ratifier signal, but they also attract InfoSec-oriented Influencers conducting security architecture evaluation. The behavioral differentiators are session recency (Ratifiers arrive late relative to the account engagement timeline; InfoSec Influencers may arrive at any stage) and solution breadth (Ratifiers stay narrowly focused on security, compliance, and legal content; InfoSec Influencers combine trust center visits with integration catalog and technical documentation access). The `CONDITIONAL_WEIGHT_MODIFIERS` `infosec_influencer_disambiguation` rule encodes the co-occurrence detection in the scoring engine. For the Ratifier specifically, zero-party progressive disclosure is the recommended path to HIGH confidence: a role-confirmation prompt served after a Security Trust Center visit, combined with behavioral confirmation, produces the firmographic ground truth the ML classifier cannot yet provide independently.

---

## Role Classification Methodology

### The Three-Tier Data Authority Hierarchy

Role classification draws from three data sources, in strict authority order. The full specification is in `kalder_data_model.py §13 DATA_SOURCE_AUTHORITY_HIERARCHY`.

**Tier 1 — CRM-confirmed ML classifier output.** The ML classifier, built and operated by Kalder's Data & Analytics team on Snowflake, is trained on labeled closed-won Salesforce contacts: title × function × solution category × behavioral pattern → role label with confidence score. Output from the ML classifier, when matched to a CRM-confirmed contact, produces HIGH confidence. The primary limitation is coverage: the ML classifier covers Champion, Economic Buyer, and Influencer at v1 launch; User and Ratifier are pending.

**Tier 2 — Zero-party self-identification.** Explicit role declaration by the visitor via progressive disclosure prompts. When combined with behavioral confirmation, zero-party data produces HIGH confidence. Zero-party data alone, without behavioral corroboration, does not produce HIGH confidence — the confirmation requirement prevents a single declared attribute from overriding the full signal profile. The primary limitation is response rate: zero-party collection requires value-exchange design to produce representative signal; low-quality prompts produce low response rates and biased samples.

**Tier 3 — Behavioral inference.** Cumulative signal scoring via `CROSS_ROLE_WEIGHTS`, decayed by recency per `§8 DECAY_MULTIPLIERS`. Behavioral inference is capped at MEDIUM confidence. It never produces HIGH confidence alone, regardless of signal volume or diversity.

**Conflict resolution rule:** When tiers conflict, the higher-authority tier governs. Tier 1 overrides Tier 2. Tier 2 overrides Tier 3. Behavioral inference never overrides CRM-confirmed data. This hierarchy must be enforced at the platform level — it is a governance requirement, not a process convention. AEP segment definitions, Snowflake classification pipelines, and Demandbase enrichment rules must all resolve classification through this authority order.

---

### ML Classifier Coverage at v1 Launch

The ML classifier covers three roles at v1 launch: Champion, Economic Buyer, and Influencer. Classification status and behavioral signal availability for each are documented in `§2 ROLES classification_status` fields. User and Ratifier are not covered — labeled training data is insufficient at launch for both roles. Visitors whose behavioral patterns suggest User or Ratifier role do not receive ML classifier output; they enter the fallback cascade defined in Section 6 and are served at the appropriate fallback level based on available account and solution-interest signals.

ML classifier output without CRM confirmation is capped at MEDIUM confidence, per `§3 CONFIDENCE_TIERS`. CRM confirmation — a match between the ML classifier's predicted role and the contact's Salesforce role label — elevates output to HIGH. The confidence ceiling is a design parameter that reflects the absence of ground-truth validation, not a signal quality judgment; a strong behavioral profile with ML classifier corroboration but no CRM match is still MEDIUM, not HIGH.

---

### The Firmographic Bonus and Its Guardrail

When Demandbase resolves a visitor's job title to a known role-matching title in `§19 TITLE_ROLE_MAP`, a firmographic confirmation bonus of +30 is applied to the behavioral score for that role. The practical effect: a LOW behavioral score can reach MEDIUM, and a MEDIUM behavioral score can reach HIGH, when title matching confirms the inferred role.

**Rule:** The firmographic bonus applies only when the visitor's behavioral score for the top role meets the minimum behavioral floor defined in `§12 CLASSIFICATION_SCORING_RULES` (`firmographic_bonus_requires_minimum_behavioral_score: 15`). The bonus amplifies an existing behavioral signal. It does not substitute for one. A first-session visitor whose title firmographically matches a Champion profile does not receive MEDIUM or HIGH confidence on firmographic data alone — the minimum behavioral floor must be met before the bonus is applied. The full scoring sequence — differential check, behavioral floor validation, bonus application, score clamping — is specified in `§12 CLASSIFICATION_SCORING_RULES`.

---

### Classification Noise Cases

Three predictable noise cases must be mitigated before scoring runs. Each requires a pre-scoring filter, not a post-scoring correction.

**Post-sale noise.** Active customer accounts produce behavioral signals — product documentation access, feature page views, support knowledge base visits — that are identical to pre-purchase evaluation signals. Left unfiltered, these inflate role confidence scores for contacts who are not in an active buying group. The mitigation is an account-level CRM customer status suppression filter combined with the TAL filter, applied before behavioral signal scoring. This is an account-level filter, not a contact-level filter: all contacts associated with an active customer account are excluded from pre-purchase classification scoring regardless of their individual behavioral profile.

**InfoSec Influencer / Ratifier disambiguation.** Security Trust Center visits carry a Ratifier weight of 22 — the highest single-signal weight in `CROSS_ROLE_WEIGHTS`. The same surface also attracts InfoSec-oriented Influencers conducting security architecture evaluation, producing identical raw scores for two distinct roles. The mitigation is the `CONDITIONAL_WEIGHT_MODIFIERS` `infosec_influencer_disambiguation` rule in `kalder_data_model.py`: when `security_trust_center_visit` co-occurs with `integration_catalog_view` or `technical_docs_deep` in the same session, Ratifier weight adjusts from 22 to 10 and Influencer weight adjusts from 5 to 15.

**Multi-solution visitors.** Contacts who navigate across multiple solution categories within or across sessions produce signal profiles that resist single-role classification. Attempting cross-category role reconciliation produces scores that are meaningless because role is context-dependent. The mitigation is the principle established in Section 2: score independently per `(contact_id, solution_category)` composite key. No cross-category reconciliation is performed. Each classification is valid within its solution category context; they are not merged or averaged.

Consent architecture governing cross-session behavioral inference — including legal basis, PII treatment, and jurisdiction-specific suppression rules — is in Document 9 (Privacy and Consent Architecture); classification rules that depend on cross-session signal aggregation cannot be safely implemented without reading Document 9 first. Zero-party progressive disclosure implementation guidance, including UX requirements for value-exchange design, is in Document 8 (Operational Runbook); progressive disclosure that is not designed as a value exchange produces low response rates and a biased zero-party signal.

---

## The Confidence Tier Model

### The Four Confidence Tiers

The program uses four role confidence tiers, each representing a distinct level of classification certainty and unlocking a corresponding depth of personalization. Score thresholds and activation conditions are defined in `kalder_data_model.py §3 CONFIDENCE_TIERS`.

**HIGH (score ≥ 80).** Full role-specific personalization. Adobe Target serves role-targeted content variants across all personalization axes. CTAs are direct and role-specific — demo requests for Champions, ROI models for Economic Buyers, integration documentation for Influencers. Triggered by CRM-confirmed ML classifier output, or by zero-party self-identification combined with behavioral confirmation, or by a behavioral score that meets the HIGH threshold after firmographic bonus application. Content coverage requirement: role-specific variants required at every personalization surface for this tier.

**MEDIUM (score 50–79).** Role-influenced personalization. Content reflects the inferred role's general orientation but does not require full role-specific variant coverage. CTAs are softer and value-oriented rather than role-directed. Triggered by behavioral inference at or above the MEDIUM threshold, by firmographic title matching combined with a qualifying behavioral floor, or by ML classifier output without CRM confirmation. Content coverage requirement: role-influenced variants required; full role-specific depth is optional but should be prioritized for high-traffic surfaces.

**LOW (score 25–49).** Solution-interest personalization only. The system does not attempt role-specific content selection. Adobe Target serves solution-category-level content based on which solution area the visitor has engaged with, without role differentiation. CTAs are category-level and exploratory. Triggered by behavioral signals that establish solution interest but do not establish role with sufficient confidence. Content coverage requirement: solution-category variants required; role variants are not used at this tier.

**UNKNOWN (score < 25).** UNKNOWN is the starting state for all visitors, not an edge case. Every visitor enters the program at UNKNOWN, and the system is designed to move them out of UNKNOWN through three mechanisms: progressive disclosure (zero-party signal collection), firmographic enrichment (Demandbase title matching), and behavioral signal accumulation (cross-session scoring). While a visitor remains at UNKNOWN, they receive the best available account-level or TAL-identified experience through the fallback cascade described in Section 6. CTAs are brand-level and exploratory. Content coverage requirement: default brand experience; no role or solution-category variants are required for this tier.

The score thresholds of 80, 50, and 25 are initial design parameters, not permanent calibration values. They are subject to adjustment once baseline classification accuracy data is available from live traffic. The full calibration methodology is in Document 7 (Measurement and Experimentation Framework).

---

### Two-Axis and Three-Axis Personalization

The program supports two modes of content selection, distinguished by the number of dimensions used to select a content variant.

Two-axis personalization selects content on role × stage: what role is this visitor, and where is their buying group in the pipeline? This is the default at MEDIUM role confidence. It requires content variants tagged with both a role and a buying group stage.

Three-axis personalization selects content on role × stage × buying job: it adds the buying job dimension, enabling content selection at the level of what specific task the visitor is trying to accomplish right now. Three-axis produces significantly more precise targeting but also requires a correspondingly larger content inventory — a variant is needed for each combination of role, stage, and buying job.

**Activation rules:**

- Three-axis activates at HIGH role confidence when buying job confidence is KNOWN or INFERRED.
- Three-axis activates at MEDIUM role confidence only when buying job confidence is KNOWN (zero-party confirmed).
- Two-axis is the default at MEDIUM role confidence.
- LOW and UNKNOWN role confidence never activate three-axis personalization.

The MEDIUM + INFERRED combination is excluded by design. At MEDIUM role confidence, there is enough classification uncertainty that adding an inferred buying job compounds the uncertainty rather than resolving it — the probability of serving content misaligned on both axes simultaneously is higher than the probability of a correct three-axis match. Zero-party buying job confirmation changes this: when a visitor has explicitly identified their buying job, that declaration eliminates the inference uncertainty that makes MEDIUM + INFERRED unreliable, and three-axis becomes appropriate even without HIGH role confidence.

Content teams must understand these activation thresholds before planning variant production. Building three-axis variants for MEDIUM visitors who will only ever receive two-axis personalization wastes production capacity. Failing to build three-axis variants for HIGH-confidence visitors leaves the program serving less precise content to the contacts where precision is most warranted and most measurable.

---

### Role Confidence and Buying Job Confidence

Role Confidence and Buying Job Confidence are two independent constructs that interact at the activation layer. They are computed separately and neither is derived from the other.

**Role Confidence** is a numeric score on a 0–100 scale. It determines which personalization tier a visitor is in, which fallback level applies, and which CTA treatment the visitor receives. It is computed from cumulative behavioral signal scoring (`§7 CROSS_ROLE_WEIGHTS`, decayed by `§8 DECAY_MULTIPLIERS`), firmographic confirmation bonus application, zero-party self-identification, and ML classifier output. The machine-readable specification is `§3 CONFIDENCE_TIERS`.

**Buying Job Confidence** has three states: KNOWN, INFERRED, and UNKNOWN. It determines whether two-axis or three-axis content selection activates. KNOWN means the visitor has explicitly identified their buying job via a progressive disclosure prompt. INFERRED means the visitor's behavioral pattern matches a buying job signal profile with sufficient signal strength. UNKNOWN is the default when role confidence is insufficient for buying job inference, or when no distinctive job-level behavioral pattern has been observed. The machine-readable specification is `BUYING_JOB_CONFIDENCE` in `kalder_data_model.py`.

A visitor may simultaneously hold HIGH Role Confidence and UNKNOWN Buying Job Confidence. Both states are valid and independent. HIGH role confidence does not imply buying job certainty; it simply means the system knows who the visitor is with high confidence.

When Buying Job Confidence is UNKNOWN, the system does not omit the buying job dimension from content selection — it falls back to `PROBABLE_JOB_PRIORS`, a role × stage lookup table in `kalder_data_model.py`. For each combination of role and buying group stage, `PROBABLE_JOB_PRIORS` returns the most statistically probable buying job based on where contacts in that role-stage combination typically are in their evaluation. This is a content selection prior, not a classification claim. The system is not asserting that the visitor is engaged in a particular buying job; it is selecting the most defensible content given what is known about role and stage, in the absence of observed buying job signal.

---

## The Fallback Cascade

### The Five Fallback Levels

The fallback cascade is a designed hierarchy of personalization states. Every visitor receives the experience the program has sufficient data to serve — there is no state in which the program has nothing to offer. The five levels are defined in `kalder_data_model.py §4 FALLBACK_CASCADE`.

**Level 1 — Role-specific, HIGH confidence.** Trigger: role confidence score ≥ 80 for a classified role in the active solution category context. Experience: full role-targeted content variants, selected per the active personalization axes (two-axis or three-axis per Section 5 rules). CTA tone: direct and role-specific (demo request, ROI model, integration documentation — matched to inferred role). Minimum content inventory: role-specific variants required at all active personalization surfaces for each covered solution category. Level 1 corresponds to the HIGH confidence tier defined in Section 5.

**Level 2 — Role-influenced, MEDIUM confidence.** Trigger: role confidence score 50–79. Experience: content reflects the inferred role's general orientation without requiring full role-specific variant depth. CTA tone: value-oriented; softer than Level 1 but directional. Minimum content inventory: role-influenced variants required; full role-specific depth prioritized for high-traffic surfaces. Level 2 corresponds to the MEDIUM confidence tier.

**Level 3 — Solution-interest.** Trigger: role confidence score 25–49 (LOW), or MEDIUM confidence with `pending_solution_fallback` active for the solution category. Experience: content selected based on the solution category the visitor has demonstrated interest in, without role differentiation. Solution-interest personalization is a substantively meaningful state: a visitor who has engaged with Customer Engagement or IT & Operations content and is receiving solution-category-relevant content is getting a materially more relevant experience than the default brand experience, even without a role classification. CTA tone: exploratory and category-oriented. Minimum content inventory: solution-category variants required per active category.

**Level 4 — Account-level, TAL identified.** Trigger: role confidence below 25 (UNKNOWN), but the visitor's account has been matched to the Target Account List via Demandbase or AEP account resolution. Experience: account-aware content reflecting Kalder's relevance to the visitor's industry or account profile, without solution or role specificity. UNKNOWN visitors whose accounts are TAL-identified enter the cascade at Level 4 — this is the specific connection to the UNKNOWN tier described in Section 5. The program has meaningful account-level context even when no contact-level classification exists, and Level 4 uses it. CTA tone: brand-level with account-relevance signal. Minimum content inventory: TAL-aware account variants or industry-oriented default content.

**Level 5 — Default brand.** Trigger: visitor account not matched to TAL, or no account identification possible. Experience: standard brand content with no personalization signal applied. Level 5 is the correct experience for visitors the program has no basis to personalize for — it is the program's honest acknowledgment that no reliable signal exists, not a system error. CTA tone: broad and awareness-oriented. Minimum content inventory: standard brand experience; no personalized variants required.

Adobe Target is the implementation layer for the cascade rule hierarchy; the Target rule sequence must match the cascade level order defined here, with higher levels evaluated first. Implementation misalignment produces silent incorrect experience delivery.

---

### The Transition Model

Visitors move up and down the cascade over time as their cumulative signal profile changes. The cascade level is re-evaluated at the start of each session based on the visitor's current cumulative score; a visitor's level is stable within a session and does not change mid-session.

Behavioral scores are cumulative and session-decayed. Each session score reflects all accumulated signals across the visitor's history, adjusted by the decay multipliers in `§8 DECAY_MULTIPLIERS` — current session signals weighted at 1.5×, signals from the past 90 days at 1.0×, signals from 91–180 days at 0.7×, and signals older than 180 days zeroed out for identified contacts. A visitor who returns frequently with consistent signals accumulates toward a higher cascade level over time. A visitor who does not return allows their signals to decay.

Three mechanisms drive upward movement: behavioral signal accumulation across sessions, firmographic enrichment via Demandbase title matching triggering the +30 bonus when the behavioral floor is met, and zero-party disclosure through a progressive disclosure prompt response.

Downward movement is also possible and correct. A visitor whose signals decay without new accumulation will see their confidence score decrease, potentially dropping from MEDIUM to LOW, or from LOW to UNKNOWN, at the start of their next session. Serving a lower-confidence experience to a visitor whose signals have decayed is the correct behavior — classification certainty has genuinely decreased, and the experience should reflect that.

---

### Coverage Constraints and the pending_solution_fallback

Role confidence and content availability are two independent constraints. Both must be satisfied for full personalization to activate. A HIGH-confidence classification does not produce a Level 1 experience if the role-specific content inventory for the active solution category does not exist.

When a visitor's behavioral signals indicate interest in a solution category with `coverage_status: pending` in `§1c SOLUTIONS` or `§1d SOLUTION_CATEGORIES`, the `pending_solution_fallback` behavior activates. Regardless of the visitor's role confidence score, the experience defaults to the best available general content for the solution area — functionally Level 3 or below — because validated role-specific or solution-specific content for that category is not yet available to serve.

At v1 launch, four solution categories carry partial or pending coverage: IT & Operations (partial), Employee Experience (pending), Risk & Compliance (pending), and AI Platform (pending). Customer Engagement is the only fully covered category at launch. A visitor classified as a HIGH-confidence Champion whose active solution context is Employee Experience will receive a Level 3 experience until Employee Experience role-specific content inventory is produced and the category's coverage status advances.

The `pending_solution_fallback` constraint is temporary and resolves as solution category coverage expands; the content team should treat pending categories as a production roadmap priority, not a permanent ceiling.

---

## Role-to-Convergence-Point Mapping

### Scope of This Section

This section maps which roles participate in which convergence points and what that participation requires from the content program. Full convergence point definitions — including entry criteria, exit criteria, common blockers, loop-back severity, and seller actions — are in Document 6 (Buying Group Journey and Convergence Model). A retrieval system querying convergence point mechanics should retrieve Document 6, not this section.

---

### Role-to-Convergence-Point Matrix

| Convergence Point | Champion | Economic Buyer | Influencer | User | Ratifier |
|---|---|---|---|---|---|
| Problem Validation | R | R | — | — | — |
| Requirements Framing | R | — | R | R | S |
| Solution Validation | R | — | R | R | — |
| Business Value Alignment | R | R | S | S | — |
| Risk & Compliance Validation | R | R | — | — | R |
| Final Commitment | R | R | — | — | R |

**Key:** R = Required (role gates this convergence point), S = Supporting (role participates but does not gate), — = not a participant

Full definitions of each convergence point, including trigger conditions, role participation requirements, common blockers, and loop-back severity, are in Document 6 (Buying Group Journey and Convergence Model).

---

### Interpreting the Map

The Champion is the only role required at all six convergence points. This reflects the Champion's structural function in the buying group: they are not just an individual evaluator conducting their own research, but the internal coordinator responsible for driving the group toward shared positions at every stage of the journey. The content implication is direct. A content program that serves Champions only evaluation and research content — case studies, product comparisons, technical documentation — is addressing only half of what Champions need. Champions also need convergence-enabling content: consensus briefs to share with their buying group, executive briefs to bring to Economic Buyers, and alignment tools to facilitate Requirements Framing and Business Value Alignment. Diverge-phase content enables the Champion's individual work; converge-phase content enables the Champion's group coordination work. Both are required.

The Ratifier is Required at only two convergence points — Risk & Compliance Validation and Final Commitment — the lowest participation count of any Required role in the matrix. Those two convergence points are also the highest-severity loop-back points in the buying process: a Ratifier-triggered block at either one occurs after Champion and Economic Buyer have already aligned and can unwind significant deal progress. The asymmetry is the operational point: low participation count, maximum consequence when participation occurs. This asymmetry is the justification for early Ratifier content enablement. The program should begin serving Ratifiers security documentation, compliance certification materials, and procurement readiness content as soon as Ratifier signals appear — not as a response to the Ratifier arriving at Risk & Compliance Validation, but as preparation designed to prevent the Ratifier from blocking there.

Role absence at a convergence point carries the same operational weight as role presence. Two absence patterns are specific deal-risk signals. Economic Buyer absence at Business Value Alignment typically means the Champion is advancing group alignment without EB sponsorship — the business case is being built without the person who has to approve it, and the convergence point cannot be genuinely reached without EB participation. For BDRs, a buying group where the Champion shows strong Business Value Alignment engagement signals but no EB-attributed sessions is a proactive outreach trigger, not a positive sign. User absence at Solution Validation before the group advances to Business Value Alignment is a loop-back risk: groups that progress past Solution Validation without User participation routinely encounter late-stage friction when the User veto surfaces after Champion and EB have committed. These are signals for the sales team to act on, not descriptive observations.

The convergence point map is the mechanism by which buying group intelligence becomes actionable for BDRs and AEs. When behavioral signals at an account suggest a buying group is approaching a convergence point — role signal density increasing across the group, convergence-enabling content being consumed, buying job inference shifting toward later stages — that pattern is a BDR alert trigger, not just a reporting metric. The full sales activation specification, including alert payload structure, trigger conditions per convergence point, recommended actions, and CRM handoff configuration, is in Document 8 (Operational Runbook).

---

## Solution-Category Role Variations

The generic role definitions in Section 3 describe role behavior patterns as they appear across the model. This section documents the category-specific adjustments a practitioner needs to configure audience segments and content routing accurately for each solution category. For specific title-to-role assignments, `§19 TITLE_ROLE_MAP` is the operational lookup; what follows is the intelligence layer that explains what the title map reflects and where its edge cases are.

---

### Customer Engagement

*Coverage status: source-validated (Forrester JTBD research, CRM Buying Group Planning deck, November 2025). This is the most precisely validated title-to-role mapping in the model.*

The key deviation from generic role definitions in this category is Champion archetype variation by solution sub-type. For Customer Service solutions (customer service management, field service management), the Champion is a service operations leader: Head of Customer Experience, Director of Customer Service Operations, Director of Field Service. For Sales Automation solutions, the Champion is a revenue operations leader: Director of Sales Operations, Head of Revenue Operations, Director of Sales Enablement. These are distinct behavioral profiles with distinct content needs — a Champion in customer service is evaluating workflow quality and agent experience; a Champion in sales automation is evaluating pipeline velocity and rep productivity. The classifier must apply the correct solution context when resolving role.

The Influencer split mirrors this: VP of IT or Director of Business Applications for Customer Service; VP of Marketing / Demand Generation or Finance Controller / FP&A for Sales Automation. Serving cross-solution Influencer content to this category without the sub-type qualifier will produce misalignment. The Economic Buyer is consistent within each sub-type: CCO or COO for Customer Service, CRO for Sales Automation.

---

### IT & Operations

*Coverage status: partial. Role profiles for this category are constructed from analyst frameworks and buying group type descriptions; the majority of solution entries in `§1c SOLUTIONS` carry `coverage_status: "constructed"`. Constructed entries are high-quality synthesis, not fabrications, but carry a lower evidentiary basis than the Customer Engagement definitions. Validate against CRM data as it accumulates.*

The most operationally significant deviation in this category is EB/Champion proximity. CIO and CTO are the canonical Economic Buyer titles across IT & Operations solutions — but in some organizations, particularly those with hands-on technology leadership, the CIO or CTO also conducts the kind of deep technical evaluation that resembles Champion behavior: solution deep-dives, architecture assessments, integration documentation access. A CIO accumulating Champion-pattern behavioral signals is not misclassified; they are functioning in both roles simultaneously, and the classifier will reflect that ambiguity as a compressed role differential. The mitigation is firmographic title confirmation combined with session depth — a CIO with deep product documentation access across multiple sessions is likely a hybrid, not a misclassified Economic Buyer.

The Influencer in this category is the most technically rigorous in the model. Enterprise Architect, Head of Platform Engineering, and VP of Automation / App Development are the primary Influencer profiles. These contacts evaluate integration fit and architectural coherence at a depth that exceeds Influencer behavior in other categories. Their signal pattern may briefly resemble Champion behavior in early evaluation stages; session breadth across multiple solution areas over multiple sessions is the discriminating signal.

---

### Employee Experience

*Coverage status: constructed. Role profiles are synthesized from analyst frameworks, buying group type descriptions, and HR technology market knowledge. Validate against CRM data as it accumulates.*

Champion title varies by solution sub-type within this category: VP of HR or HR Director for HR Service Delivery, VP of Workplace for Workplace Services, and VP of Learning & Development or Chief Learning Officer for Learning & Development. Segment and route these as distinct Champion profiles — they share the role structure but have non-overlapping content needs and JTBDs. The Economic Buyer is consistent across all three: CPO (Chief People Officer) or CHRO. This cross-solution EB consistency is unusual in the model and simplifies EB-targeted content routing for this category.

One structural risk requires classifier attention. In some organizations — particularly mid-market and organizations with a combined CPO/CHRO title — the CPO or CHRO functions as both Economic Buyer and de facto Ratifier for workforce compliance requirements. This person controls the budget and also holds final authority over data governance, privacy compliance, and workforce policy. The standard five-role buying group structure compresses to four in these cases, with the EB absorbing Ratifier responsibilities. When a CPO-titled contact accumulates both EB signals (ROI calculator, executive brief) and Ratifier signals (compliance documentation, data residency pages) in the same window, that co-occurrence should be flagged rather than forcing a single-role classification.

---

### Risk & Compliance

*Coverage status: constructed. Role profiles are synthesized from GRC market knowledge, regulatory risk buying patterns, and analyst frameworks. Validate against CRM data as it accumulates.*

This category has the highest Ratifier involvement in the model. Regulatory risk is a primary purchase driver — not a downstream procurement concern — and the Ratifier may participate in evaluation much earlier than in other categories. A Chief Risk Officer or Head of Compliance arriving at the Security Trust Center early in the account engagement timeline should not be discounted as a noise case; it may be the genuine entry point for a Risk & Compliance buying group where the Ratifier initiated the evaluation rather than entering late.

Buying groups in this category frequently compress in smaller organizations. The standard five-role structure often contracts to Champion + Economic Buyer + Ratifier, with User and Influencer roles merged into the Champion or absent. A three-contact buying group with concentrated champion and ratifier signals and no discernible Influencer or User engagement is normal for this category, not a classification gap.

The Champion-as-Influencer overlap is the most acute classification challenge here. The functional risk leader who champions the evaluation — a VP of GRC, Director of Information Security, or Chief Compliance Officer — is typically also the most technically rigorous evaluator in the group. Their session pattern will carry both Champion signals (multi-session deep exploration, demo requests) and Influencer signals (technical documentation, integration catalog). Apply the solution context and session recency to resolve: if this contact initiated and sustained the evaluation, Champion is the governing classification.

---

### AI Platform

*Coverage status: constructed. Role profiles are synthesized from AI platform market dynamics, enterprise AI governance frameworks, and buying behavior hypotheses. This is the newest category in the model and has the least CRM validation. Validate aggressively as data accumulates.*

The Champion in this category carries three simultaneous functions that are typically distributed across roles in other categories: domain expert, internal advocate, and hands-on technical evaluator. This is the most technically sophisticated Champion profile in the model. Titles include Chief AI Officer, Head of AI Center of Excellence, VP of Data Strategy, and Director of Data Governance. This Champion does not just build the internal case — they also conduct the architectural evaluation that in other categories would fall to the Influencer.

Influencer density is higher in this category than in any other: buying groups typically include multiple technical Influencers (Data Engineers, Platform Architects, Security Engineers, AI Operations Managers) who evaluate different dimensions of the platform independently. Serving a single Influencer content treatment to this category will underserve the group. If signal data permits, segment Influencers by technical function when routing content.

The Ratifier in this category has category-specific scrutiny concerns that do not appear prominently elsewhere: AI governance frameworks, model transparency and explainability, data residency and sovereignty, and AI ethics policy compliance. Standard security and procurement Ratifier content is insufficient for this category; AI-specific trust and governance content is required. Buying groups overall tend to be smaller in headcount but technically deeper than other categories — fewer contacts, but higher average signal intensity per contact.

---

## Glossary and Cross-Reference Table

### Glossary

**Buying job confidence** — the three-state construct (KNOWN, INFERRED, UNKNOWN) derived from `BUYING_JOB_CONFIDENCE` in `kalder_data_model.py` that determines whether two-axis (role × stage) or three-axis (role × stage × buying job) personalization activates; computed independently from role confidence.

**Confidence tier** — one of four classification certainty levels (HIGH ≥ 80, MEDIUM 50–79, LOW 25–49, UNKNOWN < 25) defined in `§3 CONFIDENCE_TIERS` that gates the depth and type of personalization the program is permitted to serve.

**Context-dependency principle** — the rule that role is a property of a contact in a specific solution category context, not a global property of a contact; the same individual may hold different roles in different buying groups simultaneously within the same account.

**Converge phase** — the portion of a buying stage in which individual role evaluation gives way to group alignment activity oriented toward a shared convergence point, as defined in `§2 ROLES double_diamond_role`.

**Convergence-enabling content** — content designed to facilitate group alignment at a convergence point — including consensus briefs, executive briefs, and alignment tools — as distinct from diverge-phase content designed to support individual role evaluation.

**Convergence point** — a milestone in the buying group journey at which all required roles must reach a shared position before the group can advance; full definitions are in Document 6 (Buying Group Journey and Convergence Model), sourced from `§18 BUYING_GROUP_CONVERGENCE_POINTS`.

**Dark social** — referral traffic with no attributable source, typically occurring when content is shared via private channels such as email, messaging apps, or internal intranets; relevant to Economic Buyer arrival pattern classification because EBs frequently arrive via Champion-forwarded links that produce no referrer.

**Diverge phase** — the portion of a buying stage in which each role independently completes its own jobs-to-be-done before the group converges toward a shared position, as defined in `§2 ROLES double_diamond_role`.

**Fallback cascade** — the five-level hierarchy of personalization states defined in `§4 FALLBACK_CASCADE` that the program serves when role confidence is insufficient for full personalization, ensuring every visitor receives the most relevant experience the available signal supports.

**Late-stage loop-back** — a deal-disrupting event triggered when a required role — most commonly the Ratifier — raises a blocking concern at Risk & Compliance Validation or Final Commitment after Champion and Economic Buyer have already aligned; severity levels are defined in `§18 BUYING_GROUP_CONVERGENCE_POINTS`.

**ML classifier coverage** — the set of roles for which the Snowflake ML classifier has sufficient labeled training data at v1 launch to produce a role prediction: Champion, Economic Buyer, and Influencer; User and Ratifier are pending.

**Personalization axis** — a dimension of content selection; the three axes are role, buying group stage, and buying job; two-axis personalization uses role × stage; three-axis personalization adds buying job as the third dimension.

**Post-sale noise** — behavioral signals produced by active customers visiting kalder.com that are indistinguishable from pre-purchase evaluation signals without an account-level CRM customer status filter applied before scoring.

**Role** — a function an individual performs within a specific buying group in a specific solution category context, classified as Champion, Economic Buyer, Influencer, User, or Ratifier per `§2 ROLES`; role assignment is solution-specific and not globally fixed to a contact.

**User veto** — a strong negative recommendation from the User role that can stall or reverse a purchase decision that Champion and Economic Buyer have already aligned on, typically surfacing as a late-stage friction event because User engagement volume is lower and negative signals are rarely CRM-logged until a deal slips.

**Zero-party classification** — role identification based on explicit self-declaration by the visitor via a progressive disclosure prompt; combined with behavioral confirmation, zero-party classification produces HIGH confidence, as distinct from behavioral inference (MEDIUM ceiling) or CRM-confirmed ML classifier output.

---

### Cross-Reference Table

| Document | Relationship | Specific Dependency |
|---|---|---|
| `kalder_data_model.py` | Document 1 depends on this | Canonical role definitions (§2), confidence tier thresholds (§3), fallback cascade levels (§4), signal weight matrix (§7), decay multipliers (§8), classification scoring rules (§12), data source authority hierarchy (§13), title-to-role map (§19) |
| Document 2 — Signal Definition and Confidence Model | Depends on Document 1 | Five role definitions and confidence tier model that determine which signal weight thresholds apply per role and how cumulative scores map to classification tiers |
| Document 3 — Audience and Segmentation Architecture | Depends on Document 1 | Role definitions and confidence tier activation gates that determine which contacts qualify for each segment tier and which channels activate at each level |
| Document 4 — Content Model and Taxonomy | Depends on Document 1 | Role definitions, behavioral signatures, and content preference profiles that govern content tagging requirements, role-specific variant production scope, and diverge/converge phase classification |
| Document 5 — Personalization Decisioning Rules | Depends on Document 1 | Confidence tier activation gates, two-axis vs. three-axis activation rules, fallback cascade levels, and role-to-convergence-point map that govern experience selection logic in Adobe Target |
| Document 6 — Buying Group Journey and Convergence Model | Depends on Document 1 | Role definitions and convergence point participation map (Section 7) that anchor the journey stage model, JTBD code library structure, and double-diamond phase assignments |
| Document 7 — Measurement and Experimentation Framework | Depends on Document 1 | Confidence tier model and role definitions that define measurement segment dimensions, holdback group structure, and role-level analysis breakdowns for lift calculation |
| Document 8 — Operational Runbook | Depends on Document 1 | Role definitions, three-tier data authority hierarchy, convergence point participation map, and classification methodology that govern sales activation alert triggers, progressive disclosure UX requirements, and CRM handoff specifications |
| Document 9 — Privacy and Consent Architecture | Depends on Document 1 | Classification methodology and signal types defined in Section 4 that determine legal basis requirements for cross-session behavioral inference and consent-gating rules for firmographic enrichment |

---

*Document owner note — productization backlog item: Section 4, Tier 1 description references "Kalder's Data & Analytics team" as the owner of the ML classifier. This organizational attribution is accurate for the Kalder corpus but will require client-specific configuration when this document template is adapted for other engagements in the AI Advisor product context.*
