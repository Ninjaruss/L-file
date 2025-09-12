'use client'

import React from 'react'
import { Chip, useTheme } from '@mui/material'
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
  const theme = useTheme()

  const chipProps = {
    label: gamble.name,
    icon: <Dices size={16} />,
    size,
    variant,
    sx: {
      backgroundColor: variant === 'filled' ? 'primary.main' : 'transparent',
      color: variant === 'filled' ? 'primary.contrastText' : 'primary.main',
      border: variant === 'outlined' ? 1 : 0,
      borderColor: 'primary.main',
      fontWeight: 'bold',
      cursor: clickable ? 'pointer' : 'default',
      '&:hover': clickable ? {
        backgroundColor: variant === 'filled' ? 'primary.dark' : 'primary.light',
        color: variant === 'filled' ? 'primary.contrastText' : 'primary.contrastText',
        transform: 'translateY(-1px)',
        boxShadow: theme.shadows[4]
      } : {},
      transition: 'all 0.2s ease-in-out',
      boxShadow: theme.shadows[2]
    }
  }

  if (onClick) {
    return <Chip {...chipProps} onClick={onClick} />
  }

  if (clickable) {
    return (
      <Link href={`/gambles/${gamble.id}`} style={{ textDecoration: 'none' }}>
        <Chip {...chipProps} />
      </Link>
    )
  }

  return <Chip {...chipProps} />
}
