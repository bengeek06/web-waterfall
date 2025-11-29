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

import { useState, useCallback, useRef } from 'react';
import { buildExportUrl, buildImportUrl } from '@/lib/api-routes/basic_io';

// ==================== TYPES ====================

export interface ImportReportDetails {
  field: string;
  status: 'resolved' | 'ambiguous' | 'missing' | 'error';
  lookup_value?: string;
  candidates?: number;
  error?: string;
}

export interface ImportReportError {
  original_id?: string;
  status_code?: number | null;
  error?: string;
  response_body?: Record<string, unknown>;
}

export interface ImportReport {
  import_report: {
    total: number;
    success: number;
    failed: number;
    id_mapping: Record<string, string>;
    errors?: ImportReportError[];
    associations_stats?: Record<string, {
      total: number;
      resolved: number;
      missing: number;
      ambiguous: number;
      created_links: number;
      failed_links: number;
      errors?: string[];
    }>;
  };
  resolution_report?: {
    resolved: number;
    ambiguous: number;
    missing: number;
    errors: number;
    details?: ImportReportDetails[];
  };
}

export interface UseBasicIOOptions {
  /** Service name (identity, guardian, project, storage) */
  service: string;
  /** API endpoint path (e.g., 'customers', 'users') - without leading slash */
  endpoint: string;
  /** Entity name for filename (defaults to endpoint) */
  entityName?: string;
  /** Callback on successful export */
  onExportSuccess?: () => void;
  /** Callback on export error */
  onExportError?: (_error: Error) => void;
  /** Callback on successful import */
  onImportSuccess?: (_report: ImportReport) => void;
  /** Callback on import error */
  onImportError?: (_error: Error) => void;
}

export interface ExportOptions {
  /** Export format */
  format: 'json' | 'csv';
  /** IDs to export (if empty, exports all) */
  ids?: (string | number)[];
  /** Include enriched reference metadata */
  enrich?: boolean;
  /** Export as tree structure (for hierarchical data) */
  tree?: boolean;
  /** M2M associations to include */
  associations?: string;
}

export interface ImportOptions {
  /** Import format */
  format: 'json' | 'csv';
  /** File to import (if not provided, opens file picker) */
  file?: File;
  /** Resolve FK references using _references metadata */
  resolveRefs?: boolean;
  /** Behavior for ambiguous FK matches */
  onAmbiguous?: 'skip' | 'fail';
  /** Behavior for missing FK matches */
  onMissing?: 'skip' | 'fail';
  /** How to handle M2M associations */
  associationsMode?: 'skip' | 'merge' | 'recreate';
}

export interface UseBasicIOReturn {
  /** Export data and trigger file download */
  exportData: (_options: ExportOptions) => Promise<void>;
  /** Open file picker and import data */
  importData: (_options: ImportOptions) => Promise<ImportReport | null>;
  /** Whether an export is in progress */
  isExporting: boolean;
  /** Whether an import is in progress */
  isImporting: boolean;
  /** Last export error */
  exportError: Error | null;
  /** Last import error */
  importError: Error | null;
  /** Last import report */
  lastImportReport: ImportReport | null;
}

// ==================== UTILITIES ====================

/**
 * Generate filename for export
 */
function generateFilename(entityName: string, format: 'json' | 'csv'): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${entityName}_${date}.${format}`;
}

/**
 * Trigger file download in browser
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Open file picker dialog
 */
function openFilePicker(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    
    let resolved = false;
    
    const cleanup = () => {
      resolved = true;
    };
    
    input.onchange = (e) => {
      if (resolved) return;
      cleanup();
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      console.log('[useBasicIO] File selected:', file?.name, file?.size, file?.type);
      resolve(file);
    };
    
    // Handle cancel via oncancel event (modern browsers)
    input.oncancel = () => {
      if (resolved) return;
      cleanup();
      console.log('[useBasicIO] File picker cancelled');
      resolve(null);
    };
    
    console.log('[useBasicIO] Opening file picker for:', accept);
    input.click();
  });
}

// ==================== HOOK ====================

/**
 * Hook for basic-io import/export operations
 * 
 * Provides automatic export and import functionality using the basic-io service.
 * 
 * @example
 * ```tsx
 * const { exportData, importData, isExporting, isImporting } = useBasicIO({
 *   service: 'identity',
 *   endpoint: 'customers',
 *   onExportSuccess: () => toast.success('Export completed'),
 *   onImportSuccess: (report) => {
 *     toast.success(`Imported ${report.import_report.success} items`);
 *     refresh(); // Refresh table data
 *   },
 * });
 * 
 * // Export all as JSON
 * await exportData({ format: 'json' });
 * 
 * // Export selected as CSV
 * await exportData({ format: 'csv', ids: selectedIds });
 * 
 * // Import from file
 * await importData({ format: 'json' });
 * ```
 */
export function useBasicIO({
  service,
  endpoint,
  entityName,
  onExportSuccess,
  onExportError,
  onImportSuccess,
  onImportError,
}: UseBasicIOOptions): UseBasicIOReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportError, setExportError] = useState<Error | null>(null);
  const [importError, setImportError] = useState<Error | null>(null);
  const [lastImportReport, setLastImportReport] = useState<ImportReport | null>(null);
  
  // Use ref to avoid stale closures
  const optionsRef = useRef({ service, endpoint, entityName, onExportSuccess, onExportError, onImportSuccess, onImportError });
  optionsRef.current = { service, endpoint, entityName, onExportSuccess, onExportError, onImportSuccess, onImportError };

  const exportData = useCallback(async (options: ExportOptions): Promise<void> => {
    const { service, endpoint, entityName, onExportSuccess, onExportError } = optionsRef.current;
    
    setIsExporting(true);
    setExportError(null);
    
    try {
      const url = buildExportUrl({
        service,
        endpoint,
        type: options.format,
        enrich: options.enrich ?? true,
        tree: options.tree,
        ids: options.ids?.map(String),
        associations: options.associations,
      });
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Export failed: ${response.status}`);
      }
      
      // Get content type to determine actual format
      const contentType = response.headers.get('content-type') || '';
      const actualFormat = contentType.includes('csv') ? 'csv' : 'json';
      
      const blob = await response.blob();
      const filename = generateFilename(entityName || endpoint, actualFormat);
      downloadBlob(blob, filename);
      
      onExportSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setExportError(err);
      onExportError?.(err);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const importData = useCallback(async (options: ImportOptions): Promise<ImportReport | null> => {
    const { service, endpoint, onImportSuccess, onImportError } = optionsRef.current;
    
    // Use provided file or open file picker
    let file: File | null | undefined = options.file;
    if (!file) {
      const accept = options.format === 'csv' ? '.csv' : '.json';
      file = await openFilePicker(accept);
    }
    
    if (!file) {
      return null; // User cancelled
    }
    
    setIsImporting(true);
    setImportError(null);
    
    try {
      const url = buildImportUrl({
        service,
        endpoint,
        type: options.format,
        resolve_refs: options.resolveRefs ?? true,
        on_ambiguous: options.onAmbiguous ?? 'skip',
        on_missing: options.onMissing ?? 'skip',
        associations_mode: options.associationsMode ?? 'skip',
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      const result = await response.json();
      
      // Check if response contains an import_report (even on error responses like 400)
      const hasImportReport = result?.import_report;
      
      if (hasImportReport) {
        // We have a valid report - show it regardless of HTTP status
        const report = result as ImportReport;
        setLastImportReport(report);
        
        // If there were failures, still call success callback to show the report
        // The modal will display the errors
        onImportSuccess?.(report);
        
        return report;
      }
      
      // No import report in response - this is a real error
      if (!response.ok) {
        throw new Error(result.error || result.message || `Import failed: ${response.status}`);
      }
      
      return null;
    } catch (error) {
      console.error('[useBasicIO] Import error:', error);
      const err = error instanceof Error ? error : new Error(String(error));
      setImportError(err);
      onImportError?.(err);
      return null;
    } finally {
      setIsImporting(false);
    }
  }, []);

  return {
    exportData,
    importData,
    isExporting,
    isImporting,
    exportError,
    importError,
    lastImportReport,
  };
}
