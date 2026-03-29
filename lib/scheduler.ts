import {
  addEvent,
  getEvents,
  getHabits,
  NormalizedEvent,
  Habit,
} from "./tauri-commands";
import { PRIORITIES } from "./utils";
import { startOfDay, endOfDay, parse } from "date-fns";

export async function runSchedulerForDay(
  date: Date,
): Promise<NormalizedEvent[]> {
  const habits = await fetchSortedHabits();
  const events = await fetchDayEvents(date);

  const scheduledIds = new Set(
    events.filter((e) => e.isAuto && e.habitId).map((e) => e.habitId!),
  );
  const blocking = events.filter((e) => !e.isAllDay);
  const newlyScheduled: NormalizedEvent[] = [];

  for (const habit of habits) {
    if (scheduledIds.has(habit.id)) continue;

    const slot = findSlot(habit, date, [...blocking, ...newlyScheduled]);
    if (slot) {
      const newEvent = await scheduleHabit(habit, slot.start, slot.end);
      newlyScheduled.push(newEvent);
    }
  }

  return newlyScheduled;
}

async function fetchSortedHabits(): Promise<Habit[]> {
  const habits = await getHabits();
  return habits.sort(
    (a, b) => PRIORITIES[b.priority].rank - PRIORITIES[a.priority].rank,
  );
}

async function fetchDayEvents(date: Date): Promise<NormalizedEvent[]> {
  return getEvents(
    startOfDay(date).toISOString(),
    endOfDay(date).toISOString(),
  );
}

function findSlot(habit: Habit, date: Date, blocking: NormalizedEvent[]) {
  const day = startOfDay(date);
  const windowStart = parse(habit.timeStart, "HH:mm", day);
  const windowEnd = parse(habit.timeEnd, "HH:mm", day);
  const durationMs = habit.duration * 60000;

  let current = windowStart;

  while (current.getTime() + durationMs <= windowEnd.getTime()) {
    const end = new Date(current.getTime() + durationMs);
    const conflict = blocking.find((e) => current < e.end && end > e.start);

    if (!conflict) return { start: current, end };
    current = conflict.end;
  }

  return null;
}

async function scheduleHabit(
  habit: Habit,
  start: Date,
  end: Date,
): Promise<NormalizedEvent> {
  const id = `auto-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const desc = `[AUTO:${habit.id}:${habit.priority}]`;

  await addEvent(habit.name, start.toISOString(), end.toISOString(), desc);

  return {
    id,
    title: habit.name,
    start,
    end,
    isAllDay: false,
    isAuto: true,
    habitId: habit.id,
    priority: habit.priority,
  };
}
