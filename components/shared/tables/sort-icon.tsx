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

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { ICON_SIZES } from "@/lib/design-tokens";
import type { SortableColumn } from "./types";

// ==================== TYPES ====================

interface SortIconProps {
  /** TanStack Table column with sort state */
  column: SortableColumn;
  /** Additional CSS classes */
  className?: string;
}

// ==================== COMPONENT ====================

/**
 * Sort indicator icon for table columns
 * 
 * Displays appropriate arrow based on current sort state:
 * - ArrowUp for ascending
 * - ArrowDown for descending
 * - ArrowUpDown (muted) for unsorted
 * 
 * @example
 * ```tsx
 * <Button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
 *   {header}
 *   <SortIcon column={column} />
 * </Button>
 * ```
 */
export function SortIcon({ column, className }: Readonly<SortIconProps>) {
  const sorted = column.getIsSorted();
  
  if (sorted === "asc") {
    return <ArrowUp className={cn(ICON_SIZES.sm, className)} />;
  }
  
  if (sorted === "desc") {
    return <ArrowDown className={cn(ICON_SIZES.sm, className)} />;
  }
  
  return <ArrowUpDown className={cn(ICON_SIZES.sm, "opacity-50", className)} />;
}
