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

import React, { useEffect, useState } from "react";
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

// ==================== UI COMPONENTS ====================
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, PlusSquare, List, Pencil, Trash2, ChevronDown, ChevronRight, Plus, ArrowUpDown, ArrowUp, ArrowDown, Download, Upload, FileJson, FileText } from "lucide-react";

// ==================== CONSTANTS ====================
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { GUARDIAN_ROUTES } from "@/lib/api-routes";
import { BASIC_IO_ROUTES } from "@/lib/api-routes/basic_io";
import { DASHBOARD_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES, COLOR_CLASSES, SPACING } from "@/lib/design-tokens";

// ==================== VALIDATION ====================
import { useZodForm } from "@/lib/hooks";
import { policySchema, PolicyFormData } from "@/lib/validation";

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
  permissions_modal_title: string;
  permissions_select: string;
  permissions_save: string;
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
};

type Permission = {
  id: string | number;
  service: string;
  resource_name: string;
  description: string;
  operation: string;
  created_at?: string;
  updated_at?: string;
};

type Policy = {
  id: string | number;
  name: string;
  description?: string;
  permissions: Permission[];
};

type ExpandedPolicies = Record<string | number, boolean>;

// ==================== CONSTANTS ====================
function getOperationIcons(dictionary: PoliciesDictionary) {
  return {
    READ: { icon: Eye, label: dictionary.operation_read, color: COLOR_CLASSES.operations.read },
    CREATE: { icon: PlusSquare, label: dictionary.operation_create, color: COLOR_CLASSES.operations.create },
    LIST: { icon: List, label: "List (LIST)", color: COLOR_CLASSES.operations.list },
    UPDATE: { icon: Pencil, label: dictionary.operation_update, color: COLOR_CLASSES.operations.update },
    DELETE: { icon: Trash2, label: dictionary.operation_delete, color: COLOR_CLASSES.operations.delete },
  } as const;
}

// ==================== COMPONENT ====================
function getOperationIcon(operation: string, dictionary: PoliciesDictionary) {
  if (!operation) {
    return { icon: null, label: "Unknown" };
  }
  
  const OPERATION_ICONS = getOperationIcons(dictionary);
  const iconConfig = OPERATION_ICONS[operation as keyof typeof OPERATION_ICONS];
  
  if (iconConfig) {
    const Icon = iconConfig.icon;
    return { 
      icon: <Icon className={`${ICON_SIZES.sm} ${iconConfig.color}`} />, 
      label: iconConfig.label 
    };
  }
  
  return { 
    icon: <span className="text-xs">{operation}</span>, 
    label: operation 
  };
}

// Regroupe les permissions par service/ressource
function groupPermissions(permissions: Permission[]) {
  const groups: Record<string, { service: string; resource_name: string; perms: Permission[] }> = {};
  
  // Ordre de tri des opérations
  const operationOrder: Record<string, number> = {
    'LIST': 1,
    'CREATE': 2,
    'READ': 3,
    'UPDATE': 4,
    'DELETE': 5,
  };
  
  permissions.forEach(perm => {
    const key = `${perm.service}::${perm.resource_name}`;
    if (!groups[key]) {
      groups[key] = { service: perm.service, resource_name: perm.resource_name, perms: [] };
    }
    groups[key].perms.push(perm);
  });
  
  // Trie les permissions dans chaque groupe
  Object.values(groups).forEach(group => {
    group.perms.sort((a, b) => {
      const orderA = operationOrder[a.operation] || 999;
      const orderB = operationOrder[b.operation] || 999;
      return orderA - orderB;
    });
  });
  
  return Object.values(groups);
}

// Ajoute cette fonction utilitaire pour regrouper les permissions disponibles
function groupAvailablePermissions(perms: Permission[]) {
  const groups: Record<string, { service: string; resource_name: string; perms: Permission[] }> = {};
  
  // Ordre de tri des opérations
  const operationOrder: Record<string, number> = {
    'LIST': 1,
    'CREATE': 2,
    'READ': 3,
    'UPDATE': 4,
    'DELETE': 5,
  };
  
  perms.forEach(perm => {
    const key = `${perm.service}::${perm.resource_name}`;
    if (!groups[key]) {
      groups[key] = { service: perm.service, resource_name: perm.resource_name, perms: [] };
    }
    groups[key].perms.push(perm);
  });
  
  // Trie les permissions dans chaque groupe
  Object.values(groups).forEach(group => {
    group.perms.sort((a, b) => {
      const orderA = operationOrder[a.operation] || 999;
      const orderB = operationOrder[b.operation] || 999;
      return orderA - orderB;
    });
  });
  
  return Object.values(groups);
}

export default function Policies({ dictionary }: { readonly dictionary: PoliciesDictionary }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Policy dialog (create/edit)
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

  // Policy form with Zod validation
  const policyForm = useZodForm({
    schema: policySchema,
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Expanded policies for permission view
  const [expanded, setExpanded] = useState<ExpandedPolicies>({});

  // Permission dialog (add to policy)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  // Filtering in permission dialog
  const [filterService, setFilterService] = useState("");
  const [filterResource, setFilterResource] = useState("");

  // Permissions selected to add
  const [selectedPermissionsToAdd, setSelectedPermissionsToAdd] = useState<Set<string | number>>(new Set());

  // Import/Export state
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

  // ==================== HANDLERS ====================
  async function fetchData() {
    try {
      const [permissionsRes, policiesRes] = await Promise.all([
        fetch(GUARDIAN_ROUTES.permissions),
        fetch(GUARDIAN_ROUTES.policies),
      ]);
      if (permissionsRes.status === 401 || policiesRes.status === 401) {
        globalThis.location.href = "/login";
        return;
      }
      if (!permissionsRes.ok) throw new Error(dictionary.error_fetch);
      if (!policiesRes.ok) throw new Error(dictionary.error_fetch);
      const permissionsContentType = permissionsRes.headers.get("content-type") || "";
      const policiesContentType = policiesRes.headers.get("content-type") || "";
      if (!permissionsContentType.includes("application/json")) {
        const text = await permissionsRes.text();
        throw new Error("Réponse permissions non JSON: " + text.slice(0, 200));
      }
      if (!policiesContentType.includes("application/json")) {
        const text = await policiesRes.text();
        throw new Error("Réponse politiques non JSON: " + text.slice(0, 200));
      }
      const permissionsData = await permissionsRes.json();
      const policiesData = await policiesRes.json();
      let permissionsArray: Permission[] = [];
      if (Array.isArray(permissionsData)) {
        permissionsArray = permissionsData;
      } else if (permissionsData && typeof permissionsData === "object") {
        if (Array.isArray(permissionsData.permissions)) {
          permissionsArray = permissionsData.permissions;
        } else {
          permissionsArray = [permissionsData];
        }
      }
      setPermissions(permissionsArray);
      let policiesArray: Policy[] = [];
      if (Array.isArray(policiesData)) {
        policiesArray = policiesData;
      } else if (policiesData && typeof policiesData === "object") {
        if (Array.isArray(policiesData.policies)) {
          policiesArray = policiesData.policies;
        } else {
          policiesArray = [policiesData];
        }
      }
      
      // Fetch permissions for each policy
      const policiesWithPermissions = await Promise.all(
        policiesArray.map(async (policy) => {
          try {
            const policyPermsRes = await fetchWithAuth(GUARDIAN_ROUTES.policyPermissions(policy.id.toString()));
            if (!policyPermsRes.ok) {
              console.warn(`Failed to fetch permissions for policy ${policy.id}`);
              return { ...policy, permissions: [] };
            }
            const policyPermsData = await policyPermsRes.json();
            let policyPermissions: Permission[] = [];
            if (Array.isArray(policyPermsData)) {
              policyPermissions = policyPermsData;
            } else if (policyPermsData && typeof policyPermsData === "object" && Array.isArray(policyPermsData.permissions)) {
              policyPermissions = policyPermsData.permissions;
            }
            return { ...policy, permissions: policyPermissions };
          } catch (err) {
            console.warn(`Error fetching permissions for policy ${policy.id}:`, err);
            return { ...policy, permissions: [] };
          }
        })
      );
      
      setPolicies(policiesWithPermissions);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(dictionary.error_fetch);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreatePolicyDialog() {
    setEditingPolicy(null);
    policyForm.reset({ name: "", description: "" });
    setShowPolicyDialog(true);
  }

  function openEditPolicyDialog(policy: Policy) {
    setEditingPolicy(policy);
    policyForm.reset({
      name: policy.name,
      description: policy.description || "",
    });
    setShowPolicyDialog(true);
  }

  async function handlePolicySubmit(data: PolicyFormData) {
    const payload = {
      name: data.name,
      description: data.description,
    };
    try {
      let res;
      const options = {
        method: editingPolicy ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };
      if (editingPolicy) {
        res = await fetchWithAuth(GUARDIAN_ROUTES.policy(editingPolicy.id.toString()), options);
      } else {
        res = await fetchWithAuth(GUARDIAN_ROUTES.policies, options);
      }
      if (res.status === 401) {
        globalThis.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erreur API policies:", errorText);
        throw new Error(dictionary.error_create);
      }
      setShowPolicyDialog(false);
      fetchData();
    } catch (err) {
      console.error("handlePolicySubmit error:", err);
      setError(editingPolicy ? dictionary.error_update : dictionary.error_create);
    }
  }

  async function handleDeletePolicy(policyId: string | number) {
    if (!globalThis.confirm("Supprimer cette politique ?")) return;
    try {
      const res = await fetchWithAuth(GUARDIAN_ROUTES.policy(policyId.toString()), {
        method: "DELETE",
      });
      if (res.status === 401) {
        globalThis.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(dictionary.error_delete);
      fetchData();
    } catch (err) {
      console.error("handleDeletePolicy error:", err);
      setError(dictionary.error_delete);
    }
  }

  function toggleExpand(policyId: string | number) {
    setExpanded(prev => ({ ...prev, [policyId]: !prev[policyId] }));
  }

  function openPermissionDialog(policy: Policy, service?: string, resource?: string) {
    setSelectedPolicy(policy);
    setShowPermissionDialog(true);
    setFilterService(service || "");
    setFilterResource(resource || "");
    setSelectedPermissionsToAdd(new Set());
  }

  async function removePermissionWithoutConfirm(policyId: string | number, permissionId: string | number) {
    try {
      const res = await fetchWithAuth(
        GUARDIAN_ROUTES.policyPermission(policyId.toString(), permissionId.toString()), 
        { method: "DELETE" }
      );
      if (res.status === 401) {
        globalThis.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(dictionary.error_delete);
    } catch (err) {
      console.error("removePermissionWithoutConfirm error:", err);
      throw err;
    }
  }

  async function handleRemovePermissionGroup(policyId: string | number, permissions: Permission[]) {
    if (!globalThis.confirm(`Supprimer toutes les permissions de ce groupe (${permissions.length} permission${permissions.length > 1 ? 's' : ''}) ?`)) return;
    try {
      await Promise.all(
        permissions.map(perm => removePermissionWithoutConfirm(policyId, perm.id))
      );
      fetchData();
    } catch {
      setError(dictionary.error_delete);
    }
  }

  function handleSelectPermissionToAdd(permissionId: string | number) {
    setSelectedPermissionsToAdd(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  }

  async function handleAddPermissionsToPolicy() {
    if (!selectedPolicy || selectedPermissionsToAdd.size === 0) return;
    try {
      console.log("Adding permissions to policy:", selectedPolicy.id);
      console.log("Selected permissions:", Array.from(selectedPermissionsToAdd));
      
      // Envoie un POST par permission
      const permissionsArray = Array.from(selectedPermissionsToAdd);
      const promises = permissionsArray.map(async (permissionId) => {
        const url = GUARDIAN_ROUTES.policyPermissions(selectedPolicy.id.toString());
        console.log(`Posting permission ${permissionId} to ${url}`);
        try {
          const response = await fetchWithAuth(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ permission_id: permissionId }),
          });
          console.log(`Response for permission ${permissionId}:`, response.status);
          return response;
        } catch (error) {
          console.error(`Error posting permission ${permissionId}:`, error);
          throw error;
        }
      });
      
      const results = await Promise.all(promises);
      if (results.some(res => res.status === 401)) {
        globalThis.location.href = "/login";
        return;
      }
      if (results.some(res => !res.ok)) {
        const failedResults = results.filter(res => !res.ok);
        console.error("Some requests failed:", failedResults.map(r => r.status));
        throw new Error(dictionary.error_create);
      }
      setShowPermissionDialog(false);
      fetchData();
    } catch (err) {
      console.error("handleAddPermissionsToPolicy error:", err);
      setError(err instanceof Error ? err.message : dictionary.error_create);
    }
  }

  // Filtrage des permissions disponibles pour la modale
  const filteredAvailablePermissions = permissions.filter(p =>
    (!filterService || p.service === filterService) &&
    (!filterResource || p.resource_name === filterResource) &&
    !(selectedPolicy?.permissions?.some(sp => sp.id === p.id))
  );

  // Pour le filtrage, on extrait les services et ressources uniques
  const uniqueServices = Array.from(new Set(permissions.map(p => p.service))).sort((a, b) => a.localeCompare(b));
  // Les ressources sont filtrées en fonction du service sélectionné
  const uniqueResources = Array.from(
    new Set(
      permissions
        .filter(p => !filterService || p.service === filterService)
        .map(p => p.resource_name)
    )
  ).sort((a, b) => a.localeCompare(b));

  // ==================== IMPORT/EXPORT HANDLERS ====================
  
  async function handleExport(type: 'json' | 'csv') {
    setIsExporting(true);
    try {
      // Use basic-io to get policies (enrich=true resolves simple FK like company_id)
      // Then enrich with permissions from current state (policies_permissions table not handled by basic-io)
      const format = type === 'json' ? 'json' : 'csv';
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

      // Get the enriched data from basic-io
      const enrichedData = await res.json();
      
      // Add permissions from current state (policies_permissions association table)
      const policiesWithPermissions = Array.isArray(enrichedData) ? enrichedData.map((policy: { id: string | number }) => {
        const policyWithPerms = policies.find(p => p.id === policy.id);
        return {
          ...policy,
          permissions: policyWithPerms?.permissions?.map(p => ({
            id: p.id,
            service: p.service,
            resource_name: p.resource_name,
            operation: p.operation,
            description: p.description,
          })) || [],
        };
      }) : enrichedData;

      let content: string;
      let filename: string;
      let mimeType: string;

      if (type === 'json') {
        content = JSON.stringify(policiesWithPermissions, null, 2);
        filename = `policies_export_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // Convert back to CSV with permissions added
        const headers = Object.keys(policiesWithPermissions[0] || {}).filter(k => k !== 'permissions').concat(['permission_ids']);
        const rows = policiesWithPermissions.map((policy: { permissions?: Array<{ id: string }>, [key: string]: unknown }) => {
          const row = headers.map(h => {
            if (h === 'permission_ids') {
              return policy.permissions?.map(p => p.id).join(';') || '';
            }
            const value = policy[h];
            return value !== null && value !== undefined ? String(value) : '';
          });
          return row.join(',');
        });
        content = [headers.join(','), ...rows].join('\n');
        filename = `policies_export_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const downloadUrl = globalThis.URL.createObjectURL(blob);
      const a = globalThis.document.createElement('a');
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
  }

  async function handleImport(type: 'json' | 'csv') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'json' ? 'application/json' : 'text/csv';
    
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
        
        if (type === 'json') {
          policiesToImport = JSON.parse(fileContent);
        } else {
          // Parse CSV
          const lines = fileContent.split('\n').filter(l => l.trim());
          // Skip header line
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const permissionIds = values[3]?.replaceAll('"', '').split(';').filter(id => id.trim());
            
            policiesToImport.push({
              id: values[0],
              name: values[1]?.replaceAll('"', ''),
              description: values[2]?.replaceAll('"', ''),
              permissions: permissionIds.map(id => ({ id: id.trim() })),
            });
          }
        }
        
        totalRecords = policiesToImport.length;
        
        // Import each policy
        for (const policyData of policiesToImport) {
          try {
            // 1. Create the policy (without permissions)
            const createRes = await fetchWithAuth(GUARDIAN_ROUTES.policies, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: policyData.name,
                description: policyData.description,
              }),
            });
            
            if (!createRes.ok) {
              const errorData = await createRes.json();
              errors.push(`Policy "${policyData.name}": ${errorData.message || 'Failed to create'}`);
              continue;
            }
            
            const createdPolicy = await createRes.json();
            
            // 2. Add permissions to the policy
            if (policyData.permissions && policyData.permissions.length > 0) {
              for (const perm of policyData.permissions) {
                try {
                  const addPermRes = await fetchWithAuth(
                    GUARDIAN_ROUTES.policyPermissions(createdPolicy.id.toString()),
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ permission_id: perm.id }),
                    }
                  );
                  
                  if (!addPermRes.ok) {
                    warnings.push(`Policy "${policyData.name}": Failed to add permission ${perm.id}`);
                  }
                } catch (error_) {
                  warnings.push(`Policy "${policyData.name}": Error adding permission ${perm.id}`);
                  console.error('Permission addition error:', error_);
                }
              }
            }
            
            successfulImports++;
          } catch (err) {
            errors.push(`Policy "${policyData.name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        
        // Show import report
        setImportReport({
          total_records: totalRecords,
          successful_imports: successfulImports,
          failed_imports: totalRecords - successfulImports,
          errors,
          warnings,
        });
        setShowImportReport(true);
        
        // Refresh data if there were any successful imports
        if (successfulImports > 0) {
          await fetchData();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : dictionary.error_import);
      } finally {
        setIsImporting(false);
      }
    };
    
    input.click();
  }

  // ==================== TABLE CONFIGURATION ====================
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<Policy>[] = [
    {
      id: "expand",
      header: "",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <button 
          onClick={() => toggleExpand(row.original.id)}
          {...testId(DASHBOARD_TEST_IDS.policies.expandButton(row.original.id.toString()))}
        >
          {expanded[row.original.id] ? 
            <ChevronDown className={ICON_SIZES.sm} /> : 
            <ChevronRight className={ICON_SIZES.sm} />
          }
        </button>
      ),
    },
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
      accessorKey: "description",
      enableColumnFilter: true,
      cell: ({ row }) => row.original.description || "-",
      filterFn: (row, _columnId, filterValue) => {
        const trimmedFilter = filterValue.toLowerCase().trim();
        if (trimmedFilter === "-") {
          return !row.original.description;
        }
        const description = row.original.description || "";
        return description.toLowerCase().includes(trimmedFilter);
      },
      header: ({ column }) => {
        return (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2 hover:text-foreground"
          >
            {dictionary.table_description}
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
      accessorKey: "permissions",
      enableSorting: false,
      enableColumnFilter: false,
      header: dictionary.table_permissions,
      cell: ({ row }) => `${row.original.permissions?.length || 0} permission(s)`,
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
                onClick={() => openEditPolicyDialog(row.original)}
                className="p-1 hover:bg-gray-100 rounded inline-flex"
                {...testId(DASHBOARD_TEST_IDS.policies.editButton(row.original.id.toString()))}
              >
                <Pencil className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.update}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Éditer la politique</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleDeletePolicy(row.original.id)}
                className="p-1 hover:bg-gray-100 rounded inline-flex"
                {...testId(DASHBOARD_TEST_IDS.policies.deleteButton(row.original.id.toString()))}
              >
                <Trash2 className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.delete}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Supprimer la politique</TooltipContent>
          </Tooltip>
          <Button 
            variant="outline"
            size="sm" 
            onClick={() => openPermissionDialog(row.original)}
            {...testId(DASHBOARD_TEST_IDS.policies.addPermissionButton(row.original.id.toString()))}
          >
            <Plus className={`${ICON_SIZES.sm} mr-1`} />
            Permission
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: policies,
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
    <section {...testId(DASHBOARD_TEST_IDS.policies.section)}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold" {...testId(DASHBOARD_TEST_IDS.policies.title)}>
          {dictionary.page_title}
        </h2>
        <div className="flex items-center gap-2">
          {/* Import Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                disabled={isImporting}
                {...testId("policy-import-button")}
              >
                <Upload className={`${ICON_SIZES.sm} mr-2`} />
                {dictionary.import_button}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleImport('json')}>
                <FileJson className={`${ICON_SIZES.sm} mr-2`} />
                {dictionary.import_json}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleImport('csv')}>
                <FileText className={`${ICON_SIZES.sm} mr-2`} />
                {dictionary.import_csv}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                disabled={isExporting}
                {...testId("policy-export-button")}
              >
                <Download className={`${ICON_SIZES.sm} mr-2`} />
                {dictionary.export_button}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileJson className={`${ICON_SIZES.sm} mr-2`} />
                {dictionary.export_json}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className={`${ICON_SIZES.sm} mr-2`} />
                {dictionary.export_csv}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Create Button */}
          <Button 
            onClick={openCreatePolicyDialog}
            {...testId(DASHBOARD_TEST_IDS.policies.addButton)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {dictionary.create_button}
          </Button>
        </div>
      </div>
      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent 
            aria-describedby={void 0} 
            aria-label="add_policy-dialog"
            {...testId(DASHBOARD_TEST_IDS.policies.dialog)}
          >
            <DialogTitle {...testId(DASHBOARD_TEST_IDS.policies.dialogTitle)}>
              {editingPolicy ? dictionary.modal_edit_title : dictionary.modal_create_title}
            </DialogTitle>
            <form 
              className={`p-6 ${SPACING.component.md}`} 
              onSubmit={policyForm.handleSubmit(handlePolicySubmit)}
            >
              <div>
                <label className="block text-sm mb-1">{dictionary.form_name_required}</label>
                <Input
                  {...policyForm.register("name")}
                  {...testId(DASHBOARD_TEST_IDS.policies.nameInput)}
                />
                {policyForm.formState.errors.name && (
                  <div className={`${COLOR_CLASSES.text.destructive} text-xs mt-1`}>
                    {policyForm.formState.errors.name.message}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">{dictionary.form_description}</label>
                <Input
                  {...policyForm.register("description")}
                  {...testId(DASHBOARD_TEST_IDS.policies.descriptionInput)}
                />
                {policyForm.formState.errors.description && (
                  <div className={`${COLOR_CLASSES.text.destructive} text-xs mt-1`}>
                    {policyForm.formState.errors.description.message}
                  </div>
                )}
              </div>
              <div className={`flex ${SPACING.gap.sm} justify-end mt-4`}>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowPolicyDialog(false)}
                  {...testId(DASHBOARD_TEST_IDS.policies.cancelButton)}
                >
                  {dictionary.form_cancel}
                </Button>
                <Button 
                  type="submit" 
                  variant="default"
                  {...testId(DASHBOARD_TEST_IDS.policies.submitButton)}
                >
                  {editingPolicy ? dictionary.form_save : dictionary.form_create}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      <div className="border rounded-lg">
        <Table {...testId(DASHBOARD_TEST_IDS.policies.table)}>
          <TableHeader {...testId(DASHBOARD_TEST_IDS.policies.tableHeader)}>
            {table.getHeaderGroups().map((headerGroup) => (
              <React.Fragment key={headerGroup.id}>
                <TableRow>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className={header.id === "expand" ? "w-12" : undefined}>
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
                <React.Fragment key={row.id}>
                  <TableRow {...testId(DASHBOARD_TEST_IDS.policies.tableRow(row.original.id.toString()))}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cell.column.id === "actions" ? "text-right" : undefined}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expanded[row.original.id] && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="px-4 py-3 bg-gray-50">
                        <div>
                          <div className="font-medium mb-2">Permissions associées :</div>
                          {(row.original.permissions?.length ?? 0) === 0 ? (
                            <div className="text-gray-500 text-sm">Aucune permission associée</div>
                          ) : (
                            <div className="space-y-2">
                              {groupPermissions(row.original.permissions || []).map(group => (
                                <div
                                  key={group.service + group.resource_name}
                                  className="flex items-center bg-white p-2 rounded border"
                                  {...testId(DASHBOARD_TEST_IDS.policies.permissionGroup(
                                    group.service, 
                                    group.resource_name
                                  ))}
                                >
                                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                    {group.service} / {group.resource_name}
                                  </span>
                                  <span className={`flex ${SPACING.gap.sm} ml-2 mr-4`}>
                                    {group.perms.map(perm => (
                                      <Tooltip key={perm.id}>
                                        <TooltipTrigger asChild>
                                          <span 
                                            className="inline-flex items-center cursor-help"
                                            {...testId(DASHBOARD_TEST_IDS.policies.permissionIcon(perm.id))}
                                          >
                                            {getOperationIcon(perm.operation, dictionary).icon}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <div>{getOperationIcon(perm.operation, dictionary).label}</div>
                                          {perm.description && (
                                            <div className="text-xs opacity-80 mt-1">
                                              {perm.description}
                                            </div>
                                          )}
                                        </TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </span>
                                  {/* Actions alignées à droite */}
                                  <span className="ml-auto flex space-x-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            openPermissionDialog(
                                              { ...row.original, permissions: group.perms },
                                              group.service,
                                              group.resource_name
                                            );
                                          }}
                                          {...testId(DASHBOARD_TEST_IDS.policies.editPermissionGroupButton(
                                            group.service,
                                            group.resource_name
                                          ))}
                                        >
                                          <Pencil className={ICON_SIZES.sm} />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Éditer les opérations</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemovePermissionGroup(row.original.id, group.perms)}
                                          {...testId(DASHBOARD_TEST_IDS.policies.deletePermissionGroupButton(
                                            group.service,
                                            group.resource_name
                                          ))}
                                        >
                                          <Trash2 className={`${ICON_SIZES.sm} ${COLOR_CLASSES.text.destructive}`} />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Supprimer toutes les permissions de ce groupe</TooltipContent>
                                    </Tooltip>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-gray-500">
                  Aucune politique
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Dialog pour ajouter des permissions */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent
          style={{
            maxWidth: 800,
            minWidth: 600,
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
          }} 
          aria-describedby={void 0} 
          aria-label="add_permissions-dialog"
          {...testId(DASHBOARD_TEST_IDS.policies.addPermissionDialog)}
        >
          <DialogTitle {...testId(DASHBOARD_TEST_IDS.policies.addPermissionDialogTitle)}>
            Ajouter des permissions à {selectedPolicy?.name}
          </DialogTitle>
          <div className={`flex flex-col md:flex-row ${SPACING.gap.lg} mt-4 flex-1 overflow-hidden`}>
            <div className="flex-1 min-w-0">
              <div className="font-semibold mb-2">Permissions déjà associées</div>
              <div className="overflow-y-auto max-h-[30vh] pr-2 overflow-x-hidden">
                {(selectedPolicy?.permissions?.length ?? 0) === 0 ? (
                  <div className={COLOR_CLASSES.text.muted}>Aucune permission</div>
                ) : (
                  <ul className={SPACING.component.xs}>
                    {groupPermissions(selectedPolicy?.permissions || []).map(group => (
                      <li 
                        key={group.service + group.resource_name} 
                        className="flex flex-col gap-2"
                      >
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs inline-block">
                          {group.service} / {group.resource_name}
                        </span>
                        <span className={`flex flex-wrap ${SPACING.gap.sm}`}>
                          {group.perms.map(perm => (
                            <Tooltip key={perm.id}>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center cursor-help">
                                  {getOperationIcon(perm.operation, dictionary).icon}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div>{getOperationIcon(perm.operation, dictionary).label}</div>
                                {perm.description && (
                                  <div className="text-xs opacity-80 mt-1">
                                    {perm.description}
                                  </div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold mb-2">Permissions disponibles</div>
              <div className={`flex flex-wrap ${SPACING.gap.sm} mb-2`}>
                <select
                  className="border rounded px-2 py-1 min-w-[120px]"
                  value={filterService}
                  onChange={e => {
                    setFilterService(e.target.value);
                    // Réinitialiser le filtre de ressource si le nouveau service ne contient pas la ressource actuelle
                    if (e.target.value && filterResource) {
                      const resourceExistsInService = permissions.some(
                        p => p.service === e.target.value && p.resource_name === filterResource
                      );
                      if (!resourceExistsInService) {
                        setFilterResource("");
                      }
                    }
                  }}
                  {...testId(DASHBOARD_TEST_IDS.policies.serviceFilter)}
                >
                  <option value="">Service</option>
                  {uniqueServices.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  className="border rounded px-2 py-1 min-w-[120px]"
                  value={filterResource}
                  onChange={e => setFilterResource(e.target.value)}
                  {...testId(DASHBOARD_TEST_IDS.policies.resourceFilter)}
                >
                  <option value="">Ressource</option>
                  {uniqueResources.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="overflow-y-auto max-h-[30vh] pr-2 overflow-x-hidden">
                {filteredAvailablePermissions.length === 0 ? (
                  <div className={COLOR_CLASSES.text.muted}>Aucune permission disponible</div>
                ) : (
                  <ul className={SPACING.component.xs}>
                    {groupAvailablePermissions(filteredAvailablePermissions).map(group => (
                      <li 
                        key={group.service + group.resource_name} 
                        className="flex flex-col gap-2"
                      >
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs inline-block">
                          {group.service} / {group.resource_name}
                        </span>
                        <span className={`flex flex-wrap ${SPACING.gap.sm}`}>
                          {group.perms.map(perm => (
                            <label 
                              key={perm.id} 
                              className={`flex items-center ${SPACING.gap.sm} cursor-pointer`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissionsToAdd.has(perm.id)}
                                onChange={() => handleSelectPermissionToAdd(perm.id)}
                                {...testId(DASHBOARD_TEST_IDS.policies.permissionCheckbox(perm.id))}
                              />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center cursor-help">
                                    {getOperationIcon(perm.operation, dictionary).icon}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div>{getOperationIcon(perm.operation, dictionary).label}</div>
                                  {perm.description && (
                                    <div className="text-xs opacity-80 mt-1">
                                      {perm.description}
                                    </div>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </label>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div className={`flex justify-end ${SPACING.gap.sm} mt-4`}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowPermissionDialog(false)}
              {...testId(DASHBOARD_TEST_IDS.policies.addPermissionCancelButton)}
            >
              Annuler
            </Button>
            <Button
              variant="default"
              disabled={selectedPermissionsToAdd.size === 0}
              onClick={handleAddPermissionsToPolicy}
              {...testId(DASHBOARD_TEST_IDS.policies.addPermissionSubmitButton)}
            >
              Ajouter {selectedPermissionsToAdd.size > 0 ? `(${selectedPermissionsToAdd.size})` : ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {error && (
        <div 
          className={`${COLOR_CLASSES.text.destructive} text-sm mt-2`}
          {...testId(DASHBOARD_TEST_IDS.policies.errorMessage)}
        >
          {error}
        </div>
      )}

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
                    {importReport.errors.map((err, idx) => {
                      const errorKey = typeof err === 'string' 
                        ? `error-${idx}` 
                        : (err.original_id || `error-${idx}`);
                      return (
                        <div key={errorKey} className="text-red-600">
                          {typeof err === 'string' ? err : (
                            <>
                              {err.original_id && <span>ID {err.original_id}: </span>}
                              {err.error}
                            </>
                          )}
                        </div>
                      );
                    })}
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
                <Button onClick={() => setShowImportReport(false)}>
                  {dictionary.import_report_close}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

