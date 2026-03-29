import { describe, it, expect } from "vitest";
import {
  addEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  getHabits,
  addHabit,
  updateHabit,
  deleteHabit,
} from "@/lib/tauri-commands";

describe("tauri-commands async (non-Tauri mock path)", () => {
  it("addEvent resolves", async () => {
    await expect(
      addEvent("Test", "2024-01-15T10:00:00Z", "2024-01-15T11:00:00Z"),
    ).resolves.toBeUndefined();
  });

  it("updateEvent resolves", async () => {
    await expect(
      updateEvent("1", "2024-01-15T10:00:00Z", "2024-01-15T11:00:00Z"),
    ).resolves.toBeUndefined();
  });

  it("deleteEvent resolves", async () => {
    await expect(deleteEvent("1")).resolves.toBeUndefined();
  });

  it("getEvents returns mock data", async () => {
    const events = await getEvents(
      "2024-01-15T00:00:00Z",
      "2024-01-15T23:59:59Z",
    );
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toHaveProperty("id");
    expect(events[0]).toHaveProperty("title");
  });

  it("getHabits returns mock data", async () => {
    const habits = await getHabits();
    expect(habits.length).toBeGreaterThan(0);
    expect(habits[0]).toHaveProperty("name");
  });

  it("addHabit returns mock id", async () => {
    const id = await addHabit({
      name: "Exercise",
      duration: 30,
      priority: "high",
      timeStart: "08:00",
      timeEnd: "09:00",
    });
    expect(id).toMatch(/^mock-/);
  });

  it("updateHabit resolves", async () => {
    await expect(
      updateHabit({
        id: "1",
        name: "Lunch",
        duration: 60,
        priority: "critical",
        timeStart: "12:00",
        timeEnd: "13:00",
      }),
    ).resolves.toBeUndefined();
  });

  it("deleteHabit resolves", async () => {
    await expect(deleteHabit("1")).resolves.toBeUndefined();
  });
});
