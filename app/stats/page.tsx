'use client';

import { useState, useEffect } from 'react';
import { getEvents, NormalizedEvent } from '@/lib/tauri-commands';
import { calculateStats } from '@/lib/stats';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export default function StatsPage() {
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate] = useState(new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      const timeMin = startOfWeek(currentDate).toISOString();
      const timeMax = endOfWeek(currentDate).toISOString();
      const data = await getEvents(timeMin, timeMax);
      setEvents(data);
      setIsLoading(false);
    };
    fetchEvents();
  }, [currentDate]);

  const { totalHours, byPriority, byHabit } = calculateStats(events);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50">
      <header className="px-8 py-6 border-b border-zinc-200 bg-white">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Stats</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Week of {format(startOfWeek(currentDate), 'MMM d, yyyy')}
        </p>
      </header>
      <div className="flex-1 p-8 overflow-y-auto">
        {isLoading ? (
          <div className="text-sm text-zinc-500">Loading stats...</div>
        ) : (
          <div className="max-w-4xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                <h3 className="text-sm font-medium text-zinc-500 mb-2">Total Auto-Scheduled</h3>
                <p className="text-4xl font-semibold text-zinc-900">{totalHours.toFixed(1)}<span className="text-xl text-zinc-500 ml-1">hrs</span></p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm md:col-span-2">
                <h3 className="text-sm font-medium text-zinc-500 mb-4">By Priority</h3>
                <div className="flex gap-8">
                  {['critical', 'high', 'medium', 'low'].map(p => {
                    if (!byPriority[p]) return null;
                    return (
                      <div key={p} className="flex flex-col">
                        <span className="text-sm text-zinc-500 capitalize mb-1">{p}</span>
                        <span className="text-2xl font-semibold text-zinc-900">{byPriority[p].toFixed(1)}<span className="text-sm text-zinc-500 ml-1">h</span></span>
                      </div>
                    );
                  })}
                  {Object.keys(byPriority).length === 0 && (
                    <span className="text-sm text-zinc-400 italic">No prioritized habits scheduled yet.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
                <h3 className="font-medium text-zinc-900">Time by Habit</h3>
              </div>
              <div className="divide-y divide-zinc-100">
                {Object.entries(byHabit).sort((a, b) => b[1] - a[1]).map(([title, hours]) => (
                  <div key={title} className="px-6 py-4 flex items-center justify-between">
                    <span className="font-medium text-zinc-700">{title}</span>
                    <span className="text-zinc-600 font-mono">{hours.toFixed(1)}h</span>
                  </div>
                ))}
                {Object.keys(byHabit).length === 0 && (
                  <div className="px-6 py-8 text-center text-sm text-zinc-500">
                    No habits scheduled for this week.
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
