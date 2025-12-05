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
 * Custom hook for form handling with React Hook Form and Zod
 * Provides type-safe form validation with minimal boilerplate
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import type { ZodType } from 'zod';

type UseZodFormProps<T extends FieldValues> = Omit<UseFormProps<T>, 'resolver'> & {
  schema: ZodType<T>;
};

/**
 * Custom hook that combines React Hook Form with Zod validation
 * 
 * @example
 * ```tsx
 * const form = useZodForm({
 *   schema: loginSchema,
 *   defaultValues: { email: '', password: '' }
 * });
 * 
 * const onSubmit = form.handleSubmit((data) => {
 *   // data is fully typed!
 *   console.log(data.email, data.password);
 * });
 * ```
 */
export function useZodForm<T extends FieldValues>({
  schema,
  ...formConfig
}: UseZodFormProps<T>): UseFormReturn<T> {
  return useForm<T>({
    ...formConfig,
    // Type assertion needed due to @hookform/resolvers zodResolver type incompatibility with Zod v3
    // The resolver works correctly at runtime, type mismatch is a known issue
    resolver: zodResolver(schema as any),
  });
}
