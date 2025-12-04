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
 * Test IDs for OrganizationTree component
 * Used for E2E and integration testing
 */
export const ORGANIZATION_TREE_TEST_IDS = {
  // Container
  card: 'organization-tree-card',
  cardHeader: 'organization-tree-card-header',
  cardTitle: 'organization-tree-card-title',
  cardDescription: 'organization-tree-card-description',
  
  // Toolbar actions
  importDropdown: 'organization-tree-import-dropdown',
  importDropdownTrigger: 'organization-tree-import-dropdown-trigger',
  importJsonButton: 'organization-tree-import-json-button',
  importCsvButton: 'organization-tree-import-csv-button',
  
  exportDropdown: 'organization-tree-export-dropdown',
  exportDropdownTrigger: 'organization-tree-export-dropdown-trigger',
  exportJsonButton: 'organization-tree-export-json-button',
  exportCsvButton: 'organization-tree-export-csv-button',
  exportMermaidButton: 'organization-tree-export-mermaid-button',
  
  addRootButton: 'organization-tree-add-root-button',
  
  // Tree view
  treeContainer: 'organization-tree-container',
  emptyState: 'organization-tree-empty-state',
  treeNodeContainer: 'organization-tree-node-container',
  
  // Tree node elements
  treeNode: 'organization-tree-node',
  treeNodeExpandButton: 'organization-tree-node-expand-button',
  treeNodeIcon: 'organization-tree-node-icon',
  treeNodeName: 'organization-tree-node-name',
  treeNodeDescription: 'organization-tree-node-description',
  treeNodeAddChildButton: 'organization-tree-node-add-child-button',
  treeNodeEditButton: 'organization-tree-node-edit-button',
  treeNodeDeleteButton: 'organization-tree-node-delete-button',
  
  // Positions panel
  positionsPanel: 'organization-tree-positions-panel',
  positionsPanelTitle: 'organization-tree-positions-panel-title',
  positionsPanelUnitName: 'organization-tree-positions-panel-unit-name',
  positionsAddButton: 'organization-tree-positions-add-button',
  positionsLoading: 'organization-tree-positions-loading',
  positionsEmptyState: 'organization-tree-positions-empty-state',
  
  // Position item
  positionItem: 'organization-tree-position-item',
  positionItemTitle: 'organization-tree-position-item-title',
  positionItemDescription: 'organization-tree-position-item-description',
  positionItemLevel: 'organization-tree-position-item-level',
  positionEditButton: 'organization-tree-position-edit-button',
  positionDeleteButton: 'organization-tree-position-delete-button',
  
  // Import report dialog
  importReportDialog: 'organization-tree-import-report-dialog',
  importReportTitle: 'organization-tree-import-report-title',
  importReportDescription: 'organization-tree-import-report-description',
  importReportErrors: 'organization-tree-import-report-errors',
  importReportWarnings: 'organization-tree-import-report-warnings',
  importReportCloseButton: 'organization-tree-import-report-close-button',
  
  // Loading/error states
  loadingState: 'organization-tree-loading-state',
  errorState: 'organization-tree-error-state',
} as const;
