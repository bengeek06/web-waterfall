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

import logger from "@/lib/utils/logger";

let refreshTimer: NodeJS.Timeout | null = null;

/**
 * Fonction de refresh du token
 * Appelée automatiquement avant l'expiration
 */
async function refreshToken(): Promise<boolean> {
  try {
    logger.debug('Attempting token refresh...');
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      logger.error({ status: response.status, statusText: response.statusText }, 'Token refresh failed');
      try {
        const errorData = await response.json();
        logger.error({ errorData }, 'Refresh error details');
      } catch {
        // Response might not be JSON
      }
      return false;
    }

    const data = await response.json();
    logger.debug({ data }, 'Token refresh response');
    
    // Le refresh est réussi si on a un message ou access_token
    if (data.message || data.access_token) {
      logger.info('Token refreshed successfully');
      // Après un refresh réussi, re-scheduler avec le nouveau token
      await scheduleTokenRefresh();
      return true;
    }
    
    logger.error({ data }, 'Token refresh returned unexpected response');
    return false;
  } catch (error) {
    logger.error({ error }, 'Error refreshing token');
    return false;
  }
}

/**
 * Planifie le refresh automatique du token
 * Récupère l'expiration via /api/auth/token-info
 * Refresh 60 secondes avant l'expiration
 * 
 * @param refreshBeforeSeconds - Nombre de secondes avant expiration pour refresh (défaut: 60)
 */
export async function scheduleTokenRefresh(refreshBeforeSeconds = 60): Promise<void> {
  // Annuler le timer précédent s'il existe
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  try {
    // Récupérer l'info d'expiration depuis le serveur
    const response = await fetch('/api/auth/token-info', {
      credentials: 'include',
    });

    if (!response.ok) {
      logger.warn('Cannot get token info, refresh not scheduled');
      return;
    }

    const { expiresIn } = await response.json();
    
    // Si le token est déjà expiré ou invalide, ne pas scheduler
    if (expiresIn <= 0) {
      logger.warn('Token expired, cannot schedule refresh');
      return;
    }

    // Calculer quand faire le refresh (en millisecondes)
    const refreshIn = Math.max(0, expiresIn - refreshBeforeSeconds) * 1000;

    logger.info(`Token refresh scheduled in ${Math.floor(refreshIn / 1000)}s (expires in ${expiresIn}s)`);

    refreshTimer = setTimeout(async () => {
      logger.debug('Proactive token refresh triggered');
      const success = await refreshToken();
      
      if (!success) {
        logger.error('Proactive refresh failed, user may be logged out on next request');
      }
    }, refreshIn);
  } catch (error) {
    logger.error({ error }, 'Error scheduling token refresh');
  }
}

/**
 * Annule le refresh schedulé
 * Utile lors du logout
 */
export function cancelTokenRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
    logger.info('Token refresh cancelled');
  }
}

/**
 * Initialise le refresh automatique
 * À appeler au chargement de l'application (dans AuthGuard ou layout)
 */
export async function initTokenRefresh(): Promise<void> {
  await scheduleTokenRefresh();
}
