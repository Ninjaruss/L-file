import type { MantineTheme } from '@mantine/core'

/**
 * Returns consistent Mantine styles for required form inputs.
 * Label uses the entity accent color at full weight.
 */
export function getInputStyles(theme: MantineTheme, accentColor: string) {
  return {
    input: {
      backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
      color: theme.colors.gray?.[0] ?? '#fff',
      borderColor: 'rgba(255,255,255,0.06)'
    },
    label: {
      color: accentColor,
      fontWeight: 600
    },
    dropdown: {
      backgroundColor: theme.colors.dark?.[7] ?? '#1a1a1a',
      borderColor: 'rgba(255,255,255,0.1)'
    }
  }
}

/**
 * Returns consistent Mantine styles for multi-select / tags inputs with accent pills.
 * Extends getInputStyles with pill styling.
 */
export function getMultiSelectStyles(theme: MantineTheme, accentColor: string) {
  return {
    ...getInputStyles(theme, accentColor),
    pill: {
      backgroundColor: `${accentColor}22`,
      color: accentColor,
      border: `1px solid ${accentColor}45`
    }
  }
}

/**
 * Returns consistent Mantine styles for optional form inputs.
 * Label is dimmed instead of accent-colored.
 */
export function getDimmedInputStyles(theme: MantineTheme) {
  return {
    input: {
      backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
      color: theme.colors.gray?.[0] ?? '#fff',
      borderColor: 'rgba(255,255,255,0.06)'
    },
    label: {
      color: 'rgba(255,255,255,0.55)',
      fontWeight: 500
    },
    dropdown: {
      backgroundColor: theme.colors.dark?.[7] ?? '#1a1a1a',
      borderColor: 'rgba(255,255,255,0.1)'
    }
  }
}
