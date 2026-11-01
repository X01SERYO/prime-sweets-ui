import type { CatalogProductPage, CatalogProductPort } from '@/modules/catalog/application/ports/catalogProduct.port';
import type { CatalogProduct, CatalogProductPatch } from '@/modules/catalog/domain/models/catalogProduct';
import { toCatalogProduct } from '@/modules/catalog/adapters/infrastructure/catalogProductMapper';
import { CatalogInvalidError } from '@/modules/catalog/domain/errors/catalogInvalid.error';
import { HttpRequestError, type HttpClient } from '@/shared/infrastructure/http/httpClient';

interface Envelope {
  success?: unknown;
  data?: unknown;
}

export class HttpCatalogProduct implements CatalogProductPort {
  constructor(private readonly http: HttpClient) {}

  async list(page: number, pageSize: number, query?: string): Promise<CatalogProductPage> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (query) {
      params.set('q', query);
    }
    const body = await this.http.get<Envelope>(`/products?${params.toString()}`);
    const data = body?.success === true ? body.data : null;
    if (!data || typeof data !== 'object' || !Array.isArray((data as { items?: unknown }).items)) {
      throw new CatalogInvalidError();
    }
    const pageData = data as { items: unknown[]; total?: unknown; page?: unknown; pageSize?: unknown };
    return {
      items: pageData.items.map(item => toCatalogProduct(item)),
      total: typeof pageData.total === 'number' ? pageData.total : pageData.items.length,
      page: typeof pageData.page === 'number' ? pageData.page : page,
      pageSize: typeof pageData.pageSize === 'number' ? pageData.pageSize : pageSize
    };
  }

  async update(id: string, patch: CatalogProductPatch): Promise<CatalogProduct> {
    try {
      const body = await this.http.put<Envelope>(`/products/${encodeURIComponent(id)}`, patch);
      if (!body || body.success !== true) {
        throw new CatalogInvalidError();
      }
      return toCatalogProduct(body.data);
    } catch (error) {
      if (error instanceof HttpRequestError && error.code === 'PRODUCT_INVALID') {
        throw new CatalogInvalidError();
      }
      throw error;
    }
  }
}
