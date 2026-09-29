import { API_URL, REQUEST_TIMEOUT_MS } from '@/config';
                                             
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

                                                                                                                     
  get isPermanent() {
    return this.status >= 400 && this.status < 500 && this.status !== 408 && this.status !== 429;
  }
}
                                                                 
export class NetworkError extends Error {
  constructor(message = 'Could not reach the server.') {
    super(message);
    this.name = 'NetworkError';
  }
}

function buildUrl(path, query) {
  const params = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return `${API_URL}/api${path}${params.length ? `?${params.join('&')}` : ''}`;
}

export async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new NetworkError(controller.signal.aborted ? 'The server took too long to answer.' : undefined);
  } finally {
    clearTimeout(timer);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
                                                              
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.code ?? 'HTTP_ERROR',
      payload?.error?.message ?? `The server answered with status ${response.status}.`,
    );
  }
  if (payload === null) throw new ApiError(response.status, 'INVALID_RESPONSE', 'The server sent an unreadable response.');

  return { status: response.status, data: payload };
}

export function describeError(error) {
  if (error instanceof ApiError || error instanceof NetworkError) return error.message;
  return 'Something went wrong.';
}
