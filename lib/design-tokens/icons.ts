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
 * Icon size design tokens
 * Consistent icon sizing across the application
 */

export const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
} as const;

/**
 * Icon colors from design system
 * Maps to CSS variables defined in globals.css
 */
export const ICON_COLORS = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  muted: 'text-muted-foreground',
  destructive: 'text-destructive',
  accent: 'text-accent',
  waterfall: 'text-waterfall-icon',
} as const;

// Type exports
export type IconSize = keyof typeof ICON_SIZES;
export type IconColor = keyof typeof ICON_COLORS;
