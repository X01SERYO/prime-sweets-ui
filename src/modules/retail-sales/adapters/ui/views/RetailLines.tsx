import { useEffect, useState } from 'react';
import type { RetailDayItem } from '@/modules/retail-sales/domain/models/retailDay';
import { isRetailQuantity, parseRetailQuantity } from '@/modules/retail-sales/domain/quantity';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';

export function RetailLines({
  items,
  pendingId,
  highlightId,
  onQuantity,
  onDelete
}: {
  items: RetailDayItem[];
  pendingId: string | null;
  highlightId: string | null;
  onQuantity: (productId: string, quantity: number) => Promise<boolean>;
  onDelete: (productId: string) => Promise<boolean>;
}) {
  const { t } = useLocale();
  return (
    <div className="retail-lines">
      <div className="retail-line retail-line-head">
        <span>{t('retailCode')}</span>
        <span>{t('retailProduct')}</span>
        <span className="retail-center">{t('retailQuantity')}</span>
        <span className="num">{t('retailUnitShort')}</span>
        <span className="num">{t('retailLineTotal')}</span>
        <span />
      </div>
      {items.map(item => (
        <RetailRow
          key={item.productId}
          item={item}
          pending={pendingId === item.productId}
          highlighted={highlightId === item.productId}
          onQuantity={onQuantity}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function RetailRow({
  item,
  pending,
  highlighted,
  onQuantity,
  onDelete
}: {
  item: RetailDayItem;
  pending: boolean;
  highlighted: boolean;
  onQuantity: (productId: string, quantity: number) => Promise<boolean>;
  onDelete: (productId: string) => Promise<boolean>;
}) {
  const { t } = useLocale();
  const [draft, setDraft] = useState(String(item.quantity));

  useEffect(() => {
    setDraft(String(item.quantity));
  }, [item.quantity]);

  async function commit(value: string) {
    const parsed = parseRetailQuantity(value);
    if (parsed === null) {
      setDraft(String(item.quantity));
      return;
    }
    if (parsed === item.quantity) {
      return;
    }
    const ok = await onQuantity(item.productId, parsed);
    if (!ok) {
      setDraft(String(item.quantity));
    }
  }

  return (
    <div className={highlighted ? 'retail-line is-highlighted' : 'retail-line'} data-pending={pending ? 'true' : undefined}>
      <span className="retail-code">{item.productCode}</span>
      <span className="retail-name">
        {item.productName}
        {!item.hasCost ? (
          <span className="retail-warn" tabIndex={0}>
            <WarningIcon />
            <span className="retail-warn-text" role="tooltip">
              {t('retailNoCost')}
            </span>
          </span>
        ) : null}
      </span>
      <RetailQuantity value={draft} disabled={pending} onChange={setDraft} onCommit={value => void commit(value)} />
      <span className="num retail-unit">{formatCurrency(item.retailPrice)}</span>
      <span className="num retail-tot">
        <b>{formatCurrency(item.totalPrice)}</b>
      </span>
      <button type="button" className="retail-delete" aria-label={t('retailDelete')} disabled={pending} onClick={() => void onDelete(item.productId)}>
        <TrashIcon />
      </button>
    </div>
  );
}

function RetailQuantity({
  value,
  disabled,
  onChange,
  onCommit
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
}) {
  const { t } = useLocale();
  const current = parseRetailQuantity(value);

  function step(delta: number) {
    const base = current ?? 1;
    const next = base + delta;
    if (!isRetailQuantity(next)) {
      return;
    }
    onChange(String(next));
    onCommit(String(next));
  }

  return (
    <div
      className="retail-stepper"
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onCommit(value);
        }
      }}
    >
      <button className="btn btn-secondary" type="button" aria-label={t('decreaseQuantity')} disabled={disabled || (current ?? 1) <= 1} onClick={() => step(-1)}>
        −
      </button>
      <input
        value={value}
        disabled={disabled}
        inputMode="numeric"
        aria-label={t('retailQuantity')}
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
      />
      <button className="btn btn-secondary" type="button" aria-label={t('increaseQuantity')} disabled={disabled} onClick={() => step(1)}>
        +
      </button>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 3.2 1.8 21h20.4L12 3.2zm0 6.3c.5 0 .9.4.9.9v4.2a.9.9 0 0 1-1.8 0v-4.2c0-.5.4-.9.9-.9zm0 8.8a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1z" />
    </svg>
  );
}
