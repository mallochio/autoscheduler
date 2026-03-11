'use client';

import { CalendarView } from '@/components/calendar-view';
import { StatsPanel } from '@/components/stats-panel';
import { useState, useEffect } from 'react';
import { runSchedulerForDay } from '@/lib/scheduler';
import { getEvents, NormalizedEvent } from '@/lib/tauri-commands';
import { startOfWeek, endOfWeek } from 'date-fns';

export default function PlannerPage() {
  const [isScheduling, setIsScheduling] = useState(false);
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchEvents = async (date: Date) => {
    const timeMin = startOfWeek(date).toISOString();
    const timeMax = endOfWeek(date).toISOString();
    return await getEvents(timeMin, timeMax);
  };

  useEffect(() => {
    let mounted = true;
    fetchEvents(currentDate).then(newEvents => {
      if (mounted) {
        setEvents(newEvents);
      }
    });
    return () => { mounted = false; };
  }, [currentDate]);

  const runScheduler = async () => {
    setIsScheduling(true);
    await runSchedulerForDay(currentDate);
    const newEvents = await fetchEvents(currentDate);
    setEvents(newEvents);
    setIsScheduling(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
        <h1 className="text-xl font-semibold text-zinc-900">Auto Scheduler</h1>
        <button 
          onClick={runScheduler}
          disabled={isScheduling}
          className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 disabled:opacity-50"
        >
          {isScheduling ? 'Scheduling...' : 'Auto-Schedule Habits'}
        </button>
      </header>
      <StatsPanel events={events} />
      <main className="flex-1 overflow-hidden">
        <CalendarView 
          events={events} 
          setEvents={setEvents} 
          currentDate={currentDate} 
          setCurrentDate={setCurrentDate} 
        />
      </main>
    </div>
  );
}
