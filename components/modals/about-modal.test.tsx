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

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AboutModal from './about-modal';
import { ABOUT_TEST_IDS } from '@/lib/test-ids';

// Mock fetchWithAuth
jest.mock('@/lib/auth/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(),
}));

// Mock dictionary
const mockDictionary = {
  about: {
    title: 'About Waterfall',
    application: 'Application',
    app_name: 'Waterfall Web',
    backend_services: 'Backend Services',
    loading: 'Loading...',
    unknown: 'Unknown',
    error: 'Error',
    copyright: '© 2025 Waterfall Project Management',
  },
} as unknown as Parameters<typeof AboutModal>[0]['dictionary'];

// Mock fetch for /api/version and /api/services
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AboutModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render trigger button with children', () => {
    render(
      <AboutModal dictionary={mockDictionary}>
        <span>Open About</span>
      </AboutModal>
    );

    expect(screen.getByText('Open About')).toBeInTheDocument();
    expect(screen.getByTestId(ABOUT_TEST_IDS.trigger)).toBeInTheDocument();
  });

  it('should open modal when trigger is clicked', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/version') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ version: '1.0.0' }),
        });
      }
      if (url === '/api/services') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ services: [] }),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <AboutModal dictionary={mockDictionary}>
        <span>Open About</span>
      </AboutModal>
    );

    fireEvent.click(screen.getByTestId(ABOUT_TEST_IDS.trigger));

    await waitFor(() => {
      expect(screen.getByTestId(ABOUT_TEST_IDS.dialog)).toBeInTheDocument();
    });

    expect(screen.getByTestId(ABOUT_TEST_IDS.title)).toHaveTextContent('About Waterfall');
  });

  it('should display web version after fetching', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/version') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ version: '2.0.0' }),
        });
      }
      if (url === '/api/services') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ services: [] }),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <AboutModal dictionary={mockDictionary}>
        <span>Open About</span>
      </AboutModal>
    );

    fireEvent.click(screen.getByTestId(ABOUT_TEST_IDS.trigger));

    await waitFor(() => {
      expect(screen.getByTestId(ABOUT_TEST_IDS.webVersion)).toHaveTextContent('v2.0.0');
    });
  });

  it('should display backend services', async () => {
    const { fetchWithAuth } = jest.requireMock('@/lib/auth/fetchWithAuth');
    
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/version') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ version: '1.0.0' }),
        });
      }
      if (url === '/api/services') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            services: [
              { name: 'Auth Service', endpoint: '/api/auth/version' },
              { name: 'Identity Service', endpoint: '/api/identity/version' },
            ],
          }),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    fetchWithAuth.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ version: '1.5.0' }),
      })
    );

    render(
      <AboutModal dictionary={mockDictionary}>
        <span>Open About</span>
      </AboutModal>
    );

    fireEvent.click(screen.getByTestId(ABOUT_TEST_IDS.trigger));

    await waitFor(() => {
      expect(screen.getByTestId(ABOUT_TEST_IDS.serviceItem('Auth Service'))).toBeInTheDocument();
      expect(screen.getByTestId(ABOUT_TEST_IDS.serviceItem('Identity Service'))).toBeInTheDocument();
    });
  });

  it('should handle version fetch error gracefully', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/version') {
        return Promise.reject(new Error('Network error'));
      }
      if (url === '/api/services') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ services: [] }),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <AboutModal dictionary={mockDictionary}>
        <span>Open About</span>
      </AboutModal>
    );

    fireEvent.click(screen.getByTestId(ABOUT_TEST_IDS.trigger));

    await waitFor(() => {
      expect(screen.getByTestId(ABOUT_TEST_IDS.webVersion)).toHaveTextContent('Error');
    });
  });

  it('should display footer with copyright', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/version') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ version: '1.0.0' }),
        });
      }
      if (url === '/api/services') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ services: [] }),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <AboutModal dictionary={mockDictionary}>
        <span>Open About</span>
      </AboutModal>
    );

    fireEvent.click(screen.getByTestId(ABOUT_TEST_IDS.trigger));

    await waitFor(() => {
      expect(screen.getByTestId(ABOUT_TEST_IDS.footer)).toHaveTextContent('© 2025 Waterfall Project Management');
    });
  });

  it('should have correct test IDs for all elements', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/version') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ version: '1.0.0' }),
        });
      }
      if (url === '/api/services') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ services: [] }),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <AboutModal dictionary={mockDictionary}>
        <span>Open About</span>
      </AboutModal>
    );

    fireEvent.click(screen.getByTestId(ABOUT_TEST_IDS.trigger));

    await waitFor(() => {
      expect(screen.getByTestId(ABOUT_TEST_IDS.dialog)).toBeInTheDocument();
      expect(screen.getByTestId(ABOUT_TEST_IDS.title)).toBeInTheDocument();
      expect(screen.getByTestId(ABOUT_TEST_IDS.applicationSection)).toBeInTheDocument();
      expect(screen.getByTestId(ABOUT_TEST_IDS.webVersion)).toBeInTheDocument();
      expect(screen.getByTestId(ABOUT_TEST_IDS.webVersionStatus)).toBeInTheDocument();
      expect(screen.getByTestId(ABOUT_TEST_IDS.servicesSection)).toBeInTheDocument();
      expect(screen.getByTestId(ABOUT_TEST_IDS.footer)).toBeInTheDocument();
    });
  });
});
