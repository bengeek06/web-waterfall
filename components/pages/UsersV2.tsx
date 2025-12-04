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
 * Users Management Component (V2 - Using GenericAssociationTable)
 * 
 * Migrated from UserManagement to use GenericAssociationTable.
 * 
 * Features:
 * - List all users with expandable role associations
 * - Create/Edit/Delete users
 * - Assign/Remove roles to/from users (M2M cross-service: identity -> guardian)
 * - Position selection (N-1 FK to positions)
 * - Import/Export with basic-io
 * - Full test coverage with data-testid attributes
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";
import { ColumnDef } from "@tanstack/react-table";
import { Shield, Edit, Trash2, PlusSquare, ChevronDown } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ColumnHeader } from "@/components/shared/tables";
import type { ColumnConfig } from "@/components/shared/tables";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GenericAssociationTable } from "@/components/shared/GenericAssociationTable";
import type { ColumnHandlers, AssociationTableDictionary } from "@/components/shared/GenericAssociationTable";
import { userFormSchema, type UserFormData } from "@/lib/validation/identity.schemas";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { IDENTITY_ROUTES } from "@/lib/api-routes";
import { GUARDIAN_ROUTES } from "@/lib/api-routes/guardian";
import { ADMIN_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES, COLOR_CLASSES } from "@/lib/design-tokens";

// ==================== TYPE DEFINITIONS ====================

type Role = {
  id: string | number;
  name: string;
  description?: string;
};

type Position = {
  id: string;
  title: string;
  description?: string;
};

type User = {
  id: string | number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  language?: "en" | "fr";
  is_active: boolean;
  is_verified: boolean;
  has_avatar?: boolean;
  position_id?: string;
  position?: Position;
  roles?: Role[];
  last_login_at?: string;
  created_at?: string;
};

type UsersDictionary = {
  page_title: string;
  create_button: string;
  import_button: string;
  export_button: string;
  import_json: string;
  import_csv: string;
  export_json: string;
  export_csv: string;
  error_export: string;
  error_import: string;
  import_report_title: string;
  import_report_total: string;
  import_report_success: string;
  import_report_failed: string;
  import_report_errors: string;
  import_report_warnings: string;
  import_report_close: string;
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
    has_avatar: string;
    avatar_file_id: string;
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
    network: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    serverError: string;
    clientError: string;
    unknown: string;
  };
  // Component-specific errors remain in dictionary
  email_required?: string;
  password_required?: string;
  save_failed?: string;
  unknown_field?: string;
  validation_error?: string;
  field_required?: string;
  invalid_format?: string;
  roles_fetch_failed?: string;
  positions_fetch_failed?: string;
};

// ==================== COLUMN CONFIGS ====================

const createColumnConfigs = (dictionary: UsersDictionary): Record<string, ColumnConfig<User>> => ({
  email: {
    key: "email" as keyof User,
    header: dictionary.columns.email,
    sortable: true,
    filterable: true,
    filterType: "text",
    filterPlaceholder: "Filtrer par email...",
  },
  first_name: {
    key: "first_name" as keyof User,
    header: dictionary.columns.first_name,
    sortable: true,
    filterable: true,
    filterType: "text",
    filterPlaceholder: "Filtrer par prénom...",
  },
  last_name: {
    key: "last_name" as keyof User,
    header: dictionary.columns.last_name,
    sortable: true,
    filterable: true,
    filterType: "text",
    filterPlaceholder: "Filtrer par nom...",
  },
});

// ==================== COLUMN FACTORY ====================

function createUsersColumns(
  dictionary: UsersDictionary,
  handlers: ColumnHandlers<User>,
  availableRoles: Role[] = []
): ColumnDef<User>[] {
  const configs = createColumnConfigs(dictionary);
  
  return [
    // Avatar column
    {
      id: "avatar",
      header: "Avatar",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => {
        const user = row.original;
        // Harmonized logic: check has_avatar and id
        const avatarUrl = user.has_avatar && user.id
          ? `/api/identity/users/${user.id}/avatar`
          : undefined;
        return (
          <div className="flex justify-center items-center">
            <Avatar className="size-8">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={user.email} />
              ) : (
                <AvatarFallback>{user.first_name?.[0] || user.email[0]}</AvatarFallback>
              )}
            </Avatar>
          </div>
        );
      },
    },
    // Email column with sorting and filtering
    {
      accessorKey: "email",
      enableColumnFilter: true,
      filterFn: "includesString",
      header: ({ column }) => (
        <ColumnHeader<User>
          config={configs.email}
          tanstackColumn={column}
          filterValue={column.getFilterValue() as string}
          onFilterChange={(v) => column.setFilterValue(v)}
          testIdPrefix="users"
        />
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.email}</span>,
    },
    // First Name with sorting and filtering
    {
      accessorKey: "first_name",
      enableColumnFilter: true,
      filterFn: "includesString",
      header: ({ column }) => (
        <ColumnHeader<User>
          config={configs.first_name}
          tanstackColumn={column}
          filterValue={column.getFilterValue() as string}
          onFilterChange={(v) => column.setFilterValue(v)}
          testIdPrefix="users"
        />
      ),
      cell: ({ row }) => row.original.first_name || "-",
    },
    // Last Name with sorting and filtering
    {
      accessorKey: "last_name",
      enableColumnFilter: true,
      filterFn: "includesString",
      header: ({ column }) => (
        <ColumnHeader<User>
          config={configs.last_name}
          tanstackColumn={column}
          filterValue={column.getFilterValue() as string}
          onFilterChange={(v) => column.setFilterValue(v)}
          testIdPrefix="users"
        />
      ),
      cell: ({ row }) => row.original.last_name || "-",
    },
    // Roles column with multi-select filter
    {
      accessorKey: "roles",
      enableSorting: false,
      enableColumnFilter: true,
      filterFn: (row, _columnId, filterValue: string[]) => {
        if (!filterValue || filterValue.length === 0) return true;
        const userRoles = row.original.roles || [];
        // UserRoles are junction objects: { id: junction_id, user_id, role_id, role: { id, name } }
        // We need to compare with role_id or role.id, not the junction id
        return userRoles.some(userRole => {
          const roleId = (userRole as { role_id?: string | number; role?: { id: string | number } }).role_id 
            ?? (userRole as { role?: { id: string | number } }).role?.id;
          return filterValue.includes(String(roleId));
        });
      },
      header: ({ column }) => (
        <ColumnHeader<User>
          config={{
            key: "roles",
            header: dictionary.columns.roles,
            sortable: false,
            filterable: true,
            filterType: "multi-select",
            filterOptions: availableRoles.map((role) => ({
              value: String(role.id),
              label: role.name,
            })),
          }}
          tanstackColumn={column}
          filterValue={column.getFilterValue()}
          onFilterChange={(value) => column.setFilterValue(value)}
        />
      ),
      cell: ({ row }) => `${row.original.roles?.length || 0} rôle(s)`,
    },
    // Position
    {
      accessorKey: "position",
      enableSorting: false,
      enableColumnFilter: false,
      header: dictionary.columns.positions,
      cell: ({ row }) => row.original.position?.title || "-",
    },
    // Is Active - Inline toggle
    {
      accessorKey: "is_active",
      enableSorting: true,
      enableColumnFilter: false,
      header: dictionary.columns.is_active,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Switch
            checked={user.is_active}
            onCheckedChange={(checked) => {
              handlers.onPatch?.(user.id, { is_active: checked });
            }}
            disabled={!handlers.onPatch}
            {...testId(ADMIN_TEST_IDS.users.isActiveToggle(user.id.toString()))}
          />
        );
      },
    },
    // Actions
    {
      id: "actions",
      enableSorting: false,
      enableColumnFilter: false,
      header: () => <span className="text-right block">{dictionary.columns.actions}</span>,
      cell: ({ row }) => (
        <TooltipProvider>
          <div className="flex items-center justify-end gap-1">
            {/* Add Role Button */}
            {handlers.onAddAssociation && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${ICON_SIZES.xl}`}
                    onClick={() => handlers.onAddAssociation?.(row.original, "roles")}
                    {...testId(ADMIN_TEST_IDS.users.editButton(row.original.id.toString()) + "-add-role")}
                  >
                    <PlusSquare className={ICON_SIZES.sm} />
                    <span className="sr-only">Ajouter un rôle</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ajouter un rôle</TooltipContent>
              </Tooltip>
            )}
            {/* Edit Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`${ICON_SIZES.xl}`}
                  onClick={() => handlers.onEdit(row.original)}
                  {...testId(ADMIN_TEST_IDS.users.editButton(row.original.id.toString()))}
                >
                  <Edit className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.update}`} />
                  <span className="sr-only">{dictionary.actions.edit}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{dictionary.actions.edit}</TooltipContent>
            </Tooltip>
            {/* Delete Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`${ICON_SIZES.xl} text-destructive hover:text-destructive hover:bg-destructive/10`}
                  onClick={() => handlers.onDelete(row.original.id)}
                  {...testId(ADMIN_TEST_IDS.users.deleteButton(row.original.id.toString()))}
                >
                  <Trash2 className={ICON_SIZES.sm} />
                  <span className="sr-only">{dictionary.actions.delete}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{dictionary.actions.delete}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      ),
    },
  ];
}

// ==================== ASSOCIATION CONFIG ====================

const rolesAssociation = {
  type: "many-to-many" as const,
  name: "roles",
  label: "Rôles",
  service: "guardian",       // Use Guardian service for user-roles endpoint
  itemsService: "guardian",  // Fetch available roles from guardian: /roles
  path: "/roles",
  junctionEndpoint: "/user-roles",  // Guardian endpoint (not Identity)
  junctionQueryParam: "user_id",    // Use query param: /user-roles?user_id={id}
  // Guardian returns enriched UserRole objects with nested role details:
  // { id: junction_id, user_id, role_id, role: { id, name, description } }
  displayField: "role.name",
  secondaryField: "role.description",
  icon: Shield,
  addBodyField: "role_id",
  // Use junction ID for deletion (the "id" field, not "role_id")
  deleteIdField: "id",
};

// ==================== COMPONENT ====================

export default function UsersV2({ dictionary }: { readonly dictionary: UsersDictionary }) {
  const { handleError } = useErrorHandler({ messages: dictionary.errors });
  
  // ==================== POSITIONS STATE ====================
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);
  
  // Track selected position for form (since it's not in the schema)
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");

  // ==================== ROLES STATE (for form multi-select) ====================
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);



  // Fetch positions on mount
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await fetchWithAuth(IDENTITY_ROUTES.positions);
        if (res.ok) {
          const data = await res.json();
          setPositions(Array.isArray(data) ? data : (data.data || []));
        }
      } catch (error) {
        handleError(error);
      } finally {
        setIsLoadingPositions(false);
      }
    };
    fetchPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetchWithAuth(GUARDIAN_ROUTES.roles);
        if (res.ok) {
          const data = await res.json();
          setAvailableRoles(Array.isArray(data) ? data : (data.data || []));
        }
      } catch (error) {
        handleError(error);
      } finally {
        setIsLoadingRoles(false);
      }
    };
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==================== DICTIONARY MAPPING ====================
  const tableDictionary: AssociationTableDictionary = useMemo(() => ({
    create: dictionary.create_button,
    filter_placeholder: "Filter users...",
    no_results: dictionary.no_users,
    loading: "Loading...",
    export: dictionary.export_button,
    import: dictionary.import_button,
    delete_selected: dictionary.delete_modal.confirm,
    showing_results: "Showing {from} to {to} of {total} result(s)",
    rows_per_page: "Rows per page",
    previous: "Previous",
    next: "Next",
    modal_create_title: dictionary.modal.create_title,
    modal_edit_title: dictionary.modal.edit_title,
    delete_confirm_title: dictionary.delete_modal.title,
    delete_confirm_message: dictionary.delete_modal.description,
    cancel: dictionary.form.cancel,
    save: dictionary.form.save,
    delete: dictionary.delete_modal.confirm,
    // Association dialog
    association_dialog_title: "Add roles to {name}",
    associated_items: "Associated roles",
    available_items: "Available roles",
    no_available_items: "No roles available",
    add_selected: "Add selected",
    search_placeholder: "Search roles...",
    // Import report
    import_report_title: dictionary.import_report_title,
    import_report_total: dictionary.import_report_total,
    import_report_success: dictionary.import_report_success,
    import_report_failed: dictionary.import_report_failed,
    import_report_errors: dictionary.import_report_errors,
    import_report_warnings: dictionary.import_report_warnings,
    import_report_close: dictionary.import_report_close,
    errors: {
      fetch: dictionary.save_failed,
      create: dictionary.save_failed,
      update: dictionary.save_failed,
      delete: dictionary.save_failed,
    },
  }), [dictionary]);

  // ==================== FORM TRANSFORM ====================
  
  // Transform User to form data (for editing)
  const transformItemToForm = useCallback((user: User): UserFormData => {
    // Set the position for the select
    setSelectedPositionId(user.position_id || "");
    // Set selected roles from user's current roles
    setSelectedRoleIds((user.roles || []).map(r => String(r.id)));

    return {
      email: user.email,
      password: "", // Password not shown for edit
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone_number: user.phone_number || "",
      language: user.language || "fr",
      is_active: user.is_active,
      is_verified: user.is_verified,
      has_avatar: false,
    };
  }, []);

  // Helper: Get label for roles dropdown
  const getRolesDropdownLabel = useCallback(() => {
    if (isLoadingRoles) return "Chargement...";
    if (selectedRoleIds.length > 0) return `${selectedRoleIds.length} rôle(s) sélectionné(s)`;
    return "-- Sélectionner des rôles --";
  }, [isLoadingRoles, selectedRoleIds.length]);

  // Helper: Toggle role selection
  const handleRoleToggle = useCallback((roleId: string) => {
    setSelectedRoleIds((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      }
      return [...prev, roleId];
    });
  }, []);



  // Transform form data to API payload (add position_id)
  const transformFormData = (data: UserFormData): Partial<User> => {
    const payload: Partial<User> = {
      email: data.email,
      first_name: data.first_name || undefined,
      last_name: data.last_name || undefined,
      phone_number: data.phone_number || undefined,
      language: data.language,
      is_active: data.is_active,
    };
    
    // Add position_id if selected
    if (selectedPositionId) {
      payload.position_id = selectedPositionId;
    }
    
    // Add password only for creation (when it's provided)
    if (data.password) {
      (payload as Record<string, unknown>).password = data.password;
    }
    
    return payload;
  };

  // Helper: Add a role to a user (ignore 409 Conflict if role already assigned)
  const addRoleToUser = useCallback(async (userId: string, roleId: string): Promise<void> => {
    try {
      const response = await fetchWithAuth(
        GUARDIAN_ROUTES.userRoles,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, role_id: roleId }),
        }
      );
      // Ignore 409 Conflict - role already assigned
      if (!response.ok && response.status !== 409) {
        handleError(new Error(`Error adding role ${roleId} to user ${userId}: ${response.status}`));
      }
    } catch (error) {
      handleError(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: Fetch current role IDs for a user
  const fetchUserRoleIds = useCallback(async (userId: string): Promise<string[]> => {
    try {
      const rolesRes = await fetchWithAuth(`${GUARDIAN_ROUTES.userRoles}?user_id=${userId}`);
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        const roles = Array.isArray(rolesData) ? rolesData : (rolesData.roles || []);
        // Guardian returns { id: junction_id, user_id, role_id }
        return roles.map((r: { role_id?: string; id?: string }) => String(r.role_id));
      }
    } catch (error) {
      handleError(error);
    }
    return [];
    // handleError is stable from useErrorHandler
  }, [handleError]);

  // Helper: Remove roles from a user using junction IDs
  const removeRolesFromUser = useCallback(async (userId: string, roleIdsToRemove: string[]): Promise<void> => {
    if (roleIdsToRemove.length === 0) return;
    
    try {
      const rolesRes = await fetchWithAuth(`${GUARDIAN_ROUTES.userRoles}?user_id=${userId}`);
      if (!rolesRes.ok) return;
      
      const rolesData = await rolesRes.json();
      const roles = Array.isArray(rolesData) ? rolesData : (rolesData.roles || []);
      
      for (const roleIdToRemove of roleIdsToRemove) {
        // Find the junction entry for this role
        const junctionEntry = roles.find((r: { role_id?: string; id?: string }) => 
          String(r.role_id) === roleIdToRemove
        );
        
        if (junctionEntry) {
          const junctionId = junctionEntry.id;
          try {
            await fetchWithAuth(
              GUARDIAN_ROUTES.userRole(junctionId),
              { method: "DELETE" }
            );
          } catch (error) {
            handleError(error);
          }
        }
      }
    } catch (error) {
      handleError(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle role assignment and avatar upload after user save
  const handleAfterSave = useCallback(async (savedUser: User, isNew: boolean) => {
    const userId = String(savedUser.id);
    
    // For new users, just add the selected roles
    if (isNew) {
      await Promise.all(selectedRoleIds.map(roleId => addRoleToUser(userId, roleId)));
    } else {
      // For existing users, compute diff and apply changes
      const currentRoleIds = await fetchUserRoleIds(userId);
      
      // Roles to add (selected but not currently assigned)
      const rolesToAdd = selectedRoleIds.filter(id => !currentRoleIds.includes(id));
      
      // Roles to remove (currently assigned but not selected)
      const rolesToRemove = currentRoleIds.filter(id => !selectedRoleIds.includes(id));
      
      // Add new roles
      await Promise.all(rolesToAdd.map(roleId => addRoleToUser(userId, roleId)));
      
      // Remove roles
      await removeRolesFromUser(userId, rolesToRemove);
    }
    
    // Reset position and roles after save
    setSelectedPositionId("");
    setSelectedRoleIds([]);
  }, [selectedRoleIds, addRoleToUser, fetchUserRoleIds, removeRolesFromUser]);

  // Helper: Enrich users with position data
  const enrichUsersWithPositions = useCallback(async (users: User[]): Promise<User[]> => {
    if (!users || users.length === 0) {
      return users;
    }
    
    // If positions not loaded yet, return users as-is
    if (positions.length === 0) {
      return users;
    }
    
    return users.map(user => {
      if (user.position_id && !user.position) {
        const position = positions.find(p => p.id === user.position_id);
        return { ...user, position };
      }
      return user;
    });
  }, [positions]);

  // ==================== RENDER ====================
  return (
    <GenericAssociationTable<User, UserFormData>
      service="identity"
      path="/users"
      entityName="users"
      pageTitle={dictionary.page_title}
      dictionary={tableDictionary}
      columns={(handlers) => createUsersColumns(dictionary, handlers, availableRoles)}
      schema={userFormSchema}
      expandable={false}
      defaultFormValues={{
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone_number: "",
        language: "fr",
        is_active: true,
        is_verified: false,
        has_avatar: false,
      }}
      transformItemToForm={transformItemToForm}
      transformFormData={transformFormData}
      onAfterSave={handleAfterSave}
      onDataEnrich={enrichUsersWithPositions}
      associations={[rolesAssociation]}
      enableImportExport={true}
      enableRowSelection={true}
      testIdPrefix="users"
      renderFormFields={(form, _dict, editingItem) => {
        const isEditing = !!editingItem;
        
        return (
          <>
            {/* Email */}
            <div>
              <Label htmlFor="email">{dictionary.form.email} *</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                {...testId(ADMIN_TEST_IDS.users.emailInput)}
              />
              {form.formState.errors.email && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password (only for create) */}
            {!isEditing && (
              <div>
                <Label htmlFor="password">{dictionary.form.password} *</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  {...testId(ADMIN_TEST_IDS.users.passwordInput)}
                />
                {form.formState.errors.password && (
                  <p className="text-destructive text-sm mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
            )}

            {/* First Name */}
            <div>
              <Label htmlFor="first_name">{dictionary.form.first_name}</Label>
              <Input
                id="first_name"
                {...form.register("first_name")}
                {...testId(ADMIN_TEST_IDS.users.firstNameInput)}
              />
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="last_name">{dictionary.form.last_name}</Label>
              <Input
                id="last_name"
                {...form.register("last_name")}
                {...testId(ADMIN_TEST_IDS.users.lastNameInput)}
              />
            </div>

            {/* Phone Number */}
            <div>
              <Label htmlFor="phone_number">{dictionary.form.phone_number}</Label>
              <Input
                id="phone_number"
                {...form.register("phone_number")}
                {...testId(ADMIN_TEST_IDS.users.phoneInput)}
              />
            </div>

            {/* Language */}
            <div>
              <Label htmlFor="language">{dictionary.form.language}</Label>
              <select
                id="language"
                {...form.register("language")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...testId(ADMIN_TEST_IDS.users.languageSelect)}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Position (N-1 relationship via FK) */}
            <div>
              <Label htmlFor="position_id">{dictionary.form.positions}</Label>
              <select
                id="position_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedPositionId}
                onChange={(e) => setSelectedPositionId(e.target.value)}
              >
                <option value="">-- Sélectionner une position --</option>
                {isLoadingPositions ? (
                  <option disabled>Chargement...</option>
                ) : (
                  positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Roles (M2M - multi-select dropdown) */}
            <div>
              <Label>{dictionary.form.roles}</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    {...testId(ADMIN_TEST_IDS.users.rolesDropdown)}
                  >
                    {getRolesDropdownLabel()}
                    <ChevronDown className={`ml-2 ${ICON_SIZES.sm}`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full min-w-[200px]">
                  {availableRoles.map((role) => (
                    <DropdownMenuCheckboxItem
                      key={role.id}
                      checked={selectedRoleIds.includes(String(role.id))}
                      onCheckedChange={() => handleRoleToggle(String(role.id))}
                    >
                      {role.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Is Active - Only show when creating */}
            {!isEditing && (
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={form.watch("is_active")}
                  onCheckedChange={(checked) => form.setValue("is_active", checked)}
                  {...testId(ADMIN_TEST_IDS.users.isActiveSwitch)}
                />
                <Label htmlFor="is_active">{dictionary.form.is_active}</Label>
              </div>
            )}
          </>
        );
      }}
    />
  );
}
