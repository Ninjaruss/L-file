'use client'

import React, { useState, useEffect } from 'react'
import {
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Grid,
  Button,
  Tabs,
  Tab
} from '@mui/material'
import { User, Crown, Calendar, BookOpen, AlertTriangle } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import MediaGallery from '../../../components/MediaGallery'
import CharacterTimeline from '../../../components/CharacterTimeline'
import { useProgress } from '../../../providers/ProgressProvider'
import { useSpoilerSettings } from '../../../hooks/useSpoilerSettings'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import type { Arc, Event, Gamble, Guide, Quote } from '../../../types'

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

interface CharacterPageClientProps {
  character: Character
  gambles: Gamble[]
  events: Event[]
  guides: Guide[]
  quotes: Quote[]
  arcs: Arc[]
}

export default function CharacterPageClient({
  character,
  gambles,
  events,
  guides,
  quotes,
  arcs
}: CharacterPageClientProps) {
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Track page view
  usePageView('character', character.id.toString(), true)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  if (!isClient) {
    return <Box sx={{ p: 2 }}>Loading...</Box>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
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
          {/* Enhanced Overview Tab */}
          {activeTab === 0 && (
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Grid container spacing={3}>
                {/* Main Content - Left Column */}
                <Grid item xs={12} lg={8}>
                  {/* Enhanced About Section */}
                  <Card className="gambling-card" sx={{
                    mb: 3,
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    boxShadow: theme.shadows[2],
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.shadows[6],
                      transform: 'translateY(-2px)'
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 3,
                        pb: 2,
                        borderBottom: `2px solid ${theme.palette.divider}`,
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: -2,
                          left: 0,
                          width: '60px',
                          height: '2px',
                          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, transparent 100%)`
                        }
                      }}>
                        <User size={24} style={{ marginRight: 12 }} color={theme.palette.primary.main} />
                        <Typography variant="h4" sx={{
                          fontWeight: 700,
                          color: 'primary.main',
                          letterSpacing: '-0.5px'
                        }}>
                          About
                        </Typography>
                      </Box>

                      {character.description && character.firstAppearanceChapter && (
                        <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter}>
                          <EnhancedSpoilerMarkdown
                            content={character.description}
                            className="character-description"
                            enableEntityEmbeds={true}
                            compactEntityCards={false}
                          />
                        </TimelineSpoilerWrapper>
                      )}

                      {character.description && !character.firstAppearanceChapter && (
                        <EnhancedSpoilerMarkdown
                          content={character.description}
                          className="character-description"
                          enableEntityEmbeds={true}
                          compactEntityCards={false}
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Enhanced Quotes and Gambles Content */}
                  <Grid container spacing={3}>
                    {/* Quotes Section */}
                    {quotes.length > 0 && (
                      <Grid item xs={12} lg={6}>
                        <Card className="gambling-card" sx={{
                          background: `linear-gradient(135deg, ${theme.palette.warning.main}08 0%, transparent 100%)`,
                          border: `1px solid ${theme.palette.warning.main}15`,
                          borderRadius: 3,
                          boxShadow: theme.shadows[1],
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: theme.shadows[4],
                            transform: 'translateY(-2px)'
                          }
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
                                fontWeight: 700,
                                color: 'warning.main',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                letterSpacing: '-0.3px'
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

                            <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                              {quotes.slice(0, 3).map((quote) => (
                                <Box key={quote.id} sx={{
                                  p: 2,
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
                                    width: 3,
                                    backgroundColor: 'warning.main',
                                    borderRadius: '0 2px 2px 0'
                                  }
                                }}>
                                  <TimelineSpoilerWrapper chapterNumber={quote.chapter?.number || 1}>
                                    <Typography variant="body2" sx={{
                                      fontStyle: 'italic',
                                      fontSize: '0.9rem',
                                      lineHeight: 1.5,
                                      mb: 1,
                                      pl: 1
                                    }}>
                                      &ldquo;{quote.text}&rdquo;
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{
                                      backgroundColor: 'rgba(255,255,255,0.1)',
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: '8px',
                                      fontWeight: 500,
                                      ml: 1
                                    }}>
                                      Ch. {quote.chapter?.number || '?'}
                                    </Typography>
                                  </TimelineSpoilerWrapper>
                                </Box>
                              ))}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    {/* Gambles Section */}
                    {gambles.length > 0 && (
                      <Grid item xs={12} lg={quotes.length > 0 ? 6 : 12}>
                        <Card className="gambling-card" sx={{
                          background: `linear-gradient(135deg, ${theme.palette.secondary.main}08 0%, transparent 100%)`,
                          border: `1px solid ${theme.palette.secondary.main}15`,
                          borderRadius: 3,
                          boxShadow: theme.shadows[1],
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: theme.shadows[4],
                            transform: 'translateY(-2px)'
                          }
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
                                fontWeight: 700,
                                color: 'secondary.main',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                letterSpacing: '-0.3px'
                              }}>
                                <Crown size={24} />
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

                            <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                              {gambles.slice(0, 4).map((gamble) => (
                                <Box key={gamble.id} sx={{
                                  p: 2.5,
                                  mb: 2,
                                  borderRadius: 2,
                                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                                  border: `1px solid ${theme.palette.divider}`,
                                  position: 'relative',
                                  transition: 'all 0.2s ease',
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: 3,
                                    backgroundColor: 'secondary.main',
                                    borderRadius: '0 2px 2px 0'
                                  },
                                  '&:hover': {
                                    transform: 'translateY(-1px)',
                                    boxShadow: theme.shadows[3]
                                  }
                                }}>
                                  <GambleSpoilerWrapper gamble={gamble}>
                                    <Typography
                                      variant="subtitle1"
                                      component={Link}
                                      href={`/gambles/${gamble.id}`}
                                      sx={{
                                        textDecoration: 'none',
                                        color: 'secondary.main',
                                        fontWeight: 600,
                                        display: 'block',
                                        mb: 1,
                                        lineHeight: 1.3,
                                        pl: 1,
                                        '&:hover': { textDecoration: 'underline' }
                                      }}
                                    >
                                      {gamble.name}
                                    </Typography>

                                    <Box sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                      mt: 1,
                                      ml: 1
                                    }}>
                                      <Calendar size={14} color={theme.palette.text.secondary} />
                                      <Typography variant="caption" color="text.secondary" sx={{
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: '8px',
                                        fontWeight: 500
                                      }}>
                                        Ch. {gamble.chapterId || 'Unknown'}
                                      </Typography>
                                    </Box>
                                  </GambleSpoilerWrapper>
                                </Box>
                              ))}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
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
                      top: 20,
                      borderRadius: 3,
                      boxShadow: theme.shadows[2],
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: theme.shadows[6],
                        transform: 'translateY(-2px)'
                      }
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
                            fontWeight: 700,
                            color: 'success.main',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            letterSpacing: '-0.3px'
                          }}>
                            <BookOpen size={24} />
                            Guides
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
                          {guides.slice(0, 3).map((guide) => (
                            <Box key={guide.id} sx={{
                              p: 2.5,
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
                                width: 3,
                                background: 'success.main',
                                borderRadius: '0 2px 2px 0'
                              },
                              '&:hover': {
                                transform: 'translateX(4px)',
                                boxShadow: theme.shadows[4]
                              }
                            }}>
                              <Typography
                                variant="subtitle1"
                                component={Link}
                                href={`/guides/${guide.id}`}
                                sx={{
                                  textDecoration: 'none',
                                  color: 'success.main',
                                  fontWeight: 600,
                                  display: 'block',
                                  mb: 1,
                                  lineHeight: 1.3,
                                  '&:hover': {
                                    textDecoration: 'underline'
                                  }
                                }}
                              >
                                {guide.title}
                              </Typography>

                              <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mt: 1.5
                              }}>
                                <User size={14} color={theme.palette.text.secondary} />
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  By {guide.author?.username || 'Unknown'}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  )}

                  {/* Arc Appearances */}
                  {arcs.length > 0 && (
                    <Card className="gambling-card" sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, transparent 100%)`,
                      border: `1px solid ${theme.palette.primary.main}15`,
                      borderRadius: 3,
                      boxShadow: theme.shadows[1],
                      mt: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: theme.shadows[4],
                        transform: 'translateY(-2px)'
                      }
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{
                          mb: 2,
                          fontWeight: 700,
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          letterSpacing: '-0.3px'
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
                  chapterNumber: event.chapterNumber,
                  type: event.type,
                  description: event.description,
                  arcId: (event as any).arc?.id || (event as any).arcId || 0,
                  arcName: (event as any).arc?.name || (event as any).arcName || 'Unknown'
                }))}
                arcs={arcs}
                characterName={character.name}
                firstAppearanceChapter={character.firstAppearanceChapter || 1}
              />
            </Box>
          )}

          {/* Enhanced Media Tab */}
          {activeTab === 2 && (
            <Box sx={{
              p: { xs: 2, sm: 3, md: 4 },
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
            }}>
              {/* Enhanced Media Header */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h4"
                  sx={{
                    mb: 2,
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    letterSpacing: '-0.5px'
                  }}
                >
                  <BookOpen size={32} color={theme.palette.primary.main} />
                  Character Media
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    maxWidth: '600px'
                  }}
                >
                  Explore fan art, videos, and other media featuring {character.name}
                </Typography>
              </Box>

              {/* Enhanced Media Gallery Container */}
              <Box sx={{
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255,255,255,0.02) 100%)`,
                borderRadius: 3,
                p: { xs: 2, md: 3 },
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[1],
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `radial-gradient(circle at 20% 80%, ${theme.palette.primary.main}03 0%, transparent 50%)`,
                  borderRadius: 3,
                  pointerEvents: 'none'
                }
              }}>
                <MediaGallery
                  characterId={character.id}
                  limit={12}
                  showTitle={false}
                  compactMode={false}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Card>
    </motion.div>
  )
}

// Gamble Spoiler Wrapper Component - Adapted from CharacterTimeline's TimelineSpoilerWrapper
function GambleSpoilerWrapper({ gamble, children }: { gamble: Gamble, children: React.ReactNode }) {
  const [isRevealed, setIsRevealed] = useState(false)
  const { userProgress } = useProgress()
  const { settings } = useSpoilerSettings()
  const theme = useTheme()

  const shouldHideSpoiler = () => {
    const chapterNumber = gamble.chapterId

    // First check if spoiler settings say to show all spoilers
    if (settings.showAllSpoilers) {
      return false
    }

    // Determine the effective progress to use for spoiler checking
    // Priority: spoiler settings tolerance > user progress
    const effectiveProgress = settings.chapterTolerance > 0
      ? settings.chapterTolerance
      : userProgress

    // If we have a chapter number, use unified logic
    if (chapterNumber) {
      // Gambles are typically minor spoilers, so use standard comparison
      return chapterNumber > effectiveProgress
    }

    // For gambles without chapter numbers, be conservative and hide them
    // unless user has made significant progress
    return effectiveProgress <= 5
  }

  // Always check client-side logic, don't rely solely on server's isSpoiler
  // This ensures spoilers work properly when not logged in
  const clientSideShouldHide = shouldHideSpoiler()

  // Always render the gamble, but with spoiler protection overlay if needed
  if (!clientSideShouldHide || isRevealed) {
    return <>{children}</>
  }

  const handleReveal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRevealed(true)
  }

  const chapterNumber = gamble.chapterId

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Render the actual content underneath */}
      <Box sx={{ opacity: 0.3, filter: 'blur(2px)', pointerEvents: 'none' }}>
        {children}
      </Box>

      {/* Spoiler overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'error.light',
          borderRadius: 1,
          cursor: 'pointer',
          border: `1px solid ${theme.palette.error.main}`,
          '&:hover': {
            backgroundColor: 'error.dark'
          },
          zIndex: 100
        }}
        onClick={handleReveal}
      >
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Typography
            variant="caption"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              fontSize: '0.75rem',
              mb: 0.5
            }}
          >
            <AlertTriangle size={14} />
            Chapter {chapterNumber || 'Unknown'} Spoiler
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.65rem',
              display: 'block'
            }}
          >
            Click to reveal
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}