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
