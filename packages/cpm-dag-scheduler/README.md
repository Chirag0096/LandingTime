# CPM DAG Scheduler (`cpm-dag-scheduler`)

> **Deterministic, Resource-Constrained Backward Critical Path Method (CPM) Scheduler for TypeScript & Node.js**  
> Built for voice-first agentic workflows (Alexa+, MCP, robotics) requiring sub-millisecond execution latency.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Latency](https://img.shields.io/badge/Latency-%3C%201ms%20%28O%28V%2BE%29%29-brightgreen.svg)]()
[![Types](https://img.shields.io/badge/TypeScript-Strict-blue.svg)]()

---

## 🚀 Why This Library?

Traditional task schedulers (like cron or forward queues) calculate when tasks can start from time zero. In time-critical multi-task operations (like coordinating multiple cooking dishes to finish hot simultaneously at 7:30 PM), tasks must be scheduled **backwards from a fixed target landing time**.

This library implements:
1. **Backward Critical Path Method (CPM)**: Computes Late Start (LS), Late Finish (LF), Earliest Start (ES), Earliest Finish (EF), and Total Float (slack) in $\mathcal{O}(V + E)$ time.
2. **Kahn's Topological DAG Validation**: Detects dependency cycles, self-references, and missing predecessors.
3. **Multi-Resource Contention Resolution**:
   - Single-chamber oven temperature sharing (**Rule of 25**: $\le 25^\circ\text{F}$ tolerance).
   - Stovetop burner allocation (e.g. 4 discrete physical burners).
   - Active cook / human attention limit (ensures max 1 hands-on task at any moment).
4. **Deterministic Shock-Absorber Delay Recovery**: When tasks suffer real-world delays, recalculates recovery proposals without moving dinner time by compressing safe rest buffers down to food-safety floors.

---

## 📦 Installation

```bash
npm install cpm-dag-scheduler
```

---

## ⚡ Quickstart

```typescript
import { scheduleForTarget, TaskNode, KitchenConfig } from 'cpm-dag-scheduler';

const tasks: TaskNode[] = [
  {
    id: 'roast',
    dishId: 'chicken',
    label: 'Roast Chicken in Oven',
    instructions: 'Roast at 425°F',
    durationSeconds: 2700, // 45m
    isActive: false,
    resource: 'OVEN',
    temperatureF: 425,
    predecessors: [],
    status: 'PENDING',
    stepType: 'thermal',
  },
  {
    id: 'rest',
    dishId: 'chicken',
    label: 'Rest Bird',
    instructions: 'Rest to retain juices',
    durationSeconds: 900, // 15m
    isActive: false,
    resource: 'NONE',
    predecessors: ['roast'],
    status: 'PENDING',
    stepType: 'rest',
    constraints: { canCompressRest: true, compressedMinSeconds: 600 }
  }
];

const targetServingAt = new Date('2026-11-14T19:30:00Z');
const config: KitchenConfig = {
  ovenCount: 1,
  burnerCount: 4,
  maxActiveAttention: 1,
  ovenTempToleranceF: 25,
};

// Compute Backward CPM Schedule
const result = scheduleForTarget(tasks, targetServingAt, config);

console.log('Plan Start Time:', result.planStartTime);
console.log('Critical Path:', result.criticalPath);
console.log('Scheduled Tasks:', result.scheduledTasks);
```

---

## ⏱ Performance Benchmark

Measured on standard Apple Silicon (M-series) hardware:
- Graph size: 25 tasks, 34 edges across 3 dishes.
- CPM Backward Pass: **0.65ms**
- Cycle Detection: **0.12ms**
- Delay Recovery Re-plan: **0.78ms**

Comfortably operates within a 500ms voice round-trip SLA.

---

## 📄 License

MIT License. Copyright (c) 2026 Chirag Aswal.
