import type { AddRetailItemUseCase } from '@/modules/retail-sales/application/use-cases/addRetailItem.useCase';
import type { GetTodayRetailDayUseCase } from '@/modules/retail-sales/application/use-cases/getTodayRetailDay.useCase';
import type { RemoveRetailItemUseCase } from '@/modules/retail-sales/application/use-cases/removeRetailItem.useCase';
import type { SearchRetailProductsUseCase } from '@/modules/retail-sales/application/use-cases/searchRetailProducts.useCase';
import type { SetRetailItemQuantityUseCase } from '@/modules/retail-sales/application/use-cases/setRetailItemQuantity.useCase';
import { useRetailToday } from '@/modules/retail-sales/adapters/ui/hooks/useRetailToday';
import { RetailLines } from '@/modules/retail-sales/adapters/ui/views/RetailLines';
import { RetailProductPicker } from '@/modules/retail-sales/adapters/ui/views/RetailProductPicker';
import { RetailTotals } from '@/modules/retail-sales/adapters/ui/views/RetailTotals';
import { useLocale } from '@/shared/i18n/useLocale';
import { StatusMessage } from '@/shared/ui/StatusMessage';
import './retail.css';

export function RetailTodayView({
  getToday,
  searchProducts,
  addItem,
  setQuantity,
  removeItem
}: {
  getToday: GetTodayRetailDayUseCase;
  searchProducts: SearchRetailProductsUseCase;
  addItem: AddRetailItemUseCase;
  setQuantity: SetRetailItemQuantityUseCase;
  removeItem: RemoveRetailItemUseCase;
}) {
  const { t, locale } = useLocale();
  const today = useRetailToday(getToday, addItem, setQuantity, removeItem);
  const day = today.day;
  const closed = day !== null && !day.editable;

  return (
    <div className="retail-today">
      {today.loading && !day ? <StatusMessage tone="info">{t('retailLoading')}</StatusMessage> : null}
      {today.error ? <StatusMessage tone="error">{t(today.error)}</StatusMessage> : null}
      {today.notice ? (
        <StatusMessage tone="info">{t(today.notice)}</StatusMessage>
      ) : null}
      {day ? (
        <>
          {closed ? (
            <div className="retail-closed-note">
              <p>{t('retailClosed')}</p>
              {day.reviewedByName || day.reviewedAt ? (
                <p className="retail-review-meta">
                  {day.reviewedByName ? (
                    <span>
                      <small>{t('retailReviewedBy')}</small>
                      <strong>{day.reviewedByName}</strong>
                    </span>
                  ) : null}
                  {day.reviewedAt ? (
                    <span>
                      <small>{t('retailReviewedAt')}</small>
                      <strong>{new Date(day.reviewedAt).toLocaleString(locale === 'en' ? 'en' : 'es-CO')}</strong>
                    </span>
                  ) : null}
                </p>
              ) : null}
            </div>
          ) : (
            <RetailProductPicker searchProducts={searchProducts} onAdd={today.add} />
          )}
          {day.items.length === 0 ? <StatusMessage tone="info">{t('retailEmpty')}</StatusMessage> : null}
          {day.items.length > 0 && !closed ? (
            <RetailLines
              items={day.items}
              pendingId={today.pendingId}
              highlightId={today.highlightId}
              onQuantity={today.setQuantity}
              onDelete={today.remove}
            />
          ) : null}
          <RetailTotals sold={day.totalAmount} profit={day.totalProfit} />
        </>
      ) : null}
    </div>
  );
}
