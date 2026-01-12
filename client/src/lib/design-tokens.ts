/**
 * Design tokens for consistent styling across the application
 * These tokens should be used instead of hardcoded values
 */

/**
 * Spacing scale based on 4px base unit
 * Use these for margins, paddings, and gaps
 */
export const spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 24px */
  xl: 24,
  /** 32px */
  '2xl': 32,
  /** 48px */
  '3xl': 48,
  /** 64px */
  '4xl': 64,
  /** 80px - for hero sections */
  hero: 80
} as const

/**
 * Border radius presets
 */
export const radius = {
  /** No radius */
  none: 0,
  /** 4px - subtle rounding */
  sm: 4,
  /** 6px - standard card radius */
  md: 6,
  /** 8px - prominent cards */
  lg: 8,
  /** 12px - modals and overlays */
  xl: 12,
  /** 16px - large containers */
  '2xl': 16,
  /** 50% - circular elements */
  full: '50%'
} as const

/**
 * Box shadow presets for elevation
 */
export const shadows = {
  /** No shadow */
  none: 'none',
  /** Subtle shadow for slight elevation */
  sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
  /** Standard card shadow */
  md: '0 4px 8px rgba(0, 0, 0, 0.15)',
  /** Elevated card shadow */
  lg: '0 8px 16px rgba(0, 0, 0, 0.2)',
  /** Modal/overlay shadow */
  xl: '0 12px 24px rgba(0, 0, 0, 0.25)',
  /** Floating element shadow */
  '2xl': '0 20px 40px rgba(0, 0, 0, 0.3)'
} as const

/**
 * Generate entity-specific shadow
 */
export const entityShadow = (color: string, intensity: 'sm' | 'md' | 'lg' = 'md') => {
  const values = {
    sm: `0 4px 12px ${color}30`,
    md: `0 8px 20px ${color}40`,
    lg: `0 12px 28px ${color}50`
  }
  return values[intensity]
}

/**
 * Transition presets
 */
export const transitions = {
  /** 150ms - micro interactions */
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  /** 200ms - standard interactions */
  standard: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  /** 300ms - emphasis transitions */
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  /** 500ms - page transitions */
  page: '500ms cubic-bezier(0.4, 0, 0.2, 1)'
} as const

/**
 * Z-index scale for layering
 */
export const zIndex = {
  /** Behind content */
  behind: -1,
  /** Base level */
  base: 0,
  /** Slightly elevated (cards on hover) */
  elevated: 10,
  /** Sticky elements */
  sticky: 100,
  /** Fixed navigation */
  navigation: 200,
  /** Dropdowns and popovers */
  dropdown: 300,
  /** Modals */
  modal: 400,
  /** Notifications */
  notification: 500,
  /** Maximum priority (loading overlays) */
  max: 9999
} as const

/**
 * Icon sizes for consistent iconography
 */
export const iconSizes = {
  /** 12px - inline text icons */
  xs: 12,
  /** 14px - small UI icons */
  sm: 14,
  /** 16px - standard icons */
  md: 16,
  /** 20px - emphasized icons */
  lg: 20,
  /** 24px - large icons */
  xl: 24,
  /** 32px - hero icons */
  '2xl': 32,
  /** 48px - empty state icons */
  '3xl': 48,
  /** 64px - page icons */
  '4xl': 64
} as const

/**
 * Breakpoints for responsive design (matching Tailwind defaults)
 */
export const breakpoints = {
  /** Mobile phones */
  sm: 640,
  /** Tablets */
  md: 768,
  /** Small laptops */
  lg: 1024,
  /** Desktops */
  xl: 1280,
  /** Large screens */
  '2xl': 1536
} as const

/**
 * Grid column configurations for different screen sizes
 */
export const gridColumns = {
  /** Card grids */
  cards: {
    base: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5
  },
  /** Masonry layouts */
  masonry: {
    base: 2,
    md: 3,
    lg: 4,
    xl: 5
  }
} as const

/**
 * Animation easings
 */
export const easings = {
  /** Standard ease for most animations */
  standard: [0.4, 0, 0.2, 1],
  /** Accelerating (entering) */
  accelerate: [0.4, 0, 1, 1],
  /** Decelerating (exiting) */
  decelerate: [0, 0, 0.2, 1],
  /** Bouncy/spring-like */
  spring: [0.175, 0.885, 0.32, 1.275]
} as const

/**
 * Common durations in milliseconds
 */
export const durations = {
  /** 100ms */
  instant: 100,
  /** 150ms */
  fast: 150,
  /** 200ms */
  standard: 200,
  /** 300ms */
  medium: 300,
  /** 500ms */
  slow: 500,
  /** 1000ms */
  verySlow: 1000
} as const
