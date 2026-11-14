import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { useLocale } from '@/shared/i18n/useLocale';
import { StatusMessage } from '@/shared/ui/StatusMessage';

export function RetailSection({ children }: { children?: ReactNode }) {
  const { t } = useLocale();
  return (
    <section className="stack">
      <h1>{t('retailSection')}</h1>
      <div className="retail-tabs" role="tablist">
        <NavLink to="/retail-sales" end>
          {t('retailToday')}
        </NavLink>
        <NavLink to="/retail-sales/history">{t('retailHistory')}</NavLink>
      </div>
      {children ?? <StatusMessage tone="info">{t('retailPending')}</StatusMessage>}
    </section>
  );
}
