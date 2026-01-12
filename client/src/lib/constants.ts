// Usogui manga constants
// Total number of chapters in the manga series
export const MAX_CHAPTER = 539

// Expected number of volumes in the manga series (for data loading heuristics)
export const EXPECTED_VOLUME_COUNT = 49

// Layout constants
export const LAYOUT = {
  // Navigation
  NAVBAR_HEIGHT: 64,
  MOBILE_MENU_Z_INDEX: 1100,
  SEARCH_DROPDOWN_Z_INDEX: 1400,

  // Images
  CHARACTER_IMAGE_WIDTH: 200,
  THUMBNAIL_SIZE_SM: 80,
  THUMBNAIL_SIZE_MD: 120,
  THUMBNAIL_SIZE_LG: 160,

  // Cards
  CARD_BORDER_RADIUS: 12,
  CARD_PADDING: 24,

  // Spacing
  SECTION_GAP: 32,
  CARD_GAP: 16,

  // Animations
  TRANSITION_SHORT: 150,
  TRANSITION_STANDARD: 200,
  TRANSITION_LONG: 300,

  // Breakpoints (matching Mantine theme)
  BREAKPOINT_SM: 600,
  BREAKPOINT_MD: 900,
  BREAKPOINT_LG: 1200,
  BREAKPOINT_XL: 1536,
} as const

// Cache TTL values (in milliseconds)
export const CACHE_TTL = {
  MEDIA: 5 * 60 * 1000, // 5 minutes
  SHORT: 1 * 60 * 1000, // 1 minute
  LONG: 15 * 60 * 1000, // 15 minutes
} as const

// Retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  DELAYS: [1000, 2000, 4000], // Progressive backoff
} as const
