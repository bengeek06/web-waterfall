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
  
  // Waterfall custom colors - institutional palette
  waterfall: {
    icon: 'var(--waterfall-icon)',
    description: 'var(--waterfall-description)',
    accent: 'var(--waterfall-accent)',
    primary: 'var(--waterfall-primary)',
    primaryDark: 'var(--waterfall-primary-dark)',
    primaryHover: 'var(--waterfall-primary-hover)',
    primaryLight: 'var(--waterfall-primary-light)',
    accentBlue: 'var(--waterfall-accent-blue)',
    textDark: 'var(--waterfall-text-dark)',
    textMedium: 'var(--waterfall-text-medium)',
    textLight: 'var(--waterfall-text-light)',
    bgLight: 'var(--waterfall-bg-light)',
    bgMedium: 'var(--waterfall-bg-medium)',
    borderLight: 'var(--waterfall-border-light)',
    success: 'var(--waterfall-success)',
    companyColor: 'var(--waterfall-company-color)',
    userColor: 'var(--waterfall-user-color)',
    projectColor: 'var(--waterfall-project-color)',
    gradientStart: 'var(--waterfall-gradient-start)',
    gradientMiddle: 'var(--waterfall-gradient-middle)',
    gradientEnd: 'var(--waterfall-gradient-end)',
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
    action: 'text-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    waterfallCompany: 'text-[var(--waterfall-company-color)]',
    waterfallUser: 'text-[var(--waterfall-user-color)]',
    waterfallProject: 'text-[var(--waterfall-project-color)]',
    waterfallPrimaryDark: 'text-[var(--waterfall-primary-dark)]',
  },
  operations: {
    read: 'text-blue-600',
    create: 'text-green-600',
    update: 'text-yellow-600',
    delete: 'text-red-600',
    list: 'text-purple-600',
  },
  bg: {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    muted: 'bg-muted',
    destructive: 'bg-destructive',
    accent: 'bg-accent',
    card: 'bg-card',
    waterfallLight: 'bg-[var(--waterfall-bg-light)]',
    waterfallPrimaryDark: 'bg-[var(--waterfall-primary-dark)]',
    waterfallGradient: 'bg-gradient-to-b from-[var(--waterfall-gradient-start)] via-[var(--waterfall-gradient-middle)] to-[var(--waterfall-gradient-end)]',
  },
  border: {
    default: 'border-border',
    primary: 'border-primary',
    destructive: 'border-destructive',
    waterfallCompany: 'border-l-[var(--waterfall-company-color)]',
    waterfallUser: 'border-l-[var(--waterfall-user-color)]',
    waterfallProject: 'border-l-[var(--waterfall-project-color)]',
  },
} as const;

// Type exports
export type Colors = typeof COLORS;
export type ColorClasses = typeof COLOR_CLASSES;
