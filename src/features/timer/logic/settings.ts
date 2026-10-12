import type { Phase } from './phases';

export interface TimerSettings {
  /** Minutes per phase. */
  durations: Record<Phase, number>;
  /** A long break replaces the short break after every N completed focus sessions. */
  longBreakInterval: number;
  hideCountdownInTab: boolean;
  autoStartNext: boolean;
  notifications: boolean;
  chime: boolean;
}

export const DEFAULT_SETTINGS: TimerSettings = {
  durations: { focus: 25, shortBreak: 5, longBreak: 15 },
  longBreakInterval: 4,
  hideCountdownInTab: true,
  autoStartNext: false,
  notifications: false,
  chime: true,
};

export const DURATION_LIMITS = { min: 1, max: 180 } as const;
export const INTERVAL_LIMITS = { min: 1, max: 12 } as const;

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Merges anything (stored JSON, partial edits) onto the defaults and clamps it to valid values. */
export function sanitizeSettings(input: unknown): TimerSettings {
  const raw = (input && typeof input === 'object' ? input : {}) as Partial<TimerSettings>;
  const durations = (raw.durations ?? {}) as Partial<Record<Phase, unknown>>;
  const d = DEFAULT_SETTINGS;
  const { min, max } = DURATION_LIMITS;
  return {
    durations: {
      focus: clampInt(durations.focus, min, max, d.durations.focus),
      shortBreak: clampInt(durations.shortBreak, min, max, d.durations.shortBreak),
      longBreak: clampInt(durations.longBreak, min, max, d.durations.longBreak),
    },
    longBreakInterval: clampInt(raw.longBreakInterval, INTERVAL_LIMITS.min, INTERVAL_LIMITS.max, d.longBreakInterval),
    hideCountdownInTab: bool(raw.hideCountdownInTab, d.hideCountdownInTab),
    autoStartNext: bool(raw.autoStartNext, d.autoStartNext),
    notifications: bool(raw.notifications, d.notifications),
    chime: bool(raw.chime, d.chime),
  };
}

export function phaseDurationMs(phase: Phase, settings: TimerSettings): number {
  return settings.durations[phase] * 60_000;
}
