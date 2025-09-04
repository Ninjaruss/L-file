'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem
} from '@mui/material'
import { ArrowLeft, User, Crown, Users as UsersIcon } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import SpoilerWrapper from '../../../components/SpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'
import MediaGallery from '../../../components/MediaGallery'

interface Character {
  id: number
  name: string
  alternateNames: string[]
  description: string
  firstAppearanceChapter: number
  notableRoles: string[]
  notableGames: string[]
  occupation: string
  affiliations: string[]
  imageFileName?: string
  imageDisplayName?: string
  arcs?: Array<{
    id: number
    name: string
    order: number
  }>
}

export default function CharacterDetailPage() {
  const theme = useTheme()
  const [character, setCharacter] = useState<Character | null>(null)
  const [gambles, setGambles] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [guides, setGuides] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [arcs, setArcs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()

  // Track page view
  const characterId = Array.isArray(params.id) ? params.id[0] : params.id
  usePageView('character', characterId || '', !!characterId)

  useEffect(() => {
    const fetchCharacterData = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id
        const characterId = Number(id)
        
        // Fetch character and related data in parallel
        const [characterData, gamblesData, eventsData, guidesData, quotesData, arcsData] = await Promise.all([
          api.getCharacter(characterId),
          api.getCharacterGambles(characterId, { limit: 5 }),
          api.getCharacterEvents(characterId, { limit: 5 }),
          api.getCharacterGuides(characterId, { limit: 5 }),
          api.getCharacterQuotes(characterId, { limit: 10 }),
          api.getCharacterArcs(characterId)
        ])
        
        setCharacter(characterData)
        setGambles(gamblesData.data || [])
        setEvents(eventsData.data || [])
        setGuides(guidesData.data || [])
        setQuotes(quotesData.data || [])
        setArcs(arcsData.data || [])
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCharacterData()
    }
  }, [params.id])

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={50} />
        </Box>
      </Container>
    )
  }

  if (error || !character) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          {error || 'Character not found'}
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Button component={Link} href="/characters" startIcon={<ArrowLeft />}>
            Back to Characters
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          component={Link}
          href="/characters"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Characters
        </Button>

        {/* Header Section - More Compact */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              {character.imageFileName ? (
                <img 
                  src={`/api/media/character/${character.imageFileName}`}
                  alt={character.imageDisplayName || `${character.name} portrait`}
                  style={{ 
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                  }}
                />
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '200px',
                  backgroundColor: 'background.paper',
                  borderRadius: '12px',
                  border: `2px dashed ${theme.palette.divider}`
                }}>
                  <User size={64} color={theme.palette.usogui.character} />
                </Box>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Typography variant="h3" component="h1" sx={{ mb: 2 }}>
              {character.name}
            </Typography>
            
            {character.alternateNames?.length > 0 && (
              <Box sx={{ mb: 3 }}>
                {character.alternateNames.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    size="medium"
                    variant="outlined"
                    color="secondary"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  First Appearance
                </Typography>
                <Typography 
                  variant="body1"
                  component={Link}
                  href={`/chapters/${character.firstAppearanceChapter}`}
                  sx={{ 
                    textDecoration: 'none', 
                    color: 'primary.main',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Chapter {character.firstAppearanceChapter}
                </Typography>
              </Box>

              {character.occupation && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Occupation
                  </Typography>
                  <Typography variant="body1">
                    {character.occupation}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Quick Stats as Chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={`${arcs.length} Arc${arcs.length !== 1 ? 's' : ''}`} 
                size="small" 
                variant="outlined" 
                color="primary"
              />
              <Chip 
                label={`${gambles.length} Gamble${gambles.length !== 1 ? 's' : ''}`} 
                size="small" 
                variant="outlined" 
                color="primary"
              />
              <Chip 
                label={`${quotes.length} Quote${quotes.length !== 1 ? 's' : ''}`} 
                size="small" 
                variant="outlined" 
                color="primary"
              />
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Main Content - Left Column */}
          <Grid item xs={12} lg={8}>
            {/* About Section */}
            <Card className="gambling-card" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  About
                </Typography>
                <SpoilerWrapper 
                  chapterNumber={character.firstAppearanceChapter}
                  spoilerType="minor"
                  description="Character background and story role"
                >
                  <Typography variant="body1" paragraph>
                    {character.description}
                  </Typography>
                </SpoilerWrapper>

                {/* Consolidated Character Details */}
                {(character.notableRoles?.length > 0 || character.notableGames?.length > 0 || character.affiliations?.length > 0) && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      {character.notableRoles?.length > 0 && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="h6" gutterBottom>
                            Notable Roles
                          </Typography>
                          <SpoilerWrapper 
                            chapterNumber={character.firstAppearanceChapter}
                            spoilerType="major"
                            description="Character's story roles and significance"
                          >
                            <List dense sx={{ py: 0 }}>
                              {character.notableRoles.map((role, index) => (
                                <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                                  <Typography variant="body2">• {role}</Typography>
                                </ListItem>
                              ))}
                            </List>
                          </SpoilerWrapper>
                        </Grid>
                      )}

                      {character.notableGames?.length > 0 && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="h6" gutterBottom>
                            Notable Gambles
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {character.notableGames.map((game) => (
                              <Chip
                                key={game}
                                label={game}
                                size="small"
                                color="primary"
                                variant="outlined"
                                icon={<Crown size={14} />}
                              />
                            ))}
                          </Box>
                        </Grid>
                      )}

                      {character.affiliations?.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="h6" gutterBottom>
                            Affiliations
                          </Typography>
                          <SpoilerWrapper 
                            chapterNumber={character.firstAppearanceChapter}
                            spoilerType="major"
                            description="Character's group affiliations and alliances"
                          >
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {character.affiliations.map((affiliation) => (
                                <Chip
                                  key={affiliation}
                                  label={affiliation}
                                  size="small"
                                  color="secondary"
                                  variant="filled"
                                  icon={<UsersIcon size={14} />}
                                  component={Link}
                                  href={`/factions?name=${encodeURIComponent(affiliation)}`}
                                  clickable
                                  sx={{ 
                                    textDecoration: 'none',
                                    '&:hover': { 
                                      backgroundColor: 'secondary.dark'
                                    }
                                  }}
                                />
                              ))}
                            </Box>
                          </SpoilerWrapper>
                        </Grid>
                      )}
                    </Grid>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tabbed Content Section */}
            <Card className="gambling-card">
              <CardContent>
                <Grid container spacing={3}>
                  {/* Quotes */}
                  {quotes.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                          Memorable Quotes
                        </Typography>
                        <Button
                          component={Link}
                          href={`/quotes?characterId=${character.id}`}
                          size="small"
                          color="primary"
                        >
                          View All
                        </Button>
                      </Box>
                      <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                        {quotes.slice(0, 4).map((quote) => (
                          <Box key={quote.id} sx={{ 
                            p: 1.5, 
                            mb: 1.5, 
                            border: 1, 
                            borderColor: 'divider', 
                            borderRadius: 1,
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
                          }}>
                            <SpoilerWrapper 
                              chapterNumber={quote.chapterNumber}
                              spoilerType="minor"
                              description="Character quote and context"
                            >
                              <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 0.5 }}>
                                "{quote.text}"
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Ch. {quote.chapterNumber}{quote.pageNumber && `, p.${quote.pageNumber}`}
                              </Typography>
                            </SpoilerWrapper>
                          </Box>
                        ))}
                        {quotes.length > 4 && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                            Showing 4 of {quotes.length} quotes
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  )}

                  {/* Related Content */}
                  <Grid item xs={12} md={quotes.length > 0 ? 6 : 12}>
                    {/* Arc Appearances */}
                    {arcs.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Arc Appearances
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {arcs.map((arc) => (
                            <Chip
                              key={arc.id}
                              label={arc.name}
                              size="small"
                              component={Link}
                              href={`/arcs/${arc.id}`}
                              clickable
                              color="primary"
                              variant="outlined"
                              sx={{ 
                                textDecoration: 'none',
                                '&:hover': { 
                                  backgroundColor: 'primary.main',
                                  color: 'white'
                                }
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Gambles - Compact List */}
                    {gambles.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6">
                            Related Gambles
                          </Typography>
                          <Button
                            component={Link}
                            href={`/gambles?character=${character.name}`}
                            size="small"
                            color="primary"
                          >
                            View All
                          </Button>
                        </Box>
                        <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                          {gambles.slice(0, 3).map((gamble) => (
                            <Box key={gamble.id} sx={{ 
                              p: 1, 
                              mb: 1, 
                              border: 1, 
                              borderColor: 'divider', 
                              borderRadius: 1 
                            }}>
                              <Typography 
                                variant="subtitle2" 
                                component={Link} 
                                href={`/gambles/${gamble.id}`}
                                sx={{ 
                                  textDecoration: 'none', 
                                  color: 'primary.main', 
                                  '&:hover': { textDecoration: 'underline' } 
                                }}
                              >
                                {gamble.name}
                              </Typography>
                              {gamble.winnerTeam && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  Winner: {gamble.winnerTeam}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Events - Compact List */}
                    {events.length > 0 && (
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6">
                            Key Events
                          </Typography>
                          <Button
                            component={Link}
                            href={`/events?character=${character.name}`}
                            size="small"
                            color="primary"
                          >
                            View All
                          </Button>
                        </Box>
                        <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                          {events.slice(0, 3).map((event) => (
                            <Box key={event.id} sx={{ 
                              p: 1, 
                              mb: 1, 
                              border: 1, 
                              borderColor: 'divider', 
                              borderRadius: 1 
                            }}>
                              {event.isSpoiler ? (
                                <SpoilerWrapper 
                                  chapterNumber={event.spoilerChapter || event.chapterNumber}
                                  spoilerType="major"
                                  description="Event details and outcome"
                                >
                                  <Typography 
                                    variant="subtitle2" 
                                    component={Link} 
                                    href={`/events/${event.id}`}
                                    sx={{ 
                                      textDecoration: 'none', 
                                      color: 'primary.main', 
                                      '&:hover': { textDecoration: 'underline' } 
                                    }}
                                  >
                                    {event.title}
                                  </Typography>
                                </SpoilerWrapper>
                              ) : (
                                <Typography 
                                  variant="subtitle2" 
                                  component={Link} 
                                  href={`/events/${event.id}`}
                                  sx={{ 
                                    textDecoration: 'none', 
                                    color: 'primary.main', 
                                    '&:hover': { textDecoration: 'underline' } 
                                  }}
                                >
                                  {event.title}
                                </Typography>
                              )}
                              {(event.chapterNumber || event.chapter_number) && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  Ch. {event.chapterNumber || event.chapter_number}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            {/* Guides Section */}
            {guides.length > 0 && (
              <Card className="gambling-card">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Related Guides
                    </Typography>
                    <Button
                      component={Link}
                      href={`/guides?character=${character.name}`}
                      size="small"
                      color="primary"
                    >
                      View All
                    </Button>
                  </Box>
                  {guides.slice(0, 4).map((guide) => (
                    <Box key={guide.id} sx={{ 
                      p: 1.5, 
                      mb: 1.5, 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1 
                    }}>
                      <Typography 
                        variant="subtitle2" 
                        component={Link} 
                        href={`/guides/${guide.id}`}
                        sx={{ 
                          textDecoration: 'none', 
                          color: 'primary.main', 
                          '&:hover': { textDecoration: 'underline' },
                          display: 'block',
                          mb: 0.5
                        }}
                      >
                        {guide.title}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          By {guide.author?.username || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {guide.viewCount || 0} views
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* Media Gallery Section - Full width below main content */}
        <Card className="gambling-card" sx={{ mt: 3 }}>
          <CardContent>
            <MediaGallery 
              characterId={character.id} 
              limit={12}
              showTitle={true}
              compactMode={false}
            />
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  )
}