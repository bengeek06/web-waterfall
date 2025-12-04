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
import { Trash2, Plus, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { testId } from "@/lib/test-ids";
import { ICON_SIZES, COLOR_CLASSES, SPACING } from "@/lib/design-tokens";
import type { BaseItem, AssociationConfig, AssociationExpansionProps } from "./types";

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get nested value from an object using dot notation
 * @example getNestedValue({ role: { name: "Admin" } }, "role.name") => "Admin"
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return current;
}

/**
 * Get display value from an item
 * Supports nested paths like "role.name" for enriched junction objects
 */
function getDisplayValue<T extends BaseItem>(
  item: T,
  field: string | undefined,
  fallback = "name"
): string {
  const fieldToUse = field || fallback;
  
  // Support nested paths (e.g., "role.name")
  const value = fieldToUse.includes(".")
    ? getNestedValue(item, fieldToUse)
    : item[fieldToUse as keyof T];
  
  return value !== undefined && value !== null ? String(value) : String(item.id);
}

/**
 * Group items by specified fields
 */
function groupItems<T extends BaseItem>(
  items: T[],
  groupBy: string[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  for (const item of items) {
    const key = groupBy
      .map(field => String(item[field as keyof T] ?? ""))
      .join("::");
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }
  
  return groups;
}

/**
 * Render grouped items
 */
function renderGroupedItems<T extends BaseItem>(
  groups: Map<string, T[]>,
  config: AssociationConfig<T>,
  displayField: string | undefined,
  secondaryField: string | undefined,
  dictionary: { remove_association?: string },
  testIdPrefix: string,
  onRemove: (_item: T) => void
) {
  return (
    <div className="space-y-2">
      {Array.from(groups.entries()).map(([groupKey, items]) => {
        const [firstField, secondField] = groupKey.split("::");
        const safeGroupKey = groupKey.replaceAll("::", "-");
        
        return (
          <div
            key={groupKey}
            className="flex items-center bg-white p-2 rounded border"
            {...testId(`${testIdPrefix}-${config.name}-group-${safeGroupKey}`)}
          >
            {/* Group Label */}
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
              {firstField}{secondField ? ` / ${secondField}` : ""}
            </span>

            {/* Items in group */}
            <span className={`flex ${SPACING.gap.sm} ml-2 mr-4`}>
              {items.map((item) => (
                <TooltipProvider key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center cursor-help text-xs bg-gray-50 px-1 py-0.5 rounded">
                        {getDisplayValue(item, displayField)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div>{getDisplayValue(item, displayField)}</div>
                      {secondaryField && (
                        <div className="text-xs opacity-80 mt-1">
                          {getDisplayValue(item, secondaryField, "")}
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </span>

            {/* Remove Group Button */}
            <TooltipProvider>
              <span className="ml-auto flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`${ICON_SIZES.xl} text-destructive hover:text-destructive hover:bg-destructive/10`}
                      onClick={() => {
                        for (const item of items) {
                          onRemove(item);
                        }
                      }}
                      {...testId(`${testIdPrefix}-remove-${config.name}-group-${safeGroupKey}`)}
                    >
                      <Trash2 className={`${ICON_SIZES.sm}`} />
                      <span className="sr-only">{dictionary.remove_association}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{dictionary.remove_association || "Supprimer le groupe"}</p>
                  </TooltipContent>
                </Tooltip>
              </span>
            </TooltipProvider>
          </div>
        );
      })}
    </div>
  );
}

// ==================== ASSOCIATION SECTION COMPONENT ====================

interface AssociationSectionProps<TAssociated extends BaseItem> {
  readonly parentItem: BaseItem;
  readonly config: AssociationConfig<TAssociated>;
  readonly associatedItems: TAssociated[];
  readonly onAdd: () => void;
  readonly onRemove: (_item: TAssociated) => void;
  readonly dictionary: {
    no_associations?: string;
    add_association?: string;
    remove_association?: string;
  };
  readonly testIdPrefix: string;
}

function AssociationSection<TAssociated extends BaseItem>({
  config,
  associatedItems,
  onAdd,
  onRemove,
  dictionary,
  testIdPrefix,
}: AssociationSectionProps<TAssociated>) {
  const Icon = config.icon || Link2;
  const label = config.label || config.name;
  const displayField = config.displayField as string | undefined;
  const secondaryField = config.secondaryField as string | undefined;
  
  // Group items if groupBy is configured
  const hasGrouping = config.groupBy && config.groupBy.fields.length > 0;
  const groups = hasGrouping
    ? groupItems(associatedItems, config.groupBy!.fields)
    : null;

  return (
    <div 
      className="space-y-2"
      {...testId(`${testIdPrefix}-association-${config.name}`)}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={ICON_SIZES.sm} />
          <span className="font-medium text-sm">
            {label} ({associatedItems.length})
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onAdd}
                {...testId(`${testIdPrefix}-add-${config.name}-button`)}
              >
                <Plus className={`${ICON_SIZES.xs} mr-1`} />
                {dictionary.add_association || "Ajouter"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{dictionary.add_association || `Ajouter ${label}`}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Associated Items List */}
      {renderAssociatedItemsList({
        associatedItems,
        hasGrouping: hasGrouping ?? false,
        groups,
        config,
        displayField,
        secondaryField,
        dictionary,
        testIdPrefix,
        onRemove,
        label,
      })}
    </div>
  );
}

/**
 * Params for renderAssociatedItemsList
 */
interface RenderAssociatedItemsParams<TAssociated extends BaseItem> {
  associatedItems: TAssociated[];
  hasGrouping: boolean;
  groups: Map<string, TAssociated[]> | null;
  config: AssociationConfig<TAssociated>;
  displayField: string | undefined;
  secondaryField: string | undefined;
  dictionary: { no_associations?: string; remove_association?: string };
  testIdPrefix: string;
  onRemove: (_item: TAssociated) => void;
  label: string;
}

/**
 * Render the list of associated items - either grouped or flat
 */
function renderAssociatedItemsList<TAssociated extends BaseItem>(
  params: RenderAssociatedItemsParams<TAssociated>
): React.ReactNode {
  const {
    associatedItems,
    hasGrouping,
    groups,
    config,
    displayField,
    secondaryField,
    dictionary,
    testIdPrefix,
    onRemove,
    label,
  } = params;

  // No items
  if (associatedItems.length === 0) {
    return (
      <div className="text-gray-500 text-sm py-2">
        {dictionary.no_associations || `Aucun(e) ${label.toLowerCase()} associé(e)`}
      </div>
    );
  }
  
  // Grouped rendering
  if (hasGrouping && groups) {
    return renderGroupedItems(groups, config, displayField, secondaryField, dictionary, testIdPrefix, onRemove);
  }
  
  // Flat list rendering
  return (
    <div className="space-y-2">
      {associatedItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center bg-white p-2 rounded border"
          {...testId(`${testIdPrefix}-${config.name}-item-${item.id}`)}
        >
          <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
            {getDisplayValue(item, displayField)}
          </span>
          {secondaryField && (
            <span className="ml-2 text-sm text-gray-600">
              {getDisplayValue(item, secondaryField, "")}
            </span>
          )}
          <span className="ml-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${COLOR_CLASSES.text.destructive} hover:${COLOR_CLASSES.text.destructive} hover:bg-destructive/10`}
                    onClick={() => onRemove(item)}
                    {...testId(`${testIdPrefix}-remove-${config.name}-${item.id}`)}
                  >
                    <Trash2 className={ICON_SIZES.sm} />
                    <span className="sr-only">{dictionary.remove_association}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dictionary.remove_association || "Retirer"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
        </div>
      ))}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

/**
 * AssociationExpansion - Renders the expanded row content for an entity
 * 
 * Displays all configured associations with add/remove functionality.
 * Supports grouped display (like Policies grouping permissions by service/resource).
 * 
 * @example
 * ```tsx
 * <AssociationExpansion
 *   item={user}
 *   associations={[
 *     { type: "many-to-many", name: "roles", ... },
 *     { type: "many-to-many", name: "policies", ... }
 *   ]}
 *   onAdd={handleAddAssociation}
 *   onRemove={handleRemoveAssociation}
 *   dictionary={dict}
 * />
 * ```
 */
export function AssociationExpansion<
  T extends BaseItem,
  TAssociated extends BaseItem = BaseItem
>({
  item,
  associations,
  onAdd,
  onRemove,
  dictionary,
}: Readonly<AssociationExpansionProps<T, TAssociated>>) {
  const testIdPrefix = `expansion-${item.id}`;

  return (
    <div 
      className="px-4 py-3 bg-gray-50 space-y-4"
      {...testId(`${testIdPrefix}-content`)}
    >
      {associations.map((config) => {
        // Get associated items from parent item
        const associatedItems = (item[config.name as keyof T] as TAssociated[] | undefined) || [];
        
        return (
          <AssociationSection
            key={config.name}
            parentItem={item}
            config={config}
            associatedItems={associatedItems}
            onAdd={() => onAdd(item, config.name)}
            onRemove={(associatedItem) => onRemove(item, config.name, associatedItem)}
            dictionary={dictionary}
            testIdPrefix={testIdPrefix}
          />
        );
      })}
    </div>
  );
}
