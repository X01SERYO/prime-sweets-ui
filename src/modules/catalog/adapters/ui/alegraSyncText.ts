import type { MessageKey } from '@/shared/i18n/messages';

export function alegraSyncText(raw: string, t: (key: MessageKey) => string): string {
  const item = raw.match(/item ([^\s]+)/)?.[1];
  if (item && /did not confirm the update/i.test(raw)) {
    return t('alegraSyncFailedItem').replace('{item}', item);
  }
  return t('alegraSyncFailed');
}
