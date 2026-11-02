import type { BrandPort } from '@/modules/catalog/application/ports/brand.port';
import type { Brand } from '@/modules/catalog/domain/models/brand';
import { CatalogInvalidError } from '@/modules/catalog/domain/errors/catalogInvalid.error';
import type { HttpClient } from '@/shared/infrastructure/http/httpClient';

interface Envelope {
  success?: unknown;
  data?: unknown;
}

function toBrand(value: unknown): Brand {
  if (!value || typeof value !== 'object') {
    throw new CatalogInvalidError();
  }
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string' || typeof record.name !== 'string' || typeof record.code !== 'string') {
    throw new CatalogInvalidError();
  }
  return { id: record.id, name: record.name, code: record.code };
}

export class HttpBrand implements BrandPort {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<Brand[]> {
    const body = await this.http.get<Envelope>('/brands');
    if (!body || body.success !== true || !Array.isArray(body.data)) {
      throw new CatalogInvalidError();
    }
    return body.data.map(item => toBrand(item));
  }

  async create(input: { name: string; code: string }): Promise<Brand> {
    const body = await this.http.post<Envelope>('/brands', input);
    if (!body || body.success !== true) {
      throw new CatalogInvalidError();
    }
    return toBrand(body.data);
  }
}
