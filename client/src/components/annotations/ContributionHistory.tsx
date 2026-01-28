'use client'

import React, { useEffect, useState } from 'react'
import {
  Card,
  Group,
  Stack,
  Text,
  Title,
  Badge,
  Skeleton,
  Tabs,
  Anchor,
  useMantineTheme,
  Box
} from '@mantine/core'
import {
  History,
  FileText,
  Image,
  MessageSquare,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import api from '../../lib/api'
import { textColors, getCardStyles, getEntityThemeColor } from '../../lib/mantine-theme'

interface ContributionHistoryProps {
  userId: number
}

interface ContributionItem {
  id: number
  title?: string
  description?: string
  status: string
  createdAt: string
  ownerType?: string
  ownerId?: number
  url?: string
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'approved':
      return '#51cf66'
    case 'pending':
      return '#fab005'
    case 'rejected':
      return '#ff6b6b'
    default:
      return '#868e96'
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getOwnerLink(ownerType: string, ownerId: number): string {
  switch (ownerType.toLowerCase()) {
    case 'character':
      return `/characters/${ownerId}`
    case 'gamble':
      return `/gambles/${ownerId}`
    case 'chapter':
      return `/chapters/${ownerId}`
    case 'arc':
      return `/arcs/${ownerId}`
    default:
      return '#'
  }
}

interface ItemRowProps {
  item: ContributionItem
  type: 'guide' | 'media' | 'annotation'
  color: string
}

function ItemRow({ item, type, color }: ItemRowProps) {
  const theme = useMantineTheme()

  let href = '#'
  let displayText = item.title || item.description || 'Untitled'

  if (type === 'guide') {
    href = `/guides/${item.id}`
  } else if (type === 'media') {
    href = item.url || '#'
    displayText = item.description || 'Media submission'
  } else if (type === 'annotation' && item.ownerType && item.ownerId) {
    href = getOwnerLink(item.ownerType, item.ownerId)
    displayText = item.title || `${item.ownerType} annotation`
  }

  return (
    <Group
      justify="space-between"
      p="sm"
      style={{
        backgroundColor: theme.colors.dark[6],
        borderRadius: theme.radius.sm,
        borderLeft: `3px solid ${color}`
      }}
    >
      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
        <Anchor
          component={Link}
          href={href}
          size="sm"
          fw={500}
          c={textColors.primary}
          style={{
            textDecoration: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block'
          }}
        >
          <Group gap="xs" wrap="nowrap">
            <Text truncate>{displayText}</Text>
            <ExternalLink size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
          </Group>
        </Anchor>
        <Group gap="xs">
          <Text size="xs" c={textColors.tertiary}>
            {formatDate(item.createdAt)}
          </Text>
          {type === 'annotation' && item.ownerType && (
            <Badge size="xs" variant="outline" color="gray">
              {item.ownerType}
            </Badge>
          )}
        </Group>
      </Stack>
      <Badge
        size="sm"
        variant="light"
        style={{
          backgroundColor: `${getStatusColor(item.status)}20`,
          color: getStatusColor(item.status),
          border: `1px solid ${getStatusColor(item.status)}40`
        }}
      >
        {item.status}
      </Badge>
    </Group>
  )
}

export default function ContributionHistory({ userId }: ContributionHistoryProps) {
  const theme = useMantineTheme()
  const [details, setDetails] = useState<{
    guides: ContributionItem[]
    media: ContributionItem[]
    annotations: ContributionItem[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string | null>('guides')

  const entityColors = {
    guide: getEntityThemeColor(theme, 'guide'),
    media: getEntityThemeColor(theme, 'media'),
    annotation: theme.colors.violet[5],
    history: theme.colors.blue[5]
  }

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await api.getUserContributionDetails(userId)
        setDetails(result)
      } catch (err) {
        console.error('Failed to fetch contribution details:', err)
        setError('Failed to load contribution history')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [userId])


  if (loading) {
    return (
      <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme)}>
        <Stack gap="md" p="md">
          <Group gap="sm">
            <Skeleton circle height={24} width={24} />
            <Skeleton height={20} width={180} />
          </Group>
          <Skeleton height={40} />
          <Stack gap="sm">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={60} />
            ))}
          </Stack>
        </Stack>
      </Card>
    )
  }

  if (error || !details) {
    return null
  }

  const totalItems = details.guides.length + details.media.length + details.annotations.length

  if (totalItems === 0) {
    return null
  }

  return (
    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.history)}>
      <Stack gap="md" p="md">
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <History size={20} color={entityColors.history} />
            <Title order={4} c={textColors.primary}>Contribution History</Title>
          </Group>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab
              value="guides"
              leftSection={<FileText size={14} />}
              disabled={details.guides.length === 0}
            >
              Guides ({details.guides.length})
            </Tabs.Tab>
            <Tabs.Tab
              value="media"
              leftSection={<Image size={14} />}
              disabled={details.media.length === 0}
            >
              Media ({details.media.length})
            </Tabs.Tab>
            <Tabs.Tab
              value="annotations"
              leftSection={<MessageSquare size={14} />}
              disabled={details.annotations.length === 0}
            >
              Annotations ({details.annotations.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="guides" pt="md">
            {details.guides.length === 0 ? (
              <Text size="sm" c={textColors.tertiary} ta="center" py="lg">
                No guides submitted yet
              </Text>
            ) : (
              <Stack gap="sm">
                {details.guides.map((guide) => (
                  <ItemRow
                    key={guide.id}
                    item={guide}
                    type="guide"
                    color={entityColors.guide}
                  />
                ))}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="media" pt="md">
            {details.media.length === 0 ? (
              <Text size="sm" c={textColors.tertiary} ta="center" py="lg">
                No media submitted yet
              </Text>
            ) : (
              <Stack gap="sm">
                {details.media.map((mediaItem) => (
                  <ItemRow
                    key={mediaItem.id}
                    item={mediaItem}
                    type="media"
                    color={entityColors.media}
                  />
                ))}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="annotations" pt="md">
            {details.annotations.length === 0 ? (
              <Text size="sm" c={textColors.tertiary} ta="center" py="lg">
                No annotations submitted yet
              </Text>
            ) : (
              <Stack gap="sm">
                {details.annotations.map((annotation) => (
                  <ItemRow
                    key={annotation.id}
                    item={annotation}
                    type="annotation"
                    color={entityColors.annotation}
                  />
                ))}
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Card>
  )
}
