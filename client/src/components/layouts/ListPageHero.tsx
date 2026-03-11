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
      {/* Decorative overlays */}
      <HalftoneOverlay color={`${accentColor}08`} spacing={16} />
      <SuitWatermark
        suit={suit}
        color={accentColor}
        size={140}
        opacity={0.05}
        position="top-right"
      />

      {/* Content */}
      <Stack align="center" gap="xs" style={{ position: 'relative', zIndex: 1 }}>
        <div className="hero-scan-line" aria-hidden="true" />

        {/* Eyebrow label */}
        <motion.div {...heroTitle}>
          <Text
            className="eyebrow-label"
            c={accentColor}
            style={{ opacity: 0.75 }}
          >
            {title} Records
          </Text>
        </motion.div>

        {/* Suit divider */}
        <motion.div {...heroSubtitle}>
          <Group justify="center" gap="sm">
            <Box style={{ height: 1, width: 60, background: `linear-gradient(to right, transparent, ${accentColor}50)` }} />
            <Text style={{ color: `${accentColor}B0`, fontSize: '0.85rem' }}>{suit}</Text>
            <Box style={{ height: 1, width: 60, background: `linear-gradient(to left, transparent, ${accentColor}50)` }} />
          </Group>
        </motion.div>

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
              boxShadow: `0 4px 20px ${accentColor}50`,
              border: `2px solid ${accentColor}40`
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
              textShadow: `0 2px 12px ${accentColor}30`,
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
            <Box style={{ height: 1, width: 80, background: `linear-gradient(to right, transparent, ${accentColor}30)` }} />
            <Text style={{ color: `${accentColor}60`, fontSize: '0.7rem' }}>♦</Text>
            <Box style={{ height: 1, width: 80, background: `linear-gradient(to left, transparent, ${accentColor}30)` }} />
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
                background: `${accentColor}0d`,
                border: `1px solid ${accentColor}30`,
                borderRadius: '4px',
                transform: 'rotate(-0.5deg)',
                letterSpacing: '0.1em',
                fontWeight: 700,
                fontFamily: 'var(--font-noto-sans)',
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
