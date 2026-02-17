/**
 * Cliente HTTP para chamadas ao backend
 */

import { API_URL } from '@/config/api';

export interface ApiError {
  error: string;
  message: string;
  /** 'http' = response !ok; 'network' = fetch failed / offline / CORS; 'timeout' = request timeout */
  kind?: 'http' | 'network' | 'timeout';
  /** HTTP status when kind === 'http' */
  status?: number;
  details?: any;
  data?: unknown;
  url?: string;
}

/**
 * Faz uma requisição GET ao backend
 */
export async function getJSON<T>(
  path: string,
  options?: { headers?: Record<string, string> }
): Promise<T> {
  const url = `${API_URL}${path}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const body = data as { error?: string; message?: string; details?: unknown };
      const message = body?.message ?? body?.error ?? 'Request failed';
      throw {
        kind: 'http' as const,
        status: response.status,
        error: body?.error ?? 'Request failed',
        message: typeof message === 'string' ? message : 'Request failed',
        details: body?.details,
        data: body,
        url,
      } satisfies ApiError;
    }

    return data as T;
  } catch (error) {
    if (error && typeof error === 'object' && 'error' in error) {
      throw error;
    }
    throw {
      kind: 'network' as const,
      error: 'Network error',
      message: 'Falha de rede',
      url,
    } satisfies ApiError;
  }
}

/**
 * Helper interno para requests JSON (POST/PUT/PATCH)
 */
async function jsonRequest<T>(
  method: string,
  path: string,
  body: unknown,
  options?: { headers?: Record<string, string> },
): Promise<T> {
  const url = `${API_URL}${path}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
      body: JSON.stringify(body),
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const resBody = data as { error?: string; message?: string; details?: unknown };
      const message = resBody?.message ?? resBody?.error ?? 'Request failed';
      throw {
        kind: 'http' as const,
        status: response.status,
        error: resBody?.error ?? 'Request failed',
        message: typeof message === 'string' ? message : 'Request failed',
        details: resBody?.details,
        data: resBody,
        url,
      } satisfies ApiError;
    }

    return data as T;
  } catch (error) {
    if (error && typeof error === 'object' && 'error' in error) {
      throw error;
    }
    throw {
      kind: 'network' as const,
      error: 'Network error',
      message: 'Falha de rede',
      url,
    } satisfies ApiError;
  }
}

/**
 * Faz uma requisição POST JSON ao backend
 */
export async function postJSON<T>(
  path: string,
  body: unknown,
  options?: { headers?: Record<string, string> },
): Promise<T> {
  return jsonRequest<T>('POST', path, body, options);
}

/**
 * Faz uma requisição PUT JSON ao backend
 */
export async function putJSON<T>(
  path: string,
  body: unknown,
  options?: { headers?: Record<string, string> },
): Promise<T> {
  return jsonRequest<T>('PUT', path, body, options);
}

/**
 * Upload de arquivo via multipart/form-data
 */
export async function uploadFile<T>(
  path: string,
  formData: FormData,
  options?: { headers?: Record<string, string> },
): Promise<T> {
  const url = `${API_URL}${path}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(options?.headers ?? {}),
      },
      body: formData,
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const resBody = data as { error?: string; message?: string; details?: unknown };
      const message = resBody?.message ?? resBody?.error ?? 'Upload failed';
      throw {
        kind: 'http' as const,
        status: response.status,
        error: resBody?.error ?? 'Upload failed',
        message: typeof message === 'string' ? message : 'Upload failed',
        details: resBody?.details,
        data: resBody,
        url,
      } satisfies ApiError;
    }

    return data as T;
  } catch (error) {
    if (error && typeof error === 'object' && 'error' in error) {
      throw error;
    }
    throw {
      kind: 'network' as const,
      error: 'Network error',
      message: 'Falha de rede',
      url,
    } satisfies ApiError;
  }
}
