import { useState } from 'react';
import { Link } from 'react-router';
import { usePrintInvoices } from '@/modules/fulfillment-output/adapters/ui/hooks/usePrintInvoices';
import type { PrintInvoicesUseCase } from '@/modules/fulfillment-output/application/use-cases/printInvoices.useCase';
import { useDaySales } from '@/modules/sales/adapters/ui/hooks/useDaySales';
import { useVoidListedSale } from '@/modules/sales/adapters/ui/hooks/useVoidListedSale';
import type { ListDaySalesUseCase } from '@/modules/sales/application/use-cases/listDaySales.useCase';
import type { VoidSaleUseCase } from '@/modules/sales/application/use-cases/voidSale.useCase';
import type { GetCurrentSalesDayUseCase } from '@/modules/sales-day/application/use-cases/getCurrentSalesDay.useCase';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';
import { ScreenTitle } from '@/shared/ui/BackButton';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import './daySalesList.css';

const statusKey = {
  DRAFT: 'statusDraft',
  CONFIRMED: 'statusConfirmed',
  VOIDED: 'statusVoided'
} as const;

interface DaySalesListProps {
  sellerId: string;
  salesDayId?: string;
  getCurrentSalesDay: GetCurrentSalesDayUseCase;
  listDaySales: ListDaySalesUseCase;
  voidSale: VoidSaleUseCase;
  printInvoices: PrintInvoicesUseCase;
}

export function DaySalesList({ sellerId, salesDayId, getCurrentSalesDay, listDaySales, voidSale, printInvoices }: DaySalesListProps) {
  const { t } = useLocale();
  const listed = useDaySales(sellerId, salesDayId, getCurrentSalesDay, listDaySales);
  const voiding = useVoidListedSale(voidSale, listed.reload);
  const printing = usePrintInvoices(printInvoices);
  const [pendingVoidId, setPendingVoidId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const readOnly = !listed.dayOpen && Boolean(listed.dayId);
  const printable = listed.sales.filter(sale => sale.status === 'CONFIRMED');

  function toggle(saleId: string) {
    setSelected(current => (current.includes(saleId) ? current.filter(id => id !== saleId) : [...current, saleId]));
  }

  return (
    <section className="stack">
      <ScreenTitle>{t('daySales')}</ScreenTitle>
      {listed.loading ? <p>{t('daySalesLoading')}</p> : null}
      {listed.error ? <p className="alert">{t(listed.error)}</p> : null}
      {voiding.error && !pendingVoidId ? <p role="alert">{t(voiding.error)}</p> : null}
      {readOnly && printing.error ? <p className="alert">{t(printing.error)}</p> : null}
      {!listed.loading && !listed.error && listed.sales.length === 0 ? <p>{t('daySalesEmpty')}</p> : null}
      <table className="day-sales-table">
        <tbody>
          {listed.sales.map(sale => (
            <tr key={sale.id}>
              {readOnly ? (
                <td className="day-sales-pick">
                  <label className="day-sales-check">
                    <input
                      type="checkbox"
                      aria-label={sale.invoiceNumber ?? sale.customerName}
                      checked={selected.includes(sale.id)}
                      disabled={sale.status !== 'CONFIRMED' || printing.printing}
                      onChange={() => toggle(sale.id)}
                    />
                  </label>
                </td>
              ) : null}
              <td>
                <b>{sale.customerName}</b>
              </td>
              <td>
                <span className={`tag tag-${sale.status.toLowerCase()}`}>{t(statusKey[sale.status])}</span>
              </td>
              <td className="m">{sale.invoiceNumber ? `${t('invoice')} ${sale.invoiceNumber}` : ''}</td>
              <td className="m day-sales-total">{formatCurrency(sale.total)}</td>
              <td className="day-sales-icons">
                {readOnly && sale.status === 'CONFIRMED' && listed.dayId ? (
                  <Link
                    className="btn icon-btn icon-edit"
                    to={`/invoices/${listed.dayId}/${sale.id}`}
                    aria-label={t('invoicePreview')}
                  >
                    <EyeIcon />
                  </Link>
                ) : null}
                {listed.dayOpen && (sale.status === 'DRAFT' || sale.status === 'CONFIRMED') ? (
                  <Link className="btn icon-btn icon-edit" to={`/sales?saleId=${encodeURIComponent(sale.id)}`} aria-label={t('editSale')}>
                    <EditIcon />
                  </Link>
                ) : null}
                {listed.dayOpen && sale.status === 'CONFIRMED' ? (
                  <button
                    className="btn icon-btn icon-void"
                    type="button"
                    aria-label={t('voidSale')}
                    disabled={voiding.voidingId !== null || pendingVoidId === sale.id}
                    onClick={() => setPendingVoidId(sale.id)}
                  >
                    <VoidIcon />
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {readOnly ? (
        <div className="row">
          <button className="btn" type="button" disabled={printing.printing || selected.length === 0} onClick={() => void printing.print(selected)}>
            {printing.printing ? t('invoicePrinting') : t('printSelected')}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            disabled={printing.printing || printable.length === 0}
            onClick={() => void printing.print(printable.map(sale => sale.id))}
          >
            {t('printAll')}
          </button>
        </div>
      ) : null}
      {pendingVoidId ? (
        <ConfirmDialog
          title={t('voidSale')}
          message={t('confirmVoid')}
          confirmLabel={voiding.voidingId === pendingVoidId ? t('voidingSale') : t('confirmAction')}
          cancelLabel={t('cancelAction')}
          busy={voiding.voidingId === pendingVoidId}
          error={voiding.error ? t(voiding.error) : null}
          confirmClassName="btn icon-void"
          onConfirm={() => {
            void voiding.voidConfirmed(pendingVoidId).then(saved => {
              if (saved) {
                setPendingVoidId(null);
              }
            });
          }}
          onCancel={() => setPendingVoidId(null)}
        />
      ) : null}
    </section>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
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

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1 1 0 0 0 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.96 1.96 3.75 3.75 2.12-1.8z"
      />
    </svg>
  );
}

function VoidIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2c1.85 0 3.55.63 4.9 1.69L5.69 16.9A8 8 0 0 1 12 4zm0 16a8 8 0 0 1-4.9-1.69L18.31 7.1A8 8 0 0 1 12 20z"
      />
    </svg>
  );
}
