'use client'

import React from 'react'
import { Button, ButtonProps, useMantineTheme } from '@mantine/core'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getEntityThemeColor, getAlphaColor, textColors } from '../lib/mantine-theme'

type EntityType = 'character' | 'gamble' | 'arc' | 'organization' | 'event' | 'volume' | 'chapter' | 'guide' | 'media' | 'quote'

interface BackButtonProps extends Omit<ButtonProps, 'component' | 'leftSection' | 'style'> {
  href: string
  label?: string
  entityType?: EntityType
}

export function BackButton({
  href,
  label = 'Back',
  variant = 'subtle',
  entityType,
  mb = 'lg',
  ...props
}: BackButtonProps) {
  const theme = useMantineTheme()
  const entityColor = entityType ? getEntityThemeColor(theme, entityType) : undefined

  return (
    <Button
      component={Link}
      href={href}
      variant={variant}
      c={textColors.secondary}
      leftSection={<ArrowLeft size={18} />}
      mb={mb}
      style={{
        alignSelf: 'flex-start',
        color: textColors.secondary,
        '&:hover': entityColor ? {
          color: textColors.primary,
          backgroundColor: getAlphaColor(entityColor, 0.1)
        } : undefined
      }}
      {...props}
    >
      {label}
    </Button>
  )
}

export default BackButton
