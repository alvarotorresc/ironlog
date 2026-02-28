import { en, type TranslationKey } from './en';
import { es } from './es';

describe('i18n translations', () => {
  it('should have the same keys in EN and ES', () => {
    const enKeys = Object.keys(en).sort();
    const esKeys = Object.keys(es).sort();
    expect(esKeys).toEqual(enKeys);
  });

  it('should not have empty values in EN', () => {
    for (const [, value] of Object.entries(en)) {
      expect(value).toBeTruthy();
    }
  });

  it('should not have empty values in ES', () => {
    for (const [, value] of Object.entries(es)) {
      expect(value).toBeTruthy();
    }
  });

  it('should have consistent interpolation params between EN and ES', () => {
    const paramRegex = /\{(\w+)\}/g;

    for (const key of Object.keys(en) as TranslationKey[]) {
      const enParams = [...en[key].matchAll(paramRegex)].map((m) => m[1]).sort();
      const esParams = [...es[key].matchAll(paramRegex)].map((m) => m[1]).sort();
      expect(esParams).toEqual(enParams);
    }
  });

  it('should support basic interpolation', () => {
    // Simulate t() behavior
    function t(key: TranslationKey, params?: Record<string, string | number>): string {
      let text: string = en[key];
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return text;
    }

    expect(t('home.exerciseCount', { count: 1 })).toBe('1 exercise');
    expect(t('home.exerciseCountPlural', { count: 5 })).toBe('5 exercises');
    expect(t('home.moreExercises', { count: 3 })).toBe('+3 more');
  });

  it('should fall back to EN when key is not in ES', () => {
    // Since we enforce identical keys, this tests the mechanism
    const dict = { ...es };
    // Simulate a missing key
    delete (dict as Record<string, string>)['common.save'];
    const fallback = (dict as Record<string, string>)['common.save'] ?? en['common.save'];
    expect(fallback).toBe('Save');
  });

  it('should have more than 150 translation keys', () => {
    const keyCount = Object.keys(en).length;
    expect(keyCount).toBeGreaterThan(150);
  });
});
