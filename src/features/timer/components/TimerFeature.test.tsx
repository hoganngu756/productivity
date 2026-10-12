import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryAdapter } from '../../../lib/storage';
import { createTimerRepository } from '../services/repository';
import { TimerFeature } from './TimerFeature';

const DIGIT = /\d/;

async function setup() {
  const repository = createTimerRepository(createMemoryAdapter());
  const initial = await repository.load();
  render(<TimerFeature initial={initial} repository={repository} />);
  return { repository };
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('TimerFeature: browser tab title', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.title = '';
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('never puts a digit in document.title while hiding is on, through a full focus session and break', async () => {
    await setup();
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    const titles = new Set<string>();
    // 25 min focus + 5 min break, checked every half second.
    for (let elapsed = 0; elapsed <= 31 * 60_000; elapsed += 500) {
      advance(500);
      expect(document.title).not.toMatch(DIGIT);
      titles.add(document.title);
      if (screen.queryByRole('button', { name: 'Start' })) {
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
      }
    }
    expect(titles).toEqual(new Set(['Focus', 'Short break']));
  });

  it('shows MM:SS when hiding is off, and the settings preview mirrors the real title', async () => {
    await setup();
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    const preview = screen.getByTestId('tab-preview-title');
    const hideSwitch = screen.getByRole('switch', { name: 'Hide the countdown in the tab' });

    expect((hideSwitch as HTMLInputElement).checked).toBe(true);
    expect(document.title).toBe('Focus');
    expect(preview.textContent).toBe(document.title);

    fireEvent.click(hideSwitch);
    expect(document.title).toBe('25:00 · Focus');
    expect(preview.textContent).toBe(document.title);

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    advance(61_000);
    expect(document.title).toBe('23:59 · Focus');
    expect(preview.textContent).toBe(document.title);

    fireEvent.click(hideSwitch);
    expect(document.title).toBe('Focus');
    advance(10_000);
    expect(document.title).toBe('Focus');
    expect(preview.textContent).toBe('Focus');
  });

  it('Space starts and pauses the timer', async () => {
    await setup();
    fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
    advance(5_000);
    fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy();
    expect(screen.getByTestId('clock').textContent).toBe('24:55');
  });
});
