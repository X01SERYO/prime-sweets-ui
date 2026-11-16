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
  const [sales, setSales] = useState<DaySaleModel[]>([]);
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
          setSales(rows);
          setSummary(summarize(rows));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSales([]);
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

  return { summary, sales, loading, failed };
}

export function useWeekSaleCounts(dates: string[], listSales: ListSalesByDeliveryDateUseCase) {
  const key = dates.join(',');
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      dates.map(async date => {
        const rows = await listSales.execute(date);
        return [date, rows.filter(sale => sale.status !== 'VOIDED').length] as const;
      })
    )
      .then(rows => {
        if (!cancelled) {
          setCounts(Object.fromEntries(rows));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCounts({});
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key, listSales]);

  return counts;
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
