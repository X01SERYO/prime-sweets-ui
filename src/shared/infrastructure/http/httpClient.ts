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

export interface HttpClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
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

export function createHttpClient(baseUrl: string): HttpClient {
  return {
    async get<T>(path: string): Promise<T> {
      const response = await fetch(`${baseUrl}${path}`);
      return readJson<T>(response);
    },
    async post<T>(path: string, body: unknown): Promise<T> {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return readJson<T>(response);
    }
  };
}
