"use client";

import React, { useEffect, useState } from "react";

// ==================== UI COMPONENTS ====================
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Eye, PlusSquare, List, Pencil, Trash2, ChevronDown, ChevronRight, Plus } from "lucide-react";

// ==================== CONSTANTS ====================
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { GUARDIAN_ROUTES } from "@/lib/api-routes";
import { DASHBOARD_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES, COLOR_CLASSES, SPACING } from "@/lib/design-tokens";

// ==================== VALIDATION ====================
import { useZodForm } from "@/lib/hooks";
import { policySchema, PolicyFormData } from "@/lib/validation";

// ==================== TYPES ====================

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
  
  const cleanOperation = operation.replace(/^OperationEnum\./, "");
  const OPERATION_ICONS = getOperationIcons(dictionary);
  const iconConfig = OPERATION_ICONS[cleanOperation as keyof typeof OPERATION_ICONS];
  
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
      const opA = a.operation.replace(/^OperationEnum\./, '');
      const opB = b.operation.replace(/^OperationEnum\./, '');
      const orderA = operationOrder[opA] || 999;
      const orderB = operationOrder[opB] || 999;
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
      const opA = a.operation.replace(/^OperationEnum\./, '');
      const opB = b.operation.replace(/^OperationEnum\./, '');
      const orderA = operationOrder[opA] || 999;
      const orderB = operationOrder[opB] || 999;
      return orderA - orderB;
    });
  });
  
  return Object.values(groups);
}

export default function Policies({ dictionary }: { dictionary: PoliciesDictionary }) {
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

  // ==================== HANDLERS ====================
  async function fetchData() {
    try {
      const [permissionsRes, policiesRes] = await Promise.all([
        fetch(GUARDIAN_ROUTES.permissions),
        fetch(GUARDIAN_ROUTES.policies),
      ]);
      if (permissionsRes.status === 401 || policiesRes.status === 401) {
        window.location.href = "/login";
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
        window.location.href = "/login";
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
    if (!window.confirm("Supprimer cette politique ?")) return;
    try {
      const res = await fetchWithAuth(GUARDIAN_ROUTES.policy(policyId.toString()), {
        method: "DELETE",
      });
      if (res.status === 401) {
        window.location.href = "/login";
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
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(dictionary.error_delete);
    } catch (err) {
      console.error("removePermissionWithoutConfirm error:", err);
      throw err;
    }
  }

  async function handleRemovePermissionGroup(policyId: string | number, permissions: Permission[]) {
    if (!window.confirm(`Supprimer toutes les permissions de ce groupe (${permissions.length} permission${permissions.length > 1 ? 's' : ''}) ?`)) return;
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
        window.location.href = "/login";
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

  // ==================== RENDER ====================
  return (
    <section {...testId(DASHBOARD_TEST_IDS.policies.section)}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold" {...testId(DASHBOARD_TEST_IDS.policies.title)}>
          {dictionary.page_title}
        </h2>
        <Button 
          onClick={openCreatePolicyDialog}
          {...testId(DASHBOARD_TEST_IDS.policies.addButton)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {dictionary.create_button}
        </Button>
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
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>{dictionary.table_name}</TableHead>
            <TableHead>{dictionary.table_description}</TableHead>
            <TableHead>{dictionary.table_permissions}</TableHead>
            <TableHead className="text-right">{dictionary.table_actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {policies.map(policy => (
            <React.Fragment key={policy.id}>
              <TableRow {...testId(DASHBOARD_TEST_IDS.policies.tableRow(policy.id.toString()))}>
                <TableCell>
                  <button 
                    onClick={() => toggleExpand(policy.id)}
                    {...testId(DASHBOARD_TEST_IDS.policies.expandButton(policy.id.toString()))}
                  >
                    {expanded[policy.id] ? 
                      <ChevronDown className={ICON_SIZES.sm} /> : 
                      <ChevronRight className={ICON_SIZES.sm} />
                    }
                  </button>
                </TableCell>
                <TableCell className="font-medium">{policy.name}</TableCell>
                <TableCell className="text-gray-600">
                  {policy.description || "-"}
                </TableCell>
                <TableCell>{policy.permissions?.length || 0} permission(s)</TableCell>
                <TableCell className="text-right space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost"
                        size="sm" 
                        onClick={() => openEditPolicyDialog(policy)}
                        {...testId(DASHBOARD_TEST_IDS.policies.editButton(policy.id.toString()))}
                      >
                        <Pencil className={ICON_SIZES.sm} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Éditer la politique</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost"
                        size="sm" 
                        onClick={() => handleDeletePolicy(policy.id)}
                        {...testId(DASHBOARD_TEST_IDS.policies.deleteButton(policy.id.toString()))}
                      >
                        <Trash2 className={`${ICON_SIZES.sm} ${COLOR_CLASSES.text.destructive}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Supprimer la politique</TooltipContent>
                  </Tooltip>
                  <Button 
                    variant="outline"
                    size="sm" 
                    onClick={() => openPermissionDialog(policy)}
                    {...testId(DASHBOARD_TEST_IDS.policies.addPermissionButton(policy.id.toString()))}
                  >
                    <Plus className={`${ICON_SIZES.sm} mr-1`} />
                    Permission
                  </Button>
                </TableCell>
              </TableRow>
              {expanded[policy.id] && (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-3 bg-gray-50">
                    <div>
                      <div className="font-medium mb-2">Permissions associées :</div>
                      {(policy.permissions?.length ?? 0) === 0 ? (
                        <div className="text-gray-500 text-sm">Aucune permission associée</div>
                      ) : (
                        <div className="space-y-2">
                          {groupPermissions(policy.permissions || []).map(group => (
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
                                          { ...policy, permissions: group.perms },
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
                                      onClick={() => handleRemovePermissionGroup(policy.id, group.perms)}
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
          ))}
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
    </section>
  );
}

