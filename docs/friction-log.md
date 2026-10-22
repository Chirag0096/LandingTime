# Landing Time — Developer Friction Log

This log captures developer experience hurdles, protocol edge cases, and SDK quirks encountered during the development of Landing Time for the Amazon Developer Hackathon (Alexa+ Track).

---

### Entry 1: MCP Streamable HTTP Transport Options Parameter Mismatch
- **Task Attempted**: Initializing `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk/server/streamableHttp.js`.
- **Steps**:
  1. Followed standard HTTP server examples passing `{ endpoint: '/mcp' }` into `new StreamableHTTPServerTransport({ endpoint: '/mcp' })`.
  2. Ran TypeScript check with Node ESM compilation.
- **Expected vs Actual**:
  - *Expected*: Transport accepts endpoint path option or ignores non-conflicting config.
  - *Actual*: TypeScript error `TS2353: Object literal may only specify known properties, and 'endpoint' does not exist in type 'WebStandardStreamableHTTPServerTransportOptions'`.
- **Severity**: Medium (Build blocker until diagnosed).
- **Workaround**: Inspected `webStandardStreamableHttp.d.ts` and observed that options only accept `sessionIdGenerator?: () => string`, `onsessioninitialized`, and `onsessionclosed`. Configured `sessionIdGenerator: () => crypto.randomUUID()`.
- **Suggestion**: Update MCP SDK documentation and TypeScript definitions to include clear Express/Node.js adapter examples alongside Web Standards Fetch API examples.

---

### Entry 2: Echo Show Webview PostMessage Bridge Isolation
- **Task Attempted**: Direct client-to-backend communication from Echo Show 15 webview.
- **Steps**:
  1. Analyzed frontend architecture connecting to backend in Alexa-hosted webview.
  2. Evaluated browser `fetch()` directly from webview to local server.
- **Expected vs Actual**:
  - *Expected*: Webview can freely make CORS requests to backend server.
  - *Actual*: On real Echo Show hardware, CSP policies block arbitrary external origins from webviews unless routed through Alexa tool responses (`postMessage` bridge).
- **Severity**: High (Runtime communication blocker on physical devices).
- **Workaround**: Followed the official MCP Apps pattern: MCP tool responses include structured `ui` payload keys (`screen`, `gantt`, `masterClock`). Alexa's orchestration layer delivers these payloads down to the webview via message bus, and the webview updates its local countdown timer with zero per-tick network round trips.
- **Suggestion**: Provide an official `@modelcontextprotocol/ext-apps` simulator package in npm for testing the webview bridge locally in Vite dev mode.

---

### Entry 3: Node ESM `.ts` Extension Resolution with tsx
- **Task Attempted**: Importing internal server TypeScript modules in an ESM repository (`"type": "module"`).
- **Steps**:
  1. Configured server with Node.js ES2022 modules.
  2. Created separate `server/tsconfig.json` with `"moduleResolution": "bundler"` and `"allowImportingTsExtensions": true`.
- **Expected vs Actual**:
  - *Expected*: Native node loader runs TypeScript without extension complaints.
  - *Actual*: Standard Node ESM requires explicit file extensions. Without bundler resolution or tsx loader, imports fail.
- **Severity**: Medium.
- **Workaround**: Explicitly used `.ts` import specifiers (e.g. `import ... from './types.ts'`), and configured `tsx` for server development execution.
- **Suggestion**: Clarify TypeScript project guidance for monorepo-adjacent Node server directories inside Vite roots.

---

### Entry 4: SpeechSynthesis API vs Alexa Native TTS
- **Task Attempted**: Generating spoken feedback for cooking steps.
- **Steps**:
  1. Audited existing browser code calling `window.speechSynthesis`.
- **Expected vs Actual**:
  - *Expected*: Web speech API works on Echo Show.
  - *Actual*: Echo Show handles text-to-speech directly via Alexa voice orchestration. In-webview speech synthesis conflicts with Alexa's physical microphones and speaker ducking.
- **Severity**: Medium.
- **Workaround**: Removed browser-side speech synthesis calls; tool responses emit textual responses in the MCP content array that Alexa naturally speaks before displaying visual cards.
- **Suggestion**: Document in the Alexa+ developer portal that all voice output should be returned via tool `content[].text` fields.
