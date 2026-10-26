import type { AuthApiPort, LoginCommand } from '@/modules/identity/application/ports/authApi.port';
import { InvalidCredentialsError } from '@/modules/identity/domain/errors/invalidCredentials.error';
import type { Session } from '@/modules/identity/domain/models/session';
import { MessageError } from '@/shared/i18n/messageError';
import { HttpRequestError, type HttpClient } from '@/shared/infrastructure/http/httpClient';

interface Envelope {
  success?: unknown;
  data?: unknown;
}

export class HttpAuth implements AuthApiPort {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async login(command: LoginCommand): Promise<Session> {
    try {
      const body = await this.http.post<Envelope>('/auth/login', command);
      const session = readSession(body);
      if (!session) {
        throw new MessageError('loginFailed');
      }
      return session;
    } catch (error) {
      if (error instanceof HttpRequestError && (error.status === 401 || error.code === 'INVALID_CREDENTIALS')) {
        throw new InvalidCredentialsError();
      }
      throw error;
    }
  }

  async logout(token: string): Promise<void> {
    await this.http.post<Envelope>('/auth/logout', {}, { token });
  }
}

function readSession(body: Envelope): Session | null {
  if (!body || body.success !== true || !body.data || typeof body.data !== 'object') {
    return null;
  }
  const data = body.data as Partial<Session>;
  if (
    typeof data.token !== 'string' ||
    typeof data.expiresAt !== 'string' ||
    !data.user ||
    typeof data.user.id !== 'string' ||
    typeof data.user.email !== 'string' ||
    typeof data.user.displayName !== 'string'
  ) {
    return null;
  }
  return {
    token: data.token,
    expiresAt: data.expiresAt,
    user: {
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.displayName
    }
  };
}
