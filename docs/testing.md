# Landing Time — Testing & Verification Guide

## Test Architecture

The test suite covers unit, integration, persistence, REST API, and MCP protocol compliance with 100% pass rates.

### Test Suites Summary

1. **`server/tests/unit/scheduler.test.ts`** (11 tests):
   - Valid DAG validation
   - Kahn's algorithm cycle detection
   - Unknown predecessor detection
   - Duplicate task ID and negative duration rejection
   - Single task float and start/finish bounds
   - Cross-dish precedence (gravy depending on chicken rest)
   - Oven Rule of 25 shared vs divergent temperature conflicts
   - Active cook attention deconfliction
   - Shock-absorber Rule 1 rest compression down to safe floor
   - Non-mutating proposal generation

2. **`server/tests/integration/persistence_and_api.test.ts`** (9 tests):
   - Schema auto-initialization & catalog seeding
   - SQLite session persistence across process restart
   - Task completion & automatic dependency unlocking
   - Delay proposal generation & atomic commitment
   - Optimistic concurrency protection on stale revisions
   - Ingredient substitution & restock list persistence
   - REST API endpoints: `/api/v1/health`, `/api/v1/recipes`, `/api/v1/sessions`

3. **`server/tests/integration/mcp_protocol.test.ts`** (3 tests):
   - MCP `tools/list` discovery for all 6 core tools
   - Complete 6-tool end-to-end execution journey
   - Protocol error handling for unknown tools and missing parameters

4. **`server/tests/integration/e2e_acceptance.test.ts`** (9 tests):
   - Complete 21-step acceptance scenario specified in Section 38:
     - Plan meal -> Start cook -> Complete prep -> Request what-now -> Report 12m chicken delay -> Verify proposal -> Accept proposal -> Report missing cream -> Retrieve substitution candidate -> Accept substitution -> Resume session across database reload -> Complete remaining tasks -> Check plating items -> Finalize session -> Verify event audit trail.

5. **`src/utils/` tests** (9 tests):
   - `scheduler.test.ts`: 12-hour / minute conversion, prep trigger calculation, dynamic landing calculation.
   - `timelineEngine.test.ts`: deterministic track generation, baseline vs delayed vs substituted timeline rendering.

6. **`tests/ui/` React Interface Test Suites** (35 tests):
   - `planning_screen.test.tsx` (8 tests): dish catalogue rendering, target serving time picker, stepper +/-15m adjustments, presets, prep trigger countdown, add dish modal lifecycle, dish removal.
   - `live_dashboard_screen.test.tsx` (8 tests): active step card, circular SVG progress timer (pause/reset), step sub-item checklist toggle, advance step, navigator pills, appliance matrix, multi-dish Gantt tracks, quick action chips.
   - `replan_screen.test.tsx` (6 tests): +12m delay hero banner, 3 KPI metric cards, proposed schedule changes table, recovery window edit slider modal, plan acceptance and rejection buttons.
   - `pantry_substitution_modal.test.tsx` (4 tests): modal lifecycle, missing heavy cream alert, recommended milk+butter swap, culinary explanation, alternative selector, apply and cancel actions.
   - `dinner_landed_screen.test.tsx` (5 tests): synchronized landing achievement banner, target vs actual comparison (spread: 2 min), dish readiness cards, interactive plating checklist, heavy cream restock flag, session archiving.
   - `demo_control_bar.test.tsx` (3 tests): judge demonstration harness toggle, 1-click milestone execution buttons, real-time in-memory CPM latency benchmark measurement.
   - `app_e2e_flow.test.tsx` (1 integrated test): full end-to-end mounted `<App />` journey executing all 7 milestones seamlessly across screens without page refresh.

7. **`tests/e2e/user_flow.spec.ts`** (1 integrated live browser test with Playwright):
   - Real browser automation driving Google Chrome against the live local development server (`http://localhost:3000`).
   - Executes the complete 8-step user journey:
     - Step 1: Planning screen target serving time and dish verification.
     - Step 2: Verification overlay launch.
     - Step 3: Live cooking dashboard active step and circular countdown timer.
     - Step 4: Delay detection (+12m) and replan proposal review & acceptance.
     - Step 5: Missing ingredient (Heavy Cream) modal with Milk+Butter substitution (+2m simmer).
     - Step 6: Dinner Landed screen synchronization metrics, plating checklist, and restock badge.
     - Step 7: Session archiving and reset.
     - Step 8: Judge demo harness and live CPM latency benchmark validation.
   - Saves 7 full-page high-resolution screenshots to `tests/e2e/screenshots/`.

8. **`server/tests/unit/gemini_integration.test.ts`** (3 live AI tests):
   - Unstructured recipe text parsing into a valid DAG with Kahn cycle detection.
   - Dynamic culinary substitution generation for uncataloged ingredients (e.g. Shaoxing Wine, Buttermilk) with duration delta and culinary rationale.
   - 0ms zero-latency fallback and caching honoring the 15 RPM free tier quota.

## Running Tests

```bash
# Run all UI component tests (35 tests in ~1.5s)
npm run test:ui

# Run Playwright real browser E2E test (drives local Google Chrome)
npm run test:e2e

# Run all backend/server and AI tests (35 tests)
npm test

# Run all non-browser test suites (79 tests across UI, backend, AI, and utility algorithms)
npm run test:all

# Run linting (TypeScript verification for frontend, backend, and test suites)
npm run lint

# Build frontend production bundle
npm run build
```
