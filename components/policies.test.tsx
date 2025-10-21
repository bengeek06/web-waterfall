import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Policies from './policies';
import { DASHBOARD_TEST_IDS } from '@/lib/test-ids';
import { GUARDIAN_ROUTES } from '@/lib/api-routes';

// Mock fetch globally
global.fetch = jest.fn();

describe('Policies Component', () => {
  const mockPermissions = [
    {
      id: 1,
      service: 'auth',
      resource_name: 'users',
      description: 'Read users',
      operation: 'OperationEnum.READ',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 2,
      service: 'auth',
      resource_name: 'users',
      description: 'Create users',
      operation: 'OperationEnum.CREATE',
    },
    {
      id: 3,
      service: 'guardian',
      resource_name: 'roles',
      description: 'List roles',
      operation: 'OperationEnum.LIST',
    },
  ];

  const mockPolicies = [
    {
      id: 1,
      name: 'Admin Policy',
      description: 'Full admin access',
      permissions: [mockPermissions[0], mockPermissions[1]],
    },
    {
      id: 2,
      name: 'Read Only',
      description: 'Read only access',
      permissions: [mockPermissions[0]],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === GUARDIAN_ROUTES.permissions) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(mockPermissions),
        });
      }
      if (url === GUARDIAN_ROUTES.policies) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(mockPolicies),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Initial Render', () => {
    it('should render the component with title', async () => {
      render(<Policies />);
      
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.title)).toBeInTheDocument();
      expect(screen.getByText('Policies')).toBeInTheDocument();
    });

    it('should render the add policy button', async () => {
      render(<Policies />);
      
      const addButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.addButton);
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveTextContent('Ajouter une policy');
    });

    it('should render the policies table', async () => {
      render(<Policies />);
      
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.table)).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.tableHeader)).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch and display policies on mount', async () => {
      render(<Policies />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(GUARDIAN_ROUTES.permissions);
        expect(global.fetch).toHaveBeenCalledWith(GUARDIAN_ROUTES.policies);
      });

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
        expect(screen.getByText('Read Only')).toBeInTheDocument();
      });
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.errorMessage)).toBeInTheDocument();
      });
    });

    it('should handle non-JSON responses', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === GUARDIAN_ROUTES.permissions) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'text/html' },
            text: () => Promise.resolve('<html>Error page</html>'),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve([]),
        });
      });

      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Policy CRUD Operations', () => {
    it('should open create policy dialog when add button is clicked', async () => {
      render(<Policies />);

      const addButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.addButton);
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.dialog)).toBeInTheDocument();
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.dialogTitle)).toHaveTextContent('Créer une policy');
      });
    });

    it('should create a new policy', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === 'POST' && url === GUARDIAN_ROUTES.policies) {
          return Promise.resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve({ id: 3, name: 'New Policy', description: 'Test', permissions: [] }),
          });
        }
        // Default responses for initial fetch
        if (url === GUARDIAN_ROUTES.permissions) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPermissions),
          });
        }
        if (url === GUARDIAN_ROUTES.policies) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPolicies),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const addButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.addButton);
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.nameInput)).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId(DASHBOARD_TEST_IDS.policies.nameInput);
      const descriptionInput = screen.getByTestId(DASHBOARD_TEST_IDS.policies.descriptionInput);
      const submitButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.submitButton);

      fireEvent.change(nameInput, { target: { value: 'New Policy' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          GUARDIAN_ROUTES.policies,
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'New Policy',
              description: 'Test description',
            }),
          })
        );
      });
    });

    it('should open edit policy dialog with pre-filled data', async () => {
      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const editButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.editButton('1'));
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.dialogTitle)).toHaveTextContent('Éditer la policy');
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.nameInput)).toHaveValue('Admin Policy');
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.descriptionInput)).toHaveValue('Full admin access');
      });
    });

    it('should update an existing policy', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ id: 1, name: 'Updated Policy', description: 'Updated', permissions: [] }),
          });
        }
        // Default responses
        if (url === GUARDIAN_ROUTES.permissions) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPermissions),
          });
        }
        if (url === GUARDIAN_ROUTES.policies) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPolicies),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const editButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.editButton('1'));
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.nameInput)).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId(DASHBOARD_TEST_IDS.policies.nameInput);
      fireEvent.change(nameInput, { target: { value: 'Updated Policy' } });

      const submitButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.submitButton);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          GUARDIAN_ROUTES.policy('1'),
          expect.objectContaining({
            method: 'PATCH',
          })
        );
      });
    });

    it('should delete a policy after confirmation', async () => {
      window.confirm = jest.fn(() => true);

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            status: 204,
          });
        }
        // Default responses
        if (url === GUARDIAN_ROUTES.permissions) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPermissions),
          });
        }
        if (url === GUARDIAN_ROUTES.policies) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPolicies),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.deleteButton('1'));
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith('Supprimer cette policy ?');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          GUARDIAN_ROUTES.policy('1'),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    it('should not delete policy if user cancels confirmation', async () => {
      window.confirm = jest.fn(() => false);

      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.deleteButton('1'));
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith('Supprimer cette policy ?');

      // Should not call delete endpoint
      await waitFor(() => {
        const deleteCalls = (global.fetch as jest.Mock).mock.calls.filter(
          call => call[1]?.method === 'DELETE'
        );
        expect(deleteCalls.length).toBe(0);
      });
    });

    it('should cancel policy dialog', async () => {
      render(<Policies />);

      const addButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.addButton);
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.dialog)).toBeInTheDocument();
      });

      const cancelButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.cancelButton);
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId(DASHBOARD_TEST_IDS.policies.dialogTitle)).not.toBeInTheDocument();
      });
    });
  });

  describe('Policy Expansion', () => {
    it('should expand policy to show permissions', async () => {
      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.expandButton('1'));
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Permissions')).toBeInTheDocument();
        expect(screen.getByText('auth / users')).toBeInTheDocument();
      });
    });

    it('should collapse expanded policy', async () => {
      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.expandButton('1'));
      
      // Expand
      fireEvent.click(expandButton);
      await waitFor(() => {
        expect(screen.getByText('Permissions')).toBeInTheDocument();
      });

      // Collapse
      fireEvent.click(expandButton);
      await waitFor(() => {
        expect(screen.queryByText('auth / users')).not.toBeInTheDocument();
      });
    });

    it('should display "Aucune permission" for policy without permissions', async () => {
      const emptyPolicy = {
        id: 3,
        name: 'Empty Policy',
        description: 'No permissions',
        permissions: [],
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === GUARDIAN_ROUTES.permissions) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPermissions),
          });
        }
        if (url === GUARDIAN_ROUTES.policies) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve([emptyPolicy]),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Empty Policy')).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.expandButton('3'));
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Aucune permission')).toBeInTheDocument();
      });
    });
  });

  describe('Add Permission Dialog', () => {
    it('should open add permission dialog', async () => {
      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const addPermissionButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionButton('1'));
      fireEvent.click(addPermissionButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionDialog)).toBeInTheDocument();
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionDialogTitle)).toHaveTextContent(
          'Ajouter des permissions à Admin Policy'
        );
      });
    });

    it('should filter permissions by service', async () => {
      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const addPermissionButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionButton('1'));
      fireEvent.click(addPermissionButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.serviceFilter)).toBeInTheDocument();
      });

      const serviceFilter = screen.getByTestId(DASHBOARD_TEST_IDS.policies.serviceFilter);
      fireEvent.change(serviceFilter, { target: { value: 'guardian' } });

      await waitFor(() => {
        // Should show guardian service permissions
        expect(screen.getByText('guardian / roles')).toBeInTheDocument();
      });
    });

    it('should filter permissions by resource', async () => {
      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const addPermissionButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionButton('1'));
      fireEvent.click(addPermissionButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.resourceFilter)).toBeInTheDocument();
      });

      const resourceFilter = screen.getByTestId(DASHBOARD_TEST_IDS.policies.resourceFilter);
      fireEvent.change(resourceFilter, { target: { value: 'roles' } });

      await waitFor(() => {
        expect(screen.getByText('guardian / roles')).toBeInTheDocument();
      });
    });

    it('should select and add permissions to policy', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === 'POST' && url.includes('permissions')) {
          return Promise.resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve({}),
          });
        }
        // Default responses
        if (url === GUARDIAN_ROUTES.permissions) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPermissions),
          });
        }
        if (url === GUARDIAN_ROUTES.policies) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPolicies),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Read Only')).toBeInTheDocument();
      });

      const addPermissionButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionButton('2'));
      fireEvent.click(addPermissionButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionDialog)).toBeInTheDocument();
      });

      // Select permission with id 2 (not already in Read Only policy)
      const checkbox = screen.getByTestId(DASHBOARD_TEST_IDS.policies.permissionCheckbox(2));
      fireEvent.click(checkbox);

      const submitButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionSubmitButton);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          GUARDIAN_ROUTES.policyPermissions('2'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ permission_id: 2 }),
          })
        );
      });
    });

    it('should disable submit button when no permissions selected', async () => {
      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const addPermissionButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionButton('1'));
      fireEvent.click(addPermissionButton);

      await waitFor(() => {
        const submitButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionSubmitButton);
        expect(submitButton).toBeDisabled();
      });
    });

    it('should cancel add permission dialog', async () => {
      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const addPermissionButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionButton('1'));
      fireEvent.click(addPermissionButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionDialog)).toBeInTheDocument();
      });

      const cancelButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionCancelButton);
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId(DASHBOARD_TEST_IDS.policies.addPermissionDialogTitle)).not.toBeInTheDocument();
      });
    });
  });

  describe('Permission Groups', () => {
    it('should display permission icons with hover cards', async () => {
      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.expandButton('1'));
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.permissionIcon(1))).toBeInTheDocument();
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.permissionIcon(2))).toBeInTheDocument();
      });
    });

    it('should open edit permission group dialog with pre-filtered service/resource', async () => {
      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.expandButton('1'));
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('auth / users')).toBeInTheDocument();
      });

      const editGroupButton = screen.getByTestId(
        DASHBOARD_TEST_IDS.policies.editPermissionGroupButton('auth', 'users')
      );
      fireEvent.click(editGroupButton);

      await waitFor(() => {
        expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionDialog)).toBeInTheDocument();
        const serviceFilter = screen.getByTestId(DASHBOARD_TEST_IDS.policies.serviceFilter) as HTMLSelectElement;
        expect(serviceFilter.value).toBe('auth');
      });
    });

    it('should delete permission group after confirmation', async () => {
      window.confirm = jest.fn(() => true);

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === 'DELETE' && url.includes('permissions')) {
          return Promise.resolve({
            ok: true,
            status: 204,
          });
        }
        // Default responses
        if (url === GUARDIAN_ROUTES.permissions) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPermissions),
          });
        }
        if (url === GUARDIAN_ROUTES.policies) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve(mockPolicies),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId(DASHBOARD_TEST_IDS.policies.expandButton('1'));
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('auth / users')).toBeInTheDocument();
      });

      const deleteGroupButton = screen.getByTestId(
        DASHBOARD_TEST_IDS.policies.deletePermissionGroupButton('auth', 'users')
      );
      fireEvent.click(deleteGroupButton);

      expect(window.confirm).toHaveBeenCalledWith('Supprimer toutes les permissions de ce groupe ?');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          GUARDIAN_ROUTES.policyPermission('1', '1'),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });
  });

  describe('Test IDs Coverage', () => {
    it('should have all required test IDs in the DOM', async () => {
      render(<Policies />);

      await waitFor(() => {
        expect(screen.getByText('Admin Policy')).toBeInTheDocument();
      });

      // Section and title
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.section)).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.title)).toBeInTheDocument();

      // Table
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.table)).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.tableHeader)).toBeInTheDocument();

      // Buttons
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.addButton)).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.editButton('1'))).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.deleteButton('1'))).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.addPermissionButton('1'))).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.policies.expandButton('1'))).toBeInTheDocument();
    });
  });
});
