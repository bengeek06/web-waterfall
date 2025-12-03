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

import { useState, useCallback } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/utils";
import { ICON_SIZES } from "@/lib/design-tokens";
import { testId as makeTestId } from "@/lib/test-ids";
import type { FilterOption } from "../types";

// ==================== TYPES ====================

interface MultiSelectFilterProps {
  /** Currently selected values */
  value: string[];
  /** Callback when selection changes */
  onChange: (_newValue: string[]) => void;
  /** Available options */
  options: FilterOption[];
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Empty state text */
  emptyText?: string;
  /** Test ID for E2E testing */
  testId?: string;
  /** Additional CSS classes */
  className?: string;
}

// ==================== COMPONENT ====================

/**
 * Multi-select dropdown filter for table columns
 * 
 * Features:
 * - Multiple value selection with checkboxes
 * - Search within options
 * - Badge display of selected count
 * - Clear all button
 * 
 * @example
 * ```tsx
 * <MultiSelectFilter
 *   value={filters.roles || []}
 *   onChange={(v) => updateFilter('roles', v)}
 *   options={roles.map(r => ({ value: r.id, label: r.name }))}
 *   placeholder="All roles"
 *   testId="users-filter-roles"
 * />
 * ```
 */
export function MultiSelectFilter({
  value = [],
  onChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  testId,
  className,
}: Readonly<MultiSelectFilterProps>) {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (optionValue: string) => {
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue];
      onChange(newValue);
    },
    [value, onChange]
  );

  const handleClearAll = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange([]);
    },
    [onChange]
  );

  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-8 w-full justify-between text-sm font-normal", className)}
          {...(testId ? makeTestId(testId) : {})}
        >
          <span className="truncate">
            {value.length === 0 ? (
              placeholder
            ) : value.length === 1 ? (
              selectedLabels[0]
            ) : (
              <span className="flex items-center gap-1">
                <Badge variant="secondary" className="h-5 px-1 text-xs">
                  {value.length}
                </Badge>
                selected
              </span>
            )}
          </span>
          <div className="flex items-center gap-1">
            {value.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClearAll}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleClearAll(e as unknown as React.MouseEvent);
                  }
                }}
                className="rounded-sm opacity-50 hover:opacity-100"
              >
                <X className={ICON_SIZES.sm} />
                <span className="sr-only">Clear selection</span>
              </span>
            )}
            <ChevronsUpDown className={cn(ICON_SIZES.sm, "opacity-50")} />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      value.includes(option.value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <Check className={ICON_SIZES.xs} />
                  </div>
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
