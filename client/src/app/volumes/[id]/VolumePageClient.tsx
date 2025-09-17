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
import { ArrowLeft, Book, Hash } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { motion } from 'motion/react'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'
import MediaThumbnail from '../../../components/MediaThumbnail'

interface Volume {
  id: number
  number: number
  title?: string
  description?: string
  coverUrl?: string
  startChapter: number
  endChapter: number
  createdAt: string
  updatedAt: string
}

interface VolumePageClientProps {
  initialVolume: Volume
  initialChapters: number[]
}

export default function VolumePageClient({ initialVolume, initialChapters }: VolumePageClientProps) {
  const theme = useTheme()

  // Track page view
  usePageView('volume', initialVolume.id.toString(), true)

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          component={Link}
          href="/volumes"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Volumes
        </Button>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Volume {initialVolume.number}
          </Typography>

          {initialVolume.title && (
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {initialVolume.title}
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <MediaThumbnail
              entityType="volume"
              entityId={initialVolume.id}
              entityName={`Volume ${initialVolume.number}`}
              maxWidth="200px"
              maxHeight="300px"
              allowCycling={true}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Chip
              label={`Chapters ${initialVolume.startChapter}-${initialVolume.endChapter}`}
              size="medium"
              color="primary"
              variant="outlined"
              icon={<Hash size={16} />}
            />
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {initialVolume.description && (
              <Card className="gambling-card">
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Volume Summary
                  </Typography>
                  <TimelineSpoilerWrapper
                    chapterNumber={initialVolume.startChapter}
                  >
                    <Typography variant="body1" paragraph>
                      {initialVolume.description}
                    </Typography>
                  </TimelineSpoilerWrapper>
                </CardContent>
              </Card>
            )}

            {/* Chapters Section */}
            {initialChapters.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Chapters in this Volume
                  </Typography>
                  <Grid container spacing={1}>
                    {initialChapters.map((chapterNumber) => (
                      <Grid item xs={6} sm={4} md={3} key={chapterNumber}>
                        <Button
                          component={Link}
                          href={`/chapters/${chapterNumber}`}
                          variant="outlined"
                          size="small"
                          fullWidth
                          sx={{
                            mb: 1,
                            '&:hover': {
                              backgroundColor: 'primary.main',
                              color: 'white',
                              borderColor: 'primary.main'
                            }
                          }}
                        >
                          Chapter {chapterNumber}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Volume Info
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Volume Number
                  </Typography>
                  <Typography variant="body1">
                    {initialVolume.number}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chapter Range
                  </Typography>
                  <Typography variant="body1">
                    Chapters {initialVolume.startChapter} - {initialVolume.endChapter}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Chapters
                  </Typography>
                  <Typography variant="body1">
                    {initialVolume.endChapter - initialVolume.startChapter + 1} chapters
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Quick Navigation
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    component={Link}
                    href={`/chapters/${initialVolume.startChapter}`}
                    variant="outlined"
                    size="small"
                    fullWidth
                  >
                    First Chapter ({initialVolume.startChapter})
                  </Button>
                  <Button
                    component={Link}
                    href={`/chapters/${initialVolume.endChapter}`}
                    variant="outlined"
                    size="small"
                    fullWidth
                  >
                    Last Chapter ({initialVolume.endChapter})
                  </Button>
                  <Button
                    component={Link}
                    href="/chapters"
                    variant="outlined"
                    size="small"
                    fullWidth
                  >
                    Browse All Chapters
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}