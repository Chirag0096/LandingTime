# Landing Time — Product Feedback

## 1. What Works Exceptionally Well

- **Feedback Loop**: The **Plan -> Execute -> Observe -> Recalculate -> Explain -> Confirm -> Resume** feedback loop transforms kitchen coordination from stressful guesswork into a calm, confident experience.
- **The "Visible Math" Moment**: When the roast chicken encounters a 12-minute delay, showing the exact mathematical breakdown:
  - *Delay*: +12 minutes
  - *Rest Compression*: -5 minutes (15m -> 10m safe USDA floor)
  - *Stovetop Shift*: +7 minutes (asparagus starts at 7:25 PM instead of 7:18 PM)
  - *Net Landing Drift*: +7 minutes (7:37 PM)
  This transparency reassures home cooks and eliminates panic.
- **No LLM in the Hot Path**: Keeping the CPM engine and recovery rules deterministic in pure TypeScript (< 5ms execution) ensures zero latency lag, zero hallucinations, and zero token costs during live cooking.

## 2. Friction Points in Existing Solutions

- **Independent Dish Timers**: Conventional apps run separate timers that don't know about each other. If chicken is delayed, potatoes finish early and get cold.
- **Recipe Prose vs Structured Graphs**: Human recipes describe sequential steps for one dish. They never model shared oven constraints or cross-dish dependencies (e.g. gravy deglazing using chicken drippings).
- **Messy Hands in the Kitchen**: Cooks cannot tap tiny smartphone buttons when hands have chicken grease or butter. Voice-first interaction with large Echo Show Gantt visualization is the optimal form factor.
