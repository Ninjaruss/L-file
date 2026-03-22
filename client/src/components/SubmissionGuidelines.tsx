'use client'

import React, { useState } from 'react'
import { Box, Collapse, Group, List, Text, ThemeIcon, UnstyledButton, rem } from '@mantine/core'
import { BookOpen, Camera, Calendar, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

interface SubmissionGuidelinesProps {
  type: 'guide' | 'media' | 'event' | 'annotation'
  accentColor?: string
}

const DEFAULT_ACCENT = 'rgba(255,255,255,0.4)'

export default function SubmissionGuidelines({ type, accentColor = DEFAULT_ACCENT }: SubmissionGuidelinesProps) {
  const [open, setOpen] = useState(true)

  const guidelines = {
    guide: {
      label: 'Writing a Great Guide',
      Icon: BookOpen,
      tips: [
        'Focus on analysis and insights, not plot summaries',
        'Include specific chapter references for context',
        'Use markdown formatting for readability',
        'Link to relevant characters, arcs, and gambles',
        'Minimum 100 characters for meaningful content'
      ]
    },
    media: {
      label: 'Media Submission Guidelines',
      Icon: Camera,
      tips: [
        'Credit the original artist when known',
        'Tag relevant characters, arcs, or gambles',
        'Use descriptive titles and descriptions',
        'Supported platforms: YouTube, DeviantArt, Pixiv, Twitter/X, Instagram',
        'For images: Use the Upload tab (max 5MB)'
      ]
    },
    event: {
      label: 'Documenting Story Events',
      Icon: Calendar,
      tips: [
        'Focus on significant story moments and turning points',
        'Be specific about chapter number and timing',
        'Link to characters involved in the event',
        'Mark appropriate spoiler chapter threshold',
        'Choose the right event type: Gamble, Decision, Reveal, Shift, or Resolution'
      ]
    },
    annotation: {
      label: 'Writing Helpful Annotations',
      Icon: MessageSquare,
      tips: [
        'Provide analysis and commentary, not recaps',
        'Cite chapter references when relevant',
        'Share insights and connections others might miss',
        'Keep focused and concise',
        'Mark spoilers appropriately with chapter numbers'
      ]
    }
  }

  const { label, Icon, tips } = guidelines[type]

  return (
    <Box
      mb="lg"
      style={{
        backgroundColor: `${accentColor}08`,
        border: `1px solid ${accentColor}22`,
        borderRadius: rem(10),
        overflow: 'hidden'
      }}
    >
      <UnstyledButton
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', padding: `${rem(12)} ${rem(16)}` }}
      >
        <Group justify="space-between" align="center">
          <Group gap="sm" align="center">
            <ThemeIcon
              size="sm"
              variant="transparent"
              style={{ color: accentColor }}
            >
              <Icon size={15} />
            </ThemeIcon>
            <Text size="sm" fw={600} style={{ color: accentColor }}>
              {label}
            </Text>
          </Group>
          <Box style={{ color: 'rgba(255,255,255,0.3)' }}>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Box>
        </Group>
      </UnstyledButton>

      <Collapse in={open}>
        <Box style={{ padding: `0 ${rem(16)} ${rem(14)} ${rem(16)}` }}>
          <List
            size="sm"
            spacing={4}
            styles={{ item: { color: 'rgba(255,255,255,0.55)' } }}
          >
            {tips.map((tip, i) => (
              <List.Item key={i}>{tip}</List.Item>
            ))}
          </List>
        </Box>
      </Collapse>
    </Box>
  )
}
