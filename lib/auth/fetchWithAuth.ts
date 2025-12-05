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

import { retryWithBackoff, classifyError, HttpErrorType } from '@/lib/client/retryWithBackoff';
import logger from '@/lib/utils/logger';

// État partagé pour éviter les refreshs multiples simultanés
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Tente de rafraîchir le token JWT
 * @returns true si le refresh a réussi, false sinon
 */
async function refreshToken(): Promise<boolean> {
  try {
    const response = await retryWithBackoff(
      () => fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      }),
      {
        maxRetries: 2,
        initialDelay: 500,
        onRetry: (attempt, delay) => {
          logger.debug({ attempt, delay }, `Token refresh retry attempt ${attempt} in ${delay}ms`);
        }
      }
    );

    if (!response.ok) {
      const error = classifyError(response);
      logger.error({ errorType: error.type, status: error.status }, 'Token refresh failed');
      return false;
    }

    const data = await response.json();
    
    // Le refresh est réussi si on a un message ou access_token
    if (data.message || data.access_token) {
      logger.info('Token refreshed successfully');
      return true;
    }
    
    logger.error('Token refresh returned unexpected response');
    return false;
  } catch (error) {
    const httpError = error instanceof Error ? classifyError(error) : undefined;
    logger.error({ errorType: httpError?.type, error }, 'Error refreshing token');
    return false;
  }
}

/**
 * Redirige vers la page de login
 */
function redirectToLogin(): void {
  // Éviter les redirections multiples
  if (globalThis.window !== undefined && !globalThis.window.location.pathname.includes('/login')) {
    globalThis.window.location.href = '/login';
  }
}

/**
 * Wrapper autour de fetch qui gère automatiquement le refresh token sur 401
 * Avec retry automatique sur erreurs réseau et 5xx
 * 
 * @example
 * // Utilisation identique à fetch
 * const response = await fetchWithAuth('/api/users/123');
 * const data = await response.json();
 * 
 * @example
 * // Avec retry personnalisé
 * const response = await fetchWithAuth('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 *   retryOptions: { maxRetries: 5 }
 * });
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit & { 
    retryOptions?: { maxRetries?: number; initialDelay?: number };
    skipRetry?: boolean;
  }
): Promise<Response> {
  const { retryOptions, skipRetry, ...fetchInit } = init ?? {};
  
  // Fonction de fetch avec retry
  const doFetch = async (): Promise<Response> => {
    const response = await fetch(input, {
      ...fetchInit,
      credentials: fetchInit?.credentials || 'include',
    });
    
    // Si pas de 401, retourner la réponse
    if (response.status !== 401) {
      return response;
    }

    // Vérifier si c'est bien une erreur de token JWT
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

    // Tentative de refresh token
    // Si un refresh est déjà en cours, attendre qu'il se termine
    if (isRefreshing && refreshPromise) {
      const refreshSuccess = await refreshPromise;
      if (!refreshSuccess) {
        redirectToLogin();
        return response;
      }
    } else {
      // Lancer un nouveau refresh
      isRefreshing = true;
      refreshPromise = refreshToken();
      
      const refreshSuccess = await refreshPromise;
      
      isRefreshing = false;
      refreshPromise = null;

      if (!refreshSuccess) {
        redirectToLogin();
        return response;
      }
    }

    // Rejouer la requête originale avec le nouveau token
    const retryResponse = await fetch(input, {
      ...fetchInit,
      credentials: fetchInit?.credentials || 'include',
    });

    return retryResponse;
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
      // Retry uniquement sur erreurs réseau et 5xx (pas sur 401/403/404)
      return httpError.type === HttpErrorType.NETWORK || httpError.type === HttpErrorType.SERVER_ERROR;
    },
    onRetry: (attempt, delay, error) => {
      const httpError = classifyError(error);
      logger.warn({ attempt, delay, errorType: httpError.type }, `Request retry attempt ${attempt} in ${delay}ms`);
    }
  });
}

/**
 * Version de fetchWithAuth qui parse automatiquement le JSON
 * Lance une erreur enrichie si la réponse n'est pas OK
 * 
 * @throws {HttpError} Erreur enrichie avec type, status et message serveur
 */
export async function fetchWithAuthJSON<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit & { 
    retryOptions?: { maxRetries?: number; initialDelay?: number };
    skipRetry?: boolean;
  }
): Promise<T> {
  const response = await fetchWithAuth(input, init);
  
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
    
    throw httpError;
  }

  return response.json();
}
