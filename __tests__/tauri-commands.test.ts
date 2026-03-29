import { describe, it, expect } from "vitest";
import { normalizeEvent, GWSEvent } from "@/lib/tauri-commands";

describe("tauri-commands", () => {
  describe("normalizeEvent", () => {
    it("normalizes a basic GWS event", () => {
      const gwsEvent: GWSEvent = {
        id: "123",
        summary: "Meeting",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
      };

      const event = normalizeEvent(gwsEvent);

      expect(event.id).toBe("123");
      expect(event.title).toBe("Meeting");
      expect(event.isAuto).toBe(false);
      expect(event.isAllDay).toBe(false);
      expect(event.start).toBeInstanceOf(Date);
    });

    it("handles all-day events", () => {
      const gwsEvent: GWSEvent = {
        id: "all-day-1",
        summary: "Holiday",
        start: { date: "2024-01-15" },
        end: { date: "2024-01-16" },
      };

      const event = normalizeEvent(gwsEvent);

      expect(event.isAllDay).toBe(true);
      expect(event.start.toISOString()).toContain("2024-01-15");
    });

    it("detects auto-scheduled events with new format", () => {
      const gwsEvent: GWSEvent = {
        id: "auto-1",
        summary: "Deep Work",
        description: "[AUTO:habit-7:high]",
        start: { dateTime: "2024-01-15T13:00:00Z" },
        end: { dateTime: "2024-01-15T15:00:00Z" },
      };

      const event = normalizeEvent(gwsEvent);

      expect(event.isAuto).toBe(true);
      expect(event.habitId).toBe("habit-7");
      expect(event.priority).toBe("high");
    });

    it("detects legacy auto-scheduled events", () => {
      const gwsEvent: GWSEvent = {
        id: "legacy-1",
        summary: "Lunch",
        description: "[LOCAL_AUTO_SCHEDULED:habit-1:critical]",
        start: { dateTime: "2024-01-15T12:00:00Z" },
        end: { dateTime: "2024-01-15T12:45:00Z" },
      };

      const event = normalizeEvent(gwsEvent);

      expect(event.isAuto).toBe(true);
      expect(event.habitId).toBe("habit-1");
      expect(event.priority).toBe("critical");
    });

    it("defaults priority to medium if missing in tag", () => {
      const gwsEvent: GWSEvent = {
        id: "no-pri",
        summary: "Task",
        description: "[AUTO:habit-x]",
        start: { dateTime: "2024-01-15T10:00:00Z" },
        end: { dateTime: "2024-01-15T11:00:00Z" },
      };

      const event = normalizeEvent(gwsEvent);
      expect(event.priority).toBe("medium");
    });

    it("handles missing summary with default title", () => {
      const gwsEvent: any = {
        id: "no-summary",
        start: { date: "2024-01-15" },
        end: { date: "2024-01-16" },
      };

      const event = normalizeEvent(gwsEvent);
      expect(event.title).toBe("Untitled");
    });
  });
});
