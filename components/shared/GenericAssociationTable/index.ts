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
 * GenericAssociationTable Module
 * 
 * A comprehensive table component for managing entities with N-N and 1-N associations.
 * 
 * @module GenericAssociationTable
 * 
 * @example Basic Usage
 * ```tsx
 * import { GenericAssociationTable } from "@/components/shared/GenericAssociationTable";
 * import type { AssociationConfig } from "@/components/shared/GenericAssociationTable";
 * 
 * const rolesAssociation: AssociationConfig = {
 *   type: "many-to-many",
 *   name: "roles",
 *   label: "Rôles",
 *   service: "guardian",
 *   path: "/roles",
 *   junctionEndpoint: "/users/{id}/roles",
 *   displayField: "name",
 *   icon: Shield,
 * };
 * 
 * <GenericAssociationTable<User, UserFormData>
 *   service="identity"
 *   path="/users"
 *   columns={createUserColumns}
 *   schema={userSchema}
 *   defaultFormValues={{ email: "", name: "" }}
 *   pageTitle="Utilisateurs"
 *   dictionary={dict}
 *   associations={[rolesAssociation]}
 *   enableImportExport={true}
 *   renderFormFields={(form) => <UserForm form={form} />}
 * />
 * ```
 * 
 * @see {@link GenericAssociationTable} - Main component
 * @see {@link AssociationConfig} - Association configuration type
 * @see {@link AssociationDialog} - Dialog for adding associations
 * @see {@link AssociationExpansion} - Expansion row for associations
 * @see {@link useAssociations} - Hook for managing associations
 */

// Main component
export { GenericAssociationTable } from "./GenericAssociationTable";

// Sub-components
export { AssociationDialog } from "./AssociationDialog";
export { AssociationExpansion } from "./AssociationExpansion";

// Hook
export { useAssociations } from "./useAssociations";

// Types
export type {
  // Base types
  BaseItem,
  AssociationType,
  
  // Configuration
  AssociationConfig,
  AssociationTableDictionary,
  
  // Component props
  ColumnHandlers,
  GenericAssociationTableProps,
  AssociationDialogProps,
  AssociationExpansionProps,
  
  // Hook types
  UseAssociationsOptions,
  UseAssociationsReturn,
} from "./types";
