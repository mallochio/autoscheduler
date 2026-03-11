import { invoke } from '@tauri-apps/api/core';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export interface GWSEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export interface NormalizedEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  isAutoScheduled: boolean;
  habitId?: string;
  priority?: string;
}

export interface Habit {
  id: string;
  name: string;
  duration: number;
  priority: string;
  timeStart: string;
  timeEnd: string;
}

export async function getEvents(timeMin: string, timeMax: string): Promise<NormalizedEvent[]> {
  if (!isTauri) return getMockEvents(timeMin);
  
  const jsonStr = await invoke<string>('gws_list_events', { timeMin, timeMax });
  return (JSON.parse(jsonStr) as GWSEvent[]).map(normalizeEvent);
}

export async function getHabits(): Promise<Habit[]> {
  if (!isTauri) return getMockHabits();
  
  const jsonStr = await invoke<string>('db_get_habits');
  return JSON.parse(jsonStr);
}

export async function insertEvent(title: string, start: string, end: string, description: string = '[LOCAL_AUTO_SCHEDULED]') {
  if (!isTauri) return;
  await invoke('gws_insert_event', { title, description, start, end });
}

export async function updateEvent(eventId: string, start: string, end: string) {
  if (!isTauri) return;
  await invoke('gws_update_event', { eventId, start, end });
}

export function normalizeEvent(event: GWSEvent): NormalizedEvent {
  const desc = event.description || '';
  const match = desc.match(/\[LOCAL_AUTO_SCHEDULED:(.*?):(.*?)\]/);
  const oldMatch = desc.match(/\[LOCAL_AUTO_SCHEDULED:(.*?)\]/);
  
  let habitId, priority;
  if (match) {
    habitId = match[1];
    priority = match[2];
  } else if (oldMatch) {
    habitId = oldMatch[1];
    priority = 'medium';
  }
  
  return {
    id: event.id,
    title: event.summary || 'Untitled Event',
    start: new Date(event.start.dateTime || event.start.date || ''),
    end: new Date(event.end.dateTime || event.end.date || ''),
    isAllDay: !!event.start.date,
    isAutoScheduled: desc.includes('[LOCAL_AUTO_SCHEDULED'),
    habitId,
    priority
  };
}

function getMockHabits(): Habit[] {
  return [
    { id: '1', name: 'Lunch', duration: 45, priority: 'critical', timeStart: '11:30', timeEnd: '13:30' },
    { id: '2', name: 'Deep Work', duration: 120, priority: 'high', timeStart: '09:00', timeEnd: '17:00' }
  ];
}

function getMockEvents(baseDateStr: string): NormalizedEvent[] {
  const refDate = new Date(baseDateStr);
  const d = isNaN(refDate.getTime()) ? new Date() : refDate;
  const [y, m, date] = [d.getFullYear(), d.getMonth(), d.getDate()];

  return [
    { id: 'mock-1', title: 'Team Standup', start: new Date(y, m, date, 10, 0, 0), end: new Date(y, m, date, 10, 30, 0), isAllDay: false, isAutoScheduled: false },
    { id: 'mock-2', title: 'Deep Work', start: new Date(y, m, date, 13, 0, 0), end: new Date(y, m, date, 15, 0, 0), isAllDay: false, isAutoScheduled: true, habitId: '2', priority: 'high' },
    { id: 'mock-3', title: 'Lunch', start: new Date(y, m, date, 12, 0, 0), end: new Date(y, m, date, 12, 45, 0), isAllDay: false, isAutoScheduled: true, habitId: '1', priority: 'critical' }
  ];
}
