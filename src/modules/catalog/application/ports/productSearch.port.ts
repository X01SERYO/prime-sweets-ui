import type { ProductHit } from '@/modules/catalog/domain/models/productHit';

export interface ProductSearchPort {
  search(query: string): Promise<ProductHit[]>;
}
