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

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";
import type { ErrorMessages } from "@/lib/hooks/useErrorHandler";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Constants
import { IDENTITY_ROUTES } from "@/lib/api-routes";

// Utils
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";

// Types
type OrganizationUnit = {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  parent_id?: string | null;
  path: string;
  level: number;
};

type OrganizationUnitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  unit?: OrganizationUnit | null; // For editing
  parentUnit?: OrganizationUnit | null; // For creating child
  dictionary: {
    unit_modal: {
      create_title: string;
      create_child_title: string;
      edit_title: string;
      name: string;
      name_required: string;
      description: string;
      parent: string;
      cancel: string;
      save: string;
    };
    messages: {
      unit_created: string;
      unit_updated: string;
      error_create: string;
      error_update: string;
    };
    errors: ErrorMessages;
  };
};

export default function OrganizationUnitModal({
  isOpen,
  onClose,
  onSuccess,
  unit,
  parentUnit,
  dictionary,
}: OrganizationUnitModalProps) {
  const router = useRouter();
  const { handleError } = useErrorHandler({ messages: dictionary.errors });
  const isEditing = !!unit;
  const isCreatingChild = !!parentUnit;
  
  // State - will be reset by Dialog key prop when modal reopens
  const [name, setName] = useState(unit?.name || "");
  const [description, setDescription] = useState(unit?.description || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const getTitle = () => {
    if (isEditing) return dictionary.unit_modal.edit_title;
    if (isCreatingChild) return dictionary.unit_modal.create_child_title;
    return dictionary.unit_modal.create_title;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Validation
    if (!name.trim()) {
      setError(dictionary.unit_modal.name_required);
      return;
    }

    setIsLoading(true);

    try {
      const payload: {
        name: string;
        description?: string;
        parent_id?: string | null;
      } = {
        name: name.trim(),
      };

      if (description.trim()) {
        payload.description = description.trim();
      }

      // Add parent_id for child units
      if (isCreatingChild && parentUnit) {
        payload.parent_id = parentUnit.id;
      }

      let res;
      if (isEditing && unit) {
        // Update
        res = await fetchWithAuth(IDENTITY_ROUTES.organizationUnit(unit.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create
        res = await fetchWithAuth(IDENTITY_ROUTES.organizationUnits, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        setError(isEditing ? dictionary.messages.error_update : dictionary.messages.error_create);
        handleError(new Error(errorText));
        setIsLoading(false);
        return;
      }

      // Success
      setMessage(isEditing ? dictionary.messages.unit_updated : dictionary.messages.unit_created);
      
      // Close modal after a short delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      handleError(err);
      setError(isEditing ? dictionary.messages.error_update : dictionary.messages.error_create);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          {isCreatingChild && parentUnit && (
            <DialogDescription>
              {dictionary.unit_modal.parent}: {parentUnit.name}
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">{dictionary.unit_modal.name} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">{dictionary.unit_modal.description}</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                maxLength={200}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}

            {/* Success Message */}
            {message && (
              <div className="text-sm text-green-600">{message}</div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {dictionary.unit_modal.cancel}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "..." : dictionary.unit_modal.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
