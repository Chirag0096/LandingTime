# Build, Ship, Shape: Amazon Developer Hackathon 2026 — Official Submission Writeup

## Project Title
**Landing Time — Voice-First Multi-Dish Kitchen Coordination System**

## Tagline
A voice-first multi-dish kitchen scheduling engine that coordinates multiple culinary dishes to land concurrently hot and synchronized at a requested serving time.

## Primary Track
**Alexa+** (Agent Skills & Self-Hosted MCP Server implementing spec `2025-11-25` over Streamable HTTP + Simulated Alexa+ Web App)

## Mini-Challenges
1. **Open Source Mini-Challenge**: Standalone MIT-licensed Backward CPM DAG scheduling engine (`packages/cpm-dag-scheduler`) published for the open-source community.
2. **AWS Builder Mini-Challenge**: Built using Kiro Crew agentic specification workflow (`.kiro/specs/`), with documented offline Bedrock Claude 3 Haiku recipe parsing pipeline and DynamoDB cloud session persistence adapters.

---

## 🍳 Inspiration & The Problem
Conventional recipe apps provide static instructions for individual dishes in isolation. Timer apps track independent countdowns that do not know about each other. In real cooking, a meal is a complex, resource-constrained distributed system:
- **Shared Appliances**: Roast chicken and smashed potatoes share a single oven chamber at 425°F; asparagus and gravy compete for stovetop burners.
- **Cook Attention Limits**: A cook cannot truss a bird and smash potatoes at the same second.
- **Cross-Dish Precedence**: Pan gravy deglazing physically depends on warm pan drippings from a rested roast chicken.

When your roast chicken needs 12 extra minutes in the oven, conventional timers let your potatoes and asparagus get cold on the counter. Landing Time solves this by orchestrating all dishes as a single Directed Acyclic Graph (DAG) and executing **Backward Critical Path Method (CPM)** scheduling to ensure everything lands at the dinner table hot and synchronized at the exact requested serving moment.

---

## 🚀 What Landing Time Does
Landing Time turns multi-dish meal planning into an agentic conversation:
1. **Backward CPM Planning**: User says, *"Plan dinner for 7:30 PM: roast chicken, crispy smashed potatoes, and sautéed asparagus with pan gravy."* The engine calculates a 70-minute makespan, audits oven temperature compatibility (**Oven Rule of 25**), and alerts the cook to begin prep at **6:20 PM**.
2. **Live Multi-Track Dashboard**: Displays the active cooking directive, a high-visibility circular countdown timer, physical appliance matrices, and live Gantt synchronization tracks.
3. **Shock-Absorber Delay Recovery**: When the cook reports that the chicken needs 12 more minutes in the oven, Landing Time does not let dinner slide 12 minutes late. It applies deterministic culinary recovery rules:
   - Compresses chicken resting from 15m to 10m (safe USDA floor, recovering 5m).
   - Holds crispy potatoes on a ventilated rack at 170°F.
   - Shifts unstarted asparagus sauté by +7m to finish hot right as the bird finishes resting.
   - Mathematically recalculates dinner landing from 7:30 PM to 7:37 PM (absorbing 5 minutes safely) and displays ghosted vs. solid timeline comparisons before user confirmation.
4. **Dynamic AI Substitutions**: If heavy cream is missing, Google Gemini 2.5 Flash dynamically formulates a whole milk + melted butter emulsion with a +2m simmer adjustment, absorbed in the rest window cushion (0 min net delay), and automatically adds heavy cream to the persistent restock list.
5. **Synchronized Landing & Plating**: All dishes finish within a tight 2-minute spread (7:35 PM, 7:36 PM, 7:37 PM) with hands-free plating checklists.

---

## 🛠 How We Built It
- **Deterministic Scheduling Engine (< 1ms)**: Built in pure TypeScript with zero external LLM dependencies in the real-time execution path. Computes Kahn's topological DAG sort, makespan, float slack, and critical path in under 1ms ($\mathcal{O}(V + E)$).
- **Official Model Context Protocol (MCP)**: Built on the official `@modelcontextprotocol/sdk` (spec `2025-11-25`) exposing 6 core tools (`plan_meal`, `get_what_now`, `complete_step`, `report_delay`, `substitute`, `resume_plan`) and confirmation endpoints over Streamable HTTP at `/mcp`.
- **Local-First SQLite Persistence**: `better-sqlite3` in WAL mode storing complete session graphs, audit event logs, and pantry restock items at `data/landing_time.db`.
- **Google Gemini 2.5 Flash Integration**: Connected via `@google/genai` with 15 RPM safety throttling and 24-hour LRU caching for arbitrary recipe DAG extraction and dynamic culinary substitutions.
- **Hands-Free Web Speech API**: Browser-native `webkitSpeechRecognition` and `speechSynthesis` providing real microphone listening and spoken audio feedback without third-party fees.
- **Frontend UI**: React 19, Tailwind CSS, Motion animations, and a floating Judge Demo Bar (`?demo=true`) with real-time in-memory CPM latency benchmarks.

---

## 🧪 Testing & Verification
Landing Time includes an exhaustive automated test suite with **80 / 80 passing tests (100% pass rate)**:
- **Playwright Chrome Live Browser E2E** (`tests/e2e/user_flow.spec.ts`): Drives real Google Chrome on macOS against `http://localhost:3000` through all 8 user milestones.
- **React UI Component Tests** (`tests/ui/*.test.tsx`): 35 tests covering all screens, modals, timers, and Gantt charts.
- **Server, Persistence, & MCP Tests** (`server/tests/`): 35 tests covering CPM DAG math, 21-step acceptance scenarios, optimistic concurrency, and live Gemini AI calls.
- **Timeline Utilities** (`src/utils/`): 9 tests verifying 12-hour arithmetic, prep triggers, and dynamic landing deltas.

---

## 💬 Mandatory Product Feedback (Amazon Developer Tools)

### 1. Which developer tools, APIs, and SDKs did you use and for what?
- **Model Context Protocol (MCP) TypeScript SDK (`@modelcontextprotocol/sdk`)**: Implemented the self-hosted Streamable HTTP server on `/mcp` compliant with the `2025-11-25` specification to expose kitchen coordination tools to Alexa+ and agent clients.
- **Kiro Crew Developer Tooling (`.kiro/specs/`)**: Used Kiro Crew agentic specification files to structure the multi-agent development workflow, splitting requirements between scheduler architecture and protocol transport.
- **AWS Bedrock & DynamoDB Adapters (`server/src/adapters/`)**: Architected modular adapters for offline LLM parsing (Claude 3 Haiku prompt templates) and cloud session persistence.

### 2. What worked well?
- **MCP Tool Schema Ergonomics**: Defining tool schemas with JSON Schema / Zod inside `@modelcontextprotocol/sdk` was intuitive and provided clean type validation.
- **Streamable HTTP Transport**: The modern Streamable HTTP transport provides clean Server-Sent Events (SSE) streaming and request handling in Express without requiring complex custom WebSocket boilerplate.
- **Kiro Crew Workflow Separation**: Specifying contracts in `.kiro/specs/` kept scheduler invariants strictly isolated from transport protocols.

### 3. What needs work?
- **Transport Options Documentation**: `StreamableHTTPServerTransport` in the TypeScript SDK had undocumented option parameters where passing `{ endpoint: '/mcp' }` caused type compilation errors due to internal WebStandard vs. Node transport type divergence.
- **Echo Show Webview Bridge**: Developing web apps for Echo Show devices lacks an official local simulator package for testing the `postMessage` bridge outside physical hardware.
- **Audio Ducking Guidance**: Clearer guidelines on how in-webview Web Speech synthesis interacts with Alexa's physical hardware microphones and audio ducking would prevent audio conflicts.

### 4. How was your onboarding experience (zero to hello world)?
Onboarding with the MCP specification was straightforward. The concepts of tools, resources, and transports are clean and logical. The transition from stdio transports to Streamable HTTP in the 2025-11-25 specification was a massive improvement for hosting web services.

### 5. Would you build with these devices and services again?
**Yes.** The combination of Alexa+ with the Model Context Protocol transforms voice assistants from static command responders into proactive, agentic coordinators that can manage complex real-world physical workflows like cooking.

---

## 🎁 Mini-Challenge Submissions

### Open Source Mini-Challenge ($5,000)
- **Contribution**: Extracted and published the pure Backward Critical Path Method DAG scheduling engine as a standalone, zero-dependency open-source library with tests, microsecond benchmarks, and CI workflows:
  - **Standalone GitHub Repository**: [https://github.com/Chirag0096/cpm-dag-scheduler](https://github.com/Chirag0096/cpm-dag-scheduler)
  - **In-Tree Monorepo Package**: [`packages/cpm-dag-scheduler`](./packages/cpm-dag-scheduler)
- **License**: MIT Open Source License.
- **What It Does**: Provides developers with an ultra-fast ($\mathcal{O}(V+E)$, <1ms) resource-constrained backward scheduler that solves precedence constraints, shared appliance limits, and shock-absorber delay recovery for any time-critical physical workflow.

### AWS Builder Mini-Challenge ($5,000)
- **Contribution**: Utilized Kiro Crew agentic specification files (`.kiro/crew.json`, `.kiro/specs/landing-time-engine.spec.json`, `.kiro/specs/mcp-streamable-transport.spec.json`) as our core development orchestration tool during the hackathon, alongside modular AWS Bedrock and DynamoDB persistence adapters.
