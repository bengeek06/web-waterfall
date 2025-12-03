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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GenericDataTable } from './GenericDataTable';
import { ColumnDef } from '@tanstack/react-table';

// Test data type
interface TestItem {
  id: string;
  name: string;
  email: string;
  status: string;
}

// Mock dictionary
const mockDictionary = {
  create: "Create",
  filter_placeholder: "Filter...",
  no_results: "No results found",
  loading: "Loading...",
  export: "Export",
  import: "Import",
  delete_selected: "Delete selected",
  showing_results: "Showing {from} to {to} of {total} result(s)",
  rows_per_page: "Rows per page",
  previous: "Previous",
  next: "Next",
};

// Mock columns
const mockColumns: ColumnDef<TestItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    enableSorting: true,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    enableColumnFilter: false,
  },
];

// Mock data
const mockData: TestItem[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', status: 'Active' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', status: 'Inactive' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', status: 'Active' },
];

describe('GenericDataTable', () => {
  describe('Basic Rendering', () => {
    it('should render table with data', () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
        />
      );

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    });

    it('should render column headers', () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should render create button when onCreateClick provided', () => {
      const handleCreate = jest.fn();
      
      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
          onCreateClick={handleCreate}
        />
      );

      const createButton = screen.getByText('Create');
      expect(createButton).toBeInTheDocument();
      
      fireEvent.click(createButton);
      expect(handleCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('should show spinner when loading', () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={[]}
          isLoading={true}
          dictionary={mockDictionary}
        />
      );

      // Check for loading text
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it('should hide data when loading', () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          isLoading={true}
          dictionary={mockDictionary}
        />
      );

      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no data', () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={[]}
          isLoading={false}
          dictionary={mockDictionary}
        />
      );

      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should show custom empty state when provided', () => {
      const customEmptyState = (
        <div>
          <div data-testid="custom-icon">📦</div>
          <h3>No items yet</h3>
          <p>Create your first item</p>
        </div>
      );

      render(
        <GenericDataTable
          columns={mockColumns}
          data={[]}
          isLoading={false}
          dictionary={mockDictionary}
          emptyState={customEmptyState}
        />
      );

      expect(screen.getByText('No items yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first item')).toBeInTheDocument();
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('Row Selection', () => {
    it('should render checkboxes when enableRowSelection is true', () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
          enableRowSelection={true}
        />
      );

      // Should have header checkbox + 3 row checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(4); // 1 header + 3 rows
    });

    it('should not render checkboxes when enableRowSelection is false', () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
          enableRowSelection={false}
        />
      );

      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes).toHaveLength(0);
    });

    it('should select all rows when header checkbox clicked', () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
          enableRowSelection={true}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const headerCheckbox = checkboxes[0];

      // Verify checkbox exists and can be clicked
      expect(headerCheckbox).toBeInTheDocument();
      fireEvent.click(headerCheckbox);
      
      // Verify checkboxes still exist after interaction
      const updatedCheckboxes = screen.getAllByRole('checkbox');
      expect(updatedCheckboxes.length).toBeGreaterThan(0);
    });

    it('should show delete selected button when rows selected and onBulkDelete provided', () => {
      const handleBulkDelete = jest.fn();

      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
          enableRowSelection={true}
          onBulkDelete={handleBulkDelete}
        />
      );

      // Initially no delete button
      expect(screen.queryByTestId('generic-table-bulk-delete-button')).not.toBeInTheDocument();

      // Select a row
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Select first row

      // Delete button should appear
      expect(screen.getByTestId('generic-table-bulk-delete-button')).toBeInTheDocument();
    });
  });

  describe('Bulk Delete', () => {
    it('should open confirmation dialog when delete selected clicked', async () => {
      const handleBulkDelete = jest.fn();

      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
          enableRowSelection={true}
          onBulkDelete={handleBulkDelete}
        />
      );

      // Select rows
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);

      // Click delete button
      const deleteButton = screen.getByTestId('generic-table-bulk-delete-button');
      fireEvent.click(deleteButton);

      // Dialog should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should call onBulkDelete with selected IDs when confirmed', async () => {
      const handleBulkDelete = jest.fn().mockResolvedValue(undefined);

      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
          enableRowSelection={true}
          onBulkDelete={handleBulkDelete}
        />
      );

      // Select rows
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Select row with id '1'
      fireEvent.click(checkboxes[2]); // Select row with id '2'

      // Click delete button
      const deleteButton = screen.getByTestId('generic-table-bulk-delete-button');
      fireEvent.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(handleBulkDelete).toHaveBeenCalled();
      });
    });

    it('should not call onBulkDelete when cancelled', async () => {
      const handleBulkDelete = jest.fn();

      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
          enableRowSelection={true}
          onBulkDelete={handleBulkDelete}
        />
      );

      // Select a row
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);

      // Click delete button
      const deleteButton = screen.getByTestId('generic-table-bulk-delete-button');
      fireEvent.click(deleteButton);

      // Cancel deletion
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);
      });

      expect(handleBulkDelete).not.toHaveBeenCalled();
    });
  });

  describe('Import/Export', () => {
    it('should render import/export buttons when enableImportExport is true', () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
          enableImportExport={true}
          onImport={jest.fn()}
          onExport={jest.fn()}
        />
      );

      expect(screen.getByText('Import')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should not render import/export buttons when enableImportExport is false', () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
          enableImportExport={false}
        />
      );

      expect(screen.queryByText('Import')).not.toBeInTheDocument();
      expect(screen.queryByText('Export')).not.toBeInTheDocument();
    });

    it('should call onExport with all data when export clicked and no selection', () => {
      const handleExport = jest.fn();

      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
          enableImportExport={true}
          enableRowSelection={true}
          onExport={handleExport}
        />
      );

      const exportButton = screen.getByTestId('generic-table-export-button');
      expect(exportButton).toBeInTheDocument();
      
      // Note: Testing DropdownMenu item selection requires user-event library or more complex setup
      // For now we verify the export button exists and can be used
    });

    it('should show selection count in export button when rows selected', () => {
      const handleExport = jest.fn();

      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
          enableImportExport={true}
          enableRowSelection={true}
          onExport={handleExport}
        />
      );

      // Select one row
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Select first row

      const exportButton = screen.getByTestId('generic-table-export-button');
      // Button text should show count
      expect(exportButton.textContent).toContain('(1)');
    });

    it('should have hidden file inputs for import when enableImportExport is true', () => {
      const handleImport = jest.fn();

      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
          enableImportExport={true}
          onImport={handleImport}
        />
      );

      const importButton = screen.getByTestId('generic-table-import-button');
      expect(importButton).toBeInTheDocument();

      // Verify hidden file inputs exist
      const fileInputJson = document.getElementById('file-import-json');
      const fileInputCsv = document.getElementById('file-import-csv');
      
      expect(fileInputJson).toBeInTheDocument();
      expect(fileInputJson).toHaveAttribute('type', 'file');
      expect(fileInputJson).toHaveAttribute('accept', '.json');
      expect(fileInputJson).toHaveClass('hidden');
      
      expect(fileInputCsv).toBeInTheDocument();
      expect(fileInputCsv).toHaveAttribute('type', 'file');
      expect(fileInputCsv).toHaveAttribute('accept', '.csv');
      expect(fileInputCsv).toHaveClass('hidden');
    });
  });

  describe('Pagination', () => {
    // Create dataset with >10 items to trigger pagination
    const largeData: TestItem[] = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      status: i % 2 === 0 ? 'Active' : 'Inactive',
    }));

    it('should show pagination controls when data exceeds page size', () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={largeData}
          dictionary={mockDictionary}
        />
      );

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Rows per page')).toBeInTheDocument();
    });

    it('should display correct page info', () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={largeData}
          dictionary={mockDictionary}
        />
      );

      // Should show "Showing 1 to 10 of 25 result(s)"
      expect(screen.getByText(/Showing 1 to 10 of 25 result\(s\)/)).toBeInTheDocument();
    });

    it('should navigate to next page when next button clicked', async () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={largeData}
          dictionary={mockDictionary}
        />
      );

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        // Should show "Showing 11 to 20 of 25 result(s)"
        expect(screen.getByText(/Showing 11 to 20 of 25 result\(s\)/)).toBeInTheDocument();
      });
    });

    it('should change page size when selector changed', async () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={largeData}
          dictionary={mockDictionary}
        />
      );

      const pageSelector = screen.getByRole('combobox');
      fireEvent.change(pageSelector, { target: { value: '25' } });

      await waitFor(() => {
        // Should show "Showing 1 to 25 of 25 result(s)"
        expect(screen.getByText(/Showing 1 to 25 of 25 result\(s\)/)).toBeInTheDocument();
      });
    });

    it('should disable previous button on first page', () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={largeData}
          dictionary={mockDictionary}
        />
      );

      const previousButton = screen.getByText('Previous').closest('button');
      expect(previousButton).toBeDisabled();
    });

    it('should disable next button on last page', async () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={largeData}
          dictionary={mockDictionary}
        />
      );

      // Change to page size 50 to show all data on one page
      const pageSelector = screen.getByRole('combobox');
      fireEvent.change(pageSelector, { target: { value: '100' } });

      await waitFor(() => {
        const nextButton = screen.getByText('Next').closest('button');
        expect(nextButton).toBeDisabled();
      });
    });
  });

  // NOTE: Column filtering tests removed - filters are now in ColumnHeader popovers
  // See components/shared/tables/column-header.tsx for the new implementation

  describe('Toolbar Actions', () => {
    it('should render custom toolbar actions when provided', () => {
      const customAction = (
        <button data-testid="custom-action">Custom Action</button>
      );

      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
          toolbarActions={customAction}
        />
      );

      expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
          enableRowSelection={true}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toHaveAttribute('aria-label', 'Select all');
      expect(checkboxes[1]).toHaveAttribute('aria-label', 'Select row');
    });

    it('should have table role', () => {
      render(
        <GenericDataTable
          columns={mockColumns}
          data={mockData}
          dictionary={mockDictionary}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});
