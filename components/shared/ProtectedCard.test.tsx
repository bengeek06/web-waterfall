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
import { ProtectedCard } from "./ProtectedCard";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { PERMISSION_REQUIREMENTS } from "@/lib/permissions";

// Mock du hook usePermissions
jest.mock("@/lib/hooks/usePermissions");
const mockUsePermissions = usePermissions as jest.MockedFunction<
  typeof usePermissions
>;

describe("ProtectedCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show children when permissions are satisfied", async () => {
    mockUsePermissions.mockReturnValue({
      permissions: [
        { service: "identity", resource: "users", action: "list" },
        { service: "guardian", resource: "roles", action: "list" },
      ],
      loading: false,
      error: null,
      hasPermission: () => true,
    });

    render(
      <ProtectedCard requirements={PERMISSION_REQUIREMENTS.USER_ADMINISTRATION}>
        <div>Protected Content</div>
      </ProtectedCard>
    );

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  it("should hide children when permissions are not satisfied", async () => {
    mockUsePermissions.mockReturnValue({
      permissions: [],
      loading: false,
      error: null,
      hasPermission: () => false,
    });

    render(
      <ProtectedCard requirements={PERMISSION_REQUIREMENTS.USER_ADMINISTRATION}>
        <div>Protected Content</div>
      </ProtectedCard>
    );

    await waitFor(() => {
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  it("should show fallback when permissions are not satisfied and fallback provided", async () => {
    mockUsePermissions.mockReturnValue({
      permissions: [],
      loading: false,
      error: null,
      hasPermission: () => false,
    });

    render(
      <ProtectedCard
        requirements={PERMISSION_REQUIREMENTS.USER_ADMINISTRATION}
        fallback={<div>No Access</div>}
      >
        <div>Protected Content</div>
      </ProtectedCard>
    );

    await waitFor(() => {
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
      expect(screen.getByText("No Access")).toBeInTheDocument();
    });
  });

  describe("loadingBehavior", () => {
    it("should hide content when loading and loadingBehavior is hide", () => {
      mockUsePermissions.mockReturnValue({
        permissions: [],
        loading: true,
        error: null,
        hasPermission: () => false,
      });

      render(
        <ProtectedCard
          requirements={PERMISSION_REQUIREMENTS.USER_ADMINISTRATION}
          loadingBehavior="hide"
        >
          <div>Protected Content</div>
        </ProtectedCard>
      );

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("should show content when loading and loadingBehavior is show", () => {
      mockUsePermissions.mockReturnValue({
        permissions: [],
        loading: true,
        error: null,
        hasPermission: () => false,
      });

      render(
        <ProtectedCard
          requirements={PERMISSION_REQUIREMENTS.USER_ADMINISTRATION}
          loadingBehavior="show"
        >
          <div>Protected Content</div>
        </ProtectedCard>
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should show skeleton when loading and loadingBehavior is skeleton", () => {
      mockUsePermissions.mockReturnValue({
        permissions: [],
        loading: true,
        error: null,
        hasPermission: () => false,
      });

      const { container } = render(
        <ProtectedCard
          requirements={PERMISSION_REQUIREMENTS.USER_ADMINISTRATION}
          loadingBehavior="skeleton"
        >
          <div>Protected Content</div>
        </ProtectedCard>
      );

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
      // For now, skeleton loader is a placeholder div with animate-pulse
      const skeleton = container.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
    });
  });

  it("should handle permission errors gracefully", async () => {
    mockUsePermissions.mockReturnValue({
      permissions: [],
      loading: false,
      error: new Error("Failed to load permissions"),
      hasPermission: () => false,
    });

    render(
      <ProtectedCard requirements={PERMISSION_REQUIREMENTS.USER_ADMINISTRATION}>
        <div>Protected Content</div>
      </ProtectedCard>
    );

    await waitFor(() => {
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  it("should work with custom permission requirements", async () => {
    const customRequirements = [
      [{ service: "custom", resource: "resource", action: "read" }],
    ];

    mockUsePermissions.mockReturnValue({
      permissions: [{ service: "custom", resource: "resource", action: "read" }],
      loading: false,
      error: null,
      hasPermission: () => true,
    });

    render(
      <ProtectedCard requirements={customRequirements}>
        <div>Custom Protected Content</div>
      </ProtectedCard>
    );

    await waitFor(() => {
      expect(screen.getByText("Custom Protected Content")).toBeInTheDocument();
    });
  });
});
