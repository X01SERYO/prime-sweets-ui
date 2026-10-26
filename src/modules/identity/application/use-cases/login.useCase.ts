import type { AuthApiPort, LoginCommand } from '@/modules/identity/application/ports/authApi.port';
import type { SessionStorePort } from '@/modules/identity/application/ports/sessionStore.port';
import type { Session } from '@/modules/identity/domain/models/session';

export class LoginUseCase {
  private readonly authApi: AuthApiPort;
  private readonly sessionStore: SessionStorePort;

  constructor(authApi: AuthApiPort, sessionStore: SessionStorePort) {
    this.authApi = authApi;
    this.sessionStore = sessionStore;
  }

  async execute(command: LoginCommand): Promise<Session> {
    const session = await this.authApi.login({
      email: command.email.trim(),
      password: command.password
    });
    this.sessionStore.write(session);
    return session;
  }
}
