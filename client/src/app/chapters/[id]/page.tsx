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
import ChapterPageClient from './ChapterPageClient'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getChapterData(id: string) {
  try {
    const chapterId = Number(id)
    const chapterData = await api.getChapter(chapterId)

    const events: any[] = []
    const quotes: any[] = []
    const characters: any[] = []

    return {
      chapter: chapterData,
      events,
      quotes,
      characters
    }
  } catch (error: unknown) {
    console.error('Error fetching chapter data:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getChapterData(id)

  if (!data?.chapter) {
    return {
      title: 'Chapter Not Found - Usogui Fansite',
      description: 'The requested chapter reference could not be found.'
    }
  }

  const { chapter } = data

  return {
    title: `Chapter ${chapter.number}${chapter.title ? ` - ${chapter.title}` : ''} | Usogui Reference Guide`,
    description: `Reference guide for Usogui Chapter ${chapter.number}${chapter.title ? ` (${chapter.title})` : ''}. ${chapter.summary ? chapter.summary.slice(0, 120) + '...' : 'Analysis and information about this chapter.'}`,
    keywords: `Usogui, Chapter ${chapter.number}, manga analysis, fan guide, reference${chapter.title ? `, ${chapter.title}` : ''}`,
    openGraph: {
      title: `Chapter ${chapter.number}${chapter.title ? ` - ${chapter.title}` : ''} - Usogui Reference`,
      description: `Reference information and analysis for Chapter ${chapter.number} of the Usogui manga.`,
      type: 'article'
    },
    twitter: {
      card: 'summary',
      title: `Chapter ${chapter.number} - Usogui Reference`,
      description: `Analysis and reference information for Chapter ${chapter.number} of Usogui.`
    },
    robots: 'index, follow'
  }
}

export default async function ChapterDetailPage({ params }: PageProps) {
  const { id } = await params
  const data = await getChapterData(id)

  if (!data?.chapter) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          Chapter reference not found
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Button component={Link} href="/chapters" startIcon={<ArrowLeft />}>
            Back to Chapter References
          </Button>
        </Box>
      </Container>
    )
  }

  const { chapter, events, quotes, characters } = data

  return (
    <ChapterPageClient
      initialChapter={chapter}
      initialEvents={events}
      initialQuotes={quotes}
      initialCharacters={characters}
    />
  )
}

export const dynamic = 'force-dynamic'