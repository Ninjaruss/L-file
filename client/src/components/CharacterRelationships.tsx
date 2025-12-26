'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Card,
  Group,
  Stack,
  Text,
  Title,
  Badge,
  Loader,
  useMantineTheme
} from '@mantine/core'
import { Users, Heart, Swords, GraduationCap, UserMinus, Home, Handshake, Skull, UserPlus } from 'lucide-react'
import Link from 'next/link'
import {
  getEntityThemeColor,
  textColors,
  getAlphaColor,
  spacing,
  getCardStyles
} from '../lib/mantine-theme'
import TimelineSpoilerWrapper from './TimelineSpoilerWrapper'
import MediaThumbnail from './MediaThumbnail'
import api from '../lib/api'
import { RelationshipType, type CharacterRelationship } from '../types'

interface CharacterRelationshipsProps {
  characterId: number
  characterName: string
}

// Relationship type configuration
const relationshipConfig: Record<RelationshipType, {
  label: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  color: string
  description: string
}> = {
  ally: {
    label: 'Allies',
    icon: Handshake,
    color: '#22c55e',
    description: 'Characters who fight together or support each other'
  },
  rival: {
    label: 'Rivals',
    icon: Swords,
    color: '#f97316',
    description: 'Competitive or opposing characters'
  },
  mentor: {
    label: 'Mentors',
    icon: GraduationCap,
    color: '#8b5cf6',
    description: 'Characters who teach or guide'
  },
  subordinate: {
    label: 'Subordinates',
    icon: UserMinus,
    color: '#06b6d4',
    description: 'Characters who work under this character'
  },
  family: {
    label: 'Family',
    icon: Home,
    color: '#ec4899',
    description: 'Blood relations or family bonds'
  },
  partner: {
    label: 'Partners',
    icon: Heart,
    color: '#ef4444',
    description: 'Gambling partners or close collaborators'
  },
  enemy: {
    label: 'Enemies',
    icon: Skull,
    color: '#dc2626',
    description: 'Direct opposition or antagonism'
  },
  acquaintance: {
    label: 'Acquaintances',
    icon: UserPlus,
    color: '#6b7280',
    description: 'Known but not closely related'
  }
}

// Display order for relationship types
const typeOrder: RelationshipType[] = [
  RelationshipType.PARTNER,
  RelationshipType.ALLY,
  RelationshipType.FAMILY,
  RelationshipType.MENTOR,
  RelationshipType.RIVAL,
  RelationshipType.ENEMY,
  RelationshipType.SUBORDINATE,
  RelationshipType.ACQUAINTANCE
]

export default function CharacterRelationships({
  characterId,
  characterName
}: CharacterRelationshipsProps) {
  const theme = useMantineTheme()
  const [relationships, setRelationships] = useState<{
    outgoing: CharacterRelationship[]
    incoming: CharacterRelationship[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const entityColor = getEntityThemeColor(theme, 'character')

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        setLoading(true)
        // Fetch all relationships - spoiler protection is handled by TimelineSpoilerWrapper
        const data = await api.getCharacterRelationships(characterId)
        setRelationships(data)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch relationships:', err)
        setError('Failed to load relationships')
      } finally {
        setLoading(false)
      }
    }

    fetchRelationships()
  }, [characterId])

  // Group outgoing relationships by type (how this character sees others)
  const groupedOutgoing = useMemo(() => {
    if (!relationships?.outgoing) return {}

    const grouped: Partial<Record<RelationshipType, CharacterRelationship[]>> = {}

    for (const rel of relationships.outgoing) {
      const type = rel.relationshipType
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type]!.push(rel)
    }

    return grouped
  }, [relationships])

  // Group incoming relationships by type (how others see this character)
  const groupedIncoming = useMemo(() => {
    if (!relationships?.incoming) return {}

    const grouped: Partial<Record<RelationshipType, CharacterRelationship[]>> = {}

    for (const rel of relationships.incoming) {
      const type = rel.relationshipType
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type]!.push(rel)
    }

    return grouped
  }, [relationships])

  // Check if there are any relationships to display
  const hasOutgoing = relationships?.outgoing && relationships.outgoing.length > 0
  const hasIncoming = relationships?.incoming && relationships.incoming.length > 0
  const hasRelationships = hasOutgoing || hasIncoming

  if (loading) {
    return (
      <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColor)}>
        <Stack gap={spacing.md} p={spacing.lg} align="center">
          <Loader color={entityColor} size="sm" />
          <Text size="sm" c={textColors.tertiary}>Loading relationships...</Text>
        </Stack>
      </Card>
    )
  }

  if (error) {
    return (
      <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColor)}>
        <Stack gap={spacing.md} p={spacing.lg} align="center">
          <Text size="sm" c="red">{error}</Text>
        </Stack>
      </Card>
    )
  }

  if (!hasRelationships) {
    return null // Don't render section if no relationships
  }

  return (
    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColor)}>
      <Stack gap={spacing.md} p={spacing.lg}>
        <Group gap={spacing.sm} align="center">
          <Users size={24} color={entityColor} />
          <Title order={3} c={textColors.primary}>
            Relationships
          </Title>
        </Group>

        {/* Outgoing relationships - how this character sees others */}
        {hasOutgoing && (
          <Stack gap={spacing.lg}>
            <Text size="sm" fw={600} c={textColors.secondary} tt="uppercase" style={{ letterSpacing: '0.05em' }}>
              {characterName}&apos;s relationships
            </Text>

            {typeOrder.map((type) => {
              const rels = groupedOutgoing[type]
              if (!rels || rels.length === 0) return null

              const config = relationshipConfig[type]
              const Icon = config.icon

              return (
                <Box key={`outgoing-${type}`}>
                  <Group gap={spacing.sm} mb={spacing.sm}>
                    <Icon size={18} color={config.color} />
                    <Text size="sm" fw={600} c={textColors.secondary}>
                      {config.label}
                    </Text>
                    <Badge size="sm" variant="light" color="gray">
                      {rels.length}
                    </Badge>
                  </Group>

                  <Group gap={spacing.md} wrap="wrap">
                    {rels.map((rel) => (
                      <RelationshipCard
                        key={rel.id}
                        relationship={rel}
                        config={config}
                        direction="outgoing"
                      />
                    ))}
                  </Group>
                </Box>
              )
            })}
          </Stack>
        )}

        {/* Incoming relationships - how others see this character */}
        {hasIncoming && (
          <Stack gap={spacing.lg}>
            {hasOutgoing && (
              <Box style={{ borderTop: `1px solid ${getAlphaColor(entityColor, 0.2)}`, paddingTop: spacing.md }} />
            )}

            <Text size="sm" fw={600} c={textColors.secondary} tt="uppercase" style={{ letterSpacing: '0.05em' }}>
              Others&apos; views of {characterName}
            </Text>

            {typeOrder.map((type) => {
              const rels = groupedIncoming[type]
              if (!rels || rels.length === 0) return null

              const config = relationshipConfig[type]
              const Icon = config.icon

              return (
                <Box key={`incoming-${type}`}>
                  <Group gap={spacing.sm} mb={spacing.sm}>
                    <Icon size={18} color={config.color} />
                    <Text size="sm" fw={600} c={textColors.secondary}>
                      Seen as {config.label.toLowerCase().replace(/s$/, '')}
                    </Text>
                    <Badge size="sm" variant="light" color="gray">
                      {rels.length}
                    </Badge>
                  </Group>

                  <Group gap={spacing.md} wrap="wrap">
                    {rels.map((rel) => (
                      <RelationshipCard
                        key={rel.id}
                        relationship={rel}
                        config={config}
                        direction="incoming"
                      />
                    ))}
                  </Group>
                </Box>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}

interface RelationshipCardProps {
  relationship: CharacterRelationship
  config: {
    label: string
    icon: React.ComponentType<{ size?: number; color?: string }>
    color: string
    description: string
  }
  direction: 'outgoing' | 'incoming'
}

function RelationshipCard({ relationship, config, direction }: RelationshipCardProps) {
  const theme = useMantineTheme()

  // For outgoing: show target character
  // For incoming: show source character
  const linkedCharacter = direction === 'outgoing'
    ? relationship.targetCharacter
    : relationship.sourceCharacter

  if (!linkedCharacter) return null

  const chapterRange = relationship.endChapter
    ? `Ch. ${relationship.startChapter} - ${relationship.endChapter}`
    : `Ch. ${relationship.startChapter}+`

  return (
    <TimelineSpoilerWrapper chapterNumber={relationship.spoilerChapter}>
      <Link href={`/characters/${linkedCharacter.id}`} style={{ textDecoration: 'none' }}>
        <Card
          withBorder
          radius="md"
          p={spacing.sm}
          style={{
            background: getAlphaColor(config.color, 0.08),
            border: `1px solid ${getAlphaColor(config.color, 0.25)}`,
            cursor: 'pointer',
            transition: 'all 200ms ease',
            minWidth: 200,
            maxWidth: 280
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = theme.shadows.md
            e.currentTarget.style.borderColor = getAlphaColor(config.color, 0.5)
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
            e.currentTarget.style.borderColor = getAlphaColor(config.color, 0.25)
          }}
        >
          <Group gap={spacing.sm} wrap="nowrap">
            {/* Character thumbnail - no spoilerChapter since parent TimelineSpoilerWrapper handles it */}
            <Box style={{ flexShrink: 0, width: 48, height: 48 }}>
              <MediaThumbnail
                entityType="character"
                entityId={linkedCharacter.id}
                maxWidth={48}
                maxHeight={48}
              />
            </Box>

            <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
              <Text
                size="sm"
                fw={600}
                c={textColors.primary}
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {linkedCharacter.name}
              </Text>

              <Group gap={spacing.xs}>
                <Badge
                  size="xs"
                  variant="light"
                  style={{
                    background: getAlphaColor(config.color, 0.2),
                    color: config.color,
                    border: `1px solid ${getAlphaColor(config.color, 0.3)}`
                  }}
                >
                  {chapterRange}
                </Badge>
              </Group>

              {relationship.description && (
                <Text
                  size="xs"
                  c={textColors.tertiary}
                  lineClamp={2}
                  style={{ lineHeight: 1.4 }}
                >
                  {relationship.description}
                </Text>
              )}
            </Stack>
          </Group>
        </Card>
      </Link>
    </TimelineSpoilerWrapper>
  )
}
