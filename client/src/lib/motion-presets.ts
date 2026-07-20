/**
 * Shared Motion/Framer animation presets
 * Replaces inline initial/animate/transition patterns duplicated across pages
 * All animations respect prefers-reduced-motion via the useReducedMotion hook
 */

import type { Variants, Transition } from 'motion/react'
import { easings, durations } from './design-tokens'

// Standard easing as CSS string for non-motion contexts
export const standardEasing = `cubic-bezier(${easings.standard.join(', ')})`

/**
 * Page-level entrance animation
 */
export const pageEnter = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: durations.slow / 1000, ease: easings.standard }
}

/**
 * Card entrance with stagger support
 */
export const cardEnter = (index: number, staggerDelay = 0.04) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: durations.medium / 1000,
    delay: index * staggerDelay,
    ease: easings.standard
  }
})

/**
 * Section slide-in from left
 */
export const sectionSlideIn: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: durations.medium / 1000, ease: easings.standard }
  }
}

/**
 * Hero title dramatic entrance
 */
export const heroTitle = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: {
    duration: 0.6,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
  }
}

/**
 * Hero subtitle fade-in (slightly delayed)
 */
export const heroSubtitle = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.5,
    delay: 0.15,
    ease: easings.standard
  }
}

/**
 * Count badge shimmer animation
 */
export const badgeShimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0']
  },
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'linear' as const
  }
}

/**
 * Stagger container for child animations
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1
    }
  }
}

/**
 * Stagger child item
 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.medium / 1000,
      ease: easings.standard
    }
  }
}

/**
 * Fade in only (no position change)
 */
export const fadeIn = (delay = 0): { initial: object; animate: object; transition: Transition } => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: durations.medium / 1000, delay, ease: easings.standard }
})

/**
 * Returns no-motion variants for reduced motion preference
 */
export const noMotion = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  transition: { duration: 0 }
}

/**
 * Helper: returns noMotion variants if reduced motion is preferred
 */
export const getMotionProps = (
  props: { initial: object; animate: object; transition?: object },
  prefersReducedMotion: boolean
) => {
  if (prefersReducedMotion) return noMotion
  return props
}
