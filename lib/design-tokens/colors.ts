/**
 * Color design tokens
 * All colors reference CSS variables from globals.css
 */

export const COLORS = {
  // Brand colors
  brand: {
    primary: 'var(--primary)',
    primaryForeground: 'var(--primary-foreground)',
    secondary: 'var(--secondary)',
    secondaryForeground: 'var(--secondary-foreground)',
    accent: 'var(--accent)',
    accentForeground: 'var(--accent-foreground)',
  },
  
  // Semantic colors
  semantic: {
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    muted: 'var(--muted)',
    mutedForeground: 'var(--muted-foreground)',
    destructive: 'var(--destructive)',
    destructiveForeground: 'var(--destructive-foreground)',
  },
  
  // UI colors
  ui: {
    card: 'var(--card)',
    cardForeground: 'var(--card-foreground)',
    popover: 'var(--popover)',
    popoverForeground: 'var(--popover-foreground)',
    border: 'var(--border)',
    input: 'var(--input)',
    ring: 'var(--ring)',
  },
  
  // Status colors
  status: {
    success: 'var(--chart-2)',
    warning: 'var(--chart-4)',
    error: 'var(--destructive)',
    info: 'var(--chart-3)',
  },
  
  // Chart colors
  chart: {
    1: 'var(--chart-1)',
    2: 'var(--chart-2)',
    3: 'var(--chart-3)',
    4: 'var(--chart-4)',
    5: 'var(--chart-5)',
  },
  
  // Waterfall custom colors
  waterfall: {
    icon: 'var(--waterfall-icon)',
    description: 'var(--waterfall-description)',
    accent: 'var(--waterfall-accent)',
  },
} as const;

/**
 * Tailwind color classes
 * For use with className prop
 */
export const COLOR_CLASSES = {
  text: {
    primary: 'text-primary',
    secondary: 'text-secondary',
    muted: 'text-muted-foreground',
    destructive: 'text-destructive',
    accent: 'text-accent',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
  },
  bg: {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    muted: 'bg-muted',
    destructive: 'bg-destructive',
    accent: 'bg-accent',
    card: 'bg-card',
  },
  border: {
    default: 'border-border',
    primary: 'border-primary',
    destructive: 'border-destructive',
  },
} as const;

// Type exports
export type Colors = typeof COLORS;
export type ColorClasses = typeof COLOR_CLASSES;
