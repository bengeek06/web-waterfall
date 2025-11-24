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
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TopBar from './TopBar';
import { COMMON_TEST_IDS } from '@/lib/test-ids';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => {
    return <a href={href} {...props}>{children}</a>;
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock user functions
jest.mock('@/lib/server/user', () => ({
  hasUserAvatar: jest.fn(() => Promise.resolve(true)),
  getUserData: jest.fn(() => Promise.resolve({
    id: '123',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    language: 'fr',
    has_avatar: true,
  })),
}));

// Mock getUserLanguage
jest.mock('@/lib/utils/locale', () => ({
  getUserLanguage: jest.fn(() => Promise.resolve('fr')),
}));

// Mock getDictionary
jest.mock('@/lib/utils/dictionaries', () => ({
  getDictionary: jest.fn(() => Promise.resolve({
    profile: 'Profil',
    settings: 'Paramètres',
    logout: 'Déconnexion',
  })),
}));

// Mock DropdownMenu components
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-dropdown-menu>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-dropdown-menu-trigger {...props}>{children}</div>
  ),
  DropdownMenuContent: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-dropdown-menu-content {...props}>{children}</div>
  ),
  DropdownMenuItem: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-dropdown-menu-item {...props}>{children}</div>
  ),
  DropdownMenuSeparator: (props: Record<string, unknown>) => <hr data-dropdown-menu-separator {...props} />,
  DropdownMenuLabel: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-dropdown-menu-label {...props}>{children}</div>
  ),
}));

// Mock form action (server actions)
jest.mock('@/app/api/auth/logout/route', () => ({}));

describe('TopBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the navigation bar', async () => {
      const Component = await TopBar();
      render(Component);
      
      expect(screen.getByTestId(COMMON_TEST_IDS.topBar.nav)).toBeInTheDocument();
    });

    it('should render the logo link', async () => {
      const Component = await TopBar();
      render(Component);
      
      const logoLink = screen.getByTestId(COMMON_TEST_IDS.topBar.logoLink);
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute('href', '/home');
    });

    it('should render the logo image', async () => {
      const Component = await TopBar();
      render(Component);
      
      const logo = screen.getByTestId(COMMON_TEST_IDS.topBar.logo);
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('alt', 'Waterfall Logo');
    });

    it('should render the avatar button', async () => {
      const Component = await TopBar();
      render(Component);
      
      const avatarButton = screen.getByTestId(COMMON_TEST_IDS.topBar.avatarButton);
      expect(avatarButton).toBeInTheDocument();
    });
  });

  describe('Avatar Display', () => {
    it('should render avatar image when avatarUrl is provided', async () => {
      const Component = await TopBar();
      render(Component);
      
      const avatarImage = screen.getByTestId(COMMON_TEST_IDS.topBar.avatarImage);
      expect(avatarImage).toBeInTheDocument();
    });

    it('should apply correct styles to avatar button', async () => {
      const Component = await TopBar();
      render(Component);
      
      const avatarButton = screen.getByTestId(COMMON_TEST_IDS.topBar.avatarButton);
      expect(avatarButton).toHaveClass('border');
      expect(avatarButton).toHaveClass('border-waterfall-icon');
    });
  });

  describe('Dropdown Menu', () => {
    it('should render dropdown menu content', async () => {
      const Component = await TopBar();
      render(Component);
      
      const dropdownContent = screen.getByTestId(COMMON_TEST_IDS.topBar.dropdownContent);
      expect(dropdownContent).toBeInTheDocument();
    });

    it('should render profile modal button', async () => {
      const Component = await TopBar();
      render(Component);
      
      const profileButton = screen.getByTestId(COMMON_TEST_IDS.topBar.profileLink);
      expect(profileButton).toBeInTheDocument();
      // ProfileModal est maintenant un bouton, pas un lien
      expect(profileButton.tagName).not.toBe('A');
    });
  });

  describe('Test IDs Coverage', () => {
    it('should have all required test IDs in the DOM', async () => {
      const Component = await TopBar();
      render(Component);

      // Navigation
      expect(screen.getByTestId(COMMON_TEST_IDS.topBar.nav)).toBeInTheDocument();
      
      // Logo
      expect(screen.getByTestId(COMMON_TEST_IDS.topBar.logoLink)).toBeInTheDocument();
      expect(screen.getByTestId(COMMON_TEST_IDS.topBar.logo)).toBeInTheDocument();
      
      // Avatar
      expect(screen.getByTestId(COMMON_TEST_IDS.topBar.avatarButton)).toBeInTheDocument();
      
      // Dropdown
      expect(screen.getByTestId(COMMON_TEST_IDS.topBar.dropdownContent)).toBeInTheDocument();
      expect(screen.getByTestId(COMMON_TEST_IDS.topBar.profileLink)).toBeInTheDocument();
    });
  });

  describe('Design Tokens Usage', () => {
    it('should use waterfall icon color for avatar button border', async () => {
      const Component = await TopBar();
      render(Component);
      
      const avatarButton = screen.getByTestId(COMMON_TEST_IDS.topBar.avatarButton);
      expect(avatarButton).toHaveClass('border-waterfall-icon');
    });

    it('should use icon size classes for avatar button', async () => {
      const Component = await TopBar();
      render(Component);
      
      const avatarButton = screen.getByTestId(COMMON_TEST_IDS.topBar.avatarButton);
      expect(avatarButton).toHaveClass('flex');
    });
  });



  describe('Accessibility', () => {
    it('should have proper semantic navigation element', async () => {
      const Component = await TopBar();
      render(Component);
      
      const nav = screen.getByTestId(COMMON_TEST_IDS.topBar.nav);
      expect(nav.tagName).toBe('NAV');
    });

    it('should have alt text for logo image', async () => {
      const Component = await TopBar();
      render(Component);
      
      const logo = screen.getByTestId(COMMON_TEST_IDS.topBar.logo);
      expect(logo).toHaveAttribute('alt', 'Waterfall Logo');
    });

  });

  describe('Layout and Styling', () => {
    it('should have proper navigation classes', async () => {
      const Component = await TopBar();
      render(Component);
      
      const nav = screen.getByTestId(COMMON_TEST_IDS.topBar.nav);
      expect(nav).toHaveClass('w-full');
      expect(nav).toHaveClass('bg-waterfall-accent');
    });

    it('should have rounded avatar button', async () => {
      const Component = await TopBar();
      render(Component);
      
      const avatarButton = screen.getByTestId(COMMON_TEST_IDS.topBar.avatarButton);
      expect(avatarButton).toHaveClass('rounded-full');
    });
  });
});
