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

import React, { useEffect } from "react";
import { useAuthVerification } from "@/lib/hooks";
import { initTokenRefresh, cancelTokenRefresh } from "@/lib/tokenRefreshScheduler";

interface AuthGuardProps {
  readonly children: React.ReactNode;
}

/**
 * Composant qui vérifie l'authentification avant d'afficher le contenu
 * Gère automatiquement le refresh du token et la redirection vers /login si nécessaire
 * Initialise le refresh proactif du token quand l'utilisateur est authentifié
 */
export default function AuthGuard({ children }: Readonly<AuthGuardProps>) {
  const { isVerifying, isAuthenticated } = useAuthVerification();

  // Initialiser le refresh proactif du token quand authentifié
  useEffect(() => {
    if (isAuthenticated) {
      initTokenRefresh();
    }

    // Cleanup : annuler le scheduler au démontage
    return () => {
      cancelTokenRefresh();
    };
  }, [isAuthenticated]);

  // Afficher un loader pendant la vérification
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--waterfall-bg-light)] to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--waterfall-primary-dark)] mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l&apos;authentification...</p>
        </div>
      </div>
    );
  }

  // Si authentifié, afficher le contenu
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Si non authentifié, le hook redirige automatiquement vers /login
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--waterfall-bg-light)] to-white">
      <p className="text-gray-600">Redirection vers la page de connexion...</p>
    </div>
  );
}
