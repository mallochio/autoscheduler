import { render, screen } from '@testing-library/react';
import { StatsPanel } from '@/components/stats-panel';
import { NormalizedEvent } from '@/lib/tauri-commands';
import { describe, it, expect } from 'vitest';

describe('StatsPanel', () => {
  it('calculates total hours and groups by priority', () => {
    const events: NormalizedEvent[] = [
      {
        id: '1', title: 'Task 1', start: new Date('2026-03-11T10:00:00Z'), end: new Date('2026-03-11T11:00:00Z'),
        isAllDay: false, isAutoScheduled: true, priority: 'high'
      },
      {
        id: '2', title: 'Task 2', start: new Date('2026-03-11T12:00:00Z'), end: new Date('2026-03-11T12:30:00Z'),
        isAllDay: false, isAutoScheduled: true, priority: 'critical'
      },
      {
        id: '3', title: 'Manual Task', start: new Date('2026-03-11T13:00:00Z'), end: new Date('2026-03-11T14:00:00Z'),
        isAllDay: false, isAutoScheduled: false
      }
    ];

    render(<StatsPanel events={events} />);
    
    // Total auto-scheduled hours: 1.5h
    expect(screen.getByText('1.5h')).toBeInTheDocument();
    
    // High priority: 1.0h
    expect(screen.getByText('1.0h')).toBeInTheDocument();
    
    // Critical priority: 0.5h
    expect(screen.getByText('0.5h')).toBeInTheDocument();
  });
});
