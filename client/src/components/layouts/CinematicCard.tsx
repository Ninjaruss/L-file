import React from 'react'
import { Box, Group } from '@mantine/core'

interface CinematicCardProps {
  entityColor: string
  padding?: string | number
  children: React.ReactNode
  style?: React.CSSProperties
}

/**
 * Cinematic dark card wrapper — warm entity-color tinted background,
 * 1px top gradient accent line, correct border.
 * Use for all section cards on entity detail pages.
 */
export function CinematicCard({ entityColor, padding = 'lg', children, style }: CinematicCardProps) {
  return (
    <Box
      style={{
        background: `linear-gradient(135deg, ${entityColor}0d 0%, #0d0d0d 55%, #0a0a0a 100%)`,
        border: `1px solid ${entityColor}22`,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      {/* 1px top accent gradient line */}
      <Box
        style={{
          height: 1,
          background: `linear-gradient(90deg, ${entityColor}, ${entityColor}60 40%, transparent 80%)`,
        }}
      />
      <Box p={padding}>{children}</Box>
    </Box>
  )
}

interface CinematicSectionHeaderProps {
  label: string
  entityColor: string
  /** Extra content to render between the pill and the divider line */
  extra?: React.ReactNode
}

/**
 * Pill badge section header with trailing gradient divider line.
 * Replaces the old icon-box + uppercase text + horizontal divider combo.
 */
export function CinematicSectionHeader({ label, entityColor, extra }: CinematicSectionHeaderProps) {
  return (
    <Group gap={8} mb={14} align="center">
      <Box
        style={{
          fontSize: '0.55rem',
          fontWeight: 900,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          borderRadius: 4,
          padding: '3px 8px',
          background: `${entityColor}18`,
          border: `1px solid ${entityColor}30`,
          color: entityColor,
          flexShrink: 0,
        }}
      >
        {label}
      </Box>
      {extra}
      <Box
        style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(to right, ${entityColor}18, transparent)`,
        }}
      />
    </Group>
  )
}
