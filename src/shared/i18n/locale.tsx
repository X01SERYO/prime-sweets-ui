import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { LocaleContext, type LocaleContextValue } from '@/shared/i18n/localeContext';
import { messages, type Locale } from '@/shared/i18n/messages';

const storageKey = 'prime-sweets.locale';

function readLocale(): Locale {
  const stored = localStorage.getItem(storageKey);
  return stored === 'en' ? 'en' : 'es';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(readLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: key => messages[locale][key],
      toggleLocale: () => {
        const next = locale === 'es' ? 'en' : 'es';
        localStorage.setItem(storageKey, next);
        setLocale(next);
      }
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

