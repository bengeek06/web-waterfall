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
import { GenericCrudTable } from './GenericCrudTable';
import { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';

// Test data type
interface TestItem {
  id: string;
  name: string;
  email: string;
}

// Test form type
interface TestFormData {
  name: string;
  email: string;
}

// Mock useTableCrud hook
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();

jest.mock('@/lib/hooks/useTableCrud', () => ({
  useTableCrud: jest.fn(() => ({
    data: [
      { id: '1', name: 'Alice Johnson', email: 'alice@example.com' },
      { id: '2', name: 'Bob Smith', email: 'bob@example.com' },
    ],
    isLoading: false,
    create: mockCreate,
    update: mockUpdate,
    remove: mockRemove,
  })),
}));

// Mock useZodForm hook
const mockRegister = jest.fn((name) => ({ name }));
const mockHandleSubmit = jest.fn((fn) => (e: React.FormEvent) => {
  e.preventDefault();
  fn({ name: 'Test Name', email: 'test@example.com' });
});
const mockReset = jest.fn();

jest.mock('@/lib/hooks/useZodForm', () => ({
  useZodForm: jest.fn(() => ({
    register: mockRegister,
    handleSubmit: mockHandleSubmit,
    formState: { errors: {} },
    reset: mockReset,
  })),
}));

// Test schema
const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

// Mock dictionaries
const mockDictionary = {
  create_button: 'Create Item',
  modal_create_title: 'Create New Item',
  modal_edit_title: 'Edit Item',
  delete_confirm_message: 'Delete this item?',
};

const mockCommonTable = {
  actions: 'Actions',
  edit: 'Edit',
  delete: 'Delete',
  create: 'Create',
  filter_placeholder: 'Filter...',
  no_results: 'No results found',
  loading: 'Loading...',
  export: 'Export',
  import: 'Import',
  delete_selected: 'Delete selected',
  showing_results: 'Showing {from} to {to} of {total} result(s)',
  rows_per_page: 'Rows per page',
  previous: 'Previous',
  next: 'Next',
  confirm_delete_title: 'Confirm Deletion',
  cancel: 'Cancel',
  save: 'Save',
};

// Mock columns factory
const mockColumnsFactory = (handlers: any): ColumnDef<TestItem>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div>
        <button onClick={() => handlers.onEdit(row.original)}>Edit</button>
        <button onClick={() => handlers.onDelete(row.original.id)}>Delete</button>
      </div>
    ),
  },
];

// Mock form fields renderer
const mockRenderFormFields = (form: any, dict: any) => (
  <>
    <div>
      <label htmlFor="name">Name</label>
      <input {...form.register('name')} data-testid="form-name-input" />
    </div>
    <div>
      <label htmlFor="email">Email</label>
      <input {...form.register('email')} data-testid="form-email-input" />
    </div>
  </>
);

describe('GenericCrudTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render table with data from useTableCrud', () => {
      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
        />
      );

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('should render page title', () => {
      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items Management"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
        />
      );

      expect(screen.getByText('Test Items Management')).toBeInTheDocument();
    });

    it('should render create button', () => {
      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
        />
      );

      expect(screen.getByTestId('generic-table-create-button')).toBeInTheDocument();
    });
  });

  describe('Create Modal', () => {
    it('should open create modal when create button clicked', async () => {
      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
        />
      );

      const createButton = screen.getByTestId('generic-table-create-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Item')).toBeInTheDocument();
      });
    });

    it('should render form fields in create modal', async () => {
      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
        />
      );

      const createButton = screen.getByTestId('generic-table-create-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('form-name-input')).toBeInTheDocument();
        expect(screen.getByTestId('form-email-input')).toBeInTheDocument();
      });
    });

    it('should call create function when form submitted', async () => {
      mockCreate.mockResolvedValue({ id: '3', name: 'Test Name', email: 'test@example.com' });

      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
        />
      );

      const createButton = screen.getByTestId('generic-table-create-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        const submitButton = screen.getByTestId('crud-table-submit-button');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({ name: 'Test Name', email: 'test@example.com' });
      });
    });

    it('should close modal after successful create', async () => {
      mockCreate.mockResolvedValue({ id: '3', name: 'Test Name', email: 'test@example.com' });

      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
        />
      );

      const createButton = screen.getByTestId('generic-table-create-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        const submitButton = screen.getByTestId('crud-table-submit-button');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Create New Item')).not.toBeInTheDocument();
      });
    });

    it('should close modal when cancel clicked', async () => {
      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
        />
      );

      const createButton = screen.getByTestId('generic-table-create-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Item')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Create New Item')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Modal', () => {
    it('should open edit modal when edit button clicked', async () => {
      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Item')).toBeInTheDocument();
      });
    });

    it('should call update function when edit form submitted', async () => {
      mockUpdate.mockResolvedValue({ id: '1', name: 'Test Name', email: 'test@example.com' });

      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith('1', { name: 'Test Name', email: 'test@example.com' });
      });
    });

    it('should close modal after successful update', async () => {
      mockUpdate.mockResolvedValue({ id: '1', name: 'Test Name', email: 'test@example.com' });

      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Edit Item')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Confirmation', () => {
    it('should open delete confirmation dialog when delete button clicked', async () => {
      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
        expect(screen.getByText('Delete this item?')).toBeInTheDocument();
      });
    });

    it('should call remove function when delete confirmed', async () => {
      mockRemove.mockResolvedValue(undefined);

      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        const confirmButtons = screen.getAllByText('Delete');
        // Find the one in the dialog (not the table button)
        const dialogDeleteButton = confirmButtons.find(btn => 
          btn.closest('[role="dialog"]')
        );
        if (dialogDeleteButton) {
          fireEvent.click(dialogDeleteButton);
        }
      });

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith('1');
      });
    });

    it('should not call remove when delete cancelled', async () => {
      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
      });

      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('should close dialog after successful delete', async () => {
      mockRemove.mockResolvedValue(undefined);

      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        const confirmButtons = screen.getAllByText('Delete');
        const dialogDeleteButton = confirmButtons.find(btn => 
          btn.closest('[role="dialog"]')
        );
        if (dialogDeleteButton) {
          fireEvent.click(dialogDeleteButton);
        }
      });

      await waitFor(() => {
        expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
      });
    });
  });

  describe('Import/Export', () => {
    it('should pass import/export handlers to GenericDataTable', () => {
      const handleImport = jest.fn();
      const handleExport = jest.fn();

      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
          enableImportExport={true}
          onImport={handleImport}
          onExport={handleExport}
        />
      );

      expect(screen.getByText('Import')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should have import functionality when enabled', async () => {
      const handleImport = jest.fn();

      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
          enableImportExport={true}
          onImport={handleImport}
        />
      );

      // Verify import button exists
      const importButton = screen.getByTestId('generic-table-import-button');
      expect(importButton).toBeInTheDocument();

      // Verify file inputs exist
      const jsonInput = document.getElementById('file-import-json');
      const csvInput = document.getElementById('file-import-csv');
      expect(jsonInput).toBeInTheDocument();
      expect(csvInput).toBeInTheDocument();
    });

    it('should have export functionality when enabled', async () => {
      const handleExport = jest.fn();

      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
          enableImportExport={true}
          onExport={handleExport}
        />
      );

      // Verify export button exists
      const exportButton = screen.getByTestId('generic-table-export-button');
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Data Transformation', () => {
    it('should apply transformFormData before create', async () => {
      const transformFormData = jest.fn((data) => ({
        ...data,
        name: data.name.toUpperCase(),
      }));

      mockCreate.mockResolvedValue({ id: '3', name: 'TEST NAME', email: 'test@example.com' });

      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
          transformFormData={transformFormData}
        />
      );

      const createButton = screen.getByTestId('generic-table-create-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        const submitButton = screen.getByTestId('crud-table-submit-button');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(transformFormData).toHaveBeenCalledWith({ name: 'Test Name', email: 'test@example.com' });
        expect(mockCreate).toHaveBeenCalledWith({ name: 'TEST NAME', email: 'test@example.com' });
      });
    });

    it('should apply transformFormData before update', async () => {
      const transformFormData = jest.fn((data) => ({
        ...data,
        email: data.email.toLowerCase(),
      }));

      mockUpdate.mockResolvedValue({ id: '1', name: 'Test Name', email: 'test@example.com' });

      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
          transformFormData={transformFormData}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(transformFormData).toHaveBeenCalled();
      });
    });
  });

  describe('Row Selection', () => {
    it('should enable row selection when enableRowSelection is true', () => {
      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
          enableRowSelection={true}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should not show checkboxes when enableRowSelection is false', () => {
      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
          enableRowSelection={false}
        />
      );

      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes).toHaveLength(0);
    });
  });

  describe('Test ID Prefix', () => {
    it('should use testIdPrefix for dialog test IDs', async () => {
      render(
        <GenericCrudTable<TestItem, TestFormData>
          service="identity"
          path="/test-items"
          columns={mockColumnsFactory}
          schema={testSchema}
          defaultFormValues={{ name: '', email: '' }}
          pageTitle="Test Items"
          dictionary={mockDictionary}
          commonTable={mockCommonTable}
          renderFormFields={mockRenderFormFields}
          testIdPrefix="custom-prefix"
        />
      );

      const createButton = screen.getByTestId('generic-table-create-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        const dialog = screen.getByTestId('custom-prefix-dialog');
        expect(dialog).toBeInTheDocument();
      });
    });
  });
});
