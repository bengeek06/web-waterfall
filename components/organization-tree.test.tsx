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
import OrganizationTree from './organization-tree';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetchWithAuth
jest.mock('@/lib/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Building2: () => <div data-testid="building-icon">Building Icon</div>,
  ChevronRight: () => <div data-testid="chevron-right">Right</div>,
  ChevronDown: () => <div data-testid="chevron-down">Down</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Edit: () => <div data-testid="edit-icon">Edit</div>,
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
}));

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

const mockDictionary = {
  title: 'Organisation',
  description: 'Gérer la structure organisationnelle',
  no_units: 'Aucune unité organisationnelle',
  loading: 'Chargement...',
  error_loading: 'Erreur de chargement',
  actions: {
    add_root: 'Ajouter une unité racine',
    add_child: 'Ajouter une sous-unité',
    edit: 'Modifier',
    delete: 'Supprimer',
  },
  positions: {
    title: 'Positions',
    no_positions: 'Aucune position',
    add_position: 'Ajouter une position',
    edit: 'Modifier',
    delete: 'Supprimer',
  },
  unit_modal: {
    create_title: 'Créer une unité',
    create_child_title: 'Créer une sous-unité',
    edit_title: 'Modifier l\'unité',
    name: 'Nom',
    name_required: 'Nom requis',
    description: 'Description',
    parent: 'Parent',
    cancel: 'Annuler',
    save: 'Enregistrer',
  },
  position_modal: {
    create_title: 'Créer une position',
    edit_title: 'Modifier la position',
    title: 'Titre',
    title_required: 'Titre requis',
    description: 'Description',
    level: 'Niveau',
    organization_unit: 'Unité organisationnelle',
    cancel: 'Annuler',
    save: 'Enregistrer',
  },
  messages: {
    unit_created: 'Unité créée avec succès',
    unit_updated: 'Unité mise à jour',
    unit_deleted: 'Unité supprimée',
    position_created: 'Position créée',
    position_updated: 'Position mise à jour',
    position_deleted: 'Position supprimée',
    error_create: 'Erreur lors de la création',
    error_update: 'Erreur lors de la modification',
    error_delete: 'Erreur lors de la suppression',
    confirm_delete_unit: 'Supprimer cette unité ?',
    confirm_delete_position: 'Supprimer cette position ?',
  },
};

describe('OrganizationTree Component', () => {
  const { fetchWithAuth } = require('@/lib/fetchWithAuth');

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchWithAuth as jest.Mock).mockClear();
    (require('next/navigation').useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Rendering', () => {
    it('should render the component with title', async () => {
      (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ organization_units: [] }),
      });

      render(<OrganizationTree companyId="company-123" dictionary={mockDictionary} />);
      
      await waitFor(() => {
        expect(screen.getByText(mockDictionary.title)).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      (fetchWithAuth as jest.Mock).mockImplementation(
        () => new Promise(() => undefined) // Never resolves
      );

      render(<OrganizationTree companyId="company-123" dictionary={mockDictionary} />);
      expect(screen.getByText('Chargement...')).toBeInTheDocument();
    });

    it('should show no units message when empty', async () => {
      (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ organization_units: [] }),
      });

      render(<OrganizationTree companyId="company-123" dictionary={mockDictionary} />);

      await waitFor(() => {
        expect(screen.getByText(mockDictionary.no_units)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch error gracefully', async () => {
      (fetchWithAuth as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<OrganizationTree companyId="company-123" dictionary={mockDictionary} />);

      await waitFor(() => {
        expect(screen.getByText(mockDictionary.error_loading)).toBeInTheDocument();
      });
    });

    it('should handle API error response', async () => {
      (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      render(<OrganizationTree companyId="company-123" dictionary={mockDictionary} />);

      await waitFor(() => {
        expect(screen.getByText(mockDictionary.error_loading)).toBeInTheDocument();
      });
    });
  });
});
