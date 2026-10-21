import React, { useState } from 'react';
import { useCookingSession } from '../context/CookingSessionContext';
import { X, Bookmark, Copy, Check, Calendar, Users, Clock, Share2, Sparkles } from 'lucide-react';

interface SavePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavePlanModal: React.FC<SavePlanModalProps> = ({ isOpen, onClose }) => {
  const {
    dishes,
    formattedTargetTime,
    calculatedPrepTriggerTime,
    totalLeadMinutes,
    activeEffortMinutes,
    passiveCookingMinutes,
    showToast,
  } = useCookingSession();

  const [planTitle, setPlanTitle] = useState('Sunday Roast Chicken & Smashed Potatoes');
  const [servings, setServings] = useState('4');
  const [planNotes, setPlanNotes] = useState('Shared oven rack schedule verified for 425°F convection.');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPrepSheet = () => {
    const text = `LANDING TIME PREP SHEET
Plan: ${planTitle}
Servings: ${servings} guests
Serving Time: ${formattedTargetTime}
Prep Starts: ${calculatedPrepTriggerTime} (Total lead: ${totalLeadMinutes}m)
Active Effort: ${activeEffortMinutes}m · Passive: ${passiveCookingMinutes}m

MENU:
${dishes
  .map(
    (d, i) =>
      `${i + 1}. ${d.name} (${d.category})\n   - Prep: ${d.prepMinutes}m | Thermal: ${d.thermalMinutes}m @ ${d.thermalTemp || d.appliance} | Rest: ${d.restMinutes}m`
  )
  .join('\n')}

NOTES:
${planNotes}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Copied to Clipboard', 'Full cooking prep sheet copied.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToLibrary = () => {
    try {
      const savedPlans = JSON.parse(localStorage.getItem('landing_time_saved_plans') || '[]');
      const newPlan = {
        id: `plan-${Date.now()}`,
        title: planTitle,
        servings,
        notes: planNotes,
        targetTime: formattedTargetTime,
        prepStart: calculatedPrepTriggerTime,
        dishes: dishes.map((d) => ({ id: d.id, name: d.name, appliance: d.appliance })),
        savedAt: new Date().toLocaleDateString(),
      };
      savedPlans.push(newPlan);
      localStorage.setItem('landing_time_saved_plans', JSON.stringify(savedPlans));
    } catch {
      // Local storage fallback
    }

    showToast('Plan Saved Successfully', `"${planTitle}" archived for quick one-click load.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white border border-[#E5E5DF] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-plan-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5E5DF] flex items-center justify-between bg-[#F8F8F5]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF4F0] border border-[#C4DDD3] flex items-center justify-center text-[#3D8065] shadow-xs">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 id="save-plan-title" className="font-['Epilogue'] text-lg font-bold text-[#202124]">
                Save Meal Plan
              </h2>
              <p className="text-xs text-[#737780]">
                Bookmark this menu cascade or export your prep sheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[#737780] hover:text-[#202124] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#202124] uppercase tracking-wider block">
              Meal Plan Title
            </label>
            <input
              type="text"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5DF] bg-[#F8F8F5] text-sm text-[#202124] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8065]/20 focus:border-[#3D8065]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#202124] uppercase tracking-wider block">
                Target Guests
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-[#737780] absolute left-3 top-3" />
                <input
                  type="text"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E5E5DF] bg-[#F8F8F5] text-xs text-[#202124] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8065]/20 focus:border-[#3D8065]"
                  placeholder="e.g. 4 guests"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#202124] uppercase tracking-wider block">
                Target Serving
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-[#3D8065] absolute left-3 top-3" />
                <div className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E5E5DF] bg-[#F8F8F5] text-xs text-[#202124] font-bold">
                  {formattedTargetTime}
                </div>
              </div>
            </div>
          </div>

          {/* Plan Summary Preview */}
          <div className="p-4 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#202124]">{dishes.length} Dishes Included:</span>
              <span className="text-[#3D8065] font-bold">Prep starts {calculatedPrepTriggerTime}</span>
            </div>
            <ul className="text-xs text-[#737780] space-y-1 pl-1">
              {dishes.map((dish) => (
                <li key={dish.id} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3D8065]"></span>
                  <span className="font-medium text-[#202124]">{dish.name}</span>
                  <span className="text-[11px] text-[#9CA3AF]">({dish.appliance})</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#202124] uppercase tracking-wider block">
              Chef Notes & Appliance Setup
            </label>
            <textarea
              value={planNotes}
              onChange={(e) => setPlanNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-[#E5E5DF] bg-[#F8F8F5] text-xs text-[#202124] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8065]/20 focus:border-[#3D8065]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E5E5DF] bg-[#F8F8F5]/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyPrepSheet}
            className="px-3.5 py-2.5 rounded-xl border border-[#E5E5DF] bg-white hover:bg-[#F1F0E9] text-[#202124] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#3D8065]" /> : <Copy className="w-3.5 h-3.5 text-[#737780]" />}
            <span>{copied ? 'Prep Sheet Copied!' : 'Copy Prep Sheet'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E5E5DF] text-[#737780] hover:text-[#202124] text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveToLibrary}
              className="px-5 py-2.5 rounded-xl bg-[#3D8065] hover:bg-[#336C55] text-white text-xs font-bold tracking-wide transition-all shadow-sm cursor-pointer"
            >
              Save Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
