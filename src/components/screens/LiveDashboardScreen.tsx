import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCookingSession } from '../../context/CookingSessionContext';
import { formatSecondsToMMSS, fromTotalMinutes } from '../../utils/scheduler';
import { computeKitchenTimeline, TimelinePhaseType, TimelineSegment } from '../../utils/timelineEngine';
import {
  Utensils,
  Users,
  Flame,
  Mic,
  Clock,
  Check,
  CheckCircle2,
  Volume2,
  Layers,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Soup,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Info,
} from 'lucide-react';

export const LiveDashboardScreen: React.FC = () => {
  const {
    targetHour,
    targetMinute,
    meridiem,
    formattedTargetTime,
    adjustMinutes,
    activeStepTitle,
    activeStepInstruction,
    activeStepNumber,
    totalStepsCount,
    stepSubItems,
    toggleSubItem,
    timerSecondsRemaining,
    timerTotalSeconds,
    isTimerRunning,
    toggleTimer,
    resetTimer,
    adjustTimerSeconds,
    advanceStep,
    jumpToStep,
    delayDetectedMinutes,
    recoveredMinutes,
    replanAccepted,
    appliedSubstitutionId,
    triggerDelaySimulation,
    openSubstitutionModal,
    voiceTranscript,
    handleVoiceCommand,
    showToast,
  } = useCookingSession();

  // Dynamic simulation clock for timeline scrubbing
  const [timelineMinute, setTimelineMinute] = useState<number>(18 * 60 + 51); // 6:51 PM default
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>('pot-smash');
  const [isScrubbingNeedle, setIsScrubbingNeedle] = useState<boolean>(false);
  const timelineTracksRef = useRef<HTMLDivElement | null>(null);

  // Recompute timeline dynamically on every change (time, replan, delay, substitution, or clock scrub)
  const timelineData = computeKitchenTimeline({
    targetHour,
    targetMinute,
    meridiem,
    isReplanApplied: replanAccepted,
    isDelayDetected: delayDetectedMinutes > 0,
    delayMinutes: delayDetectedMinutes,
    recoveredMinutes,
    isHeavyCreamSubstituted: appliedSubstitutionId !== null,
    nowMinuteOfDay: timelineMinute,
  });

  // Step to timeline minute mapping for bidirectional sync
  const STEP_TIMELINE_MAPPING: Record<number, { minute: number; segmentId: string }> = {
    1: { minute: 18 * 60 + 20, segmentId: 'chk-prep' },
    2: { minute: 18 * 60 + 35, segmentId: 'chk-roast' },
    3: { minute: 18 * 60 + 30, segmentId: 'pot-boil' },
    4: { minute: 18 * 60 + 51, segmentId: 'pot-smash' },
    5: { minute: 18 * 60 + 58, segmentId: 'pot-bake' },
    6: { minute: 18 * 60 + 46, segmentId: 'gravy-simmer' },
    7: { minute: 19 * 60 + 25, segmentId: 'asp-saute' },
    8: { minute: 19 * 60 + 28, segmentId: 'chk-rest' },
    9: { minute: 19 * 60 + 31, segmentId: 'pot-hold' },
  };

  // Sync timeline when active step changes from outside
  useEffect(() => {
    const map = STEP_TIMELINE_MAPPING[activeStepNumber];
    if (map) {
      setTimelineMinute(map.minute);
      setSelectedSegmentId(map.segmentId);
    }
  }, [activeStepNumber]);

  // Scrub handler: updates clock and finds matching task
  const handleScrub = useCallback(
    (targetMin: number) => {
      const clamped = Math.max(
        timelineData.windowStartMinute,
        Math.min(timelineData.windowEndMinute, targetMin)
      );
      setTimelineMinute(clamped);

      // Find matching segment
      let matchedSeg: TimelineSegment | undefined;
      for (const track of timelineData.tracks) {
        for (const seg of track.segments) {
          if (clamped >= seg.startMinute && clamped <= seg.endMinute) {
            matchedSeg = seg;
            break;
          }
        }
        if (matchedSeg) break;
      }

      if (matchedSeg) {
        setSelectedSegmentId(matchedSeg.id);
        if (matchedSeg.stepNumber && matchedSeg.stepNumber !== activeStepNumber) {
          jumpToStep(matchedSeg.stepNumber);
        }
      }
    },
    [timelineData, activeStepNumber, jumpToStep]
  );

  // Click handler for timeline segments
  const handleSegmentClick = (seg: TimelineSegment) => {
    setSelectedSegmentId(seg.id);
    setTimelineMinute(seg.startMinute);
    if (seg.stepNumber) {
      jumpToStep(seg.stepNumber);
    }
    showToast(
      `Focused: ${seg.label}`,
      `${seg.appliance ? seg.appliance + ' · ' : ''}${seg.tooltipText}`,
      'info'
    );
  };

  // Dragging NOW needle with mouse
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineTracksRef.current) return;
    const rect = timelineTracksRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetMin = Math.round(
      timelineData.windowStartMinute + pct * timelineData.totalSpanMinutes
    );
    handleScrub(targetMin);
  };

  const handleNeedleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsScrubbingNeedle(true);
  };

  useEffect(() => {
    if (!isScrubbingNeedle) return;
    const onMouseMove = (e: MouseEvent) => {
      if (!timelineTracksRef.current) return;
      const rect = timelineTracksRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      const targetMin = Math.round(
        timelineData.windowStartMinute + pct * timelineData.totalSpanMinutes
      );
      handleScrub(targetMin);
    };
    const onMouseUp = () => {
      setIsScrubbingNeedle(false);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isScrubbingNeedle, handleScrub, timelineData.windowStartMinute, timelineData.totalSpanMinutes]);

  const getSegmentClasses = (phaseType: TimelinePhaseType) => {
    switch (phaseType) {
      case 'active-hands':
        return 'bg-[#3D8065] text-white border border-[#2F654F] shadow-xs font-semibold';
      case 'thermal':
        return 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] shadow-xs font-semibold';
      case 'rest':
        return 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]';
      case 'holding':
        return 'bg-[#F5F3FF] text-[#6D28D9] border border-dashed border-[#DDD6FE]';
      case 'stovetop':
        return 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]';
      case 'delay-extension':
        return 'bg-[#FEF3C7] text-[#D97706] border-2 border-dashed border-[#D97706] animate-pulse font-bold';
      case 'prep':
      default:
        return 'bg-white text-[#52525B] border border-[#E5E5DF] shadow-xs';
    }
  };

  const getBadgeClasses = (type: 'sage' | 'amber' | 'slate' | 'indigo') => {
    switch (type) {
      case 'sage':
        return 'bg-[#EBF4F0] text-[#3D8065] border-[#C4DDD3]';
      case 'amber':
        return 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]';
      case 'indigo':
        return 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]';
      case 'slate':
      default:
        return 'bg-[#F8F8F5] text-[#737780] border-[#E5E5DF]';
    }
  };

  // Calculate circular SVG timer stroke
  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89
  const progressRatio = timerSecondsRemaining / timerTotalSeconds;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const minutesRemaining = Math.max(0, timelineData.targetMinute - timelineMinute);

  return (
    <div className="w-full flex flex-col gap-6 pb-36">
      {/* ZONE A: Session & Landing-Time Mission Control Header */}
      <section className="w-full bg-white border border-[#E5E5DF] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        {/* Left: Session Context */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] text-[#3D8065]">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-['Epilogue'] font-bold text-[14px] tracking-wider text-[#202124] uppercase">
                  DINNER DIRECTORY
                </span>
                <span className="w-2 h-2 rounded-full bg-[#3D8065]"></span>
              </div>
              <span className="text-[10px] font-semibold tracking-widest text-[#737780] uppercase">
                COORDINATED MEAL PLAN
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-[#E5E5DF] mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F8F8F5] border border-[#E5E5DF] text-[#202124] font-semibold text-[12px] tracking-wide">
            <Users className="w-3.5 h-3.5 text-[#D97706]" />
            <span>DINNER FOR 4</span>
          </div>
        </div>

        {/* Center: Landing Target Mission Control with Dynamic Time Adjusters */}
        <div className="flex items-center gap-3 sm:gap-4 bg-[#F8F8F5] px-4 sm:px-5 py-2 rounded-xl border border-[#E5E5DF]">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-bold tracking-widest text-[#737780] uppercase">
              DEADLINE
            </span>
            <span className="font-['Epilogue'] font-bold text-[18px] sm:text-[20px] text-[#202124] tracking-tight">
              LANDING AT {formattedTargetTime}
            </span>
          </div>

          {/* Quick Target Time Adjusters (-5m / +5m) */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => adjustMinutes(-5)}
              className="px-2 py-0.5 rounded text-[11px] font-bold bg-white hover:bg-[#EBF4F0] border border-[#E5E5DF] text-[#737780] hover:text-[#3D8065] transition-colors cursor-pointer"
              title="Shift dinner 5 minutes earlier"
            >
              -5m
            </button>
            <button
              onClick={() => adjustMinutes(5)}
              className="px-2 py-0.5 rounded text-[11px] font-bold bg-white hover:bg-[#EBF4F0] border border-[#E5E5DF] text-[#737780] hover:text-[#3D8065] transition-colors cursor-pointer"
              title="Shift dinner 5 minutes later"
            >
              +5m
            </button>
          </div>

          <div className="h-5 w-px bg-[#E5E5DF] hidden sm:block"></div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF4F0] border border-[#C4DDD3] text-[#3D8065] font-bold text-[12px] tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#3D8065] animate-pulse"></span>
            <span>
              {minutesRemaining} MIN REMAINING · {replanAccepted ? 'RE-PLANNED' : 'ON TRACK'}
            </span>
          </div>
        </div>

        {/* Right: Hardware Status Badges */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] font-semibold text-[12px]">
            <Flame className="w-4 h-4" />
            <span>OVEN · 425°F · BUSY</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8F8F5] border border-[#E5E5DF] text-[#737780] font-semibold text-[12px]">
            <span className="text-[#202124] font-medium">BURNERS · 2/4 ACTIVE</span>
          </div>
        </div>
      </section>

      {/* ZONE B: Main Cooking Workspace (Cockpit Cards) */}
      <section className="w-full grid grid-cols-12 gap-5 items-stretch">
        {/* LEFT CARD: WHAT TO DO NOW (7 cols desktop) */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-[#E5E5DF] shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-6 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle ambient glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#EBF4F0]/60 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header & Progress Countdown */}
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#EBF4F0] border border-[#C4DDD3] text-[#3D8065] text-[11px] font-bold tracking-wider uppercase">
                  ACTIVE HANDS · STEP 0{activeStepNumber} OF 0{totalStepsCount}
                </span>
                {/* Interactive Step Navigator Pills */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalStepsCount }, (_, i) => i + 1).map((s) => (
                    <button
                      key={s}
                      onClick={() => jumpToStep(s)}
                      className={`w-5 h-5 rounded-md text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                        s === activeStepNumber
                          ? 'bg-[#3D8065] text-white shadow-xs scale-105'
                          : s < activeStepNumber
                          ? 'bg-[#EBF4F0] text-[#3D8065] border border-[#C4DDD3]'
                          : 'bg-[#F8F8F5] text-[#9CA3AF] border border-[#E5E5DF] hover:text-[#202124]'
                      }`}
                      title={`Jump to Step ${s}`}
                      aria-label={`Jump to Step ${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <h1 className="font-['Epilogue'] font-bold text-[24px] sm:text-[28px] lg:text-[31px] tracking-tight text-[#202124] leading-tight mt-1">
                {activeStepTitle}
              </h1>
            </div>

            {/* Apple Circular Progress Timer Ring */}
            <div className="flex flex-col items-center justify-center pl-2 shrink-0 group">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-[#F1F0E9]"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r={radius}
                    stroke="#E5E5DF"
                    strokeWidth="7"
                  />
                  <circle
                    className="text-[#3D8065] transition-all duration-500 ease-out"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r={radius}
                    stroke="currentColor"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    strokeWidth="7"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-['Epilogue'] font-bold text-[24px] tabular-nums tracking-tight text-[#202124]">
                    {formatSecondsToMMSS(timerSecondsRemaining)}
                  </span>
                  <span className="text-[9px] font-bold text-[#737780] tracking-widest uppercase">
                    {isTimerRunning ? 'REMAINING' : 'PAUSED'}
                  </span>
                </div>
              </div>

              {/* Timer micro-controls with +/- increments */}
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={() => adjustTimerSeconds?.(-30)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-[#737780] hover:text-[#202124] hover:bg-[#F8F8F5] border border-transparent hover:border-[#E5E5DF] cursor-pointer"
                  title="Subtract 30s"
                >
                  -30s
                </button>
                <button
                  onClick={toggleTimer}
                  className="p-1 rounded-md text-[#737780] hover:text-[#202124] hover:bg-[#F8F8F5] cursor-pointer"
                  title={isTimerRunning ? 'Pause timer' : 'Resume timer'}
                  aria-label={isTimerRunning ? 'Pause timer' : 'Resume timer'}
                >
                  {isTimerRunning ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-[#3D8065]" />
                  )}
                </button>
                <button
                  onClick={resetTimer}
                  className="p-1 rounded-md text-[#737780] hover:text-[#202124] hover:bg-[#F8F8F5] cursor-pointer"
                  title="Reset timer"
                  aria-label="Reset timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => adjustTimerSeconds?.(60)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-[#737780] hover:text-[#202124] hover:bg-[#F8F8F5] border border-transparent hover:border-[#E5E5DF] cursor-pointer"
                  title="Add 1 minute"
                >
                  +1m
                </button>
              </div>
            </div>
          </div>

          {/* Instruction Subtitle */}
          <p className="relative z-10 text-[#737780] text-[15px] lg:text-[16px] mt-2 leading-relaxed max-w-2xl font-normal">
            {activeStepInstruction}
          </p>

          {/* Checklist Items */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            {stepSubItems.map((item, idx) => {
              const isChecked = item.completed;
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSubItem(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-[#F8F8F5] border-[#E5E5DF] text-[#737780]'
                      : idx === 1
                      ? 'bg-[#EBF4F0]/70 border-[#C4DDD3] text-[#202124] ring-1 ring-[#3D8065]/30 shadow-xs'
                      : 'bg-white border-[#E5E5DF] text-[#9CA3AF]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                      isChecked
                        ? 'bg-[#3D8065] text-white shadow-xs'
                        : 'border-2 border-[#E5E5DF] bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <span
                    className={`text-[13px] leading-snug font-medium ${
                      isChecked ? 'line-through opacity-75' : 'text-[#202124]'
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action Button Area */}
          <div className="relative z-10 flex flex-col gap-2 pt-2">
            <button
              onClick={advanceStep}
              className="w-full h-[68px] rounded-2xl bg-[#3D8065] hover:bg-[#336C55] text-white font-['Epilogue'] font-bold text-[17px] sm:text-[18px] tracking-wider uppercase flex items-center justify-center gap-3 shadow-[0_4px_14px_rgba(61,128,101,0.25)] active:scale-[0.99] transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-7 h-7" />
              <span>DONE · ADVANCE STEP</span>
            </button>

            <div className="flex flex-wrap items-center justify-between px-2 pt-1 gap-2">
              <button
                onClick={() => handleVoiceCommand('Repeat current instruction')}
                className="flex items-center gap-1.5 text-[#737780] hover:text-[#202124] text-[13px] font-medium transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Repeat instruction (Voice: "Repeat")</span>
              </button>

              <div
                onClick={() => jumpToStep(Math.min(totalStepsCount, activeStepNumber + 1))}
                className="flex items-center gap-2 text-[12px] cursor-pointer hover:opacity-80 transition-opacity"
                title="Click to jump to next step"
              >
                <span className="text-[#737780] font-semibold uppercase">UP NEXT:</span>
                <span className="font-medium text-[#202124]">Oven entry alongside chicken</span>
                <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] font-bold text-[11px] uppercase">
                  6:55 PM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: YOUR KITCHEN RIGHT NOW (5 cols desktop - Interactive Equipment Matrix) */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-[#E5E5DF] shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
          <div>
            {/* Top Title */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5DF]">
              <div>
                <h2 className="font-['Epilogue'] font-bold text-[18px] text-[#202124] flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#D97706]" />
                  YOUR KITCHEN RIGHT NOW
                </h2>
                <p className="text-[12px] text-[#737780] mt-0.5">
                  Shared appliance availability and active cooking tasks. (Click to focus)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-[11px] font-bold tracking-wider uppercase">
                DUAL ZONE ACTIVE
              </span>
            </div>

            {/* SECTION A: PRIMARY OVEN */}
            <div className="my-3 p-3.5 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#D97706]" />
                  <span className="font-bold text-[13px] text-[#202124]">PRIMARY OVEN</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white border border-[#E5E5DF] text-[#737780]">
                    425°F · CONVECTION
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#D97706]">SHARED OVEN WINDOW</span>
              </div>

              {/* Oven Item 1: Roast Chicken (Clickable to focus step 2) */}
              <div
                onClick={() => {
                  jumpToStep(2);
                  setTimelineMinute(18 * 60 + 35);
                  setSelectedSegmentId('chk-roast');
                  showToast('Primary Oven Focus', 'Roast Chicken on Center Rack (425°F)', 'info');
                }}
                className="bg-white rounded-lg p-2.5 border border-[#E5E5DF] hover:border-[#D97706] hover:shadow-xs transition-all cursor-pointer flex flex-col gap-1.5 shadow-xs"
                title="Click to focus on Chicken Roast (Step 2)"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
                    <span className="text-[13px] font-bold text-[#202124]">Roast Chicken</span>
                    <span className="text-[#737780] text-[12px]">· Center Rack</span>
                  </div>
                  <span className="text-[12px] font-bold tabular-nums text-[#D97706]">
                    23 / 45 MIN (51%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#F8F8F5] overflow-hidden border border-[#E5E5DF]/40">
                  <div className="h-full bg-[#D97706] rounded-full" style={{ width: '51%' }}></div>
                </div>
              </div>

              {/* Oven Item 2: Reserved Smashed Potatoes (Clickable to focus step 5) */}
              <div
                onClick={() => {
                  jumpToStep(5);
                  setTimelineMinute(18 * 60 + 55);
                  setSelectedSegmentId('pot-bake');
                  showToast('Oven Reserve Focus', 'Smashed Potatoes top rack entry (425°F)', 'info');
                }}
                className="bg-white rounded-lg p-2.5 border border-dashed border-[#FDE68A] hover:border-[#D97706] transition-all cursor-pointer flex items-center justify-between"
                title="Click to focus on Potato Bake Entry (Step 5)"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D97706]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-[#202124]">Smashed Potatoes</span>
                      <span className="text-[#737780] text-[12px]">· Top Rack</span>
                    </div>
                    <span className="text-[11px] font-medium text-[#D97706]">
                      Planned entry: 6:55 PM (in 4 min) · Req: 425°F
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] text-[10px] font-bold uppercase">
                  RESERVED
                </span>
              </div>
            </div>

            {/* SECTION B: 4-BURNER COOKTOP */}
            <div className="p-3.5 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[13px] text-[#202124]">FOUR-BURNER STOVETOP</span>
                <span className="text-[11px] font-semibold text-[#737780]">LAYOUT 2x2</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Burner 1 (BL - Parboil) */}
                <div
                  onClick={() => {
                    jumpToStep(3);
                    setTimelineMinute(18 * 60 + 30);
                    setSelectedSegmentId('pot-boil');
                    showToast('Burner Focus: BL', 'Parboil Baby Yukons (Step 3)', 'info');
                  }}
                  className="p-2.5 rounded-lg bg-white border border-[#E5E5DF] hover:border-[#3D8065] cursor-pointer flex items-center justify-between opacity-80 hover:opacity-100 transition-all"
                  title="Click to focus on Parboil Yukons (Step 3)"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border border-[#E5E5DF] flex items-center justify-center text-[10px] text-[#9CA3AF] font-bold">
                      BL
                    </div>
                    <span className="text-[12px] text-[#737780] font-medium">Parboil Pot</span>
                  </div>
                  <span className="text-[10px] text-[#3D8065] font-bold">READY</span>
                </div>

                {/* Burner 2 (BR - Gravy) */}
                <div
                  onClick={() => {
                    jumpToStep(6);
                    setTimelineMinute(18 * 60 + 46);
                    setSelectedSegmentId('gravy-simmer');
                    showToast('Burner Focus: BR', 'Pan Gravy Base Simmer (Step 6)', 'info');
                  }}
                  className="p-2.5 rounded-lg bg-[#FEF3C7]/70 border border-[#FDE68A] hover:border-[#D97706] cursor-pointer flex items-center justify-between ring-1 ring-[#D97706]/30 transition-all"
                  title="Click to focus on Pan Gravy Base (Step 6)"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#D97706]/20 border border-[#D97706] flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-[#D97706] animate-ping"></span>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-[#202124] leading-tight">Pan Gravy Base</p>
                      <p className="text-[10px] font-semibold text-[#D97706]">Simmer Low · 8m left</p>
                    </div>
                  </div>
                  <Soup className="w-4 h-4 text-[#D97706]" />
                </div>

                {/* Burner 3 (FL - Asparagus) */}
                <div
                  onClick={() => {
                    jumpToStep(7);
                    setTimelineMinute(19 * 60 + 25);
                    setSelectedSegmentId('asp-saute');
                    showToast('Burner Focus: FL', 'Asparagus Skillet Sauté (Step 7)', 'info');
                  }}
                  className="p-2.5 rounded-lg bg-white border border-dashed border-[#E5E5DF] hover:border-[#3D8065] cursor-pointer flex items-center justify-between transition-all"
                  title="Click to focus on Asparagus Sauté (Step 7)"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border border-[#737780] flex items-center justify-center text-[10px] text-[#737780] font-bold">
                      FL
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-[#202124] leading-tight">Asparagus Skillet</p>
                      <p className="text-[10px] font-medium text-[#737780]">Reserved · 7:15 PM</p>
                    </div>
                  </div>
                  <Clock className="w-4 h-4 text-[#737780]" />
                </div>

                {/* Burner 4 (FR - Off) */}
                <div className="p-2.5 rounded-lg bg-white border border-[#E5E5DF] flex items-center justify-between opacity-70">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border border-[#E5E5DF] flex items-center justify-center text-[10px] text-[#9CA3AF] font-bold">
                      FR
                    </div>
                    <span className="text-[12px] text-[#737780] font-medium">Front Right</span>
                  </div>
                  <span className="text-[10px] text-[#9CA3AF] font-bold">OFF</span>
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Health Strip */}
          <div className="mt-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#EBF4F0] border border-[#C4DDD3] text-[#3D8065]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3D8065]" />
              <span className="text-[11px] font-bold tracking-wide">
                EQUIPMENT STATUS: NO KNOWN THERMAL CONFLICTS
              </span>
            </div>
            <span className="text-[11px] text-[#737780] font-medium">Synced With Oven Thermostat</span>
          </div>
        </div>
      </section>

      {/* ZONE C: Critical-Path Cooking Timeline */}
      <section className="w-full bg-white rounded-2xl border border-[#E5E5DF] shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-5 flex flex-col gap-4">
        {/* Header & Legend */}
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#E5E5DF] gap-4">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-[#3D8065]" />
            <div>
              <h3 className="font-['Epilogue'] font-bold text-[18px] tracking-tight text-[#202124]">
                TODAY'S COOKING TIMELINE
              </h3>
              <p className="text-[11px] font-semibold text-[#737780] uppercase tracking-wider">
                3 DISHES · SHARED APPLIANCES · COORDINATED SCHEDULE
              </p>
            </div>
          </div>

          {/* Legend Pills */}
          <div className="flex items-center flex-wrap gap-3 text-[12px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3D8065]"></span>
              <span className="text-[#202124] font-medium">Active Hands</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
              <span className="text-[#202124] font-medium">Thermal Cooking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]"></span>
              <span className="text-[#202124] font-medium">Resting / Passive</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F8F8F5] border border-[#E5E5DF]"></span>
              <span className="text-[#737780]">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded border border-dashed border-[#D97706]"></span>
              <span className="text-[#737780]">Scheduled Slot</span>
            </div>
          </div>
        </div>

        {/* Dynamic Timeline Scrubber Control Bar */}
        <div className="bg-[#F8F8F5] rounded-xl p-3 border border-[#E5E5DF] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3D8065] animate-pulse"></span>
            <span className="text-[11px] font-bold text-[#202124] uppercase tracking-wider">
              TIMELINE CLOCK:
            </span>
            <span className="text-[13px] font-mono font-bold text-[#3D8065] px-2.5 py-0.5 rounded-md bg-white border border-[#C4DDD3] shadow-xs">
              {timelineData.nowFormatted}
            </span>
            <span className="text-[11px] text-[#737780] font-medium hidden md:inline">
              (Drag slider or click any segment to scrub)
            </span>
          </div>

          {/* Quick Scrub Preset Checkpoints */}
          <div className="flex items-center flex-wrap gap-1.5 text-[11px]">
            <button
              onClick={() => handleScrub(18 * 60 + 20)}
              className="px-2 py-0.5 rounded-md bg-white hover:bg-[#EBF4F0] border border-[#E5E5DF] text-[#737780] hover:text-[#3D8065] font-semibold transition-colors cursor-pointer"
            >
              6:20 PM Prep
            </button>
            <button
              onClick={() => handleScrub(18 * 60 + 35)}
              className="px-2 py-0.5 rounded-md bg-white hover:bg-[#EBF4F0] border border-[#E5E5DF] text-[#737780] hover:text-[#3D8065] font-semibold transition-colors cursor-pointer"
            >
              6:30 PM Roast
            </button>
            <button
              onClick={() => handleScrub(18 * 60 + 51)}
              className="px-2 py-0.5 rounded-md bg-[#EBF4F0] border border-[#C4DDD3] text-[#3D8065] font-bold shadow-xs cursor-pointer"
            >
              6:51 PM Smash (Now)
            </button>
            <button
              onClick={() => handleScrub(18 * 60 + 58)}
              className="px-2 py-0.5 rounded-md bg-white hover:bg-[#EBF4F0] border border-[#E5E5DF] text-[#737780] hover:text-[#3D8065] font-semibold transition-colors cursor-pointer"
            >
              6:55 PM Oven Sync
            </button>
            <button
              onClick={() => handleScrub(19 * 60 + 25)}
              className="px-2 py-0.5 rounded-md bg-white hover:bg-[#EBF4F0] border border-[#E5E5DF] text-[#737780] hover:text-[#3D8065] font-semibold transition-colors cursor-pointer"
            >
              7:25 PM Sauté
            </button>
            <button
              onClick={() => handleScrub(timelineData.targetMinute)}
              className="px-2 py-0.5 rounded-md bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] font-bold shadow-xs cursor-pointer"
            >
              Serve ({timelineData.targetFormatted})
            </button>
          </div>

          {/* Scrubber Range Slider */}
          <div className="w-full flex items-center gap-3 pt-1">
            <span className="text-[11px] font-mono text-[#737780] shrink-0 font-bold">
              {fromTotalMinutes(timelineData.windowStartMinute).formatted}
            </span>
            <input
              type="range"
              min={timelineData.windowStartMinute}
              max={timelineData.windowEndMinute}
              value={timelineMinute}
              onChange={(e) => handleScrub(Number(e.target.value))}
              className="w-full h-2 bg-[#E5E5DF] rounded-lg appearance-none cursor-pointer accent-[#3D8065]"
              aria-label="Timeline time scrubber"
            />
            <span className="text-[11px] font-mono text-[#737780] shrink-0 font-bold">
              {fromTotalMinutes(timelineData.windowEndMinute).formatted}
            </span>
          </div>
        </div>

        {/* Timeline Tracks Container */}
        <div className="relative w-full overflow-x-auto select-none pt-2">
          <div ref={timelineTracksRef} className="min-w-[860px] relative">
            {/* Dynamic Time labels axis (Clickable to scrub) */}
            <div
              onClick={handleRulerClick}
              className="relative h-6 w-full text-[#737780] font-semibold text-[12px] tabular-nums px-2 border-b border-[#E5E5DF] pb-2 cursor-pointer group"
              title="Click anywhere along ruler to move current simulation time"
            >
              {timelineData.axisTicks.map((tick, i) => (
                <div
                  key={i}
                  className={`absolute ${
                    i === 0
                      ? 'left-0'
                      : i === timelineData.axisTicks.length - 1
                      ? 'right-0 -translate-x-0'
                      : '-translate-x-1/2'
                  } ${tick.isTarget ? 'font-bold text-[#D97706]' : ''}`}
                  style={{
                    left: i === timelineData.axisTicks.length - 1 ? undefined : `${tick.leftPercent}%`,
                  }}
                >
                  {tick.timeFormatted} {tick.isTarget && '(TARGET)'}
                </div>
              ))}
            </div>

            {/* Vertical guidelines */}
            <div
              onClick={handleRulerClick}
              className="absolute inset-y-6 inset-x-0 cursor-pointer"
            >
              {timelineData.axisTicks.map((tick, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-[#E5E5DF]"
                  style={{ left: `${tick.leftPercent}%` }}
                />
              ))}

              {/* DYNAMIC NOW NEEDLE (Draggable and clickable) */}
              <div
                onMouseDown={handleNeedleMouseDown}
                className="absolute top-0 bottom-0 border-l-2 border-[#3D8065] z-30 cursor-ew-resize transition-all group/needle"
                style={{ left: `${timelineData.nowPercent}%` }}
                title="Drag or scrub NOW indicator"
              >
                <div className="bg-[#3D8065] text-white text-[10px] font-bold px-2.5 py-0.5 rounded shadow-md absolute -top-5 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap group-hover/needle:scale-105 transition-transform">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  <span>NOW ({timelineData.nowFormatted})</span>
                  <span className="opacity-75 text-[9px]">↔</span>
                </div>
              </div>

              {/* TARGET TIME NEEDLE */}
              <div
                className="absolute top-0 bottom-0 border-l-2 border-dashed border-[#D97706] z-20"
                style={{ left: `${timelineData.targetPercent}%` }}
              >
                <div className="bg-[#D97706] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow absolute -top-5 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap">
                  <Utensils className="w-3 h-3" />
                  <span>SERVE · {timelineData.targetFormatted}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Tracks */}
            <div className="flex flex-col gap-3 py-4 mt-2">
              {timelineData.tracks.map((track) => (
                <div key={track.id} className="flex items-center gap-4">
                  <div className="w-48 shrink-0 flex items-center justify-between pr-2">
                    <span className="font-['Epilogue'] font-semibold text-[14px] text-[#202124]">
                      {track.dishName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getBadgeClasses(
                        track.statusBadgeType
                      )}`}
                    >
                      {track.applianceBadge}
                    </span>
                  </div>

                  <div className="relative h-12 flex-1 bg-[#F8F8F5] rounded-xl p-1.5 overflow-hidden flex items-center border border-[#E5E5DF]">
                    {track.segments.map((seg) => {
                      const isSelected = selectedSegmentId === seg.id;
                      return (
                        <div
                          key={seg.id}
                          onClick={() => handleSegmentClick(seg)}
                          title={`${seg.tooltipText} · Click to focus`}
                          className={`absolute h-9 rounded-lg flex items-center justify-between px-2.5 text-[12px] transition-all overflow-hidden cursor-pointer hover:scale-[1.01] hover:brightness-105 active:scale-[0.99] ${getSegmentClasses(
                            seg.phaseType
                          )} ${
                            isSelected
                              ? 'ring-2 ring-[#3D8065] ring-offset-1 shadow-md z-20 font-bold'
                              : ''
                          } ${seg.status === 'completed' ? 'opacity-85' : ''}`}
                          style={{
                            left: `${seg.leftPercent}%`,
                            width: `${Math.max(4, seg.widthPercent)}%`,
                          }}
                        >
                          <div className="flex items-center gap-1 truncate">
                            {seg.status === 'completed' && (
                              <Check className="w-3 h-3 text-[#3D8065] shrink-0 stroke-[3]" />
                            )}
                            {seg.status === 'active' && (
                              <span className="w-2 h-2 rounded-full bg-[#3D8065] animate-pulse shrink-0"></span>
                            )}
                            <span className="truncate">{seg.label}</span>
                          </div>
                          <span className="text-[10px] font-bold tabular-nums ml-1 opacity-90 shrink-0">
                            {seg.durationMinutes}m
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ZONE D: Persistent Voice & Action Footer */}
      <footer className="sticky bottom-4 z-30 w-full bg-white/95 backdrop-blur-md rounded-2xl border border-[#E5E5DF] shadow-[0_8px_30px_rgba(0,0,0,0.12)] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Voice indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleVoiceCommand('Listening')}
            className="relative w-10 h-10 rounded-full bg-[#0284C7] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-md shadow-[#0284C7]/20 cursor-pointer"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0284C7] opacity-30"></span>
            <Mic className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#0284C7] uppercase tracking-wider">
              VOICE ENGINE
            </span>
            <span className="text-[12px] text-[#737780] font-medium">Listening for commands...</span>
          </div>
        </div>

        {/* Center: Assistant Speech bubble */}
        <div className="flex-1 min-w-[280px] max-w-2xl flex items-center gap-3 px-4 py-2 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF]">
          <span className="text-[11px] font-bold text-[#3D8065] shrink-0 uppercase tracking-wide">
            ASSISTANT
          </span>
          <p className="text-[13px] text-[#202124] truncate font-normal">
            {voiceTranscript}
          </p>
        </div>

        {/* Right: Quick Command Chips */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            onClick={() => handleVoiceCommand('What now?')}
            className="px-3 py-1.5 rounded-lg bg-[#F8F8F5] hover:bg-[#F1F0E9] text-[#202124] text-[11px] font-bold border border-[#E5E5DF] transition-colors uppercase cursor-pointer"
          >
            WHAT NOW?
          </button>
          <button
            onClick={() => triggerDelaySimulation(12)}
            className="px-3 py-1.5 rounded-lg bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#D97706] text-[11px] font-bold border border-[#FDE68A] transition-colors uppercase cursor-pointer flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>REPORT A DELAY (+12M)</span>
          </button>
          <button
            onClick={openSubstitutionModal}
            className="px-3 py-1.5 rounded-lg bg-[#F8F8F5] hover:bg-red-50 text-red-600 text-[11px] font-bold border border-red-200 transition-colors uppercase cursor-pointer"
          >
            INGREDIENT MISSING
          </button>
          <button
            onClick={toggleTimer}
            className="px-3 py-1.5 rounded-lg bg-[#F8F8F5] hover:bg-[#F1F0E9] text-[#737780] hover:text-[#202124] text-[11px] font-bold border border-[#E5E5DF] transition-colors uppercase cursor-pointer"
          >
            {isTimerRunning ? 'PAUSE TIMERS' : 'RESUME TIMERS'}
          </button>
        </div>
      </footer>
    </div>
  );
};
