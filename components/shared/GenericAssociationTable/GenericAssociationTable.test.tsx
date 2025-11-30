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
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AssociationExpansion } from "./AssociationExpansion";
import { AssociationDialog } from "./AssociationDialog";
import type { AssociationConfig, BaseItem } from "./types";
import { Shield } from "lucide-react";

// ==================== MOCKS ====================

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
}));

// ==================== TEST DATA ====================

interface Role extends BaseItem {
  id: string;
  name: string;
  description?: string;
}

const mockRolesConfig: AssociationConfig<Role> = {
  type: "many-to-many",
  name: "roles",
  label: "Rôles",
  service: "guardian",
  path: "/roles",
  junctionEndpoint: "/users/{id}/roles",
  displayField: "name",
  icon: Shield,
};

const mockRoles: Role[] = [
  { id: "1", name: "Admin", description: "Administrator role" },
  { id: "2", name: "User", description: "Regular user role" },
];

const mockUser: BaseItem & { roles: Role[] } = {
  id: "user-1",
  name: "John Doe",
  roles: [mockRoles[0]],
};

const mockDictionary = {
  no_associations: "Aucune association",
  add_association: "Ajouter",
  remove_association: "Retirer",
  associated_items: "Associés",
  available_items: "Disponibles",
  no_available_items: "Aucun élément disponible",
  add_selected: "Ajouter ({count})",
  cancel: "Annuler",
};

// ==================== TESTS ====================

describe("AssociationExpansion", () => {
  it("renders association section with items", () => {
    const onAdd = jest.fn();
    const onRemove = jest.fn();

    render(
      <AssociationExpansion
        item={mockUser}
        associations={[mockRolesConfig]}
        onAdd={onAdd}
        onRemove={onRemove}
        dictionary={mockDictionary}
      />
    );

    // Check section is rendered
    expect(screen.getByText(/Rôles/)).toBeInTheDocument();
    expect(screen.getByText("(1)")).toBeInTheDocument();
    
    // Check associated item is displayed
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("shows empty state when no associations", () => {
    const emptyUser = { ...mockUser, roles: [] };
    const onAdd = jest.fn();
    const onRemove = jest.fn();

    render(
      <AssociationExpansion
        item={emptyUser}
        associations={[mockRolesConfig]}
        onAdd={onAdd}
        onRemove={onRemove}
        dictionary={mockDictionary}
      />
    );

    expect(screen.getByText("Aucune association")).toBeInTheDocument();
  });

  it("calls onAdd when add button is clicked", () => {
    const onAdd = jest.fn();
    const onRemove = jest.fn();

    render(
      <AssociationExpansion
        item={mockUser}
        associations={[mockRolesConfig]}
        onAdd={onAdd}
        onRemove={onRemove}
        dictionary={mockDictionary}
      />
    );

    const addButton = screen.getByTestId("expansion-user-1-add-roles-button");
    fireEvent.click(addButton);

    expect(onAdd).toHaveBeenCalledWith(mockUser, "roles");
  });

  it("calls onRemove when remove button is clicked", () => {
    const onAdd = jest.fn();
    const onRemove = jest.fn();

    render(
      <AssociationExpansion
        item={mockUser}
        associations={[mockRolesConfig]}
        onAdd={onAdd}
        onRemove={onRemove}
        dictionary={mockDictionary}
      />
    );

    const removeButton = screen.getByTestId("expansion-user-1-remove-roles-1");
    fireEvent.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith(mockUser, "roles", mockRoles[0]);
  });
});

describe("AssociationDialog", () => {
  it("renders dialog with associated and available items", () => {
    const onAdd = jest.fn();
    const onOpenChange = jest.fn();

    render(
      <AssociationDialog
        open={true}
        onOpenChange={onOpenChange}
        parentName="John Doe"
        config={mockRolesConfig}
        associatedItems={[mockRoles[0]]}
        availableItems={mockRoles}
        onAdd={onAdd}
        dictionary={mockDictionary}
      />
    );

    // Dialog title
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    
    // Associated section
    expect(screen.getByText("Associés (1)")).toBeInTheDocument();
    
    // Available section (should show only non-associated)
    expect(screen.getByText("Disponibles (1)")).toBeInTheDocument();
  });

  it("allows selecting and adding items", async () => {
    const onAdd = jest.fn();
    const onOpenChange = jest.fn();

    render(
      <AssociationDialog
        open={true}
        onOpenChange={onOpenChange}
        parentName="John Doe"
        config={mockRolesConfig}
        associatedItems={[]}
        availableItems={mockRoles}
        onAdd={onAdd}
        dictionary={mockDictionary}
      />
    );

    // Click on an available item to select it
    const item = screen.getByTestId("association-dialog-roles-available-1");
    fireEvent.click(item);

    // Click add button
    const addButton = screen.getByTestId("association-dialog-roles-add");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(["1"]);
    });
  });

  it("disables add button when nothing selected", () => {
    const onAdd = jest.fn();
    const onOpenChange = jest.fn();

    render(
      <AssociationDialog
        open={true}
        onOpenChange={onOpenChange}
        parentName="John Doe"
        config={mockRolesConfig}
        associatedItems={[]}
        availableItems={mockRoles}
        onAdd={onAdd}
        dictionary={mockDictionary}
      />
    );

    const addButton = screen.getByTestId("association-dialog-roles-add");
    expect(addButton).toBeDisabled();
  });

  it("filters items by search query", async () => {
    const onAdd = jest.fn();
    const onOpenChange = jest.fn();

    render(
      <AssociationDialog
        open={true}
        onOpenChange={onOpenChange}
        parentName="John Doe"
        config={mockRolesConfig}
        associatedItems={[]}
        availableItems={mockRoles}
        onAdd={onAdd}
        dictionary={mockDictionary}
      />
    );

    // Type in search
    const searchInput = screen.getByTestId("association-dialog-roles-search");
    fireEvent.change(searchInput, { target: { value: "Admin" } });

    // Only Admin should be visible now
    await waitFor(() => {
      expect(screen.getByText("Admin")).toBeInTheDocument();
      expect(screen.queryByText("User")).not.toBeInTheDocument();
    });
  });
});
