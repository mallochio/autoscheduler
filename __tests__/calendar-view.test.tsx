import { render, screen } from "@testing-library/react";
import { CalendarView } from "@/components/calendar-view";
import { PRIORITIES } from "@/lib/utils";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock CSS and library imports
vi.mock("react-big-calendar/lib/css/react-big-calendar.css", () => ({}));
vi.mock("react-big-calendar/lib/addons/dragAndDrop/styles.css", () => ({}));
vi.mock("./calendar-custom.css", () => ({}));

let captured: any = {};
vi.mock("react-big-calendar", () => ({
  Calendar: (props: any) => {
    captured = props;
    return (
      <div data-testid="calendar">
        {props.events.map((e: any) => (
          <div key={e.id}>{e.title}</div>
        ))}
      </div>
    );
  },
  dateFnsLocalizer: vi.fn(() => ({})),
}));

vi.mock("react-big-calendar/lib/addons/dragAndDrop", () => ({
  default: (c: any) => c,
}));

describe("CalendarView", () => {
  const props = {
    events: [
      {
        id: "1",
        title: "Manual",
        start: new Date(),
        end: new Date(),
        isAuto: false,
      },
      {
        id: "2",
        title: "Auto",
        start: new Date(),
        end: new Date(),
        isAuto: true,
        priority: "critical" as const,
      },
    ],
    setEvents: vi.fn(),
    currentDate: new Date(),
    setCurrentDate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    captured = {};
  });

  it("renders events correctly", () => {
    render(<CalendarView {...props} />);
    expect(screen.getByText("Manual")).toBeInTheDocument();
    expect(screen.getByText("Auto")).toBeInTheDocument();
  });

  it("assigns dark background to manual events", () => {
    render(<CalendarView {...props} />);
    const res = captured.eventPropGetter(props.events[0]);
    expect(res.style.backgroundColor).toBe("#18181b");
  });

  it("assigns priority color to auto events", () => {
    render(<CalendarView {...props} />);
    const res = captured.eventPropGetter(props.events[1]);
    expect(res.style.backgroundColor).toBe(PRIORITIES.critical.hex);
  });

  it("uses medium priority as default for auto events", () => {
    render(<CalendarView {...props} />);
    const autoNoPri = { ...props.events[1], priority: undefined };
    const res = captured.eventPropGetter(autoNoPri);
    expect(res.style.backgroundColor).toBe(PRIORITIES.medium.hex);
  });
});
