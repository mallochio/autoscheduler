import { NormalizedEvent } from "./tauri-commands";
import { PRIORITIES, Priority } from "./utils";

export interface WeeklyStats {
  totalHours: number;
  byPriority: Record<string, number>;
  byHabit: Record<string, number>;
}

export function calculateStats(events: NormalizedEvent[]): WeeklyStats {
  const auto = events.filter((e) => e.isAuto);

  const totalHours = auto.reduce((acc, e) => acc + getHours(e), 0);

  const byPriority = auto.reduce(
    (acc, e) => {
      const p = e.priority || "none";
      acc[p] = (acc[p] || 0) + getHours(e);
      return acc;
    },
    {} as Record<string, number>,
  );

  const byHabit = auto.reduce(
    (acc, e) => {
      const title = e.title || "Unknown";
      acc[title] = (acc[title] || 0) + getHours(e);
      return acc;
    },
    {} as Record<string, number>,
  );

  return { totalHours, byPriority, byHabit };
}

function getHours(e: NormalizedEvent): number {
  const ms = e.end.getTime() - e.start.getTime();
  return ms / 3600000;
}
