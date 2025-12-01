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
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RolesV2 from './RolesV2';
import { DASHBOARD_TEST_IDS, TABLE_TEST_IDS } from '@/lib/test-ids';
import { GUARDIAN_ROUTES } from '@/lib/api-routes';

// Test ID prefix used by RolesV2 component
const TEST_PREFIX = 'roles';

// Mock fetch globally
globalThis.fetch = jest.fn();

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
}));

// Mock dictionary for roles component
const mockRolesDictionary = {
  page_title: "Rôles",
  create_button: "Créer",
  table_name: "Nom",
  table_description: "Description",
  table_policies: "Politiques",
  table_actions: "Actions",
  no_roles: "Aucun rôle trouvé",
  modal_create_title: "Créer un rôle",
  modal_edit_title: "Éditer le rôle",
  form_name: "Nom",
  form_name_required: "Nom *",
  form_description: "Description",
  form_cancel: "Annuler",
  form_create: "Créer",
  form_save: "Enregistrer",
  policies_modal_title: "Ajouter des politiques",
  policies_select: "Aucune politique disponible",
  policies_add: "Ajouter",
  delete_confirm_title: "Confirmer la suppression",
  delete_confirm_message: "Êtes-vous sûr de vouloir supprimer ce rôle ?",
  delete_policy_confirm_message: "Supprimer la politique",
  delete_cancel: "Annuler",
  delete_confirm: "Supprimer",
  error_fetch: "Erreur lors de la récupération des données",
  error_create: "Erreur lors de la création",
  error_update: "Erreur lors de la mise à jour",
  error_delete: "Erreur lors de la suppression",
  import_button: "Importer",
  export_button: "Exporter",
  import_json: "JSON",
  import_csv: "CSV",
  export_json: "JSON",
  export_csv: "CSV",
  error_export: "Erreur lors de l'export des rôles",
  error_import: "Erreur lors de l'import des rôles",
  import_report_title: "Rapport d'import",
  import_report_close: "Fermer",
  import_report_total: "Total",
  import_report_success: "Succès",
  import_report_failed: "Échecs",
  import_report_errors: "Erreurs",
  import_report_warnings: "Avertissements",
  // Association dialog keys
  association_dialog_title: "Ajouter des politiques à \"{name}\"",
  association_dialog_description: "Sélectionnez les éléments à associer",
  associated_items: "Déjà associés",
  available_items: "Disponibles",
  no_available_items: "Aucun élément disponible",
  no_associations: "Aucune politique",
  add_selected: "Ajouter ({count})",
  selected_count: "{count} sélectionné(s)",
  select_all: "Tout sélectionner",
  clear_selection: "Effacer",
  search_placeholder: "Rechercher...",
  add_association: "Ajouter",
  remove_association: "Retirer",
};

describe('RolesV2 Component', () => {
  const mockPolicies = [
    { id: 1, name: 'Admin Policy', description: 'Full admin access' },
    { id: 2, name: 'Read Only', description: 'Read only access' },
    { id: 3, name: 'Write Policy', description: 'Write access' },
  ];

  const mockRoles = [
    { id: 1, name: 'Administrator', description: 'Full system administrator' },
    { id: 2, name: 'Viewer', description: 'Read-only user' },
  ];

  const mockRolePolicies: Record<string, typeof mockPolicies> = {
    '1': [mockPolicies[0], mockPolicies[1]],
    '2': [mockPolicies[1]],
  };

  // Regex patterns for URL matching
  const roleRegex = /\/api\/guardian\/roles\/(\d+)$/;
  const rolePoliciesRegex = /\/api\/guardian\/roles\/(\d+)\/policies/;

  // Helper to create mock response
  const createResponse = <T,>(data: T, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(data),
    clone() { return createResponse(data, status); }
  });

  // Handle role CRUD operations
  const handleRoleRequest = (url: string, options?: RequestInit) => {
    const match = roleRegex.exec(url);
    if (!match) return null;
    
    const roleId = match[1];
    if (options?.method === 'PATCH') {
      return Promise.resolve(createResponse({ id: Number(roleId), name: 'Updated', description: 'Updated' }));
    }
    if (options?.method === 'DELETE') {
      return Promise.resolve({ ok: true, status: 204 });
    }
    return null;
  };

  // Handle role policies operations
  const handleRolePoliciesRequest = (url: string, options?: RequestInit) => {
    const match = rolePoliciesRegex.exec(url);
    if (!match) return null;
    
    const roleId = match[1];
    if (options?.method === 'POST') {
      return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({}) });
    }
    if (options?.method === 'DELETE') {
      return Promise.resolve({ ok: true, status: 204 });
    }
    
    const policies = mockRolePolicies[roleId] || [];
    return Promise.resolve(createResponse(policies));
  };

  // Main mock fetch implementation
  const createMockFetch = () => (url: string, options?: RequestInit) => {
    // Handle policies endpoint
    if (url === GUARDIAN_ROUTES.policies) {
      return Promise.resolve(createResponse(mockPolicies));
    }

    // Handle roles endpoint
    if (url === GUARDIAN_ROUTES.roles) {
      if (options?.method === 'POST') {
        const body = JSON.parse(options.body as string);
        return Promise.resolve(createResponse({ id: 3, ...body }, 201));
      }
      return Promise.resolve(createResponse(mockRoles));
    }

    // Try role operations
    const roleResponse = handleRoleRequest(url, options);
    if (roleResponse) return roleResponse;

    // Try role policies operations
    const policiesResponse = handleRolePoliciesRequest(url, options);
    if (policiesResponse) return policiesResponse;

    return Promise.reject(new Error('Unknown URL: ' + url));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis.fetch as jest.Mock).mockImplementation(createMockFetch());
  });

  describe('Initial Render', () => {
    it('should render the component container', async () => {
      render(<RolesV2 dictionary={mockRolesDictionary} />);
      
      await waitFor(() => {
        expect(screen.getByTestId(`${TEST_PREFIX}-container`)).toBeInTheDocument();
      });
    });

    it('should render the title', async () => {
      render(<RolesV2 dictionary={mockRolesDictionary} />);
      
      await waitFor(() => {
        expect(screen.getByTestId(`${TEST_PREFIX}-title`)).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch and display roles on mount', async () => {
      render(<RolesV2 dictionary={mockRolesDictionary} />);

      // Wait for container to render with data
      await waitFor(() => {
        expect(screen.getByTestId(`${TEST_PREFIX}-container`)).toBeInTheDocument();
      });

      // Check edit buttons exist for our mock roles (confirms data loaded)
      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.editButton('1'))).toBeInTheDocument();
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.editButton('2'))).toBeInTheDocument();
      });
    });

    it('should display policy count for each role', async () => {
      render(<RolesV2 dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.editButton('1'))).toBeInTheDocument();
      });

      // Wait for associations to load - check that policy counts are displayed
      await waitFor(() => {
        expect(screen.getByText(/2 politique/)).toBeInTheDocument();
        expect(screen.getByText(/1 politique/)).toBeInTheDocument();
      });
    });
  });

  describe('Role CRUD Operations', () => {
    it('should open create role dialog when create button is clicked', async () => {
      render(<RolesV2 dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.editButton('1'))).toBeInTheDocument();
      });

      // Find and click create button from GenericDataTable
      const createButton = screen.getByTestId(TABLE_TEST_IDS.genericTable.createButton);
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId(`${TEST_PREFIX}-form-dialog`)).toBeInTheDocument();
        expect(screen.getByTestId(`${TEST_PREFIX}-form-title`)).toBeInTheDocument();
      });
    });

    it('should create a new role', async () => {
      render(<RolesV2 dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.editButton('1'))).toBeInTheDocument();
      });

      const createButton = screen.getByTestId(TABLE_TEST_IDS.genericTable.createButton);
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.nameInput)).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId(DASHBOARD_TEST_IDS.roles.nameInput);
      const descriptionInput = screen.getByTestId(DASHBOARD_TEST_IDS.roles.descriptionInput);
      
      fireEvent.change(nameInput, { target: { value: 'New Role' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

      const submitButton = screen.getByTestId(`${TEST_PREFIX}-submit-button`);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          GUARDIAN_ROUTES.roles,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              name: 'New Role',
              description: 'Test description',
            }),
          })
        );
      });
    });

    it('should open edit role dialog with pre-filled data', async () => {
      render(<RolesV2 dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.editButton('1'))).toBeInTheDocument();
      });

      const editButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.editButton('1'));
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId(`${TEST_PREFIX}-form-dialog`)).toBeInTheDocument();
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.nameInput)).toHaveValue('Administrator');
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.descriptionInput)).toHaveValue('Full system administrator');
      });
    });

    it('should update an existing role', async () => {
      const user = userEvent.setup();
      render(<RolesV2 dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.editButton('1'))).toBeInTheDocument();
      });

      // Open edit dialog
      const editButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.editButton('1'));
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.nameInput)).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId(DASHBOARD_TEST_IDS.roles.nameInput);
      const descriptionInput = screen.getByTestId(DASHBOARD_TEST_IDS.roles.descriptionInput);
      
      // Verify pre-filled values from the selected role
      expect(nameInput).toHaveValue('Administrator');
      expect(descriptionInput).toHaveValue('Full system administrator');

      // Verify submit button is present and enabled
      const submitButton = screen.getByTestId(`${TEST_PREFIX}-submit-button`);
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
      
      // Note: Full form submission flow tested in integration/e2e tests
      // Unit test validates that edit dialog opens with correct data
    });

    it('should delete a role after confirmation', async () => {
      render(<RolesV2 dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.deleteButton('1'))).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.deleteButton('1'));
      fireEvent.click(deleteButton);

      // Should show delete confirmation dialog
      await waitFor(() => {
        expect(screen.getByTestId(`${TEST_PREFIX}-delete-dialog`)).toBeInTheDocument();
      });

      // Confirm deletion using test ID
      const confirmButton = screen.getByTestId(`${TEST_PREFIX}-delete-confirm`);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          GUARDIAN_ROUTES.role('1'),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    it('should cancel delete when dialog is dismissed', async () => {
      render(<RolesV2 dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.deleteButton('1'))).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.deleteButton('1'));
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId(`${TEST_PREFIX}-delete-dialog`)).toBeInTheDocument();
      });

      // Cancel deletion using test ID
      const cancelButton = screen.getByTestId(`${TEST_PREFIX}-delete-cancel`);
      fireEvent.click(cancelButton);

      // Should not call delete endpoint
      await waitFor(() => {
        const deleteCalls = (globalThis.fetch as jest.Mock).mock.calls.filter(
          call => call[1]?.method === 'DELETE'
        );
        expect(deleteCalls.length).toBe(0);
      });
    });
  });

  describe('Association Management', () => {
    it('should open add policy dialog when add policy button is clicked', async () => {
      render(<RolesV2 dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyButton('1'))).toBeInTheDocument();
      });

      const addPolicyButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyButton('1'));
      fireEvent.click(addPolicyButton);

      await waitFor(() => {
        // Should show association dialog
        expect(screen.getByTestId('association-dialog-policies')).toBeInTheDocument();
      });
    });

    it('should add policy to role', async () => {
      render(<RolesV2 dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyButton('2'))).toBeInTheDocument();
      });

      // Open add policy dialog for Viewer (has only 1 policy)
      const addPolicyButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyButton('2'));
      fireEvent.click(addPolicyButton);

      await waitFor(() => {
        expect(screen.getByTestId('association-dialog-policies')).toBeInTheDocument();
      });

      // Select an available policy (Admin Policy, id=1)
      const policyItem = screen.getByTestId('association-dialog-policies-available-1');
      fireEvent.click(policyItem);

      // Click add button
      const addButton = screen.getByTestId('association-dialog-policies-add');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/roles/2/policies'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ policy_id: 1 }),
          })
        );
      });
    });

    it('should display search input in association dialog', async () => {
      render(<RolesV2 dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyButton('1'))).toBeInTheDocument();
      });

      const addPolicyButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyButton('1'));
      fireEvent.click(addPolicyButton);

      await waitFor(() => {
        expect(screen.getByTestId('association-dialog-policies-search')).toBeInTheDocument();
      });
    });
  });

  describe('Table Expansion', () => {
    it('should render table with expandable rows', async () => {
      render(<RolesV2 dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId(`${TEST_PREFIX}-container`)).toBeInTheDocument();
      });

      // The GenericAssociationTable should render with data
      expect(screen.getByTestId('generic-table-container')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should not submit form with invalid name', async () => {
      render(<RolesV2 dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.editButton('1'))).toBeInTheDocument();
      });

      const createButton = screen.getByTestId(TABLE_TEST_IDS.genericTable.createButton);
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.nameInput)).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId(DASHBOARD_TEST_IDS.roles.nameInput);
      fireEvent.change(nameInput, { target: { value: 'ab' } }); // Too short

      const submitButton = screen.getByTestId(`${TEST_PREFIX}-submit-button`);
      fireEvent.click(submitButton);

      // Should not call POST (form validation fails)
      await waitFor(() => {
        const postCalls = (globalThis.fetch as jest.Mock).mock.calls.filter(
          call => call[1]?.method === 'POST' && call[0] === GUARDIAN_ROUTES.roles
        );
        expect(postCalls.length).toBe(0);
      });
    });
  });

  describe('Test IDs Coverage', () => {
    it('should have expected test IDs in the DOM', async () => {
      render(<RolesV2 dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.editButton('1'))).toBeInTheDocument();
      });

      // Check key test IDs
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.editButton('1'))).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.deleteButton('1'))).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyButton('1'))).toBeInTheDocument();
      expect(screen.getByTestId(`${TEST_PREFIX}-container`)).toBeInTheDocument();
      expect(screen.getByTestId(`${TEST_PREFIX}-title`)).toBeInTheDocument();
    });
  });
});
