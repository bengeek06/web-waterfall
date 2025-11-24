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

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Camera, Upload, User as UserIcon } from "lucide-react";

// Validation
import { createUserSchema, updateUserSchema } from "@/lib/validation/identity.schemas";
import type { CreateUserFormData } from "@/lib/validation/identity.schemas";

// Constants
import { IDENTITY_ROUTES } from "@/lib/api-routes";
import { GUARDIAN_ROUTES } from "@/lib/api-routes/guardian";
import { ADMIN_TEST_IDS, testId } from "@/lib/test-ids";
import { COLOR_CLASSES, SPACING } from "@/lib/design-tokens";

// Utils
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";

// Types
export type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  has_avatar?: boolean;
  avatar_file_id?: string;
  language?: 'en' | 'fr';
  is_active: boolean;
  is_verified: boolean;
  last_login_at?: string;
  created_at?: string;
  position_id?: string;  // A user has ONE position
  roles?: Array<{ id: string; name: string }>;
};

type UserFormProps = {
  user?: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dictionary: {
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
      language: string;
      is_active: string;
      is_verified: string;
      roles: string;
      positions: string;
      cancel: string;
      save: string;
      create: string;
    };
    errors: {
      email_required: string;
      password_required: string;
      save_failed: string;
      validation_error?: string;
      unknown_field?: string;
      field_required?: string;
      invalid_format?: string;
      roles_fetch_failed?: string;
    };
  };
};

type FormData = CreateUserFormData;

// ==================== COMPONENT ====================
export function UserFormModal({ user, isOpen, onClose, onSuccess, dictionary }: Readonly<UserFormProps>) {
  const router = useRouter();
  const isEditing = !!user;

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    language: "fr",
    is_active: true,
    is_verified: false,
    has_avatar: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Roles management
  const [availableRoles, setAvailableRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  
  // Positions management
  const [availablePositions, setAvailablePositions] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");  // Single position
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);

  // Load available roles on mount
  useEffect(() => {
    const loadRoles = async () => {
      setIsLoadingRoles(true);
      try {
        const res = await fetchWithAuth(GUARDIAN_ROUTES.roles);
        if (res.ok) {
          const roles = await res.json();
          setAvailableRoles(Array.isArray(roles) ? roles : []);
        }
      } catch (error) {
        console.error("Error loading roles:", error);
      } finally {
        setIsLoadingRoles(false);
      }
    };
    loadRoles();
  }, []);

  // Load available positions on mount
  useEffect(() => {
    const loadPositions = async () => {
      setIsLoadingPositions(true);
      try {
        const res = await fetchWithAuth(IDENTITY_ROUTES.positions);
        if (res.ok) {
          const positions = await res.json();
          setAvailablePositions(Array.isArray(positions) ? positions : []);
        }
      } catch (error) {
        console.error("Error loading positions:", error);
      } finally {
        setIsLoadingPositions(false);
      }
    };
    loadPositions();
  }, []);

  // Reset form when user changes or dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          email: user.email || "",
          password: "", // Password not shown for edit
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          phone_number: user.phone_number || "",
          language: user.language || "fr",
          is_active: user.is_active ?? true,
          is_verified: user.is_verified ?? false,
          has_avatar: user.has_avatar ?? false,
        });
        // Set user's current roles
        setSelectedRoleIds(user.roles?.map(r => r.id.toString()) || []);
        // Set user's current position (single)
        setSelectedPositionId(user.position_id || "");
        // Set avatar preview from endpoint if user has avatar
        if (user.id && user.has_avatar) {
          setAvatarPreview(`/api/identity/users/${user.id}/avatar?t=${Date.now()}`);
        } else {
          setAvatarPreview("");
        }
        setAvatarFile(null);
      } else {
        setFormData({
          email: "",
          password: "",
          first_name: "",
          last_name: "",
          phone_number: "",
          language: "fr",
          is_active: true,
          is_verified: false,
          has_avatar: false,
        });
        setSelectedRoleIds([]);
        setSelectedPositionId("");
        setAvatarPreview("");
        setAvatarFile(null);
      }
      setErrors({});
      setServerError(null);
    }
  }, [user, isOpen]);

  const validate = (): boolean => {
    const schema = isEditing ? updateUserSchema : createUserSchema;
    const result = schema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }

    // Validate position (required for creation)
    if (!isEditing && !selectedPositionId) {
      setErrors({ position_id: "La position est obligatoire" });
      return false;
    }

    setErrors({});
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const method = isEditing ? "PATCH" : "POST";
      const url = isEditing ? IDENTITY_ROUTES.user(user!.id) : IDENTITY_ROUTES.users;

      let res;

      // Use FormData if we have an avatar file to upload
      if (avatarFile) {
        const formDataPayload = new FormData();
        formDataPayload.append("email", formData.email);
        if (!isEditing && formData.password) {
          formDataPayload.append("password", formData.password);
        }
        if (formData.first_name) formDataPayload.append("first_name", formData.first_name);
        if (formData.last_name) formDataPayload.append("last_name", formData.last_name);
        if (formData.phone_number) formDataPayload.append("phone_number", formData.phone_number);
        formDataPayload.append("language", formData.language);
        if (!isEditing) {
          formDataPayload.append("is_active", formData.is_active.toString());
        }
        if (selectedPositionId) {
          formDataPayload.append("position_id", selectedPositionId);
        }
        formDataPayload.append("avatar", avatarFile);

        res = await fetchWithAuth(url, {
          method,
          body: formDataPayload,
        });
      } else {
        // Use JSON for simple updates without avatar
        const payload: Record<string, unknown> = { ...formData };
        
        // Add position_id to payload
        if (selectedPositionId) {
          payload.position_id = selectedPositionId;
        } else {
          // Explicitly set to null to remove position
          payload.position_id = null;
        }
        
        // Remove empty strings
        Object.keys(payload).forEach((key) => {
          if (payload[key] === "") {
            delete payload[key];
          }
        });
        
        // Remove fields not accepted by the backend
        if (isEditing) {
          // Remove password for updates (password updates done separately)
          delete payload.password;
          // Remove is_active and is_verified - these might not be accepted by PATCH
          // They should be managed through dedicated endpoints
          delete payload.is_active;
          delete payload.is_verified;
        } else {
          // Remove is_verified for creation (managed by backend)
          delete payload.is_verified;
        }

        res = await fetchWithAuth(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Server error response:', res.status, errorData); // Debug log
        
        // Handle backend validation errors with field-specific messages
        if (errorData.errors && typeof errorData.errors === 'object') {
          const newErrors: Record<string, string> = {};
          Object.entries(errorData.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              newErrors[field] = messages[0]; // Take first error message
            }
          });
          
          if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Show a translated generic message at the top
            setServerError(dictionary.errors.validation_error || dictionary.errors.save_failed);
            setIsSubmitting(false);
            return;
          }
        }
        
        // Fallback to generic error
        setServerError(errorData.message || errorData.error || dictionary.errors.save_failed);
        setIsSubmitting(false);
        return;
      }

      const userData = await res.json();
      const userId = isEditing ? user!.id : userData.id;

      // Handle role assignments (separate from user creation/update)
      await handleRoleAssignments(userId);

      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting user form:", error);
      setServerError(dictionary.errors.save_failed);
      setIsSubmitting(false);
    }
  };

  const handleRoleAssignments = async (userId: string) => {
    try {
      // Get existing user roles
      const existingRolesRes = await fetchWithAuth(GUARDIAN_ROUTES.userRoles);
      if (!existingRolesRes.ok) {
        console.error("Failed to fetch existing user roles");
        return;
      }

      const allUserRoles = await existingRolesRes.json();
      const userExistingRoles = Array.isArray(allUserRoles) 
        ? allUserRoles.filter((ur: { user_id: string }) => ur.user_id === userId)
        : [];

      const existingRoleIds = userExistingRoles.map((ur: { role_id: string }) => ur.role_id.toString());

      // Determine roles to add and remove
      const rolesToAdd = selectedRoleIds.filter(roleId => !existingRoleIds.includes(roleId));
      const rolesToRemove = userExistingRoles.filter(
        (ur: { role_id: string }) => !selectedRoleIds.includes(ur.role_id.toString())
      );

      // Add new roles
      for (const roleId of rolesToAdd) {
        await fetchWithAuth(GUARDIAN_ROUTES.userRoles, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            role_id: roleId,
          }),
        });
      }

      // Remove old roles
      for (const userRole of rolesToRemove) {
        await fetchWithAuth(GUARDIAN_ROUTES.userRole(userRole.id), {
          method: "DELETE",
        });
      }
    } catch (error) {
      console.error("Error managing user roles:", error);
      // Don't throw - we don't want to block the user creation/update
    }
  };

  const handleClose = () => {
    setErrors({});
    setServerError(null);
    onClose();
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        aria-describedby={void 0}
        aria-label="user-form-modal"
        {...testId(ADMIN_TEST_IDS.users.modal)}
      >
        <DialogHeader>
          <DialogTitle {...testId(ADMIN_TEST_IDS.users.modalTitle)}>
            {isEditing ? dictionary.modal.edit_title : dictionary.modal.create_title}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription id="user-form-description" className="sr-only">
          {isEditing ? dictionary.modal.edit_description : dictionary.modal.create_description}
        </DialogDescription>

        <form onSubmit={onSubmit} className={SPACING.component.md}>
          {/* Avatar */}
          <div className={SPACING.component.xs}>
            <Label>Avatar</Label>
            <div className="flex flex-col items-center space-y-3 mt-2">
              {/* Circular Avatar Preview with Camera Button */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarPreview("")}
                    />
                  ) : (
                    <UserIcon size={32} className="text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="absolute -bottom-1 -right-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-colors"
                  aria-label="Change avatar"
                >
                  <Camera size={14} />
                </button>
              </div>
              
              {/* Upload Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerFileInput}
                className="flex items-center gap-2"
              >
                <Upload size={16} />
                {avatarFile ? "Changer l'avatar" : "Télécharger un avatar"}
              </Button>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                {...testId(ADMIN_TEST_IDS.users.avatarUrlInput)}
                aria-invalid={!!errors.avatar}
              />
              
              <p className="text-sm text-muted-foreground text-center">
                Formats acceptés: JPG, PNG, GIF (max 5MB)
              </p>
            </div>
            {errors.avatar && (
              <p className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}>
                {errors.avatar}
              </p>
            )}
          </div>

          {/* Email */}
          <div className={SPACING.component.xs}>
            <Label htmlFor="email">{dictionary.form.email}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              {...testId(ADMIN_TEST_IDS.users.emailInput)}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password (only for create) */}
          {!isEditing && (
            <div className={SPACING.component.xs}>
              <Label htmlFor="password">{dictionary.form.password}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                {...testId(ADMIN_TEST_IDS.users.passwordInput)}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}>
                  {errors.password}
                </p>
              )}
            </div>
          )}

          {/* First Name */}
          <div className={SPACING.component.xs}>
            <Label htmlFor="first_name">{dictionary.form.first_name}</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => updateField("first_name", e.target.value)}
              {...testId(ADMIN_TEST_IDS.users.firstNameInput)}
              aria-invalid={!!errors.first_name}
            />
            {errors.first_name && (
              <p className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}>
                {errors.first_name}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div className={SPACING.component.xs}>
            <Label htmlFor="last_name">{dictionary.form.last_name}</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => updateField("last_name", e.target.value)}
              {...testId(ADMIN_TEST_IDS.users.lastNameInput)}
              aria-invalid={!!errors.last_name}
            />
            {errors.last_name && (
              <p className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}>
                {errors.last_name}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className={SPACING.component.xs}>
            <Label htmlFor="phone_number">{dictionary.form.phone_number}</Label>
            <Input
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => updateField("phone_number", e.target.value)}
              {...testId(ADMIN_TEST_IDS.users.phoneInput)}
              aria-invalid={!!errors.phone_number}
            />
            {errors.phone_number && (
              <p className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}>
                {errors.phone_number}
              </p>
            )}
          </div>

          {/* Language */}
          <div className={SPACING.component.xs}>
            <Label htmlFor="language">{dictionary.form.language}</Label>
            <select
              id="language"
              value={formData.language}
              onChange={(e) => updateField("language", e.target.value as 'en' | 'fr')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...testId(ADMIN_TEST_IDS.users.languageSelect)}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
            {errors.language && (
              <p className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}>
                {errors.language}
              </p>
            )}
          </div>

          {/* Roles */}
          <div className={SPACING.component.xs}>
            <Label htmlFor="roles">{dictionary.form.roles}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  type="button"
                >
                  <span className="truncate">
                    {selectedRoleIds.length === 0
                      ? "Sélectionner des rôles"
                      : `${selectedRoleIds.length} rôle(s) sélectionné(s)`}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-60 overflow-y-auto" style={{ width: 'var(--radix-dropdown-menu-trigger-width)' }}>
                {isLoadingRoles ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Chargement...</div>
                ) : availableRoles.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Aucun rôle disponible</div>
                ) : (
                  availableRoles.map((role) => (
                    <DropdownMenuCheckboxItem
                      key={role.id}
                      checked={selectedRoleIds.includes(role.id.toString())}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRoleIds(prev => [...prev, role.id.toString()]);
                        } else {
                          setSelectedRoleIds(prev => prev.filter(id => id !== role.id.toString()));
                        }
                      }}
                    >
                      {role.name}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {errors.roles && (
              <p className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}>
                {errors.roles}
              </p>
            )}
          </div>

          {/* Positions (Single Selection) */}
          <div className={SPACING.component.xs}>
            <Label htmlFor="positions">{dictionary.form.positions}</Label>
            <select
              id="positions"
              value={selectedPositionId}
              onChange={(e) => setSelectedPositionId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="" disabled>Sélectionner une position</option>
              {isLoadingPositions ? (
                <option disabled>Chargement...</option>
              ) : (
                availablePositions.map((position) => (
                  <option key={position.id} value={position.id.toString()}>
                    {position.title}
                  </option>
                ))
              )}
            </select>
            {errors.positions && (
              <p className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}>
                {errors.positions}
              </p>
            )}
          </div>

          {/* Is Active - Only show when creating (cannot be updated via PATCH) */}
          {!isEditing && (
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => updateField("is_active", checked)}
                {...testId(ADMIN_TEST_IDS.users.isActiveSwitch)}
              />
              <Label htmlFor="is_active">{dictionary.form.is_active}</Label>
            </div>
          )}

          {/* Is Verified - Not editable (managed by backend) */}
          {/* Note: If you need to update is_active or is_verified, 
              you'll need to create dedicated API endpoints for these actions */}

          {/* Server Error */}
          {serverError && (
            <div className={`${COLOR_CLASSES.text.destructive} text-sm`} {...testId(ADMIN_TEST_IDS.users.formError)}>
              {serverError}
            </div>
          )}

          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              {...testId(ADMIN_TEST_IDS.users.cancelButton)}
            >
              {dictionary.form.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              {...testId(ADMIN_TEST_IDS.users.submitButton)}
            >
              {isSubmitting ? "..." : (isEditing ? dictionary.form.save : dictionary.form.create)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
