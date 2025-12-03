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

import { useMemo } from "react";

// ==================== TYPES ====================

/**
 * Mapping definition: table dictionary key -> page dictionary key (supports dot notation)
 * Values can be direct keys of TPageDict or dot-notation paths as strings
 * 
 * Note: K is used in the mapped type declaration below
 */
type DictionaryMapping<TTableDict, TPageDict> = {
  // The K variable is used by TypeScript's mapped type syntax
  // eslint-disable-next-line no-unused-vars
  [K in keyof TTableDict]: keyof TPageDict | string;
};

// ==================== HELPERS ====================

/**
 * Get a nested value from an object using dot notation
 * @example getNestedValue(obj, "form.labels.name") => obj.form.labels.name
 */
function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

// ==================== HOOK ====================

/**
 * Maps page dictionary keys to table dictionary structure
 * 
 * Reduces boilerplate when creating dictionary objects for GenericAssociationTable.
 * Supports dot notation for nested values.
 * 
 * @typeParam TPageDict - The page dictionary type (from getDictionary)
 * @typeParam TTableDict - The table dictionary type (AssociationTableDictionary)
 * 
 * @param pageDict - The page dictionary object
 * @param mapping - Mapping of table keys to page dictionary keys
 * @returns The mapped table dictionary
 * 
 * @example Simple mapping
 * ```tsx
 * const USERS_DICT_MAPPING = {
 *   create: 'create_button',
 *   filter_placeholder: 'search_placeholder',
 *   no_results: 'empty_state',
 *   modal_create_title: 'form.create_title',
 *   modal_edit_title: 'form.edit_title',
 * };
 * 
 * const tableDictionary = useDictionaryMapping(dictionary, USERS_DICT_MAPPING);
 * ```
 * 
 * @example With common table strings
 * ```tsx
 * const tableDictionary = {
 *   ...dictionary.common_table,  // Shared table strings
 *   ...useDictionaryMapping(dictionary.admin_users, USERS_DICT_MAPPING),
 * };
 * ```
 */
export function useDictionaryMapping<
  TPageDict extends Record<string, unknown>,
  TTableDict extends Record<string, unknown>
>(
  pageDict: TPageDict,
  mapping: DictionaryMapping<TTableDict, TPageDict>
): TTableDict {
  return useMemo(() => {
    const result = {} as TTableDict;
    
    for (const [tableKey, pageKey] of Object.entries(mapping)) {
      const typedPageKey = pageKey as string;
      
      // Check if it's a nested path (contains dot)
      if (typedPageKey.includes(".")) {
        (result as Record<string, unknown>)[tableKey] = getNestedValue(pageDict, typedPageKey);
      } else {
        // Direct key access
        (result as Record<string, unknown>)[tableKey] = pageDict[typedPageKey as keyof TPageDict];
      }
    }
    
    return result;
  }, [pageDict, mapping]);
}
