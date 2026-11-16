import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';

export function RetailTotals({ sold, profit, products, units }: { sold: number; profit: number; products: number; units: number }) {
  const { t } = useLocale();
  return (
    <p className="retail-totals-bar">
      <span className="retail-totals-info">{products ? t('retailSaleSummary').replace('{products}', String(products)).replace('{units}', String(units)) : t('retailNoneYet')}</span>
      <span className="retail-total is-profit">
        <small>{t('retailProfitToday')}</small>
        <strong>{formatCurrency(profit)}</strong>
      </span>
      <span className="retail-total">
        <small>{t('retailSoldToday')}</small>
        <strong>{formatCurrency(sold)}</strong>
      </span>
    </p>
  );
}
