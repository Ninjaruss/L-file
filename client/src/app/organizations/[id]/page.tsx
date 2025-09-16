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
  Divider
} from '@mui/material'
import { ArrowLeft, Users, Shield, Crown } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import MediaThumbnail from '../../../components/MediaThumbnail'
import MediaGallery from '../../../components/MediaGallery'
import { usePageView } from '../../../hooks/usePageView'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'

interface Organization {
  id: number
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  characters?: Array<{
    id: number
    name: string
    alternateNames?: string[]
    firstAppearanceChapter?: number
  }>
}

export default function OrganizationDetailPage() {
  const theme = useTheme()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [gambles, setGambles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()

  // Track page view
  const organizationId = Array.isArray(params.id) ? params.id[0] : params.id
  usePageView('organization', organizationId || '', !!organizationId)

  useEffect(() => {
    const fetchOrganizationData = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id
        
        // Validate that ID is a valid number
        if (!id || isNaN(Number(id))) {
          setError('Invalid organization ID')
          return
        }
        
        const organizationIdNum = Number(id)
        
        // Additional safety check for negative or zero IDs
        if (organizationIdNum <= 0) {
          setError('Invalid organization ID')
          return
        }
        
        // Fetch organization data
        try {
          const organizationData = await api.getOrganization(organizationIdNum)
          setOrganization(organizationData)

          // Set characters as members
          setMembers(organizationData.characters || [])

          // For now, we'll set empty arrays for other related data
          // In a real implementation, you'd have API endpoints for organization-related data
          setEvents([])
          setGambles([])
        } catch (error: any) {
          setError(error.message)
        } finally {
          setLoading(false)
        }
      } catch (error: any) {
        setError(error.message)
        setLoading(false)
      }
    }

    if (params.id) {
      fetchOrganizationData()
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

  if (error || !organization) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          {error || 'Organization not found'}
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Button component={Link} href="/organizations" startIcon={<ArrowLeft />}>
            Back to Organizations
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
          href="/organizations"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Organizations
        </Button>

        {/* Enhanced Organization Header */}
        <Card className="gambling-card" sx={{ mb: 4, overflow: 'visible' }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={4} lg={3}>
                <Box sx={{ 
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <MediaThumbnail
                    entityType="organization"
                    entityId={organization.id}
                    entityName={organization.name}
                    allowCycling={true}
                    maxWidth={280}
                    maxHeight={320}
                    className="organization-thumbnail"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={8} lg={9}>
                <Box sx={{ pl: { md: 2 } }}>
                  {/* Organization Name with Gradient */}
                  <Typography 
                    variant="h2" 
                    component="h1" 
                    sx={{ 
                      mb: 2,
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.secondary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      fontSize: { xs: '2.5rem', md: '3rem' },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Shield size={40} color={theme.palette.secondary.main} />
                    {organization.name}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {organization.description && (
              <Card className="gambling-card">
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    About {organization.name}
                  </Typography>
                  <TimelineSpoilerWrapper 
                    chapterNumber={1}
                  >
                    <EnhancedSpoilerMarkdown
                      content={organization.description}
                      className="organization-description"
                      enableEntityEmbeds={true}
                      compactEntityCards={false}
                    />
                  </TimelineSpoilerWrapper>
                </CardContent>
              </Card>
            )}

            {/* Members Section */}
            {members.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Users size={24} />
                      Organization Members ({members.length})
                    </Typography>
                    <Button
                      component={Link}
                      href={`/characters?organization=${organization.name}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ borderRadius: '20px' }}
                    >
                      View All Characters
                    </Button>
                  </Box>
                  <Grid container spacing={3}>
                    {members.map((member) => (
                      <Grid item xs={12} sm={6} md={4} key={member.id}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            transition: 'all 0.3s ease',
                            '&:hover': { 
                              transform: 'translateY(-4px)',
                              boxShadow: theme.shadows[8],
                              borderColor: 'primary.main'
                            }
                          }}
                        >
                          <CardContent sx={{ p: 0 }}>
                            {/* Character Thumbnail */}
                            <Box sx={{ 
                              position: 'relative',
                              width: '100%',
                              height: 200,
                              overflow: 'hidden',
                              borderTopLeftRadius: 'inherit',
                              borderTopRightRadius: 'inherit'
                            }}>
                              <MediaThumbnail
                                entityType="character"
                                entityId={member.id}
                                entityName={member.name}
                                allowCycling={false}
                                maxWidth="100%"
                                maxHeight="100%"
                                className="character-thumbnail"
                              />
                            </Box>
                            
                            {/* Character Info */}
                            <Box sx={{ p: 3 }}>
                              <Typography 
                                variant="h6" 
                                component={Link} 
                                href={`/characters/${member.id}`}
                                sx={{ 
                                  textDecoration: 'none', 
                                  color: 'primary.main', 
                                  fontWeight: 600,
                                  display: 'block',
                                  mb: 1,
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                              >
                                {member.name}
                              </Typography>
                            
                            {member.alternateNames && member.alternateNames.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  Also known as:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {member.alternateNames.slice(0, 2).map((name: string, index: number) => (
                                    <Chip
                                      key={index}
                                      label={name}
                                      size="small"
                                      variant="outlined"
                                      sx={{ 
                                        fontSize: '0.7rem',
                                        height: '20px',
                                        borderRadius: '10px'
                                      }}
                                    />
                                  ))}
                                  {member.alternateNames.length > 2 && (
                                    <Chip
                                      label={`+${member.alternateNames.length - 2} more`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ 
                                        fontSize: '0.7rem',
                                        height: '20px',
                                        borderRadius: '10px',
                                        opacity: 0.7
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            )}

                              {member.firstAppearanceChapter && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 1,
                                  mt: 1
                                }}>
                                  <Typography variant="caption" color="text.secondary">
                                    First appeared in Chapter {member.firstAppearanceChapter}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* No Members Message */}
            {members.length === 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Users size={48} color={theme.palette.text.secondary} style={{ opacity: 0.5 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                      No Known Members
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                      This organization currently has no associated character members in our database. 
                      Member relationships may be added as the story progresses.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Related Gambles Section */}
            {gambles.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                      Related Gambles
                    </Typography>
                    <Button
                      component={Link}
                      href={`/gambles?organization=${organization.name}`}
                      size="small"
                      color="primary"
                    >
                      View All
                    </Button>
                  </Box>
                  {gambles.map((gamble) => (
                    <Card key={gamble.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" component={Link} href={`/gambles/${gamble.id}`} 
                                  sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
                          {gamble.name}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <EnhancedSpoilerMarkdown
                            content={gamble.rules}
                            className="organization-gamble-rules"
                            enableEntityEmbeds={true}
                            compactEntityCards={true}
                          />
                        </Box>
                        {gamble.winnerTeam && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Winner:</strong> {gamble.winnerTeam}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Related Events Section */}
            {events.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                      Related Events
                    </Typography>
                    <Button
                      component={Link}
                      href={`/events?organization=${organization.name}`}
                      size="small"
                      color="primary"
                    >
                      View All
                    </Button>
                  </Box>
                  {events.map((event) => (
                    <Card key={event.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            {event.isSpoiler ? (
                              <TimelineSpoilerWrapper 
                                chapterNumber={event.spoilerChapter || event.chapterNumber}
                              >
                                <Typography variant="h6" component={Link} href={`/events/${event.id}`}
                                          sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
                                  {event.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  {event.description}
                                </Typography>
                              </TimelineSpoilerWrapper>
                            ) : (
                              <>
                                <Typography variant="h6" component={Link} href={`/events/${event.id}`}
                                          sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
                                  {event.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  {event.description}
                                </Typography>
                              </>
                            )}
                          </Box>
                          {(event.chapterNumber || event.chapter_number) && (
                            <Chip 
                              label={`Ch. ${event.chapterNumber || event.chapter_number}`} 
                              size="small" 
                              color={event.isSpoiler ? "error" : "secondary"} 
                              variant={event.isSpoiler ? "filled" : "outlined"}
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Media Gallery Section */}
            <Card className="gambling-card" sx={{ mt: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Media Gallery
                </Typography>
                <MediaGallery
                  ownerType="organization"
                  ownerId={organization.id}
                  purpose="gallery"
                  showTitle={false}
                  compactMode={false}
                  showFilters={true}
                  allowMultipleTypes={true}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Organization Details
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Organization Name
                  </Typography>
                  <Typography variant="body1">
                    {organization.name}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Known Members
                  </Typography>
                  <Typography variant="body1">
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  Quick Links
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    component={Link}
                    href="/characters"
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<Users size={16} />}
                  >
                    Browse Characters
                  </Button>
                  <Button
                    component={Link}
                    href="/events"
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<Crown size={16} />}
                  >
                    Browse Events
                  </Button>
                  <Button
                    component={Link}
                    href="/gambles"
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<Shield size={16} />}
                  >
                    Browse Gambles
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