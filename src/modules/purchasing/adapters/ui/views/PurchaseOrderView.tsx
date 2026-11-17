import { useEffect, useState } from 'react';
import type { GetPurchaseOrderUseCase } from '@/modules/purchasing/application/use-cases/purchasing.useCases';
import { PurchaseInvalidError } from '@/modules/purchasing/domain/errors/purchaseInvalid.error';
import { lineCost } from '@/modules/purchasing/domain/lineCost';
import type { PurchaseOrder } from '@/modules/purchasing/domain/models/purchaseOrder';
import { useLocale } from '@/shared/i18n/useLocale';
import { formatCurrency } from '@/shared/domain/money';
import { ScreenTitle } from '@/shared/ui/BackButton';
import { StatusMessage } from '@/shared/ui/StatusMessage';
import './purchaseSheet.css';

interface PurchaseOrderViewProps {
  orderId: string;
  getPurchaseOrder: GetPurchaseOrderUseCase;
}

export function PurchaseOrderView({ orderId, getPurchaseOrder }: PurchaseOrderViewProps) {
  const { t, locale } = useLocale();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getPurchaseOrder
      .execute(orderId)
      .then(setOrder)
      .catch(caught => setError(caught instanceof PurchaseInvalidError ? caught.code : t('purchaseFailed')));
  }, [getPurchaseOrder, orderId, t]);

  return (
    <section className="stack">
      <ScreenTitle>{order ? formatOrderDate(order.createdAt, locale) : t('previousOrders')}</ScreenTitle>
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      {order && !order.hasLines ? <StatusMessage tone="info">{t('orderDetailGone')}</StatusMessage> : null}
      {order?.hasLines ? (
        <div className="purchase-sheet">
          <table>
            <thead>
              <tr>
                <th>{t('productCode')}</th>
                <th>{t('brand')}</th>
                <th>{t('lineName')}</th>
                <th>{t('unitCost')}</th>
                <th>{t('purchaseQuantity')}</th>
                <th>{t('lineCost')}</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map(line => (
                <tr key={`${line.productId}-${line.itemName}`}>
                  <td>{line.productCode}</td>
                  <td>{line.brandName}</td>
                  <td>{line.itemName}</td>
                  <td>{formatCurrency(line.unitCost)}</td>
                  <td>{line.quantity}</td>
                  <td>{formatCurrency(lineCost(line.unitCost, line.quantity))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {order ? (
        <p>
          {t('orderTotal')}: <strong>{formatCurrency(order.totalCost)}</strong>
        </p>
      ) : null}
    </section>
  );
}

function formatOrderDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  const language = locale === 'en' ? 'en-US' : 'es-CO';
  const formatted = new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Bogota'
  }).format(date);
  const cleaned = formatted.replace(',', '');
  return cleaned.charAt(0).toLocaleUpperCase(language) + cleaned.slice(1);
}
