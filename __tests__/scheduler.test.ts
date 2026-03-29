import { describe, it, expect, vi, beforeEach } from "vitest";
import { runSchedulerForDay } from "@/lib/scheduler";
import * as tauri from "@/lib/tauri-commands";
import { PRIORITIES } from "@/lib/utils";
import { startOfDay, addMinutes, parse } from "date-fns";

vi.mock("@/lib/tauri-commands", () => ({
  getHabits: vi.fn(),
  getEvents: vi.fn(),
  addEvent: vi.fn(),
}));

const BASE_DATE = new Date("2024-01-15T00:00:00Z");

function makeHabit(overrides = {}): tauri.Habit {
  return {
    id: "h1",
    name: "Test Habit",
    duration: 30,
    priority: "medium",
    timeStart: "09:00",
    timeEnd: "17:00",
    ...overrides,
  };
}

function makeEvent(overrides = {}): tauri.NormalizedEvent {
  return {
    id: "e1",
    title: "Existing Event",
    start: addMinutes(BASE_DATE, 600), // 10:00
    end: addMinutes(BASE_DATE, 660), // 11:00
    isAllDay: false,
    isAuto: false,
    ...overrides,
  };
}

describe("Scheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("priority-based sorting", () => {
    it("schedules critical before high before medium before low", async () => {
      const habits = [
        makeHabit({ id: "low", priority: "low" }),
        makeHabit({ id: "crit", priority: "critical" }),
        makeHabit({ id: "med", priority: "medium" }),
        makeHabit({ id: "high", priority: "high" }),
      ];
      vi.mocked(tauri.getHabits).mockResolvedValue(habits);
      vi.mocked(tauri.getEvents).mockResolvedValue([]);

      await runSchedulerForDay(BASE_DATE);

      const calls = vi.mocked(tauri.addEvent).mock.calls;
      expect(calls[0][3]).toContain("critical");
      expect(calls[1][3]).toContain("high");
      expect(calls[2][3]).toContain("medium");
      expect(calls[3][3]).toContain("low");
    });
  });

  describe("skipping already-scheduled habits", () => {
    it("skips a habit that is already auto-scheduled for the day", async () => {
      const habit = makeHabit({ id: "h1" });
      const existing = makeEvent({
        isAuto: true,
        habitId: "h1",
        start: parse("09:00", "HH:mm", BASE_DATE),
        end: parse("09:30", "HH:mm", BASE_DATE),
      });

      vi.mocked(tauri.getHabits).mockResolvedValue([habit]);
      vi.mocked(tauri.getEvents).mockResolvedValue([existing]);

      const scheduled = await runSchedulerForDay(BASE_DATE);
      expect(scheduled).toHaveLength(0);
      expect(tauri.addEvent).not.toHaveBeenCalled();
    });

    it("schedules a habit if existing event has different habitId", async () => {
      const habit = makeHabit({ id: "h1" });
      const existing = makeEvent({ isAuto: true, habitId: "h2" });

      vi.mocked(tauri.getHabits).mockResolvedValue([habit]);
      vi.mocked(tauri.getEvents).mockResolvedValue([existing]);

      const scheduled = await runSchedulerForDay(BASE_DATE);
      expect(scheduled).toHaveLength(1);
    });
  });

  describe("conflict avoidance", () => {
    it("schedules habit after an existing blocking event", async () => {
      const habit = makeHabit({ timeStart: "09:00", duration: 60 });
      const blocking = makeEvent({
        start: parse("09:00", "HH:mm", BASE_DATE),
        end: parse("10:00", "HH:mm", BASE_DATE),
      });

      vi.mocked(tauri.getHabits).mockResolvedValue([habit]);
      vi.mocked(tauri.getEvents).mockResolvedValue([blocking]);

      const scheduled = await runSchedulerForDay(BASE_DATE);
      expect(scheduled[0].start).toEqual(parse("10:00", "HH:mm", BASE_DATE));
    });

    it("does not schedule if entire window is blocked", async () => {
      const habit = makeHabit({
        timeStart: "09:00",
        timeEnd: "10:00",
        duration: 60,
      });
      const blocking = makeEvent({
        start: parse("08:00", "HH:mm", BASE_DATE),
        end: parse("11:00", "HH:mm", BASE_DATE),
      });

      vi.mocked(tauri.getHabits).mockResolvedValue([habit]);
      vi.mocked(tauri.getEvents).mockResolvedValue([blocking]);

      const scheduled = await runSchedulerForDay(BASE_DATE);
      expect(scheduled).toHaveLength(0);
    });
  });

  describe("all-day events", () => {
    it("does not treat all-day events as blocking", async () => {
      const habit = makeHabit({ timeStart: "09:00", duration: 30 });
      const allDay = makeEvent({ isAllDay: true });

      vi.mocked(tauri.getHabits).mockResolvedValue([habit]);
      vi.mocked(tauri.getEvents).mockResolvedValue([allDay]);

      const scheduled = await runSchedulerForDay(BASE_DATE);
      expect(scheduled).toHaveLength(1);
      expect(scheduled[0].start).toEqual(parse("09:00", "HH:mm", BASE_DATE));
    });
  });

  describe("insertEvent description format", () => {
    it("calls addEvent with [AUTO:habitId:priority] description", async () => {
      const habit = makeHabit({ id: "h123", priority: "high" });
      vi.mocked(tauri.getHabits).mockResolvedValue([habit]);
      vi.mocked(tauri.getEvents).mockResolvedValue([]);

      await runSchedulerForDay(BASE_DATE);

      expect(tauri.addEvent).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        "[AUTO:h123:high]",
      );
    });
  });
});
