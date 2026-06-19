# Kalder Phase 2 — Layer 2 AI Advisor: Scoping Decisions

**Document type:** Council-approved scoping decisions  
**Session:** Phase 2 kickoff — Layer 2 initiation  
**Status:** Decisions locked; L2-A not yet opened  
**Depends on:** All nine corpus documents (complete and council-approved)  
**Required by:** All Layer 2 build sessions (L2-A through L2-E)

---

## 1. Build State at Phase 2 Initiation

All nine Layer 1 corpus documents are complete and council-approved. Front matter adjustments on individual documents remain TBD but do not block Layer 2 work. The data model is at v0.2.0.

**Corpus documents confirmed complete:**

1. Buying Group Role Architecture
2. Signal Definition and Confidence Model
3. Audience and Segmentation Architecture
4. Content Model and Taxonomy
5. Personalization Decisioning Rules
6. Buying Group Journey and Convergence Model
7. Measurement and Experimentation Framework
8. Operational Runbook
9. Privacy and Consent Architecture

---

## 2. Layer 2 Component Map

Layer 2 (AI Advisor Tooling) comprises four components. These are distinct in nature, audience, and build complexity.

| Component | Description | Build Readiness |
|---|---|---|
| 1 — Advisory Engine | The AI Advisor product itself: the conversational, search, and workflow interface that enterprise clients use to operationalize the Kalder framework | Requires L2-A and L2-C to specify before build |
| 2 — Client Onboarding Tooling | Structured intake and configuration layer; collects and validates the client-specific inputs the corpus marks as "configured at onboarding" (CLIENT_ATTRIBUTE_MAP, Marketo program IDs, Outreach sequences, CRM field mappings) | ~80% specified by corpus; L2-D formalizes the workflow |
| 3 — POC Infrastructure | Working prototype demonstrating the classification pipeline, decisioning logic, and content selection mechanism; scoped to a single solution category and persona | Requires L2-E to scope and constrain |
| 4 — Operator Tooling | Internal dashboards, monitoring views, and operational surfaces for content strategists, demand gen managers, and marketing ops practitioners | Dependent on Advisory Engine design; L2-D secondary output |

**Build sequence (locked):** Component 2 → Component 1 → Component 3 → Component 4

---

## 3. The Three Interaction Modes

The AI Advisor delivers value through three distinct interaction modes. These are architectural divisions, not UI preferences. Each mode maps to a defined task type and a primary user.

### Mode 1 — Reference Mode

**Task type:** Lookup

**Description:** Semantic and keyword search over the nine corpus documents and the data model. The user knows what they want and needs to find it precisely and fast.

**Example queries:**
- "What is the confidence_tier_minimum requirement for a progressive_disclosure module?"
- "Show me all JTBD codes for the Economic Buyer in the Acquisition stage."
- "What's the decay window for the engagement_score signal?"

**Design note:** The corpus architecture was explicitly designed for this use case. Section-key referencing (§4, §12, §CA), standalone document structure, and the JTBD code library are all optimized for clean retrieval. A well-implemented Reference Mode is the highest-frequency use case in daily operation and the fastest to demonstrate credibly.

---

### Mode 2 — Advisory Mode

**Task type:** Learn / Diagnose

**Description:** Conversational AI reasoning across the corpus. The user has a problem or decision and needs guidance, not just information. The Advisor synthesizes across the framework and returns structured, actionable diagnosis with recommended actions.

**Example queries:**
- "Forty percent of our TAL accounts are stuck at UNKNOWN confidence after six weeks. What should we investigate first?"
- "Our progression_early_to_mature cohort engagement rate has dropped three weeks in a row. What are the most likely causes?"
- "We're launching a new solution category. What's the minimum content inventory required before activation?"

**Design constraint (Cunningham):** Advisory Mode must apply genuine buying-group reasoning — the three-tier data authority hierarchy, differential_insufficient flag behavior, decay window mechanics, convergence point logic. Generic marketing guidance that ignores the corpus framework is a disqualifying failure mode.

**Design constraint (Miller):** Advisory Mode must close the signal-to-action loop. A diagnosis that stops at classification state without connecting to BDR sequence, content intervention, and sales escalation path is incomplete.

---

### Mode 3 — Guided Workflow Mode

**Task type:** Do

**Description:** Step-by-step process execution for defined operational workflows. Maps directly to Document 8 (Operational Runbook). The user is executing a process — onboarding, content commissioning, signal monitoring — and the Advisor keeps them on track, validates inputs, and flags exceptions.

**Example workflows:**
- New client onboarding: collect and validate CLIENT_ATTRIBUTE_MAP configuration
- Content node commissioning: walk through R1–R4 review stages for a new Content Module
- Weekly signal monitoring: execute the Document 8 Section 5 monitoring protocol

**Adoption note (Gothelf):** Guided Workflow Mode is where adoption actually happens. Advisory Mode is impressive in a demo. Reference Mode is useful in daily operation. Guided Workflow Mode is what makes a practitioner feel the product is working with them, not waiting to be queried — and it's what makes the handoff from the VP buyer to the practitioner team possible.

---

## 4. Product Tier Architecture

| Tier | Modes Available | Primary Audience | Notes |
|---|---|---|---|
| Foundation | Reference Mode only | Self-service / trial | Demonstrates corpus quality; entry point |
| Professional | Reference + Advisory | Demand gen managers, program directors, marketing ops | Core sellable product; capstone demonstration target |
| Enterprise | All three modes | Full practitioner team + onboarding workflow | Requires client-specific configuration; L2-D scope |

---

## 5. User Priority Model

Four distinct user types exist inside an enterprise client deployment. Priority is determined by daily friction, renewal influence, and Advisory Mode design target — not by seniority.

### Priority 1 — Marketing Operations Engineer

**Primary modes:** Reference Mode, Guided Workflow Mode

**Primary need:** Configuration fidelity and troubleshooting speed. Needs precise, unambiguous answers to implementation questions mid-task. No tolerance for plausible-sounding wrong answers — one incorrect answer about CLIENT_ATTRIBUTE_MAP or cohort transition sequencing destroys trust permanently.

**Renewal driver:** Yes — this user feels daily friction and will evangelize or block based on the Advisor's operational reliability.

**Design target:** Reference Mode must return corpus-accurate answers with zero ambiguity. Guided Workflow Mode must map to Document 8 operational protocols exactly.

---

### Priority 2 — Demand Generation Manager / Program Director

**Primary modes:** Advisory Mode

**Primary need:** Diagnosis and strategic guidance. Runs the program week-to-week; makes decisions about cohort activation, content gap prioritization, and sales escalation timing. Needs the Advisor to reason across the full framework, not just retrieve individual facts.

**Renewal driver:** Yes — this user owns program outcomes. If Advisory Mode helps them move faster and make better decisions, they will advocate for renewal and expansion.

**Design target:** Advisory Mode problem types (see Section 7) should be designed around this user's diagnostic needs.

---

### Priority 3 — Content Strategist / Content Ops Lead

**Primary modes:** Reference Mode

**Primary need:** Content model precision during production sprints. Needs accurate, complete answers about the Document 4 content model, module type specifications, tagging requirements, and review stage protocols. High-frequency but narrow domain.

**Renewal driver:** Partial — high-frequency user but does not own budget decisions.

**Design constraint (Rose):** Incorrect guidance about confidence_tier_minimum tagging or phase classification produces content nodes that fail Sanity validation or serve incorrect experiences. Corpus fidelity for Document 4 queries is non-negotiable.

---

### Priority 4 — VP / Program Executive

**Primary modes:** Dashboard view (T1/T2 metrics), Advisory Mode (selective, escalation context)

**Primary need:** Program health visibility at a glance; escalation path when metrics miss. Does not use the Advisor daily.

**Sale vs. use distinction (Vajre):** This user is the sale. The ops engineer is the renewal. The demand gen manager is the expansion. Build the product for Priority 1 and Priority 2. Build the demo for Priority 4. These are different things and conflating them produces a product that demos well and churns at month six.

---

## 6. Demo and Deployment Architecture

### Decision: The Advisor as a Deployed Interface

The AI Advisor will be demonstrated as a deployed web application — not a recorded walkthrough, not a slide deck. The full martech stack (AEP, Adobe Target, Sanity, Marketo, Outreach, Salesforce) is not required to demonstrate the Advisor. The Advisor's value is the reasoning and the corpus, not the plumbing.

### Three Distinct Builds

**Build 1 — Advisor Interface (deployed web application)**

A working, deployed web application implementing all three modes against the Kalder corpus. No stack prerequisites. Demonstrable to any enterprise buyer. This is the product.

---

**Build 2 — Website Experience Simulator (front-end prototype)**

A front-end prototype that accepts a visitor state as input (role, confidence tier, solution category, buying stage) and renders the experience that visitor would receive — applying Document 5 decisioning rules correctly — without a live AEP/Target/Sanity stack. This is the Layer 3 demonstration vehicle.

**Design requirement (Alfonso):** The simulator must make the decisioning logic visible. A buyer should be able to see exactly why a visitor classified as Champion / MEDIUM confidence / Customer Engagement / Acquisition receives this content rather than that content. This is a front-end problem, not an infrastructure problem.

---

**Build 3 — Stack Integration Specification (documentation)**

The technical specification for how a client with the full stack integrates the Advisor into their operational workflow. Enterprise sales artifact. Demonstrates production-grade program operating system credibility.

### Layer 3 Demonstration

Layer 3 (end-user web experience) will be demonstrated using Build 2 (Website Experience Simulator), not live stack integration. Full stack simulation is a post-capstone milestone.

---

## 7. Session Plan for Layer 2

| Session | Focus | Primary Council Voices | Key Output |
|---|---|---|---|
| L2-A | Advisory Engine: mode definition and capability scoping | Brinker, Alfonso, Miller, Vajre, Gothelf | Product brief, interaction model, capability map, differentiation statement |
| L2-B | Reference Mode: corpus-as-product, retrieval architecture | Raab, Alfonso, Brinker | Retrieval architecture spec, chunking strategy, disambiguation logic, output format |
| L2-C | Advisory Mode: reasoning design and problem type scoping | Cunningham, Miller, Kohavi, Alfonso | Problem type inventory, reasoning chain design, corpus section dependencies per problem type |
| L2-D | Guided Workflow Mode and onboarding architecture | Alfonso, Raab, Garcia, Gothelf | Onboarding intake specification, CLIENT_ATTRIBUTE_MAP configuration workflow, minimum viable client data set |
| L2-E | POC infrastructure and integration | Raab, Brinker, Alfonso, Kohavi | POC scope definition, technical architecture, simplification decisions and implications |

**Next to open:** L2-A — starting with Advisory Mode problem type scoping, which determines corpus retrieval architecture, reasoning design, and interface model for Priority 1 and Priority 2 users.

---

## 8. Key Principle Statements (Council Consensus)

> "Build the product for Priority 1 and Priority 2. Build the demo for Priority 4." — **Vajre.** These are different design targets and conflating them produces shelf-ware.

> "One incorrect answer destroys trust permanently." — **Alfonso.** Reference Mode corpus fidelity is a non-negotiable reliability requirement, not a quality aspiration.

> "The Advisor must apply genuine buying-group reasoning, not generic marketing advice." — **Cunningham.** Advisory Mode that ignores the framework's specific mechanics (three-tier data authority, differential_insufficient, decay windows) is a disqualifying failure mode.

> "Close the signal-to-action loop." — **Miller.** Diagnosis without a connection to BDR sequence, content intervention, and sales escalation path is incomplete.

> "Guided Workflow Mode is where adoption actually happens." — **Gothelf.** The VP buys it; the ops engineer and demand gen manager adopt it — or don't.

> "The Advisor's value is the reasoning and the corpus, not the plumbing." — **Brinker.** The full martech stack is not required to demonstrate or sell the product.

---

*End of document. Add to project knowledge before opening Session L2-A.*
