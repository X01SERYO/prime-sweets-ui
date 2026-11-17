import type { SessionStorePort } from '@/modules/identity/application/ports/sessionStore.port';
import type { Session } from '@/modules/identity/domain/models/session';

const storageKey = 'prime-sweets.session';

export class BrowserSessionStore implements SessionStorePort {
  private readonly listeners = new Set<() => void>();

  read(): Session | null {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isSession(parsed) || Date.parse(parsed.expiresAt) <= Date.now()) {
        this.clear();
        return null;
      }
      return parsed;
    } catch {
      this.clear();
      return null;
    }
  }

  write(session: Session): void {
    sessionStorage.setItem(storageKey, JSON.stringify(session));
    this.emit();
  }

  clear(): void {
    sessionStorage.removeItem(storageKey);
    this.emit();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
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
