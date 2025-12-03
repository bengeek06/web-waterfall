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
import type { FilterOption } from "../types";

// ==================== TYPES ====================

interface SelectFilterProps {
  /** Current selected value */
  value: string;
  /** Callback when selection changes */
  onChange: (_newValue: string) => void;
  /** Available options */
  options: FilterOption[];
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Test ID for E2E testing */
  testId?: string;
  /** Additional CSS classes */
  className?: string;
}

// ==================== COMPONENT ====================

/**
 * Single-select dropdown filter for table columns
 * 
 * Features:
 * - Single value selection
 * - Clear selection by selecting empty value
 * - Compact size for table headers
 * 
 * @example
 * ```tsx
 * <SelectFilter
 *   value={filters.position_id}
 *   onChange={(v) => updateFilter('position_id', v)}
 *   options={positions.map(p => ({ value: p.id, label: p.title }))}
 *   placeholder="All positions"
 *   testId="users-filter-position"
 * />
 * ```
 */
export function SelectFilter({
  value,
  onChange,
  options,
  placeholder = "All",
  testId,
  className,
}: Readonly<SelectFilterProps>) {
  return (
    <Select
      value={value || ""}
      onValueChange={(v) => onChange(v === "__all__" ? "" : v)}
    >
      <SelectTrigger
        className={cn("h-8 w-full text-sm", className)}
        {...(testId ? makeTestId(testId) : {})}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
