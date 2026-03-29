"use client";

import { useState, useEffect } from "react";
import { CalendarView } from "@/components/calendar-view";
import { StatsPanel } from "@/components/stats-panel";
import { runSchedulerForDay } from "@/lib/scheduler";
import { getEvents, NormalizedEvent } from "@/lib/tauri-commands";
import { startOfWeek, endOfWeek } from "date-fns";

export default function PlannerPage() {
  const [busy, setBusy] = useState(false);
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [date, setDate] = useState(new Date());

  const fetch = async (d: Date) => {
    const min = startOfWeek(d).toISOString();
    const max = endOfWeek(d).toISOString();
    return await getEvents(min, max);
  };

  useEffect(() => {
    let active = true;
    fetch(date).then((data) => {
      if (active) setEvents(data);
    });
    return () => {
      active = false;
    };
  }, [date]);

  const onSchedule = async () => {
    setBusy(true);
    try {
      await runSchedulerForDay(date);
      const data = await fetch(date);
      setEvents(data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
        <h1 className="text-xl font-semibold text-zinc-900">Auto Scheduler</h1>
        <button
          onClick={onSchedule}
          disabled={busy}
          className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {busy ? "Scheduling..." : "Auto-Schedule"}
        </button>
      </header>
      <StatsPanel events={events} />
      <main className="flex-1 overflow-hidden">
        <CalendarView
          events={events}
          setEvents={setEvents}
          currentDate={date}
          setCurrentDate={setDate}
        />
      </main>
    </div>
  );
}
