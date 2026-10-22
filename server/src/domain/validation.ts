import type { TaskNode, ResourceType } from './types.ts';

export type ValidationErrorType =
  | 'DUPLICATE_TASK_ID'
  | 'SELF_DEPENDENCY'
  | 'UNKNOWN_PREDECESSOR'
  | 'NEGATIVE_DURATION'
  | 'INVALID_DURATION_BOUNDS'
  | 'INVALID_RESOURCE'
  | 'INVALID_TEMPERATURE'
  | 'INVALID_STEP_TYPE'
  | 'CYCLE_DETECTED'
  | 'UNREACHABLE_TASK';

export interface ValidationError {
  type: ValidationErrorType | string;
  taskId?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const VALID_RESOURCES: Set<ResourceType> = new Set([
  'OVEN',
  'BURNER_1',
  'BURNER_2',
  'BURNER_3',
  'BURNER_4',
  'NONE',
]);

const VALID_STEP_TYPES = new Set([
  'prep',
  'active-hands',
  'thermal',
  'rest',
  'stovetop',
  'holding',
]);

/**
 * Validates the combined task graph for consistency, valid durations,
 * resource definitions, temperature specs, and acyclic topology using Kahn's algorithm.
 */
export function validateTaskGraph(tasks: TaskNode[]): ValidationResult {
  const errors: ValidationError[] = [];

  if (!tasks || tasks.length === 0) {
    return { valid: true, errors: [] };
  }

  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();

  // 1. Check duplicate task IDs
  for (const task of tasks) {
    if (!task.id || typeof task.id !== 'string') {
      errors.push({
        type: 'DUPLICATE_TASK_ID',
        message: 'Task is missing a valid string ID',
      });
      continue;
    }

    if (seenIds.has(task.id)) {
      duplicateIds.add(task.id);
      errors.push({
        type: 'DUPLICATE_TASK_ID',
        taskId: task.id,
        message: `Duplicate task ID detected: "${task.id}"`,
      });
    } else {
      seenIds.add(task.id);
    }
  }

  const allTaskIds = seenIds;

  // 2. Validate individual task properties
  for (const task of tasks) {
    // Self-dependency
    if (task.predecessors && task.predecessors.includes(task.id)) {
      errors.push({
        type: 'SELF_DEPENDENCY',
        taskId: task.id,
        message: `Task "${task.id}" cannot depend on itself`,
      });
    }

    // Unknown predecessor references
    if (task.predecessors) {
      for (const predId of task.predecessors) {
        if (!allTaskIds.has(predId)) {
          errors.push({
            type: 'UNKNOWN_PREDECESSOR',
            taskId: task.id,
            message: `Task "${task.id}" references unknown predecessor "${predId}"`,
          });
        }
      }
    }

    // Non-negative durations
    if (typeof task.durationSeconds !== 'number' || isNaN(task.durationSeconds) || task.durationSeconds < 0) {
      errors.push({
        type: 'NEGATIVE_DURATION',
        taskId: task.id,
        message: `Task "${task.id}" has invalid or negative duration: ${task.durationSeconds}s`,
      });
    }

    // Min/Max duration bounds
    if (task.minDurationSeconds !== undefined) {
      if (typeof task.minDurationSeconds !== 'number' || isNaN(task.minDurationSeconds) || task.minDurationSeconds < 0) {
        errors.push({
          type: 'INVALID_DURATION_BOUNDS',
          taskId: task.id,
          message: `Task "${task.id}" has negative or invalid minDurationSeconds: ${task.minDurationSeconds}s`,
        });
      }
    }

    if (task.maxDurationSeconds !== undefined) {
      if (typeof task.maxDurationSeconds !== 'number' || isNaN(task.maxDurationSeconds) || task.maxDurationSeconds < 0) {
        errors.push({
          type: 'INVALID_DURATION_BOUNDS',
          taskId: task.id,
          message: `Task "${task.id}" has negative or invalid maxDurationSeconds: ${task.maxDurationSeconds}s`,
        });
      }
    }

    if (
      task.minDurationSeconds !== undefined &&
      task.maxDurationSeconds !== undefined &&
      task.minDurationSeconds > task.maxDurationSeconds
    ) {
      errors.push({
        type: 'INVALID_DURATION_BOUNDS',
        taskId: task.id,
        message: `Task "${task.id}" minDurationSeconds (${task.minDurationSeconds}s) exceeds maxDurationSeconds (${task.maxDurationSeconds}s)`,
      });
    }

    // Resource validation
    if (!VALID_RESOURCES.has(task.resource)) {
      errors.push({
        type: 'INVALID_RESOURCE',
        taskId: task.id,
        message: `Task "${task.id}" has invalid resource "${task.resource}". Allowed: ${Array.from(VALID_RESOURCES).join(', ')}`,
      });
    }

    // Temperature validation
    if (task.temperatureF !== undefined) {
      if (typeof task.temperatureF !== 'number' || isNaN(task.temperatureF) || task.temperatureF <= 0) {
        errors.push({
          type: 'INVALID_TEMPERATURE',
          taskId: task.id,
          message: `Task "${task.id}" has invalid temperatureF: ${task.temperatureF}°F`,
        });
      }
    }

    // Step type validation
    if (!VALID_STEP_TYPES.has(task.stepType)) {
      errors.push({
        type: 'INVALID_STEP_TYPE',
        taskId: task.id,
        message: `Task "${task.id}" has invalid stepType "${task.stepType}"`,
      });
    }
  }

  // 3. Cycle detection and reachability using Kahn's algorithm
  // Only proceed if unique task IDs are intact
  const uniqueTasks = tasks.filter((t, idx) => tasks.findIndex(other => other.id === t.id) === idx);
  const inDegree = new Map<string, number>();
  const successors = new Map<string, string[]>();

  for (const t of uniqueTasks) {
    inDegree.set(t.id, 0);
    successors.set(t.id, []);
  }

  for (const t of uniqueTasks) {
    if (!t.predecessors) continue;
    for (const predId of t.predecessors) {
      if (allTaskIds.has(predId) && predId !== t.id) {
        successors.get(predId)?.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
      }
    }
  }

  // Kahn's queue: tasks with inDegree === 0
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  const visited = new Set<string>();
  while (queue.length > 0) {
    const currId = queue.shift()!;
    visited.add(currId);

    const succList = successors.get(currId) || [];
    for (const succId of succList) {
      const currentDeg = inDegree.get(succId) ?? 0;
      const nextDeg = currentDeg - 1;
      inDegree.set(succId, nextDeg);
      if (nextDeg === 0) {
        queue.push(succId);
      }
    }
  }

  // Any task that was not visited is part of a cycle or blocked by a cycle
  if (visited.size < uniqueTasks.length) {
    const unvisitedTasks = uniqueTasks.filter(t => !visited.has(t.id));
    for (const unvisited of unvisitedTasks) {
      errors.push({
        type: 'CYCLE_DETECTED',
        taskId: unvisited.id,
        message: `Cycle detected in task graph involving task "${unvisited.id}" (${unvisited.label})`,
      });
      errors.push({
        type: 'UNREACHABLE_TASK',
        taskId: unvisited.id,
        message: `Task "${unvisited.id}" is unreachable or blocked due to cyclic dependencies`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
