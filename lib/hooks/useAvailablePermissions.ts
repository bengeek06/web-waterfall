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

import { useState, useEffect } from "react";
import type { Permission } from "@/lib/utils/permissions";
import logger from '@/lib/utils/logger';

interface UseAvailablePermissionsResult {
  availablePermissions: Permission[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer toutes les permissions disponibles dans le système
 * Ces permissions sont définies côté Guardian et peuvent évoluer sans modifier le code front
 * 
 * @returns {UseAvailablePermissionsResult} État des permissions disponibles
 * 
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const { availablePermissions, loading, error } = useAvailablePermissions();
 *   
 *   if (loading) return <div>Chargement...</div>;
 *   if (error) return <div>Erreur: {error.message}</div>;
 *   
 *   return (
 *     <div>
 *       <h2>Permissions disponibles ({availablePermissions.length})</h2>
 *       {availablePermissions.map(p => (
 *         <div key={`${p.service}.${p.resource}.${p.action}`}>
 *           {p.service}:{p.resource}:{p.action}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAvailablePermissions(): UseAvailablePermissionsResult {
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/guardian/permissions");

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Le endpoint peut retourner { permissions: [...] } ou directement [...]
      const permissions = Array.isArray(data) ? data : (data.permissions || []);
      
      setAvailablePermissions(permissions);
    } catch (err) {
      logger.error({ err }, 'Erreur lors du chargement des permissions disponibles');
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  return {
    availablePermissions,
    loading,
    error,
    refresh: fetchPermissions,
  };
}
