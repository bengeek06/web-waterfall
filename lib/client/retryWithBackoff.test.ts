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

import { 
  retryWithBackoff, 
  classifyError, 
  HttpError, 
  HttpErrorType 
} from './retryWithBackoff';

// Mock Response globalement pour les tests
class MockResponse {
  constructor(
    public body: unknown,
    public init?: { status?: number; statusText?: string }
  ) {}
  
  get status() {
    return this.init?.status || 200;
  }
  
  get statusText() {
    return this.init?.statusText || 'OK';
  }
  
  get ok() {
    return this.status >= 200 && this.status < 300;
  }
}

// @ts-expect-error - Mock for testing
globalThis.Response = MockResponse;

describe('retryWithBackoff', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('classifyError', () => {
    it('should classify network error', () => {
      const error = new Error('Network failure');
      const httpError = classifyError(error);

      expect(httpError.type).toBe(HttpErrorType.NETWORK);
      expect(httpError.status).toBeUndefined();
      expect(httpError.message).toBe('Network failure');
    });

    it('should classify 401 as UNAUTHORIZED', () => {
      const response = new MockResponse(null, { status: 401, statusText: 'Unauthorized' });
      const httpError = classifyError(response as unknown as Response);

      expect(httpError.type).toBe(HttpErrorType.UNAUTHORIZED);
      expect(httpError.status).toBe(401);
    });

    it('should classify 403 as FORBIDDEN', () => {
      const response = new Response(null, { status: 403 });
      const httpError = classifyError(response);

      expect(httpError.type).toBe(HttpErrorType.FORBIDDEN);
      expect(httpError.status).toBe(403);
    });

    it('should classify 404 as NOT_FOUND', () => {
      const response = new Response(null, { status: 404 });
      const httpError = classifyError(response);

      expect(httpError.type).toBe(HttpErrorType.NOT_FOUND);
      expect(httpError.status).toBe(404);
    });

    it('should classify 500 as SERVER_ERROR', () => {
      const response = new Response(null, { status: 500 });
      const httpError = classifyError(response);

      expect(httpError.type).toBe(HttpErrorType.SERVER_ERROR);
      expect(httpError.status).toBe(500);
    });

    it('should classify 503 as SERVER_ERROR', () => {
      const response = new Response(null, { status: 503 });
      const httpError = classifyError(response);

      expect(httpError.type).toBe(HttpErrorType.SERVER_ERROR);
    });

    it('should classify 400 as CLIENT_ERROR', () => {
      const response = new Response(null, { status: 400 });
      const httpError = classifyError(response);

      expect(httpError.type).toBe(HttpErrorType.CLIENT_ERROR);
      expect(httpError.status).toBe(400);
    });

    it('should classify 200 as UNKNOWN', () => {
      const response = new Response(null, { status: 200 });
      const httpError = classifyError(response);

      expect(httpError.type).toBe(HttpErrorType.UNKNOWN);
    });
  });

  describe('HttpError', () => {
    it('should identify retryable errors', () => {
      const networkError = new HttpError(HttpErrorType.NETWORK);
      const serverError = new HttpError(HttpErrorType.SERVER_ERROR, 500);
      const unauthorizedError = new HttpError(HttpErrorType.UNAUTHORIZED, 401);

      expect(networkError.isRetryable()).toBe(true);
      expect(serverError.isRetryable()).toBe(true);
      expect(unauthorizedError.isRetryable()).toBe(false);
    });

    it('should contain error type and status', () => {
      const networkError = new HttpError(HttpErrorType.NETWORK);
      expect(networkError.type).toBe(HttpErrorType.NETWORK);
      expect(networkError.status).toBeUndefined();
      
      const unauthorizedError = new HttpError(HttpErrorType.UNAUTHORIZED, 401);
      expect(unauthorizedError.type).toBe(HttpErrorType.UNAUTHORIZED);
      expect(unauthorizedError.status).toBe(401);
      
      const serverError = new HttpError(HttpErrorType.SERVER_ERROR, 500);
      expect(serverError.type).toBe(HttpErrorType.SERVER_ERROR);
      expect(serverError.status).toBe(500);
    });
  });

  describe('retryWithBackoff - success cases', () => {
    it('should return result on first success', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should return Response on success', async () => {
      const mockResponse = new Response('OK', { status: 200 });
      const fn = jest.fn().mockResolvedValue(mockResponse);

      const result = await retryWithBackoff(fn);

      expect(result).toBe(mockResponse);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('retryWithBackoff - retry on failure', () => {
    it('should retry on network error', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(fn, { maxRetries: 3, initialDelay: 100 });

      // Laisser les timers s'exécuter
      await jest.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should retry on 5xx server error', async () => {
      const fn = jest.fn()
        .mockResolvedValueOnce(new Response(null, { status: 500 }))
        .mockResolvedValueOnce(new Response(null, { status: 503 }))
        .mockResolvedValue(new Response('OK', { status: 200 }));

      const promise = retryWithBackoff(fn, { maxRetries: 3, initialDelay: 100 });

      await jest.runAllTimersAsync();

      const result = await promise;

      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(200);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on 4xx client errors', async () => {
      const fn = jest.fn().mockResolvedValue(new Response(null, { status: 404 }));

      const result = await retryWithBackoff(fn, { maxRetries: 3 });

      expect(fn).toHaveBeenCalledTimes(1);
      expect((result as Response).status).toBe(404);
    });

    it('should respect maxRetries limit', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Network error'));

      const promise = retryWithBackoff(fn, { maxRetries: 2, initialDelay: 10 });

      // Run timers and await rejection together
      const resultPromise = promise.catch(e => e);
      await jest.runAllTimersAsync();
      const error = await resultPromise;

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Network error');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('retryWithBackoff - exponential backoff', () => {
    it('should increase delay exponentially', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Network error'));
      const onRetry = jest.fn();

      const promise = retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 10,
        backoffFactor: 2,
        onRetry
      });

      const resultPromise = promise.catch(e => e);
      await jest.runAllTimersAsync();
      const error = await resultPromise;

      expect(error).toBeInstanceOf(Error);
      expect(onRetry).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, 10, expect.any(Error));
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, 20, expect.any(Error));
      expect(onRetry).toHaveBeenNthCalledWith(3, 3, 40, expect.any(Error));
    });

    it('should respect maxDelay', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Network error'));
      const onRetry = jest.fn();

      const promise = retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 10,
        backoffFactor: 2,
        maxDelay: 20,
        onRetry
      });

      const resultPromise = promise.catch(e => e);
      await jest.runAllTimersAsync();
      const error = await resultPromise;

      expect(error).toBeInstanceOf(Error);
      expect(onRetry).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, 10, expect.any(Error));
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, 20, expect.any(Error)); // Capped
      expect(onRetry).toHaveBeenNthCalledWith(3, 3, 20, expect.any(Error)); // Capped
    });
  });

  describe('retryWithBackoff - custom shouldRetry', () => {
    it('should use custom shouldRetry function', async () => {
      const fn = jest.fn().mockResolvedValue(new Response(null, { status: 404 }));
      
      // Custom shouldRetry qui retry même sur 404
      const shouldRetry = (error: Error | Response) => {
        if ('status' in error) {
          const response = error as { status: number };
          return response.status === 404;
        }
        return false;
      };

      const promise = retryWithBackoff(fn, {
        maxRetries: 2,
        initialDelay: 100,
        shouldRetry
      });

      await jest.runAllTimersAsync();

      const result = await promise;
      
      expect((result as Response).status).toBe(404);
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('retryWithBackoff - onRetry callback', () => {
    it('should call onRetry callback before each retry', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      const promise = retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 100,
        onRetry
      });

      await jest.runAllTimersAsync();
      
      const result = await promise;

      expect(result).toBe('success');
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, 100, expect.objectContaining({ message: 'Error 1' }));
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, 200, expect.objectContaining({ message: 'Error 2' }));
    });
  });
});
