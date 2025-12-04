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
 * Roles Management Component (V2 - Using GenericAssociationTable)
 * 
 * Migrated from 1112 lines to ~150 lines using GenericAssociationTable.
 * 
 * Features:
 * - List all roles with expandable policy associations
 * - Create/Edit/Delete roles
 * - Assign/Remove policies to/from roles (M2M)
 * - Import/Export with basic-io
 * - Full test coverage with data-testid attributes
 */

import React, { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { FileText, Edit, Trash2, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { GenericAssociationTable } from "@/components/shared/GenericAssociationTable";
import type { ColumnHandlers, AssociationTableDictionary } from "@/components/shared/GenericAssociationTable";
import { roleSchema, type RoleFormData } from "@/lib/validation/guardian.schemas";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { GUARDIAN_ROUTES } from "@/lib/api-routes/guardian";
import { ColumnHeader } from "@/components/shared/tables";
import type { ColumnConfig } from "@/components/shared/tables";
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";
import { DASHBOARD_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES, COLOR_CLASSES } from "@/lib/design-tokens";

// ==================== TYPE DEFINITIONS ====================

type Policy = {
  id: string | number;
  name: string;
  description?: string;
};

type Role = {
  id: string | number;
  name: string;
  description?: string;
  policies?: Policy[];
};

type RolesDictionary = {
  page_title: string;
  create_button: string;
  table_name: string;
  table_description: string;
  table_policies: string;
  table_actions: string;
  no_roles: string;
  modal_create_title: string;
  modal_edit_title: string;
  form_name: string;
  form_name_required: string;
  form_description: string;
  form_cancel: string;
  form_create: string;
  form_save: string;
  policies_modal_title: string;
  policies_select: string;
  policies_add: string;
  delete_confirm_title: string;
  delete_confirm_message: string;
  delete_policy_confirm_message: string;
  delete_cancel: string;
  delete_confirm: string;
  error_fetch: string;
  error_create: string;
  error_update: string;
  error_delete: string;
  import_button: string;
  export_button: string;
  import_json: string;
  import_csv: string;
  export_json: string;
  export_csv: string;
  error_export: string;
  error_import: string;
  import_report_title: string;
  import_report_close: string;
  import_report_total: string;
  import_report_success: string;
  import_report_failed: string;
  import_report_errors: string;
  import_report_warnings: string;
  // Association dialog keys
  association_dialog_title?: string;
  association_dialog_description?: string;
  associated_items?: string;
  available_items?: string;
  no_available_items?: string;
  no_associations?: string;
  add_selected?: string;
  selected_count?: string;
  select_all?: string;
  clear_selection?: string;
  search_placeholder?: string;
  add_association?: string;
  remove_association?: string;
  errors: {
    network: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    serverError: string;
    clientError: string;
    unknown: string;
  };
};

// ==================== COLUMN CONFIGS ====================

const createColumnConfigs = (dictionary: RolesDictionary): Record<string, ColumnConfig<Role>> => ({
  name: {
    key: "name" as keyof Role,
    header: dictionary.table_name,
    sortable: true,
    filterable: true,
    filterType: "text",
    filterPlaceholder: "Filtrer par nom...",
  },
  description: {
    key: "description" as keyof Role,
    header: dictionary.table_description,
    sortable: true,
    filterable: true,
    filterType: "text",
    filterPlaceholder: "Filtrer par description...",
  },
});

// ==================== COLUMN FACTORY ====================

function createRolesColumns(
  dictionary: RolesDictionary,
  handlers: ColumnHandlers<Role>,
  availablePolicies: Policy[] = []
): ColumnDef<Role>[] {
  const configs = createColumnConfigs(dictionary);
  
  return [
    // Name column with sorting and filtering
    {
      accessorKey: "name",
      enableColumnFilter: true,
      filterFn: "includesString",
      header: ({ column }) => (
        <ColumnHeader<Role>
          config={configs.name}
          tanstackColumn={column}
          filterValue={column.getFilterValue() as string}
          onFilterChange={(v) => column.setFilterValue(v)}
          testIdPrefix="roles"
        />
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    // Description column with sorting and filtering
    {
      accessorKey: "description",
      enableColumnFilter: true,
      filterFn: "includesString",
      header: ({ column }) => (
        <ColumnHeader<Role>
          config={configs.description}
          tanstackColumn={column}
          filterValue={column.getFilterValue() as string}
          onFilterChange={(v) => column.setFilterValue(v)}
          testIdPrefix="roles"
        />
      ),
      cell: ({ row }) => row.original.description || "-",
    },
    // Policies column with multi-select filter
    {
      accessorKey: "policies",
      enableSorting: false,
      enableColumnFilter: true,
      filterFn: (row, _columnId, filterValue: string[]) => {
        if (!filterValue || filterValue.length === 0) return true;
        const rolePolicies = row.original.policies || [];
        // Role passes filter if it has at least one of the selected policies
        return rolePolicies.some(policy => filterValue.includes(String(policy.id)));
      },
      header: ({ column }) => (
        <ColumnHeader<Role>
          config={{
            key: "policies",
            header: dictionary.table_policies,
            sortable: false,
            filterable: true,
            filterType: "multi-select",
            filterOptions: availablePolicies.map((policy) => ({
              value: String(policy.id),
              label: policy.name,
            })),
          }}
          tanstackColumn={column}
          filterValue={column.getFilterValue()}
          onFilterChange={(value) => column.setFilterValue(value)}
          testIdPrefix="roles"
        />
      ),
      cell: ({ row }) => `${row.original.policies?.length || 0} politique(s)`,
    },
    // Actions
    {
      id: "actions",
      enableSorting: false,
      enableColumnFilter: false,
      header: () => <span className="text-right block">{dictionary.table_actions}</span>,
      cell: ({ row }) => (
        <TooltipProvider>
          <div className="flex items-center justify-end gap-1">
            {/* Add Policy Button */}
            {handlers.onAddAssociation && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlers.onAddAssociation?.(row.original, "policies")}
                    {...testId(DASHBOARD_TEST_IDS.roles.addPolicyButton(row.original.id.toString()))}
                  >
                    <PlusSquare className={ICON_SIZES.sm} />
                    <span className="sr-only">Ajouter une politique</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ajouter une politique</TooltipContent>
              </Tooltip>
            )}
            {/* Edit Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlers.onEdit(row.original)}
                  {...testId(DASHBOARD_TEST_IDS.roles.editButton(row.original.id.toString()))}
                >
                  <Edit className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.update}`} />
                  <span className="sr-only">Éditer</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Éditer le rôle</TooltipContent>
            </Tooltip>
            {/* Delete Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handlers.onDelete(row.original.id)}
                  {...testId(DASHBOARD_TEST_IDS.roles.deleteButton(row.original.id.toString()))}
                >
                  <Trash2 className={ICON_SIZES.sm} />
                  <span className="sr-only">Supprimer</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Supprimer le rôle</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      ),
    },
  ];
}

// ==================== ASSOCIATION CONFIG ====================

const policiesAssociation = {
  type: "many-to-many" as const,
  name: "policies",
  label: "Politiques",
  service: "guardian",
  path: "/policies",
  junctionEndpoint: "/roles/{id}/policies",
  displayField: "name",
  secondaryField: "description",
  icon: FileText,
  addBodyField: "policy_id",
};

// ==================== COMPONENT ====================

export default function RolesV2({ dictionary }: { readonly dictionary: RolesDictionary }) {
  const { handleError } = useErrorHandler({ messages: dictionary.errors });
  
  // ==================== POLICIES STATE (for filter) ====================
  const [availablePolicies, setAvailablePolicies] = useState<Policy[]>([]);

  // Fetch policies on mount for the filter dropdown
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await fetchWithAuth(GUARDIAN_ROUTES.policies);
        if (res.ok) {
          const data = await res.json();
          setAvailablePolicies(Array.isArray(data) ? data : (data.data || []));
        }
      } catch (error) {
        handleError(error);
      }
    };
    fetchPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map dictionary to GenericAssociationTable format
  const tableDictionary: AssociationTableDictionary = {
    create: dictionary.create_button,
    no_results: dictionary.no_roles,
    loading: "Loading...",
    export: dictionary.export_button,
    import: dictionary.import_button,
    delete_selected: dictionary.delete_confirm,
    showing_results: "Showing {from} to {to} of {total} result(s)",
    rows_per_page: "Rows per page",
    previous: "Previous",
    next: "Next",
    modal_create_title: dictionary.modal_create_title,
    modal_edit_title: dictionary.modal_edit_title,
    delete_confirm_title: dictionary.delete_confirm_title,
    delete_confirm_message: dictionary.delete_confirm_message,
    cancel: dictionary.form_cancel,
    save: dictionary.form_save,
    delete: dictionary.delete_confirm,
    // Association keys from dictionary
    no_associations: dictionary.no_associations,
    add_association: dictionary.add_association,
    remove_association: dictionary.remove_association,
    association_dialog_title: dictionary.association_dialog_title,
    association_dialog_description: dictionary.association_dialog_description,
    associated_items: dictionary.associated_items,
    available_items: dictionary.available_items,
    no_available_items: dictionary.no_available_items,
    add_selected: dictionary.add_selected,
    selected_count: dictionary.selected_count,
    select_all: dictionary.select_all,
    clear_selection: dictionary.clear_selection,
    search_placeholder: dictionary.search_placeholder,
    // Import report
    import_report_title: dictionary.import_report_title,
    import_report_total: dictionary.import_report_total,
    import_report_success: dictionary.import_report_success,
    import_report_failed: dictionary.import_report_failed,
    import_report_errors: dictionary.import_report_errors,
    import_report_warnings: dictionary.import_report_warnings,
    import_report_close: dictionary.import_report_close,
    errors: {
      fetch: dictionary.error_fetch,
      create: dictionary.error_create,
      update: dictionary.error_update,
      delete: dictionary.error_delete,
    },
  };

  return (
    <GenericAssociationTable<Role, RoleFormData>
      service="guardian"
      path="/roles"
      entityName="roles"
      pageTitle={dictionary.page_title}
      dictionary={tableDictionary}
      columns={(handlers) => createRolesColumns(dictionary, handlers, availablePolicies)}
      schema={roleSchema}
      defaultFormValues={{ name: "", description: "" }}
      associations={[policiesAssociation]}
      enableImportExport={true}
      enableRowSelection={true}
      testIdPrefix="roles"
      renderFormFields={(form, _dict) => (
        <>
          <div>
            <Label htmlFor="name">{dictionary.form_name_required}</Label>
            <Input
              id="name"
              {...form.register("name")}
              {...testId(DASHBOARD_TEST_IDS.roles.nameInput)}
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="description">{dictionary.form_description}</Label>
            <Input
              id="description"
              {...form.register("description")}
              {...testId(DASHBOARD_TEST_IDS.roles.descriptionInput)}
            />
          </div>
        </>
      )}
    />
  );
}
