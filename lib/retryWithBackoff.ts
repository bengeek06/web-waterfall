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

export interface RetryOptions {
  /** Nombre maximum de tentatives (défaut: 3) */
  maxRetries?: number;
  /** Délai initial en millisecondes (défaut: 1000ms) */
  initialDelay?: number;
  /** Facteur multiplicateur pour chaque retry (défaut: 2) */
  backoffFactor?: number;
  /** Délai maximum en millisecondes (défaut: 10000ms) */
  maxDelay?: number;
  /** Fonction pour déterminer si on doit retry (défaut: erreurs réseau et 5xx) */
  shouldRetry?: (error: Error | Response) => boolean;
  /** Callback appelé avant chaque retry */
  onRetry?: (attempt: number, delay: number, error: Error | Response) => void;
}

/**
 * Types d'erreurs HTTP
 */
export enum HttpErrorType {
  NETWORK = 'NETWORK',           // Erreur réseau (pas de réponse)
  UNAUTHORIZED = 'UNAUTHORIZED', // 401
  FORBIDDEN = 'FORBIDDEN',       // 403
  NOT_FOUND = 'NOT_FOUND',       // 404
  SERVER_ERROR = 'SERVER_ERROR', // 5xx
  CLIENT_ERROR = 'CLIENT_ERROR', // 4xx (autres)
  UNKNOWN = 'UNKNOWN'            // Autre
}

/**
 * Classe d'erreur HTTP enrichie avec type et détails
 */
export class HttpError extends Error {
  constructor(
    public type: HttpErrorType,
    public status?: number,
    public statusText?: string,
    public response?: Response,
    message?: string
  ) {
    super(message || `HTTP Error: ${type} ${status || ''}`);
    this.name = 'HttpError';
  }

  /**
   * Détermine si l'erreur est temporaire et peut être retry
   */
  isRetryable(): boolean {
    return (
      this.type === HttpErrorType.NETWORK ||
      this.type === HttpErrorType.SERVER_ERROR
    );
  }

  /**
   * Retourne un message utilisateur friendly
   */
  getUserMessage(): string {
    switch (this.type) {
      case HttpErrorType.NETWORK:
        return 'Problème de connexion réseau. Veuillez vérifier votre connexion internet.';
      case HttpErrorType.UNAUTHORIZED:
        return 'Session expirée. Veuillez vous reconnecter.';
      case HttpErrorType.FORBIDDEN:
        return "Vous n'avez pas les permissions nécessaires pour cette action.";
      case HttpErrorType.NOT_FOUND:
        return 'Ressource non trouvée.';
      case HttpErrorType.SERVER_ERROR:
        return 'Erreur serveur. Veuillez réessayer dans quelques instants.';
      case HttpErrorType.CLIENT_ERROR:
        return 'Requête invalide.';
      default:
        return 'Une erreur est survenue.';
    }
  }
}

/**
 * Classifie une erreur selon son type
 */
export function classifyError(error: Error | Response): HttpError {
  // Erreur réseau (pas de Response)
  if (error instanceof Error && !(error instanceof Response)) {
    return new HttpError(HttpErrorType.NETWORK, undefined, undefined, undefined, error.message);
  }

  // Réponse HTTP
  const response = error as Response;
  const { status, statusText } = response;

  if (status === 401) {
    return new HttpError(HttpErrorType.UNAUTHORIZED, status, statusText, response);
  }
  
  if (status === 403) {
    return new HttpError(HttpErrorType.FORBIDDEN, status, statusText, response);
  }
  
  if (status === 404) {
    return new HttpError(HttpErrorType.NOT_FOUND, status, statusText, response);
  }
  
  if (status >= 500) {
    return new HttpError(HttpErrorType.SERVER_ERROR, status, statusText, response);
  }
  
  if (status >= 400) {
    return new HttpError(HttpErrorType.CLIENT_ERROR, status, statusText, response);
  }

  return new HttpError(HttpErrorType.UNKNOWN, status, statusText, response);
}

/**
 * Fonction par défaut pour déterminer si on doit retry
 * Retry sur erreurs réseau et erreurs serveur 5xx
 */
function defaultShouldRetry(error: Error | Response): boolean {
  const httpError = classifyError(error);
  return httpError.isRetryable();
}

/**
 * Attendre un délai donné
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exécute une fonction avec retry et backoff exponentiel
 * 
 * @example
 * const data = await retryWithBackoff(
 *   () => fetch('/api/data'),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffFactor = 2,
    maxDelay = 10000,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options;

  let lastError: Error | Response | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      
      // Si c'est une Response et qu'elle n'est pas OK, vérifier si on doit retry
      if (result instanceof Response && !result.ok) {
        if (attempt < maxRetries && shouldRetry(result)) {
          lastError = result;
          // Ne pas consommer le body pour permettre le retry
        } else {
          // Dernière tentative ou pas de retry
          return result;
        }
      } else {
        // Succès
        return result;
      }
    } catch (error) {
      lastError = error as Error;
      
      // Dernière tentative ou pas de retry
      if (attempt >= maxRetries || !shouldRetry(error as Error)) {
        throw error;
      }
    }

    // Calculer le délai avec backoff exponentiel
    const currentDelay = Math.min(
      initialDelay * Math.pow(backoffFactor, attempt),
      maxDelay
    );

    // Callback avant retry
    if (onRetry && lastError) {
      onRetry(attempt + 1, currentDelay, lastError);
    }

    // Attendre avant retry
    await delay(currentDelay);
  }

  // Ne devrait jamais arriver ici, mais au cas où
  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('Max retries reached');
}
