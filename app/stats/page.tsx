"use client";

import { useState, useEffect } from "react";
import { getEvents, NormalizedEvent } from "@/lib/tauri-commands";
import { calculateStats } from "@/lib/stats";
import { PRIORITIES } from "@/lib/utils";
import { startOfWeek, endOfWeek, format } from "date-fns";

export default function StatsPage() {
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [date] = useState(new Date());

  useEffect(() => {
    const fetch = async () => {
      const min = startOfWeek(date).toISOString();
      const max = endOfWeek(date).toISOString();
      const data = await getEvents(min, max);
      setEvents(data);
      setLoading(false);
    };
    fetch();
  }, [date]);

  const { totalHours, byPriority, byHabit } = calculateStats(events);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50">
      <header className="px-8 py-6 border-b bg-white">
        <h1 className="text-2xl font-semibold text-zinc-900">Stats</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Week of {format(startOfWeek(date), "MMM d, yyyy")}
        </p>
      </header>
      <div className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="text-sm text-zinc-500">Loading...</div>
        ) : (
          <div className="max-w-4xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Total Auto Hours
                </h3>
                <p className="text-4xl font-bold text-zinc-900">
                  {totalHours.toFixed(1)}
                  <span className="text-lg font-normal text-zinc-400 ml-1">
                    h
                  </span>
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm md:col-span-2">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-4">
                  By Priority
                </h3>
                <div className="flex gap-8">
                  {Object.keys(PRIORITIES).map((p) => {
                    const hrs = byPriority[p] || 0;
                    if (hrs === 0) return null;
                    return (
                      <div key={p} className="flex flex-col">
                        <span className="text-xs font-medium text-zinc-500 capitalize mb-1">
                          {p}
                        </span>
                        <span className="text-2xl font-bold text-zinc-900">
                          {hrs.toFixed(1)}
                          <span className="text-sm font-normal text-zinc-400 ml-0.5">
                            h
                          </span>
                        </span>
                      </div>
                    );
                  })}
                  {Object.keys(byPriority).length === 0 && (
                    <span className="text-sm text-zinc-400 italic">
                      No data.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-zinc-50/50">
                <h3 className="font-medium text-zinc-900">Habit Breakdown</h3>
              </div>
              <div className="divide-y">
                {Object.entries(byHabit)
                  .sort((a, b) => b[1] - a[1])
                  .map(([title, hours]) => (
                    <div
                      key={title}
                      className="px-6 py-4 flex justify-between items-center"
                    >
                      <span className="text-sm font-medium text-zinc-700">
                        {title}
                      </span>
                      <span className="text-sm font-mono text-zinc-500">
                        {hours.toFixed(1)}h
                      </span>
                    </div>
                  ))}
                {Object.keys(byHabit).length === 0 && (
                  <div className="px-6 py-8 text-center text-sm text-zinc-400">
                    No habits scheduled.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
