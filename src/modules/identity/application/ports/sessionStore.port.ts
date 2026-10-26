import type { Session } from '@/modules/identity/domain/models/session';

export interface SessionStorePort {
  read(): Session | null;
  write(session: Session): void;
  clear(): void;
}
