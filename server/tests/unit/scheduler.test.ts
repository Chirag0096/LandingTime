import { describe, it, expect } from 'vitest';
import type { TaskNode, KitchenConfig } from '../../src/domain/types.ts';
import { DEFAULT_KITCHEN_CONFIG } from '../../src/domain/types.ts';
import { validateTaskGraph } from '../../src/domain/validation.ts';
import { scheduleForTarget, replanAfterDelay } from '../../src/scheduler/engine.ts';
import { buildCombinedTaskGraph, RECIPE_CATALOG } from '../../src/recipes/catalog.ts';

describe('CPM Scheduling Engine & Graph Validation', () => {
  const targetDate = new Date('2026-11-14T19:30:00Z');

  it('validates a valid DAG and detects no errors', () => {
    const tasks: TaskNode[] = [
      {
        id: 't1',
        dishId: 'd1',
        label: 'Chop vegetables',
        instructions: 'Chop finely',
        durationSeconds: 300,
        isActive: true,
        resource: 'NONE',
        predecessors: [],
        status: 'PENDING',
        stepType: 'prep',
      },
      {
        id: 't2',
        dishId: 'd1',
        label: 'Sauté vegetables',
        instructions: 'Sauté in pan',
        durationSeconds: 600,
        isActive: true,
        resource: 'BURNER_1',
        predecessors: ['t1'],
        status: 'PENDING',
        stepType: 'stovetop',
      },
    ];

    const validation = validateTaskGraph(tasks);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('detects cycles in task graphs using Kahn algorithm', () => {
    const cyclicTasks: TaskNode[] = [
      {
        id: 'a',
        dishId: 'd1',
        label: 'Task A',
        instructions: '',
        durationSeconds: 100,
        isActive: false,
        resource: 'NONE',
        predecessors: ['b'],
        status: 'PENDING',
        stepType: 'prep',
      },
      {
        id: 'b',
        dishId: 'd1',
        label: 'Task B',
        instructions: '',
        durationSeconds: 100,
        isActive: false,
        resource: 'NONE',
        predecessors: ['a'],
        status: 'PENDING',
        stepType: 'prep',
      },
    ];

    const validation = validateTaskGraph(cyclicTasks);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.type === 'CYCLE_DETECTED')).toBe(true);
  });

  it('detects unknown predecessor references', () => {
    const brokenTasks: TaskNode[] = [
      {
        id: 't1',
        dishId: 'd1',
        label: 'Task 1',
        instructions: '',
        durationSeconds: 100,
        isActive: false,
        resource: 'NONE',
        predecessors: ['ghost_task'],
        status: 'PENDING',
        stepType: 'prep',
      },
    ];

    const validation = validateTaskGraph(brokenTasks);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.type === 'UNKNOWN_PREDECESSOR')).toBe(true);
  });

  it('detects duplicate task IDs and negative durations', () => {
    const invalidTasks: TaskNode[] = [
      {
        id: 'dup',
        dishId: 'd1',
        label: 'Task 1',
        instructions: '',
        durationSeconds: -50,
        isActive: false,
        resource: 'NONE',
        predecessors: [],
        status: 'PENDING',
        stepType: 'prep',
      },
      {
        id: 'dup',
        dishId: 'd1',
        label: 'Task 2',
        instructions: '',
        durationSeconds: 100,
        isActive: false,
        resource: 'NONE',
        predecessors: [],
        status: 'PENDING',
        stepType: 'prep',
      },
    ];

    const validation = validateTaskGraph(invalidTasks);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.type === 'DUPLICATE_TASK_ID')).toBe(true);
    expect(validation.errors.some((e) => e.type === 'NEGATIVE_DURATION')).toBe(true);
  });

  it('schedules a single task and computes correct ES, EF, LS, LF, and float', () => {
    const tasks: TaskNode[] = [
      {
        id: 'single',
        dishId: 'd1',
        label: 'Quick prep',
        instructions: 'Prep item',
        durationSeconds: 600,
        isActive: true,
        resource: 'NONE',
        predecessors: [],
        status: 'PENDING',
        stepType: 'prep',
      },
    ];

    const res = scheduleForTarget(tasks, targetDate, DEFAULT_KITCHEN_CONFIG);
    expect(res.scheduledTasks).toHaveLength(1);
    expect(res.criticalPath).toContain('single');
    expect(res.scheduledTasks[0].totalFloat).toBe(0);
    expect(res.scheduledTasks[0].scheduledStart).toBe(0);
    expect(res.scheduledTasks[0].scheduledFinish).toBe(600);
  });

  it('correctly models cross-dish dependencies (gravy depends on chicken rest drippings)', () => {
    const allDishIds = ['recipe-chicken', 'recipe-potatoes', 'recipe-asparagus-gravy'];
    const combinedTasks = buildCombinedTaskGraph(allDishIds);

    const gravyTask = combinedTasks.find((t) => t.id === 'asp-gravy');
    expect(gravyTask).toBeDefined();
    // Predecessors must contain chicken rest and asparagus saute
    expect(gravyTask?.predecessors).toContain('chk-rest');
    expect(gravyTask?.predecessors).toContain('asp-saute');

    const res = scheduleForTarget(combinedTasks, targetDate, DEFAULT_KITCHEN_CONFIG);
    const chickenRestSched = res.scheduledTasks.find((t) => t.taskId === 'chk-rest');
    const gravySched = res.scheduledTasks.find((t) => t.taskId === 'asp-gravy');

    expect(chickenRestSched).toBeDefined();
    expect(gravySched).toBeDefined();
    // Gravy scheduled start MUST be >= chicken rest finish
    expect(gravySched!.scheduledStart).toBeGreaterThanOrEqual(chickenRestSched!.scheduledFinish);
  });

  it('detects compatible oven tasks sharing 425°F (Rule of 25)', () => {
    const tasks: TaskNode[] = [
      {
        id: 'chk-bake',
        dishId: 'd1',
        label: 'Chicken roast',
        instructions: 'Roast at 425F',
        durationSeconds: 2700,
        isActive: false,
        resource: 'OVEN',
        temperatureF: 425,
        predecessors: [],
        status: 'PENDING',
        stepType: 'thermal',
      },
      {
        id: 'pot-bake',
        dishId: 'd2',
        label: 'Potato bake',
        instructions: 'Bake at 425F',
        durationSeconds: 1500,
        isActive: false,
        resource: 'OVEN',
        temperatureF: 425,
        predecessors: [],
        status: 'PENDING',
        stepType: 'thermal',
      },
    ];

    const res = scheduleForTarget(tasks, targetDate, DEFAULT_KITCHEN_CONFIG);
    expect(res.ovenFeasibility.feasible).toBe(true);
    expect(res.ovenFeasibility.conflicts).toHaveLength(0);
  });

  it('detects oven temperature conflict when tasks differ by > 25°F', () => {
    const tasks: TaskNode[] = [
      {
        id: 't-high',
        dishId: 'd1',
        label: 'High heat roast',
        instructions: '',
        durationSeconds: 1800,
        isActive: false,
        resource: 'OVEN',
        temperatureF: 450,
        predecessors: [],
        status: 'PENDING',
        stepType: 'thermal',
      },
      {
        id: 't-low',
        dishId: 'd2',
        label: 'Low heat braise',
        instructions: '',
        durationSeconds: 1800,
        isActive: false,
        resource: 'OVEN',
        temperatureF: 325,
        predecessors: [],
        status: 'PENDING',
        stepType: 'thermal',
      },
    ];

    const res = scheduleForTarget(tasks, targetDate, DEFAULT_KITCHEN_CONFIG);
    expect(res.ovenFeasibility.feasible).toBe(false);
    expect(res.ovenFeasibility.conflicts.length).toBeGreaterThan(0);
  });

  it('resolves active attention conflict by shifting non-critical task within float', () => {
    const tasks: TaskNode[] = [
      {
        id: 'crit-active',
        dishId: 'd1',
        label: 'Critical carve',
        instructions: '',
        durationSeconds: 300,
        isActive: true,
        resource: 'NONE',
        predecessors: [],
        status: 'PENDING',
        stepType: 'active-hands',
      },
      {
        id: 'float-active',
        dishId: 'd2',
        label: 'Chop parsley garnish',
        instructions: '',
        durationSeconds: 120,
        isActive: true,
        resource: 'NONE',
        predecessors: [],
        status: 'PENDING',
        stepType: 'prep',
      },
      {
        id: 'long-tail',
        dishId: 'd1',
        label: 'Main critical successor',
        instructions: '',
        durationSeconds: 1800,
        isActive: false,
        resource: 'NONE',
        predecessors: ['crit-active'],
        status: 'PENDING',
        stepType: 'thermal',
      },
    ];

    const res = scheduleForTarget(tasks, targetDate, DEFAULT_KITCHEN_CONFIG);
    const s1 = res.scheduledTasks.find((t) => t.taskId === 'crit-active')!;
    const s2 = res.scheduledTasks.find((t) => t.taskId === 'float-active')!;

    // Should not overlap
    const overlap = Math.max(s1.scheduledStart, s2.scheduledStart) < Math.min(s1.scheduledFinish, s2.scheduledFinish);
    expect(overlap).toBe(false);
  });
});

describe('Shock-Absorber Delay Recovery Engine', () => {
  const targetDate = new Date('2026-11-14T19:30:00Z');

  it('absorbs delay by compressing rest window down to minimum safe floor (Rule 1)', () => {
    // Initial 3-dish meal
    const combinedTasks = buildCombinedTaskGraph(['recipe-chicken', 'recipe-potatoes', 'recipe-asparagus-gravy']);
    const scheduleRes = scheduleForTarget(combinedTasks, targetDate, DEFAULT_KITCHEN_CONFIG);

    const session: any = {
      sessionId: 'test-session',
      targetServingAt: targetDate.toISOString(),
      tasks: combinedTasks,
      currentSchedule: scheduleRes.scheduledTasks,
      scheduleRevision: 1,
    };

    // Chicken roast delay: 720 seconds (12 minutes)
    const proposal = replanAfterDelay(session, 'chk-roast', 720, DEFAULT_KITCHEN_CONFIG);

    expect(proposal).toBeDefined();
    expect(proposal.proposalId).toBeDefined();
    expect(proposal.changes.length).toBeGreaterThan(0);

    // Verify Rule 1: Chicken rest was compressed by 300s (from 900s to 600s floor)
    const restChange = proposal.changes.find((c) => c.taskId === 'chk-rest');
    expect(restChange).toBeDefined();
    expect(restChange?.proposedDurationSeconds).toBe(600); // 10 min safe floor
    expect(restChange?.secondsRecovered).toBe(300); // 5 min recovered!

    // Verify unstarted asparagus saute was shifted +420s (7 min)
    const sauteChange = proposal.changes.find((c) => c.taskId === 'asp-saute');
    expect(sauteChange).toBeDefined();
    expect(sauteChange?.changeType).toBe('SHIFTED');

    // Net landing drift: 12m delay - 5m rest recovery = 7m drift (7:37 PM)
    expect(proposal.landingDriftSeconds).toBe(420); // 7 * 60 = 420s
    expect(proposal.projectedLandingTime).toBe('2026-11-14T19:37:00.000Z');
  });

  it('never mutates the input session during proposal generation', () => {
    const combinedTasks = buildCombinedTaskGraph(['recipe-chicken', 'recipe-potatoes', 'recipe-asparagus-gravy']);
    const scheduleRes = scheduleForTarget(combinedTasks, targetDate, DEFAULT_KITCHEN_CONFIG);

    const originalChickenRoastDuration = combinedTasks.find((t) => t.id === 'chk-roast')!.durationSeconds;
    const session: any = {
      sessionId: 'test-session',
      targetServingAt: targetDate.toISOString(),
      tasks: combinedTasks,
      currentSchedule: scheduleRes.scheduledTasks,
      scheduleRevision: 1,
    };

    replanAfterDelay(session, 'chk-roast', 720, DEFAULT_KITCHEN_CONFIG);

    // Original task duration in session must remain completely untouched
    const currentChickenRoast = session.tasks.find((t: any) => t.id === 'chk-roast');
    expect(currentChickenRoast.durationSeconds).toBe(originalChickenRoastDuration);
    expect(session.scheduleRevision).toBe(1);
  });
});
