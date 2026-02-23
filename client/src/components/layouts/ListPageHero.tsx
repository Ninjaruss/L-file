'use client'

import React from 'react'
import { Box, Stack, Title, Text, Badge, rem, useMantineTheme } from '@mantine/core'
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
        paddingBottom: rem(48)
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
            size="1.75rem"
            fw={700}
            ta="center"
            c={accentColor}
            style={{
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

        {/* Count badge */}
        {count !== undefined && count > 0 && (
          <motion.div {...heroSubtitle}>
            <Badge
              size="md"
              variant="light"
              c={accentColor}
              radius="xl"
              mt={4}
              style={{
                background: `${accentColor}15`,
                border: `1px solid ${accentColor}25`
              }}
            >
              {count} {countLabel || title.toLowerCase()}{' '}
              {hasActiveSearch ? 'found' : 'available'}
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
