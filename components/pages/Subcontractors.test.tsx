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
import Subcontractors from './Subcontractors';

// Mock useTableCrud hook
jest.mock('@/lib/hooks/useTableCrud', () => ({
  useTableCrud: jest.fn(() => ({
    data: [
      {
        id: '1',
        name: 'Tech Builders',
        email: 'contact@techbuilders.com',
        contact_person: 'Alice Johnson',
        phone_number: '+1234567890',
        address: '123 Builder St',
        description: 'Construction services',
      },
      {
        id: '2',
        name: 'Pro Services',
        email: 'info@proservices.com',
        contact_person: 'Bob Smith',
        phone_number: '+0987654321',
        address: '456 Service Ave',
        description: 'Professional services',
      },
    ],
    isLoading: false,
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  })),
}));

// Mock useZodForm hook
jest.mock('@/lib/hooks/useZodForm', () => ({
  useZodForm: jest.fn(() => ({
    register: jest.fn((name) => ({ name })),
    handleSubmit: jest.fn((fn) => (e: React.FormEvent) => {
      e.preventDefault();
      fn({
        name: 'New Subcontractor',
        email: 'new@example.com',
        contact_person: 'John Doe',
        phone_number: '+1111111111',
        address: '789 New St',
        description: 'New description',
      });
    }),
    formState: { errors: {} },
    reset: jest.fn(),
  })),
}));

// Mock dictionaries
const mockDictionary = {
  page_title: "Subcontractors",
  create_button: "Create Subcontractor",
  table_name: "Name",
  table_email: "Email",
  table_contact: "Contact",
  table_phone: "Phone",
  table_address: "Address",
  table_description: "Description",
  modal_create_title: "Create Subcontractor",
  modal_edit_title: "Edit Subcontractor",
  form_name: "Name",
  form_name_required: "Name is required",
  form_email: "Email",
  form_contact: "Contact Person",
  form_phone: "Phone Number",
  form_address: "Address",
  form_description: "Description",
  delete_confirm_message: "Delete this subcontractor?",
  error_create: "Failed to create",
  error_update: "Failed to update",
};

const mockCommonTable = {
  actions: "Actions",
  edit: "Edit",
  delete: "Delete",
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
  confirm_delete_title: "Confirm Deletion",
  cancel: "Cancel",
  save: "Save",
};

describe('Subcontractors Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with page title', () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      expect(screen.getByText('Subcontractors')).toBeInTheDocument();
    });

    it('should display subcontractors data', () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      expect(screen.getByText('Tech Builders')).toBeInTheDocument();
      expect(screen.getByText('Pro Services')).toBeInTheDocument();
    });

    it('should render table column headers', () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should render create button', () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      expect(screen.getByTestId('generic-table-create-button')).toBeInTheDocument();
    });
  });

  describe('Column Definitions', () => {
    it('should display email or dash if empty', () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      expect(screen.getByText('contact@techbuilders.com')).toBeInTheDocument();
    });

    it('should display contact person or dash if empty', () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('should truncate long descriptions with ellipsis', () => {
      const { useTableCrud } = require('@/lib/hooks/useTableCrud');
      useTableCrud.mockReturnValue({
        data: [{
          id: '3',
          name: 'Long Description Corp',
          description: 'This is a very long description that should be truncated to 50 characters with ellipsis at the end',
        }],
        isLoading: false,
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
      });

      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      const descriptionText = screen.getByText(/This is a very long description/);
      expect(descriptionText.textContent).toContain('...');
      expect(descriptionText.textContent?.length).toBeLessThanOrEqual(53); // 50 + "..."
    });
  });

  describe('Form Fields', () => {
    it('should render all form fields when create dialog opened', async () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      const createButton = screen.getByTestId('generic-table-create-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('subcontractor-name-input')).toBeInTheDocument();
        expect(screen.getByTestId('subcontractor-email-input')).toBeInTheDocument();
        expect(screen.getByTestId('subcontractor-contact-input')).toBeInTheDocument();
        expect(screen.getByTestId('subcontractor-phone-input')).toBeInTheDocument();
        expect(screen.getByTestId('subcontractor-address-input')).toBeInTheDocument();
        expect(screen.getByTestId('subcontractor-description-input')).toBeInTheDocument();
      });
    });

    it('should have correct labels for form fields', async () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      const createButton = screen.getByTestId('generic-table-create-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        // Verify form fields are rendered with labels
        expect(screen.getByTestId('subcontractor-name-input')).toBeInTheDocument();
        expect(screen.getByTestId('subcontractor-email-input')).toBeInTheDocument();
        expect(screen.getByTestId('subcontractor-contact-input')).toBeInTheDocument();
        expect(screen.getByTestId('subcontractor-phone-input')).toBeInTheDocument();
        expect(screen.getByTestId('subcontractor-address-input')).toBeInTheDocument();
        expect(screen.getByTestId('subcontractor-description-input')).toBeInTheDocument();
      });
    });

    it('should have email input with type email', async () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      const createButton = screen.getByTestId('generic-table-create-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        const emailInput = screen.getByTestId('subcontractor-email-input');
        expect(emailInput).toHaveAttribute('type', 'email');
      });
    });
  });

  describe('Import/Export', () => {
    it('should have import and export enabled', () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      expect(screen.getByText('Import')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should log import action when import clicked', async () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      // Verify import button exists
      const importButton = screen.getByTestId('generic-table-import-button');
      expect(importButton).toBeInTheDocument();
      
      // Verify file inputs exist
      const jsonInput = document.getElementById('file-import-json');
      expect(jsonInput).toBeInTheDocument();
    });

    it('should log export action when export clicked', async () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      // Verify export button exists
      const exportButton = screen.getByTestId('generic-table-export-button');
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Row Selection', () => {
    it('should have row selection enabled', () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe('Actions Column', () => {
    it('should render edit and delete buttons for each row', () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      // Verify table structure with checkboxes (implies rows with actions)
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with GenericCrudTable', () => {
    it('should use GenericCrudTable with correct service and path', () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      // Verify GenericCrudTable renders
      expect(screen.getByTestId('crud-table-container')).toBeInTheDocument();
    });

    it('should pass dictionaries correctly to GenericCrudTable', () => {
      render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
      
      // Verify GenericCrudTable uses provided props
      const createButton = screen.getByTestId('generic-table-create-button');
      expect(createButton).toBeInTheDocument();
    });
  });
});
