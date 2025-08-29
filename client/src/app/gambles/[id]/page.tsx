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
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material'
import { ArrowLeft, Crown, Users, Trophy, Target, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'

interface Gamble {
  id: number
  name: string
  description: string
  rules: string
  difficulty: string
  winConditions: string[]
  loseConditions: string[]
  participants: string[]
  outcome: string
  stakes: string
  location: string
  duration: string
  createdAt: string
  updatedAt: string
}

export default function GambleDetailsPage() {
  const { id } = useParams()
  const [gamble, setGamble] = useState<Gamble | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'success'
      case 'medium':
        return 'warning'
      case 'hard':
        return 'error'
      default:
        return 'default'
    }
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
            <Crown size={48} color="#d32f2f" />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            {gamble.name}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {gamble.difficulty && (
              <Chip
                label={`${gamble.difficulty} Difficulty`}
                color={getDifficultyColor(gamble.difficulty) as any}
                variant="outlined"
              />
            )}
            {gamble.participants?.length > 0 && (
              <Chip
                icon={<Users size={16} />}
                label={`${gamble.participants.length} Participants`}
                color="primary"
                variant="outlined"
              />
            )}
            {gamble.outcome && (
              <Chip
                icon={<Trophy size={16} />}
                label="Completed"
                color="success"
                variant="filled"
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
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                  {gamble.description}
                </Typography>

                {gamble.rules && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom>
                      Rules
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                      {gamble.rules}
                    </Typography>
                  </>
                )}

                {gamble.outcome && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom>
                      Outcome
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                      {gamble.outcome}
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
                  Gamble Details
                </Typography>
                
                {gamble.stakes && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Stakes
                    </Typography>
                    <Typography variant="body1">
                      {gamble.stakes}
                    </Typography>
                  </Box>
                )}

                {gamble.location && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Location
                    </Typography>
                    <Typography variant="body1">
                      {gamble.location}
                    </Typography>
                  </Box>
                )}

                {gamble.duration && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Duration
                    </Typography>
                    <Typography variant="body1">
                      {gamble.duration}
                    </Typography>
                  </Box>
                )}

                {gamble.participants?.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Participants
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {gamble.participants.map((participant, index) => (
                        <Chip
                          key={index}
                          label={participant}
                          size="small"
                          variant="outlined"
                          color="primary"
                          icon={<Users size={14} />}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {(gamble.winConditions?.length > 0 || gamble.loseConditions?.length > 0) && (
              <Card className="gambling-card" sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Conditions
                  </Typography>

                  {gamble.winConditions?.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Target size={20} color="#4caf50" />
                        <Typography variant="subtitle1" sx={{ ml: 1, color: 'success.main' }}>
                          Win Conditions
                        </Typography>
                      </Box>
                      <List dense>
                        {gamble.winConditions.map((condition, index) => (
                          <ListItem key={index} sx={{ pl: 0 }}>
                            <ListItemText
                              primary={condition}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {gamble.loseConditions?.length > 0 && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AlertTriangle size={20} color="#f44336" />
                        <Typography variant="subtitle1" sx={{ ml: 1, color: 'error.main' }}>
                          Lose Conditions
                        </Typography>
                      </Box>
                      <List dense>
                        {gamble.loseConditions.map((condition, index) => (
                          <ListItem key={index} sx={{ pl: 0 }}>
                            <ListItemText
                              primary={condition}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}