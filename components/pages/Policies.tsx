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

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { GenericDataTable } from "@/components/shared/GenericDataTable";
import { createPoliciesColumns, type Policy, type Permission } from "./Policies.columns";
import { PolicyExpansion } from "./Policies.expansion";
import { PermissionDialog } from "@/components/modals/PermissionDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Download, Upload, FileJson, FileText, AlertTriangle } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { GUARDIAN_ROUTES } from "@/lib/api-routes";
import { BASIC_IO_ROUTES } from "@/lib/api-routes/basic_io";
import { DASHBOARD_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES, SPACING, COLOR_CLASSES } from "@/lib/design-tokens";
import { useZodForm } from "@/lib/hooks";
import { policySchema, type PolicyFormData } from "@/lib/validation";

// ==================== TYPES ====================
type PoliciesDictionary = {
  page_title: string;
  create_button: string;
  import_button: string;
  export_button: string;
  import_json: string;
  import_csv: string;
  export_json: string;
  export_csv: string;
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
  delete_confirm_title: string;
  delete_confirm_message: string;
  delete_cancel: string;
  delete_confirm: string;
  operation_create: string;
  operation_read: string;
  operation_update: string;
  operation_delete: string;
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
  edit_tooltip?: string;
  delete_tooltip?: string;
  add_permission_tooltip?: string;
  operation_list?: string;
};

// ==================== COMPONENT ====================
export default function Policies({ dictionary }: { readonly dictionary: PoliciesDictionary }) {
  // State
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Policy Dialog (Create/Edit)
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

  // Permission Dialog
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [filterService, setFilterService] = useState("");
  const [filterResource, setFilterResource] = useState("");

  // Delete Confirmation Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingDeletePolicy, setPendingDeletePolicy] = useState<Policy | null>(null);

  // Import/Export
  const [showImportReport, setShowImportReport] = useState(false);
  const [importReport, setImportReport] = useState<{
    total_records: number;
    successful_imports: number;
    failed_imports: number;
    errors: Array<string | { original_id?: string; error?: string }>;
    warnings: string[];
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Form
  const policyForm = useZodForm({
    schema: policySchema,
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // ==================== DATA FETCHING ====================
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [permissionsRes, policiesRes] = await Promise.all([
        fetch(GUARDIAN_ROUTES.permissions),
        fetch(GUARDIAN_ROUTES.policies),
      ]);

      if (permissionsRes.status === 401 || policiesRes.status === 401) {
        globalThis.location.href = "/login";
        return;
      }

      if (!permissionsRes.ok || !policiesRes.ok) {
        throw new Error(dictionary.error_fetch);
      }

      const permissionsData = await permissionsRes.json();
      const policiesData = await policiesRes.json();

      // Extract permissions
      const permissionsArray = Array.isArray(permissionsData)
        ? permissionsData
        : permissionsData?.permissions || [];
      setAllPermissions(permissionsArray);

      // Extract policies
      const policiesArray = Array.isArray(policiesData)
        ? policiesData
        : policiesData?.policies || [];

      // Fetch permissions for each policy
      const policiesWithPermissions = await Promise.all(
        policiesArray.map(async (policy: Policy) => {
          try {
            const policyPermsRes = await fetchWithAuth(
              GUARDIAN_ROUTES.policyPermissions(policy.id.toString())
            );
            if (!policyPermsRes.ok) {
              console.warn(`Failed to fetch permissions for policy ${policy.id}`);
              return { ...policy, permissions: [] };
            }
            const policyPermsData = await policyPermsRes.json();
            const permissions = Array.isArray(policyPermsData)
              ? policyPermsData
              : policyPermsData?.permissions || [];
            return { ...policy, permissions };
          } catch (err) {
            console.warn(`Error fetching permissions for policy ${policy.id}:`, err);
            return { ...policy, permissions: [] };
          }
        })
      );

      setPolicies(policiesWithPermissions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : dictionary.error_fetch);
    } finally {
      setIsLoading(false);
    }
  }, [dictionary.error_fetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==================== POLICY CRUD ====================
  const openCreatePolicyDialog = () => {
    setEditingPolicy(null);
    policyForm.reset({ name: "", description: "" });
    setShowPolicyDialog(true);
  };

  const openEditPolicyDialog = (policy: Policy) => {
    setEditingPolicy(policy);
    policyForm.reset({
      name: policy.name,
      description: policy.description || "",
    });
    setShowPolicyDialog(true);
  };

  const handlePolicySubmit = async (data: PolicyFormData) => {
    try {
      const payload = {
        name: data.name,
        description: data.description,
      };

      const options = {
        method: editingPolicy ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };

      const url = editingPolicy
        ? GUARDIAN_ROUTES.policy(editingPolicy.id.toString())
        : GUARDIAN_ROUTES.policies;

      const res = await fetchWithAuth(url, options);

      if (res.status === 401) {
        globalThis.location.href = "/login";
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Policy submit error:", errorText);
        throw new Error(editingPolicy ? dictionary.error_update : dictionary.error_create);
      }

      setShowPolicyDialog(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : dictionary.error_create);
    }
  };

  const handleDeletePolicy = async (policy: Policy) => {
    setPendingDeletePolicy(policy);
    setShowDeleteDialog(true);
  };

  const confirmDeletePolicy = async () => {
    if (!pendingDeletePolicy) return;

    try {
      const res = await fetchWithAuth(GUARDIAN_ROUTES.policy(pendingDeletePolicy.id.toString()), {
        method: "DELETE",
      });

      if (res.status === 401) {
        globalThis.location.href = "/login";
        return;
      }

      if (!res.ok) {
        throw new Error(dictionary.error_delete);
      }

      setShowDeleteDialog(false);
      setPendingDeletePolicy(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : dictionary.error_delete);
    }
  };

  // ==================== PERMISSION MANAGEMENT ====================
  const handleAddPermission = (policy: Policy) => {
    setSelectedPolicy(policy);
    setFilterService("");
    setFilterResource("");
    setShowPermissionDialog(true);
  };

  const handleEditPermissionGroup = (
    policy: Policy,
    service: string,
    resourceName: string,
    _permissions: Permission[]
  ) => {
    setSelectedPolicy(policy);
    setFilterService(service);
    setFilterResource(resourceName);
    setShowPermissionDialog(true);
  };

  const handleDeletePermissionGroup = async (
    policyId: string | number,
    permissions: Permission[]
  ) => {
    try {
      await Promise.all(
        permissions.map((perm) =>
          fetchWithAuth(
            GUARDIAN_ROUTES.policyPermission(policyId.toString(), perm.id.toString()),
            { method: "DELETE" }
          )
        )
      );
      fetchData();
    } catch (err) {
      console.error("Error deleting permission group:", err);
      setError("Failed to delete permission group");
    }
  };

  const handleAddPermissionsToPolicy = async (permissionIds: (string | number)[]) => {
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

      if (results.some(res => res.status === 401)) {
        globalThis.location.href = "/login";
        return;
      }

      if (results.some(res => !res.ok)) {
        throw new Error("Failed to add some permissions");
      }

      setShowPermissionDialog(false);
      fetchData();
    } catch (err) {
      console.error("Error adding permissions:", err);
      setError("Failed to add permissions");
    }
  };

  // ==================== IMPORT/EXPORT ====================
  const handleExport = async (format: "json" | "csv") => {
    setIsExporting(true);
    try {
      // Use basic-io to get policies (enrich=true resolves simple FK like company_id)
      // Then enrich with permissions from current state (policies_permissions table not handled by basic-io)
      const exportUrl = new URL(BASIC_IO_ROUTES.export, globalThis.location.origin);
      exportUrl.searchParams.set('service', 'guardian');
      exportUrl.searchParams.set('path', '/policies');
      exportUrl.searchParams.set('type', format);
      exportUrl.searchParams.set('enrich', 'true');
      
      const res = await fetchWithAuth(exportUrl.toString());

      if (res.status === 401) {
        globalThis.location.href = "/login";
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Export failed: ${errorText}`);
      }

      const enrichedData = await res.json();

      // Add permissions
      const policiesWithPermissions = Array.isArray(enrichedData)
        ? enrichedData.map((policy: Policy) => {
            const policyWithPerms = policies.find((p) => p.id === policy.id);
            return {
              ...policy,
              permissions:
                policyWithPerms?.permissions?.map((p) => ({
                  id: p.id,
                  service: p.service,
                  resource_name: p.resource_name,
                  operation: p.operation,
                  description: p.description,
                })) || [],
            };
          })
        : enrichedData;

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === "json") {
        content = JSON.stringify(policiesWithPermissions, null, 2);
        filename = `policies_export_${new Date().toISOString().split("T")[0]}.json`;
        mimeType = "application/json";
      } else {
        const headers = Object.keys(policiesWithPermissions[0] || {})
          .filter((k) => k !== "permissions")
          .concat(["permission_ids"]);
        const rows = policiesWithPermissions.map((policy: Policy) => {
          const row = headers.map((h) => {
            if (h === "permission_ids") {
              return policy.permissions?.map((p) => p.id).join(";") || "";
            }
            const value = policy[h as keyof Policy];
            return value !== null && value !== undefined ? String(value) : "";
          });
          return row.join(",");
        });
        content = [headers.join(","), ...rows].join("\n");
        filename = `policies_export_${new Date().toISOString().split("T")[0]}.csv`;
        mimeType = "text/csv";
      }

      const blob = new Blob([content], { type: mimeType });
      const downloadUrl = globalThis.URL.createObjectURL(blob);
      const a = globalThis.document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      globalThis.document.body.appendChild(a);
      a.click();
      a.remove();
      globalThis.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : dictionary.error_export);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (format: "json" | "csv") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = format === "json" ? "application/json" : "text/csv";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      const errors: string[] = [];
      const warnings: string[] = [];
      let totalRecords = 0;
      let successfulImports = 0;

      try {
        const fileContent = await file.text();
        let policiesToImport: Array<{
          id?: string;
          name: string;
          description?: string;
          permissions: Array<{ id: string | number }>;
        }> = [];

        if (format === "json") {
          policiesToImport = JSON.parse(fileContent);
        } else {
          const lines = fileContent.split("\n").filter((l) => l.trim());
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",");
            const permissionIds = values[3]
              ?.replaceAll('"', "")
              .split(";")
              .filter((id) => id.trim());

            policiesToImport.push({
              id: values[0],
              name: values[1]?.replaceAll('"', ""),
              description: values[2]?.replaceAll('"', ""),
              permissions: permissionIds.map((id) => ({ id: id.trim() })),
            });
          }
        }

        totalRecords = policiesToImport.length;

        for (const policyData of policiesToImport) {
          try {
            const createRes = await fetchWithAuth(GUARDIAN_ROUTES.policies, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: policyData.name,
                description: policyData.description,
              }),
            });

            if (!createRes.ok) {
              const errorData = await createRes.json();
              errors.push(`Policy "${policyData.name}": ${errorData.message || "Failed to create"}`);
              continue;
            }

            const createdPolicy = await createRes.json();
            successfulImports++;

            if (policyData.permissions && policyData.permissions.length > 0) {
              for (const perm of policyData.permissions) {
                try {
                  const addPermRes = await fetchWithAuth(
                    GUARDIAN_ROUTES.policyPermissions(createdPolicy.id.toString()),
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ permission_id: perm.id }),
                    }
                  );

                  if (!addPermRes.ok) {
                    warnings.push(`Policy "${policyData.name}": Failed to add permission ${perm.id}`);
                  }
                } catch {
                  warnings.push(`Policy "${policyData.name}": Error adding permission ${perm.id}`);
                }
              }
            }
          } catch {
            errors.push(`Policy "${policyData.name}": Unknown error`);
          }
        }

        setImportReport({
          total_records: totalRecords,
          successful_imports: successfulImports,
          failed_imports: totalRecords - successfulImports,
          errors: errors,
          warnings: warnings,
        });
        setShowImportReport(true);
        fetchData();
      } catch (err) {
        setError(err instanceof Error ? err.message : dictionary.error_import);
      } finally {
        setIsImporting(false);
      }
    };

    input.click();
  };

  // ==================== COLUMNS ====================
  const columns = useMemo(
    () =>
      createPoliciesColumns({
        dictionary: {
          table_name: dictionary.table_name,
          table_description: dictionary.table_description,
          table_permissions: dictionary.table_permissions,
          table_created_at: "",
          table_updated_at: "",
          table_actions: dictionary.table_actions,
          edit_tooltip: dictionary.edit_tooltip || "Éditer",
          delete_tooltip: dictionary.delete_tooltip || "Supprimer",
          add_permission_tooltip: dictionary.add_permission_tooltip || "Ajouter une permission",
          operation_read: dictionary.operation_read,
          operation_create: dictionary.operation_create,
          operation_update: dictionary.operation_update,
          operation_delete: dictionary.operation_delete,
          operation_list: dictionary.operation_list,
        },
        onEdit: openEditPolicyDialog,
        onDelete: handleDeletePolicy,
        onAddPermission: handleAddPermission,
      }),
    [dictionary]
  );

  // ==================== EXPANDED ROW ====================
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
    [dictionary]
  );

  // ==================== AVAILABLE PERMISSIONS ====================
  const availablePermissions = useMemo(() => {
    if (!selectedPolicy) return [];
    const associatedIds = new Set(selectedPolicy.permissions.map((p) => p.id));
    return allPermissions.filter((p) => !associatedIds.has(p.id));
  }, [allPermissions, selectedPolicy]);

  // ==================== RENDER ====================
  return (
    <section>
      <h1 className="text-2xl font-bold mb-4" {...testId(DASHBOARD_TEST_IDS.policies.title)}>
        {dictionary.page_title}
      </h1>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div />
        <div className={`flex ${SPACING.gap.sm}`}>
          {/* Import */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isImporting} {...testId("policy-import-button")}>
                <Upload className={`${ICON_SIZES.sm} mr-2`} />
                {dictionary.import_button}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleImport("json")}>
                <FileJson className={`${ICON_SIZES.sm} mr-2`} />
                {dictionary.import_json}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleImport("csv")}>
                <FileText className={`${ICON_SIZES.sm} mr-2`} />
                {dictionary.import_csv}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting} {...testId("policy-export-button")}>
                <Download className={`${ICON_SIZES.sm} mr-2`} />
                {dictionary.export_button}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                <FileJson className={`${ICON_SIZES.sm} mr-2`} />
                {dictionary.export_json}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileText className={`${ICON_SIZES.sm} mr-2`} />
                {dictionary.export_csv}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create */}
          <Button onClick={openCreatePolicyDialog} {...testId(DASHBOARD_TEST_IDS.policies.addButton)}>
            <Plus className="h-4 w-4 mr-2" />
            {dictionary.create_button}
          </Button>
        </div>
      </div>

      {/* Table */}
      <GenericDataTable
        data={policies}
        columns={columns}
        isLoading={isLoading}
        dictionary={{
          loading: "Loading...",
          no_results: dictionary.no_policies,
          showing_results: "Showing {from} to {to} of {total} result(s)",
          rows_per_page: "Rows per page",
          previous: "Previous",
          next: "Next",
        }}
        enableRowExpansion={true}
        renderExpandedRow={renderExpandedRow}
      />

      {/* Policy Create/Edit Dialog */}
      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent aria-describedby={void 0} aria-label="add_policy-dialog" {...testId(DASHBOARD_TEST_IDS.policies.dialog)}>
          <DialogTitle {...testId(DASHBOARD_TEST_IDS.policies.dialogTitle)}>
            {editingPolicy ? dictionary.modal_edit_title : dictionary.modal_create_title}
          </DialogTitle>
          <form className={`p-6 ${SPACING.component.md}`} onSubmit={policyForm.handleSubmit(handlePolicySubmit)}>
            <div>
              <label className="block text-sm mb-1">{dictionary.form_name_required}</label>
              <Input {...policyForm.register("name")} {...testId(DASHBOARD_TEST_IDS.policies.nameInput)} />
              {policyForm.formState.errors.name && (
                <div className={`${COLOR_CLASSES.text.destructive} text-xs mt-1`}>
                  {policyForm.formState.errors.name.message}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm mb-1">{dictionary.form_description}</label>
              <Input {...policyForm.register("description")} {...testId(DASHBOARD_TEST_IDS.policies.descriptionInput)} />
              {policyForm.formState.errors.description && (
                <div className={`${COLOR_CLASSES.text.destructive} text-xs mt-1`}>
                  {policyForm.formState.errors.description.message}
                </div>
              )}
            </div>
            <div className={`flex ${SPACING.gap.sm} justify-end mt-4`}>
              <Button type="button" variant="outline" onClick={() => setShowPolicyDialog(false)} {...testId(DASHBOARD_TEST_IDS.policies.cancelButton)}>
                {dictionary.form_cancel}
              </Button>
              <Button type="submit" variant="default" {...testId(DASHBOARD_TEST_IDS.policies.submitButton)}>
                {editingPolicy ? dictionary.form_save : dictionary.form_create}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permission Dialog */}
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

      {/* Import Report Dialog */}
      <Dialog open={showImportReport} onOpenChange={setShowImportReport}>
        <DialogContent aria-describedby={void 0} aria-label="import-report-dialog">
          <DialogTitle>{dictionary.import_report_title}</DialogTitle>
          {importReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{importReport.total_records}</div>
                  <div className="text-sm text-gray-600">{dictionary.import_report_total}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{importReport.successful_imports}</div>
                  <div className="text-sm text-gray-600">{dictionary.import_report_success}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{importReport.failed_imports}</div>
                  <div className="text-sm text-gray-600">{dictionary.import_report_failed}</div>
                </div>
              </div>

              {importReport.errors && importReport.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">{dictionary.import_report_errors}</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1 text-sm">
                    {importReport.errors.map((err, idx) => (
                      <div key={typeof err === "string" ? `error-${idx}` : err.original_id || `error-${idx}`} className="text-red-600">
                        {typeof err === "string" ? err : `${err.original_id ? `ID ${err.original_id}: ` : ""}${err.error}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importReport.warnings && importReport.warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-yellow-600 mb-2">{dictionary.import_report_warnings}</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1 text-sm">
                    {importReport.warnings.map((warning, idx) => (
                      <div key={`warning-${idx}-${warning.substring(0, 20)}`} className="text-yellow-600">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setShowImportReport(false)}>{dictionary.import_report_close}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent aria-describedby={void 0} aria-label="delete-policy-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {dictionary.delete_confirm_title}
            </DialogTitle>
            <DialogDescription>
              {dictionary.delete_confirm_message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setPendingDeletePolicy(null);
              }}
            >
              {dictionary.delete_cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePolicy}
            >
              {dictionary.delete_confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Display */}
      {error && (
        <div className={`${COLOR_CLASSES.text.destructive} text-sm mt-2`} {...testId(DASHBOARD_TEST_IDS.policies.errorMessage)}>
          {error}
        </div>
      )}
    </section>
  );
}

