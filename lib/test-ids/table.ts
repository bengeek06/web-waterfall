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
    table: 'generic-table-table',
    tableHeader: 'generic-table-header',
    tableBody: 'generic-table-body',
    loadingRow: 'generic-table-loading-row',
    emptyRow: 'generic-table-empty-row',
    resultsCount: 'generic-table-results-count',
  },
} as const;

// Type exports
export type TableTestIds = typeof TABLE_TEST_IDS;
