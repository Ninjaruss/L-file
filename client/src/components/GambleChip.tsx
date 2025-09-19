'use client'

import React from 'react'
import { Badge, useMantineTheme, darken, rgba } from '@mantine/core'
import { Dices } from 'lucide-react'
import Link from 'next/link'

interface GambleChipProps {
  gamble: {
    id: number
    name: string
    rules?: string
  }
  size?: 'small' | 'medium'
  variant?: 'filled' | 'outlined'
  onClick?: () => void
  clickable?: boolean
}

export default function GambleChip({
  gamble,
  size = 'medium',
  variant = 'filled',
  onClick,
  clickable = true
}: GambleChipProps) {
  const theme = useMantineTheme()
  const primary = theme.other?.usogui?.red ?? theme.colors.red[6] ?? '#e11d48'
  const backgroundFilled = primary
  const backgroundOutlined = 'transparent'
  const textColorFilled = '#ffffff'
  const textColorOutlined = primary

  const badgeSize = size === 'small' ? 'xs' : 'sm'

  const hoverBackgroundFilled = darken(backgroundFilled, 0.1)
  const hoverBackgroundOutlined = rgba(primary, 0.1)

  const badge = (
    <Badge
      size={badgeSize}
      radius="lg"
      leftSection={<Dices size={16} />}
      onClick={onClick}
      styles={{
        root: {
          backgroundColor: variant === 'filled' ? backgroundFilled : backgroundOutlined,
          color: variant === 'filled' ? textColorFilled : textColorOutlined,
          border: variant === 'outlined' ? `1px solid ${primary}` : 'none',
          fontWeight: 700,
          cursor: clickable || onClick ? 'pointer' : 'default',
          transition: 'all 0.2s ease-in-out',
          boxShadow: variant === 'filled' ? '0 2px 4px rgba(225, 29, 72, 0.3)' : 'none',
          '&:hover': clickable || onClick ? {
            backgroundColor: variant === 'filled' ? hoverBackgroundFilled : hoverBackgroundOutlined,
            color: textColorFilled,
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 6px rgba(225, 29, 72, 0.25)'
          } : undefined
        },
        leftSection: {
          color: variant === 'filled' ? textColorFilled : textColorOutlined
        }
      }}
    >
      {gamble.name}
    </Badge>
  )

  if (onClick) {
    return badge
  }

  if (clickable) {
    return (
      <Link href={`/gambles/${gamble.id}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
        {badge}
      </Link>
    )
  }

  return badge
}
