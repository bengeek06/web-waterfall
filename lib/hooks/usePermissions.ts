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

import { useEffect, useState } from 'react';
import { 
  Permission, 
  PermissionRequirements, 
  checkPermissions 
} from '@/lib/permissions';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

interface UsePermissionsReturn {
  permissions: Permission[];
  loading: boolean;
  error: Error | null;
  hasPermission: (_requirements: PermissionRequirements) => boolean;
}

/**
 * Hook pour récupérer et vérifier les permissions de l'utilisateur
 * Utilise l'endpoint /api/auth/me/permissions qui lit le cookie httpOnly côté serveur
 */
export function usePermissions(): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        setLoading(true);
        
        // Utiliser l'endpoint qui lit le cookie côté serveur (httpOnly)
        // fetchWithAuth gère automatiquement le refresh token sur 401
        const response = await fetchWithAuth('/api/auth/me/permissions');
        
        if (!response.ok) {
          // 401 Unauthorized est normal pour les utilisateurs non connectés
          // Ne pas logger d'erreur dans ce cas
          if (response.status === 401) {
            setPermissions([]);
            return;
          }
          throw new Error(`Failed to fetch permissions: ${response.statusText}`);
        }

        const data = await response.json();
        
        // L'API retourne un tableau de permissions directement ou dans un objet
        const rawPerms = Array.isArray(data) ? data : (data.permissions || []);
        
        // Normaliser le format: l'API Guardian retourne resource_name et operations (pluriel, tableau)
        // Notre interface Permission utilise resource et action (singulier)
        // On doit "déplier" chaque permission en une permission par opération
        const normalizedPerms: Permission[] = [];
        
        for (const perm of rawPerms) {
          const service = perm.service || '';
          const resource = perm.resource_name || perm.resource || '';
          
          // Les opérations Guardian sont en MAJUSCULES (READ, CREATE, UPDATE, DELETE, LIST)
          const normalizeOperation = (op: string): string => op.toUpperCase();
          
          // Si operations est un tableau, créer une permission par opération
          if (Array.isArray(perm.operations)) {
            for (const operation of perm.operations) {
              normalizedPerms.push({
                service,
                resource,
                action: normalizeOperation(operation),
              });
            }
          } else if (perm.operation) {
            // Sinon, utiliser operation au singulier
            normalizedPerms.push({
              service,
              resource,
              action: normalizeOperation(perm.operation),
            });
          } else if (perm.action) {
            // Ou action si présent
            normalizedPerms.push({
              service,
              resource,
              action: normalizeOperation(perm.action),
            });
          }
        }
        
        setPermissions(normalizedPerms);
        
        // Debug: log guardian role permissions
        const guardianRolePerms = normalizedPerms.filter(p => p.service === 'guardian' && p.resource === 'role');
        console.log('🔐 Guardian role permissions:', guardianRolePerms);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        // En cas d'erreur, on ne bloque pas l'UI mais on log
        console.error('Error fetching permissions:', err);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, []);

  const hasPermission = (requirements: PermissionRequirements): boolean => {
    return checkPermissions(permissions, requirements);
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
  };
}
