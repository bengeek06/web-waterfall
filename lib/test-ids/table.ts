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
 * Test IDs for generic table components
 * Used for E2E testing with Playwright/Selenium
 */

export const TABLE_TEST_IDS = {
  genericTable: {
    container: 'generic-table-container',
    toolbar: 'generic-table-toolbar',
    toolbarActions: 'generic-table-toolbar-actions',
    createButton: 'generic-table-create-button',
    importButton: 'generic-table-import-button',
    exportButton: 'generic-table-export-button',
    importInput: 'generic-table-import-input',
    searchInput: 'generic-table-search-input',
    bulkDeleteButton: 'generic-table-bulk-delete-button',
    table: 'generic-table-table',
    tableHeader: 'generic-table-header',
    tableBody: 'generic-table-body',
    loadingRow: 'generic-table-loading-row',
    emptyRow: 'generic-table-empty-row',
    resultsCount: 'generic-table-results-count',
  },
  
  /** 
   * Column filter test IDs
   * Use with prefix: `${prefix}-col-${columnKey}-filter`
   */
  filters: {
    /** Text filter input */
    textInput: 'filter-text-input',
    /** Text filter clear button */
    textClear: 'filter-text-clear',
    /** Select filter dropdown */
    selectTrigger: 'filter-select-trigger',
    /** Multi-select filter dropdown */
    multiSelectTrigger: 'filter-multi-select-trigger',
    /** Boolean filter dropdown */
    booleanTrigger: 'filter-boolean-trigger',
    /** Clear all filters button */
    clearAll: 'filter-clear-all',
  },
  
  /**
   * Column header test IDs
   * Use with prefix: `${prefix}-col-${columnKey}`
   */
  columnHeader: {
    /** Sort button */
    sortButton: 'sort-button',
    /** Filter button (opens popover) */
    filterButton: 'filter-btn',
    /** Filter popover content */
    filterPopover: 'filter-popover',
  },
} as const;

/**
 * Helper to generate column-specific test IDs
 * 
 * @example
 * ```tsx
 * const ids = getColumnTestIds('users', 'email');
 * // ids.sort => 'users-col-email-sort'
 * // ids.filterBtn => 'users-col-email-filter-btn'
 * // ids.filter => 'users-col-email-filter'
 * ```
 */
export function getColumnTestIds(prefix: string, columnKey: string) {
  const base = `${prefix}-col-${columnKey}`;
  return {
    sort: `${base}-sort`,
    filterBtn: `${base}-filter-btn`,
    filter: `${base}-filter`,
    filterClear: `${base}-filter-clear`,
  };
}

// Type exports
export type TableTestIds = typeof TABLE_TEST_IDS;
