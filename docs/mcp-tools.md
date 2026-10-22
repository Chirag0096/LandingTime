# Landing Time — Model Context Protocol (MCP) Tools Documentation

Landing Time exposes 6 core tools via the Model Context Protocol (spec version `2025-11-25`), accessible via Streamable HTTP at `POST /mcp`.

## Core Tools Reference

### 1. `plan_meal`
Calculates a backward CPM schedule for multiple recipes targeting a specific serving deadline.
- **Inputs**:
  - `dishIds`: string[] (e.g. `["recipe-chicken", "recipe-potatoes", "recipe-asparagus-gravy"]`)
  - `targetServingAt`: string (ISO 8601, e.g. `"2026-11-14T19:30:00Z"`)
  - `householdSize`: number (default: 4)
  - `timezone`: string (default: `"America/New_York"`)
- **Outputs**:
  - `sessionId`: string (UUID)
  - `tasks`: ScheduledTask[]
  - `criticalPath`: string[]
  - `ovenCheck`: OvenFeasibility
  - `landingDrift`: number (seconds)
  - `ui`: `{ screen: "LIVE_DASHBOARD", masterClock: { ... } }`

### 2. `get_what_now` (alias: `what_now`)
Returns the immediate next cooking focus, remaining countdown, and appliance assignments.
- **Inputs**:
  - `sessionId`: string
- **Outputs**:
  - `currentTask`: TaskNode
  - `remainingSeconds`: number
  - `upcomingTasksCount`: number
  - `applianceStatus`: Record<string, string>
  - `explanation`: string

### 3. `complete_step`
Marks a task as finished and advances the session state, automatically unlocking dependent tasks.
- **Inputs**:
  - `sessionId`: string
  - `taskId`: string
  - `actualSeconds`: number (optional)
  - `expectedRevision`: number (optional optimistic concurrency guard)
- **Outputs**:
  - `completedTaskId`: string
  - `nextTask`: TaskNode
  - `scheduleRevision`: number

### 4. `report_delay`
Triggers shock-absorber replanning when a task takes longer than estimated. Emits a proposal without silently mutating the accepted plan.
- **Inputs**:
  - `sessionId`: string
  - `taskId`: string
  - `delaySeconds`: number (e.g. 720 for 12 minutes)
  - `explanation`: string (optional)
- **Outputs**:
  - `proposalId`: string
  - `newTLanding`: string
  - `changes`: ProposedChange[]
  - `explanation`: string
  - `requiresConfirmation`: boolean (always true)

### 5. `substitute`
Looks up an ingredient in the culinary chemistry substitution matrix, determines duration delta, and stages a proposal.
- **Inputs**:
  - `sessionId`: string
  - `ingredient`: string (e.g. `"heavy cream"`)
  - `recipeId`: string (optional)
- **Outputs**:
  - `proposalId`: string
  - `substitution`: SubstitutionRecord
  - `durationChangeSeconds`: number (+120s for whole milk + melted butter)
  - `projectedLandingTime`: string
  - `requiresConfirmation`: boolean

### 6. `resume_plan`
Reloads an active or past session by its UUID from SQLite persistence.
- **Inputs**:
  - `sessionId`: string
- **Outputs**:
  - Full session state, task pointers, accepted schedule, restock items, and plating checklist.

### Confirmation Actions
- `accept_replan`: Commits proposal changes and locks new landing time.
- `reject_replan`: Discards proposal, keeping current schedule.
- `accept_substitution`: Commits substitution duration adjustment and updates restock list.
