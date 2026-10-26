import type { DaySaleQueryPort } from '@/modules/sales/application/ports/daySaleQuery.port';
import type { DaySaleModel } from '@/modules/sales/domain/models/daySale';

const sales: DaySaleModel[] = [
  { id: 's1', customer: 'Tienda Doña Rosa', status: 'DRAFT', quantity: 10, total: 148500, invoiceNumber: null },
  { id: 's2', customer: 'Minimercado El Vecino', status: 'CONFIRMED', quantity: 24, total: 312000, invoiceNumber: '001' },
  { id: 's3', customer: 'Supertienda La 80', status: 'VOIDED', quantity: 6, total: 90000, invoiceNumber: '002' }
];

export class SampleDaySaleQuery implements DaySaleQueryPort {
  list(): DaySaleModel[] {
    return sales;
  }
}
