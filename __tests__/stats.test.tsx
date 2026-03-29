import { render, screen } from "@testing-library/react";
import { StatsPanel } from "@/components/stats-panel";
import { NormalizedEvent } from "@/lib/tauri-commands";
import { describe, it, expect } from "vitest";

const mockEvents: NormalizedEvent[] = [
  {
    id: "1",
    title: "Deep Work",
    start: new Date(2024, 0, 15, 9),
    end: new Date(2024, 0, 15, 11),
    isAllDay: false,
    isAuto: true,
    priority: "high",
  },
  {
    id: "2",
    title: "Lunch",
    start: new Date(2024, 0, 15, 12),
    end: new Date(2024, 0, 15, 13),
    isAllDay: false,
    isAuto: true,
    priority: "critical",
  },
  {
    id: "3",
    title: "Meeting",
    start: new Date(2024, 0, 15, 14),
    end: new Date(2024, 0, 15, 15),
    isAllDay: false,
    isAuto: false,
  },
];

describe("StatsPanel", () => {
  it("renders total hours correctly", () => {
    render(<StatsPanel events={mockEvents} />);
    // 2h Deep Work + 1h Lunch = 3h total auto-scheduled
    expect(screen.getByText("3.0")).toBeInTheDocument();
  });

  it("renders priority breakdown", () => {
    render(<StatsPanel events={mockEvents} />);
    // Use case-insensitive matching because of CSS transformations or raw data
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
    expect(screen.getByText("1.0")).toBeInTheDocument(); // Lunch value
    expect(screen.getByText(/high/i)).toBeInTheDocument();
    expect(screen.getByText("2.0")).toBeInTheDocument(); // Deep Work value
  });

  it("shows zero state when no auto events exist", () => {
    const manualOnly = [mockEvents[2]];
    render(<StatsPanel events={manualOnly} />);
    expect(screen.getByText("0.0")).toBeInTheDocument();
  });

  it("calculates fractional hours correctly", () => {
    const fractionalEvents: NormalizedEvent[] = [
      {
        id: "4",
        title: "Quick Habit",
        start: new Date(2024, 0, 15, 10, 0),
        end: new Date(2024, 0, 15, 10, 45),
        isAllDay: false,
        isAuto: true,
        priority: "low",
      },
    ];
    render(<StatsPanel events={fractionalEvents} />);
    // 45/60 = 0.75 -> toFixed(1) is "0.8"
    const values = screen.getAllByText("0.8");
    expect(values.length).toBeGreaterThan(0);
  });
});
