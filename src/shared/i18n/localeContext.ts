import { createContext } from 'react';
import type { Locale, MessageKey } from '@/shared/i18n/messages';

export interface LocaleContextValue {
  locale: Locale;
  t: (key: MessageKey) => string;
  toggleLocale: () => void;
}

export const LocaleContext = createContext<LocaleContextValue | null>(null);
