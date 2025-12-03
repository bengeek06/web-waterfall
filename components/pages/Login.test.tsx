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
import { useRouter } from 'next/navigation';
import Login from './Login';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, className }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

// Dictionary de test
const mockDictionary = {
  login: 'Connexion',
  email: 'Adresse email',
  password: 'Mot de passe',
  submit: 'Se connecter',
  invalid_email: 'Format d\'email invalide',
  login_failed: 'Échec de la connexion',
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('should render the component with all form fields', () => {
      render(<Login dictionary={mockDictionary} />);

      // Vérifier la présence du titre et logo
      expect(screen.getByTestId('login-title')).toBeInTheDocument();
      expect(screen.getByText(mockDictionary.login)).toBeInTheDocument();
      
      // Vérifier la présence des champs via test IDs
      expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
      
      // Vérifier les icônes
      expect(screen.getByTestId('login-email-icon')).toBeInTheDocument();
      expect(screen.getByTestId('login-password-icon')).toBeInTheDocument();
      
      // Vérifier le bouton
      expect(screen.getByTestId('login-submit-button')).toBeInTheDocument();
    });

    it('should render form fields with correct types', () => {
      render(<Login dictionary={mockDictionary} />);

      expect(screen.getByTestId('login-email-input')).toHaveAttribute('type', 'email');
      expect(screen.getByTestId('login-password-input')).toHaveAttribute('type', 'password');
    });

    it('should have proper card structure with test IDs', () => {
      render(<Login dictionary={mockDictionary} />);

      expect(screen.getByTestId('login-card')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should have required attribute on email input', () => {
      render(<Login dictionary={mockDictionary} />);

      const emailInput = screen.getByTestId('login-email-input');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should show Zod validation error for short password', async () => {
      const user = userEvent.setup();
      render(<Login dictionary={mockDictionary} />);

      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');
      const submitButton = screen.getByTestId('login-submit-button');
      
      // Enter valid email but password too short (Zod: min 6 chars)
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '12345'); // 5 chars - invalid
      await user.click(submitButton);

      // Zod validation should show inline error for password (uses default English messages)
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
      
      // Should not call API with invalid data
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should have required attribute on password input', () => {
      render(<Login dictionary={mockDictionary} />);

      const passwordInput = screen.getByTestId('login-password-input');
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should accept valid email format', async () => {
      const user = userEvent.setup();
      render(<Login dictionary={mockDictionary} />);

      const emailInput = screen.getByTestId('login-email-input');
      await user.type(emailInput, 'valid@example.com');

      expect(emailInput).toHaveValue('valid@example.com');
    });
  });

  describe('Form Submission', () => {
    it('should submit form successfully with valid credentials', async () => {
      const user = userEvent.setup();
      render(<Login dictionary={mockDictionary} />);

      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      // Remplir le formulaire
      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');
      
      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'Admin123!');

      const submitButton = screen.getByTestId('login-submit-button');
      await user.click(submitButton);

      // Vérifier l'appel fetch
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@test.com',
            password: 'Admin123!'
          })
        });
      });

      // Vérifier la redirection
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/home');
      });
    });

    it('should handle login failure with error message', async () => {
      const user = userEvent.setup();
      render(<Login dictionary={mockDictionary} />);

      // Remplir le formulaire
      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');
      
      await user.type(emailInput, 'wrong@test.com');
      await user.type(passwordInput, 'wrongpassword');

      // Mock error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid credentials' })
      });

      const submitButton = screen.getByTestId('login-submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('login-error-message')).toBeInTheDocument();
        expect(screen.getByTestId('login-error-message')).toHaveTextContent(mockDictionary.login_failed);
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle network error', async () => {
      const user = userEvent.setup();
      render(<Login dictionary={mockDictionary} />);

      // Remplir le formulaire
      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');
      
      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'Admin123!');

      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const submitButton = screen.getByTestId('login-submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('login-error-message')).toBeInTheDocument();
        expect(screen.getByTestId('login-error-message')).toHaveTextContent(mockDictionary.login_failed);
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('should allow typing in all form fields', async () => {
      const user = userEvent.setup();
      render(<Login dictionary={mockDictionary} />);

      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');

      await user.type(emailInput, 'user@test.com');
      await user.type(passwordInput, 'mypassword');

      expect(emailInput).toHaveValue('user@test.com');
      expect(passwordInput).toHaveValue('mypassword');
    });

    it('should disable form during loading state', async () => {
      const user = userEvent.setup();
      render(<Login dictionary={mockDictionary} />);

      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');
      
      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'Admin123!');

      // Mock slow response
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        }), 100))
      );

      const submitButton = screen.getByTestId('login-submit-button');
      await user.click(submitButton);

      // Vérifier que les champs sont désactivés pendant le chargement
      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
    });

  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(<Login dictionary={mockDictionary} />);

      expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
    });

    it('should have proper submit button with correct type', () => {
      render(<Login dictionary={mockDictionary} />);

      const submitButton = screen.getByTestId('login-submit-button');
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should have all test IDs for E2E testing', () => {
      render(<Login dictionary={mockDictionary} />);

      // Vérifier la présence de tous les test IDs définis dans la nouvelle architecture
      expect(screen.getByTestId('login-card')).toBeInTheDocument();
      expect(screen.getByTestId('login-title')).toBeInTheDocument();
      expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('login-email-icon')).toBeInTheDocument();
      expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('login-password-icon')).toBeInTheDocument();
      expect(screen.getByTestId('login-submit-button')).toBeInTheDocument();
    });
  });

  describe('Design Tokens Integration', () => {
    it('should render with proper CSS classes from design tokens', () => {
      render(<Login dictionary={mockDictionary} />);

      // Vérifier que les éléments ont les classes appropriées
      const emailIcon = screen.getByTestId('login-email-icon');
      const passwordIcon = screen.getByTestId('login-password-icon');

      // Les icônes doivent avoir les classes de taille
      expect(emailIcon).toHaveClass('w-5', 'h-5');
      expect(passwordIcon).toHaveClass('w-5', 'h-5');
    });
  });

  describe('API Routes Integration', () => {
    it('should use centralized API route constant', async () => {
      const user = userEvent.setup();
      render(<Login dictionary={mockDictionary} />);

      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');
      
      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'Admin123!');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const submitButton = screen.getByTestId('login-submit-button');
      await user.click(submitButton);

      // Vérifier que le fetch utilise la route centralisée /api/auth/login
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/login',
          expect.any(Object)
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear previous errors on new submission', async () => {
      const user = userEvent.setup();
      render(<Login dictionary={mockDictionary} />);

      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');
      const submitButton = screen.getByTestId('login-submit-button');

      // First attempt with API error
      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'validpassword');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' })
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('login-error-message')).toBeInTheDocument();
      });

      // Second attempt with success
      await user.clear(emailInput);
      await user.clear(passwordInput);
      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'Admin123!');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await user.click(submitButton);

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByTestId('login-error-message')).not.toBeInTheDocument();
      });
    });

    it('should display API error messages when login fails', async () => {
      const user = userEvent.setup();
      render(<Login dictionary={mockDictionary} />);

      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');
      
      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'validpassword');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid credentials' })
      });

      const submitButton = screen.getByTestId('login-submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByTestId('login-error-message');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(mockDictionary.login_failed);
      });
    });
  });
});
