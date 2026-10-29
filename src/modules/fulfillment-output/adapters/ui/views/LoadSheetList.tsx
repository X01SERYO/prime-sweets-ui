import { useParams } from 'react-router';
import { useLoadSheet } from '@/modules/fulfillment-output/adapters/ui/hooks/useLoadSheet';
import type { ListLoadSheetUseCase } from '@/modules/fulfillment-output/application/use-cases/listLoadSheet.useCase';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';
import '@/modules/fulfillment-output/adapters/ui/views/loadSheet.css';

interface LoadSheetListProps {
  listLoadSheet: ListLoadSheetUseCase;
}

function moneyCell(value: number | null): string {
  return value === null ? '—' : formatCurrency(value);
}

export function LoadSheetList({ listLoadSheet }: LoadSheetListProps) {
  const { t } = useLocale();
  const { salesDayId } = useParams();
  const sheet = useLoadSheet(salesDayId, listLoadSheet);

  return (
    <section className="stack">
      <h1>{t('loadSheet')}</h1>
      {sheet.loading ? <p className="m">{t('loadSheetLoading')}</p> : null}
      {sheet.error ? <p role="alert">{t(sheet.error)}</p> : null}
      {!sheet.loading && !sheet.error && sheet.lines.length === 0 ? <p className="m">{t('loadSheetEmpty')}</p> : null}
      <ul className="list load-sheet-cards">
        {sheet.lines.map(line => (
          <li key={line.productId} className="card">
            <b>{line.name}</b>
            <span className="m">
              {line.brand ?? '—'} · {t('wholesaleCost')} {moneyCell(line.wholesaleCost)} · {t('wholesalePrice')}{' '}
              {moneyCell(line.wholesaleSalePrice)}
            </span>
            <span>
              {t('quantity')} {line.quantity} · {formatCurrency(line.totalPrice)} · {t('profit')} {formatCurrency(line.profit)}
            </span>
          </li>
        ))}
      </ul>
      {sheet.lines.length > 0 ? (
      <table className="load-sheet-table">
        <thead>
          <tr>
            <th>{t('brand')}</th>
            <th>{t('wholesaleCost')}</th>
            <th>{t('wholesalePrice')}</th>
            <th>{t('lineName')}</th>
            <th>{t('quantity')}</th>
            <th>{t('saleTotal')}</th>
            <th>{t('profit')}</th>
          </tr>
        </thead>
        <tbody>
          {sheet.lines.map(line => (
            <tr key={line.productId}>
              <td>{line.brand ?? '—'}</td>
              <td>{moneyCell(line.wholesaleCost)}</td>
              <td>{moneyCell(line.wholesaleSalePrice)}</td>
              <td>{line.name}</td>
              <td>{line.quantity}</td>
              <td>{formatCurrency(line.totalPrice)}</td>
              <td>{formatCurrency(line.profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      ) : null}
    </section>
  );
}
