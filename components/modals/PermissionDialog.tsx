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

import React, { useState, useMemo } from 'react';
import { Eye, PlusSquare, List, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DASHBOARD_TEST_IDS, testId } from '@/lib/test-ids';
import { ICON_SIZES, COLOR_CLASSES, SPACING } from '@/lib/design-tokens';
import { groupPermissions, type Permission, type PermissionGroup } from '@/components/pages/Policies.expansion';

// ==================== TYPES ====================
export interface PermissionDialogDictionary {
  dialog_title: string;
  associated_permissions: string;
  no_permissions: string;
  available_permissions: string;
  no_available_permissions: string;
  service_filter: string;
  resource_filter: string;
  cancel_button: string;
  add_button: string;
  operation_read: string;
  operation_create: string;
  operation_update: string;
  operation_delete: string;
  operation_list?: string;
}

export interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  policyName: string;
  associatedPermissions: Permission[];
  availablePermissions: Permission[];
  onAddPermissions: (_permissionIds: (string | number)[]) => Promise<void>;
  dictionary: PermissionDialogDictionary;
  initialService?: string;
  initialResource?: string;
}

// ==================== OPERATION ICONS ====================
function getOperationIcons(dictionary: Pick<PermissionDialogDictionary, 'operation_read' | 'operation_create' | 'operation_update' | 'operation_delete'> & { operation_list?: string }) {
  return {
    READ: { icon: Eye, label: dictionary.operation_read, color: COLOR_CLASSES.operations.read },
    CREATE: { icon: PlusSquare, label: dictionary.operation_create, color: COLOR_CLASSES.operations.create },
    LIST: { icon: List, label: dictionary.operation_list || 'List (LIST)', color: COLOR_CLASSES.operations.list },
    UPDATE: { icon: Pencil, label: dictionary.operation_update, color: COLOR_CLASSES.operations.update },
    DELETE: { icon: Trash2, label: dictionary.operation_delete, color: COLOR_CLASSES.operations.delete },
  } as const;
}

function getOperationIcon(
  operation: string,
  dictionary: Pick<PermissionDialogDictionary, 'operation_read' | 'operation_create' | 'operation_update' | 'operation_delete'> & { operation_list?: string }
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

// ==================== GROUPING UTILITY ====================
function groupAvailablePermissions(perms: Permission[]): PermissionGroup[] {
  const groups: Record<string, PermissionGroup> = {};

  const operationOrder: Record<string, number> = {
    LIST: 1,
    CREATE: 2,
    READ: 3,
    UPDATE: 4,
    DELETE: 5,
  };

  perms.forEach((perm) => {
    const key = `${perm.service}::${perm.resource_name}`;
    if (!groups[key]) {
      groups[key] = { service: perm.service, resource_name: perm.resource_name, perms: [] };
    }
    groups[key].perms.push(perm);
  });

  // Sort permissions within each group
  for (const group of Object.values(groups)) {
    group.perms.sort((a, b) => {
      const orderA = operationOrder[a.operation] || 999;
      const orderB = operationOrder[b.operation] || 999;
      return orderA - orderB;
    });
  }

  return Object.values(groups);
}

// ==================== COMPONENT ====================
export function PermissionDialog({
  open,
  onOpenChange,
  policyName,
  associatedPermissions,
  availablePermissions,
  onAddPermissions,
  dictionary,
  initialService = '',
  initialResource = '',
}: Readonly<PermissionDialogProps>) {
  const [filterService, setFilterService] = useState(initialService);
  const [filterResource, setFilterResource] = useState(initialResource);
  const [selectedPermissionsToAdd, setSelectedPermissionsToAdd] = useState<Set<string | number>>(new Set());

  // Compute unique services and resources
  const uniqueServices = useMemo(() => {
    const services = new Set<string>();
    for (const p of availablePermissions) {
      services.add(p.service);
    }
    return Array.from(services).sort((a, b) => a.localeCompare(b));
  }, [availablePermissions]);

  const uniqueResources = useMemo(() => {
    const resources = new Set<string>();
    for (const p of availablePermissions) {
      if (!filterService || p.service === filterService) {
        resources.add(p.resource_name);
      }
    }
    return Array.from(resources).sort((a, b) => a.localeCompare(b));
  }, [availablePermissions, filterService]);

  // Filtered available permissions
  const filteredAvailablePermissions = useMemo(() => {
    return availablePermissions.filter((perm) => {
      if (filterService && perm.service !== filterService) return false;
      if (filterResource && perm.resource_name !== filterResource) return false;
      return true;
    });
  }, [availablePermissions, filterService, filterResource]);

  // Handlers
  const handleSelectPermissionToAdd = (permId: string | number) => {
    setSelectedPermissionsToAdd((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permId)) {
        newSet.delete(permId);
      } else {
        newSet.add(permId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (selectedPermissionsToAdd.size === 0) return;
    await onAddPermissions(Array.from(selectedPermissionsToAdd));
    setSelectedPermissionsToAdd(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          maxWidth: 800,
          minWidth: 600,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        aria-describedby={void 0}
        aria-label="add_permissions-dialog"
        {...testId(DASHBOARD_TEST_IDS.policies.addPermissionDialog)}
      >
        <DialogTitle {...testId(DASHBOARD_TEST_IDS.policies.addPermissionDialogTitle)}>
          {dictionary.dialog_title.replace('{policyName}', policyName)}
        </DialogTitle>

        <div className={`flex flex-col md:flex-row ${SPACING.gap.lg} mt-4 flex-1 overflow-hidden`}>
          {/* Associated Permissions Panel */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold mb-2">{dictionary.associated_permissions}</div>
            <div className="overflow-y-auto max-h-[30vh] pr-2 overflow-x-hidden">
              {associatedPermissions.length === 0 ? (
                <div className={COLOR_CLASSES.text.muted}>{dictionary.no_permissions}</div>
              ) : (
                <ul className={SPACING.component.xs}>
                  {groupPermissions(associatedPermissions).map((group) => (
                    <li key={group.service + group.resource_name} className="flex flex-col gap-2">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs inline-block">
                        {group.service} / {group.resource_name}
                      </span>
                      <span className={`flex flex-wrap ${SPACING.gap.sm}`}>
                        {group.perms.map((perm) => (
                          <Tooltip key={perm.id}>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center cursor-help">
                                {getOperationIcon(perm.operation, dictionary).icon}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div>{getOperationIcon(perm.operation, dictionary).label}</div>
                              {perm.description && (
                                <div className="text-xs opacity-80 mt-1">{perm.description}</div>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Available Permissions Panel */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold mb-2">{dictionary.available_permissions}</div>

            {/* Filters */}
            <div className={`flex flex-wrap ${SPACING.gap.sm} mb-2`}>
              <select
                className="border rounded px-2 py-1 min-w-[120px]"
                value={filterService}
                onChange={(e) => {
                  setFilterService(e.target.value);
                  // Reset resource filter if service changes
                  if (e.target.value && filterResource) {
                    const resourceExistsInService = availablePermissions.some(
                      (p) => p.service === e.target.value && p.resource_name === filterResource
                    );
                    if (!resourceExistsInService) {
                      setFilterResource('');
                    }
                  }
                }}
                {...testId(DASHBOARD_TEST_IDS.policies.serviceFilter)}
              >
                <option value="">{dictionary.service_filter}</option>
                {uniqueServices.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                className="border rounded px-2 py-1 min-w-[120px]"
                value={filterResource}
                onChange={(e) => setFilterResource(e.target.value)}
                {...testId(DASHBOARD_TEST_IDS.policies.resourceFilter)}
              >
                <option value="">{dictionary.resource_filter}</option>
                {uniqueResources.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Available Permissions List */}
            <div className="overflow-y-auto max-h-[30vh] pr-2 overflow-x-hidden">
              {filteredAvailablePermissions.length === 0 ? (
                <div className={COLOR_CLASSES.text.muted}>{dictionary.no_available_permissions}</div>
              ) : (
                <ul className={SPACING.component.xs}>
                  {groupAvailablePermissions(filteredAvailablePermissions).map((group) => (
                    <li key={group.service + group.resource_name} className="flex flex-col gap-2">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs inline-block">
                        {group.service} / {group.resource_name}
                      </span>
                      <span className={`flex flex-wrap ${SPACING.gap.sm}`}>
                        {group.perms.map((perm) => (
                          <label
                            key={perm.id}
                            className={`flex items-center ${SPACING.gap.sm} cursor-pointer`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissionsToAdd.has(perm.id)}
                              onChange={() => handleSelectPermissionToAdd(perm.id)}
                              {...testId(DASHBOARD_TEST_IDS.policies.permissionCheckbox(perm.id))}
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center cursor-help">
                                  {getOperationIcon(perm.operation, dictionary).icon}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div>{getOperationIcon(perm.operation, dictionary).label}</div>
                                {perm.description && (
                                  <div className="text-xs opacity-80 mt-1">{perm.description}</div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </label>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className={`flex justify-end ${SPACING.gap.sm} mt-4`}>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            {...testId(DASHBOARD_TEST_IDS.policies.addPermissionCancelButton)}
          >
            {dictionary.cancel_button}
          </Button>
          <Button
            variant="default"
            disabled={selectedPermissionsToAdd.size === 0}
            onClick={handleSubmit}
            {...testId(DASHBOARD_TEST_IDS.policies.addPermissionSubmitButton)}
          >
            {dictionary.add_button}{' '}
            {selectedPermissionsToAdd.size > 0 ? `(${selectedPermissionsToAdd.size})` : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
