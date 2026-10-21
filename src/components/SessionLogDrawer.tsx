import React, { useState } from 'react';
import { useCookingSession } from '../context/CookingSessionContext';
import {
  X,
  History,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Clock,
  Filter,
  Download,
  Flame,
  CookingPot,
} from 'lucide-react';

interface SessionLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionLogDrawer: React.FC<SessionLogDrawerProps> = ({ isOpen, onClose }) => {
  const {
    formattedTargetTime,
    actualLandingTime,
    delayDetectedMinutes,
    recoveredMinutes,
    replanAccepted,
    appliedSubstitutionId,
    showToast,
  } = useCookingSession();

  const [activeFilter, setActiveFilter] = useState<'all' | 'thermal' | 'adaptations' | 'steps'>('all');

  if (!isOpen) return null;

  const events = [
    {
      id: 'e1',
      time: '6:20 PM',
      category: 'steps',
      title: 'Session Initialized',
      detail: `Target landing locked at ${formattedTargetTime}. Backward prep cascade computed for 3 dishes.`,
      icon: Clock,
      color: 'slate',
    },
    {
      id: 'e2',
      time: '6:20 PM',
      category: 'steps',
      title: 'Step 1: Truss & Compound Butter Bird',
      detail: 'Whole 4.5 lb chicken dried, garlic-rosemary butter spread under breast skin, legs trussed.',
      icon: CheckCircle2,
      color: 'sage',
    },
    {
      id: 'e3',
      time: '6:30 PM',
      category: 'thermal',
      title: 'Chicken Enters Oven (Center Rack)',
      detail: 'Oven preheated to 425°F Convection. Internal thigh probe active and telemetry streaming.',
      icon: Flame,
      color: 'amber',
    },
    {
      id: 'e4',
      time: '6:40 PM',
      category: 'steps',
      title: 'Stovetop Parboil Commenced',
      detail: 'Burner #1 (Front Left) active. 1.5 lb baby yukon potatoes boiled in salted water.',
      icon: CookingPot,
      color: 'slate',
    },
    {
      id: 'e5',
      time: '6:47 PM',
      category: 'adaptations',
      title: 'Pantry Substitution Applied',
      detail:
        appliedSubstitutionId === 'sub-milk-butter'
          ? 'Heavy Cream missing for pan gravy. Milk (1 cup) + Melted Butter (2 tbsp) substitute configured (+2m simmer compensation).'
          : 'Heavy cream stocked and verified.',
      icon: Sparkles,
      color: 'sage',
    },
    {
      id: 'e6',
      time: '6:51 PM',
      category: 'adaptations',
      title: 'Delay Detected (+12m)',
      detail:
        'Probe registered 152°F (expected 158°F). Thermal curve required +12m oven roast extension.',
      icon: AlertTriangle,
      color: 'amber',
    },
    {
      id: 'e7',
      time: '6:52 PM',
      category: 'adaptations',
      title: replanAccepted ? 'Dynamic Re-Plan Confirmed' : 'Original Plan Kept',
      detail: replanAccepted
        ? `Chicken rest compressed from 15m to 10m (-5m). Stovetop asparagus start shifted +7m. Dynamic landing scheduled for ${actualLandingTime}.`
        : 'User elected to maintain unadjusted sequence.',
      icon: CheckCircle2,
      color: 'sage',
    },
    {
      id: 'e8',
      time: '6:55 PM',
      category: 'thermal',
      title: 'Smashed Potatoes Enter Shared Oven',
      detail: 'Sheet pan positioned on top rack at 425°F. Shared oven capacity balanced without temperature dip.',
      icon: Flame,
      color: 'amber',
    },
    {
      id: 'e9',
      time: '7:15 PM',
      category: 'steps',
      title: 'Stovetop Dual-Burner Cascade',
      detail: 'Burner #1 searing asparagus in cast iron; Burner #2 reducing pan gravy base.',
      icon: CookingPot,
      color: 'slate',
    },
    {
      id: 'e10',
      time: '7:27 PM',
      category: 'thermal',
      title: 'Chicken Pulled at 165°F Core',
      detail: 'Bird transferred to cutting board for 10-minute moisture redistribution. Drippings reserved.',
      icon: Flame,
      color: 'sage',
    },
    {
      id: 'e11',
      time: actualLandingTime,
      category: 'steps',
      title: 'Synchronized Landing Achieved',
      detail: 'Carved chicken, crispy potatoes, and glossy asparagus gravy plated within 2-minute spread.',
      icon: CheckCircle2,
      color: 'sage',
    },
  ];

  const filtered = events.filter((e) => activeFilter === 'all' || e.category === activeFilter);

  const handleExportLog = () => {
    const logText = events
      .map((e) => `[${e.time}] [${e.category.toUpperCase()}] ${e.title} — ${e.detail}`)
      .join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `landing-time-session-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Log Exported', 'Session log downloaded as text file.');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-[#E5E5DF] animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-log-title"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E5E5DF] flex items-center justify-between bg-[#F8F8F5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E5DF] flex items-center justify-center text-[#202124] shadow-xs">
              <History className="w-5 h-5 text-[#3D8065]" />
            </div>
            <div>
              <h2 id="session-log-title" className="font-['Epilogue'] text-base font-bold text-[#202124]">
                Session Event Log
              </h2>
              <p className="text-[11px] text-[#737780]">Live timeline audit trail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close session log"
            className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[#737780] hover:text-[#202124]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-[#E5E5DF] bg-white flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {(['all', 'thermal', 'adaptations', 'steps'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  activeFilter === filter
                    ? 'bg-[#EBF4F0] text-[#3D8065] border border-[#C4DDD3]'
                    : 'text-[#737780] hover:bg-[#F8F8F5]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-mono text-[#9CA3AF] shrink-0">
            {filtered.length} events
          </span>
        </div>

        {/* Timeline Events List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {filtered.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative flex items-start gap-3.5 group">
                {/* Connecting line */}
                {idx < filtered.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-[#E5E5DF]"></div>
                )}

                {/* Dot / Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border z-10 ${
                    item.color === 'sage'
                      ? 'bg-[#EBF4F0] border-[#C4DDD3] text-[#3D8065]'
                      : item.color === 'amber'
                      ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]'
                      : 'bg-[#F8F8F5] border-[#E5E5DF] text-[#737780]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Event Details */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#202124]">{item.title}</span>
                    <span className="text-[10px] font-mono text-[#737780] shrink-0">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-xs text-[#737780] mt-1 leading-relaxed">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#E5E5DF] bg-[#F8F8F5] flex items-center justify-between">
          <button
            onClick={handleExportLog}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#F1F0E9] border border-[#E5E5DF] text-[#202124] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#737780]" />
            <span>Export Log</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#3D8065] text-white text-xs font-bold hover:bg-[#336C55] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
