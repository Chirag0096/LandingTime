import crypto from 'node:crypto';
import type {
  TaskNode,
  ScheduledTask,
  KitchenConfig,
  ScheduleResult,
  ResourceConflict,
  AttentionConflict,
  OvenFeasibility,
  ProposedChange,
  ReplanProposal,
  CookingSession,
  ResourceType,
  FeasibilityStatus,
} from '../domain/types.ts';

interface CPMGraphData {
  tasks: TaskNode[];
  taskMap: Map<string, TaskNode>;
  successors: Map<string, string[]>;
  predecessors: Map<string, string[]>;
  topoOrder: string[];
  hasCycle: boolean;
  esMap: Map<string, number>;
  efMap: Map<string, number>;
  lsMap: Map<string, number>;
  lfMap: Map<string, number>;
  tfMap: Map<string, number>;
  makespan: number;
}

/**
 * Builds adjacency list and executes Kahn's algorithm + forward/backward CPM passes.
 */
function computeCPMGraph(tasks: TaskNode[]): CPMGraphData {
  const taskMap = new Map<string, TaskNode>();
  const successors = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const t of tasks) {
    taskMap.set(t.id, t);
    successors.set(t.id, []);
    predecessors.set(t.id, []);
    inDegree.set(t.id, 0);
  }

  for (const t of tasks) {
    if (!t.predecessors) continue;
    for (const predId of t.predecessors) {
      if (taskMap.has(predId) && predId !== t.id) {
        successors.get(predId)!.push(t.id);
        predecessors.get(t.id)!.push(predId);
        inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
      }
    }
  }

  // Kahn's algorithm for topological ordering
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const topoOrder: string[] = [];
  const inDegreeCopy = new Map(inDegree);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    topoOrder.push(curr);
    for (const succ of successors.get(curr) || []) {
      const nextDeg = (inDegreeCopy.get(succ) ?? 0) - 1;
      inDegreeCopy.set(succ, nextDeg);
      if (nextDeg === 0) {
        queue.push(succ);
      }
    }
  }

  const hasCycle = topoOrder.length < tasks.length;
  // If cycle exists, append unvisited tasks for best-effort computation
  if (hasCycle) {
    for (const t of tasks) {
      if (!topoOrder.includes(t.id)) {
        topoOrder.push(t.id);
      }
    }
  }

  // Forward Pass: ES & EF
  const esMap = new Map<string, number>();
  const efMap = new Map<string, number>();

  for (const taskId of topoOrder) {
    const t = taskMap.get(taskId)!;
    const preds = predecessors.get(taskId) || [];
    let es = 0;
    for (const p of preds) {
      const pEf = efMap.get(p) ?? 0;
      if (pEf > es) es = pEf;
    }
    const dur = Math.max(0, Math.round(t.durationSeconds || 0));
    esMap.set(taskId, Math.round(es));
    efMap.set(taskId, Math.round(es + dur));
  }

  const makespan = tasks.length > 0 ? Math.max(0, ...Array.from(efMap.values())) : 0;

  // Backward Pass: LF & LS
  const lfMap = new Map<string, number>();
  const lsMap = new Map<string, number>();

  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const taskId = topoOrder[i];
    const t = taskMap.get(taskId)!;
    const succs = successors.get(taskId) || [];
    let lf = makespan;
    if (succs.length > 0) {
      lf = Math.min(...succs.map(s => lsMap.get(s) ?? makespan));
    }
    const dur = Math.max(0, Math.round(t.durationSeconds || 0));
    const ls = lf - dur;
    lfMap.set(taskId, Math.round(lf));
    lsMap.set(taskId, Math.round(ls));
  }

  // Total Float: TF = LS - ES
  const tfMap = new Map<string, number>();
  for (const t of tasks) {
    const es = esMap.get(t.id) ?? 0;
    const ls = lsMap.get(t.id) ?? 0;
    tfMap.set(t.id, Math.max(0, Math.round(ls - es)));
  }

  return {
    tasks,
    taskMap,
    successors,
    predecessors,
    topoOrder,
    hasCycle,
    esMap,
    efMap,
    lsMap,
    lfMap,
    tfMap,
    makespan,
  };
}

/**
 * Checks if interval [s1, f1] overlaps with [s2, f2].
 */
function intervalsOverlap(s1: number, f1: number, s2: number, f2: number): boolean {
  return Math.max(s1, s2) < Math.min(f1, f2);
}

/**
 * Schedules a collection of cooking tasks targeting a specific meal serving time.
 * Calculates earliest/latest times, critical path, float slack, resource conflicts,
 * and resolves eligible conflicts by shifting non-critical tasks within float.
 */
export function scheduleForTarget(
  tasks: TaskNode[],
  targetServingAt: Date,
  config: KitchenConfig
): ScheduleResult {
  const warnings: string[] = [];

  // Edge case: Empty task list
  if (!tasks || tasks.length === 0) {
    const isoTarget = targetServingAt.toISOString();
    return {
      scheduledTasks: [],
      criticalPath: [],
      expectedLandingTime: isoTarget,
      landingDriftSeconds: 0,
      feasibilityStatus: 'FEASIBLE',
      resourceConflicts: [],
      attentionConflicts: [],
      ovenFeasibility: { feasible: true, conflicts: [] },
      warnings: [],
      planStartTime: isoTarget,
      scheduleRevision: 1,
    };
  }

  const cpm = computeCPMGraph(tasks);
  if (cpm.hasCycle) {
    warnings.push('Task dependency graph contains circular dependencies; schedule computed as best effort.');
  }

  const makespanSeconds = cpm.makespan;
  const targetEpochMs = targetServingAt.getTime();
  const planStartEpochMs = targetEpochMs - makespanSeconds * 1000;
  const planStartTime = new Date(planStartEpochMs).toISOString();

  // Initial schedule assignments
  const schedMap = new Map<
    string,
    {
      scheduledStart: number;
      scheduledFinish: number;
      assignedResource: ResourceType;
      shiftReason?: string;
    }
  >();

  for (const t of tasks) {
    const ls = cpm.lsMap.get(t.id) ?? (cpm.esMap.get(t.id) ?? 0);
    const dur = Math.max(0, Math.round(t.durationSeconds || 0));
    schedMap.set(t.id, {
      scheduledStart: ls,
      scheduledFinish: ls + dur,
      assignedResource: t.resource,
    });
  }

  // --- Resource Conflict Detection and Resolution ---
  const resourceConflicts: ResourceConflict[] = [];
  const attentionConflicts: AttentionConflict[] = [];
  const ovenConflicts: { taskIds: string[]; temperatures: number[]; reason: string }[] = [];

  // Helper to get burner index (1..4) or 0
  const getBurnerIndex = (r: ResourceType): number => {
    if (r === 'BURNER_1') return 1;
    if (r === 'BURNER_2') return 2;
    if (r === 'BURNER_3') return 3;
    if (r === 'BURNER_4') return 4;
    return 0;
  };

  // Helper to get available burner not in use during interval
  const findFreeBurner = (
    excludeTaskId: string,
    start: number,
    finish: number,
    maxBurners: number
  ): ResourceType | null => {
    const allBurners: ResourceType[] = ['BURNER_1', 'BURNER_2', 'BURNER_3', 'BURNER_4'].slice(
      0,
      maxBurners
    ) as ResourceType[];

    for (const b of allBurners) {
      let isBusy = false;
      for (const [otherId, s] of schedMap.entries()) {
        if (otherId === excludeTaskId) continue;
        if (s.assignedResource === b && intervalsOverlap(start, finish, s.scheduledStart, s.scheduledFinish)) {
          isBusy = true;
          break;
        }
      }
      if (!isBusy) return b;
    }
    return null;
  };

  // Helper to shift a task and propagate downstream without exceeding makespan
  const tryShiftTaskWithinFloat = (taskId: string, targetStart: number): boolean => {
    const cur = schedMap.get(taskId)!;
    const dur = cur.scheduledFinish - cur.scheduledStart;
    const shift = targetStart - cur.scheduledStart;
    if (shift <= 0) return true;

    // Check if targetStart exceeds latest start
    const ls = cpm.lsMap.get(taskId) ?? cpm.makespan;
    if (targetStart > ls) {
      return false; // Exceeds individual task float
    }

    // Speculatively check downstream shift feasibility
    const proposedStarts = new Map<string, number>();
    proposedStarts.set(taskId, targetStart);

    const queue = [taskId];
    while (queue.length > 0) {
      const u = queue.shift()!;
      const uStart = proposedStarts.get(u) ?? schedMap.get(u)!.scheduledStart;
      const uDur = schedMap.get(u)!.scheduledFinish - schedMap.get(u)!.scheduledStart;
      const uFinish = uStart + uDur;

      for (const succ of cpm.successors.get(u) || []) {
        const succCur = schedMap.get(succ)!;
        const requiredSuccStart = Math.max(succCur.scheduledStart, uFinish);
        const succLs = cpm.lsMap.get(succ) ?? cpm.makespan;
        if (requiredSuccStart > succLs) {
          return false; // Pushes downstream task past its float
        }
        if (requiredSuccStart > (proposedStarts.get(succ) ?? succCur.scheduledStart)) {
          proposedStarts.set(succ, requiredSuccStart);
          queue.push(succ);
        }
      }
    }

    // Apply valid shift
    for (const [id, newStart] of proposedStarts.entries()) {
      const s = schedMap.get(id)!;
      const d = s.scheduledFinish - s.scheduledStart;
      s.scheduledStart = newStart;
      s.scheduledFinish = newStart + d;
      s.shiftReason = s.shiftReason || `Shifted to resolve conflict with predecessor/parallel resource`;
    }
    return true;
  };

  // 1. Resolve Specific Burner Conflicts
  const burnerTasks = tasks.filter(t => getBurnerIndex(t.resource) > 0);
  for (let i = 0; i < burnerTasks.length; i++) {
    for (let j = i + 1; j < burnerTasks.length; j++) {
      const t1 = burnerTasks[i];
      const t2 = burnerTasks[j];
      const s1 = schedMap.get(t1.id)!;
      const s2 = schedMap.get(t2.id)!;

      if (
        s1.assignedResource === s2.assignedResource &&
        intervalsOverlap(s1.scheduledStart, s1.scheduledFinish, s2.scheduledStart, s2.scheduledFinish)
      ) {
        const overlapStart = Math.max(s1.scheduledStart, s2.scheduledStart);
        const overlapEnd = Math.min(s1.scheduledFinish, s2.scheduledFinish);

        // Try burner reassignment for non-started task first
        let resolved = false;
        let resolution: string | undefined;

        const candidate = t2.status === 'PENDING' ? t2 : t1.status === 'PENDING' ? t1 : t2;
        const candSched = schedMap.get(candidate.id)!;
        const freeBurner = findFreeBurner(
          candidate.id,
          candSched.scheduledStart,
          candSched.scheduledFinish,
          config.burnerCount
        );

        if (freeBurner) {
          candSched.assignedResource = freeBurner;
          candSched.shiftReason = `Reassigned from ${t1.resource} to ${freeBurner} to avoid conflict`;
          resolved = true;
          resolution = `Reassigned task ${candidate.id} to ${freeBurner}`;
        } else {
          // If no free burner, try shifting the task with more float
          const tf1 = cpm.tfMap.get(t1.id) ?? 0;
          const tf2 = cpm.tfMap.get(t2.id) ?? 0;
          const shiftTarget = tf2 >= tf1 ? t2 : t1;
          const other = shiftTarget === t2 ? t1 : t2;
          const otherSched = schedMap.get(other.id)!;

          if (tryShiftTaskWithinFloat(shiftTarget.id, otherSched.scheduledFinish)) {
            resolved = true;
            resolution = `Shifted task ${shiftTarget.id} to start after ${other.id} within available slack`;
          }
        }

        resourceConflicts.push({
          resource: s1.assignedResource,
          taskIds: [t1.id, t2.id],
          overlapStartSeconds: overlapStart,
          overlapEndSeconds: overlapEnd,
          resolved,
          resolution,
        });
      }
    }
  }

  // 2. Oven Feasibility & Temperature Conflicts
  const ovenTasks = tasks.filter(t => t.resource === 'OVEN');
  for (let i = 0; i < ovenTasks.length; i++) {
    for (let j = i + 1; j < ovenTasks.length; j++) {
      const t1 = ovenTasks[i];
      const t2 = ovenTasks[j];
      const s1 = schedMap.get(t1.id)!;
      const s2 = schedMap.get(t2.id)!;

      if (intervalsOverlap(s1.scheduledStart, s1.scheduledFinish, s2.scheduledStart, s2.scheduledFinish)) {
        const overlapStart = Math.max(s1.scheduledStart, s2.scheduledStart);
        const overlapEnd = Math.min(s1.scheduledFinish, s2.scheduledFinish);

        const temp1 = t1.temperatureF;
        const temp2 = t2.temperatureF;

        if (temp1 !== undefined && temp2 !== undefined) {
          const diff = Math.abs(temp1 - temp2);
          if (diff > config.ovenTempToleranceF) {
            // Temperature conflict: try to separate if one has float
            let resolved = false;
            let resolution: string | undefined;

            const tf1 = cpm.tfMap.get(t1.id) ?? 0;
            const tf2 = cpm.tfMap.get(t2.id) ?? 0;
            const shiftTarget = tf2 >= tf1 ? t2 : t1;
            const fixedTarget = shiftTarget === t2 ? t1 : t2;
            const fixedSched = schedMap.get(fixedTarget.id)!;

            if (tryShiftTaskWithinFloat(shiftTarget.id, fixedSched.scheduledFinish)) {
              resolved = true;
              resolution = `Shifted oven task ${shiftTarget.id} after ${fixedTarget.id} to satisfy temperature tolerance`;
            } else {
              ovenConflicts.push({
                taskIds: [t1.id, t2.id],
                temperatures: [temp1, temp2],
                reason: `Oven temperature mismatch: ${t1.label} (${temp1}°F) vs ${t2.label} (${temp2}°F) exceeds tolerance ${config.ovenTempToleranceF}°F`,
              });
            }

            resourceConflicts.push({
              resource: 'OVEN',
              taskIds: [t1.id, t2.id],
              overlapStartSeconds: overlapStart,
              overlapEndSeconds: overlapEnd,
              resolved,
              resolution,
            });
          }
        }
      }
    }
  }

  // 3. Active Cook Attention Conflicts
  const activeTasks = tasks.filter(t => t.isActive);
  for (let i = 0; i < activeTasks.length; i++) {
    for (let j = i + 1; j < activeTasks.length; j++) {
      const t1 = activeTasks[i];
      const t2 = activeTasks[j];
      const s1 = schedMap.get(t1.id)!;
      const s2 = schedMap.get(t2.id)!;

      if (intervalsOverlap(s1.scheduledStart, s1.scheduledFinish, s2.scheduledStart, s2.scheduledFinish)) {
        const overlapStart = Math.max(s1.scheduledStart, s2.scheduledStart);
        const overlapEnd = Math.min(s1.scheduledFinish, s2.scheduledFinish);

        let resolved = false;
        // Try shifting task with float if exceeding maxActiveAttention
        if (config.maxActiveAttention <= 1) {
          const tf1 = cpm.tfMap.get(t1.id) ?? 0;
          const tf2 = cpm.tfMap.get(t2.id) ?? 0;
          const shiftTarget = tf2 >= tf1 ? t2 : t1;
          const other = shiftTarget === t2 ? t1 : t2;
          const otherSched = schedMap.get(other.id)!;

          if (tryShiftTaskWithinFloat(shiftTarget.id, otherSched.scheduledFinish)) {
            resolved = true;
          }
        }

        attentionConflicts.push({
          taskIds: [t1.id, t2.id],
          overlapStartSeconds: overlapStart,
          overlapEndSeconds: overlapEnd,
          resolved,
        });
      }
    }
  }

  // Determine final makespan and landing drift
  let finalMakespan = makespanSeconds;
  for (const s of schedMap.values()) {
    if (s.scheduledFinish > finalMakespan) {
      finalMakespan = s.scheduledFinish;
    }
  }

  const landingDriftSeconds = Math.max(0, finalMakespan - makespanSeconds);
  const expectedLandingTime = new Date(planStartEpochMs + finalMakespan * 1000).toISOString();

  // Critical path is set of tasks with 0 float in initial CPM
  const criticalPath = tasks
    .filter(t => (cpm.tfMap.get(t.id) ?? 0) === 0)
    .map(t => t.id);

  // Compute final scheduled tasks
  const scheduledTasks: ScheduledTask[] = tasks.map(t => {
    const s = schedMap.get(t.id)!;
    const es = cpm.esMap.get(t.id) ?? 0;
    const ef = cpm.efMap.get(t.id) ?? es + t.durationSeconds;
    const ls = cpm.lsMap.get(t.id) ?? es;
    const lf = cpm.lfMap.get(t.id) ?? ef;
    const totalFloat = cpm.tfMap.get(t.id) ?? 0;
    const isCritical = totalFloat === 0;

    return {
      taskId: t.id,
      dishId: t.dishId,
      label: t.label,
      earliestStart: es,
      earliestFinish: ef,
      latestStart: ls,
      latestFinish: lf,
      totalFloat,
      scheduledStart: s.scheduledStart,
      scheduledFinish: s.scheduledFinish,
      assignedResource: s.assignedResource,
      isCriticalPath: isCritical,
      feasible: true,
      scheduleRevision: 1,
      shiftReason: s.shiftReason,
    };
  });

  // Feasibility status determination
  let feasibilityStatus: FeasibilityStatus = 'FEASIBLE';
  if (cpm.hasCycle || ovenConflicts.length > 0) {
    feasibilityStatus = 'INFEASIBLE';
  } else if (landingDriftSeconds > 0) {
    feasibilityStatus = 'FEASIBLE_LATE';
  }

  // Warning check for plan start in past
  if (planStartEpochMs < Date.now()) {
    warnings.push('Plan start time is prior to current time; cooking should start immediately.');
  }

  return {
    scheduledTasks,
    criticalPath,
    expectedLandingTime,
    landingDriftSeconds,
    feasibilityStatus,
    resourceConflicts,
    attentionConflicts,
    ovenFeasibility: {
      feasible: ovenConflicts.length === 0,
      conflicts: ovenConflicts,
    },
    warnings,
    planStartTime,
    scheduleRevision: 1,
  };
}

/**
 * Handles cooking delays by recalculating schedule, absorbing delays using float,
 * compressing eligible rest windows, shifting downstream tasks, and generating a ReplanProposal.
 * Does NOT mutate the input CookingSession.
 */
export function replanAfterDelay(
  session: CookingSession,
  taskId: string,
  delaySeconds: number,
  config: KitchenConfig
): ReplanProposal {
  const proposalId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const warnings: string[] = [];
  const changes: ProposedChange[] = [];

  // Snapshot session tasks and schedule
  const clonedTasks: TaskNode[] = session.tasks.map(t => ({
    ...t,
    predecessors: [...(t.predecessors || [])],
    constraints: t.constraints ? { ...t.constraints } : undefined,
  }));

  const prevScheduleMap = new Map<string, ScheduledTask>();
  for (const st of session.currentSchedule) {
    prevScheduleMap.set(st.taskId, { ...st });
  }

  const affectedTask = clonedTasks.find(t => t.id === taskId);
  if (!affectedTask) {
    return {
      proposalId,
      sessionId: session.sessionId,
      baseRevision: session.scheduleRevision,
      status: 'PENDING',
      triggerTaskId: taskId,
      delaySeconds,
      proposedSchedule: session.currentSchedule,
      changes: [],
      projectedLandingTime: session.targetServingAt,
      landingDriftSeconds: 0,
      explanation: `Task "${taskId}" not found in session; no schedule adjustment possible.`,
      feasibilityStatus: 'INFEASIBLE',
      warnings: [`Task "${taskId}" was not found in active session tasks`],
      createdAt,
    };
  }

  // 1. Extend affected task duration
  const prevDuration = affectedTask.durationSeconds;
  const newDuration = prevDuration + Math.max(0, delaySeconds);
  affectedTask.durationSeconds = newDuration;

  const prevSched = prevScheduleMap.get(taskId);
  const prevStart = prevSched?.scheduledStart ?? 0;

  changes.push({
    taskId,
    changeType: 'DURATION_CHANGED',
    previousStartSeconds: prevStart,
    proposedStartSeconds: prevStart,
    previousDurationSeconds: prevDuration,
    proposedDurationSeconds: newDuration,
    secondsRecovered: 0,
    reason: `Delay of ${Math.round(delaySeconds / 60)} min (${delaySeconds}s) reported on task "${affectedTask.label}"`,
    constraintsChecked: ['duration_bounds'],
    requiresConfirmation: false,
  });

  // 2. Build graph to identify downstream successors
  const taskMap = new Map<string, TaskNode>(clonedTasks.map(t => [t.id, t]));
  const successors = new Map<string, string[]>();
  for (const t of clonedTasks) {
    successors.set(t.id, []);
  }
  for (const t of clonedTasks) {
    for (const p of t.predecessors || []) {
      successors.get(p)?.push(t.id);
    }
  }

  // Identify all downstream tasks transitively
  const downstreamTaskIds = new Set<string>();
  const queue = [...(successors.get(taskId) || [])];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (!downstreamTaskIds.has(cur)) {
      downstreamTaskIds.add(cur);
      for (const succ of successors.get(cur) || []) {
        queue.push(succ);
      }
    }
  }

  // 3. Check for rest window compression on downstream tasks
  let remainingDelayToRecover = delaySeconds;
  let totalRecoveredSeconds = 0;

  for (const downId of downstreamTaskIds) {
    if (remainingDelayToRecover <= 0) break;
    const task = taskMap.get(downId)!;

    const canCompress =
      task.constraints?.canCompressRest === true ||
      (task.stepType === 'rest' && task.constraints?.minRestSeconds !== undefined);

    if (canCompress && task.durationSeconds > 0) {
      const origDur = task.durationSeconds;
      const minAllowed =
        task.constraints?.compressedMinSeconds ??
        task.constraints?.minRestSeconds ??
        Math.max(300, Math.round(origDur * 0.67));

      const maxCompressible = Math.max(0, origDur - minAllowed);
      if (maxCompressible > 0) {
        const recoverable = Math.min(remainingDelayToRecover, maxCompressible);
        const proposedRestDuration = origDur - recoverable;

        task.durationSeconds = proposedRestDuration;
        remainingDelayToRecover -= recoverable;
        totalRecoveredSeconds += recoverable;

        const pSched = prevScheduleMap.get(task.id);
        changes.push({
          taskId: task.id,
          changeType: 'DURATION_CHANGED',
          previousStartSeconds: pSched?.scheduledStart ?? 0,
          proposedStartSeconds: pSched?.scheduledStart ?? 0,
          previousDurationSeconds: origDur,
          proposedDurationSeconds: proposedRestDuration,
          secondsRecovered: recoverable,
          reason: `Compressed rest window by ${Math.round(recoverable / 60)} min (from ${Math.round(origDur / 60)}m to ${Math.round(proposedRestDuration / 60)}m) to recover delay`,
          constraintsChecked: ['minRestSeconds', 'canCompressRest'],
          requiresConfirmation: true,
          safetyOrQualityNotes: `Maintains minimum rest duration of ${Math.round(minAllowed / 60)}m for temperature stabilization and juiciness`,
        });
      }
    }
  }

  // 4. Re-run scheduling with adjusted durations
  // Parse target serving date
  const targetDate = new Date(session.targetServingAt);
  const rawScheduleResult = scheduleForTarget(clonedTasks, targetDate, config);

  // 5. Compare proposed schedule vs previous schedule to identify shifts & holding
  const proposedScheduledTasks: ScheduledTask[] = rawScheduleResult.scheduledTasks.map(st => ({
    ...st,
    scheduleRevision: session.scheduleRevision + 1,
  }));

  for (const newSched of proposedScheduledTasks) {
    const oldSched = prevScheduleMap.get(newSched.taskId);
    if (!oldSched) continue;

    const startShift = newSched.scheduledStart - oldSched.scheduledStart;
    const durChange =
      newSched.scheduledFinish - newSched.scheduledStart - (oldSched.scheduledFinish - oldSched.scheduledStart);

    // If start time shifted (and not already recorded as duration change on trigger)
    if (Math.abs(startShift) > 0 && newSched.taskId !== taskId) {
      const isDownstream = downstreamTaskIds.has(newSched.taskId);
      const isCrossDish = newSched.dishId !== affectedTask.dishId;

      let reason = `Shifted by ${Math.round(startShift / 60)} min to accommodate upstream delay`;
      let changeType: ProposedChange['changeType'] = 'SHIFTED';

      if (isCrossDish) {
        reason = `Shifted parallel dish by ${Math.round(startShift / 60)} min to synchronize hot landing time`;
      } else if (!isDownstream) {
        reason = `Adjusted start time to balance attention and resource occupancy`;
      }

      changes.push({
        taskId: newSched.taskId,
        changeType,
        previousStartSeconds: oldSched.scheduledStart,
        proposedStartSeconds: newSched.scheduledStart,
        previousDurationSeconds: oldSched.scheduledFinish - oldSched.scheduledStart,
        proposedDurationSeconds: newSched.scheduledFinish - newSched.scheduledStart,
        secondsRecovered: 0,
        reason,
        constraintsChecked: ['predecessor_dependencies', 'resource_conflicts'],
        requiresConfirmation: false,
      });
    }

    if (newSched.assignedResource !== oldSched.assignedResource) {
      changes.push({
        taskId: newSched.taskId,
        changeType: 'RESOURCE_CHANGED',
        previousStartSeconds: oldSched.scheduledStart,
        proposedStartSeconds: newSched.scheduledStart,
        previousDurationSeconds: oldSched.scheduledFinish - oldSched.scheduledStart,
        proposedDurationSeconds: newSched.scheduledFinish - newSched.scheduledStart,
        secondsRecovered: 0,
        reason: `Reassigned from ${oldSched.assignedResource} to ${newSched.assignedResource} to prevent resource contention`,
        constraintsChecked: ['appliance_compatibility'],
        requiresConfirmation: false,
      });
    }
  }

  // 6. Calculate landing time and net drift
  const prevMaxFinish = Math.max(0, ...session.currentSchedule.map(s => s.scheduledFinish));
  const newMaxFinish = Math.max(0, ...proposedScheduledTasks.map(s => s.scheduledFinish));
  const landingDriftSeconds = Math.max(0, newMaxFinish - prevMaxFinish);

  // Compute projected landing time
  const planStartEpochMs = session.planStartTime
    ? new Date(session.planStartTime).getTime()
    : targetDate.getTime() - prevMaxFinish * 1000;

  const projectedLandingEpochMs = planStartEpochMs + newMaxFinish * 1000;
  const projectedLandingTime = new Date(projectedLandingEpochMs).toISOString();

  // Feasibility status
  let feasibilityStatus: FeasibilityStatus = 'FEASIBLE';
  if (rawScheduleResult.feasibilityStatus === 'INFEASIBLE') {
    feasibilityStatus = 'INFEASIBLE';
  } else if (landingDriftSeconds > 0) {
    feasibilityStatus = 'FEASIBLE_LATE';
  }

  // Generate clear human-readable explanation
  const delayMinutes = Math.round(delaySeconds / 60);
  const recoveredMinutes = Math.round(totalRecoveredSeconds / 60);
  const driftMinutes = Math.round(landingDriftSeconds / 60);

  const explanationParts: string[] = [];
  explanationParts.push(`Task "${affectedTask.label}" encountered a ${delayMinutes}-minute delay.`);

  if (recoveredMinutes > 0) {
    explanationParts.push(`Recovered ${recoveredMinutes} minutes by compressing safe resting window.`);
  }

  if (driftMinutes === 0) {
    explanationParts.push('All delays fully absorbed by schedule slack and resting compression; landing time preserved.');
  } else {
    explanationParts.push(`Projected meal landing time shifted by +${driftMinutes} minutes.`);
  }

  const explanation = explanationParts.join(' ');

  return {
    proposalId,
    sessionId: session.sessionId,
    baseRevision: session.scheduleRevision,
    status: 'PENDING',
    triggerTaskId: taskId,
    delaySeconds,
    proposedSchedule: proposedScheduledTasks,
    changes,
    projectedLandingTime,
    landingDriftSeconds,
    explanation,
    feasibilityStatus,
    warnings: [...warnings, ...rawScheduleResult.warnings],
    createdAt,
  };
}
