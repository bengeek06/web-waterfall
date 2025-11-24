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

import { renderHook, act } from '@testing-library/react';
import { toast } from 'sonner';
import { useErrorHandler, ErrorMessages } from './useErrorHandler';
import { HttpError, HttpErrorType } from '../retryWithBackoff';

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('useErrorHandler', () => {
  const mockMessages: ErrorMessages = {
    network: 'Network error message',
    unauthorized: 'Unauthorized message',
    forbidden: 'Forbidden message',
    notFound: 'Not found message',
    serverError: 'Server error message',
    clientError: 'Client error message',
    unknown: 'Unknown error message',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleError', () => {
    it('should handle HttpError with correct message', () => {
      const { result } = renderHook(() => useErrorHandler({ messages: mockMessages }));
      const error = new HttpError(HttpErrorType.NETWORK);

      act(() => {
        result.current.handleError(error);
      });

      expect(toast.error).toHaveBeenCalledWith('Network error message', { duration: 5000 });
    });

    it('should handle regular Error as network error', () => {
      const { result } = renderHook(() => useErrorHandler({ messages: mockMessages }));
      const error = new Error('Fetch failed');

      act(() => {
        result.current.handleError(error);
      });

      // Le message original de l'erreur est ajouté au message traduit
      expect(toast.error).toHaveBeenCalledWith('Network error message\nFetch failed', { duration: 5000 });
    });

    it('should handle unknown error type', () => {
      const { result } = renderHook(() => useErrorHandler({ messages: mockMessages }));

      act(() => {
        result.current.handleError({ something: 'random' });
      });

      expect(toast.error).toHaveBeenCalledWith('Unknown error message', { duration: 5000 });
    });

    it('should show warning toast for UNAUTHORIZED errors', () => {
      const { result } = renderHook(() => useErrorHandler({ messages: mockMessages }));
      const error = new HttpError(HttpErrorType.UNAUTHORIZED, 401);

      act(() => {
        result.current.handleError(error);
      });

      expect(toast.warning).toHaveBeenCalledWith('Unauthorized message', { duration: 5000 });
    });

    it('should append server message if available', () => {
      const { result } = renderHook(() => useErrorHandler({ messages: mockMessages }));
      const error = new HttpError(
        HttpErrorType.SERVER_ERROR,
        500,
        undefined,
        undefined,
        'Database connection failed'
      );

      act(() => {
        result.current.handleError(error);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Server error message\nDatabase connection failed',
        { duration: 5000 }
      );
    });

    it('should not show toast if showToast is false', () => {
      const { result } = renderHook(() =>
        useErrorHandler({ messages: mockMessages, showToast: false })
      );
      const error = new HttpError(HttpErrorType.NETWORK);

      act(() => {
        result.current.handleError(error);
      });

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should call onError callback if provided', () => {
      const onError = jest.fn();
      const { result } = renderHook(() =>
        useErrorHandler({ messages: mockMessages, onError })
      );
      const error = new HttpError(HttpErrorType.FORBIDDEN, 403);

      act(() => {
        result.current.handleError(error);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should respect custom duration', () => {
      const { result } = renderHook(() =>
        useErrorHandler({ messages: mockMessages, duration: 3000 })
      );
      const error = new HttpError(HttpErrorType.CLIENT_ERROR, 400);

      act(() => {
        result.current.handleError(error);
      });

      expect(toast.error).toHaveBeenCalledWith('Client error message', { duration: 3000 });
    });
  });

  describe('getErrorMessage', () => {
    it('should return correct message for each error type', () => {
      const { result } = renderHook(() => useErrorHandler({ messages: mockMessages }));

      expect(result.current.getErrorMessage(new HttpError(HttpErrorType.NETWORK)))
        .toBe('Network error message');
      
      expect(result.current.getErrorMessage(new HttpError(HttpErrorType.UNAUTHORIZED, 401)))
        .toBe('Unauthorized message');
      
      expect(result.current.getErrorMessage(new HttpError(HttpErrorType.FORBIDDEN, 403)))
        .toBe('Forbidden message');
      
      expect(result.current.getErrorMessage(new HttpError(HttpErrorType.NOT_FOUND, 404)))
        .toBe('Not found message');
      
      expect(result.current.getErrorMessage(new HttpError(HttpErrorType.SERVER_ERROR, 500)))
        .toBe('Server error message');
      
      expect(result.current.getErrorMessage(new HttpError(HttpErrorType.CLIENT_ERROR, 400)))
        .toBe('Client error message');
      
      expect(result.current.getErrorMessage(new HttpError(HttpErrorType.UNKNOWN)))
        .toBe('Unknown error message');
    });
  });
});
