'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Card,
  Badge,
  Avatar,
  Group,
  Box,
  Text,
  Skeleton,
  rem,
  useMantineTheme,
  rgba
} from '@mantine/core'
import {
  User,
  BookOpen,
  Dice6,
  FileText,
  Users,
  Hash,
  Volume2,
  Quote
} from 'lucide-react'
import {
  fetchEntityData,
  getEntityTypeLabel,
  getDefaultDisplayText,
  getEntityUrl,
  EntityEmbedData
} from '../lib/entityEmbedParser'
import { getEntityAccent, EntityAccentKey } from '../lib/mantine-theme'
import MediaThumbnail from './MediaThumbnail'

interface EntityCardProps {
  type: 'character' | 'arc' | 'gamble' | 'guide' | 'organization' | 'chapter' | 'volume' | 'quote'
  id: number
  displayText?: string
  compact?: boolean
  showImage?: boolean
  inline?: boolean
}

type EntityAccentMap = Partial<Record<EntityCardProps['type'], EntityAccentKey>>

const ENTITY_ACCENT_MAP: EntityAccentMap = {
  character: 'character',
  arc: 'arc',
  gamble: 'gamble',
  guide: 'guide',
  organization: 'organization',
  quote: 'quote'
}

const ICON_MAP: Record<EntityCardProps['type'], React.ReactNode> = {
  character: <User size={18} />,
  arc: <BookOpen size={18} />,
  gamble: <Dice6 size={18} />,
  guide: <FileText size={18} />,
  organization: <Users size={18} />,
  chapter: <Hash size={18} />,
  volume: <Volume2 size={18} />,
  quote: <Quote size={18} />
}

const skeletonCircle = (size: number) => (
  <Skeleton width={size} height={size} circle radius={size / 2} />
)

const EntityCard: React.FC<EntityCardProps> = ({
  type,
  id,
  displayText,
  compact = false,
  showImage = true,
  inline = false
}) => {
  const theme = useMantineTheme()
  const [data, setData] = useState<EntityEmbedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const entityData = await fetchEntityData(type, id)
        if (!isMounted) return
        if (!entityData) {
          setError(true)
        }
        setData(entityData || null)
      } catch (networkError) {
        if (isMounted) {
          setError(true)
          setData(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [type, id])

  const accentKey = ENTITY_ACCENT_MAP[type]
  const accentColor = accentKey ? getEntityAccent(accentKey, theme) : theme.colors.gray[5] || '#94a3b8'

  const renderChip = (label: string) => (
    <Badge
      size="sm"
      variant="outline"
      radius="md"
      styles={{
        root: {
          borderColor: accentColor,
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: '0.025em'
        }
      }}
    >
      {label}
    </Badge>
  )

  const renderMeta = () => {
    if (!data?.data) return null

    if (type === 'character' && data.data.organization) {
      return data.data.organization
    }

    if (type === 'arc' && data.data.startChapter && data.data.endChapter) {
      return `Ch. ${data.data.startChapter}-${data.data.endChapter}`
    }

    if (type === 'gamble' && data.data.chapterNumber) {
      return `Ch. ${data.data.chapterNumber}`
    }

    if (type === 'chapter' && data.data.number) {
      return `#${data.data.number}`
    }

    if (type === 'volume' && data.data.number) {
      return `Vol. ${data.data.number}`
    }

    return null
  }

  const renderLoading = () => (
    <Group gap={compact ? 'xs' : 'sm'} wrap="nowrap">
      {skeletonCircle(compact ? 24 : 32)}
      <Box style={{ flex: 1 }}>
        <Skeleton height={compact ? 14 : 18} width="60%" mb={compact ? 0 : 6} />
        {!compact && <Skeleton height={12} width="40%" />}
      </Box>
    </Group>
  )

  const renderError = () => (
    <Group gap={compact ? 'xs' : 'sm'} wrap="nowrap">
      <Avatar
        size={compact ? 24 : 32}
        radius="xl"
        styles={{ root: { backgroundColor: theme.colors.red[6] ?? '#ef4444', color: '#ffffff' } }}
      >
        {ICON_MAP[type]}
      </Avatar>
      <Box style={{ flex: 1 }}>
        <Text size={compact ? 'xs' : 'sm'} fw={600} lineClamp={1} c="red.4">
          {displayText || `${getEntityTypeLabel(type)} not found`}
        </Text>
        {!compact && (
          <Text size="xs" c="dimmed" lineClamp={1}>
            ID: {id}
          </Text>
        )}
      </Box>
    </Group>
  )

  const renderAvatar = () => (
    <Avatar size={compact ? 24 : 32} radius="xl" styles={{ root: { backgroundColor: accentColor, color: '#ffffff' } }}>
      {ICON_MAP[type]}
    </Avatar>
  )

  const renderContent = () => {
    if (loading) {
      return renderLoading()
    }

    if (error || !data) {
      return renderError()
    }

    const finalDisplayText = displayText || getDefaultDisplayText(type, data)
    const meta = renderMeta()

    return (
      <Group gap={compact ? 'xs' : 'sm'} wrap="nowrap" align="center" style={{ maxWidth: '100%' }}>
        {showImage && (
          <Box style={{ position: 'relative', flexShrink: 0 }}>
            {['character', 'arc', 'volume'].includes(type) ? (
              <Box style={{ width: compact ? rem(24) : rem(32), height: compact ? rem(24) : rem(32) }}>
                <MediaThumbnail
                  entityType={type as 'character' | 'arc' | 'volume'}
                  entityId={id}
                  entityName={finalDisplayText}
                  maxWidth={compact ? 24 : 32}
                  maxHeight={compact ? 24 : 32}
                  inline
                />
              </Box>
            ) : (
              renderAvatar()
            )}
          </Box>
        )}

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text
            size={compact ? 'sm' : 'md'}
            fw={600}
            lineClamp={1}
            component="span"
            style={{ color: accentColor }}
          >
            {finalDisplayText}
          </Text>

          {!compact && (
            <Group gap="xs" mt={4} align="center">
              {renderChip(getEntityTypeLabel(type))}
              {meta && (
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {meta}
                </Text>
              )}
            </Group>
          )}
        </Box>
      </Group>
    )
  }

  const linkHref = getEntityUrl(type, id)
  const interactiveStyles = {
    border: `1px solid ${rgba(accentColor, 0.25)}`,
    background: `linear-gradient(135deg, ${rgba(accentColor, 0.12)} 0%, transparent 100%)`,
    textDecoration: 'none',
    transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
    display: inline ? 'inline-flex' : undefined
  } as const

  if (compact || inline) {
    return (
      <Box
        component={Link}
        href={linkHref}
        style={{
          ...interactiveStyles,
          alignItems: 'center',
          padding: '4px 8px',
          borderRadius: rem(8),
          cursor: 'pointer',
          maxWidth: '100%',
          color: 'inherit'
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.borderColor = rgba(accentColor, 0.6)
          event.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.borderColor = rgba(accentColor, 0.25)
          event.currentTarget.style.transform = 'none'
        }}
      >
        {renderContent()}
      </Box>
    )
  }

  return (
    <Card
      component={Link}
      href={linkHref}
      padding="md"
      radius="md"
      withBorder
      style={{
        ...interactiveStyles,
        borderRadius: rem(12),
        cursor: 'pointer'
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = rgba(accentColor, 0.6)
        event.currentTarget.style.boxShadow = `0 12px 24px ${rgba(accentColor, 0.18)}`
        event.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = rgba(accentColor, 0.25)
        event.currentTarget.style.boxShadow = 'none'
        event.currentTarget.style.transform = 'none'
      }}
    >
      {renderContent()}
    </Card>
  )
}

export default EntityCard
