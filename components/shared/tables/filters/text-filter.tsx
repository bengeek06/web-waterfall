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

import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { ICON_SIZES } from "@/lib/design-tokens";
import { testId as makeTestId } from "@/lib/test-ids";

// ==================== TYPES ====================

interface TextFilterProps {
  /** Current filter value */
  value: string;
  /** Callback when value changes */
  onChange: (_newValue: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Test ID for E2E testing */
  testId?: string;
  /** Additional CSS classes */
  className?: string;
}

// ==================== COMPONENT ====================

/**
 * Text input filter for table columns
 * 
 * Features:
 * - Debounced input (handled by parent)
 * - Clear button when value is present
 * - Compact size for table headers
 * 
 * @example
 * ```tsx
 * <TextFilter
 *   value={filters.email}
 *   onChange={(v) => updateFilter('email', v)}
 *   placeholder="Filter by email..."
 *   testId="users-filter-email"
 * />
 * ```
 */
export function TextFilter({
  value,
  onChange,
  placeholder = "Filter...",
  testId,
  className,
}: Readonly<TextFilterProps>) {
  return (
    <div className={cn("relative", className)}>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full pr-8 text-sm"
        {...(testId ? makeTestId(testId) : {})}
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className={`absolute right-0 top-0 ${ICON_SIZES.xl} p-0`}
          onClick={() => onChange("")}
          {...(testId ? makeTestId(`${testId}-clear`) : {})}
        >
          <X className={ICON_SIZES.sm} />
          <span className="sr-only">Clear filter</span>
        </Button>
      )}
    </div>
  );
}
