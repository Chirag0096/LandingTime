import type { SubstitutionRecord } from '../domain/types.ts';

/**
 * Validated culinary substitutions catalog for missing pantry ingredients.
 */
export const SUBSTITUTION_CATALOG: SubstitutionRecord[] = [
  {
    id: 'sub-milk-butter',
    missingIngredient: 'heavy cream',
    replacementIngredients: [
      { name: 'Whole Milk', quantity: '0.75', unit: 'cup' },
      { name: 'Melted Unsalted Butter', quantity: '0.25', unit: 'cup' },
    ],
    compatibleRecipeIds: ['recipe-asparagus-gravy'],
    compatibleTaskIds: ['asp-gravy'],
    preparationChanges: 'Melt butter gently and whisk into whole milk to create a stable emulsion before incorporating into pan drippings. Simmer 2 minutes longer (+120s) to reduce to proper nappe consistency.',
    durationAdjustmentSeconds: 120,
    textureNotes: 'Rich and glossy body closely matching heavy cream once reduced.',
    dietaryNotes: 'Contains dairy; gluten-free.',
    validationStatus: 'APPROVED',
    source: 'Escoffier Ratio Compendium & Kitchen Testing',
  },
  {
    id: 'sub-evaporated-milk',
    missingIngredient: 'heavy cream',
    replacementIngredients: [
      { name: 'Evaporated Milk', quantity: '1', unit: 'cup' },
    ],
    compatibleRecipeIds: ['recipe-asparagus-gravy'],
    compatibleTaskIds: ['asp-gravy'],
    preparationChanges: 'Pour evaporated milk directly into pan deglaze 1:1. Whisk steadily over medium heat; requires standard reduction time with zero schedule delay.',
    durationAdjustmentSeconds: 0,
    textureNotes: 'Slightly lighter viscosity with subtle toasted dairy notes that complement roast drippings.',
    dietaryNotes: 'Contains dairy; lower fat content than heavy cream.',
    validationStatus: 'APPROVED',
    source: 'USDA Food Safety & Culinary Science Standards',
  },
  {
    id: 'sub-greek-yogurt',
    missingIngredient: 'heavy cream',
    replacementIngredients: [
      { name: 'Plain Whole Milk Greek Yogurt', quantity: '0.5', unit: 'cup' },
      { name: 'Water', quantity: '0.5', unit: 'cup' },
    ],
    compatibleRecipeIds: ['recipe-asparagus-gravy'],
    compatibleTaskIds: ['asp-gravy'],
    preparationChanges: 'Whisk Greek yogurt with water until completely smooth. Remove pan from direct flame before folding in to prevent curdling, finishing 2 minutes faster (-120s).',
    durationAdjustmentSeconds: -120,
    textureNotes: 'Pleasant light acidity and creamy velvety finish.',
    dietaryNotes: 'Contains dairy; high protein, reduced total fat.',
    validationStatus: 'APPROVED',
    source: 'Modern Kitchen Pantry Substitution Guide',
  },
];

/**
 * Searches for a compatible culinary substitution by missing ingredient name
 * and optional target recipe ID.
 */
export function findSubstitution(ingredient: string, recipeId?: string): SubstitutionRecord | undefined {
  const normalized = ingredient.trim().toLowerCase();
  return SUBSTITUTION_CATALOG.find(sub => {
    const matchesIngredient = sub.missingIngredient.toLowerCase() === normalized ||
      sub.missingIngredient.toLowerCase().includes(normalized) ||
      normalized.includes(sub.missingIngredient.toLowerCase());
    
    if (!matchesIngredient) return false;
    if (recipeId && !sub.compatibleRecipeIds.includes(recipeId)) return false;
    return true;
  });
}
