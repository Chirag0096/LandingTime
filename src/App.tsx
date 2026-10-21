import React, { useState } from 'react';
import { CookingSessionProvider, useCookingSession } from './context/CookingSessionContext';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { VoiceModal } from './components/VoiceModal';
import { PlanningScreen } from './components/screens/PlanningScreen';
import { LiveDashboardScreen } from './components/screens/LiveDashboardScreen';
import { RePlanScreen } from './components/screens/RePlanScreen';
import { PantrySubstitutionModal } from './components/screens/PantrySubstitutionModal';
import { DinnerLandedScreen } from './components/screens/DinnerLandedScreen';

import { EditDishModal } from './components/EditDishModal';
import { SavePlanModal } from './components/SavePlanModal';
import { CookingSummaryModal } from './components/CookingSummaryModal';
import { SessionLogDrawer } from './components/SessionLogDrawer';

const MainContent: React.FC = () => {
  const {
    currentScreen,
    isSubstitutionModalOpen,
    isEditDishModalOpen,
    editingDish,
    closeEditDishModal,
    updateDish,
    isSavePlanModalOpen,
    closeSavePlanModal,
    isSummaryModalOpen,
    closeSummaryModal,
    isSessionLogOpen,
    closeSessionLog,
  } = useCookingSession();
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentScreen]);

  return (
    <div className="min-h-screen bg-[#F7F7F2] font-sans text-[#202124] antialiased flex flex-col selection:bg-[#EBF4F0] selection:text-[#265442]">
      {/* Top Fixed Header */}
      <Header onOpenVoice={() => setIsVoiceModalOpen(true)} />

      {/* Main Viewport */}
      <main className="w-full pt-[92px] px-4 sm:px-6 lg:px-8 max-w-[1720px] mx-auto flex-1">
        {currentScreen === 'planning' && <PlanningScreen />}
        {currentScreen === 'live' && <LiveDashboardScreen />}
        {currentScreen === 'replan' && <RePlanScreen />}
        {currentScreen === 'pantry' && <LiveDashboardScreen />}
        {currentScreen === 'landed' && <DinnerLandedScreen />}
      </main>

      {/* Global Modals & Notifications */}
      <PantrySubstitutionModal />
      <VoiceModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} />
      <EditDishModal
        isOpen={isEditDishModalOpen}
        dish={editingDish}
        onClose={closeEditDishModal}
        onSave={updateDish}
      />
      <SavePlanModal isOpen={isSavePlanModalOpen} onClose={closeSavePlanModal} />
      <CookingSummaryModal isOpen={isSummaryModalOpen} onClose={closeSummaryModal} />
      <SessionLogDrawer isOpen={isSessionLogOpen} onClose={closeSessionLog} />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <CookingSessionProvider>
      <MainContent />
    </CookingSessionProvider>
  );
}
