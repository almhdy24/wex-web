import { describe, it, expect } from 'vitest';
import { formatHoursAr, renderLockDuration } from '../utils/arabicDuration';

// Lock duration must follow the lock_hours setting with correct Arabic forms
// (was hard-coded "4 ساعات" and "{n} ساعات" for any n).
describe('formatHoursAr', () => {
  it('uses the right Arabic form per count', () => {
    expect(formatHoursAr(1)).toBe('ساعة واحدة');
    expect(formatHoursAr(2)).toBe('ساعتين');
    expect(formatHoursAr(3)).toBe('3 ساعات');
    expect(formatHoursAr(10)).toBe('10 ساعات');
    expect(formatHoursAr(11)).toBe('11 ساعة');
    expect(formatHoursAr('24')).toBe('24 ساعة');
  });
  it('renders the content token', () => {
    expect(renderLockDuration('لمدة {{lock_duration}} فقط', 2)).toBe('لمدة ساعتين فقط');
    expect(renderLockDuration('بلا رمز', 2)).toBe('بلا رمز');
  });
});
