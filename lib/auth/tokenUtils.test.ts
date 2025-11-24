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

import { decodeJWT, getTokenExpiresIn, isTokenExpired, isTokenExpiringSoon } from './tokenUtils';

describe('tokenUtils', () => {
  // Helper pour créer un JWT factice
  const createMockJWT = (payload: object): string => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = 'mock-signature';
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  };

  describe('decodeJWT', () => {
    it('should decode a valid JWT token', () => {
      const payload = { sub: '123', exp: 1234567890, iat: 1234567800 };
      const token = createMockJWT(payload);
      
      const decoded = decodeJWT(token);
      
      expect(decoded).toEqual(payload);
    });

    it('should return null for invalid token format', () => {
      expect(decodeJWT('invalid.token')).toBeNull();
      expect(decodeJWT('not-a-token')).toBeNull();
      expect(decodeJWT('')).toBeNull();
    });

    it('should return null for malformed JWT', () => {
      expect(decodeJWT('header.invalid-base64.signature')).toBeNull();
    });

    it('should handle tokens with special characters in base64url', () => {
      const payload = { sub: '123', data: 'test-data_with/special+chars' };
      const token = createMockJWT(payload);
      
      const decoded = decodeJWT(token);
      
      expect(decoded).toEqual(payload);
    });
  });

  describe('getTokenExpiresIn', () => {
    beforeEach(() => {
      // Mock Date.now() pour avoir un temps contrôlé
      jest.spyOn(Date, 'now').mockReturnValue(1234567000 * 1000); // Mock en millisecondes
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return seconds until expiration for valid token', () => {
      const payload = { exp: 1234567000 + 3600 }; // Expire dans 1 heure
      const token = createMockJWT(payload);
      
      const expiresIn = getTokenExpiresIn(token);
      
      expect(expiresIn).toBe(3600);
    });

    it('should return negative value for expired token', () => {
      const payload = { exp: 1234567000 - 3600 }; // Expiré il y a 1 heure
      const token = createMockJWT(payload);
      
      const expiresIn = getTokenExpiresIn(token);
      
      expect(expiresIn).toBe(-3600);
    });

    it('should return null for token without exp claim', () => {
      const payload = { sub: '123' }; // Pas de exp
      const token = createMockJWT(payload);
      
      const expiresIn = getTokenExpiresIn(token);
      
      expect(expiresIn).toBeNull();
    });

    it('should return null for invalid token', () => {
      expect(getTokenExpiresIn('invalid-token')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1234567000 * 1000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return true for expired token', () => {
      const payload = { exp: 1234567000 - 1 }; // Expiré il y a 1 seconde
      const token = createMockJWT(payload);
      
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return false for valid token', () => {
      const payload = { exp: 1234567000 + 3600 }; // Expire dans 1 heure
      const token = createMockJWT(payload);
      
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for token expiring exactly now', () => {
      const payload = { exp: 1234567000 }; // Expire maintenant
      const token = createMockJWT(payload);
      
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      const payload = { sub: '123' };
      const token = createMockJWT(payload);
      
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });
  });

  describe('isTokenExpiringSoon', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1234567000 * 1000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return true if token expires within threshold', () => {
      const payload = { exp: 1234567000 + 30 }; // Expire dans 30 secondes
      const token = createMockJWT(payload);
      
      expect(isTokenExpiringSoon(token, 60)).toBe(true); // Seuil de 60 secondes
    });

    it('should return false if token expires after threshold', () => {
      const payload = { exp: 1234567000 + 120 }; // Expire dans 2 minutes
      const token = createMockJWT(payload);
      
      expect(isTokenExpiringSoon(token, 60)).toBe(false); // Seuil de 60 secondes
    });

    it('should return true for already expired token', () => {
      const payload = { exp: 1234567000 - 10 }; // Expiré il y a 10 secondes
      const token = createMockJWT(payload);
      
      expect(isTokenExpiringSoon(token, 60)).toBe(true);
    });

    it('should use default threshold of 300 seconds', () => {
      const payload = { exp: 1234567000 + 200 }; // Expire dans 200 secondes
      const token = createMockJWT(payload);
      
      expect(isTokenExpiringSoon(token)).toBe(true); // < 300s par défaut
    });

    it('should return true for token without exp claim', () => {
      const payload = { sub: '123' };
      const token = createMockJWT(payload);
      
      expect(isTokenExpiringSoon(token)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpiringSoon('invalid-token')).toBe(true);
    });
  });
});
