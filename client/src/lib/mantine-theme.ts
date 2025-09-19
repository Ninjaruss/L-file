import { MantineThemeOverride, createTheme, rem, MantineTheme } from '@mantine/core'

// Custom Usogui colors for Mantine (as MantineColorsTuple)
const usogui = {
  red: [
    '#fef2f2',
    '#fecaca',
    '#fca5a5',
    '#f87171',
    '#ef4444',
    '#e11d48', // Main Usogui red
    '#dc2626',
    '#b91c1c',
    '#991b1b',
    '#7f1d1d'
  ] as const,
  purple: [
    '#faf5ff',
    '#e9d5ff',
    '#d8b4fe',
    '#c084fc',
    '#a855f7',
    '#7c3aed', // Main Usogui purple
    '#6d28d9',
    '#5b21b6',
    '#4c1d95',
    '#3c1361'
  ] as const,
  black: [
    '#0a0a0a', // Usogui black
    '#171717',
    '#262626',
    '#404040',
    '#525252',
    '#737373',
    '#a3a3a3',
    '#d4d4d4',
    '#e5e5e5',
    '#f5f5f5'
  ] as const,
  // Entity-specific colors
  gamble: [
    '#fef2f2',
    '#fee2e2',
    '#fecaca',
    '#fca5a5',
    '#f87171',
    '#d32f2f', // Gamble red
    '#b91c1c',
    '#991b1b',
    '#7f1d1d',
    '#450a0a'
  ] as const,
  character: [
    '#eff6ff',
    '#dbeafe',
    '#bfdbfe',
    '#93c5fd',
    '#60a5fa',
    '#1976d2', // Character blue
    '#1e40af',
    '#1e3a8a',
    '#1e3a8a',
    '#172554'
  ] as const,
  arc: [
    '#fdf2f8',
    '#fce7f3',
    '#fbcfe8',
    '#f9a8d4',
    '#f472b6',
    '#dc004e', // Arc pink
    '#be185d',
    '#9d174d',
    '#831843',
    '#500724'
  ] as const,
  event: [
    '#fff7ed',
    '#ffedd5',
    '#fed7aa',
    '#fdba74',
    '#fb923c',
    '#f57c00', // Event orange
    '#ea580c',
    '#c2410c',
    '#9a3412',
    '#7c2d12'
  ] as const,
  guide: [
    '#f0fdf4',
    '#dcfce7',
    '#bbf7d0',
    '#86efac',
    '#4ade80',
    '#388e3c', // Guide green
    '#16a34a',
    '#15803d',
    '#166534',
    '#14532d'
  ] as const,
  media: [
    '#faf5ff',
    '#f3e8ff',
    '#e9d5ff',
    '#d8b4fe',
    '#c084fc',
    '#7b1fa2', // Media purple
    '#7c3aed',
    '#6d28d9',
    '#5b21b6',
    '#4c1d95'
  ] as const,
  quote: [
    '#f0fdfa',
    '#ccfbf1',
    '#99f6e4',
    '#5eead4',
    '#2dd4bf',
    '#00796b', // Quote teal
    '#0d9488',
    '#0f766e',
    '#115e59',
    '#134e4a'
  ] as const
}

export const mantineTheme: MantineThemeOverride = {
  colors: usogui,
  primaryColor: 'red',
  primaryShade: { light: 5, dark: 5 },

  fontFamily: '\"Noto Sans\", system-ui, sans-serif',
  fontFamilyMonospace: 'Monaco, Courier, monospace',
  headings: {
    fontFamily: '\"OPTI Goudy Text\", serif',
    fontWeight: '400',
    sizes: {
      h1: { fontSize: rem(32), lineHeight: '1.2' },
      h2: { fontSize: rem(28), lineHeight: '1.25' },
      h3: { fontSize: rem(24), lineHeight: '1.3' },
      h4: { fontSize: rem(20), lineHeight: '1.35' },
      h5: { fontSize: rem(18), lineHeight: '1.4' },
      h6: { fontSize: rem(16), lineHeight: '1.5' }
    }
  },

  spacing: {
    xs: rem(4),
    sm: rem(8),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
    xxl: rem(48)
  },

  radius: {
    xs: rem(2),
    sm: rem(4),
    md: rem(6),
    lg: rem(8),
    xl: rem(12)
  },

  breakpoints: {
    xs: rem(0),
    sm: rem(600),
    md: rem(900),
    lg: rem(1200),
    xl: rem(1536)
  },

  defaultRadius: 'md',
  defaultTransition: { duration: 200, timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',

  globalStyles: (theme) => ({
    '*, *::before, *::after': {
      boxSizing: 'border-box'
    },
    body: {
      margin: 0,
      fontFamily: theme.fontFamily,
      backgroundColor: theme.other.usogui.black,
      color: theme.white,
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale'
    },
    a: {
      color: theme.colors.red[5],
      textDecoration: 'none',
      transition: 'color 150ms ease'
    },
    'a:hover': {
      color: theme.colors.red[4]
    }
  }),

  shadows: {
    xs: '0px 1px 2px rgba(0, 0, 0, 0.24)',
    sm: '0px 3px 6px rgba(0, 0, 0, 0.28)',
    md: '0 10px 15px -3px rgba(225, 29, 72, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    lg: '0 20px 25px -5px rgba(225, 29, 72, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
    xl: '0 25px 50px -12px rgba(225, 29, 72, 0.45)'
  },

  components: {
    Card: {
      defaultProps: {
        shadow: 'lg',
        radius: 'md',
        withBorder: true
      },
      styles: (theme) => ({
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid rgba(225, 29, 72, 0.2)`,
          backdropFilter: 'blur(10px)',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: theme.colors.red[5],
            boxShadow: theme.shadows.lg,
            transform: 'translateY(-2px)'
          }
        }
      })
    },

    Button: {
      defaultProps: {
        radius: 'sm'
      },
      styles: (theme) => ({
        root: {
          fontWeight: 600,
          fontFamily: theme.fontFamily,
          textTransform: 'none',
          transitionTimingFunction: theme.transitionTimingFunction
        }
      })
    },

    Container: {
      styles: () => ({
        root: {
          backgroundColor: 'transparent'
        }
      })
    },

    Modal: {
      styles: (theme) => ({
        content: {
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          border: `1px solid rgba(225, 29, 72, 0.3)`,
          backdropFilter: 'blur(10px)'
        },
        header: {
          backgroundColor: 'transparent',
          borderBottom: `1px solid rgba(225, 29, 72, 0.2)`
        }
      })
    },

    Menu: {
      styles: (theme) => ({
        dropdown: {
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          border: `1px solid rgba(225, 29, 72, 0.3)`,
          backdropFilter: 'blur(10px)',
          padding: theme.spacing.xs
        },
        item: {
          color: theme.white,
          padding: `${theme.spacing.xs} ${rem(10)}`,
          margin: `${rem(2)} 0`,
          borderRadius: theme.radius.sm,
          transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover, &:focusVisible': {
            backgroundColor: 'rgba(225, 29, 72, 0.14)',
            boxShadow: `inset 0 0 0 1px rgba(225, 29, 72, 0.35)`
          }
        }
      })
    },

    TextInput: {
      styles: (theme) => ({
        input: {
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          border: `1px solid rgba(225, 29, 72, 0.3)`,
          color: theme.white,
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          '&:focus': {
            borderColor: theme.colors.red[5],
            boxShadow: `0 0 0 ${rem(2)} rgba(225, 29, 72, 0.25)`
          }
        },
        label: {
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: 500
        }
      })
    },

    Textarea: {
      styles: (theme) => ({
        input: {
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          border: `1px solid rgba(225, 29, 72, 0.3)`,
          color: theme.white,
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          '&:focus': {
            borderColor: theme.colors.red[5],
            boxShadow: `0 0 0 ${rem(2)} rgba(225, 29, 72, 0.25)`
          }
        },
        label: {
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: 500
        }
      })
    },

    Select: {
      styles: (theme) => ({
        input: {
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          border: `1px solid rgba(225, 29, 72, 0.3)`,
          color: theme.white,
          '&:focus': {
            borderColor: theme.colors.red[5],
            boxShadow: `0 0 0 ${rem(2)} rgba(225, 29, 72, 0.25)`
          }
        },
        label: {
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: 500
        }
      })
    },

    Tabs: {
      styles: (theme) => ({
        tab: {
          color: 'rgba(255, 255, 255, 0.7)',
          transition: 'color 150ms ease, border-color 150ms ease',
          '&[data-active]': {
            color: theme.colors.red[5],
            borderColor: theme.colors.red[5]
          },
          '&:hover': {
            color: theme.colors.red[4]
          }
        }
      })
    },

    Badge: {
      styles: () => ({
        root: {
          textTransform: 'none',
          fontWeight: 500
        }
      })
    },

    Alert: {
      styles: () => ({
        root: {
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          border: `1px solid rgba(225, 29, 72, 0.2)`
        }
      })
    },

    Paper: {
      styles: () => ({
        root: {
          backgroundColor: 'rgba(10, 10, 10, 0.6)',
          border: `1px solid rgba(225, 29, 72, 0.1)`
        }
      })
    }
  },

  // Enhanced theme options with better organization
  other: {
    usogui: {
      red: '#e11d48',
      purple: '#7c3aed',
      black: '#0a0a0a',
      white: '#ffffff',
      gamble: '#d32f2f',
      character: '#1976d2',
      arc: '#dc004e',
      event: '#f57c00',
      guide: '#388e3c',
      media: '#7b1fa2',
      quote: '#00796b'
    },
    transitions: {
      durationShortest: 150,
      durationShort: 200,
      durationStandard: 250,
      durationEntering: 200,
      durationLeavingScreen: 150,
      easingStandard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easingDecelerate: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easingAccelerate: 'cubic-bezier(0.4, 0, 1, 1)',
      easingSharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
    },
    layout: {
      headerHeight: 64,
      sidebarWidth: 280,
      contentMaxWidth: 1200,
      cardPadding: 24
    },
    effects: {
      backdropBlur: 'blur(10px)',
      cardHoverTransform: 'translateY(-2px)',
      borderRadiusLarge: '12px'
    }
  }
}

export const theme = createTheme(mantineTheme)

const entityAccentFallback = '#e11d48'

export type EntityAccentKey =
  | 'character'
  | 'organization'
  | 'arc'
  | 'event'
  | 'guide'
  | 'media'
  | 'quote'
  | 'gamble'

export const getEntityAccent = (type: EntityAccentKey, theme?: MantineTheme): string => {
  const palette = theme?.other?.usogui ?? mantineTheme.other?.usogui
  if (!palette) {
    return entityAccentFallback
  }

  switch (type) {
    case 'character':
      return palette.character
    case 'organization':
      return palette.purple
    case 'arc':
      return palette.arc
    case 'event':
      return palette.event
    case 'guide':
      return palette.guide
    case 'media':
      return palette.media
    case 'quote':
      return palette.quote
    case 'gamble':
      return palette.gamble
    default:
      return entityAccentFallback
  }
}
// Theme utility functions for consistent color usage
export const getThemeColor = (theme: MantineTheme, colorKey: string, shade: number = 5): string => {
  if (theme.colors[colorKey]) {
    return theme.colors[colorKey][shade]
  }
  return theme.other?.usogui?.[colorKey] || theme.colors.red[shade]
}

export const getEntityThemeColor = (theme: MantineTheme, entityType: EntityAccentKey): string => {
  const entityColors = theme.other?.usogui
  if (!entityColors) return theme.colors.red[5]
  
  switch (entityType) {
    case 'gamble': return entityColors.gamble
    case 'character': return entityColors.character
    case 'arc': return entityColors.arc
    case 'event': return entityColors.event
    case 'guide': return entityColors.guide
    case 'media': return entityColors.media
    case 'quote': return entityColors.quote
    default: return entityColors.red
  }
}

export const getAlphaColor = (color: string, alpha: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Enhanced color palette for better accessibility and consistency
export const semanticColors = {
  success: '#388e3c',
  warning: '#f57c00',
  error: '#d32f2f',
  info: '#1976d2',
  neutral: '#6b7280'
} as const

// Consistent spacing and sizing utilities
export const spacing = {
  xs: rem(4),
  sm: rem(8),
  md: rem(16),
  lg: rem(24),
  xl: rem(32),
  xxl: rem(48),
  xxxl: rem(64)
} as const

export const fontSize = {
  xs: rem(12),
  sm: rem(14),
  md: rem(16),
  lg: rem(18),
  xl: rem(20),
  xxl: rem(24)
} as const

// Consistent text color utilities following Mantine best practices
export const textColors = {
  // Primary text colors
  primary: '#ffffff',
  secondary: 'rgba(255, 255, 255, 0.8)',
  tertiary: 'rgba(255, 255, 255, 0.6)',
  disabled: 'rgba(255, 255, 255, 0.4)',

  // Semantic text colors with good contrast
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',

  // Entity-specific text colors (optimized for readability)
  gamble: '#ef5350',     // Slightly lighter red for better contrast
  character: '#42a5f5',  // Lighter blue for better readability
  arc: '#e91e63',        // Pink that stands out well
  event: '#ff9800',      // Orange with good contrast
  guide: '#66bb6a',      // Green with excellent readability
  media: '#ab47bc',      // Purple with good contrast
  quote: '#26a69a'       // Teal with excellent contrast
} as const

// Header color utilities for consistent styling
export const headerColors = {
  h1: '#ffffff',                    // Main page titles - pure white
  h2: 'rgba(255, 255, 255, 0.95)', // Section headers - near white
  h3: 'rgba(255, 255, 255, 0.9)',  // Subsection headers
  h4: 'rgba(255, 255, 255, 0.85)', // Card titles
  h5: 'rgba(255, 255, 255, 0.8)',  // Small headers
  h6: 'rgba(255, 255, 255, 0.75)'  // Minimal headers
} as const

// Mantine-compatible color prop values
export const mantineTextColors = {
  primary: undefined,        // Uses theme default (white)
  secondary: 'dimmed',       // Mantine's dimmed color
  accent: 'red.5',          // Theme red
  success: 'green.6',       // Good contrast green
  warning: 'orange.6',      // Good contrast orange
  error: 'red.6',           // Error red
  info: 'blue.6'            // Info blue
} as const
