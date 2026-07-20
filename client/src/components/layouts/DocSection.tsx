'use client'

import React from 'react'
import { Box } from '@mantine/core'

interface DocSectionProps {
  /** Two-digit section number, e.g. "01". */
  no: string
  /** Section title, uppercased in render. */
  title: string
  /** Entity accent color (hex). */
  accent: string
  children: React.ReactNode
  style?: React.CSSProperties
}

/**
 * Numbered "§" document section with a hairline rule.
 * Narrative content sits directly beneath — no card chrome — so the main
 * column reads as one document instead of a stack of equal cards.
 */
export function DocSection({ no, title, accent, children, style }: DocSectionProps) {
  return (
    <Box component="section" style={{ marginBottom: 40, ...style }}>
      <Box style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <Box
          style={{
            fontFamily: 'var(--font-noto-sans)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: accent,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          §{no}
        </Box>
        <Box
          component="h2"
          style={{
            fontFamily: 'var(--font-noto-sans)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.74)',
            margin: 0,
          }}
        >
          {title}
        </Box>
        <Box aria-hidden style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      </Box>
      {children}
    </Box>
  )
}

export default DocSection
