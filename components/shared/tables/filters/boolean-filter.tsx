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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/utils";
import { testId as makeTestId } from "@/lib/test-ids";

// ==================== TYPES ====================

interface BooleanFilterProps {
  /** Current value: "true", "false", or "" (all) */
  value: string;
  /** Callback when selection changes */
  onChange: (_newValue: string) => void;
  /** Label for "All" option */
  allLabel?: string;
  /** Label for "true" option */
  trueLabel?: string;
  /** Label for "false" option */
  falseLabel?: string;
  /** Test ID for E2E testing */
  testId?: string;
  /** Additional CSS classes */
  className?: string;
}

// ==================== COMPONENT ====================

/**
 * Boolean filter (Yes/No/All) for table columns
 * 
 * Features:
 * - Three-state selection: All, Yes, No
 * - Customizable labels
 * - Compact size for table headers
 * 
 * @example
 * ```tsx
 * <BooleanFilter
 *   value={filters.is_active}
 *   onChange={(v) => updateFilter('is_active', v)}
 *   trueLabel="Active"
 *   falseLabel="Inactive"
 *   testId="users-filter-active"
 * />
 * ```
 */
export function BooleanFilter({
  value,
  onChange,
  allLabel = "All",
  trueLabel = "Yes",
  falseLabel = "No",
  testId,
  className,
}: Readonly<BooleanFilterProps>) {
  return (
    <Select
      value={value || ""}
      onValueChange={(v) => onChange(v === "__all__" ? "" : v)}
    >
      <SelectTrigger
        className={cn("h-8 w-full text-sm", className)}
        {...(testId ? makeTestId(testId) : {})}
      >
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{allLabel}</SelectItem>
        <SelectItem value="true">{trueLabel}</SelectItem>
        <SelectItem value="false">{falseLabel}</SelectItem>
      </SelectContent>
    </Select>
  );
}
