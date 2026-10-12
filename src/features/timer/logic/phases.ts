export type Phase = 'focus' | 'shortBreak' | 'longBreak';

export const PHASES: readonly Phase[] = ['focus', 'shortBreak', 'longBreak'];

/** User-facing names. These go into document.title, so they must never contain digits. */
export const PHASE_LABELS: Record<Phase, string> = {
  focus: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
};

export function isPhase(value: unknown): value is Phase {
  return typeof value === 'string' && (PHASES as readonly string[]).includes(value);
}
