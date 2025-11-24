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

import { ReactNode } from 'react';
import { PermissionRequirements } from '@/lib/utils/permissions';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface ProtectedCardProps {
  /** Exigences de permissions (groupes AND combinés par OR) */
  readonly requirements: PermissionRequirements;
  
  /** Contenu à afficher si les permissions sont satisfaites */
  readonly children: ReactNode;
  
  /** 
   * Comportement pendant le chargement 
   * - "hide": Ne rien afficher
   * - "show": Afficher le contenu (comportement par défaut)
   * - "skeleton": Afficher un skeleton loader
   */
  readonly loadingBehavior?: 'hide' | 'show' | 'skeleton';
  
  /** 
   * Contenu à afficher si les permissions ne sont pas satisfaites 
   * Par défaut: ne rien afficher
   */
  readonly fallback?: ReactNode;
}

/**
 * Composant qui affiche son contenu uniquement si l'utilisateur a les permissions requises
 * 
 * @example
 * // Affiche seulement si l'utilisateur peut lister les users ET les roles
 * <ProtectedCard requirements={PERMISSION_REQUIREMENTS.USER_ADMINISTRATION}>
 *   <UserAdminCard />
 * </ProtectedCard>
 * 
 * @example
 * // Affiche si l'utilisateur peut lire OU modifier les companies
 * <ProtectedCard requirements={PERMISSION_REQUIREMENTS.COMPANY_SETTINGS}>
 *   <CompanySettingsCard />
 * </ProtectedCard>
 * 
 * @example
 * // Avec permissions personnalisées
 * <ProtectedCard 
 *   requirements={[
 *     [PERMISSIONS.IDENTITY_USERS_LIST, PERMISSIONS.GUARDIAN_ROLES_LIST],  // AND
 *     [PERMISSIONS.IDENTITY_COMPANIES_UPDATE]  // OR
 *   ]}
 * >
 *   <CustomCard />
 * </ProtectedCard>
 */
export function ProtectedCard({
  requirements,
  children,
  loadingBehavior = 'show',
  fallback = null,
}: ProtectedCardProps) {
  const { hasPermission, loading } = usePermissions();

  // Pendant le chargement
  if (loading) {
    if (loadingBehavior === 'hide') {
      return null;
    }
    if (loadingBehavior === 'skeleton') {
      // TODO: Ajouter un skeleton loader
      return <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />;
    }
    // Par défaut, on affiche le contenu pendant le chargement
    return <>{children}</>;
  }

  // Vérifier les permissions
  const hasAccess = hasPermission(requirements);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
