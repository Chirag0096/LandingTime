# Landing Time — System Architecture

## Overview

Landing Time is a voice-first, multi-dish kitchen coordination system designed for the Amazon Developer Hackathon (Alexa+ Track). It models cooking tasks across dishes as a unified Directed Acyclic Graph (DAG) and solves the Resource-Constrained Project Scheduling Problem (RCPSP) using Backward Critical Path Method (CPM) algorithms and deterministic shock-absorber replanning.

## Architectural Layers

```
┌─────────────────────────────────────────────────────────────┐
│               Echo Show 15 / Web Simulator                  │
│   (Vite + React 19 + Tailwind CSS 4 Light-Mode Interface)   │
└──────────────────────────────┬──────────────────────────────┘
                               │  (REST API / Streamable HTTP)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Express Server                         │
│               (/api/v1 REST Router & /mcp)                  │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      CookingSessionService   │ │     Official MCP Server    │
│  (Session lifecycle & state) │ │  (@modelcontextprotocol/   │
│                              │ │   sdk Streamable HTTP)     │
└───────────────┬──────────────┘ └────────────┬───────────────┘
                │                             │
                ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   CPMScheduler & Replan Engine              │
│       • Kahn's Algorithm topological acyclic validation     │
│       • Backward CPM Pass (LFT, LST)                        │
│       • Forward CPM Pass (EST, EFT, Total Float)            │
│       • Critical Path Identification (TF = 0)               │
│       • Multi-Resource Conflict Detection:                  │
│           - Single-zone Oven Rule of 25 (≤25°F shared)      │
│           - 4-Burner Stovetop capacity allocation           │
│           - Active Cook Hands-On Attention Deconfliction    │
│       • Shock-Absorber Delay Recovery Engine:               │
│           - Rule 1: Compress safe resting window (≥10m)     │
│           - Rule 2: Protect in-progress baking (foil hold)  │
│           - Rule 3: Shift unstarted downstream tasks        │
│           - Rule 4: Critical path landing time shift        │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│   Recipe & Substitution DAGs │ │    SQLite Persistence      │
│  • Herb-Crusted Chicken DAG  │ │  (better-sqlite3, WAL mode)│
│  • Crispy Potatoes DAG       │ │  • Sessions Table          │
│  • Asparagus & Gravy DAG     │ │  • Recipes Table           │
│  • Culinary Sub Matrix       │ │  • Substitutions Table     │
└──────────────────────────────┘ └────────────────────────────┘
```

## Key Technical Invariants

1. **₹0 Budget & Local-First**: Runs entirely locally using SQLite and in-process TypeScript logic. No paid third-party APIs, LLM calls in the hot path, or cloud subscriptions are required.
2. **Deterministic Hot Path**: CPM scheduling and replanning execute in < 5ms (measured in microseconds). This guarantees meeting the 500ms voice round-trip SLA.
3. **Cross-Dish Precedence**: Steps like Pan Gravy deglazing declare explicit dependencies on roasted chicken drippings (`chk-rest`), preventing invalid schedules where sauce finishes before the roast.
4. **Optimistic Concurrency Control**: Sessions maintain a `scheduleRevision` counter. Any proposal or step completion checking an outdated revision triggers a concurrency error, preventing race conditions.
5. **Separation of Proposal and Acceptance**: Delay and substitution events create non-mutating proposals. The accepted schedule remains unaltered until explicit user or voice confirmation.
