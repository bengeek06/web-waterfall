/**
 * Zod validation schemas for Identity service forms
 * Provides type-safe validation with automatic TypeScript inference
 */

import { z } from 'zod';

// ==================== USER SCHEMA ====================
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
