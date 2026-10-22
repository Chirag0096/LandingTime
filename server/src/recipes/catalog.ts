import type { Recipe, TaskNode } from '../domain/types.ts';

/**
 * Validated recipe catalog containing production-ready demo recipes
 * with fully qualified task dependency graphs (DAGs).
 */
export const RECIPE_CATALOG: Recipe[] = [
  {
    id: 'recipe-chicken',
    version: 1,
    name: 'Herb-Crusted Roast Chicken',
    category: 'MAIN COURSE',
    description: 'Whole 4.5 lb bird, herbed compound butter, garlic aromatic cavity pack.',
    servings: 4,
    totalMinutes: 75,
    activeMinutes: 15,
    thermalTemp: '425°F',
    appliance: 'SHARED OVEN (RACK 2)',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhYlJphmpyxnUVn8hDB7cRAnYhsGWGoF-bktmLCarORV_rN-bLN8i-ShN7e2MX_0M1GqUefz1xhWZC28pSIOQeCzFGeTez-YPY9rKdZ_gCxROgBFTnsN3FFqOecsSrsQXsA4gngwGTlpOZq1TPXGb1qItvg_-pHGf3VKvX-_8ZMGWMtpE-yca7-yhDwhKG3FfLnJCl4qPOgkKXOMwzmLUsD9-Wv4y6Pa9SDNrq_vJRvqEku-odqIC2',
    validationStatus: 'APPROVED',
    ingredients: [
      { name: 'Whole chicken', quantity: '4.5', unit: 'lb' },
      { name: 'Fresh rosemary', quantity: '2', unit: 'tbsp' },
      { name: 'Garlic cloves', quantity: '6', unit: 'cloves' },
      { name: 'Unsalted butter', quantity: '4', unit: 'tbsp' },
      { name: 'Kosher salt', quantity: '1.5', unit: 'tsp' },
      { name: 'Black pepper', quantity: '1', unit: 'tsp' },
    ],
    tasks: [
      {
        id: 'chk-prep',
        dishId: 'recipe-chicken',
        label: 'Truss & Butter Bird',
        instructions: 'Pat whole chicken dry with paper towels. Rub compound rosemary-garlic butter under the skin and truss tightly.',
        durationSeconds: 600,
        stepType: 'prep',
        resource: 'NONE',
        isActive: false,
        predecessors: [],
        status: 'PENDING',
      },
      {
        id: 'chk-roast',
        dishId: 'recipe-chicken',
        label: 'High-Heat Convection Roast',
        instructions: 'Transfer to center rack of 425°F oven. Roast for 45 minutes until skin is deeply golden and thigh probe registers 165°F.',
        durationSeconds: 2700,
        stepType: 'thermal',
        resource: 'OVEN',
        temperatureF: 425,
        isActive: false,
        predecessors: ['chk-prep'],
        status: 'PENDING',
      },
      {
        id: 'chk-rest',
        dishId: 'recipe-chicken',
        label: 'Rest & Reserve Pan Juices',
        instructions: 'Transfer bird to warm cutting board to rest for 10-15 minutes. Pour golden pan drippings directly into stovetop gravy pan.',
        durationSeconds: 900,
        stepType: 'rest',
        resource: 'NONE',
        isActive: false,
        predecessors: ['chk-roast'],
        constraints: {
          minRestSeconds: 600,
          canCompressRest: true,
          compressedMinSeconds: 600,
        },
        status: 'PENDING',
      },
      {
        id: 'chk-carve',
        dishId: 'recipe-chicken',
        label: 'Carve & Platter',
        instructions: 'Carve breast meat into 1/2-inch diagonal slices and separate thighs and drumsticks. Arrange onto warm platter.',
        durationSeconds: 300,
        stepType: 'active-hands',
        resource: 'NONE',
        isActive: true,
        predecessors: ['chk-rest'],
        status: 'PENDING',
      },
    ],
  },
  {
    id: 'recipe-potatoes',
    version: 1,
    name: 'Crispy Smashed Potatoes',
    category: 'SIDE',
    description: 'Parboiled baby yukons, smashed flat, crisped under high ambient heat.',
    servings: 4,
    totalMinutes: 50,
    activeMinutes: 5,
    thermalTemp: 'Shared Oven 25m @ 425°F',
    appliance: 'STOVETOP + OVEN',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQUb3rjK-CS4oDLRlhMx5pRlmvmu7BeUWM7ewwJELQ-Qy_ggXxhwVJdezQYDSDAID2qTdMwg_J2v6-iXnboofoAf-c-FBGkVnwDKKEB0rpjX_-s8PHARHIv_lDPwze_9mLGdha2ynrCFTeSScjlkjkedzvIcP6YMA42vXQBM50m5CdSbN5v-WJ_VPIgG3WSmtd6K8a8OMyXjnUIjExyFlh2mLjxuAeNy2D5RQMOM1vYICVjjzYVJxl',
    validationStatus: 'APPROVED',
    ingredients: [
      { name: 'Baby Yukon Gold potatoes', quantity: '1.5', unit: 'lb' },
      { name: 'Extra virgin olive oil', quantity: '3', unit: 'tbsp' },
      { name: 'Garlic salt', quantity: '1', unit: 'tsp' },
      { name: 'Fresh rosemary (chopped)', quantity: '1', unit: 'tbsp' },
      { name: 'Flaky sea salt (Maldon)', quantity: '1', unit: 'tsp' },
    ],
    tasks: [
      {
        id: 'pot-boil',
        dishId: 'recipe-potatoes',
        label: 'Parboil Baby Yukons',
        instructions: 'Boil potatoes in salted water on Burner #1 until easily pierced with a paring knife (15m). Drain thoroughly.',
        durationSeconds: 900,
        stepType: 'stovetop',
        resource: 'BURNER_1',
        isActive: false,
        predecessors: [],
        status: 'PENDING',
      },
      {
        id: 'pot-smash',
        dishId: 'recipe-potatoes',
        label: 'Smash & Season',
        instructions: 'Transfer drained potatoes to sheet pan. Gently crush each potato to about 1/2-inch thick. Drizzle generously with olive oil, garlic salt, and rosemary.',
        durationSeconds: 300,
        stepType: 'active-hands',
        resource: 'NONE',
        isActive: true,
        predecessors: ['pot-boil'],
        status: 'PENDING',
      },
      {
        id: 'pot-bake',
        dishId: 'recipe-potatoes',
        label: 'Shared Oven Roast Top Rack',
        instructions: 'Slide sheet pan onto top rack at 425°F alongside roasting chicken. Roast for 25 minutes until edges are deeply crisped.',
        durationSeconds: 1500,
        stepType: 'thermal',
        resource: 'OVEN',
        temperatureF: 425,
        isActive: false,
        predecessors: ['pot-smash'],
        status: 'PENDING',
      },
      {
        id: 'pot-hold',
        dishId: 'recipe-potatoes',
        label: 'Flaky Salt Finish & Warm Hold',
        instructions: 'Remove, sprinkle with flaky sea salt and chives. Hold on ventilated rack until serving.',
        durationSeconds: 300,
        stepType: 'rest',
        resource: 'NONE',
        isActive: false,
        predecessors: ['pot-bake'],
        constraints: {
          maxHoldSeconds: 1800,
        },
        status: 'PENDING',
      },
    ],
  },
  {
    id: 'recipe-asparagus-gravy',
    version: 1,
    name: 'Sautéed Asparagus & Pan Gravy',
    category: 'SIDE + SAUCE',
    description: 'Quick high-heat blistered spears plus rich skillet pan dripping deglaze.',
    servings: 4,
    totalMinutes: 16,
    activeMinutes: 12,
    thermalTemp: 'Medium-High Flame',
    appliance: 'STOVETOP (BURNER 1 & 2)',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcEdHGf8olxrjDJq97WjQBxN8ppCRaf4RNinf0gkuavl-oRjQwUwARwa0rXIA8aejtKLqvE4iQp10SYpYf8iQBnwtDMCMMgqDn6BjHGx-Z9CQMJSMryViYNjbPH7y2rwLFpVMnlPgVxNxbTucSSDsUYUJBd849wD_qeeVrUOguWK-C7BRgsPTE0p3fQrOxhtuFc3YQD8qG_VEWyG6NS-5S-AbjqTLw5H_ZsHwDDe8tpaVqBryE4nyj',
    validationStatus: 'APPROVED',
    ingredients: [
      { name: 'Fresh asparagus spears', quantity: '1', unit: 'bunch' },
      { name: 'Dry white wine', quantity: '0.25', unit: 'cup' },
      { name: 'Heavy cream', quantity: '0.25', unit: 'cup' },
      { name: 'Butter', quantity: '2', unit: 'tbsp' },
      { name: 'Chicken stock', quantity: '0.5', unit: 'cup' },
      { name: 'Shallots (minced)', quantity: '1', unit: 'shallot' },
      { name: 'Fresh lemon zest & juice', quantity: '0.5', unit: 'lemon' },
    ],
    tasks: [
      {
        id: 'asp-prep',
        dishId: 'recipe-asparagus-gravy',
        label: 'Trim & Simmer Gravy Base',
        instructions: 'Trim woody ends of asparagus spears. In a small saucepan over medium heat (Burner #2), warm aromatics and stock.',
        durationSeconds: 240,
        stepType: 'prep',
        resource: 'BURNER_2',
        isActive: false,
        predecessors: [],
        status: 'PENDING',
      },
      {
        id: 'asp-saute',
        dishId: 'recipe-asparagus-gravy',
        label: 'Blister Asparagus in Skillet',
        instructions: 'Heat cast iron on Burner #1 over high flame. Sear spears for 6 minutes with lemon zest until bright green and charred in spots.',
        durationSeconds: 360,
        stepType: 'stovetop',
        resource: 'BURNER_1',
        isActive: true,
        predecessors: ['asp-prep'],
        status: 'PENDING',
      },
      {
        id: 'asp-gravy',
        dishId: 'recipe-asparagus-gravy',
        label: 'Whisk Pan Gravy & Deglaze',
        instructions: 'Deglaze chicken skillet with white wine, whisk in heavy cream and butter emulsion, and reduce for 6 minutes until glossy.',
        durationSeconds: 360,
        stepType: 'active-hands',
        resource: 'BURNER_2',
        isActive: true,
        // Cross-dish dependency: requires roasted chicken rest drippings (chk-rest)
        predecessors: ['asp-saute', 'chk-rest'],
        status: 'PENDING',
      },
    ],
  },
];

/**
 * Finds a single recipe by unique identifier
 */
export function getRecipeById(id: string): Recipe | undefined {
  return RECIPE_CATALOG.find(recipe => recipe.id === id);
}

/**
 * Finds multiple recipes by their IDs
 */
export function getRecipesByIds(ids: string[]): Recipe[] {
  const idSet = new Set(ids);
  return RECIPE_CATALOG.filter(recipe => idSet.has(recipe.id));
}

/**
 * Merges tasks from all selected recipes into a unified DAG.
 * Preserves cross-dish dependencies when both source dishes are in the selection,
 * and prunes unreachable prerequisite references when a dish is omitted.
 */
export function buildCombinedTaskGraph(recipeIds: string[]): TaskNode[] {
  const selectedRecipes = getRecipesByIds(recipeIds);
  
  // Clone all tasks from selected recipes
  const allTasks: TaskNode[] = [];
  for (const recipe of selectedRecipes) {
    for (const task of recipe.tasks) {
      allTasks.push({
        ...task,
        constraints: task.constraints ? { ...task.constraints } : undefined,
        predecessors: [...task.predecessors],
      });
    }
  }

  const validTaskIds = new Set(allTasks.map(t => t.id));

  // Prune predecessors that point to unselected recipes while keeping valid cross-dish dependencies
  return allTasks.map(task => ({
    ...task,
    predecessors: task.predecessors.filter(predId => validTaskIds.has(predId)),
  }));
}
