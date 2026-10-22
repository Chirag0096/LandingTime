---
name: landing-time
description: Voice-first multi-dish kitchen coordination system that backwards-schedules multiple dishes to land hot and synchronized at a target serving time.
version: 1.0.0
tools:
  - plan_meal
  - get_what_now
  - what_now
  - complete_step
  - report_delay
  - accept_replan
  - reject_replan
  - substitute
  - accept_substitution
  - resume_plan
---

# Landing Time — Kitchen Coordination Skill

Landing Time coordinates multiple culinary dishes to land concurrently at a requested serving time. It solves the kitchen coordination problem by modeling cooking as a resource-constrained directed acyclic graph (DAG) and running backward Critical Path Method (CPM) scheduling, real-time shock-absorber delay recovery, and culinary-chemistry substitutions.

## Core Capabilities

1. **Multi-Dish Coordinated Scheduling**: Computes a backward CPM schedule across multiple recipes, finding the exact prep trigger time for each dish.
2. **Shared Kitchen Equipment Modeling**: Enforces single-zone oven temperature compatibility (Rule of 25: ≤25°F difference can share convection oven), 4 stovetop burner allocation, and cook active-hands attention limits.
3. **Cross-Dish Precedence**: Models physical dependencies across dishes (e.g. pan gravy deglazing requires warm drippings from rested roast chicken).
4. **Shock-Absorber Delay Recovery**: When a dish needs more time (e.g., roast chicken internal temperature reads 152°F instead of 165°F, requiring +12 minutes), the deterministic recovery engine applies priority rules:
   - **Rule 1**: Compress safe resting buffers down to USDA safety floors (e.g. chicken rest compressed from 15m to 10m safe minimum, recovering 5m).
   - **Rule 2**: Protect in-progress baking tasks (insert foil-hold, never overbake).
   - **Rule 3**: Shift unstarted downstream tasks (e.g. shift stovetop asparagus sauté by +7m so spears finish hot right as the bird finishes resting).
   - **Rule 4**: Shift projected landing time and explain the exact mathematical delta to the cook.
5. **Culinary Substitutions**: Chemistry-compatible substitutions (e.g. milk + melted butter for heavy cream) with automatic duration adjustment (+2m simmer) and persistent restock list generation.
6. **Session Persistence**: Sessions persist in SQLite with revision counters, optimistic concurrency control, and audit logs. Can be resumed across devices using the session UUID.

## Typical Voice Interaction Phrases

- *"Plan dinner for 7:30 PM: roast chicken, crispy smashed potatoes, and asparagus pan gravy."* -> Calls `plan_meal`
- *"What should I do now?"* -> Calls `get_what_now`
- *"Done with step"* / *"Chicken is in the oven"* -> Calls `complete_step`
- *"The chicken needs 12 more minutes"* -> Calls `report_delay`
- *"Accept new plan"* -> Calls `accept_replan`
- *"I am out of heavy cream"* -> Calls `substitute`
- *"Resume meal session [sessionId]"* -> Calls `resume_plan`

## Error Handling & Latency Budget

- All CPM calculations and replanning passes are deterministic and complete in under 5ms, comfortably within the 500ms voice round-trip SLA.
- If an unknown tool or invalid parameter is received, the skill returns an RFC-compliant JSON-RPC error.
- Optimistic concurrency protection: if session state evolves between proposal generation and confirmation, a stale revision conflict error is returned with instructions to recalculate.
