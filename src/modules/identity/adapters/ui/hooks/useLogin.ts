import { useState } from 'react';
import type { LoginUseCase } from '@/modules/identity/application/use-cases/login.useCase';
import { InvalidCredentialsError } from '@/modules/identity/domain/errors/invalidCredentials.error';
import type { Session } from '@/modules/identity/domain/models/session';

export function useLogin(login: LoginUseCase, onLoggedIn: (session: Session) => void) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!email.trim() || !password) {
      setError('loginRequired');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      onLoggedIn(await login.execute({ email, password }));
    } catch (caught) {
      setError(caught instanceof InvalidCredentialsError ? 'invalidCredentials' : 'loginFailed');
    } finally {
      setLoading(false);
    }
  }

  return { email, setEmail, password, setPassword, loading, error, submit };
}
