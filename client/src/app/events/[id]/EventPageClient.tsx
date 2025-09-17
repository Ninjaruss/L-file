'use client'

import React from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Grid
} from '@mui/material'
import { ArrowLeft, CalendarSearch, Calendar, Users, BookOpen, Dice6, Tag } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import type { Event } from '../../../types'
import { EventStatus } from '../../../types'

interface EventPageClientProps {
  initialEvent: Event
}

export default function EventPageClient({ initialEvent }: EventPageClientProps) {
  const theme = useTheme()

  // Track page view
  usePageView('event', initialEvent.id.toString(), true)

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          component={Link}
          href="/events"
          variant="outlined"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Events
        </Button>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CalendarSearch size={48} color={theme.palette.usogui.event} />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            {initialEvent.title}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip
              icon={<Calendar size={16} />}
              label={`Chapter ${initialEvent.chapterNumber}`}
              color="primary"
              variant="outlined"
            />
            {initialEvent.arc && (
              <Chip
                icon={<BookOpen size={16} />}
                label={initialEvent.arc.name}
                color="secondary"
                variant="outlined"
                component={Link}
                href={`/arcs/${initialEvent.arc.id}`}
                clickable
              />
            )}
            {initialEvent.gamble && (
              <Chip
                icon={<Dice6 size={16} />}
                label={initialEvent.gamble.name}
                color="info"
                variant="outlined"
                component={Link}
                href={`/gambles/${initialEvent.gamble.id}`}
                clickable
              />
            )}
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Description
                </Typography>
                <TimelineSpoilerWrapper chapterNumber={initialEvent.chapterNumber}>
                  <EnhancedSpoilerMarkdown
                    content={initialEvent.description}
                    className="event-description"
                    enableEntityEmbeds={true}
                    compactEntityCards={false}
                  />
                </TimelineSpoilerWrapper>

                {initialEvent.gamble && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Related Gamble
                    </Typography>
                    <TimelineSpoilerWrapper chapterNumber={initialEvent.chapterNumber}>
                      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {initialEvent.gamble.name}
                        </Typography>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>Rules:</Typography>
                          <EnhancedSpoilerMarkdown
                            content={initialEvent.gamble.rules}
                            className="event-gamble-rules"
                            enableEntityEmbeds={true}
                            compactEntityCards={true}
                          />
                        </Box>
                        {initialEvent.gamble.winCondition && (
                          <Box>
                            <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>Win Condition:</Typography>
                            <EnhancedSpoilerMarkdown
                              content={initialEvent.gamble.winCondition}
                              className="event-gamble-win-condition"
                              enableEntityEmbeds={true}
                              compactEntityCards={true}
                            />
                          </Box>
                        )}
                      </Box>
                    </TimelineSpoilerWrapper>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Event Details
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Chapter
                  </Typography>
                  <Typography
                    variant="body1"
                    component={Link}
                    href={`/chapters/${initialEvent.chapterNumber}`}
                    sx={{
                      textDecoration: 'none',
                      color: 'primary.main',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {initialEvent.chapterNumber}
                  </Typography>
                </Box>

                {initialEvent.arc && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Arc
                    </Typography>
                    <Typography
                      variant="body1"
                      component={Link}
                      href={`/arcs/${initialEvent.arc.id}`}
                      sx={{
                        textDecoration: 'none',
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {initialEvent.arc.name}
                    </Typography>
                  </Box>
                )}

                {initialEvent.gamble && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Related Gamble
                    </Typography>
                    <Typography
                      variant="body1"
                      component={Link}
                      href={`/gambles/${initialEvent.gamble.id}`}
                      sx={{
                        textDecoration: 'none',
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {initialEvent.gamble.name}
                    </Typography>
                  </Box>
                )}

                {initialEvent.spoilerChapter && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Spoiler Chapter
                    </Typography>
                    <Typography variant="body1">
                      Chapter {initialEvent.spoilerChapter}
                    </Typography>
                  </Box>
                )}

                {initialEvent.type && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Event Type
                    </Typography>
                    <Chip
                      label={initialEvent.type.replace('_', ' ').toUpperCase()}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                )}

                {initialEvent.characters?.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Characters
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {initialEvent.characters.map((character) => (
                        <Chip
                          key={character.id}
                          label={character.name}
                          size="small"
                          variant="outlined"
                          color="primary"
                          icon={<Users size={14} />}
                          component={Link}
                          href={`/characters/${character.id}`}
                          clickable
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {initialEvent.tags && initialEvent.tags.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {initialEvent.tags.map((tag) => (
                        <Chip
                          key={tag.id}
                          label={tag.name}
                          size="small"
                          variant="outlined"
                          color="default"
                          icon={<Tag size={14} />}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {initialEvent.status && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Status
                    </Typography>
                    <Chip
                      label={initialEvent.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={initialEvent.status === EventStatus.APPROVED ? 'success' : initialEvent.status === EventStatus.PENDING ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}