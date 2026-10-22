/**
 * Typed API client for Landing Time kitchen orchestration backend.
 * Connects React frontend components to /api/v1 endpoints with robust error handling and fallback.
 */

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.error) errorMessage = errorJson.error;
    } catch {}
    throw new Error(errorMessage);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  // Health
  checkHealth: () => request<{ status: string; service: string }>('/health'),

  // Catalog
  getRecipes: () => request<{ recipes: any[] }>('/recipes'),
  getSubstitutions: () => request<{ substitutions: any[] }>('/substitutions'),

  // Sessions
  createSession: (payload: {
    dishIds: string[];
    targetServingAt: string;
    householdSize?: number;
    timezone?: string;
  }) =>
    request<{ session: any; scheduleResult: any }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSession: (sessionId: string) => request<any>(`/sessions/${sessionId}`),

  startCooking: (sessionId: string) =>
    request<any>(`/sessions/${sessionId}/start`, { method: 'POST' }),

  completeStep: (sessionId: string, taskId: string, actualSeconds?: number, expectedRevision?: number) =>
    request<{ session: any; nextTask?: any; updatedSchedule: any[] }>(
      `/sessions/${sessionId}/tasks/${taskId}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ actualSeconds, expectedRevision }),
      }
    ),

  reportDelay: (
    sessionId: string,
    taskId: string,
    delaySeconds: number,
    explanation?: string,
    expectedRevision?: number
  ) =>
    request<any>(`/sessions/${sessionId}/delays`, {
      method: 'POST',
      body: JSON.stringify({ taskId, delaySeconds, explanation, expectedRevision }),
    }),

  acceptReplan: (sessionId: string, proposalId: string, expectedRevision?: number) =>
    request<any>(`/sessions/${sessionId}/replans/${proposalId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ expectedRevision }),
    }),

  rejectReplan: (sessionId: string, proposalId: string) =>
    request<any>(`/sessions/${sessionId}/replans/${proposalId}/reject`, {
      method: 'POST',
    }),

  requestSubstitution: (sessionId: string, ingredient: string, recipeId?: string) =>
    request<{ proposal: any; substitution: any }>(`/sessions/${sessionId}/substitutions`, {
      method: 'POST',
      body: JSON.stringify({ ingredient, recipeId }),
    }),

  acceptSubstitution: (sessionId: string, proposalId: string, expectedRevision?: number) =>
    request<any>(`/sessions/${sessionId}/substitutions/${proposalId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ expectedRevision }),
    }),

  getWhatNow: (sessionId: string) => request<any>(`/sessions/${sessionId}/what-now`),

  resumeSession: (sessionId: string) =>
    request<{ session: any; whatNow: any }>(`/sessions/${sessionId}/resume`, {
      method: 'POST',
    }),

  togglePlatingItem: (sessionId: string, itemId: string) =>
    request<any[]>(`/sessions/${sessionId}/plating/${itemId}`, {
      method: 'PATCH',
    }),

  getRestockItems: (sessionId: string) => request<any[]>(`/sessions/${sessionId}/restock`),

  addRestockItem: (sessionId: string, name: string, note?: string) =>
    request<any[]>(`/sessions/${sessionId}/restock`, {
      method: 'POST',
      body: JSON.stringify({ name, note }),
    }),

  finishSession: (sessionId: string) =>
    request<any>(`/sessions/${sessionId}/finish`, {
      method: 'POST',
    }),

  // Dynamic Gemini AI methods
  parseRecipeWithAi: (recipeText: string, dishId?: string) =>
    request<{
      success: boolean;
      dishName?: string;
      description?: string;
      totalMinutes?: number;
      activeMinutes?: number;
      servings?: number;
      tasks?: any[];
      error?: string;
      source: string;
      modelUsed?: string;
    }>('/recipes/parse', {
      method: 'POST',
      body: JSON.stringify({ recipeText, dishId }),
    }),

  generateAiSubstitution: (missingIngredient: string, dishName?: string, stepContext?: string) =>
    request<{
      id: string;
      missingIngredient: string;
      replacementIngredients: { name: string; quantity: string; unit: string }[];
      preparationChanges: string;
      durationAdjustmentSeconds: number;
      flavorMatchPercentage?: number;
      textureNotes: string;
      culinaryRationale?: string;
      source: string;
    }>('/substitutions/generate', {
      method: 'POST',
      body: JSON.stringify({ missingIngredient, dishName, stepContext }),
    }),
};
