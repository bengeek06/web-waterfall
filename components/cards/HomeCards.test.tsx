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

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { HomeCards } from "./HomeCards";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { HOME_CARDS_TEST_IDS } from "@/lib/test-ids";

// Mock du hook usePermissions
jest.mock("@/lib/hooks/usePermissions");
const mockUsePermissions = usePermissions as jest.MockedFunction<
  typeof usePermissions
>;

// Mock du composant Link de Next.js
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

const mockDictionary = {
  administration: "Administration",
  access_administration: "Access Administration",
  company: "Company",
  access_company: "Access Company",
  projects: "Projects",
  access_projects: "Access Projects",
  workspace: "Workspace",
  access_workspace: "Access Workspace",
};

describe("HomeCards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("with full permissions", () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        permissions: [
          { service: "identity", resource: "users", action: "list" },
          { service: "guardian", resource: "roles", action: "list" },
          { service: "identity", resource: "subcontractors", action: "list" },
          { service: "identity", resource: "policies", action: "list" },
        ],
        loading: false,
        error: null,
        hasPermission: () => true,
      });
    });

    it("should render the container with test id", () => {
      render(<HomeCards dictionary={mockDictionary} />);
      
      expect(
        screen.getByTestId(HOME_CARDS_TEST_IDS.container)
      ).toBeInTheDocument();
    });

    it("should render all four cards when user has all permissions", async () => {
      render(<HomeCards dictionary={mockDictionary} />);

      await waitFor(() => {
        expect(screen.getByText("Administration")).toBeInTheDocument();
        expect(screen.getByText("Company")).toBeInTheDocument();
        expect(screen.getByText("Projects")).toBeInTheDocument();
        expect(screen.getByText("Workspace")).toBeInTheDocument();
      });
    });

    it("should render all cards with correct test ids", async () => {
      render(<HomeCards dictionary={mockDictionary} />);

      await waitFor(() => {
        expect(
          screen.getByTestId(HOME_CARDS_TEST_IDS.administrationCard)
        ).toBeInTheDocument();
        expect(
          screen.getByTestId(HOME_CARDS_TEST_IDS.companyCard)
        ).toBeInTheDocument();
        expect(
          screen.getByTestId(HOME_CARDS_TEST_IDS.projectsCard)
        ).toBeInTheDocument();
        expect(
          screen.getByTestId(HOME_CARDS_TEST_IDS.workspaceCard)
        ).toBeInTheDocument();
      });
    });

    it("should render all buttons with correct test ids", async () => {
      render(<HomeCards dictionary={mockDictionary} />);

      await waitFor(() => {
        expect(
          screen.getByTestId(HOME_CARDS_TEST_IDS.administrationButton)
        ).toBeInTheDocument();
        expect(
          screen.getByTestId(HOME_CARDS_TEST_IDS.companyButton)
        ).toBeInTheDocument();
        expect(
          screen.getByTestId(HOME_CARDS_TEST_IDS.projectsButton)
        ).toBeInTheDocument();
        expect(
          screen.getByTestId(HOME_CARDS_TEST_IDS.workspaceButton)
        ).toBeInTheDocument();
      });
    });

    it("should render buttons with correct labels from dictionary", async () => {
      render(<HomeCards dictionary={mockDictionary} />);

      await waitFor(() => {
        expect(screen.getByText("Access Administration")).toBeInTheDocument();
        expect(screen.getByText("Access Company")).toBeInTheDocument();
        expect(screen.getByText("Access Projects")).toBeInTheDocument();
        expect(screen.getByText("Access Workspace")).toBeInTheDocument();
      });
    });

    it("should have correct navigation links", async () => {
      render(<HomeCards dictionary={mockDictionary} />);

      await waitFor(() => {
        const adminLink = screen.getByRole("link", { name: /access administration/i });
        const companyLink = screen.getByRole("link", { name: /access company/i });
        const projectsLink = screen.getByRole("link", { name: /access projects/i });
        const workspaceLink = screen.getByRole("link", { name: /access workspace/i });

        expect(adminLink).toHaveAttribute("href", "/home/admin");
        expect(companyLink).toHaveAttribute("href", "/home/settings");
        expect(projectsLink).toHaveAttribute("href", "/home/projects");
        expect(workspaceLink).toHaveAttribute("href", "/home/workspace");
      });
    });
  });

  describe("with no permissions", () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        permissions: [],
        loading: false,
        error: null,
        hasPermission: () => false,
      });
    });

    it("should hide protected cards when user has no permissions", async () => {
      render(<HomeCards dictionary={mockDictionary} />);

      await waitFor(() => {
        // Protected cards should be hidden
        expect(
          screen.queryByTestId(HOME_CARDS_TEST_IDS.administrationCard)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId(HOME_CARDS_TEST_IDS.companyCard)
        ).not.toBeInTheDocument();

        // Non-protected cards should still be visible
        expect(
          screen.getByTestId(HOME_CARDS_TEST_IDS.projectsCard)
        ).toBeInTheDocument();
        expect(
          screen.getByTestId(HOME_CARDS_TEST_IDS.workspaceCard)
        ).toBeInTheDocument();
      });
    });

    it("should always show Projects and Workspace cards", async () => {
      render(<HomeCards dictionary={mockDictionary} />);

      await waitFor(() => {
        expect(screen.getByText("Projects")).toBeInTheDocument();
        expect(screen.getByText("Workspace")).toBeInTheDocument();
      });
    });
  });

  describe("during loading", () => {
    it("should hide protected cards during loading (loadingBehavior=hide)", () => {
      mockUsePermissions.mockReturnValue({
        permissions: [],
        loading: true,
        error: null,
        hasPermission: () => false,
      });

      render(<HomeCards dictionary={mockDictionary} />);

      // Protected cards should be hidden during loading
      expect(
        screen.queryByTestId(HOME_CARDS_TEST_IDS.administrationCard)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId(HOME_CARDS_TEST_IDS.companyCard)
      ).not.toBeInTheDocument();

      // Non-protected cards should still be visible
      expect(
        screen.getByTestId(HOME_CARDS_TEST_IDS.projectsCard)
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(HOME_CARDS_TEST_IDS.workspaceCard)
      ).toBeInTheDocument();
    });
  });

  describe("card ordering", () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        permissions: [
          { service: "identity", resource: "users", action: "list" },
          { service: "guardian", resource: "roles", action: "list" },
          { service: "identity", resource: "subcontractors", action: "list" },
          { service: "identity", resource: "policies", action: "list" },
        ],
        loading: false,
        error: null,
        hasPermission: () => true,
      });
    });

    it("should render cards in correct order: Administration, Company, Projects, Workspace", async () => {
      render(<HomeCards dictionary={mockDictionary} />);

      await waitFor(() => {
        const container = screen.getByTestId(HOME_CARDS_TEST_IDS.container);
        const cards = container.querySelectorAll("[data-testid]");
        
        // Filter to only get card elements (exclude buttons)
        const cardTestIds = Array.from(cards)
          .map(card => card.getAttribute("data-testid"))
          .filter(id => id?.includes("card") && !id?.includes("button"));

        expect(cardTestIds).toEqual([
          HOME_CARDS_TEST_IDS.administrationCard,
          HOME_CARDS_TEST_IDS.companyCard,
          HOME_CARDS_TEST_IDS.projectsCard,
          HOME_CARDS_TEST_IDS.workspaceCard,
        ]);
      });
    });
  });

  describe("i18n support", () => {
    it("should render with French dictionary", async () => {
      mockUsePermissions.mockReturnValue({
        permissions: [
          { service: "identity", resource: "users", action: "list" },
          { service: "guardian", resource: "roles", action: "list" },
          { service: "identity", resource: "subcontractors", action: "list" },
          { service: "identity", resource: "policies", action: "list" },
        ],
        loading: false,
        error: null,
        hasPermission: () => true,
      });

      const frenchDictionary = {
        administration: "Administration",
        access_administration: "Accéder à l'administration",
        company: "Entreprise",
        access_company: "Accéder à l'entreprise",
        projects: "Projets",
        access_projects: "Accéder aux projets",
        workspace: "Espace de travail",
        access_workspace: "Accéder à l'espace de travail",
      };

      render(<HomeCards dictionary={frenchDictionary} />);

      await waitFor(() => {
        expect(screen.getByText("Entreprise")).toBeInTheDocument();
        expect(screen.getByText("Projets")).toBeInTheDocument();
        expect(screen.getByText("Espace de travail")).toBeInTheDocument();
        expect(screen.getByText("Accéder à l'administration")).toBeInTheDocument();
      });
    });
  });
});
