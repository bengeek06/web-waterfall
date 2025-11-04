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
 * Typography design tokens
 * Font families and text styles
 */

export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    sans: 'font-sans', // Geist Sans
    mono: 'font-mono', // Geist Mono
  },
  
  // Font sizes
  fontSize: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  },
  
  // Font weights
  fontWeight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
  
  // Text alignment
  textAlign: {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  },
} as const;

// Type exports
export type Typography = typeof TYPOGRAPHY;
