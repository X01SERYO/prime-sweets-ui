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
  delete<T>(path: string, options?: RequestOptions): Promise<T>;
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

export function createHttpClient(baseUrl: string, getToken?: () => string | null): HttpClient {
  function headers(options?: RequestOptions): HeadersInit {
    const token = options?.token ?? getToken?.() ?? null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  return {
    async get<T>(path: string, options?: RequestOptions): Promise<T> {
      const response = await fetch(`${baseUrl}${path}`, { headers: headers(options) });
      return readJson<T>(response);
    },
    async post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: headers(options),
        body: JSON.stringify(body)
      });
      return readJson<T>(response);
    },
    async put<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'PUT',
        headers: headers(options),
        body: JSON.stringify(body)
      });
      return readJson<T>(response);
    },
    async delete<T>(path: string, options?: RequestOptions): Promise<T> {
      const response = await fetch(`${baseUrl}${path}`, { method: 'DELETE', headers: headers(options) });
      return readJson<T>(response);
    }
  };
}
