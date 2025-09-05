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
  Tabs,
  Tab
} from '@mui/material'
import { ArrowLeft, User, Crown, Users as UsersIcon, Calendar, BookOpen, Heart, Eye } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import SpoilerWrapper from '../../../components/SpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'
import MediaGallery from '../../../components/MediaGallery'
import CharacterTimeline from '../../../components/CharacterTimeline'

interface Character {
  id: number
  name: string
  alternateNames: string[] | null
  description: string | null
  firstAppearanceChapter: number | null
  notableRoles: string[] | null
  notableGames: string[] | null
  occupation: string | null
  affiliations: string[] | null
  imageFileName?: string | null
  imageDisplayName?: string | null
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
  const [activeTab, setActiveTab] = useState(0)
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
          api.getCharacterEvents(characterId), // Remove limit to get all events
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

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

        {/* Enhanced Character Header */}
        <Card className="gambling-card" sx={{ mb: 4, overflow: 'visible' }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={4} lg={3}>
                <Box sx={{ 
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  {character.imageFileName ? (
                    <Box sx={{ 
                      position: 'relative',
                      display: 'inline-block',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(135deg, transparent 0%, ${theme.palette.primary.main}15 100%)`,
                        borderRadius: '16px',
                        pointerEvents: 'none'
                      }
                    }}>
                      <img 
                        src={`/api/media/character/${character.imageFileName}`}
                        alt={character.imageDisplayName || `${character.name} portrait`}
                        style={{ 
                          width: '100%',
                          maxWidth: '280px',
                          height: 'auto',
                          maxHeight: '320px',
                          borderRadius: '16px',
                          boxShadow: `0 12px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)`,
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          cursor: 'pointer',
                          objectFit: 'cover'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                          e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)'
                          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      height: '280px',
                      maxWidth: '280px',
                      margin: '0 auto',
                      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                      borderRadius: '16px',
                      border: `2px solid ${theme.palette.divider}`,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `radial-gradient(circle at 30% 30%, ${theme.palette.primary.main}08 0%, transparent 50%)`,
                        borderRadius: '16px'
                      }
                    }}>
                      <User size={80} color={theme.palette.text.secondary} style={{ opacity: 0.6 }} />
                    </Box>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={8} lg={9}>
                <Box sx={{ pl: { md: 2 } }}>
                  {/* Character Name with Gradient */}
                  <Typography 
                    variant="h2" 
                    component="h1" 
                    sx={{ 
                      mb: 2,
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
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
                              fontSize: '0.875rem',
                              '&:hover': {
                                backgroundColor: 'secondary.main',
                                color: 'white',
                                borderColor: 'secondary.main'
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Key Information Cards */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {character.firstAppearanceChapter && (
                      <Grid item xs={12} sm={6} md={4}>
                        <Card sx={{ 
                          p: 2, 
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, transparent 100%)`,
                          border: `1px solid ${theme.palette.primary.main}20`,
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[4]
                          }
                        }}>
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
                    )}

                    {character.occupation && (
                      <Grid item xs={12} sm={6} md={4}>
                        <Card sx={{ 
                          p: 2, 
                          background: `linear-gradient(135deg, ${theme.palette.secondary.main}08 0%, transparent 100%)`,
                          border: `1px solid ${theme.palette.secondary.main}20`,
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[4]
                          }
                        }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Occupation
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {character.occupation}
                          </Typography>
                        </Card>
                      </Grid>
                    )}
                  </Grid>

                  {/* Enhanced Stats Chips */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    <Chip 
                      label={`${arcs.length} Arc${arcs.length !== 1 ? 's' : ''}`} 
                      size="medium" 
                      variant="filled"
                      color="primary"
                      sx={{ 
                        fontWeight: 600,
                        '& .MuiChip-label': { px: 2 }
                      }}
                    />
                    <Chip 
                      label={`${gambles.length} Gamble${gambles.length !== 1 ? 's' : ''}`} 
                      size="medium" 
                      variant="filled"
                      color="secondary"
                      sx={{ 
                        fontWeight: 600,
                        '& .MuiChip-label': { px: 2 }
                      }}
                    />
                    <Chip 
                      label={`${quotes.length} Quote${quotes.length !== 1 ? 's' : ''}`} 
                      size="medium" 
                      variant="filled"
                      sx={{ 
                        fontWeight: 600,
                        backgroundColor: theme.palette.info.main,
                        color: 'white',
                        '& .MuiChip-label': { px: 2 }
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <Card className="gambling-card" sx={{ mb: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              sx={{ px: 2 }}
            >
              <Tab 
                label="Overview" 
                icon={<User size={18} />}
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
              <Tab 
                label="Timeline" 
                icon={<Calendar size={18} />}
                iconPosition="start" 
                sx={{ minHeight: 48 }}
                disabled={events.length === 0}
              />
              <Tab 
                label="Media" 
                icon={<BookOpen size={18} />}
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ p: 0 }}>
            {/* Overview Tab */}
            {activeTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Main Content - Left Column */}
                  <Grid item xs={12} lg={8}>
                    {/* Enhanced About Section */}
                    <Card className="gambling-card" sx={{ 
                      mb: 3,
                      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                      border: `1px solid ${theme.palette.divider}`
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          mb: 3,
                          pb: 2,
                          borderBottom: `2px solid ${theme.palette.divider}`
                        }}>
                          <User size={24} style={{ marginRight: 12 }} color={theme.palette.primary.main} />
                          <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            About
                          </Typography>
                        </Box>

                        {character.description && character.firstAppearanceChapter && (
                          <SpoilerWrapper 
                            chapterNumber={character.firstAppearanceChapter}
                            spoilerType="minor"
                            description="Character background and story role"
                          >
                            <Typography variant="body1" sx={{ 
                              fontSize: '1.1rem',
                              lineHeight: 1.7,
                              mb: 3,
                              color: 'text.primary'
                            }}>
                              {character.description}
                            </Typography>
                          </SpoilerWrapper>
                        )}

                        {character.description && !character.firstAppearanceChapter && (
                          <Typography variant="body1" sx={{ 
                            fontSize: '1.1rem',
                            lineHeight: 1.7,
                            mb: 3,
                            color: 'text.primary'
                          }}>
                            {character.description}
                          </Typography>
                        )}

                        {/* Enhanced Character Details */}
                        {((character.notableRoles && character.notableRoles.length > 0) || 
                          (character.notableGames && character.notableGames.length > 0) || 
                          (character.affiliations && character.affiliations.length > 0)) && (
                          <>
                            <Divider sx={{ my: 3 }} />
                            <Grid container spacing={3}>
                              {character.notableRoles && character.notableRoles.length > 0 && (
                                <Grid item xs={12} md={6}>
                                  <Box sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}05 0%, transparent 100%)`,
                                    border: `1px solid ${theme.palette.primary.main}15`
                                  }}>
                                    <Typography variant="h6" sx={{ 
                                      mb: 2, 
                                      fontWeight: 600,
                                      color: 'primary.main',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1
                                    }}>
                                      <Crown size={20} />
                                      Notable Roles
                                    </Typography>
                                    {character.firstAppearanceChapter ? (
                                      <SpoilerWrapper 
                                        chapterNumber={character.firstAppearanceChapter}
                                        spoilerType="major"
                                        description="Character's story roles and significance"
                                      >
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                          {character.notableRoles.map((role, index) => (
                                            <Box
                                              key={index}
                                              sx={{
                                                p: 1.5,
                                                borderRadius: 1,
                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${theme.palette.divider}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                              }}
                                            >
                                              <Box sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                backgroundColor: 'primary.main'
                                              }} />
                                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {role}
                                              </Typography>
                                            </Box>
                                          ))}
                                        </Box>
                                      </SpoilerWrapper>
                                    ) : (
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {character.notableRoles.map((role, index) => (
                                          <Box
                                            key={index}
                                            sx={{
                                              p: 1.5,
                                              borderRadius: 1,
                                              backgroundColor: 'rgba(255,255,255,0.05)',
                                              border: `1px solid ${theme.palette.divider}`,
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 1
                                            }}
                                          >
                                            <Box sx={{
                                              width: 8,
                                              height: 8,
                                              borderRadius: '50%',
                                              backgroundColor: 'primary.main'
                                            }} />
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                              {role}
                                            </Typography>
                                          </Box>
                                        ))}
                                      </Box>
                                    )}
                                  </Box>
                                </Grid>
                              )}

                              {character.notableGames && character.notableGames.length > 0 && (
                                <Grid item xs={12} md={6}>
                                  <Box sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${theme.palette.secondary.main}05 0%, transparent 100%)`,
                                    border: `1px solid ${theme.palette.secondary.main}15`
                                  }}>
                                    <Typography variant="h6" sx={{ 
                                      mb: 2, 
                                      fontWeight: 600,
                                      color: 'secondary.main',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1
                                    }}>
                                      <Crown size={20} />
                                      Notable Gambles
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                      {character.notableGames.map((game) => (
                                        <Chip
                                          key={game}
                                          label={game}
                                          size="medium"
                                          color="secondary"
                                          variant="filled"
                                          icon={<Crown size={16} />}
                                          sx={{
                                            borderRadius: '12px',
                                            fontWeight: 500,
                                            '&:hover': {
                                              transform: 'translateY(-1px)',
                                              boxShadow: theme.shadows[4]
                                            }
                                          }}
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                </Grid>
                              )}

                              {character.affiliations && character.affiliations.length > 0 && (
                                <Grid item xs={12}>
                                  <Box sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${theme.palette.info.main}05 0%, transparent 100%)`,
                                    border: `1px solid ${theme.palette.info.main}15`
                                  }}>
                                    <Typography variant="h6" sx={{ 
                                      mb: 2, 
                                      fontWeight: 600,
                                      color: 'info.main',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1
                                    }}>
                                      <UsersIcon size={20} />
                                      Affiliations
                                    </Typography>
                                    {character.firstAppearanceChapter ? (
                                      <SpoilerWrapper 
                                        chapterNumber={character.firstAppearanceChapter}
                                        spoilerType="major"
                                        description="Character's group affiliations and alliances"
                                      >
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                          {character.affiliations.map((affiliation) => (
                                            <Chip
                                              key={affiliation}
                                              label={affiliation}
                                              size="medium"
                                              color="info"
                                              variant="filled"
                                              icon={<UsersIcon size={16} />}
                                              component={Link}
                                              href={`/factions?name=${encodeURIComponent(affiliation)}`}
                                              clickable
                                              sx={{ 
                                                textDecoration: 'none',
                                                borderRadius: '12px',
                                                fontWeight: 500,
                                                transition: 'all 0.2s ease',
                                                '&:hover': { 
                                                  transform: 'translateY(-2px)',
                                                  boxShadow: theme.shadows[6]
                                                }
                                              }}
                                            />
                                          ))}
                                        </Box>
                                      </SpoilerWrapper>
                                    ) : (
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {character.affiliations.map((affiliation) => (
                                          <Chip
                                            key={affiliation}
                                            label={affiliation}
                                            size="medium"
                                            color="info"
                                            variant="filled"
                                            icon={<UsersIcon size={16} />}
                                            component={Link}
                                            href={`/factions?name=${encodeURIComponent(affiliation)}`}
                                            clickable
                                            sx={{ 
                                              textDecoration: 'none',
                                              borderRadius: '12px',
                                              fontWeight: 500,
                                              transition: 'all 0.2s ease',
                                              '&:hover': { 
                                                transform: 'translateY(-2px)',
                                                boxShadow: theme.shadows[6]
                                              }
                                            }}
                                          />
                                        ))}
                                      </Box>
                                    )}
                                  </Box>
                                </Grid>
                              )}
                            </Grid>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Enhanced Quotes and Related Content */}
                    <Grid container spacing={3}>
                      {/* Quotes Section */}
                      {quotes.length > 0 && (
                        <Grid item xs={12} lg={6}>
                          <Card className="gambling-card" sx={{
                            background: `linear-gradient(135deg, ${theme.palette.warning.main}08 0%, transparent 100%)`,
                            border: `1px solid ${theme.palette.warning.main}15`
                          }}>
                            <CardContent sx={{ p: 3 }}>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                mb: 3,
                                pb: 2,
                                borderBottom: `2px solid ${theme.palette.divider}`
                              }}>
                                <Typography variant="h5" sx={{ 
                                  fontWeight: 600,
                                  color: 'warning.main',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}>
                                  <BookOpen size={24} />
                                  Memorable Quotes
                                </Typography>
                                <Button
                                  component={Link}
                                  href={`/quotes?characterId=${character.id}`}
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  sx={{ borderRadius: '20px' }}
                                >
                                  View All
                                </Button>
                              </Box>
                              
                              <Box sx={{ maxHeight: 350, overflowY: 'auto', pr: 1 }}>
                                {quotes.slice(0, 4).map((quote, index) => (
                                  <Box key={quote.id} sx={{ 
                                    p: 2.5, 
                                    mb: 2, 
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                                    border: `1px solid ${theme.palette.divider}`,
                                    position: 'relative',
                                    '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      left: 0,
                                      top: 0,
                                      bottom: 0,
                                      width: 4,
                                      backgroundColor: 'warning.main',
                                      borderRadius: '0 2px 2px 0'
                                    },
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: theme.shadows[4],
                                      transition: 'all 0.2s ease'
                                    }
                                  }}>
                                    <SpoilerWrapper 
                                      chapterNumber={quote.chapterNumber}
                                      spoilerType="minor"
                                      description="Character quote and context"
                                    >
                                      <Box sx={{ position: 'relative', mb: 1.5 }}>
                                        <Typography variant="h4" sx={{ 
                                          position: 'absolute',
                                          left: -8,
                                          top: -8,
                                          color: 'warning.main',
                                          opacity: 0.2,
                                          fontWeight: 'bold',
                                          lineHeight: 1,
                                          zIndex: 0
                                        }}>
                                          "
                                        </Typography>
                                        <Typography variant="body1" sx={{ 
                                          fontStyle: 'italic', 
                                          fontSize: '1rem',
                                          lineHeight: 1.6,
                                          position: 'relative',
                                          zIndex: 1,
                                          pl: 1
                                        }}>
                                          {quote.text}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                      }}>
                                        <Typography variant="caption" color="text.secondary" sx={{
                                          backgroundColor: 'rgba(255,255,255,0.1)',
                                          px: 1.5,
                                          py: 0.5,
                                          borderRadius: '12px',
                                          fontWeight: 500
                                        }}>
                                          Ch. {quote.chapterNumber}{quote.pageNumber && `, p.${quote.pageNumber}`}
                                        </Typography>
                                      </Box>
                                    </SpoilerWrapper>
                                  </Box>
                                ))}
                                {quotes.length > 4 && (
                                  <Typography variant="body2" color="text.secondary" sx={{ 
                                    display: 'block', 
                                    textAlign: 'center',
                                    p: 2,
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderRadius: 2,
                                    fontStyle: 'italic'
                                  }}>
                                    Showing 4 of {quotes.length} quotes
                                  </Typography>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}

                      {/* Related Content */}
                      <Grid item xs={12} lg={quotes.length > 0 ? 6 : 12}>
                        <Grid container spacing={2}>
                          {/* Arc Appearances */}
                          {arcs.length > 0 && (
                            <Grid item xs={12}>
                              <Card className="gambling-card" sx={{
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, transparent 100%)`,
                                border: `1px solid ${theme.palette.primary.main}15`,
                                mb: 2
                              }}>
                                <CardContent sx={{ p: 3 }}>
                                  <Typography variant="h6" sx={{ 
                                    mb: 2,
                                    fontWeight: 600,
                                    color: 'primary.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                  }}>
                                    <BookOpen size={20} />
                                    Arc Appearances
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {arcs.map((arc) => (
                                      <Chip
                                        key={arc.id}
                                        label={arc.name}
                                        size="medium"
                                        component={Link}
                                        href={`/arcs/${arc.id}`}
                                        clickable
                                        color="primary"
                                        variant="outlined"
                                        sx={{ 
                                          textDecoration: 'none',
                                          borderRadius: '16px',
                                          fontWeight: 500,
                                          transition: 'all 0.2s ease',
                                          '&:hover': { 
                                            backgroundColor: 'primary.main',
                                            color: 'white',
                                            transform: 'translateY(-2px)',
                                            boxShadow: theme.shadows[4]
                                          }
                                        }}
                                      />
                                    ))}
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          )}

                          {/* Gambles */}
                          {gambles.length > 0 && (
                            <Grid item xs={12}>
                              <Card className="gambling-card" sx={{
                                background: `linear-gradient(135deg, ${theme.palette.secondary.main}08 0%, transparent 100%)`,
                                border: `1px solid ${theme.palette.secondary.main}15`
                              }}>
                                <CardContent sx={{ p: 3 }}>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    mb: 2 
                                  }}>
                                    <Typography variant="h6" sx={{
                                      fontWeight: 600,
                                      color: 'secondary.main',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1
                                    }}>
                                      <Crown size={20} />
                                      Related Gambles
                                    </Typography>
                                    <Button
                                      component={Link}
                                      href={`/gambles?character=${character.name}`}
                                      size="small"
                                      variant="outlined"
                                      color="secondary"
                                      sx={{ borderRadius: '20px' }}
                                    >
                                      View All
                                    </Button>
                                  </Box>
                                  
                                  <Box sx={{ maxHeight: 250, overflowY: 'auto' }}>
                                    {gambles.slice(0, 3).map((gamble) => (
                                      <Box key={gamble.id} sx={{ 
                                        p: 2, 
                                        mb: 1.5, 
                                        borderRadius: 2,
                                        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                                        border: `1px solid ${theme.palette.divider}`,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                          transform: 'translateY(-1px)',
                                          boxShadow: theme.shadows[2]
                                        }
                                      }}>
                                        <Typography 
                                          variant="subtitle1" 
                                          component={Link} 
                                          href={`/gambles/${gamble.id}`}
                                          sx={{ 
                                            textDecoration: 'none', 
                                            color: 'secondary.main',
                                            fontWeight: 600,
                                            display: 'block',
                                            mb: 0.5,
                                            '&:hover': { textDecoration: 'underline' } 
                                          }}
                                        >
                                          {gamble.name}
                                        </Typography>
                                        {gamble.winnerTeam && (
                                          <Typography variant="body2" color="text.secondary" sx={{ 
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                          }}>
                                            <Crown size={14} />
                                            Winner: {gamble.winnerTeam}
                                          </Typography>
                                        )}
                                      </Box>
                                    ))}
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          )}
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Enhanced Sidebar */}
                  <Grid item xs={12} lg={4}>
                    {/* Enhanced Guides Section */}
                    {guides.length > 0 && (
                      <Card className="gambling-card" sx={{
                        background: `linear-gradient(135deg, ${theme.palette.success.main}08 0%, transparent 100%)`,
                        border: `1px solid ${theme.palette.success.main}15`,
                        position: 'sticky',
                        top: 20
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            mb: 3,
                            pb: 2,
                            borderBottom: `2px solid ${theme.palette.divider}`
                          }}>
                            <Typography variant="h5" sx={{
                              fontWeight: 600,
                              color: 'success.main',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              <BookOpen size={24} />
                              Related Guides
                            </Typography>
                            <Button
                              component={Link}
                              href={`/guides?character=${character.name}`}
                              size="small"
                              variant="outlined"
                              color="success"
                              sx={{ borderRadius: '20px' }}
                            >
                              View All
                            </Button>
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {guides.slice(0, 4).map((guide, index) => (
                              <Box key={guide.id} sx={{ 
                                p: 3, 
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                                border: `1px solid ${theme.palette.divider}`,
                                position: 'relative',
                                transition: 'all 0.3s ease',
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  bottom: 0,
                                  width: 4,
                                  background: `linear-gradient(180deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                                  borderRadius: '0 2px 2px 0'
                                },
                                '&:hover': {
                                  transform: 'translateX(4px)',
                                  boxShadow: theme.shadows[8],
                                  '&::before': {
                                    width: 6
                                  }
                                }
                              }}>

                                <Typography 
                                  variant="h6" 
                                  component={Link} 
                                  href={`/guides/${guide.id}`}
                                  sx={{ 
                                    textDecoration: 'none', 
                                    color: 'success.main',
                                    fontWeight: 600,
                                    display: 'block',
                                    mb: 2,
                                    lineHeight: 1.3,
                                    '&:hover': { 
                                      textDecoration: 'underline',
                                      color: 'success.dark'
                                    }
                                  }}
                                >
                                  {guide.title}
                                </Typography>
                                
                                <Box sx={{ 
                                  mt: 2,
                                  pt: 2,
                                  borderTop: `1px solid ${theme.palette.divider}`
                                }}>
                                  {/* Author */}
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1,
                                    mb: 1.5
                                  }}>
                                    <User size={16} color={theme.palette.text.secondary} />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                      By {guide.author?.username || 'Unknown'}
                                    </Typography>
                                  </Box>

                                  {/* Stats Row */}
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 2
                                  }}>
                                    <Box sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 1,
                                      backgroundColor: 'rgba(255,255,255,0.08)',
                                      px: 1.5,
                                      py: 0.5,
                                      borderRadius: '16px',
                                      border: `1px solid ${theme.palette.divider}`
                                    }}>
                                      <Eye size={14} color={theme.palette.text.secondary} />
                                      <Typography variant="caption" color="text.secondary" sx={{ 
                                        fontWeight: 600,
                                        fontSize: '0.75rem'
                                      }}>
                                        {guide.views || guide.viewCount || 0}
                                      </Typography>
                                    </Box>

                                    <Box sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 1,
                                      backgroundColor: 'rgba(255,255,255,0.08)',
                                      px: 1.5,
                                      py: 0.5,
                                      borderRadius: '16px',
                                      border: `1px solid ${theme.palette.divider}`
                                    }}>
                                      <Heart size={14} color={theme.palette.error.main} />
                                      <Typography variant="caption" color="text.secondary" sx={{ 
                                        fontWeight: 600,
                                        fontSize: '0.75rem'
                                      }}>
                                        {guide.likes || guide.likeCount || 0}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                          
                          {guides.length > 4 && (
                            <Box sx={{ 
                              mt: 3, 
                              pt: 3,
                              borderTop: `1px solid ${theme.palette.divider}`,
                              textAlign: 'center'
                            }}>
                              <Typography variant="body2" color="text.secondary" sx={{ 
                                fontStyle: 'italic',
                                mb: 2
                              }}>
                                {guides.length - 4} more guide{guides.length - 4 !== 1 ? 's' : ''} available
                              </Typography>
                              <Button
                                component={Link}
                                href={`/guides?character=${character.name}`}
                                variant="contained"
                                color="success"
                                size="small"
                                sx={{ 
                                  borderRadius: '20px',
                                  px: 3
                                }}
                              >
                                View All Guides
                              </Button>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Timeline Tab */}
            {activeTab === 1 && events.length > 0 && (
              <Box>
                <CharacterTimeline
                  events={events.map(event => ({
                    id: event.id,
                    title: event.title,
                    chapterNumber: event.chapterNumber || event.chapter_number,
                    arcId: event.arcId,
                    arcName: event.arcName,
                    isSpoiler: event.isSpoiler,
                    spoilerChapter: event.spoilerChapter,
                    description: event.description
                  }))}
                  arcs={arcs}
                  characterName={character.name}
                  firstAppearanceChapter={character.firstAppearanceChapter || 1}
                />
              </Box>
            )}

            {/* Media Tab */}
            {activeTab === 2 && (
              <CardContent>
                <MediaGallery 
                  characterId={character.id} 
                  limit={12}
                  showTitle={true}
                  compactMode={false}
                />
              </CardContent>
            )}
          </Box>
        </Card>
      </motion.div>
    </Container>
  )
}
