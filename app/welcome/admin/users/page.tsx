"use client";

import React, { useEffect, useState } from "react";
import { columns, User } from "./columns";
import { DataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type UserForm = Partial<User> & { password?: string };

const emptyUser: UserForm = {
  email: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  avatar_url: "",
  is_active: true,
  is_verified: false,
  password: "",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<UserForm>(emptyUser);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchUsers = React.useCallback(
    async () => {
      const res = await fetch("/api/identity/users");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    },
    []
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  function openCreateModal() {
    setEditingUser(null);
    setForm(emptyUser);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setForm(user);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingUser(null);
    setForm(emptyUser);
    setFormError(null);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.email) {
      setFormError("Email requis.");
      return;
    }

    const method = editingUser ? "PATCH" : "POST";
    const payload = { ...form };

    // Remove fields not accepted by the API
    delete (payload as Record<string, unknown>).id;
    delete (payload as Record<string, unknown>).created_at;
    delete (payload as Record<string, unknown>).updated_at;
    delete (payload as Record<string, unknown>).hashed_password;

    if (!editingUser && !payload.password) {
      setFormError("Mot de passe requis pour la création.");
      return;
    }
    if (editingUser) {
      delete payload.password;
    }

    // Define the URL based on create or edit
    const url = editingUser
      ? `/api/identity/users/${editingUser.id}`
      : "/api/identity/users";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error || data.message || "Erreur lors de l'enregistrement.");
      return;
    }
    closeModal();
    fetchUsers();
  }

  async function handleDeleteUser() {
    if (!deleteUserId) return;
    const res = await fetch(`/api/identity/users/${deleteUserId}`, { method: "DELETE" });
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    setDeleteUserId(null);
    fetchUsers();
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        <Button onClick={openCreateModal}>Créer un utilisateur</Button>
      </div>
      <DataTable
        columns={columns}
        data={users}
        actions={row => (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => openEditModal(row.original)}>Modifier</Button>
            <Button size="sm" variant="destructive" onClick={() => setDeleteUserId(row.original.id)}>Supprimer</Button>
          </div>
        )}
      />
      {/* Modal for create/edit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent aria-describedby={void 0} aria-label={`user-dialog-description`}>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Modifier l'utilisateur" : "Créer un utilisateur"}</DialogTitle>
          </DialogHeader>
          <DialogDescription id="user-dialog-description" className="sr-only">
            {editingUser
              ? "Formulaire pour modifier un utilisateur existant."
              : "Formulaire pour créer un nouvel utilisateur."}
          </DialogDescription>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <Input
              placeholder="Email"
              value={form.email || ""}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
            {!editingUser && (
              <Input
                placeholder="Mot de passe"
                type="password"
                value={form.password || ""}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            )}
            <Input
              placeholder="Prénom"
              value={form.first_name || ""}
              onChange={e => setForm({ ...form, first_name: e.target.value })}
            />
            <Input
              placeholder="Nom"
              value={form.last_name || ""}
              onChange={e => setForm({ ...form, last_name: e.target.value })}
            />
            <Input
              placeholder="Téléphone"
              value={form.phone_number || ""}
              onChange={e => setForm({ ...form, phone_number: e.target.value })}
            />
            <Input
              placeholder="Avatar URL"
              value={form.avatar_url || ""}
              onChange={e => setForm({ ...form, avatar_url: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={!!form.is_active}
                onCheckedChange={v => setForm({ ...form, is_active: v })}
              />
              <span>Actif</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={!!form.is_verified}
                onCheckedChange={v => setForm({ ...form, is_verified: v })}
              />
              <span>Vérifié</span>
            </div>
            {formError && <div className="text-red-500 text-sm">{formError}</div>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Annuler</Button>
              <Button type="submit" variant="default">{editingUser ? "Enregistrer" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete confirmation */}
      <Dialog open={!!deleteUserId} onOpenChange={v => !v && setDeleteUserId(null)}>
        <DialogContent aria-describedby={void 0} aria-label={`delete-dialog-description`}>
          <DialogHeader>
            <DialogTitle>Supprimer l&#39;utilisateur ?</DialogTitle>
          </DialogHeader>
          <DialogDescription id="delete-dialog-description" className="sr-only">
            Êtes-vous sûr de vouloir supprimer cet utilisateur ?
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

