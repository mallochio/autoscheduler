import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateEvent } from '@/lib/tauri-commands';

// Mock CSS imports
vi.mock('react-big-calendar/lib/css/react-big-calendar.css', () => ({}));
vi.mock('react-big-calendar/lib/addons/dragAndDrop/styles.css', () => ({}));
vi.mock('@/components/calendar-custom.css', () => ({}));

// Mock updateEvent
vi.mock('@/lib/tauri-commands', () => ({
  updateEvent: vi.fn(),
}));

// Mock react-big-calendar — capture props for direct testing
let capturedProps: any = {};
vi.mock('react-big-calendar', () => {
  const MockCalendar = (props: any) => {
    capturedProps = props;
    return (
      <div data-testid="calendar">
        {props.events?.map((e: any) => (
          <div key={e.id} data-testid={`event-${e.id}`}>
            {e.title}
          </div>
        ))}
      </div>
    );
  };
  return {
    Calendar: MockCalendar,
    dateFnsLocalizer: () => ({}),
  };
});

vi.mock('react-big-calendar/lib/addons/dragAndDrop', () => ({
  default: (Component: any) => Component,
}));

import { CalendarView } from '@/components/calendar-view';

const makeEvent = (overrides: Record<string, any> = {}) => ({
  id: '1',
  title: 'Test Event',
  start: new Date('2026-03-11T09:00:00'),
  end: new Date('2026-03-11T10:00:00'),
  isAllDay: false,
  isAutoScheduled: false,
  ...overrides,
});

describe('CalendarView', () => {
  const mockSetEvents = vi.fn();
  const mockSetCurrentDate = vi.fn();
  const currentDate = new Date('2026-03-11');

  beforeEach(() => {
    vi.clearAllMocks();
    capturedProps = {};
  });

  it('renders the calendar container', () => {
    render(
      <CalendarView
        events={[]}
        setEvents={mockSetEvents}
        currentDate={currentDate}
        setCurrentDate={mockSetCurrentDate}
      />
    );
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
  });

  it('renders event titles', () => {
    const events = [
      makeEvent({ id: 'a', title: 'Morning Standup' }),
      makeEvent({ id: 'b', title: 'Lunch Break' }),
    ];
    render(
      <CalendarView
        events={events}
        setEvents={mockSetEvents}
        currentDate={currentDate}
        setCurrentDate={mockSetCurrentDate}
      />
    );
    expect(screen.getByText('Morning Standup')).toBeInTheDocument();
    expect(screen.getByText('Lunch Break')).toBeInTheDocument();
  });

  describe('eventPropGetter', () => {
    beforeEach(() => {
      render(
        <CalendarView
          events={[]}
          setEvents={mockSetEvents}
          currentDate={currentDate}
          setCurrentDate={mockSetCurrentDate}
        />
      );
    });

    it.each([
      ['critical', '#ef4444'],
      ['high', '#f97316'],
      ['medium', '#eab308'],
      ['low', '#3b82f6'],
      ['none', '#a1a1aa'],
    ])('returns %s priority color for auto-scheduled events', (priority, expectedColor) => {
      const result = capturedProps.eventPropGetter(
        makeEvent({ isAutoScheduled: true, priority })
      );
      expect(result.style.backgroundColor).toBe(expectedColor);
      expect(result.style.borderColor).toBe(expectedColor);
      expect(result.style.color).toBe('#fff');
    });

    it('falls back to "none" color for unknown priority on auto-scheduled events', () => {
      const result = capturedProps.eventPropGetter(
        makeEvent({ isAutoScheduled: true, priority: 'unknown' })
      );
      expect(result.style.backgroundColor).toBe('#a1a1aa');
    });

    it('returns dark style for non-auto-scheduled events', () => {
      const result = capturedProps.eventPropGetter(makeEvent({ isAutoScheduled: false }));
      expect(result.style.backgroundColor).toBe('#18181b');
      expect(result.style.borderColor).toBe('#18181b');
    });
  });

  describe('handleEventChange', () => {
    it('calls setEvents and updateEvent on event drop', async () => {
      const event = makeEvent({ id: 'evt-1' });
      render(
        <CalendarView
          events={[event]}
          setEvents={mockSetEvents}
          currentDate={currentDate}
          setCurrentDate={mockSetCurrentDate}
        />
      );

      const newStart = new Date('2026-03-12T14:00:00');
      const newEnd = new Date('2026-03-12T15:00:00');

      await act(async () => {
        await capturedProps.onEventDrop({ event, start: newStart, end: newEnd });
      });

      expect(mockSetEvents).toHaveBeenCalledTimes(1);
      expect(updateEvent).toHaveBeenCalledWith(
        'evt-1',
        newStart.toISOString(),
        newEnd.toISOString()
      );
    });

    it('calls setEvents and updateEvent on event resize', async () => {
      const event = makeEvent({ id: 'evt-2' });
      render(
        <CalendarView
          events={[event]}
          setEvents={mockSetEvents}
          currentDate={currentDate}
          setCurrentDate={mockSetCurrentDate}
        />
      );

      const newStart = new Date('2026-03-11T09:00:00');
      const newEnd = new Date('2026-03-11T11:30:00');

      await act(async () => {
        await capturedProps.onEventResize({ event, start: newStart, end: newEnd });
      });

      expect(mockSetEvents).toHaveBeenCalledTimes(1);
      expect(updateEvent).toHaveBeenCalledWith(
        'evt-2',
        newStart.toISOString(),
        newEnd.toISOString()
      );
    });

    it('updater function replaces the matching event', async () => {
      const event = makeEvent({ id: 'evt-3' });
      const otherEvent = makeEvent({ id: 'other' });
      mockSetEvents.mockImplementation((updater: any) => updater([event, otherEvent]));

      render(
        <CalendarView
          events={[event, otherEvent]}
          setEvents={mockSetEvents}
          currentDate={currentDate}
          setCurrentDate={mockSetCurrentDate}
        />
      );

      const newStart = new Date('2026-03-13T08:00:00');
      const newEnd = new Date('2026-03-13T09:00:00');

      await act(async () => {
        await capturedProps.onEventDrop({ event, start: newStart, end: newEnd });
      });

      const updater = mockSetEvents.mock.calls[0][0];
      const result = updater([event, otherEvent]);
      expect(result).toHaveLength(2);
      expect(result[0].start).toEqual(newStart);
      expect(result[0].end).toEqual(newEnd);
      expect(result[1]).toBe(otherEvent);
    });
  });

  it('passes currentDate and setCurrentDate to the calendar', () => {
    render(
      <CalendarView
        events={[]}
        setEvents={mockSetEvents}
        currentDate={currentDate}
        setCurrentDate={mockSetCurrentDate}
      />
    );
    expect(capturedProps.date).toBe(currentDate);
    expect(capturedProps.onNavigate).toBe(mockSetCurrentDate);
  });
});
