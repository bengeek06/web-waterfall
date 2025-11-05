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
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { ICON_SIZES, COLOR_CLASSES } from "@/lib/design-tokens";

// ==================== TYPE DEFINITIONS ====================

type SubcontractorsDictionary = {
  page_title: string;
  create_button: string;
  table_name: string;
  table_email: string;
  table_contact: string;
  table_phone: string;
  table_address: string;
  table_services: string;
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
  form_services: string;
  form_cancel: string;
  form_create: string;
  form_save: string;
  delete_confirm_message: string;
  error_fetch: string;
  error_create: string;
  error_update: string;
  error_delete: string;
};

type Subcontractor = {
  id: string | number;
  name: string;
  email?: string;
  contact_person?: string;
  phone_number?: string;
  address?: string;
  services_offered?: string;
  company_id?: string | number;
  created_at?: string;
  updated_at?: string;
};

// ==================== UTILITY FUNCTIONS ====================

function testId(id: string) {
  return { "data-testid": id };
}

// ==================== MAIN COMPONENT ====================

export default function Subcontractors({ dictionary }: { dictionary: SubcontractorsDictionary }) {
  // ==================== STATE MANAGEMENT ====================
  
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [error, setError] = useState("");

  // Subcontractor dialog (create/edit)
  const [showSubcontractorDialog, setShowSubcontractorDialog] = useState(false);
  const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | null>(null);

  // Subcontractor form with Zod validation
  const subcontractorForm = useZodForm({
    schema: subcontractorSchema,
    defaultValues: {
      name: "",
      email: "",
      contact_person: "",
      phone_number: "",
      address: "",
      services_offered: "",
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
      let subcontractorsArray: Subcontractor[] = [];
      if (Array.isArray(data)) {
        subcontractorsArray = data;
      } else {
        throw new Error(dictionary.error_fetch + ": " + JSON.stringify(data).slice(0, 200));
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
    subcontractorForm.reset({ name: "", email: "", contact_person: "", phone_number: "", address: "", services_offered: "" });
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
      services_offered: subcontractor.services_offered || "",
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
      services_offered: data.services_offered || undefined,
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
        window.location.href = "/login";
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
    if (!window.confirm(dictionary.delete_confirm_message)) return;
    try {
      const res = await fetchWithAuth(IDENTITY_ROUTES.subcontractor(subcontractorId.toString()), {
        method: "DELETE",
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(dictionary.error_delete);
      fetchData();
    } catch (err) {
      console.error("handleDeleteSubcontractor error:", err);
      setError(dictionary.error_delete);
    }
  }

  // ==================== TABLE CONFIGURATION ====================
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<Subcontractor>[] = [
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
      accessorKey: "services_offered",
      enableColumnFilter: true,
      enableSorting: false,
      header: dictionary.table_services,
      cell: ({ row }) => {
        const services = row.original.services_offered || "-";
        return services.length > 50 ? services.slice(0, 50) + "..." : services;
      },
      filterFn: (row, _columnId, filterValue) => {
        const trimmedFilter = filterValue.toLowerCase().trim();
        if (trimmedFilter === "-") {
          return !row.original.services_offered;
        }
        const services = row.original.services_offered || "";
        return services.toLowerCase().includes(trimmedFilter);
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
                onClick={() => openEditSubcontractorDialog(row.original)}
                className="p-1 hover:bg-gray-100 rounded inline-flex"
                {...testId(`subcontractor-edit-${row.original.id}`)}
              >
                <Pencil className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.update}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Éditer le sous-traitant</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleDeleteSubcontractor(row.original.id)}
                className="p-1 hover:bg-gray-100 rounded inline-flex"
                {...testId(`subcontractor-delete-${row.original.id}`)}
              >
                <Trash2 className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.delete}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Supprimer le sous-traitant</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

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
        <Button 
          onClick={openCreateSubcontractorDialog}
          {...testId("subcontractor-add-button")}
        >
          <Plus className="h-4 w-4 mr-2" />
          {dictionary.create_button}
        </Button>
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
              <Label htmlFor="services_offered">{dictionary.form_services}</Label>
              <Input
                id="services_offered"
                {...subcontractorForm.register("services_offered")}
                {...testId("subcontractor-services-input")}
              />
              {subcontractorForm.formState.errors.services_offered && (
                <p className="text-red-500 text-sm mt-1">
                  {subcontractorForm.formState.errors.services_offered.message}
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
    </div>
  );
}
