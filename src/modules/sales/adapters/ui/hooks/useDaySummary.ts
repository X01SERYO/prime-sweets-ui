import { useEffect, useState } from 'react';
import type { ListSalesByDeliveryDateUseCase } from '@/modules/sales/application/use-cases/listSalesByDeliveryDate.useCase';
import type { DaySaleModel } from '@/modules/sales/domain/models/daySale';

export interface DaySummary {
  drafts: number;
  confirmed: number;
  voided: number;
  confirmedTotal: number;
}

export function useDaySummary(deliveryDate: string, listSales: ListSalesByDeliveryDateUseCase) {
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    listSales
      .execute(deliveryDate)
      .then(rows => {
        if (!cancelled) {
          setSummary(summarize(rows));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummary(null);
          setFailed(true);
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
  }, [deliveryDate, listSales]);

  return { summary, loading, failed };
}

function summarize(rows: DaySaleModel[]): DaySummary {
  return rows.reduce<DaySummary>(
    (summary, row) => {
      if (row.status === 'DRAFT') summary.drafts += 1;
      if (row.status === 'CONFIRMED') {
        summary.confirmed += 1;
        summary.confirmedTotal += row.total;
      }
      if (row.status === 'VOIDED') summary.voided += 1;
      return summary;
    },
    { drafts: 0, confirmed: 0, voided: 0, confirmedTotal: 0 }
  );
}
