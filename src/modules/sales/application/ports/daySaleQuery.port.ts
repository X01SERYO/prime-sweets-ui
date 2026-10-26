import type { DaySaleModel } from '@/modules/sales/domain/models/daySale';

export interface DaySaleQueryPort {
  list(): DaySaleModel[];
}
