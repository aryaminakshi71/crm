import { describe, it, expect } from 'vitest';
import { cn, generateId, formatDate, formatRelativeTime } from '@/lib/utils';

describe('cn (classnames)', () => {
  it('merges classnames correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const condition = true;
    expect(cn('foo', condition && 'bar')).toBe('foo bar');
    expect(cn('foo', condition && 'bar', !condition && 'baz')).toBe('foo bar');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2 py-2', 'px-4')).toBe('py-2 px-4');
  });
});

describe('generateId', () => {
  it('generates a valid UUID', () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('formatDate', () => {
  it('formats date objects', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('Jan 15, 2024');
  });

  it('formats date strings', () => {
    expect(formatDate('2024-01-15')).toBe('Jan 15, 2024');
  });
});

describe('formatRelativeTime', () => {
  it('returns "Just now" for recent dates', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('Just now');
  });

  it('returns minutes ago for dates within an hour', () => {
    const date = new Date(Date.now() - 30 * 60 * 1000);
    expect(formatRelativeTime(date)).toBe('30m ago');
  });

  it('returns hours ago for dates within a day', () => {
    const date = new Date(Date.now() - 5 * 60 * 60 * 1000);
    expect(formatRelativeTime(date)).toBe('5h ago');
  });

  it('returns days ago for dates within a week', () => {
    const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(date)).toBe('3d ago');
  });

  it('returns formatted date for older dates', () => {
    const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(date)).toMatch(/[A-Z][a-z]{2} \d{1,2}, \d{4}/);
  });
});
