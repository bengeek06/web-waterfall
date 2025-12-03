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

import type { FilterOption, FilterType } from "../types";
import { TextFilter } from "./text-filter";
import { SelectFilter } from "./select-filter";
import { MultiSelectFilter } from "./multi-select-filter";
import { BooleanFilter } from "./boolean-filter";

// ==================== TYPES ====================

interface ColumnFilterProps {
  /** Type of filter to render */
  filterType: FilterType;
  /** Current filter value */
  value: unknown;
  /** Callback when value changes */
  onChange: (_newValue: unknown) => void;
  /** Options for select/multi-select filters */
  options?: FilterOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Labels for boolean filter */
  booleanLabels?: {
    all?: string;
    true?: string;
    false?: string;
  };
  /** Test ID for E2E testing */
  testId?: string;
  /** Additional CSS classes */
  className?: string;
}

// ==================== COMPONENT ====================

/**
 * Dispatcher component that renders the appropriate filter based on type
 * 
 * Handles type coercion between the generic filter value and the specific
 * filter component's expected types.
 * 
 * @example
 * ```tsx
 * <ColumnFilter
 *   filterType="multi-select"
 *   value={filters.roles}
 *   onChange={(v) => updateFilter('roles', v)}
 *   options={roleOptions}
 *   testId="users-filter-roles"
 * />
 * ```
 */
export function ColumnFilter({
  filterType,
  value,
  onChange,
  options = [],
  placeholder,
  booleanLabels,
  testId,
  className,
}: Readonly<ColumnFilterProps>) {
  switch (filterType) {
    case "text":
      return (
        <TextFilter
          value={String(value ?? "")}
          onChange={onChange}
          placeholder={placeholder}
          testId={testId}
          className={className}
        />
      );

    case "select":
      return (
        <SelectFilter
          value={String(value ?? "")}
          onChange={onChange}
          options={options}
          placeholder={placeholder}
          testId={testId}
          className={className}
        />
      );

    case "multi-select":
      return (
        <MultiSelectFilter
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          options={options}
          placeholder={placeholder}
          testId={testId}
          className={className}
        />
      );

    case "boolean":
      return (
        <BooleanFilter
          value={String(value ?? "")}
          onChange={onChange}
          allLabel={booleanLabels?.all}
          trueLabel={booleanLabels?.true}
          falseLabel={booleanLabels?.false}
          testId={testId}
          className={className}
        />
      );

    case "custom":
      // Custom filters should be rendered by the parent component
      return null;

    default:
      return null;
  }
}
