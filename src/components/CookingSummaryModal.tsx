import React from 'react';
import { useCookingSession } from '../context/CookingSessionContext';
import {
  X,
  CheckCircle2,
  TrendingDown,
  Thermometer,
  Layers,
  Sparkles,
  Download,
  Printer,
  Clock,
  Flame,
  CookingPot,
  Share2,
} from 'lucide-react';

interface CookingSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CookingSummaryModal: React.FC<CookingSummaryModalProps> = ({ isOpen, onClose }) => {
  const {
    dishes,
    formattedTargetTime,
    actualLandingTime,
    recoveredMinutes,
    delayDetectedMinutes,
    replanAccepted,
    activeEffortMinutes,
    passiveCookingMinutes,
    restockItems,
    showToast,
  } = useCookingSession();

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const summaryData = {
      app: 'Landing Time',
      sessionVersion: '1.2.0',
      generatedAt: new Date().toISOString(),
      servingTime: {
        target: formattedTargetTime,
        actual: actualLandingTime,
        delayDetectedMinutes,
        recoveredMinutes: replanAccepted ? recoveredMinutes : 0,
        finishSpreadMinutes: 2,
      },
      workload: {
        activeEffortMinutes,
        passiveCookingMinutes,
      },
      dishes: dishes.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        category: d.category,
        appliance: d.appliance,
        readyTemperature: d.readyTemperature,
        readinessNote: d.readinessNote,
      })),
      depletedIngredients: restockItems.map((r) => ({
        name: r.name,
        note: r.note,
      })),
    };

    const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `landing-time-summary-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Telemetry Exported', 'Cooking summary JSON downloaded successfully.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white border border-[#E5E5DF] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5E5DF] flex items-center justify-between bg-[#F8F8F5]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF4F0] border border-[#C4DDD3] flex items-center justify-center text-[#3D8065] shadow-xs">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 id="summary-title" className="font-['Epilogue'] text-xl font-bold text-[#202124]">
                Meal Coordination Summary
              </h2>
              <p className="text-xs text-[#737780]">
                Telemetry and thermal timing breakdown for this dinner session
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Performance Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#EBF4F0] via-white to-white border border-[#C4DDD3] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#C4DDD3] text-[#3D8065] text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>EXCELLENCE IN SYNCHRONIZATION</span>
              </div>
              <h3 className="font-['Epilogue'] text-2xl font-bold text-[#202124]">
                98% Precision Score
              </h3>
              <p className="text-xs text-[#737780]">
                All {dishes.length} dishes arrived within a tight 2-minute plating spread with zero appliance collisions.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#E5E5DF] shrink-0">
              <div className="text-center px-2">
                <span className="text-[10px] text-[#9CA3AF] uppercase font-bold block">TARGET</span>
                <span className="text-sm font-bold text-[#737780]">{formattedTargetTime}</span>
              </div>
              <div className="h-8 w-px bg-[#E5E5DF]"></div>
              <div className="text-center px-2">
                <span className="text-[10px] text-[#3D8065] uppercase font-bold block">LANDED</span>
                <span className="text-sm font-bold text-[#3D8065] font-['Epilogue']">{actualLandingTime}</span>
              </div>
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] space-y-1">
              <span className="text-[10px] font-bold text-[#737780] uppercase tracking-wider block">
                DELAY RECOVERED
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#3D8065] font-mono">
                  +{replanAccepted ? recoveredMinutes : 0}
                </span>
                <span className="text-xs text-[#737780]">min</span>
              </div>
              <p className="text-[11px] text-[#737780]">Rest compression & stovetop delay</p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] space-y-1">
              <span className="text-[10px] font-bold text-[#737780] uppercase tracking-wider block">
                ACTIVE COOKING
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#202124] font-mono">{activeEffortMinutes}</span>
                <span className="text-xs text-[#737780]">min hands-on</span>
              </div>
              <p className="text-[11px] text-[#737780]">Prepping, basting, whisking</p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] space-y-1">
              <span className="text-[10px] font-bold text-[#737780] uppercase tracking-wider block">
                APPLIANCE COLLISIONS
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#3D8065] font-mono">0</span>
                <span className="text-xs text-[#3D8065] font-semibold">Perfect</span>
              </div>
              <p className="text-[11px] text-[#737780]">Shared 425°F oven rack harmony</p>
            </div>
          </div>

          {/* Dish-by-Dish Thermal Audit */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider flex items-center justify-between">
              <span>Dish-by-Dish Execution Telemetry</span>
              <span className="text-[#9CA3AF] font-mono text-[11px] font-normal">
                {dishes.length} Items Coordinated
              </span>
            </h4>

            <div className="space-y-2.5">
              {dishes.map((dish) => (
                <div
                  key={dish.id}
                  className="p-3.5 rounded-xl border border-[#E5E5DF] bg-white hover:border-[#3D8065]/40 transition-colors flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0 bg-[#F1F0E9] border border-[#E5E5DF]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#202124]">{dish.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F8F8F5] border border-[#E5E5DF] text-[#737780] font-mono">
                          {dish.code}
                        </span>
                      </div>
                      <p className="text-xs text-[#737780] mt-0.5">
                        {dish.readinessNote || dish.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-[#737780]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#3D8065]" />
                          Prep {dish.prepMinutes}m
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-[#D97706]" />
                          Cook {dish.thermalMinutes}m
                        </span>
                        <span>•</span>
                        <span>Rest {dish.restMinutes}m</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#EBF4F0] border border-[#C4DDD3] text-[#3D8065] text-[10px] font-bold">
                      {dish.readyTemperature || '100% Ready'}
                    </span>
                    <span className="text-[10px] text-[#737780] block mt-1 font-mono">
                      {dish.holdingStatus || 'Synchronized'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pantry Restock Additions */}
          {restockItems.length > 0 && (
            <div className="p-4 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] space-y-2">
              <span className="text-xs font-bold text-[#202124] uppercase tracking-wider block">
                Automatic Restock Reminders Generated
              </span>
              <div className="flex flex-wrap gap-2">
                {restockItems.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#E5E5DF] text-xs font-medium text-[#202124]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
                    <span>{item.name}</span>
                    <span className="text-[10px] text-[#737780]">({item.note})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E5E5DF] bg-[#F8F8F5]/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F1F0E9] border border-[#E5E5DF] text-[#202124] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#737780]" />
              <span>Export Telemetry JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F1F0E9] border border-[#E5E5DF] text-[#737780] hover:text-[#202124] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#3D8065] hover:bg-[#336C55] text-white text-xs font-bold tracking-wide transition-all shadow-sm cursor-pointer"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
};
