/**
 * Copyright (c) 2025 Waterfall
 * 
 * This source code is dual-licensed under:
 * - GNU Affero General Public License v3.0 (AGPLv3) for open source use
 * - Commercial License for proprietary use
 * 
 * See LICENSE and LICENSE.md files in the root directory for full license text.
 * For commercial licensing inquiries, contact: benjamin@waterfall-project.pro
 */

/**
 * Version server-side de retryWithBackoff
 * Identique mais sans "use client"
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  backoffFactor?: number;
  maxDelay?: number;
  shouldRetry?: (_error: Error | Response) => boolean;
  onRetry?: (_attempt: number, _delay: number, _error: Error | Response) => void;
}

export const HttpErrorType = {
  NETWORK: 'NETWORK',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  CLIENT_ERROR: 'CLIENT_ERROR',
  UNKNOWN: 'UNKNOWN'
} as const;

export type HttpErrorTypeValue = typeof HttpErrorType[keyof typeof HttpErrorType];

export class HttpError extends Error {
  constructor(
    public type: HttpErrorTypeValue,
    public status?: number,
    public _statusText?: string,
    public _response?: Response,
    message?: string
  ) {
    super(message || `HTTP Error: ${type} ${status || ''}`);
    this.name = 'HttpError';
  }

  isRetryable(): boolean {
    return (
      this.type === HttpErrorType.NETWORK ||
      this.type === HttpErrorType.SERVER_ERROR
    );
  }
}

export function classifyError(error: Error | Response): HttpError {
  if (error instanceof Error && !('status' in error)) {
    return new HttpError(HttpErrorType.NETWORK, undefined, undefined, undefined, error.message);
  }

  const response = error as Response;
  const { status, statusText } = response;

  if (status === 401) {
    return new HttpError(HttpErrorType.UNAUTHORIZED, status, statusText, response);
  }
  if (status === 403) {
    return new HttpError(HttpErrorType.FORBIDDEN, status, statusText, response);
  }
  if (status === 404) {
    return new HttpError(HttpErrorType.NOT_FOUND, status, statusText, response);
  }
  if (status >= 500) {
    return new HttpError(HttpErrorType.SERVER_ERROR, status, statusText, response);
  }
  if (status >= 400) {
    return new HttpError(HttpErrorType.CLIENT_ERROR, status, statusText, response);
  }

  return new HttpError(HttpErrorType.UNKNOWN, status, statusText, response);
}

function defaultShouldRetry(error: Error | Response): boolean {
  const httpError = classifyError(error);
  return httpError.isRetryable();
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldRetryResponse<T>(
  result: T,
  shouldRetry: (_error: Error | Response) => boolean
): boolean {
  const isResponse = result && typeof result === 'object' && 'status' in result && 'ok' in result;
  if (!isResponse) {
    return false;
  }
  
  const response = result as unknown as Response;
  return !response.ok && shouldRetry(response);
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffFactor = 2,
    maxDelay = 10000,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options;

  let lastError: Error | Response | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      
      const needsRetry = shouldRetryResponse(result, shouldRetry);
      const isLastAttempt = attempt >= maxRetries;
      
      if (needsRetry && !isLastAttempt) {
        lastError = result as unknown as Response;
      } else {
        return result;
      }
    } catch (error) {
      lastError = error as Error;
      const isLastAttempt = attempt >= maxRetries;
      const shouldNotRetry = !shouldRetry(error as Error);
      
      if (isLastAttempt || shouldNotRetry) {
        throw error;
      }
    }

    const currentDelay = Math.min(
      initialDelay * Math.pow(backoffFactor, attempt),
      maxDelay
    );

    if (onRetry && lastError) {
      onRetry(attempt + 1, currentDelay, lastError);
    }

    await delay(currentDelay);
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('Max retries reached');
}
