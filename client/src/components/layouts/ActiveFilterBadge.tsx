'use client'

import { ActionIcon, Badge, Group, rem } from '@mantine/core'
import { X } from 'lucide-react'

interface ActiveFilterBadgeProps {
  /** Filter category label, e.g. "Organization" */
  label: string
  /** Current filter value, e.g. "Biscuit Corporation" */
  value: string
  /** Called when the user clears this filter */
  onClear: () => void
  /** Entity accent color — badge background */
  accentColor: string
}

export function ActiveFilterBadge({ label, value, onClear, accentColor }: ActiveFilterBadgeProps) {
  return (
    <Badge
      size="lg"
      variant="filled"
      radius="xs"
      style={{
        backgroundColor: accentColor,
        transform: 'rotate(-0.5deg)',
        border: `1px solid rgba(255,255,255,0.18)`,
        letterSpacing: '0.08em',
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: rem(11),
        boxShadow: `0 2px 8px ${accentColor}50, inset 0 1px 0 rgba(255,255,255,0.12)`
      }}
      rightSection={
        <ActionIcon
          size="md"
          variant="transparent"
          color="white"
          onClick={onClear}
          aria-label={`Clear ${label} filter`}
          style={{ minWidth: rem(32), minHeight: rem(32) }}
        >
          <X size={14} />
        </ActionIcon>
      }
    >
      {label}: {value}
    </Badge>
  )
}

/** Wrapper Group for placing one or more ActiveFilterBadges below the search toolbar */
export function ActiveFilterBadgeRow({ children }: { children: React.ReactNode }) {
  return (
    <Group justify="center" mt="sm" mb="md" gap="sm" wrap="wrap">
      {children}
    </Group>
  )
}

export default ActiveFilterBadge
