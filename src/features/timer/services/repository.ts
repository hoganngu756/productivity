import type { StorageAdapter } from '../../../lib/storage';
import { isPhase, type Phase } from '../logic/phases';
import { sanitizeSettings, type TimerSettings } from '../logic/settings';
import { restoreTimerState, type TimerState } from '../logic/timer';

export interface SessionRecord {
  phase: Phase;
  /** Epoch ms. */
  completedAt: number;
  durationMs: number;
}

export interface TimerData {
  settings: TimerSettings;
  state: TimerState;
  sessions: SessionRecord[];
}

export interface TimerRepository {
  load(): Promise<TimerData>;
  saveSettings(settings: TimerSettings): Promise<void>;
  saveState(state: TimerState): Promise<void>;
  saveSessions(sessions: SessionRecord[]): Promise<void>;
}

const KEYS = {
  settings: 'timer.settings',
  state: 'timer.state',
  sessions: 'timer.sessions',
} as const;

/** Keeps the session log from growing without bound in localStorage. */
export const MAX_SESSIONS = 1000;

function isSessionRecord(value: unknown): value is SessionRecord {
  const r = value as SessionRecord;
  return !!r && isPhase(r.phase) && typeof r.completedAt === 'number' && typeof r.durationMs === 'number';
}

export function createTimerRepository(storage: StorageAdapter): TimerRepository {
  return {
    async load() {
      const [rawSettings, rawState, rawSessions] = await Promise.all([
        storage.get<unknown>(KEYS.settings),
        storage.get<unknown>(KEYS.state),
        storage.get<unknown>(KEYS.sessions),
      ]);
      const settings = sanitizeSettings(rawSettings);
      return {
        settings,
        state: restoreTimerState(rawState, settings),
        sessions: Array.isArray(rawSessions) ? rawSessions.filter(isSessionRecord) : [],
      };
    },
    saveSettings: (settings) => storage.set(KEYS.settings, settings),
    saveState: (state) => storage.set(KEYS.state, state),
    saveSessions: (sessions) => storage.set(KEYS.sessions, sessions.slice(-MAX_SESSIONS)),
  };
}
