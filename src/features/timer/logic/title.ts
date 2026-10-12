import { PHASE_LABELS, type Phase } from './phases';

/** Formats milliseconds as MM:SS, rounding up so the clock shows 25:00 at the start and 00:01 at the end. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * The browser tab title. With `hideCountdown` on, this is only the phase
 * name and never contains a digit; that guarantee is covered by tests.
 */
export function documentTitle(phase: Phase, remainingMs: number, hideCountdown: boolean): string {
  const label = PHASE_LABELS[phase];
  return hideCountdown ? label : `${formatClock(remainingMs)} · ${label}`;
}
