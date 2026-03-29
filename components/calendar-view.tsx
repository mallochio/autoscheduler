"use client";

import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import {
  updateEvent,
  deleteEvent,
  NormalizedEvent,
} from "@/lib/tauri-commands";
import { PRIORITIES } from "@/lib/utils";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./calendar-custom.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { "en-US": enUS },
});

const DnDCalendar = withDragAndDrop(Calendar);

interface Props {
  events: NormalizedEvent[];
  setEvents: (events: any) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
}

export function CalendarView({
  events,
  setEvents,
  currentDate,
  setCurrentDate,
}: Props) {
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    event: NormalizedEvent;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onMove = async ({ event, start, end }: any) => {
    const e = event as NormalizedEvent;
    const ns = new Date(start);
    const ne = new Date(end);

    setEvents((prev: NormalizedEvent[]) =>
      prev.map((item) =>
        item.id === e.id ? { ...item, start: ns, end: ne } : item,
      ),
    );

    try {
      await updateEvent(e.id, ns.toISOString(), ne.toISOString());
    } catch (err) {
      setError("Failed to move event");
    }
  };

  const onDelete = async () => {
    if (!menu?.event || !confirm("Delete this event?")) return;
    setBusy(true);
    try {
      await deleteEvent(menu.event.id);
      setEvents((prev: NormalizedEvent[]) =>
        prev.filter((e) => e.id !== menu.event.id),
      );
      setMenu(null);
    } catch (err) {
      setError("Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full p-4 relative" onClick={() => setMenu(null)}>
      {error && (
        <div className="absolute top-4 right-4 z-50 p-2 bg-red-50 border border-red-100 text-red-600 text-xs rounded shadow-sm flex items-center gap-2">
          {error}
          <button onClick={() => setError(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
        views={["week", "day"]}
        step={15}
        timeslots={4}
        date={currentDate}
        onNavigate={setCurrentDate}
        onEventDrop={onMove}
        onEventResize={onMove}
        resizable
        selectable
        onSelectEvent={(e: any) => {
          const event = e as NormalizedEvent;
          if (event.isAuto) {
            setMenu({
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
              event,
            });
          }
        }}
        eventPropGetter={(e: any) => {
          const event = e as NormalizedEvent;
          if (event.isAuto) {
            const color = PRIORITIES[event.priority || "medium"].hex;
            return {
              style: {
                backgroundColor: color,
                borderColor: color,
                color: "#fff",
              },
              onContextMenu: (evt: React.MouseEvent) => {
                evt.preventDefault();
                setMenu({ x: evt.clientX, y: evt.clientY, event });
              },
            };
          }
          return {
            style: { backgroundColor: "#18181b", borderColor: "#18181b" },
          };
        }}
      />

      {menu && (
        <div
          className="fixed z-50 bg-white border border-zinc-200 rounded shadow-xl py-1 min-w-[120px]"
          style={{ top: menu.y, left: menu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onDelete}
            disabled={busy}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {busy ? "Deleting..." : "Delete Event"}
          </button>
          <button
            onClick={() => setMenu(null)}
            className="w-full px-4 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-50 border-t"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
