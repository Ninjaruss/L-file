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
import { ArrowLeft, Users, Shield, Crown } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
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

interface OrganizationPageClientProps {
  initialOrganization: Organization
  initialMembers: any[]
  initialEvents: any[]
  initialGambles: any[]
}

export default function OrganizationPageClient({
  initialOrganization,
  initialMembers,
  initialEvents,
  initialGambles
}: OrganizationPageClientProps) {
  const theme = useTheme()

  // Track page view
  usePageView('organization', initialOrganization.id.toString(), true)

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
                    entityId={initialOrganization.id}
                    entityName={initialOrganization.name}
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
                    {initialOrganization.name}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {initialOrganization.description && (
              <Card className="gambling-card">
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    About {initialOrganization.name}
                  </Typography>
                  <TimelineSpoilerWrapper
                    chapterNumber={1}
                  >
                    <EnhancedSpoilerMarkdown
                      content={initialOrganization.description}
                      className="organization-description"
                      enableEntityEmbeds={true}
                      compactEntityCards={false}
                    />
                  </TimelineSpoilerWrapper>
                </CardContent>
              </Card>
            )}

            {/* Members Section */}
            {initialMembers.length > 0 && (
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
                      Organization Members ({initialMembers.length})
                    </Typography>
                    <Button
                      component={Link}
                      href={`/characters?organization=${initialOrganization.name}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ borderRadius: '20px' }}
                    >
                      View All Characters
                    </Button>
                  </Box>
                  <Grid container spacing={3}>
                    {initialMembers.map((member) => (
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
            {initialMembers.length === 0 && (
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

            {/* Media Gallery Section */}
            <Card className="gambling-card" sx={{ mt: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Media Gallery
                </Typography>
                <MediaGallery
                  ownerType="organization"
                  ownerId={initialOrganization.id}
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
                    {initialOrganization.name}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Known Members
                  </Typography>
                  <Typography variant="body1">
                    {initialMembers.length} {initialMembers.length === 1 ? 'member' : 'members'}
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