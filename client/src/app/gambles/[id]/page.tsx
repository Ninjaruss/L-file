import React from 'react'
import {
  Container,
  Box,
  Button,
  Alert
} from '@mui/material'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { api } from '../../../lib/api'
import GamblePageClient from './GamblePageClient'

interface PageProps {
  params: Promise<{ id: string }>
}

interface Gamble {
  id: number
  name: string
  description?: string
  rules: string
  winCondition?: string
  chapterId: number
  participants?: Array<{
    id: number
    name: string
    description?: string
    alternateNames?: string[]
  }>
  chapter?: {
    id: number
    number: number
    title?: string
  }
  createdAt: string
  updatedAt: string
}

// Fetch gamble data at build time or request time
async function getGambleData(id: string): Promise<Gamble | null> {
  try {
    // Validate that ID is a valid number
    if (!id || isNaN(Number(id))) {
      throw new Error('Invalid gamble ID')
    }

    const gambleId = Number(id)

    // Additional safety check for negative or zero IDs
    if (gambleId <= 0) {
      throw new Error('Invalid gamble ID')
    }

    const gambleData = await api.getGamble(gambleId)
    return gambleData
  } catch (error: unknown) {
    console.error('Error fetching gamble data:', error)
    return null
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const gamble = await getGambleData(id)

  if (!gamble) {
    return {
      title: 'Gamble Not Found - Usogui Fansite',
      description: 'The requested gamble could not be found.'
    }
  }

  const chapterInfo = gamble.chapter
    ? `Chapter ${gamble.chapter.number}${gamble.chapter.title ? ` - ${gamble.chapter.title}` : ''}`
    : `Chapter ${gamble.chapterId}`

  const participantCount = gamble.participants?.length || 0

  return {
    title: `${gamble.name} - Gamble Details | Usogui Fansite`,
    description: `Explore the ${gamble.name} gamble from ${chapterInfo}${participantCount > 0 ? ` with ${participantCount} participants` : ''}. ${gamble.description ? gamble.description.slice(0, 120) + '...' : gamble.rules.slice(0, 120) + '...'}`,
    keywords: `Usogui, ${gamble.name}, gamble, ${chapterInfo}, manga, gambling, rules${gamble.participants?.map(p => `, ${p.name}`).join('') || ''}`,
    openGraph: {
      title: `${gamble.name} - Usogui Gamble`,
      description: `${gamble.name} is a gamble from ${chapterInfo}${participantCount > 0 ? ` featuring ${participantCount} participants` : ''}.`,
      type: 'article'
    },
    twitter: {
      card: 'summary',
      title: `${gamble.name} - Usogui Gamble`,
      description: `Explore the rules and mechanics of the ${gamble.name} gamble from ${chapterInfo}.`
    }
  }
}

export default async function GambleDetailPage({ params }: PageProps) {
  const { id } = await params
  const gamble = await getGambleData(id)

  if (!gamble) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Gamble not found
        </Alert>
        <Button component={Link} href="/gambles" variant="outlined" startIcon={<ArrowLeft />}>
          Back to Gambles
        </Button>
      </Container>
    )
  }

  return (
    <GamblePageClient initialGamble={gamble} />
  )
}

// Force dynamic rendering to ensure SSR
export const dynamic = 'force-dynamic'