import { describe, expect, it } from 'vitest';
import { PHASES, PHASE_LABELS } from './phases';
import { documentTitle, formatClock } from './title';

const DIGIT = /\d/;

describe('documentTitle with "Hide the countdown in the tab" on', () => {
  it('never contains a digit, for any phase and any remaining time', () => {
    const samples = [0, 1, 999, 1000, 59_999, 60_000, -5_000, Number.MAX_SAFE_INTEGER, NaN, Infinity];
    // Every second of a three-hour phase (the maximum duration).
    for (let ms = 0; ms <= 180 * 60_000; ms += 1000) samples.push(ms, ms + 500);

    for (const phase of PHASES) {
      for (const ms of samples) {
        const title = documentTitle(phase, ms, true);
        expect(title, `${phase} @ ${ms}ms`).not.toMatch(DIGIT);
      }
    }
  });

  it('shows only the phase name', () => {
    expect(documentTitle('focus', 1_500_000, true)).toBe('Focus');
    expect(documentTitle('shortBreak', 300_000, true)).toBe('Short break');
    expect(documentTitle('longBreak', 900_000, true)).toBe('Long break');
  });

  it('phase labels themselves contain no digits', () => {
    for (const label of Object.values(PHASE_LABELS)) expect(label).not.toMatch(DIGIT);
  });
});

describe('documentTitle with the setting off', () => {
  it('shows "MM:SS · Phase"', () => {
    expect(documentTitle('focus', 25 * 60_000, false)).toBe('25:00 · Focus');
    expect(documentTitle('shortBreak', 61_000, false)).toBe('01:01 · Short break');
    expect(documentTitle('longBreak', 0, false)).toBe('00:00 · Long break');
  });
});

describe('formatClock', () => {
  it('rounds up to whole seconds', () => {
    expect(formatClock(1)).toBe('00:01');
    expect(formatClock(59_001)).toBe('01:00');
    expect(formatClock(90 * 60_000)).toBe('90:00');
    expect(formatClock(-1)).toBe('00:00');
  });
});
