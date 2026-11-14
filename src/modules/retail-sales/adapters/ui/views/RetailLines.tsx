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
      <table className="retail-table">
        <thead>
          <tr>
            <th>{t('retailCode')}</th>
            <th>{t('retailBrand')}</th>
            <th>{t('retailProduct')}</th>
            <th>{t('retailUnitPrice')}</th>
            <th>{t('retailQuantity')}</th>
            <th />
            <th />
          </tr>
        </thead>
        <tbody>
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
        </tbody>
      </table>
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
    <tr className={highlighted ? 'is-highlighted' : undefined} data-pending={pending ? 'true' : undefined}>
      <td data-label={t('retailCode')}>{item.productCode}</td>
      <td data-label={t('retailBrand')}>{item.brandName}</td>
      <td data-label={t('retailProduct')}>{item.productName}</td>
      <td data-label={t('retailUnitPrice')}>{formatCurrency(item.retailPrice)}</td>
      <td data-label={t('retailQuantity')}>
        <RetailQuantity
          value={draft}
          disabled={pending}
          onChange={setDraft}
          onCommit={value => void commit(value)}
        />
      </td>
      <td className="retail-edge">
        {!item.hasCost ? (
          <span className="retail-warn" tabIndex={0}>
            <WarningIcon />
            <span className="retail-warn-text" role="tooltip">
              {t('retailNoCost')}
            </span>
          </span>
        ) : null}
      </td>
      <td>
        <button type="button" className="btn btn-secondary retail-delete" aria-label={t('retailDelete')} disabled={pending} onClick={() => void onDelete(item.productId)}>
          🗑
        </button>
      </td>
    </tr>
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
      className="qty"
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

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 3.2 1.8 21h20.4L12 3.2zm0 6.3c.5 0 .9.4.9.9v4.2a.9.9 0 0 1-1.8 0v-4.2c0-.5.4-.9.9-.9zm0 8.8a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1z" />
    </svg>
  );
}
