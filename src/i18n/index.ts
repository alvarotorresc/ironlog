import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { createElement, type ReactNode } from 'react';
import { en, type TranslationKey } from './en';
import { es } from './es';

type Locale = 'en' | 'es';

const translations: Record<Locale, Record<string, string>> = { en, es };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getDeviceLocale(): Locale {
  try {
    // expo-localization may not be available in all environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocales } = require('expo-localization');
    const locales = getLocales();
    const lang = locales?.[0]?.languageCode ?? 'en';
    return lang === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getDeviceLocale);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const dict = translations[locale] ?? translations.en;
      let text = dict[key] ?? translations.en[key] ?? key;

      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }

      return text;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return createElement(I18nContext.Provider, { value }, children);
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return ctx;
}

export type { TranslationKey, Locale };
