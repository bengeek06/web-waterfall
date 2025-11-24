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

import { useState } from "react";

// UI Components
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Download, Upload, Loader2 } from "lucide-react";

// Constants
import { TABLE_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES, SPACING } from "@/lib/design-tokens";

// ==================== TYPES ====================

export interface GenericDataTableProps<T> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  
  /** Data array */
  data: T[];
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Dictionary for UI strings */
  dictionary: {
    create?: string;
    search?: string;
    no_results?: string;
    loading?: string;
    export?: string;
    import?: string;
  };
  
  /** Callback when Create button is clicked */
  onCreateClick?: () => void;
  
  /** Enable import/export buttons */
  enableImportExport?: boolean;
  
  /** Callback for export action */
  onExport?: () => void;
  
  /** Callback for import action */
  onImport?: (_file: File) => void;
  
  /** Key to use for global search filter */
  searchKey?: string;
  
  /** Placeholder for search input */
  searchPlaceholder?: string;
  
  /** Custom empty state component */
  emptyState?: React.ReactNode;
  
  /** Additional toolbar actions */
  toolbarActions?: React.ReactNode;
}

// ==================== COMPONENT ====================

/**
 * Generic data table component with built-in features:
 * - Sorting
 * - Global search
 * - Create button
 * - Import/Export buttons
 * - Loading state
 * - Empty state
 * 
 * @example
 * ```tsx
 * <GenericDataTable
 *   columns={userColumns}
 *   data={users}
 *   isLoading={isLoading}
 *   dictionary={{
 *     create: 'Create User',
 *     search: 'Search users...',
 *     no_results: 'No users found'
 *   }}
 *   onCreateClick={() => setShowModal(true)}
 *   searchKey="email"
 * />
 * ```
 */
export function GenericDataTable<T>({
  columns,
  data,
  isLoading = false,
  dictionary,
  onCreateClick,
  enableImportExport = false,
  onExport,
  onImport,
  searchKey,
  searchPlaceholder,
  emptyState,
  toolbarActions,
}: Readonly<GenericDataTableProps<T>>) {
  // ==================== STATE ====================
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // ==================== TABLE INSTANCE ====================
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  // ==================== HANDLERS ====================
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImport) {
      onImport(file);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className={SPACING.component.md} {...testId(TABLE_TEST_IDS.genericTable.container)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4" {...testId(TABLE_TEST_IDS.genericTable.toolbar)}>
        <div className={`flex items-center ${SPACING.gap.sm}`}>
          {/* Create Button */}
          {onCreateClick && (
            <Button onClick={onCreateClick} {...testId(TABLE_TEST_IDS.genericTable.createButton)}>
              <Plus className={`mr-2 ${ICON_SIZES.sm}`} />
              {dictionary.create || "Create"}
            </Button>
          )}
          
          {/* Custom Toolbar Actions */}
          {toolbarActions && (
            <div {...testId(TABLE_TEST_IDS.genericTable.toolbarActions)}>
              {toolbarActions}
            </div>
          )}
        </div>

        <div className={`flex items-center ${SPACING.gap.sm}`}>
          {/* Import/Export */}
          {enableImportExport && (
            <>
              {onImport && (
                <label htmlFor="file-import">
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className={`mr-2 ${ICON_SIZES.sm}`} />
                      {dictionary.import || "Import"}
                    </span>
                  </Button>
                  <input
                    id="file-import"
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.json"
                    onChange={handleFileImport}
                    {...testId(TABLE_TEST_IDS.genericTable.importInput)}
                  />
                </label>
              )}
              
              {onExport && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onExport}
                  {...testId(TABLE_TEST_IDS.genericTable.exportButton)}
                >
                  <Download className={`mr-2 ${ICON_SIZES.sm}`} />
                  {dictionary.export || "Export"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Search */}
      {searchKey && (
        <Input
          placeholder={searchPlaceholder || dictionary.search || "Search..."}
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
          {...testId(TABLE_TEST_IDS.genericTable.searchInput)}
        />
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table {...testId(TABLE_TEST_IDS.genericTable.table)}>
          <TableHeader {...testId(TABLE_TEST_IDS.genericTable.tableHeader)}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          
          <TableBody {...testId(TABLE_TEST_IDS.genericTable.tableBody)}>
            {isLoading ? (
              <TableRow {...testId(TABLE_TEST_IDS.genericTable.loadingRow)}>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className={`flex items-center justify-center ${SPACING.gap.sm}`}>
                    <Loader2 className={`${ICON_SIZES.sm} animate-spin`} />
                    <span className="text-muted-foreground">
                      {dictionary.loading || "Loading..."}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow {...testId(TABLE_TEST_IDS.genericTable.emptyRow)}>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {emptyState || (
                        <div className="text-muted-foreground">
                          {dictionary.no_results || "No results found"}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results Count */}
      {!isLoading && table.getRowModel().rows?.length > 0 && (
        <div 
          className="text-xs text-muted-foreground"
          {...testId(TABLE_TEST_IDS.genericTable.resultsCount)}
        >
          Showing {table.getRowModel().rows.length} of {data.length} result(s)
        </div>
      )}
    </div>
  );
}
