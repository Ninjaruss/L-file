'use client'

import { Box, Container, Typography, Grid, Card, CardContent, Button, Skeleton, Alert, Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Users, BookOpen, Dices, CalendarSearch, TrendingUp, Book, Shield, FileText, Quote, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { SearchBar } from '../components/SearchBar'
import { TrendingSection } from '../components/TrendingSection'
import { VolumeCoverSection } from '../components/VolumeCoverSection'
import { useLandingData } from '../hooks/useLandingData'
import { motion } from 'motion/react'

export default function HomePage() {
  const theme = useTheme()
  const { data: landingData, loading: landingLoading, error: landingError } = useLandingData()
  
  // Primary features - most important content
  const primaryFeatures = [
    {
      icon: <Users className="w-8 h-8" color={theme.palette.usogui.character} />,
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
      icon: <Dices className="w-8 h-8" />,
      title: 'Gambles',
      description: 'Details on every gambling game and competition',
      href: '/gambles',
      color: 'error'
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Guides',
      description: 'In-depth analysis and insights from the community',
      href: '/guides',
      color: 'info'
    }
  ]

  // Secondary features - supporting content
  const secondaryFeatures = [
    {
      icon: <CalendarSearch className="w-8 h-8" />,
      title: 'Events',
      description: 'Key events and plot points',
      href: '/events',
      color: 'warning'
    },
    {
      icon: <Quote className="w-8 h-8" />,
      title: 'Quotes',
      description: 'Memorable lines from Usogui',
      href: '/quotes',
      color: 'success'
    },
    {
      icon: <Book className="w-8 h-8" />,
      title: 'Volumes',
      description: 'Browse volume collections and covers',
      href: '/volumes',
      color: 'success'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Factions',
      description: 'Groups and organizations',
      href: '/factions',
      color: 'secondary'
    }
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hero Section */}
        <Box textAlign="center" mb={8}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: `linear-gradient(45deg, ${theme.palette.usogui.character}, ${theme.palette.usogui.arc})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}
          >
            Welcome to the L-File
          </Typography>
          <Typography variant="h5" color="text.secondary" mb={4}>
            The ultimate database for the gambling manga masterpiece - Usogui (Lie Eater)
          </Typography>

          <Box sx={{ maxWidth: 600, mx: 'auto', mb: 6 }}>
            <SearchBar />
          </Box>

          {/* Quick Stats Bar */}
          {landingData?.stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: { xs: 2, sm: 4 },
                  flexWrap: 'wrap',
                  mb: 2
                }}
              >
                <Chip
                  icon={<FileText className="w-4 h-4" />}
                  label={`${landingData.stats.totalGuides.toLocaleString()} Guides`}
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  icon={<Users className="w-4 h-4" />}
                  label={`${landingData.stats.totalCharacters.toLocaleString()} Characters`}
                  variant="outlined"
                  color="secondary"
                />
                <Chip
                  icon={<Dices className="w-4 h-4" />}
                  label={`${landingData.stats.totalGambles.toLocaleString()} Gambles`}
                  variant="outlined"
                  color="error"
                />
              </Box>
            </motion.div>
          )}
        </Box>

        {/* Featured Volume Covers Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <VolumeCoverSection />
        </motion.div>

        {/* Primary Features Section */}
        <Box mb={8}>
          <Box textAlign="center" mb={5}>
            <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
              <Sparkles className="w-6 h-6" color={theme.palette.primary.main} />
              <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                Start Exploring
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Dive into the world of Usogui with our comprehensive content
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {primaryFeatures.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={feature.title}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <Card
                    className="gambling-card h-full"
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-12px)',
                        boxShadow: theme.shadows[12]
                      }
                    }}
                    component={Link}
                    href={feature.href}
                  >
                    <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
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
                      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={3}>
                        {feature.description}
                      </Typography>
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                        <Typography variant="button" color={`${feature.color}.main`} sx={{ fontWeight: 'bold' }}>
                          Explore
                        </Typography>
                        <ChevronRight className="w-4 h-4" style={{ color: theme.palette[feature.color as 'primary' | 'secondary' | 'error' | 'info'].main }} />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Featured Trending Content */}
        {landingData && (
          <Box mb={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Box textAlign="center" mb={4}>
                <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
                  <TrendingUp className="w-6 h-6" color={theme.palette.primary.main} />
                  <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                    What&apos;s Popular
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  Discover the most viewed content this week
                </Typography>
              </Box>

              {landingError ? (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Unable to load trending content at this time.
                </Alert>
              ) : landingLoading ? (
                <Grid container spacing={3}>
                  {[1, 2, 3].map((i) => (
                    <Grid item xs={12} md={4} key={i}>
                      <Card>
                        <CardContent>
                          <Skeleton variant="text" width="80%" height={24} />
                          <Skeleton variant="text" width="100%" height={40} sx={{ mt: 1 }} />
                          <Skeleton variant="text" width="60%" height={20} sx={{ mt: 1 }} />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box>
                  {landingData.trending.guides.length > 0 && (
                    <TrendingSection
                      title="Trending Guides"
                      items={landingData.trending.guides}
                      type="guides"
                      maxItems={3}
                    />
                  )}
                </Box>
              )}
            </motion.div>
          </Box>
        )}

        {/* More Content Section - Compact */}
        <Box mb={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Box textAlign="center" mb={4}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }} mb={1}>
                More to Discover
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Additional content and features
              </Typography>
            </Box>

            <Grid container spacing={2} justifyContent="center">
              {secondaryFeatures.map((feature) => (
                <Grid item xs={6} sm={4} md={3} key={feature.title}>
                  <Button
                    component={Link}
                    href={feature.href}
                    variant="outlined"
                    fullWidth
                    startIcon={feature.icon}
                    sx={{
                      p: 2,
                      height: '100%',
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      borderColor: `${feature.color}.main`,
                      color: `${feature.color}.main`,
                      '&:hover': {
                        borderColor: `${feature.color}.main`,
                        backgroundColor: `${feature.color}.main`,
                        color: 'white'
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="body2" component="div" sx={{ fontWeight: 'bold' }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {feature.description}
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Box>

        {/* Call to Action Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          <Box
            textAlign="center"
            p={6}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Join the L-File Community
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
              Connect with fellow fans, contribute guides, and track your reading journey
            </Typography>
            <Button
              component={Link}
              href="/login"
              variant="contained"
              size="large"
              sx={{ mr: 2, mb: { xs: 2, sm: 0 } }}
            >
              Get Started
            </Button>
            <Button
              component={Link}
              href="/users"
              variant="outlined"
              size="large"
              startIcon={<Users className="w-4 h-4" />}
            >
              Browse Community
            </Button>
          </Box>
        </motion.div>
      </motion.div>
    </Container>
  )
}