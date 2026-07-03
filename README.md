# Buying Group Personalization Advisor
A portfolio project demonstrating RAG, multi-mode AI product design, and agentic workflow verification — built over Weeks 14–15 of a structured AI product development program.

---
## What This Is
The Kalder Buying Group Personalization Advisor is an AI-powered advisory tool for enterprise marketing teams running buying group personalization programs. It's built on a synthetic B2B SaaS corpus representing Kalder, a fictional $8B ARR AI-native enterprise platform company.
The product helps three personas — Marketing Operations Engineers, Demand Generation Managers, and Content Strategists — answer questions, diagnose program problems, and execute structured operational workflows against a complex, multi-document knowledge base.
This is a portfolio piece, not a production deployment. The corpus is synthetic. The architecture and domain expertise are genuine.

---
## Builds
| Build | Description | Stack |
|---|---|---|
| **Build 1 — Advisor Interface** | Three-mode advisory application (Reference, Advisory, Guided Workflow) | Next.js 15, React 19, Anthropic Claude API, Pinecone, OpenAI Embeddings, Tailwind CSS 4 |
| **Build 2 — Website Experience Simulator** | Front-end prototype applying Document 5 decisioning rules to render role-specific experiences without a live martech stack | Next.js 15, React 19, Tailwind CSS 4 |
| **Build 3 — Stack Integration Specification** | Structured markdown document specifying enterprise production stack integration | Markdown |

---
## Architecture Highlights
### Two-store retrieval (Build 1)
Reference Mode uses two distinct retrieval paths: a vector index (Pinecone) for corpus prose and a structured index (JSON) for data model records — JTBD codes, confidence tiers, decay multipliers, scoring rules, and cross-role weights. Prose and tabular data have fundamentally different retrieval signatures; a single vector store handles one well and the other poorly. Similarity threshold calibrated empirically to 0.38 against observed Pinecone score distributions, not from a pre-index spec value.
### FLAG/HOLD interrupt system (Build 1)
Guided Workflow Mode implements two non-collapsible interrupt states. HOLD is an integrity interrupt: non-bypassable, blocks step advancement until resolved. FLAG is an advisory interrupt: requires acknowledgment only after all HOLDs on the current step have cleared. The evaluator uses workflow-scoped step ID dispatch to prevent cross-workflow collision across three workflow definitions (18-step onboarding, 12-step commissioning, 8-step signal monitoring).
### Dual-confidence model (Build 1)
Advisory Mode distinguishes classification confidence (how certain the model is about a visitor's buying group role) from diagnostic confidence (how certain the Advisor is about its own reasoning). Both are named, checked, and surfaced explicitly — including two first-class program states (`differential_insufficient`, `pending_solution_fallback`) — rather than conflated or silently elided.
### Document 5 decisioning engine (Build 2)
The simulator implements the full 8-step decisioning sequence from the corpus, including three-axis interaction evaluation (role × confidence × stage), holdback group logic with correct Level 5 full override behavior, and progressive disclosure state management across all 11 module slots.

---
## Corpus
Nine synthetic documents covering the full Kalder buying group personalization program, all derived from a canonical Python data model (`knowledge/data-model/kalder_data_model.py`, v0.2.0, ~7,000 lines):
| Doc | Title |
|---|---|
| 1 | Buying Group Role Architecture |
| 2 | Signal Definition and Confidence Model |
| 3 | Audience Segmentation Architecture |
| 4 | Content Model and Taxonomy |
| 5 | Personalization Decisioning Rules |
| 6 | Buying Group Journey Convergence Model |
| 7 | Measurement and Experimentation Framework |
| 8 | Operational Runbook |
| 9 | Privacy and Consent Architecture |

---
## Repo Structure
```
buying-group-personalization-advisor/
├── build1-advisor/                   # Next.js advisor application
│   ├── app/                          # Route handlers and page components
│   │   └── api/                      # advisory, classify, guided, reference routes
│   ├── components/                   # Mode-specific UI components
│   ├── data/
│   │   ├── structured/               # 9 JSON files: scored data model records
│   │   ├── synthetic/                # contact_a/b/c test fixtures
│   │   └── workflows/                # onboarding_18step, commissioning_12step, monitoring_8step
│   └── lib/
│       ├── advisory/                 # prompt-builder, output-parser
│       ├── guided/                   # state-machine, flag-hold-evaluator, flag-hold-evaluator.test
│       └── retrieval/                # vector-store, structured-store, router, disambiguation, normalizer
├── build2-simulator/                 # Next.js simulator application
│   ├── app/                          # Main view and comparison view
│   ├── components/                   # ExperiencePanel, DecisioningPanel, EdgeStateToggles, StateInputPanel
│   └── lib/                          # decisioning-engine, module-renderer, three-axis, url-params, scenario-presets
│       └── *.test.ts                 # test files for all four modules
├── build3-spec/
│   └── kalder_stack_integration_spec_v1.0.md
├── knowledge/
│   ├── corpus/                       # 9 synthetic documents + supporting specs
│   ├── data-model/                   # kalder_data_model.py (canonical) + spec
│   └── specs/                        # evaluator collision table, workflow specs, build decisions log
├── packages/
│   └── shared/                       # Shared TypeScript types: api-responses, audit-log, visitor-state
└── services/
    └── scoring-engine/               # FastAPI Python sidecar for classification scoring
```

---
## Test Coverage
| File | Assertions | Covers |
|---|---|---|
| `build1-advisor/lib/guided/flag-hold-evaluator.test.ts` | 105 | FLAG/HOLD interrupt logic, workflow-scoped dispatch, all three workflows |
| `build2-simulator/lib/decisioning-engine.test.ts` | 37 | 8-step decisioning sequence, edge states, holdback group logic |
| `build2-simulator/lib/module-renderer.test.ts` | 27 | All 11 module types, per-level fallback table, suppression states |
| `build2-simulator/lib/three-axis.test.ts` | 54 | Role × confidence × stage interaction matrix |
| `services/scoring-engine/test_classifier.py` | 238 | Python classification scoring, signal weighting, decay multipliers |
One defect found and fixed while writing the Build 2 test suite: `decisioning-engine.ts` Step 7 was missing a trace entry on its fall-through path, contradicting the file's documented contract. Fixed in commit `db192a7`.

---
## Dev Setup
**Prerequisites:** Node.js 18+, Python 3.12+, npm
**Environment variables:** Copy `.env.local.example` to `.env.local` in each build directory and supply:
- `ANTHROPIC_API_KEY`
- `PINECONE_API_KEY`
- `OPENAI_API_KEY`
**Start all services:**
```bash
# Terminal 1 — scoring engine sidecar
cd services/scoring-engine
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Terminal 2 — Advisor Interface
cd build1-advisor
npm install
npm run dev
# Terminal 3 — Website Experience Simulator
cd build2-simulator
npm install
npm run dev
```
**Run tests:**
```bash
# Build 1 — guided workflow evaluator
cd build1-advisor && node lib/guided/flag-hold-evaluator.test.ts
# Build 2 — decisioning engine, module renderer, three-axis
cd build2-simulator && npm test
# Scoring engine
cd services/scoring-engine && python -m pytest test_classifier.py
```

---
## Context
This project is part of a 6-month self-directed AI product development program documented at [richardthomchick.com](https://richardthomchick.com). The Week 14–15 journal entries cover the build in detail: retrieval calibration, the FLAG/HOLD design decision, the UX critique findings, and what happened when the build was verified against its own specifications.
