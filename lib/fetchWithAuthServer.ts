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
import { redirect } from 'next/navigation';

/**
 * Version server-side de fetchWithAuth pour Server Components
 * Gère l'authentification et le refresh token côté serveur
 * 
 * @param url - URL à appeler
 * @param options - Options fetch
 * @returns Response
 * 
 * @example
 * // Dans un Server Component
 * const response = await fetchWithAuthServer('/api/identity/users/123');
 * const user = await response.json();
 */
export async function fetchWithAuthServer(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;
  
  // Si pas de token du tout, rediriger vers login
  if (!accessToken && !refreshToken) {
    redirect('/login');
  }
  
  // Première tentative avec le token actuel
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Cookie: `access_token=${accessToken}`,
    },
    cache: 'no-store', // Important pour Server Components
  });
  
  // Si pas de 401, retourner la réponse
  if (response.status !== 401) {
    return response;
  }
  
  // 401 détecté - vérifier si c'est une erreur JWT
  try {
    const clonedResponse = response.clone();
    const data = await clonedResponse.json();
    
    // Si ce n'est pas une erreur de JWT, retourner la réponse originale
    if (!data.message?.includes('JWT token')) {
      return response;
    }
  } catch {
    // Si on ne peut pas parser le JSON, retourner la réponse
    return response;
  }
  
  // Tentative de refresh du token
  if (refreshToken) {
    const refreshResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/refresh`,
      {
        method: 'POST',
        headers: {
          Cookie: `refresh_token=${refreshToken}`,
        },
        credentials: 'include',
      }
    );
    
    if (refreshResponse.ok) {
      // Récupérer le nouveau token des cookies de la réponse
      const newAccessToken = refreshResponse.headers.get('set-cookie')
        ?.split(';')
        .find(c => c.trim().startsWith('access_token='))
        ?.split('=')[1];
      
      if (newAccessToken) {
        // Rejouer la requête avec le nouveau token
        response = await fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            Cookie: `access_token=${newAccessToken}`,
          },
          cache: 'no-store',
        });
        
        return response;
      }
    }
  }
  
  // Si le refresh a échoué, rediriger vers login
  redirect('/login');
}

/**
 * Version de fetchWithAuthServer qui parse automatiquement le JSON
 * Lance une erreur si la réponse n'est pas OK
 */
export async function fetchWithAuthServerJSON<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetchWithAuthServer(url, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}
