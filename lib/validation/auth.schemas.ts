/**
 * Zod validation schemas for authentication forms
 * Provides type-safe validation with automatic TypeScript inference
 */

import { z } from 'zod';

// ==================== LOGIN SCHEMA ====================
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide'),
  password: z
    .string()
    .min(1, 'Mot de passe requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ==================== REGISTER SCHEMA ====================
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide'),
  name: z
    .string()
    .min(1, 'Nom requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  password: z
    .string()
    .min(1, 'Mot de passe requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z
    .string()
    .min(1, 'Confirmation requise'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// ==================== INIT APP SCHEMA ====================
export const initAppSchema = z.object({
  companyName: z
    .string()
    .min(1, 'Nom de la compagnie requis')
    .min(2, 'Le nom de la compagnie doit contenir au moins 2 caractères')
    .max(100, 'Le nom de la compagnie ne peut pas dépasser 100 caractères'),
  userName: z
    .string()
    .min(1, 'Nom de l\'utilisateur requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  userEmail: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide'),
  password: z
    .string()
    .min(1, 'Mot de passe requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z
    .string()
    .min(1, 'Confirmation requise'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type InitAppFormData = z.infer<typeof initAppSchema>;

// ==================== CHANGE PASSWORD SCHEMA ====================
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Mot de passe actuel requis'),
  newPassword: z
    .string()
    .min(1, 'Nouveau mot de passe requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z
    .string()
    .min(1, 'Confirmation requise'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'Le nouveau mot de passe doit être différent de l\'ancien',
  path: ['newPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
