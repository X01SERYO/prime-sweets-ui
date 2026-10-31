import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import type { SaleItemModel, SaleModel } from '@/modules/sales/domain/models/sale';
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
  const narrow = useNarrowLayout();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const editable = sale?.status === 'DRAFT' || sale?.status === 'CONFIRMED';
  const editing = Boolean(pending) || editingId !== null;
  const editingActions = useRef<EditingActions | null>(null);

  useEffect(() => {
    onEditingChange(editing);
  }, [editing, onEditingChange]);

  async function saveItem(item: SaleItemModel, name: string, quantity: number) {
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
    setOpenId(null);
    return next;
  }

  function cancelEdit() {
    setEditingId(null);
    setOpenId(null);
  }

  function toggleLine(id: string) {
    if (editingId === id) {
      return;
    }
    setOpenId(current => (current === id ? null : id));
  }

  return (
    <section className="stack">
      {loading ? <p className="m">{t('saleLoading')}</p> : null}
      {error ? <p role="alert">{t(error)}</p> : null}
      {lineError && !pending ? <p role="alert">{t(lineError)}</p> : null}
      {pending ? (
        <PendingCard
          pending={pending}
          busy={busy}
          error={lineError}
          actions={editingActions}
          onAccept={onAcceptPending}
          onCancel={onCancelPending}
        />
      ) : null}
      {narrow ? (
        <SaleLineCards
          sale={sale}
          editable={editable}
          busy={busy}
          editingId={editingId}
          openId={openId}
          actions={editingActions}
          onToggle={toggleLine}
          onEdit={id => {
            setOpenId(id);
            setEditingId(id);
          }}
          onRemove={setPendingRemoveId}
          onSave={saveItem}
          onCancelEdit={cancelEdit}
        />
      ) : (
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
              <tr key={item.id} className={editingId === item.id ? 'is-editing' : undefined}>
                {editingId === item.id ? (
                  <LineEditor
                    productCode={item.productCode}
                itemName={item.itemName}
                catalogName={item.catalogName}
                quantity={item.quantity}
                wholesalePrice={item.wholesalePrice}
                allowName={sale?.status === 'DRAFT'}
                    busy={busy}
                    actions={editingActions}
                    onSave={async (name, quantity) => saveItem(item, name, quantity)}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <>
                    <td>{item.productCode}</td>
                    <td className="product-cell">
                      <ItemName name={item.itemName} catalogName={item.catalogName} />
                    </td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.wholesalePrice)}</td>
                    <td>{formatCurrency(item.lineTotal)}</td>
                    {editable ? (
                      <>
                        <td className="line-col">
                          <button className="btn icon-btn icon-void" type="button" aria-label={t('removeItem')} disabled={busy} onClick={() => setPendingRemoveId(item.id)}>
                            <RemoveIcon />
                          </button>
                        </td>
                        <td className="line-col">
                          <button className="btn icon-btn icon-edit" type="button" aria-label={t('editSale')} disabled={busy} onClick={() => setEditingId(item.id)}>
                            <PencilIcon />
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
      )}
      {pendingRemoveId ? (
        <ConfirmDialog
          title={t('removeItem')}
          message={t('confirmRemove')}
          confirmLabel={t('saveEditing')}
          cancelLabel={t('cancelLine')}
          alignEnd
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

function SaleLineCards({
  sale,
  editable,
  busy,
  editingId,
  openId,
  actions,
  onToggle,
  onEdit,
  onRemove,
  onSave,
  onCancelEdit
}: {
  sale: SaleModel | null;
  editable: boolean;
  busy: boolean;
  editingId: string | null;
  openId: string | null;
  actions: MutableRefObject<EditingActions | null>;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onSave: (item: SaleItemModel, name: string, quantity: number) => Promise<SaleModel | null>;
  onCancelEdit: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="line-cards-wrap">
    <div className="line-cards-head">
      <span>{t('itemName')}</span>
      <span>{t('quantity')}</span>
      <span>{t('lineTotal')}</span>
      <span />
    </div>
    {!sale || sale.items.length === 0 ? <p className="line-cards-empty">{t('saleEmpty')}</p> : null}
    {sale && sale.items.length > 0 ? (
    <ul className="line-cards">
      {sale.items.map(item => {
        const open = openId === item.id || editingId === item.id;
        return (
          <li key={item.id} className={editingId === item.id ? 'card line-card is-editing' : 'card line-card'}>
            {editingId === item.id ? (
              <LineEditor
                layout="card"
                productCode={item.productCode}
                itemName={item.itemName}
                catalogName={item.catalogName}
                quantity={item.quantity}
                wholesalePrice={item.wholesalePrice}
                allowName={sale.status === 'DRAFT'}
                busy={busy}
                actions={actions}
                onSave={(name, quantity) => onSave(item, name, quantity)}
                onCancel={onCancelEdit}
              />
            ) : (
              <>
                <button
                  className={open ? 'line-summary open' : 'line-summary'}
                  type="button"
                  aria-expanded={open}
                  aria-label={`${item.itemName}, ${item.quantity}, ${formatCurrency(item.lineTotal)}. ${open ? t('hideLineDetails') : t('showLineDetails')}`}
                  onClick={() => onToggle(item.id)}
                >
                  <span className="line-summary-name">
                    <ItemName name={item.itemName} catalogName={item.catalogName} />
                  </span>
                  <span className="line-summary-qty">{item.quantity}</span>
                  <span className="line-summary-total">{formatCurrency(item.lineTotal)}</span>
                  <ChevronIcon />
                </button>
                {open ? (
                  <LineFacts
                    code={item.productCode}
                    unitPrice={formatCurrency(item.wholesalePrice)}
                    actions={editable ? (
                      <>
                        <button className="btn icon-btn icon-void" type="button" aria-label={t('removeItem')} disabled={busy} onClick={() => onRemove(item.id)}>
                          <RemoveIcon />
                        </button>
                        <button className="btn icon-btn icon-edit" type="button" aria-label={t('editSale')} disabled={busy} onClick={() => onEdit(item.id)}>
                          <PencilIcon />
                        </button>
                      </>
                    ) : null}
                  />
                ) : null}
              </>
            )}
          </li>
        );
      })}
    </ul>
    ) : null}
    </div>
  );
}

function LineFacts({ code, unitPrice, actions }: { code: string; unitPrice: string; actions?: ReactNode }) {
  const { t } = useLocale();
  return (
    <div className="line-detail">
      <dl className="line-detail-fields">
        <div>
          <dt>{t('productCode')}</dt>
          <dd>{code}</dd>
        </div>
        <div>
          <dt>{t('unitPrice')}</dt>
          <dd>{unitPrice}</dd>
        </div>
      </dl>
      {actions ? <div className="line-detail-actions">{actions}</div> : null}
    </div>
  );
}

function LineEditor({
  layout = 'row',
  productCode,
  itemName,
  catalogName,
  quantity,
  wholesalePrice,
  allowName,
  busy,
  actions,
  onSave,
  onCancel
}: {
  layout?: 'row' | 'card';
  productCode: string;
  itemName: string;
  catalogName: string;
  quantity: number;
  wholesalePrice: number;
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

  const lineQuantity = parseQuantity(qty);
  const lineTotal = lineQuantity === null ? null : Math.round(wholesalePrice * lineQuantity * 100) / 100;
  const saveButton = (
    <button className="btn icon-btn icon-edit" type="button" aria-label={t('saveEditing')} disabled={busy} onClick={save}>
      <CheckIcon />
    </button>
  );
  const cancelButton = (
    <button className="btn icon-btn icon-void" type="button" aria-label={t('cancelLine')} disabled={busy} onClick={onCancel}>
      <CloseIcon />
    </button>
  );

  if (layout === 'card') {
    return (
      <div className="line-editor pending-line">
        <label htmlFor="line-edit-name">{t('itemName')}</label>
        <input
          id="line-edit-name"
          value={name}
          disabled={busy || !allowName}
          onChange={event => setName(event.target.value)}
          aria-label={t('itemName')}
        />
        <QuantityField value={qty} disabled={busy} onChange={setQty} />
        <div className="pending-footer">
          <p className="line-prices">
            <span className="line-prices-unit">
              {t('unitPrice')} {formatCurrency(wholesalePrice)}
            </span>
            {lineTotal !== null ? (
              <span className="line-prices-total">
                {t('lineTotal')} {formatCurrency(lineTotal)}
              </span>
            ) : null}
          </p>
          <div className="pending-actions">
            {cancelButton}
            {saveButton}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <td>{productCode}</td>
      <td className="product-cell">
        {allowName ? (
          <input value={name} disabled={busy} onChange={event => setName(event.target.value)} aria-label={t('itemName')} />
        ) : (
          <ItemName name={itemName} catalogName={catalogName} />
        )}
      </td>
      <td>
        <QuantityField value={qty} disabled={busy} onChange={setQty} />
      </td>
      <td>{formatCurrency(wholesalePrice)}</td>
      <td>{lineTotal !== null ? formatCurrency(lineTotal) : ''}</td>
      <td className="line-col">{cancelButton}</td>
      <td className="line-col">{saveButton}</td>
    </>
  );
}

function ItemName({ name, catalogName }: { name: string; catalogName: string }) {
  const extra = addedName(catalogName, name);
  if (!extra) {
    return name;
  }
  return (
    <>
      {catalogName}
      <span className="item-name-added">{extra}</span>
    </>
  );
}

function addedName(catalogName: string, itemName: string): string | null {
  const base = catalogName.trim();
  if (!base || itemName === base || !itemName.startsWith(base)) {
    return null;
  }
  const extra = itemName.slice(base.length);
  return extra.trim() ? extra : null;
}

function useNarrowLayout() {
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 40rem)').matches);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 40rem)');
    const apply = () => setNarrow(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  return narrow;
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M18.3 5.71 12 12.01l6.3 6.3-1.42 1.41L10.59 13.4l-6.3 6.3-1.41-1.42 6.3-6.29-6.3-6.3 1.42-1.41 6.29 6.29 6.3-6.3z" />
    </svg>
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
  error,
  actions,
  onAccept,
  onCancel
}: {
  pending: PendingLine;
  busy: boolean;
  error: MessageKey | null;
  actions: MutableRefObject<EditingActions | null>;
  onAccept: (name: string, quantity: number) => Promise<SaleModel | null>;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(pending.name);
  const [quantity, setQuantity] = useState('1');
  const lineQuantity = parseQuantity(quantity);
  const lineTotal =
    pending.unitPrice !== null && lineQuantity !== null ? Math.round(pending.unitPrice * lineQuantity * 100) / 100 : null;

  function save() {
    if (lineQuantity === null) {
      return Promise.resolve(null);
    }
    return onAccept(name, lineQuantity);
  }

  useEffect(() => {
    actions.current = { save, cancel: onCancel };
    return () => {
      actions.current = null;
    };
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) {
      return;
    }
    dialog.showModal();
    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="modal pending-modal"
      onCancel={event => {
        event.preventDefault();
        if (!busy) {
          onCancel();
        }
      }}
      onClick={event => {
        if (event.target === event.currentTarget && !busy) {
          onCancel();
        }
      }}
    >
      <form
        className="pending-line"
        onSubmit={event => {
          event.preventDefault();
          save();
        }}
      >
        <h2 className="pending-catalog">{pending.name}</h2>
        <label htmlFor="pending-name">{t('itemName')}</label>
        <input id="pending-name" value={name} disabled={busy} onChange={event => setName(event.target.value)} />
        <QuantityField value={quantity} disabled={busy} onChange={setQuantity} />
        <div className="pending-footer">
          <p className="line-prices">
            <span className="line-prices-unit">
              {t('unitPrice')} {pending.unitPrice === null ? t('noPrice') : formatCurrency(pending.unitPrice)}
            </span>
            {lineTotal !== null ? (
              <span className="line-prices-total">
                {t('lineTotal')} {formatCurrency(lineTotal)}
              </span>
            ) : null}
          </p>
          <div className="pending-actions">
            <button className="btn btn-secondary" type="button" disabled={busy} onClick={onCancel}>
              {t('cancelLine')}
            </button>
            <button className="btn" type="submit" disabled={busy}>
              {t('confirmLine')}
            </button>
          </div>
        </div>
        {error ? <p className="pending-error" role="alert">{t(error)}</p> : null}
      </form>
    </dialog>
  );
}
