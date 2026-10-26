import type { AuthApiPort } from '@/modules/identity/application/ports/authApi.port';
import type { SessionStorePort } from '@/modules/identity/application/ports/sessionStore.port';

export class LogoutUseCase {
  private readonly authApi: AuthApiPort;
  private readonly sessionStore: SessionStorePort;

  constructor(authApi: AuthApiPort, sessionStore: SessionStorePort) {
    this.authApi = authApi;
    this.sessionStore = sessionStore;
  }

  async execute(): Promise<void> {
    const current = this.sessionStore.read();
    this.sessionStore.clear();
    if (current) {
      await this.authApi.logout(current.token);
    }
  }
}
