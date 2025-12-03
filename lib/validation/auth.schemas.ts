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
 * Zod validation schemas for authentication forms
 * Provides type-safe validation with automatic TypeScript inference
 * 
 * Schemas can be created with custom validation messages for i18n support.
 */

import { z } from 'zod';

// ==================== VALIDATION MESSAGES TYPE ====================
export type ValidationMessages = {
  email_required: string;
  email_invalid: string;
  password_required: string;
  password_min_length: string;
  password_uppercase: string;
  password_lowercase: string;
  password_number: string;
  password_confirmation_required: string;
  passwords_must_match: string;
  name_required: string;
  name_min_length: string;
  name_max_length: string;
  company_name_required: string;
  company_name_min_length: string;
  company_name_max_length: string;
  current_password_required: string;
  new_password_required: string;
  new_password_different: string;
};

// Default English messages (fallback)
const defaultMessages: ValidationMessages = {
  email_required: 'Email is required',
  email_invalid: 'Invalid email',
  password_required: 'Password is required',
  password_min_length: 'Password must be at least 6 characters',
  password_uppercase: 'Password must contain at least one uppercase letter',
  password_lowercase: 'Password must contain at least one lowercase letter',
  password_number: 'Password must contain at least one number',
  password_confirmation_required: 'Password confirmation is required',
  passwords_must_match: 'Passwords do not match',
  name_required: 'Name is required',
  name_min_length: 'Name must be at least 2 characters',
  name_max_length: 'Name cannot exceed 100 characters',
  company_name_required: 'Company name is required',
  company_name_min_length: 'Company name must be at least 2 characters',
  company_name_max_length: 'Company name cannot exceed 100 characters',
  current_password_required: 'Current password is required',
  new_password_required: 'New password is required',
  new_password_different: 'New password must be different from current password',
};

// ==================== LOGIN SCHEMA ====================
export const createLoginSchema = (messages: Partial<ValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    email: z
      .string()
      .min(1, msg.email_required)
      .email(msg.email_invalid),
    password: z
      .string()
      .min(1, msg.password_required)
      .min(6, msg.password_min_length),
  });
};

export const loginSchema = createLoginSchema();
export type LoginFormData = z.infer<typeof loginSchema>;

// ==================== REGISTER SCHEMA ====================
export const createRegisterSchema = (messages: Partial<ValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    email: z
      .string()
      .min(1, msg.email_required)
      .email(msg.email_invalid),
    name: z
      .string()
      .min(1, msg.name_required)
      .min(2, msg.name_min_length)
      .max(100, msg.name_max_length),
    password: z
      .string()
      .min(1, msg.password_required)
      .min(8, msg.password_min_length.replace('{min}', '8'))
      .regex(/[A-Z]/, msg.password_uppercase)
      .regex(/[a-z]/, msg.password_lowercase)
      .regex(/[0-9]/, msg.password_number),
    confirmPassword: z
      .string()
      .min(1, msg.password_confirmation_required),
  }).refine((data) => data.password === data.confirmPassword, {
    message: msg.passwords_must_match,
    path: ['confirmPassword'],
  });
};

export const registerSchema = createRegisterSchema();
export type RegisterFormData = z.infer<typeof registerSchema>;

// ==================== INIT APP SCHEMA ====================
export const createInitAppSchema = (messages: Partial<ValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    companyName: z
      .string()
      .min(1, msg.company_name_required)
      .min(2, msg.company_name_min_length)
      .max(100, msg.company_name_max_length),
    userEmail: z
      .string()
      .min(1, msg.email_required)
      .email(msg.email_invalid),
    password: z
      .string()
      .min(1, msg.password_required)
      .min(8, msg.password_min_length.replace('{min}', '8'))
      .regex(/[A-Z]/, msg.password_uppercase)
      .regex(/[a-z]/, msg.password_lowercase)
      .regex(/[0-9]/, msg.password_number),
    confirmPassword: z
      .string()
      .min(1, msg.password_confirmation_required),
  }).refine((data) => data.password === data.confirmPassword, {
    message: msg.passwords_must_match,
    path: ['confirmPassword'],
  });
};

export const initAppSchema = createInitAppSchema();
export type InitAppFormData = z.infer<typeof initAppSchema>;

// ==================== CHANGE PASSWORD SCHEMA ====================
export const createChangePasswordSchema = (messages: Partial<ValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    currentPassword: z
      .string()
      .min(1, msg.current_password_required),
    newPassword: z
      .string()
      .min(1, msg.new_password_required)
      .min(8, msg.password_min_length.replace('{min}', '8'))
      .regex(/[A-Z]/, msg.password_uppercase)
      .regex(/[a-z]/, msg.password_lowercase)
      .regex(/[0-9]/, msg.password_number),
    confirmPassword: z
      .string()
      .min(1, msg.password_confirmation_required),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: msg.passwords_must_match,
    path: ['confirmPassword'],
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: msg.new_password_different,
    path: ['newPassword'],
  });
};

export const changePasswordSchema = createChangePasswordSchema();
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
