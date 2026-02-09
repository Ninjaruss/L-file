'use client'

import React from 'react'
import { Button, Card, Group, List, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SubmissionSuccessProps {
  type: 'guide' | 'media' | 'event' | 'annotation'
  isEdit?: boolean
  onSubmitAnother: () => void
}

export default function SubmissionSuccess({ type, isEdit = false, onSubmitAnother }: SubmissionSuccessProps) {
  const router = useRouter()

  const typeLabels = {
    guide: 'Guide',
    media: 'Media',
    event: 'Event',
    annotation: 'Annotation'
  }

  const label = typeLabels[type]
  const action = isEdit ? 'Resubmitted' : 'Submitted'

  return (
    <Card withBorder padding="lg" radius="md" bg="green.0" mb="lg">
      <Stack gap="md">
        <Group>
          <ThemeIcon color="green" size="lg" radius="xl">
            <Check size={20} />
          </ThemeIcon>
          <Title order={4}>{label} {action} Successfully!</Title>
        </Group>

        <Text size="sm">
          <strong>What happens next:</strong>
        </Text>
        <List size="sm" spacing="xs">
          <List.Item>Moderators will review your submission within 48 hours</List.Item>
          <List.Item>Check the status on your Profile page</List.Item>
          <List.Item>Your {label.toLowerCase()} will appear publicly once approved</List.Item>
          {isEdit && <List.Item>Your submission is now pending review again</List.Item>}
        </List>

        <Group gap="sm" mt="xs">
          <Button onClick={() => router.push('/profile')} variant="light">
            View My Submissions
          </Button>
          <Button onClick={onSubmitAnother} variant="outline">
            Submit Another {label}
          </Button>
        </Group>
      </Stack>
    </Card>
  )
}
