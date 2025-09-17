'use client'

import React from 'react'
import {
  Container,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Grid,
  Button,
  Divider
} from '@mui/material'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { motion } from 'motion/react'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'

interface Volume {
  id: number
  number: number
  title?: string
}

interface Character {
  id: number
  name: string
}

interface Event {
  id: number
  title: string
  description: string
}

interface Quote {
  id: number
  text: string
  pageNumber?: number
  character?: Character
}

interface Chapter {
  id: number
  number: number
  chapterNumber?: number
  title?: string | null
  summary?: string | null
  description?: string
  volumeId?: number
  volume?: Volume
  createdAt?: string
  updatedAt?: string
}

interface ChapterPageClientProps {
  initialChapter: Chapter
  initialEvents: Event[]
  initialQuotes: Quote[]
  initialCharacters: Character[]
}

export default function ChapterPageClient({
  initialChapter,
  initialEvents,
  initialQuotes,
  initialCharacters
}: ChapterPageClientProps) {
  const theme = useTheme()

  // Track page view
  usePageView('chapter', initialChapter.id.toString(), true)

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          component={Link}
          href="/chapters"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Chapters
        </Button>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <BookOpen size={48} color={theme.palette.primary.main} />
          </Box>

          <Typography variant="h3" component="h1" gutterBottom>
            Chapter {initialChapter.number}
          </Typography>

          {initialChapter.title && (
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {initialChapter.title}
            </Typography>
          )}

          {initialChapter.volume && (
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`Volume ${initialChapter.volume.number}${initialChapter.volume.title ? `: ${initialChapter.volume.title}` : ''}`}
                component={Link}
                href={`/volumes/${initialChapter.volume.id}`}
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
            </Box>
          )}
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {(initialChapter.description || initialChapter.summary) && (
              <Card className="gambling-card">
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Chapter Summary
                  </Typography>
                  <TimelineSpoilerWrapper
                    chapterNumber={initialChapter.number}
                  >
                    <Typography variant="body1" paragraph>
                      {initialChapter.description || initialChapter.summary}
                    </Typography>
                  </TimelineSpoilerWrapper>
                </CardContent>
              </Card>
            )}

            {/* Events Section */}
            {initialEvents.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Chapter Events
                  </Typography>
                  {initialEvents.map((event) => (
                    <Card key={event.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" component={Link} href={`/events/${event.id}`}
                                  sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
                          {event.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {event.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quotes Section */}
            {initialQuotes.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Memorable Quotes
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {initialQuotes.map((quote) => (
                      <Box key={quote.id} sx={{
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
                      }}>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1, lineHeight: 1.4 }}>
                          &ldquo;{quote.text}&rdquo;
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {quote.character && `— ${quote.character.name}`}
                          {quote.pageNumber && `, p.${quote.pageNumber}`}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Chapter Info
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chapter Number
                  </Typography>
                  <Typography variant="body1">
                    {initialChapter.number}
                  </Typography>
                </Box>

                {initialChapter.volume && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Volume
                    </Typography>
                    <Typography
                      variant="body1"
                      component={Link}
                      href={`/volumes/${initialChapter.volume.id}`}
                      sx={{
                        textDecoration: 'none',
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      Volume {initialChapter.volume.number}
                      {initialChapter.volume.title && ` - ${initialChapter.volume.title}`}
                    </Typography>
                  </Box>
                )}

                {/* Characters Section */}
                {initialCharacters.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Featured Characters
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {initialCharacters.map((character) => (
                        <Chip
                          key={character.id}
                          label={character.name}
                          size="small"
                          component={Link}
                          href={`/characters/${character.id}`}
                          clickable
                          color="secondary"
                          variant="outlined"
                          sx={{
                            textDecoration: 'none',
                            '&:hover': {
                              backgroundColor: 'secondary.main',
                              color: 'white'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}