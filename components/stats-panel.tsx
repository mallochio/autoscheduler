"use client";

import { calculateStats } from "@/lib/stats";
import { NormalizedEvent } from "@/lib/tauri-commands";
import { PRIORITIES } from "@/lib/utils";

export function StatsPanel({ events }: { events: NormalizedEvent[] }) {
  const { totalHours, byPriority } = calculateStats(events);

  return (
    <div className="flex items-center gap-6 px-6 py-3 bg-zinc-50/50 border-b border-zinc-200 overflow-x-auto">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          Total Auto
        </span>
        <span className="text-lg font-bold text-zinc-900 leading-tight">
          {totalHours.toFixed(1)}
          <span className="text-xs font-normal text-zinc-500 ml-0.5">h</span>
        </span>
      </div>

      <div className="w-px h-6 bg-zinc-200 shrink-0" />

      <div className="flex gap-6">
        {(Object.keys(PRIORITIES) as Array<keyof typeof PRIORITIES>).map(
          (p) => {
            const val = byPriority[p] || 0;
            if (val === 0) return null;
            return (
              <div key={p} className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {p}
                </span>
                <span className="text-sm font-semibold text-zinc-700 leading-tight">
                  {val.toFixed(1)}
                  <span className="text-[10px] font-normal text-zinc-400 ml-0.5">
                    h
                  </span>
                </span>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
