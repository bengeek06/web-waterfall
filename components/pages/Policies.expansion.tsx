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

import React from 'react';
import { Eye, List, Edit, Trash2, Plus, Pencil } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { DASHBOARD_TEST_IDS, testId } from '@/lib/test-ids';
import { ICON_SIZES, COLOR_CLASSES, SPACING } from '@/lib/design-tokens';
import type { Policy, Permission, PoliciesDictionary } from './Policies.columns';

// Re-export types for external use
export type { Permission, Policy } from './Policies.columns';

// ==================== OPERATION ICONS ====================
function getOperationIcons(dictionary: Pick<PoliciesDictionary, 'operation_read' | 'operation_create' | 'operation_update' | 'operation_delete'> & { operation_list?: string }) {
  return {
    READ: { icon: Eye, label: dictionary.operation_read, color: COLOR_CLASSES.operations.read },
    CREATE: { icon: Plus, label: dictionary.operation_create, color: COLOR_CLASSES.operations.create },
    LIST: { icon: List, label: dictionary.operation_list || 'List (LIST)', color: COLOR_CLASSES.operations.list },
    UPDATE: { icon: Pencil, label: dictionary.operation_update, color: COLOR_CLASSES.operations.update },
    DELETE: { icon: Trash2, label: dictionary.operation_delete, color: COLOR_CLASSES.operations.delete },
  } as const;
}

function getOperationIcon(
  operation: string,
  dictionary: Pick<PoliciesDictionary, 'operation_read' | 'operation_create' | 'operation_update' | 'operation_delete'> & { operation_list?: string }
) {
  if (!operation) {
    return { icon: null, label: 'Unknown' };
  }

  const OPERATION_ICONS = getOperationIcons(dictionary);
  const iconConfig = OPERATION_ICONS[operation as keyof typeof OPERATION_ICONS];

  if (iconConfig) {
    const Icon = iconConfig.icon;
    return {
      icon: <Icon className={`${ICON_SIZES.sm} ${iconConfig.color}`} />,
      label: iconConfig.label,
    };
  }

  return {
    icon: <span className="text-xs">{operation}</span>,
    label: operation,
  };
}

// ==================== GROUPING LOGIC ====================
export interface PermissionGroup {
  service: string;
  resource_name: string;
  perms: Permission[];
}

export function groupPermissions(permissions: Permission[]): PermissionGroup[] {
  const groups: Record<string, PermissionGroup> = {};

  // Sort order for operations
  const operationOrder: Record<string, number> = {
    LIST: 1,
    CREATE: 2,
    READ: 3,
    UPDATE: 4,
    DELETE: 5,
  };

  permissions.forEach((perm) => {
    const key = `${perm.service}::${perm.resource_name}`;
    if (!groups[key]) {
      groups[key] = {
        service: perm.service,
        resource_name: perm.resource_name,
        perms: [],
      };
    }
    groups[key].perms.push(perm);
  });

  // Sort permissions within each group
  Object.values(groups).forEach((group) => {
    group.perms.sort((a, b) => {
      const orderA = operationOrder[a.operation] || 999;
      const orderB = operationOrder[b.operation] || 999;
      return orderA - orderB;
    });
  });

  return Object.values(groups);
}

// ==================== EXPANDED ROW RENDERER ====================
export interface PolicyExpansionProps {
  policy: Policy;
  dictionary: Pick<
    PoliciesDictionary,
    | 'operation_read'
    | 'operation_create'
    | 'operation_update'
    | 'operation_delete'
  > & {
    operation_list?: string;
    permissions_associated?: string;
    no_permissions?: string;
    edit_operations_tooltip?: string;
    delete_permission_group_tooltip?: string;
  };
  onEditPermissionGroup: (
    _policy: Policy,
    _service: string,
    _resourceName: string,
    _permissions: Permission[]
  ) => void;
  onDeletePermissionGroup: (_policyId: string | number, _permissions: Permission[]) => void;
}

export function PolicyExpansion({
  policy,
  dictionary,
  onEditPermissionGroup,
  onDeletePermissionGroup,
}: PolicyExpansionProps) {
  const permissionsCount = policy.permissions?.length || 0;

  return (
    <div className="px-4 py-3 bg-gray-50">
      <div className="font-medium mb-2">
        {dictionary.permissions_associated || 'Permissions associées :'}
      </div>
      {permissionsCount === 0 ? (
        <div className="text-gray-500 text-sm">
          {dictionary.no_permissions || 'Aucune permission associée'}
        </div>
      ) : (
        <div className="space-y-2">
          {groupPermissions(policy.permissions || []).map((group) => (
            <div
              key={group.service + group.resource_name}
              className="flex items-center bg-white p-2 rounded border"
              {...testId(
                DASHBOARD_TEST_IDS.policies.permissionGroup(
                  group.service,
                  group.resource_name
                )
              )}
            >
              {/* Service / Resource Label */}
              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                {group.service} / {group.resource_name}
              </span>

              {/* Operation Icons */}
              <span className={`flex ${SPACING.gap.sm} ml-2 mr-4`}>
                {group.perms.map((perm) => (
                  <Tooltip key={perm.id}>
                    <TooltipTrigger asChild>
                      <span
                        className="inline-flex items-center cursor-help"
                        {...testId(DASHBOARD_TEST_IDS.policies.permissionIcon(perm.id))}
                      >
                        {getOperationIcon(perm.operation, dictionary).icon}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div>{getOperationIcon(perm.operation, dictionary).label}</div>
                      {perm.description && (
                        <div className="text-xs opacity-80 mt-1">
                          {perm.description}
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </span>

              {/* Action Buttons */}
              <TooltipProvider>
                <span className="ml-auto flex gap-1">
                  {/* Edit Permission Group Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          onEditPermissionGroup(
                            policy,
                            group.service,
                            group.resource_name,
                            group.perms
                          )
                        }
                        {...testId(
                          DASHBOARD_TEST_IDS.policies.editPermissionGroupButton(
                            group.service,
                            group.resource_name
                          )
                        )}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">{dictionary.edit_operations_tooltip || 'Éditer les opérations'}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{dictionary.edit_operations_tooltip || 'Éditer les opérations'}</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Delete Permission Group Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          onDeletePermissionGroup(policy.id, group.perms)
                        }
                        {...testId(
                          DASHBOARD_TEST_IDS.policies.deletePermissionGroupButton(
                            group.service,
                            group.resource_name
                          )
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{dictionary.delete_permission_group_tooltip || 'Supprimer toutes les permissions de ce groupe'}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{dictionary.delete_permission_group_tooltip ||
                        'Supprimer toutes les permissions de ce groupe'}</p>
                    </TooltipContent>
                  </Tooltip>
                </span>
              </TooltipProvider>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
