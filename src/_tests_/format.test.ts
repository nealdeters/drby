import { formatRaceTime, formatCountdown } from '../utils/format';

describe('format', () => {
  describe('formatRaceTime', () => {
    it('formats seconds correctly', () => {
      expect(formatRaceTime(12345)).toBe('12.345s');
    });
    it('formats minutes correctly', () => {
      expect(formatRaceTime(65432)).toBe('1:05.432');
    });
  });

  describe('formatCountdown', () => {
    it('formats countdown correctly', () => {
      expect(formatCountdown(65000)).toBe('1:05');
    });
  });
});