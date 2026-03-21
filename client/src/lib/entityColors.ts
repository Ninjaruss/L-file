// client/src/lib/entityColors.ts

/**
 * Single source of truth for entity accent colors.
 * All theme files (mantine-theme.ts, theme.ts) import from here.
 * To change an entity's color, edit only this file.
 */
export const ENTITY_COLORS = {
  gamble:       '#ff3333', // Pure Red      (0°)
  arc:          '#ff7a00', // Vivid Orange  (29°)
  annotation:   '#ffd700', // Gold          (51°)
  event:        '#99dd00', // Chartreuse    (88°)
  guide:        '#22bb55', // Emerald       (141°)
  organization: '#00ccbb', // Teal          (175°)
  quote:        '#00ccee', // Cyan          (191°)
  chapter:      '#2299ff', // Royal Blue    (214°)
  character:    '#8877ff', // Indigo        (245°)
  volume:       '#dd44ff', // Violet        (288°)
  media:        '#ff3399', // Hot Pink      (330°)
} as const

export type EntityColorKey = keyof typeof ENTITY_COLORS

/** Safe accessor with fallback to Usogui brand red */
export const getEntityColor = (type: EntityColorKey): string =>
  ENTITY_COLORS[type] ?? '#e11d48'
