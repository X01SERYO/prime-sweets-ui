import type { Session } from '@/modules/identity/domain/models/session';

export interface LoginCommand {
  email: string;
  password: string;
}

export interface AuthApiPort {
  login(command: LoginCommand): Promise<Session>;
  logout(token: string): Promise<void>;
}
