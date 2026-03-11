import { NormalizedEvent } from '@/lib/tauri-commands';
import { calculateStats } from '@/lib/stats';

export function StatsPanel({ events }: { events: NormalizedEvent[] }) {
  const { totalHours, byPriority } = calculateStats(events);

  return (
    <div className="flex gap-6 p-4 bg-zinc-50 border-b border-zinc-200 text-sm">
      <div className="flex flex-col">
        <span className="text-zinc-500 font-medium">Auto-Scheduled</span>
        <span className="text-xl font-semibold">{totalHours.toFixed(1)}h</span>
      </div>
      {['critical', 'high', 'medium', 'low'].map(p => {
        if (!byPriority[p]) return null;
        return (
          <div key={p} className="flex flex-col">
            <span className="text-zinc-500 font-medium capitalize">{p}</span>
            <span className="text-xl font-semibold">{byPriority[p].toFixed(1)}h</span>
          </div>
        );
      })}
    </div>
  );
}
