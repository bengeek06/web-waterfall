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
import { retryWithBackoff, classifyError, HttpErrorType } from './retryWithBackoffServer';

/**
 * Version server-side de fetchWithAuth pour Server Components
 * Gère l'authentification et le refresh token côté serveur
 * Avec retry automatique sur erreurs réseau et 5xx
 * 
 * @param url - URL à appeler
 * @param options - Options fetch (+ retryOptions optionnel)
 * @returns Response
 * 
 * @example
 * // Dans un Server Component
 * const response = await fetchWithAuthServer('/api/identity/users/123');
 * const user = await response.json();
 * 
 * @example
 * // Avec retry personnalisé
 * const response = await fetchWithAuthServer('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 *   retryOptions: { maxRetries: 5 }
 * });
 */
export async function fetchWithAuthServer(
  url: string,
  options?: RequestInit & { 
    retryOptions?: { maxRetries?: number; initialDelay?: number };
    skipRetry?: boolean;
  }
): Promise<Response> {
  const { retryOptions, skipRetry, ...fetchOptions } = options ?? {};
  
  const doFetch = async (): Promise<Response> => {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;
    
    // Si pas de token du tout, rediriger vers login
    if (!accessToken && !refreshToken) {
      redirect('/login');
    }
    
    // Première tentative avec le token actuel
    let response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...fetchOptions?.headers,
        Cookie: `access_token=${accessToken}`,
      },
      cache: 'no-store',
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
      return response;
    }
    
    // Tentative de refresh du token
    if (refreshToken) {
      const refreshResponse = await retryWithBackoff(
        () => fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/refresh`,
          {
            method: 'POST',
            headers: {
              Cookie: `refresh_token=${refreshToken}`,
            },
            credentials: 'include',
          }
        ),
        {
          maxRetries: 2,
          initialDelay: 500,
          onRetry: (attempt, delay) => {
            console.log(`[Server] Token refresh retry attempt ${attempt} in ${delay}ms`);
          }
        }
      );
      
      if (refreshResponse.ok) {
        const newAccessToken = refreshResponse.headers.get('set-cookie')
          ?.split(';')
          .find(c => c.trim().startsWith('access_token='))
          ?.split('=')[1];
        
        if (newAccessToken) {
          response = await fetch(url, {
            ...fetchOptions,
            headers: {
              ...fetchOptions?.headers,
              Cookie: `access_token=${newAccessToken}`,
            },
            cache: 'no-store',
          });
          
          return response;
        }
      } else {
        const error = classifyError(refreshResponse);
        console.error('[Server] Token refresh failed:', error.type, error.status);
      }
    }
    
    // Si le refresh a échoué, rediriger vers login
    redirect('/login');
  };

  // Avec ou sans retry selon l'option
  if (skipRetry) {
    return doFetch();
  }

  return retryWithBackoff(doFetch, {
    maxRetries: retryOptions?.maxRetries ?? 2,
    initialDelay: retryOptions?.initialDelay ?? 1000,
    shouldRetry: (error) => {
      const httpError = classifyError(error);
      return httpError.type === HttpErrorType.NETWORK || httpError.type === HttpErrorType.SERVER_ERROR;
    },
    onRetry: (attempt, delay, error) => {
      const httpError = classifyError(error);
      console.warn(`[Server] Request retry attempt ${attempt} in ${delay}ms (${httpError.type})`);
    }
  });
}

/**
 * Version de fetchWithAuthServer qui parse automatiquement le JSON
 * Lance une erreur enrichie si la réponse n'est pas OK
 * 
 * @throws {HttpError} Erreur enrichie avec type, status et message utilisateur
 */
export async function fetchWithAuthServerJSON<T = unknown>(
  url: string,
  options?: RequestInit & { 
    retryOptions?: { maxRetries?: number; initialDelay?: number };
    skipRetry?: boolean;
  }
): Promise<T> {
  const response = await fetchWithAuthServer(url, options);
  
  if (!response.ok) {
    const httpError = classifyError(response);
    
    // Tenter de récupérer un message d'erreur du serveur
    try {
      const errorData = await response.json();
      const serverMessage = errorData.message || errorData.error || '';
      if (serverMessage) {
        httpError.message = `HTTP ${httpError.status}: ${serverMessage}`;
      }
    } catch {
      // Pas de JSON, garder le message par défaut
    }
    
    console.error('[Server] HTTP Error:', httpError.type, httpError.status, httpError.message);
    throw httpError;
  }

  return response.json();
}
