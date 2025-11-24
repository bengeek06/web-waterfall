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

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, X, MoreHorizontal, Pencil, Trash2, Eye, ArrowUpDown } from "lucide-react";
import { testId } from "@/lib/test-ids";

// ==================== TYPES ====================

export interface ActionCallbacks<T> {
  onEdit?: (_item: T) => void;
  onDelete?: (_item: T) => void;
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
 * Creates a standard actions column with Edit/Delete/View dropdown
 * 
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              {...(entityIdPrefix && itemId ? testId(`${entityIdPrefix}-actions-${itemId}`) : {})}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{dictionary.actions}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {callbacks.onView && (
              <DropdownMenuItem 
                onClick={() => callbacks.onView?.(item)}
                {...(entityIdPrefix && itemId ? testId(`${entityIdPrefix}-view-${itemId}`) : {})}
              >
                <Eye className="mr-2 h-4 w-4" />
                {dictionary.view}
              </DropdownMenuItem>
            )}
            {callbacks.onEdit && (
              <DropdownMenuItem 
                onClick={() => callbacks.onEdit?.(item)}
                {...(entityIdPrefix && itemId ? testId(`${entityIdPrefix}-edit-${itemId}`) : {})}
              >
                <Pencil className="mr-2 h-4 w-4" />
                {dictionary.edit}
              </DropdownMenuItem>
            )}
            {callbacks.onDelete && (
              <DropdownMenuItem
                onClick={() => callbacks.onDelete?.(item)}
                className="text-destructive focus:text-destructive"
                {...(entityIdPrefix && itemId ? testId(`${entityIdPrefix}-delete-${itemId}`) : {})}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {dictionary.delete}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  };
}

/**
 * Creates a formatted date column using native Intl.DateTimeFormat
 * 
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
          <ArrowUpDown className="ml-2 h-4 w-4" />
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
 * Creates a boolean column with checkmark/cross
 * 
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
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <X className="h-4 w-4 text-gray-400" />
      );
    },
  };
}

/**
 * Creates a sortable text column
 * 
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
          <ArrowUpDown className="ml-2 h-4 w-4" />
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
 * Creates a badge list column (for arrays like roles, tags)
 * 
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
