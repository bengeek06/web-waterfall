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
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// Types
type Position = {
  id: string;
  title: string;
  description?: string;
  company_id: string;
  organization_unit_id: string;
  level?: number;
};

type OrganizationUnit = {
  id: string;
  name: string;
};

type PositionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: string;
  organizationUnit: OrganizationUnit;
  position?: Position | null; // For editing
  dictionary: {
    position_modal: {
      create_title: string;
      edit_title: string;
      title: string;
      title_required: string;
      description: string;
      level: string;
      organization_unit: string;
      cancel: string;
      save: string;
    };
    messages: {
      position_created: string;
      position_updated: string;
      error_create: string;
      error_update: string;
    };
  };
};

export default function PositionModal({
  isOpen,
  onClose,
  onSuccess,
  companyId,
  organizationUnit,
  position,
  dictionary,
}: PositionModalProps) {
  const router = useRouter();
  // Initialize state from props - will reset when component remounts (via key)
  const [title, setTitle] = useState(position?.title || "");
  const [description, setDescription] = useState(position?.description || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isEditing = !!position;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Validation
    if (!title.trim()) {
      setError(dictionary.position_modal.title_required);
      return;
    }

    setIsLoading(true);

    try {
      const payload: {
        title: string;
        description?: string;
        company_id: string;
        organization_unit_id: string;
      } = {
        title: title.trim(),
        company_id: companyId,
        organization_unit_id: organizationUnit.id,
      };

      if (description.trim()) {
        payload.description = description.trim();
      }

      let res;
      if (isEditing && position) {
        // Update
        res = await fetchWithAuth(IDENTITY_ROUTES.position(position.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create
        res = await fetchWithAuth(
          IDENTITY_ROUTES.organizationUnitPositions(organizationUnit.id),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        setError(isEditing ? dictionary.messages.error_update : dictionary.messages.error_create);
        console.error("API Error:", errorText);
        setIsLoading(false);
        return;
      }

      // Success
      setMessage(
        isEditing ? dictionary.messages.position_updated : dictionary.messages.position_created
      );

      // Close modal after a short delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Error saving position:", err);
      setError(isEditing ? dictionary.messages.error_update : dictionary.messages.error_create);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? dictionary.position_modal.edit_title : dictionary.position_modal.create_title}
          </DialogTitle>
          <DialogDescription>
            {dictionary.position_modal.organization_unit}: {organizationUnit.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">{dictionary.position_modal.title} *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">{dictionary.position_modal.description}</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                maxLength={200}
              />
            </div>

            {/* Error Message */}
            {error && <div className="text-sm text-destructive">{error}</div>}

            {/* Success Message */}
            {message && <div className="text-sm text-green-600">{message}</div>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {dictionary.position_modal.cancel}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "..." : dictionary.position_modal.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
