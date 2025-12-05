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

import { useCallback } from 'react';
import { toast } from 'sonner';
import { HttpError, HttpErrorType } from '@/lib/client/retryWithBackoff';
import logger from '@/lib/utils/logger';

export interface ErrorMessages {
  network: string;
  unauthorized: string;
  forbidden: string;
  notFound: string;
  serverError: string;
  clientError: string;
  unknown: string;
}

export interface ErrorHandlerOptions {
  /** Messages d'erreur traduits */
  messages: ErrorMessages;
  /** Afficher un toast automatiquement (défaut: true) */
  showToast?: boolean;
  /** Durée du toast en ms (défaut: 7000) */
  duration?: number;
  /** Action personnalisée pour certains types d'erreurs */
  onError?: (_error: HttpError) => void;
}

/**
 * Hook pour gérer les erreurs HTTP avec messages internationalisés
 * 
 * @example
 * const errorMessages = await getDictionary(locale).then(d => d.errors);
 * const { handleError } = useErrorHandler({ messages: errorMessages });
 * 
 * try {
 *   await fetchWithAuthJSON('/api/data');
 * } catch (error) {
 *   handleError(error);
 * }
 */
export function useErrorHandler(options: ErrorHandlerOptions) {
  const { messages, showToast = true, duration = 7000, onError } = options;

  /**
   * Récupère le message d'erreur traduit selon le type
   */
  const getErrorMessage = useCallback((error: HttpError): string => {
    switch (error.type) {
      case HttpErrorType.NETWORK:
        return messages.network;
      case HttpErrorType.UNAUTHORIZED:
        return messages.unauthorized;
      case HttpErrorType.FORBIDDEN:
        return messages.forbidden;
      case HttpErrorType.NOT_FOUND:
        return messages.notFound;
      case HttpErrorType.SERVER_ERROR:
        return messages.serverError;
      case HttpErrorType.CLIENT_ERROR:
        return messages.clientError;
      default:
        return messages.unknown;
    }
  }, [messages]);

  /**
   * Gère une erreur HTTP avec toast et actions personnalisées
   */
  const handleError = useCallback((error: unknown): void => {
    // Si ce n'est pas une HttpError, la convertir
    let httpError: HttpError;
    
    if (error instanceof HttpError) {
      httpError = error;
    } else if (error instanceof Error) {
      // Erreur JavaScript standard = erreur réseau
      httpError = new HttpError(HttpErrorType.NETWORK, undefined, undefined, undefined, error.message);
    } else {
      // Erreur inconnue
      httpError = new HttpError(HttpErrorType.UNKNOWN);
    }

    // Message utilisateur traduit
    const userMessage = getErrorMessage(httpError);
    
    // Utiliser le message du serveur s'il existe, sinon utiliser le message traduit générique
    const displayMessage = httpError.message && 
                          !httpError.message.startsWith('HTTP Error:') &&
                          httpError.message !== userMessage
      ? httpError.message
      : userMessage;

    // Afficher le toast si demandé
    if (showToast) {
      // Type de toast selon la sévérité
      switch (httpError.type) {
        case HttpErrorType.NETWORK:
        case HttpErrorType.SERVER_ERROR:
        case HttpErrorType.FORBIDDEN:
        case HttpErrorType.UNAUTHORIZED:
          toast.error(displayMessage, { duration });
          break;
        case HttpErrorType.NOT_FOUND:
          toast.warning(displayMessage, { duration });
          break;
        case HttpErrorType.CLIENT_ERROR:
          toast.info(displayMessage, { duration });
          break;
        default:
          toast.error(displayMessage, { duration });
      }
    }

    // Logger l'erreur pour le debugging
    logger.error({ type: httpError.type, status: httpError.status, message: httpError.message }, '[ErrorHandler]');

    // Action personnalisée
    if (onError) {
      onError(httpError);
    }
  }, [showToast, duration, onError, getErrorMessage]);

  return {
    handleError,
    getErrorMessage,
  };
}
