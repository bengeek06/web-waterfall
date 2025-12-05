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

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileJson,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { ImportReport } from "@/lib/hooks/useBasicIO";
import { ICON_SIZES } from "@/lib/design-tokens";

// ==================== TYPES ====================

export interface ImportReportModalDictionary {
  title: string;
  summary: string;
  total: string;
  success: string;
  failed: string;
  errors: string;
  error_details: string;
  id_mapping: string;
  original_id: string;
  new_id: string;
  close: string;
  no_errors: string;
  resolution_report: string;
  resolved: string;
  ambiguous: string;
  missing: string;
}

interface ImportReportModalProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  report: ImportReport | null;
  dictionary: ImportReportModalDictionary;
}

// ==================== DEFAULT DICTIONARY ====================

export const defaultImportReportDictionary: ImportReportModalDictionary = {
  title: "Import Report",
  summary: "Summary",
  total: "Total records",
  success: "Successful",
  failed: "Failed",
  errors: "Errors",
  error_details: "Error details",
  id_mapping: "ID Mapping",
  original_id: "Original ID",
  new_id: "New ID",
  close: "Close",
  no_errors: "No errors",
  resolution_report: "Reference Resolution",
  resolved: "Resolved",
  ambiguous: "Ambiguous",
  missing: "Missing",
};

// ==================== COMPONENT ====================

export function ImportReportModal({ 
  open, 
  onOpenChange, 
  report,
  dictionary = defaultImportReportDictionary,
}: Readonly<ImportReportModalProps>) {
  const [showErrors, setShowErrors] = useState(true);
  const [showIdMapping, setShowIdMapping] = useState(false);
  const [showResolution, setShowResolution] = useState(false);

  if (!report) return null;

  const { import_report, resolution_report } = report;
  const hasErrors = import_report.errors && import_report.errors.length > 0;
  const hasIdMapping = import_report.id_mapping && Object.keys(import_report.id_mapping).length > 0;
  const hasResolution = resolution_report && (
    resolution_report.resolved > 0 || 
    resolution_report.ambiguous > 0 || 
    resolution_report.missing > 0
  );
  
  const isSuccess = import_report.failed === 0;
  const isPartialSuccess = import_report.success > 0 && import_report.failed > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className={`${ICON_SIZES.md}`} />
            {dictionary.title}
            {isSuccess && (
              <Badge variant="default" className="ml-2 bg-green-600">
                <CheckCircle2 className={`${ICON_SIZES.xs} mr-1`} />
                Success
              </Badge>
            )}
            {isPartialSuccess && (
              <Badge variant="default" className="ml-2 bg-yellow-600">
                <AlertTriangle className={`${ICON_SIZES.xs} mr-1`} />
                Partial
              </Badge>
            )}
            {!isSuccess && !isPartialSuccess && (
              <Badge variant="destructive" className="ml-2">
                <XCircle className={`${ICON_SIZES.xs} mr-1`} />
                Failed
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {dictionary.summary}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{import_report.total}</div>
              <div className="text-sm text-muted-foreground">{dictionary.total}</div>
            </div>
            <div className="rounded-lg border p-3 text-center bg-green-50 dark:bg-green-950/20">
              <div className="text-2xl font-bold text-green-600">{import_report.success}</div>
              <div className="text-sm text-green-600">{dictionary.success}</div>
            </div>
            <div className="rounded-lg border p-3 text-center bg-red-50 dark:bg-red-950/20">
              <div className="text-2xl font-bold text-red-600">{import_report.failed}</div>
              <div className="text-sm text-red-600">{dictionary.failed}</div>
            </div>
          </div>

          {/* Resolution Report */}
          {hasResolution && resolution_report && (
            <div className="rounded-lg border">
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50"
                onClick={() => setShowResolution(!showResolution)}
              >
                <span className="font-medium flex items-center gap-2">
                  {showResolution ? <ChevronDown className={`${ICON_SIZES.sm}`} /> : <ChevronRight className={`${ICON_SIZES.sm}`} />}
                  {dictionary.resolution_report}
                </span>
                <div className="flex gap-2">
                  {resolution_report.resolved > 0 && (
                    <Badge variant="outline" className="text-green-600">
                      {dictionary.resolved}: {resolution_report.resolved}
                    </Badge>
                  )}
                  {resolution_report.ambiguous > 0 && (
                    <Badge variant="outline" className="text-yellow-600">
                      {dictionary.ambiguous}: {resolution_report.ambiguous}
                    </Badge>
                  )}
                  {resolution_report.missing > 0 && (
                    <Badge variant="outline" className="text-red-600">
                      {dictionary.missing}: {resolution_report.missing}
                    </Badge>
                  )}
                </div>
              </button>
              {showResolution && resolution_report.details && resolution_report.details.length > 0 && (
                <div className="border-t p-3 space-y-2 max-h-40 overflow-y-auto">
                  {resolution_report.details.map((detail) => (
                    <div key={`${detail.field}-${detail.status}-${detail.lookup_value || ''}`} className="flex items-center gap-2 text-sm">
                      {detail.status === 'resolved' && <CheckCircle2 className={`${ICON_SIZES.sm} text-green-600`} />}
                      {detail.status === 'ambiguous' && <AlertTriangle className={`${ICON_SIZES.sm} text-yellow-600`} />}
                      {detail.status === 'missing' && <XCircle className={`${ICON_SIZES.sm} text-red-600`} />}
                      {detail.status === 'error' && <XCircle className={`${ICON_SIZES.sm} text-red-600`} />}
                      <span className="font-mono">{detail.field}</span>
                      {detail.lookup_value && (
                        <span className="text-muted-foreground">→ {detail.lookup_value}</span>
                      )}
                      {detail.error && (
                        <span className="text-red-600">{detail.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Errors Section */}
          {hasErrors && (
            <div className="rounded-lg border border-red-200 dark:border-red-900">
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={() => setShowErrors(!showErrors)}
              >
                <span className="font-medium flex items-center gap-2 text-red-600">
                  {showErrors ? <ChevronDown className={`${ICON_SIZES.sm}`} /> : <ChevronRight className={`${ICON_SIZES.sm}`} />}
                  <XCircle className={`${ICON_SIZES.sm}`} />
                  {dictionary.errors} ({import_report.errors!.length})
                </span>
              </button>
              {showErrors && (
                <div className="border-t border-red-200 dark:border-red-900 p-3 space-y-3 max-h-60 overflow-y-auto">
                  {import_report.errors!.map((error, idx) => (
                    <div key={error.original_id || `error-${idx}`} className="rounded border border-red-100 dark:border-red-900/50 p-2 bg-red-50/50 dark:bg-red-950/10">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono bg-red-100 dark:bg-red-900/30 px-1 rounded">
                          {error.original_id || 'Unknown record'}
                        </span>
                        {error.status_code && (
                          <Badge variant="outline" className="text-red-600 text-xs">
                            HTTP {error.status_code}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        {error.error || 'Unknown error'}
                      </p>
                      {error.response_body && Object.keys(error.response_body).length > 0 && (
                        <pre className="text-xs mt-1 p-1 bg-red-100 dark:bg-red-900/30 rounded overflow-x-auto">
                          {JSON.stringify(error.response_body, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ID Mapping Section */}
          {hasIdMapping && (
            <div className="rounded-lg border">
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50"
                onClick={() => setShowIdMapping(!showIdMapping)}
              >
                <span className="font-medium flex items-center gap-2">
                  {showIdMapping ? <ChevronDown className={`${ICON_SIZES.sm}`} /> : <ChevronRight className={`${ICON_SIZES.sm}`} />}
                  {dictionary.id_mapping} ({Object.keys(import_report.id_mapping).length})
                </span>
              </button>
              {showIdMapping && (
                <div className="border-t p-3 max-h-40 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="text-left pb-2">{dictionary.original_id}</th>
                        <th className="text-center pb-2">→</th>
                        <th className="text-left pb-2">{dictionary.new_id}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(import_report.id_mapping).map(([oldId, newId]) => (
                        <tr key={oldId} className="border-t">
                          <td className="py-1 font-mono text-xs">{oldId}</td>
                          <td className="py-1 text-center text-muted-foreground">→</td>
                          <td className="py-1 font-mono text-xs">{newId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* No errors message */}
          {!hasErrors && import_report.success > 0 && (
            <div className="flex items-center gap-2 text-green-600 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className={`${ICON_SIZES.md}`} />
              <span>{dictionary.no_errors}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {dictionary.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
