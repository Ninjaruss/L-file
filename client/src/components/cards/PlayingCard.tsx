'use client'

import React from 'react'
import { Card, Box, Badge, Text, ActionIcon, rem, useMantineTheme } from '@mantine/core'
import Link from 'next/link'
import { Camera } from 'lucide-react'
import { getPlayingCardStyles, getEntityThemeColor, type EntityAccentKey } from '../../lib/mantine-theme'
import { entitySuit, suitPaths, mangaPatterns } from '../../lib/manga-decorations'
import MediaThumbnail, { type MediaItem } from '../MediaThumbnail'
import classes from './PlayingCard.module.css'

export type CardVariant = 'portrait' | 'landscape' | 'square'

interface PlayingCardProps {
  /** Entity type for theming */
  entityType: EntityAccentKey
  /** Link destination */
  href: string
  /** Entity ID for media lookup */
  entityId: number
  /** Entity display name */
  name: string
  /** Chapter badge text (e.g., "Ch. 42") */
  chapterBadge?: string
  /** Whether the current user can edit content */
  canEdit?: boolean
  /** Handler for edit button click */
  onEditClick?: (e: React.MouseEvent) => void

  // Hover/touch behavior
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: () => void
  onClick?: (e: React.MouseEvent) => void
  isTouchDevice?: boolean
  isHovered?: boolean

  // Spoiler
  spoilerChapter?: number | null
  onSpoilerRevealed?: () => void

  // Visual
  variant?: CardVariant
  /** When true, the entity name is never truncated (always fully visible) */
  noTruncate?: boolean
  /** Additional content rendered below the name */
  subtitle?: React.ReactNode
  /** When true, the image is loaded eagerly (above-the-fold optimization) */
  imagePriority?: boolean
  /** Pre-loaded media to skip the API call in MediaThumbnail */
  initialMedia?: MediaItem[]
}

const variantDimensions: Record<CardVariant, { maxWidth: number; maxHeight: number }> = {
  portrait: { maxWidth: 200, maxHeight: 230 },
  landscape: { maxWidth: 300, maxHeight: 180 },
  square: { maxWidth: 220, maxHeight: 220 }
}

export function PlayingCard({
  entityType,
  href,
  entityId,
  name,
  chapterBadge,
  canEdit,
  onEditClick,
  onMouseEnter,
  onMouseLeave,
  onClick,
  isTouchDevice,
  isHovered,
  spoilerChapter,
  onSpoilerRevealed,
  variant = 'portrait',
  noTruncate = false,
  subtitle,
  imagePriority = false,
  initialMedia
}: PlayingCardProps) {
  const theme = useMantineTheme()
  const accentColor = getEntityThemeColor(theme, entityType)
  const suit = entitySuit[entityType]
  const dims = variantDimensions[variant]

  return (
    <Card
      component={Link}
      href={href}
      withBorder={false}
      radius="lg"
      shadow="sm"
      className={`hoverable-card hoverable-card-${entityType} ledger-lines ${classes.card}`}
      style={{
        ...getPlayingCardStyles(theme, accentColor),
        position: 'relative',
        transform: 'perspective(700px) rotateY(0deg) translateY(0px)',
        transition: 'transform 250ms ease, box-shadow 250ms ease',
        boxShadow: `inset 0 0 0 1px ${accentColor}18, 0 2px 10px rgba(0,0,0,0.4)`
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Entity type eyebrow label */}
      <Box
        aria-hidden
        className="eyebrow-label"
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          color: accentColor,
          background: `${accentColor}20`,
          padding: '2px 5px',
          borderRadius: 2,
          border: `1px solid ${accentColor}40`,
          fontSize: '0.55rem',
          letterSpacing: '0.18em',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        {entityType}
      </Box>

      {/* Suit icon in top-right corner */}
      <Box
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: rem(6),
          right: rem(6),
          zIndex: 5,
          opacity: 0.18,
          width: rem(16),
          height: rem(16)
        }}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill={accentColor}>
          <path d={suitPaths[suit]} />
        </svg>
      </Box>

      {/* Chapter Badge at Top Left */}
      {chapterBadge && (
        <Badge
          variant="filled"
          radius="sm"
          size="sm"
          c="white"
          style={{
            position: 'absolute',
            top: rem(8),
            left: rem(8),
            backgroundColor: accentColor,
            fontSize: rem(10),
            fontWeight: 700,
            zIndex: 10,
            backdropFilter: 'blur(4px)',
            maxWidth: canEdit ? 'calc(100% - 60px)' : 'calc(100% - 16px)'
          }}
        >
          {chapterBadge}
        </Badge>
      )}

      {/* Edit Button at Top Right (for moderators) */}
      {canEdit && onEditClick && (
        <ActionIcon
          size="xs"
          variant="filled"
          color="dark"
          radius="xl"
          aria-label={`Edit ${name} image`}
          style={{
            position: 'absolute',
            top: rem(8),
            right: rem(8),
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 10,
            width: rem(24),
            height: rem(24)
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onEditClick(e)
          }}
        >
          <Camera size={12} />
        </ActionIcon>
      )}

      {/* Main Image Section */}
      <Box style={{
        position: 'relative',
        overflow: 'hidden',
        flex: 1,
        minHeight: 0
      }}>
        <MediaThumbnail
          entityType={entityType}
          entityId={entityId}
          entityName={name}
          allowCycling={false}
          maxWidth={dims.maxWidth}
          maxHeight={dims.maxHeight}
          spoilerChapter={spoilerChapter ?? undefined}
          onSpoilerRevealed={onSpoilerRevealed}
          priority={imagePriority}
          initialMedia={initialMedia}
        />
      </Box>

      {/* Bottom gradient overlay */}
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '55%',
          background: `linear-gradient(0deg, ${accentColor}24 0%, transparent 100%)`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Name at Bottom with diagonal stripe accent */}
      <Box
        p={rem(6)}
        ta="center"
        style={{
          position: 'relative',
          minHeight: rem(40),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          gap: rem(4)
        }}
      >
        {/* Diagonal stripe background accent */}
        <Box
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: mangaPatterns.diagonalStripes(`${accentColor}10`, 1, 6),
            borderRadius: `0 0 ${rem(8)} ${rem(8)}`,
            pointerEvents: 'none'
          }}
        />

        <Text
          size="sm"
          fw={400}
          ta="center"
          className={noTruncate ? undefined : classes.name}
          style={{
            position: 'relative',
            lineHeight: 1.3,
            fontSize: rem(15),
            color: '#ffffff',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            background: `linear-gradient(135deg, ${accentColor}ee 0%, ${accentColor}cc 60%, ${accentColor}aa 100%)`,
            backdropFilter: 'blur(4px)',
            borderRadius: rem(6),
            padding: `${rem(6)} ${rem(10)}`,
            border: `1px solid ${accentColor}60`,
            fontFamily: 'var(--font-opti-goudy-text), serif',
            fontWeight: 400,
          }}
        >
          {name}
        </Text>

        {/* Subtitle or touch hint */}
        {subtitle || (isTouchDevice && !isHovered && (
          <Text
            size="xs"
            c="dimmed"
            ta="center"
            style={{ fontSize: rem(10), opacity: 0.7 }}
          >
            Tap to preview
          </Text>
        ))}
      </Box>
    </Card>
  )
}

export default PlayingCard
