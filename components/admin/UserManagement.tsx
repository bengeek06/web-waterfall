"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// Components
import { UserDataTable, type User } from "./UserDataTable";
import { UserFormModal } from "./UserFormModal";
import { UserDeleteDialog } from "./UserDeleteDialog";
import { Button } from "@/components/ui/button";

// Constants
import { IDENTITY_ROUTES } from "@/lib/api-routes";
import { GUARDIAN_ROUTES } from "@/lib/api-routes/guardian";
import { ADMIN_TEST_IDS, testId } from "@/lib/test-ids";

// Utils
import { clientSessionFetch } from "@/lib/sessionFetch.client";

// ==================== TYPES ====================
type UserManagementProps = {
  dictionary: {
    page_title: string;
    create_button: string;
    no_users: string;
    columns: {
      email: string;
      first_name: string;
      last_name: string;
      phone_number: string;
      language: string;
      roles: string;
      positions: string;
      is_active: string;
      is_verified: string;
      last_login_at: string;
      created_at: string;
      actions: string;
    };
    boolean: {
      yes: string;
      no: string;
    };
    actions: {
      edit: string;
      delete: string;
    };
    modal: {
      create_title: string;
      edit_title: string;
      create_description: string;
      edit_description: string;
    };
    form: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      phone_number: string;
      avatar_url: string;
      language: string;
      roles: string;
      positions: string;
      is_active: string;
      is_verified: string;
      cancel: string;
      save: string;
      create: string;
    };
    delete_modal: {
      title: string;
      description: string;
      cancel: string;
      confirm: string;
    };
    errors: {
      email_required: string;
      password_required: string;
      save_failed: string;
    };
  };
};

// ==================== COMPONENT ====================
export function UserManagement({ dictionary }: UserManagementProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    const res = await clientSessionFetch(IDENTITY_ROUTES.users);
    
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    
    if (res.ok) {
      const usersData = await res.json();
      
      // Fetch user roles and position for each user
      const usersWithRolesAndPosition = await Promise.all(
        usersData.map(async (user: User) => {
          try {
            // Fetch roles
            const userRolesRes = await clientSessionFetch(GUARDIAN_ROUTES.userRoles);
            let roles: Array<{ id: string; name: string }> = [];
            if (userRolesRes.ok) {
              const allUserRoles = await userRolesRes.json();
              const userRoles = Array.isArray(allUserRoles)
                ? allUserRoles.filter((ur: { user_id: string }) => ur.user_id === user.id)
                : [];
              
              // Fetch role details
              const rolesRes = await clientSessionFetch(GUARDIAN_ROUTES.roles);
              if (rolesRes.ok) {
                const allRoles = await rolesRes.json();
                roles = userRoles
                  .map((ur: { role_id: string }) => {
                    const role = allRoles.find((r: { id: string }) => r.id.toString() === ur.role_id.toString());
                    return role ? { id: role.id, name: role.name } : null;
                  })
                  .filter((r): r is { id: string; name: string } => r !== null);
              }
            }
            
            // Fetch position details if user has a position_id
            let position: { id: string; title: string } | undefined = undefined;
            if (user.position_id) {
              try {
                const positionRes = await clientSessionFetch(IDENTITY_ROUTES.position(user.position_id));
                if (positionRes.ok) {
                  const positionData = await positionRes.json();
                  position = { id: positionData.id, title: positionData.title };
                }
              } catch (error) {
                console.error(`Error fetching position for user ${user.id}:`, error);
              }
            }
            
            return { ...user, roles, position };
          } catch (error) {
            console.error(`Error fetching roles/position for user ${user.id}:`, error);
            return { ...user, roles: [], position: undefined };
          }
        })
      );
      
      setUsers(usersWithRolesAndPosition);
    }
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateClick = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (userId: string) => {
    setDeletingUserId(userId);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const handleFormSuccess = () => {
    fetchUsers();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUserId) return;

    setIsDeleting(true);

    const res = await clientSessionFetch(IDENTITY_ROUTES.user(deletingUserId), {
      method: "DELETE",
    });

    if (res.status === 401) {
      router.push("/login");
      return;
    }

    setIsDeleting(false);
    setDeletingUserId(null);
    fetchUsers();
  };

  const handleDeleteCancel = () => {
    setDeletingUserId(null);
  };

  return (
    <div className="p-6" {...testId(ADMIN_TEST_IDS.users.page)}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold" {...testId(ADMIN_TEST_IDS.users.title)}>
          {dictionary.page_title}
        </h1>
        <Button onClick={handleCreateClick} {...testId(ADMIN_TEST_IDS.users.createButton)}>
          {dictionary.create_button}
        </Button>
      </div>

      {/* User Table */}
      <UserDataTable
        users={users}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        dictionary={{
          columns: dictionary.columns,
          boolean: dictionary.boolean,
          actions: dictionary.actions,
          no_users: dictionary.no_users,
        }}
      />

      {/* Form Modal */}
      <UserFormModal
        user={editingUser}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        dictionary={{
          modal: dictionary.modal,
          form: dictionary.form,
          errors: dictionary.errors,
        }}
      />

      {/* Delete Dialog */}
      <UserDeleteDialog
        isOpen={!!deletingUserId}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        dictionary={dictionary.delete_modal}
      />
    </div>
  );
}
