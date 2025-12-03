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

/**
 * Shared table components
 * 
 * @example
 * ```tsx
 * import { SortIcon, ColumnHeader, ColumnFilter } from '@/components/shared/tables';
 * import type { ColumnConfig, FilterState } from '@/components/shared/tables';
 * ```
 */

// Types
export type {
  FilterOption,
  FilterType,
  FilterState,
  ColumnConfig,
  SortState,
  SortableColumn,
  ColumnHeaderDictionary,
} from "./types";

// Components
export { SortIcon } from "./sort-icon";
export { ColumnHeader } from "./column-header";

// Filter components
export {
  ColumnFilter,
  TextFilter,
  SelectFilter,
  MultiSelectFilter,
  BooleanFilter,
} from "./filters";

// Column builders
export {
  createActionColumn,
  createDateColumn,
  createStatusColumn,
  createBooleanColumn,
  createTextColumn,
  createFilterableTextColumn,
  createBadgeListColumn,
} from "./column-builders";
export type {
  ActionCallbacks,
  ActionDictionary,
  StatusConfig,
  Locale,
} from "./column-builders";
