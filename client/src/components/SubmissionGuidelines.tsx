'use client'

import React from 'react'
import { Alert, List, Text } from '@mantine/core'
import { Info } from 'lucide-react'

interface SubmissionGuidelinesProps {
  type: 'guide' | 'media' | 'event' | 'annotation'
}

export default function SubmissionGuidelines({ type }: SubmissionGuidelinesProps) {
  const guidelines = {
    guide: {
      title: '📝 Writing a Great Guide',
      tips: [
        'Focus on analysis and insights, not plot summaries',
        'Include specific chapter references for context',
        'Use markdown formatting for readability',
        'Link to relevant characters, arcs, and gambles',
        'Minimum 100 characters for meaningful content'
      ]
    },
    media: {
      title: '🎨 Media Submission Guidelines',
      tips: [
        'Credit the original artist when known',
        'Tag relevant characters, arcs, or gambles',
        'Use descriptive titles and descriptions',
        'Supported platforms: YouTube, TikTok, Instagram, DeviantArt, Pixiv, SoundCloud',
        'For images: Use the Upload tab (max 5MB)'
      ]
    },
    event: {
      title: '📅 Documenting Story Events',
      tips: [
        'Focus on significant story moments and turning points',
        'Be specific about chapter number and timing',
        'Link to characters involved in the event',
        'Mark appropriate spoiler chapter threshold',
        'Choose the right event type: Gamble, Decision, Reveal, Shift, or Resolution'
      ]
    },
    annotation: {
      title: '💭 Writing Helpful Annotations',
      tips: [
        'Provide analysis and commentary, not recaps',
        'Cite chapter references when relevant',
        'Share insights and connections others might miss',
        'Keep focused and concise',
        'Mark spoilers appropriately with chapter numbers'
      ]
    }
  }

  const content = guidelines[type]

  return (
    <Alert variant="light" color="blue" icon={<Info size={16} />} mb="lg">
      <Text size="sm" fw={600} mb="xs">{content.title}</Text>
      <List size="sm" spacing="xs">
        {content.tips.map((tip, i) => <List.Item key={i}>{tip}</List.Item>)}
      </List>
    </Alert>
  )
}
