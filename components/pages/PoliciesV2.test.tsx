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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PoliciesV2 from './PoliciesV2';
import { DASHBOARD_TEST_IDS } from '@/lib/test-ids';
import { GUARDIAN_ROUTES } from '@/lib/api-routes';

// Mock SWR to avoid async issues
jest.mock('swr', () => {
  const mockData = [
    { id: '1', name: 'Admin Policy', description: 'Full admin access' },
    { id: '2', name: 'Read Only', description: 'Read only access' },
  ];
  
  return jest.fn(() => ({
    data: mockData,
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: jest.fn(),
  }));
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock ResizeObserver (required by Radix UI tooltips)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock dictionary
const mockDictionary = {
  page_title: "Policies Management",
  create_button: "Create",
  import_button: "Import",
  export_button: "Export",
  table_name: "Name",
  table_description: "Description",
  table_permissions: "Permissions",
  table_actions: "Actions",
  no_policies: "No policies",
  modal_create_title: "Create Policy",
  modal_edit_title: "Edit Policy",
  form_name: "Name",
  form_name_required: "Name *",
  form_description: "Description",
  form_cancel: "Cancel",
  form_create: "Create",
  form_save: "Save",
  permissions_modal_title: "Manage Permissions",
  permissions_select: "Select permissions",
  permissions_save: "Save",
  operation_create: "Create (CREATE)",
  operation_read: "Read (READ)",
  operation_update: "Update (UPDATE)",
  operation_delete: "Delete (DELETE)",
  operation_list: "List (LIST)",
  delete_confirm_title: "Confirm deletion",
  delete_confirm_message: "Are you sure you want to delete this policy?",
  delete_cancel: "Cancel",
  delete_confirm: "Delete",
  delete_selected: "Delete selected",
  edit_tooltip: "Edit policy",
  delete_tooltip: "Delete policy",
  add_permission_tooltip: "Add permission",
  filter_placeholder: "Filter policies...",
  error_fetch: "Error fetching data",
  error_create: "Error creating",
  error_update: "Error updating",
  error_delete: "Error deleting",
  error_export: "Error exporting",
  error_import: "Error importing",
  import_report_title: "Import Report",
  import_report_close: "Close",
  import_report_total: "Total",
  import_report_success: "Success",
  import_report_failed: "Failed",
  import_report_errors: "Errors",
  import_report_warnings: "Warnings",
  errors: {
    network: "Network connection problem",
    unauthorized: "Session expired",
    forbidden: "Permission denied",
    notFound: "Resource not found",
    serverError: "Server error",
    clientError: "Invalid request",
    unknown: "An error occurred",
  },
};

// Mock permissions for permission dialog
const mockPermissions = [
  { id: 1, service: 'auth', resource_name: 'users', operation: 'READ', description: 'Read users' },
  { id: 2, service: 'auth', resource_name: 'users', operation: 'CREATE', description: 'Create users' },
  { id: 3, service: 'guardian', resource_name: 'roles', operation: 'LIST', description: 'List roles' },
];

describe('PoliciesV2 Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default fetch mock
    mockFetch.mockImplementation((url: string) => {
      if (url === GUARDIAN_ROUTES.permissions) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPermissions),
        });
      }
      // Policy permissions endpoints
      if (url.includes('/policies/') && url.includes('/permissions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });
  });

  describe('Initial Render', () => {
    it('should render the page title', async () => {
      render(<PoliciesV2 dictionary={mockDictionary} />);
      
      await waitFor(() => {
        expect(screen.getByText('Policies Management')).toBeInTheDocument();
      });
    });

    it('should render the create button', async () => {
      render(<PoliciesV2 dictionary={mockDictionary} />);
      
      await waitFor(() => {
        expect(screen.getByText('Create')).toBeInTheDocument();
      });
    });

    it('should render policies from SWR data', async () => {
      render(<PoliciesV2 dictionary={mockDictionary} />);
      
      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
        expect(screen.getByText('Read Only')).toBeInTheDocument();
      });
    });
  });

  describe('Test IDs', () => {
    it('should have edit button with correct test ID', async () => {
      render(<PoliciesV2 dictionary={mockDictionary} />);
      
      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.editButton('1'))).toBeInTheDocument();
      });
    });

    it('should have delete button with correct test ID', async () => {
      render(<PoliciesV2 dictionary={mockDictionary} />);
      
      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.deleteButton('1'))).toBeInTheDocument();
      });
    });

    it('should have add permission button with correct test ID', async () => {
      render(<PoliciesV2 dictionary={mockDictionary} />);
      
      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionButton('1'))).toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons', () => {
    it('should have tooltips configured on action buttons', async () => {
      render(<PoliciesV2 dictionary={mockDictionary} />);
      
      await waitFor(() => {
        // Verify buttons exist and have sr-only text for accessibility
        const editButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.editButton('1'));
        expect(editButton.querySelector('.sr-only')).toHaveTextContent('Edit policy');
        
        const deleteButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.deleteButton('1'));
        expect(deleteButton.querySelector('.sr-only')).toHaveTextContent('Delete policy');
        
        const addPermButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionButton('1'));
        expect(addPermButton.querySelector('.sr-only')).toHaveTextContent('Add permission');
      });
    });
  });

  describe('Permission Dialog', () => {
    it('should open permission dialog when add permission button is clicked', async () => {
      render(<PoliciesV2 dictionary={mockDictionary} />);
      
      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionButton('1'))).toBeInTheDocument();
      });

      const addPermissionButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionButton('1'));
      await user.click(addPermissionButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Design Tokens', () => {
    it('should use ICON_SIZES for action icons', async () => {
      render(<PoliciesV2 dictionary={mockDictionary} />);
      
      await waitFor(() => {
        const editButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.editButton('1'));
        // The Edit icon should have the sm size class (w-4 h-4)
        const icon = editButton.querySelector('svg');
        expect(icon).toHaveClass('w-4', 'h-4');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle permission fetch errors gracefully', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url === GUARDIAN_ROUTES.permissions) {
          return Promise.resolve({
            ok: false,
            status: 500,
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      });

      render(<PoliciesV2 dictionary={mockDictionary} />);
      
      // Component should still render despite permission fetch error
      await waitFor(() => {
        expect(screen.getByText('Policies Management')).toBeInTheDocument();
      });
    });
  });

  describe('Table Columns', () => {
    it('should display name column', async () => {
      render(<PoliciesV2 dictionary={mockDictionary} />);
      
      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
      });
    });

    it('should display description column', async () => {
      render(<PoliciesV2 dictionary={mockDictionary} />);
      
      await waitFor(() => {
        expect(screen.getByText('Description')).toBeInTheDocument();
      });
    });

    it('should display permissions column', async () => {
      render(<PoliciesV2 dictionary={mockDictionary} />);
      
      await waitFor(() => {
        expect(screen.getByText('Permissions')).toBeInTheDocument();
      });
    });

    it('should display actions column', async () => {
      render(<PoliciesV2 dictionary={mockDictionary} />);
      
      await waitFor(() => {
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });
  });

  describe('i18n Integration', () => {
    it('should use translated page title', async () => {
      const frenchDict = {
        ...mockDictionary,
        page_title: "Gestion des politiques",
      };
      
      render(<PoliciesV2 dictionary={frenchDict} />);
      
      await waitFor(() => {
        expect(screen.getByText('Gestion des politiques')).toBeInTheDocument();
      });
    });

    it('should use translated column headers', async () => {
      const frenchDict = {
        ...mockDictionary,
        table_name: "Nom",
        table_description: "Description",
        table_permissions: "Permissions",
        table_actions: "Actions",
      };
      
      render(<PoliciesV2 dictionary={frenchDict} />);
      
      await waitFor(() => {
        expect(screen.getByText('Nom')).toBeInTheDocument();
      });
    });
  });
});
