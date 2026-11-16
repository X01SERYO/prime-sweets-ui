import type { ReactNode } from 'react';
import { NavLink, useMatch } from 'react-router';
import { useLocale } from '@/shared/i18n/useLocale';
import { StatusMessage } from '@/shared/ui/StatusMessage';

export function RetailSection({ children }: { children?: ReactNode }) {
  const { t } = useLocale();
  const history = useMatch('/retail-sales/history');
  return (
    <section className="stack">
      <div className="retail-head">
        <h1>{history ? t('retailHistory') : t('retailTodayTitle')}</h1>
        <div className="retail-tabs" role="tablist">
        <NavLink to="/retail-sales" end>
          {t('retailToday')}
        </NavLink>
        <NavLink to="/retail-sales/history">{t('retailHistory')}</NavLink>
        </div>
      </div>
      {children ?? <StatusMessage tone="info">{t('retailPending')}</StatusMessage>}
    </section>
  );
}
