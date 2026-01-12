'use client'

import React from 'react'
import { Box, Stack, Text, Title, Button, rem, useMantineTheme } from '@mantine/core'
import { motion } from 'motion/react'
import { Search, FileX, Users, BookOpen, Image, Dices, Calendar, Building2, FileText, Quote, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  accentColor?: string
  variant?: 'default' | 'search' | 'filter'
}

const iconVariants = {
  initial: { scale: 0.8, opacity: 0, y: 20 },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20
    }
  }
}

const textVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.2, duration: 0.4 }
  }
}

const buttonVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.4, duration: 0.3 }
  }
}

/**
 * Reusable empty state component for list pages
 *
 * @example
 * <EmptyState
 *   icon={<Users size={48} />}
 *   title="No users found"
 *   description="Try adjusting your search or filters"
 *   actionLabel="Clear filters"
 *   onAction={() => clearFilters()}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  accentColor,
  variant = 'default'
}: EmptyStateProps) {
  const theme = useMantineTheme()
  const color = accentColor || theme.colors.gray[5]

  const getDefaultIcon = () => {
    switch (variant) {
      case 'search':
        return <Search size={48} />
      case 'filter':
        return <FileX size={48} />
      default:
        return <FileX size={48} />
    }
  }

  return (
    <Box
      py="xl"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: rem(300)
      }}
    >
      <Stack align="center" gap="md" maw={400} ta="center">
        <motion.div
          variants={iconVariants}
          initial="initial"
          animate="animate"
        >
          <Box
            style={{
              color: color,
              opacity: 0.7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: rem(80),
              height: rem(80),
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${color}15, ${color}08)`,
              border: `2px dashed ${color}30`
            }}
          >
            {icon || getDefaultIcon()}
          </Box>
        </motion.div>

        <motion.div
          variants={textVariants}
          initial="initial"
          animate="animate"
        >
          <Stack gap="xs" align="center">
            <Title order={3} c={color} fw={600}>
              {title}
            </Title>
            <Text size="md" c="dimmed" maw={320}>
              {description}
            </Text>
          </Stack>
        </motion.div>

        {(actionLabel && (onAction || actionHref)) && (
          <motion.div
            variants={buttonVariants}
            initial="initial"
            animate="animate"
          >
            {actionHref ? (
              <Button
                component={Link}
                href={actionHref}
                variant="light"
                style={{ color }}
                radius="xl"
              >
                {actionLabel}
              </Button>
            ) : (
              <Button
                variant="light"
                style={{ color }}
                radius="xl"
                onClick={onAction}
              >
                {actionLabel}
              </Button>
            )}
          </motion.div>
        )}
      </Stack>
    </Box>
  )
}

/**
 * Pre-configured empty state for search results
 */
export function SearchEmptyState({
  query,
  onClearSearch,
  accentColor
}: {
  query?: string
  onClearSearch?: () => void
  accentColor?: string
}) {
  return (
    <EmptyState
      icon={<Search size={48} />}
      title={query ? `No results for "${query}"` : 'No results found'}
      description="Try adjusting your search terms or filters to find what you're looking for."
      actionLabel="Clear search"
      onAction={onClearSearch}
      accentColor={accentColor}
      variant="search"
    />
  )
}

/**
 * Pre-configured empty state for filtered lists
 */
export function FilterEmptyState({
  entityName,
  onClearFilters,
  accentColor
}: {
  entityName: string
  onClearFilters?: () => void
  accentColor?: string
}) {
  return (
    <EmptyState
      icon={<FileX size={48} />}
      title={`No ${entityName} match your filters`}
      description="Try removing some filters or adjusting your criteria."
      actionLabel="Clear filters"
      onAction={onClearFilters}
      accentColor={accentColor}
      variant="filter"
    />
  )
}

export default EmptyState
