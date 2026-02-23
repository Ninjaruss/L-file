'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  Box,
  TextInput,
  Select,
  ActionIcon,
  Group,
  Tooltip,
  rem,
  useMantineTheme
} from '@mantine/core'
import { Search, X, ArrowUpDown, LayoutGrid, List } from 'lucide-react'
import { zIndex } from '../../lib/design-tokens'

export type ViewMode = 'grid' | 'list'

interface SearchToolbarProps {
  /** Placeholder text for the search input */
  searchPlaceholder: string
  /** Current search input value */
  searchInput: string
  /** Handler for search input changes */
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  /** Handler for clearing search */
  onClearSearch: () => void
  /** Whether any filters/search are active */
  hasActiveFilters: boolean
  /** Sort option definitions */
  sortOptions: Array<{ value: string; label: string }>
  /** Current sort value */
  sortValue: string
  /** Handler for sort changes */
  onSortChange: (value: string | null) => void
  /** Entity accent color */
  accentColor: string
  /** Current view mode */
  viewMode?: ViewMode
  /** Handler for view mode changes */
  onViewModeChange?: (mode: ViewMode) => void
  /** Additional filter dropdowns (entity-specific) */
  children?: React.ReactNode
}

export function SearchToolbar({
  searchPlaceholder,
  searchInput,
  onSearchChange,
  onClearSearch,
  hasActiveFilters,
  sortOptions,
  sortValue,
  onSortChange,
  accentColor,
  viewMode = 'grid',
  onViewModeChange,
  children
}: SearchToolbarProps) {
  const theme = useMantineTheme()
  const searchRef = useRef<HTMLInputElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [isStuck, setIsStuck] = useState(false)

  // Detect when toolbar becomes sticky
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '-65px 0px 0px 0px' } // Account for navbar height
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // Keyboard shortcut: "/" focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      {/* Invisible sentinel element to detect when toolbar enters sticky mode */}
      <div ref={sentinelRef} style={{ height: 1, marginBottom: -1 }} />

      <Box
        mb="xl"
        px="md"
        py="sm"
        style={{
          position: 'sticky',
          top: 64, // Below navbar
          zIndex: zIndex.sticky,
          transition: 'all 200ms ease',
          ...(isStuck
            ? {
                backgroundColor: 'rgba(10, 10, 10, 0.92)',
                backdropFilter: 'blur(12px)',
                borderBottom: `1px solid ${accentColor}20`,
                boxShadow: `0 4px 16px rgba(0, 0, 0, 0.3)`
              }
            : {
                backgroundColor: 'transparent'
              })
        }}
      >
        <Group justify="center" gap="md" wrap="wrap">
          {/* Search input */}
          <Box style={{ maxWidth: rem(500), width: '100%', flex: '1 1 300px' }}>
            <TextInput
              ref={searchRef}
              placeholder={searchPlaceholder}
              value={searchInput}
              onChange={onSearchChange}
              leftSection={<Search size={20} />}
              size="lg"
              radius="xl"
              rightSection={
                hasActiveFilters ? (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={onClearSearch}
                    size="lg"
                    aria-label="Clear search"
                    style={{ minWidth: 44, minHeight: 44 }}
                  >
                    <X size={18} />
                  </ActionIcon>
                ) : (
                  <Tooltip label="Press / to search" position="left" withArrow>
                    <Box
                      component="kbd"
                      style={{
                        fontSize: rem(11),
                        fontFamily: theme.fontFamilyMonospace,
                        padding: `${rem(2)} ${rem(6)}`,
                        borderRadius: rem(4),
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.4)',
                        lineHeight: 1.4
                      }}
                    >
                      /
                    </Box>
                  </Tooltip>
                )
              }
              styles={{
                input: {
                  fontSize: rem(16),
                  paddingLeft: rem(50),
                  paddingRight: rem(50)
                }
              }}
            />
          </Box>

          {/* Sort dropdown */}
          <Select
            data={sortOptions}
            value={sortValue}
            onChange={onSortChange}
            leftSection={<ArrowUpDown size={16} />}
            w={180}
            size="lg"
            radius="xl"
            styles={{
              input: { fontSize: rem(14) }
            }}
          />

          {/* Entity-specific filters */}
          {children}

          {/* View mode toggle */}
          {onViewModeChange && (
            <Group gap={4}>
              <Tooltip label="Grid view" withArrow>
                <ActionIcon
                  variant={viewMode === 'grid' ? 'filled' : 'subtle'}
                  color={viewMode === 'grid' ? accentColor : 'gray'}
                  size="lg"
                  radius="xl"
                  onClick={() => onViewModeChange('grid')}
                  aria-label="Grid view"
                  style={viewMode === 'grid' ? { backgroundColor: accentColor } : undefined}
                >
                  <LayoutGrid size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="List view" withArrow>
                <ActionIcon
                  variant={viewMode === 'list' ? 'filled' : 'subtle'}
                  color={viewMode === 'list' ? accentColor : 'gray'}
                  size="lg"
                  radius="xl"
                  onClick={() => onViewModeChange('list')}
                  aria-label="List view"
                  style={viewMode === 'list' ? { backgroundColor: accentColor } : undefined}
                >
                  <List size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </Group>
      </Box>
    </>
  )
}

export default SearchToolbar
