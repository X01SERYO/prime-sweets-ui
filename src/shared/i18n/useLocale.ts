import { useContext } from 'react';
import { LocaleContext } from '@/shared/i18n/localeContext';

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error('useLocale must be used inside LocaleProvider');
  }
  return value;
}
