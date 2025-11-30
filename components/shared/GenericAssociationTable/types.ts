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

import type { ColumnDef } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import type { ZodType } from "zod";
import type { UseFormReturn, FieldValues, DefaultValues } from "react-hook-form";

// ==================== BASE TYPES ====================

/**
 * Base type for items with an ID
 */
export type BaseItem = {
  id: string | number;
  name?: string;
  [key: string]: unknown;
};

/**
 * Association type - defines the relationship
 */
export type AssociationType = "many-to-many" | "one-to-many";

// ==================== ASSOCIATION CONFIG ====================

/**
 * Configuration for a single association (N-N or 1-N relationship)
 * 
 * @example Many-to-Many (User <-> Roles via user_roles junction table)
 * ```tsx
 * {
 *   type: "many-to-many",
 *   name: "roles",
 *   label: "Rôles",
 *   service: "guardian",
 *   path: "/roles",
 *   junctionEndpoint: "/users/{id}/roles",
 *   displayField: "name",
 *   icon: Shield,
 * }
 * ```
 * 
 * @example One-to-Many (Company <- Users, FK on users)
 * ```tsx
 * {
 *   type: "one-to-many",
 *   name: "users",
 *   label: "Utilisateurs",
 *   service: "identity",
 *   path: "/users",
 *   foreignKey: "company_id",
 *   displayField: "email",
 *   icon: Users,
 * }
 * ```
 */
export type AssociationConfig<TAssociated extends BaseItem = BaseItem> = {
  /** Type of relationship */
  type: AssociationType;
  
  /** Name of the association (used as key in data and for i18n lookup) */
  name: string;
  
  /** Human-readable label for the association */
  label?: string;
  
  /** API service for the associated entity (identity, guardian, project, storage) */
  service: string;
  
  /** API endpoint path for the associated entity (e.g., /roles, /policies) */
  path: string;
  
  /** 
   * Junction endpoint pattern for M2M associations
   * Use {id} placeholder for parent entity ID
   * @example "/users/{id}/roles" 
   */
  junctionEndpoint?: string;
  
  /**
   * Foreign key field name for 1-N associations
   * @example "company_id"
   */
  foreignKey?: string;
  
  /** Field to display in UI (default: "name") */
  displayField?: keyof TAssociated | string;
  
  /** Secondary field to display (optional) */
  secondaryField?: keyof TAssociated | string;
  
  /** Icon component for the association */
  icon?: LucideIcon;
  
  /** Custom columns for the association items in expansion (optional) */
  columns?: ColumnDef<TAssociated>[];
  
  /** 
   * Field to use for add request body 
   * For M2M: the field name to send when adding association
   * @example "role_id" for POST /users/{id}/roles with { role_id: 123 }
   * @default "<association_name>_id" (e.g., "role_id" for association "roles")
   */
  addBodyField?: string;
  
  /**
   * Grouping configuration for associations (like Policies grouping by service/resource)
   */
  groupBy?: {
    /** Fields to group by */
    fields: string[];
    /** Render function for group header */
    renderGroupHeader?: (_group: { key: string; items: TAssociated[] }) => React.ReactNode;
  };
};

// ==================== DICTIONARY ====================

/**
 * Dictionary for GenericAssociationTable i18n
 */
export type AssociationTableDictionary = {
  // Table strings
  create?: string;
  filter_placeholder?: string;
  no_results?: string;
  loading?: string;
  export?: string;
  import?: string;
  delete_selected?: string;
  showing_results?: string;
  rows_per_page?: string;
  previous?: string;
  next?: string;
  
  // Modal strings
  modal_create_title?: string;
  modal_edit_title?: string;
  
  // Delete confirmation
  delete_confirm_title?: string;
  delete_confirm_message?: string;
  cancel?: string;
  save?: string;
  delete?: string;
  
  // Association expansion
  no_associations?: string;
  add_association?: string;
  remove_association?: string;
  
  // Association dialog
  association_dialog_title?: string;
  associated_items?: string;
  available_items?: string;
  no_available_items?: string;
  add_selected?: string;
  
  // Import/Export report
  import_report_title?: string;
  import_report_total?: string;
  import_report_success?: string;
  import_report_failed?: string;
  import_report_errors?: string;
  import_report_warnings?: string;
  import_report_close?: string;
  
  // Generic error messages
  errors?: {
    fetch?: string;
    create?: string;
    update?: string;
    delete?: string;
    add_association?: string;
    remove_association?: string;
  };
};

// ==================== COMPONENT PROPS ====================

/**
 * Handler functions passed to column factory
 */
export type ColumnHandlers<T extends BaseItem> = {
  onEdit: (_item: T) => void;
  onDelete: (_id: string | number) => void | Promise<void>;
  onAddAssociation?: (_item: T, _associationName: string) => void;
};

/**
 * Props for GenericAssociationTable component
 * 
 * @typeParam T - The main entity type (must have id field)
 * @typeParam TForm - The form data type for create/edit (defaults to T & FieldValues)
 */
export type GenericAssociationTableProps<
  T extends BaseItem,
  TForm extends FieldValues = T & FieldValues
> = {
  // ==================== API CONFIG ====================
  
  /** API service name (identity, guardian, project, storage) */
  service: string;
  
  /** API endpoint path (e.g., /users, /policies) */
  path: string;
  
  /** Entity name for export filename (defaults to path without leading slash) */
  entityName?: string;
  
  // ==================== TABLE CONFIG ====================
  
  /** 
   * Column definitions factory
   * Receives handlers for edit, delete, and optionally add association
   */
  columns: (_handlers: ColumnHandlers<T>) => ColumnDef<T>[];
  
  /** Page title */
  pageTitle: string;
  
  /** Dictionary for i18n */
  dictionary: AssociationTableDictionary;
  
  // ==================== FORM CONFIG ====================
  
  /** Zod schema for form validation */
  schema: ZodType<TForm>;
  
  /** Default form values */
  defaultFormValues: DefaultValues<TForm>;
  
  /** 
   * Render form fields
   * @param form - React Hook Form instance
   * @param dictionary - i18n dictionary
   * @param editingItem - Item being edited (null for create)
   * @param refresh - Function to refresh data
   */
  renderFormFields: (
    _form: UseFormReturn<TForm>,
    _dictionary: AssociationTableDictionary,
    _editingItem?: T | null,
    _refresh?: () => Promise<void>
  ) => React.ReactNode;
  
  /** Transform form data to API payload (optional) */
  transformFormData?: (_data: TForm) => Partial<T>;
  
  /** Transform API item to form data (optional) */
  transformItemToForm?: (_item: T) => TForm;
  
  // ==================== ASSOCIATIONS CONFIG ====================
  
  /** 
   * Association configurations
   * Define N-N or 1-N relationships to manage in expansion rows
   */
  associations?: AssociationConfig[];
  
  // ==================== FEATURES ====================
  
  /** Enable import/export (default: false) */
  enableImportExport?: boolean;
  
  /** Enable row selection (default: false) */
  enableRowSelection?: boolean;
  
  /** Enable per-column filtering (default: true) */
  enableColumnFilters?: boolean;
  
  /** Custom toolbar actions */
  toolbarActions?: React.ReactNode;
  
  /** Custom empty state component */
  emptyState?: React.ReactNode;
  
  // ==================== HANDLERS (OPTIONAL OVERRIDES) ====================
  
  /** Custom import handler (overrides default basic-io import) */
  onImport?: (_format: 'json' | 'csv', _file?: File) => void | Promise<void>;
  
  /** Custom export handler (overrides default basic-io export) */
  onExport?: (_data: T[], _format: 'json' | 'csv') => void;
  
  // ==================== TEST ====================
  
  /** Test ID prefix for data-testid attributes */
  testIdPrefix?: string;
};

// ==================== ASSOCIATION DIALOG PROPS ====================

/**
 * Props for AssociationDialog component
 */
export type AssociationDialogProps<TAssociated extends BaseItem = BaseItem> = {
  /** Whether the dialog is open */
  open: boolean;
  
  /** Callback to change open state */
  onOpenChange: (_open: boolean) => void;
  
  /** Parent entity name (for title) */
  parentName: string;
  
  /** Association configuration */
  config: AssociationConfig<TAssociated>;
  
  /** Currently associated items */
  associatedItems: TAssociated[];
  
  /** All available items (will filter out already associated) */
  availableItems: TAssociated[];
  
  /** Callback when items are selected to add */
  onAdd: (_itemIds: (string | number)[]) => void | Promise<void>;
  
  /** Whether add operation is loading */
  isLoading?: boolean;
  
  /** Dictionary for i18n */
  dictionary: AssociationTableDictionary;
  
  /** Initial filter values (optional) */
  initialFilters?: Record<string, string>;
};

// ==================== ASSOCIATION EXPANSION PROPS ====================

/**
 * Props for AssociationExpansion component
 */
export type AssociationExpansionProps<
  T extends BaseItem,
  TAssociated extends BaseItem = BaseItem
> = {
  /** Parent item */
  item: T;
  
  /** Association configurations */
  associations: AssociationConfig<TAssociated>[];
  
  /** Callback to add association */
  onAdd: (_item: T, _associationName: string) => void;
  
  /** Callback to remove association */
  onRemove: (
    _item: T,
    _associationName: string,
    _associatedItem: TAssociated
  ) => void | Promise<void>;
  
  /** Dictionary for i18n */
  dictionary: AssociationTableDictionary;
};

// ==================== USE ASSOCIATIONS HOOK ====================

/**
 * Options for useAssociations hook
 */
export type UseAssociationsOptions<TAssociated extends BaseItem = BaseItem> = {
  /** Association configuration */
  config: AssociationConfig<TAssociated>;
  
  /** Parent entity ID */
  parentId: string | number | null;
  
  /** Whether to fetch on mount */
  enabled?: boolean;
};

/**
 * Return type for useAssociations hook
 */
export type UseAssociationsReturn<TAssociated extends BaseItem = BaseItem> = {
  /** Associated items */
  associatedItems: TAssociated[];
  
  /** All available items */
  allItems: TAssociated[];
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error: Error | null;
  
  /** Add associations */
  addAssociations: (_itemIds: (string | number)[]) => Promise<void>;
  
  /** Remove association */
  removeAssociation: (_itemId: string | number) => Promise<void>;
  
  /** Refresh data */
  refresh: () => Promise<void>;
};
