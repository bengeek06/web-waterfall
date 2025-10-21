/**
 * Spacing design tokens
 * Consistent spacing values across the application
 */

export const SPACING = {
  // Component spacing
  component: {
    xs: 'space-y-2',
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  },
  
  // Padding
  padding: {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  },
  
  // Margin
  margin: {
    xs: 'm-2',
    sm: 'm-3',
    md: 'm-4',
    lg: 'm-6',
    xl: 'm-8',
  },
  
  // Gap
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6',
  },
} as const;

// Type exports
export type Spacing = typeof SPACING;
