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
import logger from '@/lib/utils/logger';

// ==================== TYPES ====================
interface JWTPayload {
  user_id?: string;
  sub?: string;  // Fallback for user_id
  company_id: string;
  exp: number;
}

// ==================== HELPERS ====================
/**
 * Get the current user ID from JWT cookie
 * @returns user_id string or null if not authenticated
 */
export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  
  if (!token) return null;
  
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    return decoded.user_id || decoded.sub || null;
  } catch (error) {
    logger.error({ error }, 'Error decoding JWT');
    return null;
  }
}

/**
 * Get the current company ID from JWT cookie
 * @returns company_id string or null if not authenticated
 */
export async function getCompanyId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  
  if (!token) return null;
  
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    return decoded.company_id || null;
  } catch (error) {
    logger.error({ error }, 'Error decoding JWT');
    return null;
  }
}

/**
 * Get user's preferred language from identity service
 * Fallback to browser locale if user not authenticated or API fails
 * @returns locale string ('en' or 'fr')
 */
export async function getUserLanguage(): Promise<'en' | 'fr'> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  
  if (!token) {
    // Not authenticated, return default locale
    return 'fr';
  }
  
  try {
    // Decode JWT to get user_id (try user_id first, fallback to sub)
    const decoded = jwtDecode<JWTPayload>(token);
    const userId = decoded.user_id || decoded.sub;
    
    if (!userId) {
      return 'fr';
    }
    
    // Use Next.js API proxy (NEVER call services directly)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/identity/users/${userId}`, {
      headers: {
        'Cookie': `access_token=${token}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      logger.error({ status: response.status, statusText: response.statusText }, 'Failed to fetch user language');
      return 'fr';
    }
    
    const user = await response.json();
    return user.language || 'fr';
  } catch (error) {
    logger.error({ error }, 'Error fetching user language');
    return 'fr';
  }
}

/**
 * Alias for getUserLanguage for consistency
 */
export async function getLocale(): Promise<'en' | 'fr'> {
  return getUserLanguage();
}

/**
 * Update user's language preference in identity service
 * @param language - The language to set ('en' or 'fr')
 * @returns true if successful, false otherwise
 */
export async function updateUserLanguage(language: 'en' | 'fr'): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  
  if (!token) {
    logger.error('Cannot update language: user not authenticated');
    return false;
  }
  
  try {
    // Decode JWT to get user_id (try user_id first, fallback to sub)
    const decoded = jwtDecode<JWTPayload>(token);
    const userId = decoded.user_id || decoded.sub;
    
    if (!userId) {
      return false;
    }
    
    // Use Next.js API proxy (NEVER call services directly)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/identity/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `access_token=${token}`,
      },
      body: JSON.stringify({ language }),
    });
    
    if (!response.ok) {
      logger.error({ status: response.status, statusText: response.statusText }, 'Failed to update user language');
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error({ error }, 'Error updating user language');
    return false;
  }
}
