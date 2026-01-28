'use client'

import React, { useEffect, useState } from 'react'
import {
  Card,
  Stack,
  Title,
  Text,
  Group,
  Badge,
  SimpleGrid,
  Skeleton,
  useMantineTheme,
} from '@mantine/core'
import {
  Trophy,
  FileText,
  Image,
  MessageSquare,
  Quote as QuoteIcon,
  Edit,
} from 'lucide-react'
import api from '../../lib/api'
import { UserContributions } from '../../types'
import { textColors, getCardStyles } from '../../lib/mantine-theme'

interface ContributionSummaryProps {
  userId: number
}

interface StatItemProps {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}

function StatItem({ icon, label, value, color }: StatItemProps) {
  return (
    <Group gap="xs">
      <div style={{ color }}>{icon}</div>
      <Text size="sm" c={textColors.secondary}>
        {label}:
      </Text>
      <Badge size="sm" variant="light" color={color}>
        {value}
      </Badge>
    </Group>
  )
}

export default function ContributionSummary({ userId }: ContributionSummaryProps) {
  const theme = useMantineTheme()
  const [contributions, setContributions] = useState<UserContributions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const entityColor = theme.colors.violet[5]

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.getUserContributions(userId)
        setContributions(data)
      } catch (err) {
        console.error('Failed to fetch contributions:', err)
        setError('Failed to load contributions')
      } finally {
        setLoading(false)
      }
    }

    fetchContributions()
  }, [userId])

  if (loading) {
    return (
      <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColor)}>
        <Stack gap="md" p="md">
          <Skeleton height={24} width={200} />
          <Stack gap="sm">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={20} />
            ))}
          </Stack>
        </Stack>
      </Card>
    )
  }

  if (error || !contributions) {
    return null
  }

  // Don't show if no contributions
  if (contributions.totalContributions === 0) {
    return null
  }

  return (
    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColor)}>
      <Stack gap="md" p="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Trophy size={20} color={entityColor} />
            <Title order={4} c={textColors.primary}>
              Contributions
            </Title>
          </Group>
          <Badge size="lg" variant="filled" color="violet">
            {contributions.totalContributions} Total
          </Badge>
        </Group>

        {/* Submissions */}
        {contributions.submissions.total > 0 && (
          <Stack gap="xs">
            <Text size="sm" fw={600} c={textColors.primary}>
              Submissions
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
              {contributions.submissions.guides > 0 && (
                <StatItem
                  icon={<FileText size={16} />}
                  label="Guides"
                  value={contributions.submissions.guides}
                  color={theme.colors.blue[5]}
                />
              )}
              {contributions.submissions.media > 0 && (
                <StatItem
                  icon={<Image size={16} />}
                  label="Media"
                  value={contributions.submissions.media}
                  color={theme.colors.green[5]}
                />
              )}
              {contributions.submissions.annotations > 0 && (
                <StatItem
                  icon={<MessageSquare size={16} />}
                  label="Annotations"
                  value={contributions.submissions.annotations}
                  color={theme.colors.violet[5]}
                />
              )}
              {contributions.submissions.quotes > 0 && (
                <StatItem
                  icon={<QuoteIcon size={16} />}
                  label="Quotes"
                  value={contributions.submissions.quotes}
                  color={theme.colors.pink[5]}
                />
              )}
            </SimpleGrid>
          </Stack>
        )}

        {/* Edits */}
        {contributions.edits.total > 0 && (
          <Stack gap="xs">
            <Text size="sm" fw={600} c={textColors.primary}>
              Edits
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
              {contributions.edits.characters > 0 && (
                <StatItem
                  icon={<Edit size={16} />}
                  label="Characters"
                  value={contributions.edits.characters}
                  color={theme.colors.orange[5]}
                />
              )}
              {contributions.edits.gambles > 0 && (
                <StatItem
                  icon={<Edit size={16} />}
                  label="Gambles"
                  value={contributions.edits.gambles}
                  color={theme.colors.red[5]}
                />
              )}
              {contributions.edits.arcs > 0 && (
                <StatItem
                  icon={<Edit size={16} />}
                  label="Arcs"
                  value={contributions.edits.arcs}
                  color={theme.colors.cyan[5]}
                />
              )}
              {contributions.edits.organizations > 0 && (
                <StatItem
                  icon={<Edit size={16} />}
                  label="Organizations"
                  value={contributions.edits.organizations}
                  color={theme.colors.teal[5]}
                />
              )}
              {contributions.edits.events > 0 && (
                <StatItem
                  icon={<Edit size={16} />}
                  label="Events"
                  value={contributions.edits.events}
                  color={theme.colors.indigo[5]}
                />
              )}
            </SimpleGrid>
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
