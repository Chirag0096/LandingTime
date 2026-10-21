import test from 'node:test';
import assert from 'node:assert/strict';
import { computeKitchenTimeline } from './timelineEngine.ts';

test('computeKitchenTimeline baseline calculates accurate window and segments', () => {
  const result = computeKitchenTimeline({
    targetHour: 7,
    targetMinute: 30,
    meridiem: 'PM',
    isReplanApplied: false,
    isDelayDetected: false,
  });

  assert.equal(result.windowStartMinute, 1100); // 6:20 PM
  assert.equal(result.targetMinute, 1170); // 7:30 PM
  assert.equal(result.tracks.length, 3);
  assert.equal(result.conflicts.length, 0);

  // Chicken track segments
  const chicken = result.tracks.find((t) => t.dishName === 'Roast Chicken');
  assert.ok(chicken);
  assert.equal(chicken?.segments.length, 3);

  // Roast duration 45m
  const roastSeg = chicken?.segments.find((s) => s.id === 'chk-roast');
  assert.equal(roastSeg?.durationMinutes, 45);
});

test('computeKitchenTimeline with delay (+12m) and replan recalculates landing to 7:37 PM', () => {
  const result = computeKitchenTimeline({
    targetHour: 7,
    targetMinute: 30,
    meridiem: 'PM',
    isDelayDetected: true,
    delayMinutes: 12,
    recoveredMinutes: 5,
    isReplanApplied: true,
  });

  // Target minute should be 1170 + (12 - 5) = 1177 (7:37 PM)
  assert.equal(result.targetMinute, 1177);
  assert.equal(result.targetFormatted, '7:37 PM');

  // Chicken rest should be compressed to 10m
  const chicken = result.tracks.find((t) => t.dishName === 'Roast Chicken');
  const restSeg = chicken?.segments.find((s) => s.id === 'chk-rest');
  assert.equal(restSeg?.durationMinutes, 10);

  // Potatoes should have 17m holding
  const pot = result.tracks.find((t) => t.dishName === 'Smashed Potatoes');
  const holdSeg = pot?.segments.find((s) => s.id === 'pot-hold');
  assert.equal(holdSeg?.durationMinutes, 17);
  assert.equal(holdSeg?.phaseType, 'holding');
});

test('computeKitchenTimeline with substitution extends gravy simmer duration', () => {
  const result = computeKitchenTimeline({
    targetHour: 7,
    targetMinute: 30,
    meridiem: 'PM',
    isHeavyCreamSubstituted: true,
  });

  const asp = result.tracks.find((t) => t.dishName === 'Asparagus & Gravy');
  const gravySeg = asp?.segments.find((s) => s.id === 'gravy-simmer');
  assert.equal(gravySeg?.durationMinutes, 17); // 15 + 2
});
