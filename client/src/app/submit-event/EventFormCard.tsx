'use client'

import React from 'react'
import {
  ActionIcon,
  Box,
  Card,
  Collapse,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  useMantineTheme
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { ChevronDown, ChevronUp, Trash2, GripVertical } from 'lucide-react'
import styles from './SubmitEventPageContent.module.css'
import { getInputStyles, getDimmedInputStyles, getMultiSelectStyles } from '../../lib/submitFormStyles'

const MIN_TITLE_LENGTH = 3
const MIN_DESCRIPTION_LENGTH = 10

const EVENT_TYPE_OPTIONS = [
  { value: 'gamble', label: 'Gamble' },
  { value: 'decision', label: 'Decision' },
  { value: 'reveal', label: 'Reveal' },
  { value: 'shift', label: 'Shift' },
  { value: 'resolution', label: 'Resolution' }
]

export interface EventFormData {
  title: string
  description: string
  chapterNumber: number | ''
  pageNumber: number | ''
  type: string
  spoilerChapter: number | ''
  characterIds: number[]
}

interface EventFormCardProps {
  index: number
  data: EventFormData
  onChange: (data: EventFormData) => void
  onRemove: () => void
  canRemove: boolean
  characterOptions: Array<{ value: string; label: string }>
  accentColor: string
}

export default function EventFormCard({
  index,
  data,
  onChange,
  onRemove,
  canRemove,
  characterOptions,
  accentColor
}: EventFormCardProps) {
  const theme = useMantineTheme()
  const [expanded, { toggle }] = useDisclosure(true)

  const inputStyles = getInputStyles(theme, accentColor)
  const dimmedInputStyles = getDimmedInputStyles(theme)
  const multiSelectStyles = getMultiSelectStyles(theme, accentColor)

  const handleChange = (field: keyof EventFormData, value: unknown) => {
    onChange({ ...data, [field]: value })
  }

  const isValid = data.title.trim().length >= MIN_TITLE_LENGTH &&
    data.description.trim().length >= MIN_DESCRIPTION_LENGTH &&
    data.chapterNumber && data.chapterNumber >= 1

  const cardTitle = data.title.trim() || `Event ${index + 1}`

  return (
    <Card
      withBorder
      radius="md"
      style={{
        backgroundColor: theme.colors.dark?.[6] ?? '#0d0d0d',
        borderColor: isValid ? `${accentColor}50` : 'rgba(255, 255, 255, 0.1)',
        borderLeft: isValid ? `3px solid ${accentColor}70` : '3px solid rgba(255,255,255,0.08)',
        transition: 'border-color 0.2s ease'
      }}
    >
      <Group justify="space-between" p="md" style={{ cursor: 'pointer' }} onClick={toggle}>
        <Group gap="sm">
          <Box style={{ cursor: 'grab', color: 'rgba(255, 255, 255, 0.3)' }}>
            <GripVertical size={16} />
          </Box>
          <Text fw={600} c={isValid ? accentColor : 'dimmed'}>{cardTitle}</Text>
          {isValid && (
            <Text size="xs" style={{ color: accentColor, opacity: 0.7 }}>Ready</Text>
          )}
        </Group>
        <Group gap="xs">
          {canRemove && (
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onRemove() }}
            >
              <Trash2 size={16} />
            </ActionIcon>
          )}
          <ActionIcon variant="subtle" size="sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </ActionIcon>
        </Group>
      </Group>

      <Collapse in={expanded}>
        <Stack gap="md" p="md" pt={0}>
          <TextInput
            label="Event Title"
            placeholder="e.g., 'Baku reveals the winning card'"
            value={data.title}
            onChange={(e) => handleChange('title', e.currentTarget.value)}
            required
            error={data.title.length > 0 && data.title.trim().length < MIN_TITLE_LENGTH ? `Minimum ${MIN_TITLE_LENGTH} characters` : undefined}
            styles={inputStyles}
          />

          <Textarea
            label="Description"
            placeholder="Describe what happens in this event…"
            value={data.description}
            onChange={(e) => handleChange('description', e.currentTarget.value)}
            required
            minRows={3}
            autosize
            error={data.description.length > 0 && data.description.trim().length < MIN_DESCRIPTION_LENGTH ? `Minimum ${MIN_DESCRIPTION_LENGTH} characters` : undefined}
            styles={dimmedInputStyles}
          />

          <Group grow>
            <NumberInput
              label="Chapter"
              placeholder="Chapter #"
              value={data.chapterNumber}
              onChange={(value) => handleChange('chapterNumber', value)}
              required
              min={1}
              styles={inputStyles}
            />
            <NumberInput
              label="Page Number"
              description="Optional. Helps order events within the same chapter."
              placeholder="e.g. 14"
              min={1}
              value={data.pageNumber}
              onChange={(val) => onChange({ ...data, pageNumber: val as number | '' })}
              styles={inputStyles}
            />
            <Select
              label="Type"
              placeholder="Select type"
              value={data.type || null}
              onChange={(value) => handleChange('type', value || '')}
              data={EVENT_TYPE_OPTIONS}
              clearable
              styles={dimmedInputStyles}
              classNames={{ option: styles.selectOption }}
            />
          </Group>

          <Group grow>
            <NumberInput
              label="Spoiler Chapter"
              placeholder="Optional"
              value={data.spoilerChapter}
              onChange={(value) => handleChange('spoilerChapter', value)}
              min={1}
              description="Readers must reach this chapter"
              styles={dimmedInputStyles}
            />
            <MultiSelect
              label="Characters"
              placeholder="Select characters"
              value={data.characterIds.map(String)}
              onChange={(values) => handleChange('characterIds', values.map((v) => parseInt(v)))}
              data={characterOptions}
              searchable
              clearable
              maxDropdownHeight={200}
              styles={multiSelectStyles}
              classNames={{ option: styles.selectOption }}
            />
          </Group>
        </Stack>
      </Collapse>
    </Card>
  )
}
