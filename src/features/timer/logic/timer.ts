import { isPhase, type Phase } from './phases';
import { phaseDurationMs, type TimerSettings } from './settings';

/**
 * Pure timer state machine. No React, no clocks: every function that needs
 * the time takes `now` (epoch ms), so the logic is deterministic and testable.
 *
 * While running, the source of truth is `endsAt`, not a counter, so the
 * remaining time stays correct even if ticks are delayed or skipped.
 */
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerState {
  phase: Phase;
  status: TimerStatus;
  /** Epoch ms when the current phase ends. Set only while running. */
  endsAt: number | null;
  /** Remaining time while idle or paused. */
  remainingMs: number;
  /** Total focus sessions completed; drives the long-break cycle. */
  completedFocus: number;
}

export function initialTimerState(settings: TimerSettings): TimerState {
  return idleIn('focus', settings, 0);
}

function idleIn(phase: Phase, settings: TimerSettings, completedFocus: number): TimerState {
  return { phase, status: 'idle', endsAt: null, remainingMs: phaseDurationMs(phase, settings), completedFocus };
}

export function getRemainingMs(state: TimerState, now: number): number {
  if (state.status === 'running' && state.endsAt != null) return Math.max(0, state.endsAt - now);
  return state.remainingMs;
}

export function start(state: TimerState, now: number): TimerState {
  if (state.status === 'running') return state;
  return { ...state, status: 'running', endsAt: now + state.remainingMs };
}

export function pause(state: TimerState, now: number): TimerState {
  if (state.status !== 'running') return state;
  return { ...state, status: 'paused', endsAt: null, remainingMs: getRemainingMs(state, now) };
}

export function toggle(state: TimerState, now: number): TimerState {
  return state.status === 'running' ? pause(state, now) : start(state, now);
}

/** Puts the current phase back to its full length, stopped. */
export function reset(state: TimerState, settings: TimerSettings): TimerState {
  return idleIn(state.phase, settings, state.completedFocus);
}

export function selectPhase(state: TimerState, phase: Phase, settings: TimerSettings): TimerState {
  return idleIn(phase, settings, state.completedFocus);
}

/** Which phase follows `phase`, given the focus count after it finished. */
export function nextPhase(phase: Phase, completedFocus: number, settings: TimerSettings): Phase {
  if (phase !== 'focus') return 'focus';
  return completedFocus > 0 && completedFocus % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
}

/** Moves on without counting the current phase as completed. */
export function skip(state: TimerState, settings: TimerSettings): TimerState {
  const phase = state.phase === 'focus' ? 'shortBreak' : 'focus';
  return idleIn(phase, settings, state.completedFocus);
}

export interface TickResult {
  state: TimerState;
  /** The phase that just finished, if this tick completed one. */
  completed: Phase | null;
}

export function tick(state: TimerState, settings: TimerSettings, now: number): TickResult {
  if (state.status !== 'running' || state.endsAt == null || now < state.endsAt) {
    return { state, completed: null };
  }
  const completed = state.phase;
  const completedFocus = state.completedFocus + (completed === 'focus' ? 1 : 0);
  const next = idleIn(nextPhase(completed, completedFocus, settings), settings, completedFocus);
  return { state: settings.autoStartNext ? start(next, now) : next, completed };
}

/** Applies changed settings: an idle timer picks up the new duration; running/paused ones keep going. */
export function applySettings(state: TimerState, settings: TimerSettings): TimerState {
  return state.status === 'idle' ? idleIn(state.phase, settings, state.completedFocus) : state;
}

/** Rebuilds a state from untrusted stored data, falling back to a fresh timer. */
export function restoreTimerState(raw: unknown, settings: TimerSettings): TimerState {
  const fresh = initialTimerState(settings);
  if (!raw || typeof raw !== 'object') return fresh;
  const r = raw as Partial<TimerState>;
  if (!isPhase(r.phase)) return fresh;
  const completedFocus =
    typeof r.completedFocus === 'number' && r.completedFocus >= 0 ? Math.floor(r.completedFocus) : 0;
  const full = phaseDurationMs(r.phase, settings);

  if (r.status === 'running' && typeof r.endsAt === 'number') {
    return { phase: r.phase, status: 'running', endsAt: r.endsAt, remainingMs: full, completedFocus };
  }
  if (r.status === 'paused' && typeof r.remainingMs === 'number' && r.remainingMs > 0) {
    return { phase: r.phase, status: 'paused', endsAt: null, remainingMs: Math.min(r.remainingMs, full), completedFocus };
  }
  return idleIn(r.phase, settings, completedFocus);
}
