import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toTotalMinutes,
  fromTotalMinutes,
  addMinutesToTime,
  calculatePrepTrigger,
  calculateDynamicLanding,
  formatSecondsToMMSS,
  calculateWorkloadMetrics
} from './scheduler.ts';

test('toTotalMinutes converts 12-hour format accurately', () => {
  assert.equal(toTotalMinutes(12, 0, 'AM'), 0);
  assert.equal(toTotalMinutes(7, 30, 'PM'), 19 * 60 + 30);
  assert.equal(toTotalMinutes(12, 15, 'PM'), 12 * 60 + 15);
  assert.equal(toTotalMinutes(6, 20, 'PM'), 18 * 60 + 20);
});

test('fromTotalMinutes converts back to 12-hour format with zero padding', () => {
  const t1 = fromTotalMinutes(19 * 60 + 30);
  assert.equal(t1.formatted, '7:30 PM');
  assert.equal(t1.hour, 7);
  assert.equal(t1.minute, 30);
  assert.equal(t1.meridiem, 'PM');

  const t2 = fromTotalMinutes(18 * 60 + 5);
  assert.equal(t2.formatted, '6:05 PM');
});

test('calculatePrepTrigger works backwards accurately (7:30 PM - 70 min = 6:20 PM)', () => {
  const prep = calculatePrepTrigger(7, 30, 'PM', 70);
  assert.equal(prep.formatted, '6:20 PM');
  assert.equal(prep.hour, 6);
  assert.equal(prep.minute, 20);
  assert.equal(prep.meridiem, 'PM');
});

test('calculateDynamicLanding computes delay and recovery accurately', () => {
  // 7:30 PM with +12m delay and 5m recovered = net +7m -> 7:37 PM (unadjusted 7:42 PM)
  const result = calculateDynamicLanding(7, 30, 'PM', 12, 5);
  assert.equal(result.unadjustedLanding, '7:42 PM');
  assert.equal(result.projectedLanding, '7:37 PM');
  assert.equal(result.netDelayMinutes, 7);
});

test('formatSecondsToMMSS outputs correct zero-padded countdowns', () => {
  assert.equal(formatSecondsToMMSS(258), '04:18');
  assert.equal(formatSecondsToMMSS(0), '00:00');
  assert.equal(formatSecondsToMMSS(65), '01:05');
});

test('calculateWorkloadMetrics sums active and passive durations', () => {
  const dishes = [
    { activeMinutes: 10, totalMinutes: 70, thermalMinutes: 45, restMinutes: 15 },
    { activeMinutes: 5, totalMinutes: 45, thermalMinutes: 25, restMinutes: 15 },
    { activeMinutes: 16, totalMinutes: 16, thermalMinutes: 0, restMinutes: 0 }
  ];
  const metrics = calculateWorkloadMetrics(dishes);
  assert.equal(metrics.totalActiveMinutes, 31);
  assert.equal(metrics.totalPassiveMinutes, 64);
  assert.equal(metrics.maxLeadTimeMinutes, 70);
});
