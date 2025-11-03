import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import InitApp from './initApp';

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
  title: 'Initialisation de l\'application',
  company: {
    title: 'Informations de l\'entreprise',
    label: 'Nom de l\'entreprise',
    desc: 'Entrez le nom de votre entreprise'
  },
  user: {
    title: 'Informations de l\'utilisateur',
    email_label: 'Email',
    email_desc: 'adresse@exemple.com'
  },
  password: 'Mot de passe',
  password_confirm: '(confirmation)',
  password_desc: 'Entrez votre mot de passe',
  submit: 'Initialiser',
  success: 'Initialisation réussie !',
  error_company: 'Erreur entreprise',
  error_user: 'Erreur utilisateur',
  loading: 'Chargement...'
};

describe('InitApp Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('should render the component with all form fields', () => {
      render(<InitApp dictionary={mockDictionary} />);

      // Vérifier la présence du titre
      expect(screen.getByText(mockDictionary.title)).toBeInTheDocument();
      
      // Vérifier la présence des sections
      expect(screen.getByText(mockDictionary.company.title)).toBeInTheDocument();
      expect(screen.getByText(mockDictionary.user.title)).toBeInTheDocument();
      
      // Vérifier la présence des champs par placeholder
      expect(screen.getByPlaceholderText(mockDictionary.company.desc)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(mockDictionary.user.email_desc)).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText(mockDictionary.password_desc)).toHaveLength(2);
      
      // Vérifier le bouton de soumission
      expect(screen.getByRole('button', { name: mockDictionary.submit })).toBeInTheDocument();
    });

    it('should render form fields with correct types', () => {
      render(<InitApp dictionary={mockDictionary} />);

      expect(screen.getByPlaceholderText(mockDictionary.company.desc)).toHaveAttribute('type', 'text');
      expect(screen.getByPlaceholderText(mockDictionary.user.email_desc)).toHaveAttribute('type', 'email');
      const passwordFields = screen.getAllByPlaceholderText(mockDictionary.password_desc);
      expect(passwordFields[0]).toHaveAttribute('type', 'password');
      expect(passwordFields[1]).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Validation', () => {
    it('should show Zod validation errors when fields are empty', async () => {
      const user = userEvent.setup();
      render(<InitApp dictionary={mockDictionary} />);

      const submitButton = screen.getByRole('button', { name: mockDictionary.submit });
      await user.click(submitButton);

      // Zod validation should show inline errors for empty fields
      await waitFor(() => {
        expect(screen.getByText('Nom de la compagnie requis')).toBeInTheDocument();
      });
    });

    it('should show Zod error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<InitApp dictionary={mockDictionary} />);

      await user.type(screen.getByPlaceholderText(mockDictionary.company.desc), 'Test Company');
      await user.type(screen.getByPlaceholderText(mockDictionary.user.email_desc), 'test@example.com');
      
      const passwordFields = screen.getAllByPlaceholderText(mockDictionary.password_desc);
      // Valid password format but different
      await user.type(passwordFields[0], 'Password123');
      await user.type(passwordFields[1], 'Different123');

      const submitButton = screen.getByRole('button', { name: mockDictionary.submit });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form successfully with valid data', async () => {
      const user = userEvent.setup();
      render(<InitApp dictionary={mockDictionary} />);

      // Fill form with valid data (password must meet Zod requirements)
      await user.type(screen.getByPlaceholderText(mockDictionary.company.desc), 'Test Company');
      await user.type(screen.getByPlaceholderText(mockDictionary.user.email_desc), 'test@example.com');
      const passwordFields = screen.getAllByPlaceholderText(mockDictionary.password_desc);
      await user.type(passwordFields[0], 'Password123');
      await user.type(passwordFields[1], 'Password123');

      // Mock successful responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            company: { id: 'company-123' },
            user: { id: 'user-456' }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Guardian initialized' })
        });

      const submitButton = screen.getByRole('button', { name: mockDictionary.submit });
      await user.click(submitButton);

      // Vérifier les appels fetch
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      // Vérifier le premier appel (identity)
      expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/identity/init-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: { name: 'Test Company' },
          user: { email: 'test@example.com', password: 'Password123' }
        })
      });

      // Vérifier le message de succès et la redirection
      await waitFor(() => {
        expect(screen.getByText(mockDictionary.success)).toBeInTheDocument();
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should handle service error', async () => {
      const user = userEvent.setup();
      render(<InitApp dictionary={mockDictionary} />);

      // Fill form with valid data
      await user.type(screen.getByPlaceholderText(mockDictionary.company.desc), 'Test Company');
      await user.type(screen.getByPlaceholderText(mockDictionary.user.email_desc), 'test@example.com');
      const passwordFields = screen.getAllByPlaceholderText(mockDictionary.password_desc);
      await user.type(passwordFields[0], 'Password123');
      await user.type(passwordFields[1], 'Password123');

      // Mock error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Service error' })
      });

      const submitButton = screen.getByRole('button', { name: mockDictionary.submit });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Erreur lors de l\'initialisation de l\'identité')).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('should allow typing in all form fields', async () => {
      const user = userEvent.setup();
      render(<InitApp dictionary={mockDictionary} />);

      const companyField = screen.getByPlaceholderText(mockDictionary.company.desc);
      const userEmailField = screen.getByPlaceholderText(mockDictionary.user.email_desc);
      const passwordFields = screen.getAllByPlaceholderText(mockDictionary.password_desc);

      await user.type(companyField, 'My Company');
      await user.type(userEmailField, 'user@test.com');
      await user.type(passwordFields[0], 'MyPassword123');
      await user.type(passwordFields[1], 'MyPassword123');

      expect(companyField).toHaveValue('My Company');
      expect(userEmailField).toHaveValue('user@test.com');
      expect(passwordFields[0]).toHaveValue('MyPassword123');
      expect(passwordFields[1]).toHaveValue('MyPassword123');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(<InitApp dictionary={mockDictionary} />);

      // Vérifier que les champs existent et sont accessibles
      expect(screen.getByPlaceholderText(mockDictionary.company.desc)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(mockDictionary.user.email_desc)).toBeInTheDocument();
      const passwordFields = screen.getAllByPlaceholderText(mockDictionary.password_desc);
      expect(passwordFields).toHaveLength(2);
      expect(passwordFields[0]).toBeInTheDocument();
      expect(passwordFields[1]).toBeInTheDocument();
    });

    it('should have proper submit button', () => {
      render(<InitApp dictionary={mockDictionary} />);

      const submitButton = screen.getByRole('button', { name: mockDictionary.submit });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });
});