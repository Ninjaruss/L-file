'use client'

import { Box, Group, Skeleton } from '@mantine/core'
import { rem } from '@mantine/core'

/** Placeholder header shown while Navigation loads — prevents layout shift */
export function NavigationSkeleton() {
  return (
    <Box
      component="header"
      role="banner"
      aria-label="Main navigation"
      aria-busy="true"
      style={{
        height: '60px',
        padding: `0 ${rem(16)}`,
        marginBottom: rem(32),
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'linear-gradient(180deg, rgba(14,14,16,0.98) 0%, rgba(10,10,12,0.96) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Group h="100%" align="center" justify="space-between">
        <Skeleton height={24} width={80} radius="sm" />
        <Group gap="md" visibleFrom="md">
          <Skeleton height={32} width={72} radius="sm" />
          <Skeleton height={32} width={88} radius="sm" />
          <Skeleton height={36} width={200} radius="md" />
        </Group>
        <Skeleton height={32} width={64} radius="sm" />
      </Group>
    </Box>
  )
}
