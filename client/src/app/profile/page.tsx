'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'
import { User, Settings, Crown, BookOpen, Save } from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { api } from '../../lib/api'
import { motion } from 'motion/react'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [selectedQuote, setSelectedQuote] = useState<number | null>(null)
  const [selectedGamble, setSelectedGamble] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real implementation, you'd fetch quotes and gambles from the API
        // For now, we'll set defaults
        setSelectedQuote(user?.favoriteQuoteId || null)
        setSelectedGamble(user?.favoriteGambleId || null)
      } catch (error) {
        console.error('Failed to fetch profile data:', error)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  const handleSaveProfile = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.updateProfile({
        favoriteQuoteId: selectedQuote || undefined,
        favoriteGambleId: selectedGamble || undefined,
      })
      
      await refreshUser()
      setSuccess('Profile updated successfully!')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="warning">
          Please log in to view your profile.
        </Alert>
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
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              bgcolor: 'primary.main',
              fontSize: '2rem'
            }}
          >
            {user.username[0].toUpperCase()}
          </Avatar>
          <Typography variant="h3" component="h1" gutterBottom>
            {user.username}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {user.role === 'admin' ? 'Administrator' : 
             user.role === 'moderator' ? 'Moderator' : 'Member'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card className="gambling-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <User size={24} />
                  <Typography variant="h5" sx={{ ml: 1 }}>
                    Account Information
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Username
                  </Typography>
                  <Typography variant="body1">
                    {user.username}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {user.email}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Email Status
                  </Typography>
                  <Chip
                    label={user.isEmailVerified ? 'Verified' : 'Not Verified'}
                    color={user.isEmailVerified ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Role
                  </Typography>
                  <Chip
                    label={user.role}
                    color={user.role === 'admin' ? 'error' : user.role === 'moderator' ? 'warning' : 'default'}
                    variant="outlined"
                    icon={user.role === 'admin' || user.role === 'moderator' ? <Crown size={16} /> : undefined}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Reading Progress
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <BookOpen size={16} color="#1976d2" style={{ marginRight: 8 }} />
                    <Typography variant="h6" color="primary">
                      Chapter {user.userProgress}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card className="gambling-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Settings size={24} />
                  <Typography variant="h5" sx={{ ml: 1 }}>
                    Preferences
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Favorite Quote</InputLabel>
                    <Select
                      value={selectedQuote || ''}
                      label="Favorite Quote"
                      onChange={(e) => setSelectedQuote(e.target.value as number)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {/* In a real implementation, these would be loaded from the API */}
                      <MenuItem value={1}>
                        &ldquo;The only way to truly win is to not play at all.&rdquo; - Baku Madarame
                      </MenuItem>
                      <MenuItem value={2}>
                        &ldquo;In gambling, the house always wins... except when it doesn&apos;t.&rdquo; - Souichi Kiruma
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Favorite Gamble</InputLabel>
                    <Select
                      value={selectedGamble || ''}
                      label="Favorite Gamble"
                      onChange={(e) => setSelectedGamble(e.target.value as number)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {/* In a real implementation, these would be loaded from the API */}
                      <MenuItem value={1}>17 Steps</MenuItem>
                      <MenuItem value={2}>One-Card Poker</MenuItem>
                      <MenuItem value={3}>Doubt</MenuItem>
                      <MenuItem value={4}>Air Poker</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <Save size={20} />}
                  onClick={handleSaveProfile}
                  disabled={loading}
                  fullWidth
                  size="large"
                >
                  {loading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Card className="gambling-card">
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Activity & Contributions
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Track your contributions to the Usogui fansite community
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Guides Written
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="secondary">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Media Submitted
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {user.userProgress}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Chapters Read
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Likes Received
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </motion.div>
    </Container>
  )
}