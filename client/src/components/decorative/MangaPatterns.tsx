'use client'

import React from 'react'
import { Box } from '@mantine/core'
import { mangaPatterns, suitPaths, entitySuit } from '../../lib/manga-decorations'
import type { EntityAccentKey } from '../../lib/mantine-theme'

/**
 * Halftone dot pattern overlay
 * Creates a Ben-Day dot effect common in manga/comics
 */
export function HalftoneOverlay({
  color = 'rgba(255,255,255,0.04)',
  spacing = 12,
  style
}: {
  color?: string
  spacing?: number
  style?: React.CSSProperties
}) {
  return (
    <Box
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        ...mangaPatterns.halftoneBackground(color, spacing),
        ...style
      }}
    />
  )
}

/**
 * Speed lines radiating effect
 * Thin diagonal lines like manga action scenes
 */
export function SpeedLines({
  color = 'rgba(255,255,255,0.03)',
  angle = 45,
  style
}: {
  color?: string
  angle?: number
  style?: React.CSSProperties
}) {
  return (
    <Box
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: mangaPatterns.speedLines(color, angle),
        ...style
      }}
    />
  )
}

/**
 * Diagonal stripe accent
 * Subtle manga-style hatching
 */
export function DiagonalStripes({
  color = 'rgba(255,255,255,0.03)',
  width = 1,
  gap = 8,
  style
}: {
  color?: string
  width?: number
  gap?: number
  style?: React.CSSProperties
}) {
  return (
    <Box
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: mangaPatterns.diagonalStripes(color, width, gap),
        ...style
      }}
    />
  )
}

/**
 * Playing card suit watermark
 * Large, faded suit symbol for background decoration
 */
export function SuitWatermark({
  suit,
  color,
  size = 120,
  opacity = 0.04,
  position = 'top-right',
  style
}: {
  suit: 'spade' | 'heart' | 'diamond' | 'club'
  color: string
  size?: number
  opacity?: number
  position?: 'top-right' | 'bottom-left' | 'center'
  style?: React.CSSProperties
}) {
  const positionStyles: Record<string, React.CSSProperties> = {
    'top-right': { top: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  return (
    <Box
      aria-hidden="true"
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        width: size,
        height: size,
        opacity,
        ...positionStyles[position],
        ...style
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={color}
      >
        <path d={suitPaths[suit]} />
      </svg>
    </Box>
  )
}

/**
 * Convenience: renders the suit watermark for a given entity type
 */
export function EntitySuitWatermark({
  entityType,
  color,
  ...props
}: {
  entityType: EntityAccentKey
  color: string
} & Omit<React.ComponentProps<typeof SuitWatermark>, 'suit'>) {
  return <SuitWatermark suit={entitySuit[entityType]} color={color} {...props} />
}
