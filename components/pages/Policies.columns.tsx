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

import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2, Plus } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DASHBOARD_TEST_IDS, testId } from '@/lib/test-ids';
import { ICON_SIZES, COLOR_CLASSES } from '@/lib/design-tokens';

// ==================== TYPES ====================
export type Permission = {
  id: string | number;
  service: string;
  resource_name: string;
  description: string;
  operation: string;
  created_at?: string;
  updated_at?: string;
};

export type Policy = {
  id: string | number;
  name: string;
  description?: string;
  permissions: Permission[];
  created_at?: string;
  updated_at?: string;
};

export type PoliciesDictionary = {
  table_name: string;
  table_description: string;
  table_permissions: string;
  table_created_at: string;
  table_updated_at: string;
  table_actions: string;
  edit_tooltip: string;
  delete_tooltip: string;
  add_permission_tooltip: string;
  operation_read: string;
  operation_create: string;
  operation_update: string;
  operation_delete: string;
  operation_list?: string;
};

// ==================== COLUMN FACTORY ====================
export interface PoliciesColumnFactoryOptions {
  dictionary: PoliciesDictionary;
  onEdit: (_policy: Policy) => void;
  onDelete: (_policy: Policy) => void;
  onAddPermission: (_policy: Policy) => void;
}

export function createPoliciesColumns({
  dictionary,
  onEdit,
  onDelete,
  onAddPermission,
}: PoliciesColumnFactoryOptions): ColumnDef<Policy>[] {
  return [
    // Name column with sorting
    {
      accessorKey: 'name',
      enableColumnFilter: true,
      header: ({ column }) => {
        return (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:text-foreground"
          >
            {dictionary.table_name}
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
          </button>
        );
      },
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },

    // Description column with sorting
    {
      accessorKey: 'description',
      enableColumnFilter: true,
      cell: ({ row }) => row.original.description || '-',
      filterFn: (row, _columnId, filterValue) => {
        const trimmedFilter = filterValue.toLowerCase().trim();
        if (trimmedFilter === '-') {
          return !row.original.description;
        }
        const description = row.original.description || '';
        return description.toLowerCase().includes(trimmedFilter);
      },
      header: ({ column }) => {
        return (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:text-foreground"
          >
            {dictionary.table_description}
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
          </button>
        );
      },
    },

    // Permissions count column
    {
      accessorKey: 'permissions',
      enableSorting: false,
      enableColumnFilter: false,
      header: dictionary.table_permissions,
      cell: ({ row }) => `${row.original.permissions?.length || 0} permission(s)`,
    },

    // Actions column with custom actions
    {
      id: 'actions',
      enableSorting: false,
      enableColumnFilter: false,
      header: () => <span className="text-right block">{dictionary.table_actions}</span>,
      cell: ({ row }) => (
        <div className="text-right space-x-2">
          {/* Add Permission Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onAddPermission(row.original)}
                className="p-1 hover:bg-gray-100 rounded inline-flex"
                {...testId(DASHBOARD_TEST_IDS.policies.addPermissionButton(row.original.id.toString()))}
              >
                <Plus className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.create}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{dictionary.add_permission_tooltip}</TooltipContent>
          </Tooltip>

          {/* Edit Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onEdit(row.original)}
                className="p-1 hover:bg-gray-100 rounded inline-flex"
                {...testId(DASHBOARD_TEST_IDS.policies.editButton(row.original.id.toString()))}
              >
                <Pencil className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.update}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{dictionary.edit_tooltip}</TooltipContent>
          </Tooltip>

          {/* Delete Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onDelete(row.original)}
                className="p-1 hover:bg-gray-100 rounded inline-flex"
                {...testId(DASHBOARD_TEST_IDS.policies.deleteButton(row.original.id.toString()))}
              >
                <Trash2 className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.delete}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{dictionary.delete_tooltip}</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];
}
