import { describe, it, expect } from 'vitest';
import { normalizeEvent } from '@/lib/tauri-commands';

describe('normalizeEvent', () => {
  it('parses new format [LOCAL_AUTO_SCHEDULED:id:priority]', () => {
    const event = normalizeEvent({
      id: '1',
      summary: 'Test Event',
      description: '[LOCAL_AUTO_SCHEDULED:habit-123:critical]',
      start: { dateTime: '2026-03-11T10:00:00Z' },
      end: { dateTime: '2026-03-11T11:00:00Z' },
    });

    expect(event.id).toBe('1');
    expect(event.title).toBe('Test Event');
    expect(event.start).toEqual(new Date('2026-03-11T10:00:00Z'));
    expect(event.end).toEqual(new Date('2026-03-11T11:00:00Z'));
    expect(event.isAllDay).toBe(false);
    expect(event.isAutoScheduled).toBe(true);
    expect(event.habitId).toBe('habit-123');
    expect(event.priority).toBe('critical');
  });

  it('parses old format [LOCAL_AUTO_SCHEDULED:id] with default priority medium', () => {
    const event = normalizeEvent({
      id: '2',
      summary: 'Old Format',
      description: '[LOCAL_AUTO_SCHEDULED:habit-456]',
      start: { dateTime: '2026-03-11T09:00:00Z' },
      end: { dateTime: '2026-03-11T09:30:00Z' },
    });

    expect(event.isAutoScheduled).toBe(true);
    expect(event.habitId).toBe('habit-456');
    expect(event.priority).toBe('medium');
  });

  it('handles non-auto-scheduled event', () => {
    const event = normalizeEvent({
      id: '3',
      summary: 'Regular Meeting',
      description: 'Just a normal meeting',
      start: { dateTime: '2026-03-11T14:00:00Z' },
      end: { dateTime: '2026-03-11T15:00:00Z' },
    });

    expect(event.isAutoScheduled).toBe(false);
    expect(event.habitId).toBeUndefined();
    expect(event.priority).toBeUndefined();
  });

  it('handles event with no description', () => {
    const event = normalizeEvent({
      id: '4',
      summary: 'No Desc',
      start: { dateTime: '2026-03-11T12:00:00Z' },
      end: { dateTime: '2026-03-11T13:00:00Z' },
    });

    expect(event.isAutoScheduled).toBe(false);
    expect(event.habitId).toBeUndefined();
    expect(event.priority).toBeUndefined();
  });

  it('handles event with empty description string', () => {
    const event = normalizeEvent({
      id: '5',
      summary: 'Empty Desc',
      description: '',
      start: { dateTime: '2026-03-11T12:00:00Z' },
      end: { dateTime: '2026-03-11T13:00:00Z' },
    });

    expect(event.isAutoScheduled).toBe(false);
    expect(event.habitId).toBeUndefined();
    expect(event.priority).toBeUndefined();
  });

  it('defaults title to "Untitled Event" when summary is missing', () => {
    const event = normalizeEvent({
      id: '6',
      summary: '',
      start: { dateTime: '2026-03-11T10:00:00Z' },
      end: { dateTime: '2026-03-11T11:00:00Z' },
    });

    expect(event.title).toBe('Untitled Event');
  });

  it('marks all-day event when start.date is used', () => {
    const event = normalizeEvent({
      id: '7',
      summary: 'All Day',
      start: { date: '2026-03-11' },
      end: { date: '2026-03-12' },
    });

    expect(event.isAllDay).toBe(true);
    expect(event.start).toEqual(new Date('2026-03-11'));
    expect(event.end).toEqual(new Date('2026-03-12'));
  });

  it('sets isAllDay false for dateTime events', () => {
    const event = normalizeEvent({
      id: '8',
      summary: 'Timed',
      start: { dateTime: '2026-03-11T08:00:00Z' },
      end: { dateTime: '2026-03-11T08:30:00Z' },
    });

    expect(event.isAllDay).toBe(false);
  });

  it.each(['critical', 'high', 'medium', 'low'])('handles priority value "%s"', (priority) => {
    const event = normalizeEvent({
      id: '9',
      summary: 'Priority Test',
      description: `[LOCAL_AUTO_SCHEDULED:habit-x:${priority}]`,
      start: { dateTime: '2026-03-11T10:00:00Z' },
      end: { dateTime: '2026-03-11T11:00:00Z' },
    });

    expect(event.priority).toBe(priority);
    expect(event.habitId).toBe('habit-x');
    expect(event.isAutoScheduled).toBe(true);
  });
});
