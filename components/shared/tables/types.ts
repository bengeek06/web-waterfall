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

import type { ReactNode } from "react";

// ==================== FILTER TYPES ====================

/**
 * Option for select and multi-select filters
 */
export interface FilterOption {
  /** Unique value for the option */
  value: string;
  /** Display label */
  label: string;
}

/**
 * Filter types supported by column filters
 */
export type FilterType = "text" | "select" | "multi-select" | "boolean" | "custom";

/**
 * Filter state - maps column keys to their filter values
 */
export interface FilterState {
  [columnKey: string]: unknown;
}

// ==================== COLUMN CONFIGURATION ====================

/**
 * Column configuration for GenericAssociationTable
 * 
 * @typeParam T - The data item type
 * 
 * @example Basic text column with filter
 * ```tsx
 * {
 *   key: 'email',
 *   header: dictionary.columns.email,
 *   sortable: true,
 *   filterable: true,
 *   filterType: 'text',
 * }
 * ```
 * 
 * @example Multi-select filter with custom render
 * ```tsx
 * {
 *   key: 'roles',
 *   header: dictionary.columns.roles,
 *   filterable: true,
 *   filterType: 'multi-select',
 *   filterOptions: roles.map(r => ({ value: r.id, label: r.name })),
 *   filterFn: (user, selectedIds) => 
 *     user.roles?.some(r => selectedIds.includes(r.role_id)),
 *   render: (user) => (
 *     <div className="flex gap-1">
 *       {user.roles?.map(r => <Badge key={r.id}>{r.role?.name}</Badge>)}
 *     </div>
 *   ),
 * }
 * ```
 */
export interface ColumnConfig<T> {
  // ==================== IDENTITY ====================
  
  /** 
   * Column key - must be a key of T or a dot-notation path for nested values
   * @example "email" or "position.title"
   */
  key: keyof T | string;
  
  /** Column header text */
  header: string;

  // ==================== RENDERING ====================
  
  /** 
   * Custom render function for cell content
   * If not provided, the value at `key` will be displayed as string
   */
  render?: (_item: T, _index: number) => ReactNode;
  
  /** Additional CSS class for the cell */
  className?: string;
  
  /** Column width (CSS value) */
  width?: string;
  
  /** Text alignment */
  align?: "left" | "center" | "right";

  // ==================== SORTING ====================
  
  /** Whether this column is sortable (default: true) */
  sortable?: boolean;
  
  /** Custom sort function */
  sortFn?: (_a: T, _b: T) => number;

  // ==================== FILTERING ====================
  
  /** Whether this column has a filter (default: false) */
  filterable?: boolean;
  
  /** Type of filter to display */
  filterType?: FilterType;
  
  /** 
   * Options for select/multi-select filters
   * Can be static array or function returning array
   */
  filterOptions?: FilterOption[] | (() => FilterOption[]);
  
  /** 
   * Custom filter function
   * Return true if item matches the filter value
   */
  filterFn?: (_item: T, _filterValue: unknown) => boolean;
  
  /** Placeholder text for filter input */
  filterPlaceholder?: string;

  // ==================== VISIBILITY ====================
  
  /** Hide this column (useful for conditional columns) */
  hidden?: boolean;
}

// ==================== SORT TYPES ====================

/**
 * Sort state for columns
 */
export interface SortState {
  column: string;
  direction: "asc" | "desc";
}

/**
 * Props for sortable column interface (TanStack Table compatible)
 */
export interface SortableColumn {
  getIsSorted: () => false | "asc" | "desc";
  toggleSorting: (_descending?: boolean) => void;
}

// ==================== COLUMN HEADER TYPES ====================

/**
 * Dictionary keys for column header component
 */
export interface ColumnHeaderDictionary {
  filter_placeholder?: string;
  clear_filter?: string;
  sort_ascending?: string;
  sort_descending?: string;
}
