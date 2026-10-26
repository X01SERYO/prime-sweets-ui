import type { SessionStorePort } from '@/modules/identity/application/ports/sessionStore.port';
import type { Session } from '@/modules/identity/domain/models/session';

const storageKey = 'prime-sweets.session';

export class BrowserSessionStore implements SessionStorePort {
  read(): Session | null {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isSession(parsed)) {
        sessionStorage.removeItem(storageKey);
        return null;
      }
      if (Date.parse(parsed.expiresAt) <= Date.now()) {
        sessionStorage.removeItem(storageKey);
        return null;
      }
      return parsed;
    } catch {
      sessionStorage.removeItem(storageKey);
      return null;
    }
  }

  write(session: Session): void {
    sessionStorage.setItem(storageKey, JSON.stringify(session));
  }

  clear(): void {
    sessionStorage.removeItem(storageKey);
  }
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Partial<Session>;
  return (
    typeof record.token === 'string' &&
    typeof record.expiresAt === 'string' &&
    !!record.user &&
    typeof record.user.id === 'string' &&
    typeof record.user.email === 'string' &&
    typeof record.user.displayName === 'string'
  );
}
