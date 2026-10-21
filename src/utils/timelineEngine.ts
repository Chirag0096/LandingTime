import type { Meridiem, Dish } from '../types/index.ts';
import { toTotalMinutes, fromTotalMinutes } from './scheduler.ts';

export type TimelinePhaseType =
  | 'prep'
  | 'active-hands'
  | 'thermal'
  | 'rest'
  | 'holding'
  | 'delay-extension'
  | 'stovetop';

export interface TimelineSegment {
  id: string;
  label: string;
  phaseType: TimelinePhaseType;
  startMinute: number;
  endMinute: number;
  durationMinutes: number;
  leftPercent: number;
  widthPercent: number;
  progressPercent?: number; // 0..100 for active task
  isGhosted?: boolean;
  tooltipText: string;
  appliance?: string;
  status: 'completed' | 'active' | 'upcoming' | 'holding';
}

export interface TimelineTrack {
  id: string;
  dishName: string;
  dishCode: string;
  applianceBadge: string;
  statusBadge: string;
  statusBadgeType: 'sage' | 'amber' | 'slate' | 'indigo';
  segments: TimelineSegment[];
  ghostSegments?: TimelineSegment[];
  totalDurationMinutes: number;
}

export interface TimelineAxisTick {
  minute: number;
  timeFormatted: string;
  leftPercent: number;
  isTarget?: boolean;
  isNewTarget?: boolean;
  isOldTarget?: boolean;
}

export interface ComputedTimeline {
  windowStartMinute: number;
  windowEndMinute: number;
  totalSpanMinutes: number;
  nowMinute: number;
  nowPercent: number;
  nowFormatted: string;
  targetMinute: number;
  targetPercent: number;
  targetFormatted: string;
  isReplanApplied: boolean;
  tracks: TimelineTrack[];
  axisTicks: TimelineAxisTick[];
  conflicts: string[];
}

/**
 * Computes deterministic timeline data for the kitchen session.
 */
export function computeKitchenTimeline({
  targetHour,
  targetMinute,
  meridiem,
  isReplanApplied = false,
  isDelayDetected = false,
  delayMinutes = 12,
  recoveredMinutes = 5,
  isHeavyCreamSubstituted = false,
  nowMinuteOfDay = 18 * 60 + 51, // 6:51 PM default simulated clock
}: {
  targetHour: number;
  targetMinute: number;
  meridiem: Meridiem;
  isReplanApplied?: boolean;
  isDelayDetected?: boolean;
  delayMinutes?: number;
  recoveredMinutes?: number;
  isHeavyCreamSubstituted?: boolean;
  nowMinuteOfDay?: number;
}): ComputedTimeline {
  const baseTargetMin = toTotalMinutes(targetHour, targetMinute, meridiem); // e.g. 7:30 PM = 1170
  const netDelay = isDelayDetected ? (isReplanApplied ? Math.max(0, delayMinutes - recoveredMinutes) : delayMinutes) : 0;
  const effectiveTargetMin = baseTargetMin + (isReplanApplied ? netDelay : 0);

  // Timeline coordinate window: covers from early prep (T-70m) to post-landing (T+15m)
  const windowStartMinute = baseTargetMin - 70; // 6:20 PM = 1100
  const windowEndMinute = Math.max(effectiveTargetMin + 8, baseTargetMin + 15); // 7:45 PM = 1185
  const totalSpanMinutes = Math.max(1, windowEndMinute - windowStartMinute);

  const toPercent = (min: number) => {
    return Math.max(0, Math.min(100, ((min - windowStartMinute) / totalSpanMinutes) * 100));
  };

  const toWidthPercent = (dur: number) => {
    return Math.max(0, (dur / totalSpanMinutes) * 100);
  };

  // Helper for formatting time
  const fmt = (min: number) => fromTotalMinutes(min).formatted;

  // Track 1: Roast Chicken
  // Baseline: Prep (10m): 6:20-6:30, Roast (45m): 6:30-7:15, Rest (15m): 7:15-7:30
  // If delay detected & replanned: Roast +12m (6:30-7:27), Rest 10m (7:27-7:37)
  const chickenPrepStart = windowStartMinute;
  const chickenPrepEnd = chickenPrepStart + 10;
  const chickenRoastStart = chickenPrepEnd;
  const chickenRoastDuration = 45 + (isDelayDetected ? delayMinutes : 0);
  const chickenRoastEnd = chickenRoastStart + chickenRoastDuration;
  const chickenRestDuration = isReplanApplied ? 10 : 15;
  const chickenRestEnd = chickenRoastEnd + chickenRestDuration;

  const chickenSegments: TimelineSegment[] = [
    {
      id: 'chk-prep',
      label: 'Prep · 10m',
      phaseType: 'prep',
      startMinute: chickenPrepStart,
      endMinute: chickenPrepEnd,
      durationMinutes: 10,
      leftPercent: toPercent(chickenPrepStart),
      widthPercent: toWidthPercent(10),
      tooltipText: `Truss & Herb Butter (${fmt(chickenPrepStart)} – ${fmt(chickenPrepEnd)})`,
      appliance: 'Prep Counter',
      status: 'completed',
    },
    {
      id: 'chk-roast',
      label: isDelayDetected
        ? `Roast 425°F (+${delayMinutes}m Temp Recovery)`
        : 'Roast at 425°F (Center Rack)',
      phaseType: 'thermal',
      startMinute: chickenRoastStart,
      endMinute: chickenRoastEnd,
      durationMinutes: chickenRoastDuration,
      leftPercent: toPercent(chickenRoastStart),
      widthPercent: toWidthPercent(chickenRoastDuration),
      progressPercent: 51,
      tooltipText: `Center Rack, Convection 425°F (${fmt(chickenRoastStart)} – ${fmt(chickenRoastEnd)})`,
      appliance: 'Shared Oven (Center)',
      status: 'active',
    },
    {
      id: 'chk-rest',
      label: `Rest & Carve · ${chickenRestDuration}m`,
      phaseType: 'rest',
      startMinute: chickenRoastEnd,
      endMinute: chickenRestEnd,
      durationMinutes: chickenRestDuration,
      leftPercent: toPercent(chickenRoastEnd),
      widthPercent: toWidthPercent(chickenRestDuration),
      tooltipText: `Rest on cutting board to preserve juices (${fmt(chickenRoastEnd)} – ${fmt(chickenRestEnd)})`,
      appliance: 'Carving Station',
      status: 'upcoming',
    },
  ];

  // Track 2: Crispy Smashed Potatoes
  // Parboil: 6:28-6:43 (15m), Smash & Season: 6:48-6:53 (5m), Bake: 6:55-7:20 (25m)
  // If replan applied: Hold in warm zone from 7:20 to 7:37 (17m hold)
  const potBoilStart = baseTargetMin - 62; // 6:28 PM
  const potBoilEnd = potBoilStart + 15; // 6:43 PM
  const potSmashStart = baseTargetMin - 42; // 6:48 PM
  const potSmashEnd = potSmashStart + 5; // 6:53 PM
  const potBakeStart = baseTargetMin - 35; // 6:55 PM
  const potBakeEnd = potBakeStart + 25; // 7:20 PM
  const potHoldingDuration = isReplanApplied ? 17 : 10;
  const potHoldingEnd = potBakeEnd + potHoldingDuration;

  const potatoSegments: TimelineSegment[] = [
    {
      id: 'pot-boil',
      label: 'Boil yukons · 15m',
      phaseType: 'stovetop',
      startMinute: potBoilStart,
      endMinute: potBoilEnd,
      durationMinutes: 15,
      leftPercent: toPercent(potBoilStart),
      widthPercent: toWidthPercent(15),
      tooltipText: `Boil until fork-tender (${fmt(potBoilStart)} – ${fmt(potBoilEnd)})`,
      appliance: 'Burner #1 (Front Left)',
      status: 'completed',
    },
    {
      id: 'pot-smash',
      label: 'SMASH · 5m',
      phaseType: 'active-hands',
      startMinute: potSmashStart,
      endMinute: potSmashEnd,
      durationMinutes: 5,
      leftPercent: toPercent(potSmashStart),
      widthPercent: toWidthPercent(5),
      tooltipText: `Crush to 1/2" thick, season with rosemary & flaky salt (${fmt(potSmashStart)} – ${fmt(potSmashEnd)})`,
      appliance: 'Prep Island',
      status: 'active',
    },
    {
      id: 'pot-bake',
      label: 'Shared Oven Bake · Top Rack (425°F)',
      phaseType: 'thermal',
      startMinute: potBakeStart,
      endMinute: potBakeEnd,
      durationMinutes: 25,
      leftPercent: toPercent(potBakeStart),
      widthPercent: toWidthPercent(25),
      tooltipText: `High ambient crisping (${fmt(potBakeStart)} – ${fmt(potBakeEnd)})`,
      appliance: 'Shared Oven (Top Rack)',
      status: 'upcoming',
    },
    {
      id: 'pot-hold',
      label: isReplanApplied ? 'Ventilated Warm Holding (17m)' : 'Warm & Crisp · 10m',
      phaseType: isReplanApplied ? 'holding' : 'rest',
      startMinute: potBakeEnd,
      endMinute: potHoldingEnd,
      durationMinutes: potHoldingDuration,
      leftPercent: toPercent(potBakeEnd),
      widthPercent: toWidthPercent(potHoldingDuration),
      tooltipText: `Ventilated rack at 170°F (${fmt(potBakeEnd)} – ${fmt(potHoldingEnd)})`,
      appliance: 'Warming Drawer',
      status: 'upcoming',
    },
  ];

  // Track 3: Asparagus & Pan Gravy
  // Trim: 6:40-6:45 (5m)
  // Gravy Simmer: 6:45-7:00 (15m baseline, +2m if substituted -> 17m)
  // Sauté Asparagus: if replan applied, shifts from 7:18 to 7:25 PM (+7m shift)
  const aspTrimStart = baseTargetMin - 50; // 6:40 PM
  const aspTrimEnd = aspTrimStart + 5; // 6:45 PM
  const gravyDuration = isHeavyCreamSubstituted ? 17 : 15;
  const gravyStart = aspTrimEnd;
  const gravyEnd = gravyStart + gravyDuration;

  const sauteduration = 6;
  const sauteStart = isReplanApplied ? baseTargetMin - 5 : baseTargetMin - 12; // 7:25 PM vs 7:18 PM
  const sauteEnd = sauteStart + sauteduration;
  const gravyFinishDuration = 6;
  const gravyFinishStart = sauteEnd;
  const gravyFinishEnd = gravyFinishStart + gravyFinishDuration;

  const asparagusSegments: TimelineSegment[] = [
    {
      id: 'asp-trim',
      label: 'Trim · 5m',
      phaseType: 'prep',
      startMinute: aspTrimStart,
      endMinute: aspTrimEnd,
      durationMinutes: 5,
      leftPercent: toPercent(aspTrimStart),
      widthPercent: toWidthPercent(5),
      tooltipText: `Snap woody stems (${fmt(aspTrimStart)} – ${fmt(aspTrimEnd)})`,
      appliance: 'Prep Island',
      status: 'completed',
    },
    {
      id: 'gravy-simmer',
      label: isHeavyCreamSubstituted ? 'Simmer Gravy (+2m sub)' : 'Simmer Gravy (BR)',
      phaseType: 'thermal',
      startMinute: gravyStart,
      endMinute: gravyEnd,
      durationMinutes: gravyDuration,
      leftPercent: toPercent(gravyStart),
      widthPercent: toWidthPercent(gravyDuration),
      tooltipText: `Simmer base stock and aromatics (${fmt(gravyStart)} – ${fmt(gravyEnd)})`,
      appliance: 'Burner #2 (Back Right)',
      status: 'active',
    },
    {
      id: 'asp-saute',
      label: isReplanApplied ? 'Sauté (Shifted +7m)' : 'Sauté · 6m',
      phaseType: 'thermal',
      startMinute: sauteStart,
      endMinute: sauteEnd,
      durationMinutes: sauteduration,
      leftPercent: toPercent(sauteStart),
      widthPercent: toWidthPercent(sauteduration),
      tooltipText: `High flame skillet sear (${fmt(sauteStart)} – ${fmt(sauteEnd)})`,
      appliance: 'Burner #1 (Front Left)',
      status: 'upcoming',
    },
    {
      id: 'gravy-finish',
      label: 'Finish Gravy',
      phaseType: 'active-hands',
      startMinute: gravyFinishStart,
      endMinute: gravyFinishEnd,
      durationMinutes: gravyFinishDuration,
      leftPercent: toPercent(gravyFinishStart),
      widthPercent: toWidthPercent(gravyFinishDuration),
      tooltipText: `Deglaze chicken skillet drippings & whisk (${fmt(gravyFinishStart)} – ${fmt(gravyFinishEnd)})`,
      appliance: 'Burner #2 (Back Right)',
      status: 'upcoming',
    },
  ];

  const tracks: TimelineTrack[] = [
    {
      id: 'track-chicken',
      dishName: 'Roast Chicken',
      dishCode: 'D-01',
      applianceBadge: '425° OVEN',
      statusBadge: 'IN PROGRESS',
      statusBadgeType: 'amber',
      segments: chickenSegments,
      totalDurationMinutes: 70 + (isDelayDetected ? delayMinutes : 0),
    },
    {
      id: 'track-potatoes',
      dishName: 'Smashed Potatoes',
      dishCode: 'D-02',
      applianceBadge: 'STOVETOP + OVEN',
      statusBadge: 'ACTIVE STEP',
      statusBadgeType: 'sage',
      segments: potatoSegments,
      totalDurationMinutes: 45 + (isReplanApplied ? 7 : 0),
    },
    {
      id: 'track-asparagus',
      dishName: 'Asparagus & Gravy',
      dishCode: 'D-03',
      applianceBadge: '2 BURNERS',
      statusBadge: isHeavyCreamSubstituted ? 'SUB ADAPTED' : '2 BURNERS',
      statusBadgeType: isHeavyCreamSubstituted ? 'sage' : 'slate',
      segments: asparagusSegments,
      totalDurationMinutes: 16 + (isHeavyCreamSubstituted ? 2 : 0) + (isReplanApplied ? 7 : 0),
    },
  ];

  // Generate clean axis ticks at 15m intervals
  const axisTicks: TimelineAxisTick[] = [];
  const startRound = Math.floor(windowStartMinute / 15) * 15;
  for (let m = startRound; m <= windowEndMinute; m += 15) {
    if (m >= windowStartMinute) {
      axisTicks.push({
        minute: m,
        timeFormatted: fmt(m).replace(':00', '').replace(' ', ' '),
        leftPercent: toPercent(m),
        isTarget: m === baseTargetMin && !isReplanApplied,
        isOldTarget: m === baseTargetMin && isReplanApplied,
      });
    }
  }

  // If replan applied, ensure the new landing tick (e.g. 7:37 PM) is present
  if (isReplanApplied) {
    axisTicks.push({
      minute: effectiveTargetMin,
      timeFormatted: `${fmt(effectiveTargetMin)} (NEW)`,
      leftPercent: toPercent(effectiveTargetMin),
      isNewTarget: true,
    });
  }

  // Sort ticks by minute
  axisTicks.sort((a, b) => a.minute - b.minute);

  // Verification checks for conflicts
  const conflicts: string[] = [];
  // Ensure chicken rest is >= 10m
  if (chickenRestDuration < 10) {
    conflicts.push('Chicken resting window is below USDA safety minimum (10 min)');
  }

  return {
    windowStartMinute,
    windowEndMinute,
    totalSpanMinutes,
    nowMinute: nowMinuteOfDay,
    nowPercent: toPercent(nowMinuteOfDay),
    nowFormatted: fmt(nowMinuteOfDay),
    targetMinute: effectiveTargetMin,
    targetPercent: toPercent(effectiveTargetMin),
    targetFormatted: fmt(effectiveTargetMin),
    isReplanApplied,
    tracks,
    axisTicks,
    conflicts,
  };
}
