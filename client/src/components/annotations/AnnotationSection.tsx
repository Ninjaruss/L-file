'use client'

import React, { useEffect, useState } from 'react'
import {
  Card,
  Group,
  Stack,
  Text,
  Title,
  Button,
  Collapse,
  Skeleton,
  Badge,
  useMantineTheme,
} from '@mantine/core'
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import api from '../../lib/api'
import { Annotation, AnnotationOwnerType } from '../../types'
import { textColors, getCardStyles, getEntityThemeColor } from '../../lib/mantine-theme'
import AnnotationCard from './AnnotationCard'

interface AnnotationSectionProps {
  ownerType: AnnotationOwnerType
  ownerId: number
  userProgress?: number
  currentUserId?: number
  isAuthenticated?: boolean
}

export default function AnnotationSection({
  ownerType,
  ownerId,
  userProgress = 999,
  currentUserId,
  isAuthenticated = false,
}: AnnotationSectionProps) {
  const theme = useMantineTheme()
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const entityColor = theme.colors.violet[5]

  useEffect(() => {
    const fetchAnnotations = async () => {
      try {
        setLoading(true)
        setError(null)

        let result: Annotation[]
        switch (ownerType) {
          case AnnotationOwnerType.CHARACTER:
            result = await api.getAnnotationsForCharacter(ownerId)
            break
          case AnnotationOwnerType.GAMBLE:
            result = await api.getAnnotationsForGamble(ownerId)
            break
          case AnnotationOwnerType.CHAPTER:
            result = await api.getAnnotationsForChapter(ownerId)
            break
          case AnnotationOwnerType.ARC:
            result = await api.getAnnotationsForArc(ownerId)
            break
          default:
            result = []
        }

        setAnnotations(result)
      } catch (err) {
        console.error('Failed to fetch annotations:', err)
        setError('Failed to load annotations')
      } finally {
        setLoading(false)
      }
    }

    fetchAnnotations()
  }, [ownerType, ownerId])

  const handleDelete = async (annotationId: number) => {
    if (!confirm('Are you sure you want to delete this annotation?')) {
      return
    }

    try {
      await api.deleteAnnotation(annotationId)
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId))
    } catch (err) {
      console.error('Failed to delete annotation:', err)
      alert('Failed to delete annotation')
    }
  }

  // Don't render if loading and no annotations, or if there's an error
  if (loading) {
    return (
      <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColor)}>
        <Stack gap="md" p="md">
          <Group gap="sm">
            <Skeleton circle height={24} width={24} />
            <Skeleton height={20} width={150} />
          </Group>
          <Stack gap="sm">
            {[1, 2].map((i) => (
              <Skeleton key={i} height={80} />
            ))}
          </Stack>
        </Stack>
      </Card>
    )
  }

  if (error) {
    return null
  }

  // Don't show section if no annotations and user is not authenticated
  if (annotations.length === 0 && !isAuthenticated) {
    return null
  }

  return (
    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColor)}>
      <Stack gap="md" p="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <MessageSquare size={20} color={entityColor} />
            <Title order={4} c={textColors.primary}>
              Annotations
            </Title>
            {annotations.length > 0 && (
              <Badge size="sm" variant="light" color="violet">
                {annotations.length}
              </Badge>
            )}
          </Group>

          <Group gap="sm">
            {isAuthenticated && (
              <Button
                component={Link}
                href={`/submit-annotation?type=${ownerType}&id=${ownerId}`}
                size="xs"
                variant="light"
                color="violet"
                leftSection={<Plus size={14} />}
              >
                Add
              </Button>
            )}

            {annotations.length > 0 && (
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setExpanded(!expanded)}
                rightSection={
                  expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                }
              >
                {expanded ? 'Collapse' : 'Expand'}
              </Button>
            )}
          </Group>
        </Group>

        {/* Empty state */}
        {annotations.length === 0 && (
          <Text size="sm" c={textColors.tertiary} ta="center" py="md">
            No annotations yet.
            {isAuthenticated
              ? ' Be the first to add one!'
              : ' Log in to add annotations.'}
          </Text>
        )}

        {/* Annotation list */}
        {annotations.length > 0 && (
          <>
            {/* Preview (first 2 annotations) */}
            {!expanded && (
              <Stack gap="sm">
                {annotations.slice(0, 2).map((annotation) => (
                  <AnnotationCard
                    key={annotation.id}
                    annotation={annotation}
                    userProgress={userProgress}
                    isOwner={currentUserId === annotation.authorId}
                    onDelete={
                      currentUserId === annotation.authorId
                        ? handleDelete
                        : undefined
                    }
                  />
                ))}
                {annotations.length > 2 && (
                  <Text size="xs" c={textColors.tertiary} ta="center">
                    +{annotations.length - 2} more annotation
                    {annotations.length - 2 !== 1 ? 's' : ''}
                  </Text>
                )}
              </Stack>
            )}

            {/* Full list */}
            <Collapse in={expanded}>
              <Stack gap="sm">
                {annotations.map((annotation) => (
                  <AnnotationCard
                    key={annotation.id}
                    annotation={annotation}
                    userProgress={userProgress}
                    isOwner={currentUserId === annotation.authorId}
                    onDelete={
                      currentUserId === annotation.authorId
                        ? handleDelete
                        : undefined
                    }
                  />
                ))}
              </Stack>
            </Collapse>
          </>
        )}
      </Stack>
    </Card>
  )
}
