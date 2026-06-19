# Kalder Buying Group Personalization Capstone

## Builds
- **Build 1 — Advisor Interface:** Deployed Next.js web application implementing 
  Reference, Advisory, and Guided Workflow modes against the Kalder corpus.
- **Build 2 — Website Experience Simulator:** React front-end prototype applying 
  Document 5 decisioning rules to render role/confidence/stage-specific experiences 
  without a live martech stack.
- **Build 3 — Stack Integration Specification:** Structured markdown document 
  specifying full production stack integration for enterprise clients.

## Build Sequence
1. Define shared types (packages/shared)
2. Build and test scoring engine (services/scoring-engine)
3. Build Advisor Interface (build1-advisor)
4. Build Website Experience Simulator (build2-simulator)
5. Author Stack Integration Specification (build3-spec)

## Dev Startup
# Terminal 1 — scoring engine sidecar
cd services/scoring-engine
uvicorn main:app --reload --port 8000

# Terminal 2 — Build 1 Advisor Interface
cd build1-advisor
npm run dev

# Terminal 3 — Build 2 Website Experience Simulator
cd build2-simulator
npm run dev
