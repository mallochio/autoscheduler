import { describe, it, expect } from "vitest";
import { calculateStats } from "@/lib/stats";
import { NormalizedEvent } from "@/lib/tauri-commands";

describe("calculateStats", () => {
  const baseDate = new Date("2024-01-15T10:00:00Z");
  const hourLater = new Date("2024-01-15T11:00:00Z");
  const twoHoursLater = new Date("2024-01-15T12:00:00Z");

  it("calculates total hours for auto-scheduled events only", () => {
    const events: NormalizedEvent[] = [
      {
        id: "1",
        title: "Auto 1",
        start: baseDate,
        end: hourLater,
        isAllDay: false,
        isAuto: true,
        priority: "high",
      },
      {
        id: "2",
        title: "Manual",
        start: hourLater,
        end: twoHoursLater,
        isAllDay: false,
        isAuto: false,
      },
    ];

    const stats = calculateStats(events);
    expect(stats.totalHours).toBe(1);
  });

  it("groups hours by priority", () => {
    const events: NormalizedEvent[] = [
      {
        id: "1",
        title: "Task 1",
        start: baseDate,
        end: hourLater,
        isAllDay: false,
        isAuto: true,
        priority: "critical",
      },
      {
        id: "2",
        title: "Task 2",
        start: hourLater,
        end: twoHoursLater,
        isAllDay: false,
        isAuto: true,
        priority: "high",
      },
    ];

    const stats = calculateStats(events);
    expect(stats.byPriority.critical).toBe(1);
    expect(stats.byPriority.high).toBe(1);
  });

  it("groups hours by habit title", () => {
    const events: NormalizedEvent[] = [
      {
        id: "1",
        title: "Deep Work",
        start: baseDate,
        end: twoHoursLater,
        isAllDay: false,
        isAuto: true,
        priority: "high",
      },
    ];

    const stats = calculateStats(events);
    expect(stats.byHabit["Deep Work"]).toBe(2);
  });

  it("returns zeros for empty event list", () => {
    const stats = calculateStats([]);
    expect(stats.totalHours).toBe(0);
    expect(Object.keys(stats.byPriority)).toHaveLength(0);
    expect(Object.keys(stats.byHabit)).toHaveLength(0);
  });

  it("handles missing priority by defaulting to none", () => {
    const events: NormalizedEvent[] = [
      {
        id: "1",
        title: "No Priority",
        start: baseDate,
        end: hourLater,
        isAllDay: false,
        isAuto: true,
      },
    ];

    const stats = calculateStats(events);
    expect(stats.byPriority.none).toBe(1);
  });
});
