import { useEffect, useState } from 'react';
import { storage } from '../lib/storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export const THEMES: readonly ThemePreference[] = ['system', 'light', 'dark'];

const KEY = 'app.theme';

export async function loadTheme(): Promise<ThemePreference> {
  const stored = await storage.get<string>(KEY);
  return THEMES.includes(stored as ThemePreference) ? (stored as ThemePreference) : 'system';
}

/** "system" removes data-theme so the prefers-color-scheme media query decides. */
export function applyTheme(theme: ThemePreference) {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

export function useTheme(initial: ThemePreference) {
  const [theme, setTheme] = useState(initial);
  useEffect(() => {
    applyTheme(theme);
    void storage.set(KEY, theme);
  }, [theme]);
  return [theme, setTheme] as const;
}
