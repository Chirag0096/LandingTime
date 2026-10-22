// Resource types for kitchen equipment
export type ResourceType = 'OVEN' | 'BURNER_1' | 'BURNER_2' | 'BURNER_3' | 'BURNER_4' | 'NONE';

// Task status
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

// Session status
export type SessionStatus = 'PLANNING' | 'LIVE' | 'PAUSED' | 'COMPLETE';

// Proposal status
export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'STALE';

// Feasibility status
export type FeasibilityStatus = 'FEASIBLE' | 'FEASIBLE_LATE' | 'INFEASIBLE';

// Event types for session history
export type SessionEventType = 
  | 'SESSION_CREATED'
  | 'PLAN_GENERATED'
  | 'COOKING_STARTED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'DELAY_REPORTED'
  | 'PROPOSAL_GENERATED'
  | 'PROPOSAL_ACCEPTED'
  | 'PROPOSAL_REJECTED'
  | 'SUBSTITUTION_PROPOSED'
  | 'SUBSTITUTION_ACCEPTED'
  | 'RESTOCK_ITEM_ADDED'
  | 'SESSION_COMPLETED'
  | 'SESSION_PAUSED'
  | 'SESSION_RESUMED';

// Ingredient for recipes
export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  optional?: boolean;
}

// Task node in the cooking DAG
export interface TaskNode {
  id: string;
  dishId: string;
  label: string;
  instructions: string;
  durationSeconds: number;
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
  isActive: boolean; // requires cook's attention
  resource: ResourceType;
  temperatureF?: number;
  predecessors: string[]; // task IDs
  status: TaskStatus;
  startedAt?: string; // ISO 8601
  completedAt?: string; // ISO 8601
  actualDurationSeconds?: number;
  stepType: 'prep' | 'active-hands' | 'thermal' | 'rest' | 'stovetop' | 'holding';
  constraints?: {
    minRestSeconds?: number;
    maxHoldSeconds?: number;
    canCompressRest?: boolean;
    compressedMinSeconds?: number;
  };
}

// Scheduled task extends TaskNode with computed schedule fields
export interface ScheduledTask {
  taskId: string;
  dishId: string;
  label: string;
  // Computed schedule fields
  earliestStart: number;  // seconds from plan start
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  totalFloat: number; // slack in seconds
  scheduledStart: number; // seconds from plan start
  scheduledFinish: number;
  assignedResource: ResourceType;
  isCriticalPath: boolean;
  feasible: boolean;
  scheduleRevision: number;
  shiftReason?: string;
}

// Recipe definition
export interface Recipe {
  id: string;
  version: number;
  name: string;
  description: string;
  servings: number;
  category: string;
  ingredients: Ingredient[];
  tasks: TaskNode[];
  imageUrl?: string;
  totalMinutes: number;
  activeMinutes: number;
  thermalTemp?: string;
  appliance: string;
  validationStatus: 'APPROVED' | 'CANDIDATE' | 'REJECTED';
}

// Kitchen configuration
export interface KitchenConfig {
  ovenCount: number;
  burnerCount: number;
  maxActiveAttention: number; // concurrent active tasks
  ovenTempToleranceF: number; // max temp difference for sharing
}

// Schedule result from the engine
export interface ScheduleResult {
  scheduledTasks: ScheduledTask[];
  criticalPath: string[];  // task IDs
  expectedLandingTime: string; // ISO 8601
  landingDriftSeconds: number;
  feasibilityStatus: FeasibilityStatus;
  resourceConflicts: ResourceConflict[];
  attentionConflicts: AttentionConflict[];
  ovenFeasibility: OvenFeasibility;
  warnings: string[];
  planStartTime: string; // ISO 8601
  scheduleRevision: number;
}

// Resource conflict
export interface ResourceConflict {
  resource: ResourceType;
  taskIds: string[];
  overlapStartSeconds: number;
  overlapEndSeconds: number;
  resolved: boolean;
  resolution?: string;
}

// Attention conflict
export interface AttentionConflict {
  taskIds: string[];
  overlapStartSeconds: number;
  overlapEndSeconds: number;
  resolved: boolean;
}

// Oven feasibility
export interface OvenFeasibility {
  feasible: boolean;
  conflicts: {
    taskIds: string[];
    temperatures: number[];
    reason: string;
  }[];
}

// Proposed schedule change from replanning
export interface ProposedChange {
  taskId: string;
  changeType: 'SHIFTED' | 'DURATION_CHANGED' | 'RESOURCE_CHANGED' | 'ADDED_HOLD';
  previousStartSeconds: number;
  proposedStartSeconds: number;
  previousDurationSeconds: number;
  proposedDurationSeconds: number;
  secondsRecovered: number;
  reason: string;
  constraintsChecked: string[];
  requiresConfirmation: boolean;
  safetyOrQualityNotes?: string;
}

// Replan proposal
export interface ReplanProposal {
  proposalId: string;
  sessionId: string;
  baseRevision: number; // revision at time of proposal
  status: ProposalStatus;
  triggerTaskId: string;
  delaySeconds: number;
  proposedSchedule: ScheduledTask[];
  changes: ProposedChange[];
  projectedLandingTime: string; // ISO 8601
  landingDriftSeconds: number;
  explanation: string;
  feasibilityStatus: FeasibilityStatus;
  warnings: string[];
  createdAt: string; // ISO 8601
}

// Substitution record
export interface SubstitutionRecord {
  id: string;
  missingIngredient: string;
  replacementIngredients: { name: string; quantity: string; unit: string }[];
  compatibleRecipeIds: string[];
  compatibleTaskIds: string[];
  preparationChanges: string;
  durationAdjustmentSeconds: number;
  textureNotes: string;
  dietaryNotes?: string;
  validationStatus: 'APPROVED' | 'CANDIDATE';
  source: string;
}

// Substitution proposal
export interface SubstitutionProposal {
  proposalId: string;
  sessionId: string;
  baseRevision: number;
  status: ProposalStatus;
  missingIngredient: string;
  substitutionId: string;
  affectedTaskIds: string[];
  durationChangeSeconds: number;
  scheduleChanges: ProposedChange[];
  projectedLandingTime: string;
  explanation: string;
  createdAt: string;
}

// Session event for history
export interface SessionEvent {
  id: string;
  sessionId: string;
  type: SessionEventType;
  timestamp: string; // ISO 8601
  description: string;
  metadata?: Record<string, unknown>;
}

// Plating item
export interface PlatingItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

// Restock item
export interface RestockItem {
  id: string;
  sessionId: string;
  name: string;
  status: 'DEPLETED' | 'LOW' | 'RESTOCKED';
  note: string;
  dateAdded: string;
}

// Cooking session
export interface CookingSession {
  sessionId: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  targetServingAt: string; // ISO 8601
  timezone: string;
  householdSize: number;
  status: SessionStatus;
  selectedDishIds: string[];
  recipeVersions: Record<string, number>;
  tasks: TaskNode[];
  currentSchedule: ScheduledTask[];
  pendingProposal?: ReplanProposal;
  pendingSubstitutionProposal?: SubstitutionProposal;
  scheduleRevision: number;
  acceptedChanges: ProposedChange[];
  appliedSubstitutions: { substitutionId: string; appliedAt: string }[];
  restockItems: RestockItem[];
  platingChecklist: PlatingItem[];
  events: SessionEvent[];
  completedAt?: string;
  actualLandingTime?: string;
  planStartTime?: string; // ISO 8601
}

// Default kitchen configuration
export const DEFAULT_KITCHEN_CONFIG: KitchenConfig = {
  ovenCount: 1,
  burnerCount: 4,
  maxActiveAttention: 1,
  ovenTempToleranceF: 25,
};
