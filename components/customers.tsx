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
 * Customers Management Component
 * 
 * Customer management interface with:
 * - List all customers with sorting and filtering
 * - Create/Edit/Delete customers
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
import { IDENTITY_ROUTES, BASIC_IO_ROUTES } from "@/lib/api-routes";
import { customerSchema, CustomerFormData } from "@/lib/validation/identity.schemas";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Download, Upload, FileJson, FileText } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { ICON_SIZES, COLOR_CLASSES } from "@/lib/design-tokens";

// ==================== TYPE DEFINITIONS ====================

type CustomersDictionary = {
  page_title: string;
  create_button: string;
  table_name: string;
  table_email: string;
  table_contact: string;
  table_phone: string;
  table_address: string;
  table_actions: string;
  no_customers: string;
  modal_create_title: string;
  modal_edit_title: string;
  form_name: string;
  form_name_required: string;
  form_email: string;
  form_contact: string;
  form_phone: string;
  form_address: string;
  form_cancel: string;
  form_create: string;
  form_save: string;
  delete_confirm_message: string;
  error_fetch: string;
  error_create: string;
  error_update: string;
  error_delete: string;
};

type Customer = {
  id: string | number;
  name: string;
  email?: string;
  contact_person?: string;
  phone_number?: string;
  address?: string;
  company_id?: string | number;
  created_at?: string;
  updated_at?: string;
};

// ==================== UTILITY FUNCTIONS ====================

function testId(id: string) {
  return { "data-testid": id };
}

// ==================== MAIN COMPONENT ====================

export default function Customers({ dictionary }: { dictionary: CustomersDictionary }) {
  // ==================== STATE MANAGEMENT ====================
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState("");

  // Customer dialog (create/edit)
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Import/Export state
  const [showImportReport, setShowImportReport] = useState(false);
  const [importReport, setImportReport] = useState<{
    total_records: number;
    successful_imports: number;
    failed_imports: number;
    errors?: Array<{ record_index: number; error: string; record?: unknown }>;
    warnings?: Array<{ record_index: number; warning: string }>;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Customer form with Zod validation
  const customerForm = useZodForm({
    schema: customerSchema,
    defaultValues: {
      name: "",
      email: "",
      contact_person: "",
      phone_number: "",
      address: "",
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
      const res = await fetchWithAuth(IDENTITY_ROUTES.customers);

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
      let customersArray: Customer[] = [];
      if (Array.isArray(data)) {
        customersArray = data;
      } else {
        throw new Error(dictionary.error_fetch + ": " + JSON.stringify(data).slice(0, 200));
      }

      setCustomers(customersArray);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(dictionary.error_fetch);
    }
  }

  // ==================== CUSTOMER CRUD OPERATIONS ====================

  function openCreateCustomerDialog() {
    setEditingCustomer(null);
    customerForm.reset({ name: "", email: "", contact_person: "", phone_number: "", address: "" });
    setShowCustomerDialog(true);
  }

  function openEditCustomerDialog(customer: Customer) {
    setEditingCustomer(customer);
    customerForm.reset({
      name: customer.name,
      email: customer.email || "",
      contact_person: customer.contact_person || "",
      phone_number: customer.phone_number || "",
      address: customer.address || "",
    });
    setShowCustomerDialog(true);
  }

  async function handleCustomerSubmit(data: CustomerFormData) {
    const payload = {
      name: data.name,
      email: data.email || undefined,
      contact_person: data.contact_person || undefined,
      phone_number: data.phone_number || undefined,
      address: data.address || undefined,
    };
    try {
      let res;
      const options = {
        method: editingCustomer ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };
      if (editingCustomer) {
        res = await fetchWithAuth(IDENTITY_ROUTES.customer(editingCustomer.id.toString()), options);
      } else {
        res = await fetchWithAuth(IDENTITY_ROUTES.customers, options);
      }
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erreur API customers:", errorText);
        throw new Error(dictionary.error_create);
      }
      setShowCustomerDialog(false);
      fetchData();
    } catch (err) {
      console.error("handleCustomerSubmit error:", err);
      setError(editingCustomer ? dictionary.error_update : dictionary.error_create);
    }
  }

  async function handleDeleteCustomer(customerId: string | number) {
    if (!window.confirm(dictionary.delete_confirm_message)) return;
    try {
      const res = await fetchWithAuth(IDENTITY_ROUTES.customer(customerId.toString()), {
        method: "DELETE",
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(dictionary.error_delete);
      fetchData();
    } catch (err) {
      console.error("handleDeleteCustomer error:", err);
      setError(dictionary.error_delete);
    }
  }

  // ==================== IMPORT/EXPORT OPERATIONS ====================

  async function handleExport(format: 'json' | 'csv') {
    try {
      setIsExporting(true);
      setError("");
      
      // Build export URL with parameters
      const exportUrl = new URL(BASIC_IO_ROUTES.export, globalThis.location.origin);
      exportUrl.searchParams.set('service', 'identity');
      exportUrl.searchParams.set('path', '/customers');
      exportUrl.searchParams.set('type', format);
      exportUrl.searchParams.set('enrich', 'true');
      
      const res = await fetchWithAuth(exportUrl.toString());
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Export failed: ${errorText}`);
      }
      
      // Download file
      const blob = await res.blob();
      const downloadUrl = globalThis.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `customers_export.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(downloadUrl);
      
    } catch (err) {
      console.error("Export error:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport(format: 'json' | 'csv') {
    try {
      // Create file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = format === 'json' ? '.json' : '.csv';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        try {
          setIsImporting(true);
          setError("");
          
          // Build import URL with parameters
          const importUrl = new URL(BASIC_IO_ROUTES.import, globalThis.location.origin);
          importUrl.searchParams.set('service', 'identity');
          importUrl.searchParams.set('path', '/customers');
          importUrl.searchParams.set('type', format);
          
          // Create FormData with file
          const formData = new FormData();
          formData.append('file', file);
          
          const res = await fetchWithAuth(importUrl.toString(), {
            method: 'POST',
            body: formData,
          });
          
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Import failed: ${errorText}`);
          }
          
          const responseData = await res.json();
          console.log('Import report received:', responseData);
          
          // Extract and map the import_report to expected format
          const importData = responseData.import_report || responseData;
          const mappedReport = {
            total_records: importData.total || 0,
            successful_imports: importData.success || 0,
            failed_imports: importData.failed || 0,
            errors: importData.errors || [],
            warnings: importData.warnings || []
          };
          
          setImportReport(mappedReport);
          setShowImportReport(true);
          
          // Refresh data after import
          fetchData();
          
        } catch (err) {
          console.error("Import error:", err);
          setError(err instanceof Error ? err.message : "Erreur lors de l'import");
        } finally {
          setIsImporting(false);
        }
      };
      
      input.click();
    } catch (err) {
      console.error("handleImport error:", err);
      setError("Erreur lors de la sélection du fichier");
    }
  }

  // ==================== TABLE CONFIGURATION ====================
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      enableColumnFilter: true,
      header: ({ column }) => {
        return (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2 hover:text-foreground"
          >
            {dictionary.table_name}
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
          </button>
        );
      },
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
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
      header: ({ column }) => {
        return (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2 hover:text-foreground"
          >
            {dictionary.table_email}
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
          </button>
        );
      },
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
      header: ({ column }) => {
        return (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2 hover:text-foreground"
          >
            {dictionary.table_contact}
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
          </button>
        );
      },
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
      id: "actions",
      enableSorting: false,
      enableColumnFilter: false,
      header: () => <span className="text-right block">{dictionary.table_actions}</span>,
      cell: ({ row }) => (
        <div className="text-right space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => openEditCustomerDialog(row.original)}
                className="p-1 hover:bg-gray-100 rounded inline-flex"
                {...testId(`customer-edit-${row.original.id}`)}
              >
                <Pencil className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.update}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Éditer le client</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleDeleteCustomer(row.original.id)}
                className="p-1 hover:bg-gray-100 rounded inline-flex"
                {...testId(`customer-delete-${row.original.id}`)}
              >
                <Trash2 className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.delete}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Supprimer le client</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: customers,
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
    <div className="space-y-4" {...testId("customers-section")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" {...testId("customers-title")}>
          {dictionary.page_title}
        </h2>
        <div className="flex items-center gap-2">
          {/* Import Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                disabled={isImporting}
                {...testId("customer-import-button")}
              >
                <Upload className={`${ICON_SIZES.sm} mr-2`} />
                Importer depuis
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleImport('json')}>
                <FileJson className={`${ICON_SIZES.sm} mr-2`} />
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleImport('csv')}>
                <FileText className={`${ICON_SIZES.sm} mr-2`} />
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
                {...testId("customer-export-button")}
              >
                <Download className={`${ICON_SIZES.sm} mr-2`} />
                Exporter vers
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileJson className={`${ICON_SIZES.sm} mr-2`} />
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className={`${ICON_SIZES.sm} mr-2`} />
                CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Create Button */}
          <Button 
            onClick={openCreateCustomerDialog}
            {...testId("customer-add-button")}
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
          {...testId("customers-error")}
        >
          {error}
        </div>
      )}

      {/* Customers Table */}
      <div className="border rounded-lg">
        <Table {...testId("customers-table")}>
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
                <TableRow key={row.id} {...testId(`customer-row-${row.original.id}`)}>
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
                  {dictionary.no_customers}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Customer Create/Edit Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent {...testId("customer-dialog")}>
          <DialogHeader>
            <DialogTitle {...testId("customer-dialog-title")}>
              {editingCustomer ? dictionary.modal_edit_title : dictionary.modal_create_title}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={customerForm.handleSubmit(handleCustomerSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">{dictionary.form_name_required}</Label>
              <Input
                id="name"
                {...customerForm.register("name")}
                {...testId("customer-name-input")}
              />
              {customerForm.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {customerForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="email">{dictionary.form_email}</Label>
              <Input
                id="email"
                type="email"
                {...customerForm.register("email")}
                {...testId("customer-email-input")}
              />
              {customerForm.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {customerForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="contact_person">{dictionary.form_contact}</Label>
              <Input
                id="contact_person"
                {...customerForm.register("contact_person")}
                {...testId("customer-contact-input")}
              />
              {customerForm.formState.errors.contact_person && (
                <p className="text-red-500 text-sm mt-1">
                  {customerForm.formState.errors.contact_person.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="phone_number">{dictionary.form_phone}</Label>
              <Input
                id="phone_number"
                {...customerForm.register("phone_number")}
                {...testId("customer-phone-input")}
              />
              {customerForm.formState.errors.phone_number && (
                <p className="text-red-500 text-sm mt-1">
                  {customerForm.formState.errors.phone_number.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="address">{dictionary.form_address}</Label>
              <Input
                id="address"
                {...customerForm.register("address")}
                {...testId("customer-address-input")}
              />
              {customerForm.formState.errors.address && (
                <p className="text-red-500 text-sm mt-1">
                  {customerForm.formState.errors.address.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustomerDialog(false)}
                {...testId("customer-cancel-button")}
              >
                {dictionary.form_cancel}
              </Button>
              <Button 
                type="submit"
                {...testId("customer-submit-button")}
              >
                {editingCustomer ? dictionary.form_save : dictionary.form_create}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Report Dialog */}
      <Dialog open={showImportReport} onOpenChange={setShowImportReport}>
        <DialogContent {...testId("import-report-dialog")} className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rapport d&apos;import</DialogTitle>
            <DialogDescription>
              Résumé de l&apos;opération d&apos;import
            </DialogDescription>
          </DialogHeader>
          {importReport && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {importReport.total_records}
                  </div>
                  <div className="text-sm text-blue-800">Total</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {importReport.successful_imports}
                  </div>
                  <div className="text-sm text-green-800">Réussis</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {importReport.failed_imports}
                  </div>
                  <div className="text-sm text-red-800">Échecs</div>
                </div>
              </div>

              {/* Errors */}
              {importReport.errors && importReport.errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-600">Erreurs</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                    {importReport.errors.map((err) => (
                      <div key={`error-${err.record_index}`} className="text-sm">
                        <div>
                          <span className="font-medium">Ligne {err.record_index + 1}:</span>{' '}
                          {err.error}
                        </div>
                        {err.record !== undefined && err.record !== null && (
                          <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(err.record)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {importReport.warnings && importReport.warnings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-yellow-600">Avertissements</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                    {importReport.warnings.map((warn) => (
                      <div key={`warning-${warn.record_index}`} className="text-sm">
                        <span className="font-medium">Ligne {warn.record_index + 1}:</span>{' '}
                        {warn.warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowImportReport(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
