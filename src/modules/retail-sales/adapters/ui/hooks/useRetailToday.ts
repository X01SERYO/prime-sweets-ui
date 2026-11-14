import { useCallback, useEffect, useRef, useState } from 'react';
import type { AddRetailItemUseCase } from '@/modules/retail-sales/application/use-cases/addRetailItem.useCase';
import type { GetTodayRetailDayUseCase } from '@/modules/retail-sales/application/use-cases/getTodayRetailDay.useCase';
import type { RemoveRetailItemUseCase } from '@/modules/retail-sales/application/use-cases/removeRetailItem.useCase';
import type { SetRetailItemQuantityUseCase } from '@/modules/retail-sales/application/use-cases/setRetailItemQuantity.useCase';
import { RetailInvalidError } from '@/modules/retail-sales/domain/errors/retailInvalid.error';
import type { RetailDayModel } from '@/modules/retail-sales/domain/models/retailDay';
import { retailErrorKey } from '@/modules/retail-sales/adapters/ui/hooks/retailErrorKey';
import type { MessageKey } from '@/shared/i18n/messages';

export function useRetailToday(
  getToday: GetTodayRetailDayUseCase,
  addItem: AddRetailItemUseCase,
  setQuantity: SetRetailItemQuantityUseCase,
  removeItem: RemoveRetailItemUseCase
) {
  const [day, setDay] = useState<RetailDayModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MessageKey | null>(null);
  const [notice, setNotice] = useState<MessageKey | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const shownDate = useRef<string | null>(null);

  const apply = useCallback((next: RetailDayModel) => {
    if (shownDate.current && next.businessDate !== shownDate.current) {
      setNotice('newDayStarted');
    }
    shownDate.current = next.businessDate;
    setDay(next);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      apply(await getToday.execute());
    } catch {
      setError('retailLoadFailed');
    } finally {
      setLoading(false);
    }
  }, [apply, getToday]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load();
    }, 0);
    function onVisible() {
      if (document.visibilityState === 'visible') {
        void load();
      }
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(handle);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  async function change(productId: string, action: () => Promise<RetailDayModel>) {
    setPendingId(productId);
    setError(null);
    try {
      const next = await action();
      apply(next);
      setHighlightId(productId);
      return true;
    } catch (caught) {
      if (caught instanceof RetailInvalidError && caught.code === 'RETAIL_DAY_CLOSED') {
        setError('retailClosed');
        await load();
      } else {
        setError(retailErrorKey(caught));
      }
      return false;
    } finally {
      setPendingId(null);
    }
  }

  return {
    day,
    loading,
    error,
    notice,
    dismissNotice: () => setNotice(null),
    pendingId,
    highlightId,
    reload: load,
    add: (productId: string, quantity: number) => change(productId, () => addItem.execute(productId, quantity)),
    setQuantity: (productId: string, quantity: number) => change(productId, () => setQuantity.execute(productId, quantity)),
    remove: (productId: string) => change(productId, () => removeItem.execute(productId))
  };
}
