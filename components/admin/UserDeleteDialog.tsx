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

import React from "react";

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

// Constants
import { ADMIN_TEST_IDS, testId } from "@/lib/test-ids";

// ==================== TYPES ====================
type UserDeleteDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  dictionary: {
    title: string;
    description: string;
    cancel: string;
    confirm: string;
  };
};

// ==================== COMPONENT ====================
export function UserDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  dictionary,
}: Readonly<UserDeleteDialogProps>) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={void 0}
        aria-label="delete-dialog-description"
        {...testId(ADMIN_TEST_IDS.users.deleteModal)}
      >
        <DialogHeader>
          <DialogTitle {...testId(ADMIN_TEST_IDS.users.deleteModalTitle)}>
            {dictionary.title}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription id="delete-dialog-description" className="sr-only">
          {dictionary.description}
        </DialogDescription>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            {...testId(ADMIN_TEST_IDS.users.deleteCancelButton)}
          >
            {dictionary.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            {...testId(ADMIN_TEST_IDS.users.deleteConfirmButton)}
          >
            {isDeleting ? "..." : dictionary.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
