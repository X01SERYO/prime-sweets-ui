import { Check, ChevronRight, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import type { SaleItemModel, SaleModel } from '@/modules/sales/domain/models/sale';
import { addedSaleLineName, composeSaleLineName, groupSaleItems, previewLineTotal } from '@/modules/sales/domain/saleLineName';
import { canConfirmSale, canEditSaleLines, canRenameSaleLine } from '@/modules/sales/domain/saleStatus';
import { formatCurrency } from '@/shared/domain/money';
import type { MessageKey } from '@/shared/i18n/messages';
import { useLocale } from '@/shared/i18n/useLocale';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { StatusMessage } from '@/shared/ui/StatusMessage';
import { QuantityField } from '@/modules/sales/adapters/ui/views/QuantityField';
import { parseQuantity } from '@/modules/sales/domain/quantity';

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
  const editable = sale ? canEditSaleLines(sale.status) : false;
  const nested = Boolean(
    sale && groupSaleItems(sale.items).some(group => group.length > 1 || group.some(item => addedSaleLineName(item.catalogName, item.itemName)))
  );
  const actionColumn = editable || nested;
  const editing = Boolean(pending) || editingId !== null;
  const editingActions = useRef<EditingActions | null>(null);

  useEffect(() => {
    onEditingChange(editing);
  }, [editing, onEditingChange]);

  async function saveItem(item: SaleItemModel, name: string, quantity: number) {
    let next: SaleModel | null = sale;
    if (sale && canRenameSaleLine(sale.status) && name !== item.itemName) {
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
      {loading ? <StatusMessage tone="info">{t('saleLoading')}</StatusMessage> : null}
      {error ? <StatusMessage tone="error">{t(error)}</StatusMessage> : null}
      {lineError && !pending ? <StatusMessage tone="error">{t(lineError)}</StatusMessage> : null}
      {pending ? (
        <PendingCard
          pending={pending}
          busy={busy}
          error={lineError}
          actionsRef={editingActions}
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
          actionsRef={editingActions}
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
              <th className="num">{t('unitPrice')}</th>
              <th className="num">{t('lineTotal')}</th>
              {actionColumn ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {!sale || sale.items.length === 0 ? (
              <tr>
                <td className="lines-empty" colSpan={actionColumn ? 6 : 5}>
                  <StatusMessage tone="info">{t('saleEmpty')}</StatusMessage>
                </td>
              </tr>
            ) : null}
            {sale ? groupSaleItems(sale.items).map(group => (
              <SaleLineGroupRows
                key={group[0].id}
                group={group}
                editable={editable}
                busy={busy}
                editingId={editingId}
                allowName={canRenameSaleLine(sale.status)}
                actionsRef={editingActions}
                onEdit={setEditingId}
                onRemove={setPendingRemoveId}
                onSave={saveItem}
                onCancelEdit={cancelEdit}
                padAction={!editable && actionColumn}
              />
            )) : null}
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
        <div className="sale-dock">
          {confirmError ? <StatusMessage tone="error">{t(confirmError)}</StatusMessage> : null}
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
          {sale.status === 'VOIDED' ? <StatusMessage tone="warning">{t('saleVoided')}</StatusMessage> : null}
          <div className="sale-close">
            {sale.invoiceNumber ? (
              <p>
                {t('invoiceAssigned')} {sale.invoiceNumber}
              </p>
            ) : null}
            <p className="sale-total">
              {t('saleTotal')} {formatCurrency(sale.totalAmount)}
            </p>
            <p className="sale-summary">
              {t('saleSummary')
                .replace('{products}', String(sale.items.length))
                .replace('{units}', String(sale.items.reduce((sum, item) => sum + item.quantity, 0)))}
            </p>
            {canEditSaleLines(sale.status) ? (
              <button
                className="btn"
                type="button"
                disabled={busy || confirming || (canConfirmSale(sale.status) && sale.items.length === 0)}
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

function SaleLineGroupRows({
  group,
  editable,
  busy,
  editingId,
  allowName,
  actionsRef,
  onEdit,
  onRemove,
  onSave,
  onCancelEdit,
  padAction = false
}: {
  group: SaleItemModel[];
  editable: boolean;
  busy: boolean;
  editingId: string | null;
  allowName: boolean;
  actionsRef: MutableRefObject<EditingActions | null>;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onSave: (item: SaleItemModel, name: string, quantity: number) => Promise<SaleModel | null>;
  onCancelEdit: () => void;
  padAction?: boolean;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const head = group[0];
  const split = group.length > 1 || group.some(item => addedSaleLineName(item.catalogName, item.itemName));
  const quantity = group.reduce((sum, item) => sum + item.quantity, 0);
  const total = group.reduce((sum, item) => sum + item.lineTotal, 0);
  const samePrice = group.every(item => item.wholesalePrice === head.wholesalePrice);
  const expanded = open || group.some(item => item.id === editingId);

  if (!split) {
    const item = head;
    return (
      <SaleLineRow
        item={item}
        editable={editable}
        busy={busy}
        editing={editingId === item.id}
        allowName={allowName}
        actionsRef={actionsRef}
        onEdit={() => onEdit(item.id)}
        onRemove={() => onRemove(item.id)}
        onSave={(name, quantityValue) => onSave(item, name, quantityValue)}
        onCancelEdit={onCancelEdit}
        padAction={padAction}
      />
    );
  }

  return (
    <>
      <tr className="line-group">
        <td>{head.productCode}</td>
        <td className="product-cell">{head.catalogName || head.itemName}</td>
        <td>{quantity}</td>
        <td className="num">{samePrice ? formatCurrency(head.wholesalePrice) : ''}</td>
        <td className="num">{formatCurrency(total)}</td>
        <td className="line-col">
          <button
            className="btn icon-btn line-fold"
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? t('hideVariants') : t('showVariants')}
            onClick={() => setOpen(current => !current)}
          >
            <ChevronRight aria-hidden="true" strokeWidth={1.8} />
          </button>
        </td>
      </tr>
      {expanded ? group.map(item => (
        <SaleLineRow
          key={item.id}
          item={item}
          variant
          editable={editable}
          busy={busy}
          editing={editingId === item.id}
          allowName={allowName}
          actionsRef={actionsRef}
          onEdit={() => onEdit(item.id)}
          onRemove={() => onRemove(item.id)}
          onSave={(name, quantityValue) => onSave(item, name, quantityValue)}
          onCancelEdit={onCancelEdit}
          padAction={padAction}
        />
      )) : null}
    </>
  );
}

function SaleLineRow({
  item,
  variant,
  editable,
  busy,
  editing,
  allowName,
  actionsRef,
  onEdit,
  onRemove,
  onSave,
  onCancelEdit,
  padAction
}: {
  item: SaleItemModel;
  variant?: boolean;
  editable: boolean;
  busy: boolean;
  editing: boolean;
  allowName: boolean;
  actionsRef: MutableRefObject<EditingActions | null>;
  onEdit: () => void;
  onRemove: () => void;
  onSave: (name: string, quantity: number) => Promise<SaleModel | null>;
  onCancelEdit: () => void;
  padAction?: boolean;
}) {
  const extra = addedSaleLineName(item.catalogName, item.itemName);
  return (
    <tr className={editing ? 'is-editing' : variant ? 'line-variant' : undefined}>
      {editing ? (
        <LineEditor
          productCode={variant ? '' : item.productCode}
          itemName={item.itemName}
          catalogName={item.catalogName}
          quantity={item.quantity}
          wholesalePrice={item.wholesalePrice}
          allowName={allowName}
          busy={busy}
          actionsRef={actionsRef}
          onSave={onSave}
          onCancel={onCancelEdit}
        />
      ) : (
        <>
          <td>{variant ? '' : item.productCode}</td>
          <td className="product-cell">
            {variant ? extra || item.itemName : <ItemName name={item.itemName} catalogName={item.catalogName} />}
          </td>
          <td>{item.quantity}</td>
          <td className="num">{formatCurrency(item.wholesalePrice)}</td>
          <td className="num">{formatCurrency(item.lineTotal)}</td>
          {editable ? (
            <td className="line-col">
              <LineMenu busy={busy} onEdit={onEdit} onRemove={onRemove} />
            </td>
          ) : padAction ? <td /> : null}
        </>
      )}
    </tr>
  );
}

function LineIconActions({ busy, onEdit, onRemove }: { busy: boolean; onEdit: () => void; onRemove: () => void }) {
  const { t } = useLocale();
  return (
    <div className="line-detail-actions">
      <button className="btn icon-btn icon-edit" type="button" aria-label={t('editSale')} disabled={busy} onClick={onEdit}>
        <Pencil aria-hidden="true" strokeWidth={1.8} />
      </button>
      <button className="btn icon-btn icon-void" type="button" aria-label={t('removeItem')} disabled={busy} onClick={onRemove}>
        <Trash2 aria-hidden="true" strokeWidth={1.8} />
      </button>
    </div>
  );
}

function LineMenu({ busy, onEdit, onRemove }: { busy: boolean; onEdit: () => void; onRemove: () => void }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  return (
    <div className="line-menu" ref={rootRef}>
      <button
        className="btn icon-btn"
        type="button"
        aria-label={t('lineActions')}
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={busy}
        onClick={() => setOpen(current => !current)}
      >
        <MoreHorizontal aria-hidden="true" strokeWidth={1.8} />
      </button>
      {open ? (
        <div className="line-menu-pop is-up" role="menu">
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            {t('editSale')}
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
          >
            {t('removeItem')}
          </button>
        </div>
      ) : null}
    </div>
  );
}


function SaleLineCards({
  sale,
  editable,
  busy,
  editingId,
  openId,
  actionsRef,
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
  actionsRef: MutableRefObject<EditingActions | null>;
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
    {!sale || sale.items.length === 0 ? <StatusMessage tone="info">{t('saleEmpty')}</StatusMessage> : null}
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
                allowName={canRenameSaleLine(sale.status)}
                busy={busy}
                actionsRef={actionsRef}
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
                  <ChevronRight aria-hidden="true" strokeWidth={1.8} />
                </button>
                {open ? (
                  <LineFacts
                    code={item.productCode}
                    unitPrice={formatCurrency(item.wholesalePrice)}
                    actions={editable ? (
                      <LineIconActions busy={busy} onEdit={() => onEdit(item.id)} onRemove={() => onRemove(item.id)} />
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
  actionsRef,
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
  actionsRef: MutableRefObject<EditingActions | null>;
  onSave: (name: string, quantity: number) => Promise<SaleModel | null>;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const [variantText, setVariantText] = useState(addedSaleLineName(catalogName, itemName) ?? '');
  const [qty, setQty] = useState(String(quantity));

  function save() {
    const next = parseQuantity(qty);
    const name = composeSaleLineName(catalogName, variantText);
    if (next === null || !name.trim()) {
      return Promise.resolve(null);
    }
    return onSave(name.trim(), next);
  }

  useEffect(() => {
    actionsRef.current = { save, cancel: onCancel };
    return () => {
      actionsRef.current = null;
    };
  });

  const lineQuantity = parseQuantity(qty);
  const lineTotal = lineQuantity === null ? null : previewLineTotal(wholesalePrice, lineQuantity);
  const saveButton = (
    <button className="btn icon-btn icon-edit" type="button" aria-label={t('saveEditing')} disabled={busy} onClick={save}>
      <Check aria-hidden="true" strokeWidth={1.8} />
    </button>
  );
  const cancelButton = (
    <button className="btn icon-btn icon-void" type="button" aria-label={t('cancelLine')} disabled={busy} onClick={onCancel}>
      <X aria-hidden="true" strokeWidth={1.8} />
    </button>
  );

  if (layout === 'card') {
    return (
      <div className="line-editor pending-line">
        <label htmlFor="line-edit-name">{t('lineVariant')}</label>
        <input
          id="line-edit-name"
          value={variantText}
          disabled={busy || !allowName}
          onChange={event => setVariantText(event.target.value)}
          aria-label={t('lineVariant')}
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
          <input value={variantText} disabled={busy} onChange={event => setVariantText(event.target.value)} aria-label={t('lineVariant')} placeholder={t('lineVariant')} />
        ) : (
          <ItemName name={itemName} catalogName={catalogName} />
        )}
      </td>
      <td>
        <QuantityField value={qty} disabled={busy} onChange={setQty} />
      </td>
      <td className="num">{formatCurrency(wholesalePrice)}</td>
      <td className="num">{lineTotal !== null ? formatCurrency(lineTotal) : ''}</td>
      <td className="line-col line-edit-actions">{cancelButton}{saveButton}</td>
    </>
  );
}

function ItemName({ name, catalogName }: { name: string; catalogName: string }) {
  const extra = addedSaleLineName(catalogName, name);
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

function PendingCard({
  pending,
  busy,
  error,
  actionsRef,
  onAccept,
  onCancel
}: {
  pending: PendingLine;
  busy: boolean;
  error: MessageKey | null;
  actionsRef: MutableRefObject<EditingActions | null>;
  onAccept: (name: string, quantity: number) => Promise<SaleModel | null>;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [variant, setVariant] = useState('');
  const [quantity, setQuantity] = useState('1');
  const lineQuantity = parseQuantity(quantity);
  const lineTotal =
    pending.unitPrice !== null && lineQuantity !== null ? Math.round(pending.unitPrice * lineQuantity * 100) / 100 : null;

  function save() {
    if (lineQuantity === null) {
      return Promise.resolve(null);
    }
    return onAccept(composeSaleLineName(pending.name, variant), lineQuantity);
  }

  useEffect(() => {
    actionsRef.current = { save, cancel: onCancel };
    return () => {
      actionsRef.current = null;
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
        <h2 ref={titleRef} className="pending-catalog">
          {pending.name}
        </h2>
        <QuantityField
          value={quantity}
          disabled={busy}
          autoFocus
          inputTabIndex={1}
          stepperTabIndex={-1}
          onChange={setQuantity}
        />
        <label htmlFor="pending-variant">{t('lineVariant')}</label>
        <input
          id="pending-variant"
          value={variant}
          tabIndex={2}
          disabled={busy}
          placeholder={t('lineVariant')}
          onChange={event => setVariant(event.target.value)}
        />
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
        {error ? <StatusMessage tone="error">{t(error)}</StatusMessage> : null}
      </form>
    </dialog>
  );
}
