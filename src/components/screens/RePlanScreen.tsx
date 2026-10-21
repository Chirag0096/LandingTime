import React, { useState } from 'react';
import { useCookingSession } from '../../context/CookingSessionContext';
import {
  AlertTriangle,
  Clock,
  TrendingDown,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight,
  Info,
  Utensils,
  Flame,
  CookingPot,
  History,
  Edit3,
  X,
} from 'lucide-react';

export const RePlanScreen: React.FC = () => {
  const {
    delayDetectedMinutes,
    recoveredMinutes,
    setRecoveredMinutes,
    projectedLandingTime,
    proposedAdjustments,
    acceptReplan,
    keepOriginalPlan,
    formattedTargetTime,
  } = useCookingSession();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempRecoverMins, setTempRecoverMins] = useState(recoveredMinutes);

  const handleSaveEdit = () => {
    setRecoveredMinutes(tempRecoverMins);
    setIsEditModalOpen(false);
  };

  return (
    <div className="w-full flex flex-col gap-4 lg:gap-5 pb-32">
      {/* ALERT HERO BANNER */}
      <section className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-[#FDE68A] shadow-[0_4px_16px_-2px_rgba(0,0,0,0.06)] relative overflow-hidden bg-gradient-to-br from-[#FEF3C7]/30 via-white to-white">
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-[#D97706] rounded-l-2xl"></div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6 items-center pl-2">
          {/* Alert Text and Details */}
          <div className="xl:col-span-7 flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706] shadow-xs shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h1 className="font-['Epilogue'] text-[20px] sm:text-[24px] lg:text-[26px] font-bold text-[#202124] tracking-tight">
                A cooking delay was detected
              </h1>
            </div>

            <p className="text-[14px] sm:text-[15px] text-[#202124] font-medium leading-snug">
              Chicken needs <span className="text-[#D97706] font-semibold">{delayDetectedMinutes} additional minutes</span> in the oven (internal temp probe reads{' '}
              <span className="text-[#D97706] font-mono font-semibold">152°F</span>, targeting{' '}
              <span className="text-[#3D8065] font-mono font-semibold">165°F</span>).
            </p>

            <p className="text-[12px] text-[#737780] leading-relaxed">
              The unadjusted plan would push dinner to 7:42 PM. Landing Time evaluated appliance availability, rest moisture retention, and pan dependencies to recover {recoveredMinutes} minutes.
            </p>
          </div>

          {/* 3 Metrics summary cards */}
          <div className="xl:col-span-5 grid grid-cols-3 gap-2.5">
            {/* Metric 1 */}
            <div className="bg-[#F8F8F5] rounded-xl p-3 border border-[#E5E5DF] flex flex-col justify-between">
              <span className="text-[9px] font-bold tracking-wider uppercase text-[#737780]">
                DELAY DETECTED
              </span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="font-['Epilogue'] text-[20px] sm:text-[24px] text-[#D97706] font-bold tabular-nums">
                  +{delayDetectedMinutes}
                </span>
                <span className="text-[11px] text-[#D97706] font-semibold">MIN</span>
              </div>
              <span className="text-[10px] text-[#737780]">Internal temp delta</span>
            </div>

            {/* Metric 2 */}
            <div className="bg-[#F8F8F5] rounded-xl p-3 border border-[#E5E5DF] flex flex-col justify-between opacity-85">
              <span className="text-[9px] font-bold tracking-wider uppercase text-[#9CA3AF]">
                ORIGINAL TARGET
              </span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="font-['Epilogue'] text-[20px] sm:text-[24px] text-[#737780] line-through tabular-nums font-semibold">
                  {formattedTargetTime.replace(/ [AP]M/, '')}
                </span>
                <span className="text-[11px] text-[#9CA3AF]">PM</span>
              </div>
              <span className="text-[10px] text-[#9CA3AF]">Planned landing</span>
            </div>

            {/* Metric 3 */}
            <div className="bg-white rounded-xl p-3 border border-[#C4DDD3] flex flex-col justify-between shadow-xs relative overflow-hidden bg-gradient-to-b from-[#EBF4F0]/40 to-white">
              <span className="text-[9px] font-bold tracking-wider uppercase text-[#202124]">
                PROJECTED LANDING
              </span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="font-['Epilogue'] text-[20px] sm:text-[24px] text-[#202124] font-bold tabular-nums">
                  {projectedLandingTime.replace(/ [AP]M/, '')}
                </span>
                <span className="text-[11px] text-[#202124] font-semibold">PM</span>
              </div>
              <div className="inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded-full bg-[#3D8065] text-white text-[9px] font-bold tracking-tight shadow-xs">
                <TrendingDown className="w-2.5 h-2.5" />
                <span>RECOVERED {recoveredMinutes} MIN</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TWO-COLUMN COMPOSITION: PROPOSED CHANGES (60%) vs WHY THIS PLAN (40%) */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        {/* LEFT COLUMN: PROPOSED SCHEDULE CHANGES */}
        <div className="lg:col-span-7 flex flex-col gap-3 bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E5DF] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E5DF]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#3D8065]" />
              <h2 className="font-['Epilogue'] text-[16px] sm:text-[17px] font-bold text-[#202124] tracking-tight">
                PROPOSED SCHEDULE CHANGES
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F1F0E9] border border-[#E5E5DF] text-[#202124]">
                {proposedAdjustments.length} ADJUSTMENTS
              </span>
              <span className="text-[10px] text-[#9CA3AF] hidden sm:inline">Review before applying</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {proposedAdjustments.map((adj) => (
              <div
                key={adj.id}
                className="bg-[#F8F8F5] rounded-xl p-4 border border-[#E5E5DF] hover:border-[#D97706]/40 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706] shrink-0 shadow-xs">
                      {adj.id === 'adj-1' ? (
                        <Utensils className="w-5 h-5" />
                      ) : adj.id === 'adj-2' ? (
                        <Flame className="w-5 h-5" />
                      ) : (
                        <CookingPot className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] text-[#202124] font-bold">{adj.title}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] uppercase">
                          {adj.changeBadge}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[13px] text-[#9CA3AF] line-through tabular-nums">
                          {adj.originalText}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#737780]" />
                        <span className="text-[13px] text-[#D97706] font-bold tabular-nums">
                          {adj.proposedText}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-col items-end shrink-0">
                    <span className="text-[10px] text-[#737780] uppercase font-semibold tracking-wider">
                      {adj.tag}
                    </span>
                    <span className="text-[12px] text-[#3D8065] font-bold">{adj.tagValue}</span>
                  </div>
                </div>

                <p className="text-[13px] text-[#737780] mt-3 pl-0 sm:pl-[52px] leading-relaxed">
                  {adj.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: WHY THIS PLAN? */}
        <div className="lg:col-span-5 flex flex-col gap-3 bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E5DF] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E5DF]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3D8065]" />
              <h2 className="font-['Epilogue'] text-[16px] sm:text-[17px] font-bold text-[#202124] tracking-tight">
                WHY THIS PLAN?
              </h2>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EBF4F0] border border-[#C4DDD3] text-[#3D8065]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">CONFLICTS RESOLVED</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Rationale 1 */}
            <div className="bg-[#F8F8F5] rounded-xl p-3 border border-[#E5E5DF] flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#202124] font-bold text-[13px]">
                <CookingPot className="w-4 h-4 text-[#3D8065]" />
                <h4>Dependency-Aware Stovetop Sync</h4>
              </div>
              <p className="text-[12px] text-[#737780] leading-relaxed pl-[24px]">
                Asparagus deglazing relies directly on warm pan drippings from carved chicken. Shifting the stovetop start aligns skillet searing directly with the revised rest termination.
              </p>
            </div>

            {/* Rationale 2 */}
            <div className="bg-[#F8F8F5] rounded-xl p-3 border border-[#E5E5DF] flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#202124] font-bold text-[13px]">
                <Flame className="w-4 h-4 text-[#D97706]" />
                <h4>Appliance Thermal Continuity</h4>
              </div>
              <p className="text-[12px] text-[#737780] leading-relaxed pl-[24px]">
                Oven remains reserved at 425°F for potatoes until 7:20 PM. Zero thermal drops or compartment collisions occur between the extended chicken roast and potato crisping finish.
              </p>
            </div>

            {/* Rationale 3 */}
            <div className="bg-[#F8F8F5] rounded-xl p-3 border border-[#E5E5DF] flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#202124] font-bold text-[13px]">
                <CheckCircle2 className="w-4 h-4 text-[#3D8065]" />
                <h4>Culinary Safety & Crisp Barrier</h4>
              </div>
              <p className="text-[12px] text-[#737780] leading-relaxed pl-[24px]">
                Rest time reduction was strictly capped at the 10-minute floor. Potato holding specifies dry ventilation guidance so trapped moisture won't compromise crunchy starch lattices.
              </p>
            </div>

            {/* Feasibility Boundary Callout */}
            <div className="bg-[#FEF3C7]/70 rounded-xl p-3 border border-[#FDE68A] flex items-start gap-2.5 mt-0.5">
              <Info className="w-4 h-4 text-[#D97706] mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-[#D97706] font-bold uppercase tracking-wider">
                  FEASIBILITY BOUNDARY
                </span>
                <p className="text-[11px] text-[#202124] mt-0.5 leading-snug">
                  Target {formattedTargetTime} cannot be achieved without sacrificing safe chicken rest (&lt;10m).{' '}
                  <strong className="font-bold text-[#202124]">
                    {projectedLandingTime} is the mathematically earliest safe, conflict-free landing time.
                  </strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE COMPARISON SECTION */}
      <section className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E5DF] shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col gap-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-2.5 border-b border-[#E5E5DF] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#3D8065]" />
              <h2 className="font-['Epilogue'] text-[16px] sm:text-[17px] font-bold text-[#202124] tracking-tight">
                TIMELINE COMPARISON
              </h2>
            </div>
            <p className="text-[12px] text-[#737780] mt-0.5">
              Ghosted muted bars represent original timetable · Solid bars depict proposed dynamic recovery
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#3D8065]"></span>
              <span className="text-[11px] text-[#202124] font-medium">Active Cooking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#D97706]"></span>
              <span className="text-[11px] text-[#202124] font-medium">Delay Extension (+12m)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#4F46E5]"></span>
              <span className="text-[11px] text-[#202124] font-medium">Resting / Warm Hold</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#F1F0E9] border border-[#E5E5DF]"></span>
              <span className="text-[11px] text-[#9CA3AF] font-medium">Original Planned Slot</span>
            </div>
          </div>
        </div>

        {/* Gantt Chart Comparison Wrapper */}
        <div className="w-full bg-[#F8F8F5] rounded-xl p-5 border border-[#E5E5DF] overflow-x-auto">
          <div className="min-w-[920px] flex flex-col gap-6 relative pb-2">
            {/* Time Axis */}
            <div className="relative w-full h-8 flex items-center text-[#737780] font-semibold text-[11px] select-none border-b border-[#E5E5DF] pb-2">
              <div className="absolute left-0 -translate-x-1/2">6:45 PM</div>
              <div className="absolute left-[25%] -translate-x-1/2">7:00 PM</div>
              <div className="absolute left-[50%] -translate-x-1/2">7:15 PM</div>
              <div className="absolute left-[58.3%] -translate-x-1/2 text-[#9CA3AF]">7:20 PM</div>
              <div className="absolute left-[75%] -translate-x-1/2 text-[#9CA3AF] line-through">
                7:30 PM (OLD)
              </div>
              <div className="absolute left-[86.6%] -translate-x-1/2 text-[#D97706] font-bold">
                {projectedLandingTime} (NEW)
              </div>
              <div className="absolute left-[100%] -translate-x-full">7:45 PM</div>
            </div>

            {/* Vertical markers */}
            <div className="absolute top-8 bottom-0 left-[21.6%] w-0.5 bg-[#3D8065] z-20 pointer-events-none flex flex-col justify-between">
              <span className="bg-[#3D8065] text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-white shadow-md -translate-x-1/2 -mt-3.5 uppercase z-30 inline-block whitespace-nowrap">
                NOW 6:58
              </span>
            </div>
            <div className="absolute top-8 bottom-0 left-[75%] w-0.5 bg-[#9CA3AF]/50 border-r border-dashed border-[#9CA3AF] z-10 pointer-events-none flex flex-col justify-end">
              <span className="bg-white/95 backdrop-blur-xs border border-[#E5E5DF] text-[#9CA3AF] text-[10px] font-semibold px-2 py-0.5 rounded-full ring-2 ring-white shadow-xs -translate-x-1/2 mb-0.5 line-through whitespace-nowrap">
                7:30 PM
              </span>
            </div>
            <div className="absolute top-8 bottom-0 left-[86.6%] w-0.5 bg-[#D97706] z-20 pointer-events-none flex flex-col justify-end">
              <span className="bg-[#D97706] text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-white shadow-md -translate-x-1/2 mb-0.5 z-30 inline-block whitespace-nowrap">
                {projectedLandingTime}
              </span>
            </div>

            {/* TRACK 1 */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center justify-between text-[#202124]">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#D97706]" />
                  <span className="text-[13px] font-bold">1. Roast Whole Chicken</span>
                  <span className="text-[12px] text-[#9CA3AF]">(Oven Top Rack)</span>
                </div>
                <span className="text-[12px] text-[#D97706] font-semibold">
                  +{delayDetectedMinutes}m extended roast · {15 - recoveredMinutes}m rest window
                </span>
              </div>
              <div className="w-full h-11 bg-white rounded-lg border border-[#E5E5DF] relative flex items-center overflow-hidden shadow-inner">
                <div className="absolute left-0 w-[50%] h-3 bg-[#F1F0E9] border-y border-[#E5E5DF] top-1 rounded-xs opacity-80"></div>
                <div className="absolute left-[50%] w-[25%] h-3 bg-[#F1F0E9] border-y border-[#E5E5DF] top-1 rounded-xs opacity-60"></div>

                <div className="absolute left-0 w-[50%] h-8 bg-[#3D8065] rounded-l-md flex items-center px-3 text-[11px] font-bold text-white shadow-xs truncate">
                  Active Roast (to 7:15)
                </div>
                <div className="absolute left-[50%] w-[20%] h-8 bg-[#D97706] flex items-center px-2.5 text-[11px] font-bold text-white shadow-xs truncate">
                  +{delayDetectedMinutes}m Temp Recovery
                </div>
                <div className="absolute left-[70%] w-[16.6%] h-8 bg-[#4F46E5] rounded-r-md flex items-center justify-center text-[11px] font-bold text-white shadow-xs truncate">
                  Rest {15 - recoveredMinutes}m
                </div>
              </div>
            </div>

            {/* TRACK 2 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[#202124]">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#4F46E5]" />
                  <span className="text-[13px] font-bold">2. Crispy Smashed Potatoes</span>
                  <span className="text-[12px] text-[#9CA3AF]">(Oven Lower Deck)</span>
                </div>
                <span className="text-[12px] text-[#4F46E5] font-semibold">
                  Crisp finish @ 7:20 PM · Hold in warm zone to {projectedLandingTime}
                </span>
              </div>
              <div className="w-full h-11 bg-white rounded-lg border border-[#E5E5DF] relative flex items-center overflow-hidden shadow-inner">
                <div className="absolute left-[16.6%] w-[41.7%] h-3 bg-[#F1F0E9] border-y border-[#E5E5DF] top-1 rounded-xs opacity-80"></div>
                <div className="absolute left-[16.6%] w-[41.7%] h-8 bg-[#3D8065] rounded-l-md flex items-center px-3 text-[11px] font-bold text-white shadow-xs truncate">
                  Roast & Crisp 425°F (to 7:20 PM)
                </div>
                <div className="absolute left-[58.3%] w-[28.3%] h-8 bg-[#4F46E5]/90 rounded-r-md flex items-center justify-center px-2 text-[11px] font-bold text-white shadow-xs truncate">
                  Ventilated Warm Holding (17m)
                </div>
              </div>
            </div>

            {/* TRACK 3 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[#202124]">
                <div className="flex items-center gap-2">
                  <CookingPot className="w-4 h-4 text-[#3D8065]" />
                  <span className="text-[13px] font-bold">3. Sautéed Asparagus & Pan Gravy</span>
                  <span className="text-[12px] text-[#9CA3AF]">(Front Burner #1)</span>
                </div>
                <span className="text-[12px] text-[#3D8065] font-semibold">
                  Delayed start to 7:25 PM · Sauté converges at {projectedLandingTime}
                </span>
              </div>
              <div className="w-full h-11 bg-white rounded-lg border border-[#E5E5DF] relative flex items-center overflow-hidden shadow-inner">
                <div className="absolute left-[55%] w-[20%] h-3 bg-[#F1F0E9] border-y border-[#E5E5DF] top-1 rounded-xs opacity-80"></div>
                <div className="absolute left-0 w-[66.6%] h-8 flex items-center justify-end pr-3 text-[11px] text-[#9CA3AF] font-medium">
                  Delayed +7 min for drippings handoff
                </div>
                <div className="absolute left-[66.6%] w-[20%] h-8 bg-[#3D8065] rounded-md flex items-center justify-center px-2 text-[11px] font-bold text-white shadow-xs truncate">
                  Active Sauté & Deglaze (12m)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTNOTE */}
      <div className="flex items-center justify-center gap-2 text-center text-[#737780] text-[12px]">
        <CheckCircle2 className="w-4 h-4 text-[#3D8065]" />
        <span>Applying this plan automatically updates appliance heat stages, voice triggers, and dynamic island timer displays.</span>
      </div>

      {/* ACTION BAR (DOCKED BELOW TIMELINE COMPARISON) */}
      <div className="w-full bg-white rounded-2xl border border-[#E5E5DF] p-3.5 sm:p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Voice Assistant Callout */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-9 h-9 rounded-xl bg-[#EBF4F0] border border-[#C4DDD3] flex items-center justify-center text-[#3D8065] shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D8065]">
                VOICE SHORTCUT
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3D8065] animate-ping"></span>
            </div>
            <p className="text-[12px] sm:text-[13px] text-[#202124] font-medium">
              Say <button onClick={acceptReplan} className="text-[#3D8065] font-bold hover:underline cursor-pointer">"Accept new plan"</button> or{' '}
              <button onClick={keepOriginalPlan} className="text-[#737780] font-medium underline cursor-pointer">"Keep original"</button>
            </p>
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="h-11 px-4 rounded-xl bg-white border border-[#E5E5DF] hover:bg-[#F8F8F5] text-[#202124] font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#737780]" />
            <span>EDIT CHANGES</span>
          </button>

          <button
            onClick={keepOriginalPlan}
            className="h-11 px-4 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] hover:bg-[#F1F0E9] text-[#202124] font-semibold text-xs transition-all flex flex-col justify-center items-start text-left shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-1">
              <History className="w-3 h-3 text-[#737780]" />
              <span>KEEP ORIGINAL PLAN</span>
            </div>
            <span className="text-[9px] text-[#9CA3AF] -mt-0.5 font-normal">
              Dinner lands 7:42 PM
            </span>
          </button>

          <button
            onClick={acceptReplan}
            className="h-11 px-6 rounded-xl bg-[#3D8065] hover:bg-[#336C55] text-white font-bold text-xs sm:text-[13px] transition-all transform active:scale-[0.98] flex items-center gap-2 shadow-md cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ACCEPT & RESUME COOKING</span>
          </button>
        </div>
      </div>



      {/* Edit Changes Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202124]/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5DF] rounded-3xl p-6 sm:p-8 max-w-md w-full flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5DF]">
              <h3 className="font-['Epilogue'] font-bold text-lg text-[#202124]">
                Edit Recovery Allocation
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-[#737780] hover:text-[#202124]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[#737780] uppercase tracking-wider block mb-1">
                  Minutes to Recover from Resting Window
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="2"
                    max="8"
                    value={tempRecoverMins}
                    onChange={(e) => setTempRecoverMins(parseInt(e.target.value, 10))}
                    className="flex-1 accent-[#3D8065]"
                  />
                  <span className="font-mono text-lg font-bold text-[#3D8065] w-12 text-right">
                    {tempRecoverMins}m
                  </span>
                </div>
                <p className="text-xs text-[#737780] mt-1.5">
                  Safe range: 2–8 minutes. Chicken rest window becomes {15 - tempRecoverMins} minutes.
                </p>
              </div>

              <div className="p-3 bg-[#F8F8F5] rounded-xl text-xs text-[#202124]">
                <strong>Projected Landing:</strong> 7:{30 + 12 - tempRecoverMins} PM (Net +{12 - tempRecoverMins}m)
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5DF]">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737780]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2.5 rounded-xl bg-[#3D8065] hover:bg-[#336C55] text-white text-xs font-bold shadow-xs"
              >
                Apply Recovery Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
