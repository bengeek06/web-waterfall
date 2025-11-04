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

// État partagé pour éviter les refreshs multiples simultanés
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Tente de rafraîchir le token JWT
 * @returns true si le refresh a réussi, false sinon
 */
async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error refreshing token:', error);
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
 * 
 * @example
 * // Utilisation identique à fetch
 * const response = await fetchWithAuth('/api/users/123');
 * const data = await response.json();
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // Première tentative
  let response = await fetch(input, {
    ...init,
    credentials: init?.credentials || 'include', // Toujours inclure les cookies
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
  response = await fetch(input, {
    ...init,
    credentials: init?.credentials || 'include',
  });

  return response;
}

/**
 * Version de fetchWithAuth qui parse automatiquement le JSON
 * Lance une erreur si la réponse n'est pas OK
 */
export async function fetchWithAuthJSON<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetchWithAuth(input, init);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}
