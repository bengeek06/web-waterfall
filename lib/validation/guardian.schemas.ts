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
 * Zod validation schemas for Guardian (RBAC) forms
 * Provides type-safe validation with automatic TypeScript inference
 * 
 * Schemas can be created with custom validation messages for i18n support.
 */

import { z } from 'zod';

// ==================== VALIDATION MESSAGES TYPE ====================
export type GuardianValidationMessages = {
  name_required: string;
  name_min_length: string;
  name_max_length: string;
  name_alphanumeric: string;
  description_max_length: string;
  policy_name_required: string;
  role_name_required: string;
  service_required: string;
  service_lowercase: string;
  resource_name_required: string;
  resource_lowercase: string;
  operation_invalid: string;
  user_id_invalid: string;
  role_id_invalid: string;
  policy_id_invalid: string;
  permission_select_required: string;
};

// Default English messages (fallback)
const defaultMessages: GuardianValidationMessages = {
  name_required: 'Name is required',
  name_min_length: 'Name must be at least 3 characters',
  name_max_length: 'Name cannot exceed 100 characters',
  name_alphanumeric: 'Name can only contain letters, numbers, dashes and underscores',
  description_max_length: 'Description cannot exceed 500 characters',
  policy_name_required: 'Policy name is required',
  role_name_required: 'Role name is required',
  service_required: 'Service is required',
  service_lowercase: 'Service can only contain lowercase letters and underscores',
  resource_name_required: 'Resource name is required',
  resource_lowercase: 'Resource can only contain lowercase letters and underscores',
  operation_invalid: 'Invalid operation',
  user_id_invalid: 'Invalid user ID',
  role_id_invalid: 'Invalid role ID',
  policy_id_invalid: 'Invalid policy ID',
  permission_select_required: 'At least one permission must be selected',
};

// ==================== POLICY SCHEMA ====================
export const createPolicySchema = (messages: Partial<GuardianValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    name: z
      .string()
      .min(1, msg.policy_name_required)
      .min(3, msg.name_min_length)
      .max(100, msg.name_max_length)
      .regex(/^[a-zA-Z0-9_-\s]+$/, msg.name_alphanumeric),
    description: z
      .string()
      .max(500, msg.description_max_length)
      .optional(),
  });
};

export const policySchema = createPolicySchema();
export type PolicyFormData = z.infer<typeof policySchema>;

// ==================== ROLE SCHEMA ====================
export const createRoleSchema = (messages: Partial<GuardianValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    name: z
      .string()
      .min(1, msg.role_name_required)
      .min(3, msg.name_min_length)
      .max(100, msg.name_max_length)
      .regex(/^[a-zA-Z0-9_-\s]+$/, msg.name_alphanumeric),
    description: z
      .string()
      .max(500, msg.description_max_length)
      .optional(),
  });
};

export const roleSchema = createRoleSchema();
export type RoleFormData = z.infer<typeof roleSchema>;

// ==================== PERMISSION SCHEMA ====================
export const createPermissionSchema = (messages: Partial<GuardianValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    service: z
      .string()
      .min(1, msg.service_required)
      .regex(/^[a-z_]+$/, msg.service_lowercase),
    resource_name: z
      .string()
      .min(1, msg.resource_name_required)
      .regex(/^[a-z_]+$/, msg.resource_lowercase),
    operation: z
      .enum(['READ', 'CREATE', 'UPDATE', 'DELETE', 'LIST'], {
        message: msg.operation_invalid,
      }),
    description: z
      .string()
      .max(500, msg.description_max_length)
      .optional(),
  });
};

export const permissionSchema = createPermissionSchema();
export type PermissionFormData = z.infer<typeof permissionSchema>;

// ==================== USER ROLE ASSIGNMENT SCHEMA ====================
export const createUserRoleAssignmentSchema = (messages: Partial<GuardianValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    userId: z
      .string()
      .uuid(msg.user_id_invalid)
      .or(z.number().int().positive()),
    roleId: z
      .string()
      .uuid(msg.role_id_invalid)
      .or(z.number().int().positive()),
  });
};

export const userRoleAssignmentSchema = createUserRoleAssignmentSchema();
export type UserRoleAssignmentFormData = z.infer<typeof userRoleAssignmentSchema>;

// ==================== POLICY PERMISSION ASSIGNMENT SCHEMA ====================
export const createPolicyPermissionAssignmentSchema = (messages: Partial<GuardianValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    policyId: z
      .string()
      .uuid(msg.policy_id_invalid)
      .or(z.number().int().positive()),
    permissionIds: z
      .array(z.string().uuid().or(z.number().int().positive()))
      .min(1, msg.permission_select_required),
  });
};

export const policyPermissionAssignmentSchema = createPolicyPermissionAssignmentSchema();
export type PolicyPermissionAssignmentFormData = z.infer<typeof policyPermissionAssignmentSchema>;
