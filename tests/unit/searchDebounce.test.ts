import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Search Debounce Behavior (150ms)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays applying non-empty search query until 150ms passes', () => {
    let appliedQuery = '';
    const applyQuery = (q: string) => {
      appliedQuery = q;
    };

    // Simulate debounce logic matching CropExplorer
    let timer: NodeJS.Timeout | null = null;
    const handleSearchChange = (query: string) => {
      if (!query) {
        if (timer) clearTimeout(timer);
        applyQuery('');
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        applyQuery(query);
      }, 150);
    };

    // Keystroke 1: 't'
    handleSearchChange('t');
    expect(appliedQuery).toBe('');

    vi.advanceTimersByTime(100);
    expect(appliedQuery).toBe('');

    // Keystroke 2: 'to' before 150ms expires
    handleSearchChange('to');
    expect(appliedQuery).toBe('');

    vi.advanceTimersByTime(100);
    expect(appliedQuery).toBe(''); // total 200ms, but only 100ms since 'to'

    vi.advanceTimersByTime(50);
    expect(appliedQuery).toBe('to'); // 150ms reached for 'to'
  });

  it('immediately applies empty query when cleared without 150ms delay', () => {
    let appliedQuery = 'tomato';
    const applyQuery = (q: string) => {
      appliedQuery = q;
    };

    let timer: NodeJS.Timeout | null = null;
    const handleSearchChange = (query: string) => {
      if (!query) {
        if (timer) clearTimeout(timer);
        applyQuery('');
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        applyQuery(query);
      }, 150);
    };

    // User clears search or deletes all characters
    handleSearchChange('');
    expect(appliedQuery).toBe(''); // Instant reset
  });
});
