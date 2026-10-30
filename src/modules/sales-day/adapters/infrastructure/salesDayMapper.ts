import type { SalesDayModel, SalesDayStatus } from '@/modules/sales-day/domain/models/salesDay';

interface Envelope {
  success?: unknown;
  data?: unknown;
}

export function toSalesDay(body: Envelope): SalesDayModel | null {
  if (!body || body.success !== true || !body.data || typeof body.data !== 'object') {
    return null;
  }
  const data = body.data as Partial<SalesDayModel>;
  if (typeof data.id !== 'string' || typeof data.sellerId !== 'string' || typeof data.date !== 'string') {
    return null;
  }
  if (data.status !== 'OPEN' && data.status !== 'CLOSED') {
    return null;
  }
  const status: SalesDayStatus = data.status;
  return { id: data.id, sellerId: data.sellerId, date: data.date, status };
}

export function toSalesDays(data: unknown): SalesDayModel[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.flatMap(item => {
    const day = toSalesDay({ success: true, data: item });
    return day ? [day] : [];
  });
}
