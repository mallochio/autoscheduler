import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runSchedulerForDay } from '@/lib/scheduler';
import * as tauriCommands from '@/lib/tauri-commands';
import type { NormalizedEvent, Habit } from '@/lib/tauri-commands';

vi.mock('@/lib/tauri-commands', () => ({
  getHabits: vi.fn(),
  getEvents: vi.fn(),
  insertEvent: vi.fn(),
}));

const BASE_DATE = new Date('2026-03-11T12:00:00Z');

function makeHabit(overrides: Partial<Habit> & { id: string; name: string }): Habit {
  return {
    duration: 60,
    priority: 'medium',
    timeStart: '09:00',
    timeEnd: '17:00',
    ...overrides,
  };
}

function makeEvent(overrides: Partial<NormalizedEvent> & { id: string; title: string; start: Date; end: Date }): NormalizedEvent {
  return {
    isAllDay: false,
    isAutoScheduled: false,
    ...overrides,
  };
}

/** Helper: date on 2026-03-11 at given hour (local time, matching date-fns startOfDay) */
function localTime(hour: number, minute = 0): Date {
  const d = new Date(BASE_DATE);
  d.setHours(0, 0, 0, 0); // startOfDay in local tz
  d.setHours(hour, minute, 0, 0);
  return d;
}

describe('Scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tauriCommands.insertEvent).mockResolvedValue(undefined);
  });

  // 1. Priority-based sorting
  describe('priority-based sorting', () => {
    it('schedules critical before high before medium before low', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: '1', name: 'Low', priority: 'low' }),
        makeHabit({ id: '2', name: 'Critical', priority: 'critical' }),
        makeHabit({ id: '3', name: 'Medium', priority: 'medium' }),
        makeHabit({ id: '4', name: 'High', priority: 'high' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(4);
      expect(scheduled.map(e => e.title)).toEqual(['Critical', 'High', 'Medium', 'Low']);
    });

    it('higher-priority habit gets first available slot', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: '1', name: 'Low', priority: 'low', timeStart: '09:00', timeEnd: '11:00', duration: 60 }),
        makeHabit({ id: '2', name: 'High', priority: 'high', timeStart: '09:00', timeEnd: '11:00', duration: 60 }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled[0].title).toBe('High');
      expect(scheduled[0].start).toEqual(localTime(9, 0));
      expect(scheduled[1].title).toBe('Low');
      expect(scheduled[1].start).toEqual(localTime(10, 0));
    });
  });

  // 2. Skipping already-scheduled habits
  describe('skipping already-scheduled habits', () => {
    it('skips a habit that is already auto-scheduled for the day', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Meditation' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([
        makeEvent({
          id: 'existing',
          title: 'Meditation',
          start: localTime(9),
          end: localTime(10),
          isAutoScheduled: true,
          habitId: 'h1',
        }),
      ]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(0);
      expect(tauriCommands.insertEvent).not.toHaveBeenCalled();
    });

    it('schedules a habit if existing event has different habitId', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Reading' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([
        makeEvent({
          id: 'existing',
          title: 'Something Else',
          start: localTime(14),
          end: localTime(15),
          isAutoScheduled: true,
          habitId: 'h2',
        }),
      ]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(1);
      expect(scheduled[0].title).toBe('Reading');
    });

    it('does not skip if event has isAutoScheduled false even with matching habitId', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Yoga' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([
        makeEvent({
          id: 'manual',
          title: 'Yoga',
          start: localTime(9),
          end: localTime(10),
          isAutoScheduled: false,
          habitId: 'h1',
        }),
      ]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      // The manual event blocks the 9-10 slot, but habit should still be scheduled in another slot
      expect(scheduled).toHaveLength(1);
    });
  });

  // 3. Conflict avoidance
  describe('conflict avoidance', () => {
    it('schedules habit after an existing blocking event', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Study', duration: 60, timeStart: '09:00', timeEnd: '12:00' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([
        makeEvent({
          id: 'meeting',
          title: 'Team Meeting',
          start: localTime(9),
          end: localTime(10, 30),
        }),
      ]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(1);
      expect(scheduled[0].start).toEqual(localTime(10, 30));
      expect(scheduled[0].end).toEqual(localTime(11, 30));
    });

    it('does not schedule if entire window is blocked', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Study', duration: 60, timeStart: '09:00', timeEnd: '10:00' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([
        makeEvent({
          id: 'blocker',
          title: 'All Morning',
          start: localTime(8),
          end: localTime(11),
        }),
      ]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(0);
    });
  });

  // 4. Habit window boundaries
  describe('habit window boundaries', () => {
    it('schedules at exact window start', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Morning Run', duration: 30, timeStart: '06:00', timeEnd: '07:00' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(1);
      expect(scheduled[0].start).toEqual(localTime(6, 0));
      expect(scheduled[0].end).toEqual(localTime(6, 30));
    });

    it('fits a habit that ends exactly at window end', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Evening Walk', duration: 60, timeStart: '20:00', timeEnd: '21:00' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(1);
      expect(scheduled[0].start).toEqual(localTime(20, 0));
      expect(scheduled[0].end).toEqual(localTime(21, 0));
    });

    it('does not schedule outside the habit time window', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Blocked', duration: 60, timeStart: '09:00', timeEnd: '10:00' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([
        makeEvent({
          id: 'block',
          title: 'Occupied',
          start: localTime(9),
          end: localTime(9, 30),
        }),
      ]);

      // After the blocking event at 9:30, only 30 min remain until 10:00 — not enough for 60 min
      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(0);
    });
  });

  // 5. Duration fitting
  describe('duration fitting', () => {
    it('does not schedule if duration exceeds remaining window', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Long Task', duration: 120, timeStart: '14:00', timeEnd: '15:30' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(0);
    });

    it('schedules a short habit in a tight window', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Quick Check', duration: 15, timeStart: '11:00', timeEnd: '11:30' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(1);
      expect(scheduled[0].start).toEqual(localTime(11, 0));
      expect(scheduled[0].end).toEqual(localTime(11, 15));
    });
  });

  // 6. Multiple habits competing for same time slots
  describe('multiple habits competing for same slots', () => {
    it('higher priority takes the slot, lower priority gets next available', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Low Task', priority: 'low', duration: 60, timeStart: '09:00', timeEnd: '12:00' }),
        makeHabit({ id: 'h2', name: 'High Task', priority: 'high', duration: 60, timeStart: '09:00', timeEnd: '12:00' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(2);
      // High gets 9-10, Low gets 10-11
      expect(scheduled[0].title).toBe('High Task');
      expect(scheduled[0].start).toEqual(localTime(9));
      expect(scheduled[1].title).toBe('Low Task');
      expect(scheduled[1].start).toEqual(localTime(10));
    });

    it('third habit gets no slot when window is full', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'A', priority: 'critical', duration: 60, timeStart: '09:00', timeEnd: '11:00' }),
        makeHabit({ id: 'h2', name: 'B', priority: 'high', duration: 60, timeStart: '09:00', timeEnd: '11:00' }),
        makeHabit({ id: 'h3', name: 'C', priority: 'low', duration: 60, timeStart: '09:00', timeEnd: '11:00' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(2);
      expect(scheduled.map(e => e.title)).toEqual(['A', 'B']);
    });
  });

  // 7. All-day events don't block slots
  describe('all-day events', () => {
    it('does not treat all-day events as blocking', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Focus Work', duration: 60, timeStart: '09:00', timeEnd: '12:00' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([
        makeEvent({
          id: 'allday',
          title: 'Holiday',
          start: localTime(0),
          end: localTime(23, 59),
          isAllDay: true,
        }),
      ]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(1);
      expect(scheduled[0].start).toEqual(localTime(9));
    });
  });

  // 8. No habits scenario
  describe('no habits', () => {
    it('returns empty array when there are no habits', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toEqual([]);
      expect(tauriCommands.insertEvent).not.toHaveBeenCalled();
    });
  });

  // 9. insertEvent called with correct description format
  describe('insertEvent description format', () => {
    it('calls insertEvent with [LOCAL_AUTO_SCHEDULED:habitId:priority] description', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'hab-42', name: 'Journaling', duration: 30, priority: 'high', timeStart: '08:00', timeEnd: '09:00' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([]);

      await runSchedulerForDay(BASE_DATE);

      expect(tauriCommands.insertEvent).toHaveBeenCalledTimes(1);
      expect(tauriCommands.insertEvent).toHaveBeenCalledWith(
        'Journaling',
        localTime(8, 0).toISOString(),
        localTime(8, 30).toISOString(),
        '[LOCAL_AUTO_SCHEDULED:hab-42:high]'
      );
    });

    it('calls insertEvent for each scheduled habit', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'A', priority: 'high', duration: 30, timeStart: '09:00', timeEnd: '11:00' }),
        makeHabit({ id: 'h2', name: 'B', priority: 'low', duration: 30, timeStart: '09:00', timeEnd: '11:00' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([]);

      await runSchedulerForDay(BASE_DATE);

      expect(tauriCommands.insertEvent).toHaveBeenCalledTimes(2);
      expect(tauriCommands.insertEvent).toHaveBeenCalledWith(
        'A',
        localTime(9, 0).toISOString(),
        localTime(9, 30).toISOString(),
        '[LOCAL_AUTO_SCHEDULED:h1:high]'
      );
      expect(tauriCommands.insertEvent).toHaveBeenCalledWith(
        'B',
        localTime(9, 30).toISOString(),
        localTime(10, 0).toISOString(),
        '[LOCAL_AUTO_SCHEDULED:h2:low]'
      );
    });
  });

  // 10. Multiple events blocking — finds gaps between events
  describe('finding gaps between multiple blocking events', () => {
    it('schedules in a gap between two events', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Gap Task', duration: 30, timeStart: '09:00', timeEnd: '13:00' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([
        makeEvent({ id: 'e1', title: 'Meeting 1', start: localTime(9), end: localTime(10) }),
        makeEvent({ id: 'e2', title: 'Meeting 2', start: localTime(10, 30), end: localTime(12) }),
      ]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(1);
      expect(scheduled[0].start).toEqual(localTime(10, 0));
      expect(scheduled[0].end).toEqual(localTime(10, 30));
    });

    it('skips gaps that are too small and uses later gap', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Long Task', duration: 60, timeStart: '09:00', timeEnd: '15:00' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([
        makeEvent({ id: 'e1', title: 'Block 1', start: localTime(9), end: localTime(10) }),
        // 10:00-10:30 gap (30 min — too small for 60 min)
        makeEvent({ id: 'e2', title: 'Block 2', start: localTime(10, 30), end: localTime(12) }),
        // 12:00-15:00 gap (enough)
      ]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(1);
      expect(scheduled[0].start).toEqual(localTime(12, 0));
      expect(scheduled[0].end).toEqual(localTime(13, 0));
    });

    it('returns nothing when all gaps are too small', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Big Task', duration: 60, timeStart: '09:00', timeEnd: '12:00' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([
        makeEvent({ id: 'e1', title: 'A', start: localTime(9), end: localTime(9, 45) }),
        // 15 min gap
        makeEvent({ id: 'e2', title: 'B', start: localTime(10), end: localTime(10, 45) }),
        // 15 min gap
        makeEvent({ id: 'e3', title: 'C', start: localTime(11), end: localTime(12) }),
      ]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(0);
    });
  });

  // Edge case: returned event structure
  describe('returned event structure', () => {
    it('returns events with correct fields', async () => {
      vi.mocked(tauriCommands.getHabits).mockResolvedValue([
        makeHabit({ id: 'h1', name: 'Test Habit', priority: 'critical', duration: 45, timeStart: '10:00', timeEnd: '12:00' }),
      ]);
      vi.mocked(tauriCommands.getEvents).mockResolvedValue([]);

      const scheduled = await runSchedulerForDay(BASE_DATE);

      expect(scheduled).toHaveLength(1);
      const event = scheduled[0];
      expect(event.title).toBe('Test Habit');
      expect(event.isAllDay).toBe(false);
      expect(event.isAutoScheduled).toBe(true);
      expect(event.habitId).toBe('h1');
      expect(event.priority).toBe('critical');
      expect(event.start).toEqual(localTime(10, 0));
      expect(event.end).toEqual(localTime(10, 45));
      expect(event.id).toMatch(/^auto-/);
    });
  });
});
