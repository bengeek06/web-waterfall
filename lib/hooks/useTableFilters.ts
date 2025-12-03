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

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { ColumnConfig, FilterState } from "@/components/shared/tables/types";

// ==================== TYPES ====================

interface UseTableFiltersOptions {
  /** Persist filters in URL query params */
  persistInUrl?: boolean;
  /** Prefix for URL query params (default: "filter_") */
  urlParamPrefix?: string;
}

interface UseTableFiltersReturn<T> {
  /** Current filter state */
  filters: FilterState;
  /** Update a single filter value */
  updateFilter: (_key: string, _value: unknown) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Apply filters to data array */
  filterData: (_data: T[]) => T[];
  /** Check if any filters are active */
  hasActiveFilters: boolean;
}

// ==================== HELPERS ====================

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Check if a filter value is "empty" (should not filter)
 */
function isEmptyFilterValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

// ==================== HOOK ====================

/**
 * Manages table filter state with optional URL persistence
 * 
 * Features:
 * - Type-safe filter state management
 * - Optional URL persistence (survives page refresh)
 * - Built-in filter application to data arrays
 * - Default filter logic for common filter types
 * 
 * @typeParam T - The data item type
 * 
 * @param columns - Column configurations with filter definitions
 * @param options - Hook options
 * @returns Filter state and helper functions
 * 
 * @example Basic usage
 * ```tsx
 * const { filters, updateFilter, filterData } = useTableFilters(columns);
 * 
 * const filteredData = filterData(data);
 * 
 * <ColumnFilter
 *   value={filters.email}
 *   onChange={(v) => updateFilter('email', v)}
 * />
 * ```
 * 
 * @example With URL persistence
 * ```tsx
 * const { filters, updateFilter, filterData } = useTableFilters(columns, {
 *   persistInUrl: true,
 * });
 * // Filters will be saved to URL: ?filter_email=john&filter_roles=admin,user
 * ```
 */
export function useTableFilters<T>(
  columns: ColumnConfig<T>[],
  options: UseTableFiltersOptions = {}
): UseTableFiltersReturn<T> {
  const { persistInUrl = false, urlParamPrefix = "filter_" } = options;
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // Initialize filter state
  const [filters, setFilters] = useState<FilterState>(() => {
    if (!persistInUrl) return {};
    
    // Initialize from URL params
    const initialFilters: FilterState = {};
    columns.forEach((col) => {
      if (!col.filterable) return;
      
      const key = String(col.key);
      const urlValue = searchParams.get(`${urlParamPrefix}${key}`);
      
      if (urlValue) {
        // Parse multi-select values from comma-separated string
        if (col.filterType === "multi-select") {
          initialFilters[key] = urlValue.split(",");
        } else {
          initialFilters[key] = urlValue;
        }
      }
    });
    
    return initialFilters;
  });

  // Sync filters to URL when they change (if persistence enabled)
  useEffect(() => {
    if (!persistInUrl) return;
    
    const params = new URLSearchParams(searchParams.toString());
    
    // Update URL params for each filter
    columns.forEach((col) => {
      if (!col.filterable) return;
      
      const key = String(col.key);
      const value = filters[key];
      const paramName = `${urlParamPrefix}${key}`;
      
      if (isEmptyFilterValue(value)) {
        params.delete(paramName);
      } else if (Array.isArray(value)) {
        params.set(paramName, value.join(","));
      } else {
        params.set(paramName, String(value));
      }
    });
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [filters, persistInUrl, columns, urlParamPrefix, pathname, router, searchParams]);

  // Update a single filter
  const updateFilter = useCallback((key: string, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => !isEmptyFilterValue(value));
  }, [filters]);

  // Apply filters to data
  const filterData = useCallback(
    (data: T[]): T[] => {
      return data.filter((item) => {
        // Item passes if it matches ALL filters
        return columns.every((col) => {
          if (!col.filterable) return true;
          
          const key = String(col.key);
          const filterValue = filters[key];
          
          // No filter value = pass
          if (isEmptyFilterValue(filterValue)) return true;
          
          // Use custom filter function if provided
          if (col.filterFn) {
            return col.filterFn(item, filterValue);
          }
          
          // Get item value (supports dot notation)
          const itemValue = key.includes(".")
            ? getNestedValue(item, key)
            : item[key as keyof T];
          
          // Default filter logic based on type
          switch (col.filterType) {
            case "text":
              return String(itemValue ?? "")
                .toLowerCase()
                .includes(String(filterValue).toLowerCase());
            
            case "select":
              return String(itemValue) === String(filterValue);
            
            case "multi-select":
              if (!Array.isArray(filterValue)) return true;
              return filterValue.includes(String(itemValue));
            
            case "boolean":
              return itemValue === (filterValue === "true");
            
            default:
              return true;
          }
        });
      });
    },
    [filters, columns]
  );

  return {
    filters,
    updateFilter,
    clearFilters,
    filterData,
    hasActiveFilters,
  };
}
