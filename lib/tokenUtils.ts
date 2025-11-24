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

"use client";

/**
 * Payload JWT standard
 */
export interface JWTPayload {
  sub: string;           // User ID
  company_id?: string;   // Company ID
  exp: number;           // Expiration timestamp (seconds)
  iat: number;           // Issued at timestamp (seconds)
  [key: string]: unknown;
}

/**
 * Décode un JWT et retourne son payload
 * Ne vérifie PAS la signature (à faire côté serveur)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + (c.codePointAt(0) || 0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Récupère l'expiration d'un token en secondes depuis maintenant
 * @returns Nombre de secondes avant expiration, ou null si invalide
 */
export function getTokenExpiresIn(token: string): number | null {
  const payload = decodeJWT(token);
  if (!payload?.exp) return null;

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = payload.exp - now;

  return Math.max(0, expiresIn);
}

/**
 * Vérifie si un token est expiré
 */
export function isTokenExpired(token: string): boolean {
  const expiresIn = getTokenExpiresIn(token);
  return expiresIn === null || expiresIn <= 0;
}

/**
 * Vérifie si un token va expirer bientôt
 * @param token - JWT token
 * @param thresholdSeconds - Seuil en secondes (défaut: 60s)
 */
export function isTokenExpiringSoon(token: string, thresholdSeconds = 60): boolean {
  const expiresIn = getTokenExpiresIn(token);
  if (expiresIn === null) return true;
  return expiresIn <= thresholdSeconds;
}
