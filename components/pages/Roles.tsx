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
 * Roles Management Component
 * 
 * RBAC Role management interface with:
 * - List all roles with expandable policy associations
 * - Create/Edit/Delete roles
 * - Assign/Remove policies to/from roles
 * - Zod validation for forms
 * - Full test coverage with data-testid attributes
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
import { GUARDIAN_ROUTES } from "@/lib/api-routes/guardian";
import { BASIC_IO_ROUTES } from "@/lib/api-routes/basic_io";
import { DASHBOARD_TEST_IDS } from "@/lib/test-ids/dashboard";
import { roleSchema, RoleFormData } from "@/lib/validation/guardian.schemas";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Download, Upload } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { ICON_SIZES, COLOR_CLASSES } from "@/lib/design-tokens";

// ==================== TYPE DEFINITIONS ====================

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
};

type Policy = {
  id: string | number;
  name: string;
  description?: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
};

type Role = {
  id: string | number;
  name: string;
  description?: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
  policies?: Policy[];
};

// ==================== UTILITY FUNCTIONS ====================

function testId(id: string) {
  return { "data-testid": id };
}

// ==================== MAIN COMPONENT ====================

export default function Roles({ dictionary }: { readonly dictionary: RolesDictionary }) {
  // ==================== STATE MANAGEMENT ====================
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string | number, boolean>>({});

  // Role dialog (create/edit)
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Role form with Zod validation
  const roleForm = useZodForm({
    schema: roleSchema,
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Policy dialog (add to role)
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPoliciesToAdd, setSelectedPoliciesToAdd] = useState<Set<string | number>>(new Set());

  // Import/Export state
  const [showImportReport, setShowImportReport] = useState(false);
  const [importReport, setImportReport] = useState<{
    total_records: number;
    successful_imports: number;
    failed_imports: number;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // ==================== DATA FETCHING ====================

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData() {
    try {
      setError("");
      const [policiesRes, rolesRes] = await Promise.all([
        fetchWithAuth(GUARDIAN_ROUTES.policies),
        fetchWithAuth(GUARDIAN_ROUTES.roles),
      ]);

      // Parse policies
      let policiesArray: Policy[] = [];
      if (policiesRes.ok) {
        const policiesData = await policiesRes.json();
        if (Array.isArray(policiesData)) {
          policiesArray = policiesData;
        }
      }
      setPolicies(policiesArray);

      // Parse roles
      let rolesArray: Role[] = [];
      if (!rolesRes.ok) {
        const errorText = await rolesRes.text();
        let errorMsg = dictionary.error_fetch;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) errorMsg = errorJson.message;
        } catch {
          // Keep default error message
        }
        throw new Error(errorMsg);
      }

      const rolesData = await rolesRes.json();
      if (Array.isArray(rolesData)) {
        rolesArray = rolesData;
      } else {
        throw new TypeError(dictionary.error_fetch + ": " + JSON.stringify(rolesData).slice(0, 200));
      }

      // Fetch policies for each role
      const rolesWithPolicies = await Promise.all(
        rolesArray.map(async (role) => {
          try {
            const rolePolsRes = await fetchWithAuth(GUARDIAN_ROUTES.rolePolicies(role.id.toString()));
            if (!rolePolsRes.ok) {
              console.warn(`Failed to fetch policies for role ${role.id}`);
              return { ...role, policies: [] };
            }
            const rolePolsData = await rolePolsRes.json();
            let rolePolicies: Policy[] = [];
            if (Array.isArray(rolePolsData)) {
              rolePolicies = rolePolsData;
            }
            return { ...role, policies: rolePolicies };
          } catch (err) {
            console.warn(`Error fetching policies for role ${role.id}:`, err);
            return { ...role, policies: [] };
          }
        })
      );
      
      setRoles(rolesWithPolicies);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(dictionary.error_fetch);
    }
  }

  // ==================== ROLE CRUD OPERATIONS ====================

  function openCreateRoleDialog() {
    setEditingRole(null);
    roleForm.reset({ name: "", description: "" });
    setShowRoleDialog(true);
  }

  function openEditRoleDialog(role: Role) {
    setEditingRole(role);
    roleForm.reset({
      name: role.name,
      description: role.description || "",
    });
    setShowRoleDialog(true);
  }

  async function handleRoleSubmit(data: RoleFormData) {
    const payload = {
      name: data.name,
      description: data.description,
    };
    try {
      let res;
      const options = {
        method: editingRole ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };
      if (editingRole) {
        res = await fetchWithAuth(GUARDIAN_ROUTES.role(editingRole.id.toString()), options);
      } else {
        res = await fetchWithAuth(GUARDIAN_ROUTES.roles, options);
      }
      if (res.status === 401) {
        globalThis.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erreur API roles:", errorText);
        throw new Error(dictionary.error_create);
      }
      setShowRoleDialog(false);
      fetchData();
    } catch (err) {
      console.error("handleRoleSubmit error:", err);
      setError(editingRole ? dictionary.error_update : dictionary.error_create);
    }
  }

  async function handleDeleteRole(roleId: string | number) {
    if (!globalThis.confirm(dictionary.delete_confirm_message)) return;
    try {
      const res = await fetchWithAuth(GUARDIAN_ROUTES.role(roleId.toString()), {
        method: "DELETE",
      });
      if (res.status === 401) {
        globalThis.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(dictionary.error_delete);
      fetchData();
    } catch (err) {
      console.error("handleDeleteRole error:", err);
      setError(dictionary.error_delete);
    }
  }

  // ==================== ROLE EXPANSION ====================

  function toggleExpand(roleId: string | number) {
    setExpanded(prev => ({ ...prev, [roleId]: !prev[roleId] }));
  }

  // ==================== POLICY ASSIGNMENT ====================

  function openPolicyDialog(role: Role) {
    setSelectedRole(role);
    setShowPolicyDialog(true);
    setSelectedPoliciesToAdd(new Set());
  }

  function handleSelectPolicyToAdd(policyId: string | number) {
    setSelectedPoliciesToAdd(prev => {
      const newSet = new Set(prev);
      if (newSet.has(policyId)) {
        newSet.delete(policyId);
      } else {
        newSet.add(policyId);
      }
      return newSet;
    });
  }

  async function handleAddPoliciesToRole() {
    if (!selectedRole || selectedPoliciesToAdd.size === 0) return;
    try {
      console.log("Adding policies to role:", selectedRole.id);
      console.log("Selected policies:", Array.from(selectedPoliciesToAdd));
      
      // Send a POST per policy
      const results = await Promise.all(
        Array.from(selectedPoliciesToAdd).map(async (policyId) => {
          const url = GUARDIAN_ROUTES.rolePolicies(selectedRole.id.toString());
          console.log(`Posting policy ${policyId} to ${url}`);
          const res = await fetchWithAuth(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ policy_id: policyId }),
          });
          console.log(`Response for policy ${policyId}:`, res.status);
          if (res.status === 401) {
            globalThis.location.href = "/login";
            return null;
          }
          if (!res.ok) throw new Error(`Failed to add policy ${policyId}`);
          return res;
        })
      );
      
      if (results.includes(null)) return; // Redirected to login
      
      setShowPolicyDialog(false);
      setSelectedPoliciesToAdd(new Set());
      fetchData();
    } catch (err) {
      console.error("handleAddPoliciesToRole error:", err);
      setError(dictionary.error_create);
    }
  }

  async function removePolicyWithoutConfirm(roleId: string | number, policyId: string | number) {
    try {
      const res = await fetchWithAuth(
        GUARDIAN_ROUTES.rolePolicy(roleId.toString(), policyId.toString()), 
        { method: "DELETE" }
      );
      if (res.status === 401) {
        globalThis.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(dictionary.error_delete);
    } catch (err) {
      console.error("removePolicyWithoutConfirm error:", err);
      throw err;
    }
  }

  async function handleRemovePolicy(roleId: string | number, policyId: string | number, policyName: string) {
    if (!globalThis.confirm(`${dictionary.delete_policy_confirm_message} "${policyName}" de ce rôle ?`)) return;
    try {
      await removePolicyWithoutConfirm(roleId, policyId);
      fetchData();
    } catch {
      setError(dictionary.error_delete);
    }
  }

  // Get available policies (not already assigned to selected role)
  function getAvailablePolicies(): Policy[] {
    if (!selectedRole) return policies;
    const assignedPolicyIds = new Set(
      (selectedRole.policies || []).map(p => p.id)
    );
    return policies.filter(p => !assignedPolicyIds.has(p.id));
  }

  // ==================== IMPORT/EXPORT OPERATIONS ====================

  async function handleExport(type: 'json' | 'csv') {
    try {
      setIsExporting(true);
      
      // Use basic-io to get roles (enrich=true resolves simple FK like company_id)
      // Then enrich with policies from current state (roles_policies table not handled by basic-io)
      const format = type === 'json' ? 'json' : 'csv';
      const exportUrl = new URL(BASIC_IO_ROUTES.export, globalThis.location.origin);
      exportUrl.searchParams.set('service', 'guardian');
      exportUrl.searchParams.set('path', '/roles');
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
      
      // Add policies from current state (roles_policies association table)
      const rolesWithPolicies = Array.isArray(enrichedData) ? enrichedData.map((role: { id: string | number }) => {
        const roleWithPolicies = roles.find(r => r.id === role.id);
        return {
          ...role,
          policies: roleWithPolicies?.policies?.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
          })) || [],
        };
      }) : enrichedData;

      let content: string;
      let filename: string;
      let mimeType: string;

      if (type === 'json') {
        content = JSON.stringify(rolesWithPolicies, null, 2);
        filename = `roles_export_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // Convert back to CSV with policies added
        const headers = Object.keys(rolesWithPolicies[0] || {}).filter(k => k !== 'policies').concat(['policy_ids']);
        const rows = rolesWithPolicies.map((role: { policies?: Array<{ id: string }>, [key: string]: unknown }) => {
          const row = headers.map(h => {
            if (h === 'policy_ids') {
              return role.policies?.map(p => p.id).join(';') || '';
            }
            const value = role[h];
            return value !== null && value !== undefined ? String(value) : '';
          });
          return row.join(',');
        });
        content = [headers.join(','), ...rows].join('\n');
        filename = `roles_export_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = globalThis.URL.createObjectURL(blob);
      const a = globalThis.document.createElement('a');
      a.href = url;
      a.download = filename;
      globalThis.document.body.appendChild(a);
      a.click();
      a.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError(dictionary.error_export);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport(type: 'json' | 'csv') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'json' ? '.json' : '.csv';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setIsImporting(true);
        const fileContent = await file.text();
        
        let rolesToImport: Array<{
          name: string;
          description?: string;
          policies: Array<{ id: string | number }> | string[];
        }> = [];

        if (type === 'json') {
          const parsed = JSON.parse(fileContent);
          rolesToImport = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          // Parse CSV
          const lines = fileContent.split('\n').filter(l => l.trim());
          if (lines.length < 2) throw new Error('Empty CSV file');
          
          const headers = lines[0].split(',');
          const nameIdx = headers.indexOf('name');
          const descIdx = headers.indexOf('description');
          const policyIdsIdx = headers.indexOf('policy_ids');
          
          if (nameIdx === -1) throw new Error('CSV must have "name" column');
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const policyIdsStr = policyIdsIdx !== -1 ? values[policyIdsIdx] : '';
            const policyIds = policyIdsStr ? policyIdsStr.split(';').filter(id => id.trim()) : [];
            
            rolesToImport.push({
              name: values[nameIdx],
              description: descIdx !== -1 ? values[descIdx] : undefined,
              policies: policyIds.map(id => ({ id: id.trim() })),
            });
          }
        }

        // Import roles
        const report = {
          total_records: rolesToImport.length,
          successful_imports: 0,
          failed_imports: 0,
          errors: [] as string[],
          warnings: [] as string[],
        };

        for (const roleData of rolesToImport) {
          try {
            // Create role
            const createRes = await fetchWithAuth(GUARDIAN_ROUTES.roles, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: roleData.name,
                description: roleData.description,
              }),
            });

            if (!createRes.ok) {
              const errorText = await createRes.text();
              report.failed_imports++;
              report.errors.push(`Role "${roleData.name}": ${errorText}`);
              continue;
            }

            const createdRole = await createRes.json();
            report.successful_imports++;

            // Add policies if any
            if (roleData.policies && Array.isArray(roleData.policies) && roleData.policies.length > 0) {
              for (const policy of roleData.policies) {
                try {
                  const policyId = typeof policy === 'object' ? policy.id : policy;
                  const addPolicyRes = await fetchWithAuth(
                    GUARDIAN_ROUTES.rolePolicies(createdRole.id.toString()),
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ policy_id: policyId }),
                    }
                  );

                  if (!addPolicyRes.ok) {
                    report.warnings.push(
                      `Role "${roleData.name}": Failed to add policy ${policyId}`
                    );
                  }
                } catch (error_) {
                  report.warnings.push(
                    `Role "${roleData.name}": Error adding policy - ${error_}`
                  );
                }
              }
            }
          } catch (err) {
            report.failed_imports++;
            report.errors.push(`Role "${roleData.name}": ${err}`);
          }
        }

        setImportReport(report);
        setShowImportReport(true);
        fetchData();
      } catch (err) {
        console.error('Import error:', err);
        setError(dictionary.error_import + ': ' + err);
      } finally {
        setIsImporting(false);
      }
    };

    input.click();
  }

  // ==================== TABLE CONFIGURATION ====================
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<Role>[] = [
    {
      id: "expand",
      header: "",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <button
          onClick={() => toggleExpand(row.original.id)}
          className="hover:bg-gray-100 p-1 rounded"
          {...testId(DASHBOARD_TEST_IDS.roles.expandButton(row.original.id.toString()))}
        >
          {expanded[row.original.id] ? (
            <ChevronDown className={ICON_SIZES.sm} />
          ) : (
            <ChevronRight className={ICON_SIZES.sm} />
          )}
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
              <ArrowUp className={`${ICON_SIZES.sm}`} />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className={`${ICON_SIZES.sm}`} />
            ) : (
              <ArrowUpDown className={`${ICON_SIZES.sm} opacity-50`} />
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
              <ArrowUp className={`${ICON_SIZES.sm}`} />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className={`${ICON_SIZES.sm}`} />
            ) : (
              <ArrowUpDown className={`${ICON_SIZES.sm} opacity-50`} />
            )}
          </button>
        );
      },
    },
    {
      accessorKey: "policies",
      enableSorting: false,
      enableColumnFilter: false,
      header: dictionary.table_policies,
      cell: ({ row }) => `${row.original.policies?.length || 0} politique(s)`,
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
                onClick={() => openEditRoleDialog(row.original)}
                className="p-1 hover:bg-gray-100 rounded inline-flex"
                {...testId(DASHBOARD_TEST_IDS.roles.editButton(row.original.id.toString()))}
              >
                <Pencil className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.update}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Éditer le rôle</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleDeleteRole(row.original.id)}
                className="p-1 hover:bg-gray-100 rounded inline-flex"
                {...testId(DASHBOARD_TEST_IDS.roles.deleteButton(row.original.id.toString()))}
              >
                <Trash2 className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.delete}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Supprimer le rôle</TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openPolicyDialog(row.original)}
            {...testId(DASHBOARD_TEST_IDS.roles.addPolicyButton(row.original.id.toString()))}
          >
            <Plus className={`${ICON_SIZES.sm} mr-1`} />
            Politique
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: roles,
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
    <div className="space-y-4" {...testId(DASHBOARD_TEST_IDS.roles.section)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" {...testId(DASHBOARD_TEST_IDS.roles.title)}>
          {dictionary.page_title}
        </h2>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isImporting}>
                <Upload className={`${ICON_SIZES.sm} mr-2`} />
                {dictionary.import_button}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleImport('json')}>
                {dictionary.import_json}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleImport('csv')}>
                {dictionary.import_csv}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting || roles.length === 0}>
                <Download className={`${ICON_SIZES.sm} mr-2`} />
                {dictionary.export_button}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                {dictionary.export_json}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                {dictionary.export_csv}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={openCreateRoleDialog}
            {...testId(DASHBOARD_TEST_IDS.roles.addButton)}
          >
            <Plus className={`${ICON_SIZES.sm} mr-2`} />
            {dictionary.create_button}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
          {...testId(DASHBOARD_TEST_IDS.roles.errorMessage)}
        >
          {error}
        </div>
      )}

      {/* Roles Table */}
      <div className="border rounded-lg">
        <Table {...testId(DASHBOARD_TEST_IDS.roles.table)}>
          <TableHeader {...testId(DASHBOARD_TEST_IDS.roles.tableHeader)}>
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
                  <TableRow {...testId(DASHBOARD_TEST_IDS.roles.tableRow(row.original.id.toString()))}>
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
                          <div className="font-medium mb-2">Politiques associées :</div>
                          {(row.original.policies?.length ?? 0) === 0 ? (
                            <div className="text-gray-500 text-sm">Aucune politique associée</div>
                          ) : (
                            <div className="space-y-2">
                              {(row.original.policies || []).map((policy) => (
                                <div
                                  key={policy.id}
                                  className="flex items-center bg-white p-2 rounded border"
                                  {...testId(DASHBOARD_TEST_IDS.roles.policyItem(row.original.id.toString(), policy.id.toString()))}
                                >
                                  <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                                    {policy.name}
                                  </span>
                                  <span className="ml-2 text-sm text-gray-600">
                                    {policy.description || ""}
                                  </span>
                                  <span className="ml-auto">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemovePolicy(row.original.id, policy.id, policy.name)}
                                          {...testId(DASHBOARD_TEST_IDS.roles.removePolicyButton(row.original.id.toString(), policy.id.toString()))}
                                        >
                                          <Trash2 className={`${ICON_SIZES.sm} ${COLOR_CLASSES.text.destructive}`} />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Retirer la politique</TooltipContent>
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
                  {dictionary.no_roles}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Role Create/Edit Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent {...testId(DASHBOARD_TEST_IDS.roles.dialog)}>
          <DialogHeader>
            <DialogTitle {...testId(DASHBOARD_TEST_IDS.roles.dialogTitle)}>
              {editingRole ? dictionary.modal_edit_title : dictionary.modal_create_title}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={roleForm.handleSubmit(handleRoleSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">{dictionary.form_name_required}</Label>
              <Input
                id="name"
                {...roleForm.register("name")}
                {...testId(DASHBOARD_TEST_IDS.roles.nameInput)}
              />
              {roleForm.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {roleForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="description">{dictionary.form_description}</Label>
              <Input
                id="description"
                {...roleForm.register("description")}
                {...testId(DASHBOARD_TEST_IDS.roles.descriptionInput)}
              />
              {roleForm.formState.errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {roleForm.formState.errors.description.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRoleDialog(false)}
                {...testId(DASHBOARD_TEST_IDS.roles.cancelButton)}
              >
                {dictionary.form_cancel}
              </Button>
              <Button 
                type="submit"
                {...testId(DASHBOARD_TEST_IDS.roles.submitButton)}
              >
                {editingRole ? dictionary.form_save : dictionary.form_create}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Policies Dialog */}
      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]" {...testId(DASHBOARD_TEST_IDS.roles.addPolicyDialog)}>
          <DialogHeader>
            <DialogTitle {...testId(DASHBOARD_TEST_IDS.roles.addPolicyDialogTitle)}>
              {dictionary.policies_modal_title} &quot;{selectedRole?.name}&quot;
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {getAvailablePolicies().length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                {dictionary.policies_select}
              </div>
            ) : (
              getAvailablePolicies().map((policy) => (
                <label
                  key={policy.id}
                  className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPoliciesToAdd.has(policy.id)}
                    onChange={() => handleSelectPolicyToAdd(policy.id)}
                    className="mt-1"
                    {...testId(DASHBOARD_TEST_IDS.roles.policyCheckbox(policy.id.toString()))}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{policy.name}</div>
                    {policy.description && (
                      <div className="text-sm text-gray-600">{policy.description}</div>
                    )}
                  </div>
                </label>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPolicyDialog(false)}
              {...testId(DASHBOARD_TEST_IDS.roles.addPolicyCancelButton)}
            >
              {dictionary.form_cancel}
            </Button>
            <Button
              onClick={handleAddPoliciesToRole}
              disabled={selectedPoliciesToAdd.size === 0}
              {...testId(DASHBOARD_TEST_IDS.roles.addPolicySubmitButton)}
            >
              {dictionary.policies_add} ({selectedPoliciesToAdd.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Report Dialog */}
      <Dialog open={showImportReport} onOpenChange={setShowImportReport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dictionary.import_report_title}</DialogTitle>
          </DialogHeader>
          {importReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
                <div>
                  <div className="text-sm text-gray-600">{dictionary.import_report_total}</div>
                  <div className="text-2xl font-bold">{importReport.total_records}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">{dictionary.import_report_success}</div>
                  <div className="text-2xl font-bold text-green-600">{importReport.successful_imports}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">{dictionary.import_report_failed}</div>
                  <div className="text-2xl font-bold text-red-600">{importReport.failed_imports}</div>
                </div>
              </div>

              {importReport.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">{dictionary.import_report_errors}</h4>
                  <div className="max-h-48 overflow-y-auto bg-red-50 border border-red-200 rounded p-3">
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {importReport.errors.map((err) => (
                        <li key={`error-${err.slice(0, 50)}`} className="text-red-700">{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {importReport.warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-yellow-600 mb-2">{dictionary.import_report_warnings}</h4>
                  <div className="max-h-48 overflow-y-auto bg-yellow-50 border border-yellow-200 rounded p-3">
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {importReport.warnings.map((warn) => (
                        <li key={`warning-${warn.slice(0, 50)}`} className="text-yellow-700">{warn}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
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
