# Kalder — Monorepo Directory Scaffold

**Version:** 1.0  
**Data model:** `kalder_data_model_v0.2.0`  
**Structure:** npm workspaces monorepo

---

## Setup Notes

**Shared types** (`packages/shared`) are the interface contract between Build 1 and Build 2. Define `VisitorState` and `DecisioningResult` here first — both builds import from this package. This is what a monorepo buys you: one definition, no drift.

**Corpus files** (`knowledge/`) are the authoritative local copy of all project knowledge. The scoring engine imports from `knowledge/data-model/kalder_data_model.py` directly. The corpus indexing script (`build1-advisor/scripts/index-corpus.ts`) reads from `knowledge/corpus/`. Build 3 references these files as its source documents.

**Scoring engine sidecar** (`services/scoring-engine/`) runs as a local FastAPI service on a separate port (e.g., `8000`). The Build 1 `/api/classify` route proxies to it. Start it with `uvicorn main:app --reload` alongside the Next.js dev server.

**Synthetic contacts** (`build1-advisor/data/synthetic/`) are the three POC demo records. Build 2 references the same files — use a symlink or copy them to `build2-simulator/data/contacts/` to keep them in sync.

**Environment variables** — minimum required:
```
# build1-advisor/.env.local
ANTHROPIC_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX_NAME=kalder-v0-2-0
SCORING_ENGINE_URL=http://localhost:8000
DATA_MODEL_VERSION=0.2.0
```

---

## Directory Tree

```
kalder/
├── .env.example
├── .gitignore
├── README.md
├── package.json                          # monorepo root (npm workspaces)
│
├── knowledge/                            # Authoritative corpus — shared by all builds
│   ├── corpus/
│   │   ├── kalder_doc1_buying_group_role_architecture.md
│   │   ├── kalder_doc2_signal_definition_confidence_model.md
│   │   ├── kalder_doc3_audience_segmentation_architecture.md
│   │   ├── kalder_doc4_content_model_and_taxonomy.md
│   │   ├── kalder_doc5_personalization_decisioning_rules.md
│   │   ├── kalder_doc6_buying_group_journey_convergence_model.md
│   │   ├── kalder_doc7_measurement_experimentation_framework.md
│   │   ├── kalder_doc8_operational_runbook.md
│   │   └── kalder_doc9_privacy_consent_architecture.md
│   ├── data-model/
│   │   ├── kalder_data_model.py          # Primary data model (scoring engine imports here)
│   │   └── kalder_data_model_v0_2_0_spec.md
│   └── specs/                            # Layer 2 decision artifacts
│       ├── kalder_layer2_decisions_log_L2E_builds.md
│       ├── kalder_layer2_developer_brief.md
│       ├── kalder_build_role_statements.md
│       └── kalder_phase2_layer2_scoping_decisions.md
│
├── packages/
│   └── shared/                           # Shared types and interface contract
│       ├── package.json
│       └── src/
│           ├── visitor-state.ts          # VisitorState — the Build 1 → Build 2 contract
│           ├── decisioning-result.ts     # DecisioningResult type
│           ├── audit-log.ts              # Audit log schema types
│           └── index.ts
│
├── build1-advisor/                       # Build 1 — Advisor Interface (Next.js)
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── .env.local.example
│   │
│   ├── app/
│   │   ├── layout.tsx                    # Root layout — mode shell, version stamp header
│   │   ├── page.tsx                      # Landing — mode selector
│   │   ├── reference/
│   │   │   └── page.tsx                  # Reference Mode view
│   │   ├── advisory/
│   │   │   └── page.tsx                  # Advisory Mode view
│   │   ├── guided/
│   │   │   └── page.tsx                  # Guided Workflow view
│   │   │
│   │   └── api/                          # Next.js API routes — MUST live under app/
│   │       │                              # (App Router only serves routes from app/api/.../route.ts;
│   │       │                              # a sibling-of-app/ api/ directory is never registered)
│   │       ├── reference/
│   │       │   └── route.ts              # Pre-retrieval pipeline → Store 1 / Store 2
│   │       ├── advisory/
│   │       │   └── route.ts              # Context assembly → Claude API → output parser
│   │       ├── guided/
│   │       │   └── route.ts              # Step validation → FLAG/HOLD evaluator
│   │       ├── classify/
│   │       │   └── route.ts              # Proxy to scoring engine sidecar /classify
│   │       └── audit/
│   │           ├── route.ts              # Audit log read/write
│   │           └── export/
│   │               └── route.ts          # JSON file download
│   │
│   ├── components/
│   │   ├── ModeShell.tsx                 # Session-persistent mode selector + sidebar
│   │   ├── VersionStamp.tsx              # "Data model: v0.2.0" — always visible
│   │   ├── reference/
│   │   │   ├── QueryInput.tsx
│   │   │   ├── ResultCard.tsx            # Answer + [SOURCE] + [RELATED] template
│   │   │   └── DisambiguationPrompt.tsx  # Six-term registry clarification UI
│   │   ├── advisory/
│   │   │   ├── ProblemTypeSelector.tsx   # PT-1 / PT-2 / PT-5 entry point
│   │   │   ├── DiagnosticOutput.tsx      # Six-section collapsible card renderer
│   │   │   ├── NamedStateCheck.tsx       # Non-collapsible — differential_insufficient
│   │   │   │                             #   and pending_solution_fallback
│   │   │   └── AdvisoryChat.tsx          # Conversational interface within a problem type
│   │   └── guided/
│   │       ├── StepCard.tsx              # Five-zone step card component
│   │       ├── HoldCard.tsx              # H-0x HOLD display + resolution input
│   │       ├── FlagCard.tsx              # F-0x FLAG display + acknowledge control
│   │       ├── DeferralDropdown.tsx      # Consequence-first deferral control
│   │       ├── InlineAdvisoryPanel.tsx   # Half-screen Advisory panel (state-preserving)
│   │       ├── DeferralCounter.tsx       # Running deferral count in step card footer
│   │       ├── WorkflowSelector.tsx      # Onboarding / Commissioning / Monitoring
│   │       └── CompletionScreen.tsx      # Prioritized gap list + audit log export
│   │
│   ├── lib/
│   │   ├── retrieval/
│   │   │   ├── normalizer.ts             # Query normalization (stage 1)
│   │   │   ├── disambiguation.ts         # Six-term registry (stage 2)
│   │   │   ├── context-resolver.ts       # Section key → Store 2 direct route (stage 3)
│   │   │   ├── router.ts                 # QT-1 through QT-6 routing (stage 4)
│   │   │   ├── vector-store.ts           # Pinecone client (Store 1)
│   │   │   └── structured-store.ts       # JSON table lookups (Store 2)
│   │   ├── advisory/
│   │   │   ├── prompt-builder.ts         # Dynamic system prompt assembly (3 layers)
│   │   │   └── output-parser.ts          # Six-section output parsing
│   │   ├── guided/
│   │   │   ├── state-machine.ts          # GuidedWorkflowState management
│   │   │   ├── flag-hold-evaluator.ts    # FLAG/HOLD trigger logic per step
│   │   │   └── audit-logger.ts           # Session audit log builder
│   │   └── session/
│   │       └── session-state.ts          # AppSessionState — React context + sessionStorage
│   │
│   ├── data/
│   │   ├── structured/                   # Store 2 — JSON tables from kalder_data_model.py
│   │   │   ├── jtbd_codes.json           # 131 records
│   │   │   ├── cross_role_weights.json   # 19 records
│   │   │   ├── client_attribute_map.json # 36 records
│   │   │   ├── module_types.json         # 11 records
│   │   │   ├── decay_multipliers.json    # 4 records
│   │   │   ├── confidence_tiers.json
│   │   │   ├── fallback_cascade.json
│   │   │   ├── scoring_rules.json
│   │   │   └── sales_activation_config.json
│   │   ├── workflows/                    # Guided Workflow step definitions
│   │   │   ├── onboarding_18step.json
│   │   │   ├── commissioning_12step.json
│   │   │   └── monitoring_10step.json
│   │   └── synthetic/                    # POC demo contacts
│   │       ├── contact_a.json            # MEDIUM confidence Champion
│   │       ├── contact_b.json            # differential_insufficient: true
│   │       └── contact_c.json            # holdback_group: true
│   │
│   └── scripts/
│       └── index-corpus.ts               # One-time: chunk corpus → embed → push to Pinecone
│
├── build2-simulator/                     # Build 2 — Website Experience Simulator (Next.js)
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   │
│   ├── app/
│   │   ├── layout.tsx                    # Root layout — version stamp header
│   │   ├── page.tsx                      # Main simulator view (dual-panel)
│   │   └── comparison/
│   │       └── page.tsx                  # Split-screen comparison mode
│   │
│   ├── components/
│   │   ├── ExperiencePanel.tsx           # Left panel — buyer view
│   │   ├── DecisioningPanel.tsx          # Right panel — decisioning trace
│   │   ├── StateInputPanel.tsx           # Manual visitor state controls + contact loaders
│   │   ├── ModuleSlot.tsx                # Individual module slot (rendered/suppressed/stub)
│   │   ├── TraceStep.tsx                 # Individual routing step with corpus authority
│   │   ├── EdgeStateToggles.tsx          # "What Would Change If..." scenario buttons
│   │   ├── ProgressiveDisclosureSlot.tsx # SUPPRESSED_ACTIVE / SUPPRESSED_HOLDBACK /
│   │   │                                 #   rendered — three distinct states
│   │   └── ComparisonView.tsx            # Side-by-side dual panel for comparison mode
│   │
│   ├── lib/
│   │   ├── decisioning-engine.ts         # Document 5 §1.6 — eight steps, strict order
│   │   ├── three-axis.ts                 # Buying job axis evaluation
│   │   ├── module-renderer.ts            # Module set + variant selection by fallback level
│   │   ├── url-params.ts                 # Parse + validate Build 1 → Build 2 URL parameters
│   │   └── scenario-presets.ts           # "What Would Change If..." state transforms
│   │
│   └── data/
│       ├── content-variants/
│       │   └── it_ops_champion.json      # Pre-authored content descriptions (POC scenario)
│       └── contacts/                     # Copy or symlink from build1-advisor/data/synthetic/
│           ├── contact_a.json
│           ├── contact_b.json
│           └── contact_c.json
│
├── build3-spec/                          # Build 3 — Stack Integration Specification
│   ├── kalder_stack_integration_spec_v1.0.md
│   └── exports/
│       └── kalder_stack_integration_spec_v1.0.pdf
│
└── services/
    └── scoring-engine/                   # Python FastAPI sidecar
        ├── requirements.txt              # fastapi, uvicorn, pydantic
        ├── main.py                       # FastAPI app — single /classify endpoint
        ├── classifier.py                 # classify_visitor() — seven-step sequence
        ├── data_model.py                 # Copy of kalder_data_model.py
        └── models.py                     # Pydantic request/response models
```

---

## Build Sequence

```
1. Create monorepo root (package.json with npm workspaces)
2. Populate knowledge/ with downloaded corpus files
3. Define shared types in packages/shared/src/
4. Scaffold services/scoring-engine/ — FastAPI, classify_visitor() skeleton
5. Scaffold build1-advisor/ — Next.js app, wire /api/classify → sidecar
6. Scaffold build2-simulator/ — Next.js app, stub decisioning engine
7. Create build3-spec/ — begin authoring from knowledge/corpus/
```

## First Code to Write

In this order — each unblocks the next:

1. **`packages/shared/src/visitor-state.ts`** — defines `VisitorState`. Both builds depend on it.
2. **`services/scoring-engine/classifier.py`** — the `classify_visitor()` seven-step function. Imports `data_model.py`. Write and test before wiring to FastAPI.
3. **`build2-simulator/lib/decisioning-engine.ts`** — the eight-step routing sequence. Write and test all four edge states before building any UI on top of it.
4. **`build1-advisor/lib/retrieval/disambiguation.ts`** — the six-term registry. Simple, fast to write, and required by every Reference Mode query.
