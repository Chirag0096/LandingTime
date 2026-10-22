import crypto from 'node:crypto';
import type {
  CookingSession,
  TaskNode,
  ScheduledTask,
  ReplanProposal,
  SubstitutionProposal,
  SessionEvent,
  SessionEventType,
  KitchenConfig,
  PlatingItem,
  RestockItem,
  ScheduleResult,
} from '../domain/types.ts';
import { DEFAULT_KITCHEN_CONFIG } from '../domain/types.ts';
import { DatabaseManager } from '../persistence/database.ts';
import { scheduleForTarget, replanAfterDelay } from '../scheduler/engine.ts';
import { buildCombinedTaskGraph, RECIPE_CATALOG, getRecipesByIds } from '../recipes/catalog.ts';
import { findSubstitution } from '../substitutions/catalog.ts';

const DEFAULT_PLATING_ITEMS: PlatingItem[] = [
  {
    id: 'plate-1',
    title: '1. Transfer carved chicken to main serving platter',
    description: 'Warm oval dish · Collect cutting board juices for gravy',
    completed: false,
  },
  {
    id: 'plate-2',
    title: '2. Arrange crispy potatoes on warm serving plate',
    description: 'Gently tumble to preserve crisp skin · Top with chopped chives',
    completed: false,
  },
  {
    id: 'plate-3',
    title: '3. Plate high-heat sautéed asparagus spears',
    description: 'Align tips parallel · Drizzle fresh lemon juice and zest',
    completed: false,
  },
  {
    id: 'plate-4',
    title: '4. Pour warm pan gravy into gravy boat & bring to table',
    description: 'Stir once to re-incorporate herb fats · Place saucer underneath',
    completed: false,
  },
  {
    id: 'plate-5',
    title: '5. Check serving tongs, carving knife, and table settings',
    description: 'Water glasses filled · Cloth napkins arranged · Serving spoons placed',
    completed: false,
  },
];

export class CookingSessionService {
  private db: DatabaseManager;
  private config: KitchenConfig;

  constructor(db: DatabaseManager, config: KitchenConfig = DEFAULT_KITCHEN_CONFIG) {
    this.db = db;
    this.config = config;
    // Seed initial catalog data
    this.db.seedRecipes(RECIPE_CATALOG);
  }

  private addEvent(
    session: CookingSession,
    type: SessionEventType,
    description: string,
    metadata?: Record<string, unknown>
  ): void {
    const event: SessionEvent = {
      id: crypto.randomUUID(),
      sessionId: session.sessionId,
      type,
      timestamp: new Date().toISOString(),
      description,
      metadata,
    };
    session.events.push(event);
  }

  /**
   * Creates a new cooking session by compiling recipe task graphs and running the CPM scheduler.
   */
  public createSession(input: {
    dishIds: string[];
    targetServingAt: string; // ISO 8601 or epoch seconds string
    householdSize?: number;
    timezone?: string;
  }): { session: CookingSession; scheduleResult: ScheduleResult } {
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const targetServingDate = new Date(input.targetServingAt);
    const dishIds = input.dishIds.length > 0 ? input.dishIds : ['recipe-chicken', 'recipe-potatoes', 'recipe-asparagus-gravy'];

    const recipeVersions: Record<string, number> = {};
    const recipes = getRecipesByIds(dishIds);
    for (const r of recipes) {
      recipeVersions[r.id] = r.version;
    }

    const tasks = buildCombinedTaskGraph(dishIds);
    const scheduleResult = scheduleForTarget(tasks, targetServingDate, this.config);

    const session: CookingSession = {
      sessionId,
      createdAt: now,
      updatedAt: now,
      targetServingAt: targetServingDate.toISOString(),
      timezone: input.timezone || 'UTC',
      householdSize: input.householdSize || 4,
      status: 'PLANNING',
      selectedDishIds: dishIds,
      recipeVersions,
      tasks,
      currentSchedule: scheduleResult.scheduledTasks,
      scheduleRevision: 1,
      acceptedChanges: [],
      appliedSubstitutions: [],
      restockItems: [],
      platingChecklist: JSON.parse(JSON.stringify(DEFAULT_PLATING_ITEMS)),
      events: [],
      planStartTime: scheduleResult.planStartTime,
      actualLandingTime: scheduleResult.expectedLandingTime,
    };

    this.addEvent(
      session,
      'SESSION_CREATED',
      `Session created for ${dishIds.length} dishes targeting ${session.targetServingAt}`,
      { dishIds, landingTime: scheduleResult.expectedLandingTime }
    );
    this.addEvent(
      session,
      'PLAN_GENERATED',
      `CPM Schedule generated with makespan ${scheduleResult.landingDriftSeconds}s drift`,
      { criticalPath: scheduleResult.criticalPath }
    );

    this.db.saveSession(session);
    return { session, scheduleResult };
  }

  /**
   * Retrieves an existing session by ID or throws if not found.
   */
  public getSession(sessionId: string): CookingSession {
    const session = this.db.getSession(sessionId);
    if (!session) {
      throw new Error(`Session "${sessionId}" not found`);
    }
    return session;
  }

  /**
   * Transition session status to LIVE cooking.
   */
  public startCooking(sessionId: string): CookingSession {
    const session = this.getSession(sessionId);
    session.status = 'LIVE';
    session.updatedAt = new Date().toISOString();

    // Mark the first root task(s) as IN_PROGRESS if pending
    const rootTasks = session.tasks.filter((t) => !t.predecessors || t.predecessors.length === 0);
    for (const rt of rootTasks) {
      if (rt.status === 'PENDING') {
        rt.status = 'IN_PROGRESS';
        rt.startedAt = new Date().toISOString();
      }
    }

    this.addEvent(session, 'COOKING_STARTED', 'Cooking started. Live timers engaged.');
    this.db.updateSession(session);
    return session;
  }

  /**
   * Advances and completes a step, unlocking dependent successors.
   */
  public completeStep(
    sessionId: string,
    taskId: string,
    actualSeconds?: number,
    expectedRevision?: number
  ): { session: CookingSession; nextTask?: TaskNode; updatedSchedule: ScheduledTask[] } {
    const session = this.getSession(sessionId);

    if (expectedRevision !== undefined && session.scheduleRevision !== expectedRevision) {
      throw new Error(
        `Optimistic concurrency conflict: expected revision ${expectedRevision}, but current revision is ${session.scheduleRevision}`
      );
    }

    const task = session.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task "${taskId}" not found in session "${sessionId}"`);
    }

    const now = new Date().toISOString();
    task.status = 'COMPLETED';
    task.completedAt = now;
    if (actualSeconds !== undefined) {
      task.actualDurationSeconds = actualSeconds;
    }

    this.addEvent(
      session,
      'TASK_COMPLETED',
      `Task "${task.label}" completed${actualSeconds ? ` in ${actualSeconds}s` : ''}.`,
      { taskId, actualSeconds }
    );

    // Check successors to see if any are unlocked (all predecessors completed)
    const completedIds = new Set(
      session.tasks.filter((t) => t.status === 'COMPLETED').map((t) => t.id)
    );

    for (const other of session.tasks) {
      if (other.status === 'PENDING') {
        const allPredsDone = (other.predecessors || []).every((p) => completedIds.has(p));
        if (allPredsDone) {
          other.status = 'IN_PROGRESS';
          other.startedAt = now;
          this.addEvent(
            session,
            'TASK_STARTED',
            `Prerequisites met: "${other.label}" is now in progress.`,
            { taskId: other.id }
          );
        }
      }
    }

    // Determine the next eligible task (first IN_PROGRESS or earliest eligible PENDING)
    const nextTask =
      session.tasks.find((t) => t.status === 'IN_PROGRESS') ||
      session.tasks.find((t) => t.status === 'PENDING');

    session.updatedAt = now;
    session.scheduleRevision += 1;
    this.db.updateSession(session);

    return { session, nextTask, updatedSchedule: session.currentSchedule };
  }

  /**
   * Reports a delay on a task and calculates a ReplanProposal without mutating the accepted schedule.
   */
  public reportDelay(
    sessionId: string,
    taskId: string,
    delaySeconds: number,
    explanation?: string,
    expectedRevision?: number
  ): ReplanProposal {
    const session = this.getSession(sessionId);

    if (expectedRevision !== undefined && session.scheduleRevision !== expectedRevision) {
      throw new Error(
        `Stale schedule revision: expected ${expectedRevision}, current is ${session.scheduleRevision}`
      );
    }

    const proposal = replanAfterDelay(session, taskId, delaySeconds, this.config);
    if (explanation) {
      proposal.explanation = `${explanation} — ${proposal.explanation}`;
    }

    session.pendingProposal = proposal;
    this.addEvent(
      session,
      'DELAY_REPORTED',
      `Delay of ${delaySeconds}s reported on task "${taskId}". Proposal generated.`,
      { taskId, delaySeconds, proposalId: proposal.proposalId }
    );
    this.addEvent(
      session,
      'PROPOSAL_GENERATED',
      `Replan proposal generated with new projected landing: ${proposal.projectedLandingTime}`,
      { proposalId: proposal.proposalId }
    );

    this.db.updateSession(session);
    return proposal;
  }

  /**
   * Accepts a replan proposal and commits the new schedule atomically.
   */
  public acceptReplan(sessionId: string, proposalId: string, expectedRevision?: number): CookingSession {
    const session = this.getSession(sessionId);

    if (!session.pendingProposal || session.pendingProposal.proposalId !== proposalId) {
      throw new Error(`Proposal "${proposalId}" not found or no longer pending`);
    }

    const proposal = session.pendingProposal;
    if (expectedRevision !== undefined && proposal.baseRevision !== expectedRevision) {
      throw new Error(
        `Proposal was created on revision ${proposal.baseRevision}, but expected revision was ${expectedRevision}`
      );
    }

    if (session.scheduleRevision !== proposal.baseRevision) {
      proposal.status = 'STALE';
      this.db.updateSession(session);
      throw new Error(
        `Session has evolved since proposal was created (base revision ${proposal.baseRevision} vs current ${session.scheduleRevision}). Recalculation required.`
      );
    }

    // Atomically commit schedule
    session.currentSchedule = proposal.proposedSchedule;
    session.actualLandingTime = proposal.projectedLandingTime;
    session.acceptedChanges.push(...proposal.changes);
    session.scheduleRevision += 1;
    session.pendingProposal = undefined;
    session.updatedAt = new Date().toISOString();

    // Update task durations in session if modified
    for (const change of proposal.changes) {
      if (change.changeType === 'DURATION_CHANGED') {
        const task = session.tasks.find((t) => t.id === change.taskId);
        if (task) {
          task.durationSeconds = change.proposedDurationSeconds;
        }
      }
    }

    this.addEvent(
      session,
      'PROPOSAL_ACCEPTED',
      `Replan proposal "${proposalId}" committed. Projected landing locked at ${session.actualLandingTime}.`,
      { proposalId, changesCount: proposal.changes.length }
    );

    this.db.updateSession(session);
    return session;
  }

  /**
   * Rejects a pending proposal without modifying the accepted schedule.
   */
  public rejectReplan(sessionId: string, proposalId: string): CookingSession {
    const session = this.getSession(sessionId);

    if (!session.pendingProposal || session.pendingProposal.proposalId !== proposalId) {
      throw new Error(`Proposal "${proposalId}" not found or not pending`);
    }

    session.pendingProposal.status = 'REJECTED';
    session.pendingProposal = undefined;
    session.updatedAt = new Date().toISOString();

    this.addEvent(
      session,
      'PROPOSAL_REJECTED',
      `Replan proposal "${proposalId}" rejected. Accepted schedule remains unchanged.`,
      { proposalId }
    );

    this.db.updateSession(session);
    return session;
  }

  /**
   * Evaluates an ingredient substitution, generates a schedule proposal, and stages a restock addition.
   */
  public requestSubstitution(
    sessionId: string,
    ingredient: string,
    recipeId?: string
  ): { proposal: SubstitutionProposal; substitution: any } {
    const session = this.getSession(sessionId);
    const subRecord = findSubstitution(ingredient, recipeId);

    if (!subRecord) {
      throw new Error(
        `No approved culinary substitution found for ingredient: "${ingredient}". Please verify and try another option.`
      );
    }

    const proposalId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Find affected tasks (e.g. pan gravy)
    const affectedTasks = session.tasks.filter(
      (t) =>
        subRecord.compatibleTaskIds.includes(t.id) ||
        (recipeId && t.dishId === recipeId) ||
        t.instructions.toLowerCase().includes(ingredient.toLowerCase()) ||
        t.label.toLowerCase().includes('gravy')
    );

    const affectedTaskIds = affectedTasks.map((t) => t.id);
    const targetTaskId = affectedTaskIds[0] || 'asp-gravy';

    // Run scheduler proposal with the adjusted duration (+120s for milk+butter)
    const replanProp = replanAfterDelay(
      session,
      targetTaskId,
      subRecord.durationAdjustmentSeconds,
      this.config
    );

    const subProposal: SubstitutionProposal = {
      proposalId,
      sessionId,
      baseRevision: session.scheduleRevision,
      status: 'PENDING',
      missingIngredient: ingredient,
      substitutionId: subRecord.id,
      affectedTaskIds,
      durationChangeSeconds: subRecord.durationAdjustmentSeconds,
      scheduleChanges: replanProp.changes,
      projectedLandingTime: replanProp.projectedLandingTime,
      explanation: `${subRecord.replacementIngredients.map((r) => `${r.quantity} ${r.name}`).join(' + ')}. ${subRecord.preparationChanges}`,
      createdAt: now,
    };

    session.pendingSubstitutionProposal = subProposal;

    this.addEvent(
      session,
      'SUBSTITUTION_PROPOSED',
      `Substitution proposed for "${ingredient}": ${subRecord.replacementIngredients.map((r) => r.name).join(', ')}.`,
      { proposalId, substitutionId: subRecord.id }
    );

    this.db.updateSession(session);
    return { proposal: subProposal, substitution: subRecord };
  }

  /**
   * Accepts a substitution proposal, atomically applying the task adjustment and updating restock list.
   */
  public acceptSubstitution(sessionId: string, proposalId: string, expectedRevision?: number): CookingSession {
    const session = this.getSession(sessionId);

    if (
      !session.pendingSubstitutionProposal ||
      session.pendingSubstitutionProposal.proposalId !== proposalId
    ) {
      throw new Error(`Substitution proposal "${proposalId}" not found or no longer pending`);
    }

    const proposal = session.pendingSubstitutionProposal;
    if (expectedRevision !== undefined && proposal.baseRevision !== expectedRevision) {
      throw new Error(`Stale revision: expected ${expectedRevision}, current is ${proposal.baseRevision}`);
    }

    // Apply duration change to affected task
    for (const taskId of proposal.affectedTaskIds) {
      const task = session.tasks.find((t) => t.id === taskId);
      if (task) {
        task.durationSeconds += proposal.durationChangeSeconds;
      }
    }

    // Add to persistent restock list
    const existingRestock = session.restockItems.find(
      (r) => r.name.toLowerCase() === proposal.missingIngredient.toLowerCase()
    );
    if (!existingRestock) {
      const restockItem = {
        id: crypto.randomUUID(),
        sessionId,
        name: proposal.missingIngredient,
        status: 'DEPLETED' as const,
        note: `Missing during cooking session · Used substitution: ${proposal.substitutionId}`,
        dateAdded: new Date().toLocaleDateString(),
      };
      session.restockItems.push(restockItem);
      this.addEvent(
        session,
        'RESTOCK_ITEM_ADDED',
        `Restock reminder added: ${proposal.missingIngredient}`,
        { item: restockItem }
      );
    }

    session.appliedSubstitutions.push({
      substitutionId: proposal.substitutionId,
      appliedAt: new Date().toISOString(),
    });

    session.acceptedChanges.push(...proposal.scheduleChanges);
    session.actualLandingTime = proposal.projectedLandingTime;
    session.pendingSubstitutionProposal = undefined;
    session.scheduleRevision += 1;
    session.updatedAt = new Date().toISOString();

    this.addEvent(
      session,
      'SUBSTITUTION_ACCEPTED',
      `Applied substitution "${proposal.substitutionId}" for "${proposal.missingIngredient}". Restock list updated.`,
      { proposalId, substitutionId: proposal.substitutionId }
    );

    this.db.updateSession(session);
    return session;
  }

  /**
   * What to do now: calculates the most useful immediate action, remaining time, and appliance status.
   */
  public getWhatNow(sessionId: string): {
    currentTask?: TaskNode;
    remainingSeconds?: number;
    upcomingTasks: TaskNode[];
    applianceStatus: Record<string, string>;
    explanation: string;
  } {
    const session = this.getSession(sessionId);

    const inProgress = session.tasks.filter((t) => t.status === 'IN_PROGRESS');
    const pending = session.tasks.filter((t) => t.status === 'PENDING');

    const currentTask = inProgress[0] || pending[0];
    const upcomingTasks = session.tasks.filter((t) => t.status === 'PENDING');

    // Calculate appliance status from current tasks
    const applianceStatus: Record<string, string> = {
      oven: 'IDLE',
      burner1: 'OFF',
      burner2: 'OFF',
      burner3: 'OFF',
      burner4: 'OFF',
    };

    for (const t of inProgress) {
      if (t.resource === 'OVEN') {
        applianceStatus.oven = `BUSY (${t.label}${t.temperatureF ? ` @ ${t.temperatureF}°F` : ''})`;
      } else if (t.resource === 'BURNER_1') {
        applianceStatus.burner1 = `ACTIVE (${t.label})`;
      } else if (t.resource === 'BURNER_2') {
        applianceStatus.burner2 = `ACTIVE (${t.label})`;
      } else if (t.resource === 'BURNER_3') {
        applianceStatus.burner3 = `ACTIVE (${t.label})`;
      } else if (t.resource === 'BURNER_4') {
        applianceStatus.burner4 = `ACTIVE (${t.label})`;
      }
    }

    let explanation = 'All cooking tasks are on schedule.';
    if (currentTask) {
      explanation = `Next focus: ${currentTask.label}. Duration: ${Math.round(currentTask.durationSeconds / 60)}m. Required resource: ${currentTask.resource}.`;
    }

    return {
      currentTask,
      remainingSeconds: currentTask ? currentTask.durationSeconds : 0,
      upcomingTasks,
      applianceStatus,
      explanation,
    };
  }

  /**
   * Adds an item to the application's persistent restock list.
   */
  public addRestockItem(sessionId: string, name: string, note?: string): CookingSession {
    const session = this.getSession(sessionId);
    const existing = session.restockItems.find(
      (r) => r.name.toLowerCase() === name.toLowerCase()
    );

    if (!existing) {
      const restockItem: RestockItem = {
        id: crypto.randomUUID(),
        sessionId,
        name,
        status: 'DEPLETED',
        note: note || 'Depleted during cooking session',
        dateAdded: new Date().toLocaleDateString(),
      };
      session.restockItems.push(restockItem);
      this.addEvent(session, 'RESTOCK_ITEM_ADDED', `Restock reminder added: ${name}`, {
        item: restockItem,
      });
      this.db.updateSession(session);
    }

    return session;
  }

  /**
   * Toggles a plating checklist item.
   */
  public togglePlatingItem(sessionId: string, itemId: string): CookingSession {
    const session = this.getSession(sessionId);
    const item = session.platingChecklist.find((p) => p.id === itemId);
    if (item) {
      item.completed = !item.completed;
      session.updatedAt = new Date().toISOString();
      this.db.updateSession(session);
    }
    return session;
  }

  /**
   * Finalizes the cooking session.
   */
  public finishSession(sessionId: string): CookingSession {
    const session = this.getSession(sessionId);
    session.status = 'COMPLETE';
    session.completedAt = new Date().toISOString();
    session.updatedAt = session.completedAt;

    this.addEvent(
      session,
      'SESSION_COMPLETED',
      `Session finished successfully. All dishes synchronized at ${session.actualLandingTime || session.targetServingAt}.`
    );

    this.db.updateSession(session);
    return session;
  }
}
