# Document 6 — Buying Group Journey and Convergence Model

**Kalder Personalization Corpus | Version: Locked Draft | Sections 1–7 Complete**

---

## Table of Contents

- Section 1: Document Scope and Canonical Status
- Section 2: The Four Buying Group Stages
- Section 3: The Double-Diamond Phase Structure
- Section 4: Progressive Disclosure UX Specification
- Section 5: The Six Convergence Points
- Section 6: The JTBD Code Library
  - 6.1 How to Use This Library
  - 6.2 Customer Engagement JTBD Library
  - 6.3 IT Operations JTBD Library
  - 6.4 Risk & Compliance JTBD Library
  - 6.5 Employee Experience JTBD Library
  - 6.6 AI Platform JTBD Library
- Section 7: The Buying Job Inference Model
- Section 8: Sales Activation Integration

---

## Section 1 — Document Scope and Canonical Status

Document 6 is the single authoritative source for the buying group stage model, the double-diamond phase structure, the progressive disclosure UX specification, the six convergence points, the JTBD code library, the buying job inference model, and the sales activation integration specification in the Kalder Buying Group Personalization Program. It is the document that bridges the strategic framework — what are buyers doing, and where are they in their journey? — with the operational content and sales activation layer. No other corpus document re-defines buying group stages, re-specifies convergence points, or extends the JTBD code library.

Three adjacent decisions are explicitly out of scope here. The role definitions that anchor the double-diamond model and the JTBD code library are owned by Document 1 (Buying Group Role Architecture). The signal scoring and buying job confidence model that feed into stage classification and JTBD inference are owned by Document 2 (Signal Definition and Confidence Model). The operational implementation of sales activation alert delivery, CRM handoff, and Outreach sequence execution is owned by Document 8 (Operational Runbook).

The stage definitions, convergence point specifications, and JTBD codes in this document are the human-readable authority from which content authors, demand gen practitioners, and sales teams operate. The machine-readable canonical sources are `kalder_data_model.py §17 JTBD_CODES`, `§18 BUYING_GROUP_CONVERGENCE_POINTS`, and `§SA SALES_ACTIVATION_CONFIG`. Any discrepancy between this document's definitions and the data model is a defect — the data model governs entity definitions and enum values; this document governs their strategic meaning and operational application.

**What this document owns:** The four buying group stages (Section 2), double-diamond phase structure (Section 3), progressive disclosure UX specification (Section 4), six convergence points (Section 5), JTBD code library (Section 6), buying job inference model (Section 7), and sales activation integration (Section 8).

**Delegation — what this document does not re-specify:**
- Buying group role definitions, behavioral signatures, and confidence tier thresholds → Document 1
- Signal weight matrix, seven-step scoring sequence, and buying job confidence model → Document 2
- Audience segmentation, AEP audience gates, and campaign cohort activation → Document 3
- Content node schemas, module types, and converge content commissioning rules → Document 4
- Runtime experience selection logic, fallback cascade routing, and Adobe Target activity configuration → Document 5
- Lift measurement, convergence point velocity metrics, and experimentation framework → Document 7
- Operational CRM handoff, Outreach sequence implementation, and alert delivery routing → Document 8
- Consent-state gating conditions affecting progressive disclosure activation → Document 9

**Coverage status note.** The JTBD code library in Section 6 carries coverage status per category. Customer Engagement is source-validated (26 codes, coverage_status: complete per §17). IT & Operations, Risk & Compliance, Employee Experience, and AI Platform carry partial or constructed coverage at v1. Coverage status is specified per-entry in Section 6 and in `kalder_data_model.py §17`.

**Section numbering note.** Prose cross-references within this document have been reconciled to current heading numbers (cross-reference cleanup pass, 2026-06-21). Heading numbers are authoritative.

---

## Section 2: The Four Buying Group Stages

---

### 1.1 Stages and the Program's Frame of Reference

Buying group stages are buyer-centric pipeline measures. They describe where a buying group is in its journey toward a purchase decision — not where the program is in a funnel, not what the sales team has accomplished, and not what content has been deployed. The distinction matters because it determines how the program responds to stage data. A stage change signals that the buyer's situation has changed. The program responds to that change. It does not manufacture it.

This framing has a direct consequence for how practitioners should use stage information. An account is not in the targeted stage because the program hasn't reached it yet — it is in the targeted stage because no behavioral engagement from that account has reached the program. The correct question when looking at a targeted account is not "what should we deploy to move it?" but "what is the buying situation that would explain this account's silence, and what content is appropriate for a group that has not yet engaged?" Those are different questions with different answers.

The relationship between stages and cohorts follows directly from this buyer-centric logic. Stages are facts about the buyer's state; cohorts are the program's decisions about activation. Both engaged and prioritized accounts are in the acquisition cohort — they receive the same broad treatment type — but they represent meaningfully different buyer states, and the program preserves that distinction for content depth selection and measurement. Qualified accounts split into two cohorts depending on how advanced the Salesforce opportunity is. Stage and cohort are not synonymous, and the mapping between them is not one-to-one. Document 3, Section 2 specifies the stage-to-cohort architecture in full; this section provides the strategic context for understanding why it is designed the way it is.

Each stage also has a phase character drawn from the double-diamond model: diverge (individual role evaluation) or converge (group alignment). The phase character of a stage determines what content the buying group needs and what behavior the program is trying to support. At a diverge-phase stage, the program's job is to serve content that advances each role's independent evaluation. At a converge-phase stage, the program's job shifts to content that enables group alignment — consensus briefs, executive briefs, alignment tools. The double-diamond mechanics are specified in Section 3; the stage descriptions below identify which phase character applies at each stage and what that means for content strategy.

The four stages map to Forrester's B2B Revenue Waterfall equivalents. That mapping is not cosmetic — each stage boundary corresponds to a genuinely observable and meaningful change in the buying group's behavior. The targeted-to-engaged transition requires a real first engagement from a distinct, resolved contact. The engaged-to-prioritized transition requires either multi-member engagement or an explicit intent signal. The prioritized-to-qualified transition requires a Salesforce opportunity. Each transition is detectable from behavioral and CRM data, not from seller interpretation.

---

### 1.2 Targeted

Most accounts in a well-constructed Target Account List are in the targeted stage at any given time. That is not a failure — it is the structural reality of a TAL-based program. A targeted account is one the program knows exists and has identified as worth pursuing. What the program does not yet know is whether anyone at that account is paying attention.

Targeted is the stage of absence. No contact at this account has produced a behavioral signal that passes the program's quality threshold within the last 180 days, and no Salesforce opportunity is linked to the account. The 180-day window is rolling and continuous. An account that produced an engagement signal more than 180 days ago and has since been inactive returns to targeted-equivalent behavior — its prior signal has aged out of the window. The targeted stage does not confer permanent "engaged" status; engagement must be sustained or re-established. This is not a data anomaly; it is the correct design for a program that needs to distinguish genuinely active accounts from accounts that engaged once and went quiet.

Inside the organization, one of three things is true at a targeted account: a buying group has not yet formed; a buying group exists but has not yet reached kalder.com; or someone has visited kalder.com but as an anonymous session that has not been resolved to a contact identity. The program cannot distinguish between these three cases from the outside, which means it cannot serve contact-level personalization here. The primary experience at this stage is account-level and firmographic — Level 4 in the fallback cascade — informed by the account's industry, company size, and any solution category interest the account has demonstrated through prior behavioral aggregation at the account level.

The program's job at targeted is to generate the first identifiable engagement from a distinct, resolved contact. Content should be problem-centric and educational — thought leadership, industry research, category-level explainers — broadly shareable enough to circulate within the organization before any individual is identified. The program should not presume that a buying group has formed or that any specific role is active. Champions and Economic Buyers in this stage, if they are there at all, are in problem identification mode by design: they are asking whether this problem category is real and worth solving, not yet evaluating specific solutions.

The phase character is diverge. The transition that ends targeted is the first qualifying behavioral engagement from a distinct, resolved contact — one real person engaging with kalder.com in a way that passes the signal quality gates defined in Document 2. That event transitions the account to engaged.

---

### 1.3 Engaged

The engaged stage begins the moment the program has something true and specific to work with: one person at a target account has engaged in a way the program can act on. Their role signals are beginning to form. The program can start serving content calibrated to their emerging role — not at full role specificity, which requires higher confidence, but meaningfully more targeted than the firmographic-only Level 4 experience of targeted.

The central challenge of the engaged stage is that one person is not a buying group. One engaged contact is evidence that a buying group exists or is forming. It is not the group itself. And the content that serves the known contact well — deepening their role-appropriate evaluation — is often different from the content that would surface a second contact from a different role within the same account. The program faces a genuine design tension here: serve depth to the known contact, or serve breadth to reach the unknown group.

The program resolves this tension by running both strategies simultaneously at different delivery surfaces. On kalder.com, the identified contact receives a Level 1 through Level 3 experience calibrated to their role confidence and solution category — depth appropriate to what the program knows. Account-level content — at the Level 4 layer — continues to serve broadly educational content appropriate for a buying group member who has not yet been identified. The two experiences do not contradict each other; they address different visitors who may be reaching kalder.com from the same account in the same window.

The engaged and prioritized stages share the acquisition cohort in the program's channel architecture. This is intentional, but it should not lead practitioners to treat them as equivalent. The buying group situation at an engaged account — one confirmed contact, potentially at early role confidence — is different from the situation at a prioritized account — either two resolved contacts active within a 90-day window or an explicit hand-raiser event. Within the acquisition cohort, the stage attribute preserves this distinction: content depth selection, convergence point proximity, and sales engagement intensity should all reference whether an account is engaged or prioritized, not just whether it is in the acquisition cohort. A demand gen manager who treats all acquisition-cohort accounts identically is serving some of them appropriately and over-serving or under-serving the rest.

The transition from engaged to prioritized requires either a second distinct-contact qualifying event — a different resolved identity engaging with content that passes the signal quality threshold within 90 days of the first qualifying event — or a hand-raiser event from any contact at the account. Anonymous sessions do not count toward the two-contact threshold, even if they pass all other quality gates. Two sessions from the same person, stitched by the identity resolution pipeline to a single contact identity, also count as one contact, not two. The program counts resolved identities, not session volume.

The phase character is diverge transitioning toward converge. Contacts at this stage are in solution exploration or early requirements framing — moving from "is this solution category relevant to our problem?" toward "what would a good solution look like?"

---

### 1.4 Prioritized

Prioritized is the inflection point. The program has confirmed either that more than one person at this account is actively engaged, or that one person has raised their hand explicitly enough that the evaluation is real beyond reasonable doubt. The strategic shift at prioritized is not incremental — the program's job changes from generating engagement to enabling convergence. The buying group is approaching its first convergence points: Problem Validation (Champion and Economic Buyer agreeing the problem is worth solving) and Requirements Framing (Champion, Influencer, and User aligning on evaluation criteria). The content and the sales activation intensity should reflect that proximity.

The two paths into prioritized produce different buying group states, and the program should not treat them as identical. The two-contact path means two distinct, resolved individuals at the account have engaged with kalder.com content in a way that passes quality thresholds within a 90-day window. This confirms multi-member engagement — a genuine buying group is forming, and the program has behavioral evidence of at least two roles beginning their evaluation. The content program at this point can begin serving convergence-enabling content: consensus briefs for the Champion to share internally, content that speaks to both technical and business dimensions of the problem.

The hand-raiser path — a form fill, demo request, or contact submission from any contact — is a different kind of signal. It is high-intent: someone at this account has voluntarily declared interest in direct engagement. But a hand-raiser account may have only one identified contact. The buying group may be in its earliest stages of formation, or the hand-raiser may be a Champion who is far ahead of their colleagues internally. The program should not assume group completeness at a hand-raiser account. Broadening buying group coverage — reaching additional members who have not yet engaged with kalder.com — remains an active objective even after the hand-raiser trigger fires. The SDR team picking up a hand-raiser account should treat it as a high-intent lead from one person within a potentially incomplete group, not as a confirmed multi-stakeholder evaluation.

Within the account's experience, the prioritized stage serves role-specific content at greater depth than engaged: requirements framing content, use case validation content, early solution comparison material. Champions in prioritized are in requirements-building mode; Economic Buyers are in early problem validation and ROI framing. The program serves each contact at the depth their role confidence and solution category allow. Section 5 specifies the convergence points that prioritized accounts are approaching; Section 3 specifies the double-diamond mechanics that govern the phase transition within the stage.

The phase character is primarily converge. The transition that ends prioritized is the creation of a Salesforce opportunity record — the AE has logged a qualified opportunity — which transitions the account to qualified regardless of its prior behavioral stage.

---

### 1.5 Qualified

Qualified is the most complex stage in the model — not because the definition is complicated, but because the stage label conceals two genuinely different buying group states that require different program responses. A qualified account at Salesforce Stage 2 has a buying group still working through requirements framing and solution validation. A qualified account at Salesforce Stage 6 has a buying group that has completed its evaluation, aligned on a vendor, and is managing the mechanics of commitment. Serving both populations with the same content and the same activation intensity is wrong by design.

The program addresses this by splitting qualified into two cohorts based on Salesforce opportunity stage. Accounts at Stages 2 through 4 receive the progression early-to-mature treatment: AE-owned sequences, role-specific validation content, convergence-enabling materials for Business Value Alignment and Solution Validation. Accounts at Stages 5 through 7 receive progression win-now treatment: executive alignment content, procurement navigation materials, and the high-touch final-stage engagement appropriate for a group that is approaching final commitment, not completing requirements framing. The difference between these two treatments is not cosmetic — the content, the sales engagement intensity, and the convergence points being served are all different.

What a Salesforce opportunity confirms is that the AE has recognized a qualified evaluation in progress and logged it. What it does not confirm is that the buying group's internal alignment is complete, that all required roles have been identified and engaged, or that the Champion's position is secure. Opportunity creation is a seller signal, not a buyer signal. A program that assumes convergence is near simply because an opportunity was created will serve some qualified accounts appropriately and serve others content that is far ahead of where their buying group actually is.

The misassignment risk is the most consequential operational risk in the qualified stage. Assigning a Stage 2 or Stage 3 account to the win-now treatment — which serves executive buy-in content and AE-owned high-touch sequences intended for late-stage commitment — signals premature urgency to a buying group that has not yet reached Business Value Alignment. That premature urgency can trigger a buying group loop-back: an Economic Buyer who receives materials framed for a decision they haven't made yet may disengage, slow down the evaluation, or ask the Champion to reset the timeline. The program's conservative fallback — all qualified accounts receive progression early-to-mature treatment until Salesforce opportunity stage is confirmed via the data pipeline — is correct. The upside of correctly treating a win-now account as early-to-mature is a slight delay in reaching the right activation level. The downside of treating an early-to-mature account as win-now is a damaged deal. The conservative fallback accepts the first risk to eliminate the second.

The phase character is converge throughout qualified. Progression early-to-mature accounts are completing convergence points in the middle of the buying journey — Solution Validation and Business Value Alignment. Progression win-now accounts are completing the final convergence points — Risk & Compliance Validation and Final Commitment. The diverge phase within the qualified stage is effectively complete for win-now accounts.

---

### 1.6 Stage Progression Is Not Linear

Accounts move forward through stages, but they do not always move in a straight line and they do not stay at a higher stage once they reach it automatically. Stage re-evaluation is continuous — the stage updates when underlying conditions change, not on a schedule. The rolling windows that govern stage transitions mean that signals decay. An account whose identified contacts have stopped engaging with kalder.com will see its engagement signal count fall as events age out of the 180-day window. Its stage attribute may remain technically current, but its behavioral pattern will increasingly resemble a targeted account. Practitioners who notice this pattern — a nominally engaged or prioritized account whose contacts have gone quiet — should treat it as a signal that the buying group's situation has changed, not as stale data.

The double-diamond model can also recurse within a stage. A buying group that fails to clear a convergence point — Problem Validation stalls because the Economic Buyer is disengaged, or Requirements Framing stalls because the Champion and Influencer disagree on evaluation criteria — may return to diverge-phase content consumption patterns without technically changing stages. The account remains prioritized in the program's records while the buying group's behavior looks more like engaged. This is not a data anomaly; it is the normal pattern of real enterprise evaluations, which rarely advance cleanly and often revisit earlier-phase behavior at a later stage. Section 3 specifies the double-diamond mechanics that govern these phase regressions within stages. Content practitioners and AEs should respond to what the behavioral signals are showing, not to what the stage label suggests should be happening.

Stage velocity — the time between stage entry and stage exit — is a meaningful program metric that Document 7 (Measurement and Experimentation Framework) will specify in full. What matters here is that convergence points are not binary events: a buying group does not arrive at prioritized at 9:00 AM and exit to qualified by 3:00 PM. Groups spend time in the approach to each convergence point, and the time spent is informative. A program designed only to detect stage transitions will miss the signal that a buying group is stalled in the approach to a transition it should have already made.

---

*End of Section 1. Section 3 specifies the double-diamond diverge/converge mechanics and their relationship to the stage model. Section 3 specifies the stage and convergence point data model. Section 5 specifies each convergence point in practitioner-facing detail. Document 3, Section 2 contains the full operational stage definitions, AEP entry conditions, and stage transition logic that this section describes in strategic terms.*

---

## Section 3: The Double-Diamond Phase Structure

---

### 2.1 The Shape of the Double-Diamond

Within every buying group stage, there is an internal structure. The buying group does not enter a stage in a state of shared alignment and then advance. They enter in a state of distributed individual uncertainty, and they must work through that uncertainty — each role conducting its own evaluation — before the group can arrive at a shared position and move forward. This internal arc is the double-diamond.

The first half of the diamond is the diverge phase. Each role in the buying group is independently pursuing the evaluation tasks specific to their function. The Champion is building requirements and gathering peer validation. The Economic Buyer is sizing the problem in business and financial terms. The Influencer is assessing technical and integration fit from their domain perspective. The User is evaluating whether the solution will actually work for the people who use it every day. The Ratifier — when they appear — is reviewing compliance posture and procurement permissibility. These are genuinely different evaluation jobs, and the people doing them are not, in most cases, coordinating tightly with each other while they do them. The Champion may know the Economic Buyer has "taken a look" at some content a colleague forwarded. The Influencer is probably not asking the Champion what the requirements document says before they begin their technical assessment. Each role is building their own position. Diverge is individual.

The second half of the diamond is the converge phase. Having completed their individual evaluation work, the buying group orients toward a shared position at a specific milestone — the convergence point. This coordination happens inside the buying organization, through internal conversations, shared documents, and meetings the program can never observe directly. The convergence point is the target; the converge phase is the approach. Converge is collective.

The shape is a diamond because a single stage is not a straight line. The stage begins with each role's individual evaluation paths fanning outward — more content being consumed, more signal accumulating, more distinct evaluation agendas running in parallel. Then the paths narrow as the group works toward alignment at the convergence point. The diamond closes at the convergence point. Then it opens again at the next stage, and the pattern repeats. In practice, the model is less tidy than two clean diamonds suggest. Buying groups stall, recurse, and change composition. A convergence attempt that fails returns the group to diverge-phase patterns within the same stage. The double-diamond is a useful model precisely because it names the two modes of buying group activity — individual and collective — and helps the program understand what it needs to serve at each.

This section specifies the internal architecture of each phase: what the program serves, through what delivery mechanism, and why the design is what it is. Section 2 described the four stages that contain this structure. Section 5 describes the six convergence points that terminate the converge phase at each stage. This section connects them.

---

### 2.2 The Diverge Phase: What It Is and What the Program Does

From the buyer's vantage point, the diverge phase is a period of active individual research. Each role is asking the questions that only they can answer about this evaluation. The Champion is asking: can I build a credible internal case for this? What proof points will hold up in front of my EB? The Economic Buyer is asking: does the return on this investment justify the organizational cost? The Influencer is asking: will this actually integrate with our systems, and what will the implementation burden look like for my team? The User is asking: will I be able to do my job better with this, or is this going to create more friction than it removes? The Ratifier is asking: can we purchase this without creating regulatory or procurement risk? These are real jobs — not abstracted personas — and they require substantively different content to advance.

The program's job in the diverge phase is to serve each role the content that advances their specific evaluation tasks at the current buying stage. The roles that have been classified with sufficient confidence receive role-specific content modules matched to their stage and, when buying job inference is established, to their specific evaluation task. When buying job inference is unknown, the PROBABLE_JOB_PRIORS table governs content selection, providing a statistically grounded default for what a role at a given stage is most likely working on. [Cross-reference: Document 2, Section 7.4; data model PROBABLE_JOB_PRIORS table.] Adobe Target is the delivery mechanism for all diverge-phase content. Each contact is evaluated individually at session start — their role classification, their confidence tier, their solution category context — and served the content that best matches their current state.

This per-visitor, per-session evaluation is precisely matched to the diverge phase's fundamental character: individual people doing individual work. Adobe Target's design — matching one visitor to one content experience per session — is not a limitation the program works around; it is the right architecture for a phase where every role has a different evaluation job to do.

The one constraint that applies across all role variants in the diverge phase is the through-line. All role-specific content modules for the same solution category and buying stage pair must build from the same core solution claim and the same strategic message orientation, both of which are established in the governing Narrative node that every module in that pair references. [Cross-reference: Document 4, Section 4.] This constraint exists not for editorial consistency but because of what happens when the group converges. When the Champion sits down with the Economic Buyer to present a business case, and the Influencer's technical assessment is shared in the same meeting, and the User's workflow validation comes up in the discussion — every one of those inputs was shaped by the content the program served. If the Champion's diverge content positioned Kalder as a platform for IT-owned automation while the Economic Buyer's diverge content framed it as a business team self-service tool, the group would be trying to align around two different vendors. The through-line is what makes the individual evaluation inputs coherent when they eventually have to add up to a shared position.

The permitted divergence within the through-line is substantial. Role variants may differ substantially in how they frame the problem, which proof points they surface, how technical their vocabulary is, and what action they invite the visitor to take next. What they may not differ on is the core solution claim and the thematic emphasis that the Narrative node establishes. The constraint is narrow; the creative space above it is wide.

---

### 2.3 The Shift from Diverge to Converge: What Triggers It

The shift from diverge to converge does not happen at a specific moment the program can identify and act on in real time. It is a gradual transition — a change in the buying group's behavioral character that becomes visible over a compressed window of days or weeks, not a discrete event that triggers a program state change. Understanding what the shift looks like in observable signals is the foundation of the program's ability to respond intelligently.

Several behavioral patterns, when they appear together within a 14 to 30 day window, indicate that a buying group is entering the converge phase at a given stage. The first is rising signal density across multiple roles at the same account within a compressed timeframe — when more than one contact at an account is engaging with role-relevant content in the same period, the evaluation is beginning to coordinate, not just accumulate independently. The second is buying job inference shifting toward later-stage tasks — a Champion whose content consumption had been signaling solution exploration beginning to access requirements-building and supplier-selection content, or an Influencer shifting from breadth-first category browsing to depth-within-one-solution technical documentation. The third, and most specific, is the Champion beginning to access content that suggests they are preparing to coordinate the group rather than advance their own individual evaluation: executive brief access, content types typically consumed by other roles (an ROI calculator accessed by a Champion-classified contact often signals they are building a business case to bring to an Economic Buyer, not evaluating ROI for their own purposes), or content explicitly designed for distribution rather than individual consumption.

These signals indicate that the program should make converge-eligible content available to the Champion through Kalder Compose — the separate delivery surface through which Champions access group coordination content. This preparation should precede the convergence point alert that fires when the program determines the buying group is approaching a convergence point; by the time an alert fires, the Champion should already have the instruments they need to begin coordinating.

Critically: when these signals appear, the program does not change what it serves to individual contacts via Adobe Target. Diverge-phase content continues to be evaluated and served to every contact who visits kalder.com throughout the converge phase. The converge phase does not suppress diverge-phase serving — it adds the Champion's group coordination layer on top of individual serving. The two delivery mechanisms operate simultaneously, addressing different visitors through different paths.

---

### 2.4 The Converge Phase: What It Is and What the Program Does

From inside the buying organization, the converge phase looks nothing like what kalder.com can observe. The Champion is assembling what each role found during their individual evaluation — synthesizing technical validation from the Influencer, workflow assessment from the User, business case elements from their own research — and working to produce a shared position the group can align around. This synthesis happens through internal emails, shared documents, and meetings. The program's window onto this activity is narrow: it sees the effects, not the process. When the Economic Buyer arrives on kalder.com without a traceable referral path, landing directly on the ROI calculator or an executive brief, the most likely explanation is that a Champion forwarded a link. The program is observing the downstream effect of internal coordination it cannot directly see.

The content that serves this phase is different in kind, not just in depth. A consensus brief is not a more advanced version of the Champion's role-specific case study collection. It is a different artifact designed for a different purpose: to give the buying group a shared document that represents what all required roles found during their individual evaluations and brings those findings together around a common position. The Champion distributes a consensus brief because they need a way to give the Influencer's technical findings and the User's workflow assessment and the economic case they've built a single coherent form that the whole group can read together. A case study cannot do that. The consensus brief is what the case study was building toward.

The executive brief serves a narrower version of the same function: it synthesizes the business case and risk framing specifically for the Economic Buyer and Ratifier at later-stage convergence points where financial authorization and governance clearance are what remain. The Champion distributes it not to inform the whole group but to equip the specific roles whose sign-off is required.

Both content types travel internally via Champion distribution — through email, shared document systems, or internal messaging — not through Adobe Target. Serving a consensus brief through Adobe Target would mean delivering group alignment content to an individual visitor on kalder.com, which is precisely the wrong audience for a document designed to be read collectively. Adobe Target and Kalder Compose are architecturally separate delivery mechanisms. Adobe Target evaluates individual session contexts and serves individual content experiences. Kalder Compose is the interface through which Champions access, and can provide context to generate, group coordination content. They do not share a serving path, and converge-phase content is never present in the Adobe Target offer catalog. [Cross-reference: Document 4, Section 8.3.2 Phase 4 for the sync pipeline enforcement; Document 4, Section 6 for converge content generation prerequisites.]

An important corollary: the converge phase does not mean all contacts at the account are in converge. When a Ratifier arrives on kalder.com for the first time during a group's Risk & Compliance Validation converge phase, the Ratifier is beginning their own individual evaluation — they are, for them, in diverge. The program serves them diverge-phase Ratifier content via Adobe Target, because that is exactly right: they are an individual who has just arrived and needs to complete their own evaluation tasks. The converge phase describes what the Champion is doing, not the uniform experience of every contact at the account.

---

### 2.5 How the Double-Diamond Repeats Across Stages

The double-diamond is not a single pattern that the buying group completes once. It repeats at each stage. At targeted, the group is in problem-identification diverge — each role, to the extent the group exists at all, is asking whether this problem category is real and worth solving. At engaged, the group is in solution-exploration diverge, transitioning toward the early converge work that produces Problem Validation and Requirements Framing. At prioritized, the group is primarily in converge, completing solution validation and approaching Business Value Alignment. At qualified, the group is in converge through the final convergence points — Risk & Compliance Validation and Final Commitment — completing the alignment work that makes a signed agreement possible.

What changes across each repetition is not just the content types but the stakes. A buying group that fails to clear Problem Validation returns to diverge-phase content patterns and takes a partial-reset loop-back — the evaluation resets a few steps but does not collapse. A buying group that fails to clear Risk & Compliance Validation may take a full-reset loop-back, returning to an earlier stage after Champion and Economic Buyer have already invested months of evaluation work. The severity of a failed convergence attempt increases as the journey advances, which means the quality of converge-enabling content at later stages matters more, not less. [Cross-reference: Section 5 for named loop-back severity by convergence point.]

When a buying group fails to clear a convergence point, its behavioral signals on kalder.com begin to shift back toward diverge-phase patterns within the same stage. Individual role evaluation resumes. Signal density across the account drops. Content consumption returns to earlier-stage patterns. The account's stage does not technically regress — it remains at the stage that produced the convergence point alert — but the buying group's behavior looks like an earlier phase within that stage. The program's response is not a state change, because no state change is required: Adobe Target has been serving diverge-phase content to individual contacts throughout the converge phase, and it continues to do so. Kalder Compose's converge content becomes less relevant during a phase regression, because the Champion is no longer actively coordinating a group that is ready to align. Practitioners and AEs should respond to what the behavioral signals show, not to what the stage label implies about where the group should be.

The content inventory implication of the double-diamond's repetition is significant. Because the pattern repeats at each stage, the program needs diverge-phase content for each role at each stage — the primary content production demand — and converge-phase content (consensus briefs and executive briefs) for each solution category and buying stage pair where a convergence point is the phase terminus. A content director reading this section should understand that diverge-phase content across all stages is not the full production scope. It is the larger part of the scope, but it does not address what Champions need when they are in coordinator mode. Both phases at every stage require planned content investment. [Cross-reference: Document 4, Section 6 for generation prerequisites per convergence point.]

---

### 2.6 The Phase Annotation in Practice

Every Content Module node in the Sanity content graph carries a phase field that declares whether the module serves the diverge phase or the converge phase. This is not a routing tag added after content is authored — it is a design statement made at authoring time about how the content will be used and by whom. The field makes explicit the distinction this section has argued for: some content is for individual visitors doing individual evaluation; some content is for Champions coordinating a group. Those are different products serving different purposes through different channels.

The practical test for content authors requires no understanding of the underlying data model. If this module will appear on kalder.com as a served experience — if a visitor will encounter it as they navigate the site — it is diverge. If it will travel internally within the buying organization via a Champion — as an email attachment, a shared document, or material the Champion presents in an internal meeting — it is converge. A module cannot be both. If a content author is uncertain which applies, the question to ask is: who reads this content, and where? An individual visitor on kalder.com, or a buying group receiving a Champion's synthesis? The answer resolves the phase classification.

The enforcement of this classification is structural. Converge-phase Content Module nodes are excluded from the Adobe Target offer catalog before the sync pipeline writes any offer. The exclusion runs synchronously as a pre-write check; a converge-phase node never appears in the catalog under any configuration state. Platform engineers implementing the sync pipeline own this enforcement; the full specification is in Document 4, Section 8.3.2 and Document 8. Content authors and content strategists who understand the logic of the double-diamond should not need to understand the mechanism to comply with it: content designed for Champion distribution does not belong in an individually served web experience, and the enforcement exists to make that design intent machine-verifiable rather than solely editorially enforced.

---

*End of Section 2. The stage and convergence point data model entities are specified in `kalder_data_model.py` (§17 JTBD_CODES, §18 BUYING_GROUP_CONVERGENCE_POINTS); Section 3 develops their phase-structure application in practitioner terms. Section 5 specifies each convergence point in practitioner-facing detail, including the observable entry and exit criteria that correspond to the phase transitions described in this section.*

---

## Section 4: Progressive Disclosure UX Specification

---

### 3.1 Architectural Constraints and Non-Negotiables

Before any content is authored, any offer is commissioned, or any Target activity is configured for the `progressive_disclosure` module type, the following architectural constraints govern all three prompt variants without exception.

**Level 1 is actively suppressed.** The `progressive_disclosure` slot does not render at Level 1 because the slot is architecturally turned off at that level, not because no content has been commissioned. This distinction is material for platform engineers: a commissioning team that creates Level 1 `progressive_disclosure` content in Sanity will not cause that content to appear for HIGH-confidence visitors. The suppression is enforced at the Target activity layer, not by offer catalog absence. Engineers must not interpret a Level 1 slot as "empty and waiting for content." [Document 5, Section 3.11]

**Level 5 is not rendered; the holdback constraint is inviolable.** Holdback visitors receive the Level 5 default brand experience and therefore never encounter a `progressive_disclosure` prompt variant in any form. This is an architectural enforcement requirement, not a content production convention. The Target activity configuration must suppress the `progressive_disclosure` slot entirely for any visitor whose `holdback_group` attribute equals `True`, regardless of what appears in the offer catalog. No Level 5 `progressive_disclosure` offer should be commissioned, and no Target configuration should allow a holdback visitor to receive any prompt variant. This constraint exists to protect measurement integrity: if holdback visitors could receive progressive disclosure prompts, they could produce zero-party classifications that alter their buying job confidence state, destroying the clean control condition the holdback group is designed to maintain. [Document 5, Sections 2.6 and 7.7]

**The module's `intended_axes` are `[confidence_tier, solution_category]`.** The `progressive_disclosure` prompt does not vary by role or buying stage. It varies by confidence tier (which determines which of the three prompt variants fires) and by solution category (which determines which solution-specific framing is used within a given variant). Role is excluded from `intended_axes` because the module is displayed precisely when role is unknown or unconfirmed; varying by role would require the module to know what it is attempting to discover. Buying stage is excluded because the invitation to self-identify is stage-neutral. [Document 4, Section 5.3]

**The `confidence_tier_minimum` is `UNKNOWN`.** The `progressive_disclosure` slot carries no minimum confidence gate at the module level. Any TAL-identified visitor regardless of classification state may encounter this slot. The variant served is determined by the visitor's fallback level, not by a confidence floor in the offer matching layer. This is the correct design: the slot is specifically intended for visitors at UNKNOWN, LOW, and MEDIUM confidence states. [Document 4, Section 5.3; Document 5, Section 3.11]

**The Ratifier null-prior exception.** The `progressive_disclosure` Level 3 prompt must not be designed to produce a JTBD classification for a Ratifier visitor at `targeted` or `engaged` buying stages. [Document 5, Section 2.5] At these stages, `PROBABLE_JOB_PRIORS` returns `None` for the Ratifier role because Ratifiers are not engaged in active buying-job execution at early stages; asking them to declare a buying job would be premature and potentially confusing. The correct application of this constraint to prompt design: if the trigger conditions for Level 3 are met and the visitor's behavioral pattern suggests Ratifier, the Ratifier role must appear as a self-identification option in the prompt — a Ratifier doing background research may genuinely benefit from self-identifying. However, the prompt as designed must not be structured as a buying-job-resolution mechanism. It is a role-identification prompt; role and buying job are different things. A Ratifier who responds to the Level 3 role identification prompt helps the program serve them better regardless of whether a JTBD prior is subsequently available. The prompt must not include buying job response options or use buying-job framing that only makes sense if the visitor is in an active evaluation task.

---

### 3.2 Value Exchange Design Principles

Low-quality progressive disclosure prompts produce low response rates and biased samples. A visitor who ignores or dismisses the prompt produces no classification signal, while visitors who do respond may be systematically different from those who do not — skewing the resulting zero-party data. The three value exchange principles below govern all variants and must be applied before any copy standard in Sections 3.3 through 3.5 is implemented.

**Principle 1 — Immediate and visible.** The value the visitor receives for responding must be stated in the prompt, not implied. "Get a more relevant experience" fails this test. "See [solution category]-specific resources matched to your evaluation role, starting on your next page" passes it. For each prompt variant, the copy standard must describe what changes or appears after the visitor responds, specifically enough that a visitor reading only the value statement knows what to expect. A general promise of relevance improvement does not meet this standard. The specific next experience does.

**Principle 2 — Recognition, not surveillance.** Prompts may reference behavioral signals to frame context (for example, "it looks like you're exploring [solution area]"), but they must never reference IP-based account identification, prior session observations stated as observations, or firmographic data such as company name, company size, or industry vertical resolved via Demandbase. The distinction: "You've been exploring IT operations content" is surveillance framing — it tells the visitor the program has been watching them. "Since you're exploring IT operations" is recognition framing — it acknowledges where the visitor is in the moment. All copy standards in Sections 3.3 through 3.5 must produce prompts that feel like professional recognition based on current context, not the experience of being profiled. [Document 9, Track 1 LIA constraint]

**Principle 3 — Lower commitment at lower confidence.** The three variants must form a coherent commitment gradient. Level 4 asks the least: a broad evaluation context signal, using short prompt copy, with broad response options. Level 3 asks more: explicit role self-identification, with five role options and a brief solution-area frame. Level 2 asks the least of the three in terms of decision burden because the hard work has been done — the system presents an inferred role and asks for confirmation or a single-step correction, which is cognitively lighter than choosing among five unfamiliar options. Prompt length, number of response options, and specificity of the question must all reflect this gradient. A Level 4 prompt that reads like a form, or a Level 3 prompt shorter than a Level 4 prompt, violates this principle.

---

### 3.3 Level 2: Role Confirmation Prompt Specification

The Level 2 variant activates when `confidence_tier = MEDIUM` and the visitor is TAL-identified at Layer 1 or Layer 3.

**Trigger conditions:**

| Attribute | Required Value |
|---|---|
| `confidence_tier` | `MEDIUM` |
| `tal_member` | `true` |
| `solution_category` | Present (resolved via URL space or `tal_solution_interest_flags`) |
| `role_classification` | Present (MEDIUM confidence role inferred via Tier 3 behavioral scoring) |

**Non-render condition.** A HIGH-confidence visitor in a pending solution category routes to Level 3 under `pending_solution_fallback`, not Level 2. The Level 2 prompt does not render for this visitor even though their underlying `confidence_tier` is `HIGH`. Their fallback level is 3; the `progressive_disclosure` module serves the Level 3 variant. [Document 5, Section 10.5]

**Prompt framing standard.** The Level 2 prompt presents the visitor's inferred role using recognition framing and invites confirmation. The copy must include all four of the following elements, in this functional order:

1. A brief context acknowledgment using solution-category framing, stated as current context not observed history. Required. Example form: "Since you're exploring [solution area display name]..."
2. A role inference statement using the visitor's inferred role display label (see Role Display Labels table below). The inference must be presented as a helpful observation, not a declaration. Required. Canonical form: "...it looks like you might be approaching this as [role display label]."
3. A value exchange statement describing what the visitor receives immediately upon confirming. Must name the specific content type or experience change, not a generic relevance promise. Required. Example form: "Confirm and we'll surface [role-specific content type] tailored to your evaluation focus."
4. Two CTAs: one confirmation action and one correction path. Both required. Confirmation CTA copy must be active and specific (e.g., "Yes, that's right" or "That fits"). Correction CTA copy must be low-friction (e.g., "Not quite — let me pick my role").

Content authors must not deviate from this functional structure. They may vary vocabulary and tone within each element. They must not reorder elements or omit any element.

**Role display labels.** The following human-readable labels must be used in all prompt copy across Levels 2, 3, and 4. System-level role keys (`champion`, `economic_buyer`) must not appear in visitor-facing copy.

| System key | Visitor-facing display label | Rationale |
|---|---|---|
| `champion` | **Evaluation Lead** | "Champion" is an internal program term; most self-aware champions describe their function as leading or driving the evaluation, not as being a champion. "Evaluation Lead" is both recognizable and accurate to the role's function. |
| `economic_buyer` | **Executive Sponsor / Budget Owner** | "Economic Buyer" is a sales methodology term unknown to most buyers. "Executive Sponsor / Budget Owner" maps to how this role is actually described in enterprise organizations. Dual-label acknowledges that the same function can carry different titles. |
| `influencer` | **Technical or Functional Evaluator** | "Influencer" has a consumer connotation that conflicts with B2B professional self-perception. "Technical or Functional Evaluator" describes what this role does: shapes requirements based on domain expertise. |
| `user` | **Day-to-Day User / Practitioner** | "User" is generic and slightly clinical. "Day-to-Day User / Practitioner" signals who this label is for: the person who will live with the product after purchase. |
| `ratifier` | **Procurement, Legal, or Compliance** | "Ratifier" is entirely internal and will not produce accurate self-identification. "Procurement, Legal, or Compliance" maps directly to the job functions that perform the ratification role in enterprise buying groups. [Per Heuer He-1 guidance: role labels must reflect how B2B professionals self-describe.] |

**Confirmation mechanics.**

When the visitor selects the confirmation CTA:
- **(a)** The zero-party attribute `role_classification_zero_party` is written to the visitor's AEP contact profile with the confirmed role key and a current timestamp.
- **(b)** This initiates the Tier 2 zero-party classification path: zero-party declaration plus existing behavioral confirmation produces HIGH confidence when behavioral signals are consistent with the declared role. [Document 2, Section 9.4]
- **(c)** The immediate experience change is: the next page the visitor navigates to serves a Level 1 or Level 2 experience appropriate to the visitor's now-Tier-2-confirmed role, subject to solution category coverage status. For pending or constructed categories, the classification is stored and the experience upgrades when coverage advances. The visitor should see a brief inline acknowledgment at the prompt location (e.g., "Got it — we'll tailor what you see to your role as Evaluation Lead") before they navigate.

**Correction mechanics.**

When the visitor selects the correction CTA ("Not quite — let me pick my role"):
- **(a)** The prompt expands in-place to show all five role options using the display labels from the table above, plus a "None of these match" option.
- **(b)** The visitor selects from all five roles; no subset is filtered. The visitor may be any role, including Ratifier, and all five options must be presented without reordering or hiding.
- **(c)** The visitor selects their correct role. The selected role key is written to `role_classification_zero_party` with a current timestamp. The same Tier 2 classification path initiates as in the confirmation case.
- **(d)** Reclassification takes effect at the next page navigation, not at the next session start. This is the synchronous write requirement from Section 3.7.
- **(e)** "None of these match" writes a `role_identification_declined` flag to the visitor's AEP profile and closes the prompt. No reclassification attempt is made. The visitor's existing behavioral classification remains.

The correction path must complete in two interaction steps maximum: the initial correction tap plus a single role selection. No additional confirmation screen, no form, no intermediate state. [Per Albee Al-3 requirement: two taps maximum to arrive at correct role.]

**Placement.** The Level 2 `progressive_disclosure` slot appears between the `narrative` module and the `cta` module in the Level 2 page template. In the full Level 2 template (`hero`, `benefits`, `narrative`, `progressive_disclosure`, `cta`, `trust_signals`, and optionally `gated_assets`, `proof`, `use_cases`, `outcomes`), this placement positions the prompt after the visitor has engaged with role-specific content and before the primary conversion element. This is mid-page positioning by design.

---

### 3.4 Level 3: Role Identification Prompt Specification

The Level 3 variant activates when the visitor is TAL-identified with a solution-category interest signal present, but role confidence is LOW or UNKNOWN.

**Trigger conditions:**

| Attribute | Required Value |
|---|---|
| `confidence_tier` | `LOW` or `UNKNOWN` |
| `tal_member` | `true` |
| `solution_category` signal | Present and above sub-threshold (sufficient for Level 3 routing) |
| `role_classification` | Absent or below MEDIUM |

Note: A HIGH-confidence visitor in a pending solution category who routes to Level 3 under `pending_solution_fallback` also receives the Level 3 variant. The prompt they see is identical to any other Level 3 prompt. The underlying incongruity (HIGH-confidence visitor receiving a "who are you?" prompt) is intentional and correct: the visitor's Tier 2 confirmation is stored immediately and becomes actionable when coverage advances. [Document 5, Section 10.5]

**Prompt framing standard.** No role is assumed. The prompt invites self-identification. The copy must include all three of the following elements:

1. A solution-area context frame that acknowledges what the visitor is exploring. Required when a solution-category signal is present; optional as a fallback phrase when the signal is marginal. Required standard form: "Since you're exploring [solution area display name]..." — where [solution area display name] uses the human-readable category names defined below. If the solution signal is present but weak (sub-threshold), the fallback form is acceptable: "As you explore Kalder's solutions..." — this avoids false specificity when category inference is uncertain.
2. An invitation to self-identify with a specific value exchange statement. The invitation must state what the visitor will see after identifying themselves. Required. Standard form: "...tell us how you're approaching this evaluation and we'll point you to the resources most relevant to your role." The value exchange must name a content type or experience outcome, not a general relevance promise. Acceptable: "role-specific guides, case studies, and evaluation resources." Not acceptable: "a better, more personalized experience."
3. A response option set presenting all five roles using display labels from the Role Display Labels table in Section 3.3.

**Solution area display names for prompt framing:**

| Solution category key | Prompt display name |
|---|---|
| `it_operations` | IT Operations |
| `customer_engagement` | Customer Engagement |
| `employee_experience` | Employee Experience |
| `risk_compliance` | Risk & Compliance |
| `ai_platform` | AI Platform |

**Response option design.** Present all five role display labels from the Section 3.3 table as a button set or equivalent single-select UI element. Recommended display order: Evaluation Lead → Executive Sponsor / Budget Owner → Technical or Functional Evaluator → Day-to-Day User / Practitioner → Procurement, Legal, or Compliance. This ordering places the two highest-frequency roles at the top and the late-stage governance role last. A "Not sure yet" option must be included as a sixth option. "Not sure yet" writes a `role_identification_deferred` flag to AEP and does not initiate a classification — it is a valid signal that the visitor has not yet formed a role identity in this evaluation context. The deferred flag informs prompt timing logic; the visitor is not treated as a dead end and may receive the prompt again after additional behavioral accumulation.

**Response handling.** When the visitor selects a role:
- **(a)** The selected role key is written to `role_classification_zero_party` in the visitor's AEP contact profile with a current timestamp.
- **(b)** The Tier 2 zero-party classification path initiates. [Document 2, Section 9.4]
- **(c)** The immediate experience change: the visitor sees an inline acknowledgment at the prompt location, and the next page they navigate to serves role-appropriate content at the depth permitted by the visitor's confidence state and coverage status.

**The Ratifier exception — explicit statement.** The Level 3 prompt is not designed to resolve the Ratifier null JTBD prior at `targeted` or `engaged` buying stages. It is designed to allow role self-identification for any visitor, including a Ratifier conducting background research. The Ratifier role option ("Procurement, Legal, or Compliance") must appear in the Level 3 response set without suppression. A Ratifier who responds helps the program serve them better regardless of whether a JTBD prior is subsequently available for their stage. The prompt must not include response options framed around active buying tasks (e.g., "I'm evaluating security controls for a procurement decision") — that is buying-job framing, which is out of scope for this module. [Document 5, Section 2.5]

**Placement.** The Level 3 `progressive_disclosure` slot appears in the Level 3 page template between the `narrative` module and the `cta` module, consistent with the mid-page intent that positions the prompt after initial credibility content and before conversion elements.

---

### 3.5 Level 4: TAL-Context Invitation Specification

The Level 4 variant is the primary conversion mechanism for unclassified TAL contacts. It is the most consequential of the three variants because it is the only zero-party collection mechanism on a page where the visitor has no prior classified role and may have seen very little Kalder content. It is specified in maximum detail.

**Trigger conditions:**

| Attribute | Required Value |
|---|---|
| `tal_member` | `true` |
| `confidence_tier` | `UNKNOWN` or below Level 3 sub-threshold |
| Solution signal (Level 3 routing) | Absent or insufficient for Level 3 routing |
| Fallback level | 4 (TAL-identified, no sufficient classification for Level 3) |

When `tal_solution_interest_flags` is populated (the visitor has engaged with content in a solution category URL space, even at sub-Level-3 signal strength), the solution-category-aware prompt framing applies. When no solution signal is present at all, the cross-category brand prompt applies.

**Solution-category-aware framing.** When a solution signal is present in `tal_solution_interest_flags`, the prompt uses that signal to frame the invitation. The following copy standards apply per solution category. Each standard specifies: opening line, evaluation context invitation, and what the visitor receives immediately upon responding.

| Solution category | Opening line | Evaluation context invitation | Value on response |
|---|---|---|---|
| `it_operations` | "You've been looking at IT operations solutions." | "Tell us how your team approaches IT improvement and we'll show you what's most relevant." | Role-specific IT operations resources, including implementation guides, ROI frameworks, and peer customer stories matched to your evaluation focus — displayed on your next page. |
| `customer_engagement` | "You've been exploring customer engagement solutions." | "Tell us how you're involved in evaluating this area and we'll tailor what you see." | Role-specific customer engagement content — evaluation guides, customer outcome stories, and solution briefs matched to your role — displayed on your next page. |
| `employee_experience` | "You've been looking at employee experience solutions." | "Help us understand your evaluation focus and we'll show you the most relevant resources." | Role-specific employee experience guides, use case examples, and implementation content matched to your evaluation role — displayed on your next page. |
| `risk_compliance` | "You've been exploring risk and compliance solutions." | "Tell us how you're involved in this evaluation and we'll surface the most relevant resources." | Role-specific risk and compliance content — governance guides, security documentation, and procurement-ready materials — displayed on your next page. |
| `ai_platform` | "You've been exploring the Kalder AI Platform." | "Tell us how you're approaching AI evaluation and we'll tailor the content you see." | Role-specific AI platform resources — technical guides, business case frameworks, and evaluation content matched to your role — displayed on your next page. |

The opening lines above use present-context behavioral framing ("You've been looking at..."). This is recognition framing, not surveillance framing: it references the visitor's current on-site exploration, not their company identity or any personally identifying data. Content authors must not modify this framing to reference session specifics, prior visit counts, or firmographic data. [Principle 2, Section 3.2; Garcia Ga-1 and Ga-2 constraints]

**Cross-category fallback framing.** When no solution signal is available (visitor arrives at the homepage or navigates without accumulating any `tal_solution_interest_flags`), the prompt uses brand-level framing:

- **Opening line:** "Welcome to Kalder. We build enterprise software for the way modern teams actually work."
- **Invitation:** "What brings you here today? Tell us a bit about your focus and we'll point you to what matters most."
- **Response options:** The five evaluation context options below (see Response Option Design).
- **Value on response:** "We'll customize what you see starting on your next page."

The cross-category prompt must feel like a warm, professional opening question — not a form, not a survey. The tone is that of a knowledgeable colleague asking a good first question, not a gating mechanism requiring an answer before content is accessible.

**Response option design.** Level 4 response options must balance signal value against accessibility. The recommended approach is hybrid framing: options that describe evaluation context in plain language that maps to role classifications internally, without requiring the visitor to use role labels they may not recognize.

| Response option (visitor-facing) | Classification output |
|---|---|
| I'm evaluating this for my team or organization | Writes `evaluation_context: champion_candidate` to AEP |
| I need to understand business value and ROI | Writes `evaluation_context: economic_buyer_candidate` to AEP |
| I'm assessing technical or functional fit | Writes `evaluation_context: influencer_candidate` to AEP |
| I'd be using this day to day | Writes `evaluation_context: user_candidate` to AEP |
| I'm reviewing from a compliance or procurement standpoint | Writes `evaluation_context: ratifier_candidate` to AEP |
| Just exploring for now | Writes `evaluation_context: early_research` to AEP; no role signal produced |

The `evaluation_context` attribute values are classification candidates, not confirmed role assignments. The pipeline treats them as strong directional signals that initialize role scoring in the appropriate direction, but they do not directly produce a `role_classification` value. Tier 2 HIGH confidence still requires a direct role declaration (Level 2 or Level 3 prompt response) plus behavioral confirmation. The Level 4 response initiates that journey; it does not complete it.

"Just exploring for now" must not be a dead end. It writes an `evaluation_context: early_research` signal that the pipeline uses to prioritize early-stage, high-breadth content and to understand that this visitor has not yet formed a specific evaluation intent. This is a useful and actionable signal; a visitor who selects this option is correctly characterized as an early-stage research visitor, which informs both content selection and the timing of future progressive disclosure prompts.

**Value exchange for Level 4.** The Level 4 visitor has seen the least Kalder content of any prompt variant recipient. The value exchange cannot reference "more relevant content than what you've been seeing" — there is no established prior experience to improve on. The value exchange must be framed as "here's what you'll see next" rather than "here's what we'll change." Content authors must not use comparison language ("more relevant," "better matched," "personalized version of") in Level 4 copy. They must use forward-pointing language ("we'll show you," "you'll see," "your next page will include"). [Albee Al-4 constraint]

**Placement.** Position 4 in the six-slot Level 4 page template: after `hero`, `benefits`, `narrative`, and before `cta`. This placement is locked from [Document 5, Section 8.4]. On the home page template, where `narrative` may be absent, position 3 applies. Content authors may not reposition this slot. Platform engineers must not configure the Target activity to serve `progressive_disclosure` content at a different slot position than specified here.

**Commission scope — D8-Flag-07 resolved.** The minimum required Content Module nodes for complete Level 4 `progressive_disclosure` coverage at v1 launch:

- 1 solution-category-specific node per active solution category = **5 nodes** (`it_operations`, `customer_engagement`, `employee_experience`, `risk_compliance`, `ai_platform`)
- 1 cross-category brand prompt node = **1 node**
- **Total minimum: 6 nodes**

The cross-category brand prompt node is **required** at v1, not optional. A Level 4 visitor arriving at the homepage or without solution signal accumulation receives no `progressive_disclosure` prompt if this node is absent — the slot falls through to Level 5: not rendered. This would deactivate the primary conversion mechanism for the highest-volume Level 4 entry path. The cross-category node is a required commissioning deliverable.

**Sales activation signal.** A Level 4 TAL-context invitation response is a contact-level classification event. For an otherwise unclassified TAL contact, it is the first zero-party signal the program receives. When a Level 4 response produces an `evaluation_context` value that maps to a classification candidate (any value other than `early_research`) and the contact meets both gates from [Document 3, Section 6.4] (`confidence_tier` = MEDIUM or HIGH, `differential_insufficient` = False), this response may trigger the Document 3 Section 6.4 Outreach sequence activation pathway. Document 8 owns the full SDR activation mechanics for progressive disclosure responses. Level 4 responses are not purely content personalization events: they are contact-level classification signals with potential sales activation implications. [Miller Mi-1]

---

### 3.6 Measurement and Holdback Constraint

**The holdback constraint is an architectural enforcement requirement.** Level 5 visitors (holdback group) never encounter any `progressive_disclosure` prompt variant. This is not a content production convention that could be bypassed by commissioning a Level 5 `progressive_disclosure` offer. It is an architectural enforcement requirement that must be implemented in Target activity configuration: the `progressive_disclosure` slot must be suppressed for any visitor whose `holdback_group` = `True`, regardless of the offer catalog state. A Level 5 activity with `holdback_group = True` audience conditions must explicitly suppress this slot. Absent that explicit suppression configuration, any commissioning artifact that reaches the offer catalog could theoretically serve to a holdback visitor if the activity priority cascade resolved to a matching offer. The explicit suppression is the protection against that case. [Document 5, Sections 2.6 and 7.7; Kohavi Ko-1]

**Measurement periodization boundary.** During the period before this section's approval, all `progressive_disclosure` commissioning was blocked by the D8-Flag-07 commission block. Classification rates measured during that period will understate the program's classification contribution from this module. The approval date of Document 6 Section 3 is the measurement periodization boundary: lift measurements that compare classification rates must not include pre-approval data in the same analysis window as post-approval data without accounting for the absence of the module. The Analytics team must record this boundary. [Document 5, Section 8.5]

**Differential response rate acknowledgment.** The three variants are expected to produce materially different response rates by design. Level 2 asks for confirmation of an already-inferred state — the lowest cognitive commitment of the three, with the highest expected response rate. Level 3 asks for explicit role selection from five options — higher commitment, lower expected rate. Level 4 asks for evaluation context from a visitor who has seen little content — the lowest-commitment framing but the least established visitor context, producing the lowest expected response rate of the three. This differential is a known design constraint, not a measurement defect. A measurement team that benchmarks Level 4 against Level 2 response rates and diagnoses Level 4 as underperforming is applying the wrong benchmark. Variant-specific response rate baselines should be established in Document 7 (Measurement and Experimentation Framework); this section notes the expectation of differential rates without specifying thresholds. [Kohavi Ko-2]

---

### 3.7 Implementation Notes for Platform Engineers

Three Target configuration requirements are non-negotiable at implementation.

**Requirement 1 — Level 1 active suppression.** Level 1 suppression is an architectural decision that must be enforced in the Target activity configuration as an explicit suppression, not as the absence of commissioned content. The Target activity serving `progressive_disclosure` content must include an explicit audience exclusion for `confidence_tier = HIGH` visitors (or an activity audience condition that structurally prevents HIGH-confidence visitors from qualifying). It must not rely on offer catalog absence to achieve Level 1 suppression — that approach is fragile and will fail if a Level 1 `progressive_disclosure` offer is ever accidentally commissioned in Sanity. The suppression must survive any offer catalog state.

**Requirement 2 — AEP profile attribute read sequence.** For the `progressive_disclosure` module type, the Target activity evaluation order is:

1. Read `confidence_tier` first to determine which variant fires (Level 2 at MEDIUM, Level 3 at LOW/UNKNOWN, Level 4 at account-level fallback).
2. Read `solution_category` second to select the solution-category-specific variant within the active level.
3. At Level 4, if `tal_solution_interest_flags` is populated, use the highest-signal solution category present to select the solution-category-specific node. If `tal_solution_interest_flags` is empty, select the cross-category brand prompt node.

This evaluation order is authoritative. Reversing it (reading `solution_category` before `confidence_tier`) would produce incorrect variant selection for visitors at the boundary between Level 3 and Level 4 routing.

**Requirement 3 — Synchronous zero-party write.** The zero-party declaration written to the AEP contact profile on prompt response must be written synchronously with the response event — not deferred to the next session start. A visitor who responds to the Level 2 confirmation prompt and navigates to the next page must receive an experience reflecting their confirmed role on that next page. A write that defers to the next session would deliver a contradictory experience: the visitor confirmed their role, was shown an acknowledgment, and then encountered content that does not reflect their stated role until the following day.

> **PENDING — Document 8:** If the current AEP event stream architecture cannot support synchronous profile attribute updates within the same session, this requirement must be flagged as a Document 8 PENDING item. The synchronous write is specified as the required behavior; platform engineers must confirm feasibility and document any latency constraints in Document 8 rather than allowing the spec to proceed on an unconfirmed assumption. [Alfonso Af-2]

---

*End of Section 3. Section 5 (Convergence Point Specifications) and the remainder of Document 6 proceed from this foundation. The D8-Flag-07 commission scope question is resolved in Section 3.5: 6 Content Module nodes minimum (5 solution-category-specific plus 1 cross-category) are required for complete Level 4 `progressive_disclosure` coverage at v1 launch. Platform engineers should cross-reference Document 5, Sections 3.11, 8.4, 8.5, and 8.6 for the commission checklist and Target activity specifications that govern this module type. The `progressive_disclosure` commission block in Document 4 Section 8.4 lifts upon council approval of this section.*

---

## Section 5: The Six Convergence Points

---

### 4.1 How to Read This Section

A convergence point is a milestone at which all required buying group roles must reach a shared position before the group can advance. It is not a sales stage and not a marketing funnel gate. The sales team does not create convergence points — buying groups reach them. The distinction matters because the program's job is to detect when a group is approaching a convergence point and equip the seller to act, not to manufacture a milestone that the group hasn't earned.

Each convergence point has Required roles and Supporting roles. Required roles gate the convergence point: the group cannot genuinely pass through it without their participation. A deal that advances without a Required role's buy-in has not cleared the convergence point — it has borrowed time against a loop-back. Supporting roles enrich the convergence without blocking it; their participation improves the quality and durability of the group's alignment but their absence does not prevent the group from advancing. The Role-to-Convergence-Point Matrix, which specifies Required and Supporting designations for all six points across all five roles, is in Document 1, Section 4. It is the authoritative reference; this section does not reproduce it.

Role absence is as informative as role presence. Two absence patterns are named deal-risk signals in the corpus. Economic Buyer absence at Business Value Alignment means the Champion is building a business case without the person who has to approve it — the convergence point cannot be genuinely reached without EB participation, and strong Champion signal alongside zero EB signal is a proactive outreach trigger, not a positive development. User absence at Solution Validation before the group advances to Business Value Alignment is a loop-back risk: groups that pass Solution Validation without User input routinely encounter late-stage friction when the User veto surfaces after Champion and EB have already committed. Both absence patterns have named actions in their respective entries below.

Alerts fire when behavioral signals, classification states, and buying job inference patterns indicate a buying group is approaching a convergence point. The trigger conditions are described in practitioner terms throughout this section; the machine-readable specifications are in `§SA SALES_ACTIVATION_CONFIG` in the data model. An alert means act now — not monitor, not queue for next week. The window during which a well-timed seller intervention at a convergence point has maximum leverage is short. Convergence point velocity — the time between an alert firing and a group clearing (or failing to clear) a convergence point — is a meaningful program metric. Document 7 (Measurement and Experimentation Framework) owns velocity measurement thresholds; this section describes the approach and exit behaviors that bound each convergence point.

The entries below are reference material, not sequential narrative. A BDR or AE should open the entry for the convergence point flagged in their alert and read it cold. The structure is identical across all six entries: Definition, Role Participation, Entry Criteria, Exit Criteria, Common Blockers, Loop-Back Risk, Recommended Seller Actions. For Business Value Alignment and Solution Validation, a Role Absence Alert subsection follows.

Alert routing by cohort: Problem Validation and Requirements Framing alerts go to BDRs managing SDR-owned sequences in the acquisition cohort. Solution Validation, Business Value Alignment, Risk & Compliance Validation, and Final Commitment alerts go to AEs in the progression cohorts. This ownership structure follows the cohort-to-channel mapping in Document 3, Section 6.4 and is stated explicitly in each entry.

---

### 4.2 Problem Validation

#### Definition

Problem Validation is the first convergence point — the moment at which the Champion and Economic Buyer agree that the problem is real, significant, and worth solving. It is not the moment they agree on a solution or even on a solution category. It is earlier than that: it is the internal decision to take the problem seriously enough to fund an evaluation.

This convergence point fails quietly when it is not genuinely reached. A Champion who has already committed to the evaluation continues to drive activity; an Economic Buyer who has not truly validated the problem eventually surfaces as a budget holder with no real investment in the evaluation's outcome. The classic symptom is a deal that stalls at Business Value Alignment when the EB raises concerns that should have been addressed much earlier — because they never actually validated the problem at this stage.

In risk and compliance solution categories, Problem Validation often happens before the Champion arrives. A regulatory event, an audit finding, or a security incident can produce EB-level acknowledgment that a problem exists before anyone has identified a Champion to drive the evaluation. The BDR reading a Risk & Compliance alert for Problem Validation should account for this: the group dynamic may be inverted from the standard pattern.

#### Role Participation

| Role | Participation | Notes |
|---|---|---|
| Champion | R | |
| Economic Buyer | R | |
| Influencer | — | |
| User | — | |
| Ratifier | — | |

*[Cross-reference: Document 1, Section 4 — Role-to-Convergence-Point Matrix]*

The Champion gates this convergence point by having driven the evaluation to the point where the problem is named and the group is forming. At Problem Validation, the Champion is not yet building a full case — they are establishing that there is a case to build, which requires the Economic Buyer to agree the problem is worth their budget attention.

The Economic Buyer gates this convergence point as the person who must authorize any eventual spend. An EB who has not validated the problem will not approve a budget — the evaluation will run, the Champion will propose, and the EB will say the organization doesn't have the urgency to act. Their signal at this stage is typically a single purposeful session: an analyst report download, an executive brief view, or ROI content access that arrives via a forwarded Champion link.

#### Entry Criteria

- Champion has reached MEDIUM+ role confidence and their buying job inference is `problem_identification` — they are consuming thought leadership, analyst reports, benchmark data, and category-level content, not yet product-level evaluation content
- Economic Buyer has at least one behavioral signal in the last 30 days — even a single session on a high-value content asset (ROI, executive brief, pricing) is the signal; the EB's presence in the data is sparse by design
- The group has not yet shifted to `solution_exploration` buying job signals — content is still problem-framing, not vendor comparison

#### Exit Criteria

- Champion's buying job inference transitions from `problem_identification` to `solution_exploration` — they have shifted from "is this problem real?" content to "which solutions address it?" content
- Account's `bg_stage` advances from `engaged` to `prioritized` — a qualifying engagement event from a second distinct contact (typically the EB's single session) meets the stage promotion threshold
- EB's behavioral session in the last 14 days produces a classifiable signal (ROI, executive brief, analyst content) confirming engagement

#### Common Blockers

**Problem framing disagreement** (`misalignment_on_problem`): The Champion believes the problem is urgent; the Economic Buyer frames it as a lower priority, a near-term risk that isn't immediate, or a problem already being addressed by a different initiative. This disagreement rarely surfaces as explicit pushback — it surfaces as EB non-engagement. The EB just doesn't show up in the data.

What to do: share a peer benchmark report or named-customer story with the Champion and offer a talking point framing the cost of inaction. Do not pitch product. The EB hasn't validated the problem; product content will not help and may signal premature urgency.

**A key contact has left or changed roles** (`buying_group_turnover`): The EB who was beginning to engage has departed or moved roles, and a new EB is in place with no context on the evaluation.

What to do: alert the AE; identify the new EB's title via CRM and confirm their account association. The Champion will need to rebuild the internal case — send a concise account summary brief to help the Champion re-engage the new EB.

#### Loop-Back Risk

Problem Validation blockers produce a **partial_reset** in all cases. The group returns to problem-framing content and EB re-engagement, not to account identification. The deal does not collapse — it stalls at the first gate.

`misalignment_on_problem` → partial_reset. The Champion continues engagement; the EB disengages. The evaluation slows without ending.

`buying_group_turnover` at this stage → partial_reset. A new EB requires re-engagement on problem framing, which delays the stage transition but does not typically restart the Champion's evaluation.

#### Recommended Seller Actions

**Ownership: BDR (acquisition cohort, SDR-owned sequence).**

**Primary action (within 24 hours of alert):** Send the Champion one piece of external validation content — an industry analyst report, a peer benchmark, or a named customer story from the same vertical and company size that names the problem in terms an Economic Buyer would recognize. Frame the send as: "Saw you're exploring [solution area] — this [Forrester/Gartner/peer] report on [specific problem] might be useful context for internal conversations."

**If `misalignment_on_problem` is active:** Do not send solution content. Send the cost-of-inaction version of the benchmark data — quantify what unresolved versions of this problem cost organizations at comparable scale. Ask the Champion in a brief email: "Is the timing right for an external perspective on how [peers] are framing this problem? Happy to share a few resources."

**If `buying_group_turnover` is active:** Pause the standard sequence. Identify the new EB via CRM. Notify the AE that a key contact has turned over and confirm whether the Champion is aware. Do not approach the new EB directly until the Champion has been briefed on the transition.

---

### 4.3 Requirements Framing

#### Definition

Requirements Framing is the second convergence point — the moment at which the Champion, Influencer, and User collectively define what a good solution looks like. They are setting the evaluation criteria that will govern vendor selection. A group that reaches Requirements Framing without genuine Influencer and User input will produce requirements that look complete from the Champion's vantage point but leave technical integration gaps and workflow friction points undiscovered. Those gaps surface later, as objections during Solution Validation or as User veto after Business Value Alignment.

This convergence point is the highest-leverage pre-RFP intervention point in the entire buying journey. If the evaluation criteria favor Kalder's strengths, the RFP practically writes itself. If the criteria are dominated by a competitor's framing, recovery is expensive. A BDR who gets in at Requirements Framing with a well-timed RFP template or requirements workshop shapes the evaluation context; a BDR who waits until an RFP arrives is responding to criteria someone else defined.

The Ratifier is a Supporting participant here, not Required. In some solution categories — particularly Risk & Compliance — a Ratifier may insert early procurement or security criteria at this stage. When Ratifier signals appear at Requirements Framing, treat it as a preview of what they will require at Risk & Compliance Validation and share compliance documentation proactively.

#### Role Participation

| Role | Participation | Notes |
|---|---|---|
| Champion | R | |
| Economic Buyer | — | |
| Influencer | R | |
| User | R | |
| Ratifier | S | Early appearance is a Risk & Compliance leading indicator |

*[Cross-reference: Document 1, Section 4 — Role-to-Convergence-Point Matrix]*

The Champion gates this convergence point as the facilitator: they must drive the group toward shared evaluation criteria, not conduct solo requirements gathering. Their content at this stage shifts from problem-identification to requirements-building — use case content, evaluation frameworks, and requirements templates.

The Influencer gates this convergence point as the technical and functional evaluator. They define what integration fit, technical architecture, and operational requirements look like. Without Influencer input, the requirements reflect the Champion's business view without the technical depth that implementation actually requires.

The User gates this convergence point as the operational realist. They surface friction points and workflow requirements that neither Champion nor Influencer will see from their vantage points. User absence at Requirements Framing creates conditions for a late-stage veto.

*Supporting: Ratifier.* If a Ratifier-classified contact appears during Requirements Framing (Security Trust Center visit, compliance documentation access), it suggests early governance involvement. Log the signal and send a one-page security and compliance overview proactively — do not wait for them to ask.

#### Entry Criteria

- Champion and Influencer both at MEDIUM+ role confidence
- Buying job inference has shifted from `problem_identification` to `requirements_building` — the buying group is consuming use case content, integration documentation, technical specifications, or evaluation framework content; OR a `use_case_exploration` signal has appeared in the current session
- User-role behavioral signals have appeared at least once in the last 14 days — the User is beginning to engage, even if at LOW confidence

#### Exit Criteria

- Champion's content consumption shifts from requirements-building to supplier-selection signals — case studies, competitive comparisons, and executive briefs appear alongside the requirements content, indicating the group is beginning to evaluate vendors against the criteria they've set
- Influencer's session pattern narrows from broad solution exploration to depth-within-one-solution, indicating they have narrowed their technical evaluation to a shortlist
- Account `bg_stage` is `prioritized` — a second distinct contact has engaged or a hand-raiser event has occurred

#### Common Blockers

**Group disagreement on evaluation criteria** (`group_disagreement_on_requirements`): The Champion, Influencer, and User have different views of what the solution needs to do. This does not typically manifest as explicit disagreement — it manifests as stalled or divergent content consumption patterns across contacts: Champion deepening in one solution area while Influencer explores a different product area.

What to do: offer a requirements workshop or send the Kalder solution evaluation framework — a structured template that gives the group a common language for their requirements. The goal is to give the Champion a tool for facilitating alignment, not to resolve the disagreement from the outside.

**A buying consultant or third-party evaluator has appeared** (`buying_consultant_discussion`): A contact whose title or behavioral pattern suggests a procurement consultant, technology advisor, or analyst firm has entered the account's session history. They are shaping the evaluation criteria on behalf of the buyer.

What to do: engage with technical credibility content, not pitch material. The consultant is evaluating Kalder's ability to meet requirements they will define. A competitive architecture brief or a technical integration reference that demonstrates depth is more useful than a feature overview.

#### Loop-Back Risk

**partial_reset** for both named blockers. Requirements Framing blockers delay the group's entry into active vendor evaluation; they do not typically restart from Problem Validation. The Champion's engagement continues; the criteria are just not yet settled.

#### Recommended Seller Actions

**Ownership: BDR (acquisition cohort, SDR-owned sequence).**

**Primary action (within 24 hours of alert):** Send the Champion the Kalder [solution category]-specific evaluation framework with a one-sentence introduction: "Given where you are in the evaluation, this requirements framework might help you structure criteria with your team. Happy to walk through it if useful." This is the highest-leverage single send at this convergence point.

**If `group_disagreement_on_requirements` is active:** Offer a 30-minute requirements workshop with the Champion, framed as helping them facilitate internal alignment — not as a product meeting. Lead with questions about the team's evaluation priorities, not with Kalder's features.

**If `buying_consultant_discussion` is active:** Escalate to the AE; this situation warrants direct AE engagement. Have the AE send the technical integration architecture brief — not a pitch — with a note that Kalder is happy to participate in a structured technical review if the evaluation process includes one.

---

### 4.4 Solution Validation

#### Definition

Solution Validation is the moment the group agrees — specifically the Champion, Influencer, and User together — that Kalder meets their functional and technical requirements. It is a confirmation event, not a discovery event. The group is not learning what Kalder does at this stage; they are confirming that what Kalder does maps to what they determined they need during Requirements Framing.

The Influencer leads this convergence point in practice. They are the technical evaluator who takes the evaluation from "does this look viable?" to "yes, this works for our stack and our team." The Champion carries that technical confirmation to the Economic Buyer in the next phase. Without genuine Influencer sign-off, the Champion is carrying a judgment call, not a confirmed technical assessment.

User participation at Solution Validation is consistently underweighted by sales teams and consistently over-corrected by the buying group when it is missing. If Users have not validated workflow fit before the group advances to Business Value Alignment, the User veto surfaces after the EB has committed — when the deal momentum has built to the point where blocking it creates internal political cost. That is a worse position for everyone than resolving User concerns here.

#### Role Participation

| Role | Participation | Notes |
|---|---|---|
| Champion | R | |
| Economic Buyer | — | |
| Influencer | R | |
| User | R | |
| Ratifier | — | |

*[Cross-reference: Document 1, Section 4 — Role-to-Convergence-Point Matrix]*

The Champion gates this convergence point as the coordinator who must assemble the technical and operational validation from Influencer and User before they can carry an aligned position to the EB.

The Influencer gates this convergence point as the technical evaluator whose sign-off confirms integration and architecture fit. Without their confirmation, the Champion has a business case without technical backing.

The User gates this convergence point as the operational validator. Their job is to confirm the solution works for the people who will use it daily. Their absence here is the most common source of late-stage deal friction across the corpus.

#### Entry Criteria

- Champion and Influencer both at MEDIUM+ role confidence
- Technical evaluation signals have appeared in the last 7 days: `technical_docs_deep`, `integration_catalog_view`, or `product_tour_engagement`
- Buying job inference is `requirements_building` or `supplier_selection` — the group is evaluating functional and technical fit, not problem framing

#### Exit Criteria

- Influencer's buying job inference transitions toward `supplier_selection` — they are shifting from technical validation to vendor selection mode
- User behavioral signals include `product_tour_engagement` or `use_case_exploration` with 3+ minutes of active engagement, indicating workflow validation has occurred
- Champion begins consuming `case_study` and `competitive_comparison` content — they are building the internal case, which typically follows technical sign-off

#### Common Blockers

**A feasibility concern has surfaced** (`feasibility_review`): A technical gap has appeared — an integration that doesn't exist, a performance requirement Kalder hasn't publicly addressed, or an architecture constraint the Influencer has identified. The evaluation stalls pending a technical answer.

What to do: AE requests a solutions engineer engagement immediately — not to pitch, but to address the specific technical question. Provide the integration architecture brief for the relevant connection. If the gap is real, acknowledge it and present the roadmap or workaround. A feasibility block resolved with technical honesty advances the deal; an evasive response ends it.

**Integration complexity with existing systems** (`exploration_of_integration_with_existing_systems`): The Influencer is mapping Kalder's integration requirements against the account's existing stack and has found complexity that requires more investigation than standard documentation supports.

What to do: AE sends the integration catalog reference for the specific systems in question and offers a 30-minute technical call between the Influencer and a Kalder solutions engineer — framed as a technical exchange, not a sales meeting.

#### Loop-Back Risk

Both blockers produce a **partial_reset** if resolved. If `feasibility_review` surfaces a genuine architectural gap that cannot be addressed, the severity escalates to **full_reset** — the group returns to Requirements Framing to revisit their criteria with the limitation in mind.

`feasibility_review` (resolvable) → partial_reset.
`feasibility_review` (unresolvable gap) → full_reset.
`exploration_of_integration_with_existing_systems` → partial_reset.

#### Role Absence Alert

**User absence at Solution Validation** is a named deal-risk signal. The absence pattern: Champion and Influencer are both at MEDIUM+ confidence and consuming technical validation content, but no User-classified contacts have behavioral signals in the last 30 days — no product documentation access, no use case exploration, no how-to content.

Why it is a risk: groups that advance to Business Value Alignment without User validation encounter the User veto after the EB has committed. At that point, the User's negative assessment arrives with internal political weight on both sides — the EB has invested in the decision, and the User is blocking it. Recovery requires reopening Solution Validation under deal pressure, which produces worse outcomes than resolving User concerns here.

What to do (AE): In the next Champion outreach touch — call or email — ask specifically: "Have you had a chance to loop in the team who would be using this day to day? We've found that early operational validation makes the executive conversation much smoother. Happy to set up a tailored product walk-through with your team if that would help." If the Champion confirms User engagement is planned but not yet occurring, offer to send a self-guided product tour link with a note from the Champion's name.

#### Recommended Seller Actions

**Ownership: AE (progression cohort, AE-owned sequences).**

**Primary action (within 24 hours of alert):** Send the Champion the Kalder integration documentation for the Influencer's most likely stack (derivable from the account's industry and size) and offer a technical validation call between the Influencer and a Kalder solutions engineer — framed as: "Given where your team is in the technical review, our solutions engineering team is happy to do a 30-minute deep-dive on integration architecture. Would that be useful for [Influencer's name or title]?"

**If `feasibility_review` is active:** Do not send generic product content. Notify AE to engage solutions engineering immediately. The AE should reach out directly to the Champion: "We saw your team was reviewing [specific technical area]. We'd like to get our solutions engineer on a call to address [integration/performance/architecture question] directly — this week if possible."

**If `exploration_of_integration_with_existing_systems` is active:** Send the integration catalog reference page for the specific systems the Influencer has been viewing (derivable from the integration_catalog_view signal). Offer the solutions engineer call as above.

---

### 4.5 Business Value Alignment

#### Definition

Business Value Alignment is the moment the Champion and Economic Buyer agree on the financial and strategic case for the purchase — ROI, TCO, and measurable outcomes. This is the EB's primary convergence point. It is where their engagement becomes the signal that a deal is real, not where their engagement begins.

An EB who validates Business Value Alignment is not approving a budget yet. They are confirming that the investment makes financial sense at their organizational level — that the returns justify the cost and the strategic fit is real. Formal budget approval and procurement follow; this convergence point is the decision-in-principle that precedes them.

The Influencer is a Supporting participant here — not Required, but valuable. When Influencers appear during Business Value Alignment, they are often helping the Champion quantify technical benefits that feed the ROI calculation. Their participation improves the quality of the business case without blocking the convergence point.

#### Role Participation

| Role | Participation | Notes |
|---|---|---|
| Champion | R | |
| Economic Buyer | R | |
| Influencer | S | Contributes to ROI quantification; does not gate |
| User | S | Occasionally validates adoption timeline; does not gate |
| Ratifier | — | |

*[Cross-reference: Document 1, Section 4 — Role-to-Convergence-Point Matrix]*

The Champion gates this convergence point as the internal case-builder: they must carry a credible business case to the EB, which means they have done the ROI work and can speak to financial outcomes, not just functional fit.

The Economic Buyer gates this convergence point as the budget authority. Their engagement at this stage is typically concentrated in two to four purposeful sessions — ROI calculator usage, executive brief download, pricing page view. A single high-value EB session is often the clearest signal that Business Value Alignment is approaching. Their absence is the clearest signal it is not.

*Supporting: Influencer.* Influencer participation at this stage typically means they are helping the Champion build the technical ROI case — implementation timelines, integration costs, efficiency gains. Their input strengthens the brief the Champion brings to the EB.

*Supporting: User.* Occasional User engagement at this stage often involves adoption timeline content — implementation guides, training content. Their participation is informational, not a gate.

#### Entry Criteria

- Economic Buyer has reached MEDIUM+ role confidence — ROI calculator usage or pricing page view has appeared in the last 14 days
- Champion is at MEDIUM+ confidence and has consumed `executive_brief` or `case_study` content in the last 14 days — they are building the business case
- The account's overall buying job inference is trending toward `supplier_selection` — the group is no longer in evaluation mode; they are moving toward a decision

#### Exit Criteria

- EB's ROI calculator usage or pricing engagement is followed within 7 days by a Champion session on executive brief or competitive comparison content — the Champion has taken the EB's financial input and is building the final case
- `sfdc_opportunity_created` transitions to `true` in Salesforce — the AE has logged a qualified opportunity, which typically follows genuine EB alignment
- Account `bg_stage` advances to `qualified`

#### Common Blockers

**Business case data is unavailable** (`business_case_data_unavailable`): The EB wants to validate ROI but the data required to build the case — baseline productivity metrics, current vendor costs, expected usage volume — is not available or not credible.

What to do: Send the AE's pre-built ROI model for the relevant industry and company size, with inputs pre-populated from the account's publicly available data. Frame it as a starting point the EB can validate with their own numbers. Offer a 30-minute working session with the AE and the Champion to walk through the model together.

**Budget has been cut or frozen** (`budget_cut`): The EB has engaged with financial content but is communicating — directly or via the Champion — that budget is not available for this cycle.

What to do: Shift from ROI framing to cost-of-inaction framing. The EB doesn't need a reason to buy; they need ammunition to defend the spend to their CFO or board. Send the "cost of delay" data: what unresolved versions of this problem cost comparable organizations per quarter. Ask the Champion: "Is there anything that would help [EB name] make the case internally? We can put together a one-page executive summary if that's useful for their budget conversation."

#### Loop-Back Risk

`business_case_data_unavailable` → **partial_reset**. The group stalls at Business Value Alignment while data is assembled. The evaluation does not restart.

`budget_cut` → severity depends on cause. A temporary freeze → **partial_reset** (timing shift, evaluation continues). A structural budget cut that eliminates the investment category → **full_reset** (the group must restart when budget becomes available, often with new stakeholders).

#### Role Absence Alert

**EB absence at Business Value Alignment** is a named deal-risk signal. The absence pattern: Champion is at MEDIUM+ confidence and consuming executive brief, ROI calculator, and case study content, but no EB-classified contact has behavioral signals in the last 30 days. Champion ROI engagement without EB presence typically means the Champion is building the case alone, without the person who must approve it.

Why it is a risk: a business case that the EB has not participated in building is a proposal they can say no to on process grounds alone — "I haven't been involved in this." That objection is political, not financial, and it's harder to resolve than a substantive business case question.

What to do (AE): Reach out to the Champion and ask directly: "Has [EB name] had a chance to look at the ROI analysis? We've got a pre-built model with inputs from your industry that might be useful context for that conversation. Happy to send it to both of you, or if it's easier, we can set up a 20-minute session to walk through it together." This positions the AE as helping the Champion bring the EB in, not as reaching around the Champion to the EB.

#### Recommended Seller Actions

**Ownership: AE (progression cohort, AE-owned sequences).**

**Primary action (within 24 hours of alert):** Send the Champion a pre-built ROI model with inputs pre-populated for their industry and company size, with a cover note: "Given where you are, thought it might be useful to have a financial model ready for your internal conversations. I've pre-filled the industry benchmarks — you can adjust the inputs to match your actuals. Happy to walk through it or adjust the assumptions if helpful."

**If `business_case_data_unavailable` is active:** Offer a working session explicitly: "We know ROI validation sometimes requires data that takes time to pull together — we're happy to work through the assumptions with you and [EB contact name] in a 30-minute call. Would next week work?"

**If `budget_cut` is active:** Pivot to cost-of-inaction. Send the "cost of delay" industry data and ask the Champion: "If budget timing is a factor, would a one-page executive summary on the cost of deferring this investment be useful for [EB name]'s internal conversations? We can have one ready by tomorrow."

---

### 4.6 Risk & Compliance Validation

#### Definition

Risk & Compliance Validation is the first of the two Ratifier-gated convergence points, and it is the most common source of late-stage deal slippage in enterprise B2B sales. The Ratifier — procurement, legal, compliance, or security — arrives after Champion and Economic Buyer have aligned and raises objections that content alone cannot always resolve.

The asymmetry that makes this convergence point uniquely dangerous: the Ratifier participates at only two of the six convergence points, but a block here, after all the prior convergence points have been cleared, can unwind months of evaluation work. Ratifier blockers at this stage are organizational and process-level, not product-level — they involve purchasing rules, legal terms, capital authorization processes, or security certification gaps. None of these respond to feature demonstrations or ROI discussions.

Early enablement is the primary mitigation. The program should begin serving compliance documentation, security certifications, and procurement readiness content as soon as Ratifier signals appear in the account data — not as a reaction to their arrival at this convergence point, but as preparation designed to prevent a block. When a Ratifier who has already reviewed Kalder's security posture and DPA terms arrives at Risk & Compliance Validation, they typically have remaining questions rather than opening objections. When a Ratifier who has seen nothing arrives cold, the risk of a delay or rejection is significantly higher.

Category note: In risk and compliance solution categories, the Ratifier may participate much earlier than in other categories — sometimes at Problem Validation or Requirements Framing. An early Ratifier signal in a risk_compliance deal should not be treated as anomalous; it may reflect the fact that the Ratifier is the one who initiated the evaluation.

#### Role Participation

| Role | Participation | Notes |
|---|---|---|
| Champion | R | |
| Economic Buyer | R | |
| Influencer | — | |
| User | — | |
| Ratifier | R | |

*[Cross-reference: Document 1, Section 4 — Role-to-Convergence-Point Matrix]*

The Champion gates this convergence point as the internal coordinator who must bring the Ratifier into the process, provide them with the compliance materials they need, and manage the timeline between Ratifier review and deal close.

The Economic Buyer gates this convergence point as the budget authority who must remain aligned while the Ratifier's review is underway. EB disengagement during Ratifier review is a risk — if the EB's urgency wanes while the Ratifier is working through compliance questions, the deal loses momentum and may not recover.

The Ratifier gates this convergence point as the governance gatekeeper. Their job is to confirm the purchase does not create organizational or regulatory risk. They are not evaluating the product; they are evaluating the permissibility of the purchase.

#### Entry Criteria

- Ratifier-classified contact has reached LOW+ role confidence OR a Security Trust Center visit signal has appeared for any group member
- Champion and EB are both at MEDIUM+ confidence — the deal is advanced enough that compliance review is the next gate
- Buying job inference for the group is `supplier_selection` — the buying decision is essentially made; governance approval is what remains

#### Exit Criteria

- Ratifier's session pattern narrows and terminates — the characteristic two-to-four concentrated session pattern concludes, indicating their review is complete
- Champion resumes active engagement on executive brief and case study content following the Ratifier's sessions — the Champion is incorporating compliance confirmation into the final business case
- CRM opportunity stage advances — the AE has updated Salesforce to reflect that governance review is complete

#### Common Blockers

**Organizational purchasing rules override the group's decision** (`purchasing_rules_overrule_group_decision`): Procurement or legal has a blanket policy, pre-approved vendor list, or process requirement that Kalder doesn't currently satisfy. The buying group's decision is correct, but the organizational process prevents them from acting on it.

What to do: **Escalate immediately to the AE and to AE's manager.** This is a process-level blocker that requires executive-level engagement — Kalder's VP of Sales or legal team engaging with the account's procurement or legal counterpart. The BDR or AE cannot resolve this alone. Provide the Champion with a procurement navigation guide and offer to connect Kalder's legal team directly with the account's procurement office.

**A legal term in the contract has raised a concern** (`legal_flag`): A specific contract clause — data processing terms, indemnification language, SLA provisions — has triggered a legal review or a term negotiation.

What to do: **Escalate to the AE immediately.** Send the Kalder Data Processing Agreement (DPA) template and the standard security exhibit to the Champion for forwarding to their legal team. Have the AE offer a legal-to-legal call to address the specific clause — this is not a product-level conversation and should not be handled through normal sales channels. If the legal review is with external counsel, ask the Champion for a timeline.

**A capital authorization committee is involved** (`capital_review_board`): A CFO, board committee, or capital review process is required for expenditures at this deal size. The EB has approved the investment at their level, but formal capital authorization requires a separate process.

What to do: **Escalate to the AE.** Provide the Champion with the executive brief and the quantified business case in a format suitable for a board or committee presentation. Offer a customer reference call at an appropriate executive level. Ask the Champion: "What does [company]'s capital authorization process look like for a deal of this size? Is there anything specific the committee will want to see that we can help prepare?"

#### Loop-Back Risk

`purchasing_rules_overrule_group_decision` → **full_reset** if the policy cannot be resolved at the current deal stage. The group must restart the evaluation within a different procurement framework or wait for the next budget cycle. This is the highest-severity blocker in the corpus.

`legal_flag` → **partial_reset** if the term is negotiable; **full_reset** if the term is a policy constraint (e.g., a data residency requirement in a jurisdiction Kalder does not support).

`capital_review_board` → **partial_reset**. The group's decision does not change; the timeline extends to accommodate the authorization process.

#### Recommended Seller Actions

**Ownership: AE (progression cohort — `progression_early_to_mature` and `progression_win_now`).**

**Primary action (within 24 hours of alert):** Send the Champion a security and compliance package containing: (1) the SOC 2 Type II report, (2) data residency documentation, (3) the Kalder DPA template, and (4) a one-page Trust Center summary. Frame it as: "Given where you are in the process, wanted to make sure your team has Kalder's full security and compliance documentation ready for review. The DPA template is editable — happy to coordinate directly with your legal team if that speeds things up."

**If `purchasing_rules_overrule_group_decision` is active:** Escalate to AE manager or VP of Sales immediately. Do not attempt to resolve through standard sales channels. Help the Champion understand what documentation or executive engagement would move the procurement conversation forward.

**If `legal_flag` is active:** Escalate to AE. Have the AE offer a legal-to-legal call within 48 hours. Send the DPA and security exhibit without being asked. Ask the Champion for the specific clause or requirement at issue so the call is targeted.

**If `capital_review_board` is active:** Provide the Champion with a board-ready executive brief — one to two pages with quantified ROI, business case narrative, and implementation timeline. Offer a peer reference call at CFO or SVP level. Ask the Champion what the committee's timeline and decision criteria look like.

---

### 4.7 Final Commitment

#### Definition

Final Commitment is the last convergence point — the moment at which Champion, Economic Buyer, and Ratifier reach full alignment on value, risk, and readiness to sign. It is not identical to contract signing. It is the internal buying group state that makes contract signing possible: all three Required roles have committed to the outcome, and what remains is administrative execution.

This convergence point fails when one of the three Required roles withdraws alignment that appeared to exist, or when an external event introduces a new blocker after the group has converged. Both scenarios are more common than they appear: a key contact who changes roles at the last minute, a contract clause that surfaces a previously unreported legal constraint, or an organizational purchasing process that overrides the group's decision even after everyone agreed.

The AE's job at Final Commitment is removal of friction, not closing. The decision has been made. What remains is removing every administrative and process obstacle between the group's alignment and the signed agreement — procurement documentation, contract negotiation, implementation timeline, executive sponsor activation.

Deals that slip at Final Commitment after progressing through all prior convergence points are not intelligence failures. They are execution failures at the final stage — usually a process blocker that the AE did not see coming because it was not surfaced earlier. The seller action for every final_commitment alert is to proactively remove every remaining obstacle before it surfaces as a deal stall.

#### Role Participation

| Role | Participation | Notes |
|---|---|---|
| Champion | R | |
| Economic Buyer | R | |
| Influencer | — | |
| User | — | |
| Ratifier | R | |

*[Cross-reference: Document 1, Section 4 — Role-to-Convergence-Point Matrix]*

The Champion gates this convergence point as the final internal coordinator: they must confirm that Influencer and User validations have been incorporated, that the EB is ready to authorize, and that the Ratifier's review is complete.

The Economic Buyer gates this convergence point as the budget authority who must sign off on the financial terms of the agreement. Their engagement at this stage is brief and decisive: a contract review, a final pricing confirmation, or an executive sponsor activation.

The Ratifier gates this convergence point as the organizational gatekeeper whose approval clears the procurement and legal path to execution. If their review is complete and their concerns have been resolved at Risk & Compliance Validation, their role at Final Commitment is confirmation — not a new review. If Risk & Compliance Validation was not genuinely cleared, Final Commitment will resurface all the Ratifier's outstanding concerns at the worst possible moment.

#### Entry Criteria

- Champion, Economic Buyer, and Ratifier all have at least LOW+ role confidence — all three are present in the account's contact data
- Champion's buying job inference is `supplier_selection` — the evaluation is complete; they are in execution mode
- Account `bg_stage` is `qualified` — a Salesforce opportunity has been created

#### Exit Criteria

- `sfdc_opportunity_stage` advances to Stage 7 or above (closed-won) — the agreement is signed and the CRM record is updated
- Champion's behavioral activity on kalder.com ceases or transitions to post-sale content (implementation, onboarding, training)
- Ratifier's session pattern terminates — their review is complete, no new compliance sessions appear

#### Common Blockers

**A key contact has left or changed roles** (`buying_group_turnover`): A Champion, EB, or Ratifier who was party to the group's alignment has departed or moved to a different role. The new contact has no context on the evaluation and may not share the previous contact's position.

What to do: **Escalate to the AE immediately.** Turnover at Final Commitment is a partial_reset blocker — the deal does not necessarily restart, but the new contact must be briefed before commitment can proceed. The AE should request a call with the Champion to understand: (1) whether the new contact is aware of the evaluation, (2) whether they are in a position to assume the departed contact's decision authority, and (3) what the Champion needs to bring them up to speed. Provide a concise executive brief summarizing the deal history, business case, and outstanding items — written at the appropriate level for the new contact's role.

**Contract terms require updates before execution** (`contract_updates_required`): Legal review has surfaced contract language that requires revision — term length, payment structure, data processing terms, liability provisions.

What to do: AE connects with Kalder's legal team immediately and requests a redline turnaround within 24 hours. Have the AE email the Champion: "Our legal team is reviewing [specific clause area]. We'll have a redline to you by [specific date]. Is there a deadline on your end we should be aware of?" Keep the Champion informed of the timeline so they can manage their internal stakeholders.

**Organizational purchasing rules have overridden the group's decision** (`purchasing_rules_overrule_group_decision`): A procurement committee, vendor approval process, or capital authorization requirement has surfaced that prevents the group from signing despite their alignment.

What to do: **Escalate to AE manager or VP of Sales immediately.** This is a full_reset blocker at Final Commitment — the deal cannot close in its current form until the procurement constraint is resolved. The AE and their manager should engage with Kalder's legal or commercial team to explore whether the purchasing rule can be accommodated (pre-approved vendor registration, alternative contract structure, DPA amendment). An executive sponsor engagement — Kalder's VP or C-level engaging with the account's equivalent — may be required.

#### Loop-Back Risk

`buying_group_turnover` → **partial_reset**. The new contact must be briefed and aligned; the deal timeline extends, but the evaluation does not restart. The severity escalates toward full_reset if the new contact's role is the EB or Ratifier and they are actively opposed to the purchase their predecessor supported.

`contract_updates_required` → **partial_reset**. The deal stalls during legal negotiation but does not restart.

`purchasing_rules_overrule_group_decision` → **full_reset**. This is the highest-severity blocker in the corpus and is particularly destructive at Final Commitment because it occurs after months of evaluation work. A deal that cannot close due to a procurement constraint that was never surfaced has effectively lost all the value of the prior convergence points. The only path forward is resolving the procurement constraint — which typically requires executive-level engagement and may not be resolvable within the current budget cycle.

#### Recommended Seller Actions

**Ownership: AE (progression cohort — primarily `progression_win_now`).**

**Primary action (within 24 hours of alert):** Proactively send the Champion a procurement readiness package: (1) a contract-ready agreement draft, (2) an implementation timeline summary showing go-live milestones, and (3) a one-page executive commitment brief summarizing the agreed terms in plain language. Frame it as: "To make the final steps as straightforward as possible, here's everything your team will need for the signature process. Let me know if anything needs to be adjusted before we get this in front of legal and procurement."

**If `buying_group_turnover` is active:** Pause the standard closing sequence. AE contacts Champion immediately by phone or direct email. Confirm which role has turned over, whether a successor is identified, and what the Champion needs to brief the new contact. Send the AE an executive brief written for the new contact's role. Do not resume the standard sequence until the AE has confirmed the new contact's position.

**If `contract_updates_required` is active:** AE sends the redline request to Kalder legal immediately and commits a timeline to the Champion in writing. Do not allow the contract review to go dark — daily status updates from AE to Champion until the redline is complete.

**If `purchasing_rules_overrule_group_decision` is active:** Escalate to AE manager or VP of Sales within 24 hours — do not attempt to resolve through normal sales channels. AE asks the Champion for the specific procurement requirement at issue and the name of the procurement or legal contact who raised it. Arrange an executive sponsor call between Kalder leadership and the account's equivalent. If the constraint cannot be resolved in the current budget cycle, ask the Champion what the path looks like for the next cycle and keep the relationship active.

---

*End of Section 4. Section 5 specifies the Convergence Enabling Content system — the content types (consensus_brief and executive_brief) that the Champion uses to facilitate alignment at each convergence point. The machine-readable sales activation configuration, including trigger_condition and alert_payload specifications for all six convergence points, is in `§SA SALES_ACTIVATION_CONFIG` in the data model. Document 8 (Operational Runbook) owns the CRM handoff implementation for alert delivery.*

---

## Section 6: The JTBD Code Library

---

### 5.1 How to Use This Library

Section 6 is a lookup reference for all 131 JTBD codes organized by solution category and buying job group. It is not an explanation of the buying job inference model — that is Section 7 — and it is not a specification of content tagging rules — that is Document 4. It is a commissioning reference: the resource a content strategist opens when they need to know which JTBD code to assign to a content brief, what buying job group that code belongs to, and what behavioral signals characterize a visitor in that job.

Codes are organized in five solution category subsections (5.2 through 5.6), one per category. Within each subsection, codes are grouped under four buying job subheadings in the same order throughout: problem_identification, solution_exploration, requirements_building, supplier_selection. Within each group, codes appear in ascending sequence order.

**Entry fields.** Each code entry contains the following eight fields:

| Field | Description |
|---|---|
| `jtbd_code` | Exact code string from §17 JTBD_CODES. Format: `{OPPORTUNITY_TYPE_PREFIX}-{ROLE_PREFIX}-{STAGE_PREFIX}-{SEQUENCE}` (e.g., `ACQ-CH-PI-1`). Copy exactly — no aliases, no paraphrasing. |
| `label` | Human-readable task description written from the buyer's perspective. Specific enough to distinguish this code from adjacent codes in the same buying job group. |
| `buying_job` | The buying job this code belongs to: `problem_identification`, `solution_exploration`, `requirements_building`, or `supplier_selection`. Matches §17 exactly. |
| `primary_role_affinity` | The role most commonly associated with this JTBD in this solution category context. Informational — not exclusive. Multiple roles may reference the same JTBD node. |
| `probable_job_prior` | `true` if this code's `buying_job` matches the PROBABLE_JOB_PRIORS return value for its `primary_role_affinity` at any buying group stage. `false` otherwise. [Cross-reference: Section 6.4; Document 2, Section 7.4.] |
| `coverage_status` | Current content coverage completeness: `pending` (no approved Content Module nodes reference this code), `constructed` (JTBD node exists; no approved content yet), `partial` (at least one approved Content Module), `complete` (minimum required Content Module count met per role). |
| `definition` | What the buyer is trying to accomplish when engaged in this job. Written from the buyer's perspective. Maximum 500 characters. |
| `behavioral_signal_indicators` | 2–4 specific content type observations characteristic of a visitor in this buying job, consistent with the BUYING_JOB_INFERENCE_SIGNALS strong and weak indicator lists. [Cross-reference: Document 2, Section 7.3.] |

**Commissioning priority guidance.** Codes marked `probable_job_prior: true` are the highest-priority commissioning targets. They govern content selection for the largest volume of UNKNOWN-state visitors — when buying job confidence is UNKNOWN, the PROBABLE_JOB_PRIORS table selects content variants tagged to these codes as the statistically expected default for their role and stage combination. A solution category without content covering its probable_job_prior codes will serve undifferentiated role × stage content to the majority of its visitors. Commission probable_job_prior codes first. For full coverage thresholds by role and module type, see Document 4, Section 7.

**CR-07 constraint.** The `category_explainer` content type is a strong indicator for `problem_identification`, not `solution_exploration`. This classification changed in data model v0.2.0 (CR-07). Any code with `buying_job: solution_exploration` must not list `category_explainer` as a behavioral signal indicator. Content authors verifying their signal indicator selections against this library should observe this constraint when checking solution_exploration entries. [Cross-reference: Document 2, Section 7.3, CR-07 cascade note.]

**Cross-references.** For the buying job inference model explanation — how KNOWN, INFERRED, and UNKNOWN states work, and how PROBABLE_JOB_PRIORS is applied — see Section 7. For the full BUYING_JOB_INFERENCE_SIGNALS table (strong indicators, weak indicators, counter-indicators by buying job group) — see Document 2, Section 7.3.

---

### 5.2 Customer Engagement JTBD Library

*Source: §17 JTBD_CODES, customer_engagement section. 26 codes total. All codes marked `coverage_status: complete` per §17.*

---

#### problem_identification codes

---

**ACQ-CH-PI-1 — Socializing a service-first narrative internally**
Buying job: problem_identification
Primary role affinity: champion
Probable job prior: true
Coverage status: complete
Definition: Determining how to make the case to colleagues and leadership that the organization's current customer engagement model is broken and that a service-first transformation is both urgent and achievable. The Champion is identifying the narrative frame that will get others to see the problem as real.
Behavioral signal indicators: thought_leadership content views; benchmark_report downloads; diagnostic_assessment tool completions

---

**ACQ-CH-PI-2 — Collecting early proof and peer references**
Buying job: problem_identification
Primary role affinity: champion
Probable job prior: true
Coverage status: complete
Definition: Identifying and gathering peer customer stories, analyst validation, and third-party evidence that can support the internal case that the problem is real and that organizations like this one have solved it. The Champion needs external credibility before the internal conversation can advance.
Behavioral signal indicators: analyst_report downloads; case_study downloads; thought_leadership content views

---

**ACQ-CH-PI-3 — Recruiting internal allies for the evaluation**
Buying job: problem_identification
Primary role affinity: champion
Probable job prior: true
Coverage status: complete
Definition: Identifying which colleagues, sponsors, and functional leaders need to be brought into the evaluation early, and finding the right framing and evidence to earn their engagement before a formal evaluation process begins.
Behavioral signal indicators: thought_leadership content views; benchmark_report downloads; analyst_report downloads

*Note: §17 lists `consensus_brief` and `executive_brief` as content_types for this code. Both are phase: converge and are never served via Adobe Target. Behavioral signal indicators above reflect diverge-phase content consumption that precedes Champion distribution of converge content.*

---

**ACQ-EB-PI-1 — Sizing the CX problem in organizational terms**
Buying job: problem_identification
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: complete
Definition: Quantifying the scope and cost of the organization's current customer experience failure — in operational and financial terms the Economic Buyer can act on. Establishing whether the problem is large enough to justify the investment of evaluating and potentially purchasing a solution.
Behavioral signal indicators: diagnostic_assessment tool completions; benchmark_report downloads; analyst_report downloads

---

**ACQ-EB-PI-2 — Translating CX pain into measurable target outcomes**
Buying job: problem_identification
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: complete
Definition: Converting the organization's customer experience problems into specific, quantifiable business outcomes — reduced churn, improved CSAT, lower cost-to-serve — that can serve as the success criteria for any solution investment and form the basis of a business case.
Behavioral signal indicators: thought_leadership content views; analyst_report downloads; benchmark_report downloads

---

**ACQ-EB-PI-3 — Shortlisting viable CX solution approaches and vendors**
Buying job: problem_identification
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: complete
Definition: Assessing the landscape of solution categories and vendors that address the identified CX problem, narrowing from the full market to a credible shortlist of approaches worth evaluating in depth. The Economic Buyer is defining the scope of the evaluation before committing to one.
Behavioral signal indicators: analyst_report downloads; competitive_comparison content views; category_explainer page views

---

**ACQ-RAT-PI-1 — Clarifying the procurement need and approval path**
Buying job: problem_identification
Primary role affinity: ratifier
Probable job prior: false
Coverage status: complete
Definition: Determining what procurement process, approval chain, and vendor qualification requirements will apply to a potential CX platform purchase. The Ratifier is establishing the procedural boundaries of the evaluation before the evaluation progresses.
Behavioral signal indicators: security_compliance content views; analyst_report downloads

---

**ACQ-RAT-PI-2 — Identifying risk flags in the evaluation early**
Buying job: problem_identification
Primary role affinity: ratifier
Probable job prior: false
Coverage status: complete
Definition: Scanning the early-stage evaluation for governance, data privacy, compliance, or contractual risks that could block or constrain the purchase later. The Ratifier is doing a preliminary risk assessment — not a full compliance review — to ensure no category-level red flags exist before the group invests further.
Behavioral signal indicators: security_compliance content views; thought_leadership content views

---

**ACQ-RAT-PI-3 — Understanding governance, privacy, and security requirements for CX platforms**
Buying job: problem_identification
Primary role affinity: ratifier
Probable job prior: false
Coverage status: complete
Definition: Establishing what data governance, privacy compliance, and security certification standards a CX platform must meet for this organization — forming the compliance criteria that will gate final vendor approval. The Ratifier is defining the requirements, not yet evaluating a specific vendor against them.
Behavioral signal indicators: security_compliance content views; analyst_report downloads

---

#### solution_exploration codes

---

**ACQ-USR-SE-1 — Surfacing frontline friction and must-have workflows**
Buying job: solution_exploration
Primary role affinity: user
Probable job prior: true
Coverage status: complete
Definition: Identifying the specific daily workflows, pain points, and non-negotiable operational requirements that any CX solution must address to work for the people who use it every day. The User is translating their frontline experience into evaluation criteria before a formal requirements process begins.
Behavioral signal indicators: product_tour engagement; use_case_page views; howto_training content views

---

**ACQ-USR-SE-2 — Participating in concept workflows and demos**
Buying job: solution_exploration
Primary role affinity: user
Probable job prior: true
Coverage status: complete
Definition: Engaging with live or recorded product demonstrations of proposed CX workflows to test whether they reflect how the User's team actually works — identifying gaps between the vendor's use case framing and the User's operational reality before requirements are formally documented.
Behavioral signal indicators: product_tour engagement; use_case_page views; webinar_event_registration

---

#### requirements_building codes

---

**ACQ-INF-RB-1 — Shaping functional and technical requirements for CX evaluation**
Buying job: requirements_building
Primary role affinity: influencer
Probable job prior: true
Coverage status: complete
Definition: Translating the organization's CX use cases and operational constraints into a structured set of functional and technical requirements that a solution must meet — forming the basis of an RFP, evaluation scorecard, or vendor brief that the buying group will use to compare options.
Behavioral signal indicators: technical_documentation views; use_case_page views; rfp_template downloads

---

**ACQ-INF-RB-2 — Stress-testing how CX workflows will run for the team**
Buying job: requirements_building
Primary role affinity: influencer
Probable job prior: true
Coverage status: complete
Definition: Evaluating whether the proposed CX solution will fit the team's specific workflow patterns, tool integrations, and operational constraints — not just whether it can perform the tasks but whether it will work the way this team actually works.
Behavioral signal indicators: product_tour engagement; use_case_page views; technical_documentation views

---

#### supplier_selection codes

---

**PRG-CH-SS-1 — Securing executive sponsorship for the CX platform decision**
Buying job: supplier_selection
Primary role affinity: champion
Probable job prior: true
Coverage status: complete
Definition: Building the internal executive commitment needed to authorize the CX platform purchase — convincing the Economic Buyer and relevant leadership that the evaluation is complete, the vendor is the right choice, and the investment is approved.
Behavioral signal indicators: roi_calculator completions; competitive_comparison views; case_study downloads

*Note: §17 lists `executive_brief` and `consensus_brief` as content_types for this code. Both are phase: converge and distributed by Champions internally, not served via Adobe Target. Behavioral signal indicators above reflect diverge-phase content the Champion consumes before distributing converge instruments.*

---

**PRG-CH-SS-2 — Standing up CX use cases to validate vendor selection**
Buying job: supplier_selection
Primary role affinity: champion
Probable job prior: true
Coverage status: complete
Definition: Demonstrating concretely how Kalder's CX platform addresses the organization's specific use cases — moving from abstract evaluation to grounded examples the buying group can rally around as the basis for a final vendor decision.
Behavioral signal indicators: use_case_page views; case_study downloads; product_tour engagement

---

**PRG-CH-SS-3 — Orchestrating final consensus across the buying group**
Buying job: supplier_selection
Primary role affinity: champion
Probable job prior: true
Coverage status: complete
Definition: Coordinating the final alignment of Champion, Economic Buyer, Influencer, User, and Ratifier positions on the selected CX vendor — identifying and resolving any remaining objections or gaps so the group can commit to the purchase.
Behavioral signal indicators: competitive_comparison views; case_study downloads; analyst_report downloads

*Note: §17 lists `consensus_brief` and `executive_brief` as content_types for this code. Both are phase: converge. Behavioral signal indicators above reflect diverge-phase content consumption preceding converge distribution.*

---

**PRG-EB-SS-1 — Validating ROI and TCO scenarios for the CX platform**
Buying job: supplier_selection
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: complete
Definition: Confirming that the financial case for the CX platform holds up under scrutiny — validating the ROI model, stress-testing TCO assumptions, and ensuring the investment can be defended to finance and leadership with credible numbers.
Behavioral signal indicators: roi_calculator completions; case_study downloads; analyst_report downloads

---

**PRG-EB-SS-2 — Confirming Kalder meets the organization's defined CX KPI goals**
Buying job: supplier_selection
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: complete
Definition: Verifying that the selected CX platform can demonstrably deliver against the specific business outcome targets — CSAT improvement, cost-to-serve reduction, resolution speed — that were established as the success criteria at the beginning of the evaluation.
Behavioral signal indicators: case_study downloads; benchmark_report downloads; roi_calculator completions

---

**PRG-EB-SS-3 — Understanding CX platform rollout and adoption requirements**
Buying job: supplier_selection
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: complete
Definition: Assessing what organizational change, implementation resources, and adoption support the CX platform purchase will require — confirming that the rollout plan is realistic and that the investment includes what is needed to achieve the projected outcomes, not just the license.
Behavioral signal indicators: use_case_page views; case_study downloads; product_tour engagement

---

**PRG-INF-SS-1 — Validating that CX platform use cases work for this organization**
Buying job: supplier_selection
Primary role affinity: influencer
Probable job prior: false
Coverage status: complete
Definition: Confirming through hands-on evaluation or reference conversations that Kalder's customer engagement workflows function as claimed in the context of this organization's specific team structures, existing integrations, and operational requirements — not just that they work in theory.
Behavioral signal indicators: use_case_page views; product_tour engagement; technical_documentation views

---

**PRG-INF-SS-2 — Running or interpreting a CX platform proof of concept**
Buying job: supplier_selection
Primary role affinity: influencer
Probable job prior: false
Coverage status: complete
Definition: Executing or reviewing the results of a structured technical evaluation — a proof of concept or pilot — that tests the CX platform's integration behavior, workflow performance, and configuration requirements against the organization's actual environment and use cases.
Behavioral signal indicators: technical_documentation views; use_case_page views; product_tour engagement

---

**PRG-INF-SS-3 — Issuing technical and functional recommendations to the buying group**
Buying job: supplier_selection
Primary role affinity: influencer
Probable job prior: false
Coverage status: complete
Definition: Synthesizing the Influencer's technical evaluation findings into a clear recommendation to the buying group — confirming that Kalder meets the functional and integration requirements, naming any conditions or risks, and providing the group with the technical basis for a final vendor decision.
Behavioral signal indicators: technical_documentation views; use_case_page views; analyst_report downloads

*Note: §17 lists `consensus_brief` as the primary content_type for this code (phase: converge). The Influencer's recommendation typically travels via Champion-distributed converge instruments. Behavioral signal indicators above reflect the diverge-phase content that informs the recommendation.*

---

**PRG-RAT-SS-1 — Ensuring CX platform standards alignment before purchase**
Buying job: supplier_selection
Primary role affinity: ratifier
Probable job prior: true
Coverage status: complete
Definition: Confirming that the selected CX platform meets the organization's security, compliance, and data governance standards — completing the formal certification review that must be satisfied before the purchase can be authorized.
Behavioral signal indicators: security_compliance content views; legal_procurement documentation views

---

**PRG-RAT-SS-2 — Finalizing CX platform contract terms, SLAs, and liability**
Buying job: supplier_selection
Primary role affinity: ratifier
Probable job prior: true
Coverage status: complete
Definition: Negotiating and confirming the specific contract terms, service level commitments, data processing agreements, and liability provisions that must be acceptable before the Ratifier can authorize the CX platform purchase to proceed.
Behavioral signal indicators: legal_procurement documentation views; security_compliance content views

---

**PRG-USR-SS-1 — Validating CX platform usability through use-based demos**
Buying job: supplier_selection
Primary role affinity: user
Probable job prior: false
Coverage status: complete
Definition: Confirming through structured hands-on evaluation that the CX platform's day-to-day interface, workflows, and support tools genuinely fit how the User's team operates — moving from theoretical workflow fit to experiential confirmation that adoption is achievable.
Behavioral signal indicators: product_tour engagement; use_case_page views; howto_training content views

---

**PRG-USR-SS-2 — Recommending CX platform adoption and training milestones**
Buying job: supplier_selection
Primary role affinity: user
Probable job prior: false
Coverage status: complete
Definition: Defining the onboarding, training, and adoption support requirements the CX platform implementation must include — ensuring the User's team can reach productivity on the new system within a realistic timeframe and that adoption risk is factored into the purchase decision.
Behavioral signal indicators: howto_training content views; use_case_page views; product_tour engagement

---

#### Summary — Customer Engagement JTBD Code Count

| Buying job group | Code count | Probable_job_prior: true codes |
|---|---|---|
| problem_identification | 9 | 6 |
| solution_exploration | 2 | 2 |
| requirements_building | 2 | 2 |
| supplier_selection | 13 | 8 |
| **Total** | **26** | **18** |

---

**Section 5.2 notes for council review:**

1. **§17 code strings are exact.** All 26 code strings (ACQ-CH-PI-1 through PRG-USR-SS-2) match §17 character-for-character. No codes have been added or omitted.

2. **Ratifier probable_job_prior: false for problem_identification.** PROBABLE_JOB_PRIORS returns None for ratifier at targeted and engaged, and requirements_building at prioritized. No stage returns problem_identification for ratifier. The three ACQ-RAT-PI codes are correctly marked probable_job_prior: false.

3. **Influencer supplier_selection codes: probable_job_prior: false.** PROBABLE_JOB_PRIORS caps influencer at requirements_building through qualified. No stage returns supplier_selection for influencer. The three PRG-INF-SS codes are correctly marked false.

4. **User supplier_selection codes: probable_job_prior: false.** Same reasoning as Influencer — PROBABLE_JOB_PRIORS caps user at requirements_building. PRG-USR-SS-1 and PRG-USR-SS-2 are correctly marked false.

5. **Converge-phase codes (ACQ-CH-PI-3, PRG-CH-SS-1, PRG-CH-SS-3, PRG-INF-SS-3).** §17 lists consensus_brief and/or executive_brief as content_types for these codes. Both are phase: converge and excluded from the Adobe Target offer catalog. Behavioral signal indicators for these entries reflect diverge-phase content consumption patterns that precede or accompany the Champion's converge distribution activity — these are the signals the program observes, not the converge content types themselves.

6. **CR-07 compliance.** No solution_exploration entry lists category_explainer as a behavioral signal indicator. ACQ-EB-PI-3 (problem_identification) correctly lists category_explainer as a behavioral signal indicator, consistent with the post-CR-07 assignment of category_explainer to the problem_identification strong indicators list.

7. **All coverage_status values are `complete`.** §17 marks all 26 CE codes coverage_status: complete. The corpus note reads "CUSTOMER ENGAGEMENT — COMPLETE / Source: CRM Buying Group Planning deck, ServiceNow Nov 2025."

---

## Section 6.3 IT Operations JTBD Library

*Source: §17 JTBD_CODES, it_operations section. 27 codes total. Coverage statuses as specified in §17 (partial or constructed — no complete codes in this category at v1).*

---

#### problem_identification codes

---

**IT-ACQ-CH-PI-1 — Building internal awareness of the IT-as-AI-builders transformation imperative**
Buying job: problem_identification
Primary role affinity: champion
Probable job prior: true
Coverage status: partial
Definition: Determining whether the organization's current IT model — reactive service desk, fragmented tooling, developer-dependent workflows — is structurally preventing IT from becoming a builder and automation platform for the enterprise. The Champion is asking if this problem category is real enough to warrant transformation investment.
Behavioral signal indicators: thought_leadership content views; diagnostic_assessment tool completions

---

**IT-ACQ-CH-PI-2 — Collecting proof that AI-native ITSM outperforms legacy modernization**
Buying job: problem_identification
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Gathering analyst and customer evidence that organizations running AI-native IT service management platforms measurably outperform those running modernized legacy stacks — establishing that the architectural difference is real and consequential, not just a vendor claim.
Behavioral signal indicators: benchmark_report downloads; analyst_report downloads; thought_leadership content views

---

**IT-ACQ-CH-PI-3 — Recruiting IT leadership allies around the transformation urgency**
Buying job: problem_identification
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Identifying and engaging the internal sponsors, IT managers, and organizational influencers who need to validate the transformation narrative before a formal evaluation can begin — building the internal coalition that makes a platform decision possible.
Behavioral signal indicators: thought_leadership content views; analyst_report downloads

*Note: §17 lists consensus_brief and executive_brief as content_types for this code (phase: converge). Both are distributed by Champions internally and are never served via Adobe Target. Behavioral signal indicators above reflect diverge-phase content consumption preceding Champion distribution of converge instruments.*

---

**IT-ACQ-EB-PI-1 — Quantifying the cost of IT fragmentation and legacy drag**
Buying job: problem_identification
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Establishing the organizational and financial cost of the current IT operating model — duplicate tooling spend, developer time lost to manual ticket routing, incident backlogs, and shadow IT proliferation — in terms specific enough to inform a business case for platform consolidation.
Behavioral signal indicators: benchmark_report downloads; diagnostic_assessment tool completions; analyst_report downloads

---

**IT-ACQ-EB-PI-2 — Translating IT transformation into board-level outcome language**
Buying job: problem_identification
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Reframing the IT transformation investment from an infrastructure modernization initiative into business outcomes the board and C-suite care about — speed to market for internal capabilities, reduction in unplanned downtime cost, and measurable improvement in employee productivity from self-service IT.
Behavioral signal indicators: thought_leadership content views; analyst_report downloads; benchmark_report downloads

---

**IT-ACQ-RAT-PI-1 — Establishing data governance and AI use policy boundaries for IT platforms**
Buying job: problem_identification
Primary role affinity: ratifier
Probable job prior: false
Coverage status: constructed
Definition: Defining what data governance policies, AI usage boundaries, and auditability requirements an IT operations platform must satisfy before the organization can authorize its deployment — setting the governance criteria that will gate the evaluation before the Ratifier is formally enrolled.
Behavioral signal indicators: security_compliance content views; governance_policy content views

---

**IT-ACQ-RAT-PI-2 — Identifying security and compliance requirements for IT platform evaluation**
Buying job: problem_identification
Primary role affinity: ratifier
Probable job prior: false
Coverage status: constructed
Definition: Scanning the IT platform evaluation for data residency, access control, and regulatory compliance requirements that must be defined before a vendor can be formally assessed — establishing the security criteria the Ratifier will apply during the formal compliance review.
Behavioral signal indicators: security_compliance content views; thought_leadership content views

*Note: §17 lists legal_procurement as a content_type for this code. legal_procurement is a counter-indicator for problem_identification in the BUYING_JOB_INFERENCE_SIGNALS table and is excluded per Constraint 2.*

---

#### solution_exploration codes

---

**IT-ACQ-CH-SE-1 — Evaluating AI-native ITSM against legacy platform modernization paths**
Buying job: solution_exploration
Primary role affinity: champion
Probable job prior: true
Coverage status: partial
Definition: Assessing whether the right solution is replacing the legacy ITSM stack with an AI-native platform or investing in modernizing the existing stack — evaluating the architectural and organizational tradeoffs between the two paths before committing to a vendor evaluation in either direction.
Behavioral signal indicators: product_solution_overview page views; use_case_page views

*Note: §17 lists competitive_comparison as a content_type for this code. competitive_comparison is an SS strong indicator and SE counter-indicator; excluded per No-S3 (approved revision).*

---

**IT-ACQ-CH-SE-2 — Mapping the Kalder IT platform architecture to enterprise integration requirements**
Buying job: solution_exploration
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Evaluating how the Kalder IT operations platform fits within the organization's existing enterprise architecture — understanding which integrations are native, which require configuration, and whether the platform's technical model is compatible with the organization's current and planned technology stack.
Behavioral signal indicators: product_solution_overview page views; product_tour engagement

*Note: §17 lists technical_documentation as a content_type for this code. technical_documentation is an RB strong indicator and SE counter-indicator; excluded per No-S3 (approved revision).*

---

**IT-ACQ-EB-SE-1 — Assessing strategic fit of an AI-native IT platform versus point solutions**
Buying job: solution_exploration
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Evaluating whether a consolidated AI-native IT operations platform creates more long-term strategic value than continuing to add best-of-breed point solutions — assessing platform consolidation as an investment thesis, not just a cost exercise.
Behavioral signal indicators: product_solution_overview page views; analyst_report downloads

*Note: §17 lists category_explainer (PI strong indicator under CR-07, excluded) and competitive_comparison (SE counter-indicator, excluded) as content_types for this code. product_solution_overview + analyst_report used per approved revision.*

---

**IT-ACQ-USR-SE-1 — Surfacing daily service desk friction and workflow gaps**
Buying job: solution_exploration
Primary role affinity: user
Probable job prior: true
Coverage status: constructed
Definition: Identifying the specific incident routing, request fulfillment, and escalation workflow friction points that make the service desk's current ITSM tool painful to use every day — translating frontline operational reality into evaluation requirements the buying group can act on.
Behavioral signal indicators: use_case_page views; product_tour engagement; howto_training content views

---

**IT-ACQ-USR-SE-2 — Participating in hands-on IT platform demos and trials**
Buying job: solution_exploration
Primary role affinity: user
Probable job prior: true
Coverage status: constructed
Definition: Engaging directly with Kalder's IT operations platform through structured demos or trial access to test whether the incident, request, and service management interfaces reflect how the service desk team actually works — not just whether the platform has the right feature set in theory.
Behavioral signal indicators: product_tour engagement; use_case_page views

---

#### requirements_building codes

---

**IT-ACQ-INF-RB-1 — Evaluating Kalder's platform architecture against enterprise standards**
Buying job: requirements_building
Primary role affinity: influencer
Probable job prior: true
Coverage status: constructed
Definition: Assessing whether the Kalder IT operations platform's architecture — its data model, API design, extensibility patterns, and multi-tenant configuration model — meets the organization's enterprise architecture standards and can be responsibly deployed at scale.
Behavioral signal indicators: technical_documentation views; integration catalog page views

---

**IT-ACQ-INF-RB-2 — Stress-testing integration compatibility and API surface depth**
Buying job: requirements_building
Primary role affinity: influencer
Probable job prior: true
Coverage status: constructed
Definition: Verifying that the Kalder IT platform's integrations with the organization's existing toolchain — monitoring systems, CI/CD pipelines, CMDB, identity providers — function as documented and that the API surface is deep enough to support the custom automation workflows the team needs to build.
Behavioral signal indicators: technical_documentation views; product_tour engagement

---

**IT-ACQ-INF-RB-3 — Defining non-functional requirements and scalability criteria**
Buying job: requirements_building
Primary role affinity: influencer
Probable job prior: true
Coverage status: constructed
Definition: Specifying the performance, availability, scalability, and disaster recovery requirements the IT platform must meet — building the non-functional requirements set that will be evaluated during proof of concept and will gate final vendor approval from the Enterprise Architect or platform engineering lead.
Behavioral signal indicators: technical_documentation views; analyst_report downloads

---

#### supplier_selection codes

---

**IT-PRG-CH-SS-1 — Aligning the buying team on platform prioritization trade-offs**
Buying job: supplier_selection
Primary role affinity: champion
Probable job prior: true
Coverage status: partial
Definition: Facilitating internal consensus on which Kalder IT platform capabilities to prioritize for initial deployment — helping the buying group agree on phasing, scope, and the trade-offs between broad adoption and deep implementation in specific workflow areas.
Behavioral signal indicators: competitive_comparison content views; analyst_report downloads

*Note: §17 lists consensus_brief and executive_brief as content_types for this code (phase: converge). Both are distributed internally by Champions. Behavioral signal indicators above reflect diverge-phase content consumption preceding converge distribution.*

---

**IT-PRG-CH-SS-2 — Evangelizing the IT-as-builders vision to the C-suite**
Buying job: supplier_selection
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Building the final executive case for the IT platform investment — presenting the IT-as-builders transformation thesis to CTO and C-suite stakeholders in terms that connect the platform purchase to enterprise outcomes like developer productivity, operational resilience, and AI capability acceleration.
Behavioral signal indicators: roi_calculator completions; case_study downloads

*Note: §17 lists executive_brief as a content_type for this code (phase: converge). Behavioral signal indicators reflect diverge-phase consumption that informs the converge distribution activity.*

---

**IT-PRG-CH-SS-3 — Standing up ITSM use cases and the adoption roadmap**
Buying job: supplier_selection
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Defining and validating the specific IT service management use cases that will be deployed at launch and the adoption roadmap that will move the organization from initial rollout to the full IT-as-builders operating model — ensuring the purchase commitment is backed by a credible implementation plan.
Behavioral signal indicators: use_case_page views; product_tour engagement

---

**IT-PRG-EB-SS-1 — Ratifying the ROI case for the IT transformation investment**
Buying job: supplier_selection
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: partial
Definition: Reviewing and approving the financial model for the IT platform investment — confirming that the ROI assumptions, productivity gain estimates, and consolidation savings projections are defensible and that the investment can be authorized at the Economic Buyer's level.
Behavioral signal indicators: roi_calculator completions; analyst_report downloads

*Note: §17 lists executive_brief as a content_type for this code. Behavioral signal indicators reflect diverge-phase consumption preceding any converge instrument distribution.*

---

**IT-PRG-EB-SS-2 — Confirming the TCO advantage and consolidation savings case**
Buying job: supplier_selection
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Verifying that platform consolidation on Kalder's IT operations platform produces a measurable TCO advantage over the current fragmented tooling environment — confirming that retiring point solutions and reducing integration overhead translates to quantifiable savings the Economic Buyer can defend.
Behavioral signal indicators: benchmark_report downloads; case_study downloads; roi_calculator completions

---

**IT-PRG-EB-SS-3 — Approving the platform investment and multi-year roadmap**
Buying job: supplier_selection
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Authorizing the IT platform investment and the multi-year adoption roadmap — confirming that the financial case, implementation plan, and governance commitments are sufficient to approve the purchase and begin the deployment sequence.
Behavioral signal indicators: roi_calculator completions; analyst_report downloads

*Note: §17 lists executive_brief as a content_type for this code (phase: converge). Behavioral signal indicators reflect diverge-phase consumption preceding converge distribution.*

---

**IT-PRG-INF-SS-1 — Validating Kalder platform fit through proof of concept**
Buying job: supplier_selection
Primary role affinity: influencer
Probable job prior: false
Coverage status: constructed
Definition: Executing a structured technical proof of concept that validates Kalder's IT operations platform against the organization's non-functional requirements, integration requirements, and architecture standards — producing the technical confirmation the buying group needs before committing to the purchase.
Behavioral signal indicators: technical_documentation views; integration catalog page views

---

**IT-PRG-INF-SS-2 — Issuing the architecture recommendation to the buying group**
Buying job: supplier_selection
Primary role affinity: influencer
Probable job prior: false
Coverage status: constructed
Definition: Synthesizing the Enterprise Architect's technical evaluation into a formal recommendation to the buying group — confirming platform fit, stating any implementation conditions or risk mitigations required, and providing the technical authorization the Champion needs to move to final commitment.
Behavioral signal indicators: technical_documentation views; analyst_report downloads

*Note: §17 lists consensus_brief as a content_type for this code (phase: converge). The Influencer's recommendation typically travels via Champion-distributed converge instruments. Behavioral signal indicators above reflect diverge-phase content that informs the recommendation.*

---

**IT-PRG-RAT-SS-1 — Confirming security posture and compliance certifications**
Buying job: supplier_selection
Primary role affinity: ratifier
Probable job prior: true
Coverage status: constructed
Definition: Verifying that Kalder's IT operations platform holds the required security certifications, passes the organization's vendor security assessment, and meets data governance standards — completing the formal security and compliance review that must be cleared before the Ratifier can authorize the purchase.
Behavioral signal indicators: security_compliance content views; governance_policy content views

---

**IT-PRG-RAT-SS-2 — Finalizing data residency terms, SLAs, and contractual conditions**
Buying job: supplier_selection
Primary role affinity: ratifier
Probable job prior: true
Coverage status: constructed
Definition: Negotiating and confirming the data residency commitments, service level agreements, and contractual liability terms the Ratifier requires before the IT platform purchase can be legally authorized — resolving all outstanding governance and procurement conditions.
Behavioral signal indicators: security_compliance content views; analyst_report downloads

---

**IT-PRG-USR-SS-1 — Validating Kalder usability for real incident and request workflows**
Buying job: supplier_selection
Primary role affinity: user
Probable job prior: false
Coverage status: constructed
Definition: Confirming through direct testing that Kalder's incident management, service request, and escalation interfaces work for the service desk team's actual daily workflows — not just that they support the right feature set but that the team can operate them efficiently under real workload conditions.
Behavioral signal indicators: product_tour engagement; use_case_page views

---

**IT-PRG-USR-SS-2 — Recommending IT platform training and onboarding milestones**
Buying job: supplier_selection
Primary role affinity: user
Probable job prior: false
Coverage status: constructed
Definition: Defining the training requirements, onboarding milestones, and adoption support the IT platform rollout must include to bring the service desk team to operational proficiency within the implementation timeline — ensuring that adoption risk is addressed in the purchase commitment.
Behavioral signal indicators: howto_training content views; use_case_page views

---

#### Summary — IT Operations JTBD Code Count

| Buying job group | Code count | Probable_job_prior: true codes |
|---|---|---|
| problem_identification | 7 | 5 |
| solution_exploration | 5 | 5 |
| requirements_building | 3 | 3 |
| supplier_selection | 12 | 8 |
| **Total** | **27** | **21** |

---

**Section 5.3 structural notes for council review:**

1. **All 27 code strings match §17 exactly.** No codes added or omitted.
2. **Constraint 1 observed — IT-ACQ-EB-SE-1.** category_explainer excluded from behavioral signal indicators. competitive_comparison and analyst_report used instead, both consistent with solution_exploration signal lists.
3. **Constraint 2 observed — IT-ACQ-RAT-PI-2.** legal_procurement excluded from behavioral signal indicators. security_compliance and thought_leadership used, same pairing approved for ACQ-RAT-PI-2 in Section 5.2.
4. **Converge-phase content_types noted for five codes.** IT-ACQ-CH-PI-3, IT-PRG-CH-SS-1, IT-PRG-CH-SS-2, IT-PRG-EB-SS-3, IT-PRG-INF-SS-2 all have consensus_brief or executive_brief in §17 content_types. All notes state that behavioral signal indicators reflect diverge-phase consumption only.
5. **Ratifier PI codes: probable_job_prior: false.** PROBABLE_JOB_PRIORS never returns problem_identification for ratifier. IT-ACQ-RAT-PI-1 and IT-ACQ-RAT-PI-2 correctly marked false.
6. **Influencer SS codes: probable_job_prior: false.** PROBABLE_JOB_PRIORS caps influencer at requirements_building. IT-PRG-INF-SS-1 and IT-PRG-INF-SS-2 correctly marked false.
7. **User SS codes: probable_job_prior: false.** Same cap applies. IT-PRG-USR-SS-1 and IT-PRG-USR-SS-2 correctly marked false.

---

## Section 6.4 Risk & Compliance JTBD Library

*Source: §17 JTBD_CODES, risk_compliance section. 26 codes total. All codes at coverage_status: constructed per §17. Note: the RC Ratifier participates across three buying jobs (PI, RB, SS) — more continuous involvement than in any other solution category.*

---

#### problem_identification codes

---

**RC-ACQ-CH-PI-1 — Quantifying the organization's regulatory exposure and compliance gap**
Buying job: problem_identification
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Determining the scope and severity of the organization's current compliance gap — identifying which regulatory obligations are unmet, which controls are manual and fragile, and what the exposure cost of a regulatory failure would be. The Champion (Head of GRC, VP of Risk, Head of Compliance) is establishing that the gap is material enough to warrant investment.
Behavioral signal indicators: diagnostic_assessment tool completions; benchmark_report downloads; thought_leadership content views

---

**RC-ACQ-CH-PI-2 — Building the internal case for automating risk and compliance workflows**
Buying job: problem_identification
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Assembling the evidence that manual compliance workflows — spreadsheet-based control tracking, fragmented evidence collection, point-solution audit preparation — are both operationally unsustainable and a material source of regulatory risk. The Champion needs peer proof and business value framing before engaging Legal and Finance sponsors.
Behavioral signal indicators: analyst_report downloads; thought_leadership content views; benchmark_report downloads

---

**RC-ACQ-CH-PI-3 — Recruiting Legal and Finance as co-sponsors of the GRC platform evaluation**
Buying job: problem_identification
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Engaging Legal counsel and Finance leadership as early evaluation co-sponsors — building the internal alignment necessary to advance a GRC platform evaluation that will require Ratifier participation, budget authorization, and cross-functional sign-off. In risk_compliance evaluations, this recruitment happens earlier than in other categories.
Behavioral signal indicators: thought_leadership content views; analyst_report downloads

*Note: §17 lists consensus_brief and executive_brief as content_types for this code (phase: converge). Both are distributed internally by Champions and are never served via Adobe Target. Behavioral signal indicators reflect diverge-phase content preceding Champion distribution of converge instruments.*

---

**RC-ACQ-EB-PI-1 — Assessing enterprise risk exposure and the cost of non-compliance**
Buying job: problem_identification
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Quantifying what the organization's current risk and compliance posture is costing — in regulatory penalties, audit remediation expense, internal control overhead, and reputational exposure — in terms specific enough to justify a platform investment at the CRO, CFO, or General Counsel level.
Behavioral signal indicators: benchmark_report downloads; analyst_report downloads; diagnostic_assessment tool completions

---

**RC-ACQ-RAT-PI-1 — Establishing regulatory and contractual evaluation boundaries**
Buying job: problem_identification
Primary role affinity: ratifier
Probable job prior: false
Coverage status: constructed
Definition: Defining the legal and regulatory constraints within which the GRC platform evaluation must operate — establishing which regulatory frameworks govern the selection, what procurement policy applies, and what baseline contractual requirements any vendor must satisfy before the organization proceeds. In risk_compliance evaluations, the Ratifier enters at the problem identification stage rather than later.
Behavioral signal indicators: governance_policy content views; thought_leadership content views

*Note: §17 lists legal_procurement as a content_type for this code. legal_procurement is a counter-indicator for problem_identification in the BUYING_JOB_INFERENCE_SIGNALS table and is excluded per Constraint 2.*

---

**RC-ACQ-RAT-PI-2 — Identifying the regulatory obligations the platform must satisfy**
Buying job: problem_identification
Primary role affinity: ratifier
Probable job prior: false
Coverage status: constructed
Definition: Cataloguing the specific regulatory frameworks, industry standards, and contractual obligations that a GRC platform will be required to support — moving from general regulatory awareness to a specific list of compliance requirements the platform must demonstrably address before the Ratifier can authorize evaluation advancement.
Behavioral signal indicators: governance_policy content views; analyst_report downloads

*Note: §17 lists legal_procurement as a content_type for this code. legal_procurement is a counter-indicator for problem_identification and is excluded per Constraint 2.*

---

#### solution_exploration codes

---

**RC-ACQ-CH-SE-1 — Evaluating GRC platform capabilities against the organization's regulatory framework**
Buying job: solution_exploration
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Assessing how well Kalder's GRC platform addresses the organization's specific regulatory and control framework requirements — evaluating coverage of applicable standards, control workflow automation capability, and audit evidence management against the compliance picture established at problem identification.
Behavioral signal indicators: product_solution_overview page views; use_case_page views

*Note: §17 lists competitive_comparison as a content_type for this code. competitive_comparison is a supplier_selection strong indicator and an SE counter-indicator. It is excluded from behavioral signal indicators per Constraint 1.*

---

**RC-ACQ-EB-SE-1 — Evaluating GRC platform versus continued manual controls and point solutions**
Buying job: solution_exploration
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Assessing whether a consolidated GRC platform creates measurably better risk outcomes than the current combination of manual controls, spreadsheets, and disconnected point solutions — building the strategic rationale for platform investment before committing to a specific vendor evaluation.
Behavioral signal indicators: product_solution_overview page views; analyst_report downloads

*Note: §17 lists competitive_comparison and category_explainer as content_types for this code. competitive_comparison is an SE counter-indicator; category_explainer is a problem_identification strong indicator under CR-07. Both excluded from behavioral signal indicators per Constraints 1 and the CR-07 rule.*

---

**RC-ACQ-USR-SE-1 — Surfacing manual control gaps and audit workflow friction**
Buying job: solution_exploration
Primary role affinity: user
Probable job prior: true
Coverage status: constructed
Definition: Identifying the specific control testing, evidence collection, and audit preparation workflows where the current manual or fragmented tools create the most friction for the GRC or security analyst team — translating daily operational pain into evaluation criteria the buying group can act on.
Behavioral signal indicators: use_case_page views; product_tour engagement

---

**RC-ACQ-USR-SE-2 — Evaluating platform usability for control testing and evidence collection workflows**
Buying job: solution_exploration
Primary role affinity: user
Probable job prior: true
Coverage status: constructed
Definition: Testing whether Kalder's GRC platform works for the specific control testing and audit evidence collection tasks the analyst team performs daily — evaluating workflow fit at the task level before requirements are formally documented.
Behavioral signal indicators: product_tour engagement; use_case_page views

---

#### requirements_building codes

---

**RC-ACQ-CH-RB-1 — Defining compliance workflow and control framework requirements**
Buying job: requirements_building
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Translating the organization's compliance obligations and control framework into a structured set of platform requirements — specifying control workflow automation needs, audit evidence management requirements, regulatory reporting scope, and cross-functional access controls that any GRC platform must satisfy.
Behavioral signal indicators: use_case_page views; rfp_template downloads

---

**RC-ACQ-INF-RB-1 — Mapping technical security requirements and integration constraints**
Buying job: requirements_building
Primary role affinity: influencer
Probable job prior: true
Coverage status: constructed
Definition: Defining the technical security requirements and integration constraints a GRC platform must meet — specifying authentication and access control standards, SIEM/SOAR integration requirements, data handling requirements, and API specifications that must be satisfied before the security or privacy officer can endorse the platform.
Behavioral signal indicators: technical_documentation views; security_compliance content views

---

**RC-ACQ-INF-RB-2 — Validating that data residency and privacy controls meet organizational policy**
Buying job: requirements_building
Primary role affinity: influencer
Probable job prior: true
Coverage status: constructed
Definition: Confirming that the GRC platform's data storage architecture, cross-border data transfer controls, and privacy control configuration meet the organization's data residency policy and applicable privacy regulatory requirements — a prerequisite for IT Security Manager or Data Privacy Officer sign-off.
Behavioral signal indicators: governance_policy content views; security_compliance content views

---

**RC-ACQ-RAT-RB-1 — Defining contractual and legal requirements for the GRC platform purchase**
Buying job: requirements_building
Primary role affinity: ratifier
Probable job prior: true
Coverage status: constructed
Definition: Specifying the contractual terms, liability provisions, data processing agreement requirements, and procurement process conditions that must be satisfied before the Ratifier can approve the GRC platform purchase — formalizing the legal requirements set the vendor must meet, distinct from the technical and functional requirements the Champion and Influencer are building in parallel.
Behavioral signal indicators: legal_procurement documentation views; rfp_template downloads

---

#### supplier_selection codes

---

**RC-PRG-CH-SS-1 — Securing CRO and General Counsel endorsement for platform selection**
Buying job: supplier_selection
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Building the formal endorsement from the Chief Risk Officer and/or General Counsel that the selected GRC platform meets the organization's risk management and legal requirements — obtaining the C-suite authorization that distinguishes a GRC platform decision from a standard software purchase and enables final commitment.
Behavioral signal indicators: case_study downloads; analyst_report downloads

*Note: §17 lists executive_brief and consensus_brief as content_types for this code (phase: converge). Both are distributed internally and excluded from behavioral signal indicators. risk_mitigation_plan is also listed but is not a standard behavioral signal indicator content type.*

---

**RC-PRG-CH-SS-2 — Standing up risk control use cases and audit trail demonstrations**
Buying job: supplier_selection
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Demonstrating concretely how Kalder's GRC platform automates the organization's specific risk control workflows and produces the audit trail evidence required for regulatory compliance — grounding the vendor selection in operational proof rather than feature claims before the buying group commits.
Behavioral signal indicators: use_case_page views; case_study downloads; product_tour engagement

---

**RC-PRG-CH-SS-3 — Orchestrating final sign-off across Legal, Finance, and IT**
Buying job: supplier_selection
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Coordinating the final alignment of Legal, Finance, and IT stakeholders on the selected GRC platform — resolving any remaining objections, confirming that all functional, technical, and contractual requirements have been met, and achieving the cross-functional consensus required for a risk_compliance platform purchase.
Behavioral signal indicators: case_study downloads; analyst_report downloads

*Note: §17 lists consensus_brief and executive_brief as content_types for this code (phase: converge). Both excluded from behavioral signal indicators per Constraint 4.*

---

**RC-PRG-EB-SS-1 — Validating risk-reduction ROI and audit cost savings**
Buying job: supplier_selection
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Confirming that the GRC platform investment produces a measurable and defensible reduction in audit preparation cost, compliance remediation expense, and regulatory penalty exposure — building the financial case that enables the Economic Buyer to authorize the purchase at board or CFO level.
Behavioral signal indicators: roi_calculator completions; case_study downloads; analyst_report downloads

---

**RC-PRG-EB-SS-2 — Confirming platform meets the organization's regulatory obligations**
Buying job: supplier_selection
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Verifying that Kalder's GRC platform can demonstrably satisfy the specific regulatory frameworks and compliance standards that the organization is subject to — confirming that the purchase meets the regulatory obligation test that the Economic Buyer must satisfy before authorizing the investment.
Behavioral signal indicators: governance_policy content views; security_compliance content views

---

**RC-PRG-INF-SS-1 — Certifying platform security posture and penetration test findings**
Buying job: supplier_selection
Primary role affinity: influencer
Probable job prior: false
Coverage status: constructed
Definition: Reviewing and confirming Kalder's security certifications, penetration test results, and vulnerability management practices against the organization's vendor security requirements — completing the technical security due diligence that must be passed before the IT Security Manager or Data Privacy Officer can endorse the platform.
Behavioral signal indicators: security_compliance content views; technical_documentation views

---

**RC-PRG-INF-SS-2 — Issuing security and privacy recommendation to the buying group**
Buying job: supplier_selection
Primary role affinity: influencer
Probable job prior: false
Coverage status: constructed
Definition: Synthesizing the Influencer's security posture assessment and privacy control validation into a formal recommendation to the buying group — confirming technical and privacy compliance, stating any residual conditions, and providing the security authorization the Champion needs to advance to final commitment.
Behavioral signal indicators: security_compliance content views; governance_policy content views

*Note: §17 lists consensus_brief as a content_type for this code (phase: converge). The Influencer's recommendation is distributed via Champion converge instruments. Behavioral signal indicators reflect diverge-phase content preceding that distribution.*

---

**RC-PRG-RAT-SS-1 — Confirming regulatory compliance certifications and audit rights**
Buying job: supplier_selection
Primary role affinity: ratifier
Probable job prior: true
Coverage status: constructed
Definition: Verifying that Kalder holds the regulatory compliance certifications the organization requires — SOC 2, ISO 27001, relevant sector certifications — and that the contract includes appropriate audit rights for the organization to verify ongoing compliance. The Ratifier is completing the formal regulatory review that gates final purchase authorization.
Behavioral signal indicators: security_compliance content views; governance_policy content views

---

**RC-PRG-RAT-SS-2 — Negotiating and executing DPA, MSA, and liability terms**
Buying job: supplier_selection
Primary role affinity: ratifier
Probable job prior: true
Coverage status: constructed
Definition: Completing the negotiation of the data processing agreement, master services agreement, and liability provisions with Kalder's legal counterpart — resolving all outstanding contractual conditions so the Ratifier can formally authorize the GRC platform purchase to proceed.
Behavioral signal indicators: legal_procurement documentation views; governance_policy content views

---

**RC-PRG-RAT-SS-3 — Final board or audit committee sign-off on risk posture acceptability**
Buying job: supplier_selection
Primary role affinity: ratifier
Probable job prior: true
Coverage status: constructed
Definition: Presenting the completed GRC platform evaluation findings — security posture, regulatory compliance, contractual terms, and risk-reduction case — to the board or audit committee and obtaining the final governance authorization that enables the organization to proceed with the purchase commitment.
Behavioral signal indicators: security_compliance content views; governance_policy content views

*Note: §17 lists executive_brief and risk_mitigation_plan as content_types for this code. executive_brief is phase: converge and excluded from behavioral signal indicators. risk_mitigation_plan is not a standard behavioral signal indicator content type. Behavioral signal indicators reflect diverge-phase content consistent with Ratifier board-level preparation per Constraint 4.*

---

**RC-PRG-USR-SS-1 — Validating that compliance workflows and reporting meet audit standards**
Buying job: supplier_selection
Primary role affinity: user
Probable job prior: false
Coverage status: constructed
Definition: Confirming through structured testing that Kalder's GRC platform produces the compliance workflow outputs and audit evidence documentation that the organization's internal audit and external examiner standards require — not just that the platform can track controls, but that its outputs are acceptable for actual regulatory use.
Behavioral signal indicators: product_tour engagement; use_case_page views

---

**RC-PRG-USR-SS-2 — Recommending analyst training and control library onboarding milestones**
Buying job: supplier_selection
Primary role affinity: user
Probable job prior: false
Coverage status: constructed
Definition: Defining the control library configuration, analyst training requirements, and onboarding milestones the GRC platform implementation must include — ensuring the GRC and security analyst team can operate the platform at the required compliance depth within the implementation timeline.
Behavioral signal indicators: howto_training content views; use_case_page views

---

#### Summary — Risk & Compliance JTBD Code Count

| Buying job group | Code count | Probable_job_prior: true codes |
|---|---|---|
| problem_identification | 6 | 4 |
| solution_exploration | 4 | 4 |
| requirements_building | 4 | 4 |
| supplier_selection | 12 | 8 |
| **Total** | **26** | **20** |

---

**Section 5.4 structural notes for council review:**

1. **All 26 code strings match §17 exactly.** No codes added or omitted.
2. **Constraint 1 observed — SE counter-indicators.** competitive_comparison excluded from RC-ACQ-CH-SE-1 (product_solution_overview + use_case_page used). Both competitive_comparison and category_explainer excluded from RC-ACQ-EB-SE-1 (product_solution_overview + analyst_report used).
3. **Constraint 2 observed — Ratifier PI codes.** legal_procurement excluded from RC-ACQ-RAT-PI-1 (governance_policy + thought_leadership) and RC-ACQ-RAT-PI-2 (governance_policy + analyst_report).
4. **Constraint 3 observed — RC-ACQ-RAT-RB-1.** legal_procurement included as a behavioral signal indicator (legal_procurement + rfp_template). legal_procurement IS a requirements_building strong indicator and is correct here. This is the first Ratifier RB code in the corpus.
5. **Constraint 4 observed — five converge-phase codes.** Notes appended to RC-ACQ-CH-PI-3, RC-PRG-CH-SS-1, RC-PRG-CH-SS-3, RC-PRG-INF-SS-2, and RC-PRG-RAT-SS-3. For RC-PRG-RAT-SS-3, executive_brief (converge) and risk_mitigation_plan (not a signal indicator content type) are both excluded; security_compliance + governance_policy used instead.
6. **RC-ACQ-RAT-RB-1 probable_job_prior: true.** PROBABLE_JOB_PRIORS returns requirements_building for ratifier at prioritized. First Ratifier RB code in the corpus; correctly marked true.
7. **Ratifier PI codes: probable_job_prior: false.** PROBABLE_JOB_PRIORS returns None for ratifier at targeted and engaged; never returns problem_identification. RC-ACQ-RAT-PI-1 and RC-ACQ-RAT-PI-2 correctly marked false.
8. **Influencer SS codes: probable_job_prior: false.** PROBABLE_JOB_PRIORS caps influencer at requirements_building. RC-PRG-INF-SS-1 and RC-PRG-INF-SS-2 correctly marked false.
9. **User SS codes: probable_job_prior: false.** Same cap applies. RC-PRG-USR-SS-1 and RC-PRG-USR-SS-2 correctly marked false.
10. **Summary counts match the brief's expected values.** PI=6, SE=4, RB=4, SS=12, Total=26, probable_job_prior true=20.

---

## Section 6.5 Employee Experience JTBD Library

*Source: §17 JTBD_CODES, employee_experience section. 25 codes total. All codes at coverage_status: constructed per §17. Note: this category has only 2 requirements_building codes — both Influencer — the smallest RB group in the corpus. The Champion in EX is typically a Head of People Experience, VP of HR Technology, or Chief People Officer; the Ratifier's governance focus is employee data privacy and labor law compliance, not information security architecture.*

---

#### problem_identification codes

---

**EX-ACQ-CH-PI-1 — Building the case that employee experience is a business performance lever**
Buying job: problem_identification
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Establishing that the organization's employee experience gap — fragmented HR case management, low self-service adoption, disconnected onboarding — is driving measurable attrition, productivity loss, and employer brand damage. The Champion is framing EX as a business performance issue, not an HR function concern, before recruiting co-sponsors.
Behavioral signal indicators: thought_leadership content views; benchmark_report downloads; diagnostic_assessment tool completions

---

**EX-ACQ-CH-PI-2 — Collecting peer proof that AI-native HR and EX platforms outperform legacy stacks**
Buying job: problem_identification
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Gathering customer evidence, analyst validation, and peer organization stories that demonstrate AI-native employee experience platforms produce measurably better outcomes than modernized legacy HR systems — building the external credibility the Champion needs before bringing the case to the CHRO and IT leadership.
Behavioral signal indicators: analyst_report downloads; thought_leadership content views; benchmark_report downloads

---

**EX-ACQ-CH-PI-3 — Recruiting the CHRO and IT as co-sponsors before vendor evaluation begins**
Buying job: problem_identification
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Engaging the CHRO and IT leadership as early co-sponsors of the EX platform evaluation — securing the people-strategy sponsorship and technical co-ownership required before a formal vendor evaluation can begin. EX evaluations require CHRO involvement earlier than other categories because the investment governs employee data and HR processes across the organization.
Behavioral signal indicators: thought_leadership content views; analyst_report downloads

*Note: §17 lists consensus_brief and executive_brief as content_types for this code (phase: converge). Both distributed internally by Champions and never served via Adobe Target. Behavioral signal indicators reflect diverge-phase content preceding converge distribution.*

---

**EX-ACQ-EB-PI-1 — Sizing the cost of poor employee experience on retention and productivity**
Buying job: problem_identification
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Quantifying the organizational cost of the current employee experience gap — attrition-related recruiting and training expense, productivity drag from fragmented HR case management, and the employer brand cost of poor onboarding — in financial terms the CFO, CHRO, or COO can evaluate against a platform investment.
Behavioral signal indicators: benchmark_report downloads; diagnostic_assessment tool completions; analyst_report downloads

---

**EX-ACQ-EB-PI-2 — Translating employee experience outcomes into CFO-ready financial language**
Buying job: problem_identification
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Converting HR outcome metrics — engagement scores, time-to-productivity, case resolution time — into the financial terms a CFO requires to evaluate the investment case: retention cost savings, productivity value recovered, and measurable reduction in HR operational overhead.
Behavioral signal indicators: thought_leadership content views; analyst_report downloads; benchmark_report downloads

---

**EX-ACQ-RAT-PI-1 — Establishing employee data privacy boundaries for the platform evaluation**
Buying job: problem_identification
Primary role affinity: ratifier
Probable job prior: false
Coverage status: constructed
Definition: Defining the data privacy requirements any EX platform must satisfy before the organization can evaluate it — establishing what employee data the platform will process, which regional privacy regulations apply (GDPR, CCPA, and regional equivalents), and what consent or notification requirements govern the evaluation process itself.
Behavioral signal indicators: governance_policy content views; security_compliance content views

---

**EX-ACQ-RAT-PI-2 — Identifying labor law compliance and works council requirements**
Buying job: problem_identification
Primary role affinity: ratifier
Probable job prior: false
Coverage status: constructed
Definition: Cataloguing the labor law compliance obligations and, where applicable, works council notification or co-determination requirements that govern the deployment of an employee experience platform in each of the organization's operating jurisdictions — establishing the legal boundaries of the evaluation before vendor engagement proceeds.
Behavioral signal indicators: governance_policy content views; thought_leadership content views

*Note: §17 lists legal_procurement as a content_type for this code. legal_procurement is a counter-indicator for problem_identification in the BUYING_JOB_INFERENCE_SIGNALS table and is excluded per Constraint 2.*

---

#### solution_exploration codes

---

**EX-ACQ-CH-SE-1 — Evaluating AI-native EX platform against the current point solution patchwork**
Buying job: solution_exploration
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Assessing whether a unified AI-native employee experience platform can replace the organization's current combination of disconnected HR case management, onboarding tools, and service portal products — evaluating platform consolidation against the accumulated complexity of the existing point solution landscape.
Behavioral signal indicators: product_solution_overview page views; use_case_page views

*Note: §17 lists competitive_comparison as a content_type for this code. competitive_comparison is an SE counter-indicator and is excluded per Constraint 1.*

---

**EX-ACQ-EB-SE-1 — Assessing build vs. buy vs. consolidate options for HR technology**
Buying job: solution_exploration
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Evaluating the three strategic paths for the organization's HR technology investment — continuing to build on the existing HCM/HRIS stack, buying a dedicated EX platform, or consolidating onto an enterprise platform with EX capabilities — before committing to a specific vendor evaluation direction.
Behavioral signal indicators: product_solution_overview page views; analyst_report downloads

*Note: §17 lists competitive_comparison and category_explainer as content_types for this code. competitive_comparison is an SE counter-indicator; category_explainer is a problem_identification strong indicator under CR-07. Both excluded per Constraint 1.*

---

**EX-ACQ-USR-SE-1 — Surfacing daily HR workflow friction and case management gaps**
Buying job: solution_exploration
Primary role affinity: user
Probable job prior: true
Coverage status: constructed
Definition: Identifying the specific HR service request, case management, and employee self-service workflows where the current tools create the most friction for HR service delivery teams — translating the daily operational experience of HR practitioners into evaluation criteria the buying group can act on.
Behavioral signal indicators: use_case_page views; product_tour engagement

---

**EX-ACQ-USR-SE-2 — Evaluating self-service and portal usability from the employee perspective**
Buying job: solution_exploration
Primary role affinity: user
Probable job prior: true
Coverage status: constructed
Definition: Testing whether the EX platform's employee-facing self-service portal, knowledge base, and case submission interfaces are genuinely usable by the broad employee population — not just HR practitioners — before the organization commits to a platform that employees will interact with directly.
Behavioral signal indicators: product_tour engagement; use_case_page views

---

#### requirements_building codes

---

**EX-ACQ-INF-RB-1 — Mapping HR technology requirements against existing systems of record**
Buying job: requirements_building
Primary role affinity: influencer
Probable job prior: true
Coverage status: constructed
Definition: Defining how the EX platform must integrate with the organization's existing HRIS, HCM, payroll, and identity management systems — specifying integration requirements, data synchronization standards, and API dependencies that determine whether the platform can be deployed without disrupting existing HR data infrastructure.
Behavioral signal indicators: technical_documentation views; integration catalog page views

---

**EX-ACQ-INF-RB-2 — Stress-testing workflow fit for target employee populations**
Buying job: requirements_building
Primary role affinity: influencer
Probable job prior: true
Coverage status: constructed
Definition: Evaluating whether the EX platform's HR service delivery workflows and employee self-service experience fit the specific employee populations the organization must serve — including different employment types, geographies, and language requirements — before requirements are formally locked.
Behavioral signal indicators: use_case_page views; product_tour engagement

---

#### supplier_selection codes

---

**EX-PRG-CH-SS-1 — Securing CHRO sponsorship and budget commitment for the EX platform**
Buying job: supplier_selection
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Building the financial and strategic case that earns CHRO endorsement and secures the budget commitment needed to authorize the EX platform purchase — connecting the platform investment to the CHRO's people strategy priorities and demonstrating that the ROI justifies the organizational change the implementation will require.
Behavioral signal indicators: roi_calculator completions; case_study downloads

*Note: §17 lists executive_brief and consensus_brief as content_types for this code alongside roi_calculator. executive_brief and consensus_brief are phase: converge and excluded from behavioral signal indicators. roi_calculator is phase: diverge and is included. Per Constraint 3, roi_calculator is the primary diverge-phase signal indicator for this code.*

---

**EX-PRG-CH-SS-2 — Standing up employee journey use cases to ground the buying group's decision**
Buying job: supplier_selection
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Demonstrating concretely how the Kalder EX platform addresses the organization's specific employee journey moments — onboarding, life event management, self-service case resolution — with use cases the CHRO, IT, and Finance stakeholders can evaluate against their own operational reality before committing.
Behavioral signal indicators: use_case_page views; case_study downloads; product_tour engagement

---

**EX-PRG-CH-SS-3 — Orchestrating final consensus across HR, IT, and Finance**
Buying job: supplier_selection
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Coordinating the final alignment of HR, IT, and Finance stakeholders on the selected EX platform — resolving remaining objections, confirming that functional, technical, and budget requirements are met, and achieving the cross-functional buy-in required to authorize the purchase.
Behavioral signal indicators: case_study downloads; analyst_report downloads

*Note: §17 lists consensus_brief and executive_brief as content_types for this code (phase: converge). Both excluded per Constraint 4. risk_mitigation_plan is also listed but is not a standard behavioral signal indicator content type.*

---

**EX-PRG-EB-SS-1 — Validating ROI on the employee experience transformation investment**
Buying job: supplier_selection
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Confirming that the EX platform investment produces a defensible financial return — validating the retention cost savings, productivity recovery, and HR operational efficiency gains that justify the investment at CFO, CHRO, or COO level, with numbers specific enough to survive board-level scrutiny.
Behavioral signal indicators: roi_calculator completions; case_study downloads; analyst_report downloads

---

**EX-PRG-EB-SS-2 — Confirming people-outcomes metrics align with corporate strategy**
Buying job: supplier_selection
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Verifying that the EX platform investment produces measurable progress on the people-outcome metrics the organization's corporate strategy requires — talent retention rate, time-to-productivity for new hires, HR service delivery satisfaction — confirming that the platform purchase serves the board-level people strategy, not just the HR function.
Behavioral signal indicators: benchmark_report downloads; case_study downloads; analyst_report downloads

---

**EX-PRG-EB-SS-3 — Understanding the change management and adoption plan**
Buying job: supplier_selection
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Assessing what organizational change management, employee communication, and adoption support the EX platform implementation requires — confirming that the rollout plan accounts for the employee population impact and that adoption risk is budgeted and managed within the purchase commitment.
Behavioral signal indicators: use_case_page views; case_study downloads

---

**EX-PRG-INF-SS-1 — Validating integration with HRIS and payroll systems**
Buying job: supplier_selection
Primary role affinity: influencer
Probable job prior: false
Coverage status: constructed
Definition: Confirming through technical validation that the Kalder EX platform integrates reliably with the organization's HRIS, HCM, and payroll systems — verifying that employee data synchronization, identity federation, and API connections function as specified in the context of the organization's actual infrastructure.
Behavioral signal indicators: technical_documentation views; integration catalog page views

---

**EX-PRG-INF-SS-2 — Issuing technical and process fit recommendation to the buying group**
Buying job: supplier_selection
Primary role affinity: influencer
Probable job prior: false
Coverage status: constructed
Definition: Synthesizing the Influencer's integration validation and workflow assessment into a formal recommendation to the buying group — confirming that the EX platform meets technical and process requirements, stating any implementation conditions, and providing the cross-functional authorization the Champion needs to advance to final commitment.
Behavioral signal indicators: use_case_page views; technical_documentation views

*Note: §17 lists consensus_brief as a content_type for this code (phase: converge). Distributed by Champions internally; excluded from behavioral signal indicators. Behavioral signal indicators reflect diverge-phase content that informs the recommendation.*

---

**EX-PRG-RAT-SS-1 — Confirming employee data governance and GDPR or regional compliance**
Buying job: supplier_selection
Primary role affinity: ratifier
Probable job prior: true
Coverage status: constructed
Definition: Verifying that the Kalder EX platform's employee data governance architecture, cross-border data transfer controls, and compliance certifications satisfy GDPR and any applicable regional data protection requirements — completing the employee data privacy review that must be cleared before the Ratifier can authorize the purchase.
Behavioral signal indicators: security_compliance content views; governance_policy content views

---

**EX-PRG-RAT-SS-2 — Finalizing contract terms and data processing agreements for employee data**
Buying job: supplier_selection
Primary role affinity: ratifier
Probable job prior: true
Coverage status: constructed
Definition: Negotiating and confirming the data processing agreement, contractual liability terms, and employee data handling commitments required by the organization's privacy obligations and, where applicable, works council agreements — completing the legal authorization that enables the EX platform purchase to proceed.
Behavioral signal indicators: legal_procurement documentation views; governance_policy content views

---

**EX-PRG-USR-SS-1 — Validating that day-to-day HR workflows are genuinely simplified**
Buying job: supplier_selection
Primary role affinity: user
Probable job prior: false
Coverage status: constructed
Definition: Confirming through direct testing that the Kalder EX platform genuinely reduces the workload and complexity of the HR service delivery team's daily case management, routing, and resolution tasks — not just that the platform supports more sophisticated workflows, but that it makes the practitioner's daily job measurably easier.
Behavioral signal indicators: product_tour engagement; use_case_page views

---

**EX-PRG-USR-SS-2 — Recommending employee onboarding and training milestones for the HR team**
Buying job: supplier_selection
Primary role affinity: user
Probable job prior: false
Coverage status: constructed
Definition: Defining the training curriculum, onboarding milestones, and adoption support the EX platform rollout must include for the HR service delivery team and the broader employee population — ensuring that adoption risk is explicitly addressed in the purchase commitment before the organization proceeds.
Behavioral signal indicators: howto_training content views; use_case_page views

---

#### Summary — Employee Experience JTBD Code Count

| Buying job group | Code count | Probable_job_prior: true codes |
|---|---|---|
| problem_identification | 7 | 5 |
| solution_exploration | 4 | 4 |
| requirements_building | 2 | 2 |
| supplier_selection | 12 | 8 |
| **Total** | **25** | **19** |

---

**Section 5.5 structural notes for council review:**

1. **All 25 code strings match §17 exactly.** No codes added or omitted.
2. **Constraint 1 observed — SE counter-indicators.** competitive_comparison excluded from EX-ACQ-CH-SE-1 (product_solution_overview + use_case_page). Both competitive_comparison and category_explainer excluded from EX-ACQ-EB-SE-1 (product_solution_overview + analyst_report).
3. **Constraint 2 observed — EX-ACQ-RAT-PI-2.** legal_procurement excluded (governance_policy + thought_leadership used). EX-ACQ-RAT-PI-1 uses governance_policy + security_compliance directly from §17 — no exclusion required.
4. **Constraint 3 observed — EX-PRG-CH-SS-1.** roi_calculator retained as a diverge-phase SS strong indicator. executive_brief and consensus_brief excluded as phase: converge. roi_calculator + case_study used.
5. **Constraint 4 observed — three converge-phase codes.** Notes appended to EX-ACQ-CH-PI-3 (thought_leadership + analyst_report), EX-PRG-CH-SS-3 (case_study + analyst_report), and EX-PRG-INF-SS-2 (use_case_page + technical_documentation).
6. **Only 2 requirements_building codes.** Both Influencer, per §17. The RB subheading correctly has only these two entries — no Champion, EB, User, or Ratifier RB codes exist for employee_experience.
7. **Ratifier PI codes: probable_job_prior: false.** PROBABLE_JOB_PRIORS returns None for ratifier at targeted and engaged. EX-ACQ-RAT-PI-1 and EX-ACQ-RAT-PI-2 correctly marked false.
8. **Influencer SS and User SS: probable_job_prior: false.** PROBABLE_JOB_PRIORS caps both influencer and user at requirements_building. EX-PRG-INF-SS-1, EX-PRG-INF-SS-2, EX-PRG-USR-SS-1, EX-PRG-USR-SS-2 correctly marked false.
9. **Summary counts match the brief's expected values.** PI=7, SE=4, RB=2, SS=12, Total=25, probable_job_prior true=19.

---

## Section 6.6 AI Platform JTBD Library

*Source: §17 JTBD_CODES, ai_platform section. 27 codes total. All codes at coverage_status: constructed per §17. The ai_platform Influencer is an ML engineer, MLOps lead, or enterprise architect evaluating model serving infrastructure and data pipeline fit — structurally more independent from the Champion than Influencers in other categories. The Ratifier's primary governance concern is responsible AI posture: model transparency, bias controls, and AI ethics compliance alongside data sovereignty.*

---

#### problem_identification codes

---

**AI-ACQ-CH-PI-1 — Building organizational awareness of the AI infrastructure gap**
Buying job: problem_identification
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Establishing that the organization's current fragmented AI tool landscape — separate systems for agents, automation, ML serving, and analytics — is costing engineering velocity and preventing the organization from building durable AI capabilities at scale. The Champion (Chief AI Officer, VP of AI/ML, Head of Data Platform) is making the case that platform fragmentation is an infrastructure risk, not just a tooling inconvenience.
Behavioral signal indicators: thought_leadership content views; benchmark_report downloads; diagnostic_assessment tool completions

---

**AI-ACQ-CH-PI-2 — Collecting proof that unified AI platforms outperform point-tool proliferation**
Buying job: problem_identification
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Gathering customer evidence and analyst validation that organizations operating on unified AI platforms ship AI capabilities faster, with more consistent governance, than organizations maintaining separate point tools for each AI domain — building the peer credibility the Champion needs before bringing the standardization case to CTO and business unit leadership.
Behavioral signal indicators: analyst_report downloads; case_study downloads; thought_leadership content views

---

**AI-ACQ-CH-PI-3 — Aligning the CTO and business unit leaders on AI platform strategy**
Buying job: problem_identification
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Recruiting the CTO and key business unit leaders as co-sponsors of the AI platform standardization initiative — establishing the executive-level alignment required before a formal vendor evaluation can begin, and framing AI platform investment as a strategic capability investment rather than an infrastructure cost.
Behavioral signal indicators: thought_leadership content views; analyst_report downloads

*Note: §17 lists consensus_brief and executive_brief as content_types for this code (phase: converge). Both distributed internally by Champions; never served via Adobe Target. Behavioral signal indicators reflect diverge-phase content preceding converge distribution.*

---

**AI-ACQ-EB-PI-1 — Quantifying the cost of fragmented AI and automation point tools**
Buying job: problem_identification
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Establishing the organizational cost of the current fragmented AI tool landscape — duplicate vendor contracts, engineering time lost to cross-system integration maintenance, AI capability gaps that slow product delivery — in financial terms the CTO, CDO, or COO can evaluate against a platform consolidation investment.
Behavioral signal indicators: benchmark_report downloads; diagnostic_assessment tool completions; analyst_report downloads

---

**AI-ACQ-EB-PI-2 — Translating AI platform investment into strategic business outcomes**
Buying job: problem_identification
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Reframing the AI platform investment from an infrastructure modernization decision into a strategic capability commitment — connecting platform standardization to measurable business outcomes such as engineering velocity improvement, time-to-market for AI features, and the organization's ability to compound AI capabilities over a multi-year roadmap.
Behavioral signal indicators: thought_leadership content views; analyst_report downloads; benchmark_report downloads

---

**AI-ACQ-RAT-PI-1 — Establishing AI governance policy and model transparency requirements**
Buying job: problem_identification
Primary role affinity: ratifier
Probable job prior: false
Coverage status: constructed
Definition: Defining the organization's AI governance policy requirements and model transparency standards that any AI platform must satisfy — specifying what model explainability documentation, bias audit capabilities, and AI decision audit rights are required before the organization can deploy models at scale on a third-party platform.
Behavioral signal indicators: governance_policy content views; security_compliance content views

---

**AI-ACQ-RAT-PI-2 — Identifying data sovereignty, residency, and privacy requirements**
Buying job: problem_identification
Primary role affinity: ratifier
Probable job prior: false
Coverage status: constructed
Definition: Cataloguing the data sovereignty, cross-border transfer restrictions, and privacy regulatory requirements that govern where the organization's training data, model artifacts, and inference outputs can be processed and stored — establishing the data residency constraints any AI platform vendor must satisfy before evaluation advances.
Behavioral signal indicators: governance_policy content views; thought_leadership content views

*Note: §17 lists legal_procurement as a content_type for this code. legal_procurement is a counter-indicator for problem_identification in the BUYING_JOB_INFERENCE_SIGNALS table and is excluded per Constraint 4.*

---

#### solution_exploration codes

---

**AI-ACQ-CH-SE-1 — Evaluating AI platform architectures: build vs. buy vs. compose**
Buying job: solution_exploration
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Assessing the architectural options for the organization's AI platform layer — building infrastructure in-house on open-source components, purchasing a commercial AI platform, or composing capabilities from a managed platform with custom extensions — evaluating the engineering and organizational tradeoffs of each path before committing to a vendor direction.
Behavioral signal indicators: product_solution_overview page views; use_case_page views

*Note: §17 lists competitive_comparison and technical_documentation as content_types for this code. competitive_comparison is an SS strong indicator and SE counter-indicator; technical_documentation is an RB strong indicator and SE counter-indicator. Both excluded per Constraint 1.*

---

**AI-ACQ-CH-SE-2 — Prototyping AI platform evaluation criteria with ML and data engineering peers**
Buying job: solution_exploration
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Developing the evaluation framework for the AI platform assessment by working through platform capabilities hands-on with the ML engineering and data engineering teams — establishing shared evaluation criteria before requirements are formally documented so that the Champion's case reflects the technical teams' actual assessment priorities.
Behavioral signal indicators: use_case_page views; product_tour engagement

*Note: §17 lists technical_documentation as a content_type for this code. technical_documentation is an RB strong indicator and SE counter-indicator; excluded per Constraint 2.*

---

**AI-ACQ-EB-SE-1 — Assessing the AI platform vendor landscape against the enterprise AI strategy**
Buying job: solution_exploration
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Evaluating which AI platform vendors are credible partners for the organization's multi-year AI strategy — assessing market position, platform coverage across agent, automation, and ML serving domains, and strategic roadmap durability before the Economic Buyer commits to a vendor evaluation direction.
Behavioral signal indicators: product_solution_overview page views; analyst_report downloads

*Note: §17 lists competitive_comparison (SE counter-indicator) and category_explainer (problem_identification strong indicator under CR-07) as content_types for this code. Both excluded per Constraint 3.*

---

**AI-ACQ-USR-SE-1 — Surfacing friction in current data pipeline and model deployment workflows**
Buying job: solution_exploration
Primary role affinity: user
Probable job prior: true
Coverage status: constructed
Definition: Identifying the specific data pipeline management, model deployment, and experiment tracking workflows where the current tooling creates the most friction for the ML engineering and data analyst team — translating daily platform pain into evaluation criteria before requirements are formally specified.
Behavioral signal indicators: use_case_page views; product_tour engagement

---

**AI-ACQ-USR-SE-2 — Evaluating platform usability for day-to-day analytics and model work**
Buying job: solution_exploration
Primary role affinity: user
Probable job prior: true
Coverage status: constructed
Definition: Testing whether Kalder's AI platform makes the data analyst's and ML practitioner's daily work — notebook-to-production pipelines, self-service analytics, experiment management — genuinely faster and less error-prone, rather than just offering more configuration options than the current tooling.
Behavioral signal indicators: product_tour engagement; use_case_page views

---

#### requirements_building codes

---

**AI-ACQ-INF-RB-1 — Defining technical requirements for model serving, orchestration, and data access**
Buying job: requirements_building
Primary role affinity: influencer
Probable job prior: true
Coverage status: constructed
Definition: Specifying the model serving latency and throughput requirements, orchestration framework compatibility, and data access patterns the AI platform must support — building the technical requirements set that will govern vendor evaluation from the ML engineering and MLOps perspective.
Behavioral signal indicators: technical_documentation views; integration catalog page views

---

**AI-ACQ-INF-RB-2 — Stress-testing AI platform fit against the existing data infrastructure**
Buying job: requirements_building
Primary role affinity: influencer
Probable job prior: true
Coverage status: constructed
Definition: Evaluating whether the Kalder AI platform integrates reliably with the organization's existing data lakes, feature stores, streaming infrastructure, and identity systems — determining whether the platform can consume and produce data in the formats and at the scale the engineering team requires before requirements are locked.
Behavioral signal indicators: technical_documentation views; product_tour engagement

---

**AI-ACQ-INF-RB-3 — Evaluating MLOps, model lineage, and observability capabilities**
Buying job: requirements_building
Primary role affinity: influencer
Probable job prior: true
Coverage status: constructed
Definition: Assessing whether the Kalder AI platform's MLOps toolchain — model versioning, lineage tracking, drift detection, and inference observability — meets the organization's requirements for production-grade AI deployment and regulatory audit readiness. The Influencer is determining whether the platform can support the operational discipline the organization's AI governance policy requires.
Behavioral signal indicators: technical_documentation views; use_case_page views

---

#### supplier_selection codes

---

**AI-PRG-CH-SS-1 — Securing CTO and CDO commitment to AI platform standardization**
Buying job: supplier_selection
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Building the financial and strategic case that earns CTO and CDO endorsement for standardizing on the Kalder AI platform — connecting platform consolidation to engineering velocity gains, AI governance improvement, and the multi-year capability compounding that standardization enables.
Behavioral signal indicators: roi_calculator completions; case_study downloads

*Note: §17 lists executive_brief and consensus_brief as content_types alongside roi_calculator. executive_brief and consensus_brief are phase: converge and excluded from behavioral signal indicators per Constraint 5. roi_calculator is phase: diverge and is included.*

---

**AI-PRG-CH-SS-2 — Standing up AI platform use cases across agent, automation, and data domains**
Buying job: supplier_selection
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Demonstrating concretely how the Kalder AI platform serves the organization's active use cases across the agent, automation, and data domains — grounding the platform selection in operational proof across the full scope of the organization's AI capability needs, not just a single domain.
Behavioral signal indicators: use_case_page views; case_study downloads; product_tour engagement

---

**AI-PRG-CH-SS-3 — Orchestrating AI governance and Ratifier alignment before platform commitment**
Buying job: supplier_selection
Primary role affinity: champion
Probable job prior: true
Coverage status: constructed
Definition: Coordinating the AI governance review and Ratifier sign-off processes before the platform purchase commitment is finalized — ensuring that responsible AI requirements, data sovereignty conditions, and contractual terms have been resolved so the buying group can commit without downstream governance risk.
Behavioral signal indicators: case_study downloads; analyst_report downloads

*Note: §17 lists consensus_brief (converge, excluded), governance_policy, and risk_mitigation_plan as content_types. Consensus_brief excluded per Constraint 5. governance_policy and risk_mitigation_plan are diverge-compatible but absent from SS strong/weak indicator lists; case_study and analyst_report (both SS weak indicators) used instead for signal table consistency.*

---

**AI-PRG-EB-SS-1 — Validating AI platform ROI and engineering productivity gains**
Buying job: supplier_selection
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Confirming that the AI platform investment produces a defensible return in engineering productivity — validating time-to-deployment improvements, infrastructure cost consolidation savings, and the reduction in cross-system integration overhead that justifies the platform investment at CTO, CDO, or COO level.
Behavioral signal indicators: roi_calculator completions; case_study downloads; analyst_report downloads

---

**AI-PRG-EB-SS-2 — Confirming the platform roadmap aligns with the organization's multi-year AI strategy**
Buying job: supplier_selection
Primary role affinity: economic_buyer
Probable job prior: true
Coverage status: constructed
Definition: Verifying that Kalder's AI platform development roadmap aligns with the organization's multi-year AI capability strategy — confirming that the platform vendor will be a durable strategic partner who extends the platform in the directions the organization's AI ambition requires, not just a vendor who meets today's requirements.
Behavioral signal indicators: analyst_report downloads; thought_leadership content views

---

**AI-PRG-INF-SS-1 — Running proof of concept on production data and real model workloads**
Buying job: supplier_selection
Primary role affinity: influencer
Probable job prior: false
Coverage status: constructed
Definition: Executing a production-grade proof of concept on the organization's actual data and real model workloads — validating that the Kalder AI platform performs at the latency, throughput, and reliability levels required by production AI systems, not just in a sandboxed evaluation environment.
Behavioral signal indicators: technical_documentation views; use_case_page views

---

**AI-PRG-INF-SS-2 — Issuing technical platform recommendation to engineering leadership**
Buying job: supplier_selection
Primary role affinity: influencer
Probable job prior: false
Coverage status: constructed
Definition: Synthesizing the ML engineering and MLOps team's technical evaluation — proof of concept results, integration assessment, observability and governance capability review — into a formal recommendation to engineering leadership that confirms platform fit, states any implementation conditions, and provides the technical authorization for the purchase.
Behavioral signal indicators: technical_documentation views; analyst_report downloads

*Note: §17 lists consensus_brief as a content_type for this code (phase: converge). Excluded from behavioral signal indicators per Constraint 5. technical_documentation retained as a diverge-phase indicator appropriate for an Influencer synthesizing a technical recommendation.*

---

**AI-PRG-RAT-SS-1 — Auditing AI model explainability, bias controls, and responsible AI posture**
Buying job: supplier_selection
Primary role affinity: ratifier
Probable job prior: true
Coverage status: constructed
Definition: Reviewing Kalder's AI platform documentation, audit logs, and model governance tooling to confirm that model explainability, bias detection, and responsible AI controls meet the organization's AI ethics policy and any applicable regulatory requirements — completing the formal responsible AI review that must precede final purchase authorization.
Behavioral signal indicators: governance_policy content views; security_compliance content views

---

**AI-PRG-RAT-SS-2 — Confirming data processing terms, SLAs, and vendor AI liability posture**
Buying job: supplier_selection
Primary role affinity: ratifier
Probable job prior: true
Coverage status: constructed
Definition: Negotiating and confirming the data processing agreement, service level commitments, and contractual liability terms related to AI model behavior and data sovereignty — resolving the Ratifier's outstanding legal conditions before the AI platform purchase can be formally authorized.
Behavioral signal indicators: legal_procurement documentation views; governance_policy content views

---

**AI-PRG-RAT-SS-3 — Final sign-off: AI platform meets enterprise AI ethics and compliance bar**
Buying job: supplier_selection
Primary role affinity: ratifier
Probable job prior: true
Coverage status: constructed
Definition: Presenting the completed AI platform governance review to the board or audit committee and obtaining final authorization — confirming that the Kalder AI platform's responsible AI posture, data sovereignty commitments, model transparency documentation, and contractual protections satisfy the organization's enterprise AI ethics and compliance requirements.
Behavioral signal indicators: governance_policy content views; security_compliance content views

*Note: §17 lists executive_brief (converge, excluded), governance_policy, and risk_mitigation_plan as content_types. executive_brief excluded per Constraint 5. governance_policy and security_compliance used as behavioral signal indicators consistent with a final Ratifier governance sign-off.*

---

**AI-PRG-USR-SS-1 — Validating that analyst and ML practitioner workflows are genuinely improved**
Buying job: supplier_selection
Primary role affinity: user
Probable job prior: false
Coverage status: constructed
Definition: Confirming through structured testing that the Kalder AI platform measurably reduces friction in the data analyst's and ML practitioner's daily workflow — experiment management, pipeline debugging, model deployment handoffs — rather than simply providing a more sophisticated environment that requires more configuration overhead than the current tooling.
Behavioral signal indicators: product_tour engagement; use_case_page views

---

**AI-PRG-USR-SS-2 — Recommending developer onboarding and platform training milestones**
Buying job: supplier_selection
Primary role affinity: user
Probable job prior: false
Coverage status: constructed
Definition: Defining the developer onboarding curriculum, platform certification requirements, and training milestones the AI platform rollout must include for the ML engineering and data analyst teams — ensuring that time-to-productivity on the new platform is explicitly planned and that the transition from the current fragmented tool stack is managed without capability gaps.
Behavioral signal indicators: howto_training content views; use_case_page views

---

#### Summary — AI Platform JTBD Code Count

| Buying job group | Code count | Probable_job_prior: true codes |
|---|---|---|
| problem_identification | 7 | 5 |
| solution_exploration | 5 | 5 |
| requirements_building | 3 | 3 |
| supplier_selection | 12 | 8 |
| **Total** | **27** | **21** |

---

**Section 5.6 structural notes for council review:**

1. **All 27 code strings match §17 exactly.** No codes added or omitted. This is the final Section 6 batch; all five solution category libraries are now drafted.
2. **Constraint 1 observed — AI-ACQ-CH-SE-1.** competitive_comparison (SS counter-indicator for SE) and technical_documentation (RB strong indicator, SE counter-indicator) both excluded. product_solution_overview + use_case_page used.
3. **Constraint 2 observed — AI-ACQ-CH-SE-2.** technical_documentation excluded (SE counter-indicator). use_case_page + product_tour used; both SE strong indicators.
4. **Constraint 3 observed — AI-ACQ-EB-SE-1.** competitive_comparison (SE counter-indicator) and category_explainer (PI strong indicator under CR-07) excluded. product_solution_overview + analyst_report used; analyst_report retained from §17 as it is not an SE counter-indicator.
5. **Constraint 4 observed — AI-ACQ-RAT-PI-2.** legal_procurement excluded (PI counter-indicator). governance_policy + thought_leadership used.
6. **Constraint 5 — five mixed-phase codes handled individually:**
   - AI-PRG-CH-SS-1: executive_brief and consensus_brief (converge) excluded; roi_calculator (diverge, SS strong) retained. roi_calculator + case_study used.
   - AI-PRG-CH-SS-3: consensus_brief (converge) excluded; governance_policy and risk_mitigation_plan retained but absent from SS signal lists; case_study + analyst_report (both SS weak indicators) used for signal table consistency.
   - AI-PRG-INF-SS-2: consensus_brief (converge) excluded; technical_documentation (diverge) retained. technical_documentation + analyst_report used.
   - AI-PRG-RAT-SS-3: executive_brief (converge) excluded; governance_policy + security_compliance used (consistent with Ratifier final sign-off pattern established in RC and EX sections).
   - AI-ACQ-CH-PI-3: consensus_brief + executive_brief (both converge) excluded; thought_leadership + analyst_report used (same pattern as analogous PI-3 codes in prior batches).
7. **Ratifier PI codes: probable_job_prior: false.** PROBABLE_JOB_PRIORS never returns problem_identification for ratifier. AI-ACQ-RAT-PI-1 and AI-ACQ-RAT-PI-2 correctly marked false.
8. **Influencer SS codes: probable_job_prior: false.** PROBABLE_JOB_PRIORS caps influencer at requirements_building. AI-PRG-INF-SS-1 and AI-PRG-INF-SS-2 correctly marked false.
9. **User SS codes: probable_job_prior: false.** Same cap applies. AI-PRG-USR-SS-1 and AI-PRG-USR-SS-2 correctly marked false.
10. **Summary counts match the brief's expected values.** PI=7, SE=5, RB=3, SS=12, Total=27, probable_job_prior true=21.

---

**Section 6 corpus-wide completion note.** With Section 5.6 complete, all five solution category JTBD libraries are drafted:

| Section | Category | Code count | Probable_job_prior: true |
|---|---|---|---|
| 5.2 | customer_engagement | 26 | 18 |
| 5.3 | it_operations | 27 | 21 |
| 5.4 | risk_compliance | 26 | 20 |
| 5.5 | employee_experience | 25 | 19 |
| 5.6 | ai_platform | 27 | 21 |
| **Total** | | **131** | **99** |

Total code count of 131 matches §17's stated library size. Section 6 is ready for full council lock review per the batch review process specified in the section brief.

---

## Section 7: The Buying Job Inference Model

---

### 6.1 What the Buying Job Model Is and Why It Exists

Role classification tells the program who a visitor is in the buying group. Buying job confidence tells the program what they are actively trying to accomplish right now. These are independent dimensions, and they answer different questions. A Champion's role does not change as their evaluation progresses — they remain the Champion from the first time they engage with kalder.com content to the final commitment meeting. But a Champion's buying job shifts substantially across that same period. Early in the evaluation, the Champion is asking whether the problem is real, how their organization's situation compares to peers, and whether the problem category is worth solving. Mid-evaluation, they are exploring which vendors address the problem and what differentiation looks like. As the evaluation matures, they are building requirements and collecting the peer validation and proof points they need to build an internal case. Late in the evaluation, they are comparing Kalder against finalists and constructing the closing argument. Same person. Same role. Different jobs.

The content requirements at each of these moments are genuinely different. A Champion three weeks from a final commitment decision does not need thought leadership content on why IT operations modernization matters — they have already internalized that case. What they need is competitive differentiation evidence, ROI-ready proof points, and content they can use to close the internal conversation with the Economic Buyer. A Champion who started their evaluation last Tuesday needs precisely the opposite. Role tells the program this visitor is a Champion. Buying job tells the program which Champion content to serve.

Three-axis personalization — role × stage × buying job — is the ceiling of the program's personalization capability. It requires a confident role classification and a buying job signal: either explicitly declared through a progressive disclosure prompt or inferred from behavioral patterns. It also requires deeper content inventory than two-axis: a variant for each role, stage, and buying job combination rather than each role and stage combination. Setting correct expectations matters here. Most visitors, most of the time, are in the default UNKNOWN buying job state, and two-axis personalization with a statistically grounded prior is what they receive. That is not a degraded state. It is the normal operating state of the program. Three-axis personalization is the additional layer the program activates when the signal quality supports it.

---

### 6.2 The Three Confidence States

#### KNOWN

A visitor reaches KNOWN buying job confidence by responding to a progressive disclosure prompt and explicitly declaring their current evaluation context. This is zero-party data — the visitor stated it directly, and that statement carries more information than any behavioral pattern could infer. KNOWN is the highest-quality buying job signal the program can collect.

The activation condition for KNOWN has one constraint: the visitor's role confidence must be MEDIUM or HIGH. The program does not surface a buying job prompt to a visitor whose role is uncertain — asking someone whose classification is LOW or UNKNOWN what phase of their evaluation they are in assumes a buying group context that hasn't been established. Section 4 of this document specifies the progressive disclosure design, timing, and copy standards.

When a visitor reaches KNOWN state, three-axis personalization activates: the program selects content matched to their role, their pipeline stage, and their declared buying job. KNOWN is the only state that activates three-axis at MEDIUM role confidence. The design rationale is precise: zero-party self-identification is a Tier 2 data source — a direct statement from the visitor that compensates for the uncertainty in a behavioral role inference at MEDIUM confidence. A visitor who says "I'm currently building requirements for an IT operations evaluation" has provided higher-quality buying job information than any behavioral pattern could produce, regardless of whether their role classification is MEDIUM or HIGH. The declaration replaces inference; the inference uncertainty no longer applies.

KNOWN persists across sessions. It decays 90 days from the date of declaration. After 90 days without a re-confirmation, the state resets to UNKNOWN and the visitor is treated as if no declaration was made. The 90-day window reflects how enterprise evaluation cycles actually work: a declared context — "we are in requirements-building mode" — remains stable for the duration of a normal evaluation phase, which typically spans several months. The window is also calibrated to the 90-day behavioral signal decay window used elsewhere in the scoring model, so that the declared context ages out at roughly the same time as the behavioral signals that were contemporaneous with it. The expiry check requires reading the timestamp set when the attribute was written — an implementation that reads the attribute value without checking its timestamp will incorrectly activate three-axis on stale declared data. [Cross-reference: Document 5, Section 2.2 for the attribute expiry check implementation.]

#### INFERRED

A visitor reaches INFERRED buying job confidence when the pipeline detects that their content consumption pattern crosses the threshold established in the inference signal model — without any direct declaration. INFERRED is behavioral pattern matching: the system observes what the visitor has been consuming and infers which buying job that pattern most closely represents.

The threshold requires two or more distinct strong indicator content types, observed in the current session or in the last 30 days. The breadth requirement is essential: the same content type consumed twice in the same session counts as one distinct type, not two. Consuming three analyst reports counts as one strong indicator for problem_identification, not three. The threshold requires evidence that the visitor has engaged with multiple aspects of a buying job, not concentrated engagement with a single content format.

The inference is computed as a pipeline operation against the BUYING_JOB_INFERENCE_SIGNALS structure in the data model. When the threshold is met, the pipeline writes the inferred buying job to the AEP contact profile as a timestamped attribute. [Cross-reference: Document 2, Section 7.3; data model §4.]

When INFERRED activates three-axis personalization, it does so only at HIGH role confidence. At MEDIUM role confidence, INFERRED buying job does not activate three-axis. This is the MEDIUM asymmetry rule, and it is not a limitation — it is a deliberate design decision with a specific rationale. At MEDIUM role confidence, the program has already made a probabilistic inference: the behavioral evidence is strong enough to classify this visitor as most likely a Champion, but not strong enough to reach HIGH. Layering a second probabilistic inference — "and also they are most likely building requirements" — on top of that first one means the program could be serving content calibrated to the wrong role doing the wrong job. The compounded error surface of two simultaneous behavioral inferences is wider than the value of the additional specificity. The expected accuracy of content served to a MEDIUM + INFERRED visitor is lower than the expected accuracy of content served to a HIGH + INFERRED visitor, by a margin that justifies the asymmetry. A visitor at MEDIUM + INFERRED receives the same two-axis + prior treatment as a MEDIUM + UNKNOWN visitor. A content strategist or demand gen manager who observes that a MEDIUM-confidence visitor with strong behavioral signals is receiving the same content as a visitor with no behavioral signals is observing the asymmetry rule functioning correctly — not a personalization failure.

INFERRED is not session-persistent. At each session start, INFERRED buying job is re-evaluated from fresh behavioral evidence: signals from the current session plus the last 30 days. A visitor who was in INFERRED requirements_building yesterday is not guaranteed to be in INFERRED requirements_building today — if the current session produces no strong indicators and the 30-day window has expired, the state is UNKNOWN at this session. The 30-day decay and session-level re-inference reflect a design principle: buying jobs shift within an evaluation cycle. An Influencer who was consuming technical documentation last month may be looking at ROI calculators this month. INFERRED state is designed to track that movement, not to persist a stale inference that no longer reflects the visitor's actual evaluation activity.

#### UNKNOWN

UNKNOWN is the default buying job state. It applies whenever role confidence is below MEDIUM, or when role confidence is MEDIUM or higher but neither KNOWN nor INFERRED conditions are met. UNKNOWN has no stored attribute in the AEP profile — its presence is inferred from the absence of buying_job_confirmed and buying_job_inferred. It is not something the pipeline writes; it is the default reached by the absence of the other two states.

When a visitor is in UNKNOWN state, two-axis + prior applies: the program selects content on the role × stage axes, with PROBABLE_JOB_PRIORS providing the buying job variant selection within that frame. UNKNOWN is not a failure state. Most visitors are in UNKNOWN state for most of their evaluation journey. Progressive disclosure is a targeted enrichment mechanism for higher-confidence contacts, and the behavioral inference threshold is designed to be meaningful, not easily triggered. Two-axis + prior is the normal operating state of the program; it produces role-appropriate, stage-appropriate content selection based on statistically grounded expectations about what each role at each stage is most likely working on.

---

### 6.3 How Behavioral Inference Works: Signal Patterns and the INFERRED Threshold

The BUYING_JOB_INFERENCE_SIGNALS structure maps content types to buying jobs through three indicator tiers. Understanding what each tier means operationally matters for content commissioning decisions.

Strong indicators are content types whose consumption is a reliable signal of the associated buying job. They count toward the two-distinct-type threshold required for INFERRED state. A content type that is a strong indicator for a buying job is directly associated with the evaluation task that buying job describes. Content strategists who want their content to contribute to buying job inference — who want engagement with their commissioned content to move visitors toward INFERRED state — should focus on strong indicator content types for the buying jobs their audience is likely working on.

Weak indicators provide contextual evidence about a visitor's evaluation activity but do not count toward the inference threshold. A visitor who consumed only weak indicator content types does not reach INFERRED state regardless of how much content they consumed. Weak indicators can appear in combination with strong indicators without affecting the threshold count; they provide signal context but not threshold credit.

Counter-indicators are content types whose consumption pattern suggests the visitor may be navigating across buying job boundaries. They do not block inference — if two strong indicators are met, INFERRED activates. But counter-indicator co-occurrence is flagged in the AEP profile as a signal-quality marker. A visitor who has consumed technical documentation (a strong requirements_building indicator) and an ROI calculator (a strong supplier_selection indicator, and a counter-indicator for requirements_building) may be transitioning between buying jobs. The program infers the current job from the threshold-meeting signals; practitioners reviewing performance reports should treat counter-indicator co-occurrence as a flag that the inference may be capturing a transitional state rather than stable buying job activity.

The full BUYING_JOB_INFERENCE_SIGNALS mapping is in Document 2, Section 7.3. The four worked examples below illustrate how the threshold applies in practice:

**problem_identification:** A visitor views an analyst report one week and a benchmark report six days later. Both are strong indicators for problem_identification. Two distinct strong indicator content types within 30 days → INFERRED: problem_identification. The inference reflects that this visitor is asking whether the problem category is real and how their organization's situation compares to industry peers — they are building the case that the problem merits investigation, not yet evaluating vendors.

**solution_exploration:** A visitor accesses a product overview page and a use case page in the same session. Both are strong indicators for solution_exploration. Two distinct strong indicators in the current session → INFERRED: solution_exploration. The visitor has moved from problem framing to vendor category evaluation — they are asking "which solutions address this problem?" and "what does this vendor specifically do?"

**requirements_building:** A visitor views technical documentation and then browses the integration catalog in the same session. Both are strong indicators for requirements_building. Two distinct strong indicators in the current session → INFERRED: requirements_building. The visitor is evaluating implementation fit — integration with existing systems, technical requirements for deployment — not just whether the solution category is relevant.

**supplier_selection:** A visitor completes an ROI calculator and views the pricing page in the same session. Both are strong indicators for supplier_selection. Two distinct strong indicators in the current session → INFERRED: supplier_selection. The visitor is in financial validation and vendor comparison mode — they are shortlisting vendors and building the economic case that will justify a final decision.

The CR-07 cascade note: in data model v0.2.0, the category_explainer content type was moved from the solution_exploration strong indicators list to the problem_identification strong indicators list. The rationale: category explainer content orients early-stage buyers to a solution space and the problems it addresses. A visitor consuming a category explainer is asking "does this category of solution address my problem?" — that is a problem identification question, not a vendor evaluation question. Content authors who commission category explainer content should understand that engagement with it generates problem_identification inference signals, not solution_exploration signals. [Cross-reference: data model §9, §7a CR-07.]

---

### 6.4 The PROBABLE_JOB_PRIORS: Content Selection in UNKNOWN State

PROBABLE_JOB_PRIORS is a role × buying group stage lookup table that returns the most probable buying job for each combination. When a visitor is in UNKNOWN buying job state, the program consults this table to select which buying-job-tagged content variant to serve within the two-axis role × stage frame. PROBABLE_JOB_PRIORS is a content selection input, not a classification claim. The program is not asserting that a Champion at the engaged stage is in solution_exploration — it is selecting the content variant most likely to be relevant given everything the program knows about the visitor.

The full table, locked from Document 2, Section 7.4:

| Role | Targeted | Engaged | Prioritized | Qualified |
|---|---|---|---|---|
| Champion | problem_identification | solution_exploration | requirements_building | supplier_selection |
| Economic Buyer | problem_identification | solution_exploration | requirements_building | supplier_selection |
| Influencer | solution_exploration | solution_exploration | requirements_building | requirements_building |
| User | solution_exploration | solution_exploration | requirements_building | requirements_building |
| Ratifier | None | None | requirements_building | supplier_selection |

Three design choices in this table deserve explicit explanation.

**The Ratifier None values at targeted and engaged.** PROBABLE_JOB_PRIORS returns None for the Ratifier role at targeted and engaged stages. This is not a missing data case — it is a designed behavior. Ratifiers do not participate in early-stage buying activity. Asking "what buying job is this Ratifier working on?" at targeted or engaged is a premature question; the Ratifier's role in the buying group does not activate until the evaluation has progressed to requirements framing. The program has a specified response to a None return: the null-prior fallback rules from Document 5, Section 2.5 govern content selection for affected module types. Those rules are fully specified there and cross-referenced here; Section 7 does not re-specify them.

**The Influencer and User cap at requirements_building.** Unlike Champion and Economic Buyer, whose priors advance to supplier_selection at the qualified stage, Influencer and User priors cap at requirements_building even when the buying group has reached final vendor selection. This reflects how these roles actually function at late stages. Influencers and Users are not primary participants in the final vendor selection decision and the commitment process — those belong to Champion, Economic Buyer, and Ratifier. At the qualified stage, the Influencer's primary contribution is confirming that the requirements they shaped are met by the vendor under evaluation. The User's primary contribution is confirming that adoption and workflow fit have been validated. These are requirements-confirmation jobs, not independent supplier selection jobs. The prior reflects this role-appropriate ceiling; it is a representation of how enterprise buying groups actually work, not a limitation on the program's ability to serve Influencers and Users.

**Why PROBABLE_JOB_PRIORS is not a degraded experience.** The risk practitioners sometimes bring to this table is the assumption that UNKNOWN + prior means "the program doesn't know what to serve and is guessing." That framing is wrong. The prior is deterministic — given a role and a stage, the table returns one value, every time. And it is informed — it reflects the statistical expectation of what each role at each stage is most likely working on, based on how enterprise B2B buying groups actually behave across those role and stage combinations. A Champion at the engaged stage who is in UNKNOWN buying job state receives content variants selected for solution_exploration — which, in expectation, is where most Champions at that stage actually are. That is not a guess. It is the best available selection given the information the program has.

---

### 6.5 The Interaction of Role Confidence and Buying Job Confidence

The following matrix specifies what content selection behavior each combination of role confidence and buying job confidence produces. It is authoritative from Document 2, Section 7.5 and Document 5, Section 2.2.

| Role Confidence | Buying Job Confidence | Personalization Axes | Notes |
|---|---|---|---|
| HIGH | KNOWN | Three-axis: role × stage × buying_job_confirmed | Highest specificity — explicit declaration + strong role signal |
| HIGH | INFERRED | Three-axis: role × stage × buying_job_inferred | Strong role signal supports the second inference layer |
| HIGH | UNKNOWN | Two-axis + prior | PROBABLE_JOB_PRIORS governs buying job variant selection |
| MEDIUM | KNOWN | Three-axis: role × stage × buying_job_confirmed | Zero-party declaration offsets MEDIUM role uncertainty |
| MEDIUM | INFERRED | Two-axis + prior | INFERRED excluded at MEDIUM — double inference too speculative |
| MEDIUM | UNKNOWN | Two-axis + prior | Standard MEDIUM treatment |
| LOW / UNKNOWN role | Any | Levels 3–5 cascade | Role confidence insufficient; buying job axis not evaluated |

Four active states produce role-specific, stage-specific, buying-job-specific content selection:

HIGH + KNOWN is the highest-specificity state: the visitor's role is confirmed with the strongest behavioral evidence, and their buying job was declared directly. The content selection operates on all three axes without inference uncertainty in either dimension.

HIGH + INFERRED activates three-axis with probabilistic job selection. The role signal is strong enough to carry the second inference layer — the INFERRED buying job adds specificity that, at HIGH role confidence, is worth the inference cost.

MEDIUM + KNOWN activates three-axis because the zero-party declaration eliminates the inference layer. The MEDIUM role uncertainty remains, but the buying job is not inferred — it was stated. These are different qualities of uncertainty, and the self-identification compensates for the role classification uncertainty.

HIGH + UNKNOWN receives two-axis + prior. When the role signal is strong but no buying job evidence is present, the prior provides the best available buying job variant selection.

The MEDIUM + INFERRED exclusion deserves explicit restatement as an architectural constraint, not a conditional. A MEDIUM + INFERRED visitor always receives two-axis + prior, regardless of how strong the behavioral inference signals are. There is no threshold of INFERRED signal strength that promotes a MEDIUM visitor to three-axis. A visitor with near-HIGH behavioral role signals and near-certain buying job inference signals at MEDIUM role confidence still receives two-axis + prior. The exclusion is unconditional by design.

At LOW or UNKNOWN role confidence, buying job confidence is not evaluated at all. The visitor receives level-appropriate fallback content — Level 3, 4, or 5 depending on what identification exists — and the buying job axis is irrelevant to that selection.

---

### 6.6 Measurement Implications and the Holdback Asymmetry

The holdback group's structural exclusion from KNOWN buying job state is a named measurement asymmetry in the program's holdback design. Progressive disclosure never fires for holdback visitors; they never encounter a buying job prompt and therefore never produce a declared buying job. The buying_job_confirmed attribute is never set for holdback contacts. A holdback visitor at HIGH role confidence can reach INFERRED buying job state through behavioral inference — if their content consumption crosses the two-strong-indicator threshold within the 30-day window. But they cannot reach KNOWN state, regardless of how engaged they are. A holdback visitor at MEDIUM role confidence cannot reach three-axis personalization at all: KNOWN is structurally unavailable (no progressive disclosure fires), and INFERRED is excluded at MEDIUM by the asymmetry rule. MEDIUM holdback visitors are permanently in the two-axis + prior state for the duration of the program.

The four module types that participate in three-axis personalization are the call-to-action, gated assets, proof, and use cases slots. For these slots, the treatment group can receive buying-job-specific content that holdback visitors structurally cannot receive — even when the treatment and holdback contacts have comparable role and stage classifications. This asymmetry is not a system error. It is an intended consequence of the holdback design and must be accounted for in Document 7's lift measurement methodology. An unadjusted comparison of click rates or conversion rates on these four module types between holdback and treatment populations will understate treatment performance, because the treatment group benefits from buying-job specificity that holdback visitors cannot access. Document 7 owns the specific methodology for adjusting lift comparisons on three-axis slots; Section 7 establishes the asymmetry as a named condition that methodology must address.

UNKNOWN is the correct measurement baseline for evaluating the buying job inference model's contribution. The incremental lift of KNOWN state over UNKNOWN state measures the value of zero-party buying job declaration. The incremental lift of INFERRED state over UNKNOWN state measures the value of behavioral buying job inference. UNKNOWN state is not a separate control condition — it IS two-axis + prior, which is the standard operating state for most visitors. Measurement analysts structuring buying job model evaluation should treat UNKNOWN as the baseline and measure KNOWN and INFERRED as incremental above it, on the three-axis module types where buying job specificity is applied. Document 7 owns the measurement design; Section 7 establishes the baseline framing.

---

*End of Section 7. The full BUYING_JOB_INFERENCE_SIGNALS table, PROBABLE_JOB_PRIORS nested dict, and AEP attribute specifications are in Document 2, Section 7 and the data model (§4). The progressive disclosure design that produces KNOWN state is in Section 4 of this document. The null-prior fallback rules for Ratifier at targeted and engaged stages are in Document 5, Section 2.5.*

---

## Section 8: Sales Activation Integration

---

### 7.1 What Sales Activation Integration Is and Is Not

This section specifies three things: the alert payload the program produces when a buying group approaches a convergence point, the two contact-level gates that must clear before an Outreach sequence fires, and the split between fields the program owns canonically and fields clients configure at onboarding. It does not cover the AEP → Salesforce → Outreach routing implementation — that is Document 8. It does not define what a convergence point is or what happens at each one — that is Section 5. It does not specify the content assets referenced in recommended actions — those are in Document 4 and Section 6.

The distinction that governs everything else in this section: convergence point alerts are the program's intelligence output, not status updates. They encode what the buying intelligence layer has detected — role confidence states, buying job inference shifts, signal density patterns — and convert that detection into a specific action the BDR or AE should take. The recommended_action field is the most important field in the alert payload precisely because it makes the difference between an alert that a practitioner acts on and one that becomes noise. An alert that says "Champion and Economic Buyer are approaching business value alignment" is a status update. An alert that says "EB is building or stress-testing the business case — provide a pre-built ROI model with inputs populated for their industry and company size" [§SA SALES_ACTIVATION_CONFIG] is an intelligence output. The program produces the second kind.

Ownership in the alert payload divides cleanly: the program owns the canonical fields — the trigger conditions, the payload contents, and especially the recommended_action text — because those fields encode the buying intelligence and reflect the behavioral model's interpretation of the buying group's state. Clients configure three fields at onboarding: the Salesforce CRM field the alert writes to, the Outreach sequence triggered, and the delivery channels. The onboarding boundary is enforced by the data model: "trigger_condition and alert_payload (including recommended_action) are canonical — they encode the buying intelligence and must not be modified at onboarding" [§SA SALES_ACTIVATION_CONFIG onboarding_note]. What is the most common onboarding mistake? Rewriting the recommended_action text to match the client's preferred sales language. The language matters less than the action specificity — and the specificity is what makes the alert useful rather than noise.

---

### 7.2 The Canonical Alert Payload Structure

Every convergence point alert produces a six-field payload. Three fields are canonical — owned by the program and not modified at onboarding. Three fields are client-configured at onboarding, because they depend on the client's CRM schema and Outreach sequence library.

| Field | Contents | Canonical / Client-configured |
|---|---|---|
| `bg_stage` | The account's buying group stage at alert time | Canonical |
| `convergence_point` | The convergence point being approached | Canonical |
| `roles_active` | List of roles at MEDIUM+ confidence at the account | Canonical |
| `blocker_risk` | Named blocker condition(s) that pose risk at this convergence point | Canonical |
| `recommended_action` | Practitioner-facing action guidance | **Canonical — must not be modified at onboarding** |
| `crm_field` | Salesforce field into which the alert is written | Client-configured |
| `sdr_sequence` / `alert_channel` | Outreach sequence triggered + delivery channel(s) | Client-configured |

The delivery channels for alerts are `crm_task` and `slack_sdr_channel` — both are listed in `alert_channel` in §SA SALES_ACTIVATION_CONFIG and both are client-configured at onboarding. A BDR or AE who does not receive an expected alert should check both their CRM task queue and their Slack SDR channel — alerts can arrive on either surface depending on onboarding configuration. [Document 8 — sequence variant configuration per channel.]

**On the recommended_action field.** This field does not describe what the program detected. It tells the BDR or AE what to do next. The recommended_action text for each convergence point is locked in §SA SALES_ACTIVATION_CONFIG and represents the buying group model's interpretation of that specific buying moment translated into practitioner action. When Problem Validation is approaching, the field instructs the BDR to share a benchmark report or named-account story — not to pitch features, because the group is still in diverge phase and solution content is premature at that moment [§SA problem_validation.alert_payload.recommended_action]. When Risk & Compliance Validation is approaching, the field instructs the AE to proactively provide the SOC 2 report, DPA template, and Trust Center summary — because the most common failure mode at this convergence point is reactive, not proactive, Ratifier engagement [§SA risk_compliance_validation.alert_payload.recommended_action]. Modifying this text at onboarding to match a client's preferred tone or vocabulary removes the action specificity that makes the alert valuable. The canonical text must be delivered as written.

**On the blocker_risk field.** This field names the risk conditions most likely to stall the buying group at this convergence point. It is drawn from the common blockers in §18 BUYING_GROUP_CONVERGENCE_POINTS and the blocker_risk field in §SA SALES_ACTIVATION_CONFIG. When the program detects signals consistent with a blocker being active — for example, a capital_review_board signal appearing alongside risk_compliance_validation approach patterns — the blocker_risk field names it. When no blocker signals have fired, the field names the blockers the BDR or AE should watch for proactively. Problem Validation alerts name misalignment_on_problem and buying_group_turnover; Final Commitment alerts name buying_group_turnover, contract_updates_required, and purchasing_rules_overrule_group_decision. [Cross-reference Section 5 for the full practitioner treatment of each blocker at each convergence point.]

---

### 7.3 The Two Contact-Level Gates

Before any Outreach sequence fires for a contact, two conditions must both be true. These gates operate independently of the account's cohort assignment — a contact at a correctly cohorted account can fail either gate and not trigger a sequence. [Document 3, Section 3.3; §SA SALES_ACTIVATION_CONFIG.]

**Gate 1 — confidence_tier must be MEDIUM or HIGH.**

The program fires sequences on signal, not on coincidence. A contact at MEDIUM+ confidence has produced enough behavioral accumulation for the scoring engine to have a stable role classification — one where the program trusts its own inference enough to act on it. Acting on a LOW or UNKNOWN confidence contact with a sales sequence would mean targeting someone whose role the program does not reliably know.

What it looks like when a contact fails Gate 1: the account is in the right cohort, a convergence point alert has fired for the account, but the specific contact carries confidence_tier: LOW. No sequence fires for that contact. This is correct behavior — the program is protecting the BDR from acting on a weak signal.

What to do: check the contact's AEP profile for confidence_tier. If LOW, check whether a progressive disclosure prompt is eligible for this contact — Section 4 specifies the prompt activation conditions by confidence tier and fallback level. A progressive disclosure response that produces a zero-party role declaration will upgrade the contact to MEDIUM+ through the Tier 2 pathway [Document 2, Section 9.4], making them eligible for sequence activation on their next qualifying visit.

**Gate 2 — differential_insufficient must be False.**

differential_insufficient: True is a specific LOW-tier state. It fires when the scoring engine's top-scoring role and second-highest-scoring role are within 10 points of each other — the program cannot reliably distinguish which role this person holds. Their confidence_tier is capped at LOW (score capped at 49) regardless of how much behavioral signal they have accumulated. The signal is real; the role ambiguity is the problem. Activating a sequence for this contact would mean targeting them as one role when the behavioral evidence says it could plausibly be a different role.

What it looks like when a contact fails Gate 2: a contact with substantial behavioral engagement history — multiple sessions, multiple content types consumed — produces no sequence trigger. Their account may be in the acquisition or progression cohort. A convergence point alert may have fired for the account. The contact's own engagement is visible in behavioral reports. But no sequence fires because differential_insufficient: True caps their tier at LOW.

The diagnostic path is complete and sequential: (a) check differential_insufficient in the AEP contact profile — this is the first step when a contact with strong engagement has no sequence trigger; (b) if True, the sequence correctly did not fire because two roles scored too close to distinguish; (c) the resolution path is a progressive disclosure prompt — a Level 2 or Level 3 prompt that invites the contact to self-identify their role. Zero-party self-identification resolves the ambiguity, sets differential_insufficient: False as part of the Tier 2 classification pathway, and makes the contact eligible for sequence activation. [Document 5, Section 1.2; Document 5, Section 3.]

Both gates apply to every contact at every account in every cohort. A contact must clear both to trigger a sequence. Clearing one while failing the other produces no sequence, and the BDR or AE should diagnose both before concluding an account is not sales-activatable.

---

### 7.4 Per-Cohort Alert Activation

| Cohort | Active convergence point alerts | Alert recipient | PENDING? |
|---|---|---|---|
| education | None | — | — |
| acquisition | problem_validation, requirements_framing | BDR (SDR-owned sequence) | — |
| progression_early_to_mature | solution_validation, business_value_alignment, risk_compliance_validation | AE (AE-owned sequence) | — |
| progression_win_now | final_commitment, risk_compliance_validation (elevated priority) | AE (AE-owned sequence) | PENDING — Kafka sfdc_opportunity_stage pipeline confirmation required |

The education cohort contains accounts with no identified contacts at sufficient confidence — there are no sequence triggers for contacts at this stage, and BDRs should not expect alerts for education-cohort accounts. [Document 3, Section 6.4.]

risk_compliance_validation appears in both progression_early_to_mature and progression_win_now. In progression_early_to_mature it fires at standard priority, appropriate for Stage 2–4 opportunities where the Ratifier is entering a deal that still has active evaluation work ahead. In progression_win_now it fires at elevated priority, reflecting the higher loop-back severity of a late Ratifier block at Stage 5–7 — at that point, a purchasing_rules_overrule_group_decision or legal_flag blocker is a full_reset risk after months of evaluation work [Section 4.6]. Until progression_win_now is confirmed active (PENDING-SA-2 below), risk_compliance_validation for accounts that should be in progression_win_now fires via the progression_early_to_mature alert path at standard priority.

---

### 7.5 The tal_channel Routing Dimension

The tal_channel attribute on the AEP account profile — with values direct, msp, and partner — routes convergence point alerts to the appropriate sales team and may select a different Outreach sequence variant. direct accounts follow the standard routing paths described in Section 7.4: acquisition alerts go to SDR-owned sequences; progression alerts go to AE-owned sequences. msp and partner accounts route to channel-specific sequences or to partner-aware SDR and AE teams configured at onboarding. The canonical alert payload — trigger_condition, alert_payload contents, recommended_action — applies to all channel variants without modification. What changes across channels is the sequence triggered and the alert recipient, both of which are client-configured at onboarding.

Clients with partner or MSP channel models must configure tal_channel-specific sequence variants at onboarding before sales activation goes live for those accounts. An msp or partner account that reaches a convergence point without a channel-specific sequence configured will fall back to direct routing if the onboarding configuration does not include a channel guard. [Document 8 — sequence variant configuration per tal_channel value.]

---

### 7.6 The classification_mismatch Advisory Notification

The classification_mismatch advisory notification is a separate instrument from convergence point alerts. It fires on a contact attribute state, not a convergence point proximity event. It does not trigger a sequence. It does not block or modify any active sequence. And it is delivered as an informational notification to the assigned AE — not an SDR activation signal.

When classification_mismatch = True is present on a contact's AEP profile, the AEP-to-Outreach sync writes an advisory notification to the assigned AE. The notification names the behavioral role and the firmographic role as inferred from title data, specifies that the AE should review recent page activity to assess which frame is more accurate, and explicitly states that it is informational and does not block or modify any active sequence. The exact notification language is locked in Document 5, Section 9.6 and must not be modified at onboarding.

The notification exists because it is actionable intelligence, not a data quality flag. An AE approaching a contact as a Champion when the contact's title suggests CFO — or vice versa — is a conversation calibration risk. The program surfaces this divergence proactively rather than leaving the AE to discover it mid-call. Two clarifications about what the notification does and does not mean: first, the behavioral classification governs the contact's experience on kalder.com and governs sequence targeting — the firmographic title data is supplementary intelligence for the AE's judgment about how to frame the next conversation, not a corrective override. Second, the notification does not reveal or name the source of the firmographic inference. The AE is told that title data suggests a specific role — not which firmographic data provider produced that inference, and not that the contact has been matched via any reverse-identification mechanism. The notification is a practitioner intelligence briefing about an interesting divergence, with a concrete action attached to it. [Document 5, Section 9.6; Document 5, Section 5.4 Case 2.]

---

### 7.7 Holdback Group and Sales Activation

Holdback contacts (holdback_group: True) never receive progressive disclosure prompts — Section 3.6 establishes this as an architectural enforcement requirement that protects the holdback group's measurement integrity. They can, however, accumulate behavioral confidence through organic signal accumulation on kalder.com. If a holdback contact reaches MEDIUM+ confidence through behavioral accumulation alone, the two-gate check in Section 7.3 applies identically to them: if confidence_tier is MEDIUM+ and differential_insufficient is False, the contact is eligible for Outreach sequence activation. The holdback designation suppresses progressive disclosure; it does not suppress sales activation. What the holdback design creates is an asymmetry: because holdback contacts cannot benefit from the zero-party confidence upgrade that progressive disclosure provides — which is the primary path for contacts with ambiguous or near-threshold behavioral scores to reach MEDIUM+ — they are less likely to clear the confidence_tier gate than comparable treatment contacts who have had the opportunity to self-identify. This asymmetry is a known characteristic of the holdback design. It must be accounted for in Document 7's measurement methodology when comparing sales activation rates between treatment and holdback populations. [Cross-reference Section 6.6 for the full holdback measurement asymmetry treatment.]

---

### 7.8 Open Items for Document 8

The following items are unresolved at the time of Document 6 Section 7 lock. Document 8 is the responsible document for each. Until confirmed, the interim behaviors described below apply.

| PENDING item | What needs confirmation | System or pipeline involved | Interim behavior |
|---|---|---|---|
| **PENDING-SA-1** | AEP → Salesforce → Outreach routing implementation. Confirm whether alert payload delivery uses the Real-Time CDP connector, a Kafka outbound event, or a Salesforce workflow triggered by AEP segment membership changes. Confirm expected alert-to-sequence-trigger latency and the mechanism by which Salesforce passes the payload to Outreach. | AEP Real-Time CDP connector or Kafka outbound; Salesforce CRM; Outreach | No active alert delivery until routing is confirmed. Alert payload structure is fully specified in §SA SALES_ACTIVATION_CONFIG. |
| **PENDING-SA-2** | progression_win_now cohort activation. Confirm Kafka sfdc_opportunity_stage pipeline feasibility. The progression_win_now Outreach AE sequences — including the final_commitment convergence point alert and the elevated-priority risk_compliance_validation alert — are not active until the pipeline is confirmed. | Kafka sfdc_opportunity_stage pipeline; AEP account-plane cohort assignment | Accounts that should be in progression_win_now receive progression_early_to_mature sequences and standard-priority convergence point alerts until confirmation. At confirmation, AEP will reassign these accounts and activate the elevated-priority paths. [Document 3, Section 6.4 PENDING.] |
| **PENDING-SA-3** | primary_solution_interest attribute registration in CLIENT_ATTRIBUTE_MAP (§CA). This attribute was added in Document 6, Section 3 as a new account-plane computed attribute derived from tal_solution_interest_flags by the AEP pipeline. It holds the single highest-signal solution category key for the account and is read by Target at Level 4 to select the solution-category-specific progressive_disclosure node. Document 8 must confirm AEP pipeline computation implementation and register the attribute in §CA. | AEP pipeline (account-plane computation); CLIENT_ATTRIBUTE_MAP §CA | Level 4 progressive_disclosure falls back to the cross-category brand prompt node when primary_solution_interest is null or unregistered. [Document 6, Section 3.5; Document 6, Section 3.7 Requirement 2.] |
| **PENDING-SA-4** | Alert delivery latency SLA. The time between a convergence point trigger condition being met in AEP and the Outreach sequence firing is unspecified until the routing path (PENDING-SA-1) is confirmed. Document 8 must specify the expected latency window and define what constitutes a latency SLA breach for high-severity convergence points — specifically Risk & Compliance Validation and Final Commitment, where a delayed alert at a deal-critical moment can produce a loop-back that would not have occurred with timely activation. | AEP scoring pipeline → Outreach delivery path (full chain per PENDING-SA-1) | No SLA can be specified or monitored until the routing path is confirmed. |

---

*End of Section 8. This is the final section of Document 6. Document 6 is ready for full council lock review. Document 8 (Operational Runbook) is the next document in the corpus dependency chain. Document 8's first task is to resolve PENDING-SA-1 through PENDING-SA-4, which block production implementation of the sales activation layer.*

---

## Cross-Reference Table

| Document | Relationship | Specific Dependency |
|---|---|---|
| `kalder_data_model.py` | Document 6 depends on this | `§5 COVERAGE_STATUS` (coverage_status per JTBD code entry), `§17 JTBD_CODES` (canonical code strings, buying_job assignments, coverage_status values), `§18 BUYING_GROUP_CONVERGENCE_POINTS` (six convergence point definitions, trigger conditions, severity levels), `§SA SALES_ACTIVATION_CONFIG` (machine-readable trigger_condition and alert_payload specifications for all six convergence points) |
| Document 1 — Buying Group Role Architecture | Document 6 depends on this | Five role definitions and convergence point participation map that anchor the stage model, JTBD code library structure, and double-diamond phase assignments per role |
| Document 2 — Signal Definition and Confidence Model | Document 6 depends on this | Buying job confidence model (KNOWN/INFERRED/UNKNOWN), `BUYING_JOB_INFERENCE_SIGNALS`, and `PROBABLE_JOB_PRIORS` that govern JTBD inference and the buying job inference model in Section 7 |
| Document 3 — Audience and Segmentation Architecture | Depends on Document 6 | Stage definitions and convergence point proximity signals that inform campaign cohort assignment logic and channel activation thresholds |
| Document 4 — Content Model and Taxonomy | Depends on Document 6 | Convergence point definitions and double-diamond phase structure that govern converge content type generation rules (`executive_brief`, `consensus_brief`) and through-line requirement enforcement |
| Document 5 — Personalization Decisioning Rules | Depends on Document 6 | Progressive disclosure UX specifications (Section 4 — prompt copy, correction paths, placement rules, Level 2/3/4 variants) and convergence point definitions that Section 4 and Section 8 of Document 5 reference |
| Document 7 — Measurement and Experimentation Framework | Depends on Document 6 | Stage model and convergence point velocity metrics that define measurement dimensions; holdback-and-sales-activation asymmetry noted in Section 8.7 that Document 7 must account for in activation rate analysis |
| Document 8 — Operational Runbook | Depends on Document 6 | Sales activation integration specification (Section 8), convergence point alert payload structure, and PENDING-SA-1 through PENDING-SA-4 open items that Document 8 must resolve for production implementation |
| Document 9 — Privacy and Consent Architecture | Document 6 depends on this | Consent-state gating conditions that determine when progressive disclosure prompts may render and what role identification data may be collected and stored |
