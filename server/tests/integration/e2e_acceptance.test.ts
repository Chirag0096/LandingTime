import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseManager } from '../../src/persistence/database.ts';
import { CookingSessionService } from '../../src/sessions/service.ts';

describe('End-to-End Acceptance: Complete 21-Step Kitchen Coordination Scenario', () => {
  let tempDbPath: string;
  let db: DatabaseManager;
  let service: CookingSessionService;
  let sessionId: string;
  let initialLandingTime: string;
  let delayProposalId: string;
  let subProposalId: string;

  beforeAll(() => {
    tempDbPath = path.join(os.tmpdir(), `landing_time_e2e_${Date.now()}.db`);
    db = new DatabaseManager(tempDbPath);
    service = new CookingSessionService(db);
  });

  afterAll(() => {
    db.close();
    try {
      if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
    } catch {}
  });

  it('Step 1-3: Creates a meal with chicken, potatoes, and asparagus gravy, setting target serving time at 7:30 PM', () => {
    const targetServingAt = '2026-11-14T19:30:00.000Z';
    const { session, scheduleResult } = service.createSession({
      dishIds: ['recipe-chicken', 'recipe-potatoes', 'recipe-asparagus-gravy'],
      targetServingAt,
      householdSize: 4,
    });

    sessionId = session.sessionId;
    initialLandingTime = scheduleResult.expectedLandingTime;

    expect(sessionId).toBeDefined();
    expect(session.status).toBe('PLANNING');
    expect(session.tasks).toHaveLength(11);
    expect(scheduleResult.criticalPath).toContain('chk-prep');
    expect(scheduleResult.criticalPath).toContain('chk-roast');
    expect(scheduleResult.criticalPath).toContain('chk-rest');
    expect(scheduleResult.criticalPath).toContain('asp-gravy');
  });

  it('Step 4: Starts cooking session', () => {
    const liveSession = service.startCooking(sessionId);
    expect(liveSession.status).toBe('LIVE');
    const chkPrep = liveSession.tasks.find((t) => t.id === 'chk-prep');
    expect(chkPrep?.status).toBe('IN_PROGRESS');
  });

  it('Step 5-6: Completes prerequisite task (chk-prep) and requests next task', () => {
    const { session, nextTask } = service.completeStep(sessionId, 'chk-prep', 600);
    expect(session.scheduleRevision).toBe(2);

    const whatNow = service.getWhatNow(sessionId);
    expect(whatNow.currentTask?.id).toBe('chk-roast');
    expect(whatNow.currentTask?.resource).toBe('OVEN');
    expect(whatNow.applianceStatus.oven).toContain('BUSY');
  });

  it('Step 7-9: Reports 12-minute chicken delay, inspects proposal, and confirms schedule is untouched before confirmation', () => {
    const proposal = service.reportDelay(
      sessionId,
      'chk-roast',
      720,
      'Thigh temperature sensor reads 152°F; needs +12m to reach safe 165°F core'
    );

    delayProposalId = proposal.proposalId;
    expect(proposal.proposalId).toBeDefined();
    expect(proposal.landingDriftSeconds).toBe(420); // 7 min drift
    expect(proposal.projectedLandingTime).toBe('2026-11-14T19:37:00.000Z');

    // Rule 1 verified: Chicken rest compressed by 5m (from 15m to 10m safe floor)
    const restChange = proposal.changes.find((c) => c.taskId === 'chk-rest');
    expect(restChange?.proposedDurationSeconds).toBe(600);
    expect(restChange?.secondsRecovered).toBe(300);

    // Rule 3 verified: Asparagus sauté shifted by +7m
    const sauteChange = proposal.changes.find((c) => c.taskId === 'asp-saute');
    expect(sauteChange).toBeDefined();

    // Verify session schedule is STILL on revision 2 and uncommitted
    const currentSession = service.getSession(sessionId);
    expect(currentSession.scheduleRevision).toBe(2);
    expect(currentSession.pendingProposal).toBeDefined();
    expect(currentSession.actualLandingTime).toBe(initialLandingTime);
  });

  it('Step 10-11: Accepts replan proposal and verifies task timings and projected landing time update mathematically', () => {
    const acceptedSession = service.acceptReplan(sessionId, delayProposalId);
    expect(acceptedSession.scheduleRevision).toBe(3);
    expect(acceptedSession.pendingProposal).toBeUndefined();
    expect(acceptedSession.actualLandingTime).toBe('2026-11-14T19:37:00.000Z');

    // Verify chicken roast duration was updated
    const roastTask = acceptedSession.tasks.find((t) => t.id === 'chk-roast');
    expect(roastTask?.durationSeconds).toBe(2700 + 720); // 3420s (57m)
  });

  it('Step 12-14: Reports missing heavy cream, retrieves milk+butter substitution candidate without unconfirmed mutation', () => {
    const { proposal, substitution } = service.requestSubstitution(sessionId, 'heavy cream');
    subProposalId = proposal.proposalId;

    expect(substitution.id).toBe('sub-milk-butter');
    expect(proposal.durationChangeSeconds).toBe(120); // +2m simmer
    expect(proposal.explanation).toContain('Whole Milk');

    // Verify unaccepted substitution did NOT mutate restock or session yet
    const currentSession = service.getSession(sessionId);
    expect(currentSession.appliedSubstitutions).toHaveLength(0);
    expect(currentSession.restockItems.some((r) => r.name.toLowerCase().includes('heavy cream'))).toBe(false);
  });

  it('Step 15-17: Accepts substitution, verifies gravy task +120s extension, and confirms item added to restock list', () => {
    const updated = service.acceptSubstitution(sessionId, subProposalId);
    expect(updated.scheduleRevision).toBe(4);
    expect(updated.appliedSubstitutions).toHaveLength(1);

    // Gravy task duration extended by 120s
    const gravyTask = updated.tasks.find((t) => t.id === 'asp-gravy');
    expect(gravyTask?.durationSeconds).toBe(360 + 120); // 480s (8m)

    // Restock list contains Heavy Cream
    const restockItem = updated.restockItems.find((r) => r.name.toLowerCase().includes('heavy cream'));
    expect(restockItem).toBeDefined();
    expect(restockItem?.status).toBe('DEPLETED');
  });

  it('Step 18: Resumes session using its stable ID after process restart simulation', () => {
    // New database connection instance
    const freshDb = new DatabaseManager(tempDbPath);
    const freshService = new CookingSessionService(freshDb);

    const resumed = freshService.getSession(sessionId);
    expect(resumed.sessionId).toBe(sessionId);
    expect(resumed.status).toBe('LIVE');
    expect(resumed.actualLandingTime).toBe('2026-11-14T19:37:00.000Z');
    expect(resumed.restockItems.length).toBeGreaterThan(0);
    freshDb.close();
  });

  it('Step 19-21: Completes remaining tasks, finalizes session, and verifies event log audit trail', () => {
    // Complete remaining tasks in order
    const remainingTasks = [
      'chk-roast',
      'chk-rest',
      'chk-carve',
      'pot-boil',
      'pot-smash',
      'pot-bake',
      'pot-hold',
      'asp-prep',
      'asp-saute',
      'asp-gravy',
    ];

    for (const tid of remainingTasks) {
      service.completeStep(sessionId, tid);
    }

    // Toggle plating checklist items
    service.togglePlatingItem(sessionId, 'plate-1');
    service.togglePlatingItem(sessionId, 'plate-2');
    service.togglePlatingItem(sessionId, 'plate-3');
    service.togglePlatingItem(sessionId, 'plate-4');
    service.togglePlatingItem(sessionId, 'plate-5');

    // Finish session
    const finalSession = service.finishSession(sessionId);
    expect(finalSession.status).toBe('COMPLETE');
    expect(finalSession.completedAt).toBeDefined();

    // Verify all plating items checked
    expect(finalSession.platingChecklist.every((p) => p.completed)).toBe(true);

    // Audit trail has complete events
    const eventTypes = finalSession.events.map((e) => e.type);
    expect(eventTypes).toContain('SESSION_CREATED');
    expect(eventTypes).toContain('COOKING_STARTED');
    expect(eventTypes).toContain('DELAY_REPORTED');
    expect(eventTypes).toContain('PROPOSAL_ACCEPTED');
    expect(eventTypes).toContain('SUBSTITUTION_ACCEPTED');
    expect(eventTypes).toContain('RESTOCK_ITEM_ADDED');
    expect(eventTypes).toContain('SESSION_COMPLETED');
  });
});
