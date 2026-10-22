import { Router } from 'express';
import type { Request, Response } from 'express';
import type { CookingSessionService } from '../sessions/service.ts';
import { RECIPE_CATALOG } from '../recipes/catalog.ts';
import { SUBSTITUTION_CATALOG } from '../substitutions/catalog.ts';
import { GeminiRecipeParser } from '../adapters/geminiParser.ts';
import { GeminiSubstitutionEngine } from '../substitutions/geminiSubstitutions.ts';

export function createApiRouter(sessionService: CookingSessionService): Router {
  const router = Router();
  const recipeParser = new GeminiRecipeParser();
  const substitutionEngine = new GeminiSubstitutionEngine();

  // Health check
  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'landing-time-engine',
      version: '1.0.0',
      aiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    });
  });

  // Recipes catalog
  router.get('/recipes', (_req: Request, res: Response) => {
    res.json({
      recipes: RECIPE_CATALOG,
    });
  });

  // Parse arbitrary recipe with Gemini AI
  router.post('/recipes/parse', async (req: Request, res: Response) => {
    try {
      const { dishId, recipeText } = req.body || {};
      if (!recipeText) {
        return res.status(400).json({ error: 'recipeText is required' });
      }
      const id = dishId || `custom-${Date.now()}`;
      const result = await recipeParser.parseRecipe(id, recipeText);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Substitutions catalog
  router.get('/substitutions', (_req: Request, res: Response) => {
    res.json({
      substitutions: SUBSTITUTION_CATALOG,
    });
  });

  // Dynamic AI culinary substitution generator
  router.post('/substitutions/generate', async (req: Request, res: Response) => {
    try {
      const { missingIngredient, dishName, stepContext } = req.body || {};
      if (!missingIngredient) {
        return res.status(400).json({ error: 'missingIngredient is required' });
      }
      const result = await substitutionEngine.getOrGenerateSubstitution(
        missingIngredient,
        dishName,
        stepContext
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create session
  router.post('/sessions', (req: Request, res: Response) => {
    try {
      const { dishIds, targetServingAt, householdSize, timezone } = req.body;
      const result = sessionService.createSession({
        dishIds: dishIds || [],
        targetServingAt: targetServingAt || new Date().toISOString(),
        householdSize,
        timezone,
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get session
  router.get('/sessions/:sessionId', (req: Request, res: Response) => {
    try {
      const session = sessionService.getSession(req.params.sessionId);
      res.json(session);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  // Start live cooking
  router.post('/sessions/:sessionId/start', (req: Request, res: Response) => {
    try {
      const session = sessionService.startCooking(req.params.sessionId);
      res.json(session);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Complete step
  router.post('/sessions/:sessionId/tasks/:taskId/complete', (req: Request, res: Response) => {
    try {
      const { actualSeconds, expectedRevision } = req.body || {};
      const result = sessionService.completeStep(
        req.params.sessionId,
        req.params.taskId,
        actualSeconds,
        expectedRevision
      );
      res.json(result);
    } catch (err: any) {
      const status = err.message.includes('conflict') ? 409 : 400;
      res.status(status).json({ error: err.message });
    }
  });

  // Report delay
  router.post('/sessions/:sessionId/delays', (req: Request, res: Response) => {
    try {
      const { taskId, delaySeconds, deltaSeconds, explanation, expectedRevision } = req.body || {};
      const delay = delaySeconds ?? deltaSeconds;
      if (!taskId || delay === undefined) {
        return res.status(400).json({ error: 'taskId and delaySeconds are required' });
      }
      const proposal = sessionService.reportDelay(
        req.params.sessionId,
        taskId,
        Number(delay),
        explanation,
        expectedRevision
      );
      res.json(proposal);
    } catch (err: any) {
      const status = err.message.includes('Stale') ? 409 : 400;
      res.status(status).json({ error: err.message });
    }
  });

  // Accept replan proposal
  router.post('/sessions/:sessionId/replans/:proposalId/accept', (req: Request, res: Response) => {
    try {
      const { expectedRevision } = req.body || {};
      const session = sessionService.acceptReplan(
        req.params.sessionId,
        req.params.proposalId,
        expectedRevision
      );
      res.json(session);
    } catch (err: any) {
      const status = err.message.includes('evolved') || err.message.includes('revision') ? 409 : 400;
      res.status(status).json({ error: err.message });
    }
  });

  // Reject replan proposal
  router.post('/sessions/:sessionId/replans/:proposalId/reject', (req: Request, res: Response) => {
    try {
      const session = sessionService.rejectReplan(req.params.sessionId, req.params.proposalId);
      res.json(session);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Request substitution
  router.post('/sessions/:sessionId/substitutions', (req: Request, res: Response) => {
    try {
      const { ingredient, missingIngredient, recipeId } = req.body || {};
      const targetIng = ingredient || missingIngredient;
      if (!targetIng) {
        return res.status(400).json({ error: 'ingredient is required' });
      }
      const result = sessionService.requestSubstitution(req.params.sessionId, targetIng, recipeId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Accept substitution
  router.post(
    '/sessions/:sessionId/substitutions/:proposalId/accept',
    (req: Request, res: Response) => {
      try {
        const { expectedRevision } = req.body || {};
        const session = sessionService.acceptSubstitution(
          req.params.sessionId,
          req.params.proposalId,
          expectedRevision
        );
        res.json(session);
      } catch (err: any) {
        const status = err.message.includes('revision') ? 409 : 400;
        res.status(status).json({ error: err.message });
      }
    }
  );

  // What now
  router.get('/sessions/:sessionId/what-now', (req: Request, res: Response) => {
    try {
      const result = sessionService.getWhatNow(req.params.sessionId);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  // Resume session
  router.post('/sessions/:sessionId/resume', (req: Request, res: Response) => {
    try {
      const session = sessionService.getSession(req.params.sessionId);
      const whatNow = sessionService.getWhatNow(req.params.sessionId);
      res.json({ session, whatNow });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  // Toggle plating item
  router.patch('/sessions/:sessionId/plating/:itemId', (req: Request, res: Response) => {
    try {
      const session = sessionService.togglePlatingItem(req.params.sessionId, req.params.itemId);
      res.json(session.platingChecklist);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Add restock item
  router.post('/sessions/:sessionId/restock', (req: Request, res: Response) => {
    try {
      const { name, note } = req.body || {};
      if (!name) return res.status(400).json({ error: 'name is required' });
      const session = sessionService.addRestockItem(req.params.sessionId, name, note);
      res.json(session.restockItems);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get restock items
  router.get('/sessions/:sessionId/restock', (req: Request, res: Response) => {
    try {
      const session = sessionService.getSession(req.params.sessionId);
      res.json(session.restockItems);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  // Finish session
  router.post('/sessions/:sessionId/finish', (req: Request, res: Response) => {
    try {
      const session = sessionService.finishSession(req.params.sessionId);
      res.json(session);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
