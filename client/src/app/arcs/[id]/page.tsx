'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Chip
} from '@mui/material'
import { ArrowLeft, BookOpen, Hash } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'

interface Arc {
  id: number
  name: string
  description: string
  startChapter: number
  endChapter: number
  createdAt: string
  updatedAt: string
}

export default function ArcDetailPage() {
  const theme = useTheme()
  const [arc, setArc] = useState<Arc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()

  // Track page view
  const arcId = Array.isArray(params.id) ? params.id[0] : params.id
  usePageView('arc', arcId || '', !!arcId)

  useEffect(() => {
    const fetchArc = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id
        const data = await api.getArc(Number(id))
        setArc(data)
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchArc()
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

  if (error || !arc) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          {error || 'Arc not found'}
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Button component={Link} href="/arcs" startIcon={<ArrowLeft />}>
            Back to Arcs
          </Button>
        </Box>
      </Container>
    )
  }

  const chapterCount = arc.endChapter - arc.startChapter + 1

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          component={Link}
          href="/arcs"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Arcs
        </Button>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <BookOpen size={48} color={theme.palette.usogui.arc} />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            {arc.name}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip
              label={`Chapters ${arc.startChapter}-${arc.endChapter}`}
              color="secondary"
              variant="filled"
              icon={<Hash size={16} />}
            />
            <Chip
              label={`${chapterCount} chapters total`}
              color="primary"
              variant="outlined"
              icon={<BookOpen size={16} />}
            />
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Story Summary
                </Typography>
                <Typography variant="body1" paragraph>
                  {arc.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Arc Details
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Start Chapter
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {arc.startChapter}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    End Chapter
                  </Typography>
                  <Typography variant="h6" color="secondary">
                    {arc.endChapter}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Chapters
                  </Typography>
                  <Typography variant="h6">
                    {chapterCount}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Added to Database
                  </Typography>
                  <Typography variant="body1">
                    {new Date(arc.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {new Date(arc.updatedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Want to contribute?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Help expand this arc&apos;s information by submitting media or guides
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/submit-media"
              variant="outlined"
              color="primary"
            >
              Submit Media
            </Button>
            <Button
              component={Link}
              href="/submit-guide"
              variant="outlined"
              color="secondary"
            >
              Write a Guide
            </Button>
          </Box>
        </Box>
      </motion.div>
    </Container>
  )
}