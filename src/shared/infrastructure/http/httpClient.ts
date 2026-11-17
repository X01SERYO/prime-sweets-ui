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
  async function send<T>(path: string, init: RequestInit, options?: RequestOptions): Promise<T> {
    const token = options?.token ?? getToken?.() ?? null;
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      return await readJson<T>(response);
    } catch (error) {
      if (token && error instanceof HttpRequestError && error.status === 401) {
        onUnauthorized?.();
      }
      throw error;
    }
  }

  return {
    get<T>(path: string, options?: RequestOptions): Promise<T> {
      return send<T>(path, {}, options);
    },
    post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
      return send<T>(path, { method: 'POST', body: JSON.stringify(body) }, options);
    },
    patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
      return send<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, options);
    },
    put<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
      return send<T>(path, { method: 'PUT', body: JSON.stringify(body) }, options);
    },
    delete<T>(path: string, options?: RequestOptions): Promise<T> {
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
