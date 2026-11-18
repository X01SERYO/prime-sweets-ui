import { Ban, ChevronLeft, ChevronRight, Eye, Printer, Receipt, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { usePrintInvoices } from '@/modules/fulfillment-output/adapters/ui/hooks/usePrintInvoices';
import { InvoicePreview } from '@/modules/fulfillment-output/adapters/ui/views/InvoicePreview';
import type { GenerateInvoiceUseCase } from '@/modules/fulfillment-output/application/use-cases/generateInvoice.useCase';
import type { PrintInvoicesUseCase } from '@/modules/fulfillment-output/application/use-cases/printInvoices.useCase';
import { useDeliverySales } from '@/modules/sales/adapters/ui/hooks/useDeliverySales';
import { useVoidListedSale } from '@/modules/sales/adapters/ui/hooks/useVoidListedSale';
import type { ListSalesByDeliveryDateUseCase } from '@/modules/sales/application/use-cases/listSalesByDeliveryDate.useCase';
import type { VoidSaleUseCase } from '@/modules/sales/application/use-cases/voidSale.useCase';
import { addBusinessDays, businessToday } from '@/modules/sales/domain/deliveryDays';
import type { DaySaleModel, DaySaleStatus } from '@/modules/sales/domain/models/daySale';
import { canPreviewInvoice, canVoidSale } from '@/modules/sales/domain/saleStatus';
import { formatCurrency } from '@/shared/domain/money';
import type { MessageKey } from '@/shared/i18n/messages';
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

function countLabel(count: number, one: MessageKey, many: MessageKey, t: (key: MessageKey) => string): string {
  return count === 1 ? t(one) : t(many).replace('{count}', String(count));
}

function invoiceLabel(sale: DaySaleModel, t: (key: MessageKey) => string): string {
  return sale.invoiceNumber ? `${t('invoice')} ${sale.invoiceNumber}` : t('noInvoice');
}

const statusKey = {
  DRAFT: 'statusDraft',
  CONFIRMED: 'statusConfirmed',
  VOIDED: 'statusVoided'
} as const;

type StatusFilter = 'all' | DaySaleStatus;

interface DaySalesListProps {
  deliveryDate?: string;
  listDeliverySales: ListSalesByDeliveryDateUseCase;
  voidSale: VoidSaleUseCase;
  printInvoices: PrintInvoicesUseCase;
  generateInvoice: GenerateInvoiceUseCase;
}

export function DaySalesList({ deliveryDate, listDeliverySales, voidSale, printInvoices, generateInvoice }: DaySalesListProps) {
  const { t, locale } = useLocale();
  const [, setParams] = useSearchParams();
  const today = businessToday();
  const listed = useDeliverySales(deliveryDate, listDeliverySales);
  const voiding = useVoidListedSale(voidSale, listed.reload);
  const printing = usePrintInvoices(printInvoices);
  const [pendingVoidId, setPendingVoidId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  const printable = listed.sales.filter(sale => canPreviewInvoice(sale.status));
  const visible = useMemo(() => {
    const terms = query
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return listed.sales.filter(sale => {
      if (filter !== 'all' && sale.status !== filter) {
        return false;
      }
      const haystack = `${sale.customerName} ${invoiceLabel(sale, t)}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return terms.every(term => haystack.includes(term));
    });
  }, [listed.sales, filter, query, t]);
  const visiblePrintable = visible.filter(sale => canPreviewInvoice(sale.status));
  const selectedVisible = visiblePrintable.filter(sale => selected.includes(sale.id));
  const allChecked = visiblePrintable.length > 0 && selectedVisible.length === visiblePrintable.length;

  function selectDate(date: string) {
    setQuery('');
    setSelected([]);
    setParams({ deliveryDate: date });
  }

  function shift(days: number) {
    if (!deliveryDate) {
      return;
    }
    const next = addBusinessDays(deliveryDate, days);
    if (next) {
      selectDate(next);
    }
  }

  function toggle(saleId: string) {
    setSelected(current => (current.includes(saleId) ? current.filter(id => id !== saleId) : [...current, saleId]));
  }

  function selectAll(on: boolean) {
    const ids = visiblePrintable.map(sale => sale.id);
    setSelected(current => (on ? [...new Set([...current, ...ids])] : current.filter(id => !ids.includes(id))));
  }

  const counts = {
    all: listed.sales.length,
    CONFIRMED: listed.sales.filter(sale => sale.status === 'CONFIRMED').length,
    DRAFT: listed.sales.filter(sale => sale.status === 'DRAFT').length,
    VOIDED: listed.sales.filter(sale => sale.status === 'VOIDED').length
  };
  const confirmedTotal = printable.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <section className="stack deliveries">
      <ScreenTitle>{t('deliverySales')}</ScreenTitle>
      {deliveryDate ? (
        <div className="dl-dnav">
          <button className="dl-ib" type="button" aria-label={t('previousDay')} onClick={() => shift(-1)}>
            <ChevronLeft aria-hidden="true" strokeWidth={2.4} />
          </button>
          <div className="dl-dnav-title">
            <b>{formatDeliveryHeading(deliveryDate, locale)}</b>
            <small>
              {listed.loading
                ? t('daySalesLoading')
                : listed.sales.length
                  ? `${countLabel(listed.sales.length, 'saleCountOne', 'saleCount', t)} · ${countLabel(printable.length, 'confirmedCountOne', 'confirmedCount', t)} · ${formatCurrency(confirmedTotal)}`
                  : t('noConfirmedSales')}
            </small>
          </div>
          <button className="dl-ib" type="button" aria-label={t('nextDay')} onClick={() => shift(1)}>
            <ChevronRight aria-hidden="true" strokeWidth={2.4} />
          </button>
          <button className="dl-link" type="button" onClick={() => selectDate(today)}>
            {t('today')}
          </button>
        </div>
      ) : null}

      <div className="dl-tools">
        <button className="dl-out" type="button" disabled={printing.printing || selectedVisible.length === 0} onClick={() => void printing.print(selectedVisible.map(sale => sale.id))}>
          <Printer aria-hidden="true" strokeWidth={1.8} />
          {printing.printing
            ? t('invoicePrinting')
            : selectedVisible.length
              ? `${t('printSelected')} (${selectedVisible.length})`
              : t('printSelected')}
        </button>
        <button className="dl-main" type="button" disabled={printing.printing || printable.length === 0} onClick={() => void printing.print(printable.map(sale => sale.id))}>
          <Printer aria-hidden="true" strokeWidth={1.8} />
          {t('printAll')} ({printable.length})
        </button>
      </div>
      <p className="dl-hint">{t('deliverySalesHint')}</p>

      {listed.loading ? <StatusMessage tone="info">{t('daySalesLoading')}</StatusMessage> : null}
      {listed.error ? <StatusMessage tone="error">{t(listed.error)}</StatusMessage> : null}
      {voiding.error && !pendingVoidId ? <StatusMessage tone="error">{t(voiding.error)}</StatusMessage> : null}
      {printing.error ? <StatusMessage tone="error">{t(printing.error)}</StatusMessage> : null}

      <div className="dl-filters">
        <div className="dl-chips" role="group" aria-label={t('filterByStatus')}>
          {(
            [
              ['all', t('filterAll'), counts.all],
              ['CONFIRMED', t('statusConfirmed'), counts.CONFIRMED],
              ['DRAFT', t('statusDraft'), counts.DRAFT],
              ['VOIDED', t('statusVoided'), counts.VOIDED]
            ] as const
          ).map(([key, label, count]) => (
            <button key={key} className="dl-chip" type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
              {label}
              <b>{count}</b>
            </button>
          ))}
        </div>
        <label className="dl-search">
          <Search aria-hidden="true" strokeWidth={2.2} />
          <input
            type="search"
            value={query}
            placeholder={t('searchDeliveries')}
            aria-label={t('searchDeliveries')}
            autoComplete="off"
            onChange={event => setQuery(event.target.value)}
          />
        </label>
      </div>

      <label className="dl-selbar">
        <input
          className="dl-chk"
          type="checkbox"
          checked={allChecked}
          disabled={visiblePrintable.length === 0 || printing.printing}
          onChange={event => selectAll(event.target.checked)}
        />
        {t('selectConfirmed')}
      </label>

      {!listed.loading && !listed.error && visible.length === 0 ? (
        <div className="dl-empty">
          <h3>{listed.sales.length ? t('deliveriesNoMatch') : t('deliveriesEmptyTitle')}</h3>
          <p>{listed.sales.length ? t('deliveriesNoMatchHint') : t('deliveriesEmptyHint')}</p>
        </div>
      ) : null}

      {visible.length > 0 ? (
        <section className="dl-panel" aria-label={t('deliverySales')}>
          <div className="dl-row dl-head">
            <span>
              <input
                className="dl-chk"
                type="checkbox"
                aria-label={t('selectConfirmed')}
                checked={allChecked}
                disabled={visiblePrintable.length === 0 || printing.printing}
                onChange={event => selectAll(event.target.checked)}
              />
            </span>
            <span>{t('lineName')}</span>
            <span>{t('status')}</span>
            <span className="dl-inv">{t('invoice')}</span>
            <span className="dl-num">{t('saleTotalShort')}</span>
            <span className="dl-num">{t('actions')}</span>
          </div>
          {visible.map(sale => {
            const printableSale = canPreviewInvoice(sale.status);
            return (
              <div key={sale.id} className={sale.status === 'VOIDED' ? 'dl-row dl-void' : 'dl-row'}>
                <span className="dl-chk-cell">
                  <input
                    className="dl-chk"
                    type="checkbox"
                    aria-label={sale.invoiceNumber ?? sale.customerName}
                    checked={printableSale && selected.includes(sale.id)}
                    disabled={!printableSale || printing.printing}
                    title={printableSale ? undefined : t('invoiceNotPrintable')}
                    onChange={() => toggle(sale.id)}
                  />
                </span>
                <span className="dl-name">
                  <b>{sale.customerName}</b>
                  <small>
                    {invoiceLabel(sale, t)}
                    {printableSale ? '' : ` · ${t('cannotPrint')}`}
                  </small>
                </span>
                <span className="dl-st">
                  <span className={`tag tag-${sale.status.toLowerCase()}`}>{t(statusKey[sale.status])}</span>
                </span>
                <span className="dl-inv">{invoiceLabel(sale, t)}</span>
                <span className="dl-tot dl-num">{formatCurrency(sale.total)}</span>
                <span className="dl-act">
                  <SaleAction
                  sale={sale}
                  voidingId={voiding.voidingId}
                  pendingVoidId={pendingVoidId}
                  onVoid={setPendingVoidId}
                  onPreview={setPreviewId}
                />
                </span>
              </div>
            );
          })}
        </section>
      ) : null}

      <div className={selectedVisible.length > 0 ? 'dl-bar on' : 'dl-bar'}>
        <b>{countLabel(selectedVisible.length, 'selectedCountOne', 'selectedCount', t)}</b>
        <button className="dl-main" type="button" disabled={printing.printing} onClick={() => void printing.print(selectedVisible.map(sale => sale.id))}>
          <Printer aria-hidden="true" strokeWidth={1.8} />
          {t('printSelected')}
        </button>
      </div>

      {previewId ? (
        <InvoicePreview
          saleId={previewId}
          generateInvoice={generateInvoice}
          printInvoices={printInvoices}
          onClose={() => setPreviewId(null)}
        />
      ) : null}
      {pendingVoidId ? (
        <ConfirmDialog
          title={t('confirmVoid')}
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
  onPreview
}: {
  sale: DaySaleModel;
  voidingId: string | null;
  pendingVoidId: string | null;
  onVoid: (saleId: string) => void;
  onPreview: (saleId: string) => void;
}) {
  const { t } = useLocale();
  const preview =
    canPreviewInvoice(sale.status) || sale.status === 'VOIDED' ? (
      <button className="dl-ab dl-pv" type="button" aria-label={t('invoicePreview')} onClick={() => onPreview(sale.id)}>
        <Receipt aria-hidden="true" strokeWidth={1.8} />
      </button>
    ) : (
      <span />
    );
  const view =
    sale.status === 'CONFIRMED' ? (
      <Link className="dl-ab dl-vw" to={`/sales?saleId=${encodeURIComponent(sale.id)}`} aria-label={t('viewSale')}>
        <Eye aria-hidden="true" strokeWidth={1.8} />
        <span className="dl-lb">{t('viewSale')}</span>
      </Link>
    ) : (
      <span />
    );
  const voidAction = canVoidSale(sale.status) ? (
    <button
      className="dl-ab dl-cn"
      type="button"
      aria-label={t('voidSale')}
      disabled={voidingId !== null || pendingVoidId === sale.id}
      onClick={() => onVoid(sale.id)}
    >
      <Ban aria-hidden="true" strokeWidth={1.8} />
      <span className="dl-lb">{t('voidSale')}</span>
    </button>
  ) : (
    <span />
  );

  return (
    <>
      {preview}
      {view}
      {voidAction}
    </>
  );
}
