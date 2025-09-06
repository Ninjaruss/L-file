'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Divider
} from '@mui/material'
import { ArrowLeft, Crown, Users, Trophy } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import SpoilerWrapper from '../../../components/SpoilerWrapper'
import GambleTimeline from '../../../components/GambleTimeline'

interface Gamble {
  id: number
  name: string
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

export default function GambleDetailsPage() {
  const theme = useTheme()
  const { id } = useParams()
  const [gamble, setGamble] = useState<Gamble | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timelineEvents, setTimelineEvents] = useState<any[]>([])
  const [arcs, setArcs] = useState<any[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)

  // Track page view
  const gambleId = Array.isArray(id) ? id[0] : id
  usePageView('gamble', gambleId || '', !!gambleId)

  useEffect(() => {
    const fetchGamble = async () => {
      try {
        setLoading(true)
        const response = await api.getGamble(Number(id))
        setGamble(response)
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'Failed to fetch gamble details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchGamble()
    }
  }, [id])

  // Fetch timeline events and arcs when gamble is loaded
  useEffect(() => {
    const fetchTimelineData = async () => {
      if (!gamble) return
      
      try {
        setTimelineLoading(true)
        
        // Fetch events and arcs in parallel
        const [eventsResponse, arcsResponse] = await Promise.all([
          api.getEvents({ limit: 100 }), // Get a large set of events to filter from
          api.getArcs({ limit: 100 })
        ])
        
        // Filter events to those related to this gamble's timeline
        // We'll include events from a few chapters before and after the gamble chapter
        const gambleChapter = gamble.chapter?.number || gamble.chapterId
        const chapterRange = 10 // Include events from 10 chapters before and after
        
        const filteredEvents = eventsResponse.data.filter((event: any) => 
          event.chapterNumber && 
          event.chapterNumber >= (gambleChapter - chapterRange) &&
          event.chapterNumber <= (gambleChapter + chapterRange)
        )
        
        setTimelineEvents(filteredEvents)
        setArcs(arcsResponse.data || [])
        
      } catch (error: unknown) {
        console.error('Failed to fetch timeline data:', error)
      } finally {
        setTimelineLoading(false)
      }
    }

    fetchTimelineData()
  }, [gamble])

  // Remove difficulty logic as it's not in the backend structure

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={50} />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button component={Link} href="/gambles" variant="outlined" startIcon={<ArrowLeft />}>
          Back to Gambles
        </Button>
      </Container>
    )
  }

  if (!gamble) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Gamble not found
        </Alert>
        <Button component={Link} href="/gambles" variant="outlined" startIcon={<ArrowLeft />}>
          Back to Gambles
        </Button>
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
          href="/gambles"
          variant="outlined"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Gambles
        </Button>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Crown size={48} color={theme.palette.usogui.gamble} />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            {gamble.name}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip
              label={gamble.chapter 
                ? `Chapter ${gamble.chapter.number}${gamble.chapter.title ? `: ${gamble.chapter.title}` : ''}`
                : `Chapter ${gamble.chapterId}`
              }
              color="primary"
              variant="outlined"
            />
            {gamble.participants && gamble.participants.length > 0 && (
              <Chip
                icon={<Users size={16} />}
                label={`${gamble.participants.length} Participants`}
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Rules
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                  {gamble.rules}
                </Typography>

                {gamble.winCondition && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom>
                      Win Condition
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                      {gamble.winCondition}
                    </Typography>
                  </>
                )}

              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Details
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Chapter
                  </Typography>
                  <Typography 
                    variant="body1"
                    component={Link}
                    href={`/chapters/${gamble.chapter ? gamble.chapter.number : gamble.chapterId}`}
                    sx={{ 
                      textDecoration: 'none', 
                      color: 'primary.main',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {gamble.chapter 
                      ? `Chapter ${gamble.chapter.number}${gamble.chapter.title ? ` - ${gamble.chapter.title}` : ''}`
                      : `Chapter ${gamble.chapterId}`
                    }
                  </Typography>
                </Box>

                {gamble.participants && gamble.participants.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Participants ({gamble.participants.length})
                    </Typography>
                    <SpoilerWrapper 
                      chapterNumber={gamble.chapter?.number || gamble.chapterId}
                      spoilerType="minor"
                      description="Gamble participants"
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {gamble.participants.map((participant) => (
                          <Box key={participant.id} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle2">
                                {participant.name}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </SpoilerWrapper>
                  </Box>
                )}

              </CardContent>
            </Card>

          </Grid>
        </Grid>

        {/* Timeline Section */}
        {timelineEvents.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <GambleTimeline
              events={timelineEvents}
              arcs={arcs}
              gambleName={gamble.name}
              gambleChapter={gamble.chapter?.number || gamble.chapterId}
            />
          </Box>
        )}
      </motion.div>
    </Container>
  )
}