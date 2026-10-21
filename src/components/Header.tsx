import React, { useState } from 'react';
import { useCookingSession } from '../context/CookingSessionContext';
import { ScreenId } from '../types';
import { Timer, Mic, Settings, RotateCcw, Sparkles, ChevronDown, History } from 'lucide-react';

export const Header: React.FC<{ onOpenVoice: () => void }> = ({ onOpenVoice }) => {
  const {
    currentScreen,
    setScreen,
    resetToFreshSession,
    showToast,
    openSubstitutionModal,
    triggerDelaySimulation,
    openSessionLog,
  } = useCookingSession();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  const screens: { id: ScreenId; label: string; number: string }[] = [
    { id: 'planning', label: '1. Plan', number: '01' },
    { id: 'live', label: '2. Live Cook', number: '02' },
    { id: 'replan', label: '3. Re-Plan', number: '03' },
    { id: 'pantry', label: '4. Substitution', number: '04' },
    { id: 'landed', label: '5. Dinner Landed', number: '05' },
  ];

  return (
    <header className="fixed top-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E5DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
      <div className="max-w-[1720px] mx-auto h-[76px] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-3.5 shrink-0">
          <button
            onClick={() => setScreen('planning')}
            className="flex items-center gap-3 text-left group focus:outline-none"
            title="Go to Planning Screen"
          >
            <div className="w-9 h-9 rounded-xl bg-[#EBF4F0] border border-[#C4DDD3] flex items-center justify-center text-[#3D8065] shadow-xs group-hover:scale-105 transition-transform">
              <Timer className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-['Epilogue'] font-bold tracking-tight text-[#202124] text-[15px] sm:text-[17px] leading-tight">
                  LANDING TIME
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#3D8065] inline-block"></span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-widest text-[#737780] uppercase hidden xs:block">
                SMART COOKING COORDINATION
              </span>
            </div>
          </button>
        </div>

        {/* Center: 5-Screen Navigator pills */}
        <nav aria-label="Five Screen Prototype Navigation" className="hidden lg:flex items-center gap-1 bg-[#F8F8F5] p-1 rounded-xl border border-[#E5E5DF]">
          {screens.map((s) => {
            const isActive = currentScreen === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  if (s.id === 'pantry') {
                    openSubstitutionModal();
                  } else {
                    setScreen(s.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-[#202124] shadow-xs border border-[#E5E5DF] font-bold'
                    : 'text-[#737780] hover:text-[#202124] hover:bg-white/60'
                }`}
              >
                <span className={`text-[10px] ${isActive ? 'text-[#3D8065]' : 'text-[#9CA3AF]'}`}>
                  {s.number}
                </span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Controls & Voice Capsule */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Session Log Trigger */}
          <button
            onClick={openSessionLog}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F8F8F5] border border-[#E5E5DF] hover:bg-[#F1F0E9] text-[#737780] hover:text-[#202124] text-xs font-semibold transition-colors cursor-pointer"
            title="View cooking session event log"
          >
            <History className="w-3.5 h-3.5 text-[#3D8065]" />
            <span>LOG</span>
          </button>

          {/* Quick Voice Ready Capsule */}
          <button
            onClick={onOpenVoice}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF4F0] border border-[#3D8065]/20 hover:bg-[#E1EDE6] transition-all cursor-pointer group"
            title="Tap to trigger voice companion commands"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3D8065] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3D8065]"></span>
            </span>
            <Mic className="w-4 h-4 text-[#3D8065] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold tracking-wider text-[#265442] uppercase hidden sm:inline">
              VOICE READY
            </span>
          </button>

          {/* Quick Screen Switcher for Mobile / Tablet */}
          <div className="lg:hidden relative">
            <select
              value={currentScreen}
              onChange={(e) => {
                const target = e.target.value as ScreenId;
                if (target === 'pantry') openSubstitutionModal();
                else setScreen(target);
              }}
              aria-label="Select screen"
              className="h-9 text-xs font-semibold bg-[#F8F8F5] border border-[#E5E5DF] rounded-xl px-2 text-[#202124]"
            >
              <option value="planning">1. Plan Meal</option>
              <option value="live">2. Live Cook</option>
              <option value="replan">3. Dynamic Re-Plan</option>
              <option value="pantry">4. Substitution</option>
              <option value="landed">5. Dinner Landed</option>
            </select>
          </div>

          {/* Settings / Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsDropdown((prev) => !prev)}
              aria-label="Settings and actions"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#F8F8F5] hover:bg-[#F1F0E9] text-[#737780] hover:text-[#202124] transition-colors border border-[#E5E5DF] focus:outline-none"
            >
              <Settings className="w-4 h-4" />
            </button>

            {showSettingsDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E5DF] rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-[#E5E5DF]/70">
                  <span className="text-[10px] font-bold tracking-widest text-[#9CA3AF] uppercase block">
                    SESSION DEMO TOOLS
                  </span>
                  <span className="text-xs font-bold text-[#202124]">Landing Time Engine</span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      openSessionLog();
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-[#202124] hover:bg-[#F8F8F5] rounded-xl flex items-center gap-2"
                  >
                    <History className="w-3.5 h-3.5 text-[#3D8065]" />
                    <span>View Session Event Log</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerDelaySimulation(12);
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-[#202124] hover:bg-[#F8F8F5] rounded-xl flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Trigger +12m Delay (Screen 3)</span>
                  </button>

                  <button
                    onClick={() => {
                      openSubstitutionModal();
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-[#202124] hover:bg-[#F8F8F5] rounded-xl flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#3D8065]" />
                    <span>Missing Ingredient (Screen 4)</span>
                  </button>

                  <button
                    onClick={() => {
                      resetToFreshSession();
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Fresh Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
