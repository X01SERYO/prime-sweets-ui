import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useLoadSheet } from '@/modules/fulfillment-output/adapters/ui/hooks/useLoadSheet';
import type { ListLoadSheetUseCase } from '@/modules/fulfillment-output/application/use-cases/listLoadSheet.useCase';
import {
  filterProductRows,
  groupByBrand,
  loadSheetTotals,
  marginRatio,
  sortProductRows,
  toProductRows,
  type LoadSheetBrandGroup,
  type LoadSheetProductRow,
  type LoadSheetSortKey,
  type LoadSheetTotals
} from '@/modules/fulfillment-output/domain/loadSheetPresentation';
import { addBusinessDays, businessToday } from '@/modules/sales/domain/deliveryDays';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';
import type { MessageKey } from '@/shared/i18n/messages';
import { ScreenTitle } from '@/shared/ui/BackButton';
import { StatusMessage } from '@/shared/ui/StatusMessage';
import '@/modules/fulfillment-output/adapters/ui/views/loadSheet.css';

interface LoadSheetListProps {
  listLoadSheet: ListLoadSheetUseCase;
}

function formatMargin(gain: number, sold: number, locale: string): string {
  const ratio = marginRatio(gain, sold);
  if (ratio === null) {
    return '–';
  }
  const language = locale === 'en' ? 'en-US' : 'es-CO';
  return `${(ratio * 100).toLocaleString(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
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

function countLabel(count: number, one: MessageKey, many: MessageKey, t: (key: MessageKey) => string): string {
  return count === 1 ? t(one) : t(many).replace('{count}', String(count));
}

function Numbers({ totals, locale }: { totals: LoadSheetTotals; locale: string }) {
  const { t } = useLocale();
  return (
    <>
      <span className="ls-qty ls-num" data-l={t('quantity')}>{totals.quantity}</span>
      <span className="ls-cost ls-num" data-l={t('lineCost')}>{formatCurrency(totals.cost)}</span>
      <span className="ls-sold ls-num" data-l={t('sold')}>{formatCurrency(totals.sold)}</span>
      <span className="ls-gain ls-num" data-l={t('profit')}>
        {formatCurrency(totals.gain)}
        <span className="ls-pm"> · {formatMargin(totals.gain, totals.sold, locale)}</span>
      </span>
      <span className="ls-pct ls-num" data-l={t('margin')}>{formatMargin(totals.gain, totals.sold, locale)}</span>
    </>
  );
}

function BrandBlock({
  group,
  open,
  searching,
  locale,
  onToggle
}: {
  group: LoadSheetBrandGroup;
  open: boolean;
  searching: boolean;
  locale: string;
  onToggle: () => void;
}) {
  const { t } = useLocale();
  const label = group.name || t('noBrand');
  const expanded = searching || open;
  return (
    <div className="ls-group">
      <button className="ls-row ls-brand" type="button" aria-expanded={expanded} disabled={searching} onClick={onToggle}>
        <span className="ls-name">
          <b>{label}</b>
          <small>{countLabel(group.products.length, 'productCountOne', 'productCount', t)}</small>
        </span>
        <Numbers totals={group} locale={locale} />
        <span className="ls-chev" aria-hidden="true">
          <ChevronDown strokeWidth={2.2} />
        </span>
      </button>
      {expanded ? (
        <div className="ls-nested">
          {group.products.map(product => (
            <ProductLine key={product.productId} product={product} locale={locale} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProductLine({ product, locale }: { product: LoadSheetProductRow; locale: string }) {
  const { t } = useLocale();
  return (
    <>
      <div className="ls-row ls-prod">
        <span className="ls-name">
          {product.name}
          {product.mixed ? <small>{t('mixedPurchasePrices')}</small> : null}
        </span>
        <Numbers totals={product} locale={locale} />
        <span className="ls-chev">
          {product.mixed ? <AlertCircle aria-hidden="true" strokeWidth={1.8} /> : null}
        </span>
      </div>
      {product.mixed
        ? product.priceGroups.map(price => (
            <div key={`${price.wholesaleCost}:${price.wholesaleSalePrice}`} className="ls-row ls-prod ls-mixed">
              <span className="ls-name">
                <small>
                  {t('lineCost')} {formatCurrency(price.wholesaleCost)} · {t('wholesalePrice')} {formatCurrency(price.wholesaleSalePrice)} {t('unitEach')}
                </small>
              </span>
              <Numbers
                totals={{
                  quantity: price.quantity,
                  cost: price.wholesaleCost * price.quantity,
                  sold: price.totalPrice,
                  gain: price.profit
                }}
                locale={locale}
              />
              <span className="ls-chev" />
            </div>
          ))
        : null}
    </>
  );
}

export function LoadSheetList({ listLoadSheet }: LoadSheetListProps) {
  const { t, locale } = useLocale();
  const [params, setParams] = useSearchParams();
  const today = businessToday();
  const requested = params.get('deliveryDate');
  const deliveryDate = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : today;
  const sheet = useLoadSheet(deliveryDate, listLoadSheet);
  const [view, setView] = useState<'brand' | 'detail'>('brand');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<LoadSheetSortKey>('name');
  const [openBrands, setOpenBrands] = useState<string[]>([]);

  const rows = useMemo(() => toProductRows(sheet.lines), [sheet.lines]);
  const filtered = useMemo(() => filterProductRows(rows, query), [rows, query]);
  const brands = useMemo(() => groupByBrand(filtered, sortKey), [filtered, sortKey]);
  const detail = useMemo(() => sortProductRows(filtered, sortKey), [filtered, sortKey]);
  const dayTotals = loadSheetTotals(rows);
  const filteredTotals = loadSheetTotals(filtered);
  const searching = query.trim().length > 0;
  const brandCount = new Set(rows.map(row => row.brand)).size;
  const allOpen = brands.length > 0 && brands.every(group => openBrands.includes(group.name));

  function selectDate(date: string) {
    setQuery('');
    setOpenBrands([]);
    setParams({ deliveryDate: date });
  }

  function shift(days: number) {
    const next = addBusinessDays(deliveryDate, days);
    if (next) {
      selectDate(next);
    }
  }

  function toggleBrand(name: string) {
    setOpenBrands(current => (current.includes(name) ? current.filter(item => item !== name) : [...current, name]));
  }

  function toggleAll() {
    setOpenBrands(allOpen ? [] : brands.map(group => group.name));
  }

  return (
    <section className="stack load-sheet">
      <header className="load-sheet-head">
        <ScreenTitle>{t('loadSheet')}</ScreenTitle>
      </header>

      <div className="ls-dnav">
        <button className="ls-ib" type="button" aria-label={t('previousDay')} onClick={() => shift(-1)}>
          <ChevronLeft aria-hidden="true" strokeWidth={2.4} />
        </button>
        <div className="ls-dnav-title">
          <b>{formatDeliveryHeading(deliveryDate, locale)}</b>
          <small>
            {sheet.loading
              ? t('loadSheetLoading')
              : rows.length
                ? `${countLabel(rows.length, 'productCountOne', 'productCount', t)} · ${countLabel(dayTotals.quantity, 'unitCountOne', 'unitCount', t)} · ${countLabel(brandCount, 'brandCountOne', 'brandCount', t)}`
                : t('noConfirmedSales')}
          </small>
        </div>
        <button className="ls-ib" type="button" aria-label={t('nextDay')} onClick={() => shift(1)}>
          <ChevronRight aria-hidden="true" strokeWidth={2.4} />
        </button>
        <button className="ls-link" type="button" onClick={() => selectDate(today)}>
          {t('today')}
        </button>
      </div>

      <div className="ls-ctrl">
        <div className="ls-seg" role="tablist" aria-label={t('loadSheetView')}>
          <button type="button" role="tab" aria-selected={view === 'brand'} onClick={() => setView('brand')}>
            {t('consolidatedView')}
          </button>
          <button type="button" role="tab" aria-selected={view === 'detail'} onClick={() => setView('detail')}>
            {t('detailedView')}
          </button>
        </div>
        <label className="ls-search">
          <Search aria-hidden="true" strokeWidth={2.2} />
          <input
            type="search"
            value={query}
            placeholder={t('searchLoadSheet')}
            aria-label={t('searchLoadSheet')}
            autoComplete="off"
            onChange={event => setQuery(event.target.value)}
          />
        </label>
        <select className="ls-half" aria-label={t('sortLoadSheet')} value={sortKey} onChange={event => setSortKey(event.target.value as LoadSheetSortKey)}>
          <option value="name">{t('sortByBrand')}</option>
          <option value="sold">{t('sortBySold')}</option>
          <option value="gain">{t('sortByGain')}</option>
          <option value="qty">{t('sortByQuantity')}</option>
        </select>
        {view === 'brand' ? (
          <button className="ls-out ls-half" type="button" disabled={searching || brands.length === 0} onClick={toggleAll}>
            {allOpen ? t('collapseAll') : t('expandAll')}
          </button>
        ) : null}
      </div>

      {sheet.error ? <StatusMessage tone="error">{t(sheet.error)}</StatusMessage> : null}

      {!sheet.loading && !sheet.error && rows.length === 0 ? (
        <div className="ls-empty">
          <h3>{t('loadSheetEmptyTitle')}</h3>
          <p>{t('loadSheetEmptyHint')}</p>
        </div>
      ) : null}

      {!sheet.loading && !sheet.error && rows.length > 0 && filtered.length === 0 ? (
        <div className="ls-empty">
          <h3>{t('loadSheetNoMatch')}</h3>
          <p>{t('loadSheetNoMatchHint').replace('{query}', query.trim())}</p>
          <button className="ls-out" type="button" onClick={() => setQuery('')}>
            {t('clearSearch')}
          </button>
        </div>
      ) : null}

      {!sheet.loading && !sheet.error && filtered.length > 0 && view === 'brand' ? (
        <section className="ls-panel" aria-label={t('loadSheet')}>
          <div className="ls-row ls-head">
            <span>{t('brand')}</span>
            <span className="ls-num">{t('quantity')}</span>
            <span className="ls-num ls-cost">{t('lineCost')}</span>
            <span className="ls-num">{t('sold')}</span>
            <span className="ls-num">{t('profit')}</span>
            <span className="ls-num ls-pct" title={t('margin')}>{t('margin')}</span>
            <span />
          </div>
          {brands.map(group => (
            <BrandBlock
              key={group.name}
              group={group}
              open={openBrands.includes(group.name)}
              searching={searching}
              locale={locale}
              onToggle={() => toggleBrand(group.name)}
            />
          ))}
          <div className="ls-row ls-total">
            <span className="ls-name">
              <b>{searching ? t('filteredTotal') : t('sheetTotal')}</b>
            </span>
            <Numbers totals={filteredTotals} locale={locale} />
            <span />
          </div>
        </section>
      ) : null}

      {!sheet.loading && !sheet.error && filtered.length > 0 && view === 'detail' ? (
        <section className="ls-panel" aria-label={t('loadSheet')}>
          <div className="ls-detail ls-head">
            <span>{t('brand')}</span>
            <span>{t('lineName')}</span>
            <span className="ls-num">{t('quantity')}</span>
            <span className="ls-num ls-dcost">{t('wholesaleCost')}</span>
            <span className="ls-num">{t('wholesalePrice')}</span>
            <span className="ls-num">{t('saleTotalShort')}</span>
            <span className="ls-num">{t('profit')}</span>
          </div>
          {detail.map(product => (
            <div className="ls-detail" key={product.productId}>
              <span className="ls-dbrand">{product.brand || t('noBrand')}</span>
              <span className="ls-dprod">{product.name}</span>
              <span className="ls-dqty ls-num" data-l={t('quantity')}>{product.quantity}</span>
              <span className="ls-dcost ls-num" data-l={t('wholesaleCost')}>{product.unitCost === null ? '—' : formatCurrency(product.unitCost)}</span>
              <span className="ls-dprice ls-num" data-l={t('wholesalePrice')}>{product.unitPrice === null ? '—' : formatCurrency(product.unitPrice)}</span>
              <span className="ls-dtot ls-num" data-l={t('saleTotalShort')}>{formatCurrency(product.sold)}</span>
              <span className="ls-dgain ls-num" data-l={t('profit')}>{formatCurrency(product.gain)}</span>
            </div>
          ))}
          <div className="ls-detail ls-total">
            <span className="ls-dbrand" />
            <span className="ls-dprod">
              <b>{searching ? t('filteredTotal') : t('sheetTotal')}</b>
            </span>
            <span className="ls-dqty ls-num" data-l={t('quantity')}>{filteredTotals.quantity}</span>
            <span className="ls-dcost" />
            <span className="ls-dprice" />
            <span className="ls-dtot ls-num" data-l={t('saleTotalShort')}>{formatCurrency(filteredTotals.sold)}</span>
            <span className="ls-dgain ls-num" data-l={t('profit')}>{formatCurrency(filteredTotals.gain)}</span>
          </div>
        </section>
      ) : null}

      {!sheet.loading && !sheet.error && rows.length > 0 ? (
        <p className="load-sheet-totals">
          <span className="load-sheet-total ls-margin">
            <small>{t('margin')}</small>
            <strong>{formatMargin(dayTotals.gain, dayTotals.sold, locale)}</strong>
          </span>
          <span className="load-sheet-total ls-gain-total">
            <small>{t('profitTotal')}</small>
            <strong>{formatCurrency(dayTotals.gain)}</strong>
          </span>
          <span className="load-sheet-total">
            <small>{t('soldTotal')}</small>
            <strong>{formatCurrency(dayTotals.sold)}</strong>
          </span>
        </p>
      ) : null}
    </section>
  );
}
