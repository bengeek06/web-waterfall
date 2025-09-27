"use client";

import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";


// Types for Permission
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

export default function RolesAdminPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPermissions, setFormPermissions] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [permissionsRes, policiesRes] = await Promise.all([
          fetch("/api/guardian/permissions"),
          fetch("/api/guardian/policies"),
        ]);
        console.log("permissionsRes status:", permissionsRes.status);
        console.log("policiesRes status:", policiesRes.status);

        if (permissionsRes.status === 401 || policiesRes.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!permissionsRes.ok) {
          console.error("Erreur lors de la récupération des permissions.");
          throw new Error("Erreur lors de la récupération des permissions.");
        }

        if (!policiesRes.ok) {
          console.error("Erreur lors de la récupération des policies.");
          throw new Error("Erreur lors de la récupération des policies.");
        }

        // Vérification du content-type avant de parser en JSON
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
        console.log("permissionsData:", permissionsData);
        console.log("policiesData:", policiesData);

        // S'assurer que permissionsData est un tableau
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

        // S'assurer que policiesData est un tableau
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
        console.error("fetchData error:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Erreur inconnue.");
        }
      }
    }

    fetchData();
  }, []);

  function openCreatePolicyDialog() {
    setEditingPolicy(null);
    setFormName("");
    setFormDescription("");
    setFormPermissions("");
    setShowPolicyDialog(true);
  }

  function openEditPolicyDialog(policy: Policy) {
    setEditingPolicy(policy);
    setFormName(policy.name);
    setFormDescription(policy.description || "");
    setFormPermissions(
      policy.permissions?.map(p => p.id).join(",") || ""
    );
    setShowPolicyDialog(true);
  }

  async function handlePolicySubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: formName,
      description: formDescription,
      permissions: formPermissions.split(",").map(s => s.trim()).filter(Boolean),
    };
    try {
      let res;
      if (editingPolicy) {
        res = await fetch(`/api/guardian/policies/${editingPolicy.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/guardian/policies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error("Erreur lors de l'enregistrement");
      setShowPolicyDialog(false);
      // Refresh policies
      fetchData();
    } catch (err) {
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
      // Refresh policies
      fetchData();
    } catch (err) {
      setError("Erreur lors de la suppression de la policy");
    }
  }

  return (
    <div className="p-6 space-y-10">
      {/* Section 2: Policies */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Policies</h2>
          <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
            <DialogTrigger asChild>
              <Button onClick={openCreatePolicyDialog}>
                Ajouter une policy
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                <div>
                  <label className="block text-sm mb-1">Permissions (ids séparés par des virgules)</label>
                  <input className="border rounded px-2 py-1 w-full" value={formPermissions} onChange={e => setFormPermissions(e.target.value)} />
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
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Ressource</TableHead>
              <TableHead>Description permission</TableHead>
              <TableHead>Opération</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((policy) =>
              policy.permissions && policy.permissions.length > 0 ? (
                policy.permissions.map((perm, idx) => (
                  <TableRow key={perm.id}>
                    <TableCell>{idx === 0 ? policy.name : ""}</TableCell>
                    <TableCell>{idx === 0 ? (policy.description || <span className="text-gray-400">—</span>) : ""}</TableCell>
                    <TableCell>{perm.service}</TableCell>
                    <TableCell>{perm.resource_name}</TableCell>
                    <TableCell>{perm.description}</TableCell>
                    <TableCell>{perm.operation}</TableCell>
                    <TableCell>
                      {idx === 0 && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openEditPolicyDialog(policy)}>Éditer</Button>
                          <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDeletePolicy(policy.id)}>Supprimer</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow key={policy.id}>
                  <TableCell>{policy.name}</TableCell>
                  <TableCell>{policy.description || <span className="text-gray-400">—</span>}</TableCell>
                  <TableCell colSpan={4} className="text-gray-400 text-center">Aucune permission</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => openEditPolicyDialog(policy)}>Éditer</Button>
                    <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDeletePolicy(policy.id)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </section>
    </div>
  );
}