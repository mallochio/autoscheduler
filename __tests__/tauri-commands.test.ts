import { describe, it, expect } from 'vitest';
import { normalizeEvent } from '@/lib/tauri-commands';

describe('tauri-commands', () => {
  it('normalizes events correctly', () => {
    const event = normalizeEvent({
      id: '1',
      summary: 'Test Event',
      description: '[LOCAL_AUTO_SCHEDULED:habit-123:critical]',
      start: { dateTime: '2026-03-11T10:00:00Z' },
      end: { dateTime: '2026-03-11T11:00:00Z' }
    });
    
    expect(event.id).toBe('1');
    expect(event.title).toBe('Test Event');
    expect(event.isAutoScheduled).toBe(true);
    expect(event.habitId).toBe('habit-123');
    expect(event.priority).toBe('critical');
  });
});
