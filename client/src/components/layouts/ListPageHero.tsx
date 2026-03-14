'use client'

import React from 'react'
import { Box, Group, Stack, Title, Text, Badge, rem, useMantineTheme } from '@mantine/core'
import { motion } from 'motion/react'
import { getHeroStyles, type EntityAccentKey, getEntityThemeColor } from '../../lib/mantine-theme'
import { mangaPatterns, clipPaths, entitySuit } from '../../lib/manga-decorations'
import { heroTitle, heroSubtitle } from '../../lib/motion-presets'
import { HalftoneOverlay, SuitWatermark } from '../decorative/MangaPatterns'

interface ListPageHeroProps {
  /** Lucide icon element to display */
  icon: React.ReactNode
  /** Main page title */
  title: string
  /** Subtitle description */
  subtitle: string
  /** Entity type for theming */
  entityType: EntityAccentKey
  /** Total count to display in badge */
  count?: number
  /** Label for the count (default: entity name plural) */
  countLabel?: string
  /** Whether a search/filter is active (changes badge text) */
  hasActiveSearch?: boolean
  /** Additional content below the title area */
  children?: React.ReactNode
}

export function ListPageHero({
  icon,
  title,
  subtitle,
  entityType,
  count,
  countLabel,
  hasActiveSearch = false,
  children
}: ListPageHeroProps) {
  const theme = useMantineTheme()
  const accentColor = getEntityThemeColor(theme, entityType)
  const suit = entitySuit[entityType]

  return (
    <Box
      style={{
        ...getHeroStyles(theme, accentColor),
        position: 'relative',
        overflow: 'hidden',
        clipPath: clipPaths.diagonalBottom,
        paddingBottom: rem(64)
      }}
      p="md"
    >
      {/* Inset frame */}
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          inset: '8px',
          border: `1px solid ${accentColor}10`,
          borderRadius: rem(8),
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Scan-line texture */}
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Decorative overlays */}
      <HalftoneOverlay color={`${accentColor}12`} spacing={12} />
      <SuitWatermark
        suit={suit}
        color={accentColor}
        size={180}
        opacity={0.07}
        position="top-right"
      />
      <SuitWatermark
        suit={suit}
        color={accentColor}
        size={90}
        opacity={0.03}
        position="bottom-left"
      />

      {/* Content */}
      <Stack align="center" gap="xs" style={{ position: 'relative', zIndex: 1 }}>
        <div className="hero-scan-line" aria-hidden="true" />
        <div className="hero-scan-line hero-scan-line--delayed" aria-hidden="true" />

        {/* Icon circle */}
        <motion.div {...heroTitle}>
          <Box
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}BB)`,
              borderRadius: '50%',
              width: rem(52),
              height: rem(52),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 40px ${accentColor}70, 0 0 80px ${accentColor}28, inset 0 1px 0 rgba(255,255,255,0.20)`,
              border: `2px solid ${accentColor}60`
            }}
          >
            {icon}
          </Box>
        </motion.div>

        {/* Title */}
        <motion.div {...heroTitle}>
          <Title
            order={1}
            size="2.4rem"
            fw={400}
            ta="center"
            c={accentColor}
            style={{
              fontFamily: 'var(--font-opti-goudy-text), serif',
              fontWeight: 400,
              textShadow: `0 2px 16px ${accentColor}50, 0 0 48px ${accentColor}18`,
              letterSpacing: '-0.01em'
            }}
          >
            {title}
          </Title>
        </motion.div>

        {/* Subtitle */}
        <motion.div {...heroSubtitle}>
          <Text
            size="md"
            style={{ color: theme.colors.gray[5] }}
            ta="center"
            maw={440}
          >
            {subtitle}
          </Text>
        </motion.div>

        {/* Decorative diamond rule */}
        <motion.div {...heroSubtitle}>
          <Group justify="center" gap="sm">
            <Box style={{ height: 1, width: 100, background: `linear-gradient(to right, transparent, ${accentColor}50)` }} />
            <Text style={{ color: accentColor, fontSize: '0.85rem' }}>♦</Text>
            <Box style={{ height: 1, width: 100, background: `linear-gradient(to left, transparent, ${accentColor}50)` }} />
          </Group>
        </motion.div>

        {/* Count badge */}
        {count !== undefined && count > 0 && (
          <motion.div {...heroSubtitle}>
            <Badge
              size="md"
              variant="light"
              c={accentColor}
              radius="xs"
              mt={4}
              className="stamp-reveal"
              style={{
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}45`,
                borderRadius: '4px',
                transform: 'rotate(-0.5deg)',
                letterSpacing: '0.14em',
                fontWeight: 700,
                fontFamily: 'var(--font-noto-sans)',
                textShadow: `0 0 12px ${accentColor}60`,
                boxShadow: `0 0 16px ${accentColor}12`,
              }}
            >
              {count} {(countLabel || title).toUpperCase()} {hasActiveSearch ? 'FOUND' : 'ON FILE'}
            </Badge>
          </motion.div>
        )}

        {/* Additional content (e.g., featured section) */}
        {children}
      </Stack>
    </Box>
  )
}

export default ListPageHero
