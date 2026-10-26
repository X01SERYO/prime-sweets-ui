import { useLoadSheet } from '@/modules/fulfillment-output/adapters/ui/hooks/useLoadSheet';
import { listLoadSheet } from '@/modules/fulfillment-output/fulfillmentOutput.composition';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';

export function LoadSheetList() {
  const { t } = useLocale();
  const lines = useLoadSheet(listLoadSheet);
  return (
    <section className="stack">
      <h1>{t('loadSheet')}</h1>
      <p className="m">{t('dummyNotice')}</p>
      <ul className="list">
        {lines.map(line => (
          <li key={line.id} className="card">
            <b>{line.name}</b>
            <span className="m">
              {line.brand} · {t('wholesaleCost')} {line.cost === null ? '—' : formatCurrency(line.cost)} · {t('wholesalePrice')}{' '}
              {formatCurrency(line.price)}
            </span>
            <span>
              {t('quantity')} {line.quantity} · {formatCurrency(line.total)} · {t('profit')}{' '}
              {line.profit === null ? '—' : formatCurrency(line.profit)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
