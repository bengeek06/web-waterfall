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
 * Policies Management Component (V2 - Using GenericAssociationTable)
 * 
 * Migrated to use GenericAssociationTable for CRUD and import/export.
 * Custom components preserved:
 * - PolicyExpansion: Grouped permissions display with operation icons
 * - PermissionDialog: Two-panel dialog with service/resource filters
 * 
 * Features:
 * - List all policies with expandable permission associations
 * - Create/Edit/Delete policies
 * - Assign/Remove permissions to/from policies (M2M)
 * - Import/Export with basic-io
 * - Full test coverage with data-testid attributes
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

// GenericAssociationTable (for CRUD and basic structure)
import { GenericAssociationTable } from "@/components/shared/GenericAssociationTable";
import type { AssociationTableDictionary, ColumnHandlers } from "@/components/shared/GenericAssociationTable";

// Custom components for policies (preserved)
import { PolicyExpansion, type Permission } from "./Policies.expansion";
import { PermissionDialog } from "@/components/modals/PermissionDialog";

// Validation
import { policySchema, type PolicyFormData } from "@/lib/validation/guardian.schemas";

// Utils & Constants
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";
import { GUARDIAN_ROUTES } from "@/lib/api-routes";
import { DASHBOARD_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES, COLOR_CLASSES } from "@/lib/design-tokens";

// ==================== TYPES ====================

type Policy = {
  id: string | number;
  name: string;
  description?: string;
  permissions: Permission[];
};

type PoliciesDictionary = {
  page_title: string;
  create_button: string;
  table_name: string;
  table_description: string;
  table_permissions: string;
  table_actions: string;
  no_policies: string;
  modal_create_title: string;
  modal_edit_title: string;
  form_name: string;
  form_name_required: string;
  form_description: string;
  form_cancel: string;
  form_create: string;
  form_save: string;
  permissions_modal_title: string;
  permissions_select: string;
  permissions_save: string;
  operation_create: string;
  operation_read: string;
  operation_update: string;
  operation_delete: string;
  operation_list?: string;
  delete_confirm_title: string;
  delete_confirm_message: string;
  delete_cancel: string;
  delete_confirm: string;
  delete_selected: string;
  edit_tooltip?: string;
  delete_tooltip?: string;
  add_permission_tooltip?: string;
  filter_placeholder?: string;
  error_fetch: string;
  error_create: string;
  error_update: string;
  error_delete: string;
  import_button: string;
  export_button: string;
  error_export: string;
  error_import: string;
  import_report_title: string;
  import_report_close: string;
  import_report_total: string;
  import_report_success: string;
  import_report_failed: string;
  import_report_errors: string;
  import_report_warnings: string;
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

// ==================== SORT ICON HELPER ====================

function SortIcon({ column }: Readonly<{ column: { getIsSorted: () => false | "asc" | "desc" } }>) {
  const sorted = column.getIsSorted();
  if (sorted === "asc") return <ArrowUp className="h-4 w-4" />;
  if (sorted === "desc") return <ArrowDown className="h-4 w-4" />;
  return <ArrowUpDown className="h-4 w-4 opacity-50" />;
}

// ==================== COLUMN FACTORY ====================

function createPoliciesColumns(
  dictionary: PoliciesDictionary,
  handlers: ColumnHandlers<Policy> & { onAddPermission: (_policy: Policy) => void }
): ColumnDef<Policy>[] {
  return [
    // Name column with sorting
    {
      accessorKey: "name",
      enableColumnFilter: true,
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2 hover:text-foreground"
        >
          {dictionary.table_name}
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    // Description column
    {
      accessorKey: "description",
      enableColumnFilter: true,
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2 hover:text-foreground"
        >
          {dictionary.table_description}
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => row.original.description || "-",
    },
    // Permissions count
    {
      accessorKey: "permissions",
      enableSorting: false,
      enableColumnFilter: false,
      header: dictionary.table_permissions,
      cell: ({ row }) => `${row.original.permissions?.length || 0} permission(s)`,
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
            {/* Add Permission Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlers.onAddPermission(row.original)}
                  {...testId(DASHBOARD_TEST_IDS.policies.addPermissionButton(row.original.id.toString()))}
                >
                  <PlusSquare className={ICON_SIZES.sm} />
                  <span className="sr-only">{dictionary.add_permission_tooltip || "Ajouter une permission"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{dictionary.add_permission_tooltip || "Ajouter une permission"}</TooltipContent>
            </Tooltip>
            {/* Edit Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlers.onEdit(row.original)}
                  {...testId(DASHBOARD_TEST_IDS.policies.editButton(row.original.id.toString()))}
                >
                  <Edit className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.update}`} />
                  <span className="sr-only">{dictionary.edit_tooltip || "Éditer"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{dictionary.edit_tooltip || "Éditer la politique"}</TooltipContent>
            </Tooltip>
            {/* Delete Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handlers.onDelete(row.original.id)}
                  {...testId(DASHBOARD_TEST_IDS.policies.deleteButton(row.original.id.toString()))}
                >
                  <Trash2 className={ICON_SIZES.sm} />
                  <span className="sr-only">{dictionary.delete_tooltip || "Supprimer"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{dictionary.delete_tooltip || "Supprimer la politique"}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      ),
    },
  ];
}

// ==================== COMPONENT ====================

export default function PoliciesV2({ dictionary }: { readonly dictionary: PoliciesDictionary }) {
  // ==================== ERROR HANDLING ====================
  const { handleError } = useErrorHandler({ messages: dictionary.errors });
  
  // ==================== PERMISSION DIALOG STATE ====================
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [filterService, setFilterService] = useState("");
  const [filterResource, setFilterResource] = useState("");
  
  // Trigger refresh when permissions are added
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ==================== FETCH ALL PERMISSIONS ====================
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await fetchWithAuth(GUARDIAN_ROUTES.permissions);
        if (res.ok) {
          const data = await res.json();
          const permissions = Array.isArray(data) ? data : (data.permissions || []);
          setAllPermissions(permissions);
        }
      } catch (err) {
        console.error("Error fetching permissions:", err);
      }
    };
    fetchPermissions();
  }, []); // No dependencies - only fetch once on mount

  // ==================== PERMISSION HANDLERS ====================
  
  const handleAddPermission = useCallback((policy: Policy) => {
    setSelectedPolicy(policy);
    setFilterService("");
    setFilterResource("");
    setShowPermissionDialog(true);
  }, []);

  const handleEditPermissionGroup = useCallback((
    policy: Policy,
    service: string,
    resourceName: string,
    _permissions: Permission[]
  ) => {
    setSelectedPolicy(policy);
    setFilterService(service);
    setFilterResource(resourceName);
    setShowPermissionDialog(true);
  }, []);

  const handleDeletePermissionGroup = useCallback(async (
    policyId: string | number,
    permissions: Permission[]
  ) => {
    try {
      const results = await Promise.all(
        permissions.map((perm) =>
          fetchWithAuth(
            GUARDIAN_ROUTES.policyPermission(policyId.toString(), perm.id.toString()),
            { method: "DELETE" }
          )
        )
      );
      // Check if any request failed
      const failedResult = results.find(res => !res.ok);
      if (failedResult) {
        handleError(failedResult);
        return;
      }
      // Trigger refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  const handleAddPermissionsToPolicy = useCallback(async (permissionIds: (string | number)[]) => {
    if (!selectedPolicy || permissionIds.length === 0) return;

    try {
      const results = await Promise.all(
        permissionIds.map((permId) =>
          fetchWithAuth(
            GUARDIAN_ROUTES.policyPermissions(selectedPolicy.id.toString()),
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ permission_id: permId }),
            }
          )
        )
      );
      // Check if any request failed
      const failedResult = results.find(res => !res.ok);
      if (failedResult) {
        handleError(failedResult);
        return;
      }
      setShowPermissionDialog(false);
      // Trigger refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      handleError(err);
    }
  }, [selectedPolicy, handleError]);

  // ==================== AVAILABLE PERMISSIONS ====================
  const availablePermissions = useMemo(() => {
    if (!selectedPolicy) return [];
    const associatedIds = new Set(selectedPolicy.permissions?.map((p) => p.id) || []);
    return allPermissions.filter((p) => !associatedIds.has(p.id));
  }, [allPermissions, selectedPolicy]);

  // ==================== DICTIONARY MAPPING ====================
  const tableDictionary: AssociationTableDictionary = {
    create: dictionary.create_button,
    filter_placeholder: dictionary.filter_placeholder || "Filter policies...",
    no_results: dictionary.no_policies,
    loading: "Loading...",
    export: dictionary.export_button,
    import: dictionary.import_button,
    delete_selected: dictionary.delete_selected,
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

  // ==================== CUSTOM EXPANDED ROW ====================
  const renderExpandedRow = useCallback(
    (policy: Policy) => (
      <PolicyExpansion
        policy={policy}
        dictionary={{
          operation_read: dictionary.operation_read,
          operation_create: dictionary.operation_create,
          operation_update: dictionary.operation_update,
          operation_delete: dictionary.operation_delete,
          operation_list: dictionary.operation_list,
          permissions_associated: "Permissions associées :",
          no_permissions: "Aucune permission associée",
          edit_operations_tooltip: "Éditer les opérations",
          delete_permission_group_tooltip: "Supprimer toutes les permissions de ce groupe",
        }}
        onEditPermissionGroup={handleEditPermissionGroup}
        onDeletePermissionGroup={handleDeletePermissionGroup}
      />
    ),
    [dictionary, handleEditPermissionGroup, handleDeletePermissionGroup]
  );

  // ==================== RENDER ====================
  return (
    <>
      <GenericAssociationTable<Policy, PolicyFormData>
        key={refreshTrigger} // Force refresh when permissions change
        service="guardian"
        path="/policies"
        entityName="policies"
        pageTitle={dictionary.page_title}
        dictionary={tableDictionary}
        columns={(handlers) => createPoliciesColumns(dictionary, {
          ...handlers,
          onAddPermission: handleAddPermission,
        })}
        schema={policySchema}
        defaultFormValues={{ name: "", description: "" }}
        // Use M2M association for permissions fetching (attached to each policy)
        // excludeFromExport: true because permissions don't have a unique lookup field
        // (they use service+resource_name+operation as composite key)
        associations={[
          {
            type: "many-to-many",
            name: "permissions",
            label: "Permissions",
            service: "guardian",
            path: "/permissions",
            junctionEndpoint: "/policies/{id}/permissions",
            displayField: "service",
            secondaryField: "resource_name",
            excludeFromExport: true, // Permissions can't be re-imported by lookup
          },
        ]}
        enableImportExport={true}
        enableRowSelection={true}
        enableColumnFilters={true}
        testIdPrefix="policies"
        // Custom expansion renderer (not using default AssociationExpansion)
        renderExpandedRow={renderExpandedRow}
        renderFormFields={(form, _dict) => (
          <>
            <div>
              <Label htmlFor="name">{dictionary.form_name_required}</Label>
              <Input
                id="name"
                {...form.register("name")}
                {...testId(DASHBOARD_TEST_IDS.policies.nameInput)}
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
                {...testId(DASHBOARD_TEST_IDS.policies.descriptionInput)}
              />
            </div>
          </>
        )}
      />

      {/* Custom Permission Dialog */}
      <PermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        policyName={selectedPolicy?.name || ""}
        associatedPermissions={selectedPolicy?.permissions || []}
        availablePermissions={availablePermissions}
        onAddPermissions={handleAddPermissionsToPolicy}
        dictionary={{
          dialog_title: `Ajouter des permissions à {policyName}`,
          associated_permissions: "Permissions déjà associées",
          no_permissions: "Aucune permission",
          available_permissions: "Permissions disponibles",
          no_available_permissions: "Aucune permission disponible",
          service_filter: "Service",
          resource_filter: "Ressource",
          cancel_button: "Annuler",
          add_button: "Ajouter",
          operation_read: dictionary.operation_read,
          operation_create: dictionary.operation_create,
          operation_update: dictionary.operation_update,
          operation_delete: dictionary.operation_delete,
          operation_list: dictionary.operation_list,
        }}
        initialService={filterService}
        initialResource={filterResource}
      />
    </>
  );
}
