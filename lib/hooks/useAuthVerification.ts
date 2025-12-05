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

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { AUTH_ROUTES } from "@/lib/api-routes";
import logger from '@/lib/utils/logger';

/**
 * Hook pour vérifier la validité du token JWT au chargement
 * Tente automatiquement de rafraîchir le token si nécessaire
 * Redirige vers /login en cas d'échec
 * 
 * @returns {Object} État de la vérification
 * @returns {boolean} isVerifying - true pendant la vérification
 * @returns {boolean} isAuthenticated - true si l'utilisateur est authentifié
 * 
 * @example
 * function ProtectedPage() {
 *   const { isVerifying, isAuthenticated } = useAuthVerification();
 *   
 *   if (isVerifying) {
 *     return <div>Loading...</div>;
 *   }
 *   
 *   return <div>Protected content</div>;
 * }
 */
export function useAuthVerification() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function verifyAuth() {
      try {
        // Vérifier d'abord si l'application est initialisée
        const initCheckIdentity = await fetch("/api/identity/init-app", { cache: "no-store" });
        const initCheckGuardian = await fetch("/api/guardian/init-app", { cache: "no-store" });
        
        if (!initCheckIdentity.ok || !initCheckGuardian.ok) {
          logger.warn('Cannot check initialization status');
          router.push("/");
          return;
        }

        const dataIdentity = await initCheckIdentity.json();
        const dataGuardian = await initCheckGuardian.json();

        // Si l'application n'est pas initialisée, rediriger vers /init-app
        if (!dataIdentity.initialized || !dataGuardian.initialized) {
          logger.info('Application not initialized, redirecting to /init-app');
          router.push("/init-app");
          return;
        }

        // L'application est initialisée, vérifier l'authentification
        // fetchWithAuth gère automatiquement le refresh du token en cas de 401
        const response = await fetchWithAuth(AUTH_ROUTES.verify, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          setIsAuthenticated(true);
          setIsVerifying(false);
        } else {
          // Si la requête échoue malgré la tentative de refresh, rediriger vers login
          logger.warn('Authentication verification failed, redirecting to login');
          router.push("/login");
        }
      } catch (error) {
        logger.error({ error }, 'Error during authentication verification');
        router.push("/login");
      }
    }

    verifyAuth();
  }, [router]);

  return { isVerifying, isAuthenticated };
}
