# Landing Time — Scheduling Engine & Mathematical Foundations

## 1. Task Model & DAG Formulation

A task node $i$ is represented by the tuple:
$$i = \langle \text{id}, \text{dish\_id}, d_{\text{nom}}, d_{\text{min}}, d_{\text{max}}, a_i, r_i, T_{\text{set}}, \text{predecessors} \rangle$$

Where:
- $d_{\text{nom}} \in \mathbb{N}$: Nominal duration in integer seconds.
- $d_{\text{min}} \in \mathbb{N}$: Minimum safe duration (food safety floor, e.g. 600s / 10m rest for a 4.5 lb bird).
- $d_{\text{max}} \in \mathbb{N}$: Maximum acceptable duration before quality degradation.
- $a_i \in \{0, 1\}$: Active attention flag ($1 =$ hands-on cook presence required).
- $r_i \in \{\text{OVEN}, \text{BURNER\_1}, \text{BURNER\_2}, \text{BURNER\_3}, \text{BURNER\_4}, \text{NONE}\}$: Hardware resource required.
- $T_{\text{set}} \in \mathbb{R}$: Temperature setting in °F for oven tasks.
- $\text{predecessors} \subseteq V$: Set of task IDs that must finish before task $i$ can start.

The meal is a directed acyclic graph $G = (V, E)$, with within-dish recipe edges and cross-dish physical precedence edges.

## 2. Backward Critical Path Method (CPM) Algorithm

Given target serving deadline $T_{\text{target}}$:

### Backward Pass:
For leaf tasks (no successors):
$$\text{LFT}(i) = \text{makespan}$$
For non-leaf tasks:
$$\text{LFT}(i) = \min_{j \in \text{successors}(i)} \text{LST}(j)$$
$$\text{LST}(i) = \text{LFT}(i) - d_{\text{nom}}(i)$$

### Forward Pass:
For root tasks (no predecessors):
$$\text{EST}(i) = 0$$
For non-root tasks:
$$\text{EST}(i) = \max_{p \in \text{predecessors}(i)} \text{EFT}(p)$$
$$\text{EFT}(i) = \text{EST}(i) + d_{\text{nom}}(i)$$

### Float (Slack) & Critical Path:
$$\text{TF}(i) = \text{LST}(i) - \text{EST}(i)$$
$$\text{CriticalPath} = \{ i \in V \mid \text{TF}(i) = 0 \}$$

Tasks are scheduled at their **Latest Start Time (LST)** to guarantee Just-In-Time hot arrival at table time.

## 3. Multi-Resource Deconfliction

### The Oven Rule of 25:
Single-zone domestic ovens cannot maintain divergent temperatures simultaneously.
For concurrent oven intervals:
- $|\Delta T| \le 25^\circ\text{F} \implies$ **Feasible (Shared)**: Convection airflow compensates for minor differential.
- $25^\circ\text{F} < |\Delta T| \le 75^\circ\text{F} \implies$ **Warning**: Suboptimal crust or moisture loss.
- $|\Delta T| > 75^\circ\text{F} \implies$ **Infeasible**: Must stagger sequentially.

### Active Attention Deconfliction:
When two active tasks ($a_i = 1, a_j = 1$) overlap in time and exceed cook attention limit ($M_{\text{hands}} = 1$):
- Sort active tasks by LST ascending.
- Non-critical task with available positive float $\text{TF}(k) > 0$ is shifted to eliminate overlap without delaying $T_{\text{target}}$.

## 4. Shock-Absorber Re-Plan Engine: Priority Rules

When a task encounters a delay $\Delta d > 0$:

1. **Rule 1 — Rest Buffer Compression**:
   For tasks labeled "rest" or "hold":
   $$\text{compress} = \min(\Delta d, d_{\text{nom}} - d_{\text{min}})$$
   $$d_{\text{nom}} \leftarrow d_{\text{nom}} - \text{compress}, \quad \Delta d \leftarrow \Delta d - \text{compress}$$
   *(Example: Chicken rest compressed from 15m to 10m, recovering 5 minutes).*

2. **Rule 2 — Protect In-Progress Baking**:
   If an oven task is already in progress, its thermal duration is never extended (which would burn the bird). A foil-hold task is inserted after baking.

3. **Rule 3 — Downstream Stovetop Shift**:
   Unstarted parallel and downstream tasks shift later to align with the new finish:
   $$\text{LST}(j) \leftarrow \text{LST}(j) + \Delta d, \quad \text{LFT}(j) \leftarrow \text{LFT}(j) + \Delta d$$
   *(Example: Asparagus skillet sauté shifts by +7m so spears finish crisp-tender).*

4. **Rule 4 — Critical Path Shift**:
   If $\Delta d > 0$ remains after Rules 1–3:
   $$T_{\text{landing}} \leftarrow T_{\text{target}} + \Delta d$$
   *(Example: 12m delay - 5m recovery = net +7m shift -> 7:37 PM).*
