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
import EventPageClient from './EventPageClient'
import type { Event } from '../../../types'

interface PageProps {
  params: Promise<{ id: string }>
}

// Fetch event data at build time or request time
async function getEventData(id: string) {
  try {
    // Validate that ID is a valid number
    if (!id || isNaN(Number(id))) {
      throw new Error('Invalid event ID')
    }

    const eventId = Number(id)

    // Additional safety check for negative or zero IDs
    if (eventId <= 0) {
      throw new Error('Invalid event ID')
    }

    const eventData = await api.getEvent(eventId)
    return eventData
  } catch (error: unknown) {
    console.error('Error fetching event data:', error)
    return null
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const event = await getEventData(id)

  if (!event) {
    return {
      title: 'Event Not Found - Usogui Fansite',
      description: 'The requested event could not be found.'
    }
  }

  return {
    title: `${event.title} - Event Details | Usogui Fansite`,
    description: `Explore the ${event.title} event from Chapter ${event.chapterNumber}. ${event.description ? event.description.slice(0, 150) + '...' : ''}`,
    keywords: `Usogui, ${event.title}, event, chapter ${event.chapterNumber}, manga, gambling${event.arc ? `, ${event.arc.name}` : ''}${event.gamble ? `, ${event.gamble.name}` : ''}`,
    openGraph: {
      title: `${event.title} - Usogui Event`,
      description: `${event.title} occurs in Chapter ${event.chapterNumber}${event.arc ? ` of the ${event.arc.name} arc` : ''}.`,
      type: 'article'
    },
    twitter: {
      card: 'summary',
      title: `${event.title} - Usogui Event`,
      description: `Explore the ${event.title} event from Chapter ${event.chapterNumber}.`
    }
  }
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params
  const event = await getEventData(id)

  if (!event) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Event not found
        </Alert>
        <Button component={Link} href="/events" variant="outlined" startIcon={<ArrowLeft />}>
          Back to Events
        </Button>
      </Container>
    )
  }

  return (
    <EventPageClient initialEvent={event} />
  )
}

// Force dynamic rendering to ensure SSR
export const dynamic = 'force-dynamic'