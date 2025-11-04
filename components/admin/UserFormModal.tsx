"use client";

import React, { useState, useEffect } from "react";
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

// Validation
import { createUserSchema, updateUserSchema } from "@/lib/validation/identity.schemas";
import type { CreateUserFormData } from "@/lib/validation/identity.schemas";

// Constants
import { IDENTITY_ROUTES } from "@/lib/api-routes";
import { GUARDIAN_ROUTES } from "@/lib/api-routes/guardian";
import { ADMIN_TEST_IDS, testId } from "@/lib/test-ids";
import { COLOR_CLASSES, SPACING } from "@/lib/design-tokens";

// Utils
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// Types
export type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar_url?: string;
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
      avatar_url: string;
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
export function UserFormModal({ user, isOpen, onClose, onSuccess, dictionary }: UserFormProps) {
  const router = useRouter();
  const isEditing = !!user;

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    avatar_url: "",
    language: "fr",
    is_active: true,
    is_verified: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
          avatar_url: user.avatar_url || "",
          language: user.language || "fr",
          is_active: user.is_active ?? true,
          is_verified: user.is_verified ?? false,
        });
        // Set user's current roles
        setSelectedRoleIds(user.roles?.map(r => r.id.toString()) || []);
        // Set user's current position (single)
        setSelectedPositionId(user.position_id || "");
      } else {
        setFormData({
          email: "",
          password: "",
          first_name: "",
          last_name: "",
          phone_number: "",
          avatar_url: "",
          language: "fr",
          is_active: true,
          is_verified: false,
        });
        setSelectedRoleIds([]);
        setSelectedPositionId("");
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

      // Prepare payload
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

      console.log('Sending payload:', payload); // Debug log

      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

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

          {/* Avatar URL */}
          <div className={SPACING.component.xs}>
            <Label htmlFor="avatar_url">{dictionary.form.avatar_url}</Label>
            <Input
              id="avatar_url"
              type="url"
              value={formData.avatar_url}
              onChange={(e) => updateField("avatar_url", e.target.value)}
              {...testId(ADMIN_TEST_IDS.users.avatarUrlInput)}
              aria-invalid={!!errors.avatar_url}
            />
            {errors.avatar_url && (
              <p className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}>
                {errors.avatar_url}
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
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
              {isLoadingRoles ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : availableRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun rôle disponible</p>
              ) : (
                availableRoles.map((role) => (
                  <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.includes(role.id.toString())}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoleIds(prev => [...prev, role.id.toString()]);
                        } else {
                          setSelectedRoleIds(prev => prev.filter(id => id !== role.id.toString()));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{role.name}</span>
                  </label>
                ))
              )}
            </div>
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
            >
              <option value="">Aucune position</option>
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
