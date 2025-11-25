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
 * Customers Management Component - REFACTORED WITH GenericCrudTable
 * 
 * Now uses GenericCrudTable for all CRUD operations.
 * This component is reduced from 895 lines to ~120 lines.
 */

// ==================== IMPORTS ====================

import React from "react";

// Table Infrastructure
import { ColumnDef } from "@tanstack/react-table";
import { GenericCrudTable } from "@/components/shared/GenericCrudTable";
import { createTextColumn, createActionColumn } from "@/lib/utils/table-columns";

// API & Validation
import { customerSchema, CustomerFormData } from "@/lib/validation/identity.schemas";

// UI Components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoUpload } from "@/components/shared/LogoUpload";

// Icons
import { Building2 } from "lucide-react";

// Test IDs
import { testId } from "@/lib/test-ids";


// ==================== TYPE DEFINITIONS ====================

type Customer = {
  id: string | number;
  name: string;
  logo_file_id?: string;
  has_logo?: boolean;
  email?: string;
  contact_person?: string;
  phone_number?: string;
  address?: string;
  company_id?: string | number;
  created_at?: string;
  updated_at?: string;
};

type CustomersDictionary = {
  page_title: string;
  create_button: string;
  table_logo: string;
  table_name: string;
  table_email: string;
  table_contact: string;
  table_phone: string;
  table_address: string;
  modal_create_title: string;
  modal_edit_title: string;
  form_name: string;
  form_name_required: string;
  form_email: string;
  form_contact: string;
  form_phone: string;
  form_address: string;
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
 * Create column definitions for customers table
 * This is the ONLY page-specific logic that remains
 */
function createCustomerColumns(
  dict: CustomersDictionary,
  commonTable: CommonTableDictionary,
  handlers: {
    onEdit: (_item: Customer) => void;
    onDelete: (_id: string | number) => void | Promise<void>;
  }
): ColumnDef<Customer>[] {
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
            src={`/api/identity/customers/${row.original.id}/logo`}
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
    createTextColumn<Customer>("name", dict.table_name),
    {
      ...createTextColumn<Customer>("email", dict.table_email),
      cell: ({ row }) => row.original.email || "-",
      filterFn: (row, columnId, filterValue) =>
        optionalFieldFilter(row, columnId, filterValue, (item) => item.email),
    },
    {
      ...createTextColumn<Customer>("contact_person", dict.table_contact),
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
    createActionColumn<Customer>(
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
      "customer"
    ),
  ];
}


// ==================== MAIN COMPONENT ====================

export default function Customers({
  dictionary,
  commonTable,
}: {
  readonly dictionary: CustomersDictionary;
  readonly commonTable: CommonTableDictionary;
}) {
  return (
    <GenericCrudTable<Customer, CustomerFormData>
      service="identity"
      path="/customers"
      columns={(handlers) => createCustomerColumns(dictionary, commonTable, handlers)}
      schema={customerSchema}
      defaultFormValues={{
        name: "",
        email: "",
        contact_person: "",
        phone_number: "",
        address: "",
      }}
      pageTitle={dictionary.page_title}
      dictionary={dictionary}
      commonTable={commonTable}
      enableImportExport={true}
      enableRowSelection={true}
      onImport={(format) => {
        console.log(`Import ${format} clicked`);
      }}
      onExport={(data, format) => {
        console.log(`Export ${data.length} items in ${format} format`);
      }}
      renderFormFields={(form, dict, editingItem, refresh) => (
        <>
          {/* Logo Upload - Only in edit mode */}
          {editingItem?.id ? (
            <LogoUpload
              currentLogoUrl={
                editingItem.has_logo
                  ? `/api/identity/customers/${editingItem.id}/logo`
                  : undefined
              }
              onUpload={async (file) => {
                const formData = new FormData();
                formData.append("logo", file);
                
                const response = await fetch(`/api/identity/customers/${editingItem.id}/logo`, {
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
                const response = await fetch(`/api/identity/customers/${editingItem.id}/logo`, {
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
              entityName="customer logo"
            />
          ) : (
            <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {dict.logo_create_info}
              </p>
            </div>
          )}

          {/* Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="name">{dict.form_name}</Label>
            <Input
              {...testId("customer-name-input")}
              {...form.register("name")}
              placeholder={dict.form_name}
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {dict.form_name_required}
              </p>
            )}
          </div>

          {/* Email - Optional */}
          <div className="space-y-2">
            <Label htmlFor="email">{dict.form_email}</Label>
            <Input
              {...testId("customer-email-input")}
              type="email"
              {...form.register("email")}
              placeholder={dict.form_email}
            />
          </div>

          {/* Contact Person - Optional */}
          <div className="space-y-2">
            <Label htmlFor="contact_person">{dict.form_contact}</Label>
            <Input
              {...testId("customer-contact-input")}
              {...form.register("contact_person")}
              placeholder={dict.form_contact}
            />
          </div>

          {/* Phone Number - Optional */}
          <div className="space-y-2">
            <Label htmlFor="phone_number">{dict.form_phone}</Label>
            <Input
              {...testId("customer-phone-input")}
              {...form.register("phone_number")}
              placeholder={dict.form_phone}
            />
          </div>

          {/* Address - Optional */}
          <div className="space-y-2">
            <Label htmlFor="address">{dict.form_address}</Label>
            <Input
              {...testId("customer-address-input")}
              {...form.register("address")}
              placeholder={dict.form_address}
            />
          </div>
        </>
      )}
    />
  );
}

