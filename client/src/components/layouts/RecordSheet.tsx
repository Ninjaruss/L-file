'use client'

import React from 'react'
import { Box } from '@mantine/core'
import Link from 'next/link'

/** A key/value detail row. `href` makes the value a link. `valueColor` overrides. */
export interface RecordRow {
  key: string
  value: React.ReactNode
  href?: string
  valueColor?: string
}

interface RecordSheetProps {
  accent: string
  /** Top "Details" rows. */
  details: RecordRow[]
  children?: React.ReactNode
}

/**
 * Single bordered "record sheet" for the detail-page aside.
 * Details rows at top; callers append related-list sub-sections and a quote
 * via <RecordBlock> children so metadata reads as one record, not N cards.
 */
export function RecordSheet({ accent, details, children }: RecordSheetProps) {
  return (
    <Box
      style={{
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        background: '#101014',
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          fontFamily: 'var(--font-noto-sans)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.5)',
          padding: '16px 18px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Box aria-hidden style={{ width: 5, height: 5, borderRadius: '50%', background: accent }} />
        Details
      </Box>
      {details.map((row) => (
        <Box
          key={row.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '11px 18px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Box style={{ fontSize: 12, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>
            {row.key}
          </Box>
          <Box style={{ fontSize: 13, fontWeight: 700, color: row.valueColor ?? '#fff', textAlign: 'right' }}>
            {row.href ? (
              <Link href={row.href} style={{ color: 'inherit', textDecoration: 'none' }}>{row.value}</Link>
            ) : (
              row.value
            )}
          </Box>
        </Box>
      ))}
      {children}
    </Box>
  )
}

interface RecordBlockProps {
  title: string
  children: React.ReactNode
}

/** A titled sub-section inside the RecordSheet (e.g. "Story Arcs", "Gambles"). */
export function RecordBlock({ title, children }: RecordBlockProps) {
  return (
    <Box style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '6px 0 10px' }}>
      <Box
        style={{
          fontFamily: 'var(--font-noto-sans)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.5)',
          padding: '14px 18px 4px',
        }}
      >
        {title}
      </Box>
      {children}
    </Box>
  )
}

interface RecordLinkProps {
  label: string
  /** Destination. Omit for a non-navigational informational row (renders without the chevron). */
  href?: string
  /** Small leading dot color (entity color of the linked item). */
  dotColor: string
}

const recordLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 18px',
  color: 'rgba(255,255,255,0.74)',
  textDecoration: 'none',
  fontSize: 13.5,
}

/**
 * A related-item row inside a RecordBlock.
 * Renders as a client-side link when `href` is provided; otherwise as a plain
 * informational row (no chevron, not clickable) — e.g. gamble factions, which
 * have no page of their own.
 */
export function RecordLink({ label, href, dotColor }: RecordLinkProps) {
  const inner = (
    <>
      <Box style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <Box aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <span>{label}</span>
      </Box>
      {href && <span aria-hidden style={{ color: 'rgba(255,255,255,0.38)', fontSize: 15 }}>›</span>}
    </>
  )
  return href ? (
    <Box component={Link} href={href} style={recordLinkStyle}>{inner}</Box>
  ) : (
    <Box style={recordLinkStyle}>{inner}</Box>
  )
}

export default RecordSheet
