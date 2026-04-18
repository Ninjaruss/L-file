'use client'

import React from 'react'
import { Box, Button, Group, List, Stack, Text, ThemeIcon, Title, rem } from '@mantine/core'
import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'

interface SubmissionSuccessProps {
  type: 'guide' | 'media' | 'event' | 'annotation'
  isEdit?: boolean
  accentColor?: string
  requiresApproval?: boolean
  onSubmitAnother: () => void
}

const DEFAULT_ACCENT = '#22c55e'

export default function SubmissionSuccess({
  type,
  isEdit = false,
  accentColor = DEFAULT_ACCENT,
  requiresApproval = true,
  onSubmitAnother
}: SubmissionSuccessProps) {
  const router = useRouter()

  const typeLabels: Record<string, string> = {
    guide: 'Guide',
    media: 'Media',
    event: 'Event',
    annotation: 'Annotation'
  }

  const label = typeLabels[type]
  const action = isEdit ? 'Resubmitted' : 'Submitted'

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Box
        mb="lg"
        style={{
          backgroundColor: `${accentColor}0d`,
          border: `1px solid ${accentColor}40`,
          borderRadius: rem(12),
          padding: rem(24),
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top accent line */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: rem(2),
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
            borderRadius: `${rem(12)} ${rem(12)} 0 0`
          }}
        />

        <Stack gap="md">
          <Group align="center" gap="sm">
            <ThemeIcon
              radius="xl"
              size="lg"
              style={{
                backgroundColor: `${accentColor}20`,
                color: accentColor,
                border: `1px solid ${accentColor}40`
              }}
            >
              <Check size={18} />
            </ThemeIcon>
            <Title
              order={4}
              style={{
                fontFamily: 'var(--font-opti-goudy-text)',
                fontWeight: 400,
                color: '#fff'
              }}
            >
              {label} {action} Successfully
            </Title>
          </Group>

          <Text size="sm" c="dimmed" fw={500}>
            What happens next
          </Text>

          {requiresApproval ? (
            <>
              <List
                size="sm"
                spacing="xs"
                styles={{ item: { color: 'rgba(255,255,255,0.7)' } }}
              >
                <List.Item>Moderators will review your submission within 48 hours</List.Item>
                <List.Item>Check the status on your Profile page</List.Item>
                <List.Item>Your {label.toLowerCase()} will appear publicly once approved</List.Item>
                {isEdit && <List.Item>Your submission is now pending review again</List.Item>}
              </List>

              <Group gap="sm" mt="xs">
                <Button
                  onClick={() => router.push('/profile')}
                  variant="light"
                  size="sm"
                  style={{
                    backgroundColor: `${accentColor}18`,
                    color: accentColor,
                    border: `1px solid ${accentColor}35`
                  }}
                >
                  View My Submissions
                </Button>
                <Button
                  onClick={onSubmitAnother}
                  variant="subtle"
                  size="sm"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  Submit Another {label}
                </Button>
              </Group>
            </>
          ) : (
            <>
              <List
                size="sm"
                spacing="xs"
                styles={{ item: { color: 'rgba(255,255,255,0.7)' } }}
              >
                <List.Item>Your {label.toLowerCase()} is now live and publicly visible.</List.Item>
              </List>

              <Group gap="sm" mt="xs">
                <Button
                  onClick={onSubmitAnother}
                  variant="light"
                  size="sm"
                  style={{
                    backgroundColor: `${accentColor}18`,
                    color: accentColor,
                    border: `1px solid ${accentColor}35`
                  }}
                >
                  Submit Another {label}
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Box>
    </motion.div>
  )
}
