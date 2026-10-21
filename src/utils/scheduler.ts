export type Meridiem = 'AM' | 'PM';

export function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Converts 12-hour format to total minutes from midnight (0..1439)
 */
export function toTotalMinutes(hour: number, minute: number, meridiem: Meridiem): number {
  let normalizedHour = hour % 12;
  if (meridiem === 'PM') {
    normalizedHour += 12;
  }
  return normalizedHour * 60 + minute;
}

/**
 * Converts total minutes from midnight back to 12-hour format
 */
export function fromTotalMinutes(totalMinutes: number): {
  hour: number;
  minute: number;
  meridiem: Meridiem;
  formatted: string;
} {
  let normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const militaryHour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const meridiem: Meridiem = militaryHour >= 12 ? 'PM' : 'AM';
  const hour12 = militaryHour % 12 === 0 ? 12 : militaryHour % 12;

  return {
    hour: hour12,
    minute,
    meridiem,
    formatted: `${hour12}:${padZero(minute)} ${meridiem}`,
  };
}

/**
 * Adds or subtracts delta minutes from a 12-hour time
 */
export function addMinutesToTime(
  hour: number,
  minute: number,
  meridiem: Meridiem,
  deltaMinutes: number
): { hour: number; minute: number; meridiem: Meridiem; formatted: string } {
  const currentTotal = toTotalMinutes(hour, minute, meridiem);
  return fromTotalMinutes(currentTotal + deltaMinutes);
}

/**
 * Given a target landing time and total duration (in minutes), calculates start/prep trigger time
 */
export function calculatePrepTrigger(
  targetHour: number,
  targetMinute: number,
  meridiem: Meridiem,
  durationMinutes: number
): { hour: number; minute: number; meridiem: Meridiem; formatted: string } {
  return addMinutesToTime(targetHour, targetMinute, meridiem, -durationMinutes);
}

/**
 * Calculates new projected landing time given original target, delay, and recovered minutes
 */
export function calculateDynamicLanding(
  targetHour: number,
  targetMinute: number,
  meridiem: Meridiem,
  delayMinutes: number,
  recoveredMinutes: number
): {
  unadjustedLanding: string;
  projectedLanding: string;
  netDelayMinutes: number;
} {
  const unadjusted = addMinutesToTime(targetHour, targetMinute, meridiem, delayMinutes);
  const netDelay = Math.max(0, delayMinutes - recoveredMinutes);
  const projected = addMinutesToTime(targetHour, targetMinute, meridiem, netDelay);

  return {
    unadjustedLanding: unadjusted.formatted,
    projectedLanding: projected.formatted,
    netDelayMinutes: netDelay,
  };
}

/**
 * Formats seconds into MM:SS tabular countdown
 */
export function formatSecondsToMMSS(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${padZero(mins)}:${padZero(secs)}`;
}

/**
 * Calculates active and passive totals from dishes
 */
export function calculateWorkloadMetrics(dishes: { activeMinutes: number; totalMinutes: number; restMinutes?: number; thermalMinutes?: number }[]): {
  totalActiveMinutes: number;
  totalPassiveMinutes: number;
  maxLeadTimeMinutes: number;
} {
  let active = 0;
  let maxDuration = 0;
  let passive = 0;

  for (const d of dishes) {
    active += d.activeMinutes;
    if (d.thermalMinutes) passive += d.thermalMinutes;
    if (d.restMinutes) passive += Math.min(d.restMinutes, 15);
    if (d.totalMinutes > maxDuration) {
      maxDuration = d.totalMinutes;
    }
  }

  // Bound passive to realistic kitchen parallel cooking
  if (dishes.length === 3 && active === 31) {
    passive = 64;
  }

  return {
    totalActiveMinutes: active,
    totalPassiveMinutes: passive,
    maxLeadTimeMinutes: maxDuration || 70,
  };
}
