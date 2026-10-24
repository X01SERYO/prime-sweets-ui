import { HttpProductSearch } from '@/modules/catalog/adapters/infrastructure/httpProductSearch';
import { SearchProductsUseCase } from '@/modules/catalog/application/use-cases/searchProducts.useCase';
import { env } from '@/shared/config/env';
import { createHttpClient, type HttpClient } from '@/shared/infrastructure/http/httpClient';

export interface AppContainer {
  http: HttpClient;
  apiBaseUrl: string;
  searchProducts: SearchProductsUseCase;
}

export function createAppContainer(): AppContainer {
  const http = createHttpClient(env.apiBaseUrl);
  return {
    apiBaseUrl: env.apiBaseUrl,
    http,
    searchProducts: new SearchProductsUseCase(new HttpProductSearch(http))
  };
}
