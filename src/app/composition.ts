import { HttpProductSearch } from '@/modules/catalog/adapters/infrastructure/httpProductSearch';
import { SearchProductsUseCase } from '@/modules/catalog/application/use-cases/searchProducts.useCase';
import { BrowserSessionStore } from '@/modules/identity/adapters/infrastructure/browserSessionStore';
import { HttpAuth } from '@/modules/identity/adapters/infrastructure/httpAuth';
import { LoginUseCase } from '@/modules/identity/application/use-cases/login.useCase';
import { LogoutUseCase } from '@/modules/identity/application/use-cases/logout.useCase';
import type { SessionStorePort } from '@/modules/identity/application/ports/sessionStore.port';
import { env } from '@/shared/config/env';
import { createHttpClient, type HttpClient } from '@/shared/infrastructure/http/httpClient';

export interface AppContainer {
  http: HttpClient;
  apiBaseUrl: string;
  sessionStore: SessionStorePort;
  login: LoginUseCase;
  logout: LogoutUseCase;
  searchProducts: SearchProductsUseCase;
}

export function createAppContainer(): AppContainer {
  const sessionStore = new BrowserSessionStore();
  const http = createHttpClient(env.apiBaseUrl, () => sessionStore.read()?.token ?? null);
  const auth = new HttpAuth(http);
  return {
    apiBaseUrl: env.apiBaseUrl,
    http,
    sessionStore,
    login: new LoginUseCase(auth, sessionStore),
    logout: new LogoutUseCase(auth, sessionStore),
    searchProducts: new SearchProductsUseCase(new HttpProductSearch(http))
  };
}
