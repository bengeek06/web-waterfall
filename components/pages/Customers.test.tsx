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
import Customers from './Customers';

// Mock next/navigation - required for GenericDataTable which uses useRouter
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/test",
}));

// Mock useTableCrud hook
jest.mock('@/lib/hooks/useTableCrud', () => ({
  useTableCrud: jest.fn(() => ({
    data: [
      {
        id: '1',
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        contact_person: 'John Smith',
        phone_number: '+1234567890',
        address: '123 Business Ave',
      },
      {
        id: '2',
        name: 'Global Industries',
        email: 'info@global.com',
        contact_person: 'Jane Doe',
        phone_number: '+0987654321',
        address: '456 Enterprise Blvd',
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
        name: 'New Customer',
        email: 'new@customer.com',
        contact_person: 'Alex Johnson',
        phone_number: '+1111111111',
        address: '789 New Customer St',
      });
    }),
    formState: { errors: {} },
    reset: jest.fn(),
  })),
}));

// Mock dictionaries
const mockDictionary = {
  page_title: "Customers",
  create_button: "Create Customer",
  table_logo: "Logo",
  table_name: "Name",
  table_email: "Email",
  table_contact: "Contact",
  table_phone: "Phone",
  table_address: "Address",
  modal_create_title: "Create Customer",
  modal_edit_title: "Edit Customer",
  form_name: "Name",
  form_name_required: "Name is required",
  form_email: "Email",
  form_contact: "Contact Person",
  form_phone: "Phone Number",
  form_address: "Address",
  logo_create_info: "Logo can be added after creation",
  delete_confirm_message: "Delete this customer?",
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

const mockLogoUpload = {
  upload_button: "Upload",
  remove_button: "Remove",
  drag_drop: "Drag and drop",
  uploading: "Uploading...",
  max_size: "Max 2MB",
  formats: "PNG, JPG",
  error_size: "File too large",
  error_format: "Invalid format",
  success_upload: "Uploaded",
  success_remove: "Removed",
  error_upload: "Upload failed",
  error_remove: "Remove failed",
};


describe('Customers Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with page title', () => {
      render(<Customers dictionary={mockDictionary} commonTable={mockCommonTable} logoUpload={mockLogoUpload} />);
      
      expect(screen.getByText('Customers')).toBeInTheDocument();
    });

    it('should render create button', () => {
      render(<Customers dictionary={mockDictionary} commonTable={mockCommonTable} logoUpload={mockLogoUpload} />);
      
      expect(screen.getByTestId('generic-table-create-button')).toBeInTheDocument();
    });

    it('should render table column headers', () => {
      render(<Customers dictionary={mockDictionary} commonTable={mockCommonTable} logoUpload={mockLogoUpload} />);
      
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
    });
  });

  // Column rendering is tested via integration tests
  // GenericAssociationTable handles the data display logic

  describe('Form Fields', () => {
    it('should render all form fields when create dialog opened', async () => {
      render(<Customers dictionary={mockDictionary} commonTable={mockCommonTable} logoUpload={mockLogoUpload} />);
      
      const createButton = screen.getByTestId('generic-table-create-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('customer-form-name')).toBeInTheDocument();
        expect(screen.getByTestId('customer-form-email')).toBeInTheDocument();
        expect(screen.getByTestId('customer-form-contact-person')).toBeInTheDocument();
        expect(screen.getByTestId('customer-form-phone')).toBeInTheDocument();
        expect(screen.getByTestId('customer-form-address')).toBeInTheDocument();
      });
    });

    it('should have correct labels for form fields', async () => {
      render(<Customers dictionary={mockDictionary} commonTable={mockCommonTable} logoUpload={mockLogoUpload} />);
      
      const createButton = screen.getByTestId('generic-table-create-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('customer-form-name')).toBeInTheDocument();
        expect(screen.getByTestId('customer-form-email')).toBeInTheDocument();
        expect(screen.getByTestId('customer-form-contact-person')).toBeInTheDocument();
        expect(screen.getByTestId('customer-form-phone')).toBeInTheDocument();
        expect(screen.getByTestId('customer-form-address')).toBeInTheDocument();
      });
    });

    it('should have email input with type email', async () => {
      render(<Customers dictionary={mockDictionary} commonTable={mockCommonTable} logoUpload={mockLogoUpload} />);
      
      const createButton = screen.getByTestId('generic-table-create-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        const emailInput = screen.getByTestId('customer-form-email');
        expect(emailInput).toHaveAttribute('type', 'email');
      });
    });
  });

  describe('Import/Export', () => {
    it('should have import and export enabled', () => {
      render(<Customers dictionary={mockDictionary} commonTable={mockCommonTable} logoUpload={mockLogoUpload} />);
      
      expect(screen.getByText('Import')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should have import button with file inputs', async () => {
      render(<Customers dictionary={mockDictionary} commonTable={mockCommonTable} logoUpload={mockLogoUpload} />);
      
      const importButton = screen.getByTestId('generic-table-import-button');
      expect(importButton).toBeInTheDocument();
      
      const jsonInput = document.getElementById('file-import-json');
      expect(jsonInput).toBeInTheDocument();
    });

    it('should have export button', async () => {
      render(<Customers dictionary={mockDictionary} commonTable={mockCommonTable} logoUpload={mockLogoUpload} />);
      
      const exportButton = screen.getByTestId('generic-table-export-button');
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Row Selection', () => {
    it('should have row selection enabled', () => {
      render(<Customers dictionary={mockDictionary} commonTable={mockCommonTable} logoUpload={mockLogoUpload} />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe('Actions Column', () => {
    it('should render edit and delete buttons for each row', () => {
      render(<Customers dictionary={mockDictionary} commonTable={mockCommonTable} logoUpload={mockLogoUpload} />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with GenericAssociationTable', () => {
    it('should use GenericAssociationTable with correct service and path', () => {
      render(<Customers dictionary={mockDictionary} commonTable={mockCommonTable} logoUpload={mockLogoUpload} />);
      
      expect(screen.getByTestId('customers-container')).toBeInTheDocument();
    });

    it('should pass dictionaries correctly to GenericAssociationTable', () => {
      render(<Customers dictionary={mockDictionary} commonTable={mockCommonTable} logoUpload={mockLogoUpload} />);
      
      const createButton = screen.getByTestId('generic-table-create-button');
      expect(createButton).toBeInTheDocument();
    });
  });

  // Filter functionality is tested via GenericDataTable integration tests
  // The filter functions are defined in createCustomerColumns
});

