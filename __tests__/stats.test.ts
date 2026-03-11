import { describe, it, expect } from 'vitest';
import { calculateStats } from '@/lib/stats';
import { NormalizedEvent } from '@/lib/tauri-commands';

function makeEvent(overrides: Partial<NormalizedEvent> = {}): NormalizedEvent {
  return {
    id: '1',
    title: 'Test',
    start: new Date('2026-03-11T09:00:00Z'),
    end: new Date('2026-03-11T10:00:00Z'),
    isAllDay: false,
    isAutoScheduled: true,
    ...overrides,
  };
}

describe('calculateStats', () => {
  it('returns zeros for an empty events array', () => {
    const result = calculateStats([]);
    expect(result.totalHours).toBe(0);
    expect(result.byPriority).toEqual({});
    expect(result.byHabit).toEqual({});
  });

  it('excludes manual events and returns zeros', () => {
    const result = calculateStats([
      makeEvent({ isAutoScheduled: false }),
      makeEvent({ id: '2', isAutoScheduled: false }),
    ]);
    expect(result.totalHours).toBe(0);
    expect(result.byPriority).toEqual({});
    expect(result.byHabit).toEqual({});
  });

  it('calculates stats for a single auto-scheduled event', () => {
    const result = calculateStats([
      makeEvent({ title: 'Meditate', priority: 'high' }),
    ]);
    expect(result.totalHours).toBe(1);
    expect(result.byPriority).toEqual({ high: 1 });
    expect(result.byHabit).toEqual({ Meditate: 1 });
  });

  it('groups by different priorities', () => {
    const result = calculateStats([
      makeEvent({ id: '1', priority: 'high' }),
      makeEvent({ id: '2', priority: 'low' }),
      makeEvent({ id: '3', priority: 'high' }),
    ]);
    expect(result.totalHours).toBe(3);
    expect(result.byPriority).toEqual({ high: 2, low: 1 });
  });

  it('aggregates hours for the same habit name', () => {
    const result = calculateStats([
      makeEvent({ id: '1', title: 'Exercise' }),
      makeEvent({ id: '2', title: 'Exercise' }),
      makeEvent({ id: '3', title: 'Read' }),
    ]);
    expect(result.byHabit).toEqual({ Exercise: 2, Read: 1 });
  });

  it('only counts auto-scheduled events in a mixed list', () => {
    const result = calculateStats([
      makeEvent({ id: '1', title: 'Auto', isAutoScheduled: true }),
      makeEvent({ id: '2', title: 'Manual', isAutoScheduled: false }),
      makeEvent({ id: '3', title: 'Auto2', isAutoScheduled: true }),
    ]);
    expect(result.totalHours).toBe(2);
    expect(result.byHabit).toEqual({ Auto: 1, Auto2: 1 });
    expect(result.byHabit).not.toHaveProperty('Manual');
  });

  it('puts events with no priority into the "none" bucket', () => {
    const result = calculateStats([
      makeEvent({ priority: undefined }),
    ]);
    expect(result.byPriority).toEqual({ none: 1 });
  });

  it('puts events with no title into the "Unknown" bucket', () => {
    const result = calculateStats([
      makeEvent({ title: '' }),
    ]);
    expect(result.byHabit).toEqual({ Unknown: 1 });
  });

  it('handles fractional hours (30-min event = 0.5h)', () => {
    const result = calculateStats([
      makeEvent({
        start: new Date('2026-03-11T09:00:00Z'),
        end: new Date('2026-03-11T09:30:00Z'),
      }),
    ]);
    expect(result.totalHours).toBe(0.5);
  });
});
