import type { FormEvent } from 'react';
import type { LoginUseCase } from '@/modules/identity/application/use-cases/login.useCase';
import type { Session } from '@/modules/identity/domain/models/session';
import { useLogin } from '@/modules/identity/adapters/ui/hooks/useLogin';
import { useLocale } from '@/shared/i18n/useLocale';

interface LoginViewProps {
  login: LoginUseCase;
  onLoggedIn: (session: Session) => void;
}

export function LoginView({ login, onLoggedIn }: LoginViewProps) {
  const { t } = useLocale();
  const form = useLogin(login, onLoggedIn);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void form.submit();
  }

  return (
    <section className="stack">
      <h1>{t('loginTitle')}</h1>
      <form className="card" onSubmit={onSubmit}>
        <label htmlFor="login-email">{t('email')}</label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          value={form.email}
          onChange={event => form.setEmail(event.target.value)}
        />
        <label htmlFor="login-password">{t('password')}</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={event => form.setPassword(event.target.value)}
        />
        <button className="btn" type="submit" disabled={form.loading}>
          {form.loading ? t('signingIn') : t('signIn')}
        </button>
      </form>
      {form.error ? (
        <p role="alert">
          {t(form.error)}
        </p>
      ) : null}
    </section>
  );
}
