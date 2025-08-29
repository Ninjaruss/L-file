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
  ListItem,
  ListItemText
} from '@mui/material'
import { ArrowLeft, User, Crown, Users as UsersIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'

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
}

export default function CharacterDetailPage() {
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()

  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id
        const data = await api.getCharacter(Number(id))
        setCharacter(data)
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCharacter()
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

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <User size={48} color="#1976d2" />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            {character.name}
          </Typography>
          
          {character.alternateNames?.length > 0 && (
            <Box sx={{ mb: 2 }}>
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
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  About
                </Typography>
                <Typography variant="body1" paragraph>
                  {character.description}
                </Typography>

                {character.occupation && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Occupation
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {character.occupation}
                    </Typography>
                  </>
                )}

                {character.notableRoles?.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Notable Roles
                    </Typography>
                    <List dense>
                      {character.notableRoles.map((role, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemText primary={role} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                {character.notableGames?.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Notable Gambles
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {character.notableGames.map((game) => (
                        <Chip
                          key={game}
                          label={game}
                          color="primary"
                          variant="outlined"
                          icon={<Crown size={16} />}
                        />
                      ))}
                    </Box>
                  </>
                )}

                {character.affiliations?.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Affiliations
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {character.affiliations.map((affiliation) => (
                        <Chip
                          key={affiliation}
                          label={affiliation}
                          color="secondary"
                          variant="filled"
                          icon={<UsersIcon size={16} />}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Character Stats
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    First Appearance
                  </Typography>
                  <Typography variant="body1">
                    Chapter {character.firstAppearanceChapter}
                  </Typography>
                </Box>

                {character.occupation && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Primary Role
                    </Typography>
                    <Typography variant="body1">
                      {character.occupation}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Aliases
                  </Typography>
                  <Typography variant="body1">
                    {character.alternateNames?.length || 0}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Known Gambles
                  </Typography>
                  <Typography variant="body1">
                    {character.notableGames?.length || 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}