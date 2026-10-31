import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useLoadSheet } from '@/modules/fulfillment-output/adapters/ui/hooks/useLoadSheet';
import type { ListLoadSheetUseCase } from '@/modules/fulfillment-output/application/use-cases/listLoadSheet.useCase';
import type { LoadSheetLineModel } from '@/modules/fulfillment-output/domain/models/loadSheetLine';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';
import { ScreenTitle } from '@/shared/ui/BackButton';
import '@/modules/fulfillment-output/adapters/ui/views/loadSheet.css';

interface LoadSheetListProps {
  listLoadSheet: ListLoadSheetUseCase;
}

function LoadSheetRow({
  line,
  open,
  onToggle
}: {
  line: LoadSheetLineModel;
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useLocale();
  const mixed = line.priceGroups.length > 1;

  return (
    <>
      <tr className={mixed ? 'load-sheet-mixed' : undefined}>
        <td className="load-sheet-edge">
          {mixed ? (
            <button
              type="button"
              className={open ? 'load-sheet-toggle open' : 'load-sheet-toggle'}
              aria-expanded={open}
              aria-label={open ? t('hidePriceDetail') : t('showPriceDetail')}
              onClick={onToggle}
            >
              <ChevronIcon />
            </button>
          ) : null}
        </td>
        <td>{line.brand ?? '—'}</td>
        <td>{moneyCell(line.wholesaleCost)}</td>
        <td>{moneyCell(line.wholesaleSalePrice)}</td>
        <td className="load-sheet-name">{line.name}</td>
        <td>{line.quantity}</td>
        <td>{formatCurrency(line.totalPrice)}</td>
        <td>{formatCurrency(line.profit)}</td>
        <td className="load-sheet-edge">
          {mixed ? (
            <span className="load-sheet-warn" tabIndex={0}>
              <WarningIcon />
              <span className="load-sheet-warn-text" role="tooltip">
                {t('mixedPurchasePrices')}
              </span>
            </span>
          ) : null}
        </td>
      </tr>
      {mixed && open
        ? line.priceGroups.map(group => (
            <tr key={`${line.productId}:${group.wholesaleCost}:${group.wholesaleSalePrice}`} className="load-sheet-group">
              <td className="load-sheet-edge" />
              <td />
              <td>{formatCurrency(group.wholesaleCost)}</td>
              <td>{formatCurrency(group.wholesaleSalePrice)}</td>
              <td className="load-sheet-name" />
              <td>{group.quantity}</td>
              <td>{formatCurrency(group.totalPrice)}</td>
              <td>{formatCurrency(group.profit)}</td>
              <td className="load-sheet-edge" />
            </tr>
          ))
        : null}
    </>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3.2 1.8 21h20.4L12 3.2zm0 6.3c.5 0 .9.4.9.9v4.2c0 .5-.4.9-.9.9s-.9-.4-.9-.9v-4.2c0-.5.4-.9.9-.9zm0 8.6a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function formatDeliveryHeading(value: string, locale: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return value;
  }
  const language = locale === 'en' ? 'en-US' : 'es-CO';
  const formatted = new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, day)));
  const cleaned = formatted.replace(',', '');
  return cleaned.charAt(0).toLocaleUpperCase(language) + cleaned.slice(1);
}

function moneyCell(value: number | null): string {
  return value === null ? '—' : formatCurrency(value);
}

export function LoadSheetList({ listLoadSheet }: LoadSheetListProps) {
  const { t, locale } = useLocale();
  const [params] = useSearchParams();
  const deliveryDate = params.get('deliveryDate') ?? undefined;
  const sheet = useLoadSheet(deliveryDate, listLoadSheet);
  const [openProductId, setOpenProductId] = useState<string | null>(null);

  const soldTotal = sheet.lines.reduce((sum, line) => sum + line.totalPrice, 0);
  const profitTotal = sheet.lines.reduce((sum, line) => sum + line.profit, 0);

  return (
    <section className="stack">
      <header className="load-sheet-head">
        <div>
          <ScreenTitle>{t('loadSheet')}</ScreenTitle>
          {deliveryDate ? <p className="load-sheet-date">{formatDeliveryHeading(deliveryDate, locale)}</p> : null}
        </div>
        {!sheet.loading && !sheet.error ? (
          <p className="load-sheet-totals">
            <span>
              {t('soldTotal')} {formatCurrency(soldTotal)}
            </span>
            <span>
              {t('profitTotal')} {formatCurrency(profitTotal)}
            </span>
          </p>
        ) : null}
      </header>
      {sheet.loading ? <p className="m">{t('loadSheetLoading')}</p> : null}
      {sheet.error ? <p role="alert">{t(sheet.error)}</p> : null}
      {!sheet.loading && !sheet.error && sheet.lines.length === 0 ? <p className="m">{t('loadSheetEmpty')}</p> : null}
      {sheet.lines.length > 0 ? (
      <div className="load-sheet-scroll">
      <table className="load-sheet-table">
        <thead>
          <tr>
            <th className="load-sheet-edge" />
            <th>{t('brand')}</th>
            <th>{t('wholesaleCost')}</th>
            <th>{t('wholesalePrice')}</th>
            <th className="load-sheet-name">{t('lineName')}</th>
            <th>{t('quantity')}</th>
            <th>{t('saleTotal')}</th>
            <th>{t('profit')}</th>
            <th className="load-sheet-edge" />
          </tr>
        </thead>
        <tbody>
          {sheet.lines.map(line => (
            <LoadSheetRow
              key={line.productId}
              line={line}
              open={openProductId === line.productId}
              onToggle={() => setOpenProductId(openProductId === line.productId ? null : line.productId)}
            />
          ))}
        </tbody>
      </table>
      </div>
      ) : null}
    </section>
  );
}
