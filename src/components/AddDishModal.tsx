import React, { useState } from 'react';
import { useCookingSession } from '../context/CookingSessionContext';
import { RECIPE_CATALOG } from '../data/mockKitchenData';
import { Dish } from '../types';
import { Plus, X, Flame, Check, Clock, Utensils } from 'lucide-react';

interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDishModal: React.FC<AddDishModalProps> = ({ isOpen, onClose }) => {
  const { dishes, addDish } = useCookingSession();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const existingIds = new Set(dishes.map((d) => d.id));
  const availableDishes = RECIPE_CATALOG.filter((d) => !existingIds.has(d.id));

  const handleAdd = () => {
    if (!selectedId) return;
    const target = RECIPE_CATALOG.find((d) => d.id === selectedId);
    if (target) {
      addDish(target);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-dish-dialog-title"
      className="fixed inset-0 z-50 bg-[#202124]/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white border border-[#E5E5DF] rounded-3xl p-6 sm:p-8 max-w-xl w-full flex flex-col gap-6 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E5E5DF]">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#3D8065] uppercase block">
              CULINARY CATALOG
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

        {/* List of Dishes */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-1">
          {availableDishes.length === 0 ? (
            <div className="p-8 text-center bg-[#F8F8F5] rounded-2xl border border-[#E5E5DF]">
              <Utensils className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#202124]">All catalog dishes are currently on the menu!</p>
              <p className="text-xs text-[#737780] mt-1">You can remove a dish on the main screen to swap.</p>
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

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5DF]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737780] hover:text-[#202124]"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedId}
            className="px-6 py-2.5 rounded-xl bg-[#3D8065] hover:bg-[#336C55] disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
