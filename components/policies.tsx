"use client";


import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Eye, PlusSquare, List, Pencil, Trash2, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

// Types
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

function getOperationIcon(operation: string) {
  switch (operation.replace(/^OperationEnum\./, "")) {
    case "READ":
      return { icon: <Eye className="w-4 h-4" />, label: "Lire (READ)" };
    case "CREATE":
      return { icon: <PlusSquare className="w-4 h-4" />, label: "Créer (CREATE)" };
    case "LIST":
      return { icon: <List className="w-4 h-4" />, label: "Lister (LIST)" };
    case "UPDATE":
      return { icon: <Pencil className="w-4 h-4" />, label: "Mettre à jour (UPDATE)" };
    case "DELETE":
      return { icon: <Trash2 className="w-4 h-4" />, label: "Supprimer (DELETE)" };
    default:
      return { icon: <span className="text-xs">{operation}</span>, label: operation };
  }
}

// Regroupe les permissions par service/ressource
function groupPermissions(permissions: Permission[]) {
  const groups: Record<string, { service: string; resource_name: string; perms: Permission[] }> = {};
  permissions.forEach(perm => {
    const key = `${perm.service}::${perm.resource_name}`;
    if (!groups[key]) {
      groups[key] = { service: perm.service, resource_name: perm.resource_name, perms: [] };
    }
    groups[key].perms.push(perm);
  });
  return Object.values(groups);
}

// Ajoute cette fonction utilitaire pour regrouper les permissions disponibles
function groupAvailablePermissions(perms: Permission[]) {
  const groups: Record<string, { service: string; resource_name: string; perms: Permission[] }> = {};
  perms.forEach(perm => {
    const key = `${perm.service}::${perm.resource_name}`;
    if (!groups[key]) {
      groups[key] = { service: perm.service, resource_name: perm.resource_name, perms: [] };
    }
    groups[key].perms.push(perm);
  });
  return Object.values(groups);
}

export default function Policies() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Policy dialog (create/edit)
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

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

  async function fetchData() {
    try {
      const [permissionsRes, policiesRes] = await Promise.all([
        fetch("/api/guardian/permissions"),
        fetch("/api/guardian/policies"),
      ]);
      if (permissionsRes.status === 401 || policiesRes.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!permissionsRes.ok) throw new Error("Erreur lors de la récupération des permissions.");
      if (!policiesRes.ok) throw new Error("Erreur lors de la récupération des policies.");
      const permissionsContentType = permissionsRes.headers.get("content-type") || "";
      const policiesContentType = policiesRes.headers.get("content-type") || "";
      if (!permissionsContentType.includes("application/json")) {
        const text = await permissionsRes.text();
        throw new Error("Réponse permissions non JSON: " + text.slice(0, 200));
      }
      if (!policiesContentType.includes("application/json")) {
        const text = await policiesRes.text();
        throw new Error("Réponse policies non JSON: " + text.slice(0, 200));
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
      setPolicies(policiesArray);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Erreur inconnue.");
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function openCreatePolicyDialog() {
    setEditingPolicy(null);
    setFormName("");
    setFormDescription("");
    setShowPolicyDialog(true);
  }

  function openEditPolicyDialog(policy: Policy) {
    setEditingPolicy(policy);
    setFormName(policy.name);
    setFormDescription(policy.description || "");
    setShowPolicyDialog(true);
  }

  async function handlePolicySubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: formName,
      description: formDescription,
    };
    try {
      let res;
      const options = {
        method: editingPolicy ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };
      if (editingPolicy) {
        res = await fetch(`/api/guardian/policies/${editingPolicy.id}`, options);
      } else {
        res = await fetch("/api/guardian/policies", options);
      }
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erreur API policies:", errorText);
        throw new Error("Erreur lors de l'enregistrement");
      }
      setShowPolicyDialog(false);
      fetchData();
    } catch (err) {
      console.error("handlePolicySubmit error:", err);
      setError("Erreur lors de l'enregistrement de la policy");
    }
  }

  async function handleDeletePolicy(policyId: string | number) {
    if (!window.confirm("Supprimer cette policy ?")) return;
    try {
      const res = await fetch(`/api/guardian/policies/${policyId}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      fetchData();
    } catch (err) {
      console.error("handleDeletePolicy error:", err);
      setError("Erreur lors de la suppression de la policy");
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

  async function handleRemovePermission(policyId: string | number, permissionId: string | number) {
    if (!window.confirm("Supprimer cette permission de la policy ?")) return;
    try {
      const res = await fetch(`/api/guardian/policies/${policyId}/permissions/${permissionId}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error("Erreur lors de la suppression de la permission");
      fetchData();
    } catch (err) {
      console.error("handleRemovePermission error:", err);
      setError("Erreur lors de la suppression de la permission");
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
      // Envoie un POST par permission
      const promises = Array.from(selectedPermissionsToAdd).map(permissionId =>
        fetch(`/api/guardian/policies/${selectedPolicy.id}/permissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permission_id: permissionId }),
        })
      );
      const results = await Promise.all(promises);
      if (results.some(res => res.status === 401)) {
        window.location.href = "/login";
        return;
      }
      if (results.some(res => !res.ok)) throw new Error("Erreur lors de l'ajout des permissions");
      setShowPermissionDialog(false);
      fetchData();
    } catch (err) {
      console.error("handleAddPermissionsToPolicy error:", err);
      setError("Erreur lors de l'ajout des permissions");
    }
  }

  // Filtrage des permissions disponibles pour la modale
  const filteredAvailablePermissions = permissions.filter(p =>
    (!filterService || p.service === filterService) &&
    (!filterResource || p.resource_name === filterResource) &&
    !(selectedPolicy?.permissions.some(sp => sp.id === p.id))
  );

  // Pour le filtrage, on extrait les services et ressources uniques
  const uniqueServices = Array.from(new Set(permissions.map(p => p.service))).sort();
  const uniqueResources = Array.from(new Set(permissions.map(p => p.resource_name))).sort();

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Policies</h2>
        <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
          <DialogTrigger asChild>
            <Button onClick={openCreatePolicyDialog}>
              Ajouter une policy
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={void 0} aria-label="add_policy-dialog">
            <DialogTitle>
              {editingPolicy ? "Éditer la policy" : "Créer une policy"}
            </DialogTitle>
            <form className="p-6 space-y-4" onSubmit={handlePolicySubmit}>
              <div>
                <label className="block text-sm mb-1">Nom</label>
                <input className="border rounded px-2 py-1 w-full" value={formName} onChange={e => setFormName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <input className="border rounded px-2 py-1 w-full" value={formDescription} onChange={e => setFormDescription(e.target.value)} />
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <Button type="button" variant="outline" onClick={() => setShowPolicyDialog(false)}>Annuler</Button>
                <Button type="submit" variant="default">{editingPolicy ? "Enregistrer" : "Créer"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {policies.map(policy => (
            <React.Fragment key={policy.id}>
              <TableRow>
                <TableCell>
                  <button onClick={() => toggleExpand(policy.id)}>
                    {expanded[policy.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </TableCell>
                <TableCell>{policy.name}</TableCell>
                <TableCell>{policy.description || <span className="text-gray-400">—</span>}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => openEditPolicyDialog(policy)}>Éditer</Button>
                  <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDeletePolicy(policy.id)}>Supprimer</Button>
                  <Button size="sm" variant="default" className="ml-2" onClick={() => openPermissionDialog(policy)}>
                    <Plus className="w-4 h-4 mr-1" /> Ajouter permission
                  </Button>
                </TableCell>
              </TableRow>
              {expanded[policy.id] && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="pl-8">
                      <div className="font-semibold mb-2">Permissions</div>
                      {policy.permissions.length === 0 ? (
                        <span className="text-gray-400">Aucune permission</span>
                      ) : (
                        <ul className="space-y-1">
                          {groupPermissions(policy.permissions).map(group => (
                            <li
                              key={group.service + group.resource_name}
                              className="flex items-center gap-2"
                            >
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {group.service} / {group.resource_name}
                              </span>
                              <span className="flex gap-1">
                                {group.perms.map(perm => (
                                  <HoverCard key={perm.id}>
                                    <HoverCardTrigger asChild>
                                      <span className="inline-flex items-center">
                                        {getOperationIcon(perm.operation).icon}
                                      </span>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="text-xs">
                                      {getOperationIcon(perm.operation).label}
                                      {perm.description && (
                                        <div className="mt-1 text-gray-500">{perm.description}</div>
                                      )}
                                    </HoverCardContent>
                                  </HoverCard>
                                ))}
                              </span>
                              {/* Actions alignées à droite */}
                              <span className="ml-auto flex gap-2">
                                <button
                                  className="text-gray-500 hover:text-blue-600"
                                  title="Éditer les opérations"
                                  onClick={() => {
                                    // Ouvre la modale d'édition pour ce groupe avec filtre
                                    openPermissionDialog(
                                      { ...policy, permissions: group.perms },
                                      group.service,
                                      group.resource_name
                                    );
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  className="text-red-500"
                                  title="Supprimer toutes les permissions de ce groupe"
                                  onClick={() => {
                                    if (window.confirm("Supprimer toutes les permissions de ce groupe ?")) {
                                      Promise.all(
                                        group.perms.map(perm =>
                                          handleRemovePermission(policy.id, perm.id)
                                        )
                                      );
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
      {/* Dialog pour ajouter des permissions */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent
          style={{
            maxWidth: 700,
            minWidth: 500,
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
          }} aria-describedby={void 0} aria-label="add_permissions-dialog"
        >
          <DialogTitle>
            Ajouter des permissions à {selectedPolicy?.name}
          </DialogTitle>
          <div className="flex flex-col md:flex-row gap-6 mt-4 flex-1">
            <div className="flex-1 min-w-0">
              <div className="font-semibold mb-2">Permissions déjà associées</div>
              <div className="overflow-y-auto max-h-[30vh] pr-2">
                {selectedPolicy?.permissions.length === 0 ? (
                  <div className="text-gray-400">Aucune permission</div>
                ) : (
                  <ul className="space-y-1">
                    {groupPermissions(selectedPolicy?.permissions || []).map(group => (
                      <li key={group.service + group.resource_name} className="flex items-center gap-2">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {group.service} / {group.resource_name}
                        </span>
                        <span className="flex gap-1">
                          {group.perms.map(perm => (
                            <HoverCard key={perm.id}>
                              <HoverCardTrigger asChild>
                                <span className="inline-flex items-center">
                                  {getOperationIcon(perm.operation).icon}
                                </span>
                              </HoverCardTrigger>
                              <HoverCardContent className="text-xs">
                                {getOperationIcon(perm.operation).label}
                                {perm.description && (
                                  <div className="mt-1 text-gray-500">{perm.description}</div>
                                )}
                              </HoverCardContent>
                            </HoverCard>
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
              <div className="flex gap-2 mb-2">
                <select
                  className="border rounded px-2 py-1"
                  value={filterService}
                  onChange={e => setFilterService(e.target.value)}
                >
                  <option value="">Service</option>
                  {uniqueServices.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  className="border rounded px-2 py-1"
                  value={filterResource}
                  onChange={e => setFilterResource(e.target.value)}
                >
                  <option value="">Ressource</option>
                  {uniqueResources.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="overflow-y-auto max-h-[30vh] pr-2">
                {filteredAvailablePermissions.length === 0 ? (
                  <div className="text-gray-400">Aucune permission disponible</div>
                ) : (
                  <ul className="space-y-1">
                    {groupAvailablePermissions(filteredAvailablePermissions).map(group => (
                      <li key={group.service + group.resource_name} className="flex items-center gap-2">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {group.service} / {group.resource_name}
                        </span>
                        <span className="flex gap-1">
                          {group.perms.map(perm => (
                            <label key={perm.id} className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPermissionsToAdd.has(perm.id)}
                                onChange={() => handleSelectPermissionToAdd(perm.id)}
                              />
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <span className="inline-flex items-center">
                                    {getOperationIcon(perm.operation).icon}
                                  </span>
                                </HoverCardTrigger>
                                <HoverCardContent className="text-xs">
                                  {getOperationIcon(perm.operation).label}
                                  {perm.description && (
                                    <div className="mt-1 text-gray-500">{perm.description}</div>
                                  )}
                                </HoverCardContent>
                              </HoverCard>
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
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowPermissionDialog(false)}
            >
              Annuler
            </Button>
            <Button
              variant="default"
              disabled={selectedPermissionsToAdd.size === 0}
              onClick={handleAddPermissionsToPolicy}
            >
              Ajouter {selectedPermissionsToAdd.size > 0 ? `(${selectedPermissionsToAdd.size})` : ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </section>
  );
}

