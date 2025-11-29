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
 * GenericCrudTable - All-in-one CRUD table component
 * 
 * A comprehensive component that consolidates all common CRUD table functionality:
 * 
 * **Features:**
 * - **Data Fetching**: Automatic data loading via `useTableCrud` (SWR-based)
 * - **Create/Edit Modal**: Dialog with form validation (Zod + React Hook Form)
 * - **Delete Confirmation**: Modern Dialog for both individual and bulk delete
 * - **Table Display**: Full-featured table via `GenericDataTable` (sorting, filtering, pagination)
 * - **Row Selection**: Checkbox-based selection for bulk operations
 * - **Import/Export**: Configurable import/export with format selection (JSON/CSV)
 * - **Loading States**: Automatic loading indicators and empty states
 * - **Internationalization**: Complete i18n support
 * 
 * **Benefits:**
 * - Reduces per-table code by ~35% (from ~400 to ~120 lines)
 * - Eliminates duplication across table pages
 * - Centralizes CRUD logic for easier maintenance
 * - Provides consistent UX across all tables
 * 
 * **Configuration:**
 * The component is highly configurable via props - you provide:
 * - Column definitions (factory function receiving edit/delete handlers)
 * - Zod validation schema
 * - Form field renderer (callback with form instance)
 * - API service and path
 * - Dictionaries for i18n
 * 
 * **Data Transformation:**
 * Optional `transformFormData` and `transformItemToForm` props allow you to:
 * - Convert form data before API submission (e.g., parse dates, format fields)
 * - Convert API response data for form display (e.g., format dates, extract nested fields)
 * 
 * @example
 * ```tsx
 * <GenericCrudTable<User, UserFormData>
 *   service="identity"
 *   path="/users"
 *   columns={(handlers) => createUserColumns(dict, handlers)}
 *   schema={userSchema}
 *   defaultFormValues={{ name: "", email: "" }}
 *   pageTitle={dict.users.page_title}
 *   dictionary={dict.users}
 *   commonTable={dict.common_table}
 *   enableImportExport={true}
 *   enableRowSelection={true}
 *   onImport={(format) => handleImport(format)}
 *   onExport={(data, format) => exportToFile(data, format)}
 *   renderFormFields={(form, dict) => (
 *     <>
 *       <Label>{dict.form_name}</Label>
 *       <Input {...form.register("name")} />
 *     </>
 *   )}
 * />
 * ```
 * 
 * @typeParam T - The type of data items (must have `id` field)
 * @typeParam TForm - The type of form data (defaults to T)
 */

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ZodSchema } from "zod";
import { UseFormReturn, FieldValues, DefaultValues } from "react-hook-form";

// Components
import { GenericDataTable } from "@/components/shared/GenericDataTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ImportReportModal, defaultImportReportDictionary } from "@/components/modals/import-report-modal";
import { AlertTriangle } from "lucide-react";

// Hooks & Utils
import { useTableCrud } from "@/lib/hooks/useTableCrud";
import { useZodForm } from "@/lib/hooks/useZodForm";
import { useBasicIO, ImportReport } from "@/lib/hooks/useBasicIO";

// Types
export interface GenericCrudTableProps<T extends { id?: string | number }, TForm extends FieldValues = T & FieldValues> {
  /** API service name (identity, guardian, project, storage) */
  readonly service: string;
  
  /** API endpoint path (e.g., /customers, /users) */
  readonly path: string;
  
  /** Entity name for export filename (defaults to path without leading slash) */
  readonly entityName?: string;
  
  /** Column definitions factory (receives handlers) */
  readonly columns: (_handlers: { 
    onEdit: (_item: T) => void; 
    onDelete: (_id: string | number) => void | Promise<void>;
  }) => ColumnDef<T>[];
  
  /** Zod schema for form validation */
  readonly schema: ZodSchema<TForm>;
  
  /** Default form values */
  readonly defaultFormValues: DefaultValues<TForm>;
  
  /** Page title */
  readonly pageTitle: string;
  
  /** Dictionaries */
  readonly dictionary: {
    readonly create_button: string;
    readonly modal_create_title: string;
    readonly modal_edit_title: string;
    readonly delete_confirm_message: string;
    readonly [key: string]: string;
  };
  
  readonly commonTable: {
    readonly actions: string;
    readonly edit: string;
    readonly delete: string;
    readonly create: string;
    readonly filter_placeholder: string;
    readonly no_results: string;
    readonly loading: string;
    readonly export: string;
    readonly import: string;
    readonly delete_selected: string;
    readonly showing_results: string;
    readonly rows_per_page: string;
    readonly previous: string;
    readonly next: string;
    readonly confirm_delete_title: string;
    readonly cancel: string;
    readonly save: string;
  };
  
  /** Render form fields (receives form instance, dictionary, editing item, and refresh function) */
  readonly renderFormFields: (
    _form: UseFormReturn<TForm>, 
    _dictionary: Record<string, string>,
    _editingItem?: T | null,
    _refresh?: () => Promise<void>
  ) => React.ReactNode;
  
  /** Transform form data to API payload (optional) */
  readonly transformFormData?: (_data: TForm) => Partial<T>;
  
  /** Transform API item to form data (optional) */
  readonly transformItemToForm?: (_item: T) => TForm;
  
  /** 
   * Custom import handler (optional)
   * If not provided and enableImportExport=true, uses basic-io service automatically
   */
  readonly onImport?: (_format: 'json' | 'csv', _file?: File) => void | Promise<void>;
  
  /** 
   * Custom export handler (optional)
   * If not provided and enableImportExport=true, uses basic-io service automatically
   * Receives selected data if any, otherwise all data
   */
  readonly onExport?: (_data: T[], _format: 'json' | 'csv') => void;
  
  /** Enable import/export (default: false) */
  readonly enableImportExport?: boolean;
  
  /** Enable row selection (default: false) */
  readonly enableRowSelection?: boolean;
  
  /** Test ID prefix */
  readonly testIdPrefix?: string;
}

// ==================== COMPONENT ====================

export function GenericCrudTable<T extends { id?: string | number }, TForm extends FieldValues = T & FieldValues>({
  service,
  path,
  entityName,
  columns,
  schema,
  defaultFormValues,
  pageTitle,
  dictionary,
  commonTable,
  renderFormFields,
  transformFormData,
  transformItemToForm,
  onImport,
  onExport,
  enableImportExport = false,
  enableRowSelection = false,
  testIdPrefix = 'crud-table',
}: GenericCrudTableProps<T, TForm>) {
  // ==================== STATE ====================
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | number | null>(null);
  const [showImportReport, setShowImportReport] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);

  // ==================== DATA FETCHING ====================

  const { data, isLoading, create, update, remove, refresh } = useTableCrud<T>({
    service,
    path,
  });

  // ==================== BASIC-IO IMPORT/EXPORT ====================
  
  // Convert path to endpoint (remove leading slash)
  const endpoint = path.startsWith('/') ? path.slice(1) : path;
  
  const { exportData, importData } = useBasicIO({
    service,
    endpoint,
    entityName: entityName ?? endpoint,
    onImportSuccess: (report) => {
      // Show import report modal
      setImportReport(report);
      setShowImportReport(true);
      // Refresh table data after successful import
      refresh();
    },
    onImportError: (error) => {
      // If we have a report in the error response, show it
      console.error('Import error:', error);
    },
  });

  // ==================== FORM ====================

  const form = useZodForm<TForm>({
    schema,
    defaultValues: defaultFormValues,
  });

  // ==================== HANDLERS ====================

  function handleCreate() {
    setEditingItem(null);
    form.reset(defaultFormValues);
    setShowDialog(true);
  }

  function handleEdit(item: T) {
    setEditingItem(item);
    const formData = transformItemToForm ? transformItemToForm(item) : (item as unknown as TForm);
    form.reset(formData);
    setShowDialog(true);
  }

  async function handleDelete(id: string | number) {
    setPendingDeleteId(id);
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    try {
      await remove(pendingDeleteId.toString());
      setShowDeleteDialog(false);
      setPendingDeleteId(null);
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  async function handleSubmit(formData: TForm) {
    const payload = transformFormData ? transformFormData(formData) : (formData as unknown as Partial<T>);

    try {
      if (editingItem?.id) {
        await update(editingItem.id.toString(), payload);
      } else {
        await create(payload);
      }
      setShowDialog(false);
    } catch (err) {
      console.error("Submit error:", err);
    }
  }

  // ==================== COLUMNS ====================

  const tableColumns = columns({ onEdit: handleEdit, onDelete: handleDelete });

  // ==================== BULK DELETE ====================
  
  const handleBulkDelete = async (selectedIds: (string | number)[]) => {
    try {
      await Promise.all(selectedIds.map(id => remove(id.toString())));
    } catch (err) {
      console.error("Bulk delete error:", err);
    }
  };

  // ==================== IMPORT/EXPORT HANDLERS ====================
  
  /**
   * Default export handler using basic-io service
   * Can be overridden via onExport prop
   * 
   * If selectedData is empty or has no valid IDs, exports ALL data (no ids param)
   * If selectedData has valid IDs, exports only those items (partial export)
   */
  const handleDefaultExport = async (selectedData: T[], format: 'json' | 'csv') => {
    // Only pass ids if we have selected items with valid IDs
    const validIds = selectedData
      .map(item => item.id)
      .filter((id): id is string | number => id !== undefined);
    
    // Pass ids only for partial export (when we have selected items)
    const ids = validIds.length > 0 ? validIds : undefined;
    
    console.log(`Export requested: ${validIds.length} items selected, exporting ${ids ? 'partial' : 'all'}`);
    
    await exportData({
      format,
      ids,
      enrich: true, // Include reference metadata for re-import
    });
  };
  
  /**
   * Default import handler using basic-io service
   * Can be overridden via onImport prop
   */
  const handleDefaultImport = async (format: 'json' | 'csv', file?: File) => {
    await importData({
      format,
      file,
      resolveRefs: true,
      onAmbiguous: 'skip',
      onMissing: 'skip',
    });
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-4" data-testid={`${testIdPrefix}-container`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" data-testid={`${testIdPrefix}-title`}>
          {pageTitle}
        </h2>
      </div>

      {/* Table */}
      <GenericDataTable
        columns={tableColumns}
        data={data}
        isLoading={isLoading}
        dictionary={{
          create: commonTable.create,
          filter_placeholder: commonTable.filter_placeholder,
          no_results: commonTable.no_results,
          loading: commonTable.loading,
          export: commonTable.export,
          import: commonTable.import,
          delete_selected: commonTable.delete,
          showing_results: commonTable.showing_results,
          rows_per_page: commonTable.rows_per_page,
          previous: commonTable.previous,
          next: commonTable.next,
        }}
        onCreateClick={handleCreate}
        enableImportExport={enableImportExport}
        enableRowSelection={enableRowSelection}
        onBulkDelete={enableRowSelection ? handleBulkDelete : undefined}
        onExport={onExport ?? (enableImportExport ? handleDefaultExport : undefined)}
        onImport={onImport ?? (enableImportExport ? handleDefaultImport : undefined)}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent data-testid={`${testIdPrefix}-dialog`}>
          <DialogHeader>
            <DialogTitle data-testid={`${testIdPrefix}-dialog-title`}>
              {editingItem ? dictionary.modal_edit_title : dictionary.modal_create_title}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {renderFormFields(form, dictionary, editingItem, refresh)}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                data-testid={`${testIdPrefix}-cancel-button`}
              >
                {commonTable.cancel}
              </Button>
              <Button type="submit" data-testid={`${testIdPrefix}-submit-button`}>
                {editingItem ? commonTable.save : commonTable.create}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {commonTable.confirm_delete_title || "Confirm Deletion"}
            </DialogTitle>
            <DialogDescription>
              {dictionary.delete_confirm_message || "Are you sure you want to delete this item? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setPendingDeleteId(null);
              }}
            >
              {commonTable.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              {commonTable.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Report Modal */}
      <ImportReportModal
        open={showImportReport}
        onOpenChange={setShowImportReport}
        report={importReport}
        dictionary={defaultImportReportDictionary}
      />
    </div>
  );
}
