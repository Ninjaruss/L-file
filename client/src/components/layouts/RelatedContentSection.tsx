'use client'

import React from 'react'
import { Button, Card, Group, Stack, Title, useMantineTheme } from '@mantine/core'
import Link from 'next/link'
import {
  getEntityThemeColor,
  textColors,
  getCardStyles,
  type EntityAccentKey
} from '../../lib/mantine-theme'

interface RelatedContentSectionProps<T> {
  /** Entity type for section theming */
  entityType: EntityAccentKey
  /** Section icon (lucide-react) */
  icon: React.ReactNode
  /** Section title (e.g., "Related Story Arcs") */
  title: string
  /** All items */
  items: T[]
  /** Max items to show in preview (default 4) */
  previewCount?: number
  /** "View All" link destination */
  viewAllHref?: string
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Key extractor */
  getKey: (item: T) => string | number
  /** Use title text color from entity type (default: uses textColors[entityType]) */
  titleColorKey?: keyof typeof textColors
}

export function RelatedContentSection<T>({
  entityType,
  icon,
  title,
  items,
  previewCount = 4,
  viewAllHref,
  renderItem,
  getKey,
  titleColorKey
}: RelatedContentSectionProps<T>) {
  const theme = useMantineTheme()
  const accentColor = getEntityThemeColor(theme, entityType)
  const titleColor = titleColorKey
    ? (textColors as Record<string, string>)[titleColorKey] || accentColor
    : (textColors as Record<string, string>)[entityType] || accentColor

  if (items.length === 0) return null

  const displayItems = items.slice(0, previewCount)

  return (
    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, accentColor)}>
      <Stack gap={theme.spacing.md} p={theme.spacing.md}>
        <Group justify="space-between" align="center">
          <Group gap={theme.spacing.sm}>
            {icon}
            <Title order={4} c={titleColor}>{title}</Title>
          </Group>
          {viewAllHref && items.length > previewCount && (
            <Button
              component={Link}
              href={viewAllHref}
              variant="outline"
              c={accentColor}
              size="sm"
              radius="xl"
              style={{
                fontWeight: 600,
                border: `2px solid ${accentColor}`,
                transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`
              }}
            >
              View All ({items.length})
            </Button>
          )}
        </Group>
        <Stack gap={theme.spacing.sm}>
          {displayItems.map((item, index) => (
            <React.Fragment key={getKey(item)}>
              {renderItem(item, index)}
            </React.Fragment>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}

export default RelatedContentSection
