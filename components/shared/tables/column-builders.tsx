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

/**
 * Column Builder Utilities
 * 
 * Factory functions for creating standardized TanStack Table column definitions.
 * These builders ensure consistent styling, behavior, and accessibility across all tables.
 * 
 * @example
 * ```tsx
 * const columns = [
 *   createFilterableTextColumn('name', 'Name', 'users'),
 *   createDateColumn('created_at', 'Created', 'fr'),
 *   createActionColumn({ onEdit, onDelete }, dictionary, 'user'),
 * ];
 * ```
 */

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, X, Edit, Trash2, Eye } from "lucide-react";
import { SortIcon } from "./sort-icon";
import { ColumnHeader } from "./column-header";
import type { ColumnConfig } from "./types";
import { testId } from "@/lib/test-ids";
import { ICON_SIZES } from "@/lib/design-tokens";

// ==================== TYPES ====================

export interface ActionCallbacks<T> {
  onEdit?: (_item: T) => void;
  onDelete?: (_item: T) => void | Promise<void>;
  onView?: (_item: T) => void;
}

export interface ActionDictionary {
  actions: string;
  edit: string;
  delete: string;
  view: string;
}

export interface StatusConfig {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}

export type Locale = 'fr' | 'en';

// ==================== COLUMN BUILDERS ====================

/**
 * Creates a standard actions column with Edit/Delete/View icon buttons with tooltips
 * 
 * @param callbacks - Object containing onEdit, onDelete, onView handlers
 * @param dictionary - Localized labels for actions
 * @param entityIdPrefix - Prefix for test IDs (e.g., 'user', 'subcontractor')
 * @example
 * ```tsx
 * createActionColumn(
 *   { onEdit: handleEdit, onDelete: handleDelete },
 *   { actions: "Actions", edit: "Edit", delete: "Delete", view: "View" },
 *   'user' // Generates 'user-edit-{id}', 'user-delete-{id}'
 * )
 * ```
 */
export function createActionColumn<T extends { id?: string | number }>(
  callbacks: ActionCallbacks<T>,
  dictionary: ActionDictionary,
  entityIdPrefix?: string
): ColumnDef<T> {
  return {
    id: "actions",
    header: dictionary.actions,
    enableSorting: false,
    enableColumnFilter: false,
    cell: ({ row }) => {
      const item = row.original;
      const itemId = item.id;
      return (
        <TooltipProvider>
          <div className="flex items-center gap-1">
            {callbacks.onView && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`${ICON_SIZES.xl}`}
                    onClick={() => callbacks.onView?.(item)}
                    {...(entityIdPrefix && itemId ? testId(`${entityIdPrefix}-view-${itemId}`) : {})}
                  >
                    <Eye className={ICON_SIZES.sm} />
                    <span className="sr-only">{dictionary.view}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dictionary.view}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {callbacks.onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`${ICON_SIZES.xl}`}
                    onClick={() => callbacks.onEdit?.(item)}
                    {...(entityIdPrefix && itemId ? testId(`${entityIdPrefix}-edit-${itemId}`) : {})}
                  >
                    <Edit className={ICON_SIZES.sm} />
                    <span className="sr-only">{dictionary.edit}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dictionary.edit}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {callbacks.onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`${ICON_SIZES.xl} text-destructive hover:text-destructive hover:bg-destructive/10`}
                    onClick={() => callbacks.onDelete?.(item)}
                    {...(entityIdPrefix && itemId ? testId(`${entityIdPrefix}-delete-${itemId}`) : {})}
                  >
                    <Trash2 className={ICON_SIZES.sm} />
                    <span className="sr-only">{dictionary.delete}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dictionary.delete}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      );
    },
  };
}

/**
 * Creates a formatted date column using native Intl.DateTimeFormat
 * 
 * @param accessorKey - The key to access the date value
 * @param header - Column header label
 * @param locale - Locale for date formatting ('en' or 'fr')
 * @example
 * ```tsx
 * createDateColumn('created_at', 'Created', 'en')
 * // Output: "Jan 15, 2025"
 * 
 * createDateColumn('updated_at', 'Updated', 'fr')
 * // Output: "15 janv. 2025"
 * ```
 */
export function createDateColumn<T>(
  accessorKey: keyof T & string,
  header: string,
  locale: Locale = 'en'
): ColumnDef<T> {
  const localeMap = { 
    fr: 'fr-FR', 
    en: 'en-US' 
  };
  
  return {
    accessorKey,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          {header}
          <SortIcon column={column} className="ml-2" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue(accessorKey);
      if (!date) return <span className="text-muted-foreground">—</span>;
      
      try {
        return new Intl.DateTimeFormat(localeMap[locale], {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(new Date(date as string));
      } catch {
        return <span className="text-muted-foreground">—</span>;
      }
    },
  };
}

/**
 * Creates a status badge column
 * 
 * @param accessorKey - The key to access the status value
 * @param header - Column header label
 * @param statusConfig - Configuration for each status value
 * @example
 * ```tsx
 * createStatusColumn('status', 'Status', {
 *   active: { label: 'Active', variant: 'default' },
 *   inactive: { label: 'Inactive', variant: 'secondary' }
 * })
 * ```
 */
export function createStatusColumn<T>(
  accessorKey: keyof T & string,
  header: string,
  statusConfig: Record<string, StatusConfig>
): ColumnDef<T> {
  return {
    accessorKey,
    header,
    cell: ({ row }) => {
      const status = String(row.getValue(accessorKey) || '');
      const config = statusConfig[status] || { 
        label: status || '—', 
        variant: 'default' as const 
      };
      
      return (
        <Badge variant={config.variant}>
          {config.label}
        </Badge>
      );
    },
  };
}

/**
 * Creates a boolean column with checkmark/cross icons
 * 
 * @param accessorKey - The key to access the boolean value
 * @param header - Column header label
 * @example
 * ```tsx
 * createBooleanColumn('is_active', 'Active')
 * // Shows ✓ for true, ✗ for false
 * ```
 */
export function createBooleanColumn<T>(
  accessorKey: keyof T & string,
  header: string
): ColumnDef<T> {
  return {
    accessorKey,
    header,
    cell: ({ row }) => {
      const value = row.getValue(accessorKey);
      
      return value ? (
        <Check className={`${ICON_SIZES.sm} text-green-600`} />
      ) : (
        <X className={`${ICON_SIZES.sm} text-gray-400`} />
      );
    },
  };
}

/**
 * Creates a sortable text column (sort only, no filter)
 * 
 * @param accessorKey - The key to access the text value
 * @param header - Column header label
 * @example
 * ```tsx
 * createTextColumn('email', 'Email')
 * ```
 */
export function createTextColumn<T>(
  accessorKey: keyof T & string,
  header: string
): ColumnDef<T> {
  return {
    accessorKey,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          {header}
          <SortIcon column={column} className="ml-2" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue(accessorKey);
      return value ? String(value) : <span className="text-muted-foreground">—</span>;
    },
  };
}

/**
 * Creates a sortable AND filterable text column using ColumnHeader
 * 
 * @param accessorKey - The key to access the text value
 * @param header - Column header label
 * @param testIdPrefix - Prefix for test IDs (optional)
 * @param filterPlaceholder - Placeholder text for filter input (optional)
 * @example
 * ```tsx
 * createFilterableTextColumn('email', 'Email', 'users', 'Filter by email...')
 * ```
 */
export function createFilterableTextColumn<T>(
  accessorKey: keyof T & string,
  header: string,
  testIdPrefix?: string,
  filterPlaceholder?: string
): ColumnDef<T> {
  const config: ColumnConfig<T> = {
    key: accessorKey,
    header,
    sortable: true,
    filterable: true,
    filterType: "text",
    filterPlaceholder: filterPlaceholder ?? `Filter ${header}...`,
  };

  return {
    accessorKey,
    enableColumnFilter: true,
    filterFn: "includesString",
    header: ({ column }) => (
      <ColumnHeader<T>
        config={config}
        tanstackColumn={column}
        filterValue={column.getFilterValue() as string}
        onFilterChange={(v) => column.setFilterValue(v)}
        testIdPrefix={testIdPrefix}
      />
    ),
    cell: ({ row }) => {
      const value = row.getValue(accessorKey);
      return value ? String(value) : <span className="text-muted-foreground">—</span>;
    },
  };
}

/**
 * Creates a badge list column (for arrays like roles, tags)
 * 
 * @param accessorKey - The key to access the array value
 * @param header - Column header label
 * @param labelExtractor - Function to extract display label from each item
 * @example
 * ```tsx
 * createBadgeListColumn('roles', 'Roles', (role) => role.name)
 * ```
 */
export function createBadgeListColumn<T, TItem>(
  accessorKey: keyof T & string,
  header: string,
  labelExtractor: (_item: TItem) => string
): ColumnDef<T> {
  return {
    accessorKey,
    header,
    cell: ({ row }) => {
      const value = row.getValue(accessorKey);
      const items = Array.isArray(value) ? value : [];
      
      if (items.length === 0) {
        return <span className="text-muted-foreground">—</span>;
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {items.map((item: TItem, idx: number) => (
            <Badge key={`${accessorKey}-${idx}`} variant="secondary" className="text-xs">
              {labelExtractor(item)}
            </Badge>
          ))}
        </div>
      );
    },
  };
}
