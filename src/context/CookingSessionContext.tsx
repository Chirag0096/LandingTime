import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  ScreenId,
  Meridiem,
  Dish,
  ApplianceState,
  ProposedAdjustment,
  PlatingItem,
  RestockItem,
  SessionHistoryLog,
} from '../types';
import {
  INITIAL_DISHES,
  INITIAL_APPLIANCE_STATE,
  DEFAULT_PROPOSED_ADJUSTMENTS,
  INITIAL_PLATING_ITEMS,
  INITIAL_RESTOCK_ITEMS,
} from '../data/mockKitchenData';
import {
  calculatePrepTrigger,
  calculateDynamicLanding,
  fromTotalMinutes,
  toTotalMinutes,
  calculateWorkloadMetrics,
} from '../utils/scheduler';

interface ToastState {
  show: boolean;
  title: string;
  message: string;
  type?: 'success' | 'amber' | 'info' | 'error';
}

interface CookingSessionContextType {
  // Navigation & View
  currentScreen: ScreenId;
  setScreen: (screen: ScreenId) => void;

  // Target Serving Time
  targetHour: number;
  targetMinute: number;
  meridiem: Meridiem;
  setTargetHour: (hour: number) => void;
  setTargetMinute: (minute: number) => void;
  setMeridiem: (meridiem: Meridiem) => void;
  adjustMinutes: (delta: number) => void;
  setTimePreset: (hour: number, minute: number, meridiem: Meridiem) => void;
  formattedTargetTime: string;
  calculatedPrepTriggerTime: string;

  // Dishes
  dishes: Dish[];
  addDish: (dish: Dish) => void;
  updateDish: (dish: Dish) => void;
  removeDish: (dishId: string) => void;

  // Workload Metrics
  activeEffortMinutes: number;
  passiveCookingMinutes: number;
  totalLeadMinutes: number;

  // Live Cook-Along State
  isLiveCooking: boolean;
  startLiveCooking: () => void;
  activeStepTitle: string;
  activeStepInstruction: string;
  activeStepNumber: number;
  totalStepsCount: number;
  stepSubItems: { id: string; text: string; completed: boolean }[];
  toggleSubItem: (id: string) => void;
  timerSecondsRemaining: number;
  timerTotalSeconds: number;
  isTimerRunning: boolean;
  toggleTimer: () => void;
  resetTimer: () => void;
  advanceStep: () => void;
  jumpToStep: (stepNumber: number) => void;

  // Appliances
  appliances: ApplianceState;

  // Dynamic Re-Plan State
  delayDetectedMinutes: number;
  recoveredMinutes: number;
  setRecoveredMinutes: (mins: number) => void;
  projectedLandingTime: string;
  proposedAdjustments: ProposedAdjustment[];
  replanAccepted: boolean;
  actualLandingTime: string;
  triggerDelaySimulation: (delayMinutes?: number) => void;
  acceptReplan: () => void;
  keepOriginalPlan: () => void;

  // Pantry Substitution
  isSubstitutionModalOpen: boolean;
  openSubstitutionModal: () => void;
  closeSubstitutionModal: () => void;
  appliedSubstitutionId: string | null;
  applySubstitution: (subId: string, subName: string) => void;
  restoreOriginalIngredient: () => void;

  // Dinner Landed State
  platingItems: PlatingItem[];
  togglePlatingItem: (id: string) => void;
  markAllPlatingItems: () => void;
  restockItems: RestockItem[];
  addRestockItem: (name: string, note?: string) => void;
  isSessionFinished: boolean;
  finishSession: () => void;
  resetToFreshSession: () => void;

  // Interactive Modals & Drawers
  isEditDishModalOpen: boolean;
  editingDish: Dish | null;
  openEditDishModal: (dish: Dish) => void;
  closeEditDishModal: () => void;
  isSummaryModalOpen: boolean;
  openSummaryModal: () => void;
  closeSummaryModal: () => void;
  isSavePlanModalOpen: boolean;
  openSavePlanModal: () => void;
  closeSavePlanModal: () => void;
  isSessionLogOpen: boolean;
  openSessionLog: () => void;
  closeSessionLog: () => void;

  // Verification Overlay state
  isVerificationModalOpen: boolean;
  openVerificationModal: () => void;
  closeVerificationModal: () => void;

  // Voice Interaction
  voiceTranscript: string;
  handleVoiceCommand: (command: string) => void;

  // Micro Toast
  toast: ToastState;
  showToast: (title: string, message: string, type?: ToastState['type']) => void;
  hideToast: () => void;
}

const CookingSessionContext = createContext<CookingSessionContextType | undefined>(undefined);

export const CookingSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Screen state
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('planning');

  // Time state: 7:30 PM default
  const [targetHour, setTargetHour] = useState<number>(7);
  const [targetMinute, setTargetMinute] = useState<number>(30);
  const [meridiem, setMeridiem] = useState<Meridiem>('PM');

  // Dishes
  const [dishes, setDishes] = useState<Dish[]>(INITIAL_DISHES);

  // Live cook state
  const [isLiveCooking, setIsLiveCooking] = useState<boolean>(false);
  const [activeStepNumber, setActiveStepNumber] = useState<number>(4);
  const totalStepsCount = 9;
  const [stepSubItems, setStepSubItems] = useState([
    { id: 'sub-1', text: 'Transfer to baking sheet', completed: true },
    { id: 'sub-2', text: 'Gently smash each potato', completed: true },
    { id: 'sub-3', text: 'Add oil & seasoning', completed: false },
  ]);
  const [activeStepTitle, setActiveStepTitle] = useState('SMASH & SEASON BOILED POTATOES');
  const [activeStepInstruction, setActiveStepInstruction] = useState(
    'Transfer the drained potatoes to a sheet pan. Gently crush each potato to about ½-inch thick. Drizzle generously with olive oil, garlic salt, and fresh chopped rosemary.'
  );

  // Timer: 04:18 (258s) of 5:00 (300s)
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState<number>(258);
  const [timerTotalSeconds] = useState<number>(300);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Appliances
  const [appliances, setAppliances] = useState<ApplianceState>(INITIAL_APPLIANCE_STATE);

  // Delay & Re-Plan
  const [delayDetectedMinutes, setDelayDetectedMinutes] = useState<number>(12);
  const [recoveredMinutes, setRecoveredMinutes] = useState<number>(5);
  const [proposedAdjustments, setProposedAdjustments] = useState<ProposedAdjustment[]>(
    DEFAULT_PROPOSED_ADJUSTMENTS
  );
  const [replanAccepted, setReplanAccepted] = useState<boolean>(true);
  const [actualLandingTime, setActualLandingTime] = useState<string>('7:37 PM');

  // Pantry Substitution
  const [isSubstitutionModalOpen, setIsSubstitutionModalOpen] = useState<boolean>(false);
  const [appliedSubstitutionId, setAppliedSubstitutionId] = useState<string | null>(
    'sub-milk-butter'
  );

  // Dinner Landed
  const [platingItems, setPlatingItems] = useState<PlatingItem[]>(INITIAL_PLATING_ITEMS);
  const [restockItems, setRestockItems] = useState<RestockItem[]>(INITIAL_RESTOCK_ITEMS);
  const [isSessionFinished, setIsSessionFinished] = useState<boolean>(false);

  // Verification modal
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);

  // Voice Transcript
  const [voiceTranscript, setVoiceTranscript] = useState<string>(
    '“The chicken is roasting at 425°. You have about four minutes to prepare the potatoes for the shared oven window.”'
  );

  // Toast
  const [toast, setToast] = useState<ToastState>({
    show: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showToast = useCallback((title: string, message: string, type: ToastState['type'] = 'success') => {
    setToast({ show: true, title, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show, hideToast]);

  // Timer countdown ticker (persists across navigation once live cooking is active)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSecondsRemaining > 0) {
      interval = setInterval(() => {
        setTimerSecondsRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSecondsRemaining]);

  // Interactive Modals & Drawers state
  const [isEditDishModalOpen, setIsEditDishModalOpen] = useState<boolean>(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [isSavePlanModalOpen, setIsSavePlanModalOpen] = useState<boolean>(false);
  const [isSessionLogOpen, setIsSessionLogOpen] = useState<boolean>(false);

  const openEditDishModal = (dish: Dish) => {
    setEditingDish(dish);
    setIsEditDishModalOpen(true);
  };

  const closeEditDishModal = () => {
    setIsEditDishModalOpen(false);
    setEditingDish(null);
  };

  const openSummaryModal = () => setIsSummaryModalOpen(true);
  const closeSummaryModal = () => setIsSummaryModalOpen(false);
  const openSavePlanModal = () => setIsSavePlanModalOpen(true);
  const closeSavePlanModal = () => setIsSavePlanModalOpen(false);
  const openSessionLog = () => setIsSessionLogOpen(true);
  const closeSessionLog = () => setIsSessionLogOpen(false);

  // Derived target times
  const formattedTargetTime = `${targetHour}:${targetMinute < 10 ? '0' + targetMinute : targetMinute} ${meridiem}`;

  // Workload metrics
  const { totalActiveMinutes: activeEffortMinutes, totalPassiveMinutes: passiveCookingMinutes, maxLeadTimeMinutes: totalLeadMinutes } =
    calculateWorkloadMetrics(dishes);

  // Backward prep start
  const prepTrigger = calculatePrepTrigger(targetHour, targetMinute, meridiem, totalLeadMinutes || 70);
  const calculatedPrepTriggerTime = prepTrigger.formatted;

  // Projected dynamic landing
  const dynamicCalc = calculateDynamicLanding(
    targetHour,
    targetMinute,
    meridiem,
    delayDetectedMinutes,
    recoveredMinutes
  );
  const projectedLandingTime = dynamicCalc.projectedLanding;

  // Adjust time (+/- 15 min)
  const adjustMinutes = (delta: number) => {
    const currentTotal = toTotalMinutes(targetHour, targetMinute, meridiem);
    let newTotal = currentTotal + delta;
    if (newTotal < 0) newTotal += 1440;
    if (newTotal >= 1440) newTotal -= 1440;
    const res = fromTotalMinutes(newTotal);
    setTargetHour(res.hour);
    setTargetMinute(res.minute);
    setMeridiem(res.meridiem);
    showToast('Serving Time Updated', `Target landing updated to ${res.formatted}`);
  };

  const setTimePreset = (hour: number, minute: number, mer: Meridiem) => {
    setTargetHour(hour);
    setTargetMinute(minute);
    setMeridiem(mer);
    showToast('Time Preset Applied', `Target set to ${hour}:${minute < 10 ? '0' + minute : minute} ${mer}`);
  };

  // Add / update / remove dishes
  const addDish = (dish: Dish) => {
    setDishes((prev) => [...prev, dish]);
    showToast('Dish Added', `${dish.name} synchronized to cooking cascade.`);
  };

  const updateDish = (updatedDish: Dish) => {
    setDishes((prev) => prev.map((d) => (d.id === updatedDish.id ? updatedDish : d)));
    showToast('Recipe Adjusted', `${updatedDish.name} parameters updated. Schedules synchronized.`);
    setIsEditDishModalOpen(false);
  };

  const removeDish = (dishId: string) => {
    setDishes((prev) => {
      const target = prev.find((d) => d.id === dishId);
      const filtered = prev.filter((d) => d.id !== dishId);
      if (target) {
        showToast('Dish Removed', `${target.name} removed from session.`, 'amber');
      }
      return filtered;
    });
  };

  // 9 Full Structured Steps Catalog
  const STEP_CATALOG: Record<
    number,
    {
      title: string;
      instruction: string;
      timerSeconds: number;
      subItems: { id: string; text: string; completed: boolean }[];
    }
  > = {
    1: {
      title: 'TRUSS & COMPOUND BUTTER BIRD',
      instruction:
        'Pat whole 4.5 lb chicken dry with paper towels. Rub compound rosemary-garlic butter under the breast skin and truss drumsticks tightly with kitchen twine.',
      timerSeconds: 600,
      subItems: [
        { id: 's1-1', text: 'Pat cavity and skin dry', completed: true },
        { id: 's1-2', text: 'Separate breast skin & rub butter', completed: true },
        { id: 's1-3', text: 'Truss drumsticks securely', completed: false },
      ],
    },
    2: {
      title: 'HIGH-HEAT CONVECTION ROAST',
      instruction:
        'Transfer seasoned bird to center rack of 425°F oven. Ensure roasting pan has aromatic root vegetables in base to catch drippings.',
      timerSeconds: 2700,
      subItems: [
        { id: 's2-1', text: 'Verify oven at 425°F convection', completed: true },
        { id: 's2-2', text: 'Insert thermal core probe in thigh', completed: false },
        { id: 's2-3', text: 'Start 45m roast countdown', completed: false },
      ],
    },
    3: {
      title: 'PARBOIL BABY YUKONS (STOVETOP)',
      instruction:
        'Add baby yukons to large stockpot on Burner #1. Cover with cold salted water, bring to vigorous boil, and simmer 15m until knife-tender.',
      timerSeconds: 900,
      subItems: [
        { id: 's3-1', text: 'Salt water generously (1 tbsp)', completed: true },
        { id: 's3-2', text: 'Bring water to rolling boil', completed: true },
        { id: 's3-3', text: 'Drain thoroughly in colander', completed: false },
      ],
    },
    4: {
      title: 'SMASH & SEASON BOILED POTATOES',
      instruction:
        'Transfer the drained potatoes to a sheet pan. Gently crush each potato to about ½-inch thick. Drizzle generously with olive oil, garlic salt, and fresh chopped rosemary.',
      timerSeconds: 300,
      subItems: [
        { id: 'sub-1', text: 'Transfer to baking sheet', completed: true },
        { id: 'sub-2', text: 'Gently smash each potato', completed: true },
        { id: 'sub-3', text: 'Add oil & seasoning', completed: false },
      ],
    },
    5: {
      title: 'SHARED OVEN ROAST (TOP RACK)',
      instruction:
        'Slide seasoned potato baking sheet onto top rack of 425°F oven right alongside the roast chicken. Close door promptly to preserve ambient heat.',
      timerSeconds: 1500,
      subItems: [
        { id: 'sub-4', text: 'Confirm oven temperature at 425°F', completed: true },
        { id: 'sub-5', text: 'Position sheet pan on top rack', completed: false },
        { id: 'sub-6', text: 'Set 25-minute roast countdown', completed: false },
      ],
    },
    6: {
      title: 'TRIM & SIMMER PAN GRAVY BASE',
      instruction:
        'Trim woody ends of asparagus spears. On Burner #2 (Low), warm chicken stock and shallots. If substituting cream, whisk milk and melted butter emulsion.',
      timerSeconds: 480,
      subItems: [
        { id: 's6-1', text: 'Trim 1 lb asparagus spears', completed: false },
        { id: 's6-2', text: 'Melt butter on low flame', completed: false },
        { id: 's6-3', text: 'Whisk in stock & milk emulsion', completed: false },
      ],
    },
    7: {
      title: 'BLISTER ASPARAGUS IN CAST IRON',
      instruction:
        'Heat cast iron skillet on Burner #1 over high flame until lightly smoking. Add olive oil and sear asparagus spears for 6 minutes until charred in spots.',
      timerSeconds: 360,
      subItems: [
        { id: 's7-1', text: 'Heat cast iron over high flame', completed: false },
        { id: 's7-2', text: 'Add asparagus in single layer', completed: false },
        { id: 's7-3', text: 'Season with lemon zest & pepper', completed: false },
      ],
    },
    8: {
      title: 'CARVE RESTED CHICKEN & DEGLAZE GRAVY',
      instruction:
        'Chicken core has rested 10m to seal juices. Pour golden pan drippings into saucepan on Burner #2, whisk vigorously until glossy, and carve breast into diagonal slices.',
      timerSeconds: 300,
      subItems: [
        { id: 's8-1', text: 'Pour drippings into gravy saucepan', completed: false },
        { id: 's8-2', text: 'Whisk gravy until thick & glossy', completed: false },
        { id: 's8-3', text: 'Carve breast into diagonal slices', completed: false },
      ],
    },
    9: {
      title: 'SYNCHRONIZED PLATING & SERVE',
      instruction:
        'All dishes are ready! Arrange carved chicken, crispy potatoes, and blistered asparagus onto warm serving platters. Drizzle hot pan gravy immediately.',
      timerSeconds: 180,
      subItems: [
        { id: 's9-1', text: 'Platter carved chicken with parsley', completed: false },
        { id: 's9-2', text: 'Finish potatoes with flaky sea salt', completed: false },
        { id: 's9-3', text: 'Pour glossy pan gravy into boat', completed: false },
      ],
    },
  };

  const jumpToStep = (stepNumber: number) => {
    const bounded = Math.max(1, Math.min(totalStepsCount, stepNumber));
    setActiveStepNumber(bounded);
    const stepData = STEP_CATALOG[bounded];
    if (stepData) {
      setActiveStepTitle(stepData.title);
      setActiveStepInstruction(stepData.instruction);
      setStepSubItems(stepData.subItems);
      setTimerSecondsRemaining(stepData.timerSeconds);
    }
    showToast(`Step ${bounded} Active`, stepData?.title || `Step ${bounded}`, 'info');
  };

  // Live cook triggers
  const startLiveCooking = () => {
    setIsLiveCooking(true);
    setIsTimerRunning(true);
    setCurrentScreen('live');
    showToast('Cook-Along Initiated', 'Telemetry streaming to active kitchen display.', 'success');
  };

  const toggleTimer = () => {
    setIsTimerRunning((prev) => {
      const next = !prev;
      showToast(next ? 'Timer Resumed' : 'Timer Paused', next ? 'Countdown ticking down.' : 'Timers paused on all active tracks.', next ? 'info' : 'amber');
      return next;
    });
  };

  const resetTimer = () => {
    const cur = STEP_CATALOG[activeStepNumber]?.timerSeconds || timerTotalSeconds;
    setTimerSecondsRemaining(cur);
    showToast('Timer Reset', `Countdown reset for Step ${activeStepNumber}.`, 'info');
  };

  const toggleSubItem = (id: string) => {
    setStepSubItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const advanceStep = () => {
    if (activeStepNumber < totalStepsCount) {
      const nextStep = activeStepNumber + 1;
      setActiveStepNumber(nextStep);
      const stepData = STEP_CATALOG[nextStep];
      if (stepData) {
        setActiveStepTitle(stepData.title);
        setActiveStepInstruction(stepData.instruction);
        setStepSubItems(stepData.subItems);
        setTimerSecondsRemaining(stepData.timerSeconds);
      }
      if (nextStep === 5) {
        setAppliances((prev) => ({
          ...prev,
          oven: {
            ...prev.oven,
            reservedItem: 'Smashed Potatoes · Active in oven',
            reservedTime: 'Roasting 25m',
          },
        }));
      }
      showToast('Step Advanced', `Proceeding to Step ${nextStep} of ${totalStepsCount}: ${stepData?.title}`, 'success');
    } else {
      setCurrentScreen('landed');
      showToast('Dinner Landed!', 'All items synchronized. Welcome to your plating checklist.', 'success');
    }
  };

  // Delay / Re-Plan
  const triggerDelaySimulation = (delayMin = 12) => {
    setDelayDetectedMinutes(delayMin);
    setCurrentScreen('replan');
    showToast(
      'Delay Detected (+12m)',
      'Chicken internal temp probe registered variance. Dynamic Re-Plan ready for review.',
      'amber'
    );
  };

  const acceptReplan = () => {
    setReplanAccepted(true);
    setActualLandingTime(projectedLandingTime);
    setCurrentScreen('live');
    showToast(
      'Schedule Updated & Applied',
      `Resting time reduced to 10m. Stovetop shifted +7m. Landing locked at ${projectedLandingTime}.`,
      'success'
    );
  };

  const keepOriginalPlan = () => {
    setReplanAccepted(false);
    setActualLandingTime(dynamicCalc.unadjustedLanding);
    setCurrentScreen('live');
    showToast(
      'Original Plan Maintained',
      `All steps will follow unadjusted sequence. Expected landing: ${dynamicCalc.unadjustedLanding}.`,
      'info'
    );
  };

  // Pantry Substitution
  const openSubstitutionModal = () => {
    setIsSubstitutionModalOpen(true);
  };

  const closeSubstitutionModal = () => {
    setIsSubstitutionModalOpen(false);
  };

  const applySubstitution = (subId: string, subName: string) => {
    setAppliedSubstitutionId(subId);
    setIsSubstitutionModalOpen(false);
    // Add missing heavy cream to restock list
    addRestockItem(
      'Heavy Cream',
      `Missing during pan gravy reduction · Used ${subName} successfully.`
    );
    showToast(
      'Substitute Applied',
      `${subName} configured. Burner #2 timer adjusted +2m. Landing locked at 7:30 PM.`,
      'success'
    );
  };

  const restoreOriginalIngredient = () => {
    setAppliedSubstitutionId(null);
    setIsSubstitutionModalOpen(false);
    showToast('Ingredient Found', 'Heavy cream restored. Original pan gravy steps reinstated.', 'info');
  };

  // Plating Checklist
  const togglePlatingItem = (id: string) => {
    setPlatingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const markAllPlatingItems = () => {
    setPlatingItems((prev) => {
      const allChecked = prev.every((i) => i.completed);
      return prev.map((item) => ({ ...item, completed: !allChecked }));
    });
  };

  const addRestockItem = (name: string, note = 'Depleted during cooking session') => {
    setRestockItems((prev) => {
      if (prev.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        return prev;
      }
      return [
        ...prev,
        {
          id: `restock-${Date.now()}`,
          name,
          status: 'depleted',
          note,
          dateAdded: 'Today',
        },
      ];
    });
    showToast('Restock Item Added', `${name} added to your pantry shopping list.`, 'success');
  };

  const finishSession = () => {
    setIsSessionFinished(true);
    showToast('Session Archived', 'Congratulations! Dinner coordination logged to session history.', 'success');
  };

  const resetToFreshSession = () => {
    setCurrentScreen('planning');
    setIsLiveCooking(false);
    setActiveStepNumber(4);
    setTimerSecondsRemaining(258);
    setIsTimerRunning(false);
    setIsSessionFinished(false);
    setReplanAccepted(true);
    setDishes(INITIAL_DISHES);
    setPlatingItems(INITIAL_PLATING_ITEMS);
    showToast('New Session Started', 'Ready to plan your next meal.', 'info');
  };

  const openVerificationModal = () => setIsVerificationModalOpen(true);
  const closeVerificationModal = () => setIsVerificationModalOpen(false);

  // Voice Command Dispatcher
  const handleVoiceCommand = (command: string) => {
    const lower = command.toLowerCase();
    if (lower.includes('what now') || lower.includes('status')) {
      setVoiceTranscript(`“Currently at Step ${activeStepNumber}: ${activeStepTitle}. Timer has about ${Math.ceil(timerSecondsRemaining / 60)} minutes remaining.”`);
      showToast('Voice Assistant', 'Read out current step directives.', 'info');
    } else if (lower.includes('delay') || lower.includes('+5') || lower.includes('re-plan')) {
      triggerDelaySimulation(12);
    } else if (lower.includes('ingredient') || lower.includes('missing') || lower.includes('substitute')) {
      openSubstitutionModal();
    } else if (lower.includes('pause') || lower.includes('stop')) {
      toggleTimer();
    } else if (lower.includes('accept') || lower.includes('new plan')) {
      acceptReplan();
    } else if (lower.includes('keep') || lower.includes('original')) {
      keepOriginalPlan();
    } else if (lower.includes('plate') || lower.includes('mark all')) {
      markAllPlatingItems();
      showToast('Voice Action', 'Marked all plating tasks complete.', 'success');
    } else if (lower.includes('another meal') || lower.includes('reset')) {
      resetToFreshSession();
    } else {
      setVoiceTranscript(`“I heard: '${command}'. Ready to coordinate timers or report delays.”`);
      showToast('Voice Command Received', command, 'info');
    }
  };

  return (
    <CookingSessionContext.Provider
      value={{
        currentScreen,
        setScreen: setCurrentScreen,
        targetHour,
        targetMinute,
        meridiem,
        setTargetHour,
        setTargetMinute,
        setMeridiem,
        adjustMinutes,
        setTimePreset,
        formattedTargetTime,
        calculatedPrepTriggerTime,
        dishes,
        addDish,
        updateDish,
        removeDish,
        activeEffortMinutes,
        passiveCookingMinutes,
        totalLeadMinutes,
        isLiveCooking,
        startLiveCooking,
        activeStepTitle,
        activeStepInstruction,
        activeStepNumber,
        totalStepsCount,
        stepSubItems,
        toggleSubItem,
        timerSecondsRemaining,
        timerTotalSeconds,
        isTimerRunning,
        toggleTimer,
        resetTimer,
        advanceStep,
        jumpToStep,
        isEditDishModalOpen,
        editingDish,
        openEditDishModal,
        closeEditDishModal,
        isSummaryModalOpen,
        openSummaryModal,
        closeSummaryModal,
        isSavePlanModalOpen,
        openSavePlanModal,
        closeSavePlanModal,
        isSessionLogOpen,
        openSessionLog,
        closeSessionLog,
        appliances,
        delayDetectedMinutes,
        recoveredMinutes,
        setRecoveredMinutes,
        projectedLandingTime,
        proposedAdjustments,
        replanAccepted,
        actualLandingTime,
        triggerDelaySimulation,
        acceptReplan,
        keepOriginalPlan,
        isSubstitutionModalOpen,
        openSubstitutionModal,
        closeSubstitutionModal,
        appliedSubstitutionId,
        applySubstitution,
        restoreOriginalIngredient,
        platingItems,
        togglePlatingItem,
        markAllPlatingItems,
        restockItems,
        addRestockItem,
        isSessionFinished,
        finishSession,
        resetToFreshSession,
        isVerificationModalOpen,
        openVerificationModal,
        closeVerificationModal,
        voiceTranscript,
        handleVoiceCommand,
        toast,
        showToast,
        hideToast,
      }}
    >
      {children}
    </CookingSessionContext.Provider>
  );
};

export const useCookingSession = () => {
  const context = useContext(CookingSessionContext);
  if (!context) {
    throw new Error('useCookingSession must be used within a CookingSessionProvider');
  }
  return context;
};
