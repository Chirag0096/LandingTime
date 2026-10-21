import React, { useState } from 'react';
import { useCookingSession } from '../../context/CookingSessionContext';
import {
  CheckCircle2,
  Check,
  TrendingDown,
  Thermometer,
  Utensils,
  Soup,
  Mic,
  Volume2,
  RotateCcw,
  FileText,
  GripVertical,
  Layers,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

export const DinnerLandedScreen: React.FC = () => {
  const {
    dishes,
    actualLandingTime,
    recoveredMinutes,
    platingItems,
    togglePlatingItem,
    markAllPlatingItems,
    restockItems,
    addRestockItem,
    finishSession,
    isSessionFinished,
    resetToFreshSession,
    handleVoiceCommand,
    openSummaryModal,
    showToast,
  } = useCookingSession();

  const [hasAddedRestock, setHasAddedRestock] = useState(false);

  const completedCount = platingItems.filter((i) => i.completed).length;
  const progressPercent = Math.round((completedCount / platingItems.length) * 100);

  const handleRestockClick = () => {
    setHasAddedRestock(true);
    addRestockItem('Heavy Cream', 'Missing during pan gravy reduction · Used Milk + Butter substitute.');
    showToast('Restock Item Flagged', 'Heavy Cream added to your household grocery restock list.');
  };

  const handleSummaryClick = () => {
    openSummaryModal();
  };

  return (
    <div className="w-full flex flex-col gap-8 pb-12">
      {/* Hero Landing Banner */}
      <section className="w-full p-6 sm:p-8 lg:p-10 rounded-3xl bg-gradient-to-b from-white to-[#F7F7F2] border border-[#E5E5DF] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1720px] mx-auto flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF4F0] text-[#3D8065] border border-[#C4DDD3] text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-[#3D8065]" />
              <span>SYNCHRONIZED LANDING ACHIEVED</span>
            </div>
            <h1 className="font-['Epilogue'] text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#202124] tracking-tight leading-tight">
              Dinner landed. Everything is ready.
            </h1>
            <p className="text-[#737780] text-base md:text-lg max-w-3xl font-normal leading-relaxed">
              Landing Time coordinated remaining thermal tasks around the oven roast variance,
              absorbing the 12-minute delay to deliver a tight 2-minute spread across all plates.
            </p>
          </div>

          {/* Serving Time Comparison Card */}
          <div className="w-full xl:w-auto min-w-[380px] sm:min-w-[420px] p-6 rounded-2xl bg-white border border-[#E5E5DF] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#737780] uppercase tracking-wider block">
                ORIGINAL TARGET
              </span>
              <span className="text-xl font-bold text-[#737780] tabular-nums">7:30 PM</span>
              <span className="text-[11px] text-[#9CA3AF] block">Model forecast</span>
            </div>

            <div className="h-12 w-px bg-[#E5E5DF]"></div>

            <div className="space-y-1 text-center">
              <span className="text-[11px] font-bold text-[#3D8065] uppercase tracking-wider block">
                ACTUAL LANDING
              </span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-['Epilogue'] text-4xl sm:text-5xl font-extrabold text-[#202124] leading-none tabular-nums tracking-tight">
                  7:37
                </span>
                <span className="text-sm font-bold text-[#737780]">PM</span>
              </div>
              <span className="text-[11px] font-semibold text-[#3D8065] bg-[#EBF4F0] border border-[#C4DDD3] px-2.5 py-0.5 rounded-full inline-block">
                Finish Spread: 2 min
              </span>
            </div>

            <div className="h-12 w-px bg-[#E5E5DF]"></div>

            <div className="space-y-1 text-right">
              <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider block">
                RECOVERED SPREAD
              </span>
              <div className="inline-flex items-center gap-1 text-[#D97706] text-xl font-bold tabular-nums">
                <span>+7m</span>
                <TrendingDown className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-[#D97706] block">
                {recoveredMinutes}m absorbed safely
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Dish Readiness Row (3 Cards with images) */}
      <section className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dish 1: Herb-Crusted Roast Chicken */}
          <div className="rounded-2xl bg-white border border-[#E5E5DF] hover:border-[#3D8065]/50 p-6 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 group">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-[#737780] uppercase tracking-wider block">
                    MAIN COURSE · OVEN CENTER RACK
                  </span>
                  <h3 className="font-['Epilogue'] text-xl font-bold text-[#202124] mt-0.5">
                    Herb-Crusted Roast Chicken
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF4F0] text-[#3D8065] border border-[#C4DDD3] text-xs font-bold tracking-wide shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>READY</span>
                </div>
              </div>

              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-[#F8F8F5] border border-[#E5E5DF]">
                <img
                  src={dishes[0]?.imageUrl}
                  alt="Herb-Crusted Roast Chicken"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[#202124] text-xs font-medium flex items-center gap-1.5 border border-[#E5E5DF]/80 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#3D8065]"></span>
                  <span className="font-semibold">165°F Verified Core</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF]">
                  <span className="text-[10px] font-bold text-[#737780] uppercase block tracking-wider">
                    TARGET FINISH
                  </span>
                  <span className="text-base font-bold text-[#202124] tabular-nums">7:35 PM</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF]">
                  <span className="text-[10px] font-bold text-[#737780] uppercase block tracking-wider">
                    RESTING STATUS
                  </span>
                  <span className="text-base font-bold text-[#3D8065]">10m Complete</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#E5E5DF] flex items-center justify-between text-xs text-[#737780]">
              <span className="flex items-center gap-1.5 font-medium text-[#202124]">
                <Check className="w-3.5 h-3.5 text-[#3D8065]" />
                Carved & warm rested
              </span>
              <span className="text-[#737780] font-medium">Board temp 148°F</span>
            </div>
          </div>

          {/* Dish 2: Crispy Smashed Potatoes */}
          <div className="rounded-2xl bg-white border border-[#E5E5DF] hover:border-[#3D8065]/50 p-6 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 group">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-[#737780] uppercase tracking-wider block">
                    SIDE DISH · STOVETOP & OVEN
                  </span>
                  <h3 className="font-['Epilogue'] text-xl font-bold text-[#202124] mt-0.5">
                    Crispy Smashed Potatoes
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF4F0] text-[#3D8065] border border-[#C4DDD3] text-xs font-bold tracking-wide shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>READY</span>
                </div>
              </div>

              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-[#F8F8F5] border border-[#E5E5DF]">
                <img
                  src={dishes[1]?.imageUrl}
                  alt="Crispy Smashed Potatoes"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[#202124] text-xs font-medium flex items-center gap-1.5 border border-[#E5E5DF]/80 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
                  <span className="font-semibold">Crust Intact · 185°F</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF]">
                  <span className="text-[10px] font-bold text-[#737780] uppercase block tracking-wider">
                    TARGET FINISH
                  </span>
                  <span className="text-base font-bold text-[#202124] tabular-nums">7:36 PM</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF]">
                  <span className="text-[10px] font-bold text-[#737780] uppercase block tracking-wider">
                    HOLDING WINDOW
                  </span>
                  <span className="text-base font-bold text-[#3D8065]">Ventilated Rack</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#E5E5DF] flex items-center justify-between text-xs text-[#737780]">
              <span className="flex items-center gap-1.5 font-medium text-[#202124]">
                <Check className="w-3.5 h-3.5 text-[#3D8065]" />
                Sea salt finish applied
              </span>
              <span className="text-[#737780] font-medium">Yield: 4 portions</span>
            </div>
          </div>

          {/* Dish 3: Sautéed Asparagus & Pan Gravy */}
          <div className="rounded-2xl bg-white border border-[#E5E5DF] hover:border-[#3D8065]/50 p-6 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 group">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-[#737780] uppercase tracking-wider block">
                    SIDE & SAUCE · BURNERS #1 & #2
                  </span>
                  <h3 className="font-['Epilogue'] text-xl font-bold text-[#202124] mt-0.5">
                    Asparagus & Pan Gravy
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF4F0] text-[#3D8065] border border-[#C4DDD3] text-xs font-bold tracking-wide shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>READY</span>
                </div>
              </div>

              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-[#F8F8F5] border border-[#E5E5DF]">
                <img
                  src={dishes[2]?.imageUrl}
                  alt="Asparagus & Pan Gravy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[#202124] text-xs font-medium flex items-center gap-1.5 border border-[#E5E5DF]/80 shadow-xs">
                  <Soup className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span className="font-semibold">Emulsion Stabilized</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF]">
                  <span className="text-[10px] font-bold text-[#737780] uppercase block tracking-wider">
                    TARGET FINISH
                  </span>
                  <span className="text-base font-bold text-[#202124] tabular-nums">7:37 PM</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF]">
                  <span className="text-[10px] font-bold text-[#737780] uppercase block tracking-wider">
                    ADAPTATION
                  </span>
                  <span className="text-base font-bold text-[#202124] truncate block">
                    Milk+Butter Sub
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#E5E5DF] flex items-center justify-between text-xs text-[#737780]">
              <span className="flex items-center gap-1.5 font-medium text-[#202124]">
                <Check className="w-3.5 h-3.5 text-[#3D8065]" />
                Skillet warm & ready
              </span>
              <span className="text-[#737780] font-medium">Delayed +7m for sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* Lower Content: Two-Column Section (55% vs 45%) */}
      <section className="w-full grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: READY TO PLATE (Plating Checklist) */}
        <div className="xl:col-span-7 rounded-2xl bg-white border border-[#E5E5DF] p-6 md:p-8 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E5DF]">
              <div>
                <div className="flex items-center gap-2">
                  <Utensils className="w-6 h-6 text-[#3D8065]" />
                  <h2 className="font-['Epilogue'] text-2xl font-bold text-[#202124]">Ready to Plate</h2>
                </div>
                <p className="text-[#737780] text-sm mt-0.5">
                  Final assembly steps before serving · Hands-free voice enabled
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[#3D8065] tabular-nums">
                  {completedCount === platingItems.length ? 'All Plated!' : `${completedCount} of ${platingItems.length}`}
                </span>
                <span className="text-[11px] font-semibold text-[#737780] uppercase block tracking-wider">
                  Steps Complete
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#F1F0E9] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#3D8065] h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* Checklist stack */}
            <div className="space-y-3">
              {platingItems.map((item) => {
                const isChecked = item.completed;
                return (
                  <label
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-[#F8F8F5] hover:bg-[#F1F0E9] transition-colors cursor-pointer border border-[#E5E5DF] select-none group"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePlatingItem(item.id)}
                      className="w-5 h-5 rounded-md border-[#E5E5DF] text-[#3D8065] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#3D8065]"
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-base font-semibold block leading-snug ${
                          isChecked ? 'line-through text-[#737780]' : 'text-[#202124]'
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="text-xs text-[#737780] mt-0.5 block">{item.description}</span>
                    </div>
                    <GripVertical className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#737780] transition-colors" />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Voice helper strip */}
          <div className="mt-8 pt-4 border-t border-[#E5E5DF] flex flex-wrap items-center justify-between gap-4 bg-[#F8F8F5] -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-5 rounded-b-2xl">
            <div className="flex items-center gap-2 text-[#0284C7] text-xs font-semibold">
              <Mic className="w-4 h-4" />
              <span>Say "Mark chicken plated" or "Mark all plated"</span>
            </div>
            <button
              onClick={markAllPlatingItems}
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#F1F0E9] text-[#202124] text-xs font-bold uppercase tracking-wider transition-all border border-[#E5E5DF] shadow-xs cursor-pointer"
            >
              MARK ALL COMPLETE
            </button>
          </div>
        </div>

        {/* Right Column: Analytics, Convergence Timeline, Pantry & Voice */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* 4 KPI Tiles Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E5E5DF] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] font-bold text-[#737780] uppercase tracking-wider block">
                TARGET ACCURACY
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Epilogue'] text-2xl font-bold text-[#D97706] tabular-nums">
                  +7m
                </span>
                <span className="text-xs font-bold text-[#3D8065]">5m recouped</span>
              </div>
              <p className="text-xs text-[#737780] mt-1">Initial drift 12m safely compressed</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E5DF] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] font-bold text-[#737780] uppercase tracking-wider block">
                COMPLETION SPREAD
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Epilogue'] text-2xl font-bold text-[#3D8065] tabular-nums">
                  2 min
                </span>
                <span className="text-[11px] text-[#9CA3AF]">7:35 - 7:37 PM</span>
              </div>
              <p className="text-xs text-[#737780] mt-1">Near-zero temperature dropoff</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E5DF] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] font-bold text-[#737780] uppercase tracking-wider block">
                DYNAMIC ADJUSTMENTS
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Epilogue'] text-2xl font-bold text-[#202124] tabular-nums">
                  2
                </span>
                <span className="text-xs font-bold text-[#3D8065]">Accepted</span>
              </div>
              <p className="text-xs text-[#737780] mt-1">Resting -5m, Asparagus +7m</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E5DF] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <span className="text-[10px] font-bold text-[#737780] uppercase tracking-wider block">
                HANDS-ON DURATION
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Epilogue'] text-2xl font-bold text-[#202124] tabular-nums">
                  34 min
                </span>
                <span className="text-[11px] text-[#9CA3AF]">of 1h 17m</span>
              </div>
              <p className="text-xs text-[#737780] mt-1">44% active execution efficiency</p>
            </div>
          </div>

          {/* Convergence Timeline Visualization */}
          <div className="rounded-2xl bg-white border border-[#E5E5DF] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-['Epilogue'] text-lg font-bold text-[#202124]">
                  Synchronization Convergence
                </h3>
                <span className="text-[10px] font-bold text-[#737780] uppercase tracking-wider">
                  PLANNED VS ACTUAL
                </span>
              </div>
              <p className="text-xs text-[#737780] mt-0.5">
                Visualizes how Landing Time adapted the stovetop tracks when the roast ran past target.
              </p>
            </div>

            <div className="my-4 p-4 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF]">
              <svg className="w-full h-auto" fill="none" viewBox="0 0 500 130" xmlns="http://www.w3.org/2000/svg">
                <text fill="#737780" fontFamily="sans-serif" fontSize="11" fontWeight="500" x="30" y="18">6:45</text>
                <text fill="#737780" fontFamily="sans-serif" fontSize="11" fontWeight="500" x="180" y="18">7:00</text>
                <text fill="#737780" fontFamily="sans-serif" fontSize="11" fontWeight="500" x="310" y="18">7:15</text>
                <text fill="#D97706" fontFamily="sans-serif" fontSize="11" fontWeight="700" x="385" y="18">7:30 [PLANNED]</text>
                <text fill="#3D8065" fontFamily="sans-serif" fontSize="11" fontWeight="700" x="460" y="18">7:37</text>
                <line stroke="#E5E5DF" strokeWidth="1" x1="30" x2="485" y1="26" y2="26"></line>

                {/* Track 1 */}
                <text fill="#202124" fontFamily="sans-serif" fontSize="11" fontWeight="600" x="30" y="46">Roast Chicken</text>
                <rect fill="#F1F0E9" height="10" rx="5" width="280" x="110" y="38"></rect>
                <rect fill="#3D8065" height="10" rx="5" width="345" x="110" y="38"></rect>
                <line stroke="#D97706" strokeDasharray="2 2" strokeWidth="2" x1="390" x2="390" y1="34" y2="52"></line>

                {/* Track 2 */}
                <text fill="#202124" fontFamily="sans-serif" fontSize="11" fontWeight="600" x="30" y="74">Smashed Potatoes</text>
                <rect fill="#F1F0E9" height="10" rx="5" width="170" x="220" y="66"></rect>
                <rect fill="#3D8065" height="10" rx="5" width="240" x="220" y="66"></rect>
                <line stroke="#D97706" strokeDasharray="2 2" strokeWidth="2" x1="390" x2="390" y1="62" y2="80"></line>

                {/* Track 3 */}
                <text fill="#202124" fontFamily="sans-serif" fontSize="11" fontWeight="600" x="30" y="102">Asparagus & Sauce</text>
                <line stroke="#0284C7" strokeDasharray="3 3" strokeWidth="1.5" x1="310" x2="360" y1="94" y2="94"></line>
                <rect fill="#3D8065" height="10" rx="5" width="115" x="360" y="94"></rect>
                <line stroke="#D97706" strokeDasharray="2 2" strokeWidth="2" x1="390" x2="390" y1="90" y2="108"></line>

                {/* Final Convergence */}
                <line stroke="#3D8065" strokeWidth="2" x1="455" x2="475" y1="36" y2="36"></line>
                <line stroke="#3D8065" strokeWidth="2" x1="475" x2="475" y1="36" y2="106"></line>
                <line stroke="#3D8065" strokeWidth="2" x1="460" x2="475" y1="106" y2="106"></line>
                <circle cx="475" cy="71" fill="#3D8065" r="3.5"></circle>
              </svg>
            </div>

            <div className="flex items-center justify-between text-xs text-[#737780]">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
                Original Schedule (7:30 PM)
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3D8065]"></span>
                Synchronized Landing (7:37 PM)
              </span>
            </div>
          </div>

          {/* PANTRY & RESTOCK CHECK */}
          <div className="rounded-2xl bg-white border border-[#E5E5DF] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#D97706]" />
                  <h3 className="font-['Epilogue'] text-lg font-bold text-[#202124]">
                    Pantry & Restock Check
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-0.5 rounded-full uppercase">
                  1 REORDER FLAGGED
                </span>
              </div>

              <p className="text-xs text-[#737780]">
                Automated consumption analysis logged missing ingredients substituted mid-cook.
              </p>

              <div className="p-4 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#202124]">Heavy Cream</span>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase">
                      Depleted
                    </span>
                  </div>
                  <p className="text-xs text-[#737780]">
                    Missing during pan gravy reduction · Used Milk + Butter substitute successfully.
                  </p>
                </div>

                <button
                  onClick={handleRestockClick}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs ${
                    hasAddedRestock
                      ? 'bg-[#EBF4F0] text-[#3D8065] border border-[#C4DDD3]'
                      : 'bg-[#3D8065] hover:bg-[#336C55] text-white'
                  }`}
                >
                  {hasAddedRestock ? 'ADDED TO RESTOCK' : '+ RESTOCK LIST'}
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E5DF] flex items-center justify-between text-xs text-[#737780]">
              <span>Active pantry inventory tracks 14 ingredients</span>
              <button
                onClick={() => showToast('Pantry Log', 'Viewing 14 tracked kitchen essentials inventory.')}
                className="text-[#3D8065] font-semibold hover:underline"
              >
                View Pantry Log →
              </button>
            </div>
          </div>

          {/* LANDING TIME ASSISTANT: Voice Companion */}
          <div className="rounded-2xl bg-white border border-[#E5E5DF] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0284C7] animate-pulse"></div>
                  <span className="text-xs font-bold text-[#0284C7] uppercase tracking-wider">
                    LANDING TIME ASSISTANT
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#737780] uppercase tracking-wide">
                  VOICE COMPANION ACTIVE
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 text-[#0284C7] shadow-xs border border-[#BAE6FD]">
                  <Volume2 className="w-5 h-5" />
                </div>
                <p className="text-sm text-[#202124] leading-relaxed italic">
                  "Dinner is ready! All dishes are synchronized within 2 minutes. Your plating checklist is ready on screen, and I've flagged heavy cream for your restock list."
                </p>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-bold text-[#737780] uppercase mr-1">Suggestions:</span>
                <button
                  onClick={() => handleVoiceCommand("What's left to plate?")}
                  className="px-3 py-1.5 rounded-full bg-[#F8F8F5] hover:bg-[#F1F0E9] text-[#202124] text-xs font-medium transition-colors border border-[#E5E5DF] flex items-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>"What's left to plate?"</span>
                </button>
                <button
                  onClick={() => handleVoiceCommand('Add cream to restock')}
                  className="px-3 py-1.5 rounded-full bg-[#F8F8F5] hover:bg-[#F1F0E9] text-[#202124] text-xs font-medium transition-colors border border-[#E5E5DF] flex items-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>"Add cream to restock"</span>
                </button>
                <button
                  onClick={() => handleVoiceCommand('Save session summary')}
                  className="px-3 py-1.5 rounded-full bg-[#F8F8F5] hover:bg-[#F1F0E9] text-[#202124] text-xs font-medium transition-colors border border-[#E5E5DF] flex items-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>"Save session summary"</span>
                </button>
                <button
                  onClick={() => handleVoiceCommand('Start another meal')}
                  className="px-3 py-1.5 rounded-full bg-[#F8F8F5] hover:bg-[#F1F0E9] text-[#202124] text-xs font-medium transition-colors border border-[#E5E5DF] flex items-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>"Start another meal"</span>
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E5DF] flex items-center justify-between text-xs text-[#737780]">
              <span>Counter Mic sensitivity tuned for kitchen noise</span>
              <span className="text-[#3D8065] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3D8065]"></span>
                Awaiting Command
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Kitchen Action Bar */}
      <footer className="w-full rounded-2xl bg-white border border-[#E5E5DF] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSummaryClick}
            className="h-12 md:h-14 px-5 md:px-6 rounded-2xl bg-white border border-[#E5E5DF] hover:bg-[#F8F8F5] text-[#202124] text-xs md:text-sm font-bold tracking-wide transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#737780]" />
            <span>VIEW COOKING SUMMARY</span>
          </button>

          <button
            onClick={resetToFreshSession}
            className="h-12 md:h-14 px-5 md:px-6 rounded-2xl bg-white border border-[#E5E5DF] hover:bg-[#F8F8F5] text-[#737780] hover:text-[#202124] text-xs md:text-sm font-bold tracking-wide transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#737780]" />
            <span>START ANOTHER MEAL</span>
          </button>
        </div>

        {/* Dominant 60px Sage Green button "FINISH SESSION" */}
        <button
          onClick={finishSession}
          disabled={isSessionFinished}
          className={`h-[56px] md:h-[60px] px-8 md:px-12 rounded-2xl text-white font-['Epilogue'] text-base md:text-lg font-bold tracking-wide transition-all duration-200 shadow-md shadow-[#3D8065]/20 flex items-center gap-3 cursor-pointer ${
            isSessionFinished
              ? 'bg-[#265442] opacity-90'
              : 'bg-[#3D8065] hover:bg-[#336C55] active:scale-[0.99]'
          }`}
        >
          <CheckCircle2 className="w-6 h-6" />
          <span>{isSessionFinished ? 'SESSION ARCHIVED' : 'FINISH SESSION'}</span>
        </button>
      </footer>
    </div>
  );
};
