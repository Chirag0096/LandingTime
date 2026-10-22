import { z } from 'zod';
import type { SubstitutionRecord } from '../domain/types.ts';
import { GeminiClient } from '../adapters/geminiClient.ts';
import { SUBSTITUTION_CATALOG } from './catalog.ts';

export const AiSubstitutionOutputSchema = z.object({
  missingIngredient: z.string(),
  substituteName: z.string(),
  replacementIngredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.string(),
      unit: z.string(),
    })
  ),
  preparationChanges: z.string(),
  durationAdjustmentSeconds: z.number().int(),
  flavorMatchPercentage: z.number().int().min(50).max(100),
  textureNotes: z.string(),
  culinaryRationale: z.string(),
});

export class GeminiSubstitutionEngine {
  private client: GeminiClient;

  constructor() {
    this.client = GeminiClient.getInstance();
  }

  /**
   * Resolves a substitution:
   * 1. Check local catalog first (instant, 0ms)
   * 2. If missing, query Gemini AI dynamically
   */
  public async getOrGenerateSubstitution(
    missingIngredient: string,
    dishName = 'Current Dish',
    stepContext = 'Cooking step'
  ): Promise<SubstitutionRecord & { flavorMatchPercentage?: number; culinaryRationale?: string; source: string }> {
    const normalized = missingIngredient.trim().toLowerCase();

    // 1. Check existing static catalog
    const existing = SUBSTITUTION_CATALOG.find((s) =>
      s.missingIngredient.toLowerCase().includes(normalized) ||
      normalized.includes(s.missingIngredient.toLowerCase())
    );

    if (existing) {
      return {
        ...existing,
        flavorMatchPercentage: 98,
        culinaryRationale: 'Curated culinary catalog match',
        source: 'catalog_cached',
      };
    }

    // 2. Query Gemini AI dynamically
    if (this.client.isAvailable()) {
      try {
        const cacheKey = `sub_${normalized.replace(/\s+/g, '_')}_${dishName.slice(0, 20)}`;
        const prompt = `You are a master culinary scientist and recipe developer.
A cook is preparing the dish "${dishName}" and during the step "${stepContext}", they discovered they are MISSING the ingredient: "${missingIngredient}".

Recommend the SINGLE BEST pantry or common refrigerator substitute that preserves the dish's chemical balance, emulsification, and flavor profile.

CRITICAL REQUIREMENTS:
1. Provide exact replacement ingredients with measurements (e.g. "1/3 cup milk + 2 tbsp melted butter").
2. Detail the exact preparation adjustments (e.g. "whisk butter into pan drippings before adding milk").
3. Calculate the DURATION ADJUSTMENT IN SECONDS (can be positive for extra simmer/reduction, 0 for 1:1 swap, or negative if it cooks faster).
4. Estimate flavor match percentage (50-100%).
5. Provide texture notes and culinary rationale.

Respond ONLY with valid JSON in this exact shape:
{
  "missingIngredient": "${missingIngredient}",
  "substituteName": "Name of substitute",
  "replacementIngredients": [
    { "name": "Ingredient name", "quantity": "amount", "unit": "unit" }
  ],
  "preparationChanges": "Step by step adjustment guidance",
  "durationAdjustmentSeconds": 60,
  "flavorMatchPercentage": 95,
  "textureNotes": "Texture outcome",
  "culinaryRationale": "Why this works chemically and culinarily"
}`;

        const result = await this.client.generateJson<z.infer<typeof AiSubstitutionOutputSchema>>(prompt, cacheKey);
        const data = AiSubstitutionOutputSchema.parse(result.data);

        const record: SubstitutionRecord & { flavorMatchPercentage: number; culinaryRationale: string; source: string } = {
          id: `sub-ai-${Date.now()}`,
          missingIngredient: data.missingIngredient,
          replacementIngredients: data.replacementIngredients,
          compatibleRecipeIds: [],
          compatibleTaskIds: [],
          preparationChanges: data.preparationChanges,
          durationAdjustmentSeconds: data.durationAdjustmentSeconds,
          textureNotes: data.textureNotes,
          validationStatus: 'APPROVED',
          source: result.cached ? 'gemini_cache' : 'gemini_ai',
          flavorMatchPercentage: data.flavorMatchPercentage,
          culinaryRationale: data.culinaryRationale,
        };

        return record;
      } catch (err: any) {
        console.warn(`[GeminiSubstitutionEngine] AI substitution failed: ${err.message}. Falling back to default replacement.`);
      }
    }

    // Fallback if AI offline
    return {
      id: `sub-fallback-${Date.now()}`,
      missingIngredient,
      replacementIngredients: [{ name: 'Neutral Oil or Broth', quantity: '1', unit: 'equivalent ratio' }],
      compatibleRecipeIds: [],
      compatibleTaskIds: [],
      preparationChanges: 'Substitute with equal volume of neutral oil, butter, or stock. Adjust seasoning to taste.',
      durationAdjustmentSeconds: 0,
      textureNotes: 'Standard neutral pantry substitute',
      validationStatus: 'CANDIDATE',
      source: 'offline_fallback',
      flavorMatchPercentage: 80,
      culinaryRationale: 'Emergency pantry substitution',
    };
  }
}
