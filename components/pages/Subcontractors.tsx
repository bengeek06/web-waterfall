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
 * Uses generic table infrastructure for:
 * - GenericDataTable with per-column filtering & sorting
 * - useTableCrud for data fetching & mutations
 * - createTextColumn, createActionColumn for column definitions
 * - Modular dictionaries (common-table + subcontractors)
 */

// ==================== IMPORTS ====================

// React
import React, { useState } from "react";

// Table Infrastructure
import { ColumnDef } from "@tanstack/react-table";
import { GenericDataTable } from "@/components/shared/GenericDataTable";
import { useTableCrud } from "@/lib/hooks/useTableCrud";
import { createTextColumn, createActionColumn } from "@/lib/utils/table-columns";

// API & Validation
import { subcontractorSchema, SubcontractorFormData } from "@/lib/validation/identity.schemas";
import { useZodForm } from "@/lib/hooks/useZodForm";

// UI Components
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

// Test IDs
import { TEST_IDS } from "@/lib/test-ids";

// ==================== TYPE DEFINITIONS ====================

type Subcontractor = {
  id: string | number;
  name: string;
  email?: string;
  contact_person?: string;
  phone_number?: string;
  address?: string;
  description?: string;
};

type SubcontractorsDictionary = {
  page_title: string;
  create_button: string;
  table_name: string;
  table_email: string;
  table_contact: string;
  table_phone: string;
  table_address: string;
  table_description: string;
  modal_create_title: string;
  modal_edit_title: string;
  form_name: string;
  form_name_required: string;
  form_email: string;
  form_contact: string;
  form_phone: string;
  form_address: string;
  form_description: string;
  delete_confirm_message: string;
  error_create: string;
  error_update: string;
};

type CommonTableDictionary = {
  actions: string;
  edit: string;
  delete: string;
  create: string;
  filter_placeholder: string;
  no_results: string;
  loading: string;
  export: string;
  import: string;
  cancel: string;
  save: string;
};

type SubcontractorsProps = {
  readonly dictionary: SubcontractorsDictionary;
  readonly commonTable: CommonTableDictionary;
};

// ==================== UTILITY FUNCTIONS ====================

function testId(id: string) {
  return { "data-testid": id };
}

/**
 * Custom filter function for optional fields
 * - Filters by "-" to show empty values
 * - Filters by text to search in non-empty values
 */
function optionalFieldFilter<T>(
  row: { original: T },
  _columnId: string,
  filterValue: string,
  accessor: (_item: T) => string | undefined
): boolean {
  const trimmedFilter = filterValue.toLowerCase().trim();
  if (trimmedFilter === "-") {
    return !accessor(row.original);
  }
  const value = accessor(row.original) || "";
  return value.toLowerCase().includes(trimmedFilter);
}

// ==================== COLUMN DEFINITIONS ====================

function createSubcontractorColumns(
  dict: SubcontractorsDictionary,
  commonTable: CommonTableDictionary,
  onEdit: (_item: Subcontractor) => void,
  onDelete: (_id: string | number) => void
): ColumnDef<Subcontractor>[] {
  return [
    createTextColumn<Subcontractor>("name", dict.table_name),
    {
      ...createTextColumn<Subcontractor>("email", dict.table_email),
      cell: ({ row }) => row.original.email || "-",
      filterFn: (row, columnId, filterValue) =>
        optionalFieldFilter(row, columnId, filterValue, (item) => item.email),
    },
    {
      ...createTextColumn<Subcontractor>("contact_person", dict.table_contact),
      cell: ({ row }) => row.original.contact_person || "-",
      filterFn: (row, columnId, filterValue) =>
        optionalFieldFilter(row, columnId, filterValue, (item) => item.contact_person),
    },
    {
      accessorKey: "phone_number",
      header: dict.table_phone,
      enableColumnFilter: true,
      enableSorting: false,
      cell: ({ row }) => row.original.phone_number || "-",
      filterFn: (row, columnId, filterValue) =>
        optionalFieldFilter(row, columnId, filterValue, (item) => item.phone_number),
    },
    {
      accessorKey: "address",
      header: dict.table_address,
      enableColumnFilter: true,
      enableSorting: false,
      cell: ({ row }) => row.original.address || "-",
      filterFn: (row, columnId, filterValue) =>
        optionalFieldFilter(row, columnId, filterValue, (item) => item.address),
    },
    {
      accessorKey: "description",
      header: dict.table_description,
      enableColumnFilter: true,
      enableSorting: false,
      cell: ({ row }) => {
        const description = row.original.description || "-";
        return description.length > 50 ? description.slice(0, 50) + "..." : description;
      },
      filterFn: (row, columnId, filterValue) =>
        optionalFieldFilter(row, columnId, filterValue, (item) => item.description),
    },
    createActionColumn<Subcontractor>(
      { onEdit, onDelete: (item) => onDelete(item.id) },
      { edit: commonTable.edit, delete: commonTable.delete, view: commonTable.actions, actions: commonTable.actions },
      "subcontractor"
    ),
  ];
}

// ==================== MAIN COMPONENT ====================

export default function Subcontractors({ dictionary, commonTable }: SubcontractorsProps) {
  // ==================== STATE ====================

  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Subcontractor | null>(null);

  // ==================== DATA FETCHING ====================

  const { data, isLoading, create, update, remove } = useTableCrud<Subcontractor>({
    service: 'identity',
    path: '/subcontractors',
  });

  // ==================== FORM ====================

  const form = useZodForm({
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

  // ==================== HANDLERS ====================

  function handleCreate() {
    setEditingItem(null);
    form.reset({
      name: "",
      email: "",
      contact_person: "",
      phone_number: "",
      address: "",
      description: "",
    });
    setShowDialog(true);
  }

  function handleEdit(item: Subcontractor) {
    setEditingItem(item);
    form.reset({
      name: item.name,
      email: item.email || "",
      contact_person: item.contact_person || "",
      phone_number: item.phone_number || "",
      address: item.address || "",
      description: item.description || "",
    });
    setShowDialog(true);
  }

  async function handleDelete(id: string | number) {
    if (!globalThis.confirm(dictionary.delete_confirm_message)) return;
    try {
      await remove(id.toString());
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  async function handleSubmit(formData: SubcontractorFormData) {
    const payload = {
      name: formData.name,
      email: formData.email || undefined,
      contact_person: formData.contact_person || undefined,
      phone_number: formData.phone_number || undefined,
      address: formData.address || undefined,
      description: formData.description || undefined,
    };

    try {
      if (editingItem) {
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

  const columns = createSubcontractorColumns(dictionary, commonTable, handleEdit, handleDelete);

  // ==================== RENDER ====================

  return (
    <div className="space-y-4" {...testId(TEST_IDS.pages.subcontractors.container)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" {...testId(TEST_IDS.pages.subcontractors.title)}>
          {dictionary.page_title}
        </h2>
      </div>

      {/* Table */}
      <GenericDataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        dictionary={{
          create: dictionary.create_button,
          filter_placeholder: commonTable.filter_placeholder,
          no_results: commonTable.no_results,
          loading: commonTable.loading,
        }}
        onCreateClick={handleCreate}
        enableImportExport={false}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent {...testId(TEST_IDS.pages.subcontractors.dialog)}>
          <DialogHeader>
            <DialogTitle {...testId(TEST_IDS.pages.subcontractors.dialogTitle)}>
              {editingItem ? dictionary.modal_edit_title : dictionary.modal_create_title}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Name Field */}
            <div>
              <Label htmlFor="name">{dictionary.form_name_required}</Label>
              <Input
                id="name"
                {...form.register("name")}
                {...testId(TEST_IDS.pages.subcontractors.nameInput)}
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <Label htmlFor="email">{dictionary.form_email}</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                {...testId(TEST_IDS.pages.subcontractors.emailInput)}
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Contact Person Field */}
            <div>
              <Label htmlFor="contact_person">{dictionary.form_contact}</Label>
              <Input
                id="contact_person"
                {...form.register("contact_person")}
                {...testId(TEST_IDS.pages.subcontractors.contactInput)}
              />
              {form.formState.errors.contact_person && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.contact_person.message}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <Label htmlFor="phone_number">{dictionary.form_phone}</Label>
              <Input
                id="phone_number"
                {...form.register("phone_number")}
                {...testId(TEST_IDS.pages.subcontractors.phoneInput)}
              />
              {form.formState.errors.phone_number && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.phone_number.message}
                </p>
              )}
            </div>

            {/* Address Field */}
            <div>
              <Label htmlFor="address">{dictionary.form_address}</Label>
              <Input
                id="address"
                {...form.register("address")}
                {...testId(TEST_IDS.pages.subcontractors.addressInput)}
              />
              {form.formState.errors.address && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.address.message}</p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <Label htmlFor="description">{dictionary.form_description}</Label>
              <Input
                id="description"
                {...form.register("description")}
                {...testId(TEST_IDS.pages.subcontractors.descriptionInput)}
              />
              {form.formState.errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                {...testId(TEST_IDS.pages.subcontractors.cancelButton)}
              >
                {commonTable.cancel}
              </Button>
              <Button type="submit" {...testId(TEST_IDS.pages.subcontractors.submitButton)}>
                {editingItem ? commonTable.save : commonTable.create}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
