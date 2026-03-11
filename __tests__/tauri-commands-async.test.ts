import { describe, it, expect, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { getEvents, getHabits, insertEvent, updateEvent } from '@/lib/tauri-commands';

describe('getEvents (non-Tauri mock path)', () => {
  it('returns 3 mock events', async () => {
    const events = await getEvents('2026-03-11', '2026-03-12');
    expect(events).toHaveLength(3);
  });

  it('returns events with correct titles', async () => {
    const events = await getEvents('2026-03-11', '2026-03-12');
    const titles = events.map((e) => e.title);
    expect(titles).toContain('Team Standup');
    expect(titles).toContain('Deep Work');
    expect(titles).toContain('Lunch');
  });

  it('creates events on the specified date', async () => {
    const events = await getEvents('2026-06-15', '2026-06-16');
    for (const event of events) {
      expect(event.start.getFullYear()).toBe(2026);
      expect(event.start.getMonth()).toBe(5); // June = 5
      expect(event.start.getDate()).toBe(15);
    }
  });

  it('falls back to current date for invalid date string', async () => {
    const events = await getEvents('not-a-date', '2026-03-12');
    const today = new Date();
    for (const event of events) {
      expect(event.start.getFullYear()).toBe(today.getFullYear());
      expect(event.start.getMonth()).toBe(today.getMonth());
      expect(event.start.getDate()).toBe(today.getDate());
    }
  });
});

describe('getHabits (non-Tauri mock path)', () => {
  it('returns 2 mock habits', async () => {
    const habits = await getHabits();
    expect(habits).toHaveLength(2);
  });

  it('returns habits with correct properties', async () => {
    const habits = await getHabits();
    const lunch = habits.find((h) => h.name === 'Lunch');
    const deepWork = habits.find((h) => h.name === 'Deep Work');

    expect(lunch).toBeDefined();
    expect(lunch!.priority).toBe('critical');
    expect(lunch!.duration).toBe(45);

    expect(deepWork).toBeDefined();
    expect(deepWork!.priority).toBe('high');
    expect(deepWork!.duration).toBe(120);
  });
});

describe('insertEvent (non-Tauri mock path)', () => {
  it('returns without error', async () => {
    await expect(
      insertEvent('Test', '2026-03-11T10:00:00Z', '2026-03-11T11:00:00Z'),
    ).resolves.toBeUndefined();
  });
});

describe('updateEvent (non-Tauri mock path)', () => {
  it('returns without error', async () => {
    await expect(
      updateEvent('event-1', '2026-03-11T10:00:00Z', '2026-03-11T11:00:00Z'),
    ).resolves.toBeUndefined();
  });
});
