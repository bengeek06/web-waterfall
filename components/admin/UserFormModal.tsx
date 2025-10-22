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
import { ADMIN_TEST_IDS, testId } from "@/lib/test-ids";
import { COLOR_CLASSES, SPACING } from "@/lib/design-tokens";

// Utils
import { clientSessionFetch } from "@/lib/sessionFetch.client";

// Types
export type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  last_login_at?: string;
  created_at?: string;
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
      is_active: string;
      is_verified: string;
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
    is_active: true,
    is_verified: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          is_active: user.is_active ?? true,
          is_verified: user.is_verified ?? false,
        });
      } else {
        setFormData({
          email: "",
          password: "",
          first_name: "",
          last_name: "",
          phone_number: "",
          avatar_url: "",
          is_active: true,
          is_verified: false,
        });
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
      } else {
        // Remove is_verified for creation (managed by backend)
        delete payload.is_verified;
      }

      const res = await clientSessionFetch(url, {
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

      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting user form:", error);
      setServerError(dictionary.errors.save_failed);
      setIsSubmitting(false);
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

          {/* Is Active */}
          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => updateField("is_active", checked)}
              {...testId(ADMIN_TEST_IDS.users.isActiveSwitch)}
            />
            <Label htmlFor="is_active">{dictionary.form.is_active}</Label>
          </div>

          {/* Is Verified - Only show when editing (managed by backend during creation) */}
          {isEditing && (
            <div className="flex items-center gap-2">
              <Switch
                id="is_verified"
                checked={formData.is_verified}
                onCheckedChange={(checked) => updateField("is_verified", checked)}
                {...testId(ADMIN_TEST_IDS.users.isVerifiedSwitch)}
              />
              <Label htmlFor="is_verified">{dictionary.form.is_verified}</Label>
            </div>
          )}

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
