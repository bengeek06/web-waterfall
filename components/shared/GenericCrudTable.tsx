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
 * GenericCrudTable - Complete CRUD table component
 * 
 * Handles everything for a standard CRUD table:
 * - Data fetching (useTableCrud with SWR)
 * - Table display (GenericDataTable)
 * - Create/Edit modal with form
 * - Delete confirmation
 * - Row selection
 * - Import/Export (with custom handlers)
 * - Loading/Empty states
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
import { AlertTriangle } from "lucide-react";

// Hooks & Utils
import { useTableCrud } from "@/lib/hooks/useTableCrud";
import { useZodForm } from "@/lib/hooks/useZodForm";

// Types
export interface GenericCrudTableProps<T extends { id?: string | number }, TForm extends FieldValues = T & FieldValues> {
  /** API service name */
  readonly service: string;
  
  /** API endpoint path */
  readonly path: string;
  
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
  
  /** Render form fields (receives form instance and dictionary) */
  readonly renderFormFields: (_form: UseFormReturn<TForm>, _dictionary: Record<string, string>) => React.ReactNode;
  
  /** Transform form data to API payload (optional) */
  readonly transformFormData?: (_data: TForm) => Partial<T>;
  
  /** Transform API item to form data (optional) */
  readonly transformItemToForm?: (_item: T) => TForm;
  
  /** Custom import handler (optional) */
  readonly onImport?: (_format: 'json' | 'csv') => void;
  
  /** Custom export handler (optional) - receives selected data if any, otherwise all data */
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

  // ==================== DATA FETCHING ====================

  const { data, isLoading, create, update, remove } = useTableCrud<T>({
    service,
    path,
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
        onExport={onExport ? (data, format) => onExport(data, format) : undefined}
        onImport={onImport ? (format) => onImport(format) : undefined}
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
            {renderFormFields(form, dictionary)}

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
    </div>
  );
}
