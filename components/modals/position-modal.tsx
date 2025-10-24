"use client";

import React, { useState, useEffect } from "react";
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
import { clientSessionFetch } from "@/lib/clientFetch";

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isEditing = !!position;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (position) {
        setTitle(position.title);
        setDescription(position.description || "");
        setLevel(position.level !== undefined ? String(position.level) : "");
      } else {
        setTitle("");
        setDescription("");
        setLevel("");
      }
      setError(null);
      setMessage(null);
    }
  }, [isOpen, position]);

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
        level?: number;
      } = {
        title: title.trim(),
        company_id: companyId,
        organization_unit_id: organizationUnit.id,
      };

      if (description.trim()) {
        payload.description = description.trim();
      }

      if (level.trim() && !isNaN(parseInt(level))) {
        payload.level = parseInt(level);
      }

      let res;
      if (isEditing && position) {
        // Update
        res = await clientSessionFetch(IDENTITY_ROUTES.position(position.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create
        res = await clientSessionFetch(
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

            {/* Level */}
            <div className="grid gap-2">
              <Label htmlFor="level">{dictionary.position_modal.level}</Label>
              <Input
                id="level"
                type="number"
                min="0"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                disabled={isLoading}
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
