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
  enableColumnFilters = true,
  toolbarActions,
  emptyState,
  onImport,
  onExport,
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

  // ==================== DATA FETCHING ====================

  const { data, isLoading, create, update, remove, refresh } = useTableCrud<T>({
    service,
    path,
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
      console.error("Import error:", error);
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
          const url = getServiceRoute(config.service, config.path);
          const response = await fetchWithAuth(url);
          
          if (response.ok) {
            const responseData = await response.json();
            items[config.name] = Array.isArray(responseData)
              ? responseData
              : (responseData.data || responseData[config.name] || []);
          }
        } catch (err) {
          console.error(`Error fetching ${config.name}:`, err);
          items[config.name] = [];
        }
      })
    );
    
    setAllAssociationItems(items);
  }, [associations]);

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
            const junctionPath = config.junctionEndpoint.replace("{id}", String(item.id));
            const url = getServiceRoute(config.service, junctionPath);
            const response = await fetchWithAuth(url);
            
            if (response.ok) {
              const responseData = await response.json();
              associationData[config.name] = Array.isArray(responseData)
                ? responseData
                : (responseData[config.name] || []);
            } else {
              associationData[config.name] = [];
            }
          } catch (err) {
            console.error(`Error fetching ${config.name} for item ${item.id}:`, err);
            associationData[config.name] = [];
          }
        }
      })
    );
    
    return { ...item, ...associationData };
  }, [associations]);

  /**
   * Fetch associations for all items
   */
  const fetchAllAssociations = useCallback(async () => {
    if (!data || data.length === 0) {
      setDataWithAssociations([]);
      return;
    }
    
    const itemsWithAssociations = await Promise.all(
      data.map(fetchAssociationsForItem)
    );
    
    setDataWithAssociations(itemsWithAssociations);
  }, [data, fetchAssociationsForItem]);

  // Fetch associations when data changes
  useEffect(() => {
    fetchAllAssociations();
    fetchAllAssociationItems();
  }, [fetchAllAssociations, fetchAllAssociationItems]);

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
      console.error("Delete error:", err);
    }
  }, [pendingDeleteId, remove]);

  const handleSubmit = useCallback(async (formData: TForm) => {
    const payload = transformFormData 
      ? transformFormData(formData) 
      : (formData as unknown as Partial<T>);

    try {
      if (editingItem?.id) {
        await update(String(editingItem.id), payload);
      } else {
        await create(payload);
      }
      setShowFormDialog(false);
    } catch (err) {
      console.error("Submit error:", err);
    }
  }, [editingItem, create, update, transformFormData]);

  // ==================== BULK DELETE ====================
  
  const handleBulkDelete = useCallback(async (selectedIds: (string | number)[]) => {
    try {
      await Promise.all(selectedIds.map(id => remove(String(id))));
    } catch (err) {
      console.error("Bulk delete error:", err);
    }
  }, [remove]);

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
      console.error("Cannot remove association: invalid config");
      return;
    }
    
    try {
      const junctionPath = config.junctionEndpoint.replace("{id}", String(item.id));
      const url = getServiceRoute(config.service, `${junctionPath}/${associatedItem.id}`);
      
      const response = await fetchWithAuth(url, { method: "DELETE" });
      
      if (response.status === 401) {
        globalThis.location.href = "/login";
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to remove association: ${response.status}`);
      }
      
      // Refresh data
      await fetchAllAssociations();
    } catch (err) {
      console.error("Error removing association:", err);
    }
  }, [associations, fetchAllAssociations]);

  const handleAddAssociationsSubmit = useCallback(async (itemIds: (string | number)[]) => {
    if (!selectedItem || !selectedAssociation) return;
    
    if (selectedAssociation.type !== "many-to-many" || !selectedAssociation.junctionEndpoint) {
      console.error("Cannot add association: invalid config");
      return;
    }
    
    const junctionPath = selectedAssociation.junctionEndpoint.replace("{id}", String(selectedItem.id));
    const url = getServiceRoute(selectedAssociation.service, junctionPath);
    
    // Determine body field name
    const singularName = getSingularName(selectedAssociation.name);
    const bodyField = selectedAssociation.addBodyField || `${singularName}_id`;
    
    try {
      await Promise.all(
        itemIds.map(async (itemId) => {
          const response = await fetchWithAuth(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [bodyField]: itemId }),
          });
          
          if (response.status === 401) {
            globalThis.location.href = "/login";
            return;
          }
          
          if (!response.ok) {
            console.warn(`Failed to add ${selectedAssociation.name} ${itemId}`);
          }
        })
      );
      
      // Refresh data
      await fetchAllAssociations();
      setShowAssociationDialog(false);
    } catch (err) {
      console.error("Error adding associations:", err);
    }
  }, [selectedItem, selectedAssociation, fetchAllAssociations]);

  // ==================== IMPORT/EXPORT HANDLERS ====================
  
  const handleDefaultExport = useCallback(async (selectedData: T[], format: "json" | "csv") => {
    const validIds = selectedData
      .map(item => item.id)
      .filter((id): id is string | number => id !== undefined);
    
    const ids = validIds.length > 0 ? validIds : undefined;
    
    await exportData({
      format,
      ids,
      enrich: true,
    });
  }, [exportData]);
  
  const handleDefaultImport = useCallback(async (format: "json" | "csv", file?: File) => {
    await importData({
      format,
      file,
      resolveRefs: true,
      onAmbiguous: "skip",
      onMissing: "skip",
    });
  }, [importData]);

  // ==================== COLUMNS ====================

  const tableColumns = useMemo(() => {
    return columns({
      onEdit: handleEdit,
      onDelete: handleDelete,
      onAddAssociation: associations.length > 0 ? handleAddAssociation : undefined,
    });
  }, [columns, handleEdit, handleDelete, handleAddAssociation, associations.length]);

  // ==================== EXPANSION ====================

  const renderExpandedRow = useCallback((item: T) => {
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
        isLoading={isLoading}
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
        enableColumnFilters={enableColumnFilters}
        onBulkDelete={enableRowSelection ? handleBulkDelete : undefined}
        onExport={onExport ?? (enableImportExport ? handleDefaultExport : undefined)}
        onImport={onImport ?? (enableImportExport ? handleDefaultImport : undefined)}
        isExporting={isExporting}
        isImporting={isImporting}
        enableRowExpansion={associations.length > 0}
        renderExpandedRow={associations.length > 0 ? renderExpandedRow : undefined}
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
