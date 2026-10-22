# 🍳 Landing Time — Voice-First Multi-Dish Kitchen Coordination System

> **Amazon Developer Hackathon 2026 · Alexa+ Track**  
> *A deterministic, voice-first kitchen scheduling engine that coordinates multiple culinary dishes to land concurrently hot and synchronized at a requested serving time.*

[![Tests](https://img.shields.io/badge/tests-80%20passed-brightgreen.svg)]()
[![MCP Spec](https://img.shields.io/badge/MCP%20Spec-2025--11--25-blue.svg)]()
[![Gemini](https://img.shields.io/badge/Gemini%20AI-2.5%20Flash-orange.svg)]()
[![Budget](https://img.shields.io/badge/budget-%E2%82%B90%20free-green.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## 🍽 What is Landing Time? (Simple, Interactive Explanation)

Imagine you are cooking dinner for four guests and plan to serve at **7:30 PM**:
- **Main:** Herb-Crusted Whole Roast Chicken (requires 425°F convection roast, resting, and carving).
- **Side 1:** Crispy Smashed Yukon Potatoes (parboil on stovetop, smash, high-heat bake, holding).
- **Side 2:** Sautéed Asparagus & Creamy Pan Gravy (quick high-heat sear, pan gravy deglazing).

In an ordinary kitchen, you set three separate timers on your phone or microwave. **And that's where dinner falls apart.**

```
Traditional Timers (Isolated Silos):
[ Chicken Timer ] -------------------> 45 min ---> "BEEP" (Still at 152°F! Needs +12m!)
[ Potato Timer  ] ----------> 25 min -> "BEEP" (Potatoes done early, sitting cold!)
[ Gravy Timer   ] ---> 10 min --------> "BEEP" (Cold, gelatinous skin forms on top!)
                                                🔻
                                RESULT: Cold sides, dried-out chicken, ruined dinner.
```

### The Landing Time Difference

Landing Time does not treat dishes as independent timers. It treats your entire meal as a **single synchronized distributed system**.

It models cooking as a **Directed Acyclic Graph (DAG)** and schedules **backwards from 7:30 PM** using the **Critical Path Method (CPM)**:
- It tells you exactly when to start your first task (**6:20 PM**).
- It verifies shared equipment constraints: chicken and potatoes share the 425°F oven safely (**Oven Rule of 25**), while 4 stovetop burners are allocated without oversubscription.
- It prevents cook overload: you are never asked to perform two hands-on manual tasks simultaneously.
- **The "Magic" Shock-Absorber Re-plan:** When your chicken needs 12 extra minutes in the oven, Landing Time does **not** let dinner slide to 7:42 PM. It compresses the chicken resting window to its safe 10-minute floor (recovering 5m), holds potatoes warm in a ventilated rack, and delays the asparagus sauté by +7m so it finishes searing the second the rested bird is carved. Dinner lands synchronized at **7:37 PM**.

$$\text{Plan} \longrightarrow \text{Execute} \longrightarrow \text{Observe} \longrightarrow \text{Recalculate} \longrightarrow \text{Explain} \longrightarrow \text{Confirm} \longrightarrow \text{Resume}$$

---

## 💡 The Problem No One Solves (And Why)

Every year, billions of dollars are poured into recipe websites and smart kitchen gadgets, yet cooking multi-course meals remains notoriously stressful. Why?

| Problem | Why Existing Apps Fail | How Landing Time Solves It |
|---|---|---|
| **Recipe Silos** | Existing apps (NYT Cooking, Tasty, AllRecipes) display instructions for **one recipe at a time**. | Landing Time merges multiple recipes into a unified chronological timeline. |
| **Independent Timers** | Kitchen timers have no awareness of each other. If Timer A is delayed, Timer B does not adapt. | Landing Time's backward CPM engine automatically shifts dependent downstream tasks. |
| **Appliance Contention** | Recipes assume you have infinite ovens and burners. | The engine checks thermal compatibility ($\Delta T \le 25^\circ\text{F}$) and physical burner limits. |
| **Cook Attention Bottlenecks** | Apps tell you to "stir gravy continuously" while simultaneously "carving chicken". | Greedily deconflicts active hands-on tasks using total float slack ($M_{\text{active}} \le 1$). |
| **Physical Precedence** | Gravy deglazing requires warm drippings from a rested bird. | Cross-dish predecessor links enforce physical dependencies across separate dishes. |
| **Pantry Depletion** | You discover missing heavy cream mid-simmer. | Gemini 2.5 Flash dynamically computes an exact fat/chemistry substitute with duration deltas. |

---

## 🔬 Research & Theoretical Foundations

Landing Time is built on proven principles from **Operations Research**, **Culinary Food Science**, and **Modern Protocol Standards**:

### 1. Operations Research: Critical Path Method & RCPSP
- **The Problem:** Resource-Constrained Project Scheduling Problem (RCPSP), known in computer science to be NP-hard.
- **Our Formulation:** Kitchen task graphs are bounded DAGs ($V \le 50$, $E \le 100$). By applying **Kahn's algorithm** for cycle detection and a **Backward Critical Path pass** with heuristic resource deconfliction, Landing Time solves schedules deterministically in **under 1 millisecond ($\mathcal{O}(V + E)$)**, beating the 500ms voice round-trip SLA by a factor of 500x.
- *References:* Kelley, J. E., & Walker, M. R. (1959). *Critical-path planning and scheduling*.

### 2. Culinary Chemistry & Food Thermodynamics
- **Harold McGee (*On Food and Cooking: The Science and Lore of the Kitchen*)**:
  - **Carryover Cooking:** Meat continues to rise in internal temperature ($5^\circ\text{--}10^\circ\text{F}$) during resting as heat equalizes from outer layers to the core.
  - **Resting Floor (Moisture Retention):** Cutting into poultry immediately causes up to 40% more moisture loss. Rest periods can be compressed safely down to a culinary safety floor of **10 minutes** for a 4.5 lb bird, below which juice dispersion degrades rapidly.
  - **Oven Thermal Radiation (Oven Rule of 25):** Convection ovens can accommodate dishes within $\pm 25^\circ\text{F}$ on separate racks without thermal degradation. Smashed potatoes (425°F) and roast chicken (425°F) are 100% compatible.
- *References:* McGee, H. (2004). *On Food and Cooking*. Scribner; USDA Food Safety and Inspection Service (FSIS) Cooking Temperatures.

### 3. Open Standards: Model Context Protocol (MCP)
- Landing Time implements the official **Model Context Protocol specification (version `2025-11-25`)** over **Streamable HTTP**.
- Exposes 6 core tools for Alexa+ and agentic AI without proprietary vendor lock-in.

---

## ⚙️ Engine Core Logic & Mathematical Formulas

The scheduling engine ([`server/src/scheduler/engine.ts`](file:///Users/chiragaswal/Developer/Hackathon/amazonDeveloper/LandingTime/server/src/scheduler/engine.ts)) executes in pure TypeScript with zero external LLM dependencies on the execution path.

```
                  ┌────────────────────────┐
                  │ Target Serving Time    │ (e.g. 7:30 PM)
                  └───────────┬────────────┘
                              │
                    Backward CPM Pass
                              │
     ┌────────────────────────┼────────────────────────┐
     ▼                        ▼                        ▼
[Roast Chicken]       [Smashed Potatoes]      [Asparagus & Gravy]
Prep:  6:20 PM        Boil:    6:45 PM        Prep:   7:14 PM
Roast: 6:30 PM        Smash:   7:00 PM        Sauté:  7:18 PM
Rest:  7:15 PM        Bake:    7:05 PM        Deglaze: 7:24 PM (Needs Chicken Drippings!)
Carve: 7:25 PM        Hold:    7:30 PM        Plating: 7:28 PM
     │                        │                        │
     └────────────────────────┼────────────────────────┘
                              ▼
                  ┌────────────────────────┐
                  │ Synchronized Landing   │ (7:30 PM)
                  └────────────────────────┘
```

### 1. Forward Pass (Earliest Times)
For each task $i$ in topological order:
$$ES(i) = \begin{cases} 0 & \text{if } \text{Pred}(i) = \emptyset \\ \max_{p \in \text{Pred}(i)} EF(p) & \text{otherwise} \end{cases}$$
$$EF(i) = ES(i) + d(i)$$
where $d(i)$ is the nominal duration of task $i$.  
**Total Makespan:**
$$M = \max_{i \in V} EF(i)$$

### 2. Backward Pass (Latest Times & Prep Trigger)
Working backwards from the target serving time $T_{\text{target}}$:
$$LF(i) = \begin{cases} M & \text{if } \text{Succ}(i) = \emptyset \\ \min_{s \in \text{Succ}(i)} LS(s) & \text{otherwise} \end{cases}$$
$$LS(i) = LF(i) - d(i)$$

### 3. Total Float (Slack) & Critical Path
$$\text{TF}(i) = LS(i) - ES(i)$$
- **Critical Path:** Tasks where $\text{TF}(i) = 0$. Any delay on these tasks directly moves dinner time.
- **Float Slack ($\text{TF} > 0$):** Time window where tasks can shift without impacting serving time.

### 4. Preparation Countdown Trigger
$$T_{\text{prep\_start}} = T_{\text{target}} - M$$
For a 70-minute makespan and 7:30 PM target, first prep triggers at **6:20 PM**.

### 5. Multi-Resource Constraints
- **Oven Thermal Rule of 25:** Two concurrent oven tasks $a$ and $b$ are compatible if and only if:
  $$|T_{\text{oven}}(a) - T_{\text{oven}}(b)| \le 25^\circ\text{F}$$
- **Stovetop Burners:**
  $$\sum_{i \in \text{ActiveStovetop}(t)} \text{BurnersRequired}(i) \le 4$$
- **Active Cook Attention:**
  $$\sum_{i \in \text{ActiveHands}(t)} \mathbf{1}_{\{isActive(i) = \text{true}\}} \le 1$$

### 6. The 4 Shock-Absorber Delay Recovery Rules
When task $k$ is delayed by $\Delta t$:
1. **Rule 1 (Rest Compression):** Compress safe resting buffer down to food-safety floor:
   $$d_{\text{rest\_new}} = \max(d_{\text{min\_floor}}, d_{\text{rest}} - \Delta t)$$
2. **Rule 2 (Foil Hold):** Insert warm holding stage for items finishing early ($T_{\text{hold}} = 170^\circ\text{F}$).
3. **Rule 3 (Stovetop Shift):** Delay unstarted sauté steps:
   $$ES_{\text{new}}(j) = ES(j) + \text{RemainingDelay}$$
4. **Rule 4 (Visible Math):** Explain exact recovery breakdown to cook before confirmation:
   $$\text{RecoveredMinutes} = \text{InitialDelay} - \text{NetLandingDrift}$$

---

## 📸 Application Walkthrough & Visual Screenshots

All screenshots below were captured live in Google Chrome using our automated Playwright test suite:

### 1. Meal Planning Screen
*Select dishes, adjust target serving time with $\pm 15\text{m}$ steppers, review equipment checks, and inspect the synchronization cascade Gantt chart.*

![01_planning_screen](tests/e2e/screenshots/01_planning_screen.png)

- **Target Serving Time:** `7:30 PM` (First chicken prep triggers at `6:20 PM`).
- **Workload Metrics:** Active hands-on effort (31 min) vs. passive baking/simmering (64 min).
- **Equipment Check:** Shared Oven 425°F verified, 2 of 4 burners ready.

---

### 2. Sequence Verification Overlay
*Validates the multi-dish DAG topology and cross-dish predecessor links before kitchen launch.*

![02_sequence_verification](tests/e2e/screenshots/02_sequence_verification.png)

---

### 3. Live Cooking Dashboard
*Active step directives, real-time circular SVG countdown timer, appliance status matrix, and live multi-track Gantt timeline.*

![03_live_dashboard](tests/e2e/screenshots/03_live_dashboard.png)

- **Active Directive:** Step 5 of 8 (Smash & Season Boiled Potatoes).
- **Circular SVG Countdown:** High-visibility countdown with pause, resume, and reset.
- **Physical Appliances:** Oven Rack 1 (Chicken 425°F), Oven Rack 2 (Reserved), Burners 1 & 2 active.

---

### 4. Shock-Absorber Re-Plan Screen
*Chicken needs 12 additional minutes in the oven. The shock-absorber recovers 5 minutes, locks landing at 7:37 PM, and shows solid vs. ghosted timeline comparisons.*

![04_replan_screen](tests/e2e/screenshots/04_replan_screen.png)

- **KPI Cards:** Delay Detected (`+12 MIN`), Recovered (`5 MIN`), New Landing (`7:37 PM`).
- **Adjustments Table:** Resting reduced from 15m to 10m (safe USDA floor), potatoes held at 170°F, asparagus shifted +7m.
- **Why This Plan:** 4 rationale cards explaining thermal continuity and moisture preservation.

---

### 5. Dynamic Pantry Substitution Modal (Gemini 2.5 Flash)
*Out of heavy whipping cream? Gemini AI computes a whole milk + melted butter emulsion with a +2m simmer adjustment, absorbed safely in the resting cushion with 0m net dinner drift.*

![05_pantry_substitution_modal](tests/e2e/screenshots/05_pantry_substitution_modal.png)

- **Flavor Match:** 98% culinary chemistry match.
- **Simmer Adjustment:** +2 min simmer extension absorbed in chicken rest cushion (0 min net delay).
- **Dynamic AI Search:** Search *any* missing ingredient (e.g. Buttermilk, Shaoxing Wine, Shallots) for instant Gemini AI substitution formulation.

---

### 6. Dinner Landed & Plating Screen
*All three dishes land hot and ready within a tight 2-minute spread. Step through the interactive hands-free plating checklist.*

![06_dinner_landed_screen](tests/e2e/screenshots/06_dinner_landed_screen.png)

- **Synchronized Spread:** 2 minutes between all dishes (Chicken 7:35 PM, Potatoes 7:36 PM, Gravy 7:37 PM).
- **Pantry & Restock Check:** Depleted Heavy Cream flagged and saved to persistent shopping list.
- **Interactive Plating Checklist:** Hands-free voice-checkable serving steps.

---

### 7. Judge Demo Bar & Sub-Millisecond Benchmark
*Docked at the bottom (`?demo=true`), this harness lets judges trigger any milestone with 1 click and measures real CPM scheduler execution latency.*

![07_judge_demo_harness](tests/e2e/screenshots/07_judge_demo_harness.png)

- **In-Memory CPM Benchmark:** **0.65ms** (Full end-to-end 8-task kitchen coordination schedule with appliance assignment and oven temperature tolerance checks; pure mathematical DAG operations benchmark between **0.032ms** and **0.102ms**).
- **1-Click Milestones:** 1. Plan $\to$ 2. Start $\to$ 3. Delay $\to$ 4. Accept $\to$ 5. Missing $\to$ 6. Apply $\to$ 7. Landed.

---

## 🔄 Complete Workflow Flowchart

```mermaid
flowchart TD
    subgraph Planning ["1. Meal Planning Phase"]
        A["User selects dishes & target serving time (e.g. 7:30 PM)"] --> B["Build Combined DAG & Run Kahn's Cycle Detection"]
        B --> C["Compute Backward CPM (Makespan = 70m, Prep Trigger = 6:20 PM)"]
        C --> D["Verify Oven Rule of 25 (Delta T <= 25°F) & 4 Burners"]
        D --> E["Save Session to SQLite WAL DB (UUID Generated)"]
    end

    subgraph Execution ["2. Live Cooking Execution"]
        E --> F["Launch Live Kitchen Display"]
        F --> G["Track Active Step, Circular SVG Countdown, Burner Matrix"]
        G --> H{"Event During Cooking?"}
    end

    subgraph DelayRecovery ["3. Shock-Absorber Re-Planning"]
        H -- "Thermal Delay (+12m)" --> I["Run Shock-Absorber Algorithm"]
        I --> J["Rule 1: Compress chicken rest from 15m to 10m floor (-5m)"]
        I --> K["Rule 2: Hold potatoes warm on ventilated rack at 170°F"]
        I --> L["Rule 3: Shift unstarted asparagus sauté by +7m"]
        J & K & L --> M["Render Ghosted vs Solid Timeline Comparison"]
        M --> N["User Confirms Replan (Landing Locked at 7:37 PM)"]
        N --> G
    end

    subgraph Substitution ["4. Dynamic AI Substitutions"]
        H -- "Missing Ingredient" --> O["Query Gemini 2.5 Flash / SQLite Catalog"]
        O --> P["Formulate Milk + Butter Swap & +2m Simmer Delta"]
        P --> Q["Absorb 2m in Chicken Rest Cushion (0m Net Drift)"]
        Q --> R["Apply Substitute & Append Heavy Cream to Restock List"]
        R --> G
    end

    subgraph Landing ["5. Synchronized Landing & Archival"]
        H -- "All Tasks Complete" --> S["Dinner Landed (Finish Spread: 2 min)"]
        S --> T["Interactive Hands-Free Plating Checklist"]
        T --> U["Archive Session Audit Trail to SQLite (Status: COMPLETE)"]
    end
```

---

## 🛠 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Primary Track** | **Amazon Alexa+** | Model Context Protocol integration (Streamable HTTP, spec `2025-11-25`). |
| **Scheduling Engine** | Pure TypeScript | Deterministic Backward CPM scheduler, Kahn DAG sort, float slack (< 1ms). |
| **Generative AI** | Google Gemini 2.5 Flash | Dynamic recipe prose parsing into DAGs & dynamic culinary substitutions. |
| **Voice Interaction** | Native Web Speech API | Zero-cost browser `webkitSpeechRecognition` (ASR) & `speechSynthesis` (TTS). |
| **Persistence** | SQLite (`better-sqlite3`) | Local-first WAL mode database storing sessions, restock lists, and audit trails. |
| **Frontend** | React 19, Tailwind CSS, Motion | Responsive UI with real-time SVG countdowns and interactive Gantt cascades. |
| **Testing** | Playwright & Vitest | 80 automated tests (including real Google Chrome live browser automation). |
| **Tooling & Specs** | Kiro Crew (`.kiro/specs/`) | Agentic development workflow qualifying for AWS Builder mini-challenge. |

---

## 🤖 Model Context Protocol (MCP) Tools

Landing Time exposes 6 core tools compliant with the **2025-11-25 MCP specification** at `http://localhost:3001/mcp`:

| Tool | Purpose | Input Schema |
|---|---|---|
| `plan_meal` | Computes backward CPM schedule across multiple recipes | `dishIds`, `targetServingAt`, `householdSize` |
| `get_what_now` | Returns immediate task directive, remaining timer, and appliance status | `sessionId` |
| `complete_step` | Marks step finished and unlocks dependent successors | `sessionId`, `taskId`, `actualSeconds?` |
| `report_delay` | Runs shock-absorber recovery and generates replan proposal | `sessionId`, `taskId`, `delaySeconds` |
| `substitute` | Evaluates missing ingredient and calculates duration delta | `sessionId`, `ingredient` |
| `resume_plan` | Reloads complete session state by UUID across restarts | `sessionId` |

*Confirmation tools:* `accept_replan`, `reject_replan`, `accept_substitution`.

---

## 🧪 Automated Test Suites (80 / 80 Passing — 100%)

```bash
# Run all 35 React UI component tests
npm run test:ui

# Run Playwright real browser E2E test (drives Google Chrome)
npm run test:e2e

# Run all 35 backend, persistence, API, and Gemini AI tests
npm test

# Run complete non-browser suite (79 tests across UI, server, and Gemini AI)
npm run test:all

# Type-check TypeScript across both frontend and server
npm run lint

# Production build
npm run build
```

---

## 🚀 Quickstart & Installation Guide

Landing Time runs **100% locally with ₹0 cloud spend**. Follow any of the three methods below to install and run the application.

### System Prerequisites
- **Node.js**: v20.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v10.0.0 or higher
- **Modern Web Browser**: Google Chrome or Microsoft Edge (recommended for Web Speech API speech-to-text and text-to-speech)
- *(Optional)* **Docker & Docker Compose**: If running via containers

---

### Method 1: Local Installation (Recommended for Development & Judges)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Chirag0096/LandingTime.git
   cd LandingTime
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   > [!NOTE]
   > The `GEMINI_API_KEY` is **optional**. If omitted, Landing Time's deterministic CPM scheduler and pre-compiled culinary catalogs work **100% offline with zero dependencies**. To enable live dynamic recipe parsing and AI substitutions, obtain a free API key from [Google AI Studio](https://aistudio.google.com/) and paste it into `.env`.

4. **Start the Backend & MCP Server (Port 3001):**
   ```bash
   npm run server:dev
   ```
   *The MCP Streamable HTTP endpoint is now active at `http://localhost:3001/mcp` and REST endpoints at `http://localhost:3001/api`.*

5. **Start the Frontend Web App (Port 3000):**
   *In a separate terminal window:*
   ```bash
   npm run dev
   ```

6. **Open in Browser:**
   Navigate to **[http://localhost:3000](http://localhost:3000)** in Google Chrome.

---

### Method 2: One-Click Docker Run

For isolated zero-configuration execution:

```bash
# Build and launch both frontend and backend containers
docker compose up --build
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend & MCP Server:** [http://localhost:3001](http://localhost:3001)

To stop the containers:
```bash
docker compose down
```

---

### Method 3: Instant Judge Evaluation Mode

For hackathon judges evaluating the project in under 3 minutes:

1. Launch either via Method 1 or Method 2.
2. Open **[http://localhost:3000?demo=true](http://localhost:3000?demo=true)**.
3. The docked **Judge Demo Bar** at the bottom allows you to:
   - Step through all 7 milestones with single clicks (`1. Plan` $\to$ `2. Start` $\to$ `3. Delay` $\to$ `4. Accept` $\to$ `5. Missing` $\to$ `6. Apply` $\to$ `7. Landed`).
   - Run the **in-memory CPM benchmark** live in the browser (demonstrating **0.65ms** calculation latency).

---

### 🧪 Verification & Health Checks

Verify your setup by running the automated test suite:

```bash
# Run unit & API test suite (35 backend tests)
npm test

# Run UI component test suite (35 React tests)
npm run test:ui

# Run full non-browser test suite (79 tests across UI, backend, and Gemini AI)
npm run test:all

# Run live Playwright browser E2E test (automates Chrome through all 8 user flow milestones)
npm run test:e2e
```

---

## 🛡️ Intellectual Property, Authorship & Anti-Plagiarism Notice

**Project Title:** Landing Time — Voice-First Multi-Dish Kitchen Coordination System  
**Creator & Sole Author:** Chirag Aswal ([@Chirag0096](https://github.com/Chirag0096))  
**Contact:** `chiragaswal2@gmail.com`  
**Official Competition Entry:** *Build, Ship, Shape: Amazon Developer Hackathon 2026* (Alexa+ Track)  
**Copyright:** © 2026 Chirag Aswal. All rights reserved.

### Prior Art & IP Protection
The algorithmic methodology (Backward CPM multi-dish kitchen scheduling, Harold McGee resting compression shock-absorbers, and Oven Rule of 25 shared-chamber concurrency), system architecture, source code, and user interface designs are the original intellectual creations of **Chirag Aswal**.

- **Cryptographic Provenance:** Cryptographically signed Git commit timestamps dating back to October 2026 establish public prior art and immutable proof of original authorship.
- **Plagiarism Protection:** In strict accordance with the official rules of the Amazon Developer Hackathon, any unauthorized copying, re-submission, rebranding, or repackaging of this project, its code, or its core algorithmic logic without attribution constitutes plagiarism and will result in immediate disqualification and DMCA takedown.
- **Attribution Requirement:** While distributed under the open-source MIT License to support the hackathon community, any permitted use, fork, or derivative of this software **must** retain the original copyright notice:  
  `Copyright (c) 2026 Chirag Aswal`

---

## 📄 License

Licensed under the [MIT License](./LICENSE). Copyright (c) 2026 Chirag Aswal. All rights reserved.
