import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DatabaseManager } from '../../src/persistence/database.ts';
import { CookingSessionService } from '../../src/sessions/service.ts';
import { createMcpServer } from '../../src/mcp/server.ts';

describe('MCP Protocol & 6 Core Tools Compliance', () => {
  let tempDbPath: string;
  let db: DatabaseManager;
  let sessionService: CookingSessionService;
  let mcpServer: any;

  beforeAll(() => {
    tempDbPath = path.join(os.tmpdir(), `landing_time_mcp_test_${Date.now()}.db`);
    db = new DatabaseManager(tempDbPath);
    sessionService = new CookingSessionService(db);
    mcpServer = createMcpServer(sessionService);
  });

  afterAll(() => {
    db.close();
    try {
      if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
    } catch {}
  });

  it('discovers all required core tools via ListTools', async () => {
    // Invoke ListTools handler
    const handler = (mcpServer as any)._requestHandlers.get(ListToolsRequestSchema.shape.method.value);
    expect(handler).toBeDefined();

    const result = await handler({ method: 'tools/list' });
    expect(result.tools).toBeDefined();

    const toolNames = result.tools.map((t: any) => t.name);
    // 6 required core tools
    expect(toolNames).toContain('plan_meal');
    expect(toolNames).toContain('get_what_now');
    expect(toolNames).toContain('what_now');
    expect(toolNames).toContain('complete_step');
    expect(toolNames).toContain('report_delay');
    expect(toolNames).toContain('substitute');
    expect(toolNames).toContain('resume_plan');

    // Recovery confirmation tools
    expect(toolNames).toContain('accept_replan');
    expect(toolNames).toContain('reject_replan');
    expect(toolNames).toContain('accept_substitution');
  });

  it('executes full end-to-end user journey across all 6 core MCP tools', async () => {
    const callTool = (mcpServer as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);
    expect(callTool).toBeDefined();

    // 1. Tool 1: plan_meal
    const planRes = await callTool({
      method: 'tools/call',
      params: {
        name: 'plan_meal',
        arguments: {
          dishIds: ['recipe-chicken', 'recipe-potatoes', 'recipe-asparagus-gravy'],
          targetServingAt: '2026-11-14T19:30:00Z',
          householdSize: 4,
        },
      },
    });

    expect(planRes.isError).toBeFalsy();
    const sessionId = planRes.structuredContent.sessionId;
    expect(sessionId).toBeDefined();
    expect(planRes.structuredContent.criticalPath.length).toBeGreaterThan(0);

    // 2. Tool 2: what_now / get_what_now
    const whatNowRes = await callTool({
      method: 'tools/call',
      params: {
        name: 'get_what_now',
        arguments: { sessionId },
      },
    });

    expect(whatNowRes.isError).toBeFalsy();
    expect(whatNowRes.structuredContent.currentTask).toBeDefined();
    expect(whatNowRes.structuredContent.explanation).toContain('Next focus');

    // 3. Tool 3: complete_step
    const completeRes = await callTool({
      method: 'tools/call',
      params: {
        name: 'complete_step',
        arguments: {
          sessionId,
          taskId: 'chk-prep',
          actualSeconds: 600,
        },
      },
    });

    expect(completeRes.isError).toBeFalsy();
    expect(completeRes.structuredContent.nextTask.id).toBe('chk-roast');

    // 4. Tool 4: report_delay
    const delayRes = await callTool({
      method: 'tools/call',
      params: {
        name: 'report_delay',
        arguments: {
          sessionId,
          taskId: 'chk-roast',
          delaySeconds: 720,
          explanation: 'Chicken probe read 152°F (needs +12m to reach safe 165°F core)',
        },
      },
    });

    expect(delayRes.isError).toBeFalsy();
    const proposalId = delayRes.structuredContent.proposalId;
    expect(proposalId).toBeDefined();
    expect(delayRes.structuredContent.newTLanding).toBe('2026-11-14T19:37:00.000Z');
    expect(delayRes.structuredContent.requiresConfirmation).toBe(true);

    // Accept replan proposal
    const acceptReplanRes = await callTool({
      method: 'tools/call',
      params: {
        name: 'accept_replan',
        arguments: {
          sessionId,
          proposalId,
        },
      },
    });
    expect(acceptReplanRes.isError).toBeFalsy();
    expect(acceptReplanRes.structuredContent.actualLandingTime).toBe('2026-11-14T19:37:00.000Z');

    // 5. Tool 5: substitute
    const subRes = await callTool({
      method: 'tools/call',
      params: {
        name: 'substitute',
        arguments: {
          sessionId,
          ingredient: 'heavy cream',
        },
      },
    });

    expect(subRes.isError).toBeFalsy();
    const subProposalId = subRes.structuredContent.proposalId;
    expect(subProposalId).toBeDefined();
    expect(subRes.structuredContent.substitution.id).toBe('sub-milk-butter');
    expect(subRes.structuredContent.requiresConfirmation).toBe(true);

    // Accept substitution
    const acceptSubRes = await callTool({
      method: 'tools/call',
      params: {
        name: 'accept_substitution',
        arguments: {
          sessionId,
          proposalId: subProposalId,
        },
      },
    });
    expect(acceptSubRes.isError).toBeFalsy();
    expect(acceptSubRes.structuredContent.restockItems.length).toBeGreaterThan(0);

    // 6. Tool 6: resume_plan
    const resumeRes = await callTool({
      method: 'tools/call',
      params: {
        name: 'resume_plan',
        arguments: {
          sessionId,
        },
      },
    });

    expect(resumeRes.isError).toBeFalsy();
    expect(resumeRes.structuredContent.sessionId).toBe(sessionId);
    expect(resumeRes.structuredContent.actualLandingTime).toBe('2026-11-14T19:37:00.000Z');
    expect(resumeRes.structuredContent.tasks.length).toBe(11);
    expect(resumeRes.structuredContent.restockItems.length).toBeGreaterThan(0);
  });

  it('returns appropriate protocol errors for unknown tools or missing arguments', async () => {
    const callTool = (mcpServer as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    // Unknown tool throws McpError MethodNotFound
    await expect(
      callTool({
        method: 'tools/call',
        params: {
          name: 'non_existent_tool',
          arguments: {},
        },
      })
    ).rejects.toThrow(/Unknown tool/);

    // Missing sessionId for what_now throws McpError InvalidParams
    await expect(
      callTool({
        method: 'tools/call',
        params: {
          name: 'what_now',
          arguments: {},
        },
      })
    ).rejects.toThrow(/sessionId is required/);
  });
});
