import { getEvents, getHabits, insertEvent, NormalizedEvent, Habit } from './tauri-commands';
import { startOfDay, endOfDay, parse } from 'date-fns';

const PRIORITY_MAP: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

export async function runSchedulerForDay(date: Date): Promise<NormalizedEvent[]> {
  const habits = await fetchSortedHabits();
  const events = await fetchDayEvents(date);
  
  const scheduledHabitIds = getScheduledHabitIds(events);
  const blockingEvents = events.filter(e => !e.isAllDay);
  const newlyScheduled: NormalizedEvent[] = [];
  
  for (const habit of habits) {
    if (scheduledHabitIds.has(habit.id)) continue;

    const slot = findAvailableSlot(habit, date, [...blockingEvents, ...newlyScheduled]);
    if (slot) {
      const newEvent = await scheduleHabit(habit, slot.start, slot.end);
      newlyScheduled.push(newEvent);
    }
  }
  
  return newlyScheduled;
}

async function fetchSortedHabits(): Promise<Habit[]> {
  const habits = await getHabits();
  return habits.sort((a, b) => PRIORITY_MAP[b.priority] - PRIORITY_MAP[a.priority]);
}

async function fetchDayEvents(date: Date): Promise<NormalizedEvent[]> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  return getEvents(dayStart.toISOString(), dayEnd.toISOString());
}

function getScheduledHabitIds(events: NormalizedEvent[]): Set<string> {
  return new Set(events.filter(e => e.isAutoScheduled && e.habitId).map(e => e.habitId as string));
}

function findAvailableSlot(habit: Habit, date: Date, blockingEvents: NormalizedEvent[]): { start: Date, end: Date } | null {
  const dayStart = startOfDay(date);
  const habitStartWindow = parse(habit.timeStart, 'HH:mm', dayStart);
  const habitEndWindow = parse(habit.timeEnd, 'HH:mm', dayStart);
  const durationMs = habit.duration * 60000;
  
  let currentSlotStart = habitStartWindow;
  
  while (currentSlotStart.getTime() + durationMs <= habitEndWindow.getTime()) {
    const currentSlotEnd = new Date(currentSlotStart.getTime() + durationMs);
    
    const overlappingEvent = blockingEvents.find(
      e => currentSlotStart < e.end && currentSlotEnd > e.start
    );
    
    if (!overlappingEvent) {
      return { start: currentSlotStart, end: currentSlotEnd };
    }
    
    currentSlotStart = overlappingEvent.end;
  }
  
  return null;
}

async function scheduleHabit(habit: Habit, start: Date, end: Date): Promise<NormalizedEvent> {
  const newEvent: NormalizedEvent = {
    id: `auto-${Date.now()}-${Math.random()}`,
    title: habit.name,
    start,
    end,
    isAllDay: false,
    isAutoScheduled: true,
    habitId: habit.id,
    priority: habit.priority
  };
  
  await insertEvent(
    habit.name, 
    start.toISOString(), 
    end.toISOString(), 
    `[LOCAL_AUTO_SCHEDULED:${habit.id}:${habit.priority}]`
  );
  
  return newEvent;
}
