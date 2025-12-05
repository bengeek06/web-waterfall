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
import { useRouter } from "next/navigation";

// Components
import UserDataTable, { type User } from "./UserDataTable";
import { UserFormModal } from "./UserFormModal";
import { UserDeleteDialog } from "./UserDeleteDialog";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Constants
import { IDENTITY_ROUTES } from "@/lib/api-routes";
import { GUARDIAN_ROUTES } from "@/lib/api-routes/guardian";
import { BASIC_IO_ROUTES } from "@/lib/api-routes/basic_io";
import { ADMIN_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES } from "@/lib/design-tokens";

// Utils
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import logger from '@/lib/utils/logger';

// ==================== TYPES ====================
type UserManagementProps = {
  dictionary: {
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
      email_required: string;
      password_required: string;
      save_failed: string;
    };
  };
};

// ==================== COMPONENT ====================
export function UserManagement({ dictionary }: Readonly<UserManagementProps>) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Import/Export state
  const [isImportReportOpen, setIsImportReportOpen] = useState(false);
  const [importReport, setImportReport] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: string[];
    warnings: string[];
  }>({ total: 0, success: 0, failed: 0, errors: [], warnings: [] });

  // Function to fetch users (can be called multiple times)
  const fetchUsers = async () => {
    const res = await fetchWithAuth(IDENTITY_ROUTES.users);
    
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    
    if (res.ok) {
      const data = await res.json();
      
      // Le backend retourne {data: [...], pagination: {...}}
      const usersData = Array.isArray(data) ? data : (data.data || data.users || []);
      
      logger.debug({ raw: data, normalized: usersData }, '📊 Users data');
      
      // Fetch user roles and position for each user
      const usersWithRolesAndPosition = await Promise.all(
        usersData.map(async (user: User) => {
          try {
            // Fetch roles
            const userRolesRes = await fetchWithAuth(GUARDIAN_ROUTES.userRoles);
            let roles: Array<{ id: string; name: string }> = [];
            if (userRolesRes.ok) {
              const allUserRolesData = await userRolesRes.json();
              // Le backend peut retourner soit un tableau, soit {user_roles: [...]}
              const allUserRoles = Array.isArray(allUserRolesData) 
                ? allUserRolesData 
                : (allUserRolesData.user_roles || []);
              
              const userRoles = allUserRoles.filter(
                (ur: { user_id: string }) => ur.user_id === user.id
              );
              
              // Fetch role details
              const rolesRes = await fetchWithAuth(GUARDIAN_ROUTES.roles);
              if (rolesRes.ok) {
                const allRolesData = await rolesRes.json();
                // Le backend peut retourner soit un tableau, soit {roles: [...]}
                const allRoles = Array.isArray(allRolesData)
                  ? allRolesData
                  : (allRolesData.roles || []);
                
                logger.debug({ raw: allRolesData, normalized: allRoles }, '📊 Roles data');
                
                roles = userRoles
                  .map((ur: { role_id: string }) => {
                    const role = allRoles.find((r: { id: string }) => r.id.toString() === ur.role_id.toString());
                    return role ? { id: role.id, name: role.name } : null;
                  })
                  .filter((r: { id: string; name: string } | null): r is { id: string; name: string } => r !== null);
              } else if (rolesRes.status === 404) {
                logger.warn('⚠️ Guardian /roles endpoint not found (404) - roles will be empty');
              }
            }
            
            // Fetch position details if user has a position_id
            let position: { id: string; title: string } | undefined = undefined;
            if (user.position_id) {
              try {
                const positionRes = await fetchWithAuth(IDENTITY_ROUTES.position(user.position_id));
                if (positionRes.ok) {
                  const positionData = await positionRes.json();
                  position = { id: positionData.id, title: positionData.title };
                }
              } catch (error) {
                logger.error({ error, userId: user.id }, `Error fetching position for user`);
              }
            }
            
            return { ...user, roles, position };
          } catch (error) {
            logger.error({ error, userId: user.id }, `Error fetching roles/position for user`);
            return { ...user, roles: [], position: undefined };
          }
        })
      );
      
      setUsers(usersWithRolesAndPosition);
    }
  };

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const res = await fetchWithAuth(IDENTITY_ROUTES.user(deletingUserId), {
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

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    const res = await fetchWithAuth(IDENTITY_ROUTES.user(userId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: isActive }),
    });

    if (res.status === 401) {
      router.push("/login");
      return;
    }

    if (res.ok) {
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, is_active: isActive } : user
        )
      );
    }
  };

  // ==================== IMPORT/EXPORT HANDLERS ====================
  
  async function handleExport(type: 'json' | 'csv') {
    try {
      // Use basic-io to get users with position resolved (enrich=true)
      const format = type === 'json' ? 'json' : 'csv';
      const exportUrl = new URL(BASIC_IO_ROUTES.export, globalThis.location.origin);
      exportUrl.searchParams.set('service', 'identity');
      exportUrl.searchParams.set('path', '/users');
      exportUrl.searchParams.set('type', format);
      exportUrl.searchParams.set('enrich', 'true');
      
      const res = await fetchWithAuth(exportUrl.toString());

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Export failed: ${errorText}`);
      }

      // Get the enriched data from basic-io
      const enrichedData = await res.json();
      
      // Add roles from current state (Guardian service, not resolvable by basic-io)
      const usersWithRoles = Array.isArray(enrichedData) ? enrichedData.map((user: { id: string }) => {
        const userWithRoles = users.find(u => u.id === user.id);
        return {
          ...user,
          roles: userWithRoles?.roles?.map(r => ({
            id: r.id,
            name: r.name,
          })) || [],
        };
      }) : enrichedData;

      let content: string;
      let filename: string;
      let mimeType: string;

      if (type === 'json') {
        content = JSON.stringify(usersWithRoles, null, 2);
        filename = `users_export_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // Convert back to CSV with roles added
        const headers = Object.keys(usersWithRoles[0] || {}).filter(k => k !== 'roles').concat(['role_ids']);
        const rows = usersWithRoles.map((user: { roles?: Array<{ id: string }>, [key: string]: unknown }) => {
          const row = headers.map(h => {
            if (h === 'role_ids') {
              return user.roles?.map(r => r.id).join(';') || '';
            }
            const value = user[h];
            return value !== null && value !== undefined ? String(value) : '';
          });
          return row.join(',');
        });
        content = [headers.join(','), ...rows].join('\n');
        filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
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
      logger.error({ err }, 'Export error');
      toast.error(dictionary.error_export);
    }
  }

  async function handleImport(type: 'json' | 'csv') {
    const input = globalThis.document.createElement('input');
    input.type = 'file';
    input.accept = type === 'json' ? '.json' : '.csv';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const fileContent = await file.text();
        
        let usersToImport: Array<{
          email: string;
          first_name?: string;
          last_name?: string;
          phone_number?: string;
          language?: string;
          is_active?: boolean;
          is_verified?: boolean;
          roles: Array<{ id: string | number }> | string[];
        }> = [];

        if (type === 'json') {
          const parsed = JSON.parse(fileContent);
          usersToImport = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          // Parse CSV
          const lines = fileContent.split('\n').filter(l => l.trim());
          if (lines.length < 2) throw new Error('Empty CSV file');
          
          const headers = lines[0].split(',');
          const emailIdx = headers.indexOf('email');
          const firstNameIdx = headers.indexOf('first_name');
          const lastNameIdx = headers.indexOf('last_name');
          const phoneIdx = headers.indexOf('phone_number');
          const langIdx = headers.indexOf('language');
          const activeIdx = headers.indexOf('is_active');
          const verifiedIdx = headers.indexOf('is_verified');
          const roleIdsIdx = headers.indexOf('role_ids');
          
          if (emailIdx === -1) throw new Error('CSV must have "email" column');
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const roleIdsStr = roleIdsIdx >= 0 ? values[roleIdsIdx] : '';
            const roleIds = roleIdsStr ? roleIdsStr.split(';').filter(id => id.trim()) : [];
            
            usersToImport.push({
              email: values[emailIdx],
              first_name: firstNameIdx >= 0 ? values[firstNameIdx] : undefined,
              last_name: lastNameIdx >= 0 ? values[lastNameIdx] : undefined,
              phone_number: phoneIdx >= 0 ? values[phoneIdx] : undefined,
              language: langIdx >= 0 ? values[langIdx] : 'en',
              is_active: activeIdx >= 0 ? values[activeIdx] === 'true' : true,
              is_verified: verifiedIdx >= 0 ? values[verifiedIdx] === 'true' : false,
              roles: roleIds.map(id => ({ id: id.trim() })),
            });
          }
        }

        // Import users
        const report = {
          total: usersToImport.length,
          success: 0,
          failed: 0,
          errors: [] as string[],
          warnings: [] as string[],
        };

        for (const userData of usersToImport) {
          try {
            // Create user
            const createRes = await fetchWithAuth(IDENTITY_ROUTES.users, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: userData.email,
                first_name: userData.first_name,
                last_name: userData.last_name,
                phone_number: userData.phone_number,
                language: userData.language || 'en',
                is_active: userData.is_active ?? true,
                is_verified: userData.is_verified ?? false,
                password: 'ChangeMe123!', // Default password for imported users
              }),
            });

            if (!createRes.ok) {
              const errorText = await createRes.text();
              report.failed++;
              report.errors.push(`User "${userData.email}": ${errorText}`);
              continue;
            }

            const createdUser = await createRes.json();
            report.success++;

            // Add roles if any
            if (userData.roles && Array.isArray(userData.roles) && userData.roles.length > 0) {
              for (const role of userData.roles) {
                try {
                  const roleId = typeof role === 'object' ? role.id : role;
                  const addRoleRes = await fetchWithAuth(
                    GUARDIAN_ROUTES.userRoles,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        user_id: createdUser.id,
                        role_id: roleId 
                      }),
                    }
                  );

                  if (!addRoleRes.ok) {
                    report.warnings.push(
                      `User "${userData.email}": Failed to add role ${roleId}`
                    );
                  }
                } catch (error_) {
                  report.warnings.push(
                    `User "${userData.email}": Error adding role - ${error_}`
                  );
                }
              }
            }
          } catch (err) {
            report.failed++;
            report.errors.push(`User "${userData.email}": ${err}`);
          }
        }

        setImportReport(report);
        setIsImportReportOpen(true);
        fetchUsers();
      } catch (err) {
        logger.error({ err }, 'Import error');
        toast.error(dictionary.error_import + ': ' + err);
      }
    };

    input.click();
  }

  return (
    <div className="p-6" {...testId(ADMIN_TEST_IDS.users.page)}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold" {...testId(ADMIN_TEST_IDS.users.title)}>
          {dictionary.page_title}
        </h1>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Upload className={ICON_SIZES.sm} />
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
              <Button variant="outline">
                <Download className={ICON_SIZES.sm} />
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
            onClick={handleCreateClick} 
            {...testId(ADMIN_TEST_IDS.users.createButton)}
          >
            <Plus className={ICON_SIZES.sm} />
            {dictionary.create_button}
          </Button>
        </div>
      </div>

      {/* User Table */}
      <UserDataTable
        users={users}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onToggleActive={handleToggleActive}
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
      
      {/* Import Report Dialog */}
      <Dialog open={isImportReportOpen} onOpenChange={setIsImportReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dictionary.import_report_title}</DialogTitle>
            <DialogDescription>
              <div className="space-y-2 mt-4">
                <p><strong>{dictionary.import_report_total}:</strong> {importReport.total}</p>
                <p><strong>{dictionary.import_report_success}:</strong> {importReport.success}</p>
                <p><strong>{dictionary.import_report_failed}:</strong> {importReport.failed}</p>
                
                {importReport.errors.length > 0 && (
                  <div>
                    <p className="font-semibold text-red-600">{dictionary.import_report_errors}:</p>
                    <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
                      {importReport.errors.map((error_, idx) => (
                        <li key={`error-${idx}-${error_.substring(0, 20)}`} className="text-sm">{error_}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {importReport.warnings.length > 0 && (
                  <div>
                    <p className="font-semibold text-yellow-600">{dictionary.import_report_warnings}:</p>
                    <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
                      {importReport.warnings.map((warning, idx) => (
                        <li key={`warning-${idx}-${warning.substring(0, 20)}`} className="text-sm">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsImportReportOpen(false)}>
              {dictionary.import_report_close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
