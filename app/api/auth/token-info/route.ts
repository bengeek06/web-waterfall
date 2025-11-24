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
import { NextResponse } from 'next/server';

/**
 * Décode un JWT et retourne son payload
 * Version serveur - ne vérifie PAS la signature
 */
function decodeJWT(token: string): { exp?: number; iat?: number; sub?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * GET /api/auth/token-info
 * Retourne les informations sur le token actuel (expiration, temps restant)
 * Sans exposer le token lui-même (httpOnly cookie)
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }

    const payload = decodeJWT(accessToken);
    
    if (!payload?.exp) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = payload.exp - now;

    return NextResponse.json({
      expiresAt: payload.exp,        // Timestamp d'expiration (seconds)
      expiresIn,                     // Secondes restantes (négatif si expiré)
      issuedAt: payload.iat,         // Quand le token a été émis
      userId: payload.sub,           // User ID
    });
  } catch (error) {
    console.error('Error reading token info:', error);
    return NextResponse.json(
      { error: 'Failed to read token information' },
      { status: 500 }
    );
  }
}
