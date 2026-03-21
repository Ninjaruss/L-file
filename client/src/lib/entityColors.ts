// client/src/lib/entityColors.ts

/**
 * Single source of truth for entity accent colors.
 * All theme files (mantine-theme.ts, theme.ts) import from here.
 * To change an entity's color, edit only this file.
 */
export const ENTITY_COLORS = {
  gamble:       '#e63946', // Crimson        — danger, blood, high stakes
  arc:          '#ff6b35', // Flame Orange   — epic narrative fire, adventure
  annotation:   '#9333ea', // Bright Purple  — scholarly, analytical
  event:        '#ca8a04', // Ochre          — momentous, historical, marked in time
  guide:        '#16a34a', // Forest Green   — helpful, educational, community
  organization: '#0369a1', // Deep Ocean     — cold, institutional power
  quote:        '#0d9488', // Dark Teal      — voice, dialogue, spoken word
  chapter:      '#38bdf8', // Sky Blue       — crisp, readable, fresh pages
  character:    '#f5a623', // Amber Gold     — warmth, humanity, spotlight
  volume:       '#6d28d9', // Deep Violet    — weighty tomes, gravitas
  media:        '#db2777', // Hot Pink       — creative, expressive, fan art
} as const

export type EntityColorKey = keyof typeof ENTITY_COLORS

/** Safe accessor with fallback to Usogui brand red */
export const getEntityColor = (type: EntityColorKey): string =>
  ENTITY_COLORS[type] ?? '#e11d48'
