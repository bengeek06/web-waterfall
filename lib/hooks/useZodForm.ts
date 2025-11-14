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
import { z } from 'zod';

type UseZodFormProps<T extends FieldValues> = UseFormProps<T> & {
  schema: z.ZodType<T>;
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
    resolver: zodResolver(schema as unknown as z.ZodTypeAny),
  });
}
