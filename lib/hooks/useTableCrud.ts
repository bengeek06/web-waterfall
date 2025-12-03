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

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { fetchWithAuth } from '@/lib/auth/fetchWithAuth';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';

// ==================== TYPES ====================

export interface CrudConfig {
  /**
   * API service prefix (e.g., 'identity', 'guardian', 'project')
   */
  service: string;
  
  /**
   * Resource path (e.g., '/users', '/companies', '/roles')
   */
  path: string;
  
  /**
   * Relations to expand via ?expand= query parameter
   * @example ['roles', 'position'] -> ?expand=roles,position
   */
  expand?: string[];
  
  /**
   * Revalidate when window regains focus
   * @default false
   */
  revalidateOnFocus?: boolean;
  
  /**
   * Revalidate on mount
   * @default true
   */
  revalidateOnMount?: boolean;
  
  /**
   * Error messages for CRUD operations
   */
  errorMessages?: {
    fetch?: string;
    create?: string;
    update?: string;
    delete?: string;
  };
}

export interface CrudResult<T> {
  /** The fetched data array */
  data: T[];
  
  /** Error from SWR fetch */
  error: Error | undefined;
  
  /** Loading state (initial fetch or mutation in progress) */
  isLoading: boolean;
  
  /** Is currently fetching/revalidating */
  isValidating: boolean;
  
  /** Create a new item */
  create: (_item: Partial<T>) => Promise<T>;
  
  /** Update an existing item (PUT - requires all fields) */
  update: (_id: string | number, _item: Partial<T>) => Promise<T>;
  
  /** Patch an existing item (PATCH - partial update) */
  patch: (_id: string | number, _item: Partial<T>) => Promise<T>;
  
  /** Delete an item */
  remove: (_id: string) => Promise<void>;
  
  /** Manually trigger revalidation */
  refresh: () => Promise<void>;
}

// ==================== HOOK ====================

/**
 * Generic CRUD hook with SWR for table data management
 * 
 * @example
 * ```tsx
 * const { data, isLoading, create, update, remove } = useTableCrud<User>({
 *   service: 'identity',
 *   path: '/users',
 *   errorMessages: {
 *     fetch: 'Failed to load users',
 *     create: 'Failed to create user',
 *     update: 'Failed to update user',
 *     delete: 'Failed to delete user',
 *   }
 * });
 * ```
 */
export function useTableCrud<T extends { id?: string | number }>(
  config: CrudConfig
): CrudResult<T> {
  const {
    service,
    path,
    expand,
    revalidateOnFocus = false,
    revalidateOnMount = true,
    errorMessages,
  } = config;

  const [isMutating, setIsMutating] = useState(false);
  const { handleError } = useErrorHandler({
    messages: {
      network: errorMessages?.fetch || 'Network error occurred',
      unauthorized: 'Unauthorized access',
      forbidden: 'Access forbidden',
      notFound: 'Resource not found',
      serverError: errorMessages?.fetch || 'Server error occurred',
      clientError: 'Invalid request',
      unknown: errorMessages?.fetch || 'An error occurred',
    },
  });

  // Construct the full API URL with optional expand parameter
  // Note: limit=1000 ensures we fetch all items (backend defaults to 50)
  const baseUrl = `/api/${service}${path}`;
  const params = new URLSearchParams();
  params.set('limit', '1000');
  if (expand && expand.length > 0) {
    params.set('expand', expand.join(','));
  }
  const apiUrl = `${baseUrl}?${params.toString()}`;

  // SWR fetcher
  const fetcher = async (url: string) => {
    const response = await fetchWithAuth(url);
    
    if (!response.ok) {
      const error = new Error('Failed to fetch');
      handleError(error);
      throw error;
    }
    
    const json = await response.json();
    
    // Handle both formats: direct array or {data: [...], pagination: {...}}
    if (Array.isArray(json)) {
      return json;
    } else if (json.data && Array.isArray(json.data)) {
      return json.data;
    }
    
    return [];
  };

  // Fetch data with SWR
  const { data, error, mutate, isValidating, isLoading: swrIsLoading } = useSWR<T[]>(
    apiUrl,
    fetcher,
    {
      revalidateOnFocus,
      revalidateOnMount,
      onError: (err) => {
        handleError(err);
      },
    }
  );

  // Create operation
  const create = useCallback(
    async (item: Partial<T>): Promise<T> => {
      setIsMutating(true);
      try {
        const response = await fetchWithAuth(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(
            errorData.message || errorMessages?.create || 'Create failed'
          );
          handleError(error);
          throw error;
        }

        const created = await response.json();
        
        // Optimistic update
        await mutate();
        
        return created;
      } finally {
        setIsMutating(false);
      }
    },
    [baseUrl, mutate, errorMessages?.create, handleError]
  );

  // Update operation
  const update = useCallback(
    async (id: string | number, item: Partial<T>): Promise<T> => {
      setIsMutating(true);
      try {
        const response = await fetchWithAuth(`${baseUrl}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(
            errorData.message || errorMessages?.update || 'Update failed'
          );
          handleError(error);
          throw error;
        }

        const updated = await response.json();
        
        // Optimistic update
        await mutate();
        
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [baseUrl, mutate, errorMessages?.update, handleError]
  );

  // Patch operation (partial update)
  const patch = useCallback(
    async (id: string | number, item: Partial<T>): Promise<T> => {
      setIsMutating(true);
      try {
        const response = await fetchWithAuth(`${baseUrl}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(
            errorData.message || errorMessages?.update || 'Patch failed'
          );
          handleError(error);
          throw error;
        }

        const updated = await response.json();
        
        // Optimistic update
        await mutate();
        
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [baseUrl, mutate, errorMessages?.update, handleError]
  );

  // Delete operation
  const remove = useCallback(
    async (id: string): Promise<void> => {
      setIsMutating(true);
      try {
        const response = await fetchWithAuth(`${baseUrl}/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(
            errorData.message || errorMessages?.delete || 'Delete failed'
          );
          handleError(error);
          throw error;
        }

        // Optimistic update
        await mutate();
      } finally {
        setIsMutating(false);
      }
    },
    [baseUrl, mutate, errorMessages?.delete, handleError]
  );

  // Manual refresh
  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    data: data ?? [],
    error,
    // isLoading: true when initial fetch (no data yet) or during mutations
    isLoading: swrIsLoading || isMutating || data === undefined,
    isValidating,
    create,
    update,
    patch,
    remove,
    refresh,
  };
}
