import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import type { CookingSessionService } from '../sessions/service.ts';

export function createMcpServer(sessionService: CookingSessionService) {
  const server = new Server(
    {
      name: 'landing-time-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tools list
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'plan_meal',
          description:
            'Build a backward-scheduled CPM plan for a set of dishes with a target landing time. Detects oven, burner, and attention conflicts.',
          inputSchema: {
            type: 'object',
            required: ['dishIds'],
            properties: {
              dishIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of dish or recipe IDs (e.g. ["recipe-chicken", "recipe-potatoes", "recipe-asparagus-gravy"])',
              },
              targetServingAt: {
                type: 'string',
                description: 'Target serving time as ISO 8601 string (e.g. "2026-11-14T19:30:00Z")',
              },
              tTarget: {
                type: 'integer',
                description: 'Target serving time as Unix epoch seconds (e.g. 1794684600)',
              },
              householdSize: {
                type: 'integer',
                default: 4,
                description: 'Number of servings to coordinate for',
              },
              timezone: {
                type: 'string',
                default: 'America/New_York',
                description: 'Local timezone for display',
              },
            },
          },
        },
        {
          name: 'get_what_now',
          description:
            'Tell the cook the most useful next action, remaining duration, appliance status, and blockers.',
          inputSchema: {
            type: 'object',
            required: ['sessionId'],
            properties: {
              sessionId: {
                type: 'string',
                description: 'Active cooking session ID',
              },
            },
          },
        },
        {
          name: 'what_now',
          description: 'Alias for get_what_now: retrieve current cooking instruction and timer state.',
          inputSchema: {
            type: 'object',
            required: ['sessionId'],
            properties: {
              sessionId: {
                type: 'string',
                description: 'Active cooking session ID',
              },
            },
          },
        },
        {
          name: 'complete_step',
          description:
            'Mark a cooking step as complete, advancing the session and unlocking dependent tasks.',
          inputSchema: {
            type: 'object',
            required: ['sessionId', 'taskId'],
            properties: {
              sessionId: {
                type: 'string',
                description: 'Active cooking session ID',
              },
              taskId: {
                type: 'string',
                description: 'ID of task completed',
              },
              actualSeconds: {
                type: 'integer',
                description: 'Actual elapsed duration in seconds',
              },
              expectedRevision: {
                type: 'integer',
                description: 'Expected schedule revision for concurrency safety',
              },
            },
          },
        },
        {
          name: 'report_delay',
          description:
            'Report a cooking delay (e.g. chicken needs 12 more minutes). Runs deterministic shock-absorber recovery and generates a proposal without silently mutating the accepted schedule.',
          inputSchema: {
            type: 'object',
            required: ['sessionId', 'taskId', 'delaySeconds'],
            properties: {
              sessionId: {
                type: 'string',
                description: 'Active cooking session ID',
              },
              taskId: {
                type: 'string',
                description: 'Task ID experiencing the delay (e.g. "chk-roast")',
              },
              delaySeconds: {
                type: 'integer',
                minimum: 1,
                description: 'Delay magnitude in seconds (e.g. 720 for 12 minutes)',
              },
              deltaSeconds: {
                type: 'integer',
                description: 'Alias for delaySeconds',
              },
              explanation: {
                type: 'string',
                description: 'Optional culinary observation or sensor note',
              },
              expectedRevision: {
                type: 'integer',
                description: 'Expected session schedule revision',
              },
            },
          },
        },
        {
          name: 'accept_replan',
          description:
            'Accept and atomically commit a pending replan proposal, updating the accepted landing time.',
          inputSchema: {
            type: 'object',
            required: ['sessionId', 'proposalId'],
            properties: {
              sessionId: {
                type: 'string',
                description: 'Active cooking session ID',
              },
              proposalId: {
                type: 'string',
                description: 'Proposal ID to accept',
              },
              expectedRevision: {
                type: 'integer',
                description: 'Expected revision',
              },
            },
          },
        },
        {
          name: 'reject_replan',
          description:
            'Reject a proposed schedule adjustment, preserving the existing schedule sequence.',
          inputSchema: {
            type: 'object',
            required: ['sessionId', 'proposalId'],
            properties: {
              sessionId: {
                type: 'string',
                description: 'Active cooking session ID',
              },
              proposalId: {
                type: 'string',
                description: 'Proposal ID to reject',
              },
            },
          },
        },
        {
          name: 'substitute',
          description:
            'Find a culinary-chemistry safe substitution for a missing ingredient, assess schedule impact, and stage restock addition.',
          inputSchema: {
            type: 'object',
            required: ['sessionId', 'ingredient'],
            properties: {
              sessionId: {
                type: 'string',
                description: 'Active cooking session ID',
              },
              ingredient: {
                type: 'string',
                description: 'Name of the depleted ingredient (e.g. "heavy cream")',
              },
              missingIngredient: {
                type: 'string',
                description: 'Alias for ingredient',
              },
              recipeId: {
                type: 'string',
                description: 'Optional recipe ID to scope the substitution',
              },
            },
          },
        },
        {
          name: 'accept_substitution',
          description:
            'Accept and apply a pending ingredient substitution proposal, updating task durations and restock list.',
          inputSchema: {
            type: 'object',
            required: ['sessionId', 'proposalId'],
            properties: {
              sessionId: {
                type: 'string',
                description: 'Active cooking session ID',
              },
              proposalId: {
                type: 'string',
                description: 'Substitution proposal ID to commit',
              },
              expectedRevision: {
                type: 'integer',
                description: 'Expected revision',
              },
            },
          },
        },
        {
          name: 'resume_plan',
          description:
            'Load a persisted cooking session by its stable UUID, returning active task pointer, accepted schedule, and remaining timeline.',
          inputSchema: {
            type: 'object',
            required: ['sessionId'],
            properties: {
              sessionId: {
                type: 'string',
                description: 'Stable session UUID to reload from persistent storage',
              },
            },
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    const a = args as Record<string, any>;

    try {
      switch (name) {
        case 'plan_meal': {
          let targetServingAt = a.targetServingAt;
          if (!targetServingAt && a.tTarget) {
            targetServingAt = new Date(Number(a.tTarget) * 1000).toISOString();
          }
          if (!targetServingAt) {
            // Default 7:30 PM today
            const d = new Date();
            d.setHours(19, 30, 0, 0);
            targetServingAt = d.toISOString();
          }

          const result = sessionService.createSession({
            dishIds: a.dishIds || [],
            targetServingAt,
            householdSize: a.householdSize,
            timezone: a.timezone,
          });

          return {
            content: [
              {
                type: 'text',
                text: `Meal plan created for session ${result.session.sessionId}. Projected landing time: ${result.scheduleResult.expectedLandingTime}. Drift: ${result.scheduleResult.landingDriftSeconds}s.`,
              },
            ],
            structuredContent: {
              sessionId: result.session.sessionId,
              tasks: result.scheduleResult.scheduledTasks,
              criticalPath: result.scheduleResult.criticalPath,
              ovenCheck: result.scheduleResult.ovenFeasibility,
              landingDrift: result.scheduleResult.landingDriftSeconds,
              planStartTime: result.scheduleResult.planStartTime,
              scheduleRevision: result.session.scheduleRevision,
              ui: {
                screen: 'LIVE_DASHBOARD',
                masterClock: {
                  targetServingAt: result.session.targetServingAt,
                  planStartTime: result.session.planStartTime,
                },
              },
            },
          };
        }

        case 'what_now':
        case 'get_what_now': {
          if (!a.sessionId) {
            throw new McpError(ErrorCode.InvalidParams, 'sessionId is required');
          }

          const whatNow = sessionService.getWhatNow(a.sessionId);
          return {
            content: [
              {
                type: 'text',
                text: whatNow.explanation,
              },
            ],
            structuredContent: {
              sessionId: a.sessionId,
              currentTask: whatNow.currentTask,
              remainingSeconds: whatNow.remainingSeconds,
              upcomingTasksCount: whatNow.upcomingTasks.length,
              applianceStatus: whatNow.applianceStatus,
              explanation: whatNow.explanation,
            },
          };
        }

        case 'complete_step': {
          if (!a.sessionId || !a.taskId) {
            throw new McpError(ErrorCode.InvalidParams, 'sessionId and taskId are required');
          }

          const res = sessionService.completeStep(
            a.sessionId,
            a.taskId,
            a.actualSeconds,
            a.expectedRevision
          );

          return {
            content: [
              {
                type: 'text',
                text: `Task "${a.taskId}" marked complete. ${res.nextTask ? `Next up: "${res.nextTask.label}".` : 'All tasks finished!'}`,
              },
            ],
            structuredContent: {
              sessionId: a.sessionId,
              completedTaskId: a.taskId,
              nextTask: res.nextTask,
              scheduleRevision: res.session.scheduleRevision,
            },
          };
        }

        case 'report_delay': {
          const delaySec = a.delaySeconds ?? a.deltaSeconds;
          if (!a.sessionId || !a.taskId || delaySec === undefined) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'sessionId, taskId, and delaySeconds (or deltaSeconds) are required'
            );
          }

          const proposal = sessionService.reportDelay(
            a.sessionId,
            a.taskId,
            Number(delaySec),
            a.explanation,
            a.expectedRevision
          );

          return {
            content: [
              {
                type: 'text',
                text: `Delay recovery calculated: ${proposal.explanation}`,
              },
            ],
            structuredContent: {
              proposalId: proposal.proposalId,
              sessionId: a.sessionId,
              baseRevision: proposal.baseRevision,
              newTLanding: proposal.projectedLandingTime,
              changes: proposal.changes,
              explanation: proposal.explanation,
              requiresConfirmation: true,
              ui: {
                screen: 'REPLAN_OVERLAY',
                projectedLanding: proposal.projectedLandingTime,
              },
            },
          };
        }

        case 'accept_replan': {
          if (!a.sessionId || !a.proposalId) {
            throw new McpError(ErrorCode.InvalidParams, 'sessionId and proposalId are required');
          }

          const updatedSession = sessionService.acceptReplan(
            a.sessionId,
            a.proposalId,
            a.expectedRevision
          );

          return {
            content: [
              {
                type: 'text',
                text: `Proposal ${a.proposalId} accepted. Dinner landing locked at ${updatedSession.actualLandingTime}.`,
              },
            ],
            structuredContent: {
              sessionId: a.sessionId,
              actualLandingTime: updatedSession.actualLandingTime,
              scheduleRevision: updatedSession.scheduleRevision,
            },
          };
        }

        case 'reject_replan': {
          if (!a.sessionId || !a.proposalId) {
            throw new McpError(ErrorCode.InvalidParams, 'sessionId and proposalId are required');
          }

          const updatedSession = sessionService.rejectReplan(a.sessionId, a.proposalId);
          return {
            content: [
              {
                type: 'text',
                text: `Proposal ${a.proposalId} rejected. Schedule remains unchanged.`,
              },
            ],
            structuredContent: {
              sessionId: a.sessionId,
              scheduleRevision: updatedSession.scheduleRevision,
            },
          };
        }

        case 'substitute': {
          const ing = a.ingredient || a.missingIngredient;
          if (!a.sessionId || !ing) {
            throw new McpError(ErrorCode.InvalidParams, 'sessionId and ingredient are required');
          }

          const subRes = sessionService.requestSubstitution(a.sessionId, ing, a.recipeId);
          return {
            content: [
              {
                type: 'text',
                text: `Substitution proposed for ${ing}: ${subRes.proposal.explanation}. Requires confirmation.`,
              },
            ],
            structuredContent: {
              proposalId: subRes.proposal.proposalId,
              sessionId: a.sessionId,
              missingIngredient: ing,
              substitution: subRes.substitution,
              durationChangeSeconds: subRes.proposal.durationChangeSeconds,
              projectedLandingTime: subRes.proposal.projectedLandingTime,
              explanation: subRes.proposal.explanation,
              requiresConfirmation: true,
            },
          };
        }

        case 'accept_substitution': {
          if (!a.sessionId || !a.proposalId) {
            throw new McpError(ErrorCode.InvalidParams, 'sessionId and proposalId are required');
          }

          const session = sessionService.acceptSubstitution(
            a.sessionId,
            a.proposalId,
            a.expectedRevision
          );

          return {
            content: [
              {
                type: 'text',
                text: `Substitution proposal ${a.proposalId} accepted and committed. Restock item saved.`,
              },
            ],
            structuredContent: {
              sessionId: a.sessionId,
              scheduleRevision: session.scheduleRevision,
              restockItems: session.restockItems,
            },
          };
        }

        case 'resume_plan': {
          if (!a.sessionId) {
            throw new McpError(ErrorCode.InvalidParams, 'sessionId is required');
          }

          const session = sessionService.getSession(a.sessionId);
          const whatNow = sessionService.getWhatNow(a.sessionId);

          return {
            content: [
              {
                type: 'text',
                text: `Session ${a.sessionId} resumed. Status: ${session.status}. Target landing: ${session.actualLandingTime || session.targetServingAt}.`,
              },
            ],
            structuredContent: {
              sessionId: session.sessionId,
              status: session.status,
              targetServingAt: session.targetServingAt,
              actualLandingTime: session.actualLandingTime,
              currentTask: whatNow.currentTask,
              tasks: session.tasks,
              currentSchedule: session.currentSchedule,
              pendingProposal: session.pendingProposal,
              scheduleRevision: session.scheduleRevision,
              restockItems: session.restockItems,
              platingChecklist: session.platingChecklist,
            },
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (err: any) {
      if (err instanceof McpError) throw err;
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error executing tool "${name}": ${err.message}`,
          },
        ],
      };
    }
  });

  return server;
}
