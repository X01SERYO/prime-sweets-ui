import { useEffect, useState } from 'react';
import type { SaleModel } from '@/modules/sales/domain/models/sale';
import { formatCurrency } from '@/shared/domain/money';
import type { MessageKey } from '@/shared/i18n/messages';
import { useLocale } from '@/shared/i18n/useLocale';

interface SaleLinesProps {
  sale: SaleModel | null;
  loading: boolean;
  error: MessageKey | null;
  lineError: MessageKey | null;
  busy: boolean;
  onQuantity: (productId: string, quantity: number) => void;
  onName: (productId: string, itemName: string) => void;
  onRemove: (productId: string) => void;
}

export function SaleLines({
  sale,
  loading,
  error,
  lineError,
  busy,
  onQuantity,
  onName,
  onRemove
}: SaleLinesProps) {
  const { t } = useLocale();

  return (
    <section className="stack">
      {loading ? <p className="m">{t('saleLoading')}</p> : null}
      {error ? <p role="alert">{t(error)}</p> : null}
      {lineError ? <p role="alert">{t(lineError)}</p> : null}
      {sale ? (
        <>
          <p className="m">
            {t('saleTotal')} {formatCurrency(sale.totalAmount)} · {t('profit')} {formatCurrency(sale.totalProfit)}
          </p>
          {sale.items.length === 0 ? <p className="m">{t('saleEmpty')}</p> : null}
          <ul className="list">
            {sale.items.map(item => (
              <SaleLine
                key={item.productId}
                itemName={item.itemName}
                quantity={item.quantity}
                lineTotal={item.lineTotal}
                wholesalePrice={item.wholesalePrice}
                disabled={busy || sale.status !== 'DRAFT'}
                onQuantity={quantity => onQuantity(item.productId, quantity)}
                onName={itemName => onName(item.productId, itemName)}
                onRemove={() => onRemove(item.productId)}
              />
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

function SaleLine(props: {
  itemName: string;
  quantity: number;
  lineTotal: number;
  wholesalePrice: number;
  disabled: boolean;
  onQuantity: (quantity: number) => void;
  onName: (itemName: string) => void;
  onRemove: () => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(props.itemName);
  const [quantity, setQuantity] = useState(String(props.quantity));

  useEffect(() => {
    setName(props.itemName);
    setQuantity(String(props.quantity));
  }, [props.itemName, props.quantity]);

  return (
    <li className="card">
      <label>
        {t('itemName')}
        <input
          value={name}
          disabled={props.disabled}
          onChange={event => setName(event.target.value)}
          onBlur={() => {
            const next = name.trim();
            if (!next || next === props.itemName) {
              setName(props.itemName);
              return;
            }
            props.onName(next);
          }}
        />
      </label>
      <label>
        {t('quantity')}
        <input
          inputMode="numeric"
          value={quantity}
          disabled={props.disabled}
          onChange={event => setQuantity(event.target.value)}
          onBlur={() => {
            const next = Number(quantity);
            if (!Number.isInteger(next) || next <= 0 || next === props.quantity) {
              setQuantity(String(props.quantity));
              return;
            }
            props.onQuantity(next);
          }}
        />
      </label>
      <span className="m">
        {formatCurrency(props.wholesalePrice)} {t('wholesale')} · {formatCurrency(props.lineTotal)}
      </span>
      <button className="btn btn-secondary" type="button" disabled={props.disabled} onClick={props.onRemove}>
        {t('removeItem')}
      </button>
    </li>
  );
}
