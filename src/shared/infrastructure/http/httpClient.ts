import { log } from '@/shared/infrastructure/logging/logger';

export class HttpRequestError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'HttpRequestError';
    this.status = status;
    this.code = code;
  }
}

export interface RequestOptions {
  token?: string;
}

export interface HttpClient {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T>;
  put<T>(path: string, body: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T>;
  delete<T>(path: string, options?: RequestOptions): Promise<T>;
  url(path: string): string;
}

async function readJson<T>(response: Response): Promise<T> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const record = body && typeof body === 'object' ? (body as { error?: unknown; code?: unknown }) : undefined;
    const message = typeof record?.error === 'string' ? record.error : `HTTP ${response.status}`;
    const code = typeof record?.code === 'string' ? record.code : undefined;
    throw new HttpRequestError(response.status, message, code);
  }
  return body as T;
}

export function createHttpClient(
  baseUrl: string,
  getToken?: () => string | null,
  onUnauthorized?: () => void
): HttpClient {
  const reads = new Map<string, { at: number; promise: Promise<unknown> }>();

  function cachedGet<T>(path: string, options?: RequestOptions): Promise<T> {
    const hit = reads.get(path);
    if (hit && Date.now() - hit.at < 1000) {
      return hit.promise as Promise<T>;
    }
    const promise = send<T>(path, {}, options);
    reads.set(path, { at: Date.now(), promise });
    promise.catch(() => {
      const current = reads.get(path);
      if (current?.promise === promise) {
        reads.delete(path);
      }
    });
    return promise;
  }

  async function send<T>(path: string, init: RequestInit, options?: RequestOptions): Promise<T> {
    const token = options?.token ?? getToken?.() ?? null;
    const started = Date.now();
    const requestId = crypto.randomUUID();
    const method = init.method ?? 'GET';
    const route = path.split('?')[0] ?? path;
    log('info', 'ui.http.start', { requestId, method, path: route });
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const body = await readJson<T>(response);
      log('info', 'ui.http.end', {
        requestId,
        method,
        path: route,
        status: response.status,
        durationMs: Date.now() - started
      });
      return body;
    } catch (error) {
      if (token && error instanceof HttpRequestError && error.status === 401) {
        onUnauthorized?.();
      }
      log('error', 'ui.http.end', {
        requestId,
        method,
        path: route,
        status: error instanceof HttpRequestError ? error.status : 0,
        durationMs: Date.now() - started,
        code: error instanceof HttpRequestError ? (error.code ?? null) : null,
        errorName: error instanceof Error ? error.name : null,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  return {
    get<T>(path: string, options?: RequestOptions): Promise<T> {
      return cachedGet<T>(path, options);
    },
    post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
      reads.clear();
      return send<T>(path, { method: 'POST', body: JSON.stringify(body) }, options);
    },
    patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
      reads.clear();
      return send<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, options);
    },
    put<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
      reads.clear();
      return send<T>(path, { method: 'PUT', body: JSON.stringify(body) }, options);
    },
    delete<T>(path: string, options?: RequestOptions): Promise<T> {
      reads.clear();
      return send<T>(path, { method: 'DELETE' }, options);
    },
    url(path: string): string {
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      const base = baseUrl.replace(/\/$/, '');
      return `${base}${path.startsWith('/') ? path : `/${path}`}`;
    }
  };
}
