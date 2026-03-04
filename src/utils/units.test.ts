import {
  convertWeight,
  convertLength,
  toMetricWeight,
  toMetricLength,
  formatWeight,
  formatLength,
  weightUnit,
  lengthUnit,
  formatVolume,
} from './units';

describe('Unit conversion utilities', () => {
  describe('convertWeight', () => {
    it('should return the same value for metric', () => {
      expect(convertWeight(100, 'metric')).toBe(100);
    });

    it('should convert kg to lbs for imperial', () => {
      expect(convertWeight(1, 'imperial')).toBeCloseTo(2.20462, 4);
    });

    it('should convert 100kg to approximately 220.5 lbs', () => {
      expect(convertWeight(100, 'imperial')).toBeCloseTo(220.462, 2);
    });

    it('should handle zero', () => {
      expect(convertWeight(0, 'imperial')).toBe(0);
    });
  });

  describe('convertLength', () => {
    it('should return the same value for metric', () => {
      expect(convertLength(180, 'metric')).toBe(180);
    });

    it('should convert cm to inches for imperial', () => {
      expect(convertLength(1, 'imperial')).toBeCloseTo(0.393701, 4);
    });

    it('should convert 2.54 cm to approximately 1 inch', () => {
      expect(convertLength(2.54, 'imperial')).toBeCloseTo(1, 2);
    });

    it('should handle zero', () => {
      expect(convertLength(0, 'imperial')).toBe(0);
    });
  });

  describe('toMetricWeight', () => {
    it('should return the same value for metric', () => {
      expect(toMetricWeight(100, 'metric')).toBe(100);
    });

    it('should convert lbs back to kg for imperial', () => {
      const lbs = 220.462;
      expect(toMetricWeight(lbs, 'imperial')).toBeCloseTo(100, 1);
    });

    it('should be the inverse of convertWeight', () => {
      const original = 75.5;
      const converted = convertWeight(original, 'imperial');
      const backToMetric = toMetricWeight(converted, 'imperial');
      expect(backToMetric).toBeCloseTo(original, 4);
    });
  });

  describe('toMetricLength', () => {
    it('should return the same value for metric', () => {
      expect(toMetricLength(180, 'metric')).toBe(180);
    });

    it('should convert inches back to cm for imperial', () => {
      expect(toMetricLength(1, 'imperial')).toBeCloseTo(2.54, 1);
    });

    it('should be the inverse of convertLength', () => {
      const original = 90;
      const converted = convertLength(original, 'imperial');
      const backToMetric = toMetricLength(converted, 'imperial');
      expect(backToMetric).toBeCloseTo(original, 4);
    });
  });

  describe('formatWeight', () => {
    it('should format in kg for metric', () => {
      expect(formatWeight(80, 'metric')).toBe('80 kg');
    });

    it('should format in lbs for imperial', () => {
      expect(formatWeight(100, 'imperial')).toBe('220.5 lbs');
    });

    it('should handle decimal weights in metric', () => {
      expect(formatWeight(80.5, 'metric')).toBe('80.5 kg');
    });

    it('should round imperial to 1 decimal place', () => {
      expect(formatWeight(1, 'imperial')).toBe('2.2 lbs');
    });
  });

  describe('formatLength', () => {
    it('should format in cm for metric', () => {
      expect(formatLength(100, 'metric')).toBe('100 cm');
    });

    it('should format in inches for imperial', () => {
      expect(formatLength(2.54, 'imperial')).toBe('1 in');
    });

    it('should round imperial to 1 decimal place', () => {
      expect(formatLength(10, 'imperial')).toBe('3.9 in');
    });
  });

  describe('weightUnit', () => {
    it('should return kg for metric', () => {
      expect(weightUnit('metric')).toBe('kg');
    });

    it('should return lbs for imperial', () => {
      expect(weightUnit('imperial')).toBe('lbs');
    });
  });

  describe('lengthUnit', () => {
    it('should return cm for metric', () => {
      expect(lengthUnit('metric')).toBe('cm');
    });

    it('should return in for imperial', () => {
      expect(lengthUnit('imperial')).toBe('in');
    });
  });

  describe('formatVolume', () => {
    it('should format small volumes in metric', () => {
      expect(formatVolume(500, 'metric')).toBe('500 kg');
    });

    it('should format large volumes with k suffix in metric', () => {
      expect(formatVolume(1500, 'metric')).toBe('1.5k kg');
    });

    it('should format small volumes in imperial', () => {
      expect(formatVolume(100, 'imperial')).toBe('220 lbs');
    });

    it('should format large volumes with k suffix in imperial', () => {
      expect(formatVolume(1000, 'imperial')).toBe('2.2k lbs');
    });

    it('should handle zero', () => {
      expect(formatVolume(0, 'metric')).toBe('0 kg');
    });
  });

  describe('data always stored in metric', () => {
    it('should roundtrip weight through conversion without data loss', () => {
      const storedKg = 82.5;
      const displayedLbs = convertWeight(storedKg, 'imperial');
      const backToKg = toMetricWeight(displayedLbs, 'imperial');
      expect(backToKg).toBeCloseTo(storedKg, 10);
    });

    it('should roundtrip length through conversion without data loss', () => {
      const storedCm = 100;
      const displayedIn = convertLength(storedCm, 'imperial');
      const backToCm = toMetricLength(displayedIn, 'imperial');
      expect(backToCm).toBeCloseTo(storedCm, 10);
    });
  });
});
