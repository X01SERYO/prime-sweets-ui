import { ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router';
import { ProductSearchView } from '@/modules/catalog/adapters/ui/views/ProductSearchView';
import type { SearchProductsUseCase } from '@/modules/catalog/application/use-cases/searchProducts.useCase';
import type {
  CreatePurchaseOrderUseCase,
  GetSupplierUseCase,
  ListPurchaseOrdersUseCase,
  SetSupplierProductsUseCase,
  UpdatePurchaseOrderUseCase
} from '@/modules/purchasing/application/use-cases/purchasing.useCases';
import { PurchaseInvalidError } from '@/modules/purchasing/domain/errors/purchaseInvalid.error';
import { lineCost, orderTotal } from '@/modules/purchasing/domain/lineCost';
import type { SupplierProduct, SupplierSheet } from '@/modules/purchasing/domain/models/supplier';
import { useLocale } from '@/shared/i18n/useLocale';
import { formatCurrency } from '@/shared/domain/money';
import { ScreenTitle } from '@/shared/ui/BackButton';
import { StatusMessage } from '@/shared/ui/StatusMessage';
import './purchaseSheet.css';

interface SupplierDetailViewProps {
  supplierId: string;
  orderId: string | null;
  getSupplier: GetSupplierUseCase;
  setSupplierProducts: SetSupplierProductsUseCase;
  searchProducts: SearchProductsUseCase;
  listPurchaseOrders: ListPurchaseOrdersUseCase;
  createPurchaseOrder: CreatePurchaseOrderUseCase;
  updatePurchaseOrder: UpdatePurchaseOrderUseCase;
}

export function SupplierDetailView({
  supplierId,
  orderId,
  getSupplier,
  setSupplierProducts,
  searchProducts,
  listPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder
}: SupplierDetailViewProps) {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const editing = Boolean(orderId);
  const [sheet, setSheet] = useState<SupplierSheet | null>(null);
  const [latestDate, setLatestDate] = useState<string | null>(null);
  const [previousDate, setPreviousDate] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftLine[]>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<{ id: string; name: string } | null>(null);
  const narrow = useNarrowLayout();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getSupplier
      .execute(supplierId)
      .then(next => {
        setSheet(sortedSheet(next));
        setDrafts(initialDrafts(next.products, editing));
      })
      .catch(caught => setError(messageOf(caught)));
    void listPurchaseOrders
      .execute(supplierId, 1, 2)
      .then(page => {
        setLatestDate(page.items[0]?.createdAt ?? null);
        setPreviousDate(page.items[1]?.createdAt ?? null);
      })
      .catch(() => undefined);
  }, [editing, getSupplier, listPurchaseOrders, supplierId]);

  const order = useMemo(() => {
    if (!sheet) return { total: 0, products: 0, units: 0 };
    const rows = sheet.products.flatMap(product =>
      (drafts[product.productId] ?? []).flatMap(line => {
        const quantity = Number(line.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) return [];
        return [{ unitCost: product.unitCost ?? 0, quantity }];
      })
    );
    return {
      total: orderTotal(rows),
      products: rows.length,
      units: rows.reduce((sum, row) => sum + row.quantity, 0)
    };
  }, [drafts, sheet]);

  async function link(productId: string): Promise<boolean> {
    if (!sheet || sheet.products.some(product => product.productId === productId)) return true;
    setError(null);
    try {
      const next = await setSupplierProducts.execute(supplierId, [...sheet.products.map(product => product.productId), productId]);
      const known = new Set(sheet.products.map(product => product.productId));
      const added = next.products.filter(product => !known.has(product.productId));
      const kept = sheet.products.flatMap(product => next.products.filter(item => item.productId === product.productId));
      setSheet({ ...next, products: [...added, ...kept] });
      return true;
    } catch (caught) {
      setError(messageOf(caught));
      return false;
    }
  }

  async function unlink(productId: string) {
    if (!sheet) return;
    setError(null);
    try {
      const next = await setSupplierProducts.execute(
        supplierId,
        sheet.products.filter(product => product.productId !== productId).map(product => product.productId)
      );
      const kept = sheet.products.flatMap(product => next.products.filter(item => item.productId === product.productId));
      setSheet({ ...next, products: kept });
      setDrafts(current => {
        const nextDrafts = { ...current };
        delete nextDrafts[productId];
        return nextDrafts;
      });
    } catch (caught) {
      setError(messageOf(caught));
    }
  }

  function acceptPending(detail: string, quantity: number) {
    if (!pending || !sheet) return;
    const productId = pending.id;
    const apply = () => {
      setDrafts(current => {
        const existing = current[productId] ?? [];
        const untouched = existing.length === 1 && existing[0].detail.trim() === '' && Number(existing[0].quantity) === 0;
        const lines = untouched ? [] : existing;
        const same = lines.find(line => line.detail.trim().toLocaleLowerCase('es-CO') === detail.trim().toLocaleLowerCase('es-CO'));
        if (same) {
          return {
            ...current,
            [productId]: lines.map(line =>
              line.key === same.key ? { ...line, quantity: String(Number(line.quantity) + quantity) } : line
            )
          };
        }
        return { ...current, [productId]: [...lines, { key: crypto.randomUUID(), detail: detail.trim(), quantity: String(quantity) }] };
      });
      setPending(null);
    };
    if (sheet.products.some(product => product.productId === productId)) {
      apply();
      return;
    }
    void link(productId).then(linked => {
      if (linked) apply();
    });
  }

  function updateLine(productId: string, key: string, patch: Partial<DraftLine>) {
    setDrafts(current => ({
      ...current,
      [productId]: (current[productId] ?? [blankLine()]).map(line => (line.key === key ? { ...line, ...patch } : line))
    }));
  }

  function removeLine(productId: string, key: string) {
    const lines = drafts[productId] ?? [];
    if (lines.length <= 1) {
      void unlink(productId);
      return;
    }
    setDrafts(current => ({
      ...current,
      [productId]: (current[productId] ?? []).filter(line => line.key !== key)
    }));
  }

  async function onSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sheet) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const lines = sheet.products.flatMap(product =>
      (drafts[product.productId] ?? []).flatMap(line => {
        const quantity = Number(line.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) return [];
        const detail = storedFlavor(product, line.detail);
        return [{ productId: product.productId, quantity, ...(detail ? { itemName: detail } : {}) }];
      })
    );
    const assortment = sheet.products.flatMap(product =>
      (drafts[product.productId] ?? []).flatMap(line => {
        const detail = storedFlavor(product, line.detail);
        return detail ? [{ productId: product.productId, itemName: detail }] : [];
      })
    );
    try {
      if (editing && orderId) {
        await updatePurchaseOrder.execute(orderId, lines, assortment);
      } else {
        await createPurchaseOrder.execute(supplierId, lines, assortment);
      }
      navigate('/purchasing');
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="stack">
      <ScreenTitle>{sheet?.name ?? t('supplierProducts')}</ScreenTitle>
      {saved ? <StatusMessage tone="success">{t('orderSaved')}</StatusMessage> : null}
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      <StatusMessage tone="info">{editing ? t('editingLastOrder') : t('newOrderHint')}</StatusMessage>

      <ProductSearchView searchProducts={searchProducts} step={null} onSelect={product => setPending({ id: product.id, name: product.name ?? product.code })} />
      {pending ? (
        <OrderLineDialog
          name={pending.name}
          onCancel={() => setPending(null)}
          onAccept={acceptPending}
        />
      ) : null}

      <form onSubmit={event => void onSave(event)}>
        {narrow ? (
          <ul className="purchase-cards">
            {sheet?.products.map(product => (
              <PurchaseCard
                key={product.productId}
                product={product}
                lines={drafts[product.productId] ?? [blankLine()]}
                editing={editing}
                open={openGroups[product.productId] ?? false}
                onToggle={() => setOpenGroups(current => ({ ...current, [product.productId]: !current[product.productId] }))}
                onChange={(key, patch) => updateLine(product.productId, key, patch)}
                onRemove={key => removeLine(product.productId, key)}
              />
            ))}
          </ul>
        ) : (
        <div className="purchase-sheet">
          <table>
            <thead>
              <tr>
                <th>{t('productCode')}</th>
                <th>{t('brand')}</th>
                <th>{t('lineName')}</th>
                <th>{t('unitCost')}</th>
                {editing ? (
                  <QtyHead caption={t('previousOrderColumn')} date={previousDate ? columnDate(previousDate, locale) : '—'} />
                ) : (
                  <QtyHead caption={t('latestOrderColumn')} date={latestDate ? columnDate(latestDate, locale) : '—'} />
                )}
                <QtyHead
                  entry
                  caption={editing ? t('orderBeingEdited') : t('newOrderColumn')}
                  date={editing ? (latestDate ? columnDate(latestDate, locale) : '—') : columnDate(new Date().toISOString(), locale)}
                />
                <th>{t('lineCost')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sheet?.products.map(product => (
                <PurchaseRows
                  key={product.productId}
                  product={product}
                  lines={drafts[product.productId] ?? [blankLine()]}
                  editing={editing}
                  open={openGroups[product.productId] ?? false}
                  onToggle={() => setOpenGroups(current => ({ ...current, [product.productId]: !current[product.productId] }))}
                  onChange={(key, patch) => updateLine(product.productId, key, patch)}
                  onRemove={key => removeLine(product.productId, key)}
                />
              ))}
            </tbody>
          </table>
        </div>
        )}
        <div className="sale-dock">
          <div className="sale-close">
            <div className="sale-totals">
              <p className="sale-total">
                {t('saleTotal')} {formatCurrency(order.total)}
              </p>
              <p className="sale-summary">
                {t('saleSummary').replace('{products}', String(order.products)).replace('{units}', String(order.units))}
              </p>
            </div>
            <button className="btn" type="submit" disabled={saving || !sheet || sheet.products.length === 0}>
              {t('saveOrder')}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function QtyHead({ caption, date, entry = false }: { caption: string; date: string; entry?: boolean }) {
  return (
    <th className={entry ? 'qty-entry' : 'qty-reference'}>
      <span className="qty-caption">{caption}</span>
      <span className="qty-date">{date}</span>
    </th>
  );
}

function columnDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', {
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Bogota'
  }).format(date);
}

function sortedSheet(sheet: SupplierSheet): SupplierSheet {
  return {
    ...sheet,
    products: [...sheet.products].sort((left, right) =>
      (left.productCode ?? '').localeCompare(right.productCode ?? '', 'es', { numeric: true })
    )
  };
}

interface DraftLine {
  key: string;
  detail: string;
  quantity: string;
}

function blankLine(detail = ''): DraftLine {
  return { key: crypto.randomUUID(), detail, quantity: '0' };
}

function flavorName(product: SupplierProduct, detail: string): string {
  const trimmed = detail.trim();
  if (!trimmed) return '';
  const catalog = (product.productName ?? '').trim();
  const catalogKey = catalog.toLocaleLowerCase('es-CO');
  const detailKey = trimmed.toLocaleLowerCase('es-CO');
  if (!catalogKey || detailKey === catalogKey) return '';
  const extra = detailKey.startsWith(`${catalogKey} `) ? trimmed.slice(catalog.length) : trimmed;
  return sentence(extra);
}

function storedFlavor(product: SupplierProduct, detail: string): string {
  const flavor = flavorName(product, detail);
  return flavor ? `${(product.productName ?? '').trim()} ${flavor}` : '';
}

function sentence(value: string): string {
  const text = value.trim().toLocaleLowerCase('es-CO');
  if (!text) return '';
  return text.charAt(0).toLocaleUpperCase('es-CO') + text.slice(1);
}

function storedItems(product: SupplierProduct): { itemName: string; lastQuantity: number | null }[] {
  if ((product.items ?? []).length > 0) return product.items;
  const named = flavorName(product, product.lastItemName ?? '');
  return named ? [{ itemName: named, lastQuantity: product.lastQuantity }] : [];
}

function initialDrafts(products: SupplierProduct[], editing: boolean): Record<string, DraftLine[]> {
  return Object.fromEntries(
    products.map(product => {
      const items = storedItems(product);
      if (items.length === 0) {
        return [product.productId, [{
          key: product.productId,
          detail: '',
          quantity: editing && product.lastQuantity != null ? String(product.lastQuantity) : '0'
        }]];
      }
      return [product.productId, items.map(item => ({
        key: `${product.productId}:${item.itemName}`,
        detail: flavorName(product, item.itemName),
        quantity: editing && item.lastQuantity != null ? String(item.lastQuantity) : '0'
      }))];
    })
  );
}

function isSplit(lines: DraftLine[]): boolean {
  return lines.length > 1;
}

function lineQuantity(line: DraftLine): number {
  const quantity = Number(line.quantity);
  return Number.isInteger(quantity) && quantity >= 0 ? quantity : 0;
}

function PurchaseRows({
  product,
  lines,
  editing,
  open,
  onToggle,
  onChange,
  onRemove
}: {
  product: SupplierProduct;
  lines: DraftLine[];
  editing: boolean;
  open: boolean;
  onToggle: () => void;
  onChange: (key: string, patch: Partial<DraftLine>) => void;
  onRemove: (key: string) => void;
}) {
  const { t } = useLocale();
  const split = isSplit(lines);
  const reference = editing ? (product.previousQuantity ?? 0) : (product.lastQuantity ?? 0);
  const summed = lines.reduce((sum, line) => sum + lineQuantity(line), 0);
  const unit = product.unitCost ?? 0;
  if (!split) {
    const line = lines[0];
    return (
      <tr>
        <td>{product.productCode}</td>
        <td>{product.brandName}</td>
        <td>
          {product.productName}
          {line.detail.trim() ? <em className="line-variant-count">{line.detail.trim()}</em> : null}
        </td>
        <td>{formatCurrency(unit)}</td>
        <td className="qty-reference">{reference}</td>
        <td className="qty-entry">
          <QtyInput label={editing ? t('orderBeingEdited') : t('newOrderColumn')} line={line} onChange={patch => onChange(line.key, patch)} />
        </td>
        <td>{formatCurrency(lineCost(unit, lineQuantity(line)))}</td>
        <td>
          <button className="btn btn-secondary" type="button" onClick={() => onRemove(line.key)}>{t('unlinkProduct')}</button>
        </td>
      </tr>
    );
  }
  const countLabel = lines.length === 1 ? t('variantCountOne') : t('variantCount').replace('{count}', String(lines.length));
  return (
    <>
      <tr
        className="line-group"
        tabIndex={0}
        role="button"
        aria-expanded={open}
        aria-label={open ? t('hideVariants') : t('showVariants')}
        onClick={onToggle}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle();
          }
        }}
      >
        <td>{product.productCode}</td>
        <td>{product.brandName}</td>
        <td>
          {product.productName}
          <em className="line-variant-count">{countLabel}</em>
        </td>
        <td>{formatCurrency(unit)}</td>
        <td className="qty-reference">{reference}</td>
        <td className="qty-entry">{summed}</td>
        <td>{formatCurrency(lineCost(unit, summed))}</td>
        <td>
          <span className={open ? 'customer-fold open' : 'customer-fold'} aria-hidden="true">
            <ChevronRight strokeWidth={1.8} />
          </span>
        </td>
      </tr>
      {open ? lines.map(line => (
        <tr key={line.key} className="line-variant">
          <td />
          <td />
          <td className="product-cell">{line.detail.trim() || product.productName}</td>
          <td />
          <td />
          <td className="qty-entry">
            <QtyInput label={t('purchaseQuantity')} line={line} onChange={patch => onChange(line.key, patch)} />
          </td>
          <td>{formatCurrency(lineCost(unit, lineQuantity(line)))}</td>
          <td>
            <button className="btn btn-secondary" type="button" onClick={() => onRemove(line.key)}>{t('unlinkProduct')}</button>
          </td>
        </tr>
      )) : null}
    </>
  );
}

function PurchaseCard({
  product,
  lines,
  editing,
  open,
  onToggle,
  onChange,
  onRemove
}: {
  product: SupplierProduct;
  lines: DraftLine[];
  editing: boolean;
  open: boolean;
  onToggle: () => void;
  onChange: (key: string, patch: Partial<DraftLine>) => void;
  onRemove: (key: string) => void;
}) {
  const { t } = useLocale();
  const split = isSplit(lines);
  const reference = editing ? (product.previousQuantity ?? 0) : (product.lastQuantity ?? 0);
  const unit = product.unitCost ?? 0;
  const summed = lines.reduce((sum, line) => sum + lineQuantity(line), 0);
  const shown = split && !open ? [] : lines;
  return (
    <li className={split ? 'purchase-card is-group' : 'purchase-card'}>
      {split ? (
        <button className="purchase-card-head" type="button" aria-expanded={open} onClick={onToggle}>
          <span>
            <strong>{product.productName}</strong>
            <em>{lines.length === 1 ? t('variantCountOne') : t('variantCount').replace('{count}', String(lines.length))}</em>
          </span>
          <span>{summed}</span>
          <span>{formatCurrency(lineCost(unit, summed))}</span>
          <ChevronRight aria-hidden="true" strokeWidth={1.8} />
        </button>
      ) : null}
      {shown.map(line => (
        <div key={line.key} className="purchase-card-line">
          <strong>{split ? (line.detail.trim() || product.productName) : product.productName}</strong>
          {split || !line.detail.trim() ? null : <em>{line.detail.trim()}</em>}
          <div className="purchase-card-meta">
            <small>{product.productCode} · {product.brandName} · {formatCurrency(unit)}</small>
            <span>{editing ? t('previousOrderColumn') : t('latestOrderColumn')}: {reference}</span>
          </div>
          <div className="purchase-card-qty">
            <QtyInput label={t('purchaseQuantity')} line={line} onChange={patch => onChange(line.key, patch)} />
            <b>{formatCurrency(lineCost(unit, lineQuantity(line)))}</b>
            <button className="btn btn-secondary" type="button" onClick={() => onRemove(line.key)}>{t('unlinkProduct')}</button>
          </div>
        </div>
      ))}
    </li>
  );
}

function QtyInput({ label, line, onChange }: { label: string; line: DraftLine; onChange: (patch: Partial<DraftLine>) => void }) {
  return (
    <input
      inputMode="numeric"
      aria-label={label}
      value={line.quantity}
      onChange={event => onChange({ quantity: event.target.value.replace(/\D/g, '') })}
    />
  );
}

function OrderLineDialog({ name, onCancel, onAccept }: { name: string; onCancel: () => void; onAccept: (detail: string, quantity: number) => void }) {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState('');
  const [quantity, setQuantity] = useState('1');
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);
  return (
    <dialog ref={dialogRef} className="modal pending-modal" onCancel={event => { event.preventDefault(); onCancel(); }}>
      <form className="pending-line is-dialog" onSubmit={event => {
        event.preventDefault();
        const parsed = Number(quantity);
        if (!Number.isInteger(parsed) || parsed < 1) return;
        onAccept(detail, parsed);
      }}>
        <h2 className="pending-catalog">{name}</h2>
        <div className="pending-fields">
          <label htmlFor="order-variant">{t('lineVariant')}</label>
          <span className="pending-qty-label">{t('quantityName')}</span>
          <input id="order-variant" value={detail} placeholder={t('lineVariantPlaceholder')} onChange={event => setDetail(event.target.value)} />
          <input inputMode="numeric" aria-label={t('quantityName')} value={quantity} onChange={event => setQuantity(event.target.value.replace(/\D/g, ''))} />
        </div>
        <div className="pending-actions">
          <button className="btn btn-secondary" type="button" onClick={onCancel}>{t('cancelLine')}</button>
          <button className="btn" type="submit">{t('confirmLine')}</button>
        </div>
      </form>
    </dialog>
  );
}

function useNarrowLayout() {
  const [narrow, setNarrow] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 40rem)').matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(max-width: 40rem)');
    const apply = () => setNarrow(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);
  return narrow;
}

function messageOf(error: unknown): string {
  return error instanceof PurchaseInvalidError ? error.code : 'PURCHASE_FAILED';
}
