import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { SaleModel } from '@/modules/sales/domain/models/sale';
import { formatCurrency } from '@/shared/domain/money';
import type { MessageKey } from '@/shared/i18n/messages';
import { useLocale } from '@/shared/i18n/useLocale';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { parseQuantity, QuantityField } from '@/modules/sales/adapters/ui/views/QuantityField';

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
  onConfirm: (sale?: SaleModel) => void;
  pending: PendingLine | null;
  onAcceptPending: (name: string, quantity: number) => Promise<SaleModel | null>;
  onCancelPending: () => void;
  onEditingChange: (editing: boolean) => void;
  editNotice: boolean;
  onEditBlocked: () => void;
  onDismissEditNotice: () => void;
  onRemove: (productId: string) => void;
  onQuantity: (productId: string, quantity: number) => Promise<SaleModel | null>;
  onName: (productId: string, itemName: string) => Promise<SaleModel | null>;
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
  onEditingChange,
  editNotice,
  onEditBlocked,
  onDismissEditNotice,
  onRemove,
  onQuantity,
  onName
}: SaleLinesProps) {
  const { t } = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const editable = sale?.status === 'DRAFT' || sale?.status === 'CONFIRMED';
  const editing = Boolean(pending) || editingId !== null;
  const editingActions = useRef<EditingActions | null>(null);

  useEffect(() => {
    onEditingChange(editing);
  }, [editing, onEditingChange]);

  return (
    <section className="stack">
      {loading ? <p className="m">{t('saleLoading')}</p> : null}
      {error ? <p role="alert">{t(error)}</p> : null}
      {lineError ? <p role="alert">{t(lineError)}</p> : null}
      {pending ? (
        <PendingCard
          pending={pending}
          busy={busy}
          actions={editingActions}
          onAccept={onAcceptPending}
          onCancel={onCancelPending}
        />
      ) : null}
      <table className="lines">
          <thead>
            <tr>
              <th>{t('productCode')}</th>
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
            {!sale || sale.items.length === 0 ? (
              <tr>
                <td className="lines-empty" colSpan={editable ? 7 : 5}>
                  {t('saleEmpty')}
                </td>
              </tr>
            ) : null}
            {sale?.items.map(item => (
              <tr key={item.id}>
                {editingId === item.id ? (
                  <LineEditor
                    productCode={item.productCode}
                    itemName={item.itemName}
                    quantity={item.quantity}
                    allowName={sale?.status === 'DRAFT'}
                    busy={busy}
                    actions={editingActions}
                    onSave={async (name, quantity) => {
                      let next: SaleModel | null = sale;
                      if (sale?.status === 'DRAFT' && name !== item.itemName) {
                        next = await onName(item.id, name);
                        if (!next) {
                          return null;
                        }
                      }
                      if (quantity !== item.quantity) {
                        next = await onQuantity(item.id, quantity);
                        if (!next) {
                          return null;
                        }
                      }
                      setEditingId(null);
                      return next;
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <td>{item.productCode}</td>
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
      {pendingRemoveId ? (
        <ConfirmDialog
          title={t('removeItem')}
          message={t('confirmRemove')}
          confirmLabel={t('confirmLine')}
          cancelLabel={t('cancelLine')}
          busy={busy}
          onConfirm={() => {
            onRemove(pendingRemoveId);
            setPendingRemoveId(null);
          }}
          onCancel={() => setPendingRemoveId(null)}
        />
      ) : null}
      {sale ? (
        <div className="card">
          {confirmError ? <p role="alert">{t(confirmError)}</p> : null}
          {editNotice ? (
            <ConfirmDialog
              title={t('saleLineInProgressTitle')}
              message={t('saleLineInProgress')}
              confirmLabel={t('saveEditing')}
              cancelLabel={t('cancelLine')}
              onConfirm={() => {
                void editingActions.current?.save().then(saved => {
                  onDismissEditNotice();
                  if (saved) {
                    onConfirm(saved);
                  }
                });
              }}
              onCancel={() => {
                editingActions.current?.cancel();
                onDismissEditNotice();
              }}
            />
          ) : null}
          {sale.status === 'VOIDED' ? <p className="m">{t('saleVoided')}</p> : null}
          <div className="sale-close">
            {sale.invoiceNumber ? (
              <p>
                {t('invoiceAssigned')} {sale.invoiceNumber}
              </p>
            ) : null}
            <p className="sale-total">
              {t('saleTotal')} {formatCurrency(sale.totalAmount)}
            </p>
            {sale.status === 'DRAFT' || sale.status === 'CONFIRMED' ? (
              <button
                className="btn"
                type="button"
                disabled={busy || confirming || (sale.status === 'DRAFT' && sale.items.length === 0)}
                onClick={() => {
                  if (editing) {
                    onEditBlocked();
                    return;
                  }
                  onConfirm();
                }}
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

type EditingActions = { save: () => Promise<SaleModel | null>; cancel: () => void };

function LineEditor({
  productCode,
  itemName,
  quantity,
  allowName,
  busy,
  actions,
  onSave,
  onCancel
}: {
  productCode: string;
  itemName: string;
  quantity: number;
  allowName: boolean;
  busy: boolean;
  actions: MutableRefObject<EditingActions | null>;
  onSave: (name: string, quantity: number) => Promise<SaleModel | null>;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(itemName);
  const [qty, setQty] = useState(String(quantity));

  function save() {
    const next = parseQuantity(qty);
    if (next === null || !name.trim()) {
      return Promise.resolve(null);
    }
    return onSave(name.trim(), next);
  }

  useEffect(() => {
    actions.current = { save, cancel: onCancel };
    return () => {
      actions.current = null;
    };
  });

  return (
    <>
      <td>{productCode}</td>
      <td className="product-cell">
        {allowName ? (
          <input value={name} disabled={busy} onChange={event => setName(event.target.value)} aria-label={t('itemName')} />
        ) : (
          itemName
        )}
      </td>
      <td>
        <QuantityField value={qty} disabled={busy} onChange={setQty} />
      </td>
      <td />
      <td />
      <td className="line-col">
        <button className="btn icon-btn icon-edit" type="button" aria-label={t('saveEditing')} disabled={busy} onClick={save}>
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
  actions,
  onAccept,
  onCancel
}: {
  pending: PendingLine;
  busy: boolean;
  actions: MutableRefObject<EditingActions | null>;
  onAccept: (name: string, quantity: number) => Promise<SaleModel | null>;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(pending.name);
  const [quantity, setQuantity] = useState('1');
  const lineQuantity = parseQuantity(quantity);
  const lineTotal =
    pending.unitPrice !== null && lineQuantity !== null ? Math.round(pending.unitPrice * lineQuantity * 100) / 100 : null;

  function save() {
    if (lineQuantity === null) {
      return Promise.resolve(null);
    }
    return onAccept(name, lineQuantity).then(saved => {
      if (saved) {
        onCancel();
      }
      return saved;
    });
  }

  useEffect(() => {
    actions.current = { save, cancel: onCancel };
    return () => {
      actions.current = null;
    };
  });

  return (
    <form
      className="card"
      onSubmit={event => {
        event.preventDefault();
        save();
      }}
    >
      <p>{pending.name}</p>
      <div className="pending-fields">
        <label htmlFor="pending-name">{t('itemName')}</label>
        <input id="pending-name" value={name} disabled={busy} onChange={event => setName(event.target.value)} />
        <QuantityField value={quantity} disabled={busy} onChange={setQuantity} />
      </div>
      <p className="line-prices">
        <span>
          {t('unitPrice')} {pending.unitPrice === null ? t('noPrice') : formatCurrency(pending.unitPrice)}
        </span>
        {lineTotal !== null ? (
          <span className="line-prices-total">
            {t('lineTotal')} {formatCurrency(lineTotal)}
          </span>
        ) : null}
      </p>
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
