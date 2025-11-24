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
  shouldRetry?: (_error: Error | Response) => boolean;
  /** Callback appelé avant chaque retry */
  onRetry?: (_attempt: number, _delay: number, _error: Error | Response) => void;
}

/**
 * Types d'erreurs HTTP
 */
export const HttpErrorType = {
  NETWORK: 'NETWORK',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  CLIENT_ERROR: 'CLIENT_ERROR',
  UNKNOWN: 'UNKNOWN'
} as const;

export type HttpErrorTypeValue = typeof HttpErrorType[keyof typeof HttpErrorType];

/**
 * Classe d'erreur HTTP enrichie avec type et détails
 */
export class HttpError extends Error {
  constructor(
    public type: HttpErrorTypeValue,
    public status?: number,
    public _statusText?: string,
    public _response?: Response,
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
}

/**
 * Classifie une erreur selon son type
 */
export function classifyError(error: Error | Response): HttpError {
  // Erreur réseau (pas de Response)
  // Duck typing: si l'objet a une propriété status, c'est probablement une Response
  if (error instanceof Error && !('status' in error)) {
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
 * Vérifie si un résultat est une Response non-OK qui devrait être retry
 */
function shouldRetryResponse<T>(
  result: T,
  shouldRetry: (_error: Error | Response) => boolean
): boolean {
  // Duck typing: un objet avec status et ok est probablement une Response
  const isResponse = result && typeof result === 'object' && 'status' in result && 'ok' in result;
  if (!isResponse) {
    return false;
  }
  
  const response = result as unknown as Response;
  return !response.ok && shouldRetry(response);
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
      
      // Vérifier si c'est une Response non-OK qui devrait être retry
      const needsRetry = shouldRetryResponse(result, shouldRetry);
      const isLastAttempt = attempt >= maxRetries;
      
      if (needsRetry && !isLastAttempt) {
        lastError = result as unknown as Response;
        // Continuer pour retry
      } else {
        // Succès ou dernière tentative
        return result;
      }
    } catch (error) {
      lastError = error as Error;
      const isLastAttempt = attempt >= maxRetries;
      const shouldNotRetry = !shouldRetry(error as Error);
      
      if (isLastAttempt || shouldNotRetry) {
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
