'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Box, Group, Pagination, Text, rem, useMantineTheme } from '@mantine/core'
import type { EntityAccentKey } from '../../lib/mantine-theme'
import { getEntityThemeColor } from '../../lib/mantine-theme'
import classes from './PaginationBar.module.css'

interface PaginationBarProps {
  /** Current page (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Total number of items */
  total: number
  /** Items per page */
  pageSize: number
  /** Handler for page changes */
  onPageChange: (page: number) => void
  /** Entity type for accent color */
  entityType: EntityAccentKey
  /** Entity name for display (e.g., "characters") */
  entityName: string
}

export function PaginationBar({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  entityType,
  entityName
}: PaginationBarProps) {
  const theme = useMantineTheme()
  const accentColor = getEntityThemeColor(theme, entityType)

  if (totalPages <= 1 && total <= pageSize) return null

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, total)

  const handlePageChange = (page: number) => {
    onPageChange(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <Box
        px="md"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: rem(48),
          gap: rem(12)
        }}
      >
        {/* Top accent gradient rule */}
        <Box
          aria-hidden
          style={{
            width: '100%',
            maxWidth: 500,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}45, transparent)`,
            marginBottom: rem(12),
          }}
        />

        {/* Results info */}
        <Text
          className="eyebrow-label"
          style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem' }}
        >
          {start}–{end} of {total} {entityName.toUpperCase()}
        </Text>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <Pagination
            total={totalPages}
            value={currentPage}
            onChange={handlePageChange}
            radius="xl"
            size="md"
            classNames={{ control: classes.control }}
            styles={{
              root: {
                '--pagination-accent': accentColor,
                '--pagination-accent-hover-bg': `${accentColor}20`,
                '--pagination-accent-hover-border': `${accentColor}40`
              } as React.CSSProperties,
              control: {
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                color: '#ffffff',
                transition: 'all 200ms ease',
                minWidth: rem(36),
                height: rem(36),
                borderRadius: '4px'
              },
              dots: {
                color: 'rgba(255, 255, 255, 0.3)'
              }
            }}
          />
        )}

        {/* Bottom accent gradient rule */}
        <Box
          aria-hidden
          style={{
            width: '100%',
            maxWidth: 500,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}25, transparent)`,
            marginTop: rem(4),
          }}
        />
      </Box>
    </motion.div>
  )
}

export default PaginationBar
