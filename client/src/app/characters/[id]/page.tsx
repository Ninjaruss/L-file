import React from 'react'
import {
  Container,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Grid,
  Button
} from '@mui/material'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MediaThumbnail from '../../../components/MediaThumbnail'
import { CharacterStructuredData } from '../../../components/StructuredData'
import type { Arc, Event, Gamble, Guide, Quote } from '../../../types'
import { GuideStatus } from '../../../types'
import { Metadata } from 'next'

// Import client components dynamically
import dynamic from 'next/dynamic'

const CharacterPageClient = dynamic(() => import('./CharacterPageClient'), {
  loading: () => <Box sx={{ p: 2 }}>Loading...</Box>
})

interface Character {
  id: number
  name: string
  alternateNames: string[] | null
  description: string | null
  firstAppearanceChapter: number | null
  imageFileName?: string | null
  imageDisplayName?: string | null
  organizations?: Array<{
    id: number
    name: string
    description?: string
  }>
  arcs?: Array<{
    id: number
    name: string
    order: number
  }>
}

interface CharacterPageData {
  character: Character
  gambles: Gamble[]
  events: Event[]
  guides: Guide[]
  quotes: Quote[]
  arcs: Arc[]
}

// Server-side API functions
async function fetchCharacterData(characterId: number): Promise<CharacterPageData> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  try {
    // Fetch character and related data in parallel
    const [characterRes, gamblesRes, eventsRes, guidesRes, quotesRes, allArcsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/characters/${characterId}`, { next: { revalidate: 300 } }),
      fetch(`${API_BASE_URL}/characters/${characterId}/gambles?limit=5`, { next: { revalidate: 300 } }),
      fetch(`${API_BASE_URL}/characters/${characterId}/events`, { next: { revalidate: 300 } }),
      fetch(`${API_BASE_URL}/characters/${characterId}/guides?limit=5&status=${GuideStatus.APPROVED}`, { next: { revalidate: 300 } }),
      fetch(`${API_BASE_URL}/characters/${characterId}/quotes?limit=10`, { next: { revalidate: 300 } }),
      fetch(`${API_BASE_URL}/arcs`, { next: { revalidate: 300 } })
    ])

    if (!characterRes.ok) {
      throw new Error('Character not found')
    }

    const [character, gamblesData, eventsData, guidesData, quotesData, allArcsData] = await Promise.all([
      characterRes.json(),
      gamblesRes.ok ? gamblesRes.json() : { data: [] },
      eventsRes.ok ? eventsRes.json() : { data: [] },
      guidesRes.ok ? guidesRes.json() : { data: [] },
      quotesRes.ok ? quotesRes.json() : { data: [] },
      allArcsRes.ok ? allArcsRes.json() : { data: [] }
    ])

    // Filter arcs to only those that have events for this character
    const characterArcIds = new Set(eventsData.data?.map((event: Event) => (event as Event & { arcId?: number }).arcId).filter(Boolean) || [])
    const filteredArcs = allArcsData.data?.filter((arc: Arc) => characterArcIds.has(arc.id)) || []

    return {
      character,
      gambles: gamblesData.data || [],
      events: eventsData.data || [],
      guides: guidesData.data || [],
      quotes: quotesData.data || [],
      arcs: filteredArcs
    }
  } catch (error) {
    console.error('Error fetching character data:', error)
    throw error
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const characterId = parseInt(id)

  if (isNaN(characterId) || characterId <= 0) {
    return {
      title: 'Character Not Found - Usogui Fansite'
    }
  }

  try {
    const { character } = await fetchCharacterData(characterId)
    const imageUrl = character.imageFileName
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/media/character/${character.imageFileName}`
      : undefined

    return {
      title: `${character.name} - Usogui Fansite`,
      description: character.description
        ? character.description.substring(0, 160).replace(/\n/g, ' ') + '...'
        : `Learn about ${character.name}, a character from the Usogui manga series. View their story arcs, gambles, quotes, and more.`,
      openGraph: {
        title: `${character.name} - Usogui Fansite`,
        description: character.description?.substring(0, 160) || `Character profile for ${character.name}`,
        images: imageUrl ? [{ url: imageUrl, alt: character.name }] : [],
        type: 'article'
      },
      twitter: {
        card: 'summary_large_image',
        title: `${character.name} - Usogui Fansite`,
        description: character.description?.substring(0, 160) || `Character profile for ${character.name}`,
        images: imageUrl ? [imageUrl] : []
      }
    }
  } catch {
    return {
      title: 'Character Not Found - Usogui Fansite'
    }
  }
}

export default async function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const characterId = parseInt(id)

  // Validate that ID is a valid number
  if (isNaN(characterId) || characterId <= 0) {
    notFound()
  }

  let data: CharacterPageData

  try {
    data = await fetchCharacterData(characterId)
  } catch (error) {
    console.error('Error fetching character:', error)
    notFound()
  }

  const { character, gambles, events, guides, quotes, arcs } = data

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <CharacterStructuredData
        character={{
          id: character.id,
          name: character.name,
          alternateNames: character.alternateNames,
          description: character.description,
          firstAppearanceChapter: character.firstAppearanceChapter,
          imageUrl: character.imageFileName ? `/api/media/character/${character.imageFileName}` : undefined
        }}
      />

      <Button
        component={Link}
        href="/characters"
        startIcon={<ArrowLeft />}
        sx={{ mb: 3 }}
      >
        Back to Characters
      </Button>

      {/* Server-rendered character header */}
      <CharacterHeader
        character={character}
        arcs={arcs}
        gambles={gambles}
        quotes={quotes}
      />

      {/* Client-side interactive tabs and content */}
      <CharacterPageClient
        character={character}
        gambles={gambles}
        events={events}
        guides={guides}
        quotes={quotes}
        arcs={arcs}
      />
    </Container>
  )
}

// Server-rendered character header component
function CharacterHeader({ character, arcs, gambles, quotes }: {
  character: Character
  arcs: Arc[]
  gambles: Gamble[]
  quotes: Quote[]
}) {
  return (
    <Card className="gambling-card" sx={{ mb: 4, overflow: 'visible' }}>
      <CardContent sx={{ p: 4 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={4} lg={3}>
            <Box sx={{
              textAlign: 'center',
              position: 'relative'
            }}>
              <MediaThumbnail
                entityType="character"
                entityId={character.id}
                entityName={character.name}
                allowCycling={true}
                maxWidth={280}
                maxHeight={320}
                className="character-thumbnail"
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={8} lg={9}>
            <Box sx={{ pl: { md: 2 } }}>
              {/* Character Name */}
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', md: '3rem' }
                }}
              >
                {character.name}
              </Typography>

              {/* Alternate Names */}
              {character.alternateNames && character.alternateNames.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    Also known as:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {character.alternateNames.map((name) => (
                      <Chip
                        key={name}
                        label={name}
                        size="medium"
                        variant="outlined"
                        color="secondary"
                        sx={{
                          borderRadius: '20px',
                          fontSize: '0.875rem'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Organization Affiliations */}
              {character.organizations && character.organizations.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    Organization Affiliations:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {character.organizations.map((organization) => (
                      <Chip
                        key={organization.id}
                        label={organization.name}
                        size="medium"
                        variant="filled"
                        component={Link}
                        href={`/organizations/${organization.id}`}
                        clickable
                        sx={{
                          backgroundColor: '#e91e63',
                          color: 'white',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          textDecoration: 'none'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Key Information Cards */}
              {character.firstAppearanceChapter && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        First Appearance
                      </Typography>
                      <Typography
                        variant="h6"
                        component={Link}
                        href={`/chapters/${character.firstAppearanceChapter}`}
                        sx={{
                          textDecoration: 'none',
                          color: 'primary.main',
                          fontWeight: 600,
                          display: 'block',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        Chapter {character.firstAppearanceChapter}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Stats Chips */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <Chip
                  label={`${arcs.length} Arc${arcs.length !== 1 ? 's' : ''}`}
                  size="medium"
                  variant="filled"
                  color="primary"
                  component={Link}
                  href={`/arcs?character=${character.name}`}
                  clickable
                  sx={{
                    fontWeight: 600,
                    textDecoration: 'none',
                    '& .MuiChip-label': { px: 2 }
                  }}
                />
                <Chip
                  label={`${gambles.length} Gamble${gambles.length !== 1 ? 's' : ''}`}
                  size="medium"
                  variant="filled"
                  color="secondary"
                  component={Link}
                  href={`/gambles?character=${character.name}`}
                  clickable
                  sx={{
                    fontWeight: 600,
                    textDecoration: 'none',
                    '& .MuiChip-label': { px: 2 }
                  }}
                />
                <Chip
                  label={`${quotes.length} Quote${quotes.length !== 1 ? 's' : ''}`}
                  size="medium"
                  variant="filled"
                  component={Link}
                  href={`/quotes?characterId=${character.id}`}
                  clickable
                  sx={{
                    fontWeight: 600,
                    textDecoration: 'none',
                    '& .MuiChip-label': { px: 2 }
                  }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
