'use client'

import React from 'react'
import { Box, Group, Stack, Text, rem } from '@mantine/core'

interface FormSectionProps {
  title: string
  description?: string
  icon?: React.ReactNode
  accentColor: string
  required?: boolean
  stepNumber?: number
  hasValue?: boolean
  children: React.ReactNode
}

export function FormSection({
  title,
  description,
  icon,
  accentColor,
  required,
  stepNumber,
  hasValue = false,
  children
}: FormSectionProps) {
  return (
    <Box
      style={{
        padding: rem(24),
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: rem(12),
        border: `1px solid ${accentColor}25`,
        borderLeft: hasValue
          ? `3px solid ${accentColor}90`
          : `3px solid ${accentColor}60`,
        position: 'relative'
      }}
    >
      {stepNumber !== undefined && (
        <Box
          style={{
            position: 'absolute',
            top: rem(16),
            right: rem(16),
            width: rem(22),
            height: rem(22),
            borderRadius: '50%',
            backgroundColor: `${accentColor}18`,
            border: `1px solid ${accentColor}35`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Text size="xs" fw={700} style={{ color: accentColor, lineHeight: 1 }}>
            {stepNumber}
          </Text>
        </Box>
      )}

      <Stack gap="md">
        <Group gap="sm">
          {icon}
          <Text fw={600} c={accentColor}>
            {title}
            {required && (
              <Text component="span" c="red.5" ml={4}>
                *
              </Text>
            )}
          </Text>
        </Group>
        {description && (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}
        {children}
      </Stack>
    </Box>
  )
}

export default FormSection
