import React, { useState } from 'react';
import { useCookingSession } from '../context/CookingSessionContext';
import { RECIPE_CATALOG } from '../data/mockKitchenData';
import { Dish } from '../types';
import { apiClient } from '../api/client';
import { Plus, X, Flame, Check, Clock, Utensils, Sparkles, Loader2 } from 'lucide-react';

interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDishModal: React.FC<AddDishModalProps> = ({ isOpen, onClose }) => {
  const { dishes, addDish } = useCookingSession();
  const [activeTab, setActiveTab] = useState<'catalog' | 'ai'>('catalog');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // AI Recipe Parsing State
  const [recipeText, setRecipeText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!isOpen) return null;

  const existingIds = new Set(dishes.map((d) => d.id));
  const availableDishes = RECIPE_CATALOG.filter((d) => !existingIds.has(d.id));

  const handleAddCatalog = () => {
    if (!selectedId) return;
    const target = RECIPE_CATALOG.find((d) => d.id === selectedId);
    if (target) {
      addDish(target);
      onClose();
    }
  };

  const handleParseWithAi = async () => {
    if (!recipeText.trim()) return;
    setIsParsing(true);
    setAiError(null);

    try {
      const dishId = `custom-${Date.now()}`;
      const res = await apiClient.parseRecipeWithAi(recipeText, dishId);

      if (!res.success || !res.tasks) {
        throw new Error(res.error || 'Failed to extract recipe DAG');
      }

      const totalTasks = res.tasks.length;
      const prepDurationMin = Math.round((res.tasks[0]?.durationSeconds || 600) / 60);
      const totalDurMin = res.totalMinutes || 30;
      const activeDurMin = res.activeMinutes || 15;

      // Convert parsed result to Dish
      const newDish: Dish = {
        id: dishId,
        code: `D-AI`,
        name: res.dishName || 'Custom AI Dish',
        category: 'CUSTOM COURSE',
        description: res.description || 'Parsed and synchronized using Gemini AI',
        prepMinutes: prepDurationMin,
        thermalMinutes: Math.max(0, totalDurMin - prepDurationMin - 5),
        restMinutes: 5,
        totalMinutes: totalDurMin,
        activeMinutes: activeDurMin,
        imageUrl:
          'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
        appliance: res.tasks.some((t: any) => t.resource === 'OVEN') ? 'SHARED OVEN' : 'STOVETOP',
        priorityNote: res.tasks.some((t: any) => t.resource === 'OVEN') ? 'Oven Synchronized' : undefined,
        steps: res.tasks.map((t: any, idx: number) => ({
          id: t.id,
          stepNumber: idx + 1,
          totalSteps: totalTasks,
          title: t.label,
          instruction: t.instructions,
          durationMinutes: Math.max(1, Math.round(t.durationSeconds / 60)),
          type: (t.stepType === 'thermal' || t.stepType === 'stovetop' || t.stepType === 'rest' || t.stepType === 'active-hands')
            ? t.stepType
            : 'prep',
          appliance: t.resource,
          status: 'pending' as const,
        })),
      };

      addDish(newDish);
      setRecipeText('');
      onClose();
    } catch (err: any) {
      setAiError(err.message || 'Error communicating with Gemini parser');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-dish-dialog-title"
      className="fixed inset-0 z-50 bg-[#202124]/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white border border-[#E5E5DF] rounded-3xl p-6 sm:p-8 max-w-xl w-full flex flex-col gap-5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E5E5DF]">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#3D8065] uppercase block flex items-center gap-1.5">
              <span>CULINARY EXPANSION</span>
              <span className="px-1.5 py-0.2 rounded bg-[#EBF4F0] text-[#265442] text-[9px] font-mono">
                GEMINI 2.5 FLASH
              </span>
            </span>
            <h3 id="add-dish-dialog-title" className="font-['Epilogue'] text-xl font-bold text-[#202124]">
              Add Dish to Synchronized Menu
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-[#737780] hover:text-[#202124]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#F8F8F5] p-1 rounded-xl border border-[#E5E5DF]">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'catalog'
                ? 'bg-white text-[#202124] shadow-xs'
                : 'text-[#737780] hover:text-[#202124]'
            }`}
          >
            Curated Catalog
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-white text-[#3D8065] shadow-xs'
                : 'text-[#737780] hover:text-[#202124]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3D8065]" />
            <span>Paste Recipe with AI</span>
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'catalog' ? (
          <div className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1 min-h-[260px]">
            {availableDishes.length === 0 ? (
              <div className="p-8 text-center bg-[#F8F8F5] rounded-2xl border border-[#E5E5DF]">
                <Utensils className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#202124]">All catalog dishes are currently on the menu!</p>
                <p className="text-xs text-[#737780] mt-1">Switch to "Paste Recipe with AI" to add any custom recipe.</p>
              </div>
            ) : (
              availableDishes.map((dish) => {
                const isSelected = selectedId === dish.id;
                return (
                  <div
                    key={dish.id}
                    onClick={() => setSelectedId(dish.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                      isSelected
                        ? 'bg-[#EBF4F0]/60 border-[#3D8065] ring-2 ring-[#3D8065]/20 shadow-xs'
                        : 'bg-[#F8F8F5] border-[#E5E5DF] hover:bg-white hover:border-[#737780]/40'
                    }`}
                  >
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 ring-1 ring-black/5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EBF4F0] text-[#265442] uppercase">
                          {dish.category}
                        </span>
                        {dish.priorityNote && (
                          <span className="text-[10px] text-[#737780] flex items-center gap-1 font-mono">
                            <Flame className="w-3 h-3 text-[#D97706]" />
                            {dish.priorityNote}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[#202124]">{dish.name}</h4>
                      <p className="text-xs text-[#737780] mt-0.5 line-clamp-1">{dish.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-[#737780] font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#9CA3AF]" />
                          {dish.totalMinutes}m total ({dish.activeMinutes}m active)
                        </span>
                        <span>·</span>
                        <span className="text-[#3D8065] font-semibold">{dish.appliance}</span>
                      </div>
                    </div>
                    <div className="shrink-0 pt-1">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          isSelected
                            ? 'bg-[#3D8065] border-[#3D8065] text-white'
                            : 'border-[#E5E5DF] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* AI Recipe Input Area */
          <div className="flex flex-col gap-3 flex-1 min-h-[260px]">
            <p className="text-xs text-[#737780] leading-relaxed">
              Paste ingredients and cooking instructions from any recipe. Gemini 2.5 Flash will extract step durations, appliance needs, and predecessor links to synchronize it with your other dishes.
            </p>
            <textarea
              value={recipeText}
              onChange={(e) => setRecipeText(e.target.value)}
              placeholder="e.g. Garlic Butter Glazed Carrots:
1. Peel and slice 1 lb carrots into 1/2-inch rounds (5 mins).
2. Melt 2 tbsp butter on Stovetop Burner #3 (2 mins).
3. Sauté carrots over medium heat with thyme and honey for 12 minutes until tender-crisp.
4. Garnish with chopped parsley and serve warm."
              rows={7}
              className="w-full p-3.5 rounded-2xl bg-[#F8F8F5] border border-[#E5E5DF] text-xs text-[#202124] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8065]/20 focus:bg-white resize-none font-mono"
            />
            {aiError && (
              <p className="text-xs text-[#EF4444] bg-[#FEF2F2] p-2.5 rounded-xl border border-[#FCA5A5]">
                {aiError}
              </p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5DF]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737780] hover:text-[#202124]"
          >
            Cancel
          </button>
          {activeTab === 'catalog' ? (
            <button
              onClick={handleAddCatalog}
              disabled={!selectedId}
              className="px-6 py-2.5 rounded-xl bg-[#3D8065] hover:bg-[#336C55] disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Menu</span>
            </button>
          ) : (
            <button
              onClick={handleParseWithAi}
              disabled={isParsing || !recipeText.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#3D8065] hover:bg-[#336C55] disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini Analyzing DAG...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Parse & Synchronize with Gemini</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
