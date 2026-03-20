'use client'

import React, { useState } from 'react'
import { Box, Text } from '@mantine/core'
import { AlertTriangle } from 'lucide-react'

interface SpoilerOverlayProps {
  /** Chapter number for the label. If absent, shows generic "Spoiler" label. */
  chapterNumber?: number
  /** Called when the user clicks to reveal. */
  onReveal: () => void
}

/**
 * Pure visual spoiler overlay — frosted glass style.
 * Contains no gate logic. The parent decides whether to render this component.
 * Always covers its parent's dimensions (parent must be position: relative).
 */
export default function SpoilerOverlay({
  chapterNumber,
  onReveal
}: SpoilerOverlayProps) {
  const [isHovered, setIsHovered] = useState(false)

  const label = chapterNumber ? `Ch. ${chapterNumber} Spoiler` : 'Spoiler'

  const handleReveal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onReveal()
  }

  return (
    <Box
      onClick={handleReveal}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: isHovered
          ? 'rgba(12, 12, 28, 0.86)'
          : 'rgba(8, 8, 20, 0.72)',
        backdropFilter: 'blur(10px) saturate(0.8)',
        WebkitBackdropFilter: 'blur(10px) saturate(0.8)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'inherit',
        cursor: 'pointer',
        gap: 8,
        padding: '8px',
        overflow: 'hidden',
        transition: 'background 180ms ease',
        zIndex: 100,
      }}
    >
      <Box
        style={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertTriangle size={15} color="rgba(255, 255, 255, 0.85)" />
      </Box>

      <Text
        size="xs"
        fw={700}
        ta="center"
        style={{
          color: 'rgba(255, 255, 255, 0.92)',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Text>

      <Text
        size="xs"
        ta="center"
        style={{
          color: 'rgba(255, 255, 255, 0.38)',
          letterSpacing: '0.3px',
          width: '100%',
        }}
      >
        Click to reveal
      </Text>
    </Box>
  )
}
