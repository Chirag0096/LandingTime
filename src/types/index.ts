export type ScreenId = 'planning' | 'live' | 'replan' | 'pantry' | 'landed';

export type Meridiem = 'AM' | 'PM';

export interface CookingStep {
  id: string;
  stepNumber: number;
  totalSteps: number;
  title: string;
  instruction: string;
  durationMinutes: number;
  type: 'prep' | 'active-hands' | 'thermal' | 'rest' | 'stovetop';
  appliance?: string;
  subItems?: { id: string; text: string; completed: boolean }[];
  status: 'pending' | 'in-progress' | 'completed';
}

export interface Dish {
  id: string;
  code: string; // e.g. "D-01"
  name: string;
  category: string; // e.g. "MAIN COURSE", "SIDE", "SIDE + SAUCE"
  description: string;
  priorityNote?: string;
  imageUrl: string;
  prepMinutes: number;
  thermalMinutes: number;
  thermalTemp?: string; // e.g. "425°F"
  restMinutes: number;
  appliance: string; // e.g. "SHARED OVEN (RACK 2)", "STOVETOP + OVEN", "STOVETOP (BURNER 1 & 2)"
  activeMinutes: number;
  totalMinutes: number;
  steps: CookingStep[];
  readyTemperature?: string;
  readinessNote?: string;
  holdingStatus?: string;
}

export interface ApplianceState {
  oven: {
    temp: number;
    mode: string;
    status: 'BUSY' | 'PREHEATING' | 'READY' | 'IDLE';
    activeItem: string;
    activeTimeLeft: number;
    totalTime: number;
    reservedItem: string;
    reservedTime: string;
  };
  burners: {
    bl: { name: string; status: 'OFF' | 'ACTIVE' | 'RESERVED'; detail?: string };
    br: { name: string; status: 'OFF' | 'ACTIVE' | 'RESERVED'; detail?: string };
    fl: { name: string; status: 'OFF' | 'ACTIVE' | 'RESERVED'; detail?: string };
    fr: { name: string; status: 'OFF' | 'ACTIVE' | 'RESERVED'; detail?: string };
  };
}

export interface ProposedAdjustment {
  id: string;
  title: string;
  category: string;
  changeBadge: string;
  originalText: string;
  proposedText: string;
  rationale: string;
  tag: string;
  tagValue: string;
  timeDeltaMinutes: number;
}

export interface SubstitutionOption {
  id: string;
  name: string;
  flavorMatch: string;
  subtitle: string;
  ingredients: { amount: string; item: string; role: string }[];
  culinaryExplanation: string;
  stepAdjustments: { stepNumber: number; title: string; detail: string }[];
  timeImpact: { durationText: string; burnerText: string; landingText: string; note: string };
}

export interface PlatingItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface RestockItem {
  id: string;
  name: string;
  status: 'depleted' | 'low' | 'restocked';
  note: string;
  dateAdded: string;
}

export interface SessionHistoryLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'alert' | 'success' | 'action';
}
