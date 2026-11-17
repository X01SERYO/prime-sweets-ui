import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import type { CreatePurchaseOrderUseCase, GetSupplierUseCase } from '@/modules/purchasing/application/use-cases/purchasing.useCases';
import { PurchaseInvalidError } from '@/modules/purchasing/domain/errors/purchaseInvalid.error';
import { lineCost, orderTotal } from '@/modules/purchasing/domain/lineCost';
import type { SupplierProduct } from '@/modules/purchasing/domain/models/supplier';
import { useLocale } from '@/shared/i18n/useLocale';
import { formatCurrency } from '@/shared/domain/money';
import { ScreenTitle } from '@/shared/ui/BackButton';
import { StatusMessage } from '@/shared/ui/StatusMessage';
import './purchaseSheet.css';

interface PurchaseOrderSheetViewProps {
  supplierId: string;
  getSupplier: GetSupplierUseCase;
  createPurchaseOrder: CreatePurchaseOrderUseCase;
}

interface DraftRow {
  quantity: string;
  itemName: string;
}

export function PurchaseOrderSheetView({ supplierId, getSupplier, createPurchaseOrder }: PurchaseOrderSheetViewProps) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getSupplier
      .execute(supplierId)
      .then(sheet => {
        setProducts(sheet.products);
        setDrafts(
          Object.fromEntries(
            sheet.products.map(product => [
              product.productId,
              { quantity: '', itemName: product.lastItemName || product.productName || '' }
            ])
          )
        );
      })
      .catch(caught => setError(caught instanceof PurchaseInvalidError ? caught.code : t('purchaseFailed')));
  }, [getSupplier, supplierId, t]);

  const visible = products.filter(product => {
    const haystack = `${product.productCode ?? ''} ${product.brandName ?? ''} ${product.productName ?? ''}`.toLocaleLowerCase();
    return haystack.includes(filter.trim().toLocaleLowerCase());
  });

  const total = useMemo(() => {
    const rows = products.flatMap(product => {
      const quantity = Number(drafts[product.productId]?.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || product.unitCost == null) return [];
      return [{ unitCost: product.unitCost, quantity }];
    });
    return orderTotal(rows);
  }, [drafts, products]);

  function update(productId: string, patch: Partial<DraftRow>) {
    setDrafts(current => ({
      ...current,
      [productId]: { quantity: '', itemName: '', ...current[productId], ...patch }
    }));
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const lines = products.flatMap(product => {
      const draft = drafts[product.productId] ?? { quantity: '', itemName: '' };
      if (draft.quantity.trim() === '' || draft.quantity === '0') return [];
      const quantity = Number(draft.quantity);
      const itemName = draft.itemName.trim();
      const sameAsCatalog = itemName.toLocaleLowerCase('es-CO') === (product.productName ?? '').toLocaleLowerCase('es-CO');
      return [{ productId: product.productId, quantity, ...(itemName && !sameAsCatalog ? { itemName } : {}) }];
    });
    try {
      await createPurchaseOrder.execute(supplierId, lines);
      navigate(`/purchasing/${supplierId}`, { state: { orderSaved: true } });
    } catch (caught) {
      setError(caught instanceof PurchaseInvalidError ? caught.code : t('purchaseFailed'));
      setSaving(false);
    }
  }

  return (
    <section className="stack">
      <ScreenTitle>{t('newPurchaseOrder')}</ScreenTitle>
      {products.length === 0 && !error ? <StatusMessage tone="info">{t('purchaseNeedProducts')}</StatusMessage> : null}
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      <label htmlFor="order-filter">{t('filterProducts')}</label>
      <input id="order-filter" value={filter} onChange={event => setFilter(event.target.value)} />
      <form onSubmit={event => void onSave(event)}>
        <div className="purchase-sheet">
          <table>
            <thead>
              <tr>
                <th>{t('productCode')}</th>
                <th>{t('brand')}</th>
                <th>{t('lineName')}</th>
                <th>{t('unitCost')}</th>
                <th>{t('previousQuantity')}</th>
                <th>{t('purchaseQuantity')}</th>
                <th>{t('lineCost')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(product => {
                const draft = drafts[product.productId] ?? { quantity: '', itemName: '' };
                const quantity = Number(draft.quantity);
                const cost =
                  product.unitCost != null && Number.isInteger(quantity) && quantity >= 1
                    ? lineCost(product.unitCost, quantity)
                    : null;
                return (
                  <tr key={product.productId}>
                    <td>{product.productCode}</td>
                    <td>{product.brandName}</td>
                    <td>
                      <input
                        aria-label={t('lineName')}
                        value={draft.itemName}
                        onChange={event => update(product.productId, { itemName: event.target.value })}
                      />
                    </td>
                    <td>{product.unitCost == null ? '—' : formatCurrency(product.unitCost)}</td>
                    <td>{product.lastQuantity ?? ''}</td>
                    <td>
                      <input
                        inputMode="numeric"
                        aria-label={t('purchaseQuantity')}
                        value={draft.quantity}
                        onChange={event => update(product.productId, { quantity: event.target.value.replace(/\D/g, '') })}
                      />
                    </td>
                    <td>{cost == null ? '' : formatCurrency(cost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p>
          {t('orderTotal')}: <strong>{formatCurrency(total)}</strong>
        </p>
        <button className="btn" type="submit" disabled={saving || products.length === 0}>
          {t('saveOrder')}
        </button>
      </form>
    </section>
  );
}
