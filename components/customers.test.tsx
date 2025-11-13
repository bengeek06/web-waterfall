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
import Customers from './customers';
import { IDENTITY_ROUTES, BASIC_IO_ROUTES } from '@/lib/api-routes';

// Mock fetch globally
global.fetch = jest.fn();

// Mock dictionary for customers component
const mockCustomersDictionary = {
  page_title: "Clients",
  create_button: "Créer un client",
  import_button: "Importer depuis",
  export_button: "Exporter vers",
  import_json: "JSON",
  import_csv: "CSV",
  export_json: "JSON",
  export_csv: "CSV",
  table_name: "Nom",
  table_email: "Email",
  table_contact: "Contact",
  table_phone: "Téléphone",
  table_address: "Adresse",
  table_actions: "Actions",
  no_customers: "Aucun client trouvé",
  modal_create_title: "Créer un client",
  modal_edit_title: "Éditer le client",
  form_name: "Nom",
  form_name_required: "Nom *",
  form_email: "Email",
  form_contact: "Personne de contact",
  form_phone: "Téléphone",
  form_address: "Adresse",
  form_cancel: "Annuler",
  form_create: "Créer",
  form_save: "Mettre à jour",
  delete_confirm_title: "Confirmer la suppression",
  delete_confirm_message: "Supprimer ce client ?",
  delete_cancel: "Annuler",
  delete_confirm: "Supprimer",
  error_fetch: "Erreur lors de la récupération des clients",
  error_create: "Erreur lors de la création du client",
  error_update: "Erreur lors de la mise à jour du client",
  error_delete: "Erreur lors de la suppression du client",
};

describe('Customers Component', () => {
  const mockCustomers = [
    {
      id: 'customer-1',
      name: 'Acme Corp',
      email: 'contact@acme.com',
      contact_person: 'John Doe',
      phone_number: '+1234567890',
      address: '123 Main St',
      company_id: 'company-1',
    },
    {
      id: 'customer-2',
      name: 'Tech Solutions',
      email: 'info@techsolutions.com',
      contact_person: 'Jane Smith',
      phone_number: '+0987654321',
      address: '456 Tech Ave',
      company_id: 'company-1',
    },
  ];

  // Helper function to create a standard mock fetch implementation
  const createMockFetch = (customHandlers?: Record<string, unknown>) => {
    return (url: string, options?: RequestInit) => {
      // Check custom handlers first
      if (customHandlers && customHandlers[url]) {
        const handler = customHandlers[url];
        if (typeof handler === 'function') {
          return handler(url, options);
        }
        return Promise.resolve(handler);
      }

      // Default handlers
      if (url === IDENTITY_ROUTES.customers) {
        if (options?.method === 'POST') {
          const newCustomer = {
            id: 'customer-3',
            ...JSON.parse(options.body as string),
            company_id: 'company-1',
          };
          return Promise.resolve({
            ok: true,
            json: async () => newCustomer,
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockCustomers,
        } as Response);
      }

      if (url.startsWith(IDENTITY_ROUTES.customers + '/')) {
        if (options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'customer-1',
              ...JSON.parse(options.body as string),
            }),
          } as Response);
        }
        if (options?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          } as Response);
        }
      }

      // Export endpoint
      if (url.includes(BASIC_IO_ROUTES.export)) {
        const blob = new Blob([JSON.stringify(mockCustomers)], { type: 'application/json' });
        return Promise.resolve({
          ok: true,
          blob: async () => blob,
        } as Response);
      }

      // Import endpoint
      if (url.includes(BASIC_IO_ROUTES.import)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            import_report: {
              total: 2,
              success: 2,
              failed: 0,
              errors: [],
              warnings: [],
            },
            resolution_report: {
              resolved: 2,
              ambiguous: 0,
              missing: 0,
              errors: 0,
              details: [],
            },
          }),
        } as Response);
      }

      return Promise.reject(new Error(`Unhandled URL in mock: ${url}`));
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(createMockFetch());
  });

  describe('Initial Rendering', () => {
    it('should render the customers page with title', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);
      
      await waitFor(() => {
        expect(screen.getByText('Clients')).toBeInTheDocument();
      });
    });

    it('should fetch and display customers on mount', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('Tech Solutions')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        IDENTITY_ROUTES.customers,
        expect.any(Object)
      );
    });

    it('should display all action buttons', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId('customer-import-button')).toBeInTheDocument();
        expect(screen.getByTestId('customer-export-button')).toBeInTheDocument();
        expect(screen.getByTestId('customer-add-button')).toBeInTheDocument();
      });
    });

    it('should display error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        createMockFetch({
          [IDENTITY_ROUTES.customers]: Promise.resolve({
            ok: false,
            json: async () => ({ error: 'Network error' }),
          } as Response),
        })
      );

      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Erreur lors de la récupération des clients')).toBeInTheDocument();
      });
    });
  });

  describe('Create Customer', () => {
    it('should open create modal when create button is clicked', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const createButton = screen.getByTestId('customer-add-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Créer un client')).toBeInTheDocument();
        expect(screen.getByTestId('customer-name-input')).toBeInTheDocument();
      });
    });

    it('should create a new customer successfully', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Open create modal
      const createButton = screen.getByTestId('customer-add-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Créer un client')).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByTestId('customer-name-input');
      const emailInput = screen.getByTestId('customer-email-input');
      const contactInput = screen.getByTestId('customer-contact-input');
      const phoneInput = screen.getByTestId('customer-phone-input');
      const addressInput = screen.getByTestId('customer-address-input');

      fireEvent.change(nameInput, { target: { value: 'New Customer' } });
      fireEvent.change(emailInput, { target: { value: 'new@customer.com' } });
      fireEvent.change(contactInput, { target: { value: 'New Contact' } });
      fireEvent.change(phoneInput, { target: { value: '+1111111111' } });
      fireEvent.change(addressInput, { target: { value: '789 New St' } });

      // Submit form
      const submitButton = screen.getByTestId('customer-submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          IDENTITY_ROUTES.customers,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: expect.stringContaining('New Customer'),
          })
        );
      });
    });

    it('should display validation errors for required fields', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Open create modal
      const createButton = screen.getByTestId('customer-add-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Créer un client')).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const submitButton = screen.getByTestId('customer-submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Zod validation should trigger for required name field
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Customer', () => {
    it('should open edit modal when edit button is clicked', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const editButton = screen.getByTestId('customer-edit-customer-1');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Éditer le client')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
      });
    });

    it('should update customer successfully', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Open edit modal
      const editButton = screen.getByTestId('customer-edit-customer-1');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Éditer le client')).toBeInTheDocument();
      });

      // Update name
      const nameInput = screen.getByTestId('customer-name-input');
      fireEvent.change(nameInput, { target: { value: 'Updated Acme Corp' } });

      // Submit
      const submitButton = screen.getByTestId('customer-submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${IDENTITY_ROUTES.customers}/customer-1`,
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('Updated Acme Corp'),
          })
        );
      });
    });
  });

  describe('Delete Customer', () => {
    it('should show confirm dialog when delete button is clicked', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId('customer-delete-customer-1');
      fireEvent.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should delete customer when confirmed', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Click delete and confirm
      const deleteButton = screen.getByTestId('customer-delete-customer-1');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${IDENTITY_ROUTES.customers}/customer-1`,
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
      
      confirmSpy.mockRestore();
    });

    it('should cancel deletion when confirm is false', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Click delete but cancel
      const deleteButton = screen.getByTestId('customer-delete-customer-1');
      fireEvent.click(deleteButton);

      // Verify no DELETE call was made
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining(IDENTITY_ROUTES.customers),
        expect.objectContaining({ method: 'DELETE' })
      );
      
      confirmSpy.mockRestore();
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      // Mock URL methods for download
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      // Mock createElement only for 'a' tags (download links)
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          const mockLink = originalCreateElement('a');
          mockLink.click = jest.fn();
          mockLink.remove = jest.fn();
          return mockLink;
        }
        return originalCreateElement(tagName);
      });
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should open export dropdown when export button is clicked', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const exportButton = screen.getByTestId('customer-export-button');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('JSON')).toBeInTheDocument();
        expect(screen.getByText('CSV')).toBeInTheDocument();
      });
    });

    it('should export customers to JSON', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const exportButton = screen.getByTestId('customer-export-button');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('JSON')).toBeInTheDocument();
      });

      const jsonOption = screen.getByText('JSON');
      fireEvent.click(jsonOption);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(BASIC_IO_ROUTES.export),
          expect.any(Object)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('service=identity'),
          expect.any(Object)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('type=json'),
          expect.any(Object)
        );
      });
    });

    it('should export customers to CSV', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const exportButton = screen.getByTestId('customer-export-button');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('CSV')).toBeInTheDocument();
      });

      const csvOption = screen.getAllByText('CSV')[0]; // Get first CSV (from export)
      fireEvent.click(csvOption);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('type=csv'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Import Functionality', () => {
    let mockFileInput: HTMLInputElement;

    beforeEach(() => {
      // Create the mock input
      mockFileInput = document.createElement('input');
      mockFileInput.type = 'file';
      
      // Mock createElement only for 'input' tags (file upload)
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'input') {
          return mockFileInput;
        }
        return originalCreateElement(tagName);
      });
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should open import dropdown when import button is clicked', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const importButton = screen.getByTestId('customer-import-button');
      fireEvent.click(importButton);

      await waitFor(() => {
        const jsonOptions = screen.getAllByText('JSON');
        const csvOptions = screen.getAllByText('CSV');
        expect(jsonOptions.length).toBeGreaterThan(0);
        expect(csvOptions.length).toBeGreaterThan(0);
      });
    });

    it('should import customers from JSON file', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const importButton = screen.getByTestId('customer-import-button');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getAllByText('JSON').length).toBeGreaterThan(0);
      });

      const jsonImportOption = screen.getAllByText('JSON').find(el => 
        el.closest('[role="menuitem"]')
      );
      
      if (jsonImportOption) {
        fireEvent.click(jsonImportOption);
      }

      // Simulate file selection
      const file = new File([JSON.stringify(mockCustomers)], 'customers.json', {
        type: 'application/json',
      });

      Object.defineProperty(mockFileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(mockFileInput);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(BASIC_IO_ROUTES.import),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    it('should display import report dialog after successful import', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const importButton = screen.getByTestId('customer-import-button');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getAllByText('JSON').length).toBeGreaterThan(0);
      });

      const jsonImportOption = screen.getAllByText('JSON').find(el => 
        el.closest('[role="menuitem"]')
      );
      
      if (jsonImportOption) {
        fireEvent.click(jsonImportOption);
      }

      // Simulate file selection
      const file = new File([JSON.stringify(mockCustomers)], 'customers.json', {
        type: 'application/json',
      });

      Object.defineProperty(mockFileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(mockFileInput);

      await waitFor(() => {
        expect(screen.getByText('Rapport d\'import')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Total records
        expect(screen.getByText('Réussis')).toBeInTheDocument();
      });
    });
  });

  describe('Table Filtering and Sorting', () => {
    it('should filter customers by name', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('Tech Solutions')).toBeInTheDocument();
      });

      const nameFilter = screen.getByPlaceholderText('Filtrer...');
      fireEvent.change(nameFilter, { target: { value: 'Acme' } });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.queryByText('Tech Solutions')).not.toBeInTheDocument();
      });
    });

    it('should sort customers when column header is clicked', async () => {
      render(<Customers dictionary={mockCustomersDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Click on name column header
      const nameHeader = screen.getByText('Nom');
      fireEvent.click(nameHeader);

      // Table should re-render with sorted data (test just ensures no crash)
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });
    });
  });
});
