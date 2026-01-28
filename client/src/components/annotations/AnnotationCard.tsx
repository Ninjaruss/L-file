'use client'

import React, { useState } from 'react'
import {
  Card,
  Group,
  Stack,
  Text,
  Badge,
  Anchor,
  ActionIcon,
  Collapse,
  Box,
  useMantineTheme,
  Tooltip,
} from '@mantine/core'
import {
  MessageSquare,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Edit,
  Trash2,
  BookOpen,
} from 'lucide-react'
import Link from 'next/link'
import { Annotation, AnnotationStatus } from '../../types'
import { textColors, getCardStyles } from '../../lib/mantine-theme'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'

interface AnnotationCardProps {
  annotation: Annotation
  userProgress?: number
  isOwner?: boolean
  onEdit?: (annotation: Annotation) => void
  onDelete?: (annotationId: number) => void
}

function getStatusColor(status: AnnotationStatus): string {
  switch (status) {
    case AnnotationStatus.APPROVED:
      return '#51cf66'
    case AnnotationStatus.PENDING:
      return '#fab005'
    case AnnotationStatus.REJECTED:
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
    day: 'numeric',
  })
}

export default function AnnotationCard({
  annotation,
  userProgress = 999,
  isOwner = false,
  onEdit,
  onDelete,
}: AnnotationCardProps) {
  const theme = useMantineTheme()
  const [expanded, setExpanded] = useState(false)

  const isSpoilerHidden =
    annotation.isSpoiler &&
    annotation.spoilerChapter &&
    userProgress < annotation.spoilerChapter

  const canShowContent = !isSpoilerHidden

  return (
    <Card
      withBorder
      radius="md"
      shadow="sm"
      style={{
        ...getCardStyles(theme, theme.colors.violet[5]),
        borderLeft: `3px solid ${theme.colors.violet[5]}`,
      }}
    >
      <Stack gap="xs">
        {/* Header */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <MessageSquare size={18} color={theme.colors.violet[5]} />
            <Text fw={600} size="sm" c={textColors.primary} truncate>
              {annotation.title}
            </Text>
          </Group>

          <Group gap="xs" wrap="nowrap">
            {annotation.isSpoiler && (
              <Tooltip
                label={
                  isSpoilerHidden
                    ? `Spoiler for Chapter ${annotation.spoilerChapter}+`
                    : 'Contains spoilers'
                }
              >
                <Badge
                  size="xs"
                  variant="light"
                  color="orange"
                  leftSection={<AlertTriangle size={10} />}
                >
                  Spoiler
                </Badge>
              </Tooltip>
            )}

            {isOwner && annotation.status !== AnnotationStatus.APPROVED && (
              <Badge
                size="xs"
                variant="light"
                style={{
                  backgroundColor: `${getStatusColor(annotation.status)}20`,
                  color: getStatusColor(annotation.status),
                  border: `1px solid ${getStatusColor(annotation.status)}40`,
                }}
              >
                {annotation.status}
              </Badge>
            )}

            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </ActionIcon>
          </Group>
        </Group>

        {/* Collapsed preview */}
        {!expanded && canShowContent && (
          <Text size="xs" c={textColors.secondary} lineClamp={2}>
            {annotation.content.substring(0, 150)}
            {annotation.content.length > 150 ? '...' : ''}
          </Text>
        )}

        {/* Spoiler warning when collapsed */}
        {!expanded && !canShowContent && (
          <Box
            p="xs"
            style={{
              backgroundColor: theme.colors.orange[9] + '20',
              borderRadius: theme.radius.sm,
            }}
          >
            <Group gap="xs">
              <AlertTriangle size={14} color={theme.colors.orange[5]} />
              <Text size="xs" c={theme.colors.orange[5]}>
                This annotation contains spoilers for Chapter{' '}
                {annotation.spoilerChapter}+. Update your reading progress to
                view.
              </Text>
            </Group>
          </Box>
        )}

        {/* Expanded content */}
        <Collapse in={expanded}>
          <Stack gap="sm" pt="xs">
            {canShowContent ? (
              <Box
                p="sm"
                style={{
                  backgroundColor: theme.colors.dark[7],
                  borderRadius: theme.radius.sm,
                }}
              >
                <EnhancedSpoilerMarkdown
                  content={annotation.content}
                />
              </Box>
            ) : (
              <Box
                p="md"
                style={{
                  backgroundColor: theme.colors.orange[9] + '20',
                  borderRadius: theme.radius.sm,
                }}
              >
                <Stack gap="xs" align="center">
                  <AlertTriangle size={24} color={theme.colors.orange[5]} />
                  <Text size="sm" c={theme.colors.orange[5]} ta="center">
                    This annotation contains spoilers for Chapter{' '}
                    {annotation.spoilerChapter}+
                  </Text>
                  <Text size="xs" c={textColors.tertiary} ta="center">
                    Update your reading progress to view this content.
                  </Text>
                </Stack>
              </Box>
            )}

            {/* Metadata */}
            <Group justify="space-between" wrap="wrap" gap="xs">
              <Group gap="xs">
                {annotation.sourceUrl && (
                  <Tooltip label="View source">
                    <Anchor
                      href={annotation.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="xs"
                      c={textColors.secondary}
                    >
                      <Group gap={4}>
                        <ExternalLink size={12} />
                        <Text size="xs">Source</Text>
                      </Group>
                    </Anchor>
                  </Tooltip>
                )}

                {annotation.chapterReference && (
                  <Tooltip label="Chapter reference">
                    <Badge
                      size="xs"
                      variant="outline"
                      color="gray"
                      leftSection={<BookOpen size={10} />}
                    >
                      Ch. {annotation.chapterReference}
                    </Badge>
                  </Tooltip>
                )}
              </Group>

              <Group gap="xs">
                <Text size="xs" c={textColors.tertiary}>
                  by {annotation.author?.username || 'Unknown'} on{' '}
                  {formatDate(annotation.createdAt)}
                </Text>

                {isOwner && (
                  <Group gap={4}>
                    {onEdit && (
                      <Tooltip label="Edit annotation">
                        <ActionIcon
                          variant="subtle"
                          size="xs"
                          onClick={() => onEdit(annotation)}
                        >
                          <Edit size={12} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip label="Delete annotation">
                        <ActionIcon
                          variant="subtle"
                          size="xs"
                          color="red"
                          onClick={() => onDelete(annotation.id)}
                        >
                          <Trash2 size={12} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                )}
              </Group>
            </Group>

            {/* Rejection reason */}
            {isOwner &&
              annotation.status === AnnotationStatus.REJECTED &&
              annotation.rejectionReason && (
                <Box
                  p="xs"
                  style={{
                    backgroundColor: theme.colors.red[9] + '20',
                    borderRadius: theme.radius.sm,
                  }}
                >
                  <Text size="xs" c={theme.colors.red[4]}>
                    <strong>Rejection reason:</strong>{' '}
                    {annotation.rejectionReason}
                  </Text>
                </Box>
              )}
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  )
}
