import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PHASE_LABELS, type Phase } from '../logic/phases';
import { phaseDurationMs, sanitizeSettings, type TimerSettings } from '../logic/settings';
import * as timer from '../logic/timer';
import { documentTitle } from '../logic/title';
import { playChime, primeAudio } from '../services/chime';
import { showNotification } from '../services/notify';
import type { SessionRecord, TimerData, TimerRepository } from '../services/repository';
import { startTicker } from '../services/ticker';

export interface UseTimerOptions {
  initial: TimerData;
  repository: TimerRepository;
}

/** Wires the pure timer logic to the clock, the worker ticker, storage, sound and notifications. */
export function useTimer({ initial, repository }: UseTimerOptions) {
  const [settings, setSettingsState] = useState(initial.settings);
  const [state, setState] = useState(initial.state);
  const [sessions, setSessions] = useState(initial.sessions);
  const [now, setNow] = useState(() => Date.now());

  // Refs give event handlers (worker ticks, key presses) the latest values without re-subscribing.
  const settingsRef = useRef(settings);
  const stateRef = useRef(state);
  const sessionsRef = useRef(sessions);

  const commit = useCallback(
    (next: timer.TimerState) => {
      if (next === stateRef.current) return;
      stateRef.current = next;
      setState(next);
      setNow(Date.now());
      void repository.saveState(next);
    },
    [repository],
  );

  const onComplete = useCallback(
    (completed: Phase, next: timer.TimerState, at: number) => {
      const s = settingsRef.current;
      const record: SessionRecord = { phase: completed, completedAt: at, durationMs: phaseDurationMs(completed, s) };
      sessionsRef.current = [...sessionsRef.current, record];
      setSessions(sessionsRef.current);
      void repository.saveSessions(sessionsRef.current);

      if (s.chime) playChime();
      if (s.notifications) {
        const nextLabel = PHASE_LABELS[next.phase];
        showNotification(
          `${PHASE_LABELS[completed]} complete`,
          next.status === 'running' ? `${nextLabel} has started.` : `Up next: ${nextLabel}.`,
        );
      }
    },
    [repository],
  );

  const onTick = useCallback(() => {
    const t = Date.now();
    setNow(t);
    const result = timer.tick(stateRef.current, settingsRef.current, t);
    if (!result.completed) return;
    commit(result.state);
    onComplete(result.completed, result.state, t);
  }, [commit, onComplete]);

  // Tick from the worker only while running.
  useEffect(() => {
    if (state.status !== 'running') return;
    const ticker = startTicker(onTick);
    return () => ticker.stop();
  }, [state.status, onTick]);

  // Catch up immediately when the tab becomes visible again (and once on load,
  // in case a restored session already ended while the app was closed).
  useEffect(() => {
    onTick();
    const onVisible = () => {
      if (document.visibilityState === 'visible') onTick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [onTick]);

  const actions = useMemo(
    () => ({
      toggle() {
        primeAudio();
        commit(timer.toggle(stateRef.current, Date.now()));
      },
      reset() {
        commit(timer.reset(stateRef.current, settingsRef.current));
      },
      skip() {
        commit(timer.skip(stateRef.current, settingsRef.current));
      },
      selectPhase(phase: Phase) {
        commit(timer.selectPhase(stateRef.current, phase, settingsRef.current));
      },
      updateSettings(patch: Partial<TimerSettings>) {
        const next = sanitizeSettings({ ...settingsRef.current, ...patch });
        settingsRef.current = next;
        setSettingsState(next);
        void repository.saveSettings(next);
        commit(timer.applySettings(stateRef.current, next));
      },
    }),
    [commit, repository],
  );

  const remainingMs = timer.getRemainingMs(state, now);
  const title = documentTitle(state.phase, remainingMs, settings.hideCountdownInTab);

  useEffect(() => {
    document.title = title;
  }, [title]);

  return { settings, state, sessions, remainingMs, title, actions };
}

/** Space toggles start/pause, except while typing in a form field. */
export function useSpaceToToggle(toggle: () => void) {
  useEffect(() => {
    const isEditable = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.ctrlKey || e.metaKey || e.altKey || isEditable(e.target)) return;
      // Stop a focused button from also "clicking" on Space.
      e.preventDefault();
      if (!e.repeat) toggle();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isEditable(e.target)) e.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [toggle]);
}
