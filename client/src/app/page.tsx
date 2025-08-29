'use client'

import { Box, Container, Typography, Grid, Card, CardContent, Button } from '@mui/material'
import { Users, BookOpen, Crown, Zap } from 'lucide-react'
import Link from 'next/link'
import { SearchBar } from '../components/SearchBar'
import { motion } from 'motion/react'

export default function HomePage() {
  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Characters',
      description: 'Explore detailed profiles of all Usogui characters',
      href: '/characters',
      color: 'primary'
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'Story Arcs',
      description: 'Dive into the major arcs and storylines',
      href: '/arcs',
      color: 'secondary'
    },
    {
      icon: <Crown className="w-8 h-8" />,
      title: 'Gambles',
      description: 'Details on every gambling game and competition',
      href: '/gambles',
      color: 'error'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Events',
      description: 'Key events and plot points throughout the series',
      href: '/events',
      color: 'warning'
    }
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box textAlign="center" mb={6}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1976d2, #dc004e)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}
          >
            Welcome to Usogui Fansite
          </Typography>
          <Typography variant="h5" color="text.secondary" mb={4}>
            The ultimate resource for the Usogui gambling manga
          </Typography>
          
          <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
            <SearchBar />
          </Box>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={feature.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className="gambling-card h-full"
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2,
                        color: `${feature.color}.main`
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {feature.description}
                    </Typography>
                    <Button
                      component={Link}
                      href={feature.href}
                      variant="outlined"
                      color={feature.color as any}
                      fullWidth
                    >
                      Explore
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        <Box textAlign="center" mt={6}>
          <Typography variant="h4" gutterBottom>
            Join the Community
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Create an account to submit fan content, guides, and track your reading progress
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button component={Link} href="/register" variant="contained" size="large">
              Sign Up
            </Button>
            <Button component={Link} href="/login" variant="outlined" size="large">
              Log In
            </Button>
          </Box>
        </Box>
      </motion.div>
    </Container>
  )
}