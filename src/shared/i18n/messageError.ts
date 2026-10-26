import type { MessageKey } from '@/shared/i18n/messages';

export class MessageError extends Error {
  readonly messageKey: MessageKey;

  constructor(messageKey: MessageKey) {
    super(messageKey);
    this.name = 'MessageError';
    this.messageKey = messageKey;
  }
}
