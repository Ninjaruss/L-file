'use client'

import React, { ReactNode } from 'react'
import { Box, Stack, Title, Text, Badge, rem, useMantineTheme } from '@mantine/core'
import { getHeroStyles } from '../lib/mantine-theme'

interface HeroSectionProps {
  /**
   * The icon to display in the hero section
   */
  icon: ReactNode
  /**
   * The main title of the section
   */
  title: string
  /**
   * Optional subtitle text
   */
  subtitle?: string
  /**
   * The accent color for the hero section (from entity theme colors)
   */
  accentColor: string
  /**
   * Optional count to display in a badge (e.g., "42 results")
   */
  count?: number
  /**
   * Optional label for the count badge (default: "results")
   */
  countLabel?: string
  /**
   * Additional content to render below the title (e.g., search inputs, filters)
   */
  children?: ReactNode
  /**
   * Gap between items in the hero stack (default: "xs")
   */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * Reusable hero section component for list pages
 * Provides consistent styling and layout for page headers
 */
export function HeroSection({
  icon,
  title,
  subtitle,
  accentColor,
  count,
  countLabel = 'results',
  children,
  gap = 'xs'
}: HeroSectionProps) {
  const theme = useMantineTheme()

  return (
    <Box style={getHeroStyles(theme, accentColor)} p="md">
      <Stack align="center" gap={gap}>
        {/* Icon Container */}
        <Box
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
            borderRadius: '50%',
            width: rem(40),
            height: rem(40),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${accentColor}40`
          }}
        >
          {icon}
        </Box>

        {/* Title */}
        <Title
          order={2}
          ta="center"
          style={{ color: theme.white, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
        >
          {title}
        </Title>

        {/* Subtitle with optional count badge */}
        {(subtitle || count !== undefined) && (
          <Text
            size="md"
            ta="center"
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            {subtitle}
            {count !== undefined && (
              <Badge
                size="md"
                variant="light"
                ml="xs"
                style={{
                  backgroundColor: `${accentColor}30`,
                  color: accentColor,
                  fontWeight: 600
                }}
              >
                {count.toLocaleString()} {countLabel}
              </Badge>
            )}
          </Text>
        )}

        {/* Additional content (search, filters, etc.) */}
        {children}
      </Stack>
    </Box>
  )
}

export default HeroSection
