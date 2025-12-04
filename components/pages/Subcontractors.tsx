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
 * Subcontractors Management Component - Using GenericAssociationTable
 * 
 * Migrated from GenericCrudTable to GenericAssociationTable for Phase 3.
 * Uses expandable={false} since Subcontractors have no associations.
 */

// ==================== IMPORTS ====================

import React from "react";

// Table Infrastructure
import { ColumnDef } from "@tanstack/react-table";
import { GenericAssociationTable } from "@/components/shared/GenericAssociationTable";
import type { ColumnHandlers, AssociationTableDictionary } from "@/components/shared/GenericAssociationTable";
import { createFilterableTextColumn, createActionColumn } from "@/components/shared/tables";

// API & Validation
import { subcontractorSchema, SubcontractorFormData } from "@/lib/validation/identity.schemas";

// UI Components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoUpload } from "@/components/shared/LogoUpload";
import type { ErrorMessages } from "@/lib/hooks/useErrorHandler";

// Icons
import { Building2 } from "lucide-react";

// Test IDs
import { PAGES_TEST_IDS, testId } from "@/lib/test-ids";

// ==================== TYPE DEFINITIONS ====================

type Subcontractor = {
  id: string | number;
  name: string;
  logo_file_id?: string;
  has_logo?: boolean;
  email?: string;
  contact_person?: string;
  phone_number?: string;
  address?: string;
  description?: string;
};

type SubcontractorsDictionary = {
  page_title: string;
  create_button: string;
  table_logo: string;
  logo_create_info: string;
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
  delete_selected: string;
  showing_results: string;
  rows_per_page: string;
  previous: string;
  next: string;
  confirm_delete_title: string;
  cancel: string;
  save: string;
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Generic filter for optional text fields
 */
function optionalFieldFilter<T>(
  row: { original: T },
  _columnId: string,
  filterValue: string,
  accessor: (_item: T) => string | null | undefined
): boolean {
  const value = accessor(row.original);
  if (!value) return false;
  return value.toLowerCase().includes(filterValue.toLowerCase());
}

// ==================== COLUMN DEFINITIONS ====================

/**
 * Create column definitions for subcontractors table
 * This is the ONLY page-specific logic that remains
 */
function createSubcontractorColumns(
  dict: SubcontractorsDictionary,
  commonTable: CommonTableDictionary,
  handlers: ColumnHandlers<Subcontractor>
): ColumnDef<Subcontractor>[] {
  return [
    // Logo column
    {
      accessorKey: "logo",
      header: dict.table_logo,
      enableColumnFilter: false,
      enableSorting: false,
      cell: ({ row }) => (
        row.original.has_logo && row.original.id ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/identity/subcontractors/${row.original.id}/logo`}
            alt={row.original.name}
            className="h-10 w-10 rounded object-contain"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
        )
      ),
    },
    createFilterableTextColumn<Subcontractor>("name", dict.table_name, "subcontractors"),
    {
      ...createFilterableTextColumn<Subcontractor>("email", dict.table_email, "subcontractors"),
      cell: ({ row }) => row.original.email || "-",
    },
    {
      ...createFilterableTextColumn<Subcontractor>("contact_person", dict.table_contact, "subcontractors"),
      cell: ({ row }) => row.original.contact_person || "-",
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
      { 
        onEdit: handlers.onEdit,
        onDelete: (item) => handlers.onDelete(item.id) 
      },
      { 
        actions: commonTable.actions,
        edit: commonTable.edit, 
        delete: commonTable.delete, 
        view: commonTable.actions 
      },
      "subcontractor"
    ),
  ];
}

/**
 * Map dictionaries to GenericAssociationTable format
 */
function mapToAssociationTableDictionary(
  dict: SubcontractorsDictionary,
  commonTable: CommonTableDictionary
): AssociationTableDictionary {
  return {
    // Table strings
    create: commonTable.create,
    filter_placeholder: commonTable.filter_placeholder,
    no_results: commonTable.no_results,
    loading: commonTable.loading,
    export: commonTable.export,
    import: commonTable.import,
    delete_selected: commonTable.delete_selected,
    showing_results: commonTable.showing_results,
    rows_per_page: commonTable.rows_per_page,
    previous: commonTable.previous,
    next: commonTable.next,
    
    // Modal strings
    modal_create_title: dict.modal_create_title,
    modal_edit_title: dict.modal_edit_title,
    
    // Delete confirmation
    delete_confirm_title: commonTable.confirm_delete_title,
    delete_confirm_message: dict.delete_confirm_message,
    cancel: commonTable.cancel,
    save: commonTable.save,
    delete: commonTable.delete,
    
    // Error messages
    errors: {
      create: dict.error_create,
      update: dict.error_update,
    },
  };
}

// ==================== MAIN COMPONENT ====================

export default function Subcontractors({
  dictionary,
  commonTable,
  logoUpload,
}: {
  readonly dictionary: SubcontractorsDictionary;
  readonly commonTable: CommonTableDictionary;
  readonly logoUpload: {
    upload_button: string;
    remove_button: string;
    drag_drop: string;
    uploading: string;
    max_size: string;
    formats: string;
    error_size: string;
    error_format: string;
    success_upload: string;
    success_remove: string;
    error_upload: string;
    error_remove: string;
    errors: ErrorMessages;
  };
}) {
  // Map dictionaries to GenericAssociationTable format
  const tableDictionary = mapToAssociationTableDictionary(dictionary, commonTable);

  return (
    <GenericAssociationTable<Subcontractor, SubcontractorFormData>
      service="identity"
      path="/subcontractors"
      entityName="subcontractors"
      columns={(handlers) => createSubcontractorColumns(dictionary, commonTable, handlers)}
      schema={subcontractorSchema}
      defaultFormValues={{
        name: "",
        email: "",
        contact_person: "",
        phone_number: "",
        address: "",
        description: "",
      }}
      pageTitle={dictionary.page_title}
      dictionary={tableDictionary}
      expandable={false}
      enableImportExport={true}
      enableRowSelection={true}
      testIdPrefix="subcontractors"
      renderFormFields={(form, _dict, editingItem, refresh) => (
        <>
          {/* Logo Upload - Only in edit mode */}
          {editingItem?.id ? (
            <LogoUpload
              currentLogoUrl={
                editingItem.has_logo
                  ? `/api/identity/subcontractors/${editingItem.id}/logo`
                  : undefined
              }
              entityName="logo"
              dictionary={logoUpload}
              onUpload={async (file) => {
                const formData = new FormData();
                formData.append("logo", file);
                
                const response = await fetch(`/api/identity/subcontractors/${editingItem.id}/logo`, {
                  method: "POST",
                  body: formData,
                });
                
                if (!response.ok) {
                  throw new Error("Failed to upload logo");
                }
                
                // Refresh data to update has_logo flag
                if (refresh) {
                  await refresh();
                }
              }}
              onRemove={async () => {
                const response = await fetch(`/api/identity/subcontractors/${editingItem.id}/logo`, {
                  method: "DELETE",
                });
                
                if (!response.ok) {
                  throw new Error("Failed to remove logo");
                }
                
                // Refresh data to update has_logo flag
                if (refresh) {
                  await refresh();
                }
              }}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {dictionary.logo_create_info}
              </p>
            </div>
          )}

          {/* Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="name">{dictionary.form_name}</Label>
            <Input
              {...testId(PAGES_TEST_IDS.subcontractors.nameInput)}
              {...form.register("name")}
              placeholder={dictionary.form_name}
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {dictionary.form_name_required}
              </p>
            )}
          </div>

          {/* Email - Optional */}
          <div className="space-y-2">
            <Label htmlFor="email">{dictionary.form_email}</Label>
            <Input
              {...testId(PAGES_TEST_IDS.subcontractors.emailInput)}
              type="email"
              {...form.register("email")}
              placeholder={dictionary.form_email}
            />
          </div>

          {/* Contact Person - Optional */}
          <div className="space-y-2">
            <Label htmlFor="contact_person">{dictionary.form_contact}</Label>
            <Input
              {...testId(PAGES_TEST_IDS.subcontractors.contactInput)}
              {...form.register("contact_person")}
              placeholder={dictionary.form_contact}
            />
          </div>

          {/* Phone Number - Optional */}
          <div className="space-y-2">
            <Label htmlFor="phone_number">{dictionary.form_phone}</Label>
            <Input
              {...testId(PAGES_TEST_IDS.subcontractors.phoneInput)}
              {...form.register("phone_number")}
              placeholder={dictionary.form_phone}
            />
          </div>

          {/* Address - Optional */}
          <div className="space-y-2">
            <Label htmlFor="address">{dictionary.form_address}</Label>
            <Input
              {...testId(PAGES_TEST_IDS.subcontractors.addressInput)}
              {...form.register("address")}
              placeholder={dictionary.form_address}
            />
          </div>

          {/* Description - Optional */}
          <div className="space-y-2">
            <Label htmlFor="description">{dictionary.form_description}</Label>
            <Input
              {...testId(PAGES_TEST_IDS.subcontractors.descriptionInput)}
              {...form.register("description")}
              placeholder={dictionary.form_description}
            />
          </div>
        </>
      )}
    />
  );
}
