import type { ProductSearchPort } from '@/modules/catalog/application/ports/productSearch.port';
import type { ProductHit } from '@/modules/catalog/domain/models/productHit';
import type { HttpClient } from '@/shared/infrastructure/http/httpClient';
import { toProductHit } from '@/modules/catalog/adapters/infrastructure/productMapper';

interface ProductDto {
  id?: unknown;
  alegraId?: unknown;
  name?: unknown;
  wholesalePrice?: unknown;
}

interface SearchEnvelope {
  success?: unknown;
  data?: unknown;
}

export class HttpProductSearch implements ProductSearchPort {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async search(query: string): Promise<ProductHit[]> {
    const body = await this.http.get<SearchEnvelope>(`/products/search?q=${encodeURIComponent(query)}`);
    if (!body || body.success !== true || !Array.isArray(body.data)) {
      throw new Error('Respuesta de catálogo no válida');
    }
    return body.data.map(item => toProductHit(item as ProductDto));
  }
}
