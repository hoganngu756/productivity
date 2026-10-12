/**
 * Persistence boundary for the whole app.
 *
 * Features never touch localStorage directly; they get a StorageAdapter.
 * The interface is async so a SQLite- or server-backed adapter can be
 * dropped in later without changing any callers.
 */
export interface StorageAdapter {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

export function createLocalStorageAdapter(prefix = 'productivity:'): StorageAdapter {
  return {
    async get<T>(key: string) {
      try {
        const raw = window.localStorage.getItem(prefix + key);
        return raw == null ? undefined : (JSON.parse(raw) as T);
      } catch {
        return undefined;
      }
    },
    async set<T>(key: string, value: T) {
      try {
        window.localStorage.setItem(prefix + key, JSON.stringify(value));
      } catch {
        // Storage full or blocked (e.g. private mode): keep running in memory.
      }
    },
    async remove(key: string) {
      try {
        window.localStorage.removeItem(prefix + key);
      } catch {
        // Ignore, same as set().
      }
    },
  };
}

/** In-memory adapter, used by tests. */
export function createMemoryAdapter(): StorageAdapter {
  const data = new Map<string, string>();
  return {
    async get<T>(key: string) {
      const raw = data.get(key);
      return raw == null ? undefined : (JSON.parse(raw) as T);
    },
    async set<T>(key: string, value: T) {
      data.set(key, JSON.stringify(value));
    },
    async remove(key: string) {
      data.delete(key);
    },
  };
}

export const storage: StorageAdapter = createLocalStorageAdapter();
