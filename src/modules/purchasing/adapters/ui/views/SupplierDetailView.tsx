import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    void getSupplier
      .execute(supplierId)
      .then(next => {
        setSheet(sortedSheet(next));
        setQuantities(draftQuantities(next.products, editing));
      })
      .catch(caught => setError(messageOf(caught)));
    void listPurchaseOrders
      .execute(supplierId, 1, 2)
      .then(page => {
        setLatestDate(page.items[0]?.createdAt ?? null);
        setPreviousDate(page.items[1]?.createdAt ?? null);
      })
      .catch(() => undefined);
  }, [editing, getSupplier, listPurchaseOrders, revision, supplierId]);

  const order = useMemo(() => {
    if (!sheet) return { total: 0, products: 0, units: 0 };
    const rows = sheet.products.flatMap(product => {
      const quantity = Number(quantities[product.productId]);
      if (!Number.isInteger(quantity) || quantity < 1) return [];
      return [{ unitCost: product.unitCost ?? 0, quantity }];
    });
    return {
      total: orderTotal(rows),
      products: rows.length,
      units: rows.reduce((sum, row) => sum + row.quantity, 0)
    };
  }, [quantities, sheet]);

  async function link(productId: string) {
    if (!sheet || sheet.products.some(product => product.productId === productId)) return;
    setError(null);
    try {
      const next = await setSupplierProducts.execute(supplierId, [...sheet.products.map(product => product.productId), productId]);
      const known = new Set(sheet.products.map(product => product.productId));
      const added = next.products.filter(product => !known.has(product.productId));
      const kept = sheet.products.flatMap(product => next.products.filter(item => item.productId === product.productId));
      setSheet({ ...next, products: [...added, ...kept] });
      setQuantities(current => ({ ...draftQuantities(next.products, editing), ...current }));
    } catch (caught) {
      setError(messageOf(caught));
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
    } catch (caught) {
      setError(messageOf(caught));
    }
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!sheet) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const lines = sheet.products.flatMap(product => {
      const raw = quantities[product.productId] ?? '';
      if (raw.trim() === '' || raw === '0') return [];
      const quantity = Number(raw);
      const itemName = product.lastItemName;
      return [{ productId: product.productId, quantity, ...(itemName ? { itemName } : {}) }];
    });
    try {
      if (editing && orderId) {
        await updatePurchaseOrder.execute(orderId, lines);
      } else {
        await createPurchaseOrder.execute(supplierId, lines);
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

      <ProductSearchView searchProducts={searchProducts} step={null} onSelect={product => void link(product.id)} />

      <form onSubmit={event => void onSave(event)}>
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
              {sheet?.products.map(product => {
                const raw = quantities[product.productId] ?? '0';
                const quantity = Number(raw);
                const cost =
                  product.unitCost != null && Number.isInteger(quantity) && quantity >= 0
                    ? lineCost(product.unitCost, quantity)
                    : 0;
                return (
                  <tr key={product.productId}>
                    <td>{product.productCode}</td>
                    <td>{product.brandName}</td>
                    <td>{product.productName}</td>
                    <td>{product.unitCost == null ? '—' : formatCurrency(product.unitCost)}</td>
                    <td className="qty-reference">{editing ? (product.previousQuantity ?? 0) : (product.lastQuantity ?? 0)}</td>
                    <td className="qty-entry">
                      <input
                        inputMode="numeric"
                        aria-label={editing ? t('orderBeingEdited') : t('newOrderColumn')}
                        value={raw === '' ? '0' : raw}
                        onChange={event =>
                          setQuantities(current => ({
                            ...current,
                            [product.productId]: event.target.value.replace(/\D/g, '')
                          }))
                        }
                      />
                    </td>
                    <td>{formatCurrency(cost)}</td>
                    <td>
                      <button className="btn btn-secondary" type="button" onClick={() => void unlink(product.productId)}>
                        {t('unlinkProduct')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

function draftQuantities(products: SupplierProduct[], editing: boolean): Record<string, string> {
  return Object.fromEntries(
    products.map(product => [
      product.productId,
      editing && product.lastQuantity != null ? String(product.lastQuantity) : '0'
    ])
  );
}

function messageOf(error: unknown): string {
  return error instanceof PurchaseInvalidError ? error.code : 'PURCHASE_FAILED';
}
