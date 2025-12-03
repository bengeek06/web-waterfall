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

"use client";

/**
 * GenericAssociationTable - Advanced CRUD table with N-N association support
 * 
 * Extends GenericDataTable with:
 * - **Association Management**: Handle M2M and 1-N relationships via expansion rows
 * - **Association Dialog**: Two-panel dialog for adding associations
 * - **Auto-fetch Associations**: Automatically fetches and attaches associations to data
 * - **CRUD Operations**: Full create/read/update/delete with validation
 * - **Import/Export**: basic-io integration with association support
 * 
 * Use Cases:
 * - Users with Roles (M2M via user_roles)
 * - Roles with Policies (M2M via role_policies)
 * - Policies with Permissions (M2M via policy_permissions)
 * - Companies with Users (1-N via company_id FK)
 * 
 * @example
 * ```tsx
 * <GenericAssociationTable<User, UserFormData>
 *   service="identity"
 *   path="/users"
 *   columns={(handlers) => createUserColumns(dict, handlers)}
 *   schema={userSchema}
 *   defaultFormValues={{ email: "", name: "" }}
 *   pageTitle="Utilisateurs"
 *   dictionary={dict}
 *   associations={[
 *     {
 *       type: "many-to-many",
 *       name: "roles",
 *       label: "Rôles",
 *       service: "guardian",
 *       path: "/roles",
 *       junctionEndpoint: "/users/{id}/roles",
 *       displayField: "name",
 *       icon: Shield,
 *     }
 *   ]}
 *   enableImportExport={true}
 *   enableRowSelection={true}
 *   renderFormFields={(form, dict) => (
 *     <>
 *       <Input {...form.register("email")} />
 *       <Input {...form.register("name")} />
 *     </>
 *   )}
 * />
 * ```
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { FieldValues } from "react-hook-form";
import { AlertTriangle } from "lucide-react";

// Components
import { GenericDataTable } from "@/components/shared/GenericDataTable";
import { AssociationExpansion } from "./AssociationExpansion";
import { AssociationDialog } from "./AssociationDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ImportReportModal, defaultImportReportDictionary } from "@/components/modals/import-report-modal";

// Hooks & Utils
import { useTableCrud } from "@/lib/hooks/useTableCrud";
import { useZodForm } from "@/lib/hooks/useZodForm";
import { useBasicIO, ImportReport } from "@/lib/hooks/useBasicIO";
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { getServiceRoute } from "@/lib/api-routes";
import { testId } from "@/lib/test-ids";

// Types
import type { BaseItem, AssociationConfig, GenericAssociationTableProps } from "./types";

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert plural name to singular
 * @example "roles" -> "role", "policies" -> "policy", "permissions" -> "permission"
 */
function getSingularName(name: string): string {
  if (name.endsWith("ies")) {
    return name.slice(0, -3) + "y";
  }
  if (name.endsWith("s")) {
    return name.slice(0, -1);
  }
  return name;
}

// ==================== COMPONENT ====================

export function GenericAssociationTable<
  T extends BaseItem,
  TForm extends FieldValues = T & FieldValues
>({
  service,
  path,
  entityName,
  columns,
  pageTitle,
  dictionary,
  schema,
  defaultFormValues,
  renderFormFields,
  transformFormData,
  transformItemToForm,
  associations = [],
  enableImportExport = false,
  enableRowSelection = false,
  expandable,
  persistFiltersInUrl = false,
  fetchOptions,
  toolbarActions,
  emptyState,
  onAfterSave,
  onDataEnrich,
  onImport,
  onExport,
  renderExpandedRow: customRenderExpandedRow,
  testIdPrefix = "association-table",
}: Readonly<GenericAssociationTableProps<T, TForm>>) {
  // ==================== STATE ====================
  
  // CRUD state
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | number | null>(null);
  
  // Import report state
  const [showImportReport, setShowImportReport] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  
  // Association state
  const [showAssociationDialog, setShowAssociationDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [selectedAssociation, setSelectedAssociation] = useState<AssociationConfig | null>(null);
  const [allAssociationItems, setAllAssociationItems] = useState<Record<string, BaseItem[]>>({});
  
  // Data with associations attached
  const [dataWithAssociations, setDataWithAssociations] = useState<T[]>([]);
  
  // Version counter to force association refresh after CRUD operations
  const [dataVersion, setDataVersion] = useState(0);

  // ==================== ERROR HANDLING ====================

  // Memoize error messages to avoid triggering useCallback dependencies
  const errorMessages = useMemo(() => ({
    fetch: dictionary.errors?.fetch || "An error occurred",
    create: dictionary.errors?.create || "Error creating item",
    update: dictionary.errors?.update || "Error updating item",
    delete: dictionary.errors?.delete || "Error deleting item",
  }), [dictionary.errors?.fetch, dictionary.errors?.create, dictionary.errors?.update, dictionary.errors?.delete]);
  
  const { handleError } = useErrorHandler({
    messages: {
      network: errorMessages.fetch,
      unauthorized: "Unauthorized access",
      forbidden: "Access forbidden",
      notFound: "Resource not found",
      serverError: errorMessages.fetch,
      clientError: errorMessages.fetch,
      unknown: errorMessages.fetch,
    },
  });

  // ==================== DATA FETCHING ====================

  const { data, isLoading, create, update, patch, remove, refresh } = useTableCrud<T>({
    service,
    path,
    expand: fetchOptions?.expand,
  });

  // ==================== BASIC-IO IMPORT/EXPORT ====================
  
  const endpoint = path.startsWith("/") ? path.slice(1) : path;
  
  const { exportData, importData, isExporting, isImporting } = useBasicIO({
    service,
    endpoint,
    entityName: entityName ?? endpoint,
    onImportSuccess: (report) => {
      setImportReport(report);
      setShowImportReport(true);
      refresh();
    },
    onImportError: (error) => {
      handleError(error);
    },
  });

  // ==================== FORM ====================

  const form = useZodForm<TForm>({
    schema,
    defaultValues: defaultFormValues,
  });

  // ==================== FETCH ASSOCIATIONS ====================

  /**
   * Fetch all items for each association type (for dialog)
   */
  const fetchAllAssociationItems = useCallback(async () => {
    const items: Record<string, BaseItem[]> = {};
    
    await Promise.all(
      associations.map(async (config) => {
        try {
          // Use itemsService if provided, otherwise fall back to service
          const itemsServiceName = config.itemsService || config.service;
          const url = getServiceRoute(itemsServiceName, config.path);
          const response = await fetchWithAuth(url);
          
          if (response.ok) {
            const responseData = await response.json();
            items[config.name] = Array.isArray(responseData)
              ? responseData
              : (responseData.data || responseData[config.name] || []);
          }
        } catch (err) {
          handleError(err instanceof Error ? err : new Error(`Error fetching ${config.name}`));
          items[config.name] = [];
        }
      })
    );
    
    setAllAssociationItems(items);
  }, [associations, handleError]);

  /**
   * Fetch associations for a single item
   */
  const fetchAssociationsForItem = useCallback(async (item: T): Promise<T> => {
    if (associations.length === 0) return item;
    
    const associationData: Record<string, BaseItem[]> = {};
    
    await Promise.all(
      associations.map(async (config) => {
        if (config.type === "many-to-many" && config.junctionEndpoint) {
          try {
            let url: string;
            if (config.junctionQueryParam) {
              // Query param style: /user-roles?user_id=123
              url = getServiceRoute(config.service, `${config.junctionEndpoint}?${config.junctionQueryParam}=${item.id}`);
            } else {
              // Path param style: /users/123/roles
              const junctionPath = config.junctionEndpoint.replace("{id}", String(item.id));
              url = getServiceRoute(config.service, junctionPath);
            }
            const response = await fetchWithAuth(url);
            
            if (response.ok) {
              const responseData = await response.json();
              let junctionItems = Array.isArray(responseData)
                ? responseData
                : (responseData[config.name] || []);
              
              // Enrich junction items with full item data if not already enriched
              // Check if items have nested data (e.g., role.name exists)
              const singularName = getSingularName(config.name);
              const needsEnrichment = junctionItems.length > 0 && !junctionItems[0][singularName];
              
              if (needsEnrichment && allAssociationItems[config.name]) {
                const availableItems = allAssociationItems[config.name];
                junctionItems = junctionItems.map((junctionItem: BaseItem) => {
                  const itemIdField = `${singularName}_id`;
                  const itemId = (junctionItem as Record<string, unknown>)[itemIdField];
                  const fullItem = availableItems.find(ai => ai.id === itemId);
                  
                  return {
                    ...junctionItem,
                    [singularName]: fullItem || null,
                  };
                });
              }
              
              associationData[config.name] = junctionItems;
            } else {
              associationData[config.name] = [];
            }
          } catch (err) {
            handleError(err instanceof Error ? err : new Error(`Error fetching ${config.name} for item ${item.id}`));
            associationData[config.name] = [];
          }
        }
      })
    );
    
    return { ...item, ...associationData };
  }, [associations, allAssociationItems, handleError]);

  /**
   * Fetch associations for all items
   */
  const fetchAllAssociations = useCallback(async (items: T[]) => {
    if (!items || items.length === 0) {
      setDataWithAssociations([]);
      return;
    }
    
    // First enrich data if callback provided (e.g., resolve foreign keys)
    let enrichedItems = items;
    if (onDataEnrich) {
      enrichedItems = await Promise.resolve(onDataEnrich(items));
    }
    
    const itemsWithAssociations = await Promise.all(
      enrichedItems.map(fetchAssociationsForItem)
    );
    
    setDataWithAssociations(itemsWithAssociations);
  }, [fetchAssociationsForItem, onDataEnrich]);

  // Fetch associations when data changes or after CRUD operations
  // Using a hash of data content to detect any changes (including field updates like is_active)
  const dataHash = useMemo(() => {
    // Create a stable hash from data content
    return JSON.stringify(data.map(d => d));
  }, [data]);
  
  useEffect(() => {
    // Fetch available items first, then enrich associations
    const fetchData = async () => {
      await fetchAllAssociationItems();
      await fetchAllAssociations(data);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataHash, associations.length, dataVersion, onDataEnrich]);

  // ==================== CRUD HANDLERS ====================

  const handleCreate = useCallback(() => {
    setEditingItem(null);
    form.reset(defaultFormValues);
    setShowFormDialog(true);
  }, [form, defaultFormValues]);

  const handleEdit = useCallback((item: T) => {
    setEditingItem(item);
    const formData = transformItemToForm 
      ? transformItemToForm(item) 
      : (item as unknown as TForm);
    form.reset(formData);
    setShowFormDialog(true);
  }, [form, transformItemToForm]);

  const handleDelete = useCallback(async (id: string | number) => {
    setPendingDeleteId(id);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    
    try {
      await remove(String(pendingDeleteId));
      setShowDeleteDialog(false);
      setPendingDeleteId(null);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error(errorMessages.delete));
    }
  }, [pendingDeleteId, remove, handleError, errorMessages.delete]);

  const handleSubmit = useCallback(async (formData: TForm) => {
    const payload = transformFormData 
      ? transformFormData(formData) 
      : (formData as unknown as Partial<T>);

    try {
      let savedItem: T;
      const isNew = !editingItem?.id;
      
      if (editingItem?.id) {
        savedItem = await update(String(editingItem.id), payload);
      } else {
        savedItem = await create(payload);
      }
      
      setShowFormDialog(false);
      // Increment version to trigger association refresh
      setDataVersion(v => v + 1);
      
      // Call onAfterSave callback if provided
      if (onAfterSave) {
        await onAfterSave(savedItem, isNew);
      }
    } catch (err) {
      handleError(err instanceof Error ? err : new Error(errorMessages.update));
    }
  }, [editingItem, create, update, transformFormData, onAfterSave, handleError, errorMessages.update]);

  // ==================== BULK DELETE ====================
  
  const handleBulkDelete = useCallback(async (selectedIds: (string | number)[]) => {
    try {
      await Promise.all(selectedIds.map(id => remove(String(id))));
    } catch (err) {
      handleError(err instanceof Error ? err : new Error(errorMessages.delete));
    }
  }, [remove, handleError, errorMessages.delete]);

  // ==================== ASSOCIATION HANDLERS ====================

  const handleAddAssociation = useCallback((item: T, associationName: string) => {
    const config = associations.find(a => a.name === associationName);
    if (!config) return;
    
    setSelectedItem(item);
    setSelectedAssociation(config);
    setShowAssociationDialog(true);
  }, [associations]);

  const handleRemoveAssociation = useCallback(async (
    item: T,
    associationName: string,
    associatedItem: BaseItem
  ) => {
    const config = associations.find(a => a.name === associationName);
    if (!config?.junctionEndpoint || config.type !== "many-to-many") {
      handleError(new Error("Cannot remove association: invalid config"));
      return;
    }
    
    try {
      // Use deleteIdField if specified, otherwise default to "id"
      const deleteIdField = config.deleteIdField || "id";
      const deleteId = (associatedItem as Record<string, unknown>)[deleteIdField] ?? associatedItem.id;
      
      let url: string;
      if (config.junctionQueryParam) {
        // Query param style: DELETE /user-roles/123 (no parent ID in path)
        url = getServiceRoute(config.service, `${config.junctionEndpoint}/${deleteId}`);
      } else {
        // Path param style: DELETE /users/123/roles/456
        const junctionPath = config.junctionEndpoint.replace("{id}", String(item.id));
        url = getServiceRoute(config.service, `${junctionPath}/${deleteId}`);
      }
      
      const response = await fetchWithAuth(url, { method: "DELETE" });
      
      if (response.status === 401) {
        globalThis.location.href = "/login";
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to remove association: ${response.status}`);
      }
      
      // Increment version to trigger association refresh
      setDataVersion(v => v + 1);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error(errorMessages.delete));
    }
  }, [associations, handleError, errorMessages.delete]);

  const handleAddAssociationsSubmit = useCallback(async (itemIds: (string | number)[]) => {
    if (!selectedItem || !selectedAssociation) return;
    
    if (selectedAssociation.type !== "many-to-many" || !selectedAssociation.junctionEndpoint) {
      handleError(new Error("Cannot add association: invalid config"));
      return;
    }
    
    let url: string;
    if (selectedAssociation.junctionQueryParam) {
      // Query param style: POST /user-roles (no parent ID in path, sent in body)
      url = getServiceRoute(selectedAssociation.service, selectedAssociation.junctionEndpoint);
    } else {
      // Path param style: POST /users/123/roles
      const junctionPath = selectedAssociation.junctionEndpoint.replace("{id}", String(selectedItem.id));
      url = getServiceRoute(selectedAssociation.service, junctionPath);
    }
    
    // Determine body field name
    const singularName = getSingularName(selectedAssociation.name);
    const bodyField = selectedAssociation.addBodyField || `${singularName}_id`;
    
    try {
      await Promise.all(
        itemIds.map(async (itemId) => {
          let requestBody: Record<string, unknown>;
          if (selectedAssociation.junctionQueryParam) {
            // Query param style: send both user_id and role_id in body
            // e.g., { user_id: "123", role_id: "456" }
            requestBody = {
              [selectedAssociation.junctionQueryParam]: selectedItem.id,
              [bodyField]: itemId,
            };
          } else {
            // Path param style: only send role_id (user_id is in path)
            requestBody = { [bodyField]: itemId };
          }
          
          console.log(`[DEBUG] POST to ${url} with body:`, requestBody);
          const response = await fetchWithAuth(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          
          if (response.status === 401) {
            globalThis.location.href = "/login";
            return;
          }
          
          if (!response.ok) {
            console.warn(`Failed to add ${selectedAssociation.name} ${itemId}`, await response.text());
          } else {
            console.log(`[DEBUG] Successfully added ${selectedAssociation.name} ${itemId} to ${selectedItem.id}`);
          }
        })
      );
      
      // Increment version to trigger association refresh
      setDataVersion(v => v + 1);
      setShowAssociationDialog(false);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error(errorMessages.create));
    }
  }, [selectedItem, selectedAssociation, handleError, errorMessages.create]);

  // ==================== IMPORT/EXPORT HANDLERS ====================
  
  // Build associations string for basic-io export
  // Format: field:service:endpoint_pattern:lookup_field
  // Excludes associations with excludeFromExport: true
  const associationsExportParam = useMemo(() => {
    if (associations.length === 0) return undefined;
    
    const exportableAssociations = associations
      .filter(a => a.type === "many-to-many" && a.junctionEndpoint && !a.excludeFromExport)
      .map(a => {
        // Convert junctionEndpoint to basic-io format
        // e.g., "/roles/{id}/policies" -> "/roles/{id}/policies"
        const endpointPattern = a.junctionEndpoint!.replace("{id}", "{id}");
        const lookupField = a.displayField || "name";
        return `${a.name}:${a.service}:${endpointPattern}:${lookupField}`;
      })
      .join(",");
    
    return exportableAssociations || undefined;
  }, [associations]);
  
  const handleDefaultExport = useCallback(async (selectedData: T[], format: "json" | "csv") => {
    const validIds = selectedData
      .map(item => item.id)
      .filter((id): id is string | number => id !== undefined);
    
    const ids = validIds.length > 0 ? validIds : undefined;
    
    await exportData({
      format,
      ids,
      enrich: true,
      associations: associationsExportParam,
    });
  }, [exportData, associationsExportParam]);
  
  const handleDefaultImport = useCallback(async (format: "json" | "csv", file?: File) => {
    await importData({
      format,
      file,
      resolveRefs: true,
      onAmbiguous: "skip",
      onMissing: "skip",
      associationsMode: associations.length > 0 ? "merge" : "skip",
    });
  }, [importData, associations.length]);

  // ==================== COLUMNS ====================

  const tableColumns = useMemo(() => {
    return columns({
      onEdit: handleEdit,
      onDelete: handleDelete,
      onAddAssociation: associations.length > 0 ? handleAddAssociation : undefined,
      onPatch: patch,
    });
  }, [columns, handleEdit, handleDelete, handleAddAssociation, associations.length, patch]);

  // ==================== EXPANSION ====================

  const defaultRenderExpandedRow = useCallback((item: T) => {
    if (associations.length === 0) return null;
    
    return (
      <AssociationExpansion
        item={item}
        associations={associations}
        onAdd={handleAddAssociation}
        onRemove={handleRemoveAssociation}
        dictionary={dictionary}
      />
    );
  }, [associations, handleAddAssociation, handleRemoveAssociation, dictionary]);

  // Use custom renderExpandedRow if provided, otherwise use default
  const renderExpandedRow = customRenderExpandedRow || defaultRenderExpandedRow;

  // Get available items for association dialog
  const availableAssociationItems = useMemo(() => {
    if (!selectedAssociation) return [];
    return allAssociationItems[selectedAssociation.name] || [];
  }, [selectedAssociation, allAssociationItems]);

  const associatedItems = useMemo(() => {
    if (!selectedItem || !selectedAssociation) return [];
    return (selectedItem[selectedAssociation.name as keyof T] as BaseItem[] | undefined) || [];
  }, [selectedItem, selectedAssociation]);

  // ==================== RENDER ====================

  return (
    <div className="space-y-4" {...testId(`${testIdPrefix}-container`)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" {...testId(`${testIdPrefix}-title`)}>
          {pageTitle}
        </h2>
      </div>

      {/* Table */}
      <GenericDataTable
        columns={tableColumns}
        data={dataWithAssociations}
        isLoading={isLoading || (data.length > 0 && dataWithAssociations.length === 0)}
        dictionary={{
          create: dictionary.create,
          filter_placeholder: dictionary.filter_placeholder,
          no_results: dictionary.no_results,
          loading: dictionary.loading,
          export: dictionary.export,
          import: dictionary.import,
          delete_selected: dictionary.delete_selected,
          showing_results: dictionary.showing_results,
          rows_per_page: dictionary.rows_per_page,
          previous: dictionary.previous,
          next: dictionary.next,
        }}
        onCreateClick={handleCreate}
        enableImportExport={enableImportExport}
        enableRowSelection={enableRowSelection}
        persistFiltersInUrl={persistFiltersInUrl}
        onBulkDelete={enableRowSelection ? handleBulkDelete : undefined}
        onExport={onExport ?? (enableImportExport ? handleDefaultExport : undefined)}
        onImport={onImport ?? (enableImportExport ? handleDefaultImport : undefined)}
        isExporting={isExporting}
        isImporting={isImporting}
        enableRowExpansion={(expandable !== false) && (associations.length > 0 || !!customRenderExpandedRow)}
        renderExpandedRow={(associations.length > 0 || customRenderExpandedRow) ? renderExpandedRow : undefined}
        toolbarActions={toolbarActions}
        emptyState={emptyState}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent {...testId(`${testIdPrefix}-form-dialog`)}>
          <DialogHeader>
            <DialogTitle {...testId(`${testIdPrefix}-form-title`)}>
              {editingItem 
                ? dictionary.modal_edit_title 
                : dictionary.modal_create_title}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? (dictionary.modal_edit_description || "Modifiez les informations ci-dessous.")
                : (dictionary.modal_create_description || "Remplissez les informations ci-dessous pour créer un nouvel élément.")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {renderFormFields(form, dictionary, editingItem, refresh)}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFormDialog(false)}
                {...testId(`${testIdPrefix}-cancel-button`)}
              >
                {dictionary.cancel || "Annuler"}
              </Button>
              <Button type="submit" {...testId(`${testIdPrefix}-submit-button`)}>
                {editingItem 
                  ? (dictionary.save || "Enregistrer")
                  : (dictionary.create || "Créer")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent {...testId(`${testIdPrefix}-delete-dialog`)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {dictionary.delete_confirm_title || "Confirmer la suppression"}
            </DialogTitle>
            <DialogDescription>
              {dictionary.delete_confirm_message || 
                "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setPendingDeleteId(null);
              }}
              {...testId(`${testIdPrefix}-delete-cancel`)}
            >
              {dictionary.cancel || "Annuler"}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              {...testId(`${testIdPrefix}-delete-confirm`)}
            >
              {dictionary.delete || "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Association Dialog */}
      {selectedAssociation && (
        <AssociationDialog
          open={showAssociationDialog}
          onOpenChange={setShowAssociationDialog}
          parentName={selectedItem?.name ? String(selectedItem.name) : String(selectedItem?.id || "")}
          config={selectedAssociation}
          associatedItems={associatedItems}
          availableItems={availableAssociationItems}
          onAdd={handleAddAssociationsSubmit}
          dictionary={dictionary}
        />
      )}

      {/* Import Report Modal */}
      <ImportReportModal
        open={showImportReport}
        onOpenChange={setShowImportReport}
        report={importReport}
        dictionary={defaultImportReportDictionary}
      />
    </div>
  );
}
