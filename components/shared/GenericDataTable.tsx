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

/**
 * GenericDataTable - Advanced data table component with full feature set
 * 
 * A comprehensive table component built on TanStack Table v8 with:
 * - **Sorting & Filtering**: Column-level sorting and filtering
 * - **Row Selection**: Checkbox-based selection (individual + select all)
 * - **Pagination**: Full pagination with customizable page sizes (10/25/50/100)
 * - **Bulk Operations**: Bulk delete with Dialog confirmation
 * - **Import/Export**: DropdownMenu-based import/export with JSON/CSV format selection
 * - **Loading States**: Spinner for loading, Empty component for no data
 * - **Internationalization**: Full i18n support via dictionary prop
 * - **Responsive Design**: Mobile-friendly with adaptive layouts
 * 
 * @example
 * ```tsx
 * <GenericDataTable
 *   columns={userColumns}
 *   data={users}
 *   isLoading={isLoading}
 *   dictionary={dict.common_table}
 *   onCreateClick={() => setShowCreateModal(true)}
 *   enableRowSelection={true}
 *   enableImportExport={true}
 *   onExport={(data, format) => exportToFile(data, format)}
 *   onImport={(format) => handleImport(format)}
 *   onBulkDelete={(ids) => deleteMultiple(ids)}
 * />
 * ```
 * 
 * @typeParam T - The type of data items in the table
 */

import { useState, useEffect, useRef, Fragment } from "react";

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
  RowSelectionState,
  PaginationState,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ButtonGroup } from "@/components/ui/button-group";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Upload, FileQuestion, Trash2, PlusCircle, AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, FileJson, FileSpreadsheet } from "lucide-react";

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
    filter_placeholder?: string;
    no_results?: string;
    loading?: string;
    export?: string;
    import?: string;
    delete_selected?: string;
    showing_results?: string;
    rows_per_page?: string;
    previous?: string;
    next?: string;
  };
  
  /** Callback when Create button is clicked */
  onCreateClick?: () => void;
  
  /** Enable import/export buttons */
  enableImportExport?: boolean;
  
  /** Callback for export action - receives selected rows if any, otherwise all data */
  onExport?: (_data: T[], _format: 'json' | 'csv') => void;
  
  /** Callback for import action */
  onImport?: (_format: 'json' | 'csv', _file?: File) => void | Promise<void>;
  
  /** Loading state for import operation */
  isImporting?: boolean;
  
  /** Loading state for export operation */
  isExporting?: boolean;
  
  /** Callback for bulk delete action */
  onBulkDelete?: (_selectedIds: (string | number)[]) => void | Promise<void>;
  
  /** Enable row selection (default: false) */
  enableRowSelection?: boolean;
  
  /** Enable per-column filtering (default: true) */
  enableColumnFilters?: boolean;
  
  /** Placeholder for filter inputs */
  filterPlaceholder?: string;
  
  /** Custom empty state component */
  emptyState?: React.ReactNode;
  
  /** Additional toolbar actions */
  toolbarActions?: React.ReactNode;
  
  /** Enable row expansion */
  enableRowExpansion?: boolean;
  
  /** Render function for expanded row content */
  renderExpandedRow?: (_item: T) => React.ReactNode;
  
  /** Callback when row expansion state changes */
  onRowExpansionChange?: (_expandedRows: Record<string | number, boolean>) => void;
  
  /** Initial expanded state */
  initialExpanded?: Record<string | number, boolean>;
}

// ==================== COMPONENT ====================

/**
 * Generic data table component with built-in features:
 * - Sorting per column
 * - Per-column filtering (optional)
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
 *     filter_placeholder: 'Filter...',
 *     no_results: 'No users found'
 *   }}
 *   onCreateClick={() => setShowModal(true)}
 *   enableColumnFilters={true}
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
  isImporting = false,
  isExporting = false,
  onBulkDelete,
  enableRowSelection = false,
  enableColumnFilters = true,
  filterPlaceholder,
  emptyState,
  toolbarActions,
  enableRowExpansion = false,
  renderExpandedRow,
  onRowExpansionChange,
  initialExpanded = {},
}: Readonly<GenericDataTableProps<T>>) {
  // ==================== STATE ====================
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<Record<string | number, boolean>>(initialExpanded);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<(string | number)[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Track previous data length to detect deletions
  const prevDataLengthRef = useRef(data.length);

  // Clear row selection when data changes (e.g., row deleted)
  // This prevents stale selections pointing to wrong rows after deletion
  useEffect(() => {
    if (data.length !== prevDataLengthRef.current) {
      setRowSelection({});
      prevDataLengthRef.current = data.length;
    }
  }, [data.length]);

  // ==================== EXPANSION HANDLERS ====================
  const toggleExpand = (id: string | number) => {
    setExpanded(prev => {
      const newExpanded = { ...prev, [id]: !prev[id] };
      onRowExpansionChange?.(newExpanded);
      return newExpanded;
    });
  };

  // ==================== EXPANSION COLUMN ====================
  const expansionColumn: ColumnDef<T> = {
    id: 'expand',
    header: '',
    cell: ({ row }) => {
      const item = row.original as { id?: string | number };
      const itemId = item.id;
      if (!itemId) return null;
      
      return (
        <button
          onClick={() => toggleExpand(itemId)}
          className="p-1 hover:bg-gray-100 rounded inline-flex"
          aria-label={expanded[itemId] ? 'Collapse row' : 'Expand row'}
        >
          {expanded[itemId] ? (
            <ChevronDown className={ICON_SIZES.sm} />
          ) : (
            <ChevronRight className={ICON_SIZES.sm} />
          )}
        </button>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
    size: 50,
  };

  // ==================== SELECTION COLUMN ====================
  const selectionColumn: ColumnDef<T> = {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableColumnFilter: false,
  };

  // Build final columns array with optional expansion and selection columns
  const finalColumns = [
    ...(enableRowSelection ? [selectionColumn] : []),
    ...(enableRowExpansion ? [expansionColumn] : []),
    ...columns,
  ];

  // ==================== TABLE INSTANCE ====================
  const table = useReactTable({
    data,
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    enableRowSelection: enableRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination,
    },
  });

  // ==================== HANDLERS ====================
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>, format: 'json' | 'csv') => {
    const file = event.target.files?.[0];
    if (file && onImport) {
      onImport(format, file);
      // Reset input to allow re-importing the same file
      event.target.value = '';
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;
    
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows
      .map(row => (row.original as { id?: string | number }).id)
      .filter((id): id is string | number => id !== undefined);
    
    if (selectedIds.length === 0) return;
    
    // Store IDs and show confirmation dialog
    setPendingDeleteIds(selectedIds);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!onBulkDelete || pendingDeleteIds.length === 0) return;
    
    await onBulkDelete(pendingDeleteIds);
    setRowSelection({});
    setShowDeleteDialog(false);
    setPendingDeleteIds([]);
  };

  const handleExport = (format: 'json' | 'csv') => {
    if (!onExport) return;
    
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const dataToExport = selectedRows.length > 0 
      ? selectedRows.map(row => row.original)
      : data;
    
    onExport(dataToExport, format);
  };

  const selectedCount = Object.keys(rowSelection).length;

  // ==================== RENDER ====================
  return (
    <div className={SPACING.component.md} {...testId(TABLE_TEST_IDS.genericTable.container)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4" {...testId(TABLE_TEST_IDS.genericTable.toolbar)}>
        <ButtonGroup>
          {/* Create Button */}
          {onCreateClick && (
            <Button 
              onClick={onCreateClick} 
              size="sm"
              {...testId(TABLE_TEST_IDS.genericTable.createButton)}
            >
              <PlusCircle className={`${SPACING.iconMargin.right} ${ICON_SIZES.sm}`} />
              {dictionary.create || "Create"}
            </Button>
          )}
          
          {/* Bulk Delete Button */}
          {enableRowSelection && selectedCount > 0 && onBulkDelete && (
            <Button 
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              data-testid="generic-table-bulk-delete-button"
            >
              <Trash2 className={`${SPACING.iconMargin.right} ${ICON_SIZES.sm}`} />
              {dictionary.delete_selected || "Delete"} ({selectedCount})
            </Button>
          )}
          
          {/* Custom Toolbar Actions */}
          {toolbarActions}
        </ButtonGroup>

        {/* Import/Export */}
        {enableImportExport && (
          <ButtonGroup>
            {onImport && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={isImporting}
                      {...testId(TABLE_TEST_IDS.genericTable.importButton)}
                    >
                      {isImporting ? (
                        <Spinner className={`${SPACING.iconMargin.right} ${ICON_SIZES.sm}`} />
                      ) : (
                        <Upload className={`${SPACING.iconMargin.right} ${ICON_SIZES.sm}`} />
                      )}
                      {dictionary.import || "Import"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => document.getElementById('file-import-json')?.click()}>
                      <FileJson className={`${SPACING.iconMargin.right} ${ICON_SIZES.sm}`} />
                      Import JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => document.getElementById('file-import-csv')?.click()}>
                      <FileSpreadsheet className={`${SPACING.iconMargin.right} ${ICON_SIZES.sm}`} />
                      Import CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <input
                  id="file-import-json"
                  type="file"
                  className="hidden"
                  accept=".json"
                  onChange={(e) => handleFileImport(e, 'json')}
                />
                <input
                  id="file-import-csv"
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={(e) => handleFileImport(e, 'csv')}
                />
              </>
            )}
            
            {onExport && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isExporting}
                    {...testId(TABLE_TEST_IDS.genericTable.exportButton)}
                  >
                    {isExporting ? (
                      <Spinner className={`${SPACING.iconMargin.right} ${ICON_SIZES.sm}`} />
                    ) : (
                      <Download className={`${SPACING.iconMargin.right} ${ICON_SIZES.sm}`} />
                    )}
                    {dictionary.export || "Export"}
                    {selectedCount > 0 && ` (${selectedCount})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    <FileJson className={`${SPACING.iconMargin.right} ${ICON_SIZES.sm}`} />
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileSpreadsheet className={`${SPACING.iconMargin.right} ${ICON_SIZES.sm}`} />
                    Export CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </ButtonGroup>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table {...testId(TABLE_TEST_IDS.genericTable.table)}>
          <TableHeader {...testId(TABLE_TEST_IDS.genericTable.tableHeader)}>
            {table.getHeaderGroups().map((headerGroup) => (
              <Fragment key={headerGroup.id}>
                {/* Header Row 1: Column Labels with Sorting */}
                <TableRow className="bg-muted/50">
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
                
                {/* Header Row 2: Column Filters */}
                {enableColumnFilters && (
                  <TableRow className="bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={`filter-${header.id}`}>
                        {header.column.getCanFilter() ? (
                          <Input
                            value={(header.column.getFilterValue() as string) ?? ""}
                            onChange={(e) => header.column.setFilterValue(e.target.value)}
                            placeholder={filterPlaceholder || dictionary.filter_placeholder || "Filtrer..."}
                            className="h-8 text-sm"
                            {...testId(`${TABLE_TEST_IDS.genericTable.table}-filter-${header.id}`)}
                          />
                        ) : null}
                      </TableHead>
                    ))}
                  </TableRow>
                )}
              </Fragment>
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
                    <Spinner />
                    <span className="text-muted-foreground">
                      {dictionary.loading || "Loading..."}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => {
                    const item = row.original as { id?: string | number };
                    const itemId = item.id;
                    const isExpanded = enableRowExpansion && itemId && expanded[itemId];
                    
                    return (
                      <Fragment key={row.id}>
                        <TableRow data-state={row.getIsSelected() && "selected"}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                        {isExpanded && renderExpandedRow && (
                          <TableRow>
                            <TableCell colSpan={finalColumns.length} className="p-0">
                              {renderExpandedRow(row.original)}
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                ) : (
                  <TableRow {...testId(TABLE_TEST_IDS.genericTable.emptyRow)}>
                    <TableCell
                      colSpan={columns.length}
                      className="h-64"
                    >
                      {emptyState || (
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <FileQuestion />
                            </EmptyMedia>
                            <EmptyTitle>
                              {dictionary.no_results || "No results found"}
                            </EmptyTitle>
                            <EmptyDescription>
                              Try adjusting your filters or create a new item
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && table.getPageCount() > 0 && (
        <div className="flex items-center justify-between px-2">
          {/* Results info */}
          <div className="text-xs text-muted-foreground">
            {dictionary.showing_results?.trim()
              ? dictionary.showing_results
                  .replace('{from}', String(table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1))
                  .replace('{to}', String(Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )))
                  .replace('{total}', String(table.getFilteredRowModel().rows.length))
              : `Showing ${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to ${
                  Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )
                } of ${table.getFilteredRowModel().rows.length} result(s)`}
          </div>

          {/* Pagination controls */}
          <div className="flex items-center gap-6">
            {/* Page size selector */}
            <div className="flex items-center gap-2">
              <p className="whitespace-nowrap text-xs text-muted-foreground">
                {dictionary.rows_per_page || "Rows per page"}
              </p>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
                className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {[10, 25, 50, 100].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>

            {/* Page navigation */}
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">{dictionary.previous || "Previous"}</span>
                  </Button>
                </PaginationItem>

                {/* Page numbers */}
                {(() => {
                  const currentPage = table.getState().pagination.pageIndex;
                  const pageCount = table.getPageCount();
                  const pages: (number | 'ellipsis')[] = [];

                  if (pageCount <= 7) {
                    // Show all pages if 7 or fewer
                    for (let i = 0; i < pageCount; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Always show first page
                    pages.push(0);

                    if (currentPage > 2) {
                      pages.push('ellipsis');
                    }

                    // Show pages around current page
                    for (let i = Math.max(1, currentPage - 1); i <= Math.min(pageCount - 2, currentPage + 1); i++) {
                      pages.push(i);
                    }

                    if (currentPage < pageCount - 3) {
                      pages.push('ellipsis');
                    }

                    // Always show last page
                    pages.push(pageCount - 1);
                  }

                  let ellipsisCount = 0;
                  return pages.map((page) => {
                    if (page === 'ellipsis') {
                      ellipsisCount++;
                      return (
                        <PaginationItem key={`ellipsis-${ellipsisCount}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            table.setPageIndex(page);
                          }}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  });
                })()}

                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <span className="hidden sm:inline">{dictionary.next || "Next"}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {pendingDeleteIds.length} selected item(s)? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete {pendingDeleteIds.length} item(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
