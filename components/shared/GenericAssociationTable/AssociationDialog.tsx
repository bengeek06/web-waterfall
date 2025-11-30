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

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Check, X, Search, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { testId } from "@/lib/test-ids";
import { ICON_SIZES, SPACING } from "@/lib/design-tokens";
import type { BaseItem, AssociationDialogProps } from "./types";

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get display value from an item
 */
function getDisplayValue<T extends BaseItem>(
  item: T,
  field: string | undefined,
  fallback = "name"
): string {
  const fieldToUse = field || fallback;
  const value = item[fieldToUse as keyof T];
  return value !== undefined && value !== null ? String(value) : String(item.id);
}

/**
 * Get unique filter options from items for a given field
 */
function getFilterOptions<T extends BaseItem>(
  items: T[],
  field: string
): string[] {
  const values = new Set<string>();
  for (const item of items) {
    const value = item[field as keyof T];
    if (value !== undefined && value !== null) {
      values.add(String(value));
    }
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

// ==================== ITEM LIST COMPONENT ====================

interface ItemListProps<T extends BaseItem> {
  readonly items: T[];
  readonly selectedIds: Set<string | number>;
  readonly onToggle?: (_id: string | number) => void;
  readonly displayField?: string;
  readonly secondaryField?: string;
  readonly emptyMessage: string;
  readonly showCheckboxes?: boolean;
  readonly variant: "associated" | "available";
  readonly testIdPrefix: string;
}

/**
 * Get item class name based on variant and selection state
 */
function getItemClassName(variant: "associated" | "available", isSelected: boolean): string {
  if (variant === "associated") {
    return "bg-green-50 border-green-200";
  }
  if (isSelected) {
    return "bg-blue-50 border-blue-200";
  }
  return "bg-white border-gray-200 hover:bg-gray-50";
}

function ItemList<T extends BaseItem>({
  items,
  selectedIds,
  onToggle,
  displayField,
  secondaryField,
  emptyMessage,
  showCheckboxes = false,
  variant,
  testIdPrefix,
}: ItemListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const isSelected = selectedIds.has(item.id);
        const itemClassName = getItemClassName(variant, isSelected);
        
        return (
          <button
            key={item.id}
            type="button"
            className={`
              flex items-center w-full p-2 rounded border cursor-pointer transition-colors text-left
              ${itemClassName}
            `}
            onClick={() => onToggle?.(item.id)}
            {...testId(`${testIdPrefix}-${variant}-${item.id}`)}
          >
            {showCheckboxes && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggle?.(item.id)}
                className="mr-2"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            
            {variant === "associated" && (
              <Check className={`${ICON_SIZES.xs} text-green-600 mr-2`} />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {getDisplayValue(item, displayField)}
              </div>
              {secondaryField && (
                <div className="text-xs text-gray-500 truncate">
                  {getDisplayValue(item, secondaryField, "")}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

/**
 * AssociationDialog - Two-panel dialog for managing associations
 * 
 * Left panel: Currently associated items (read-only reference)
 * Right panel: Available items to add (with checkboxes)
 * 
 * @example
 * ```tsx
 * <AssociationDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   parentName="Admin Role"
 *   config={permissionsConfig}
 *   associatedItems={rolePermissions}
 *   availableItems={allPermissions}
 *   onAdd={handleAddPermissions}
 *   dictionary={dict}
 * />
 * ```
 */
export function AssociationDialog<TAssociated extends BaseItem = BaseItem>({
  open,
  onOpenChange,
  parentName,
  config,
  associatedItems,
  availableItems,
  onAdd,
  isLoading = false,
  dictionary,
  initialFilters = {},
}: Readonly<AssociationDialogProps<TAssociated>>) {
  const Icon = config.icon || Link2;
  const label = config.label || config.name;
  const displayField = config.displayField as string | undefined;
  const secondaryField = config.secondaryField as string | undefined;
  
  // State
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);

  // Reset selection when dialog closes (not on open to avoid cascading renders)
  const prevOpenRef = React.useRef(open);
  
  useEffect(() => {
    // Reset only when dialog transitions from closed to open
    if (open && !prevOpenRef.current) {
      // Use requestAnimationFrame to avoid cascading renders
      requestAnimationFrame(() => {
        setSelectedIds(new Set());
        setSearchQuery("");
        setFilters(initialFilters);
      });
    }
    prevOpenRef.current = open;
  }, [open, initialFilters]);

  // Filter out already associated items from available
  const notAssociatedItems = useMemo(() => {
    const associatedIds = new Set(associatedItems.map(item => item.id));
    return availableItems.filter(item => !associatedIds.has(item.id));
  }, [availableItems, associatedItems]);

  // Get filter options from groupBy config
  const filterFields = useMemo(() => config.groupBy?.fields || [], [config.groupBy?.fields]);
  
  const filterOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    for (const field of filterFields) {
      options[field] = getFilterOptions(notAssociatedItems, field);
    }
    return options;
  }, [notAssociatedItems, filterFields]);

  // Apply search and filters
  const filteredItems = useMemo(() => {
    let items = notAssociatedItems;
    
    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => {
        const displayValue = getDisplayValue(item, displayField).toLowerCase();
        const secondaryValue = secondaryField 
          ? getDisplayValue(item, secondaryField, "").toLowerCase() 
          : "";
        return displayValue.includes(query) || secondaryValue.includes(query);
      });
    }
    
    // Apply field filters
    for (const [field, value] of Object.entries(filters)) {
      if (value) {
        items = items.filter(item => {
          const itemValue = item[field as keyof TAssociated];
          return itemValue !== undefined && String(itemValue) === value;
        });
      }
    }
    
    return items;
  }, [notAssociatedItems, searchQuery, filters, displayField, secondaryField]);

  // Handlers
  const handleToggle = useCallback((id: string | number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(filteredItems.map(item => item.id)));
  }, [filteredItems]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleAdd = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await onAdd(Array.from(selectedIds));
    onOpenChange(false);
  }, [selectedIds, onAdd, onOpenChange]);

  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const testIdPrefix = `association-dialog-${config.name}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[80vh]"
        {...testId(testIdPrefix)}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={ICON_SIZES.md} />
            {dictionary.association_dialog_title?.replace("{name}", parentName) 
              || `Ajouter ${label} à "${parentName}"`}
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les éléments à associer
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 min-h-[400px]">
          {/* Left Panel: Associated Items */}
          <div className="w-1/3 border rounded-lg p-3 bg-gray-50">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Check className={`${ICON_SIZES.xs} text-green-600`} />
              {dictionary.associated_items || "Déjà associés"} ({associatedItems.length})
            </h3>
            <ScrollArea className="h-[350px]">
              <ItemList
                items={associatedItems}
                selectedIds={new Set()}
                displayField={displayField}
                secondaryField={secondaryField}
                emptyMessage={dictionary.no_associations || "Aucun élément"}
                variant="associated"
                testIdPrefix={testIdPrefix}
              />
            </ScrollArea>
          </div>

          {/* Right Panel: Available Items */}
          <div className="flex-1 border rounded-lg p-3">
            <div className="space-y-3">
              <h3 className="font-medium text-sm flex items-center justify-between">
                <span>
                  {dictionary.available_items || "Disponibles"} ({filteredItems.length})
                </span>
                <span className="text-xs text-gray-500">
                  {selectedIds.size} sélectionné(s)
                </span>
              </h3>

              {/* Search & Filters */}
              <div className={`flex flex-wrap ${SPACING.gap.sm}`}>
                <div className="relative flex-1 min-w-[200px]">
                  <Search className={`absolute left-2 top-1/2 -translate-y-1/2 ${ICON_SIZES.xs} text-gray-400`} />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8"
                    {...testId(`${testIdPrefix}-search`)}
                  />
                </div>
                
                {filterFields.map((field) => (
                  <select
                    key={field}
                    value={filters[field] || ""}
                    onChange={(e) => handleFilterChange(field, e.target.value)}
                    className="h-8 px-2 text-sm border rounded-md bg-white"
                    {...testId(`${testIdPrefix}-filter-${field}`)}
                  >
                    <option value="">{field}</option>
                    {filterOptions[field]?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ))}
              </div>

              {/* Selection Actions */}
              <div className={`flex ${SPACING.gap.sm}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={filteredItems.length === 0}
                  {...testId(`${testIdPrefix}-select-all`)}
                >
                  Tout sélectionner
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelection}
                  disabled={selectedIds.size === 0}
                  {...testId(`${testIdPrefix}-clear-selection`)}
                >
                  <X className={`${ICON_SIZES.xs} mr-1`} />
                  Effacer
                </Button>
              </div>

              {/* Items List */}
              <ScrollArea className="h-[280px]">
                <ItemList
                  items={filteredItems}
                  selectedIds={selectedIds}
                  onToggle={handleToggle}
                  displayField={displayField}
                  secondaryField={secondaryField}
                  emptyMessage={dictionary.no_available_items || "Aucun élément disponible"}
                  showCheckboxes={true}
                  variant="available"
                  testIdPrefix={testIdPrefix}
                />
              </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            {...testId(`${testIdPrefix}-cancel`)}
          >
            {dictionary.cancel || "Annuler"}
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selectedIds.size === 0 || isLoading}
            {...testId(`${testIdPrefix}-add`)}
          >
            {dictionary.add_selected?.replace("{count}", String(selectedIds.size)) 
              || `Ajouter (${selectedIds.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
