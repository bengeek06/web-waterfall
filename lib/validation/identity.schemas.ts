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
 * Zod validation schemas for Identity service forms
 * Provides type-safe validation with automatic TypeScript inference
 */

import { z } from 'zod';

// ==================== VALIDATION MESSAGES TYPE ====================
export type IdentityValidationMessages = {
  email_required: string;
  email_invalid: string;
  email_max_length: string;
  password_required: string;
  password_min_length: string;
  password_uppercase: string;
  password_lowercase: string;
  password_number: string;
  first_name_max_length: string;
  last_name_max_length: string;
  phone_max_length: string;
  phone_invalid: string;
  avatar_file_id_invalid: string;
  language_invalid: string;
  uuid_invalid: string;
  name_required: string;
  name_min_length: string;
  name_max_length: string;
  description_max_length: string;
  address_max_length: string;
  website_invalid: string;
  company_name_required: string;
  company_name_min_length: string;
  company_name_max_length: string;
  unit_name_required: string;
  parent_id_invalid: string;
  title_required: string;
  title_min_length: string;
  title_max_length: string;
  department_id_invalid: string;
  customer_name_required: string;
  contact_person_max_length: string;
  subcontractor_name_required: string;
};

const defaultMessages: IdentityValidationMessages = {
  email_required: 'Email is required',
  email_invalid: 'Invalid email',
  email_max_length: 'Email cannot exceed {max} characters',
  password_required: 'Password is required',
  password_min_length: 'Password must be at least {min} characters',
  password_uppercase: 'Password must contain at least one uppercase letter',
  password_lowercase: 'Password must contain at least one lowercase letter',
  password_number: 'Password must contain at least one number',
  first_name_max_length: 'First name cannot exceed {max} characters',
  last_name_max_length: 'Last name cannot exceed {max} characters',
  phone_max_length: 'Phone number cannot exceed {max} characters',
  phone_invalid: 'Invalid phone number',
  avatar_file_id_invalid: 'Invalid avatar file ID',
  language_invalid: 'Invalid language (en or fr)',
  uuid_invalid: 'Invalid UUID',
  name_required: 'Name is required',
  name_min_length: 'Name must be at least {min} characters',
  name_max_length: 'Name cannot exceed {max} characters',
  description_max_length: 'Description cannot exceed {max} characters',
  address_max_length: 'Address cannot exceed {max} characters',
  website_invalid: 'Invalid URL',
  company_name_required: 'Company name is required',
  company_name_min_length: 'Company name must be at least {min} characters',
  company_name_max_length: 'Company name cannot exceed {max} characters',
  unit_name_required: 'Unit name is required',
  parent_id_invalid: 'Invalid parent ID',
  title_required: 'Title is required',
  title_min_length: 'Title must be at least {min} characters',
  title_max_length: 'Title cannot exceed {max} characters',
  department_id_invalid: 'Invalid department ID',
  customer_name_required: 'Customer name is required',
  contact_person_max_length: 'Contact person cannot exceed {max} characters',
  subcontractor_name_required: 'Subcontractor name is required',
};

// ==================== USER SCHEMA (Create) ====================
export const createCreateUserSchema = (messages: Partial<IdentityValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    email: z
      .string()
      .min(1, msg.email_required)
      .email(msg.email_invalid)
      .max(100, msg.email_max_length.replace('{max}', '100')),
    password: z
      .string()
      .min(1, msg.password_required)
      .min(8, msg.password_min_length.replace('{min}', '8'))
      .regex(/[A-Z]/, msg.password_uppercase)
      .regex(/[a-z]/, msg.password_lowercase)
      .regex(/\d/, msg.password_number),
    first_name: z
      .string()
      .max(50, msg.first_name_max_length.replace('{max}', '50'))
      .optional()
      .or(z.literal('')),
    last_name: z
      .string()
      .max(50, msg.last_name_max_length.replace('{max}', '50'))
      .optional()
      .or(z.literal('')),
    phone_number: z
      .string()
      .max(50, msg.phone_max_length.replace('{max}', '50'))
      .optional()
      .or(z.literal('')),
    has_avatar: z.boolean().optional().default(false),
    avatar_file_id: z
      .string()
      .uuid(msg.avatar_file_id_invalid)
      .optional()
      .nullable(),
    language: z
      .enum(['en', 'fr'], { message: msg.language_invalid })
      .optional()
      .default('fr'),
    is_active: z.boolean().optional().default(true),
    is_verified: z.boolean().optional().default(false),
  });
};

export const createUserSchema = createCreateUserSchema();
export type CreateUserFormData = z.infer<typeof createUserSchema>;

// ==================== USER SCHEMA (Form - supports both create and edit) ====================
// Password is optional - validated manually in create mode
export const createUserFormSchema = (messages: Partial<IdentityValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    email: z
      .string()
      .min(1, msg.email_required)
      .email(msg.email_invalid)
      .max(100, msg.email_max_length.replace('{max}', '100')),
    password: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((val) => !val || val.length >= 8, msg.password_min_length.replace('{min}', '8'))
      .refine((val) => !val || /[A-Z]/.test(val), msg.password_uppercase)
      .refine((val) => !val || /[a-z]/.test(val), msg.password_lowercase)
      .refine((val) => !val || /\d/.test(val), msg.password_number),
    first_name: z
      .string()
      .max(50, msg.first_name_max_length.replace('{max}', '50'))
      .optional()
      .or(z.literal('')),
    last_name: z
      .string()
      .max(50, msg.last_name_max_length.replace('{max}', '50'))
      .optional()
      .or(z.literal('')),
    phone_number: z
      .string()
      .max(50, msg.phone_max_length.replace('{max}', '50'))
      .optional()
      .or(z.literal('')),
    has_avatar: z.boolean().optional().default(false),
    avatar_file_id: z
      .string()
      .uuid(msg.avatar_file_id_invalid)
      .optional()
      .nullable(),
    language: z
      .enum(['en', 'fr'], { message: msg.language_invalid })
      .optional()
      .default('fr'),
    is_active: z.boolean().optional().default(true),
    is_verified: z.boolean().optional().default(false),
  });
};

export const userFormSchema = createUserFormSchema();
export type UserFormData = z.infer<typeof userFormSchema>;

// ==================== USER SCHEMA (Update) ====================
export const createUpdateUserSchema = (messages: Partial<IdentityValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    email: z
      .string()
      .email(msg.email_invalid)
      .max(100, msg.email_max_length.replace('{max}', '100'))
      .optional()
      .or(z.literal('')),
    first_name: z
      .string()
      .max(50, msg.first_name_max_length.replace('{max}', '50'))
      .optional()
      .or(z.literal('')),
    last_name: z
      .string()
      .max(50, msg.last_name_max_length.replace('{max}', '50'))
      .optional()
      .or(z.literal('')),
    phone_number: z
      .string()
      .max(50, msg.phone_max_length.replace('{max}', '50'))
      .optional()
      .or(z.literal('')),
    has_avatar: z.boolean().optional(),
    avatar_file_id: z
      .string()
      .uuid(msg.avatar_file_id_invalid)
      .optional()
      .nullable(),
    language: z
      .enum(['en', 'fr'], { message: msg.language_invalid })
      .optional(),
    is_active: z.boolean().optional(),
    is_verified: z.boolean().optional(),
  });
};

export const updateUserSchema = createUpdateUserSchema();
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

// ==================== LEGACY SCHEMAS (keep for backward compatibility) ====================
export const createUserSchema_Legacy = (messages: Partial<IdentityValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    name: z
      .string()
      .min(1, msg.name_required)
      .min(2, msg.name_min_length.replace('{min}', '2'))
      .max(100, msg.name_max_length.replace('{max}', '100')),
    email: z
      .string()
      .min(1, msg.email_required)
      .email(msg.email_invalid),
    phone: z
      .string()
      .regex(/^[\d\s+()-]*$/, msg.phone_invalid)
      .optional()
      .or(z.literal('')),
    position: z
      .string()
      .max(100, msg.name_max_length.replace('{max}', '100'))
      .optional()
      .or(z.literal('')),
  });
};

export const userSchema = createUserSchema_Legacy();
export type LegacyUserFormData = z.infer<typeof userSchema>;

// ==================== COMPANY SCHEMA ====================
export const createCompanySchema = (messages: Partial<IdentityValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    name: z
      .string()
      .min(1, msg.company_name_required)
      .min(2, msg.company_name_min_length.replace('{min}', '2'))
      .max(200, msg.company_name_max_length.replace('{max}', '200')),
    description: z
      .string()
      .max(1000, msg.description_max_length.replace('{max}', '1000'))
      .optional()
      .or(z.literal('')),
    address: z
      .string()
      .max(500, msg.address_max_length.replace('{max}', '500'))
      .optional()
      .or(z.literal('')),
    phone: z
      .string()
      .regex(/^[\d\s+()-]*$/, msg.phone_invalid)
      .optional()
      .or(z.literal('')),
    email: z
      .string()
      .email(msg.email_invalid)
      .optional()
      .or(z.literal('')),
    website: z
      .string()
      .url(msg.website_invalid)
      .optional()
      .or(z.literal('')),
  });
};

export const companySchema = createCompanySchema();
export type CompanyFormData = z.infer<typeof companySchema>;

// ==================== ORGANIZATION UNIT SCHEMA ====================
export const createOrganizationUnitSchema = (messages: Partial<IdentityValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    name: z
      .string()
      .min(1, msg.unit_name_required)
      .min(2, msg.name_min_length.replace('{min}', '2'))
      .max(100, msg.name_max_length.replace('{max}', '100')),
    description: z
      .string()
      .max(500, msg.description_max_length.replace('{max}', '500'))
      .optional()
      .or(z.literal('')),
    parentId: z
      .string()
      .uuid(msg.parent_id_invalid)
      .optional()
      .or(z.number().int().positive())
      .or(z.literal('')),
  });
};

export const organizationUnitSchema = createOrganizationUnitSchema();
export type OrganizationUnitFormData = z.infer<typeof organizationUnitSchema>;

// ==================== POSITION SCHEMA ====================
export const createPositionSchema = (messages: Partial<IdentityValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    title: z
      .string()
      .min(1, msg.title_required)
      .min(2, msg.title_min_length.replace('{min}', '2'))
      .max(100, msg.title_max_length.replace('{max}', '100')),
    description: z
      .string()
      .max(1000, msg.description_max_length.replace('{max}', '1000'))
      .optional()
      .or(z.literal('')),
    departmentId: z
      .string()
      .uuid(msg.department_id_invalid)
      .optional()
      .or(z.number().int().positive())
      .or(z.literal('')),
  });
};

export const positionSchema = createPositionSchema();
export type PositionFormData = z.infer<typeof positionSchema>;

// ==================== CUSTOMER SCHEMA ====================
export const createCustomerSchema = (messages: Partial<IdentityValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    name: z
      .string()
      .min(1, msg.customer_name_required)
      .min(2, msg.name_min_length.replace('{min}', '2'))
      .max(200, msg.name_max_length.replace('{max}', '200')),
    email: z
      .string()
      .email(msg.email_invalid)
      .optional()
      .or(z.literal('')),
    contact_person: z
      .string()
      .max(100, msg.contact_person_max_length.replace('{max}', '100'))
      .optional()
      .or(z.literal('')),
    phone_number: z
      .string()
      .regex(/^[\d\s+()-]*$/, msg.phone_invalid)
      .optional()
      .or(z.literal('')),
    address: z
      .string()
      .max(500, msg.address_max_length.replace('{max}', '500'))
      .optional()
      .or(z.literal('')),
  });
};

export const customerSchema = createCustomerSchema();
export type CustomerFormData = z.infer<typeof customerSchema>;

// ==================== SUBCONTRACTOR SCHEMA ====================
export const createSubcontractorSchema = (messages: Partial<IdentityValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    name: z
      .string()
      .min(1, msg.subcontractor_name_required)
      .min(2, msg.name_min_length.replace('{min}', '2'))
      .max(200, msg.name_max_length.replace('{max}', '200')),
    email: z
      .string()
      .email(msg.email_invalid)
      .optional()
      .or(z.literal('')),
    contact_person: z
      .string()
      .max(100, msg.contact_person_max_length.replace('{max}', '100'))
      .optional()
      .or(z.literal('')),
    phone_number: z
      .string()
      .regex(/^[\d\s+()-]*$/, msg.phone_invalid)
      .optional()
      .or(z.literal('')),
    address: z
      .string()
      .max(500, msg.address_max_length.replace('{max}', '500'))
      .optional()
      .or(z.literal('')),
    description: z
      .string()
      .max(200, msg.description_max_length.replace('{max}', '200'))
      .optional()
      .or(z.literal('')),
  });
};

export const subcontractorSchema = createSubcontractorSchema();
export type SubcontractorFormData = z.infer<typeof subcontractorSchema>;

// ==================== PROFILE UPDATE SCHEMA ====================
export const createProfileUpdateSchema = (messages: Partial<IdentityValidationMessages> = {}) => {
  const msg = { ...defaultMessages, ...messages };
  return z.object({
    name: z
      .string()
      .min(1, msg.name_required)
      .min(2, msg.name_min_length.replace('{min}', '2'))
      .max(100, msg.name_max_length.replace('{max}', '100')),
    email: z
      .string()
      .min(1, msg.email_required)
      .email(msg.email_invalid),
    phone: z
      .string()
      .regex(/^[\d\s+()-]*$/, msg.phone_invalid)
      .optional()
      .or(z.literal('')),
    has_avatar: z.boolean().optional(),
    avatar_file_id: z
      .string()
      .uuid(msg.avatar_file_id_invalid)
      .optional()
      .nullable(),
  });
};

export const profileUpdateSchema = createProfileUpdateSchema();
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
