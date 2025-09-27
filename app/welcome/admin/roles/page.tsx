"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
//import { Input } from "@/components/ui/input";
//import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

// Types for Permission, Policy, Role, etc.
type Permission = {
  id: string | number;
  service: string;
  resource: string;
  description: string;
  operations: string[];
};

type Policy = {
  id: string | number;
  name: string;
  permissions: Permission[];
};

type Role = {
  id: string | number;
  name: string;
  description: string;
  policies: Policy[];
};

export default function RolesAdminPage() {
  // States for permissions, policies, roles, dialogs, forms, etc.
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch permissions, policies, and roles data
  useEffect(() => {
    async function fetchData() {
      try {
        const [permissionsRes, policiesRes, rolesRes] = await Promise.all([
          fetch("/api/guardian/permission"),
          fetch("/api/guardian/policy"),
          fetch("/api/guardian/role"),
        ]);

        if (!permissionsRes.ok || !policiesRes.ok || !rolesRes.ok) {
          throw new Error("Erreur lors de la récupération des données.");
        }

        const [permissionsData, policiesData, rolesData] = await Promise.all([
          permissionsRes.json(),
          policiesRes.json(),
          rolesRes.json(),
        ]);

        setPermissions(permissionsData);
        setPolicies(policiesData);
        setRoles(rolesData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Erreur inconnue.");
        }
      }
    }

    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-10">
      {/* Section 1: Permissions */}
      <section>
        <h2 className="text-xl font-bold mb-2">Permissions</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Ressource</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Opérations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={permission.id}>
                <TableCell>{permission.service}</TableCell>
                <TableCell>{permission.resource}</TableCell>
                <TableCell>{permission.description}</TableCell>
                <TableCell>{permission.operations.join(", ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Section 2: Policies */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Policies</h2>
          <Button /* onClick={openCreatePolicyDialog} */>Créer une policy</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Permissions associées</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy.id}>
                <TableCell>{policy.name}</TableCell>
                <TableCell>
                  {policy.permissions.map((perm) => (
                    <div key={perm.id}>{perm.name}</div>
                  ))}
                </TableCell>
                <TableCell>
                  {/* Boutons pour modifier/supprimer une policy */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Dialog pour créer/éditer une policy et affecter des permissions */}
      </section>

      {/* Section 3: Rôles */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Rôles</h2>
          <Button /* onClick={openCreateRoleDialog} */>Créer un rôle</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Policies associées</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  {role.policies.map((policy) => (
                    <div key={policy.id}>{policy.name}</div>
                  ))}
                </TableCell>
                <TableCell>
                  {/* Boutons pour modifier/supprimer un rôle */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Dialog pour créer/éditer un rôle et associer des policies */}
      </section>
    </div>
  );
}