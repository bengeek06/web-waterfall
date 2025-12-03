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

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { ICON_SIZES } from "@/lib/design-tokens";
import { testId as makeTestId } from "@/lib/test-ids";
import { SortIcon } from "./sort-icon";
import { ColumnFilter } from "./filters";
import type { ColumnConfig, FilterOption, SortableColumn } from "./types";

// ==================== TYPES ====================

interface ColumnHeaderProps<T> {
  /** Column configuration */
  config: ColumnConfig<T>;
  /** TanStack Table column (for sorting) */
  tanstackColumn?: SortableColumn;
  /** Current filter value */
  filterValue?: unknown;
  /** Callback when filter value changes */
  onFilterChange?: (_newValue: unknown) => void;
  /** Test ID prefix for E2E testing */
  testIdPrefix?: string;
  /** Additional CSS classes */
  className?: string;
}

// ==================== COMPONENT ====================

/**
 * Table column header with integrated sort button and filter dropdown
 * 
 * Features:
 * - Sort button with visual indicator
 * - Filter popover (when filterable)
 * - Active filter indicator
 * 
 * @example
 * ```tsx
 * <ColumnHeader
 *   config={columnConfig}
 *   tanstackColumn={column}
 *   filterValue={filters[columnConfig.key]}
 *   onFilterChange={(v) => updateFilter(columnConfig.key, v)}
 *   testIdPrefix="users"
 * />
 * ```
 */
export function ColumnHeader<T>({
  config,
  tanstackColumn,
  filterValue,
  onFilterChange,
  testIdPrefix,
  className,
}: Readonly<ColumnHeaderProps<T>>) {
  const { header, sortable = true, filterable = false, filterType, filterOptions, filterPlaceholder } = config;
  
  const hasActiveFilter = filterValue !== undefined && filterValue !== "" && 
    (Array.isArray(filterValue) ? filterValue.length > 0 : true);
  
  // Resolve options if it's a function
  const resolvedOptions: FilterOption[] = typeof filterOptions === "function" 
    ? filterOptions() 
    : filterOptions ?? [];
  
  const testId = testIdPrefix ? `${testIdPrefix}-col-${String(config.key)}` : undefined;

  // Non-sortable, non-filterable column
  if (!sortable && !filterable) {
    return <span className={className}>{header}</span>;
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Sort button */}
      {sortable && tanstackColumn ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 px-2"
          onClick={() => tanstackColumn.toggleSorting(tanstackColumn.getIsSorted() === "asc")}
          {...(testId ? makeTestId(`${testId}-sort`) : {})}
        >
          {header}
          <SortIcon column={tanstackColumn} className="ml-1" />
        </Button>
      ) : (
        <span>{header}</span>
      )}

      {/* Filter popover */}
      {filterable && filterType && onFilterChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                hasActiveFilter && "text-primary"
              )}
              {...(testId ? makeTestId(`${testId}-filter-btn`) : {})}
            >
              <Filter className={cn(ICON_SIZES.sm, hasActiveFilter && "fill-current")} />
              <span className="sr-only">Filter {header}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2" align="start">
            <ColumnFilter
              filterType={filterType}
              value={filterValue}
              onChange={onFilterChange}
              options={resolvedOptions}
              placeholder={filterPlaceholder}
              testId={testId ? `${testId}-filter` : undefined}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
