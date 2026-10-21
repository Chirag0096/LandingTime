import React, { useState, useEffect } from 'react';
import { Dish } from '../types';
import { useCookingSession } from '../context/CookingSessionContext';
import { X, Save, Clock, Flame, Hourglass, Layers, AlertCircle, Sparkles } from 'lucide-react';

interface EditDishModalProps {
  isOpen: boolean;
  dish: Dish | null;
  onClose: () => void;
  onSave: (updatedDish: Dish) => void;
}

export const EditDishModal: React.FC<EditDishModalProps> = ({
  isOpen,
  dish,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Dish | null>(null);

  useEffect(() => {
    if (dish) {
      setFormData({ ...dish });
    }
  }, [dish]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Recalculate total minutes
    const prep = Math.max(0, Number(formData.prepMinutes) || 0);
    const thermal = Math.max(0, Number(formData.thermalMinutes) || 0);
    const rest = Math.max(0, Number(formData.restMinutes) || 0);
    const total = prep + thermal + rest;

    const updated: Dish = {
      ...formData,
      prepMinutes: prep,
      thermalMinutes: thermal,
      restMinutes: rest,
      totalMinutes: total,
      activeMinutes: prep + (formData.category.includes('MAIN') ? 5 : 2),
    };

    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white border border-[#E5E5DF] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-dish-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5E5DF] flex items-center justify-between bg-[#F8F8F5]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF4F0] border border-[#C4DDD3] flex items-center justify-center text-[#3D8065] shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="edit-dish-title" className="font-['Epilogue'] text-lg font-bold text-[#202124]">
                Adjust Cooking Parameters
              </h2>
              <p className="text-xs text-[#737780]">
                Customize prep, thermal times, and appliance assignment for {formData.name}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Dish Name & Category */}
            <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#202124] uppercase tracking-wider block">
              Recipe Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5DF] bg-[#F8F8F5] text-sm text-[#202124] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8065]/20 focus:border-[#3D8065]"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#202124] uppercase tracking-wider block">
              Preparation Notes / Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5DF] bg-[#F8F8F5] text-xs text-[#202124] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8065]/20 focus:border-[#3D8065]"
            />
          </div>

          {/* Timing Grid: Prep, Thermal, Rest */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#202124] uppercase tracking-wider block">
              Phase Durations (Minutes)
            </span>
            <div className="grid grid-cols-3 gap-3">
              {/* Prep */}
              <div className="p-3 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-[#737780] font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#3D8065]" />
                  <span>Prep Active</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={formData.prepMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, prepMinutes: parseInt(e.target.value) || 0 })
                    }
                    className="w-16 text-lg font-bold font-mono text-[#202124] bg-white border border-[#E5E5DF] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#3D8065]"
                  />
                  <span className="text-xs text-[#737780]">min</span>
                </div>
              </div>

              {/* Thermal */}
              <div className="p-3 rounded-xl bg-[#FEF3C7]/40 border border-[#FDE68A] space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-[#D97706] font-medium">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Thermal Bake</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={formData.thermalMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, thermalMinutes: parseInt(e.target.value) || 0 })
                    }
                    className="w-16 text-lg font-bold font-mono text-[#D97706] bg-white border border-[#FDE68A] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                  />
                  <span className="text-xs text-[#737780]">min</span>
                </div>
              </div>

              {/* Rest */}
              <div className="p-3 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-[#737780] font-medium">
                  <Hourglass className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <span>Rest / Hold</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={formData.restMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, restMinutes: parseInt(e.target.value) || 0 })
                    }
                    className="w-16 text-lg font-bold font-mono text-[#202124] bg-white border border-[#E5E5DF] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#3D8065]"
                  />
                  <span className="text-xs text-[#737780]">min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thermal Target & Appliance Specification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#202124] uppercase tracking-wider block">
                Thermal Temp / Target
              </label>
              <input
                type="text"
                value={formData.thermalTemp || ''}
                placeholder="e.g. 425°F or 165°F Core"
                onChange={(e) => setFormData({ ...formData, thermalTemp: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E5DF] bg-[#F8F8F5] text-xs text-[#202124] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8065]/20 focus:border-[#3D8065]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#202124] uppercase tracking-wider block">
                Appliance Allocation
              </label>
              <select
                value={formData.appliance}
                onChange={(e) => setFormData({ ...formData, appliance: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E5DF] bg-[#F8F8F5] text-xs text-[#202124] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8065]/20 focus:border-[#3D8065]"
              >
                <option value="SHARED OVEN (RACK 2)">Shared Oven (Rack 2 / Center)</option>
                <option value="SHARED OVEN (TOP RACK)">Shared Oven (Top Rack)</option>
                <option value="SHARED OVEN (BOTTOM RACK)">Shared Oven (Bottom Rack)</option>
                <option value="STOVETOP + OVEN">Stovetop + Oven Dual Phase</option>
                <option value="STOVETOP (BURNER 1 & 2)">Stovetop (Burners 1 & 2)</option>
                <option value="STOVETOP (BURNER 3)">Stovetop (Burner 3)</option>
                <option value="PREP COUNTER">Prep Counter Only</option>
              </select>
            </div>
          </div>

          {/* Priority Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#202124] uppercase tracking-wider block">
              Coordination Priority Badge
            </label>
            <input
              type="text"
              value={formData.priorityNote || ''}
              placeholder="e.g. High Thermal Priority"
              onChange={(e) => setFormData({ ...formData, priorityNote: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#E5E5DF] bg-[#F8F8F5] text-xs text-[#202124] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3D8065]/20 focus:border-[#3D8065]"
            />
          </div>

          {/* Informational Callout */}
          <div className="p-3.5 rounded-xl bg-[#EBF4F0] border border-[#C4DDD3] flex items-start gap-2.5 text-xs text-[#265442]">
            <AlertCircle className="w-4 h-4 text-[#3D8065] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Modifying phase durations will automatically recompute backwards triggers for all active dishes,
              keeping the synchronized serving landing intact.
            </p>
          </div>
        </div>

        {/* Action Buttons Pinned Footer */}
        <div className="px-6 py-4 border-t border-[#E5E5DF] bg-[#F8F8F5]/90 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#E5E5DF] text-[#737780] hover:text-[#202124] hover:bg-[#F8F8F5] text-xs font-bold tracking-wide transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#3D8065] hover:bg-[#336C55] text-white text-xs font-bold tracking-wide transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Recipe Adjustments</span>
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
