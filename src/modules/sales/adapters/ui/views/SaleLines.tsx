import { useState } from 'react';
import type { SaleModel } from '@/modules/sales/domain/models/sale';
import { formatCurrency } from '@/shared/domain/money';
import type { MessageKey } from '@/shared/i18n/messages';
import { useLocale } from '@/shared/i18n/useLocale';

export interface PendingLine {
  productId: string;
  name: string;
  unitPrice: number | null;
}

interface SaleLinesProps {
  sale: SaleModel | null;
  loading: boolean;
  error: MessageKey | null;
  lineError: MessageKey | null;
  busy: boolean;
  confirming: boolean;
  confirmError: MessageKey | null;
  onConfirm: () => void;
  pending: PendingLine | null;
  onAcceptPending: (name: string, quantity: number) => Promise<boolean>;
  onCancelPending: () => void;
  onRemove: (productId: string) => void;
  onQuantity: (productId: string, quantity: number) => void;
  onName: (productId: string, itemName: string) => void;
}

export function SaleLines({
  sale,
  loading,
  error,
  lineError,
  busy,
  confirming,
  confirmError,
  onConfirm,
  pending,
  onAcceptPending,
  onCancelPending,
  onRemove,
  onQuantity,
  onName
}: SaleLinesProps) {
  const { t } = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const editable = sale?.status === 'DRAFT' || sale?.status === 'CONFIRMED';

  return (
    <section className="stack">
      {loading ? <p className="m">{t('saleLoading')}</p> : null}
      {error ? <p role="alert">{t(error)}</p> : null}
      {lineError ? <p role="alert">{t(lineError)}</p> : null}
      {pending ? (
        <PendingCard
          pending={pending}
          busy={busy}
          onAccept={onAcceptPending}
          onCancel={onCancelPending}
        />
      ) : null}
      {sale && sale.items.length > 0 ? (
        <table className="lines">
          <thead>
            <tr>
              <th>{t('itemName')}</th>
              <th>{t('quantity')}</th>
              <th>{t('unitPrice')}</th>
              <th>{t('lineTotal')}</th>
              {editable ? (
                <>
                  <th />
                  <th />
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {sale.items.map(item => (
              <tr key={item.id}>
                {editingId === item.id ? (
                  <LineEditor
                    itemName={item.itemName}
                    quantity={item.quantity}
                    allowName={sale?.status === 'DRAFT'}
                    busy={busy}
                    onSave={(name, quantity) => {
                      if (sale?.status === 'DRAFT' && name !== item.itemName) {
                        onName(item.id, name);
                      }
                      if (quantity !== item.quantity) {
                        onQuantity(item.id, quantity);
                      }
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <td className="product-cell">{item.itemName}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.wholesalePrice)}</td>
                    <td>{formatCurrency(item.lineTotal)}</td>
                    {editable ? (
                      <>
                        <td className="line-col">
                          <button className="btn icon-btn icon-edit" type="button" aria-label={t('editSale')} disabled={busy} onClick={() => setEditingId(item.id)}>
                            <PencilIcon />
                          </button>
                        </td>
                        <td className="line-col">
                          <button className="btn icon-btn icon-void" type="button" aria-label={t('removeItem')} disabled={busy} onClick={() => setPendingRemoveId(item.id)}>
                            <RemoveIcon />
                          </button>
                        </td>
                      </>
                    ) : null}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {pendingRemoveId ? (
        <form
          className="sale-close"
          onSubmit={event => {
            event.preventDefault();
            onRemove(pendingRemoveId);
            setPendingRemoveId(null);
          }}
        >
          <p>{t('confirmRemove')}</p>
          <button className="btn" type="submit" disabled={busy}>
            {t('confirmLine')}
          </button>
          <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => setPendingRemoveId(null)}>
            {t('cancelLine')}
          </button>
        </form>
      ) : null}
      {sale && sale.items.length === 0 && !pending ? <p className="m">{t('saleEmpty')}</p> : null}
      {sale ? (
        <div className="card">
          {confirmError ? <p role="alert">{t(confirmError)}</p> : null}
          {sale.status === 'VOIDED' ? <p className="m">{t('saleVoided')}</p> : null}
          <div className="sale-close">
            {sale.invoiceNumber ? (
              <p>
                {t('invoiceAssigned')} {sale.invoiceNumber}
              </p>
            ) : null}
            <p>
              {t('saleTotal')} {formatCurrency(sale.totalAmount)}
            </p>
            {sale.status === 'DRAFT' || sale.status === 'CONFIRMED' ? (
              <button
                className="btn"
                type="button"
                disabled={busy || confirming || (sale.status === 'DRAFT' && sale.items.length === 0)}
                onClick={onConfirm}
              >
                {confirming ? t('confirmingSale') : t('confirmSale')}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LineEditor({
  itemName,
  quantity,
  allowName,
  busy,
  onSave,
  onCancel
}: {
  itemName: string;
  quantity: number;
  allowName: boolean;
  busy: boolean;
  onSave: (name: string, quantity: number) => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(itemName);
  const [qty, setQty] = useState(String(quantity));

  return (
    <>
      <td className="product-cell">
        {allowName ? (
          <input value={name} disabled={busy} onChange={event => setName(event.target.value)} aria-label={t('itemName')} />
        ) : (
          itemName
        )}
      </td>
      <td>
        <input value={qty} disabled={busy} inputMode="numeric" onChange={event => setQty(event.target.value)} aria-label={t('quantity')} />
      </td>
      <td />
      <td />
      <td className="line-col">
        <button
          className="btn icon-btn icon-edit"
          type="button"
          aria-label={t('confirmLine')}
          disabled={busy}
          onClick={() => {
            const next = Number(qty);
            if (!Number.isInteger(next) || next <= 0 || !name.trim()) {
              return;
            }
            onSave(name.trim(), next);
          }}
        >
          <CheckIcon />
        </button>
      </td>
      <td className="line-col">
        <button className="btn btn-secondary icon-btn" type="button" aria-label={t('cancelLine')} disabled={busy} onClick={onCancel}>
          ×
        </button>
      </td>
    </>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1 1 0 0 0 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.96 1.96 3.75 3.75 2.12-1.8z"
      />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2zM4 6h16v2H4V6z" />
    </svg>
  );
}

function PendingCard({
  pending,
  busy,
  onAccept,
  onCancel
}: {
  pending: PendingLine;
  busy: boolean;
  onAccept: (name: string, quantity: number) => Promise<boolean>;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(pending.name);
  const [quantity, setQuantity] = useState('1');
  const lineQuantity = Number(quantity);
  const lineTotal = pending.unitPrice !== null && Number.isInteger(lineQuantity) && lineQuantity > 0 ? pending.unitPrice * lineQuantity : null;

  return (
    <form
      className="card"
      onSubmit={event => {
        event.preventDefault();
        void onAccept(name, lineQuantity).then(saved => {
          if (saved) {
            onCancel();
          }
        });
      }}
    >
      <p>{pending.name}</p>
      <label>
        {t('itemName')}
        <input value={name} disabled={busy} onChange={event => setName(event.target.value)} />
      </label>
      <label>
        {t('quantity')}
        <input inputMode="numeric" value={quantity} disabled={busy} onChange={event => setQuantity(event.target.value)} />
      </label>
      <span className="m">
        {pending.unitPrice === null ? t('noPrice') : formatCurrency(pending.unitPrice)} {t('wholesale')}
        {lineTotal !== null ? ` · ${formatCurrency(lineTotal)}` : ''}
      </span>
      <div className="row">
        <button className="btn" type="submit" disabled={busy}>
          {t('confirmLine')}
        </button>
        <button className="btn btn-secondary" type="button" disabled={busy} onClick={onCancel}>
          {t('cancelLine')}
        </button>
      </div>
    </form>
  );
}
