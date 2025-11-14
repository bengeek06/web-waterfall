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

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
}

export default function LogoutButton({ children, className, testId }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetchWithAuth('/api/auth/logout', {
        method: 'POST',
      });
      
      // Rediriger vers la page de login après le logout
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
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