'use client'

import React from 'react'
import { Badge, Tooltip } from '@mantine/core'
import { Trophy } from 'lucide-react'

interface ContributionBadgeProps {
  count: number
  variant?: 'light' | 'filled' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showIcon?: boolean
}

export default function ContributionBadge({
  count,
  variant = 'light',
  size = 'sm',
  showIcon = false,
}: ContributionBadgeProps) {
  if (count === 0) {
    return null
  }

  const badge = (
    <Badge
      size={size}
      variant={variant}
      color="violet"
      leftSection={showIcon ? <Trophy size={12} /> : undefined}
    >
      {count} {count === 1 ? 'contribution' : 'contributions'}
    </Badge>
  )

  return (
    <Tooltip label={`Total contributions to the site`} withArrow>
      {badge}
    </Tooltip>
  )
}
