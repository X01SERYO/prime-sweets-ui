import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';

export function RetailTotals({ sold, profit }: { sold: number; profit: number }) {
  const { t } = useLocale();
  return (
    <p className="retail-totals-bar">
      <span className="retail-total">
        <small>{t('retailTotalProfit')}</small>
        <strong>{formatCurrency(profit)}</strong>
      </span>
      <span className="retail-total">
        <small>{t('retailTotalSold')}</small>
        <strong>{formatCurrency(sold)}</strong>
      </span>
    </p>
  );
}
