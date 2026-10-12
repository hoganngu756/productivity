import { useState } from 'react';
import { useSpaceToToggle, useTimer, type UseTimerOptions } from '../hooks/useTimer';
import { formatClock } from '../logic/title';
import { PhaseTabs } from './PhaseTabs';
import { SettingsPanel } from './SettingsPanel';

const PROMPTS = {
  focus: 'Time to focus.',
  shortBreak: 'Take a short break.',
  longBreak: 'Take a long break.',
} as const;

function isToday(epochMs: number) {
  return new Date(epochMs).toDateString() === new Date().toDateString();
}

export function TimerFeature(props: UseTimerOptions) {
  const { settings, state, sessions, remainingMs, title, actions } = useTimer(props);
  const [showSettings, setShowSettings] = useState(false);
  useSpaceToToggle(actions.toggle);

  const interval = settings.longBreakInterval;
  const filledDots = state.phase === 'longBreak' ? interval : state.completedFocus % interval;
  const todayFocus = sessions.filter((s) => s.phase === 'focus' && isToday(s.completedAt)).length;
  const running = state.status === 'running';

  return (
    <div className="timer" data-phase={state.phase}>
      <div className="timer__card">
        <PhaseTabs current={state.phase} onSelect={actions.selectPhase} />

        <div className="timer__clock" role="timer" aria-live="off" data-testid="clock">
          {formatClock(remainingMs)}
        </div>

        <div className="timer__controls">
          <button type="button" className="icon-button" onClick={actions.reset} aria-label="Reset" title="Reset">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
            </svg>
          </button>
          <button type="button" className="primary-button" onClick={actions.toggle}>
            {running ? 'Pause' : state.status === 'paused' ? 'Resume' : 'Start'}
          </button>
          <button type="button" className="icon-button" onClick={actions.skip} aria-label="Skip" title="Skip">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5l10 7-10 7zM19 5v14" />
            </svg>
          </button>
        </div>

        <div className="timer__meta">
          <p className="timer__prompt">{PROMPTS[state.phase]}</p>
          <div className="timer__dots" aria-label={`${filledDots} of ${interval} focus sessions before a long break`}>
            {Array.from({ length: interval }, (_, i) => (
              <span key={i} className="timer__dot" data-filled={i < filledDots} />
            ))}
          </div>
          <p className="timer__today">
            {todayFocus} focus {todayFocus === 1 ? 'session' : 'sessions'} today · Space to start/pause
          </p>
        </div>
      </div>

      <button
        type="button"
        className="link-button"
        aria-expanded={showSettings}
        aria-controls="timer-settings"
        onClick={() => setShowSettings((v) => !v)}
      >
        {showSettings ? 'Hide settings' : 'Settings'}
      </button>

      {showSettings && (
        <div id="timer-settings" className="timer__settings">
          <SettingsPanel settings={settings} title={title} onChange={actions.updateSettings} />
        </div>
      )}
    </div>
  );
}
