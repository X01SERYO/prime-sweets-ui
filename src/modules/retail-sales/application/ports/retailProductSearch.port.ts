import type { RetailProductOption } from '@/modules/retail-sales/domain/models/retailDay';

export interface RetailProductSearchPort {
  search(query: string): Promise<RetailProductOption[]>;
}
