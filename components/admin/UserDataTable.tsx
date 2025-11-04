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

import React, { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";

// UI Components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

// Constants
import { ADMIN_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES, COLOR_CLASSES } from "@/lib/design-tokens";

// Types
export type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar_url?: string;
  language?: 'en' | 'fr';
  is_active: boolean;
  is_verified: boolean;
  last_login_at?: string;
  created_at?: string;
  roles?: Array<{ id: string; name: string }>;
  position_id?: string;  // User has ONE position
  position?: { id: string; title: string };  // Position details for display
};

type UserDataTableProps = {
  users: User[];
  onEdit: (_user: User) => void;
  onDelete: (_userId: string) => void;
  onToggleActive: (_userId: string, _isActive: boolean) => Promise<void>;
  dictionary: {
    columns: {
      email: string;
      first_name: string;
      last_name: string;
      phone_number: string;
      language: string;
      roles: string;
      positions: string;
      is_active: string;
      is_verified: string;
      last_login_at: string;
      created_at: string;
      actions: string;
    };
    boolean: {
      yes: string;
      no: string;
    };
    actions: {
      edit: string;
      delete: string;
    };
    no_users: string;
  };
};

// ==================== COMPONENT ====================
export function UserDataTable({ users, onEdit, onDelete, onToggleActive, dictionary }: Readonly<UserDataTableProps>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {dictionary.columns.email}
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
          </button>
        );
      },
    },
    {
      accessorKey: "first_name",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {dictionary.columns.first_name}
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
          </button>
        );
      },
    },
    {
      accessorKey: "last_name",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {dictionary.columns.last_name}
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
          </button>
        );
      },
    },
    {
      accessorKey: "roles",
      header: dictionary.columns.roles,
      cell: ({ row }) => {
        const roles = row.original.roles || [];
        if (roles.length === 0) return "-";
        return roles.map(r => r.name).join(", ");
      },
      enableSorting: false,
    },
    {
      accessorKey: "is_active",
      header: dictionary.columns.is_active,
      cell: ({ row }) => (
        <Switch
          checked={row.original.is_active}
          onCheckedChange={(checked) => onToggleActive(row.original.id, checked)}
          aria-label={dictionary.columns.is_active}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "last_login_at",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {dictionary.columns.last_login_at}
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
          </button>
        );
      },
      cell: ({ row }) => {
        const date = row.original.last_login_at;
        if (!date) return "-";
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      },
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.original.last_login_at;
        const dateB = rowB.original.last_login_at;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {dictionary.columns.created_at}
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
          </button>
        );
      },
      cell: ({ row }) => {
        const date = row.original.created_at;
        if (!date) return "-";
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      },
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.original.created_at;
        const dateB = rowB.original.created_at;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      },
    },
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border" {...testId(ADMIN_TEST_IDS.users.table)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
              <TableHead className="text-right">{dictionary.columns.actions}</TableHead>
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} {...testId(ADMIN_TEST_IDS.users.tableRow(row.original.id))}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onEdit(row.original)}
                          className="p-1 hover:bg-gray-100 rounded"
                          aria-label={dictionary.actions.edit}
                          {...testId(ADMIN_TEST_IDS.users.editButton(row.original.id))}
                        >
                          <Pencil className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.update}`} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{dictionary.actions.edit}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onDelete(row.original.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          aria-label={dictionary.actions.delete}
                          {...testId(ADMIN_TEST_IDS.users.deleteButton(row.original.id))}
                        >
                          <Trash2 className={`${ICON_SIZES.sm} ${COLOR_CLASSES.operations.delete}`} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{dictionary.actions.delete}</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                {dictionary.no_users}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
