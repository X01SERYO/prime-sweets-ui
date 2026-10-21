import { env } from '@/shared/config/env';
import { createHttpClient, type HttpClient } from '@/shared/infrastructure/http/httpClient';

export interface AppContainer {
  http: HttpClient;
  apiBaseUrl: string;
}

export function createAppContainer(): AppContainer {
  return {
    apiBaseUrl: env.apiBaseUrl,
    http: createHttpClient(env.apiBaseUrl),
  };
}
