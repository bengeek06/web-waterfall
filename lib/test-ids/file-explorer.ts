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
 * Test IDs for FileExplorer component
 * Used for E2E and integration testing
 */
export const FILE_EXPLORER_TEST_IDS = {
  // Container
  container: 'file-explorer-container',
  
  // Toolbar/Breadcrumb
  toolbar: 'file-explorer-toolbar',
  breadcrumbHome: 'file-explorer-breadcrumb-home',
  breadcrumbPart: 'file-explorer-breadcrumb-part',
  
  // Action buttons
  pasteButton: 'file-explorer-paste-button',
  createFolderButton: 'file-explorer-create-folder-button',
  uploadButton: 'file-explorer-upload-button',
  fileInput: 'file-explorer-file-input',
  
  // File list
  fileList: 'file-explorer-file-list',
  loadingSpinner: 'file-explorer-loading-spinner',
  emptyState: 'file-explorer-empty-state',
  emptyStateIcon: 'file-explorer-empty-state-icon',
  emptyStateText: 'file-explorer-empty-state-text',
  emptyStateHint: 'file-explorer-empty-state-hint',
  
  // File/folder items
  fileItem: 'file-explorer-file-item',
  fileItemIcon: 'file-explorer-file-item-icon',
  fileItemName: 'file-explorer-file-item-name',
  fileItemDetails: 'file-explorer-file-item-details',
  fileItemActions: 'file-explorer-file-item-actions',
  
  // Context menu
  contextMenuTrigger: 'file-explorer-context-menu-trigger',
  contextMenuDownload: 'file-explorer-context-menu-download',
  contextMenuRename: 'file-explorer-context-menu-rename',
  contextMenuCopy: 'file-explorer-context-menu-copy',
  contextMenuCut: 'file-explorer-context-menu-cut',
  contextMenuDelete: 'file-explorer-context-menu-delete',
  
  // Create folder dialog
  createFolderDialog: 'file-explorer-create-folder-dialog',
  createFolderDialogTitle: 'file-explorer-create-folder-dialog-title',
  createFolderNameInput: 'file-explorer-create-folder-name-input',
  createFolderCancelButton: 'file-explorer-create-folder-cancel-button',
  createFolderSubmitButton: 'file-explorer-create-folder-submit-button',
  
  // Rename dialog
  renameDialog: 'file-explorer-rename-dialog',
  renameDialogTitle: 'file-explorer-rename-dialog-title',
  renameInput: 'file-explorer-rename-input',
  renameCancelButton: 'file-explorer-rename-cancel-button',
  renameSubmitButton: 'file-explorer-rename-submit-button',
} as const;
