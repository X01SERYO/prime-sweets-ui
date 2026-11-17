import { Ban, ChevronRight, Eye, Receipt } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { usePrintInvoices } from '@/modules/fulfillment-output/adapters/ui/hooks/usePrintInvoices';
import type { PrintInvoicesUseCase } from '@/modules/fulfillment-output/application/use-cases/printInvoices.useCase';
import { useDeliverySales } from '@/modules/sales/adapters/ui/hooks/useDeliverySales';
import { useVoidListedSale } from '@/modules/sales/adapters/ui/hooks/useVoidListedSale';
import type { ListSalesByDeliveryDateUseCase } from '@/modules/sales/application/use-cases/listSalesByDeliveryDate.useCase';
import type { VoidSaleUseCase } from '@/modules/sales/application/use-cases/voidSale.useCase';
import { canPreviewInvoice, canVoidSale } from '@/modules/sales/domain/saleStatus';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';
import { ScreenTitle } from '@/shared/ui/BackButton';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { StatusMessage } from '@/shared/ui/StatusMessage';
import './daySalesList.css';

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

const statusKey = {
  DRAFT: 'statusDraft',
  CONFIRMED: 'statusConfirmed',
  VOIDED: 'statusVoided'
} as const;

interface DaySalesListProps {
  deliveryDate?: string;
  listDeliverySales: ListSalesByDeliveryDateUseCase;
  voidSale: VoidSaleUseCase;
  printInvoices: PrintInvoicesUseCase;
}

export function DaySalesList({ deliveryDate, listDeliverySales, voidSale, printInvoices }: DaySalesListProps) {
  const { t, locale } = useLocale();
  const listed = useDeliverySales(deliveryDate, listDeliverySales);
  const voiding = useVoidListedSale(voidSale, listed.reload);
  const printing = usePrintInvoices(printInvoices);
  const [pendingVoidId, setPendingVoidId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const printable = listed.sales.filter(sale => canPreviewInvoice(sale.status));

  function toggle(saleId: string) {
    setSelected(current => (current.includes(saleId) ? current.filter(id => id !== saleId) : [...current, saleId]));
  }

  return (
    <section className="stack">
      <div>
        <ScreenTitle>{t('deliverySales')}</ScreenTitle>
        {deliveryDate ? <p className="load-sheet-date">{formatDeliveryHeading(deliveryDate, locale)}</p> : null}
      </div>
      {listed.loading ? <StatusMessage tone="info">{t('daySalesLoading')}</StatusMessage> : null}
      {listed.error ? <StatusMessage tone="error">{t(listed.error)}</StatusMessage> : null}
      {voiding.error && !pendingVoidId ? <StatusMessage tone="error">{t(voiding.error)}</StatusMessage> : null}
      {printing.error ? <StatusMessage tone="error">{t(printing.error)}</StatusMessage> : null}
      {!listed.loading && !listed.error && listed.sales.length === 0 ? (
        <StatusMessage tone="info">{t('deliverySalesEmpty')}</StatusMessage>
      ) : null}
      {printable.length > 0 ? (
        <div className="row day-sales-print">
          <button className="btn btn-secondary" type="button" disabled={printing.printing || selected.length === 0} onClick={() => void printing.print(selected)}>
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
      <ul className="day-sales-cards">
        {listed.sales.map(sale => {
          const open = openId === sale.id;
          return (
            <li key={sale.id} className="card day-sale-card">
              <button
                className={open ? 'day-sale-summary open' : 'day-sale-summary'}
                type="button"
                aria-expanded={open}
                aria-label={`${sale.customerName}, ${t(statusKey[sale.status])}, ${formatCurrency(sale.total)}. ${open ? t('hideSaleDetail') : t('showSaleDetail')}`}
                onClick={() => setOpenId(open ? null : sale.id)}
              >
                <span className="day-sale-name">{sale.customerName}</span>
                <span className={`tag tag-${sale.status.toLowerCase()}`}>{t(statusKey[sale.status])}</span>
                <span className="day-sale-total">{formatCurrency(sale.total)}</span>
                <ChevronRight aria-hidden="true" strokeWidth={1.8} />
              </button>
              {open ? (
                <div className="day-sale-detail">
                  <span>{sale.invoiceNumber ? `${t('invoice')} ${sale.invoiceNumber}` : ''}</span>
                  <span className="day-sale-actions">
                    <SaleAction
                      sale={sale}
                      voidingId={voiding.voidingId}
                      pendingVoidId={pendingVoidId}
                      onVoid={setPendingVoidId}
                    />
                  </span>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <table className="day-sales-table">
        <thead>
          <tr>
            <th className="day-sales-pick" />
            <th>{t('customerName')}</th>
            <th>{t('status')}</th>
            <th>{t('invoice')}</th>
            <th className="day-sales-total">{t('saleTotal')}</th>
            <th className="day-sales-action" />
            <th className="day-sales-action" />
            <th className="day-sales-action" />
          </tr>
        </thead>
        <tbody>
          {listed.sales.map(sale => (
            <tr key={sale.id}>
              {canPreviewInvoice(sale.status) ? (
                <td className="day-sales-pick">
                  <label className="day-sales-check">
                    <input
                      type="checkbox"
                      aria-label={sale.invoiceNumber ?? sale.customerName}
                      checked={selected.includes(sale.id)}
                      disabled={printing.printing}
                      onChange={() => toggle(sale.id)}
                    />
                  </label>
                </td>
              ) : (
                <td className="day-sales-pick" />
              )}
              <td>
                <b>{sale.customerName}</b>
              </td>
              <td>
                <span className={`tag tag-${sale.status.toLowerCase()}`}>{t(statusKey[sale.status])}</span>
              </td>
              <td className="m">{sale.invoiceNumber ? `${t('invoice')} ${sale.invoiceNumber}` : ''}</td>
              <td className="m day-sales-total">{formatCurrency(sale.total)}</td>
              <SaleAction
                sale={sale}
                voidingId={voiding.voidingId}
                pendingVoidId={pendingVoidId}
                onVoid={setPendingVoidId}
                asCells
              />
            </tr>
          ))}
        </tbody>
      </table>
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

function SaleAction({
  sale,
  voidingId,
  pendingVoidId,
  onVoid,
  asCells = false
}: {
  sale: { id: string; status: 'DRAFT' | 'CONFIRMED' | 'VOIDED'; invoiceNumber: string | null };
  voidingId: string | null;
  pendingVoidId: string | null;
  onVoid: (saleId: string) => void;
  asCells?: boolean;
}) {
  const { t } = useLocale();
  const preview =
    canPreviewInvoice(sale.status) || sale.status === 'VOIDED' ? (
      <Link className="btn icon-btn icon-preview" to={`/invoices/${sale.id}`} aria-label={t('invoicePreview')}>
        <Receipt aria-hidden="true" strokeWidth={1.8} />
      </Link>
    ) : null;
  const view = sale.status === 'CONFIRMED' ? (
    <Link className="btn icon-btn icon-view" to={`/sales?saleId=${encodeURIComponent(sale.id)}`} aria-label={t('viewSale')}>
      <Eye aria-hidden="true" strokeWidth={1.8} />
    </Link>
  ) : null;
  const voidAction = canVoidSale(sale.status) ? (
    <button
      className="btn icon-btn icon-void"
      type="button"
      aria-label={t('voidSale')}
      disabled={voidingId !== null || pendingVoidId === sale.id}
      onClick={() => onVoid(sale.id)}
    >
      <Ban aria-hidden="true" strokeWidth={1.8} />
    </button>
  ) : null;

  if (asCells) {
    return (
      <>
        <td className="day-sales-action">{preview}</td>
        <td className="day-sales-action">{view}</td>
        <td className="day-sales-action">{voidAction}</td>
      </>
    );
  }

  return (
    <>
      <span className="day-sale-action">{preview}</span>
      <span className="day-sale-action">{view}</span>
      <span className="day-sale-action">{voidAction}</span>
    </>
  );
}
