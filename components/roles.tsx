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

import { useState, useEffect } from "react";
import { GUARDIAN_ROUTES } from "@/lib/api-routes/guardian";
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
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";

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
  delete_cancel: string;
  delete_confirm: string;
  error_fetch: string;
  error_create: string;
  error_update: string;
  error_delete: string;
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

export default function Roles({ dictionary }: { dictionary: RolesDictionary }) {
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

  // ==================== DATA FETCHING ====================

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData() {
    try {
      setError("");
      const [policiesRes, rolesRes] = await Promise.all([
        fetch(GUARDIAN_ROUTES.policies),
        fetch(GUARDIAN_ROUTES.roles),
      ]);

      if (policiesRes.status === 401 || rolesRes.status === 401) {
        window.location.href = "/login";
        return;
      }

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
        throw new Error(dictionary.error_fetch + ": " + JSON.stringify(rolesData).slice(0, 200));
      }

      // Fetch policies for each role
      const rolesWithPolicies = await Promise.all(
        rolesArray.map(async (role) => {
          try {
            const rolePolsRes = await fetch(GUARDIAN_ROUTES.rolePolicies(role.id.toString()));
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
        res = await fetch(GUARDIAN_ROUTES.role(editingRole.id.toString()), options);
      } else {
        res = await fetch(GUARDIAN_ROUTES.roles, options);
      }
      if (res.status === 401) {
        window.location.href = "/login";
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
    if (!window.confirm(dictionary.delete_confirm_message)) return;
    try {
      const res = await fetch(GUARDIAN_ROUTES.role(roleId.toString()), {
        method: "DELETE",
      });
      if (res.status === 401) {
        window.location.href = "/login";
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
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ policy_id: policyId }),
          });
          console.log(`Response for policy ${policyId}:`, res.status);
          if (res.status === 401) {
            window.location.href = "/login";
            return null;
          }
          if (!res.ok) throw new Error(`Failed to add policy ${policyId}`);
          return res;
        })
      );
      
      if (results.some(r => r === null)) return; // Redirected to login
      
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
      const res = await fetch(
        GUARDIAN_ROUTES.rolePolicy(roleId.toString(), policyId.toString()), 
        { method: "DELETE" }
      );
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(dictionary.error_delete);
    } catch (err) {
      console.error("removePolicyWithoutConfirm error:", err);
      throw err;
    }
  }

  async function handleRemovePolicy(roleId: string | number, policyId: string | number, policyName: string) {
    if (!window.confirm(`${dictionary.delete_confirm_message} "${policyName}" ?`)) return;
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

  // ==================== RENDER ====================

  return (
    <div className="space-y-4" {...testId(DASHBOARD_TEST_IDS.roles.section)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" {...testId(DASHBOARD_TEST_IDS.roles.title)}>
          {dictionary.page_title}
        </h2>
        <Button 
          onClick={openCreateRoleDialog}
          {...testId(DASHBOARD_TEST_IDS.roles.addButton)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {dictionary.create_button}
        </Button>
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
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>{dictionary.table_name}</TableHead>
              <TableHead>{dictionary.table_description}</TableHead>
              <TableHead>{dictionary.table_policies}</TableHead>
              <TableHead className="text-right">{dictionary.table_actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  {dictionary.no_roles}
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id} {...testId(DASHBOARD_TEST_IDS.roles.tableRow(role.id.toString()))}>
                  <TableCell>
                    <button
                      onClick={() => toggleExpand(role.id)}
                      className="hover:bg-gray-100 p-1 rounded"
                      {...testId(DASHBOARD_TEST_IDS.roles.expandButton(role.id.toString()))}
                    >
                      {expanded[role.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-gray-600">{role.description || "-"}</TableCell>
                  <TableCell>{role.policies?.length || 0} politique(s)</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditRoleDialog(role)}
                      {...testId(DASHBOARD_TEST_IDS.roles.editButton(role.id.toString()))}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                      {...testId(DASHBOARD_TEST_IDS.roles.deleteButton(role.id.toString()))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPolicyDialog(role)}
                      {...testId(DASHBOARD_TEST_IDS.roles.addPolicyButton(role.id.toString()))}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Politique
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Expanded Policies List */}
        {roles.map((role) => {
          if (!expanded[role.id]) return null;
          const rolePolicies = role.policies || [];
          
          return (
            <div 
              key={`expanded-${role.id}`} 
              className="px-4 py-3 bg-gray-50 border-t"
              {...testId(DASHBOARD_TEST_IDS.roles.policiesSection(role.id.toString()))}
            >
              <div className="font-medium mb-2">Politiques associées :</div>
              {rolePolicies.length === 0 ? (
                <div className="text-gray-500 text-sm">Aucune politique associée</div>
              ) : (
                <div className="space-y-2">
                  {rolePolicies.map((policy) => (
                    <div
                      key={policy.id}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                      {...testId(DASHBOARD_TEST_IDS.roles.policyItem(role.id.toString(), policy.id.toString()))}
                    >
                      <div>
                        <div className="font-medium">{policy.name}</div>
                        {policy.description && (
                          <div className="text-sm text-gray-600">{policy.description}</div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePolicy(role.id, policy.id, policy.name)}
                        {...testId(DASHBOARD_TEST_IDS.roles.removePolicyButton(role.id.toString(), policy.id.toString()))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
    </div>
  );
}
