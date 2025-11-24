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

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronDown, Building2, Plus, Edit, Trash2, Download, Upload, Image as ImageIcon } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Modals
import OrganizationUnitModal from "@/components/modals/organization-unit-modal";
import PositionModal from "@/components/modals/position-modal";
import MermaidPreviewModal from "@/components/modals/mermaid-preview-modal";

// Constants
import { IDENTITY_ROUTES } from "@/lib/api-routes";
import { BASIC_IO_ROUTES } from "@/lib/api-routes/basic_io";
import { COLOR_CLASSES } from "@/lib/design-tokens";

// Utils
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";

// Types
type OrganizationUnit = {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  parent_id?: string | null;
  path: string;
  level: number;
  created_at?: string;
  updated_at?: string;
  children?: OrganizationUnit[];
};

type Position = {
  id: string;
  title: string;
  description?: string;
  company_id: string;
  organization_unit_id: string;
  level?: number;
  created_at?: string;
  updated_at?: string;
};

type ImportReport = {
  total_records: number;
  successful_imports: number;
  failed_imports: number;
  errors: Array<{
    record_index: number;
    error_message: string;
  }>;
  warnings: Array<{
    record_index: number;
    message: string;
  }>;
};

type OrganizationTreeProps = {
  companyId: string;
  dictionary: {
    title: string;
    description: string;
    no_units: string;
    loading: string;
    error_loading: string;
    import_button: string;
    export_button: string;
    import_json: string;
    import_csv: string;
    export_json: string;
    export_csv: string;
    export_mermaid: string;
    error_export: string;
    error_import: string;
    import_report_title: string;
    import_report_total: string;
    import_report_success: string;
    import_report_failed: string;
    import_report_errors: string;
    import_report_warnings: string;
    import_report_close: string;
    mermaid_modal_title: string;
    mermaid_diagram_type: string;
    mermaid_flowchart: string;
    mermaid_graph: string;
    mermaid_mindmap: string;
    mermaid_download: string;
    mermaid_loading: string;
    mermaid_error: string;
    actions: {
      add_root: string;
      add_child: string;
      edit: string;
      delete: string;
    };
    positions: {
      title: string;
      no_positions: string;
      add_position: string;
      edit: string;
      delete: string;
    };
    unit_modal: {
      create_title: string;
      create_child_title: string;
      edit_title: string;
      name: string;
      name_required: string;
      description: string;
      parent: string;
      cancel: string;
      save: string;
    };
    position_modal: {
      create_title: string;
      edit_title: string;
      title: string;
      title_required: string;
      description: string;
      level: string;
      organization_unit: string;
      cancel: string;
      save: string;
    };
    messages: {
      unit_created: string;
      unit_updated: string;
      unit_deleted: string;
      position_created: string;
      position_updated: string;
      position_deleted: string;
      error_create: string;
      error_update: string;
      error_delete: string;
      confirm_delete_unit: string;
      confirm_delete_position: string;
    };
  };
};

// Tree Node Component
function TreeNode({
  unit,
  level = 0,
  onSelect,
  selectedId,
  onAddChild,
  onEdit,
  onDelete,
  onMove,
}: {
  unit: OrganizationUnit;
  level?: number;
  onSelect: (_unit: OrganizationUnit) => void;
  selectedId: string | null;
  onAddChild: (_parentUnit: OrganizationUnit) => void;
  onEdit: (_unit: OrganizationUnit) => void;
  onDelete: (_unitId: string) => void;
  onMove: (_unitId: string, _newParentId: string | null) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const hasChildren = unit.children && unit.children.length > 0;
  const isSelected = selectedId === unit.id;

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("unitId", unit.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedUnitId = e.dataTransfer.getData("unitId");
    
    // Ne pas autoriser le drop sur soi-même
    if (draggedUnitId === unit.id) {
      e.dataTransfer.dropEffect = "none";
      return;
    }
    
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const draggedUnitId = e.dataTransfer.getData("unitId");

    // Ne pas autoriser le drop sur soi-même
    if (draggedUnitId === unit.id) {
      return;
    }

    // Vérifier si on déplace vers un descendant (créerait une boucle)
    const isDescendant = (parentId: string, checkId: string): boolean => {
      if (parentId === checkId) return true;
      const parent = findUnitById(unit, parentId);
      if (!parent || !parent.parent_id) return false;
      return isDescendant(parent.parent_id, checkId);
    };

    if (isDescendant(unit.id, draggedUnitId)) {
      // Optionnel : afficher un toast ou simplement ignorer silencieusement
      return;
    }

    // Déplacer directement sans confirmation
    onMove(draggedUnitId, unit.id);
  };

  // Fonction helper pour trouver une unité par ID dans l'arbre
  const findUnitById = (node: OrganizationUnit, id: string): OrganizationUnit | null => {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findUnitById(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  return (
    <div>
      {/* Node */}
      <div
        className={`
          flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer
          hover:bg-accent transition-colors
          ${isSelected ? "bg-accent border-l-4 border-primary" : ""}
          ${isDragOver ? "bg-primary/10 border-2 border-primary border-dashed" : ""}
          ${isDragging ? "opacity-50" : ""}
        `}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Expand/Collapse Icon */}
        <div className="w-5 flex items-center justify-center">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="hover:bg-accent-foreground/10 rounded p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
        </div>

        {/* Icon - Draggable */}
        <div
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className="cursor-move"
          title="Glisser pour déplacer l'unité"
        >
          <Building2 
            className={`h-4 w-4 flex-shrink-0 transition-colors ${
              isDragging ? "text-primary opacity-50" : "text-muted-foreground hover:text-primary"
            }`}
          />
        </div>

        {/* Name */}
        <div
          className="flex-1 min-w-0"
          onClick={() => onSelect(unit)}
        >
          <div className="font-medium truncate">{unit.name}</div>
          {unit.description && (
            <div className="text-sm text-muted-foreground truncate">
              {unit.description}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(unit);
            }}
            className="h-7 w-7 p-0"
            title="Ajouter une sous-unité"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(unit);
            }}
            className="h-7 w-7 p-0"
            title="Modifier"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(unit.id);
            }}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            title="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {unit.children!.map((child) => (
            <TreeNode
              key={child.id}
              unit={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main Component
export default function OrganizationTree({ companyId, dictionary }: OrganizationTreeProps) {
  const router = useRouter();
  const [treeData, setTreeData] = useState<OrganizationUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<OrganizationUnit | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);

  // Modal states
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<OrganizationUnit | null>(null);
  const [parentUnit, setParentUnit] = useState<OrganizationUnit | null>(null);
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);

  // Import/Export states
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [isMermaidModalOpen, setIsMermaidModalOpen] = useState(false);

  // Build tree structure from flat list
  const buildTree = (units: OrganizationUnit[]): OrganizationUnit[] => {
    const map = new Map<string, OrganizationUnit>();
    const roots: OrganizationUnit[] = [];

    // Create map of all units
    units.forEach((unit) => {
      map.set(unit.id, { ...unit, children: [] });
    });

    // Build tree structure
    units.forEach((unit) => {
      const node = map.get(unit.id)!;
      if (unit.parent_id) {
        const parent = map.get(unit.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Sort roots and children by name
    const sortByName = (a: OrganizationUnit, b: OrganizationUnit) =>
      a.name.localeCompare(b.name);
    
    roots.sort(sortByName);
    roots.forEach((root) => {
      if (root.children) {
        root.children.sort(sortByName);
      }
    });

    return roots;
  };

  // Load organization units
  useEffect(() => {
    const loadUnits = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetchWithAuth(IDENTITY_ROUTES.organizationUnits);

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) {
          setError(dictionary.error_loading);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        // Le backend retourne {data: [...], pagination: {...}} ou un tableau direct
        const unitsList = Array.isArray(data) ? data : (data.data || []);
        setTreeData(buildTree(unitsList));
      } catch (err) {
        console.error("Error loading organization units:", err);
        setError(dictionary.error_loading);
      } finally {
        setIsLoading(false);
      }
    };

    loadUnits();
  }, [companyId, router, dictionary.error_loading]);

  // Load positions when a unit is selected
  useEffect(() => {
    if (!selectedUnit) {
      setPositions([]);
      return;
    }

    const loadPositions = async () => {
      setIsLoadingPositions(true);

      try {
        const res = await fetchWithAuth(
          IDENTITY_ROUTES.organizationUnitPositions(selectedUnit.id)
        );

        if (res.ok) {
          const data = await res.json();
          // Le backend retourne {data: [...], pagination: {...}} ou un tableau direct
          setPositions(Array.isArray(data) ? data : (data.data || []));
        } else {
          setPositions([]);
        }
      } catch (err) {
        console.error("Error loading positions:", err);
        setPositions([]);
      } finally {
        setIsLoadingPositions(false);
      }
    };

    loadPositions();
  }, [selectedUnit]);

  // Reload units from API
  const reloadUnits = async () => {
    try {
      const res = await fetchWithAuth(IDENTITY_ROUTES.organizationUnits);
      if (res.ok) {
        const data = await res.json();
        // Le backend retourne {data: [...], pagination: {...}} ou un tableau direct
        const unitsList = Array.isArray(data) ? data : (data.data || []);
        setTreeData(buildTree(unitsList));
      }
    } catch (err) {
      console.error("Error reloading units:", err);
    }
  };

  // Reload positions for selected unit
  const reloadPositions = async () => {
    if (!selectedUnit) return;
    
    try {
      const res = await fetchWithAuth(
        IDENTITY_ROUTES.organizationUnitPositions(selectedUnit.id)
      );
      if (res.ok) {
        const data = await res.json();
        // Le backend retourne {data: [...], pagination: {...}} ou un tableau direct
        setPositions(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error("Error reloading positions:", err);
    }
  };

  const handleAddRoot = () => {
    setEditingUnit(null);
    setParentUnit(null);
    setIsUnitModalOpen(true);
  };

  const handleAddChild = (parent: OrganizationUnit) => {
    setEditingUnit(null);
    setParentUnit(parent);
    setIsUnitModalOpen(true);
  };

  const handleEdit = (unit: OrganizationUnit) => {
    setEditingUnit(unit);
    setParentUnit(null);
    setIsUnitModalOpen(true);
  };

  const handleDelete = async (unitId: string) => {
    if (!confirm(dictionary.messages.confirm_delete_unit)) {
      return;
    }

    try {
      const res = await fetchWithAuth(IDENTITY_ROUTES.organizationUnit(unitId), {
        method: "DELETE",
      });

      if (res.ok) {
        await reloadUnits();
        if (selectedUnit?.id === unitId) {
          setSelectedUnit(null);
        }
      }
    } catch (err) {
      console.error("Error deleting unit:", err);
    }
  };

  const handleAddPosition = () => {
    if (!selectedUnit) return;
    setEditingPosition(null);
    setIsPositionModalOpen(true);
  };

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    setIsPositionModalOpen(true);
  };

  const handleDeletePosition = async (positionId: string) => {
    if (!confirm(dictionary.messages.confirm_delete_position)) {
      return;
    }

    try {
      const res = await fetchWithAuth(IDENTITY_ROUTES.position(positionId), {
        method: "DELETE",
      });

      if (res.ok) {
        await reloadPositions();
      }
    } catch (err) {
      console.error("Error deleting position:", err);
    }
  };

  const handleUnitModalClose = () => {
    setIsUnitModalOpen(false);
    setEditingUnit(null);
    setParentUnit(null);
  };

  const handleUnitModalSuccess = async () => {
    await reloadUnits();
  };

  const handlePositionModalClose = () => {
    setIsPositionModalOpen(false);
    setEditingPosition(null);
  };

  const handlePositionModalSuccess = async () => {
    await reloadPositions();
  };

  const handleMove = async (unitId: string, newParentId: string | null) => {
    try {
      const payload: { parent_id: string | null } = {
        parent_id: newParentId,
      };

      const res = await fetchWithAuth(IDENTITY_ROUTES.organizationUnit(unitId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error moving unit:", errorText);
        alert("Erreur lors du déplacement de l'unité");
        return;
      }

      // Reload the tree
      await reloadUnits();
    } catch (err) {
      console.error("Error moving unit:", err);
      alert("Erreur lors du déplacement de l'unité");
    }
  };

  // ==================== EXPORT OPERATIONS ====================

  const handleExport = async (type: 'json' | 'csv') => {
    try {
      setIsExporting(true);
      
      const format = type === 'json' ? 'json' : 'csv';
      const exportUrl = new URL(BASIC_IO_ROUTES.export, globalThis.location.origin);
      exportUrl.searchParams.set('service', 'identity');
      exportUrl.searchParams.set('path', '/organization_units');
      exportUrl.searchParams.set('type', format);
      exportUrl.searchParams.set('tree', 'true');
      exportUrl.searchParams.set('enrich', 'true');
      
      const res = await fetchWithAuth(exportUrl.toString());

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Export failed: ${errorText}`);
      }

      const blob = await res.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = globalThis.document.createElement('a');
      a.href = url;
      a.download = `organization-tree_${new Date().toISOString().split('T')[0]}.${format}`;
      globalThis.document.body.appendChild(a);
      a.click();
      a.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError(dictionary.error_export);
    } finally {
      setIsExporting(false);
    }
  };

  const handleMermaidExport = async (diagramType: 'flowchart' | 'graph' | 'mindmap') => {
    try {
      const exportUrl = new URL(BASIC_IO_ROUTES.export, globalThis.location.origin);
      exportUrl.searchParams.set('service', 'identity');
      exportUrl.searchParams.set('path', '/organization_units');
      exportUrl.searchParams.set('type', 'mermaid');
      exportUrl.searchParams.set('diagram_type', diagramType);
      
      const res = await fetchWithAuth(exportUrl.toString());

      if (res.status === 401) {
        router.push("/login");
        return '';
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Mermaid export failed: ${errorText}`);
      }

      return await res.text();
    } catch (err) {
      console.error('Mermaid export error:', err);
      throw err;
    }
  };

  // ==================== IMPORT OPERATIONS ====================

  const handleImport = async (type: 'json' | 'csv') => {
    const input = globalThis.document.createElement('input');
    input.type = 'file';
    input.accept = type === 'json' ? '.json' : '.csv';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setIsImporting(true);
        
        const formData = new FormData();
        formData.append('file', file);

        const importUrl = new URL(BASIC_IO_ROUTES.import, globalThis.location.origin);
        importUrl.searchParams.set('service', 'identity');
        importUrl.searchParams.set('path', '/organization_units');
        importUrl.searchParams.set('type', type);

        const res = await fetchWithAuth(importUrl.toString(), {
          method: 'POST',
          body: formData,
        });

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Import failed: ${errorText}`);
        }

        const report: ImportReport = await res.json();
        setImportReport(report);
        
        // Reload tree after import
        await reloadUnits();
      } catch (err) {
        console.error('Import error:', err);
        setError(dictionary.error_import);
      } finally {
        setIsImporting(false);
      }
    };

    input.click();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground">{dictionary.loading}</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center min-h-[400px]">
          <p className={COLOR_CLASSES.text.destructive}>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{dictionary.title}</CardTitle>
            <CardDescription>{dictionary.description}</CardDescription>
          </div>
          <div className="flex gap-2">
            {/* Import Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isImporting}>
                  <Upload className="h-4 w-4 mr-2" />
                  {dictionary.import_button}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleImport('json')}>
                  {dictionary.import_json}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImport('csv')}>
                  {dictionary.import_csv}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {dictionary.export_button}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  {dictionary.export_json}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  {dictionary.export_csv}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsMermaidModalOpen(true)}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {dictionary.export_mermaid}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Root Button */}
            <Button onClick={handleAddRoot} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {dictionary.actions.add_root}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tree View */}
          <div className="lg:col-span-2">
            <div className="border rounded-md p-2 max-h-[600px] overflow-y-auto">
              {treeData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {dictionary.no_units}
                </div>
              ) : (
                <div className="space-y-1 group">
                  {treeData.map((unit) => (
                    <TreeNode
                      key={unit.id}
                      unit={unit}
                      onSelect={setSelectedUnit}
                      selectedId={selectedUnit?.id || null}
                      onAddChild={handleAddChild}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onMove={handleMove}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Positions Panel */}
          <div className="border rounded-md p-4 max-h-[600px] overflow-y-auto">
            {selectedUnit ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">{dictionary.positions.title}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUnit.name}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleAddPosition}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {dictionary.positions.add_position}
                  </Button>
                </div>

                {isLoadingPositions ? (
                  <p className="text-sm text-muted-foreground">{dictionary.loading}</p>
                ) : positions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {dictionary.positions.no_positions}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {positions.map((position) => (
                      <div
                        key={position.id}
                        className="p-3 border rounded-md hover:bg-accent transition-colors"
                      >
                        <div className="font-medium text-sm">{position.title}</div>
                        {position.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {position.description}
                          </div>
                        )}
                        {position.level !== undefined && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Niveau: {position.level}
                          </div>
                        )}
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={() => handleEditPosition(position)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            {dictionary.positions.edit}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleDeletePosition(position.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            {dictionary.positions.delete}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Sélectionnez une unité pour voir ses positions
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Modals */}
      <OrganizationUnitModal
        key={`unit-modal-${editingUnit?.id || 'new'}-${parentUnit?.id || 'root'}-${isUnitModalOpen}`}
        isOpen={isUnitModalOpen}
        onClose={handleUnitModalClose}
        onSuccess={handleUnitModalSuccess}
        unit={editingUnit}
        parentUnit={parentUnit}
        dictionary={dictionary}
      />

      {selectedUnit && (
        <PositionModal
          key={`position-modal-${editingPosition?.id || 'new'}-${selectedUnit.id}-${isPositionModalOpen}`}
          isOpen={isPositionModalOpen}
          onClose={handlePositionModalClose}
          onSuccess={handlePositionModalSuccess}
          organizationUnit={selectedUnit}
          position={editingPosition}
          dictionary={dictionary}
        />
      )}

      {/* Mermaid Preview Modal */}
      <MermaidPreviewModal
        isOpen={isMermaidModalOpen}
        onClose={() => setIsMermaidModalOpen(false)}
        onGenerate={handleMermaidExport}
        dictionary={dictionary}
      />

      {/* Import Report Dialog */}
      <Dialog open={!!importReport} onOpenChange={() => setImportReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dictionary.import_report_title}</DialogTitle>
            <DialogDescription>
              {dictionary.import_report_total}: {importReport?.total_records || 0} |{' '}
              {dictionary.import_report_success}: {importReport?.successful_imports || 0} |{' '}
              {dictionary.import_report_failed}: {importReport?.failed_imports || 0}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {importReport && importReport.errors.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">{dictionary.import_report_errors}</h4>
                <ul className="space-y-1 text-sm">
                  {importReport.errors.map((err) => (
                    <li key={`error-${err.record_index}`} className="text-destructive">
                      Row {err.record_index + 1}: {err.error_message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {importReport && importReport.warnings.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">{dictionary.import_report_warnings}</h4>
                <ul className="space-y-1 text-sm">
                  {importReport.warnings.map((warn) => (
                    <li key={`warning-${warn.record_index}`} className="text-yellow-600">
                      Row {warn.record_index + 1}: {warn.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setImportReport(null)}>
              {dictionary.import_report_close}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
