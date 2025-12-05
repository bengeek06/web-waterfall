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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PageBreadcrumb from './PageBreadcrumb';
import { PAGE_BREADCRUMB_TEST_IDS } from '@/lib/test-ids';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('PageBreadcrumb', () => {
  const mockDictionary = {
    home: 'Home',
    admin: 'Administration',
    users: 'Users',
    roles: 'Roles',
    settings: 'Settings',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render breadcrumb container', () => {
      render(
        <PageBreadcrumb pathname="/home" dictionary={mockDictionary} />
      );

      expect(screen.getByTestId(PAGE_BREADCRUMB_TEST_IDS.container)).toBeInTheDocument();
      expect(screen.getByTestId(PAGE_BREADCRUMB_TEST_IDS.list)).toBeInTheDocument();
    });

    it('should render single level breadcrumb', () => {
      render(
        <PageBreadcrumb pathname="/home" dictionary={mockDictionary} />
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByTestId(PAGE_BREADCRUMB_TEST_IDS.currentItem)).toHaveTextContent('Home');
    });

    it('should render two level breadcrumb with separator', () => {
      render(
        <PageBreadcrumb pathname="/home/admin" dictionary={mockDictionary} />
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Administration')).toBeInTheDocument();
      expect(screen.getByTestId(PAGE_BREADCRUMB_TEST_IDS.separator)).toBeInTheDocument();
    });

    it('should render multi-level breadcrumb', () => {
      render(
        <PageBreadcrumb pathname="/home/admin/users" dictionary={mockDictionary} />
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Administration')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();

      // Should have 2 separators for 3 items
      const separators = screen.getAllByTestId(PAGE_BREADCRUMB_TEST_IDS.separator);
      expect(separators).toHaveLength(2);
    });
  });

  describe('Navigation', () => {
    it('should render links for all items except the last', () => {
      render(
        <PageBreadcrumb pathname="/home/admin/users" dictionary={mockDictionary} />
      );

      // First two items should be links
      const homeLink = screen.getByTestId(`${PAGE_BREADCRUMB_TEST_IDS.link}-home`);
      const adminLink = screen.getByTestId(`${PAGE_BREADCRUMB_TEST_IDS.link}-admin`);

      expect(homeLink).toHaveAttribute('href', '/home');
      expect(adminLink).toHaveAttribute('href', '/home/admin');

      // Last item should be plain text (current page)
      expect(screen.getByTestId(PAGE_BREADCRUMB_TEST_IDS.currentItem)).toHaveTextContent('Users');
    });

    it('should build correct paths for nested routes', () => {
      render(
        <PageBreadcrumb
          pathname="/home/settings/company"
          dictionary={mockDictionary}
        />
      );

      expect(screen.getByTestId(`${PAGE_BREADCRUMB_TEST_IDS.link}-home`)).toHaveAttribute('href', '/home');
      expect(screen.getByTestId(`${PAGE_BREADCRUMB_TEST_IDS.link}-settings`)).toHaveAttribute('href', '/home/settings');
    });
  });

  describe('Internationalization', () => {
    it('should use dictionary labels', () => {
      const frenchDictionary = {
        home: 'Accueil',
        admin: 'Administration',
        users: 'Utilisateurs',
      };

      render(
        <PageBreadcrumb pathname="/home/admin/users" dictionary={frenchDictionary} />
      );

      expect(screen.getByText('Accueil')).toBeInTheDocument();
      expect(screen.getByText('Administration')).toBeInTheDocument();
      expect(screen.getByText('Utilisateurs')).toBeInTheDocument();
    });

    it('should fallback to segment name if not in dictionary', () => {
      render(
        <PageBreadcrumb
          pathname="/home/unknown-page"
          dictionary={mockDictionary}
        />
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('unknown-page')).toBeInTheDocument();
    });
  });

  describe('Siblings Dropdown', () => {
    const siblings = [
      { label: 'Users', href: '/home/admin/users' },
      { label: 'Roles', href: '/home/admin/roles' },
    ];

    it('should render dropdown trigger when siblings provided', () => {
      render(
        <PageBreadcrumb
          pathname="/home/admin/users"
          dictionary={mockDictionary}
          siblings={siblings}
        />
      );

      expect(screen.getByTestId(PAGE_BREADCRUMB_TEST_IDS.dropdownTrigger)).toBeInTheDocument();
      expect(screen.getByTestId(PAGE_BREADCRUMB_TEST_IDS.currentItem)).toHaveTextContent('Users');
    });

    it('should show dropdown menu on click', async () => {
      const user = userEvent.setup();
      render(
        <PageBreadcrumb
          pathname="/home/admin/users"
          dictionary={mockDictionary}
          siblings={siblings}
        />
      );

      const trigger = screen.getByTestId(PAGE_BREADCRUMB_TEST_IDS.dropdownTrigger);
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByTestId(PAGE_BREADCRUMB_TEST_IDS.dropdownContent)).toBeVisible();
      });
    });

    it('should render all sibling items in dropdown', async () => {
      const user = userEvent.setup();
      render(
        <PageBreadcrumb
          pathname="/home/admin/users"
          dictionary={mockDictionary}
          siblings={siblings}
        />
      );

      const trigger = screen.getByTestId(PAGE_BREADCRUMB_TEST_IDS.dropdownTrigger);
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByTestId(`${PAGE_BREADCRUMB_TEST_IDS.dropdownItem}-users`)).toBeVisible();
        expect(screen.getByTestId(`${PAGE_BREADCRUMB_TEST_IDS.dropdownItem}-roles`)).toBeVisible();
      });
    });

    it('should navigate to sibling on click', async () => {
      const user = userEvent.setup();
      render(
        <PageBreadcrumb
          pathname="/home/admin/users"
          dictionary={mockDictionary}
          siblings={siblings}
        />
      );

      const trigger = screen.getByTestId(PAGE_BREADCRUMB_TEST_IDS.dropdownTrigger);
      await user.click(trigger);

      await waitFor(async () => {
        const rolesItem = screen.getByTestId(`${PAGE_BREADCRUMB_TEST_IDS.dropdownItem}-roles`);
        await user.click(rolesItem);
        expect(mockPush).toHaveBeenCalledWith('/home/admin/roles');
      });
    });

    it('should not render dropdown without siblings', () => {
      render(
        <PageBreadcrumb pathname="/home/admin/users" dictionary={mockDictionary} />
      );

      expect(screen.queryByTestId(PAGE_BREADCRUMB_TEST_IDS.dropdownTrigger)).not.toBeInTheDocument();
      expect(screen.getByTestId(PAGE_BREADCRUMB_TEST_IDS.currentItem)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle root path', () => {
      render(
        <PageBreadcrumb pathname="/" dictionary={mockDictionary} />
      );

      // Root path results in empty breadcrumb (no segments after split/filter)
      expect(screen.getByTestId(PAGE_BREADCRUMB_TEST_IDS.container)).toBeInTheDocument();
    });

    it('should handle trailing slash', () => {
      render(
        <PageBreadcrumb pathname="/home/admin/" dictionary={mockDictionary} />
      );

      // Should work the same as without trailing slash
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Administration')).toBeInTheDocument();
    });

    it('should handle empty siblings array', () => {
      render(
        <PageBreadcrumb
          pathname="/home/admin"
          dictionary={mockDictionary}
          siblings={[]}
        />
      );

      // Empty array should not show dropdown
      expect(screen.queryByTestId(PAGE_BREADCRUMB_TEST_IDS.dropdownTrigger)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have test-ids for all items', () => {
      render(
        <PageBreadcrumb pathname="/home/admin/users" dictionary={mockDictionary} />
      );

      expect(screen.getByTestId(`${PAGE_BREADCRUMB_TEST_IDS.item}-home`)).toBeInTheDocument();
      expect(screen.getByTestId(`${PAGE_BREADCRUMB_TEST_IDS.item}-admin`)).toBeInTheDocument();
      expect(screen.getByTestId(`${PAGE_BREADCRUMB_TEST_IDS.item}-users`)).toBeInTheDocument();
    });

    it('should have accessible links', () => {
      render(
        <PageBreadcrumb pathname="/home/admin" dictionary={mockDictionary} />
      );

      const homeLink = screen.getByTestId(`${PAGE_BREADCRUMB_TEST_IDS.link}-home`);
      expect(homeLink).toHaveAttribute('href', '/home');
      expect(homeLink).toHaveTextContent('Home');
    });
  });
});
