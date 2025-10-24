"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronDown, Building2, Plus, Edit, Trash2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Modals
import OrganizationUnitModal from "@/components/modals/organization-unit-modal";
import PositionModal from "@/components/modals/position-modal";

// Constants
import { IDENTITY_ROUTES } from "@/lib/api-routes";
import { COLOR_CLASSES } from "@/lib/design-tokens";

// Utils
import { clientSessionFetch } from "@/lib/clientFetch";

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

type OrganizationTreeProps = {
  companyId: string;
  dictionary: {
    title: string;
    description: string;
    no_units: string;
    loading: string;
    error_loading: string;
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
}: {
  unit: OrganizationUnit;
  level?: number;
  onSelect: (unit: OrganizationUnit) => void;
  selectedId: string | null;
  onAddChild: (parentUnit: OrganizationUnit) => void;
  onEdit: (unit: OrganizationUnit) => void;
  onDelete: (unitId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const hasChildren = unit.children && unit.children.length > 0;
  const isSelected = selectedId === unit.id;

  return (
    <div>
      {/* Node */}
      <div
        className={`
          flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer
          hover:bg-accent transition-colors
          ${isSelected ? "bg-accent border-l-4 border-primary" : ""}
        `}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
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

        {/* Icon */}
        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [units, setUnits] = useState<OrganizationUnit[]>([]);
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
        const res = await clientSessionFetch(IDENTITY_ROUTES.organizationUnits);

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
        const unitsList = Array.isArray(data) ? data : [];
        setUnits(unitsList);
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
        const res = await clientSessionFetch(
          IDENTITY_ROUTES.organizationUnitPositions(selectedUnit.id)
        );

        if (res.ok) {
          const data = await res.json();
          setPositions(Array.isArray(data) ? data : []);
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
      const res = await clientSessionFetch(IDENTITY_ROUTES.organizationUnits);
      if (res.ok) {
        const data = await res.json();
        const unitsList = Array.isArray(data) ? data : [];
        setUnits(unitsList);
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
      const res = await clientSessionFetch(
        IDENTITY_ROUTES.organizationUnitPositions(selectedUnit.id)
      );
      if (res.ok) {
        const data = await res.json();
        setPositions(Array.isArray(data) ? data : []);
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
      const res = await clientSessionFetch(IDENTITY_ROUTES.organizationUnit(unitId), {
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
      const res = await clientSessionFetch(IDENTITY_ROUTES.position(positionId), {
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
          <Button onClick={handleAddRoot} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {dictionary.actions.add_root}
          </Button>
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
        isOpen={isUnitModalOpen}
        onClose={handleUnitModalClose}
        onSuccess={handleUnitModalSuccess}
        companyId={companyId}
        unit={editingUnit}
        parentUnit={parentUnit}
        dictionary={dictionary}
      />

      {selectedUnit && (
        <PositionModal
          isOpen={isPositionModalOpen}
          onClose={handlePositionModalClose}
          onSuccess={handlePositionModalSuccess}
          companyId={companyId}
          organizationUnit={selectedUnit}
          position={editingPosition}
          dictionary={dictionary}
        />
      )}
    </Card>
  );
}
