import { useEffect, useState } from 'react';
import type { ListLoadSheetUseCase } from '@/modules/fulfillment-output/application/use-cases/listLoadSheet.useCase';
import { loadSheetErrorKey } from '@/modules/fulfillment-output/adapters/ui/hooks/loadSheetErrorKey';
import type { LoadSheetLineModel } from '@/modules/fulfillment-output/domain/models/loadSheetLine';
import type { MessageKey } from '@/shared/i18n/messages';

export function useLoadSheet(salesDayId: string | undefined, listLoadSheet: ListLoadSheetUseCase) {
  const [lines, setLines] = useState<LoadSheetLineModel[]>([]);
  const [loading, setLoading] = useState(Boolean(salesDayId));
  const [error, setError] = useState<MessageKey | null>(null);

  useEffect(() => {
    if (!salesDayId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    listLoadSheet
      .execute(salesDayId)
      .then(found => {
        if (!cancelled) {
          setLines(found);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setLines([]);
          setError(loadSheetErrorKey(caught, 'loadSheetFailed'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [salesDayId, listLoadSheet]);

  if (!salesDayId) {
    return { lines: [], loading: false, error: 'loadSheetMissingDay' as MessageKey };
  }

  return { lines, loading, error };
}
