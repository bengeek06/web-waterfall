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

// Mock logger before importing the module
jest.mock('@/lib/utils/logger', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { scheduleTokenRefresh, cancelTokenRefresh, initTokenRefresh } from './tokenRefreshScheduler';
import logger from '@/lib/utils/logger';

// Mock fetch globally
globalThis.fetch = jest.fn();

describe('tokenRefreshScheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    cancelTokenRefresh(); // Reset scheduler state
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('scheduleTokenRefresh', () => {
    it('should schedule token refresh before expiration', async () => {
      const mockFetch = globalThis.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expiresIn: 120 }), // Expire dans 2 minutes
      });

      await scheduleTokenRefresh(60); // Refresh 60s avant

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/token-info', {
        credentials: 'include',
      });

      // Vérifier qu'un timer a été créé
      expect(jest.getTimerCount()).toBe(1);
    });

    it('should not schedule if token info request fails', async () => {
      const mockFetch = globalThis.fetch as jest.Mock;
      const loggerWarnMock = logger.warn as jest.Mock;
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await scheduleTokenRefresh();

      expect(loggerWarnMock).toHaveBeenCalledWith('Cannot get token info, refresh not scheduled');
      expect(jest.getTimerCount()).toBe(0);
      
      loggerWarnMock.mockClear();
    });

    it('should not schedule if token is already expired', async () => {
      const mockFetch = globalThis.fetch as jest.Mock;
      const loggerWarnMock = logger.warn as jest.Mock;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expiresIn: -10 }), // Déjà expiré
      });

      await scheduleTokenRefresh();

      expect(loggerWarnMock).toHaveBeenCalledWith('Token expired, cannot schedule refresh');
      expect(jest.getTimerCount()).toBe(0);
      
      loggerWarnMock.mockClear();
    });

    it('should handle fetch errors gracefully', async () => {
      const mockFetch = globalThis.fetch as jest.Mock;
      const loggerErrorMock = logger.error as jest.Mock;
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await scheduleTokenRefresh();

      expect(loggerErrorMock).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        'Error scheduling token refresh'
      );
      expect(jest.getTimerCount()).toBe(0);
      
      loggerErrorMock.mockClear();
    });

    it('should cancel previous timer before scheduling new one', async () => {
      const mockFetch = globalThis.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ expiresIn: 120 }),
      });

      // Premier schedule
      await scheduleTokenRefresh();
      expect(jest.getTimerCount()).toBe(1);

      // Deuxième schedule devrait annuler le premier
      await scheduleTokenRefresh();
      expect(jest.getTimerCount()).toBe(1);
    });

    it('should trigger refresh at the right time', async () => {
      const mockFetch = globalThis.fetch as jest.Mock;
      const loggerDebugMock = logger.debug as jest.Mock;
      const loggerInfoMock = logger.info as jest.Mock;
      
      // Premier appel : récupérer les infos du token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expiresIn: 120 }), // Expire dans 120s
      });

      // Deuxième appel : le refresh lui-même
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Token refreshed' }),
      });

      // Troisième appel : re-schedule après refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expiresIn: 120 }),
      });

      await scheduleTokenRefresh(60); // Refresh 60s avant expiration

      // Avancer le temps de 60 secondes (120 - 60 = quand le refresh doit se déclencher)
      await jest.advanceTimersByTimeAsync(60000);

      // Vérifier que le refresh a été appelé
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      
      expect(loggerDebugMock).toHaveBeenCalledWith('Proactive token refresh triggered');
      
      loggerDebugMock.mockClear();
      loggerInfoMock.mockClear();
    });

    it('should log error if refresh fails', async () => {
      const mockFetch = globalThis.fetch as jest.Mock;
      const loggerDebugMock = logger.debug as jest.Mock;
      const loggerInfoMock = logger.info as jest.Mock;
      const loggerErrorMock = logger.error as jest.Mock;
      
      // Premier appel : récupérer les infos du token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expiresIn: 120 }),
      });

      // Deuxième appel : le refresh échoue
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await scheduleTokenRefresh(60);
      await jest.advanceTimersByTimeAsync(60000);

      expect(loggerErrorMock).toHaveBeenCalledWith(
        { status: 401, statusText: 'Unauthorized' },
        'Token refresh failed'
      );
      expect(loggerErrorMock).toHaveBeenCalledWith(
        'Proactive refresh failed, user may be logged out on next request'
      );
      
      loggerDebugMock.mockClear();
      loggerInfoMock.mockClear();
      loggerErrorMock.mockClear();
    });

    it('should reschedule after successful refresh', async () => {
      const mockFetch = globalThis.fetch as jest.Mock;
      const loggerDebugMock = logger.debug as jest.Mock;
      const loggerInfoMock = logger.info as jest.Mock;
      
      // Premier appel : récupérer les infos du token initial
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expiresIn: 120 }),
      });

      // Deuxième appel : le refresh réussit
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Token refreshed', access_token: 'new-token' }),
      });

      // Troisième appel : récupérer les infos du nouveau token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expiresIn: 3600 }), // Nouveau token expire dans 1h
      });

      await scheduleTokenRefresh(60);
      await jest.advanceTimersByTimeAsync(60000);

      // Vérifier que scheduleTokenRefresh a été rappelé
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(jest.getTimerCount()).toBe(1); // Un nouveau timer a été créé
      
      loggerDebugMock.mockClear();
      loggerInfoMock.mockClear();
    });
  });

  describe('cancelTokenRefresh', () => {
    it('should cancel scheduled refresh', async () => {
      const mockFetch = globalThis.fetch as jest.Mock;
      const loggerDebugMock = logger.debug as jest.Mock;
      const loggerInfoMock = logger.info as jest.Mock;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expiresIn: 120 }),
      });

      await scheduleTokenRefresh();
      expect(jest.getTimerCount()).toBe(1);

      cancelTokenRefresh();
      
      expect(jest.getTimerCount()).toBe(0);
      expect(loggerInfoMock).toHaveBeenCalledWith('Token refresh cancelled');
      
      loggerDebugMock.mockClear();
      loggerInfoMock.mockClear();
    });

    it('should handle cancel when no timer is active', () => {
      const loggerDebugMock = logger.debug as jest.Mock;
      const loggerInfoMock = logger.info as jest.Mock;
      
      cancelTokenRefresh();
      
      // Ne devrait pas logger si rien n'était actif
      expect(loggerInfoMock).not.toHaveBeenCalled();
      
      loggerDebugMock.mockClear();
      loggerInfoMock.mockClear();
    });
  });

  describe('initTokenRefresh', () => {
    it('should initialize token refresh', async () => {
      const mockFetch = globalThis.fetch as jest.Mock;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expiresIn: 120 }),
      });

      await initTokenRefresh();

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/token-info', {
        credentials: 'include',
      });
      expect(jest.getTimerCount()).toBe(1);
    });
  });
});
