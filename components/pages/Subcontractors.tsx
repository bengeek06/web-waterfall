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
 * Subcontractors Management Component
 * 
 * Subcontractor management interface with:
 * - List all subcontractors with sorting and filtering
 * - Create/Edit/Delete subcontractors
 * - Zod validation for forms
 * - TanStack Table v8 integration
 */

import React, { useState, useEffect } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { IDENTITY_ROUTES } from "@/lib/api-routes/identity";
import { subcontractorSchema, SubcontractorFormData } from "@/lib/validation/identity.schemas";
import { useZodForm } from "@/lib/hooks/useZodForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Download, Upload, FileJson, FileText } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { BASIC_IO_ROUTES } from "@/lib/api-routes";
import { ICON_SIZES, COLOR_CLASSES } from "@/lib/design-tokens";

// ==================== TYPE DEFINITIONS ====================

type SubcontractorsDictionary = {
  page_title: string;
  create_button: string;
  import_button: string;
  export_button: string;
  import_json: string;
  import_csv: string;
  export_json: string;
  export_csv: string;
  table_name: string;
  table_email: string;
  table_contact: string;
  table_phone: string;
  table_address: string;
  table_description: string;
  table_actions: string;
  no_subcontractors: string;
  modal_create_title: string;
  modal_edit_title: string;
  form_name: string;
  form_name_required: string;
  form_email: string;
  form_contact: string;
  form_phone: string;
  form_address: string;
  form_description: string;
  form_cancel: string;
  form_create: string;
  form_save: string;
  delete_confirm_message: string;
  error_fetch: string;
  error_create: string;
  error_update: string;
  error_delete: string;
  error_export: string;
  error_import: string;
  import_report_title: string;
  import_report_close: string;
  import_report_total: string;
  import_report_success: string;
  import_report_failed: string;
  import_report_errors: string;
  import_report_warnings: string;
};

type Subcontractor = {
  id: string | number;
  name: string;
  email?: string;
  contact_person?: string;
  phone_number?: string;
  address?: string;
  description?: string;
  company_id?: string | number;
  created_at?: string;
  updated_at?: string;
};

// ==================== UTILITY FUNCTIONS ====================

function testId(id: string) {
  return { "data-testid": id };
}

// Helper types and functions for sort icons
type SortState = false | "asc" | "desc";

function getSortIcon(sortState: SortState) {
  if (sortState === "asc") return <ArrowUp className="h-4 w-4" />;
  if (sortState === "desc") return <ArrowDown className="h-4 w-4" />;
  return <ArrowUpDown className="h-4 w-4 opacity-50" />;
}

// Table header components
type ColumnHelper = { toggleSorting: (_desc?: boolean) => void; getIsSorted: () => SortState };

const NameHeaderCell = ({ column, label }: { readonly column: ColumnHelper; readonly label: string }) => (
  <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="px-1">
    {label}
    {getSortIcon(column.getIsSorted())}
  </Button>
);

const SortableHeaderCell = ({ column, label }: { readonly column: ColumnHelper; readonly label: string }) => (
  <button
    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    className="flex items-center gap-2 hover:text-foreground"
  >
    {label}
    {getSortIcon(column.getIsSorted())}
  </button>
);

const NameCell = ({ name }: { readonly name: string }) => <span className="font-medium">{name}</span>;

const ActionsHeaderCell = ({ label }: { readonly label: string }) => <span className="text-right block">{label}</span>;

const ActionsCell = ({ 
  subcontractor, 
  onEdit, 
  onDelete 
}: { 
  readonly subcontractor: Subcontractor; 
  readonly onEdit: (_subcontractor: Subcontractor) => void; 
  readonly onDelete: (_id: string | number) => void;
}) => (
  <div className="text-right space-x-2">
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => onEdit(subcontractor)}
          className="p-1 hover:bg-gray-100 rounded inline-flex"
          {...testId(`subcontractor-edit-${subcontractor.id}`)}
        >
          <Pencil className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.update}`} />
        </button>
      </TooltipTrigger>
      <TooltipContent>Éditer le sous-traitant</TooltipContent>
    </Tooltip>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => onDelete(subcontractor.id)}
          className="p-1 hover:bg-gray-100 rounded inline-flex"
          {...testId(`subcontractor-delete-${subcontractor.id}`)}
        >
          <Trash2 className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.delete}`} />
        </button>
      </TooltipTrigger>
      <TooltipContent>Supprimer le sous-traitant</TooltipContent>
    </Tooltip>
  </div>
);

// Columns factory function
function createSubcontractorColumns(
  dictionary: SubcontractorsDictionary,
  onEdit: (_subcontractor: Subcontractor) => void,
  onDelete: (_id: string | number) => void
): ColumnDef<Subcontractor>[] {
  return [
    {
      accessorKey: "name",
      enableColumnFilter: true,
      header: ({ column }) => <NameHeaderCell column={column} label={dictionary.table_name} />,
      cell: ({ row }) => <NameCell name={row.original.name} />,
    },
    {
      accessorKey: "email",
      enableColumnFilter: true,
      cell: ({ row }) => row.original.email || "-",
      filterFn: (row, _columnId, filterValue) => {
        const trimmedFilter = filterValue.toLowerCase().trim();
        if (trimmedFilter === "-") {
          return !row.original.email;
        }
        const email = row.original.email || "";
        return email.toLowerCase().includes(trimmedFilter);
      },
      header: ({ column }) => <SortableHeaderCell column={column} label={dictionary.table_email} />,
    },
    {
      accessorKey: "contact_person",
      enableColumnFilter: true,
      cell: ({ row }) => row.original.contact_person || "-",
      filterFn: (row, _columnId, filterValue) => {
        const trimmedFilter = filterValue.toLowerCase().trim();
        if (trimmedFilter === "-") {
          return !row.original.contact_person;
        }
        const contact = row.original.contact_person || "";
        return contact.toLowerCase().includes(trimmedFilter);
      },
      header: ({ column }) => <SortableHeaderCell column={column} label={dictionary.table_contact} />,
    },
    {
      accessorKey: "phone_number",
      enableColumnFilter: true,
      enableSorting: false,
      header: dictionary.table_phone,
      cell: ({ row }) => row.original.phone_number || "-",
      filterFn: (row, _columnId, filterValue) => {
        const trimmedFilter = filterValue.toLowerCase().trim();
        if (trimmedFilter === "-") {
          return !row.original.phone_number;
        }
        const phone = row.original.phone_number || "";
        return phone.toLowerCase().includes(trimmedFilter);
      },
    },
    {
      accessorKey: "address",
      enableColumnFilter: true,
      enableSorting: false,
      header: dictionary.table_address,
      cell: ({ row }) => row.original.address || "-",
      filterFn: (row, _columnId, filterValue) => {
        const trimmedFilter = filterValue.toLowerCase().trim();
        if (trimmedFilter === "-") {
          return !row.original.address;
        }
        const address = row.original.address || "";
        return address.toLowerCase().includes(trimmedFilter);
      },
    },
    {
      accessorKey: "description",
      enableColumnFilter: true,
      enableSorting: false,
      header: dictionary.table_description,
      cell: ({ row }) => {
        const description = row.original.description || "-";
        return description.length > 50 ? description.slice(0, 50) + "..." : description;
      },
      filterFn: (row, _columnId, filterValue) => {
        const trimmedFilter = filterValue.toLowerCase().trim();
        if (trimmedFilter === "-") {
          return !row.original.description;
        }
        const description = row.original.description || "";
        return description.toLowerCase().includes(trimmedFilter);
      },
    },
    {
      id: "actions",
      enableSorting: false,
      enableColumnFilter: false,
      header: () => <ActionsHeaderCell label={dictionary.table_actions} />,
      cell: ({ row }) => <ActionsCell subcontractor={row.original} onEdit={onEdit} onDelete={onDelete} />,
    },
  ];
}

// ==================== MAIN COMPONENT ====================

export default function Subcontractors({ dictionary }: { readonly dictionary: SubcontractorsDictionary }) {
  // ==================== STATE MANAGEMENT ====================
  
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [error, setError] = useState("");

  // Subcontractor dialog (create/edit)
  const [showSubcontractorDialog, setShowSubcontractorDialog] = useState(false);
  const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | null>(null);

  // Import/Export states
  const [showImportReport, setShowImportReport] = useState(false);
  const [importReport, setImportReport] = useState<{
    total_records: number;
    successful_imports: number;
    failed_imports: number;
    errors: Array<string | { original_id?: string; status_code?: number; error?: string }>;
    warnings: string[];
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Subcontractor form with Zod validation
  const subcontractorForm = useZodForm({
    schema: subcontractorSchema,
    defaultValues: {
      name: "",
      email: "",
      contact_person: "",
      phone_number: "",
      address: "",
      description: "",
    },
  });

  // ==================== DATA FETCHING ====================

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData() {
    try {
      setError("");
      const res = await fetchWithAuth(IDENTITY_ROUTES.subcontractors);

      if (!res.ok) {
        const errorText = await res.text();
        let errorMsg = dictionary.error_fetch;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) errorMsg = errorJson.message;
        } catch {
          // Keep default error message
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      // Le backend retourne {data: [...], pagination: {...}} ou un tableau direct
      let subcontractorsArray: Subcontractor[] = [];
      if (Array.isArray(data)) {
        subcontractorsArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        subcontractorsArray = data.data;
      } else {
        throw new TypeError(dictionary.error_fetch + ": " + JSON.stringify(data).slice(0, 200));
      }

      setSubcontractors(subcontractorsArray);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(dictionary.error_fetch);
    }
  }

  // ==================== SUBCONTRACTOR CRUD OPERATIONS ====================

  function openCreateSubcontractorDialog() {
    setEditingSubcontractor(null);
    subcontractorForm.reset({ name: "", email: "", contact_person: "", phone_number: "", address: "", description: "" });
    setShowSubcontractorDialog(true);
  }

  function openEditSubcontractorDialog(subcontractor: Subcontractor) {
    setEditingSubcontractor(subcontractor);
    subcontractorForm.reset({
      name: subcontractor.name,
      email: subcontractor.email || "",
      contact_person: subcontractor.contact_person || "",
      phone_number: subcontractor.phone_number || "",
      address: subcontractor.address || "",
      description: subcontractor.description || "",
    });
    setShowSubcontractorDialog(true);
  }

  async function handleSubcontractorSubmit(data: SubcontractorFormData) {
    const payload = {
      name: data.name,
      email: data.email || undefined,
      contact_person: data.contact_person || undefined,
      phone_number: data.phone_number || undefined,
      address: data.address || undefined,
      description: data.description || undefined,
    };
    try {
      let res;
      const options = {
        method: editingSubcontractor ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };
      if (editingSubcontractor) {
        res = await fetchWithAuth(IDENTITY_ROUTES.subcontractor(editingSubcontractor.id.toString()), options);
      } else {
        res = await fetchWithAuth(IDENTITY_ROUTES.subcontractors, options);
      }
      if (res.status === 401) {
        globalThis.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erreur API subcontractors:", errorText);
        throw new Error(dictionary.error_create);
      }
      setShowSubcontractorDialog(false);
      fetchData();
    } catch (err) {
      console.error("handleSubcontractorSubmit error:", err);
      setError(editingSubcontractor ? dictionary.error_update : dictionary.error_create);
    }
  }

  async function handleDeleteSubcontractor(subcontractorId: string | number) {
    if (!globalThis.confirm(dictionary.delete_confirm_message)) return;
    try {
      const res = await fetchWithAuth(IDENTITY_ROUTES.subcontractor(subcontractorId.toString()), {
        method: "DELETE",
      });
      if (res.status === 401) {
        globalThis.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(dictionary.error_delete);
      fetchData();
    } catch (err) {
      console.error("handleDeleteSubcontractor error:", err);
      setError(dictionary.error_delete);
    }
  }

  // ==================== IMPORT/EXPORT OPERATIONS ====================

  async function handleExport(format: 'json' | 'csv') {
    try {
      setIsExporting(true);
      setError("");

      const url = `${BASIC_IO_ROUTES.export}?service=identity&path=/subcontractors&type=${format}&enrich=true`;
      const res = await fetchWithAuth(url);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Export error:", errorText);
        throw new Error(dictionary.error_export);
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `subcontractors_export.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("handleExport error:", err);
      if (err instanceof Error) setError(err.message);
      else setError(dictionary.error_export);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport(format: 'json' | 'csv') {
    try {
      setIsImporting(true);
      setError("");

      // Create file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = format === 'json' ? 'application/json' : 'text/csv';
      
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) {
          setIsImporting(false);
          return;
        }

        try {
          const formData = new FormData();
          formData.append('file', file);

          const url = `${BASIC_IO_ROUTES.import}?service=identity&path=/subcontractors&type=${format}`;
          const res = await fetchWithAuth(url, {
            method: 'POST',
            body: formData,
          });

          // Parse response - even if status is 400, there might be a valid import report
          let responseData;
          try {
            responseData = await res.json();
          } catch {
            // If JSON parsing fails, show generic error
            throw new Error(dictionary.error_import);
          }

          // Check if we have an import_report (even with errors)
          if (responseData.import_report) {
            // Map the response format to match our import report structure
            const importData = responseData.import_report;
            const mappedReport = {
              total_records: importData.total || 0,
              successful_imports: importData.success || 0,
              failed_imports: importData.failed || 0,
              errors: importData.errors || [],
              warnings: importData.warnings || [],
            };

            setImportReport(mappedReport);
            setShowImportReport(true);
            
            // Refresh data if there were some successful imports
            if (mappedReport.successful_imports > 0) {
              await fetchData();
            }
          } else if (!res.ok) {
            // No import report and not OK - this is a real error
            throw new Error(dictionary.error_import);
          }
        } catch (err) {
          console.error("handleImport file processing error:", err);
          if (err instanceof Error) setError(err.message);
          else setError(dictionary.error_import);
        } finally {
          setIsImporting(false);
        }
      };

      input.click();
    } catch (err) {
      console.error("handleImport error:", err);
      if (err instanceof Error) setError(err.message);
      else setError(dictionary.error_import);
      setIsImporting(false);
    }
  }

  // ==================== TABLE CONFIGURATION ====================
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = createSubcontractorColumns(dictionary, openEditSubcontractorDialog, handleDeleteSubcontractor);

  const table = useReactTable({
    data: subcontractors,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // ==================== RENDER ====================

  return (
    <div className="space-y-4" {...testId("subcontractors-section")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" {...testId("subcontractors-title")}>
          {dictionary.page_title}
        </h2>
        <div className="flex gap-2">
          {/* Import Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={isImporting}
                {...testId("subcontractor-import-button")}
              >
                <Upload className="h-4 w-4 mr-2" />
                {dictionary.import_button}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleImport('json')}>
                <FileJson className="h-4 w-4 mr-2" />
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleImport('csv')}>
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={isExporting}
                {...testId("subcontractor-export-button")}
              >
                <Download className="h-4 w-4 mr-2" />
                {dictionary.export_button}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileJson className="h-4 w-4 mr-2" />
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={openCreateSubcontractorDialog}
            {...testId("subcontractor-add-button")}
          >
            <Plus className="h-4 w-4 mr-2" />
            {dictionary.create_button}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
          {...testId("subcontractors-error")}
        >
          {error}
        </div>
      )}

      {/* Subcontractors Table */}
      <div className="border rounded-lg">
        <Table {...testId("subcontractors-table")}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <React.Fragment key={headerGroup.id}>
                <TableRow>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={`filter-${header.id}`}>
                      {header.column.getCanFilter() ? (
                        <Input
                          value={(header.column.getFilterValue() as string) ?? ""}
                          onChange={(e) => header.column.setFilterValue(e.target.value)}
                          placeholder="Filtrer..."
                          className="h-8 text-sm"
                        />
                      ) : null}
                    </TableHead>
                  ))}
                </TableRow>
              </React.Fragment>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} {...testId(`subcontractor-row-${row.original.id}`)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.id === "actions" ? "text-right" : undefined}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-gray-500">
                  {dictionary.no_subcontractors}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Subcontractor Create/Edit Dialog */}
      <Dialog open={showSubcontractorDialog} onOpenChange={setShowSubcontractorDialog}>
        <DialogContent {...testId("subcontractor-dialog")}>
          <DialogHeader>
            <DialogTitle {...testId("subcontractor-dialog-title")}>
              {editingSubcontractor ? dictionary.modal_edit_title : dictionary.modal_create_title}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={subcontractorForm.handleSubmit(handleSubcontractorSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">{dictionary.form_name_required}</Label>
              <Input
                id="name"
                {...subcontractorForm.register("name")}
                {...testId("subcontractor-name-input")}
              />
              {subcontractorForm.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {subcontractorForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="email">{dictionary.form_email}</Label>
              <Input
                id="email"
                type="email"
                {...subcontractorForm.register("email")}
                {...testId("subcontractor-email-input")}
              />
              {subcontractorForm.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {subcontractorForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="contact_person">{dictionary.form_contact}</Label>
              <Input
                id="contact_person"
                {...subcontractorForm.register("contact_person")}
                {...testId("subcontractor-contact-input")}
              />
              {subcontractorForm.formState.errors.contact_person && (
                <p className="text-red-500 text-sm mt-1">
                  {subcontractorForm.formState.errors.contact_person.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="phone_number">{dictionary.form_phone}</Label>
              <Input
                id="phone_number"
                {...subcontractorForm.register("phone_number")}
                {...testId("subcontractor-phone-input")}
              />
              {subcontractorForm.formState.errors.phone_number && (
                <p className="text-red-500 text-sm mt-1">
                  {subcontractorForm.formState.errors.phone_number.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="address">{dictionary.form_address}</Label>
              <Input
                id="address"
                {...subcontractorForm.register("address")}
                {...testId("subcontractor-address-input")}
              />
              {subcontractorForm.formState.errors.address && (
                <p className="text-red-500 text-sm mt-1">
                  {subcontractorForm.formState.errors.address.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="description">{dictionary.form_description}</Label>
              <Input
                id="description"
                {...subcontractorForm.register("description")}
                {...testId("subcontractor-description-input")}
              />
              {subcontractorForm.formState.errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {subcontractorForm.formState.errors.description.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSubcontractorDialog(false)}
                {...testId("subcontractor-cancel-button")}
              >
                {dictionary.form_cancel}
              </Button>
              <Button 
                type="submit"
                {...testId("subcontractor-submit-button")}
              >
                {editingSubcontractor ? dictionary.form_save : dictionary.form_create}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Report Dialog */}
      <Dialog open={showImportReport} onOpenChange={setShowImportReport}>
        <DialogContent {...testId("subcontractor-import-report-dialog")}>
          <DialogHeader>
            <DialogTitle>{dictionary.import_report_title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600">{dictionary.import_report_total}</p>
                <p className="text-2xl font-bold">{importReport?.total_records || 0}</p>
              </div>
              <div className="p-4 border rounded-lg bg-green-50">
                <p className="text-sm text-gray-600">{dictionary.import_report_success}</p>
                <p className="text-2xl font-bold text-green-600">{importReport?.successful_imports || 0}</p>
              </div>
              <div className="p-4 border rounded-lg bg-red-50">
                <p className="text-sm text-gray-600">{dictionary.import_report_failed}</p>
                <p className="text-2xl font-bold text-red-600">{importReport?.failed_imports || 0}</p>
              </div>
            </div>

            {/* Errors List */}
            {importReport?.errors && importReport.errors.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-600 mb-2">{dictionary.import_report_errors}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {importReport.errors.map((error, idx) => (
                    <li key={typeof error === 'string' ? `error-${idx}` : error.original_id || `error-${idx}`} className="text-red-600">
                      {typeof error === 'string' ? error : error.error || JSON.stringify(error)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings List */}
            {importReport?.warnings && importReport.warnings.length > 0 && (
              <div>
                <h3 className="font-semibold text-yellow-600 mb-2">{dictionary.import_report_warnings}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {importReport.warnings.map((warning, idx) => (
                    <li key={`warn-${idx}-${warning.substring(0, 20)}`} className="text-yellow-600">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowImportReport(false)}>
              {dictionary.import_report_close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
