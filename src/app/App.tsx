import { TimerFeature, type TimerData, type TimerRepository } from '../features/timer';
import { THEMES, useTheme, type ThemePreference } from './theme';

const THEME_LABELS: Record<ThemePreference, string> = { system: 'Auto', light: 'Light', dark: 'Dark' };

interface Props {
  initialTheme: ThemePreference;
  timer: { initial: TimerData; repository: TimerRepository };
}

/** App shell. New features (tasks, calendar, email) plug in next to the timer as sibling folders under src/features. */
export function App({ initialTheme, timer }: Props) {
  const [theme, setTheme] = useTheme(initialTheme);

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__brand">Productivity</span>
        <div className="segmented" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={theme === t}
              className="segmented__option"
              onClick={() => setTheme(t)}
            >
              {THEME_LABELS[t]}
            </button>
          ))}
        </div>
      </header>
      <main className="app__main">
        <TimerFeature initial={timer.initial} repository={timer.repository} />
      </main>
    </div>
  );
}
