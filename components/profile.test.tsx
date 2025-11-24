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
import Profile from './profile';
import { DASHBOARD_TEST_IDS } from '@/lib/test-ids';
import { IDENTITY_ROUTES } from '@/lib/api-routes';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
  })),
}));

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: any) => <img {...props} />,
}));

describe('Profile Component', () => {
  const mockUser = {
    id: '123',
    email: 'user@example.com',
    first_name: 'John',
    last_name: 'Doe',
    phone_number: '+1234567890',
    has_avatar: false,
    avatar_file_id: undefined,
    language: 'fr',
  };

  const mockDictionary = {
    profile_title: 'Mon profil',
    profile_email: 'Email',
    profile_phone: 'Téléphone',
    profile_first_name: 'Prénom',
    profile_last_name: 'Nom',
    profile_avatar: "Changer l'avatar",
    profile_old_password: 'Ancien mot de passe',
    profile_new_password: 'Nouveau mot de passe',
    profile_new_password2: 'Confirmer le nouveau mot de passe',
    profile_password_mismatch: 'Les nouveaux mots de passe ne correspondent pas.',
    profile_update_error: 'Erreur lors de la mise à jour.',
    profile_update_success: 'Profil mis à jour avec succès.',
    profile_cancel: 'Abandonner',
    profile_save: 'Enregistrer',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  describe('Initial Render', () => {
    it('should render the profile form with user data', () => {
      render(<Profile user={mockUser} dictionary={mockDictionary} />);

      expect(screen.getByTestId(DASHBOARD_TEST_IDS.profile.form)).toBeInTheDocument();
      expect(screen.getByText('Mon profil')).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.profile.emailInput)).toHaveValue('user@example.com');
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.profile.nameInput)).toHaveValue('John');
    });

    it('should render language switcher', () => {
      render(<Profile user={mockUser} dictionary={mockDictionary} />);

      expect(screen.getByTestId('profile-language-switcher')).toBeInTheDocument();
      expect(screen.getByText('🇫🇷')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<Profile user={mockUser} dictionary={mockDictionary} />);

      expect(screen.getByTestId(DASHBOARD_TEST_IDS.profile.emailInput)).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.profile.nameInput)).toBeInTheDocument();
      expect(screen.getByTestId('profile-lastname-input')).toBeInTheDocument();
      expect(screen.getByTestId('profile-phone-input')).toBeInTheDocument();
      expect(screen.getByTestId('profile-old-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('profile-new-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('profile-confirm-password-input')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<Profile user={mockUser} dictionary={mockDictionary} />);

      expect(screen.getByTestId(DASHBOARD_TEST_IDS.profile.saveButton)).toBeInTheDocument();
      expect(screen.getByTestId(DASHBOARD_TEST_IDS.profile.cancelButton)).toBeInTheDocument();
    });
  });

  describe('Language Switching', () => {
    it('should render language switcher button', () => {
      render(<Profile user={mockUser} dictionary={mockDictionary} />);

      const languageSwitcher = screen.getByTestId('profile-language-switcher');
      expect(languageSwitcher).toBeInTheDocument();
      expect(languageSwitcher).toHaveTextContent('🇫🇷');
      expect(languageSwitcher).toHaveTextContent('Français');
    });

    it('should display English when user language is English', () => {
      const englishUser = { ...mockUser, language: 'en' };
      render(<Profile user={englishUser} dictionary={mockDictionary} />);

      const languageSwitcher = screen.getByTestId('profile-language-switcher');
      expect(languageSwitcher).toHaveTextContent('🇬🇧');
      expect(languageSwitcher).toHaveTextContent('English');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with updated data', async () => {
      render(<Profile user={mockUser} dictionary={mockDictionary} />);

      const emailInput = screen.getByTestId(DASHBOARD_TEST_IDS.profile.emailInput);
      fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

      const saveButton = screen.getByTestId(DASHBOARD_TEST_IDS.profile.saveButton);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          IDENTITY_ROUTES.user('123'),
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('newemail@example.com'),
          })
        );
      });
    });

    it('should show error when passwords do not match', async () => {
      render(<Profile user={mockUser} dictionary={mockDictionary} />);

      const newPasswordInput = screen.getByTestId('profile-new-password-input');
      const confirmPasswordInput = screen.getByTestId('profile-confirm-password-input');

      fireEvent.change(newPasswordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });

      const saveButton = screen.getByTestId(DASHBOARD_TEST_IDS.profile.saveButton);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('profile-message')).toHaveTextContent(
          'Les nouveaux mots de passe ne correspondent pas.'
        );
      });
    });

    it('should show success message on successful update', async () => {
      jest.useFakeTimers();

      render(<Profile user={mockUser} dictionary={mockDictionary} />);

      const saveButton = screen.getByTestId(DASHBOARD_TEST_IDS.profile.saveButton);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('profile-message')).toHaveTextContent(
          'Profil mis à jour avec succès.'
        );
      });

      jest.useRealTimers();
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      render(<Profile user={mockUser} dictionary={mockDictionary} />);

      const saveButton = screen.getByTestId(DASHBOARD_TEST_IDS.profile.saveButton);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('profile-message')).toHaveTextContent('Server error');
      });
    });
  });

  describe('Cancel Action', () => {
    it('should go back when cancel button is clicked', () => {
      const mockBack = jest.fn();
      Object.defineProperty(window, 'history', {
        value: { back: mockBack },
        writable: true,
      });

      render(<Profile user={mockUser} dictionary={mockDictionary} />);

      const cancelButton = screen.getByTestId(DASHBOARD_TEST_IDS.profile.cancelButton);
      fireEvent.click(cancelButton);

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Avatar Upload', () => {
    it('should update avatar preview when file is selected', () => {
      render(<Profile user={mockUser} dictionary={mockDictionary} />);

      const fileInput = screen.getByTestId('profile-avatar-input');
      const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/test');

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    });

    it('should send avatar file in FormData when submitting with avatar', async () => {
      render(<Profile user={mockUser} dictionary={mockDictionary} />);

      const fileInput = screen.getByTestId('profile-avatar-input');
      const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/test');

      // Select avatar file
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Submit form
      const saveButton = screen.getByTestId(DASHBOARD_TEST_IDS.profile.saveButton);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          IDENTITY_ROUTES.user('123'),
          expect.objectContaining({
            method: 'PATCH',
            body: expect.any(FormData),
          })
        );
      });

      // Verify FormData contains the avatar file
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const formData = fetchCall[1].body as FormData;
      expect(formData.get('avatar')).toBe(file);
      expect(formData.get('email')).toBe('user@example.com');
      expect(formData.get('first_name')).toBe('John');
      expect(formData.get('last_name')).toBe('Doe');
    });

    it('should send JSON when submitting without avatar', async () => {
      render(<Profile user={mockUser} dictionary={mockDictionary} />);

      // Change email
      const emailInput = screen.getByTestId(DASHBOARD_TEST_IDS.profile.emailInput);
      fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

      // Submit form
      const saveButton = screen.getByTestId(DASHBOARD_TEST_IDS.profile.saveButton);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          IDENTITY_ROUTES.user('123'),
          expect.objectContaining({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.any(String),
          })
        );
      });

      // Verify JSON body does NOT contain avatar_url
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const bodyString = fetchCall[1].body;
      const bodyJson = JSON.parse(bodyString);
      expect(bodyJson).not.toHaveProperty('avatar_url');
      expect(bodyJson.email).toBe('newemail@example.com');
    });
  });
});
