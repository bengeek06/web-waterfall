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

import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import { getUserId, getCompanyId, getUserLanguage, updateUserLanguage } from './locale';

// Mock dependencies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

global.fetch = jest.fn();

describe('lib/locale', () => {
  const mockCookies = cookies as jest.Mock;
  const mockJwtDecode = jwtDecode as jest.Mock;
  const mockFetch = global.fetch as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
  });

  describe('getUserId', () => {
    it('should return user_id from valid JWT', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      });
      mockJwtDecode.mockReturnValue({ user_id: 'user-123', company_id: 'company-456' });

      const result = await getUserId();

      expect(result).toBe('user-123');
      expect(mockJwtDecode).toHaveBeenCalledWith('valid-token');
    });

    it('should return null if no token cookie', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue(undefined),
      });

      const result = await getUserId();

      expect(result).toBeNull();
      expect(mockJwtDecode).not.toHaveBeenCalled();
    });

    it('should return null if JWT decode fails', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: 'invalid-token' }),
      });
      mockJwtDecode.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await getUserId();

      expect(result).toBeNull();
    });
  });

  describe('getCompanyId', () => {
    it('should return company_id from valid JWT', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      });
      mockJwtDecode.mockReturnValue({ user_id: 'user-123', company_id: 'company-456' });

      const result = await getCompanyId();

      expect(result).toBe('company-456');
      expect(mockJwtDecode).toHaveBeenCalledWith('valid-token');
    });

    it('should return null if no token cookie', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue(undefined),
      });

      const result = await getCompanyId();

      expect(result).toBeNull();
    });
  });

  describe('getUserLanguage', () => {
    it('should return user language from API', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      });
      mockJwtDecode.mockReturnValue({ user_id: 'user-123' });
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ language: 'en' }),
      });

      const result = await getUserLanguage();

      expect(result).toBe('en');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/identity/users/user-123',
        expect.objectContaining({
          headers: expect.objectContaining({
            Cookie: 'access_token=valid-token',
          }),
          cache: 'no-store',
        })
      );
    });

    it('should return "fr" (default) if user not authenticated', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue(undefined),
      });

      const result = await getUserLanguage();

      expect(result).toBe('fr');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return "fr" (default) if API call fails', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      });
      mockJwtDecode.mockReturnValue({ user_id: 'user-123' });
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      const result = await getUserLanguage();

      expect(result).toBe('fr');
    });

    it('should return "fr" (default) if fetch throws', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      });
      mockJwtDecode.mockReturnValue({ user_id: 'user-123' });
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await getUserLanguage();

      expect(result).toBe('fr');
    });

    it('should return "fr" (default) if user has no language set', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      });
      mockJwtDecode.mockReturnValue({ user_id: 'user-123' });
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ language: null }),
      });

      const result = await getUserLanguage();

      expect(result).toBe('fr');
    });
  });

  describe('updateUserLanguage', () => {
    it('should update user language successfully', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      });
      mockJwtDecode.mockReturnValue({ user_id: 'user-123' });
      mockFetch.mockResolvedValue({ ok: true });

      const result = await updateUserLanguage('en');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/identity/users/user-123',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Cookie: 'access_token=valid-token',
          }),
          body: JSON.stringify({ language: 'en' }),
        })
      );
    });

    it('should return false if user not authenticated', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue(undefined),
      });

      const result = await updateUserLanguage('en');

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return false if API call fails', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      });
      mockJwtDecode.mockReturnValue({ user_id: 'user-123' });
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const result = await updateUserLanguage('en');

      expect(result).toBe(false);
    });

    it('should return false if fetch throws', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      });
      mockJwtDecode.mockReturnValue({ user_id: 'user-123' });
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await updateUserLanguage('fr');

      expect(result).toBe(false);
    });
  });
});
