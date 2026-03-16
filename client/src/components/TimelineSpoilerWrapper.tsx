'use client'

import React, { useState } from 'react'
import { Box } from '@mantine/core'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'
import { shouldHideSpoiler } from '../lib/spoiler-utils'
import SpoilerOverlay from './SpoilerOverlay'

interface TimelineSpoilerWrapperProps {
  chapterNumber?: number
  /** Called when the user clicks to reveal. Use to update parent state (e.g. revealedEvents). */
  onReveal?: () => void
  /** Applied to the outer Box. Use style={{ height: '100%' }} inside fixed-height card grids. */
  style?: React.CSSProperties
  children: React.ReactNode
}

/**
 * Spoiler wrapper for timeline items, event cards, quotes, and inline markdown spoilers.
 * Renders a frosted-glass overlay when the chapter is beyond the user's reading progress.
 * Click the overlay to reveal the content.
 */
export default function TimelineSpoilerWrapper({
  chapterNumber,
  onReveal,
  style,
  children
}: TimelineSpoilerWrapperProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const { userProgress } = useProgress()
  const { settings } = useSpoilerSettings()

  const effectiveProgress = settings.chapterTolerance > 0
    ? settings.chapterTolerance
    : userProgress

  const hidden = shouldHideSpoiler(chapterNumber, userProgress, settings)

  if (!hidden || isRevealed) {
    return <>{children}</>
  }

  const handleReveal = () => {
    setIsRevealed(true)
    onReveal?.()
  }

  return (
    <Box style={{ position: 'relative', ...style }}>
      <Box style={{ opacity: 0.3, filter: 'blur(2px)', pointerEvents: 'none', height: '100%' }}>
        {children}
      </Box>
      <SpoilerOverlay
        chapterNumber={chapterNumber}
        effectiveProgress={effectiveProgress}
        onReveal={handleReveal}
      />
    </Box>
  )
}
