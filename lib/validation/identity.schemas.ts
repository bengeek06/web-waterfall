/**
 * Zod validation schemas for Identity service forms
 * Provides type-safe validation with automatic TypeScript inference
 */

import { z } from 'zod';

// ==================== USER SCHEMA (Create) ====================
export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide')
    .max(100, 'L\'email ne peut pas dépasser 100 caractères'),
  password: z
    .string()
    .min(1, 'Mot de passe requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  first_name: z
    .string()
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .optional()
    .or(z.literal('')),
  last_name: z
    .string()
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .optional()
    .or(z.literal('')),
  phone_number: z
    .string()
    .max(50, 'Le téléphone ne peut pas dépasser 50 caractères')
    .optional()
    .or(z.literal('')),
  avatar_url: z
    .string()
    .url('URL avatar invalide')
    .max(255, 'L\'URL ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  language: z
    .enum(['en', 'fr'], { errorMap: () => ({ message: 'Langue invalide (en ou fr)' }) })
    .optional()
    .default('fr'),
  is_active: z.boolean().optional().default(true),
  is_verified: z.boolean().optional().default(false),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

// ==================== USER SCHEMA (Update) ====================
export const updateUserSchema = z.object({
  email: z
    .string()
    .email('Email invalide')
    .max(100, 'L\'email ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),
  first_name: z
    .string()
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .optional()
    .or(z.literal('')),
  last_name: z
    .string()
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .optional()
    .or(z.literal('')),
  phone_number: z
    .string()
    .max(50, 'Le téléphone ne peut pas dépasser 50 caractères')
    .optional()
    .or(z.literal('')),
  avatar_url: z
    .string()
    .url('URL avatar invalide')
    .max(255, 'L\'URL ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  language: z
    .enum(['en', 'fr'], { errorMap: () => ({ message: 'Langue invalide (en ou fr)' }) })
    .optional(),
  is_active: z.boolean().optional(),
  is_verified: z.boolean().optional(),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

// ==================== LEGACY SCHEMAS (keep for backward compatibility) ====================
export const userSchema = z.object({
  name: z
    .string()
    .min(1, 'Nom requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide'),
  phone: z
    .string()
    .regex(/^[\d\s+()-]*$/, 'Numéro de téléphone invalide')
    .optional()
    .or(z.literal('')),
  position: z
    .string()
    .max(100, 'Le poste ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),
});

export type UserFormData = z.infer<typeof userSchema>;

// ==================== COMPANY SCHEMA ====================
export const companySchema = z.object({
  name: z
    .string()
    .min(1, 'Nom de la compagnie requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  description: z
    .string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^[\d\s+()-]*$/, 'Numéro de téléphone invalide')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Email invalide')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url('URL invalide')
    .optional()
    .or(z.literal('')),
});

export type CompanyFormData = z.infer<typeof companySchema>;

// ==================== ORGANIZATION UNIT SCHEMA ====================
export const organizationUnitSchema = z.object({
  name: z
    .string()
    .min(1, 'Nom de l\'unité requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),
  parentId: z
    .string()
    .uuid('ID parent invalide')
    .optional()
    .or(z.number().int().positive())
    .or(z.literal('')),
});

export type OrganizationUnitFormData = z.infer<typeof organizationUnitSchema>;

// ==================== POSITION SCHEMA ====================
export const positionSchema = z.object({
  title: z
    .string()
    .min(1, 'Titre du poste requis')
    .min(2, 'Le titre doit contenir au moins 2 caractères')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  description: z
    .string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),
  departmentId: z
    .string()
    .uuid('ID département invalide')
    .optional()
    .or(z.number().int().positive())
    .or(z.literal('')),
});

export type PositionFormData = z.infer<typeof positionSchema>;

// ==================== PROFILE UPDATE SCHEMA ====================
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Nom requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide'),
  phone: z
    .string()
    .regex(/^[\d\s+()-]*$/, 'Numéro de téléphone invalide')
    .optional()
    .or(z.literal('')),
  avatar: z
    .string()
    .url('URL avatar invalide')
    .optional()
    .or(z.literal('')),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
