import type { LoadSheetQueryPort } from '@/modules/fulfillment-output/application/ports/loadSheetQuery.port';
import type { LoadSheetLineModel } from '@/modules/fulfillment-output/domain/models/loadSheetLine';

const lines: LoadSheetLineModel[] = [
  { id: 'p1', brand: 'Colombina', name: 'Bon Bon Bum Fresa x24', cost: 14200, price: 18500, quantity: 27, total: 499500, profit: 116100 },
  { id: 'p2', brand: 'Jet', name: 'Chocolatina Jet x24', cost: 17500, price: 22000, quantity: 12, total: 264000, profit: 54000 },
  { id: 'p3', brand: 'Colombina', name: 'Gomitas Trululú x12', cost: 7600, price: 9800, quantity: 15, total: 147000, profit: 33000 },
  { id: 'p4', brand: 'Ramo', name: 'De Todito Natural x12', cost: null, price: 6400, quantity: 8, total: 51200, profit: null }
];

export class SampleLoadSheetQuery implements LoadSheetQueryPort {
  list(): LoadSheetLineModel[] {
    return lines;
  }
}
