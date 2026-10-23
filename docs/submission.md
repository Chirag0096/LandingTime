# Build, Ship, Shape: Amazon Developer Hackathon 2026 — Official Submission Writeup

## Project Title
**Landing Time — Voice-First Multi-Dish Kitchen Coordination System**

## Tagline
A voice-first multi-dish kitchen scheduling engine that coordinates multiple culinary dishes to land concurrently hot and synchronized at a requested serving time.

## Primary Track
**Alexa+** (Agent Skills & Self-Hosted MCP Server implementing spec `2025-11-25` over Streamable HTTP + Simulated Alexa+ Web App)

## Mini-Challenges
1. **Open Source Mini-Challenge**: Standalone MIT-licensed Backward CPM DAG scheduling engine ([`cpm-dag-scheduler`](https://github.com/Chirag0096/cpm-dag-scheduler)) published for the open-source community.
2. **AWS Builder Mini-Challenge**: Built using **Kiro Crew**, the qualifying AWS agentic developer tool (`.kiro/crew.json`, `.kiro/specs/`), partitioning the multi-agent development workflow between scheduler invariants and protocol transport.

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

## 🌐 Live Shareable Deployment URL (No Localhost Required)
- **Live Interactive Web App (Judge Demo Mode):**  
  👉 **`https://guys-proposition-prot-tokyo.trycloudflare.com/?demo=true`**
- **Live REST API Health Endpoint:**  
  👉 **`https://guys-proposition-prot-tokyo.trycloudflare.com/api/v1/health`**
- **Live Model Context Protocol (MCP) Streamable HTTP Server:**  
  👉 **`https://guys-proposition-prot-tokyo.trycloudflare.com/mcp`**

---

## 🧪 Testing & Verification
Landing Time includes an exhaustive automated test suite with **83 / 83 passing tests (100% pass rate)**:
- **React UI Component Tests** (`tests/ui/*.test.tsx`): 39 tests covering all screens, modals, interactive timeline scrubber, and appliance controls.
- **Server, Persistence, & MCP Tests** (`server/tests/`): 35 tests covering CPM DAG math, 21-step acceptance scenarios, optimistic concurrency, and live Gemini AI calls.
- **Timeline Utilities** (`src/utils/`): 9 tests verifying 12-hour arithmetic, prep triggers, and dynamic landing deltas.
- **Playwright Chrome Live Browser E2E** (`tests/e2e/user_flow.spec.ts`): Drives real Google Chrome on macOS through all 8 user milestones.

---

## 💬 Mandatory Product Feedback (Amazon Developer Tools)

### 1. Which developer tools, APIs, and SDKs did you use and for what?
- **Model Context Protocol (MCP) TypeScript SDK (`@modelcontextprotocol/sdk`)**: Implemented the self-hosted Streamable HTTP server on `/mcp` compliant with the `2025-11-25` specification to expose 6 core kitchen coordination tools to Alexa+ and agent clients.
- **Kiro Crew Agentic Developer Tooling (`.kiro/crew.json`, `.kiro/specs/`)**: Used Kiro Crew as our core AWS developer tool to orchestrate multi-agent specification-driven development during the hackathon. We established a crew of two specialized agent roles:
  1. `SchedulerArchitect`: Specified, developed, and verified the mathematical Backward Critical Path Method (CPM) DAG engine, Kahn's topological sort, and shock-absorber replanning invariants ([`.kiro/specs/landing-time-engine.spec.json`](./.kiro/specs/landing-time-engine.spec.json)).
  2. `McpProtocolSpecialist`: Specified and verified the Model Context Protocol Streamable HTTP endpoint contracts, tool schemas, and SSE session management ([`.kiro/specs/mcp-streamable-transport.spec.json`](./.kiro/specs/mcp-streamable-transport.spec.json)).
- *(Note on Runtime Architecture)*: As permitted by hackathon guidelines, we qualified for the AWS Builder track using **Kiro Crew developer tooling** without deploying paid AWS runtime services (like Bedrock, DynamoDB, or AgentCore). This was a deliberate engineering decision to guarantee a **₹0 cloud spend, 100% local-first, zero-latency execution model** (< 1ms execution) suitable for emergency real-time kitchen timers.

### 2. What worked well?
- **Kiro Crew Spec-Driven Architecture**: Dividing the project into explicit agent roles (`SchedulerArchitect` and `McpProtocolSpecialist`) using `.kiro/specs/` prevented architectural drift. The scheduler remained pure TypeScript with zero HTTP/transport dependencies, making it trivial to extract into a standalone open-source library (`cpm-dag-scheduler`).
- **Traceability from Spec to Test**: Formulating functional requirements as numbered spec items (REQ-001 through REQ-004) directly in Kiro specs made it straightforward to map automated test suites (`scheduler.test.ts`, `mcp_protocol.test.ts`) against concrete requirements.
- **MCP Tool Schema Ergonomics**: Defining tool schemas with JSON Schema / Zod inside `@modelcontextprotocol/sdk` was intuitive and provided automatic validation for LLM tool call payloads.
- **Streamable HTTP Transport**: The modern Streamable HTTP transport provides clean Server-Sent Events (SSE) streaming and request handling in Express without requiring custom WebSocket boilerplate.

### 3. What needs work?
- **Kiro Crew CLI & Test Runner Integration**: Currently, updating `.kiro/specs/*.spec.json` requires manual synchronization with test suites. A native Kiro Crew CLI command (e.g. `kiro verify --specs`) that automatically checks assertion passes against requirement IDs would dramatically streamline CI/CD validation.
- **Interactive Multi-Agent Debugging in Kiro Crew**: When agents collaborate across specifications, observing intermediate agent context exchanges requires digging into transcripts. A visual dependency/event graph in the Kiro UI would improve agent coordination visibility.
- **MCP TypeScript Transport Typing**: `StreamableHTTPServerTransport` in `@modelcontextprotocol/sdk` had undocumented option parameters where passing `{ endpoint: '/mcp' }` caused type compilation errors due to internal WebStandard vs. Node transport type divergence.
- **Audio Ducking Guidance for Echo Devices**: Clearer documentation on how in-webview Web Speech synthesis interacts with Alexa's physical hardware microphones and audio ducking would prevent audio feedback during voice interactions.

### 4. How was your onboarding experience (zero to hello world)?
Onboarding with Kiro Crew and the Model Context Protocol specification was smooth and highly structured. Defining agent roles in `crew.json` established clear development lanes early in the hackathon. The MCP specification's transition from stdio to Streamable HTTP in the 2025-11-25 release is a significant upgrade for hosting agentic web services.

### 5. Would you build with these devices and services again?
**Yes.** Kiro Crew provided a disciplined, repeatable specification-driven multi-agent development workflow that significantly reduced refactoring overhead. Paired with Alexa+ and the Model Context Protocol, it allows developers to build agentic assistants that coordinate complex physical workflows rather than just answering static trivia.

---

## ⚡ Developer Friction Log (Optional Submission Field — Up to 10% Bonus)

### Friction Log Entry 1:
- **Task Attempted**: Initializing `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk/server/streamableHttp.js` in an Express application.
- **Steps Taken**:
  1. Followed standard Streamable HTTP examples passing `{ endpoint: '/mcp' }` into `new StreamableHTTPServerTransport({ endpoint: '/mcp' })`.
  2. Ran TypeScript compilation in Node ESM mode.
- **Expected vs. Actual**:
  - *Expected*: Transport accepts the endpoint path string or gracefully ignores it.
  - *Actual*: TypeScript build failure: `TS2353: Object literal may only specify known properties, and 'endpoint' does not exist in type 'WebStandardStreamableHTTPServerTransportOptions'`.
- **Severity**: Medium (Build blocker until diagnosed).
- **Workaround Used**: Inspected `webStandardStreamableHttp.d.ts` and realized the Node transport diverges from WebStandard fetch options. Used `sessionIdGenerator: () => crypto.randomUUID()` and handled express route mounting directly via `app.all('/mcp', ...)`.
- **Actionable Suggestion**: Ship a first-class `createExpressMcpMiddleware()` helper in the `@modelcontextprotocol/sdk` to eliminate manual transport boilerplate in Express.

### Friction Log Entry 2:
- **Task Attempted**: Verifying MCP specification version compliance (`2025-11-25`) for Alexa+ hackathon rules.
- **Steps Taken**:
  1. Cross-referenced Alexa+ developer guidelines with Model Context Protocol releases.
  2. Checked pinned schema version strings inside `@modelcontextprotocol/sdk`.
- **Expected vs. Actual**:
  - *Expected*: A unified "Alexa+ MCP Readiness Checklist" or CLI verification command to test endpoint compliance.
  - *Actual*: Spec requirements were spread across three different documentation pages without an automated validator.
- **Severity**: Medium (Uncertainty regarding compliance verification).
- **Workaround Used**: Wrote a dedicated automated integration test suite (`server/tests/integration/mcp_protocol.test.ts`) that asserts protocol headers, JSON-RPC 2.0 structure, and 2025-11-25 schema payloads.
- **Actionable Suggestion**: Publish an official `alexa-mcp-verify` CLI or GitHub Action that verifies compliance before submission.

### Friction Log Entry 3:
- **Task Attempted**: Testing the Echo Show Webview PostMessage bridge locally in Vite development mode.
- **Steps Taken**:
  1. Developed rich multi-track Gantt timeline and circular SVG timer for Echo Show displays.
  2. Attempted to simulate Alexa tool response push events (`ui.screen`, `ui.gantt`) inside browser dev mode.
- **Expected vs. Actual**:
  - *Expected*: An official Echo Show webview simulator package to test touch targets and message bus delivery.
  - *Actual*: No official Echo Show webview simulator package exists on npm; physical devices enforce strict CSP policies preventing direct cross-origin fetches.
- **Severity**: Medium.
- **Workaround Used**: Built our own docked Judge Demo Bar (`?demo=true`) and simulated event bus inside `CookingSessionContext.tsx` to replicate postMessage delivery locally.
- **Actionable Suggestion**: Release an official `@modelcontextprotocol/ext-apps-simulator` npm package with Echo Show 8/10/15 responsive viewports and simulated voice audio ducking.

### Friction Log Entry 4:
- **Task Attempted**: Aligning Kiro Crew agentic specification files (`.kiro/specs/`) with automated test runners.
- **Steps Taken**:
  1. Formulated functional requirements with numbered IDs (REQ-001 through REQ-004) in `.kiro/specs/*.spec.json`.
  2. Ran Vitest test suites to verify requirements.
- **Expected vs. Actual**:
  - *Expected*: Kiro Crew CLI could parse test results and automatically update the `"status": "IMPLEMENTED"` tags in spec JSON.
  - *Actual*: Had to manually maintain the specification status mapping.
- **Severity**: Low.
- **Workaround Used**: Added explicit `verification` test file paths in the spec JSON files and mapped assertions directly to requirement IDs.
- **Actionable Suggestion**: Add a `kiro test --sync-specs` command in the Kiro developer tooling that maps test assertion passes directly to spec requirements.

---

## 💡 Feature Requests (Optional Submission Field)

### Feature Request 1:
- **Feature**: Local Echo Show Responsive Viewport & PostMessage Simulator in the Alexa CLI.
- **Why It Matters**: Developing rich visual cards and Gantt-style interfaces for Echo Show 15 requires testing touch targets, high-contrast kitchen lighting visibility, and postMessage event buses. An official browser-based local simulator would save hours of trial-and-error without needing constant hardware deployment.
- **Priority**: Important.

### Feature Request 2:
- **Feature**: MCP Tool Response Streaming for Multi-Dish Operations.
- **Why It Matters**: When scheduling complex meals with many dishes (> 5 dishes, > 25 tasks), the CPM engine and AI parsing could stream partial schedules per dish as they compute, rather than blocking until the entire payload is serialized. This would improve perceived latency on voice devices.
- **Priority**: Nice-to-have.

### Feature Request 3:
- **Feature**: Native Spec Verification CLI for Kiro Crew (`kiro verify --specs`).
- **Why It Matters**: Specification-driven development is extremely powerful for hackathons and agentic coding, but currently requires manual bookkeeping between spec JSON files and CI/CD test passes. A native verification tool would cement Kiro Crew as the premier agentic development framework for AWS builders.
- **Priority**: Important.

---

## 🎁 Mini-Challenge Submissions

### Open Source Mini-Challenge ($5,000)

**Devpost Field Answers (Copy-Paste Ready):**
- **GitHub Username:** `Chirag0096`
- **Contribution / Repository URL:** `https://github.com/Chirag0096/cpm-dag-scheduler`
- **Primary Project Repository URL:** `https://github.com/Chirag0096/LandingTime`
- **License:** MIT Open Source License (OSI-Approved)
- **Short Contribution Summary:**
  > Pure TypeScript implementation of the Backward Critical Path Method (CPM) DAG scheduling and shock-absorber replanning engine (< 1ms latency, zero dependencies, $\mathcal{O}(V + E)$). Formulated from Kelley & Walker (1959) operations research and Harold McGee (2004) culinary resting kinetics.
- **Detailed Description:**
  Extracted and published as an independent, production-grade library with full TypeScript type definitions (`.d.ts`), Kahn's algorithm cycle detection, unit tests (100% passing), microsecond benchmarks, and GitHub Actions CI workflow (Node 20 & 22). Provides developers with an ultra-fast backward scheduling primitive that synchronizes multi-task landing milestones and absorbs thermal/hardware delays via rest compression cushions and float slack shifting.
- **In-Tree Monorepo Package:** [`packages/cpm-dag-scheduler`](./packages/cpm-dag-scheduler)

### AWS Builder Mini-Challenge ($5,000)
- **Contribution**: Utilized **Kiro Crew**, the qualifying AWS agentic developer tool, to orchestrate the specification-driven multi-agent development workflow during the hackathon:
  - **Crew Definition**: [`/.kiro/crew.json`](./.kiro/crew.json) configuring the multi-agent crew with specialized roles (`SchedulerArchitect` and `McpProtocolSpecialist`).
  - **Engine Specification**: [`/.kiro/specs/landing-time-engine.spec.json`](./.kiro/specs/landing-time-engine.spec.json) defining 4 verified scheduling and shock-absorber requirements.
  - **Transport Specification**: [`/.kiro/specs/mcp-streamable-transport.spec.json`](./.kiro/specs/mcp-streamable-transport.spec.json) defining 2025-11-25 MCP Streamable HTTP tool and latency contracts.
- **Rule Compliance**: As permitted by the official rules, Kiro Crew qualifies without requiring paid AWS runtime cloud services. We intentionally built a ₹0 cloud spend, local-first runtime to guarantee sub-millisecond execution with zero kitchen latency. Detailed feedback on our Kiro Crew development experience is documented above.
