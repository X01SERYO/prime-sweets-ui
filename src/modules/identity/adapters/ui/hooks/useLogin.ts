import { useState } from 'react';
import type { LoginUseCase } from '@/modules/identity/application/use-cases/login.useCase';
import { InvalidCredentialsError } from '@/modules/identity/domain/errors/invalidCredentials.error';
import { MessageError } from '@/shared/i18n/messageError';
import type { MessageKey } from '@/shared/i18n/messages';
import type { Session } from '@/modules/identity/domain/models/session';

export function useLogin(login: LoginUseCase, onLoggedIn: (session: Session) => void) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

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
      if (caught instanceof InvalidCredentialsError) {
        setError('invalidCredentials');
      } else if (caught instanceof MessageError) {
        setError(caught.messageKey);
      } else {
        setError('loginFailed');
      }
    } finally {
      setLoading(false);
    }
  }

  return { email, setEmail, password, setPassword, loading, error, submit };
}
