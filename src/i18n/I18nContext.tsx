import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { loadLocale, saveLocale, type Locale } from '../utils/storage';
import { TRANSLATIONS, type Translations } from './translations';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'zh-TW',
  setLocale: () => {},
  toggleLocale: () => {},
  t: TRANSLATIONS['zh-TW'],
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [locale, setLocaleState] = useState<Locale>(() => loadLocale());

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    saveLocale(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next: Locale = prev === 'zh-TW' ? 'en' : 'zh-TW';
      saveLocale(next);
      return next;
    });
  }, []);

  const t = TRANSLATIONS[locale];

  useEffect(() => {
    document.documentElement.lang = locale === 'zh-TW' ? 'zh-Hant-TW' : 'en';
    document.title = t.appTitle;
  }, [locale, t.appTitle]);

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
