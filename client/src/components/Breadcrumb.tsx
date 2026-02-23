'use client'

import React from 'react'
import { Breadcrumbs, Anchor, Text, Group, useMantineTheme, rem } from '@mantine/core'
import {
  ChevronRight, Home, User, Crown, BookOpen, Book,
  Dice6, CalendarSearch, Shield, FileText
} from 'lucide-react'
import Link from 'next/link'
import { textColors, getEntityThemeColor, EntityAccentKey } from '../lib/mantine-theme'
import { routes, EntityType } from '../lib/routes'

// Map EntityType to EntityAccentKey (they're mostly the same, but 'user' doesn't have an accent color)
const entityTypeToAccentKey: Partial<Record<EntityType, EntityAccentKey>> = {
  character: 'character',
  arc: 'arc',
  volume: 'volume',
  chapter: 'chapter',
  gamble: 'gamble',
  event: 'event',
  organization: 'organization',
  guide: 'guide',
}

// Entity type icons for breadcrumb visual enhancement
const entityIcons: Partial<Record<EntityType, React.ComponentType<{ size: number; color?: string }>>> = {
  character: User,
  arc: BookOpen,
  volume: Book,
  chapter: BookOpen,
  gamble: Dice6,
  event: CalendarSearch,
  organization: Shield,
  guide: FileText,
}

export interface BreadcrumbItem {
  label: string
  href?: string
  entityType?: EntityType
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
  showHome?: boolean
  entityType?: EntityType
}

/**
 * Breadcrumb navigation component for detail pages
 *
 * @example
 * // Simple usage
 * <BreadcrumbNav
 *   items={[
 *     { label: 'Characters', href: '/characters' },
 *     { label: 'Baku Madarame' }
 *   ]}
 * />
 *
 * @example
 * // With entity type for accent color
 * <BreadcrumbNav
 *   items={[
 *     { label: 'Gambles', href: '/gambles' },
 *     { label: 'Escape the Labyrinth' }
 *   ]}
 *   entityType="gamble"
 * />
 */
export function BreadcrumbNav({ items, showHome = true, entityType }: BreadcrumbNavProps) {
  const theme = useMantineTheme()
  const accentKey = entityType ? entityTypeToAccentKey[entityType] : undefined
  const accentColor = accentKey ? getEntityThemeColor(theme, accentKey) : theme.colors.gray[5]

  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: 'Home', href: routes.home() }, ...items]
    : items

  return (
    <Breadcrumbs
      separator={<ChevronRight size={14} color={theme.colors.gray[6]} />}
      mb="md"
      styles={{
        root: {
          flexWrap: 'wrap',
          rowGap: rem(4)
        },
        separator: {
          marginLeft: rem(6),
          marginRight: rem(6)
        }
      }}
    >
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1
        const isHome = index === 0 && showHome

        if (isLast) {
          // Current page - not a link
          return (
            <Text
              key={item.label}
              size="sm"
              fw={600}
              c={accentColor}
              style={{
                maxWidth: rem(200),
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {item.label}
            </Text>
          )
        }

        return (
          <Anchor
            key={item.label}
            component={Link}
            href={item.href || '/'}
            size="sm"
            c={textColors.secondary}
            style={{
              textDecoration: 'none',
              transition: 'color 150ms ease',
              display: 'flex',
              alignItems: 'center',
              gap: rem(4),
              borderRadius: rem(4),
              padding: `${rem(2)} ${rem(4)}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = accentColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = textColors.secondary
            }}
          >
            {isHome && <Home size={14} />}
            {!isHome && item.entityType && entityIcons[item.entityType] && React.createElement(entityIcons[item.entityType]!, { size: 14 })}
            {item.label}
          </Anchor>
        )
      })}
    </Breadcrumbs>
  )
}

/**
 * Helper to create breadcrumb items for entity detail pages
 */
export function createEntityBreadcrumbs(
  entityType: EntityType,
  entityName: string,
  listLabel?: string
): BreadcrumbItem[] {
  const labels: Record<EntityType, string> = {
    character: 'Characters',
    arc: 'Arcs',
    volume: 'Volumes',
    chapter: 'Chapters',
    gamble: 'Gambles',
    event: 'Events',
    organization: 'Organizations',
    guide: 'Guides',
    user: 'Users',
  }

  const listRoutes: Record<EntityType, string> = {
    character: routes.characters(),
    arc: routes.arcs(),
    volume: routes.volumes(),
    chapter: routes.chapters(),
    gamble: routes.gambles(),
    event: routes.events(),
    organization: routes.organizations(),
    guide: routes.guides(),
    user: routes.users(),
  }

  return [
    { label: listLabel || labels[entityType], href: listRoutes[entityType], entityType },
    { label: entityName }
  ]
}

export default BreadcrumbNav
