import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, sanitizeSettings } from './settings';
import * as t from './timer';

const MIN = 60_000;
const s = DEFAULT_SETTINGS;

describe('timer state machine', () => {
  it('starts idle on a full focus session', () => {
    const state = t.initialTimerState(s);
    expect(state).toMatchObject({ phase: 'focus', status: 'idle', remainingMs: 25 * MIN });
  });

  it('derives remaining time from the end timestamp, not from tick count', () => {
    const running = t.start(t.initialTimerState(s), 1_000);
    expect(running.endsAt).toBe(1_000 + 25 * MIN);
    // A single late tick still gives the right answer.
    expect(t.getRemainingMs(running, 1_000 + 10 * MIN)).toBe(15 * MIN);
  });

  it('pauses and resumes without losing time', () => {
    let state = t.start(t.initialTimerState(s), 0);
    state = t.pause(state, 5 * MIN);
    expect(state).toMatchObject({ status: 'paused', remainingMs: 20 * MIN, endsAt: null });
    expect(t.getRemainingMs(state, 99 * MIN)).toBe(20 * MIN);
    state = t.start(state, 50 * MIN);
    expect(state.endsAt).toBe(70 * MIN);
  });

  it('toggle flips between running and paused', () => {
    const a = t.toggle(t.initialTimerState(s), 0);
    expect(a.status).toBe('running');
    expect(t.toggle(a, 1000).status).toBe('paused');
  });

  it('reset restores the full phase and stops', () => {
    const state = t.reset(t.pause(t.start(t.initialTimerState(s), 0), 3 * MIN), s);
    expect(state).toMatchObject({ phase: 'focus', status: 'idle', remainingMs: 25 * MIN });
  });

  it('selecting a phase switches to it, idle', () => {
    const state = t.selectPhase(t.start(t.initialTimerState(s), 0), 'longBreak', s);
    expect(state).toMatchObject({ phase: 'longBreak', status: 'idle', remainingMs: 15 * MIN });
  });

  it('skip moves on without counting the session', () => {
    const fromFocus = t.skip(t.initialTimerState(s), s);
    expect(fromFocus).toMatchObject({ phase: 'shortBreak', completedFocus: 0 });
    expect(t.skip(fromFocus, s).phase).toBe('focus');
  });

  it('does nothing before the end time', () => {
    const running = t.start(t.initialTimerState(s), 0);
    expect(t.tick(running, s, 25 * MIN - 1)).toEqual({ state: running, completed: null });
  });

  it('cycles focus → short break, with a long break after every N focus sessions', () => {
    let state = t.initialTimerState(s);
    let now = 0;
    const seen: string[] = [];
    for (let i = 0; i < 8; i++) {
      state = t.start(state, now);
      now = state.endsAt!;
      const result = t.tick(state, s, now);
      seen.push(`${result.completed}->${result.state.phase}`);
      state = result.state;
    }
    expect(seen).toEqual([
      'focus->shortBreak',
      'shortBreak->focus',
      'focus->shortBreak',
      'shortBreak->focus',
      'focus->shortBreak',
      'shortBreak->focus',
      'focus->longBreak',
      'longBreak->focus',
    ]);
    expect(state.completedFocus).toBe(4);
  });

  it('respects a custom long-break interval', () => {
    const custom = sanitizeSettings({ ...s, longBreakInterval: 2 });
    expect(t.nextPhase('focus', 1, custom)).toBe('shortBreak');
    expect(t.nextPhase('focus', 2, custom)).toBe('longBreak');
  });

  it('stops after a phase, or auto-starts the next one', () => {
    const running = t.start(t.initialTimerState(s), 0);
    expect(t.tick(running, s, 25 * MIN).state.status).toBe('idle');

    const auto = sanitizeSettings({ ...s, autoStartNext: true });
    const next = t.tick(running, auto, 25 * MIN).state;
    expect(next).toMatchObject({ phase: 'shortBreak', status: 'running', endsAt: 30 * MIN });
  });

  it('applies new durations to an idle timer only', () => {
    const longer = sanitizeSettings({ ...s, durations: { ...s.durations, focus: 50 } });
    expect(t.applySettings(t.initialTimerState(s), longer).remainingMs).toBe(50 * MIN);
    const running = t.start(t.initialTimerState(s), 0);
    expect(t.applySettings(running, longer)).toBe(running);
  });

  it('restores stored state defensively', () => {
    expect(t.restoreTimerState(null, s)).toEqual(t.initialTimerState(s));
    expect(t.restoreTimerState({ phase: 'nap' }, s)).toEqual(t.initialTimerState(s));
    expect(t.restoreTimerState({ phase: 'focus', status: 'running', endsAt: 123, completedFocus: 2 }, s)).toMatchObject({
      status: 'running',
      endsAt: 123,
      completedFocus: 2,
    });
    expect(t.restoreTimerState({ phase: 'focus', status: 'paused', remainingMs: 99 * MIN }, s).remainingMs).toBe(25 * MIN);
  });
});

describe('sanitizeSettings', () => {
  it('fills defaults and clamps values', () => {
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    const out = sanitizeSettings({ durations: { focus: 0, shortBreak: 'x', longBreak: 999 }, longBreakInterval: 2.6 });
    expect(out.durations).toEqual({ focus: 1, shortBreak: 5, longBreak: 180 });
    expect(out.longBreakInterval).toBe(3);
    expect(out.hideCountdownInTab).toBe(true);
  });
});
