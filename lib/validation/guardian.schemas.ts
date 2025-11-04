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
 */

import { z } from 'zod';

// ==================== POLICY SCHEMA ====================
export const policySchema = z.object({
  name: z
    .string()
    .min(1, 'Nom de la policy requis')
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-Z0-9_-\s]+$/, 'Le nom ne peut contenir que des lettres, chiffres, tirets et underscores'),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
});

export type PolicyFormData = z.infer<typeof policySchema>;

// ==================== ROLE SCHEMA ====================
export const roleSchema = z.object({
  name: z
    .string()
    .min(1, 'Nom du rôle requis')
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-Z0-9_-\s]+$/, 'Le nom ne peut contenir que des lettres, chiffres, tirets et underscores'),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
});

export type RoleFormData = z.infer<typeof roleSchema>;

// ==================== PERMISSION SCHEMA ====================
export const permissionSchema = z.object({
  service: z
    .string()
    .min(1, 'Service requis')
    .regex(/^[a-z_]+$/, 'Le service ne peut contenir que des lettres minuscules et underscores'),
  resource_name: z
    .string()
    .min(1, 'Nom de la ressource requis')
    .regex(/^[a-z_]+$/, 'La ressource ne peut contenir que des lettres minuscules et underscores'),
  operation: z
    .enum(['READ', 'CREATE', 'UPDATE', 'DELETE', 'LIST'], {
      errorMap: () => ({ message: 'Opération invalide' }),
    }),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
});

export type PermissionFormData = z.infer<typeof permissionSchema>;

// ==================== USER ROLE ASSIGNMENT SCHEMA ====================
export const userRoleAssignmentSchema = z.object({
  userId: z
    .string()
    .uuid('ID utilisateur invalide')
    .or(z.number().int().positive()),
  roleId: z
    .string()
    .uuid('ID rôle invalide')
    .or(z.number().int().positive()),
});

export type UserRoleAssignmentFormData = z.infer<typeof userRoleAssignmentSchema>;

// ==================== POLICY PERMISSION ASSIGNMENT SCHEMA ====================
export const policyPermissionAssignmentSchema = z.object({
  policyId: z
    .string()
    .uuid('ID policy invalide')
    .or(z.number().int().positive()),
  permissionIds: z
    .array(z.string().uuid().or(z.number().int().positive()))
    .min(1, 'Au moins une permission doit être sélectionnée'),
});

export type PolicyPermissionAssignmentFormData = z.infer<typeof policyPermissionAssignmentSchema>;
