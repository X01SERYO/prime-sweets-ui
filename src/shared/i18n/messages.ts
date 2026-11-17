import { catalogMessages } from '@/shared/i18n/catalogMessages';
import { customerMessages } from '@/shared/i18n/customers';
import { identityMessages } from '@/shared/i18n/identity';
import { listMessages } from '@/shared/i18n/lists';
import { salesMessages } from '@/shared/i18n/sales';
import { salesDayMessages } from '@/shared/i18n/salesDay';
import { retailMessages } from '@/shared/i18n/retail';
import { purchasingMessages } from '@/shared/i18n/purchasing';
import { shellMessages } from '@/shared/i18n/shell';

export type Locale = 'es' | 'en';

export const messages = {
  es: {
    ...shellMessages.es,
    ...identityMessages.es,
    ...salesDayMessages.es,
    ...catalogMessages.es,
    ...customerMessages.es,
    ...salesMessages.es,
    ...listMessages.es,
    ...retailMessages.es,
    ...purchasingMessages.es
  },
  en: {
    ...shellMessages.en,
    ...identityMessages.en,
    ...salesDayMessages.en,
    ...catalogMessages.en,
    ...customerMessages.en,
    ...salesMessages.en,
    ...listMessages.en,
    ...retailMessages.en,
    ...purchasingMessages.en
  }
} as const;

export type MessageKey = keyof (typeof messages)['es'];
