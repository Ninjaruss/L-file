'use client'

import React from 'react'
import { Box, Text, Group } from '@mantine/core'
import CharacterFavoritesManager from '../../components/CharacterFavoritesManager'

interface ProfileIntelPanelProps {
  quotes: any[]
  gambles: any[]
  favoriteQuoteId: string   // stringified number or ''
  favoriteGambleId: string  // stringified number or ''
  loading: boolean
  onOpenQuoteModal: () => void
  onOpenGambleModal: () => void
}

export default function ProfileIntelPanel({
  quotes,
  gambles,
  favoriteQuoteId,
  favoriteGambleId,
  loading,
  onOpenQuoteModal,
  onOpenGambleModal,
}: ProfileIntelPanelProps) {
  const selectedQuote = favoriteQuoteId
    ? quotes.find(q => q.id === parseInt(favoriteQuoteId))
    : null

  const selectedGamble = favoriteGambleId
    ? gambles.find(g => g.id === parseInt(favoriteGambleId))
    : null

  const gambleRange =
    selectedGamble && selectedGamble.endChapter != null
      ? `Ch.${selectedGamble.startChapter}–${selectedGamble.endChapter}`
      : selectedGamble?.startChapter
      ? `Ch.${selectedGamble.startChapter}+`
      : null

  return (
    <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '12px' }}>
      <Text style={{ fontSize: '17px', fontWeight: 600, color: '#d4d4d4', marginBottom: 12 }}>Favorites</Text>

      {/* Characters — delegated to CharacterFavoritesManager */}
      <Text style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Characters</Text>
      <Box mb={12}>
        <CharacterFavoritesManager />
      </Box>

      {/* Quote */}
      <Text style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Quote</Text>
      {loading ? (
        <Box style={{ height: '48px', background: '#0f0f0f', borderRadius: '3px', marginBottom: '12px' }} />
      ) : selectedQuote ? (
        <Box
          onClick={onOpenQuoteModal}
          style={{
            borderLeft: '2px solid #7c3aed',
            padding: '8px 8px 8px 10px',
            background: '#0a0a0a',
            borderRadius: '0 3px 3px 0',
            marginBottom: '12px',
            cursor: 'pointer',
          }}
        >
          <Text style={{ fontSize: '16px', color: '#ccc', fontStyle: 'italic', lineHeight: 1.6, fontFamily: 'var(--font-opti-goudy-text)' }}>
            &ldquo;{selectedQuote.text?.length > 120 ? selectedQuote.text.substring(0, 120) + '...' : selectedQuote.text}&rdquo;
          </Text>
          {selectedQuote.character?.name && (
            <Text style={{ fontSize: '14px', color: '#888', marginTop: '6px' }}>
              — {selectedQuote.character.name}{selectedQuote.chapter ? ` · Ch. ${selectedQuote.chapter}` : ''}
            </Text>
          )}
        </Box>
      ) : (
        <Box
          onClick={onOpenQuoteModal}
          style={{
            border: '1px dashed #1e1e1e', borderRadius: '3px', padding: '10px',
            marginBottom: '12px', cursor: 'pointer', textAlign: 'center',
          }}
        >
          <Text size="xs" c="dimmed">Select a favorite quote</Text>
        </Box>
      )}

      {/* Gamble */}
      <Text style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Gamble</Text>
      <Box
        onClick={onOpenGambleModal}
        style={{
          background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '3px',
          padding: '8px', display: 'flex', alignItems: 'center', gap: '8px',
          cursor: 'pointer',
        }}
      >
        <Box style={{ width: '6px', height: '6px', background: '#e11d48', borderRadius: '50%', flexShrink: 0 }} />
        <Text style={{ fontSize: '16px', color: selectedGamble ? '#ccc' : '#777', flex: 1 }}>
          {selectedGamble ? selectedGamble.name : 'Select a favorite gamble'}
        </Text>
        {gambleRange && (
          <Text style={{ fontSize: '14px', color: '#888' }}>{gambleRange}</Text>
        )}
      </Box>
    </Box>
  )
}
