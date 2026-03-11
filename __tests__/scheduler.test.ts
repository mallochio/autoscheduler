import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runSchedulerForDay } from '@/lib/scheduler';
import * as tauriCommands from '@/lib/tauri-commands';

vi.mock('@/lib/tauri-commands', () => ({
  getHabits: vi.fn(),
  getEvents: vi.fn(),
  insertEvent: vi.fn(),
}));

describe('Scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('schedules habits based on priority', async () => {
    vi.mocked(tauriCommands.getHabits).mockResolvedValue([
      { id: '1', name: 'Low Priority', duration: 60, priority: 'low', timeStart: '09:00', timeEnd: '17:00' },
      { id: '2', name: 'High Priority', duration: 60, priority: 'high', timeStart: '09:00', timeEnd: '17:00' },
    ]);
    vi.mocked(tauriCommands.getEvents).mockResolvedValue([]);
    
    const date = new Date('2026-03-11T12:00:00Z');
    const scheduled = await runSchedulerForDay(date);
    
    expect(scheduled).toHaveLength(2);
    expect(scheduled[0].title).toBe('High Priority');
    expect(scheduled[1].title).toBe('Low Priority');
  });

  it('skips habits that are already scheduled', async () => {
    vi.mocked(tauriCommands.getHabits).mockResolvedValue([
      { id: '1', name: 'Lunch', duration: 60, priority: 'critical', timeStart: '12:00', timeEnd: '14:00' },
    ]);
    vi.mocked(tauriCommands.getEvents).mockResolvedValue([
      {
        id: 'existing',
        title: 'Lunch',
        start: new Date('2026-03-11T12:00:00Z'),
        end: new Date('2026-03-11T13:00:00Z'),
        isAllDay: false,
        isAutoScheduled: true,
        habitId: '1',
      }
    ]);
    
    const date = new Date('2026-03-11T12:00:00Z');
    const scheduled = await runSchedulerForDay(date);
    
    expect(scheduled).toHaveLength(0);
  });
});
