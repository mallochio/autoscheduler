'use client';

import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { updateEvent, NormalizedEvent } from '@/lib/tauri-commands';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './calendar-custom.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS },
});

const DnDCalendar = withDragAndDrop(Calendar);

interface EventInteractionArgs {
  event: object;
  start: Date | string;
  end: Date | string;
  isAllDay?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444', // red-500
  high: '#f97316',     // orange-500
  medium: '#eab308',   // yellow-500
  low: '#3b82f6',      // blue-500
  none: '#a1a1aa'      // zinc-400
};

export function CalendarView({ events, setEvents, currentDate, setCurrentDate }: any) {
  const handleEventChange = async ({ event: baseEvent, start, end }: EventInteractionArgs) => {
    const event = baseEvent as NormalizedEvent;
    const newStart = new Date(start);
    const newEnd = new Date(end);
    setEvents((prev: NormalizedEvent[]) => prev.map(e => e.id === event.id ? { ...e, start: newStart, end: newEnd } : e));
    await updateEvent(event.id, newStart.toISOString(), newEnd.toISOString());
  };

  return (
    <div className="h-full p-4 relative">
      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor={(e: object) => (e as NormalizedEvent).start}
        endAccessor={(e: object) => (e as NormalizedEvent).end}
        defaultView="week"
        views={['week', 'day']}
        step={15}
        timeslots={4}
        className="font-sans text-sm"
        onNavigate={setCurrentDate}
        date={currentDate}
        onEventDrop={handleEventChange}
        onEventResize={handleEventChange}
        resizable
        selectable
        eventPropGetter={(e: object) => {
          const event = e as NormalizedEvent;
          if (event.isAutoScheduled) {
            const color = PRIORITY_COLORS[event.priority || 'none'] || PRIORITY_COLORS.none;
            return {
              style: {
                backgroundColor: color,
                borderColor: color,
                color: '#fff'
              }
            };
          }
          return { style: { backgroundColor: '#18181b', borderColor: '#18181b' } };
        }}
      />
    </div>
  );
}
