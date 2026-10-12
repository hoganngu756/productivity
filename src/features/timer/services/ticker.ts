export interface Ticker {
  stop(): void;
}

/** Calls `onTick` every `intervalMs`, from a Web Worker when available (setInterval otherwise, e.g. in tests). */
export function startTicker(onTick: () => void, intervalMs = 250): Ticker {
  if (typeof Worker !== 'undefined') {
    try {
      const worker = new Worker(new URL('./ticker.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = () => onTick();
      worker.postMessage({ type: 'start', intervalMs });
      return { stop: () => worker.terminate() };
    } catch {
      // Fall through to the main-thread interval.
    }
  }
  const id = setInterval(onTick, intervalMs);
  return { stop: () => clearInterval(id) };
}
