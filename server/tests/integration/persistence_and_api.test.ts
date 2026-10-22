import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseManager } from '../../src/persistence/database.ts';
import { CookingSessionService } from '../../src/sessions/service.ts';
import { createApp } from '../../src/server.ts';

describe('SQLite Persistence & CookingSessionService Integration', () => {
  let tempDbPath: string;
  let db: DatabaseManager;
  let sessionService: CookingSessionService;

  beforeAll(() => {
    tempDbPath = path.join(os.tmpdir(), `landing_time_test_${Date.now()}.db`);
    db = new DatabaseManager(tempDbPath);
    sessionService = new CookingSessionService(db);
  });

  afterAll(() => {
    db.close();
    try {
      if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
    } catch {}
  });

  it('initializes schema and seeds catalog recipes', () => {
    const recipes = db.getRecipes();
    expect(recipes.length).toBeGreaterThanOrEqual(3);
    const chicken = recipes.find((r) => r.id === 'recipe-chicken');
    expect(chicken).toBeDefined();
    expect(chicken?.tasks.length).toBe(4);
  });

  it('creates, persists, and resumes a cooking session across database reloads', () => {
    const targetServingAt = new Date('2026-11-14T19:30:00Z').toISOString();
    const { session } = sessionService.createSession({
      dishIds: ['recipe-chicken', 'recipe-potatoes', 'recipe-asparagus-gravy'],
      targetServingAt,
      householdSize: 4,
    });

    expect(session.sessionId).toBeDefined();
    expect(session.status).toBe('PLANNING');
    expect(session.tasks.length).toBe(11); // 4 + 4 + 3

    // Verify session was persisted in SQLite
    const retrieved = db.getSession(session.sessionId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.sessionId).toBe(session.sessionId);
    expect(retrieved?.tasks).toHaveLength(11);

    // Simulate process restart with new DatabaseManager instance pointing to same file
    const secondDb = new DatabaseManager(tempDbPath);
    const secondService = new CookingSessionService(secondDb);
    const resumed = secondService.getSession(session.sessionId);
    expect(resumed.sessionId).toBe(session.sessionId);
    expect(resumed.targetServingAt).toBe(targetServingAt);
    secondDb.close();
  });

  it('advances cooking state and unlocks dependent steps', () => {
    const targetServingAt = new Date('2026-11-14T19:30:00Z').toISOString();
    const { session } = sessionService.createSession({
      dishIds: ['recipe-chicken'],
      targetServingAt,
    });

    sessionService.startCooking(session.sessionId);
    const liveSession = sessionService.getSession(session.sessionId);
    expect(liveSession.status).toBe('LIVE');

    // Complete chk-prep step
    const { nextTask, session: afterPrep } = sessionService.completeStep(
      session.sessionId,
      'chk-prep',
      600
    );

    expect(afterPrep.scheduleRevision).toBe(2);
    // Successor chk-roast should now be in progress
    const roastTask = afterPrep.tasks.find((t) => t.id === 'chk-roast');
    expect(roastTask?.status).toBe('IN_PROGRESS');
  });

  it('reports delay, generates proposal, and accepts atomically', () => {
    const targetServingAt = new Date('2026-11-14T19:30:00Z').toISOString();
    const { session } = sessionService.createSession({
      dishIds: ['recipe-chicken', 'recipe-potatoes', 'recipe-asparagus-gravy'],
      targetServingAt,
    });

    const proposal = sessionService.reportDelay(
      session.sessionId,
      'chk-roast',
      720,
      'Thermal curve required +12m oven extension'
    );

    expect(proposal.proposalId).toBeDefined();
    expect(proposal.landingDriftSeconds).toBe(420); // 7m drift after 5m rest recovery

    // Before acceptance, session schedule is unchanged
    const unacceptedSession = sessionService.getSession(session.sessionId);
    expect(unacceptedSession.scheduleRevision).toBe(1);
    expect(unacceptedSession.pendingProposal).toBeDefined();

    // Accept proposal
    const acceptedSession = sessionService.acceptReplan(session.sessionId, proposal.proposalId);
    expect(acceptedSession.scheduleRevision).toBe(2);
    expect(acceptedSession.pendingProposal).toBeUndefined();
    expect(acceptedSession.actualLandingTime).toBe('2026-11-14T19:37:00.000Z');
  });

  it('rejects stale replan proposal if session revision changed', () => {
    const targetServingAt = new Date('2026-11-14T19:30:00Z').toISOString();
    const { session } = sessionService.createSession({
      dishIds: ['recipe-chicken'],
      targetServingAt,
    });

    const proposal = sessionService.reportDelay(session.sessionId, 'chk-roast', 300);

    // Concurrently complete a step, bumping revision
    sessionService.completeStep(session.sessionId, 'chk-prep');

    // Attempting to accept proposal created on revision 1 should fail
    expect(() => {
      sessionService.acceptReplan(session.sessionId, proposal.proposalId);
    }).toThrow(/evolved/);
  });

  it('handles ingredient substitution and adds item to persistent restock list', () => {
    const targetServingAt = new Date('2026-11-14T19:30:00Z').toISOString();
    const { session } = sessionService.createSession({
      dishIds: ['recipe-chicken', 'recipe-asparagus-gravy'],
      targetServingAt,
    });

    // Request substitution for heavy cream
    const { proposal, substitution } = sessionService.requestSubstitution(
      session.sessionId,
      'heavy cream'
    );

    expect(substitution.id).toBe('sub-milk-butter');
    expect(proposal.durationChangeSeconds).toBe(120); // +2 min simmer

    // Accept substitution
    const updated = sessionService.acceptSubstitution(session.sessionId, proposal.proposalId);
    expect(updated.appliedSubstitutions.length).toBe(1);

    // Restock list contains Heavy Cream
    const restock = updated.restockItems.find((r) => r.name.toLowerCase().includes('heavy cream'));
    expect(restock).toBeDefined();
    expect(restock?.status).toBe('DEPLETED');
  });
});

describe('REST API Server Integration', () => {
  let serverInstance: any;
  let baseUrl: string;
  let tempDbPath: string;

  beforeAll(async () => {
    tempDbPath = path.join(os.tmpdir(), `landing_time_api_test_${Date.now()}.db`);
    const { app } = await createApp(tempDbPath);

    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, '127.0.0.1', () => {
        const address = serverInstance.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (serverInstance) {
      await new Promise<void>((resolve) => serverInstance.close(() => resolve()));
    }
    try {
      if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
    } catch {}
  });

  it('GET /api/v1/health returns ok status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('landing-time-engine');
  });

  it('GET /api/v1/recipes returns catalog', async () => {
    const res = await fetch(`${baseUrl}/api/v1/recipes`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.recipes.length).toBeGreaterThanOrEqual(3);
  });

  it('POST /api/v1/sessions creates a session and returns scheduleResult', async () => {
    const res = await fetch(`${baseUrl}/api/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dishIds: ['recipe-chicken', 'recipe-potatoes'],
        targetServingAt: '2026-11-14T19:30:00Z',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.session.sessionId).toBeDefined();
    expect(data.scheduleResult.criticalPath.length).toBeGreaterThan(0);
  });
});
