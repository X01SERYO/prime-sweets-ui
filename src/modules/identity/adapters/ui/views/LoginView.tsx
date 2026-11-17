import { Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { LoginUseCase } from '@/modules/identity/application/use-cases/login.useCase';
import type { Session } from '@/modules/identity/domain/models/session';
import { useLogin } from '@/modules/identity/adapters/ui/hooks/useLogin';
import { useLocale } from '@/shared/i18n/useLocale';
import { ScreenTitle } from '@/shared/ui/BackButton';
import { AppToast } from '@/shared/ui/AppToast';

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
    <section className="stack login-panel">
      <ScreenTitle>{t('loginTitle')}</ScreenTitle>
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
            {passwordVisible ? <EyeOff aria-hidden="true" strokeWidth={1.8} size={20} /> : <Eye aria-hidden="true" strokeWidth={1.8} size={20} />}
          </button>
        </div>
        <button className="btn" type="submit" disabled={form.loading}>
          {form.loading ? t('signingIn') : t('signIn')}
        </button>
      </form>
      {form.error ? (
        <AppToast tone="error" message={t(form.error)} onDone={form.dismissError} />
      ) : null}
    </section>
  );
}
