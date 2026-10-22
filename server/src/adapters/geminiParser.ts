import { z } from 'zod';
import type { TaskNode, ResourceType } from '../domain/types.ts';
import { validateTaskGraph } from '../domain/validation.ts';
import { GeminiClient } from './geminiClient.ts';

export const RecipeStepSchema = z.object({
  id: z.string().min(1),
  label: z.string().max(80),
  instructions: z.string(),
  dNom: z.number().int().positive(),
  dMin: z.number().int().positive().optional(),
  dMax: z.number().int().positive().optional(),
  isActive: z.boolean(),
  resource: z.enum(['OVEN', 'BURNER_1', 'BURNER_2', 'BURNER_3', 'BURNER_4', 'NONE']),
  tempSetF: z.number().nullable().optional(),
  predecessors: z.array(z.string()).default([]),
  stepType: z.enum(['prep', 'active-hands', 'thermal', 'rest', 'stovetop', 'holding']).default('prep'),
});

export const ParsedRecipeSchema = z.object({
  dishName: z.string(),
  description: z.string(),
  totalMinutes: z.number().int().positive(),
  activeMinutes: z.number().int().nonnegative(),
  servings: z.number().int().positive().default(4),
  steps: z.array(RecipeStepSchema),
});

export interface GeminiRecipeParseResult {
  success: boolean;
  dishName?: string;
  description?: string;
  totalMinutes?: number;
  activeMinutes?: number;
  servings?: number;
  tasks?: TaskNode[];
  error?: string;
  source: 'gemini' | 'cache' | 'offline_heuristic';
  modelUsed?: string;
}

export class GeminiRecipeParser {
  private client: GeminiClient;

  constructor() {
    this.client = GeminiClient.getInstance();
  }

  public async parseRecipe(dishId: string, recipeText: string): Promise<GeminiRecipeParseResult> {
    const cacheKey = `recipe_parse_${dishId}_${recipeText.slice(0, 100).replace(/\s+/g, '_')}`;

    if (this.client.isAvailable()) {
      try {
        const prompt = `You are an expert culinary operations engineer and scheduling algorithm specialist.
Analyze the following unstructured recipe text and convert it into a strictly ordered Directed Acyclic Graph (DAG) for kitchen scheduling.

RULES FOR THE TASK GRAPH:
1. Break down the recipe into atomic, chronological cooking steps.
2. Step IDs must be short, lowercase alphanumeric, and unique with prefix "${dishId}-" (e.g. "${dishId}-prep", "${dishId}-sear").
3. Each step MUST declare:
   - "id": unique string
   - "label": short, punchy title (max 50 chars)
   - "instructions": clear 1-2 sentence culinary guidance
   - "dNom": estimated nominal duration in SECONDS
   - "dMin": safe minimum duration in SECONDS (food safety floor)
   - "dMax": safe maximum duration before degradation
   - "isActive": true if the cook must be hands-on (chopping, whisking, searing), false if passive (resting, baking)
   - "resource": one of "OVEN", "BURNER_1", "BURNER_2", "BURNER_3", "BURNER_4", "NONE"
   - "tempSetF": oven temperature in °F if resource is OVEN, otherwise null
   - "predecessors": array of step IDs that must finish immediately before this step starts
   - "stepType": one of "prep", "active-hands", "thermal", "rest", "stovetop", "holding"
4. PREDECESSORS MUST FORM A VALID DIRECTED ACYCLIC GRAPH (NO CYCLES). The first step has empty predecessors []. Subsequent steps reference prior step IDs.
5. Identify the Dish Name, Description, Total Minutes, Active Minutes, and Servings.

Output ONLY a JSON object with this exact shape:
{
  "dishName": "Dish Name",
  "description": "Short culinary summary",
  "totalMinutes": 45,
  "activeMinutes": 15,
  "servings": 4,
  "steps": [ ... ]
}

RECIPE TEXT TO PARSE:
${recipeText}`;

        const result = await this.client.generateJson<z.infer<typeof ParsedRecipeSchema>>(prompt, cacheKey);
        const validated = ParsedRecipeSchema.parse(result.data);

        // Convert to domain TaskNodes
        const tasks: TaskNode[] = validated.steps.map((s) => ({
          id: s.id,
          dishId,
          label: s.label,
          instructions: s.instructions,
          durationSeconds: s.dNom,
          minDurationSeconds: s.dMin,
          maxDurationSeconds: s.dMax,
          isActive: s.isActive,
          resource: s.resource as ResourceType,
          temperatureF: s.tempSetF || undefined,
          predecessors: s.predecessors,
          status: 'PENDING',
          stepType: s.stepType,
        }));

        // Validate graph topology (Kahn's cycle detection)
        const graphValidation = validateTaskGraph(tasks);
        if (!graphValidation.valid) {
          throw new Error(`DAG topology validation failed: ${graphValidation.errors.map((e) => e.message).join('; ')}`);
        }

        return {
          success: true,
          dishName: validated.dishName,
          description: validated.description,
          totalMinutes: validated.totalMinutes,
          activeMinutes: validated.activeMinutes,
          servings: validated.servings,
          tasks,
          source: result.cached ? 'cache' : 'gemini',
          modelUsed: result.model,
        };
      } catch (err: any) {
        console.warn(`[GeminiRecipeParser] Live AI parse failed: ${err.message}. Falling back to deterministic offline parser.`);
      }
    }

    // Deterministic Offline Heuristic Fallback
    return this.fallbackOfflineParse(dishId, recipeText);
  }

  private fallbackOfflineParse(dishId: string, recipeText: string): GeminiRecipeParseResult {
    const lines = recipeText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 5);

    const steps: TaskNode[] = lines.map((line, idx) => {
      const stepId = `${dishId}-step-${idx + 1}`;
      const isOven = /oven|bake|roast|425|375|350/i.test(line);
      const isStove = /boil|simmer|sauté|sear|skillet|pan/i.test(line);
      const isActive = /chop|truss|rub|whisk|carve|stir|season|smash/i.test(line);

      let resource: ResourceType = 'NONE';
      let tempSetF: number | undefined = undefined;

      if (isOven) {
        resource = 'OVEN';
        tempSetF = 425;
      } else if (isStove) {
        resource = idx % 2 === 0 ? 'BURNER_1' : 'BURNER_2';
      }

      return {
        id: stepId,
        dishId,
        label: line.slice(0, 50),
        instructions: line,
        durationSeconds: isOven ? 2400 : isActive ? 300 : 600,
        minDurationSeconds: isOven ? 1800 : 300,
        maxDurationSeconds: isOven ? 3600 : 900,
        isActive,
        resource,
        temperatureF: tempSetF,
        predecessors: idx > 0 ? [`${dishId}-step-${idx}`] : [],
        status: 'PENDING',
        stepType: isOven ? 'thermal' : isStove ? 'stovetop' : isActive ? 'active-hands' : 'prep',
      };
    });

    return {
      success: true,
      dishName: lines[0]?.slice(0, 40) || 'Custom Dish',
      description: 'Parsed using offline heuristic algorithm',
      totalMinutes: Math.round(steps.reduce((acc, s) => acc + s.durationSeconds, 0) / 60),
      activeMinutes: Math.round(steps.filter((s) => s.isActive).reduce((acc, s) => acc + s.durationSeconds, 0) / 60),
      servings: 4,
      tasks: steps,
      source: 'offline_heuristic',
      modelUsed: 'heuristic-rules',
    };
  }
}
