import { NormalizedEvent } from '@/lib/tauri-commands';

export interface WeeklyStats {
  totalHours: number;
  byPriority: Record<string, number>;
  byHabit: Record<string, number>;
}

export function calculateStats(events: NormalizedEvent[]): WeeklyStats {
  const autoEvents = events.filter(e => e.isAutoScheduled);
  
  const totalHours = autoEvents.reduce((acc, e) => acc + getDurationHours(e), 0);
  
  const byPriority = autoEvents.reduce((acc, e) => {
    const p = e.priority || 'none';
    acc[p] = (acc[p] || 0) + getDurationHours(e);
    return acc;
  }, {} as Record<string, number>);

  const byHabit = autoEvents.reduce((acc, e) => {
    const title = e.title || 'Unknown';
    acc[title] = (acc[title] || 0) + getDurationHours(e);
    return acc;
  }, {} as Record<string, number>);

  return { totalHours, byPriority, byHabit };
}

function getDurationHours(event: NormalizedEvent): number {
  return (event.end.getTime() - event.start.getTime()) / 3600000;
}
