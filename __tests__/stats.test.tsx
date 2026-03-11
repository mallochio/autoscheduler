import { render, screen } from '@testing-library/react';
import { StatsPanel } from '@/components/stats-panel';
import { NormalizedEvent } from '@/lib/tauri-commands';
import { describe, it, expect } from 'vitest';

function makeEvent(overrides: Partial<NormalizedEvent> & { id: string; start: Date; end: Date }): NormalizedEvent {
  return {
    title: 'Task',
    isAllDay: false,
    isAutoScheduled: true,
    ...overrides,
  };
}

describe('StatsPanel', () => {
  it('renders "Auto-Scheduled" label and total hours', () => {
    const events: NormalizedEvent[] = [
      makeEvent({
        id: '1', start: new Date('2026-03-11T10:00:00Z'), end: new Date('2026-03-11T11:00:00Z'), priority: 'high',
      }),
      makeEvent({
        id: '2', start: new Date('2026-03-11T12:00:00Z'), end: new Date('2026-03-11T12:30:00Z'), priority: 'critical',
      }),
    ];

    render(<StatsPanel events={events} />);

    expect(screen.getByText('Auto-Scheduled')).toBeInTheDocument();
    // Total is 1.5h, which differs from individual priorities (1.0h, 0.5h)
    expect(screen.getByText('1.5h')).toBeInTheDocument();
  });

  it('renders priority breakdown for present priorities', () => {
    const events: NormalizedEvent[] = [
      makeEvent({
        id: '1', start: new Date('2026-03-11T10:00:00Z'), end: new Date('2026-03-11T11:00:00Z'), priority: 'high',
      }),
      makeEvent({
        id: '2', start: new Date('2026-03-11T12:00:00Z'), end: new Date('2026-03-11T12:30:00Z'), priority: 'critical',
      }),
    ];

    render(<StatsPanel events={events} />);

    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('1.0h')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('0.5h')).toBeInTheDocument();
  });

  it('does not render priority sections for priorities with zero hours', () => {
    const events: NormalizedEvent[] = [
      makeEvent({
        id: '1', start: new Date('2026-03-11T10:00:00Z'), end: new Date('2026-03-11T11:00:00Z'), priority: 'high',
      }),
    ];

    render(<StatsPanel events={events} />);

    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.queryByText('critical')).not.toBeInTheDocument();
    expect(screen.queryByText('medium')).not.toBeInTheDocument();
    expect(screen.queryByText('low')).not.toBeInTheDocument();
  });

  it('shows 0.0h for empty events', () => {
    render(<StatsPanel events={[]} />);

    expect(screen.getByText('0.0h')).toBeInTheDocument();
    expect(screen.queryByText('critical')).not.toBeInTheDocument();
    expect(screen.queryByText('high')).not.toBeInTheDocument();
    expect(screen.queryByText('medium')).not.toBeInTheDocument();
    expect(screen.queryByText('low')).not.toBeInTheDocument();
  });

  it('calculates correct totals across multiple events and priorities', () => {
    const events: NormalizedEvent[] = [
      makeEvent({
        id: '1', start: new Date('2026-03-11T10:00:00Z'), end: new Date('2026-03-11T11:00:00Z'), priority: 'high',
      }),
      makeEvent({
        id: '2', start: new Date('2026-03-11T12:00:00Z'), end: new Date('2026-03-11T12:30:00Z'), priority: 'critical',
      }),
      makeEvent({
        id: '3', start: new Date('2026-03-11T13:00:00Z'), end: new Date('2026-03-11T14:00:00Z'), priority: 'high',
      }),
      // Non-auto-scheduled event should be excluded
      makeEvent({
        id: '4', start: new Date('2026-03-11T15:00:00Z'), end: new Date('2026-03-11T16:00:00Z'), isAutoScheduled: false,
      }),
    ];

    render(<StatsPanel events={events} />);

    // Total auto-scheduled: 1 + 0.5 + 1 = 2.5h
    expect(screen.getByText('2.5h')).toBeInTheDocument();
    // High: 1 + 1 = 2.0h
    expect(screen.getByText('2.0h')).toBeInTheDocument();
    // Critical: 0.5h
    expect(screen.getByText('0.5h')).toBeInTheDocument();
  });
});
