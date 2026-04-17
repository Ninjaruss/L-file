'use client'

import React, { useState } from 'react'
import { Box } from '@mantine/core'
import { useProgress } from '../../providers/ProgressProvider'
import { useSpoilerSettings } from '../../hooks/useSpoilerSettings'
import { shouldHideSpoiler } from '../../lib/spoiler-utils'
import SpoilerOverlay from '../SpoilerOverlay'

interface TimelineSpoilerWrapperProps {
  chapterNumber: number
  spoilerChapter?: number
  children: React.ReactNode
}

export default function TimelineSpoilerWrapper({
  chapterNumber,
  spoilerChapter,
  children,
}: TimelineSpoilerWrapperProps) {
  const [revealed, setRevealed] = useState(false)
  const { userProgress } = useProgress()
  const { settings } = useSpoilerSettings()

  const effectiveChapter = spoilerChapter ?? chapterNumber
  const hidden = shouldHideSpoiler(effectiveChapter, userProgress, settings)

  if (!hidden || revealed) return <>{children}</>

  return (
    <Box style={{ position: 'relative' }}>
      <Box style={{ opacity: 0.3, filter: 'blur(2px)', pointerEvents: 'none' }}>
        {children}
      </Box>
      <SpoilerOverlay
        chapterNumber={effectiveChapter}
        onReveal={() => setRevealed(true)}
      />
    </Box>
  )
}
