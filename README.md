# Productivity

A local-only personal productivity app. The first feature is a Pomodoro timer. There is no backend and there are no accounts; everything is stored in your browser.

## Run it

Requires Node 20+.

```sh
npm install
npm run dev      # open the URL it prints (usually http://localhost:5173)
```

Other scripts:

```sh
npm test         # unit + UI tests (Vitest)
npm run build    # type-check and build to dist/
npm run preview  # serve the production build
```

## Using the timer

- **Space** starts and pauses. Click a phase tab to switch phases. Reset restarts the current phase. Skip moves to the next phase without counting the current one.
- After every 4 focus sessions (configurable), you get a long break instead of a short one.
- **Hide the countdown in the tab** (on by default) keeps the browser tab title to just "Focus", "Short break" or "Long break". The settings panel shows a live preview of the tab. The favicon is static and never shows the time.
- Chime, desktop notification, and auto-start for the next session are in Settings. Your browser asks for notification permission the first time you turn notifications on.

## Project layout

```
src/
  app/                 App shell and theme (system / light / dark)
  lib/storage.ts       Async key-value StorageAdapter (localStorage today)
  styles/tokens.css    All colors and fonts; change these to restyle the app
  features/
    timer/
      logic/           Pure TypeScript: phases, settings, state machine, title. Unit-tested.
      services/        Web Worker ticker, Web Audio chime, notifications, repository
      hooks/           useTimer: connects the logic to React, the clock and storage
      components/      UI
      index.ts         The feature's public API
```

Add new features (tasks, calendar, email) as sibling folders under `src/features/`, with the same layout.

**Switching storage:** every save goes through `StorageAdapter` in `src/lib/storage.ts`. To use SQLite or a server instead, write another adapter with the same `get`/`set`/`remove` methods and export it as `storage`.

**Timing:** the timer stores an end timestamp and works out the remaining time from the clock. A Web Worker supplies the ticks, so the timer stays accurate in background tabs and across reloads.
