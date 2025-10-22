"use client";

import React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";

// UI Components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

// Constants
import { ADMIN_TEST_IDS, testId } from "@/lib/test-ids";

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
};

type UserDataTableProps = {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  dictionary: {
    columns: {
      email: string;
      first_name: string;
      last_name: string;
      phone_number: string;
      language: string;
      roles: string;
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
export function UserDataTable({ users, onEdit, onDelete, dictionary }: UserDataTableProps) {
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "email",
      header: dictionary.columns.email,
    },
    {
      accessorKey: "first_name",
      header: dictionary.columns.first_name,
    },
    {
      accessorKey: "last_name",
      header: dictionary.columns.last_name,
    },
    {
      accessorKey: "phone_number",
      header: dictionary.columns.phone_number,
    },
    {
      accessorKey: "language",
      header: dictionary.columns.language,
      cell: ({ row }) => row.original.language?.toUpperCase() || 'FR',
    },
    {
      accessorKey: "roles",
      header: dictionary.columns.roles,
      cell: ({ row }) => {
        const roles = row.original.roles || [];
        if (roles.length === 0) return "-";
        return roles.map(r => r.name).join(", ");
      },
    },
    {
      accessorKey: "is_active",
      header: dictionary.columns.is_active,
      cell: ({ row }) => (row.original.is_active ? dictionary.boolean.yes : dictionary.boolean.no),
    },
    {
      accessorKey: "is_verified",
      header: dictionary.columns.is_verified,
      cell: ({ row }) => (row.original.is_verified ? dictionary.boolean.yes : dictionary.boolean.no),
    },
    {
      accessorKey: "last_login_at",
      header: dictionary.columns.last_login_at,
    },
    {
      accessorKey: "created_at",
      header: dictionary.columns.created_at,
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
              <TableHead>{dictionary.columns.actions}</TableHead>
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
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(row.original)}
                      {...testId(ADMIN_TEST_IDS.users.editButton(row.original.id))}
                    >
                      {dictionary.actions.edit}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(row.original.id)}
                      {...testId(ADMIN_TEST_IDS.users.deleteButton(row.original.id))}
                    >
                      {dictionary.actions.delete}
                    </Button>
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
