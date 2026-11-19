import { describe, it, expect } from 'vitest';
import { calculateTimeLeft, formatCountdown } from '../utils/formatters';

describe('Price Lock Countdown & Time Calculations', () => {
  it('returns positive remaining time for future expires_at', () => {
    const futureDate = new Date(Date.now() + 90 * 60 * 1000).toISOString();
    const result = calculateTimeLeft(futureDate);
    expect(result.expired).toBe(false);
    expect(result.totalMs).toBeGreaterThan(0);
    expect(result.hours).toBe(1);
    expect(result.minutes).toBeGreaterThanOrEqual(29);
  });

  it('returns expired=true for timestamps in the past', () => {
    const pastDate = new Date(Date.now() - 10000).toISOString();
    const result = calculateTimeLeft(pastDate);
    expect(result.expired).toBe(true);
    expect(result.totalMs).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
  });

  it('formats remaining hours, minutes, seconds into tabular hh:mm:ss string', () => {
    expect(formatCountdown(1, 1, 5, false)).toBe('01:01:05');
    expect(formatCountdown(0, 3, 0, false)).toBe('00:03:00');
    expect(formatCountdown(0, 0, 59, false)).toBe('00:00:59');
    expect(formatCountdown(0, 0, 0, true)).toBe('00:00:00');
  });

  it('correctly detects if countdown is under 30 minutes threshold', () => {
    const twentyMinMs = 20 * 60 * 1000;
    const fortyMinMs = 40 * 60 * 1000;
    const isUnder30 = (ms, expired) => !expired && ms < 30 * 60 * 1000;

    expect(isUnder30(twentyMinMs, false)).toBe(true);
    expect(isUnder30(fortyMinMs, false)).toBe(false);
    expect(isUnder30(0, true)).toBe(false);
  });
});
