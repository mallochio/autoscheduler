import { invoke } from "@tauri-apps/api/core";
import { Priority } from "./utils";

const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

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
  isAuto: boolean;
  habitId?: string;
  priority?: Priority;
}

export interface Habit {
  id: string;
  name: string;
  duration: number;
  priority: Priority;
  timeStart: string;
  timeEnd: string;
}

export async function getEvents(
  timeMin: string,
  timeMax: string,
): Promise<NormalizedEvent[]> {
  if (!isTauri) return getMockEvents(timeMin);
  const json = await invoke<string>("list_events", { timeMin, timeMax });
  return (JSON.parse(json) as GWSEvent[]).map(normalizeEvent);
}

export async function getHabits(): Promise<Habit[]> {
  if (!isTauri) return getMockHabits();
  const json = await invoke<string>("get_habits");
  return JSON.parse(json);
}

export async function addEvent(
  title: string,
  start: string,
  end: string,
  desc = "[AUTO]",
) {
  if (!isTauri) return;
  await invoke("add_event", { title, desc, start, end });
}

export async function updateEvent(id: string, start: string, end: string) {
  if (!isTauri) return;
  await invoke("update_event", { id, start, end });
}

export async function deleteEvent(id: string) {
  if (!isTauri) return;
  await invoke("delete_event", { id });
}

export async function addHabit(h: Omit<Habit, "id">): Promise<string> {
  if (!isTauri) return `mock-${Date.now()}`;
  return await invoke<string>("add_habit", {
    name: h.name,
    duration: h.duration,
    priority: h.priority,
    start: h.timeStart,
    end: h.timeEnd,
  });
}

export async function updateHabit(h: Habit): Promise<void> {
  if (!isTauri) return;
  await invoke("update_habit", {
    id: h.id,
    name: h.name,
    duration: h.duration,
    priority: h.priority,
    start: h.timeStart,
    end: h.timeEnd,
  });
}

export async function deleteHabit(id: string): Promise<void> {
  if (!isTauri) return;
  await invoke("delete_habit", { id });
}

export function normalizeEvent(e: GWSEvent): NormalizedEvent {
  const desc = e.description || "";
  const match = desc.match(/\[AUTO:(.*?):(.*?)\]/);
  const legacy = desc.match(/\[LOCAL_AUTO_SCHEDULED:(.*?):(.*?)\]/);

  const habitId = match?.[1] || legacy?.[1];
  const priority = (match?.[2] || legacy?.[2] || "medium") as Priority;

  return {
    id: e.id,
    title: e.summary || "Untitled",
    start: new Date(e.start.dateTime || e.start.date || ""),
    end: new Date(e.end.dateTime || e.end.date || ""),
    isAllDay: !!e.start.date,
    isAuto: desc.includes("[AUTO") || desc.includes("[LOCAL_AUTO_SCHEDULED"),
    habitId,
    priority,
  };
}

function getMockHabits(): Habit[] {
  return [
    {
      id: "1",
      name: "Lunch",
      duration: 45,
      priority: "critical",
      timeStart: "11:30",
      timeEnd: "13:30",
    },
    {
      id: "2",
      name: "Deep Work",
      duration: 120,
      priority: "high",
      timeStart: "09:00",
      timeEnd: "17:00",
    },
  ];
}

function getMockEvents(iso: string): NormalizedEvent[] {
  const d = new Date(iso);
  const [y, m, date] = [d.getFullYear(), d.getMonth(), d.getDate()];
  return [
    {
      id: "m1",
      title: "Standup",
      start: new Date(y, m, date, 10),
      end: new Date(y, m, date, 10, 30),
      isAllDay: false,
      isAuto: false,
    },
    {
      id: "m2",
      title: "Deep Work",
      start: new Date(y, m, date, 13),
      end: new Date(y, m, date, 15),
      isAllDay: false,
      isAuto: true,
      habitId: "2",
      priority: "high",
    },
  ];
}
