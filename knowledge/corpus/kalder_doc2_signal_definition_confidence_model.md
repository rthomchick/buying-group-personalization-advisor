# Signal Definition and Confidence Model
 
**Document:** 2 of 9 — Kalder Personalization Hub Corpus
**Status:** Draft
**Last updated:** June 2026
**Depends on:** Buying Group Role Architecture (#1), `kalder_data_model.py` (§3, §4, §7, §8, §12, §13)
**Required by:** Audience and Segmentation Architecture (#3), Personalization Decisioning Rules (#5), Measurement and Experimentation Framework (#7)
 
---
 
## Section 1 — Document Scope and Canonical Status
 
This document is the authoritative specification of the behavioral signals that drive Tier 3 role classification in the Kalder Personalization Hub. It covers the complete 20-signal inventory from `CROSS_ROLE_WEIGHTS` [data model §7], the per-role weight assigned to each signal, and the engagement thresholds that constitute a qualifying signal observation. It is the human-readable companion to `kalder_data_model.py` sections §3, §4, §7, §8, §12, and §13. Practitioners read this document; downstream systems — the ML classifier, scoring engine, and AEP attribute layer — read the data model. Any discrepancy between this document and the data model is a defect; the data model governs.
 
Three topics adjacent to signal definition are explicitly out of scope here and delegated to other documents. The scoring sequence — the step-by-step computation that transforms raw signal observations into a cumulative role confidence score, including the firmographic bonus guard rail and minimum role differential check — is fully specified in Document 5 (Personalization Decisioning Rules) and `kalder_data_model.py §12 CLASSIFICATION_SCORING_RULES`. Signal recency decay multipliers define how scores are weighted over time; those multipliers govern how the engine interprets signal age, not what each signal means, and they are specified in `kalder_data_model.py §8` and given their human-readable treatment in Section 3 of this document (Signal Recency and Decay Model). Operational monitoring of signal health — detecting decay anomalies, signal volume drops, and threshold drift over time — is covered in Document 8 (Operational Runbook). Consent classification — the legal basis for collecting and processing each signal, PII involvement, cross-site status, and geographic consent rules — is governed by Document 9 (Privacy and Consent Architecture). When a practitioner has a question about whether a signal requires explicit user consent in a given geography, that answer lives in Document 9, not here.
 
Signal weights govern Tier 3 behavioral inference exclusively. They do not affect Tier 1 classification, which is produced by the CRM-confirmed ML classifier prediction from Snowflake and yields HIGH confidence by definition. They do not affect Tier 2 classification, which is produced by zero-party self-identification via progressive disclosure forms and yields HIGH confidence when combined with behavioral confirmation. The three-tier data authority hierarchy is defined in `kalder_data_model.py §13 DATA_SOURCE_AUTHORITY_HIERARCHY` and described in Document 1 (Buying Group Role Architecture). No part of this document redefines, extends, or overrides that hierarchy.
 
The five role keys used throughout this document — `champion`, `economic_buyer`, `influencer`, `user`, `ratifier` — are inherited from Document 1 and their canonical definitions are encoded in `kalder_data_model.py §2 ROLES`. The confidence tier thresholds — HIGH (score ≥ 80), MEDIUM (50–79), LOW (25–49), UNKNOWN (< 25) — are inherited from `kalder_data_model.py §3 CONFIDENCE_TIERS`. Neither the role definitions nor the confidence tier thresholds are redefined here.
 
The signal weights in §7 CROSS_ROLE_WEIGHTS carry a v0.6.4 provenance note. They are testable hypotheses derived from analyst frameworks and pilot engagement data, not validated empirical parameters. This document reflects that status throughout: every weight value is labeled as a hypothesis. Practitioners must not treat weights as ground truth when making configuration decisions; they should validate weights against CRM-confirmed role data as it accumulates and apply change requests through the data model versioning process.
 
This document specifies how behavioral scores are computed from signal observations. It does not specify what personalized experience a visitor receives at each confidence tier or score level — that is governed by Document 5 (Personalization Decisioning Rules).
 
---
 
## Section 2 — Signal Inventory
 
### 2.1 Overview
 
The signal inventory contains the 20 behavioral signals that constitute the complete input set for Tier 3 role classification. These 20 signals are the only behavioral inputs to the scoring engine; no signal outside this inventory contributes to role confidence scoring. All 20 signals are defined in `kalder_data_model.py §7 CROSS_ROLE_WEIGHTS`, which is the sole authoritative source for signal keys, labels, and per-role weight values [data model §7].
 
Signal scoring runs on a composite key of `(contact_id, solution_category)`. A given contact may have different role confidence scores across different solution categories simultaneously; scores do not aggregate or transfer across categories. This is a direct expression of the context-dependency principle established in Document 1: role is a property of a contact in a specific solution context, not a global property of a contact.
 
A qualifying signal observation is not a raw page event. Each signal has a defined engagement threshold — a minimum dwell time, a specific interaction depth, a form submission event, or a file download event — that the visitor must meet before the signal fires and its weights are applied to the contact's cumulative score. Engagement thresholds ensure that accidental page loads, browser prefetches, and sub-threshold visits do not contribute to role classification. All dwell time thresholds in this document measure active engagement time as captured by Segment custom events, not browser tab focus, session duration, or raw page time. The implementation specification for active engagement tracking is in Document 8 (Operational Runbook).
 
---
 
### 2.2 Signal Weight Reference Table
 
The following table presents all 20 signals with their per-role weights across all five buying group roles. Read each row as the full cross-role weight profile for that signal. Column headers use role key abbreviations: CH = `champion`, EB = `economic_buyer`, INF = `influencer`, USR = `user`, RAT = `ratifier`.
 
| Signal Key | Label | CH | EB | INF | USR | RAT |
|---|---|---|---|---|---|---|
| `case_study_download` | Case study / success story download | 20 | 3 | 5 | 2 | 2 |
| `competitive_comparison_view` | Competitive comparison page view | 18 | 5 | 3 | 0 | 2 |
| `demo_request` | Demo request submission | 20 | 8 | 5 | 3 | 0 |
| `multi_solution_exploration` | 3+ solution areas explored (90-day window) | 15 | 3 | −5 | −8 | −10 |
| `roi_calculator_usage` | ROI calculator / TCO tool interaction | 8 | 22 | 3 | 0 | 3 |
| `pricing_page_view` | Pricing page view | 5 | 15 | 3 | 0 | 5 |
| `executive_brief_download` | Executive brief or consensus brief download | 10 | 12 | 3 | −10 | 3 |
| `use_case_exploration` | Use case page exploration (> 3 min) | 8 | 3 | 15 | 8 | 2 |
| `product_tour_engagement` | Product tour / interactive demo engagement | 8 | 3 | 12 | 8 | 2 |
| `webinar_registration` | Webinar registration or attendance | 8 | 3 | 15 | 3 | 3 |
| `howto_training_content` | How-to / training content view | 2 | −10 | 5 | 18 | 2 |
| `community_forum_engagement` | Community / forum engagement | 5 | −12 | 5 | 15 | 2 |
| `security_whitepaper_download` | Security whitepaper download | 5 | 3 | 3 | 0 | 20 |
| `compliance_governance_content` | Compliance / governance content view | 3 | 5 | 3 | 0 | 18 |
| `technical_docs_deep` | Technical documentation (10+ min dwell) | 3 | −10 | 8 | 5 | 12 |
| `faq_support_docs` | FAQ / support documentation view | 2 | 0 | 3 | 12 | 2 |
| `diagnostic_assessment` | Diagnostic assessment / interactive quiz | 15 | 8 | 5 | 3 | 0 |
| `integration_catalog_view` | Integration catalog or API reference view | 3 | 0 | 15 | 5 | 3 |
| `security_trust_center_visit` | Security and Trust Center page visit | 5 | 5 | 5 | 0 | 22 |
| `category_explainer_view` | Category explainer page view (60s+ dwell) | 6 | 4 | 2 | 0 | 0 |
 
All weight values in this table are testable hypotheses derived from analyst frameworks and pilot engagement data [data model §7]. They are not validated empirical parameters and must be treated as such when making configuration decisions.
 
The primary validation mechanism is metric T2-06 (Role Classification Accuracy) [data model §11]: the percentage of behaviorally classified visitors whose classification matches their CRM role label when CRM data subsequently becomes available. The minimum acceptable accuracy threshold is 60%. Weight hypotheses that produce T2-06 accuracy below this threshold for any role should be flagged for revision. Validation runs quarterly per the cadence in Document 7 (Measurement and Experimentation Framework).
 
---
 
### 2.3 Signal Definitions
 
---
 
#### `case_study_download`
 
**Label:** Case study / success story download
 
**Definition:** This signal fires when a contact downloads a case study or customer success story asset from kalder.com. A qualifying observation is a file download event as captured by Segment's download event instrumentation. The threshold is the download event itself; dwell time is not the qualifying mechanism for this signal.
 
**Behavioral hypothesis:** A champion who has identified a problem and is building internal support needs peer proof — evidence that a comparable organization solved the same problem with the same solution. Downloading a case study is a Champion-specific act of evidence assembly: the Champion collects third-party validation they can forward to the buying group, use in an executive briefing, or attach to an internal business case. This behavior reflects the Champion's job of recruiting allies and building the case from inside the organization. The low weights for `economic_buyer` (3) and `ratifier` (2) are a hypothesis about consumption asymmetry: those roles receive case studies when the Champion brings them into the evaluation, rather than independently seeking them out at this stage. The weight hypothesis for `influencer` (5) reflects occasional technical due diligence — an Influencer validating whether a peer organization's implementation transferred to their context.
 
**Weight summary:** Highest weight: `champion` (20). Current weight hypotheses: `economic_buyer` (3), `influencer` (5), `user` (2), `ratifier` (2). Negative weights: none.
 
---
 
#### `competitive_comparison_view`
 
**Label:** Competitive comparison page view
 
**Definition:** This signal fires when a contact views a competitive comparison page on kalder.com with a qualifying dwell time of ≥ 60 seconds of active engagement. Active engagement time is captured by Segment custom events, not raw tab focus or session duration. The implementation specification for active engagement tracking is in Document 8 (Operational Runbook).
 
**Behavioral hypothesis:** A Champion who is actively building the internal case needs to be able to defend the vendor selection, which requires understanding how Kalder compares to alternatives the buying group will raise. Sustained engagement with competitive comparison content signals someone who is preparing to answer objections — a distinctly Champion-stage activity in the validation and framing portion of the buying journey. The `economic_buyer` weight (5) reflects that senior buyers occasionally conduct their own competitive framing at the shortlisting stage, when they are sizing the vendor landscape before committing evaluation resources. The zero weight for `user` reflects that Users evaluating workflow fit have little motivation to study competitive positioning — their concern is whether the product works for their daily job, not whether it beats an alternative. The `ratifier` weight (2) represents a late-stage compliance or procurement contact who may review competitive documentation during vendor selection, but does so passively rather than as a primary evaluation activity.
 
**Weight summary:** Highest weight: `champion` (18). Current weight hypotheses: `economic_buyer` (5), `influencer` (3), `ratifier` (2). Zero weights: `user` (0). Negative weights: none.
 
---
 
#### `demo_request`
 
**Label:** Demo request submission
 
**Definition:** This signal fires when a contact submits a demo request form on kalder.com. A qualifying observation is a form submission event — the act of completing and submitting the form, not viewing the demo request page. No dwell time threshold applies.
 
**Behavioral hypothesis:** Requesting a demo is the highest-intent buying action a Champion takes in the early evaluation phase: it converts passive research into an active vendor conversation. A Champion who has assembled internal context, reviewed peer proof, and is ready to validate their hypothesis through a live demonstration is exhibiting the clearest possible Tier 3 signal for that role. The `economic_buyer` weight (8) acknowledges that senior leaders occasionally request demos directly — typically at the shortlisting stage — but this is a lower-frequency behavior because Economic Buyers usually receive demos organized by the Champion. The zero weight for `ratifier` reflects that Ratifiers do not typically drive demo requests; they engage with compliance, security, and procurement content after the solution has advanced past initial evaluation.
 
**Weight summary:** Highest weight: `champion` (20). Current weight hypotheses: `economic_buyer` (8), `influencer` (5), `user` (3). Zero weights: `ratifier` (0). Negative weights: none.
 
---
 
#### `multi_solution_exploration`
 
**Label:** 3+ solution areas explored (90-day window)
 
**Definition:** This signal fires when a contact visits pages across three or more distinct solution category URL spaces within a rolling 90-day window. A qualifying observation requires that the three URL spaces map to distinct solution categories as defined in `kalder_data_model.py §1d SOLUTION_CATEGORIES`; visiting multiple pages within a single solution category does not qualify. The 90-day window is computed on a rolling basis from the current session.
 
**Behavioral hypothesis:** A Champion who is mapping the full scope of a transformation initiative — not just evaluating one solution — will naturally traverse multiple solution areas as they build the organizational case for a broader engagement. This breadth-of-exploration pattern signals someone with strategic portfolio responsibility, not a single-solution evaluator. The positive weights for `champion` (15) and `economic_buyer` (3) reflect this pattern. The negative weights for `influencer` (−5), `user` (−8), and `ratifier` (−10) encode a counter-hypothesis that is equally important: technical Influencers, Users, and Ratifiers are specialists. An Influencer is evaluating integration fit for a specific solution; a User is assessing workflow impact for their job; a Ratifier is reviewing compliance for a defined procurement scope. Multi-solution browsing is not how specialists behave — it actively contradicts the focused evaluation pattern those roles exhibit. A contact who fires `multi_solution_exploration` while also accumulating Ratifier signals should receive a lower Ratifier confidence score, because the combination suggests misclassification rather than a multi-role individual.
 
**Weight summary:** Highest weight: `champion` (15). Current weight hypotheses: `economic_buyer` (3). Negative weights: `influencer` (−5), `user` (−8), `ratifier` (−10).
 
---
 
#### `roi_calculator_usage`
 
**Label:** ROI calculator / TCO tool interaction
 
**Definition:** This signal fires when a contact interacts with an ROI calculator or TCO (Total Cost of Ownership) tool on kalder.com for ≥ 60 seconds of active engagement. Active engagement time is measured via Segment custom events; passive time on the page does not count toward the threshold.
 
**Behavioral hypothesis:** An Economic Buyer's primary job in the buying process is to size the problem and validate that the ROI justifies the investment. Running an ROI calculator is the most direct behavioral expression of that job: the Economic Buyer is constructing or validating the financial model they need to approve or escalate the purchase. The weight of 22 for `economic_buyer` is the highest single-role weight in the entire signal inventory — a hypothesis that this is the most role-specific behavior an Economic Buyer exhibits on the website. No other role has a comparable motivation to spend 60+ seconds actively engaging with financial return modeling at this stage. The modest weight for `champion` (8) reflects that Champions sometimes run ROI estimates to support their internal business case. The zero weights for `user` and `ratifier` reflect that those roles do not self-direct financial justification work prior to a purchase decision.
 
**Weight summary:** Highest weight: `economic_buyer` (22). Current weight hypotheses: `champion` (8), `influencer` (3), `ratifier` (3). Zero weights: `user` (0). Negative weights: none.
 
---
 
#### `pricing_page_view`
 
**Label:** Pricing page view
 
**Definition:** This signal fires when a contact views a pricing page on kalder.com with a qualifying dwell time of ≥ 60 seconds of active engagement. Active engagement time is captured by Segment custom events, not raw page time.
 
**Behavioral hypothesis:** An Economic Buyer evaluating whether a solution fits within budget or falls within the approval authority they hold will seek out pricing information directly — this is a natural behavior for someone who owns the financial decision. The weight hypothesis of 15 for `economic_buyer` reflects that pricing page engagement is a meaningful but not exclusive Economic Buyer signal: it occurs across a wider range of roles than ROI calculator usage because pricing pages are accessible and early-stage buyers of all roles may browse them out of curiosity. The `ratifier` weight (5) reflects that procurement or finance Ratifiers reviewing vendor viability before finalizing terms will check pricing. The zero weight for `user` reflects that Users evaluating daily workflow fit rarely self-direct to pricing before the buying group has advanced to a later stage.
 
**Weight summary:** Highest weight: `economic_buyer` (15). Current weight hypotheses: `champion` (5), `influencer` (3), `ratifier` (5). Zero weights: `user` (0). Negative weights: none.
 
---
 
#### `executive_brief_download`
 
**Label:** Executive brief or consensus brief download
 
**Definition:** This signal fires when a contact downloads an executive brief or consensus brief asset. Two engagement mechanisms qualify: a file download event captured by Segment's download event instrumentation, or an ePDF scroll depth interaction of ≥ 60 seconds of active engagement for embedded PDF assets that do not produce a file download event.
 
**Behavioral hypothesis:** An Economic Buyer who needs to understand whether a solution category merits investment — before committing to a full evaluation cycle — will seek a concise, executive-framed summary of the value proposition and business case. Executive briefs are written for this audience: they lead with business outcomes, ROI framing, and strategic rationale rather than technical capability depth. The weight hypothesis of 12 for `economic_buyer` and 10 for `champion` reflects that both roles consume this content type actively, with the Champion slightly more likely to download briefs they intend to circulate to the buying group. The negative weight for `user` (−10) encodes an important counter-signal: executive brief content is not relevant to a User assessing day-to-day workflow impact, and a contact who downloads executive briefs while lacking other User signals is more likely to occupy a senior or strategic role than an operational one. A contact who fires this signal alongside User-affirming signals such as `howto_training_content` should trigger role disambiguation review.
 
**Weight summary:** Highest weight: `economic_buyer` (12). Current weight hypotheses: `champion` (10), `influencer` (3), `ratifier` (3). Negative weights: `user` (−10).
 
---
 
#### `use_case_exploration`
 
**Label:** Use case page exploration (> 3 min)
 
**Definition:** This signal fires when a contact engages with a use case page on kalder.com for ≥ 180 seconds (3 minutes) of active engagement. Active engagement time is measured via Segment custom events. The 180-second threshold is notably higher than most other dwell-based thresholds in the inventory, reflecting the signal's design intent: surface contacts who are doing genuine use case evaluation, not passing through.
 
**Behavioral hypothesis:** An Influencer's core job in the buying process is to help shape requirements and stress-test how work will flow for their team. Deep engagement with use case content is the primary behavioral expression of that job: the Influencer is mapping the vendor's described scenarios against the specific operational context their team lives in. The weight of 15 for `influencer` reflects this alignment. The weight of 8 for both `champion` and `user` reflects that Champions building internal support need use case evidence they can cite, and Users self-evaluating workflow fit will study use cases that resemble their daily job. The low weight for `ratifier` (2) reflects that Ratifiers occasionally review use case framing during compliance validation, but it is not a primary evaluation activity for that role.
 
**Weight summary:** Highest weight: `influencer` (15). Current weight hypotheses: `champion` (8), `economic_buyer` (3), `user` (8), `ratifier` (2). Negative weights: none.
 
---
 
#### `product_tour_engagement`
 
**Label:** Product tour / interactive demo engagement
 
**Definition:** This signal fires when a contact engages with a product tour or interactive demo on kalder.com. A qualifying observation requires two conditions to be met simultaneously: ≥ 60 seconds of active engagement time and measurable step progression within the tour (the contact advances through tour steps rather than landing on the first screen and waiting). Both conditions must be met; dwell time alone without step progression does not qualify.
 
**Behavioral hypothesis:** An Influencer evaluating whether a product fits their team's workflow needs to see the product operate, not just read about it. Interactive product tours are the primary self-service mechanism for this evaluation prior to a live demo — they allow the Influencer to move at their own pace, skip irrelevant sections, and focus on the capabilities that matter for their context. The weight hypothesis of 12 for `influencer` reflects this alignment. The `user` weight (8) reflects that Users assessing daily workflow impact will engage similarly — for a User, the product tour is a preview of what their workday will look like. The `champion` weight (8) reflects Champions who use product tour engagement to build familiarity before presenting to the buying group. The low weights for `economic_buyer` (3) and `ratifier` (2) reflect that those roles are less likely to self-direct through interactive product exploration at this stage.
 
**Weight summary:** Highest weight: `influencer` (12). Current weight hypotheses: `champion` (8), `economic_buyer` (3), `user` (8), `ratifier` (2). Negative weights: none.
 
---
 
#### `webinar_registration`
 
**Label:** Webinar registration or attendance
 
**Definition:** This signal fires when a contact registers for or attends a Kalder webinar. A qualifying observation is a form submission event — the act of completing and submitting the registration form, or a confirmed attendance event for live sessions. Both registration and attendance qualify independently; a contact need not attend to fire the signal.
 
**Behavioral hypothesis:** An Influencer helping to shape requirements and validate proof of concept will actively seek structured educational content that covers real-world implementation patterns, customer outcomes, and technical depth — all of which webinar formats typically provide. The weight hypothesis of 15 for `influencer` reflects this alignment. The `champion` weight (8) reflects Champions who use webinar attendance to build the breadth of evidence needed to make the case internally. The even distribution of low weights across `economic_buyer` (3), `user` (3), and `ratifier` (3) reflects that webinar registration is a broadly accessible behavior — less role-discriminating than content downloads or tool interactions — but that moderate engagement across all non-Influencer, non-Champion roles is plausible and should not be penalized.
 
**Weight summary:** Highest weight: `influencer` (15). Current weight hypotheses: `champion` (8), `economic_buyer` (3), `user` (3), `ratifier` (3). Negative weights: none.
 
---
 
#### `howto_training_content`
 
**Label:** How-to / training content view
 
**Definition:** This signal fires when a contact views how-to or training content on kalder.com with a qualifying dwell time of ≥ 60 seconds of active engagement. Active engagement time is captured by Segment custom events.
 
**Behavioral hypothesis:** A User evaluating whether a product fits their daily workflow needs to understand how the product actually works at the task level — not the strategic business case, but the step-by-step operation. How-to and training content is the primary self-service evaluation tool for a User who has not yet received a structured demo and is assessing fit independently. The weight of 18 for `user` reflects this alignment. The strong negative weight for `economic_buyer` (−10) encodes a critical counter-signal: an Economic Buyer consuming how-to training content before a purchase decision is an anomalous pattern. Senior leaders who engage deeply with operational training content are almost certainly post-sale customers learning a product they already own — not pre-sale buyers evaluating a vendor. This signal actively contradicts the Economic Buyer classification when it fires alongside other Economic Buyer signals. A contact who accumulates both `roi_calculator_usage` and `howto_training_content` signals warrants disambiguation review. The consent classification implications of this signal — specifically the cross-session behavioral tracking required to identify post-sale versus pre-sale context — are specified in Document 9 (Privacy and Consent Architecture).
 
**Weight summary:** Highest weight: `user` (18). Current weight hypotheses: `champion` (2), `influencer` (5), `ratifier` (2). Negative weights: `economic_buyer` (−10).
 
---
 
#### `community_forum_engagement`
 
**Label:** Community / forum engagement
 
**Definition:** This signal fires when a contact engages with a community or forum section of kalder.com. A qualifying observation requires one of three engagement mechanisms: posting a new thread, submitting a reply, or sustained reading of ≥ 60 seconds of active engagement. All three mechanisms qualify independently; participation (post or reply) does not require a minimum dwell threshold.
 
**Behavioral hypothesis:** A User who is assessing whether an active user community exists — people doing jobs similar to theirs who share workarounds, answer questions, and document edge cases — is exhibiting a distinctly User-stage evaluation behavior. Community forums are where daily practitioners live, and a pre-sale User will visit community content to evaluate whether the community is healthy, whether their specific questions are answered, and whether they would have peer support post-implementation. The weight of 15 for `user` reflects this alignment. The strong negative weight for `economic_buyer` (−12) is one of the most discriminating counter-signals in the inventory: Economic Buyers do not self-direct into community forums during pre-sale evaluation. When a senior leader engages with community content, the most likely explanation is that they are an existing customer, not a prospect — this signal actively contradicts Economic Buyer classification. The `champion` weight (5) reflects occasional Champion visits to assess community health as part of building the vendor validation case.
 
**Weight summary:** Highest weight: `user` (15). Current weight hypotheses: `champion` (5), `influencer` (5), `ratifier` (2). Negative weights: `economic_buyer` (−12).
 
---
 
#### `security_whitepaper_download`
 
**Label:** Security whitepaper download
 
**Definition:** This signal fires when a contact downloads a security whitepaper asset. Two engagement mechanisms qualify: a file download event captured by Segment's download event instrumentation, or a dwell time of ≥ 90 seconds of active engagement for embedded or on-page security whitepaper content that does not produce a download event.
 
**Behavioral hypothesis:** A Ratifier whose primary job is to ensure standards alignment, identify risk flags, and finalize terms will self-direct to security documentation as one of their earliest independent evaluation activities. Security whitepapers are specifically the content type that Ratifiers — including CISOs, procurement leads, and finance approvers with security mandates — use to assess whether a vendor meets their organization's security standards before the buying group invests further evaluation effort. The weight of 20 for `ratifier` is among the highest single-signal, single-role weights in the inventory, reflecting the strength of this behavioral alignment. Note: a `security_whitepaper_download` that co-occurs in the same session with `integration_catalog_view` or `technical_docs_deep` should trigger the `infosec_influencer_disambiguation_whitepaper` conditional weight modifier [data model §7a CONDITIONAL_WEIGHT_MODIFIERS], which reduces the `ratifier` contribution and increases the `influencer` contribution. The scoring engine, not this document, applies those modifiers. The consent classification and data processing implications of security content downloads are specified in Document 9 (Privacy and Consent Architecture).
 
**Weight summary:** Highest weight: `ratifier` (20). Current weight hypotheses: `champion` (5), `economic_buyer` (3), `influencer` (3). Zero weights: `user` (0). Negative weights: none.
 
---
 
#### `compliance_governance_content`
 
**Label:** Compliance / governance content view
 
**Definition:** This signal fires when a contact views compliance or governance content on kalder.com with a qualifying dwell time of ≥ 90 seconds of active engagement. The 90-second threshold reflects the depth of engagement expected from a qualifying compliance review; incidental page views below this threshold do not fire the signal.
 
**Behavioral hypothesis:** A Ratifier whose responsibility includes clarifying procurement requirements, identifying regulatory risk, and ensuring the vendor meets governance standards will actively engage with compliance and governance content during the evaluation phase. This behavior is less discriminating than security whitepaper download — compliance content is broadly written and may attract `economic_buyer` readers who are framing the risk landscape — but it remains a strong Ratifier signal because the depth of engagement (90+ seconds) filters out incidental views. The weight of 18 for `ratifier` and 5 for `economic_buyer` reflects this two-role distribution. The zero weights for `user` reflect that Users evaluating daily workflow fit have limited motivation to self-direct into compliance and governance content.
 
**Weight summary:** Highest weight: `ratifier` (18). Current weight hypotheses: `champion` (3), `economic_buyer` (5), `influencer` (3). Zero weights: `user` (0). Negative weights: none.
 
---
 
#### `technical_docs_deep`
 
**Label:** Technical documentation (10+ min dwell)
 
**Definition:** This signal fires when a contact engages with technical documentation on kalder.com with a qualifying dwell time of ≥ 600 seconds (10 minutes) of active engagement. The 600-second threshold is the highest absolute dwell time threshold in the signal inventory, reflecting the signal's design intent: surface contacts who are conducting serious technical evaluation, not browsing documentation casually. Active engagement time is captured by Segment custom events.
 
**Behavioral hypothesis:** A Ratifier conducting technical due diligence — specifically a CTO, Head of IT Security, or Platform Architect participating in the governance layer of a buying group — will invest substantial time in technical documentation to validate architecture compatibility, data residency controls, and API surface before approving or escalating a vendor decision. The weight of 12 for `ratifier` reflects this pattern. The `influencer` weight (8) reflects that technical Influencers doing architecture evaluation will also engage deeply with documentation, though the `integration_catalog_view` signal is often a stronger discriminator for that role. The strong negative weight for `economic_buyer` (−10) mirrors the `howto_training_content` pattern: Economic Buyers who spend 10+ minutes in technical documentation before a purchase decision are almost certainly post-sale technical contacts who have been given buyer-level access, not pre-sale senior leaders. This counter-signal actively contradicts Economic Buyer classification at this engagement depth. Note: `technical_docs_deep` is one of the two co-occurrence signals in the `infosec_influencer_disambiguation` conditional weight modifier [data model §7a CONDITIONAL_WEIGHT_MODIFIERS].
 
**Weight summary:** Highest weight: `ratifier` (12). Current weight hypotheses: `influencer` (8), `champion` (3), `user` (5). Negative weights: `economic_buyer` (−10).
 
---
 
#### `faq_support_docs`
 
**Label:** FAQ / support documentation view
 
**Definition:** This signal fires when a contact views FAQ or support documentation content on kalder.com with a qualifying dwell time of ≥ 60 seconds of active engagement. Active engagement time is captured by Segment custom events.
 
**Behavioral hypothesis:** A User self-evaluating workflow fit will naturally seek out FAQ and support documentation to understand how common problems are solved, how support is structured, and whether the vendor's support model fits their team's operating pattern. This is a practical, task-oriented evaluation behavior: the User is asking "when something goes wrong, how does this work?" before committing to adoption. The weight of 12 for `user` reflects this alignment. The lower weights across other roles (champion 2, influencer 3, ratifier 2) reflect that FAQ and support documentation is broadly accessible content with modest role-discriminating power — most roles will occasionally browse it, but no role does so as a primary evaluation activity. The zero weight for `economic_buyer` reflects that senior buyers do not self-direct into support FAQ content during pre-sale evaluation.
 
**Weight summary:** Highest weight: `user` (12). Current weight hypotheses: `champion` (2), `influencer` (3), `ratifier` (2). Zero weights: `economic_buyer` (0). Negative weights: none.
 
---
 
#### `diagnostic_assessment`
 
**Label:** Diagnostic assessment / interactive quiz
 
**Definition:** This signal fires when a contact interacts with a diagnostic assessment or interactive quiz tool on kalder.com for ≥ 120 seconds of active engagement. Active engagement time is measured via Segment custom events. The 120-second threshold requires sustained interaction with the assessment, filtering out contacts who open the tool and immediately exit.
 
**Behavioral hypothesis:** A Champion building the internal case for a buying decision needs to be able to characterize and quantify the current-state problem — not just assert that a problem exists. Diagnostic assessment tools directly serve this need: they help the Champion frame the scope of the gap, produce credible internal data that the buying group can evaluate, and surface outputs the Champion can carry into stakeholder conversations. The weight of 15 for `champion` reflects this alignment. The `economic_buyer` weight (8) reflects that senior buyers occasionally use diagnostic tools to size the problem before deciding whether to invest evaluation resources. The zero weight for `ratifier` reflects that Ratifiers do not typically self-direct into diagnostic tools — their evaluation is compliance-oriented rather than problem-framing-oriented.
 
**Weight summary:** Highest weight: `champion` (15). Current weight hypotheses: `economic_buyer` (8), `influencer` (5), `user` (3). Zero weights: `ratifier` (0). Negative weights: none.
 
---
 
#### `integration_catalog_view`
 
**Label:** Integration catalog or API reference view
 
**Definition:** This signal fires when a contact views an integration catalog or API reference on kalder.com with a qualifying dwell time of ≥ 60 seconds of active engagement. Active engagement time is captured by Segment custom events.
 
**Behavioral hypothesis:** An Influencer evaluating architecture fit will self-direct to integration catalog and API reference content as one of their primary independent evaluation activities: they need to understand whether the vendor's platform integrates with the systems their team already operates, and whether the integration model (pre-built connectors, REST API, event-driven) matches their technical architecture. The weight of 15 for `influencer` is the highest for this signal, reflecting the alignment between Influencer evaluation behavior and integration catalog content. The `user` weight (5) reflects that technically-inclined Users sometimes check integration content to understand whether the product will connect to the tools they use daily. The zero weights for `economic_buyer` and `ratifier` reflect that those roles do not typically self-direct into integration catalogs during their evaluation activities. Note: `integration_catalog_view` is one of the two co-occurrence signals in the `infosec_influencer_disambiguation` conditional weight modifier [data model §7a CONDITIONAL_WEIGHT_MODIFIERS], which modifies `ratifier` and `influencer` weights when this signal co-occurs with `security_trust_center_visit` in the same session.
 
**Weight summary:** Highest weight: `influencer` (15). Current weight hypotheses: `champion` (3), `user` (5), `ratifier` (3). Zero weights: `economic_buyer` (0). Negative weights: none.
 
---
 
#### `security_trust_center_visit`
 
**Label:** Security and Trust Center page visit
 
**Definition:** This signal fires when a contact visits the Security and Trust Center on kalder.com with a qualifying dwell time of ≥ 60 seconds of active engagement. Active engagement time is captured by Segment custom events.
 
**Behavioral hypothesis:** A Ratifier responsible for ensuring standards alignment and finalizing terms will treat the Security and Trust Center as a primary self-service compliance validation resource — a structured destination where they can assess certifications, data residency controls, access management, and security practices without requiring a vendor conversation. The weight of 22 for `ratifier` is the highest single-role weight in the entire signal inventory, reflecting the hypothesis that `security_trust_center_visit` is the most role-specific behavior a Ratifier exhibits on the website. This weight carries an important behavioral caveat: a `security_trust_center_visit` that co-occurs with `integration_catalog_view` or `technical_docs_deep` in the same session shifts the behavioral interpretation from compliance validation (Ratifier job) to architecture evaluation (Influencer job). The `infosec_influencer_disambiguation` conditional weight modifier [data model §7a CONDITIONAL_WEIGHT_MODIFIERS] applies in that co-occurrence case, adjusting `ratifier` from 22 to approximately 10 and `influencer` from 5 to approximately 15. The scoring engine applies this modifier; the base weights here represent the single-signal case without co-occurrence. The consent classification and data processing implications of Security and Trust Center visits are specified in Document 9 (Privacy and Consent Architecture) and in Section 10.3 of this document.
 
**Weight summary:** Highest weight: `ratifier` (22). Current weight hypotheses: `champion` (5), `economic_buyer` (5), `influencer` (5). Zero weights: `user` (0). Negative weights: none (base weights only; see `infosec_influencer_disambiguation` [data model §7a CONDITIONAL_WEIGHT_MODIFIERS] for co-occurrence adjustments).
 
---
 
### 2.4 Pending Signals
 
The following signals have been identified as candidates for inclusion in `CROSS_ROLE_WEIGHTS` but have not received finalized weight assignments. Pending signals do not contribute to role confidence scoring until weights are assigned, validated, and merged into the data model via a versioned change request. Including them in this document preserves their governance status and prevents them from being silently omitted from future weight assignment cycles.
 
| Signal Key | Label | Status | Intended Subtypes | Condition for Weight Assignment |
|---|---|---|---|---|
| `video_content` | Video content engagement | `weights_pending_baseline` | To be split into `executive_video`, `technical_demo`, `product_walkthrough` as engagement data accumulates | Weights will be assigned per subtype after baseline engagement data establishes differential role consumption patterns across the three subtype variants. A single undifferentiated `video_content` weight would obscure the signal — executive summary videos and technical demo walkthroughs attract different roles and should not be averaged. |
 
**Governance note:** The `video_content` signal will not be split or weighted by a single practitioner judgment call. Weight assignment requires observed engagement data demonstrating that the three subtypes attract meaningfully different role distributions. This is an evidence threshold, not a scheduling milestone. [PENDING: baseline engagement data collection required before weight assignment]
 
---
 
---
 
## Section 3 — Signal Recency and Decay Model
 
### 3.1 Overview
 
Behavioral intent signals are not equally predictive across time. A contact who requested a demo last week is in a materially different buying posture than a contact who requested a demo seven months ago. The signal decay model formalizes this degradation: it applies a multiplier to each signal's base weight before scoring, so that recent behavior contributes more to the cumulative role score than historical behavior. Importantly, the decay model does not discard historical observations — a signal that fired six months ago remains in the contact's signal history. What changes is its contribution to the current scoring run.
 
Decay is applied to signal weights, not to signal observations. The observation record in Snowflake is unmodified by decay; the decay multiplier is a scoring-time transformation. All four decay windows are evaluated and their multipliers applied before any scoring rule in Section 5 executes. The decay-adjusted cumulative scores are the input to Section 5, not the raw signal observations.
 
The four decay windows are explicitly aligned to the ML classifier's 180-day engagement window [data model §8, `bg_stage_alignment` field]. The 180-day hard cutoff is not an arbitrary policy — it mirrors the feature engineering boundary used by the ML classifier. Signals older than 180 days are zeroed for behavioral scoring purposes, just as they fall outside the ML classifier's lookback window. Retaining the alignment means that Tier 1 and Tier 3 classification methods are evaluating the same behavioral timeframe.
 
---
 
### 3.2 Decay Window Table
 
The following table presents all four decay windows in order from most recent to oldest. Multiplier values are authoritative from `kalder_data_model.py §8 DECAY_MULTIPLIERS` [data model §8].
 
| Window Key | Label | Multiplier | Description | Alignment Note |
|---|---|---|---|---|
| `current_session` | Current session | 1.5× | Applies to all signals that fire during the visitor's active session. The 50% amplification reflects the design intent that real-time personalization should be driven by current behavior, not accumulated history. | In-session amplification is not modeled by the ML classifier; this window is unique to the Tier 3 behavioral scoring path. |
| `last_90_days` | Last 90 days | 1.0× | Baseline multiplier. Signals in this window are recent and predictive; no adjustment is applied. This is the reference value against which all other windows are calibrated. | Falls entirely within the ML classifier's 180-day engagement window. Tier 1 and Tier 3 treat this window identically from a lookback standpoint. |
| `91_to_180_days` | 91–180 days | 0.7× | Signals in this window still contribute, but at a 30% discount reflecting reduced predictive value. A contact who was actively evaluating four months ago is still a relevant prospect, but their behavioral evidence is aging. | This is the trailing edge of the ML classifier's feature engineering boundary. Both Tier 1 and Tier 3 treat 180 days as the outer limit of meaningful behavioral evidence. |
| `over_180_days` | More than 180 days | 0.0× | **Signals in this window contribute exactly zero to scoring.** This is not a discount — it is a complete exclusion from the scoring computation. A qualifying signal observation that falls in this window fired and is retained in Snowflake, but its adjusted weight is zero and it does not affect the cumulative score. Historical data beyond 180 days is retained for CRM retrospective matching and audit purposes; it does not re-enter the scoring engine until it ages into a qualifying window (which, by definition, it cannot). | Mirrors the ML classifier's 180-day feature engineering boundary [data model §8 `bg_stage_alignment`]. |
 
---
 
### 3.3 How Decay Is Applied
 
The following sequence describes the decay application process for each qualifying signal observation. An engineer implementing the scoring engine should treat this as the transformation step that sits between signal collection (Segment event pipeline) and scoring computation (Section 5).
 
**Step 1 — Timestamp each qualifying observation.** When a contact meets a signal's engagement threshold, the signal observation is recorded with a timestamp in Snowflake at the moment the threshold was satisfied. For dwell-time signals, the timestamp is recorded when the active engagement timer reaches the threshold value, not when the page was first loaded.
 
**Step 2 — Determine the decay window at scoring time.** At the moment the scoring engine runs for a given `(contact_id, solution_category)` key, each signal observation's age is calculated as the difference between the current timestamp and the observation timestamp. The age is evaluated against the four windows to assign the applicable decay multiplier. The window assignment uses the observation's age at scoring time — not at any prior scoring run. A signal that was in the `last_90_days` window on a prior run may have aged into the `91_to_180_days` window by the next run, and its multiplier will change accordingly.
 
**Step 3 — Multiply base weight by decay multiplier.** For each role, the signal's base weight from `CROSS_ROLE_WEIGHTS` [data model §7] is multiplied by the assigned decay multiplier. This produces the decay-adjusted weight for that signal observation for each role. A negative base weight remains negative after decay multiplication — a signal that contradicts a role at base weight −10 contributes −7 in the `91_to_180_days` window and −10 in the `last_90_days` window.
 
**Step 4 — Sum decay-adjusted weights per role.** Across all qualifying signal observations for the `(contact_id, solution_category)` key, sum the decay-adjusted weights for each role independently. This produces the decay-adjusted cumulative score per role.
 
**Step 5 — Pass decay-adjusted scores to Section 5.** The decay-adjusted cumulative scores for each role are the input to the Section 5 scoring rules. No further decay transformation occurs after this point.
 
A critical distinction to carry forward: decay applies to the contribution weight of a signal, not to the question of whether the signal fired. A signal observation that falls in the `91_to_180_days` window is a valid, qualifying observation. It contributes at 0.7× its base weight, but it contributes. The only window in which a signal observation is treated as if it never existed, for scoring purposes, is `over_180_days`, where the multiplier is 0.0×.
 
---
 
### 3.4 Current Session Amplification
 
The 1.5× multiplier for `current_session` signals serves a specific design intent that goes beyond simple recency preference. Real-time personalization decisions on kalder.com must reflect what the visitor is doing right now. A contact who accumulated a MEDIUM `champion` classification over the prior 90 days based on case study downloads and competitive comparison views, but who is currently interacting with an ROI calculator in the active session, is exhibiting an Economic Buyer signal in the current moment. The 1.5× amplifier ensures that the current session behavior has sufficient weight to influence the real-time personalization decision, rather than being averaged into the accumulated history at 1.0×.
 
**Worked example:** Two contacts both have an `roi_calculator_usage` signal with a base weight of 22 for `economic_buyer`.
 
Contact A's `roi_calculator_usage` observation is from 45 days ago. Decay window: `last_90_days`. Adjusted weight: 22 × 1.0 = **22 points**.
 
Contact B's `roi_calculator_usage` observation fires in the current session. Decay window: `current_session`. Adjusted weight: 22 × 1.5 = **33 points**.
 
The current session signal contributes 50% more than an identical signal observed last month. If all other signal history is equal between the two contacts, Contact B will receive a meaningfully higher `economic_buyer` score in the current scoring run and may qualify for a different personalization tier or real-time content treatment.
 
This amplification has a secondary effect: a contact whose accumulated history is insufficient for MEDIUM classification may cross the MEDIUM threshold in a single high-intent session if they engage with multiple strong signals. This is by design — a visitor who requests a demo, spends 90+ seconds with an ROI calculator, and downloads a case study in one session is exhibiting a concentration of Champion and Economic Buyer signals that justifies real-time responsiveness.
 
---
 
### 3.5 Decay and Anonymous Visitor Behavior
 
The `DECAY_MULTIPLIERS` specification [data model §8] defines decay windows against a `contact_id` as the identifier. For known contacts — visitors whose identity has been resolved through CRM match or progressive disclosure — the `contact_id` is stable and the decay windows operate as described above.
 
For anonymous visitors — visitors identified only by account via Demandbase reverse-IP, without a resolved `contact_id` — the application of decay windows raises an implementation question the data model does not currently resolve: when an anonymous visitor accumulates signal observations under a temporary account-level identifier, and is subsequently matched to a `contact_id` at the moment of identity resolution, do the pre-resolution signal observations carry their original timestamps into the decay calculation, or does identity resolution reset the clock?
 
The council's position is that identity resolution should not reset the clock. A contact who browsed solution pages and downloaded a case study anonymously three weeks ago, then identified themselves via a form submission, should carry those signals at their appropriate decay-window weights — `last_90_days` at 1.0× — rather than having them discarded or rescored as if they fired at the moment of identification. The behavioral history is real; the anonymity was a data limitation, not a behavioral difference.
 
However, implementing this correctly requires that the Segment event pipeline preserve the original observation timestamps when stitching pre-resolution events to the resolved `contact_id`. If the pipeline assigns the identity resolution timestamp to pre-resolution events, the decay windows will be computed incorrectly and current-session weights will be applied to signals that are weeks old.
 
This behavior is resolved by data model v0.2.0 CR-05 [data model §8 CR-05], which specifies: (a) anonymous visitors with 181–365 day signal history use an `anonymous_visitor_long_decay` multiplier of 0.2×; (b) at identity resolution, signals in this window are rescored using identified-visitor rules (`over_180_days: 0.0×`); (c) the anonymous decay multiplier does not persist after identification. The implementation requirement — that the Segment event pipeline preserve original observation timestamps when stitching pre-resolution events to the resolved `contact_id` — is specified in Document 8 (Operational Runbook).
 
---
 
## Section 4 — Pre-Scoring Filters
 
### 4.1 Overview
 
Pre-scoring filters are conditions evaluated before the scoring engine executes. They are not post-processing corrections — they determine whether a contact's signal observations enter the scoring pipeline at all. This distinction is operationally significant: a role confidence score that was computed from signals that should have been excluded cannot be corrected by subtracting points after the fact without creating a data integrity problem in the AEP contact profile. The score already exists. Other systems — real-time personalization decisions, sales activation alerts, segment membership — may have already acted on it. Filters must be preventive.
 
Four filters are specified in this section. They run in the order presented. A contact that fails any filter does not proceed to the next filter or to the scoring engine; their signal observations are not scored for role classification in that pass. Signals from prior qualifying sessions, within their decay windows, are unaffected by a filter failure on a new session — the filter failure affects only the current session's new observations.
 
---
 
### 4.2 Filter 1: TAL Status Filter
 
**Rule:** A contact's account must be confirmed as a member of the Target Account List (TAL) before any signal observation from that contact is passed to the scoring engine.
 
**Mechanism:** Demandbase reverse-IP resolution identifies the account associated with the visitor's IP address. TAL membership for that account is checked in AEP before the scoring pipeline executes. If the account is not on the TAL, the visitor's signal observations are captured by Segment (the behavioral event record is retained) but are not forwarded to the scoring engine. Non-TAL events do not contribute to role classification.
 
**Source:** [data model §13, §20] — `DATA_SOURCE_HIERARCHY` Rank 3 description and `WEBSITE_SURFACES` surface notes for `technical_docs` and `api_reference`.
 
**Rationale:** The TAL filter is the single most important noise-reduction mechanism in the scoring pipeline. Kalder's website receives traffic from sources with no buying intent — industry researchers, competitors, job applicants, existing customers browsing documentation, students, and general interest traffic. Scoring all of this traffic for role classification would produce a high-noise signal set that degrades the value of the classification model. TAL membership is the primary gate between the general visitor population and the scored prospect population.
 
This filter is especially critical for `user` and `ratifier` classification. The behavioral signals most associated with those roles — `howto_training_content`, `community_forum_engagement`, `faq_support_docs` for `user`; `security_whitepaper_download`, `compliance_governance_content`, `security_trust_center_visit` for `ratifier` — are also exhibited at high rates by post-sale customers using Kalder's products. Post-sale customer accounts are not on the TAL. Without the TAL filter, post-sale customer behavior would contaminate the pre-sale classification scores for those roles.
 
---
 
### 4.3 Filter 2: Post-Sale Customer Suppression
 
**Rule:** Contacts at accounts that are confirmed active Kalder customers are excluded from pre-purchase role classification scoring, regardless of their individual behavioral profile.
 
**Mechanism:** This is an account-level filter applied in AEP before the scoring pipeline executes. The account's customer status is checked against the Salesforce CRM record. If the account is an active customer, all contacts at that account are suppressed from acquisition scoring. Individual contact behavior is not evaluated — the suppression is applied at the account level.
 
**Source:** [data model §20] — `WEBSITE_SURFACES` `exclusion_flag: suppress_acquisition_scoring` applied to `community_forum_surface`, `knowledge_base_surface`, and related post-sale surfaces. The `get_signal_suppression_surfaces()` function returns surfaces with `signal_contribution` in `("suppressed", "negative", "weak_suppressed")` or a non-null `exclusion_flag`.
 
**Exception — pre-sale trial and POC accounts:** Contacts at accounts that are in a free trial or proof-of-concept engagement are not subject to this suppression. Trial and POC access generates genuine pre-sale User and Influencer signals — a contact evaluating the product in a structured trial is exactly the kind of pre-sale behavioral evidence the scoring model is designed to capture. The data model notes explicitly: "Pre-sale access (free trial / POC) should NOT be suppressed — strong User and Influencer signal in that context" [data model §20].
 
Correctly applying this exception requires verifying the account's Salesforce stage against the sales stage field, not just the CRM account type field. An account that is technically classified as a "customer" in the CRM system but is in a concurrent expansion evaluation — or is in a POC for a new solution category — may meet the exception criteria. Account type alone is insufficient to make this determination.
 
[PENDING: trial/POC account identification logic must be confirmed against the Salesforce account status and opportunity stage fields. The exception rule must be implemented as an explicit check, not as a default fallback. Implementation specification to be documented in Document 8 (Operational Runbook).]
 
---
 
### 4.4 Filter 3: Cross-Category Isolation
 
**Rule:** Signal scoring runs on the `(contact_id, solution_category)` composite key. Signal observations are partitioned by solution category URL space before scoring; each partition scores independently.
 
**Mechanism:** Before the scoring engine runs, signal observations for a contact are segmented by the solution category of the content the visitor engaged with. A contact who visited a Customer Engagement solution page and a Risk & Compliance solution page in the same session generates two separate observation sets — one for the `customer_engagement` solution category key and one for the `risk_compliance` key. The scoring engine runs separately on each observation set, producing independent `(contact_id, customer_engagement)` and `(contact_id, risk_compliance)` confidence scores.
 
**Source:** [data model §12] — `SCORING_RULES` composite key definition.
 
**Why this is a filter:** Cross-category isolation prevents a contact's high confidence score in one solution context from inflating their classification in another. An `economic_buyer` who is deeply engaged with the Customer Engagement solution area does not automatically present as an `economic_buyer` for a Risk & Compliance evaluation — the buying groups for those solutions may involve different individuals with different roles and different organizational contexts. Allowing scores to aggregate across categories would produce a distorted single-profile view that loses the solution-context specificity the model is designed to preserve. This aligns directly with the context-dependency principle from Document 1 (Buying Group Role Architecture): role is a property of a contact in a specific solution context, not a global property of a contact.
 
---
 
### 4.5 Filter 4: Session Quality Gates
 
**Rule:** Before individual signals within a session are evaluated for engagement threshold qualification, the session itself must meet minimum quality thresholds. A session that fails any quality gate generates no signal observations for that session.
 
**Source:** [data model §12] — `minimum_session_duration_seconds`, `minimum_page_views_for_signals`, `single_page_minimum_seconds`.
 
**The three gates:**
 
| Gate | Threshold | Data Model Field | Purpose |
|---|---|---|---|
| Minimum session duration | 60 seconds | `minimum_session_duration_seconds` | Excludes accidental visits, bot traffic, and bounce sessions where no meaningful engagement occurred. A session shorter than 60 seconds does not contain reliable behavioral evidence regardless of how many pages were viewed. |
| Minimum page views for signals | 2 pages | `minimum_page_views_for_signals` | Requires that the visitor navigated to at least two pages within the session before any signal is evaluated. Single-page visits — unless overridden by the single-page minimum gate — do not generate signal observations. |
| Single-page session minimum | 30 seconds | `single_page_minimum_seconds` | Override for the minimum page views gate: a single-page session where the visitor maintained ≥ 30 seconds of active dwell time on that page does qualify for signal evaluation. This gate exists because high-engagement single-page visits — such as a contact spending several minutes on a product detail page — represent meaningful behavioral evidence even without multi-page navigation. |
 
**Gate interaction:** The single-page session minimum (30-second dwell) overrides the minimum page views gate (2 pages) only for single-page sessions. If a session includes two or more page views, the minimum page views gate applies and the single-page minimum is irrelevant. A session must pass at least one of these two gates (multi-page navigation or ≥ 30 seconds on a single page) in addition to the 60-second minimum session duration.
 
**Scope of failure:** A session that fails any quality gate produces no new signal observations for that session. Prior signal observations from qualifying sessions — which remain in the contact's observation history within their decay windows — are unaffected. The quality gates assess the current session only; they do not retroactively invalidate observations from prior sessions. A TAL-matched contact who had a qualifying session last week and a bot-like session today retains last week's decay-weighted signals.
 
---
 
## Section 5 — Classification Scoring Rules
 
### 5.1 Overview
 
Section 5 specifies the complete scoring computation: the transformation from decay-adjusted signal observations (the output of Sections 3 and 4) to a final role classification and confidence tier assignment for a given `(contact_id, solution_category)` key. The seven-step sequence in Section 5.2 is the authoritative specification of that computation. An engineer implementing the scoring engine should treat these seven steps as the complete and sufficient specification of the scoring logic for Tier 3 behavioral inference.
 
The output of this section — a classified role and a confidence tier — is the input to Section 9 (Data Source Authority Hierarchy), which governs how Tier 3 behavioral scores are combined with Tier 1 ML classifier output and Tier 2 zero-party identification data to produce a final composite classification. Step 7 checks whether higher-authority data is absent (producing the MEDIUM ceiling when it is); Section 9 specifies the full three-tier hierarchy, the conflict resolution rules when Tier 1 and Tier 3 disagree, and the composite classification logic. Section 5 establishes what Tier 3 alone produces; Section 9 establishes how that output is adjudicated against the other tiers. From there, the composite classification is the input to Document 5 (Personalization Decisioning Rules), which specifies what experience a visitor receives at each confidence tier for each role. The division of responsibility is precise: this document specifies the rules by which scores are computed and tiers are assigned; Document 5 specifies the decisioning behavior that follows from those assignments.
 
All rule values cited in Section 5.2 are authoritative from `kalder_data_model.py §12 SCORING_RULES` [data model §12].
 
---
 
### 5.2 The Scoring Sequence
 
The following seven steps execute in order for each `(contact_id, solution_category)` key. Each step takes the output of the prior step as its input. No step may be skipped or reordered without invalidating the specification.
 
---
 
**Step 1 — Aggregate decay-adjusted weights per role**
 
**Rule:** For each qualifying signal observation that has passed through Section 4 filters and received a Section 3 decay multiplier, sum the decay-adjusted weights for each role independently.
 
**Input:** The complete set of qualifying signal observations for this `(contact_id, solution_category)` key, each with its decay-adjusted per-role weight (base weight × decay multiplier).
 
**Computation:** For each role (`champion`, `economic_buyer`, `influencer`, `user`, `ratifier`), sum all decay-adjusted weights across all qualifying signal observations. Negative weights sum as negative values; they reduce the cumulative score for the role they contradict.
 
**Output:** Five raw cumulative scores — one per role — for this `(contact_id, solution_category)` key.
 
**Data model reference:** [data model §7 `CROSS_ROLE_WEIGHTS`], [data model §8 `DECAY_MULTIPLIERS`].
 
---
 
**Step 2 — Apply score floor check**
 
**Rule:** If the maximum raw cumulative score across all five roles is below 25, assign the contact UNKNOWN tier and halt the scoring sequence. No classified role is assigned.
 
**Input:** The five raw cumulative scores from Step 1.
 
**Computation:** Identify the maximum score across all five roles. If `max(scores) < 25`, the contact is UNKNOWN for this `(contact_id, solution_category)` key. No further steps execute for this key in this scoring run.
 
**Output:** UNKNOWN tier with no classified role, or the five cumulative scores passed to Step 3.
 
**Data model reference:** [data model §12 `minimum_cumulative_score: 25`].
 
---
 
**Step 3 — Apply minimum role differential check**
 
**Rule:** If the top-scoring role does not lead the second-highest-scoring role by at least 10 points, cap the top-scoring role's score at 49.
 
**Input:** The five cumulative scores from Step 2 (for contacts that passed the floor check).
 
**Computation:** Identify the top-scoring role and the second-highest-scoring role. Calculate the differential: `top_score − second_score`. If the differential is less than 10, set `top_score = 49`. The 49 cap places the contact in the LOW tier: a qualifying score exists (the contact cleared the floor check), but the ambiguity of the signal profile — two roles scoring too closely — means the classification cannot be acted on at MEDIUM or HIGH confidence.
 
**Boundary condition:** If only one role has a positive score, there is no second-highest competitor and the differential check does not apply. The contact proceeds to Step 4 with their raw top score. A single-positive-score profile is not anomalous — it is the model's clearest classification outcome. It indicates that the contact's behavioral signals collectively point to one role and contradict or are neutral toward all others. This pattern requires no special handling and should not be treated as a data quality issue.
 
**Output:** Adjusted top score. The classified role remains the top-scoring role even after capping.
 
**Data model reference:** [data model §12 `minimum_role_differential: 10`].
 
---
 
**Step 4 — Apply firmographic confirmation bonus**
 
**Rule:** If a Demandbase title match is available and the firmographic role inference (`firmographic_role`) matches the behaviorally classified top-scoring role, add +30 to the top-scoring role's score.
 
**Input:** Adjusted top score from Step 3; firmographic role inference from Demandbase (if available).
 
**Computation — match case:** If `firmographic_role == classified_role`, apply `top_score = top_score + 30`.
 
**Computation — mismatch case:** If `firmographic_role` is available but does not match the classified role, do not apply the bonus. The mismatch is diagnostic information: the visitor's behavioral signals point to one role while their job title suggests another. This discrepancy should be flagged in the AEP profile for downstream review rather than resolved by applying or withholding the bonus. Do not reclassify the contact to the firmographic role based on the mismatch alone.
 
**Computation — no firmographic data:** If no Demandbase title match is available, this step is a no-op. Proceed to Step 5 with the score unchanged.
 
**Output:** Adjusted top score.
 
**Data model reference:** [data model §12 `firmographic_confirmation_bonus: +30`].
 
**Design gap — behavioral floor guard rail:** The `classify_visitor()` function in the data model [data model §12] applies the firmographic confirmation bonus unconditionally when a `firmographic_role` parameter is present, with no minimum behavioral score requirement. Under the current implementation, a contact with a cumulative behavioral score of 3 — representing minimal, barely-qualifying engagement — who also has a matching Demandbase title would receive a post-bonus score of 33, placing them in the LOW tier. A contact with a score of 10 would reach 40. While neither crosses the MEDIUM threshold in these examples, a contact with a score of 52 (already MEDIUM) would reach 82 (HIGH) on the strength of a title match alone, without requiring the behavioral breadth that HIGH confidence is intended to represent.
 
The council's position is that the bonus should amplify behavioral signal — confirming what the behavioral evidence already suggests — not substitute for it. A contact whose behavioral score is thin should not cross into a higher confidence tier solely because their title aligns. A behavioral floor (minimum pre-bonus behavioral score, recommended value: 15) would require that at least one meaningful signal above the noise floor exists before the firmographic bonus can be applied.
 
[PENDING: behavioral floor for firmographic bonus eligibility is not currently in `§12 SCORING_RULES` and is not implemented in `classify_visitor()`. The council recommends adding `firmographic_bonus_behavioral_floor: 15` to `SCORING_RULES` before production deployment. This is a design recommendation, not an implemented rule. Until this is resolved, production deployments should be aware that thin behavioral profiles with matching title data may produce inflated confidence scores.]
 
---
 
**Step 5 — Apply score clamp**
 
**Rule:** Clamp the adjusted score to the range [0, 100]. Any score below 0 is set to 0. Any score above 100 is set to 100.
 
**Input:** Adjusted top score from Step 4.
 
**Computation:** `clamped_score = max(0, min(100, adjusted_score))`.
 
**Purpose:** The score clamp prevents two edge cases: negative cumulative scores that could produce undefined tier behavior (a score of −5 has no defined tier), and scores above 100 that could result from the firmographic bonus applied to an already-high behavioral score. The clamp is applied after the firmographic bonus, so the bonus can push a score to exactly 100 but not above.
 
**Output:** Clamped score in the range [0, 100].
 
**Data model reference:** [data model §12 `score_clamp_floor: 0`, `score_clamp_ceiling: 100`].
 
---
 
**Step 6 — Apply signal diversity check for HIGH tier**
 
**Rule:** Before assigning HIGH confidence (clamped score ≥ 80), verify that the contact's qualifying signal observations include at least 2 distinct signal type keys from `CROSS_ROLE_WEIGHTS`. If the diversity threshold is not met, cap the score at 79.
 
**Input:** Clamped score from Step 5; count of distinct qualifying signal type keys in the contact's observation set.
 
**Computation:** Count the number of distinct `CROSS_ROLE_WEIGHTS` keys that have at least one qualifying observation for this `(contact_id, solution_category)` key. If `distinct_signal_types < 2` and `clamped_score ≥ 80`, set `clamped_score = 79`.
 
**Rationale:** HIGH confidence is intended to reflect genuine behavioral breadth — a contact who has demonstrated role-consistent behavior across multiple content types, not a contact who triggered one signal type repeatedly. A contact who engages with the ROI calculator in five separate sessions accumulates five qualifying observations for `roi_calculator_usage`, which may produce a cumulative score exceeding 80. But five instances of the same signal type do not provide the cross-signal corroboration that HIGH confidence requires. The repetition could represent persistent Economic Buyer interest, or it could represent a user testing the calculator tool. Two or more distinct signal types provide the cross-signal corroboration that reduces that ambiguity.
 
**Output:** Final clamped score, capped at 79 if the diversity threshold is not met for an otherwise-HIGH score.
 
**Data model reference:** [data model §12 `minimum_signal_diversity_for_high: 2`].
 
---
 
**Step 7 — Apply behavioral-only confidence ceiling**
 
**Rule:** If the contact's classification for this `(contact_id, solution_category)` key is based entirely on Tier 3 behavioral inference — no Tier 1 ML classifier output available, no Tier 2 zero-party self-identification confirmed — the maximum assignable confidence tier is MEDIUM. A score of 80 or above after Step 6 receives a MEDIUM tier assignment, not HIGH.
 
**Input:** Final clamped score from Step 6; data source authority tier for this contact × solution category key.
 
**Computation:** Evaluate whether any Tier 1 or Tier 2 data is available for this `(contact_id, solution_category)` key. If neither is available, apply the ceiling: if `clamped_score ≥ 80`, assign MEDIUM tier. The score value is not altered — a score of 91 remains 91 in the AEP profile — but the tier assignment is MEDIUM, not HIGH. This distinction matters for downstream systems: the score value is available for trend analysis and comparative ranking; the tier assignment governs what personalization experience the contact receives.
 
**Rationale:** The behavioral-only confidence ceiling exists because Tier 3 inference carries ambiguities that Tier 1 and Tier 2 data resolve. The post-sale customer contamination problem — where post-sale User and Ratifier behaviors are behaviorally indistinguishable from pre-sale ones — means that a high behavioral score is a necessary but not sufficient condition for HIGH confidence. The ML classifier's CRM-confirmed ground truth and zero-party self-identification provide the additional signal layer that justifies HIGH confidence assignment.
 
**Output:** Tier assignment: HIGH (≥ 80 with Tier 1 or Tier 2 confirmation), MEDIUM (50–79, or ≥ 80 with Tier 3 only), LOW (25–49), or UNKNOWN (< 25, assigned at Step 2).
 
**Data model reference:** [data model §12 `behavioral_only_confidence_ceiling: MEDIUM`].
 
---
 
### 5.3 ML Classifier v1 Coverage Implications
 
At v1 launch, the ML classifier covers three of the five buying group roles. User and Ratifier coverage is pending. This creates an asymmetric confidence ceiling across roles that practitioners and systems consuming role classification output must account for.
 
| Role | ML Classifier v1 | Maximum Tier 3 Confidence | Path to HIGH |
|---|---|---|---|
| `champion` | Covered | MEDIUM (Tier 3 ceiling) | Tier 1 ML classifier output, or Tier 2 zero-party self-identification + behavioral confirmation |
| `economic_buyer` | Covered | MEDIUM (Tier 3 ceiling) | Tier 1 ML classifier output, or Tier 2 zero-party self-identification + behavioral confirmation |
| `influencer` | Covered | MEDIUM (Tier 3 ceiling) | Tier 1 ML classifier output, or Tier 2 zero-party self-identification + behavioral confirmation |
| `user` | Pending | MEDIUM (Tier 3 ceiling — Tier 1 unavailable at v1) | Tier 2 zero-party self-identification + behavioral confirmation only; Tier 1 unavailable until ML classifier coverage is extended |
| `ratifier` | Pending | MEDIUM (Tier 3 ceiling — Tier 1 unavailable at v1) | Tier 2 zero-party self-identification + behavioral confirmation only; Tier 1 unavailable until ML classifier coverage is extended |
 
In practice, all five roles are subject to the MEDIUM ceiling for Tier 3 behavioral scoring alone (Step 7). The difference for `user` and `ratifier` is that there is no Tier 1 pathway to HIGH at v1 — the ML classifier that would provide CRM-confirmed ground truth for those roles does not yet exist. For `champion`, `economic_buyer`, and `influencer`, a Tier 3 MEDIUM classification can be upgraded to HIGH when the ML classifier confirms it. For `user` and `ratifier`, HIGH confidence at v1 requires zero-party self-identification (Tier 2).
 
The TAL status filter (Section 4.2) is especially important for `user` classification during the v1 period. The signals most associated with `user` — `howto_training_content`, `community_forum_engagement`, and `faq_support_docs` — are also heavily exhibited by post-sale customers using Kalder's products, and the absence of ML classifier coverage for this role means there is no Tier 1 correction mechanism for post-sale contamination that passes the TAL filter. The TAL filter is the primary and, at v1, the only automated defense against this contamination pattern for User classification.
 
---
 
### 5.4 Re-Scoring Behavior
 
When content on kalder.com is updated in ways that affect signal eligibility — for example, a page redesign that changes the engagement threshold for a dwell-based signal, or a content reclassification that affects which solution category URL space a page belongs to — the scoring engine may need to re-evaluate historical observations against the updated parameters. In these cases, the re-scoring rule applies.
 
**Rule:** When re-evaluating a contact's signal observations after a content or classification update, carry forward original scores for signal types that are unchanged. Do not re-score signal types whose definitions, weights, or engagement thresholds are unmodified by the update. [data model §12 `re_scoring_note`]
 
**Rationale:** Content changes on kalder.com should not retroactively alter a contact's accumulated confidence in areas unrelated to the change. If the Customer Engagement solution page is redesigned and its signal parameters updated, that change should affect forward scoring for that signal on that page — it should not cascade into a re-computation of the contact's `executive_brief_download` score from three months ago, which was correctly scored under the parameters in effect at the time.
 
**Implementation requirement:** Applying the re-scoring rule requires that the scoring engine store scores at the per-signal-type level, not only as a cumulative total per `(contact_id, solution_category)` key. Without per-signal-type score storage, it is impossible to carry forward the unchanged signals' contributions independently — the cumulative total would have to be recomputed from all observations, defeating the purpose of the rule.
 
[PENDING: per-signal-type score storage in the AEP attribute schema is required to implement the re-scoring rule. This is an implementation architecture requirement. Confirm storage design and attribute schema with Document 8 (Operational Runbook) before production deployment.]
 
---
 
### 5.5 Scoring Pipeline Summary
 
The following table is the QA-facing summary of the complete scoring pipeline. An engineer or QA practitioner can use it to verify that their implementation matches this specification. Each row corresponds to one step in the Section 5.2 sequence.
 
| Step | Rule | Condition | Output | Data Model Reference |
|---|---|---|---|---|
| 1 — Aggregate weights | Sum decay-adjusted weights per role across all qualifying signal observations | All signals that passed Section 4 filters, with Section 3 decay multipliers applied | Five raw cumulative scores, one per role | [data model §7, §8] |
| 2 — Score floor check | If max score < 25, assign UNKNOWN and halt | Max cumulative score below minimum threshold | UNKNOWN tier, no classified role; or pass five scores to Step 3 | [data model §12 `minimum_cumulative_score: 25`] |
| 3 — Role differential check | If top role does not lead second role by ≥ 10 points, cap top score at 49 | Top score minus second score < 10 | Score capped at 49 (LOW tier) with `differential_insufficient: True` flag set in AEP profile attribute; downstream systems must distinguish this state from a genuinely weak-signal LOW (see Document 5); or top score passes unchanged | [data model §12 `minimum_role_differential: 10`] |
| 4 — Firmographic bonus | If firmographic role matches classified role, add +30 to top score; flag mismatch if they diverge | Demandbase title match available and `firmographic_role == classified_role` | Adjusted top score; or no change if no match or no data. Behavioral floor guard rail PENDING. | [data model §12 `firmographic_confirmation_bonus: +30`] |
| 5 — Score clamp | Clamp adjusted score to [0, 100] | Always applied | Clamped score in [0, 100] | [data model §12 `score_clamp_floor: 0`, `score_clamp_ceiling: 100`] |
| 6 — Signal diversity check | If distinct signal types < 2 and score ≥ 80, cap score at 79 | Score ≥ 80 but only one distinct signal type in qualifying observations | Score capped at 79 (MEDIUM); or score passes unchanged | [data model §12 `minimum_signal_diversity_for_high: 2`] |
| 7 — Behavioral-only ceiling | If Tier 1 and Tier 2 data both absent, maximum tier is MEDIUM regardless of score | Tier 3 behavioral inference only; no ML classifier or zero-party data | MEDIUM tier for scores ≥ 80 with Tier 3 only; otherwise standard tier assignment | [data model §12 `behavioral_only_confidence_ceiling: MEDIUM`] |
 
---
 
## Section 6 — Conditional Weight Modifiers
 
### 6.1 Overview
 
The base weights in `CROSS_ROLE_WEIGHTS` [data model §7] represent the single-signal case: the role-classification weight that applies when a signal is observed independently, without contextual information about what else the visitor did in the same session. For most signals, the single-signal weight is sufficient — a demo request is a Champion behavior regardless of what precedes it in the session. But a subset of signals are role-ambiguous in isolation: their behavioral meaning depends on the context in which they appear.
 
Conditional weight modifiers resolve this ambiguity at scoring time. When specific co-occurrence patterns emerge within a session, the base weights for the triggering signal are adjusted before the Section 5 scoring sequence executes. Modifiers are pre-scoring weight transformations: they change the per-role weights that enter the decay multiplication and cumulative score aggregation steps. They do not adjust cumulative scores after the fact.
 
All modifier entries in this section are defined in `kalder_data_model.py §7a CONDITIONAL_WEIGHT_MODIFIERS` [data model §7a], which is the sole authoritative source for modifier trigger conditions, co-occurrence scope, and delta values. This document is the human-readable companion to that structure; it provides the behavioral rationale and practitioner guidance that the data model structure encodes as keys and values.
 
The core design principle: modifiers exist because session context resolves role ambiguity that single-signal weights and title inference cannot. A contact with a security-adjacent job title — Head of IT Security, CISO, Senior Security Architect — could be a Ratifier conducting compliance validation or an InfoSec Influencer conducting architecture evaluation. Title data alone cannot distinguish these patterns; both roles hold similar titles. Behavioral co-occurrence within a session provides the contextual signal that title inference lacks. A visitor who views the Security and Trust Center and immediately navigates to the integration catalog is exhibiting an architecture-evaluation pattern. A visitor who views the Security and Trust Center alone, without adjacent technical exploration, is exhibiting a compliance-validation pattern. The modifier captures this distinction.
 
---
 
### 6.2 How Modifiers Are Applied
 
The following sequence describes modifier application at scoring time. This step occurs after Section 4 pre-scoring filters have run and before the Section 3 decay multiplication and Section 5 scoring sequence execute.
 
**Step 1 — Evaluate trigger conditions for the current session.** At the start of a scoring run for a `(contact_id, solution_category)` key, the scoring engine checks each entry in `CONDITIONAL_WEIGHT_MODIFIERS` to determine whether its trigger condition is met. The trigger condition has two components: (a) the `trigger_signal` was observed in the current session as a qualifying observation, and (b) at least one `co_occurrence_signal` was also observed in the current session as a qualifying observation. Because `requires_any: True` for all current modifier entries, either co-occurrence signal is sufficient — both are not required.
 
**Step 2 — Apply delta values to the trigger signal's base weights.** If the trigger condition is met, the `modifications` delta values are added to the base weights for the trigger signal in `CROSS_ROLE_WEIGHTS`. The result is the modifier-adjusted weight, which replaces the base weight for this signal in this scoring run. Modifier adjustments are deltas, not replacement values — a delta of −12 applied to a base weight of 22 produces a modifier-adjusted weight of 10. A delta of +10 applied to a base weight of 5 produces a modifier-adjusted weight of 15.
 
**Step 3 — Score all other signals against unmodified base weights.** The modifier adjusts only the trigger signal's weights. Every other signal in the session — including the co-occurrence signals themselves — scores against its standard base weights from `CROSS_ROLE_WEIGHTS`. Co-occurrence signals are not modified; they serve as trigger conditions only.
 
**Step 4 — Apply Section 3 decay rules to modifier-adjusted weights.** Decay multiplication is applied to the modifier-adjusted weights using the standard rules from Section 3. A trigger signal observed in the current session receives the 1.5× `current_session` multiplier applied to its modifier-adjusted weight, not its base weight.
 
**Critical constraint — same-session scope.** The `co_occurrence_window: "same_session"` field is a hard constraint, not a preference. Co-occurrence signals observed in prior sessions — even within the `last_90_days` decay window — do not activate a modifier. The session-scope requirement is intentional: it captures visitors who are conducting a specific evaluation activity right now, not visitors whose signal history happens to contain both content types across separate visits. A visitor who viewed the Security and Trust Center today and the integration catalog three weeks ago is exhibiting two separate behaviors with separate visit intents. A visitor who views both in the same session is exhibiting a single composite behavior with a specific, identifiable intent. Only the latter activates the modifier.
 
---
 
### 6.3 Modifier Reference Table
 
The following table presents both current modifier entries. All delta values are testable hypotheses [data model §7a].
 
| Modifier Key | Trigger Signal | Co-Occurrence Signals | Requires Any | Ratifier Delta | Influencer Delta | Validation Status |
|---|---|---|---|---|---|---|
| `infosec_influencer_disambiguation` | `security_trust_center_visit` | `integration_catalog_view` OR `technical_docs_deep` | True | −12 (22 → 10) | +10 (5 → 15) | Hypothesis — v0.6.4 |
| `infosec_influencer_disambiguation_whitepaper` | `security_whitepaper_download` | `integration_catalog_view` OR `technical_docs_deep` | True | −10 (20 → 10) | +10 (3 → 13) | Hypothesis — v0.6.4 |
 
---
 
### 6.4 `infosec_influencer_disambiguation` — `security_trust_center_visit`
 
**Trigger signal:** `security_trust_center_visit`
 
**Base weights (single-signal case):** `ratifier` 22, `influencer` 5, `champion` 5, `economic_buyer` 5, `user` 0.
 
**Co-occurrence signals (either qualifies):** `integration_catalog_view` OR `technical_docs_deep`.
 
**Modifier effect:** `ratifier` weight 22 → 10 (delta −12); `influencer` weight 5 → 15 (delta +10). `champion`, `economic_buyer`, and `user` weights are unchanged.
 
**Behavioral rationale:** The Security and Trust Center is the destination where two fundamentally different visitors converge. The first is a Ratifier arriving late in the buying process with a specific compliance mandate: their organization requires that security certifications, data residency commitments, and access controls be verified before a vendor can advance to procurement. This Ratifier arrives with a targeted checklist — they consume security content purposefully and leave. They do not, in the same session, evaluate integration architecture or read 10 minutes of technical documentation. The buying job is validation, not exploration; the session pattern is narrow and terminal.
 
The second visitor is an InfoSec Influencer who is conducting architecture evaluation. They are assessing whether the vendor's security model is compatible with the systems their team operates and the compliance framework their organization follows. This visitor does not stop at the Security and Trust Center — they move from security posture to integration catalog to understand how the platform connects to adjacent systems, or to technical documentation to understand the implementation depth of the security controls. The co-occurrence of security content with architecture evaluation content is the behavioral signature of an Influencer conducting due diligence, not a Ratifier conducting compliance review.
 
The modifier reduces the Ratifier interpretation of `security_trust_center_visit` when this co-occurrence pattern is present, and increases the Influencer interpretation. The result is that a single-session security + architecture evaluation pattern classifies the contact closer to the Influencer profile than the baseline single-signal weight would produce.
 
**Weight profile — base vs. modifier-adjusted:**
 
| Role | Base Weight | Modifier-Adjusted Weight | Change |
|---|---|---|---|
| `champion` | 5 | 5 | — |
| `economic_buyer` | 5 | 5 | — |
| `influencer` | 5 | **15** | +10 |
| `user` | 0 | 0 | — |
| `ratifier` | 22 | **10** | −12 |
 
---
 
### 6.5 `infosec_influencer_disambiguation_whitepaper` — `security_whitepaper_download`
 
**Trigger signal:** `security_whitepaper_download`
 
**Base weights (single-signal case):** `ratifier` 20, `influencer` 3, `champion` 5, `economic_buyer` 3, `user` 0.
 
**Co-occurrence signals (either qualifies):** `integration_catalog_view` OR `technical_docs_deep`.
 
**Modifier effect:** `ratifier` weight 20 → 10 (delta −10); `influencer` weight 3 → 13 (delta +10). `champion`, `economic_buyer`, and `user` weights are unchanged.
 
**Behavioral rationale:** A security whitepaper download in isolation is a procurement and compliance behavior. A Ratifier who needs to build a documentation package for their organization's vendor review process will download security whitepapers, data processing agreements, and compliance certifications as discrete assets — each downloaded independently as the Ratifier assembles the sign-off file. The download is the terminal act; the Ratifier does not proceed from the whitepaper to the integration catalog or deep technical documentation in the same session. Their task is documentation collection, not architecture evaluation.
 
The same download co-occurring with `integration_catalog_view` or `technical_docs_deep` signals an InfoSec Influencer who is building a technical due diligence package. This visitor is not just collecting compliance documentation — they are pairing it with architecture evaluation, cross-referencing the security whitepaper claims against the integration model and technical implementation detail. The whitepaper is one node in a larger evaluation session, not a terminal collection act.
 
The modifier reduces the Ratifier interpretation when the whitepaper download appears in an architecture-evaluation session context, and increases the Influencer interpretation.
 
**Weight profile — base vs. modifier-adjusted:**
 
| Role | Base Weight | Modifier-Adjusted Weight | Change |
|---|---|---|---|
| `champion` | 5 | 5 | — |
| `economic_buyer` | 3 | 3 | — |
| `influencer` | 3 | **13** | +10 |
| `user` | 0 | 0 | — |
| `ratifier` | 20 | **10** | −10 |
 
**Relationship to `infosec_influencer_disambiguation`:** The two modifiers fire independently. A session containing `security_trust_center_visit` AND `security_whitepaper_download` AND `integration_catalog_view` activates both modifiers simultaneously: `infosec_influencer_disambiguation` adjusts the weights for `security_trust_center_visit`, and `infosec_influencer_disambiguation_whitepaper` adjusts the weights for `security_whitepaper_download`. Each modifier operates on its own trigger signal; neither modifier affects the other's trigger signal or co-occurrence signals. The cumulative effect of both modifiers firing in one session will produce a meaningfully higher `influencer` score and lower `ratifier` score than either modifier alone, which is the correct behavioral interpretation for a session with that signal profile.
 
---
 
### 6.6 Governance and Future Modifier Additions
 
The `CONDITIONAL_WEIGHT_MODIFIERS` structure [data model §7a] is extensible. New modifier entries may be added as the signal inventory grows and new disambiguation patterns are identified. The requirements for adding a new modifier entry are:
 
(a) **Behavioral hypothesis with rationale.** A written statement of the two behavioral patterns being distinguished, why they produce co-occurrence signatures, and why those signatures are role-discriminating rather than role-coincidental.
 
(b) **Trigger signal and co-occurrence signals with evidence.** The proposed trigger signal and co-occurrence signals must have an observed or hypothesized co-occurrence rate that justifies the disambiguation. Signals that rarely co-occur in the same session will produce a modifier that never activates.
 
(c) **Proposed delta values with validation plan.** Delta values are hypotheses. The proposed deltas must be accompanied by a plan to validate them against metric T2-06 (Role Classification Accuracy) [data model §11], specifically testing whether the modifier improves classification accuracy for the affected roles compared to baseline single-signal weights.
 
(d) **Data model entry in `CONDITIONAL_WEIGHT_MODIFIERS` before the corpus document cites it.** The data model is the canonical source; the corpus document is the human-readable companion. A modifier that exists only in the corpus document has no authoritative specification. The `kalder_data_model.py §7a` entry must exist before any corpus document can cite the modifier.
 
New modifier additions do not require a full Document 2 revision cycle. They require a targeted Section 6 amendment (adding subsections 6.N for each new entry following the pattern of 6.4 and 6.5), an updated Section 6.3 reference table row, and a data model version bump per the semver policy in `MODEL_VERSION` [data model §M].
 
---
 
### 6.7 Pending Item Resolution Notes
 
Two pending items from earlier sections of this document are formally closed by the data model v0.2.0 `CONDITIONAL_WEIGHT_MODIFIERS` structure and CR-05 decay specification.
 
**Resolution 1 — Section 2.3 pending citations (three flags).** The three `[PENDING: CONDITIONAL_WEIGHT_MODIFIERS structure must be added to kalder_data_model.py §7 before this citation can be resolved]` flags appearing on the `integration_catalog_view`, `security_trust_center_visit`, and `security_whitepaper_download` signal definitions in Section 2.3 are resolved by the `CONDITIONAL_WEIGHT_MODIFIERS` structure now formalized at [data model §7a CONDITIONAL_WEIGHT_MODIFIERS]. Those signal definitions should be read with citations updated to `[data model §7a CONDITIONAL_WEIGHT_MODIFIERS]`, with the following entry key distinctions: `integration_catalog_view` and `security_trust_center_visit` both cite `infosec_influencer_disambiguation` (trigger signal: `security_trust_center_visit`); `security_whitepaper_download` cites `infosec_influencer_disambiguation_whitepaper` (trigger signal: `security_whitepaper_download`). The two signals do not resolve to the same modifier entry. The `[PENDING]` flags will be removed in the Section 2 final publication pass and the citation format corrected to the appropriate entry key throughout.
 
**Resolution 2 — Section 3.5 anonymous visitor decay (one flag).** The `[PENDING: identity resolution decay behavior must be confirmed in Segment event pipeline implementation — Document 8]` flag in Section 3.5 is resolved by data model v0.2.0 CR-05, which specifies the following rules [data model §8 CR-05]: (a) anonymous visitors with 181–365 day signal history receive an `anonymous_visitor_long_decay` multiplier of 0.2×, preserving weak signal continuity for return visitors not yet identified; (b) at the moment of identity resolution — whether via progressive disclosure or CRM match — historical signals in the 181–365 day window are rescored using identified-visitor rules, which apply `over_180_days: 0.0×`; (c) the `anonymous_visitor_long_decay` multiplier does not persist after identification, preventing pre-identification weak signals from inflating the identified-visitor role score. The implementation requirement — that the Segment event pipeline preserve original observation timestamps when stitching pre-resolution events to the resolved `contact_id` — remains a Document 8 operational specification item but is no longer a blocking data model gap. The `[PENDING]` flag in Section 3.5 will be removed in the final publication pass.
 
---
 
## Section 7 — Buying Job Confidence Model
 
### 7.1 Overview
 
Role classification — established through Sections 2 through 6 — answers who the visitor is in the buying group: Champion, Economic Buyer, Influencer, User, or Ratifier. It does not answer what they are trying to accomplish right now. Two Champions at the same buying stage can be engaged in entirely different tasks: one is in problem_identification mode, orienting to the solution space and building the case for why this problem matters; the other is in supplier_selection mode, comparing vendors and assembling the final business case. Serving both the same Champion content because they share a role and stage classification leaves a material personalization opportunity on the table.
 
The Buying Job Confidence model introduces a third dimension to content selection: the buying job — the specific task the visitor is executing in the buying journey. When this dimension is available, the system can personalize on three axes simultaneously: role × stage × buying job. When it is unavailable, the system falls back to two-axis personalization (role × stage) and uses `PROBABLE_JOB_PRIORS` to select the most likely content variant for the role and stage combination [data model §4].
 
A critical structural distinction must be stated clearly and held throughout this section: **the Buying Job Confidence model is a content selection construct, not a role classification construct.** It does not modify a visitor's role confidence score. It does not participate in the Section 5 scoring sequence. It does not interact with the decay model in Section 3 or the pre-scoring filters in Section 4. It operates after role confidence is established, and it governs which content variant is selected for delivery from the available content variants for the visitor's role and stage. Practitioners who are tempted to treat buying job as a sixth signal in the scoring engine should note explicitly that it is not — it is a downstream content selection parameter.
 
---
 
### 7.2 The Three States
 
#### KNOWN
 
**Source:** Zero-party self-identification via progressive disclosure prompt. The visitor explicitly answered a buying job question surfaced through a progressive disclosure interaction on kalder.com.
 
**Activation condition:** Role confidence must be MEDIUM or HIGH. KNOWN buying job state is not activated for contacts at LOW or UNKNOWN role confidence — a visitor whose role classification is uncertain is not a candidate for progressive disclosure that assumes a buying group context.
 
**Personalization behavior:** Three-axis personalization — role × stage × `buying_job_confirmed`. The system selects content variants matched to the visitor's confirmed role, pipeline stage, and explicitly declared buying job.
 
**AEP attribute:** `buying_job_confirmed`.
 
**Persistence and decay:** Session persistence is True — KNOWN state persists across sessions. Decay window: 90 days from the date of self-identification. After 90 days without a re-confirmation, the KNOWN state decays to UNKNOWN.
 
**Design rationale:** KNOWN requires only MEDIUM role confidence (not HIGH) because zero-party self-identification is a Tier 2 data source — it provides a direct signal from the visitor about their context that compensates for the uncertainty in the behavioral role inference. A visitor who says "I'm evaluating this for my IT team and we're currently building requirements" has provided higher-quality buying job information than any behavioral pattern could infer, regardless of whether their role confidence is MEDIUM or HIGH. The 90-day persistence reflects that a declared buying job context — "we are in requirements building" — remains stable for the duration of an evaluation cycle, which typically spans several months. The decay window aligns with the `last_90_days` signal decay window so that the buying job context ages out at roughly the same time as the behavioral signals that supported the role classification when the declaration was made.
 
---
 
#### INFERRED
 
**Source:** Behavioral pattern matching against `BUYING_JOB_INFERENCE_SIGNALS` [data model §4]. The system identifies the buying job from the visitor's content consumption pattern across the current session and the last 30 days.
 
**Activation condition:** Role confidence must be HIGH. INFERRED buying job state does not activate at MEDIUM role confidence.
 
**Personalization behavior:** Three-axis personalization with probabilistic job selection — role × stage × `buying_job_inferred`. The system selects content variants matched to the inferred buying job, but the inference carries lower certainty than a KNOWN state.
 
**AEP attribute:** `buying_job_inferred`.
 
**Persistence and decay:** Session persistence is False — INFERRED state is re-inferred each session from fresh behavioral evidence. Decay window: 30 days from the most recent inference. After 30 days without reinforcing signals, the INFERRED state decays to UNKNOWN.
 
**Design rationale:** INFERRED requires HIGH role confidence (not MEDIUM) because it compounds two layers of probabilistic inference: the behavioral role inference and the behavioral buying job inference. At MEDIUM role confidence, the role itself is uncertain; adding an inferred buying job on top of uncertain role inference produces a content selection that is too speculative to serve confidently. HIGH role confidence means the behavioral evidence for the role is strong enough to carry a second inference layer. The 30-day decay and session-level re-inference reflect that buying jobs shift within an evaluation cycle — a contact who was in requirements_building last month may have moved to supplier_selection this month. INFERRED state is designed to be responsive to the current session's evidence, not to persist a stale inference across a months-long evaluation cycle.
 
---
 
#### UNKNOWN
 
**Source:** None — this is the default state. The visitor has not responded to a progressive disclosure prompt and has not generated sufficient behavioral signal to reach the INFERRED threshold.
 
**Activation condition:** Default. Applies whenever role confidence is below MEDIUM, or when role confidence is MEDIUM or higher but neither KNOWN nor INFERRED conditions are met.
 
**Personalization behavior:** Two-axis personalization with prior — role × stage, with `PROBABLE_JOB_PRIORS` used to select the most probable content variant for the role × buying group stage combination [data model §4].
 
**AEP attribute:** None. UNKNOWN state has no stored attribute; its presence is inferred from the absence of `buying_job_confirmed` or `buying_job_inferred`.
 
**Persistence and decay:** Not applicable — UNKNOWN is the default state, not a stored attribute that decays.
 
**Design rationale:** UNKNOWN is not a failure state. Most visitors will be in UNKNOWN state for most of their evaluation journey — progressive disclosure is a targeted intervention for higher-confidence contacts, not a universal collection mechanism. The `PROBABLE_JOB_PRIORS` fallback ensures that UNKNOWN state still produces a reasonable content selection based on the best available information: the visitor's role and pipeline stage. A visitor in UNKNOWN state receives role-appropriate, stage-appropriate content; they simply do not receive the additional specificity that a confirmed or inferred buying job would provide.
 
---
 
### 7.3 Buying Job Inference Signals
 
The `BUYING_JOB_INFERENCE_SIGNALS` structure [data model §4] maps content types to buying jobs based on the behavioral hypothesis that specific content consumption patterns indicate specific buying tasks. The mapping uses three indicator tiers:
 
**Strong indicators** are content types whose consumption is a reliable signal of the associated buying job. Two or more strong indicator content types — observed in the current session or in the last 30 days — are required for the INFERRED state to activate.
 
**Weak indicators** contribute contextual evidence but do not count toward the two-signal minimum threshold. A visitor who consumed only weak indicator content types does not qualify for INFERRED state regardless of volume.
 
**Counter-indicators** are content types whose consumption suggests the visitor may be navigating across buying job boundaries. Counter-indicators do not block inference — they do not prevent INFERRED state from activating if the threshold is met — but they reduce confidence in the inferred job and may warrant surfacing content from an adjacent buying job rather than committing fully to the inferred one.
 
| Buying Job | Strong Indicators | Weak Indicators | Counter-Indicators |
|---|---|---|---|
| `problem_identification` | `thought_leadership`, `analyst_report`, `diagnostic_assessment`, `benchmark_report`, `category_explainer` | `blog_article`, `industry_page` | `roi_calculator`, `pricing_page`, `legal_procurement` |
| `solution_exploration` | `product_solution_overview`, `use_case_page`, `product_tour` | `webinar_event_registration`, `video_content` | `legal_procurement`, `security_compliance` |
| `requirements_building` | `technical_documentation`, `integration_catalog`, `rfp_template`, `use_case_page` | `product_tour`, `webinar_event_registration` | `blog_article`, `thought_leadership` |
| `supplier_selection` | `roi_calculator`, `pricing_page`, `executive_brief`, `competitive_comparison` | `case_study`, `analyst_report` | `howto_training`, `community_forum` |
 
**Minimum threshold:** INFERRED state requires observation of 2 or more distinct strong indicator content types — either within the current session or within the last 30 days. One strong indicator observed twice in the same session counts as one distinct content type; the threshold requires breadth, not repetition. Weak indicators do not count toward the threshold. Counter-indicators do not block activation but should be noted in the AEP profile as a signal-quality flag for downstream review.
 
**CR-07 cascade note:** In data model v0.2.0, the `category_explainer` content type was moved from the `solution_exploration` strong indicators list to the `problem_identification` strong indicators list [data model §9, §7a CR-07]. The rationale: `category_explainer` content orients early-stage buyers to a solution space and the problems it addresses — it serves visitors who are identifying and framing a problem, not visitors who are already engaged in solution vendor evaluation. A visitor consuming category explainer content is asking "does this category of solution address my problem?" rather than "which vendor in this category best fits my requirements?" That is a `problem_identification` buying job, not `solution_exploration`. The cascade was validated by `validate_signal_references()` at the time of the data model change.
 
---
 
### 7.4 `PROBABLE_JOB_PRIORS`: The UNKNOWN Fallback
 
When Buying Job Confidence is UNKNOWN, the scoring engine cannot match content to a confirmed or inferred buying job. Rather than serving undifferentiated role-only content, the system uses `PROBABLE_JOB_PRIORS` [data model §4] as a content selection prior — a lookup table that returns the most probable buying job for a given role × buying group stage combination. This prior drives content variant selection for UNKNOWN-state contacts without requiring a classification claim about the visitor's actual buying job.
 
The following table presents the `PROBABLE_JOB_PRIORS` lookup values in v0.2.0 nested dict format:
 
| Role | Targeted | Engaged | Prioritized | Qualified |
|---|---|---|---|---|
| `champion` | `problem_identification` | `solution_exploration` | `requirements_building` | `supplier_selection` |
| `economic_buyer` | `problem_identification` | `solution_exploration` | `requirements_building` | `supplier_selection` |
| `influencer` | `solution_exploration` | `solution_exploration` | `requirements_building` | `requirements_building` |
| `user` | `solution_exploration` | `solution_exploration` | `requirements_building` | `requirements_building` |
| `ratifier` | None | None | `requirements_building` | `supplier_selection` |
 
Three design notes for practitioners implementing content selection logic against this table:
 
**Design note 1 — Priors are content selection inputs, not classification claims.** A `PROBABLE_JOB_PRIORS` lookup returns the most likely content variant given incomplete information about the visitor's actual buying job. The system is not asserting that a Champion at the Engaged stage is in `solution_exploration` — it is selecting the content variant most likely to be relevant given everything the system knows. When KNOWN or INFERRED buying job data is available, those override the prior. The prior is the fallback, not the default preference.
 
**Design note 2 — None values for `ratifier` at Targeted and Engaged stages are intentional.** Ratifiers do not participate in early-stage buying group activity. At the Targeted and Engaged stages, the buying group has not yet reached the governance and procurement phase where Ratifiers typically engage. A `PROBABLE_JOB_PRIORS` lookup returning None for `ratifier` at these stages must be handled explicitly by the calling system — it is not an error state or a data gap. The correct behavior is to render role-stage fallback content (see Section 8, Fallback Cascade) rather than attempting to infer a buying job for a role that is not yet active in the buying process at this stage.
 
**Design note 3 — Influencer and User priors cap at `requirements_building` through the Qualified stage.** Unlike Champion and Economic Buyer — which advance to `supplier_selection` at the Qualified stage — Influencer and User priors remain at `requirements_building` even when the buying group has advanced to final vendor selection. This reflects a buying group dynamics hypothesis: Influencers and Users are still validating implementation requirements and workflow fit at the stage where Champions and Economic Buyers are making the final vendor decision. Their buying job does not advance to supplier_selection because their task — confirming that the selected vendor can meet their specific technical and operational requirements — is a requirements-validation job even late in the cycle. This is a hypothesis; it should be validated against observed content consumption patterns as data accumulates.
 
---
 
### 7.5 Buying Job Confidence and the Fallback Cascade Interaction
 
The Buying Job Confidence model interacts with the fallback cascade (Section 8) at a specific boundary that must be understood before implementing content selection logic. Three-axis personalization — role × stage × buying job — is only available at Fallback Levels 1 and 2, which correspond to HIGH and MEDIUM role confidence respectively. At Levels 3 through 5, role confidence is insufficient to support role-specific personalization; buying job confidence is therefore irrelevant at those levels regardless of its state. A contact classified UNKNOWN or LOW for role confidence receives level-appropriate fallback content; the buying job dimension is not evaluated.
 
Additionally, at Level 2 (MEDIUM role confidence), three-axis personalization activates only when Buying Job Confidence is KNOWN, not INFERRED. The rationale: INFERRED buying job at MEDIUM role confidence compounds two simultaneous layers of probabilistic inference — the behavioral role inference (MEDIUM means the behavioral evidence is real but not strong enough for HIGH) plus a behavioral buying job inference. The combined uncertainty of two inference layers produces a content selection that is too speculative to deliver confidently. KNOWN buying job at MEDIUM role confidence is permissible because zero-party self-identification (the source of KNOWN state) provides a direct, explicit signal that offsets the uncertainty in the behavioral role inference.
 
The complete interaction matrix:
 
| Role Confidence | Buying Job Confidence | Personalization Axes | Notes |
|---|---|---|---|
| HIGH | KNOWN | Three-axis: role × stage × `buying_job_confirmed` | Highest specificity — explicit job + strong role signal |
| HIGH | INFERRED | Three-axis: role × stage × `buying_job_inferred` | Probabilistic job selection — strong role signal supports second inference layer |
| HIGH | UNKNOWN | Two-axis + prior: role × stage (+ `PROBABLE_JOB_PRIORS` selection) | Prior used for content variant selection within role × stage |
| MEDIUM | KNOWN | Three-axis: role × stage × `buying_job_confirmed` | KNOWN only at MEDIUM — zero-party declaration offsets MEDIUM role uncertainty |
| MEDIUM | INFERRED | Two-axis + prior: role × stage (+ `PROBABLE_JOB_PRIORS` selection) | INFERRED excluded at MEDIUM — double-inference too speculative |
| MEDIUM | UNKNOWN | Two-axis + prior: role × stage (+ `PROBABLE_JOB_PRIORS` selection) | Standard MEDIUM treatment |
| LOW / UNKNOWN | Any | Fallback Levels 3–5 (see Section 8) | Role confidence insufficient for role-specific personalization; buying job irrelevant |
 
---
 
### 7.6 Scope Boundary Note
 
Section 7 specifies the three Buying Job Confidence states, their activation conditions, their content selection behavior, their inference signal thresholds, the PROBABLE_JOB_PRIORS fallback, and their interaction with the fallback cascade. The following adjacent topics are explicitly out of scope here and owned by other documents:
 
The **progressive disclosure form design and copy** — the specific prompt language, placement logic, timing rules, and UI treatment used to surface buying job questions to qualifying visitors — is specified in Document 6 (Web Personalization Experience). Section 7 specifies that zero-party self-identification produces the KNOWN state; it does not specify how that self-identification is elicited.
 
The **AEP attribute schema** for storing `buying_job_confirmed`, `buying_job_inferred`, and the associated decay timestamps is specified in Document 8 (Operational Runbook). Section 7 names these attributes and their decay windows; it does not specify their data types, update rules, or schema implementation.
 
The **measurement methodology for validating buying job inference accuracy** — including how to define a ground truth for `buying_job_inferred`, how to set up a holdback experiment, and what accuracy threshold would warrant weight revision — is specified in Document 7 (Measurement and Experimentation Framework). Section 7 notes that INFERRED values are hypotheses; it does not specify the validation protocol.
 
---
 
## Section 8 — Fallback Cascade
 
### 8.1 Overview
 
Every visitor to kalder.com is at some classification state at every moment — from a contact with HIGH role confidence and a confirmed buying job to an anonymous visitor with no TAL match and no behavioral history. The fallback cascade ensures that no visitor receives an undefined experience: there is always a specified behavior for every classification state, from Level 1 (maximum personalization) through Level 5 (default brand experience).
 
The cascade is not a degradation path. It is a precision spectrum. Level 1 delivers the most specific personalization the system can produce; Level 5 delivers the standard brand experience. Neither level is better or worse in an absolute sense — each is the correct experience for the visitor's classification state. Level 5 is not a failure; it is the program correctly identifying that a visitor does not belong to the personalization-eligible population.
 
The cascade solves a practical architecture problem: the scoring pipeline produces a confidence tier, but confidence tier alone does not fully specify what experience to serve. A LOW confidence visitor and an UNKNOWN confidence visitor are in different states with different implications for content selection. A LOW confidence visitor with identified solution interest belongs in a different experience than a LOW confidence visitor with no solution signal. The cascade encodes these distinctions as explicit trigger conditions with specified experience behaviors.
 
Section 8 specifies the trigger conditions and experience character at each cascade level. The full experience behavior at each level — which page modules render, which content variants are selected, how CTAs are constructed, and which segments activate — is specified in Document 5 (Personalization Decisioning Rules). Section 8 and Document 5 are complementary: this section defines when each level applies; Document 5 defines what happens when it does.
 
---
 
### 8.2 Cascade Level Reference Table
 
The following table presents all five levels of the fallback cascade. Trigger conditions are authoritative from `kalder_data_model.py §4 FALLBACK_CASCADE` [data model §4]. CTA tone values are from `kalder_data_model.py §3 CONFIDENCE_TIERS` [data model §3].
 
| Level | Name | Trigger Condition | Experience Character | CTA Tone | Buying Job Axis | Document 5 Reference |
|---|---|---|---|---|---|---|
| 1 | Role-specific experience | Role confidence = HIGH (score ≥ 80 with Tier 1 or Tier 2 confirmation) | Content, CTAs, and framing fully tailored to classified role for the relevant solution category | Direct, assumptive | Three-axis activates when buying job confidence is KNOWN or INFERRED | Full specification in Document 5 (Personalization Decisioning Rules) |
| 2 | Role-influenced experience | Role confidence = MEDIUM (score 50–79) | Content leans toward classified role; retains safe fallback elements; no high-specificity role CTAs | Suggestive, educational | Three-axis activates only when buying job confidence is KNOWN; INFERRED excluded at MEDIUM | Full specification in Document 5 (Personalization Decisioning Rules) |
| 3 | Solution-interest experience | Role confidence = LOW or UNKNOWN **AND** identified solution interest | Content organized by solution category; no role-specific framing; no role assumptions | Broad, awareness-oriented | Do not attempt | Full specification in Document 5 (Personalization Decisioning Rules) |
| 4 | Account-level experience | TAL account identified; no solution interest or role signal | Personalization by industry vertical, company size, or account firmographic attributes only; no solution or role assumptions | Exploratory | Do not attempt | Full specification in Document 5 (Personalization Decisioning Rules) |
| 5 | Default brand experience | Non-TAL visitor or unidentified visitor (no Demandbase reverse-IP match) | Standard kalder.com experience; no personalization | Exploratory | Do not attempt | Full specification in Document 5 (Personalization Decisioning Rules) |
 
---
 
### 8.3 Level 1: Role-Specific Experience
 
**Trigger:** Role confidence = HIGH — score ≥ 80 after the full Section 5 scoring sequence with Tier 1 ML classifier confirmation or Tier 2 zero-party self-identification with behavioral confirmation. A behavioral-only score of 80 or above does not reach Level 1; it receives a MEDIUM tier assignment under Section 5 Step 7 and routes to Level 2.
 
**Experience character:** Content, CTAs, and framing are fully tailored to the classified role for the relevant solution category. The system treats the HIGH classification as reliable and selects content variants that address the visitor's role-specific evaluation criteria directly. There is no hedging in Level 1 content — the experience assumes the classification is correct and optimizes for it.
 
**CTA tone:** Direct, assumptive. Level 1 CTAs reflect the visitor's implied buying stage and role job-to-be-done. A Champion at the supplier_selection buying job receives a CTA that accelerates the internal case-building process; an Economic Buyer at the same stage receives a CTA that supports financial validation. The directness of Level 1 CTAs is what distinguishes it from Level 2 — Level 1 does not retain fallback elements.
 
**Buying job axis:** Level 1 is the only cascade level where INFERRED buying job confidence activates three-axis personalization. When buying job confidence is KNOWN, the system personalizes on role × stage × `buying_job_confirmed`. When buying job confidence is INFERRED, the system personalizes on role × stage × `buying_job_inferred`. When buying job confidence is UNKNOWN, the system uses `PROBABLE_JOB_PRIORS` to select the most likely content variant within the role × stage frame. The full interaction matrix is specified in Section 7.5.
 
**Confidence source:** Tier 1 ML classifier prediction or Tier 2 zero-party identification with behavioral confirmation. A contact cannot reach Level 1 through Tier 3 behavioral inference alone.
 
---
 
### 8.4 Level 2: Role-Influenced Experience
 
**Trigger:** Role confidence = MEDIUM — score 50–79, or a behavioral score of 80 or above that has been assigned MEDIUM tier under the Section 5 Step 7 behavioral-only confidence ceiling.
 
**Experience character:** Content leans toward the classified role but retains safe fallback elements. Role-specific proof points, use cases, and content assets are surfaced — the system knows enough about the visitor's likely role to make informed content selections. However, CTAs and framing avoid high-specificity role assumptions that would feel mismatched if the classification is slightly off. A Level 2 experience for a probable Champion would include Champion-relevant case studies and use cases, but the CTA would invite further engagement rather than assuming the visitor is ready to advance to an explicit buying-group motion.
 
**CTA tone:** Suggestive, educational. Level 2 CTAs guide the visitor toward deeper engagement with role-relevant content rather than directly advancing a transaction.
 
**Buying job axis:** Three-axis personalization activates only when buying job confidence is KNOWN — that is, when the visitor has explicitly declared their buying job context via progressive disclosure. INFERRED buying job is excluded at MEDIUM role confidence. The rationale, established in Section 7.2 and Section 7.5, is that INFERRED buying job at MEDIUM role confidence compounds two simultaneous layers of probabilistic inference — uncertain role plus inferred buying job — producing a content selection that is too speculative to serve reliably. A visitor at Level 2 without KNOWN buying job confidence receives two-axis role × stage personalization with `PROBABLE_JOB_PRIORS` selecting the most likely content variant.
 
**Practical note:** Level 2 is the most common live experience tier for early-stage visitors who have accumulated behavioral signals but have not yet been confirmed by the ML classifier or through progressive disclosure. Most visitors in the v1 launch period will operate at Level 2 for the majority of their evaluation cycle — the ML classifier coverage gap (Section 5.3) and the progressive disclosure trigger conditions (Section 7.2) both mean that HIGH confidence will be less common than MEDIUM in early program operation.
 
---
 
### 8.5 Level 3: Solution-Interest Experience
 
**Trigger:** Role confidence = LOW or UNKNOWN **AND** identified solution interest. The AND condition is essential. LOW or UNKNOWN confidence alone does not route a visitor to Level 3 — a visitor at LOW confidence without identified solution interest routes to Level 4. Identified solution interest means the visitor has engaged with content in a specific solution category URL space in a way that associates them with that solution area, even without role classification. This association is established at the solution category level, not the signal level — it does not require a qualifying signal observation.
 
**Experience character:** Content is organized by solution category without role-specific framing. The system knows the visitor is interested in a solution area but does not know which role they occupy in the buying group. Level 3 content surfaces the solution category's value proposition, customer outcomes, and capability overview for a general buying-group audience — it does not attempt to tailor messaging for a specific role.
 
**CTA tone:** Broad, awareness-oriented. Level 3 CTAs invite the visitor to learn more about the solution area and to self-identify or engage more deeply, which would move them toward Level 2 or Level 1 on subsequent scoring runs.
 
**Buying job axis:** Do not attempt. Role confidence is insufficient to support buying job inference — layering job inference on top of an uncertain role classification would produce content selection with compounded speculative error.
 
**Practical note:** Level 3 is the primary experience tier for anonymous visitors who have been reverse-IP identified to a TAL account and have browsed solution content, but have not accumulated sufficient behavioral signal for role classification. These visitors are the primary target of progressive disclosure interventions — surfacing a role-confirmation prompt to a Level 3 visitor with demonstrated solution interest is one of the highest-leverage actions the program can take to advance them toward a higher-precision experience.
 
---
 
### 8.6 Level 4: Account-Level Experience
 
**Trigger:** TAL account identified — confirmed via Demandbase reverse-IP resolution and TAL membership check — but no solution interest signal and no role classification signal. The visitor has been associated with a known account but has not yet engaged with content that reveals their solution interest or accumulates behavioral evidence for role inference.
 
**Experience character:** Personalization is limited to account-level firmographic attributes available from Demandbase: industry vertical, company size, geography, and any other account attributes in the AEP profile. No solution assumptions and no role assumptions are made. A visitor at Level 4 from a healthcare company in the enterprise segment sees content and messaging framed for that account profile, but without any assumption about which Kalder solution area they are evaluating or which role they hold.
 
**CTA tone:** Exploratory. Level 4 CTAs invite discovery — prompting the visitor to explore solution categories, read about customer outcomes by industry, or engage with content that would generate solution interest and move them to Level 3 on the next scoring run.
 
**Buying job axis:** Do not attempt. No role or solution interest has been established.
 
**Practical note:** Level 4 serves the gap between "we know who this account is" and "we know what they care about." It is a transitional level by design — the experience is calibrated to surface solution-relevant entry points that will generate solution interest. A visitor at Level 4 who engages with solution category content upgrades to Level 3 on the next scoring run.
 
---
 
### 8.7 Level 5: Default Brand Experience
 
**Trigger:** Non-TAL visitor — the account cannot be confirmed as a TAL member — or unidentified visitor — Demandbase reverse-IP resolution produces no account match. This includes all visitors whose accounts are not on the Target Account List, regardless of their behavior on the site.
 
**Experience character:** Standard kalder.com experience with no personalization. All visitors at Level 5 receive the same brand-standard page content, navigation, and CTAs.
 
**CTA tone:** Exploratory. Level 5 CTAs reflect a brand-awareness and discovery orientation appropriate for a population that has not been qualified as a buying-group prospect.
 
**Buying job axis:** Do not attempt.
 
**Important note:** Level 5 is not a failure state and must not be treated as one in reporting or program evaluation. A significant proportion of kalder.com traffic is non-TAL — industry researchers, competitors, job applicants, general interest visitors, and existing customers browsing from unidentifiable IP addresses. These visitors are correctly served a Level 5 experience. A high Level 5 volume is not evidence of program underperformance; it is evidence that the TAL filter is working as designed. The personalization program's performance should be measured against the TAL-qualified population, not against total site traffic.
 
---
 
### 8.8 Cascade Routing Logic
 
The following decision sequence describes how a visitor's classification state maps to a fallback level on each scoring run. The sequence is deterministic — every visitor follows one path through it. Routing is the Section 8 specification of cascade triggering; the experience behavior at each destination level is specified in Document 5 (Personalization Decisioning Rules).
 
**Step 1 — Identity resolution check.** Has the visitor been identified — either via Demandbase reverse-IP account match or CRM contact match? If no match is available, route to **Level 5**.
 
**Step 2 — TAL membership check.** Is the identified account on the Target Account List? If no, route to **Level 5**.
 
**Step 3 — Post-sale customer suppression check.** Has the account passed the post-sale customer suppression filter (Section 4.3)? Active Kalder customers are not acquisition personalization candidates. If the account is suppressed, route to **Level 5** — the visitor receives the default brand experience, not the acquisition-oriented personalization cascade. (Pre-sale trial and POC accounts that pass the Section 4.3 exception are not suppressed and continue to Step 4.)
 
**Step 4 — Role confidence tier check.** What is the visitor's role confidence tier for the relevant `(contact_id, solution_category)` key?
 
- HIGH → route to **Level 1**
- MEDIUM → route to **Level 2**
- LOW or UNKNOWN → proceed to Step 5
**Step 5 — Solution interest check.** Has the visitor demonstrated identified solution interest — engagement with content in a specific solution category URL space that associates them with that solution area? If yes, route to **Level 3**. If no, route to **Level 4**.
 
---
 
## Section 9 — Data Source Authority Hierarchy
 
### 9.1 Overview
 
Section 5 Step 7 established the behavioral-only MEDIUM confidence ceiling and specified that the scoring engine checks for Tier 1 and Tier 2 data availability before assigning a confidence tier. That check has a simple binary outcome in Step 7: higher-authority data is either present or absent. Section 9 specifies the full picture — how the three data tiers are structured, what authority each carries, how they combine when multiple tiers have produced classifications for the same `(contact_id, solution_category)` key, and how disagreements between tiers are handled.
 
Section 9 is the human-readable companion to `kalder_data_model.py §13 DATA_SOURCE_AUTHORITY_HIERARCHY` [data model §13]. It is also the section that formally closes the scoring pipeline loop: the composite classification output specified in Section 9.7 is the exact set of attributes that Document 5 (Personalization Decisioning Rules) and the sales activation layer consume as inputs. Everything specified in Sections 2 through 8 of this document contributes to producing that output.
 
---
 
### 9.2 Three-Tier Hierarchy Table
 
The following table presents all three data tiers in rank order. Values are authoritative from `kalder_data_model.py §13 DATA_SOURCE_AUTHORITY_HIERARCHY` [data model §13].
 
| Rank | Source | Confidence Authority | Confidence Output | v1 Role Coverage | Decay / Re-confirmation |
|---|---|---|---|---|---|
| 1 | CRM-confirmed ML classifier prediction (Snowflake) | Highest | HIGH | `champion`, `economic_buyer`, `influencer` covered; `user` and `ratifier` pending | No decay — persists until CRM record changes; retraining cycle required for coverage extension |
| 2 | Zero-party self-identification (progressive disclosure form) | High | HIGH (with behavioral confirmation) | All five roles — no coverage gap; visitor self-selects regardless of ML classifier coverage | 90-day decay from date of self-identification; requires re-confirmation after expiry |
| 3 | Behavioral inference (signal weight scoring, Sections 2–6) | Medium | MEDIUM ceiling — never HIGH alone | All five roles for MEDIUM; `user` and `ratifier` have no Tier 1 path to HIGH at v1 | Governed by `DECAY_MULTIPLIERS` [data model §8]; `over_180_days` multiplier is 0.0× |
 
---
 
### 9.3 Tier 1: CRM-Confirmed ML Classifier
 
Tier 1 is the highest-authority classification source. The ML classifier is trained on labeled closed-won CRM contacts in Snowflake, producing a role label and confidence score from a feature set that combines job title, function, solution category, and behavioral engagement pattern. The classifier output is delivered to AEP via Kafka, making it available to the personalization pipeline in near real-time as CRM records are updated.
 
When Tier 1 data is present for a `(contact_id, solution_category)` key, it governs the role classification. No behavioral inference and no zero-party self-identification can override it. This is not a policy choice — it reflects the relative reliability of the data sources. The ML classifier is trained on ground-truth CRM data from closed-won engagements, representing the highest-quality signal available about how roles map to behaviors and firmographic profiles. Behavioral inference is a probabilistic approximation; the ML classifier is an evidence-backed prediction.
 
**v1 Coverage gap:** The ML classifier covers `champion`, `economic_buyer`, and `influencer` at v1 launch. `user` and `ratifier` roles are not yet covered. For contacts in those roles, Tier 1 data is unavailable regardless of how much CRM data exists for the account. The absence of Tier 1 coverage for `user` and `ratifier` is not a configuration choice — it requires additional labeled training data for those roles and a full model retraining cycle. This is a known roadmap item. Until it is complete, `user` and `ratifier` classification operates at Tier 2 or Tier 3, with a MEDIUM confidence ceiling for Tier 3.
 
---
 
### 9.4 Tier 2: Zero-Party Self-Identification
 
Tier 2 is produced when a visitor explicitly declares their role or buying job context via a progressive disclosure prompt on kalder.com. The declaration is stored as an AEP profile attribute and is available to the personalization pipeline from the moment the form is submitted.
 
HIGH confidence from Tier 2 requires behavioral confirmation alongside the declaration. A visitor who identifies as an `economic_buyer` and has accumulated behavioral signals consistent with that role — for example, prior `roi_calculator_usage` or `pricing_page_view` signal observations — receives HIGH confidence. A visitor who identifies as an `economic_buyer` with zero prior behavioral signal receives a weaker classification pending behavioral confirmation. This requirement exists because zero-party self-identification, while high-authority, is not infallible: visitors occasionally misidentify their role, select a response that fits their job title rather than their buying function, or provide a stale declaration that no longer reflects their current context. Behavioral confirmation provides a cross-signal check.
 
**90-day decay:** Zero-party declarations are not permanent. After 90 days without re-confirmation, the Tier 2 classification decays and the system falls back to Tier 3 behavioral inference or UNKNOWN. The 90-day window is aligned with the `last_90_days` decay window for behavioral signals [data model §8], ensuring that the buying job context established by the declaration ages out at roughly the same time as the behavioral signals that were contemporaneous with it.
 
**No coverage gap:** Tier 2 covers all five roles. There is no coverage gap equivalent to Tier 1's `user` and `ratifier` limitation — a visitor can self-identify into any role regardless of ML classifier coverage.
 
**Track 2 legal review activation gate:** The firmographic confirmation pathway — the Demandbase title match that feeds the `firmographic_confirmation_bonus` in `classify_visitor()` [data model §12] — is gated on Track 2 legal review completion for the `demandbase_firmographic_match` signal [data model §P v0.2.0]. Until Track 2 completes, the Tier 2 + behavioral confirmation pathway operates without the title-match enhancement. The behavioral confirmation required for HIGH confidence must come from the visitor's own engagement signals rather than from a firmographic title match. This gate does not block the Tier 2 pathway itself — self-identification and behavioral confirmation are unaffected. It delays only the firmographic amplification of that pathway.
 
[PENDING: firmographic bonus pathway suppressed until Track 2 legal review completes. Activation is governed by Document 9 (Privacy and Consent Architecture).]
 
---
 
### 9.5 Tier 3: Behavioral Inference
 
Tier 3 is produced by the signal weight scoring pipeline specified in Sections 2 through 6 of this document. It is the most common operating state for early-stage visitors who have not yet been confirmed by the ML classifier and have not responded to a progressive disclosure prompt.
 
**MEDIUM confidence ceiling:** Tier 3 alone never produces HIGH confidence regardless of the behavioral score value. A Tier 3 score of 95 after all Section 5 adjustments receives a MEDIUM tier assignment (Section 5 Step 7). The score value — 95 — is retained in the AEP profile for trend analysis and comparative ranking; the tier assignment is MEDIUM. Downstream systems must read the `confidence_tier` attribute, not the raw `role_confidence_score`, when making experience decisions.
 
**Two additional Tier 3 pipeline outputs** that downstream systems must consume:
 
**(a) The `differential_insufficient` flag.** When the role differential check in Section 5 Step 3 caps the top score at 49 because the top role does not lead the second-highest role by the minimum 10-point differential, the scoring engine sets `differential_insufficient: True` in the return object [data model §12 v0.2.0 AR-03]. This flag distinguishes two meaningfully different LOW tier states: a contact whose role is ambiguous because two roles scored closely (differential-capped LOW, `differential_insufficient: True`) versus a contact whose behavioral signal is genuinely weak (weak-signal LOW, `differential_insufficient: False`). Document 5 (Personalization Decisioning Rules) must handle these states differently — a differential-capped LOW contact may benefit from a progressive disclosure prompt to resolve the ambiguity, while a weak-signal LOW contact may benefit from discovery content that generates more signal.
 
**(b) The `firmographic_role_mismatch` indicator.** When Demandbase title data is available and suggests a different role than the behavioral inference top scorer — `firmographic_role != classified_role` after Step 4 — this diagnostic indicator should be preserved in the AEP profile rather than discarded. A mismatch is not an error state; it is a data quality signal that provides input for model refinement. A persistent pattern of mismatch between title-inferred role and behaviorally-inferred role for a given role is evidence that either the title-to-role mapping or the behavioral weights for that role require review.
 
---
 
### 9.6 Authority Adjudication Rules
 
The following five rules govern what happens when multiple tiers have produced data for the same `(contact_id, solution_category)` key simultaneously. These rules are derived from the rank ordering in `DATA_SOURCE_AUTHORITY_HIERARCHY` [data model §13] and the confidence tier definitions in `CONFIDENCE_TIERS` [data model §3]. They are not arbitrary policy choices; they follow directly from the structural logic of the hierarchy.
 
---
 
**Rule 1 — Higher rank always governs.** When Tier 1 ML classifier data is present for a `(contact_id, solution_category)` key, it determines the role classification and confidence tier. Tier 2 and Tier 3 data do not override Tier 1, regardless of score values or declaration recency. The Tier 1 classification is authoritative.
 
---
 
**Rule 2 — Behavioral inference never overrides CRM-confirmed data.** A Tier 3 behavioral score — even a score of 95, representing the strongest possible behavioral evidence — does not supersede a Tier 1 ML classifier prediction. This rule is not symmetric with Rule 1; it exists as a named rule because the intuition to override CRM-confirmed data with strong behavioral evidence will arise in practice. The rule must be explicit: the ML classifier is trained on CRM ground truth from closed-won engagements; behavioral inference is a probabilistic approximation based on content consumption patterns. When they conflict, the ground-truth-trained model governs. Behavioral evidence that persistently contradicts the ML classifier prediction is a signal to review the classifier, not to override it in real time.
 
---
 
**Rule 3 — Tier 2 governs in Tier 1 absence.** When Tier 2 zero-party self-identification data is present and Tier 1 ML classifier data is absent for a `(contact_id, solution_category)` key, Tier 2 governs. HIGH confidence from Tier 2 requires behavioral confirmation alongside the declaration — self-identification is high-authority but requires a cross-signal check to prevent a visitor from reaching HIGH confidence by declaration alone without engagement evidence. This requirement is consistent with Rule 2's logic: higher-authority data governs, but even the second-highest source benefits from corroboration.
 
---
 
**Rule 4 — Conflicts are flagged, not silently resolved.** When Tier 1 and Tier 3 disagree — the ML classifier predicts one role for a `(contact_id, solution_category)` key and behavioral inference scores a different role more highly — the system must not silently discard the behavioral signal. Rule 1 governs the experience decision: the Tier 1 classification determines what experience the visitor receives. But the behavioral disagreement should be preserved in the AEP profile as a `classification_mismatch: True` indicator.
 
A persistent mismatch between ML classifier predictions and behavioral inference for a role is evidence that either the classifier model or the signal weights require revision — both are hypotheses, and ground-truth conflicts are the primary mechanism for updating them. The `classification_mismatch` indicator feeds Document 7 (Measurement and Experimentation Framework) monitoring processes, where it informs model accuracy analysis and weight revision cycles. It does not feed Document 5 (Personalization Decisioning Rules) — it does not change the experience the visitor receives.
 
---
 
**Rule 5 — Tier 3 alone with MEDIUM ceiling.** When neither Tier 1 nor Tier 2 data is available for a `(contact_id, solution_category)` key, Tier 3 governs with the MEDIUM confidence ceiling from Section 5 Step 7. This is the most common operating state for early-stage visitors in the v1 launch period: the ML classifier has not yet processed the contact, and progressive disclosure has not yet been offered or responded to. It is not a degraded state. MEDIUM confidence at Tier 3 produces a meaningful Level 2 role-influenced experience that serves the visitor's likely evaluation needs while the higher-authority data sources develop.
 
---
 
### 9.7 Composite Classification Output
 
The following table specifies the complete composite classification output — the set of AEP profile attributes that the full pipeline (Sections 2 through 9 of this document) produces for each `(contact_id, solution_category)` key. This is the handoff specification: it defines exactly what Document 5 (Personalization Decisioning Rules) and the sales activation layer receive as inputs on each scoring run.
 
All attribute names in this table are canonical. Any system reading classification output — Adobe Target, Marketo, Salesforce, the AI Advisor — must reference these attributes via `CLIENT_ATTRIBUTE_MAP` [data model §CA v0.2.0], which maps these canonical names to client-specific CDP field names.
 
| Attribute | Source | Values | Governing Section |
|---|---|---|---|
| `role_classification` | Governed by Section 9 authority adjudication rules | `champion` / `economic_buyer` / `influencer` / `user` / `ratifier` / `default` | Section 9 |
| `confidence_tier` | Governed by `§3 CONFIDENCE_TIERS` tier assignment after Section 5 scoring sequence | `HIGH` / `MEDIUM` / `LOW` / `UNKNOWN` | Section 5 |
| `role_confidence_score` | Tier 3 behavioral score (0–100); set to 100 when Tier 1 governs | Integer 0–100 | Section 5 |
| `differential_insufficient` | Set by Step 3 role differential check when top score is capped at 49 due to insufficient differential | `True` / `False` | Section 5 [data model §12 v0.2.0 AR-03] |
| `buying_job_confirmed` | Tier 2 zero-party declaration (KNOWN state) | `problem_identification` / `solution_exploration` / `requirements_building` / `supplier_selection` / `null` | Section 7 |
| `buying_job_inferred` | Tier 3 behavioral inference (INFERRED state) | `problem_identification` / `solution_exploration` / `requirements_building` / `supplier_selection` / `null` | Section 7 |
| `fallback_level` | Derived from `confidence_tier` + solution interest signal per Section 8.8 routing sequence | `1` / `2` / `3` / `4` / `5` | Section 8 |
| `classification_mismatch` | Set when Tier 1 ML classifier role and Tier 3 behavioral inference top-scoring role disagree | `True` / `False` | Section 9 |
| `solution_category` | Component of `(contact_id, solution_category)` composite key; established at signal collection time | Solution category key (e.g., `customer_engagement`, `risk_compliance`) | Section 2 |
 
---
 
### 9.8 Scope Boundary Note
 
Section 9 specifies the classification pipeline output and the authority adjudication rules that produce it. The following adjacent topics are explicitly out of scope here and owned by other documents or sections:
 
The **full experience behavior activated by each `fallback_level` value** — which page modules render, which content variants are selected, how CTAs are constructed, and which marketing automation segments activate — is specified in Document 5 (Personalization Decisioning Rules). Section 9 specifies the `fallback_level` attribute and the routing rules that produce it; it does not specify what the levels mean for experience delivery.
 
The **AEP attribute schema implementation** — data types, update rules, event triggers, write conditions, and the mapping from canonical attribute names to client-specific CDP field names via `CLIENT_ATTRIBUTE_MAP` — is specified in Document 8 (Operational Runbook). Section 9 names the canonical attributes; it does not specify their implementation.
 
The **consent gating that determines which signals may be collected and which attributes may be populated** is specified in Document 9 (Privacy and Consent Architecture) and in Section 10 of this document. Section 9 specifies what the pipeline produces assuming signal collection has been authorized; it does not specify the legal basis or consent conditions for that collection.
 
---
 
## Section 10 — Signal Consent Classification
 
### 10.1 Overview
 
Section 10 provides the signal-level consent classification for all 20 behavioral signals in `CROSS_ROLE_WEIGHTS` plus the `demandbase_firmographic_match` enrichment signal. It is the human-readable companion to `kalder_data_model_v0_2_0.md §P SIGNAL_CONSENT_REQUIREMENTS` [data model §P]. Practitioners implementing the scoring pipeline, legal and compliance reviewers auditing signal collection practices, and enterprise clients evaluating data governance requirements are the primary audience for this section.
 
**Two-track structure:** Track 1 Legitimate Interest Assessment (LIA) is complete for all 20 first-party behavioral signals. All 20 are classified under the `LI_FIRST_PARTY` template — `legitimate_interest` lawful basis, no PII, no cross-site tracking, not suppressed under GDPR without explicit consent, not affected by CCPA opt-out. Track 2 legal review is pending for `demandbase_firmographic_match`, the Demandbase reverse-IP firmographic enrichment signal. Until Track 2 completes, the firmographic confirmation bonus pathway in `classify_visitor()` is suppressed for Demandbase-sourced data, and the scoring pipeline operates without the title-match enhancement.
 
**Default classification rule:** Any signal key not present in `SIGNAL_CONSENT_REQUIREMENTS` defaults to `functional_only` treatment — signals classified as `explicit_consent_required` are suppressed under this default [data model §P `PENDING_CONSENT_CLASSIFICATION_DEFAULT`]. This default applies permanently as a safety net for new signals added to the inventory after v0.2.0. It is not a temporary placeholder; it is a structural safeguard that ensures unclassified signals cannot activate without legal review.
 
**Scope delegation:** The full visitor-level consent state model — including how `visitor_consent_state` is set, updated, and propagated through the Segment and AEP pipeline; how the consent management platform interfaces with the scoring engine; and the geographic handling governance framework — is specified in Document 9 (Privacy and Consent Architecture). Section 10 does not replicate that governance. It provides the signal-specific classification data that Document 9's consent gating logic operates on. A practitioner implementing consent gating must read both this section and Document 9.
 
---
 
### 10.2 Visitor Consent States
 
The `VISITOR_CONSENT_STATES` structure [data model §P] defines three states that govern signal collection and scoring for every visitor. The `visitor_consent_state` attribute is mapped via `CLIENT_ATTRIBUTE_MAP` [data model §CA] and must be evaluated before signal collection and scoring logic executes on any visitor. This is a pre-pipeline check — not a post-collection filter. Evaluating consent state after signals have been collected creates a compliance gap that cannot be corrected retroactively; signals collected without confirmed lawful basis cannot be un-collected.
 
| State | Description | Effect on Signal Collection | Effect on Scoring |
|---|---|---|---|
| `full` | Visitor has provided full consent or consent is not required for all signal classes | All classified signals may be collected | All 20 behavioral signals and `demandbase_firmographic_match` (if Track 2 completes) may contribute to scoring |
| `functional_only` | Visitor has limited consent to functional/legitimate interest signals only | Only signals classified as `legitimate_interest` may be collected; `explicit_consent_required` signals are suppressed; cross-site tracking and third-party enrichment are disabled | All 20 first-party behavioral signals may contribute to scoring; `demandbase_firmographic_match` is suppressed and the firmographic bonus pathway does not execute |
| `declined` | Visitor has declined consent or opted out | No behavioral signals may be collected | No scoring executes; visitor receives the unpersonalized (Level 5) experience regardless of TAL status or any prior scoring history |
 
**Operational sequence — evaluated before any signal collection or scoring logic executes:**
 
1. Visitor arrives at kalder.com.
2. `visitor_consent_state` is read from the AEP profile or consent management platform via `CLIENT_ATTRIBUTE_MAP` [data model §CA].
3. If `declined` — signal collection is suppressed, scoring does not execute, and the visitor receives the unpersonalized experience regardless of TAL status.
4. If `functional_only` — only `legitimate_interest` class signals may be collected; `explicit_consent_required` signals are suppressed before collection; the scoring engine runs on the permitted signals only.
5. If `full` — all classified signals may be collected; the scoring pipeline executes without consent-state restrictions.
---
 
### 10.3 Signal Consent Classification Table
 
The following table presents the authoritative consent classification for all 20 `CROSS_ROLE_WEIGHTS` behavioral signals and the `demandbase_firmographic_match` enrichment signal. All values are from `SIGNAL_CONSENT_REQUIREMENTS` [data model §P]. No classification values are inferred or estimated.
 
| Signal Key | Lawful Basis | PII Involved | Cross-Site | GDPR Suppressed Without Consent | CCPA Opt-Out Affects | Track Status |
|---|---|---|---|---|---|---|
| `case_study_download` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `competitive_comparison_view` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `demo_request` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `multi_solution_exploration` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `roi_calculator_usage` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `pricing_page_view` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `executive_brief_download` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `use_case_exploration` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `product_tour_engagement` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `webinar_registration` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `howto_training_content` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `community_forum_engagement` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `security_whitepaper_download` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `compliance_governance_content` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `technical_docs_deep` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `faq_support_docs` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `diagnostic_assessment` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `integration_catalog_view` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `security_trust_center_visit` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `category_explainer_view` | `legitimate_interest` | False | False | False | False | Track 1 complete |
| `demandbase_firmographic_match` | `explicit_consent_required` | True | True | True | True | Track 2 — pending legal review |
 
**Note 1:** All 20 behavioral signal classifications reflect Track 1 LIA completion. The legitimate interest basis applies to behavioral signals collected on kalder.com owned web properties. LIA documentation must be completed and retained as required by applicable jurisdiction. See Document 9 (Privacy and Consent Architecture) for LIA documentation governance.
 
**Note 2:** `demandbase_firmographic_match` is classified as `explicit_consent_required`. It is suppressed in `functional_only` and `declined` consent states. It is suppressed in GDPR jurisdictions (EU, UK, EEA) without explicit consent under GDPR Article 6(1)(a). When suppressed, the signal is not collected, is not cached, and the `firmographic_confirmation_bonus` in `classify_visitor()` does not execute — the score is not discounted or reduced; the bonus pathway does not activate at all. Track 2 legal review is pending [data model §P].
 
---
 
### 10.4 Geographic Consent Rules
 
The following geographic rules govern which signal classes may be active in each jurisdiction context, derived from `GEOGRAPHIC_CONSENT_RULES` [data model §P].
 
**GDPR (EU, UK, EEA)**
 
Signals classified as `explicit_consent_required` are suppressed in GDPR jurisdictions. The `demandbase_firmographic_match` signal falls in this class and cannot activate in GDPR jurisdictions regardless of the visitor's `visitor_consent_state` until Track 2 legal review completes, a Data Processing Agreement (DPA) is executed with Demandbase, and a GDPR-compliant consent mechanism is implemented for EU, UK, and EEA visitors.
 
When visitor jurisdiction is GDPR and the `visitor_consent_state` is unknown or has not been set, the system applies `functional_only` as the default consent state. This means all 20 first-party behavioral signals — classified as `legitimate_interest` — may be collected, but `demandbase_firmographic_match` is suppressed.
 
The legitimate interest basis for the 20 behavioral signals on kalder.com owned web properties is governed by the LIA completed under Track 1. LIA documentation must be completed, documented, and retained before any `legitimate_interest` signal is activated in a GDPR jurisdiction. The LIA process and documentation requirements are specified in Document 9 (Privacy and Consent Architecture).
 
**CCPA (California, United States)**
 
Signals classified as `explicit_consent_required` are affected by a consumer's right to opt out of the sale or sharing of personal information under CCPA. `demandbase_firmographic_match` is in this class. A right-to-opt-out notice is required before `explicit_consent_required` signals are activated for California residents.
 
Signals classified as `legitimate_interest` — all 20 first-party behavioral signals — are not affected by CCPA opt-out, because they do not involve the sale or sharing of personal information. Behavioral signals collected on kalder.com owned web properties, without PII and without cross-site tracking, fall outside the scope of CCPA opt-out rights as currently specified [data model §P]. Document 9 (Privacy and Consent Architecture) governs any changes to this determination if CCPA regulatory guidance evolves.
 
**Default (all other jurisdictions)**
 
For jurisdictions not covered by GDPR or CCPA, and for any visitor whose jurisdiction cannot be determined, apply `functional_only` as the default consent state. This is a conservative default pending legal review for additional jurisdictions. `legitimate_interest` signals are active under `functional_only`; `explicit_consent_required` signals are suppressed. Document 9 (Privacy and Consent Architecture) governs the process for extending geographic consent rules to additional jurisdictions as legal review is completed.
 
---
 
### 10.5 Data Retention and the Scoring/Storage Distinction
 
The following table presents the `DATA_RETENTION_SCHEDULE` [data model §P], which governs the physical storage windows for data classes produced by the Kalder personalization pipeline.
 
| Data Class | Retention Window | Storage Location | Deletion Trigger |
|---|---|---|---|
| Raw behavioral signals | 365 days | Segment event stream / AEP event stream | Rolling window — auto-expire after retention window; also deleted on DSR or consent withdrawal |
| Scored role attributes (`role_confidence_score`, `role_classification`, `bg_stage`) | 180 days | AEP profile attributes | Rolling window — auto-expire; also deleted on consent withdrawal or DSR |
| CRM enriched records | 730 days (2 years) | Salesforce CRM contact records | DSR or contract termination; coordinated with CRM admin |
| Firmographic enrichment cache (Demandbase reverse-IP match results) | 90 days | Demandbase cache in AEP | Rolling window — auto-expire; suppressed immediately on consent withdrawal |
 
---
 
**Scoring decay and data retention are separate instruments.**
 
`DECAY_MULTIPLIERS` (Section 3, [data model §8]) are scoring controls. A signal observation older than 180 days receives an `over_180_days` multiplier of 0.0× and contributes zero to the contact's cumulative role confidence score. It is not scored. But it has not been deleted — it still exists in the Segment event stream and in Snowflake tables until the `raw_behavioral_signals` retention window of 365 days expires and the rolling deletion executes.
 
`DATA_RETENTION_SCHEDULE` windows are storage controls. They govern when data is physically deleted from each system. They operate independently of the scoring engine and independently of the decay model.
 
A compliance reviewer auditing Kalder's data practices will find signal observations in Segment and Snowflake that are contributing zero to current scoring. This is expected behavior, not a compliance gap. The data exists because the 365-day retention window has not yet expired; the signal contributes zero because the 180-day decay window has passed. Both instruments are functioning correctly and independently.
 
Practitioners implementing the pipeline must implement both correctly: the decay model governs scoring behavior; the retention schedule governs deletion behavior. Neither substitutes for the other.
 
---
 
### 10.6 Deletion and Consent Withdrawal Path
 
The `DELETION_PATH` [data model §P] specifies the four-step cascade that executes on any of three trigger events: **consent withdrawal** by the visitor, a **data subject request (DSR)** submitted under applicable privacy law, or **contract termination** between Kalder and the enterprise client.
 
**Step 1 — AEP profile attributes**
*System: Adobe Experience Platform*
*Action:* Delete all profile attributes in the `scored_role_attributes` class — `role_confidence_score`, `role_classification`, `bg_stage`, and associated buying group attributes — for the subject visitor.
*SLA: 72 hours from trigger event.*
 
**Step 2 — Segment event collection**
*System: Segment*
*Action:* Suppress all future behavioral event collection for the subject visitor. Submit a deletion request for historical events associated with the visitor ID in the Segment event stream.
*SLA: 72 hours from trigger event.*
 
**Step 3 — Snowflake data warehouse**
*System: Snowflake*
*Action:* Execute `DELETE` on `visitor_signals` and `visitor_scores` tables for the subject `visitor_id`. This step runs as a batch deletion process.
*SLA: 168 hours (7 days) from trigger event.*
 
**Step 4 — Salesforce CRM**
*System: Salesforce CRM*
*Action:* Null out buying group enrichment fields for the subject contact record. The base contact record is retained per CRM retention policy; only the buying group personalization enrichment fields are deleted.
*SLA: 168 hours (7 days) from trigger event.*
 
**Confirmation:** A deletion confirmation record with timestamp and step completion status must be generated when all four steps have reported completion. The confirmation record documents that deletion is fulfilled — it is not generated until all four steps are complete.
 
**Practitioner note — partial deletion:** The deletion path is a cascade. All four steps must complete before deletion is considered fulfilled. A deletion that completes Steps 1 and 2 within 72 hours but stalls at Steps 3 or 4 is a partial deletion, not a confirmed deletion. A partially completed deletion does not satisfy a DSR or consent withdrawal obligation under GDPR or CCPA. Enterprise clients evaluating DSR compliance should expect to receive the four-step confirmation record with individual step timestamps — a single "deletion completed" notification without step-level detail is insufficient for audit purposes.
 
---
 
### 10.7 Forward Reference Resolutions
 
Two pending forward references from earlier sections are resolved by this section.
 
**Resolution 1 — Section 2.3 signal definitions (`howto_training_content` and `security_trust_center_visit`).**
 
Both signal definitions in Section 2.3 carry the following forward reference: *"The consent classification implications of this signal are specified in Document 9 (Privacy and Consent Architecture)."*
 
The signal-level consent classification for both signals is now specified in Section 10.3. Both `howto_training_content` and `security_trust_center_visit` are classified as `legitimate_interest`, no PII involved, no cross-site tracking, not suppressed under GDPR without explicit consent, not affected by CCPA opt-out [data model §P Track 1 complete]. Both signals may be collected in all three `VISITOR_CONSENT_STATES` except `declined`, and are active in GDPR jurisdictions under the legitimate interest basis established by Track 1 LIA.
 
The broader consent architecture — visitor-level consent state propagation, geographic handling governance, and LIA documentation requirements — remains governed by Document 9 (Privacy and Consent Architecture). The forward reference in these definitions will be updated in the final publication pass to cite Section 10.3 directly for the signal-level classification, with Document 9 retained as the reference for the broader governance framework.
 
**Resolution 2 — Section 9.4 Track 2 activation gate.**
 
Section 9.4 carries: *"[PENDING: firmographic bonus pathway suppressed until Track 2 legal review completes. Activation is governed by Document 9 (Privacy and Consent Architecture).]"*
 
Current status as of data model v0.2.0: Track 2 legal review for `demandbase_firmographic_match` is pending. The firmographic confirmation bonus pathway in `classify_visitor()` remains suppressed for Demandbase-sourced data. The `[PENDING]` flag in Section 9.4 remains active.
 
Full activation of the firmographic bonus pathway requires all three of the following: (a) Track 2 legal review completion confirming the lawful basis for `demandbase_firmographic_match` under applicable jurisdictions; (b) Data Processing Agreement (DPA) execution with Demandbase; (c) implementation of a GDPR-compliant consent mechanism for EU, UK, and EEA visitors before the signal can activate in those jurisdictions. Activation is governed by Document 9 (Privacy and Consent Architecture). The `[PENDING]` flag in Section 9.4 will be removed in the final publication pass when Track 2 completes and all activation conditions are confirmed.
 
---
 
### 10.8 Scope Boundary Note
 
Section 10 specifies: signal-level consent classification for the 20 `CROSS_ROLE_WEIGHTS` behavioral signals and `demandbase_firmographic_match`; the three visitor consent states and their effects on signal collection and scoring; geographic handling rules for GDPR, CCPA, and default jurisdictions; the data retention schedule; and the deletion and consent withdrawal cascade.
 
The following topics are explicitly out of scope here and governed by other documents:
 
The **implementation of the consent management platform and cookie consent UI** — the technical mechanism by which visitor consent is collected, stored, and propagated — is specified in Document 9 (Privacy and Consent Architecture). Section 10 specifies what the consent states mean for signal collection and scoring; it does not specify how consent is obtained.
 
The **LIA documentation templates and process** — the structured Legitimate Interest Assessment records that must be completed and retained before `legitimate_interest` signals are activated in GDPR jurisdictions — are specified in Document 9 (Privacy and Consent Architecture).
 
The **technical implementation of consent state propagation** through the Segment event pipeline and AEP attribute system — how `visitor_consent_state` is written, read, and enforced in real time as visitors interact with kalder.com — is specified in Document 8 (Operational Runbook).
 
The **measurement methodology for consent state distribution** across the visitor population — including how to monitor the proportion of visitors in each consent state and the downstream effects on signal coverage and classification accuracy — is specified in Document 7 (Measurement and Experimentation Framework).
 
---
 
*Document 2 — Signal Definition and Confidence Model is complete. Final publication pass applied June 2026: resolved [PENDING] flags removed from Sections 2.3 and 3.5; CONDITIONAL_WEIGHT_MODIFIERS citations updated to [data model §7a] with correct entry keys per Section 6.7 Resolution 1; Section 10.3 consent classification forward reference added to security_trust_center_visit definition. Remaining open item: Section 9.4 Track 2 activation gate ([PENDING: firmographic bonus pathway suppressed until Track 2 legal review completes]) — to be removed when Track 2 completes. Document 2 is the authoritative signal and confidence specification for the Kalder Personalization Hub Corpus until superseded by a versioned revision.*
 
