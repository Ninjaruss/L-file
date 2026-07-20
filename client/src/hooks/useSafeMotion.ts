'use client'

import { useReducedMotion, type HTMLMotionProps } from 'motion/react'

type MotionDivProps = HTMLMotionProps<'div'>

/** Returns motion props that respect prefers-reduced-motion */
export function useSafeMotion(props: MotionDivProps): MotionDivProps {
  const reduceMotion = useReducedMotion()
  // Reduced motion: render the visible `animate` end state instantly (never leave content invisible).
  if (reduceMotion) {
    return {
      initial: false,
      animate: props.animate,
      transition: { duration: 0 },
    }
  }
  return props
}
