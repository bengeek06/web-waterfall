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

/**
 * Tests for Company component including:
 * - Error handling for failed API calls
 * - Loading state behavior
 * - Unsaved changes detection for back button navigation
 * 
 * IMPORTANT: The useRouter mock MUST return a stable object reference.
 * Creating a new object on each call (e.g., `useRouter: () => ({ push: mockPush })`)
 * causes infinite re-renders because the router object is a useEffect dependency.
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { COMPANY_TEST_IDS } from "@/lib/test-ids";

// Mock useRouter - MUST return stable reference to avoid infinite loops
const mockPush = jest.fn();
const mockRouter = { push: mockPush };
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

// Mock fetchWithAuth
jest.mock("@/lib/auth/fetchWithAuth", () => {
  const mockFn = jest.fn();
  return {
    __esModule: true,
    fetchWithAuth: mockFn,
    __mockFetchWithAuth: mockFn,
  };
});

import * as fetchWithAuthModule from "@/lib/auth/fetchWithAuth";
const mockFetchWithAuth = (fetchWithAuthModule as unknown as { __mockFetchWithAuth: jest.Mock }).__mockFetchWithAuth;

import Company from "./Company";

const mockDictionary = {
  title: "Company Information",
  description: "Manage your company information",
  form: {
    name: "Company Name",
    address: "Address",
    city: "City",
    postal_code: "Postal Code",
    country: "Country",
    phone: "Phone",
    email: "Email",
    website: "Website",
    siret: "SIRET",
    vat_number: "VAT Number",
    save: "Save",
    cancel: "Cancel",
    back: "Back",
    edit: "Edit",
  },
  dialog: {
    unsaved_changes_title: "Unsaved Changes",
    unsaved_changes_description: "You have unsaved changes. Are you sure you want to leave?",
    keep_editing: "Keep Editing",
    discard_changes: "Discard Changes",
  },
  messages: {
    save_success: "Company information has been successfully updated.",
    save_error: "Error saving company information.",
    load_error: "Error loading company information.",
    saving: "Saving...",
  },
  validation: {
    name_required: "Company name is required.",
  },
};

describe("Company", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockFetchWithAuth.mockReset();
  });

  describe("error handling", () => {
    it("should show error when loading fails", async () => {
      mockFetchWithAuth.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      render(<Company companyId="company-123" dictionary={mockDictionary} />);

      await waitFor(() => {
        expect(screen.getByText("Error loading company information.")).toBeInTheDocument();
      });
    });

    it("should redirect to login on 401", async () => {
      mockFetchWithAuth.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
      });

      render(<Company companyId="company-123" dictionary={mockDictionary} />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("test IDs", () => {
    it("should have COMPANY_TEST_IDS defined correctly", () => {
      expect(COMPANY_TEST_IDS.card).toBe("company-card");
      expect(COMPANY_TEST_IDS.backButton).toBe("company-back-button");
      expect(COMPANY_TEST_IDS.backButtonHeader).toBe("company-back-button-header");
      expect(COMPANY_TEST_IDS.editButton).toBe("company-edit-button");
      expect(COMPANY_TEST_IDS.cancelButton).toBe("company-cancel-button");
      expect(COMPANY_TEST_IDS.saveButton).toBe("company-save-button");
      expect(COMPANY_TEST_IDS.unsavedChangesDialog).toBe("company-unsaved-changes-dialog");
      expect(COMPANY_TEST_IDS.keepEditingButton).toBe("company-keep-editing-button");
      expect(COMPANY_TEST_IDS.discardChangesButton).toBe("company-discard-changes-button");
    });
  });

  describe("loading state", () => {
    it("should show loading state initially", () => {
      mockFetchWithAuth.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<Company companyId="company-123" dictionary={mockDictionary} />);
      
      expect(screen.getByText("Chargement...")).toBeInTheDocument();
    });
  });

  describe("unsaved changes detection", () => {
    const mockCompanyData = {
      id: "company-123",
      name: "Test Company",
      address: "123 Test Street",
      city: "Test City",
      postal_code: "12345",
      country: "Test Country",
      phone: "+1234567890",
      email: "company@test.com",
      website: "https://test.com",
      siret: "12345678901234",
      vat_number: "FR12345678901",
    };

    beforeEach(() => {
      // Use mockImplementation to have more control over the resolved promise
      mockFetchWithAuth.mockImplementation(() => (
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockCompanyData),
        })
      ));
    });

    it("should navigate directly when clicking back button without unsaved changes", async () => {
      const user = userEvent.setup();
      
      render(<Company companyId="company-123" dictionary={mockDictionary} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId(COMPANY_TEST_IDS.card)).toBeInTheDocument();
      });

      // Click back button (not in edit mode, so no unsaved changes)
      const backButton = screen.getByTestId(COMPANY_TEST_IDS.backButton);
      await user.click(backButton);

      // Should navigate directly
      expect(mockPush).toHaveBeenCalledWith("/home/settings");
      
      // Dialog should not appear
      expect(screen.queryByTestId(COMPANY_TEST_IDS.unsavedChangesDialog)).not.toBeInTheDocument();
    });

    it("should show dialog when clicking back button with unsaved changes", async () => {
      const user = userEvent.setup();
      
      render(<Company companyId="company-123" dictionary={mockDictionary} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId(COMPANY_TEST_IDS.card)).toBeInTheDocument();
      });

      // Enter edit mode
      const editButton = screen.getByTestId(COMPANY_TEST_IDS.editButton);
      await user.click(editButton);

      // Make a change to the form
      const nameInput = screen.getByTestId(COMPANY_TEST_IDS.nameInput);
      await user.clear(nameInput);
      await user.type(nameInput, "Modified Company Name");

      // Click back button
      const backButton = screen.getByTestId(COMPANY_TEST_IDS.backButton);
      await user.click(backButton);

      // Dialog should appear
      await waitFor(() => {
        expect(screen.getByTestId(COMPANY_TEST_IDS.unsavedChangesDialog)).toBeInTheDocument();
      });

      // Should not navigate yet
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should close dialog and stay on page when clicking Keep Editing", async () => {
      const user = userEvent.setup();
      
      render(<Company companyId="company-123" dictionary={mockDictionary} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId(COMPANY_TEST_IDS.card)).toBeInTheDocument();
      });

      // Enter edit mode
      const editButton = screen.getByTestId(COMPANY_TEST_IDS.editButton);
      await user.click(editButton);

      // Make a change to the form
      const nameInput = screen.getByTestId(COMPANY_TEST_IDS.nameInput);
      await user.clear(nameInput);
      await user.type(nameInput, "Modified Company Name");

      // Click back button
      const backButton = screen.getByTestId(COMPANY_TEST_IDS.backButton);
      await user.click(backButton);

      // Dialog should appear
      await waitFor(() => {
        expect(screen.getByTestId(COMPANY_TEST_IDS.unsavedChangesDialog)).toBeInTheDocument();
      });

      // Click "Keep Editing" button
      const keepEditingButton = screen.getByTestId(COMPANY_TEST_IDS.keepEditingButton);
      await user.click(keepEditingButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByTestId(COMPANY_TEST_IDS.unsavedChangesDialog)).not.toBeInTheDocument();
      });

      // Should still be on page (no navigation)
      expect(mockPush).not.toHaveBeenCalled();

      // Changes should still be present
      expect(nameInput).toHaveValue("Modified Company Name");
    });

    it("should navigate away when clicking Discard Changes", async () => {
      const user = userEvent.setup();
      
      render(<Company companyId="company-123" dictionary={mockDictionary} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId(COMPANY_TEST_IDS.card)).toBeInTheDocument();
      });

      // Enter edit mode
      const editButton = screen.getByTestId(COMPANY_TEST_IDS.editButton);
      await user.click(editButton);

      // Make a change to the form
      const nameInput = screen.getByTestId(COMPANY_TEST_IDS.nameInput);
      await user.clear(nameInput);
      await user.type(nameInput, "Modified Company Name");

      // Click back button
      const backButton = screen.getByTestId(COMPANY_TEST_IDS.backButton);
      await user.click(backButton);

      // Dialog should appear
      await waitFor(() => {
        expect(screen.getByTestId(COMPANY_TEST_IDS.unsavedChangesDialog)).toBeInTheDocument();
      });

      // Click "Discard Changes" button
      const discardChangesButton = screen.getByTestId(COMPANY_TEST_IDS.discardChangesButton);
      await user.click(discardChangesButton);

      // Should navigate away
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/home/settings");
      });
    });

    it("should correctly detect changes in multiple form fields", async () => {
      const user = userEvent.setup();
      
      render(<Company companyId="company-123" dictionary={mockDictionary} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId(COMPANY_TEST_IDS.card)).toBeInTheDocument();
      });

      // Enter edit mode
      const editButton = screen.getByTestId(COMPANY_TEST_IDS.editButton);
      await user.click(editButton);

      // Make changes to multiple fields
      const addressInput = screen.getByTestId(COMPANY_TEST_IDS.addressInput);
      await user.clear(addressInput);
      await user.type(addressInput, "456 New Street");

      const cityInput = screen.getByTestId(COMPANY_TEST_IDS.cityInput);
      await user.clear(cityInput);
      await user.type(cityInput, "New City");

      // Click back button
      const backButton = screen.getByTestId(COMPANY_TEST_IDS.backButton);
      await user.click(backButton);

      // Dialog should appear because of changes
      await waitFor(() => {
        expect(screen.getByTestId(COMPANY_TEST_IDS.unsavedChangesDialog)).toBeInTheDocument();
      });
    });

    it("should not show dialog after canceling edit mode", async () => {
      const user = userEvent.setup();
      
      render(<Company companyId="company-123" dictionary={mockDictionary} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId(COMPANY_TEST_IDS.card)).toBeInTheDocument();
      });

      // Enter edit mode
      const editButton = screen.getByTestId(COMPANY_TEST_IDS.editButton);
      await user.click(editButton);

      // Make a change to the form
      const nameInput = screen.getByTestId(COMPANY_TEST_IDS.nameInput);
      await user.clear(nameInput);
      await user.type(nameInput, "Modified Company Name");

      // Cancel editing
      const cancelButton = screen.getByTestId(COMPANY_TEST_IDS.cancelButton);
      await user.click(cancelButton);

      // Click back button - should navigate directly since we're no longer editing
      const backButton = screen.getByTestId(COMPANY_TEST_IDS.backButton);
      await user.click(backButton);

      // Should navigate directly (no dialog)
      expect(mockPush).toHaveBeenCalledWith("/home/settings");
      expect(screen.queryByTestId(COMPANY_TEST_IDS.unsavedChangesDialog)).not.toBeInTheDocument();
    });

    it("should work with header back button as well", async () => {
      const user = userEvent.setup();
      
      render(<Company companyId="company-123" dictionary={mockDictionary} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId(COMPANY_TEST_IDS.card)).toBeInTheDocument();
      });

      // Enter edit mode
      const editButton = screen.getByTestId(COMPANY_TEST_IDS.editButton);
      await user.click(editButton);

      // Make a change to the form
      const nameInput = screen.getByTestId(COMPANY_TEST_IDS.nameInput);
      await user.clear(nameInput);
      await user.type(nameInput, "Modified Company Name");

      // Click header back button
      const backButtonHeader = screen.getByTestId(COMPANY_TEST_IDS.backButtonHeader);
      await user.click(backButtonHeader);

      // Dialog should appear
      await waitFor(() => {
        expect(screen.getByTestId(COMPANY_TEST_IDS.unsavedChangesDialog)).toBeInTheDocument();
      });
    });
  });
});
