# Landing Time — Developer Friction Log

This log captures developer experience hurdles, protocol edge cases, and SDK quirks encountered during the development of Landing Time for the Amazon Developer Hackathon 2026 (Alexa+ Track).

---

### Entry 1: Express Middleware for Streamable HTTP in `@modelcontextprotocol/sdk`
* **Task Attempted:** Initializing `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk/server/streamableHttp.js` in an Express application.
* **Steps Taken:** Passed `{ endpoint: '/mcp' }` into `new StreamableHTTPServerTransport({ endpoint: '/mcp' })`.
* **Expected vs. Actual:**
  * *Expected:* Transport accepts standard Express path options or gracefully ignores non-conflicting config.
  * *Actual:* TypeScript compiler error `TS2353: Object literal may only specify known properties, and 'endpoint' does not exist in type 'WebStandardStreamableHTTPServerTransportOptions'`.
* **Severity:** Medium (Build blocker until diagnosed).
* **Workaround Used:** Inspected `webStandardStreamableHttp.d.ts` and realized the Node transport diverges from WebStandard fetch options. Used `sessionIdGenerator: () => crypto.randomUUID()` and handled Express route mounting directly via `app.all('/mcp', ...)`.
* **Actionable Suggestion:** Ship a first-class `createExpressMcpMiddleware()` helper in `@modelcontextprotocol/sdk` to eliminate manual transport boilerplate in Express.

---

### Entry 2: MCP Spec Version Compliance (`2025-11-25`) Verification
* **Task Attempted:** Validating that our self-hosted MCP server strictly adheres to spec version `2025-11-25` for Alexa+ hackathon rules.
* **Steps Taken:** Cross-referenced Alexa+ developer guidelines with Model Context Protocol release notes.
* **Expected vs. Actual:**
  * *Expected:* A unified "Alexa+ MCP Readiness Checklist" or CLI verification command to test endpoint compliance.
  * *Actual:* Spec requirements were spread across three different documentation pages without an automated validator.
* **Severity:** Medium (Uncertainty regarding compliance verification).
* **Workaround Used:** Wrote a dedicated automated integration test suite (`server/tests/integration/mcp_protocol.test.ts`) that asserts protocol headers, JSON-RPC 2.0 structure, and 2025-11-25 schema payloads.
* **Actionable Suggestion:** Publish an official `alexa-mcp-verify` CLI or GitHub Action that verifies compliance before submission.

---

### Entry 3: Echo Show Webview PostMessage Simulation
* **Task Attempted:** Testing Echo Show webview communication locally in Vite development mode.
* **Steps Taken:** Attempted to test simulated Alexa tool response push events (`ui.screen`, `ui.gantt`) inside browser dev mode.
* **Expected vs. Actual:**
  * *Expected:* An official Echo Show webview simulator package to test touch targets and message bus delivery.
  * *Actual:* No official Echo Show webview simulator package exists on npm; physical devices enforce strict CSP policies preventing direct cross-origin fetches.
* **Severity:** Medium.
* **Workaround Used:** Built our own docked Judge Demo Bar (`?demo=true`) and simulated event bus inside `CookingSessionContext.tsx` to replicate postMessage delivery locally.
* **Actionable Suggestion:** Release an official `@modelcontextprotocol/ext-apps-simulator` npm package with Echo Show 8/10/15 responsive viewports and simulated voice audio ducking.

---

### Entry 4: Kiro Crew Agentic Specification Files (`.kiro/specs/`) Alignment
* **Task Attempted:** Aligning Kiro Crew agentic specification files (`.kiro/specs/`) with automated test runners.
* **Steps Taken:** Formulated functional requirements with numbered IDs (REQ-001 through REQ-004) in `.kiro/specs/*.spec.json`. Ran Vitest test suites to verify requirements.
* **Expected vs. Actual:**
  * *Expected:* Kiro Crew CLI could parse test results and automatically update the `"status": "IMPLEMENTED"` tags in spec JSON.
  * *Actual:* Had to manually maintain the specification status mapping.
* **Severity:** Low.
* **Workaround Used:** Added explicit `verification` test file paths in the spec JSON files and mapped assertions directly to requirement IDs.
* **Actionable Suggestion:** Add a `kiro test --sync-specs` command in the Kiro developer tooling that maps test assertion passes directly to spec requirements.
