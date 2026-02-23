'use client'

import React from 'react'
import { Alert, Box, useMantineTheme } from '@mantine/core'
import { AlertCircle } from 'lucide-react'
import { motion } from 'motion/react'
import {
  backgroundStyles,
  getEntityThemeColor,
  type EntityAccentKey
} from '../../lib/mantine-theme'
import { pageEnter } from '../../lib/motion-presets'
import { ListPageHero } from './ListPageHero'
import { SearchToolbar, type ViewMode } from './SearchToolbar'
import { EntityCardGrid, type GridLayout } from './EntityCardGrid'
import { PaginationBar } from './PaginationBar'
import { CardGridSkeleton } from '../CardGridSkeleton'
import { EmptyState } from '../EmptyState'

interface ListPageLayoutProps<T> {
  // Entity identity
  /** Entity type key for theming */
  entityType: EntityAccentKey
  /** Lucide icon element for hero section */
  icon: React.ReactNode
  /** Page title (e.g., "Characters") */
  title: string
  /** Hero subtitle description */
  subtitle: string

  // Data state
  /** Array of items to display */
  items: T[]
  /** Total item count (from server) */
  total: number
  /** Total page count */
  totalPages: number
  /** Current page (1-indexed) */
  currentPage: number
  /** Items per page */
  pageSize: number
  /** Whether data is currently loading */
  loading: boolean
  /** Error message, if any */
  error: string | null

  // Search & sort
  /** Placeholder for search input */
  searchPlaceholder: string
  /** Current search input value */
  searchInput: string
  /** Handler for search input changes */
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  /** Handler for clearing all search/filters */
  onClearSearch: () => void
  /** Whether any search or filter is active */
  hasActiveFilters: boolean
  /** Sort options */
  sortOptions: Array<{ value: string; label: string }>
  /** Current sort value */
  sortValue: string
  /** Handler for sort changes */
  onSortChange: (value: string | null) => void
  /** Entity-specific filter UI (rendered in search toolbar) */
  filterSlot?: React.ReactNode
  /** Active filter badges (rendered below search toolbar) */
  activeFilterBadges?: React.ReactNode

  // Grid & cards
  /** Function to render each card */
  renderCard: (item: T, index: number) => React.ReactNode
  /** Key extractor for items */
  getKey: (item: T) => string | number
  /** Grid layout mode */
  gridLayout?: GridLayout
  /** Skeleton card dimensions */
  skeletonCardWidth?: number
  skeletonCardHeight?: number

  // View mode
  /** Current view mode (grid/list) */
  viewMode?: ViewMode
  /** Handler for view mode toggle */
  onViewModeChange?: (mode: ViewMode) => void

  // Pagination
  /** Handler for page changes */
  onPageChange: (page: number) => void
  /** Entity name plural for pagination label (e.g., "characters") */
  entityNamePlural?: string

  // Slots
  /** Content to render in the hero section */
  heroChildren?: React.ReactNode
  /** Hover modal content (rendered after grid) */
  hoverModal?: React.ReactNode
  /** Additional content after pagination */
  afterContent?: React.ReactNode

  // Empty state
  /** Icon for empty state */
  emptyIcon?: React.ReactNode
  /** Title for no-results state */
  emptyTitle?: string
  /** Description for no-results state */
  emptyDescription?: string
}

export function ListPageLayout<T>({
  entityType,
  icon,
  title,
  subtitle,
  items,
  total,
  totalPages,
  currentPage,
  pageSize,
  loading,
  error,
  searchPlaceholder,
  searchInput,
  onSearchChange,
  onClearSearch,
  hasActiveFilters,
  sortOptions,
  sortValue,
  onSortChange,
  filterSlot,
  activeFilterBadges,
  renderCard,
  getKey,
  gridLayout = 'portrait',
  skeletonCardWidth = 200,
  skeletonCardHeight = 280,
  viewMode,
  onViewModeChange,
  onPageChange,
  entityNamePlural,
  heroChildren,
  hoverModal,
  afterContent,
  emptyIcon,
  emptyTitle,
  emptyDescription
}: ListPageLayoutProps<T>) {
  const theme = useMantineTheme()
  const accentColor = getEntityThemeColor(theme, entityType)
  const pluralName = entityNamePlural || title.toLowerCase()

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
      <motion.div {...pageEnter}>
        {/* Hero Section */}
        <ListPageHero
          icon={icon}
          title={title}
          subtitle={subtitle}
          entityType={entityType}
          count={total}
          countLabel={pluralName}
          hasActiveSearch={hasActiveFilters}
        >
          {heroChildren}
        </ListPageHero>

        {/* Search Toolbar (sticky) */}
        <SearchToolbar
          searchPlaceholder={searchPlaceholder}
          searchInput={searchInput}
          onSearchChange={onSearchChange}
          onClearSearch={onClearSearch}
          hasActiveFilters={hasActiveFilters}
          sortOptions={sortOptions}
          sortValue={sortValue}
          onSortChange={onSortChange}
          accentColor={accentColor}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        >
          {filterSlot}
        </SearchToolbar>

        {/* Active Filter Badges */}
        {activeFilterBadges}

        {/* Error State */}
        {error && (
          <Box px="md" mb="xl">
            <Alert
              color="red"
              radius="md"
              icon={<AlertCircle size={16} />}
              title={`Error loading ${pluralName}`}
            >
              {error}
            </Alert>
          </Box>
        )}

        {/* Content Area */}
        {loading ? (
          <CardGridSkeleton
            count={pageSize}
            cardWidth={skeletonCardWidth}
            cardHeight={skeletonCardHeight}
            accentColor={accentColor}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={emptyIcon || icon}
            title={
              emptyTitle ||
              (hasActiveFilters
                ? `No ${pluralName} found`
                : `No ${pluralName} available`)
            }
            description={
              emptyDescription ||
              (hasActiveFilters
                ? 'Try adjusting your search terms or filters'
                : `Check back later for new ${pluralName}`)
            }
            actionLabel={hasActiveFilters ? 'Clear search' : undefined}
            onAction={hasActiveFilters ? onClearSearch : undefined}
            accentColor={accentColor}
            variant={hasActiveFilters ? 'search' : 'default'}
          />
        ) : (
          <>
            {/* Card Grid */}
            <EntityCardGrid
              items={items}
              renderCard={renderCard}
              getKey={getKey}
              layout={gridLayout}
              viewMode={viewMode}
              accentColor={accentColor}
            />

            {/* Hover Modal (portal, rendered outside grid) */}
            {hoverModal}

            {/* Pagination */}
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={onPageChange}
              entityType={entityType}
              entityName={pluralName}
            />
          </>
        )}

        {/* After content */}
        {afterContent}
      </motion.div>
    </Box>
  )
}

export default ListPageLayout
