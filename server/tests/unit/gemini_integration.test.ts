import { describe, it, expect } from 'vitest';
import { GeminiRecipeParser } from '../../src/adapters/geminiParser.ts';
import { GeminiSubstitutionEngine } from '../../src/substitutions/geminiSubstitutions.ts';
import { validateTaskGraph } from '../../src/domain/validation.ts';

describe('Gemini AI Dynamic Integrations', () => {
  const parser = new GeminiRecipeParser();
  const subEngine = new GeminiSubstitutionEngine();

  it('parses unstructured recipe text into a valid Directed Acyclic Graph (DAG)', async () => {
    const rawRecipe = `
Honey Glazed Roasted Carrots
1. Wash, peel, and cut 1 lb carrots into uniform batons (5 mins).
2. Toss with olive oil, salt, and thyme in mixing bowl (3 mins).
3. Roast on baking sheet at 400°F oven for 20 minutes until tender.
4. Drizzle with honey and roast 5 more minutes until caramelized.
5. Garnish with chopped parsley and serve immediately.
`;

    const result = await parser.parseRecipe('recipe-carrots', rawRecipe);
    expect(result.success).toBe(true);
    expect(result.tasks).toBeDefined();
    expect(result.tasks!.length).toBeGreaterThanOrEqual(3);

    // Validate DAG topology (Kahn's algorithm)
    const validation = validateTaskGraph(result.tasks!);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Verify task attributes
    for (const task of result.tasks!) {
      expect(task.dishId).toBe('recipe-carrots');
      expect(task.durationSeconds).toBeGreaterThan(0);
      expect(['OVEN', 'BURNER_1', 'BURNER_2', 'BURNER_3', 'BURNER_4', 'NONE']).toContain(task.resource);
    }
  }, 30000);

  it('generates a culinary chemistry substitution for an uncataloged ingredient', async () => {
    const missing = 'Shaoxing Rice Wine';
    const result = await subEngine.getOrGenerateSubstitution(
      missing,
      'Braised Pork Belly',
      'Deglaze skillet'
    );

    expect(result).toBeDefined();
    expect(result.missingIngredient.toLowerCase()).toContain('shaoxing');
    expect(result.replacementIngredients.length).toBeGreaterThan(0);
    expect(typeof result.durationAdjustmentSeconds).toBe('number');
    expect(result.preparationChanges.length).toBeGreaterThan(10);
    expect(result.flavorMatchPercentage).toBeGreaterThanOrEqual(50);
  }, 30000);

  it('handles curated catalog hits with 0ms latency and high accuracy', async () => {
    const result = await subEngine.getOrGenerateSubstitution('heavy cream', 'Pan Gravy', 'Reduction');
    expect(result.source).toBe('catalog_cached');
    expect(result.durationAdjustmentSeconds).toBe(120);
    expect(result.replacementIngredients[0].name.toLowerCase()).toContain('milk');
  });
});
