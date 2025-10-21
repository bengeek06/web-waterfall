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
    resolver: zodResolver(schema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  });
}
