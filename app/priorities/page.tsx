'use client';

import { useState, useEffect } from 'react';
import { getHabits, Habit } from '@/lib/tauri-commands';

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
};

const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export default function PrioritiesPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getHabits().then(data => {
      const sorted = [...data].sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);
      setHabits(sorted);
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50">
      <header className="px-8 py-6 border-b border-zinc-200 bg-white">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Priorities</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage the priority levels of your auto-scheduled habits.</p>
      </header>
      <div className="flex-1 p-8 overflow-y-auto">
        {isLoading ? (
          <div className="text-sm text-zinc-500">Loading priorities...</div>
        ) : (
          <div className="grid gap-4 max-w-3xl">
            {habits.map(habit => (
              <div key={habit.id} className="bg-white border border-zinc-200 rounded-lg p-5 flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="font-medium text-zinc-900">{habit.name}</h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    {habit.duration} mins • {habit.timeStart} - {habit.timeEnd}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${PRIORITY_COLORS[habit.priority] || 'bg-zinc-100 text-zinc-800 border-zinc-200'}`}>
                  {habit.priority}
                </div>
              </div>
            ))}
            {habits.length === 0 && (
              <div className="text-sm text-zinc-500 text-center py-8 bg-white border border-zinc-200 border-dashed rounded-lg">
                No habits found. Add some habits to see them prioritized here.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
