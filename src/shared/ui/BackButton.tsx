import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router';
import { useLocale } from '@/shared/i18n/useLocale';

const CallerContext = createContext<string | null>(null);

function hrefOf(pathname: string, search: string): string {
  return `${pathname}${search}`;
}

function canReturnTo(href: string): boolean {
  const path = href.split('?')[0];
  return path !== '/' && path !== '/login';
}

export function NavigationHistory({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const callers = useRef(new Map<string, string>());
  const previous = useRef<{ key: string; href: string } | null>(null);
  const shownCaller = useRef<string | null>(null);
  const [caller, setCaller] = useState<string | null>(null);
  const here = hrefOf(location.pathname, location.search);

  useLayoutEffect(() => {
    if (previous.current?.key !== location.key) {
      const origin = previous.current ? callers.current.get(previous.current.key) : undefined;
      if (navigationType === 'PUSH' && previous.current && canReturnTo(previous.current.href)) {
        callers.current.set(location.key, previous.current.href);
      } else if (navigationType === 'REPLACE' && origin && canReturnTo(origin) && origin !== here) {
        callers.current.set(location.key, origin);
      }
      previous.current = { key: location.key, href: here };
    }
    const next = callers.current.get(location.key) ?? null;
    if (shownCaller.current !== next) {
      shownCaller.current = next;
      setCaller(next);
    }
  }, [here, location.key, navigationType]);

  return <CallerContext.Provider value={caller}>{children}</CallerContext.Provider>;
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  return (
    <div className="screen-title">
      <BackLink />
      <h1>{children}</h1>
    </div>
  );
}

function BackLink() {
  const { t } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const caller = useContext(CallerContext);

  if (location.pathname === '/sales-day' || location.pathname === '/login' || location.pathname === '/') {
    return null;
  }

  return (
    <button
      className="back-link"
      type="button"
      aria-label={t('back')}
      onClick={() => {
        if (caller) {
          navigate(-1);
          return;
        }
        navigate('/sales-day');
      }}
    >
      <BackIcon />
      <span>{t('back')}</span>
    </button>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z" />
    </svg>
  );
}
