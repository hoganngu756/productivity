/**
 * Runs the tick interval off the main thread. Browsers throttle main-thread
 * timers in background tabs much harder than worker timers, so ticks keep
 * arriving and the phase ends on time. The worker only says "tick"; the
 * remaining time is always computed from the end timestamp.
 */
type Message = { type: 'start'; intervalMs: number } | { type: 'stop' };

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<Message>) => void) | null;
  postMessage(message: 'tick'): void;
};

let timer: ReturnType<typeof setInterval> | undefined;

ctx.onmessage = (event) => {
  clearInterval(timer);
  timer = undefined;
  if (event.data.type === 'start') {
    timer = setInterval(() => ctx.postMessage('tick'), event.data.intervalMs);
  }
};
