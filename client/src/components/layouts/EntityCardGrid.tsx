'use client'

import React from 'react'
import { Box, rem } from '@mantine/core'
import { motion } from 'motion/react'
import { cardEnter } from '../../lib/motion-presets'
import type { ViewMode } from './SearchToolbar'

export type GridLayout = 'portrait' | 'landscape' | 'list'

interface EntityCardGridProps<T> {
  /** Items to render */
  items: T[]
  /** Render function for each item */
  renderCard: (item: T, index: number) => React.ReactNode
  /** Key extractor */
  getKey: (item: T) => string | number
  /** Grid layout mode */
  layout?: GridLayout
  /** Override view mode (if list toggle is used) */
  viewMode?: ViewMode
  /** Accent color for 3D perspective effect */
  accentColor?: string
}

const gridStyles: Record<GridLayout, React.CSSProperties> = {
  portrait: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 220px))',
    gap: rem(20),
    justifyContent: 'center'
  },
  landscape: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: rem(20),
    justifyContent: 'center'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: rem(12)
  }
}

const itemStyles: Record<GridLayout, React.CSSProperties> = {
  portrait: {
    width: '100%',
    maxWidth: '220px',
    aspectRatio: '5/7'
  },
  landscape: {
    width: '100%',
    aspectRatio: '16/9'
  },
  list: {
    width: '100%'
  }
}

export function EntityCardGrid<T>({
  items,
  renderCard,
  getKey,
  layout = 'portrait',
  viewMode,
  accentColor
}: EntityCardGridProps<T>) {
  const effectiveLayout: GridLayout = viewMode === 'list' ? 'list' : layout

  return (
    <Box
      px="md"
      style={{
        ...gridStyles[effectiveLayout],
        // Subtle 3D perspective on the grid for hover depth effect
        perspective: effectiveLayout !== 'list' ? '1200px' : undefined
      }}
    >
      {items.map((item, index) => (
        <motion.div
          key={getKey(item)}
          {...cardEnter(index)}
          style={itemStyles[effectiveLayout]}
        >
          {renderCard(item, index)}
        </motion.div>
      ))}
    </Box>
  )
}

export default EntityCardGrid
