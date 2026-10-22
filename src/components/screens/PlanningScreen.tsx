import React, { useState } from 'react';
import { useCookingSession } from '../../context/CookingSessionContext';
import { AddDishModal } from '../AddDishModal';
import { VerificationOverlay } from '../VerificationOverlay';
import {
  Flame,
  Link as LinkIcon,
  Zap,
  Timer,
  Hourglass,
  Clock,
  Microwave,
  CookingPot,
  PlusCircle,
  CheckCircle,
  TrendingDown,
  Calendar,
  Minus,
  Plus,
  Sliders,
  Sparkles,
  ArrowRight,
  Trash2,
  Edit2,
  Workflow,
} from 'lucide-react';

export const PlanningScreen: React.FC = () => {
  const {
    dishes,
    removeDish,
    targetHour,
    targetMinute,
    meridiem,
    setMeridiem,
    adjustMinutes,
    setTimePreset,
    formattedTargetTime,
    calculatedPrepTriggerTime,
    activeEffortMinutes,
    passiveCookingMinutes,
    totalLeadMinutes,
    openVerificationModal,
    openEditDishModal,
    openSavePlanModal,
    showToast,
    sessionId,
  } = useCookingSession();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const hourStr = targetHour < 10 ? `0${targetHour}` : `${targetHour}`;
  const minuteStr = targetMinute < 10 ? `0${targetMinute}` : `${targetMinute}`;

  return (
    <div className="w-full pb-16">
      {/* Top Intro Section */}
      <div className="w-full mb-4 sm:mb-5 flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div className="flex flex-col max-w-3xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3D8065]"></span>
            <span className="text-[10px] font-bold tracking-widest text-[#3D8065] uppercase">
              PLAN YOUR MEAL
            </span>
            <span className="text-[#E5E5DF] text-xs">/</span>
            <span className="text-[10px] font-semibold tracking-wider text-[#737780] uppercase">
              SYNCHRONIZED DEPLOYMENT
            </span>
          </div>
          <h1 className="font-['Epilogue'] text-2xl lg:text-3xl text-[#202124] tracking-tight font-bold leading-tight">
            Let's get dinner to the table together.
          </h1>
          <p className="text-[13px] sm:text-sm leading-relaxed text-[#737780] mt-1 max-w-2xl font-normal">
            Add the dishes you want to serve. Landing Time will coordinate your cooking steps, oven
            thermal capacity, and stovetop stages backwards from one shared landing moment.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 bg-white border border-[#E5E5DF] px-3.5 py-1.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3D8065] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3D8065]"></span>
          </div>
          <span className="text-xs font-bold text-[#202124] tracking-wider uppercase">
            PLANNING MODE
          </span>
          <span
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(sessionId);
                showToast('Session UUID Copied', sessionId, 'info');
              }
            }}
            title="Click to copy full Session UUID"
            className="text-[10px] px-2 py-0.5 rounded-full bg-[#F8F8F5] border border-[#E5E5DF] text-[#737780] font-mono font-medium cursor-pointer hover:bg-[#EBF4F0] hover:text-[#3D8065] transition-colors"
          >
            SESSION #{sessionId ? sessionId.slice(0, 8) : '284'}
          </span>
        </div>
      </div>

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* LEFT COLUMN: Dish Orchestration (~60%) */}
        <section aria-labelledby="menu-heading" className="lg:col-span-7 flex flex-col gap-3">
          {/* Dish Section Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <h2 id="menu-heading" className="text-xs font-bold text-[#202124] tracking-wider uppercase">
                YOUR MENU
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EBF4F0] text-[#265442] font-semibold tracking-wide border border-[#C4DDD3] whitespace-nowrap shrink-0">
                {dishes.length} DISHES SELECTED
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#737780] text-xs font-medium">
              <Workflow className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span>PARALLEL EXECUTION</span>
            </div>
          </div>

          {/* Dish Cards Container */}
          <div className="flex flex-col gap-3">
            {dishes.map((dish) => (
              <article
                key={dish.id}
                className="group relative bg-white border border-[#E5E5DF] rounded-2xl p-3 sm:p-3.5 hover:border-[#E5E5DF]/80 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03)] transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-3.5">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-[#F1F0E9] ring-1 ring-black/5 shadow-inner">
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs text-[9px] px-1.5 py-0.2 rounded text-white font-mono font-medium">
                        {dish.code}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[#265442] px-2 py-0.5 rounded-md bg-[#EBF4F0] uppercase">
                          {dish.category}
                        </span>
                        {dish.priorityNote && (
                          <span className="text-[10px] sm:text-[11px] text-[#737780] flex items-center gap-1 font-mono">
                            <Flame className="w-3.5 h-3.5 text-[#D97706]" />
                            {dish.priorityNote}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-[#202124] group-hover:text-[#3D8065] transition-colors leading-snug">
                        {dish.name}
                      </h3>
                      <p className="text-xs text-[#737780] mt-0.5 line-clamp-2 sm:line-clamp-1">
                        {dish.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 pt-1 sm:pt-0">
                    <button
                      onClick={() => openEditDishModal(dish)}
                      aria-label={`Edit ${dish.name}`}
                      className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#F8F8F5] hover:bg-[#F1F0E9] text-[#202124] text-xs font-semibold transition-colors flex items-center gap-1 border border-[#E5E5DF] cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#737780]" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => removeDish(dish.id)}
                      aria-label={`Remove ${dish.name}`}
                      className="w-8 h-8 rounded-lg bg-[#F8F8F5] hover:bg-red-50 hover:text-red-600 text-[#737780] transition-colors flex items-center justify-center border border-[#E5E5DF]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Timeline Phases & Appliance Chips */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#E5E5DF]/60 bg-[#F8F8F5]/50 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    {dish.prepMinutes > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#E5E5DF] text-[#202124] text-xs font-mono">
                        <Timer className="w-3.5 h-3.5 text-[#737780]" />
                        <span>Prep {dish.prepMinutes}m</span>
                      </span>
                    )}

                    {dish.thermalMinutes > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] text-xs font-mono font-medium">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{dish.thermalTemp || `Oven ${dish.thermalMinutes}m`}</span>
                      </span>
                    )}

                    {dish.restMinutes > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#E5E5DF] text-[#737780] text-xs font-mono">
                        <Hourglass className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span>Rest {dish.restMinutes}m</span>
                      </span>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F0E9] border border-[#E5E5DF] text-[#202124] text-[11px] font-semibold tracking-wider">
                    {dish.appliance.includes('OVEN') ? (
                      <Microwave className="w-3.5 h-3.5 text-[#D97706]" />
                    ) : (
                      <CookingPot className="w-3.5 h-3.5 text-[#3D8065]" />
                    )}
                    <span>{dish.appliance}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Add Dish Action */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full h-13 py-3.5 rounded-2xl bg-white hover:bg-[#F8F8F5] text-[#202124] border border-dashed border-[#E5E5DF] hover:border-[#737780]/40 flex items-center justify-center gap-2 text-sm font-semibold tracking-wide transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3D8065]/20"
          >
            <PlusCircle className="w-5 h-5 text-[#3D8065]" />
            <span>+ ADD ANOTHER DISH</span>
          </button>

          {/* Calibration Footnote */}
          <div className="flex items-center justify-between px-2 pt-1 text-[#737780] text-xs">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#3D8065]" />
              <span>Estimates calibrated for standard residential convection & gas ranges</span>
            </div>
            <span className="font-mono text-[#9CA3AF] text-[11px]">TOLERANCE ±2 MIN</span>
          </div>

          {/* Live Timeline Synchronizer Preview */}
          <div className="bg-white border border-[#E5E5DF] rounded-2xl p-5 mt-2 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4 text-[#3D8065]" />
                <span className="text-xs font-bold text-[#202124] tracking-wider uppercase">
                  SYNCHRONIZATION CASCADE
                </span>
              </div>
              <span className="font-mono text-xs text-[#737780]">
                T-minus {totalLeadMinutes} min start
              </span>
            </div>

            {/* Tabular Gantt Mini Graphic */}
            <div className="w-full bg-[#F8F8F5] border border-[#E5E5DF] p-3.5 rounded-xl flex flex-col gap-2.5">
              {/* Track 1: Chicken */}
              <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs font-medium text-[#737780] truncate">
                  Roast Chicken
                </span>
                <div className="relative flex-1 h-3 bg-[#F1F0E9] rounded-full overflow-hidden flex">
                  <div className="w-[14%] bg-[#3D8065]/60 h-full" title="Prep 10m"></div>
                  <div className="w-[64%] bg-[#D97706] h-full" title="Oven 45m"></div>
                  <div className="w-[22%] bg-[#0284C7] h-full" title="Rest 15m"></div>
                </div>
                <span className="w-10 text-right font-mono text-xs font-semibold text-[#202124] shrink-0">
                  70m
                </span>
              </div>

              {/* Track 2: Potatoes */}
              <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs font-medium text-[#737780] truncate">
                  Smashed Pot.
                </span>
                <div className="relative flex-1 h-3 bg-[#F1F0E9] rounded-full overflow-hidden flex">
                  <div className="w-[35%] bg-transparent h-full"></div>
                  <div className="w-[21%] bg-[#0284C7]/70 h-full" title="Boil 15m"></div>
                  <div className="w-[8%] bg-[#3D8065]/60 h-full" title="Smash 5m"></div>
                  <div className="w-[36%] bg-[#D97706] h-full" title="Bake 25m"></div>
                </div>
                <span className="w-10 text-right font-mono text-xs font-semibold text-[#202124] shrink-0">
                  45m
                </span>
              </div>

              {/* Track 3: Asparagus */}
              <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs font-medium text-[#737780] truncate">
                  Asparagus & Jus
                </span>
                <div className="relative flex-1 h-3 bg-[#F1F0E9] rounded-full overflow-hidden flex">
                  <div className="w-[82%] bg-transparent h-full"></div>
                  <div className="w-[18%] bg-[#3D8065] h-full" title="Active Finish 12m"></div>
                </div>
                <span className="w-10 text-right font-mono text-xs font-semibold text-[#202124] shrink-0">
                  12m
                </span>
              </div>

              {/* Sync Marker Line */}
              <div className="flex items-center justify-between pt-1 border-t border-[#E5E5DF] text-[11px] text-[#737780] font-mono">
                <span>{calculatedPrepTriggerTime} (Prep Start)</span>
                <span className="text-[#3D8065] font-bold">{formattedTargetTime} (All Landed)</span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Serving Time & Plan Readiness (~40%) */}
        <aside className="lg:col-span-5 flex flex-col gap-3.5 sticky top-[92px]">
          {/* CARD A: Target Serving Time */}
          <section className="bg-white border border-[#E5E5DF] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-3.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#3D8065] uppercase">
                  TARGET SERVING TIME
                </span>
                <h2 className="text-sm sm:text-base font-semibold text-[#202124] mt-0.5">When should dinner land?</h2>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F8F8F5] border border-[#E5E5DF] text-[#202124] text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#737780]" />
                <span>Today, Nov 14</span>
              </div>
            </div>

            {/* Tactile Display Time Picker Module */}
            <div className="bg-[#F8F8F5] border border-[#E5E5DF] rounded-2xl p-3 sm:p-3.5 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center justify-center gap-2.5">
                {/* Digital Tabular Clock */}
                <div className="flex items-baseline font-['Epilogue'] text-4xl tracking-tight font-bold text-[#202124] font-mono select-none">
                  <span>{hourStr}</span>
                  <span className="text-[#3D8065] mx-1 animate-pulse">:</span>
                  <span>{minuteStr}</span>
                </div>

                {/* AM/PM Segmented Control */}
                <div className="flex flex-col rounded-xl bg-[#F1F0E9] p-0.5 ml-2 border border-[#E5E5DF]">
                  <button
                    onClick={() => setMeridiem('AM')}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                      meridiem === 'AM'
                        ? 'bg-white text-[#202124] shadow-xs border border-[#E5E5DF]'
                        : 'text-[#737780] hover:text-[#202124]'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    onClick={() => setMeridiem('PM')}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                      meridiem === 'PM'
                        ? 'bg-white text-[#202124] shadow-xs border border-[#E5E5DF]'
                        : 'text-[#737780] hover:text-[#202124]'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Stepper Controls (+/- 15 min & presets) */}
              <div className="grid grid-cols-4 w-full gap-1.5">
                <button
                  onClick={() => adjustMinutes(-15)}
                  aria-label="Decrease time by 15 minutes"
                  className="h-9 rounded-xl bg-white hover:bg-[#F1F0E9] text-[#202124] border border-[#E5E5DF] flex items-center justify-center gap-1 text-xs font-bold transition-colors active:scale-95 shadow-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>15m</span>
                </button>

                <button
                  onClick={() => setTimePreset(7, 0, 'PM')}
                  className={`h-9 rounded-xl border font-mono text-xs font-semibold transition-colors shadow-xs ${
                    targetHour === 7 && targetMinute === 0 && meridiem === 'PM'
                      ? 'bg-[#EBF4F0] text-[#265442] border-[#C4DDD3] font-bold'
                      : 'bg-white hover:bg-[#F1F0E9] text-[#737780] hover:text-[#202124] border-[#E5E5DF]'
                  }`}
                >
                  7:00
                </button>

                <button
                  onClick={() => setTimePreset(7, 30, 'PM')}
                  className={`h-9 rounded-xl border font-mono text-xs transition-colors shadow-xs ${
                    targetHour === 7 && targetMinute === 30 && meridiem === 'PM'
                      ? 'bg-[#EBF4F0] text-[#265442] border-[#C4DDD3] font-bold'
                      : 'bg-white hover:bg-[#F1F0E9] text-[#737780] hover:text-[#202124] border-[#E5E5DF]'
                  }`}
                >
                  7:30
                </button>

                <button
                  onClick={() => adjustMinutes(15)}
                  aria-label="Increase time by 15 minutes"
                  className="h-9 rounded-xl bg-white hover:bg-[#F1F0E9] text-[#202124] border border-[#E5E5DF] flex items-center justify-center gap-1 text-xs font-bold transition-colors active:scale-95 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>15m</span>
                </button>
              </div>
            </div>

            {/* Dynamic Backward Scheduling Explainer */}
            <div className="p-3 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#3D8065] mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#3D8065] uppercase tracking-wider">
                  TARGET LANDING — {formattedTargetTime}
                </span>
                <p className="text-xs text-[#737780] mt-0.5 leading-relaxed">
                  We'll work backward to generate step alerts. First chicken prep triggers at{' '}
                  <span className="text-[#202124] font-semibold font-mono">
                    {calculatedPrepTriggerTime}
                  </span>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* CARD B: Cooking Workload Metrics */}
          <section className="bg-white border border-[#E5E5DF] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-[#202124] uppercase">
                YOUR COOKING PLAN
              </span>
              <span className="text-[10px] text-[#9CA3AF] font-mono">
                TOTAL ESTIMATE {totalLeadMinutes}M
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Metric 1: Active Time */}
              <div className="bg-[#F8F8F5] border border-[#E5E5DF] rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-[#737780] font-semibold uppercase tracking-wider">
                  ACTIVE EFFORT
                </span>
                <div className="my-1">
                  <span className="text-2xl font-bold text-[#3D8065] font-mono">
                    {activeEffortMinutes}
                  </span>
                  <span className="text-[11px] text-[#9CA3AF] font-semibold ml-1">MIN</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#737780]">
                  <CookingPot className="w-3.5 h-3.5 text-[#3D8065]" />
                  <span>Chop, baste, stir</span>
                </div>
              </div>

              {/* Metric 2: Passive Time */}
              <div className="bg-[#F8F8F5] border border-[#E5E5DF] rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-[#737780] font-semibold uppercase tracking-wider">
                  PASSIVE COOKING
                </span>
                <div className="my-1">
                  <span className="text-2xl font-bold text-[#D97706] font-mono">
                    {passiveCookingMinutes}
                  </span>
                  <span className="text-[11px] text-[#9CA3AF] font-semibold ml-1">MIN</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#737780]">
                  <Hourglass className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Bake, simmer, rest</span>
                </div>
              </div>
            </div>

            {/* Summary Badge Strip */}
            <div className="py-1.5 px-3 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] flex items-center justify-between text-[#737780] text-[10px] font-mono">
              <span>{dishes.length} DISHES</span>
              <span>•</span>
              <span>SHARED APPLIANCES</span>
              <span>•</span>
              <span className="text-[#3D8065] font-bold">LOCKED TIMELINE</span>
            </div>
          </section>

          {/* CARD C: Equipment Readiness Check */}
          <section className="bg-white border border-[#E5E5DF] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-[#202124] uppercase">
                EQUIPMENT CHECK
              </span>
              <Sliders className="w-3.5 h-3.5 text-[#9CA3AF]" />
            </div>

            <div className="flex flex-col gap-2">
              {/* Row 1: Oven */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0 mt-0.5">
                    <Microwave className="w-4 h-4 text-[#D97706]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#202124]">
                      SHARED OVEN (425°F)
                    </span>
                    <p className="text-[11px] text-[#737780] mt-0.5 leading-snug">
                      Roast Chicken & Smashed Potatoes fit side-by-side on upper/middle racks.
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] uppercase">
                  READY
                </span>
              </div>

              {/* Row 2: Stovetop */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center shrink-0 mt-0.5">
                    <CookingPot className="w-4 h-4 text-[#0284C7]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#202124]">2 OF 4 BURNERS</span>
                    <p className="text-[11px] text-[#737780] mt-0.5 leading-snug">
                      Boiling potatoes (Front Left) & Asparagus finishing skillet (Front Right).
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-[#F0F9FF] border border-[#BAE6FD] text-[#0284C7] uppercase">
                  READY
                </span>
              </div>
            </div>
          </section>

          {/* Primary Action & Save Trigger */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={openVerificationModal}
              className="w-full h-13 sm:h-14 rounded-xl bg-[#3D8065] hover:bg-[#336C55] text-white flex items-center justify-center gap-2 text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-[#3D8065]/20 cursor-pointer"
            >
              <span>START LIVE COOK-ALONG</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={openSavePlanModal}
              className="w-full py-1 text-center text-[#737780] hover:text-[#202124] text-[11px] font-semibold tracking-wide transition-colors cursor-pointer"
            >
              SAVE PLAN FOR LATER
            </button>
          </div>
        </aside>
      </div>

      {/* Add Dish Modal */}
      <AddDishModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Sequence Verification Overlay */}
      <VerificationOverlay />
    </div>
  );
};
