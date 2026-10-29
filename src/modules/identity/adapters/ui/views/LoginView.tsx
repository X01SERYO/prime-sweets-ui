import { useState, type FormEvent } from 'react';
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
  const [passwordVisible, setPasswordVisible] = useState(false);

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
        <div className="password-field">
          <input
            id="login-password"
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            value={form.password}
            onChange={event => form.setPassword(event.target.value)}
          />
          <button
            className="password-toggle"
            type="button"
            aria-pressed={passwordVisible}
            aria-label={passwordVisible ? t('hidePassword') : t('showPassword')}
            onClick={() => setPasswordVisible(visible => !visible)}
          >
            {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
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

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
      />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18M10.6 10.7A2.5 2.5 0 0 0 12 14.5c.5 0 1-.1 1.4-.4M6.1 6.3C4.2 7.6 2.8 9.5 2 12c1.4 3.2 4.8 6 10 6 1.6 0 3-.3 4.3-.9M9.9 5.2A10 10 0 0 1 12 5c6.5 0 10 6 10 6a17 17 0 0 1-2.2 2.8"
      />
    </svg>
  );
}
