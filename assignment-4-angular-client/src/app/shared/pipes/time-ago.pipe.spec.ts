import { TimeAgoPipe } from './time-ago.pipe';

describe('TimeAgoPipe', () => {
  const pipe = new TimeAgoPipe();
  const now = new Date('2026-10-25T12:00:00Z');

  it('formats recent and past dates', () => {
    expect(pipe.transform('2026-10-25T11:59:50Z', now)).toBe('just now');
    expect(pipe.transform('2026-10-25T09:00:00Z', now)).toBe('3 hours ago');
    expect(pipe.transform('2026-10-24T12:00:00Z', now)).toBe('yesterday');
  });

  it('handles empty or invalid input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform('not a date')).toBe('');
  });
});
