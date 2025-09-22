'use client'

import React from 'react'
import {
  Alert,
  Badge,
  Box,
  Card,
  Divider,
  Group,
  Slider,
  Stack,
  Switch,
  Text,
  Title,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor, semanticColors, textColors } from '../lib/mantine-theme'
import { Settings, Eye, EyeOff } from 'lucide-react'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'

const SpoilerSettings: React.FC = () => {
  const { settings, updateChapterTolerance, toggleShowAllSpoilers } = useSpoilerSettings()
  const theme = useMantineTheme()

  const handleChapterChange = (value: number) => {
    updateChapterTolerance(value)
  }

  return (
    <Card withBorder radius="md" padding="xl">
      <Stack gap="lg">
        <Group align="center" gap="sm">
          <Settings size={24} />
          <Title order={3}>
            Spoiler Settings
          </Title>
        </Group>

        <Alert style={{ color: getEntityThemeColor(theme, 'character') }} radius="md">
          Configure how spoilers are handled throughout the site. You can always reveal individual spoilers by clicking on them.
        </Alert>

        <Stack gap="sm">
          <Title order={5}>Reading Progress</Title>
          <Text size="sm" c="dimmed">
            Hide spoilers beyond chapter {settings.chapterTolerance}
          </Text>

          <Box style={{ paddingInline: theme.spacing.sm }}>
            <Slider
              value={settings.chapterTolerance}
              onChange={handleChapterChange}
              min={0}
              max={539}
              step={1}
              marks={[
                { value: 0, label: 'Start' },
                { value: 100, label: '100' },
                { value: 200, label: '200' },
                { value: 300, label: '300' },
                { value: 400, label: '400' },
                { value: 539, label: 'End' }
              ]}
              labelAlwaysOn
              style={{ color: getEntityThemeColor(theme, 'gamble') }}
            />
          </Box>
        </Stack>

        <Divider my="md" color="rgba(255, 255, 255, 0.12)" />

        <Switch
          checked={settings.showAllSpoilers}
          onChange={toggleShowAllSpoilers}
          label={
            <Stack gap={2}>
              <Text fw={600}>Show All Spoilers</Text>
              <Text size="sm" c="dimmed">
                Override chapter tolerance and show all content
              </Text>
            </Stack>
          }
          size="md"
          thumbIcon={settings.showAllSpoilers ? <Eye size={14} /> : <EyeOff size={14} />}
        />

        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            Current Status:
          </Text>
          <Group gap="xs" wrap="wrap">
            <Badge variant="outline" style={{ color: getEntityThemeColor(theme, 'gamble') }}>
              Reading up to Chapter {settings.chapterTolerance}
            </Badge>
            {settings.showAllSpoilers && (
              <Badge style={{ color: semanticColors.warning }} variant="filled">
                All spoilers visible
              </Badge>
            )}
          </Group>
        </Stack>
      </Stack>
    </Card>
  )
}

export default SpoilerSettings
