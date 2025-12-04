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

'use client';

import { useErrorHandler } from "@/lib/hooks/useErrorHandler";
import type { ErrorMessages } from "@/lib/hooks/useErrorHandler";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { useRouter } from "next/navigation";
import { cancelTokenRefresh } from "@/lib/auth/tokenRefreshScheduler";

interface LogoutButtonProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
  errors: ErrorMessages;
}

export default function LogoutButton({ children, className, testId, errors }: Readonly<LogoutButtonProps>) {
  const router = useRouter();
  const { handleError } = useErrorHandler({ messages: errors });

  const handleLogout = async () => {
    try {
      // Annuler le refresh automatique du token
      cancelTokenRefresh();
      
      await fetchWithAuth('/api/auth/logout', {
        method: 'POST',
      });
      
      // Rediriger vers la page de login après le logout
      router.push('/login');
    } catch (error) {
      handleError(error);
      // Même en cas d'erreur, rediriger vers login (tokens probablement expirés)
      router.push('/login');
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className={className}
      {...(testId && { 'data-testid': testId })}
    >
      {children}
    </button>
  );
}