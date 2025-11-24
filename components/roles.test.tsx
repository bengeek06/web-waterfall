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
import Roles from './roles';
import { DASHBOARD_TEST_IDS } from '@/lib/test-ids';
import { GUARDIAN_ROUTES } from '@/lib/api-routes';

// Mock fetch globally
global.fetch = jest.fn();

// Mock dictionary for roles component
const mockRolesDictionary = {
  page_title: "Rôles",
  create_button: "Ajouter un rôle",
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
  form_save: "Mettre à jour",
  policies_modal_title: "Ajouter des politiques à",
  policies_select: "Aucune politique disponible",
  policies_add: "Ajouter",
  delete_confirm_title: "Confirmer la suppression",
  delete_confirm_message: "Supprimer ce rôle ?",
  delete_policy_confirm_message: "Supprimer la politique",
  delete_cancel: "Annuler",
  delete_confirm: "Supprimer",
  error_fetch: "Erreur lors de la récupération des rôles",
  error_create: "Erreur lors de l'enregistrement du rôle",
  error_update: "Erreur lors de la mise à jour du rôle",
  error_delete: "Erreur lors de la suppression du rôle",
};

describe('Roles Component', () => {
  const mockPolicies = [
    {
      id: 1,
      name: 'Admin Policy',
      description: 'Full admin access',
    },
    {
      id: 2,
      name: 'Read Only',
      description: 'Read only access',
    },
    {
      id: 3,
      name: 'Write Policy',
      description: 'Write access',
    },
  ];

  const mockRoles = [
    {
      id: 1,
      name: 'Administrator',
      description: 'Full system administrator',
      policies: [mockPolicies[0], mockPolicies[1]],
    },
    {
      id: 2,
      name: 'Viewer',
      description: 'Read-only user',
      policies: [mockPolicies[1]],
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
      if (url === GUARDIAN_ROUTES.policies) {
        const response = {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(mockPolicies),
          clone: function() { return { ...this, json: () => Promise.resolve(mockPolicies) }; }
        };
        return Promise.resolve(response);
      }
      if (url === GUARDIAN_ROUTES.roles) {
        const rolesData = mockRoles.map(r => ({ id: r.id, name: r.name, description: r.description }));
        const response = {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(rolesData),
          clone: function() { return { ...this, json: () => Promise.resolve(rolesData) }; }
        };
        return Promise.resolve(response);
      }
      // Handle role policies requests
      if (url === GUARDIAN_ROUTES.rolePolicies('1')) {
        const policies = [mockPolicies[0], mockPolicies[1]];
        const response = {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(policies),
          clone: function() { return { ...this, json: () => Promise.resolve(policies) }; }
        };
        return Promise.resolve(response);
      }
      if (url === GUARDIAN_ROUTES.rolePolicies('2')) {
        const policies = [mockPolicies[1]];
        const response = {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(policies),
          clone: function() { return { ...this, json: () => Promise.resolve(policies) }; }
        };
        return Promise.resolve(response);
      }
      return Promise.reject(new Error('Unknown URL: ' + url));
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(createMockFetch());
  });

  describe('Initial Render', () => {
    it('should render the component with title', async () => {
      render(<Roles dictionary={mockRolesDictionary} />);
      
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.title)).toBeInTheDocument();
      expect(screen.getByText('Rôles')).toBeInTheDocument();
    });

    it('should render the add role button', async () => {
      render(<Roles dictionary={mockRolesDictionary} />);
      
      const addButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addButton);
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveTextContent('Ajouter un rôle');
    });

    it('should render the roles table', async () => {
      render(<Roles dictionary={mockRolesDictionary} />);
      
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.table)).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.tableHeader)).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch and display roles on mount', async () => {
      render(<Roles dictionary={mockRolesDictionary} />);

      // Wait for all async state updates to complete
      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
        expect(screen.getByText('Viewer')).toBeInTheDocument();
      });
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.errorMessage)).toBeInTheDocument();
      }, { timeout: 5000 }); // Need extra time for retry logic (1000ms + 2000ms delays)
    });

    it('should handle non-JSON responses', async () => {
      (global.fetch as jest.Mock).mockImplementation(createMockFetch({
        [GUARDIAN_ROUTES.policies]: Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'text/html' },
          text: () => Promise.resolve('<html>Error page</html>'),
        }),
      }));

      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Role CRUD Operations', () => {
    it('should open create role dialog when add button is clicked', async () => {
      render(<Roles dictionary={mockRolesDictionary} />);

      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      });

      const addButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addButton);
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.dialog)).toBeInTheDocument();
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.dialogTitle)).toHaveTextContent('Créer un rôle');
      });
    });

    it('should create a new role', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === 'POST' && url === GUARDIAN_ROUTES.roles) {
          return Promise.resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve({ id: 3, name: 'New Role', description: 'Test', policies: [] }),
          });
        }
        // Default responses for initial fetch
        if (url === GUARDIAN_ROUTES.policies) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPolicies),
          });
        }
        if (url === GUARDIAN_ROUTES.roles) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockRoles),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      }, { timeout: 5000 });

      const addButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addButton);
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.nameInput)).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId(DASHBOARD_TEST_IDS.roles.nameInput);
      const descriptionInput = screen.getByTestId(DASHBOARD_TEST_IDS.roles.descriptionInput);
      const submitButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.submitButton);

      fireEvent.change(nameInput, { target: { value: 'New Role' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          GUARDIAN_ROUTES.roles,
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'New Role',
              description: 'Test description',
            }),
          })
        );
      });
    });

    it('should open edit role dialog with pre-filled data', async () => {
      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      });

      const editButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.editButton('1'));
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.dialogTitle)).toHaveTextContent('Éditer le rôle');
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.nameInput)).toHaveValue('Administrator');
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.descriptionInput)).toHaveValue('Full system administrator');
      });
    });

    it('should update an existing role', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ id: 1, name: 'Updated Role', description: 'Updated', policies: [] }),
          });
        }
        // Default responses
        if (url === GUARDIAN_ROUTES.policies) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPolicies),
          });
        }
        if (url === GUARDIAN_ROUTES.roles) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockRoles),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      }, { timeout: 5000 });

      const editButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.editButton('1'));
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.nameInput)).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId(DASHBOARD_TEST_IDS.roles.nameInput);
      fireEvent.change(nameInput, { target: { value: 'Updated Role' } });

      const submitButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.submitButton);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          GUARDIAN_ROUTES.role('1'),
          expect.objectContaining({
            method: 'PATCH',
          })
        );
      });
    });

    it('should delete a role after confirmation', async () => {
      window.confirm = jest.fn(() => true);

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            status: 204,
          });
        }
        // Default responses
        if (url === GUARDIAN_ROUTES.policies) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPolicies),
          });
        }
        if (url === GUARDIAN_ROUTES.roles) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockRoles),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      }, { timeout: 5000 });

      const deleteButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.deleteButton('1'));
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith('Supprimer ce rôle ?');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          GUARDIAN_ROUTES.role('1'),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    it('should not delete role if user cancels confirmation', async () => {
      window.confirm = jest.fn(() => false);

      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.deleteButton('1'));
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith('Supprimer ce rôle ?');

      // Should not call delete endpoint
      await waitFor(() => {
        const deleteCalls = (global.fetch as jest.Mock).mock.calls.filter(
          call => call[1]?.method === 'DELETE'
        );
        expect(deleteCalls.length).toBe(0);
      });
    });

    it('should cancel role dialog', async () => {
      render(<Roles dictionary={mockRolesDictionary} />);

      const addButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addButton);
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.dialog)).toBeInTheDocument();
      });

      const cancelButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.cancelButton);
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId(DASHBOARD_TEST_IDS.roles.dialogTitle)).not.toBeInTheDocument();
      });
    });

    it('should display validation errors for invalid input', async () => {
      render(<Roles dictionary={mockRolesDictionary} />);

      const addButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addButton);
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.nameInput)).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId(DASHBOARD_TEST_IDS.roles.nameInput);
      const submitButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.submitButton);

      // Try to submit with too short name (less than 3 characters)
      fireEvent.change(nameInput, { target: { value: 'ab' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Zod validation should prevent submission
        const postCalls = (global.fetch as jest.Mock).mock.calls.filter(
          call => call[1]?.method === 'POST'
        );
        expect(postCalls.length).toBe(0);
      });
    });
  });

  describe('Role Expansion', () => {
    it('should expand role to show policies', async () => {
      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.expandButton('1'));
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Politiques')).toBeInTheDocument();
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
        expect(screen.getByText('Read Only')).toBeInTheDocument();
      });
    });

    it('should display "Aucune politique" for role without policies', async () => {
      const emptyRole = {
        id: 3,
        name: 'Empty Role',
        description: 'No policies',
        policies: [],
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === GUARDIAN_ROUTES.policies) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPolicies),
            clone: function() { return { ...this, json: () => Promise.resolve(mockPolicies) }; }
          });
        }
        if (url === GUARDIAN_ROUTES.roles) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve([emptyRole]),
            clone: function() { return { ...this, json: () => Promise.resolve([emptyRole]) }; }
          });
        }
        if (url === GUARDIAN_ROUTES.rolePolicies('3')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve([]),
            clone: function() { return { ...this, json: () => Promise.resolve([]) }; }
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Empty Role')).toBeInTheDocument();
      }, { timeout: 5000 });

      const expandButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.expandButton('3'));
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Aucune politique associée')).toBeInTheDocument();
      });
    });
  });

  describe('Add Policy Dialog', () => {
    it('should open add policy dialog', async () => {
      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      });

      const addPolicyButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyButton('1'));
      fireEvent.click(addPolicyButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyDialog)).toBeInTheDocument();
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyDialogTitle)).toHaveTextContent(
          'Ajouter des politiques à "Administrator"'
        );
      });
    });

    it('should select and add policies to role', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === 'POST' && url.includes('policies')) {
          return Promise.resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve({}),
          });
        }
        // Default responses
        if (url === GUARDIAN_ROUTES.policies) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPolicies),
          });
        }
        if (url === GUARDIAN_ROUTES.roles) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockRoles),
          });
        }
        if (url === GUARDIAN_ROUTES.rolePolicies('2')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve([mockPolicies[1]]),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Viewer')).toBeInTheDocument();
      }, { timeout: 5000 });

      const addPolicyButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyButton('2'));
      fireEvent.click(addPolicyButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyDialog)).toBeInTheDocument();
      });

      // Select policy with id 1 (not already in Viewer role)
      const checkbox = screen.getByTestId(DASHBOARD_TEST_IDS.roles.policyCheckbox('1'));
      fireEvent.click(checkbox);

      const submitButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicySubmitButton);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          GUARDIAN_ROUTES.rolePolicies('2'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ policy_id: 1 }),
          })
        );
      });
    });

    it('should disable submit button when no policies selected', async () => {
      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      });

      const addPolicyButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyButton('1'));
      fireEvent.click(addPolicyButton);

      await waitFor(() => {
        const submitButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicySubmitButton);
        expect(submitButton).toBeDisabled();
      });
    });

    it('should cancel add policy dialog', async () => {
      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      });

      const addPolicyButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyButton('1'));
      fireEvent.click(addPolicyButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyDialog)).toBeInTheDocument();
      });

      const cancelButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyCancelButton);
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId(DASHBOARD_TEST_IDS.roles.addPolicyDialogTitle)).not.toBeInTheDocument();
      });
    });

    it('should only show available policies (not already assigned)', async () => {
      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Viewer')).toBeInTheDocument();
      });

      const addPolicyButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyButton('2'));
      fireEvent.click(addPolicyButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyDialog)).toBeInTheDocument();
      });

      // Should show policies not already assigned
      expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      expect(screen.getByText('Write Policy')).toBeInTheDocument();
    });
  });

  describe('Remove Policy', () => {
    it('should remove policy from role after confirmation', async () => {
      window.confirm = jest.fn(() => true);

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            status: 204,
          });
        }
        // Default responses
        if (url === GUARDIAN_ROUTES.policies) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPolicies),
          });
        }
        if (url === GUARDIAN_ROUTES.roles) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockRoles),
          });
        }
        if (url === GUARDIAN_ROUTES.rolePolicies('1')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve([mockPolicies[0], mockPolicies[1]]),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      }, { timeout: 5000 });

      const expandButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.expandButton('1'));
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const removePolicyButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.removePolicyButton('1', '1'));
      fireEvent.click(removePolicyButton);

      expect(window.confirm).toHaveBeenCalledWith('Supprimer la politique "Admin Policy" de ce rôle ?');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          GUARDIAN_ROUTES.rolePolicy('1', '1'),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    it('should not remove policy if user cancels confirmation', async () => {
      window.confirm = jest.fn(() => false);

      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.expandButton('1'));
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const removePolicyButton = screen.getByTestId(DASHBOARD_TEST_IDS.roles.removePolicyButton('1', '1'));
      fireEvent.click(removePolicyButton);

      expect(window.confirm).toHaveBeenCalledWith('Supprimer la politique "Admin Policy" de ce rôle ?');

      // Should not call delete endpoint
      await waitFor(() => {
        const deleteCalls = (global.fetch as jest.Mock).mock.calls.filter(
          call => call[1]?.method === 'DELETE'
        );
        expect(deleteCalls.length).toBe(0);
      });
    });
  });

  describe('Test IDs Coverage', () => {
    it('should have all required test IDs in the DOM', async () => {
      render(<Roles dictionary={mockRolesDictionary} />);

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      });

      // Section and title
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.section)).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.title)).toBeInTheDocument();

      // Table
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.table)).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.tableHeader)).toBeInTheDocument();

      // Buttons
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.addButton)).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.editButton('1'))).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.deleteButton('1'))).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.addPolicyButton('1'))).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.roles.expandButton('1'))).toBeInTheDocument();
    });
  });
});
