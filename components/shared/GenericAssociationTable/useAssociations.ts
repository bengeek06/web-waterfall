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

import { useState, useCallback, useEffect } from "react";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { getServiceRoute } from "@/lib/api-routes";
import type { BaseItem, UseAssociationsOptions, UseAssociationsReturn } from "./types";
import logger from '@/lib/utils/logger';

/**
 * Convert plural name to singular
 * @example "roles" -> "role", "policies" -> "policy", "permissions" -> "permission"
 */
function getSingularName(name: string): string {
  if (name.endsWith("ies")) {
    return name.slice(0, -3) + "y";
  }
  if (name.endsWith("s")) {
    return name.slice(0, -1);
  }
  return name;
}

/**
 * Hook for managing N-N and 1-N associations
 * 
 * Handles fetching, adding, and removing associations between entities.
 * Supports both many-to-many (via junction table) and one-to-many relationships.
 * 
 * @example Many-to-Many (User <-> Roles)
 * ```tsx
 * const { associatedItems, addAssociations, removeAssociation } = useAssociations({
 *   config: {
 *     type: "many-to-many",
 *     name: "roles",
 *     service: "guardian",
 *     path: "/roles",
 *     junctionEndpoint: "/users/{id}/roles",
 *   },
 *   parentId: userId,
 * });
 * ```
 */
export function useAssociations<TAssociated extends BaseItem = BaseItem>({
  config,
  parentId,
  enabled = true,
}: UseAssociationsOptions<TAssociated>): UseAssociationsReturn<TAssociated> {
  const [associatedItems, setAssociatedItems] = useState<TAssociated[]>([]);
  const [allItems, setAllItems] = useState<TAssociated[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Build the junction URL from endpoint pattern
   */
  const buildJunctionUrl = useCallback((endpointPattern: string, id: string | number) => {
    const path = endpointPattern.replace("{id}", String(id));
    // Determine service from config or infer from path
    // For junction endpoints, we typically use the same service as the parent
    return getServiceRoute(config.service, path);
  }, [config.service]);

  /**
   * Fetch all available items for the association
   */
  const fetchAllItems = useCallback(async () => {
    try {
      const url = getServiceRoute(config.service, config.path);
      const response = await fetchWithAuth(url);
      
      if (response.status === 401) {
        globalThis.location.href = "/login";
        return [];
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${config.name}: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle both array and paginated responses
      const items = Array.isArray(data) 
        ? data 
        : (data.data || data[config.name] || []);
      
      return items as TAssociated[];
    } catch (err) {
      logger.error({ err, name: config.name }, `Error fetching all items`);
      throw err;
    }
  }, [config.service, config.path, config.name]);

  /**
   * Fetch associated items for a parent entity
   */
  const fetchAssociatedItems = useCallback(async (id: string | number) => {
    if (config.type === "many-to-many" && config.junctionEndpoint) {
      // For M2M: fetch from junction endpoint
      try {
        const url = buildJunctionUrl(config.junctionEndpoint, id);
        const response = await fetchWithAuth(url);
        
        if (response.status === 401) {
          globalThis.location.href = "/login";
          return [];
        }
        
        if (!response.ok) {
          logger.warn({ id, name: config.name, status: response.status }, `Failed to fetch items for id`);
          return [];
        }
        
        const data = await response.json();
        return (Array.isArray(data) ? data : (data[config.name] || [])) as TAssociated[];
      } catch (err) {
        logger.error({ err, id, name: config.name }, `Error fetching items for id`);
        return [];
      }
    } else if (config.type === "one-to-many" && config.foreignKey) {
      // For 1-N: filter all items by foreign key
      const all = await fetchAllItems();
      return all.filter(item => String(item[config.foreignKey as keyof TAssociated]) === String(id));
    }
    
    return [];
  }, [config, buildJunctionUrl, fetchAllItems]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    if (!parentId || !enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [associated, all] = await Promise.all([
        fetchAssociatedItems(parentId),
        fetchAllItems(),
      ]);
      
      setAssociatedItems(associated);
      setAllItems(all);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [parentId, enabled, fetchAssociatedItems, fetchAllItems]);

  /**
   * Add associations
   */
  const addAssociations = useCallback(async (itemIds: (string | number)[]) => {
    if (!parentId || itemIds.length === 0) return;
    
    if (config.type !== "many-to-many" || !config.junctionEndpoint) {
      throw new Error("addAssociations is only supported for many-to-many relationships");
    }
    
    const url = buildJunctionUrl(config.junctionEndpoint, parentId);
    
    // Determine the body field name
    // Default: "<association_name>_id" (e.g., "roles" -> "role_id")
    const singularName = getSingularName(config.name);
    const bodyField = config.addBodyField || `${singularName}_id`;
    
    const results = await Promise.all(
      itemIds.map(async (itemId) => {
        try {
          const response = await fetchWithAuth(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [bodyField]: itemId }),
          });
          
          if (response.status === 401) {
            globalThis.location.href = "/login";
            return { success: false, itemId };
          }
          
          return { success: response.ok, itemId };
        } catch {
          return { success: false, itemId };
        }
      })
    );
    
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      logger.warn({ failedIds: failed.map(f => f.itemId), name: config.name }, `Failed to add some items`);
    }
    
    // Refresh to get updated data
    await refresh();
  }, [parentId, config, buildJunctionUrl, refresh]);

  /**
   * Remove an association
   */
  const removeAssociation = useCallback(async (itemId: string | number) => {
    if (!parentId) return;
    
    if (config.type !== "many-to-many" || !config.junctionEndpoint) {
      throw new Error("removeAssociation is only supported for many-to-many relationships");
    }
    
    // Build URL: /users/{parentId}/roles/{itemId}
    const baseUrl = buildJunctionUrl(config.junctionEndpoint, parentId);
    const url = `${baseUrl}/${itemId}`;
    
    try {
      const response = await fetchWithAuth(url, {
        method: "DELETE",
      });
      
      if (response.status === 401) {
        globalThis.location.href = "/login";
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to remove ${config.name}: ${response.status}`);
      }
      
      // Update local state optimistically
      setAssociatedItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      logger.error({ err, name: config.name }, `Error removing item`);
      throw err;
    }
  }, [parentId, config, buildJunctionUrl]);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    associatedItems,
    allItems,
    isLoading,
    error,
    addAssociations,
    removeAssociation,
    refresh,
  };
}
