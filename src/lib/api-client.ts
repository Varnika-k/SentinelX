/**
 * Resilient API Client for SentinelX
 * Handles retries, standardized error reporting, and request timeouts.
 */

import { logger } from './logger';

export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const { timeout = 10000, retries = 2, ...fetchOptions } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      if (attempt > 0) {
        logger.warn(`Retrying API request to ${url} (Attempt ${attempt})`);
        // Exponential backoff
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
      }

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = null;
        }
        throw new ApiError(response.status, response.statusText, errorData);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      if (err.name === 'AbortError') {
        logger.error(`API Request Timeout: ${url}`);
      } else if (err instanceof ApiError) {
        // If it's a 4xx error, don't retry, it's likely a client issue
        if (err.status >= 400 && err.status < 500) {
          throw err;
        }
        logger.error(`API Response Error (${err.status}): ${url}`, err.data);
      } else {
        logger.error(`Network or Unknown Error: ${url}`, err.message);
      }

      if (attempt === retries) break;
    }
  }

  throw lastError;
}
