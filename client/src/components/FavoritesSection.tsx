'use client'

import { Box, Card, CardContent, Typography, Grid, Chip, Avatar, Stack, Skeleton, Alert } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Quote, Dices, User, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { useFavoritesData } from '../hooks/useFavoritesData'

export function FavoritesSection() {
  const theme = useTheme()
  const { data: favoritesData, loading, error } = useFavoritesData()

  if (error) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Unable to load favorites data. Please check your connection and try again.
      </Alert>
    )
  }

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={4} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="80%" height={32} />
                  <Skeleton variant="text" width="100%" height={60} sx={{ mt: 1 }} />
                  <Skeleton variant="rectangular" width="40%" height={24} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    )
  }

  if (!favoritesData) {
    return null
  }

  const { favoriteQuotes, favoriteGambles, favoriteCharacterMedia } = favoritesData

  return (
    <Box mb={6}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Box textAlign="center" mb={4}>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
            <TrendingUp className="w-6 h-6" color={theme.palette.secondary.main} />
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
              Community Favorites
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            The most beloved content from our community
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Top 3 Favorite Quotes */}
          {favoriteQuotes.length > 0 && (
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Quote className="w-5 h-5" color={theme.palette.success.main} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Top Quotes
                    </Typography>
                  </Box>
                  <Stack spacing={2}>
                    {favoriteQuotes.map((item, index) => (
                      <motion.div
                        key={item.quote.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="body2" sx={{ 
                              fontStyle: 'italic', 
                              mb: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                            }}>
                              "{item.quote.text}"
                            </Typography>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Link href={`/characters/${item.quote.character.id}`} style={{ textDecoration: 'none' }}>
                                <Chip 
                                  label={item.quote.character.name} 
                                  size="small" 
                                  color="primary"
                                  sx={{ cursor: 'pointer' }}
                                />
                              </Link>
                              <Typography variant="caption" color="text.secondary">
                                {item.userCount} user{item.userCount !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Top 3 Favorite Gambles */}
          {favoriteGambles.length > 0 && (
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Dices className="w-5 h-5" color={theme.palette.error.main} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Top Gambles
                    </Typography>
                  </Box>
                  <Stack spacing={2}>
                    {favoriteGambles.map((item, index) => (
                      <motion.div
                        key={item.gamble.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {item.gamble.name}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              mb: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}>
                              {item.gamble.rules}
                            </Typography>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Link href={`/gambles/${item.gamble.id}`} style={{ textDecoration: 'none' }}>
                                <Chip 
                                  label="View Details" 
                                  size="small" 
                                  color="error"
                                  sx={{ cursor: 'pointer' }}
                                />
                              </Link>
                              <Typography variant="caption" color="text.secondary">
                                {item.userCount} user{item.userCount !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Top 3 Character Media */}
          {favoriteCharacterMedia.length > 0 && (
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <User className="w-5 h-5" color={theme.palette.usogui.character} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Popular Profile Pics
                    </Typography>
                  </Box>
                  <Stack spacing={2}>
                    {favoriteCharacterMedia.map((item, index) => (
                      <motion.div
                        key={item.media.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box display="flex" alignItems="center" gap={2} mb={1}>
                              <Avatar 
                                src={item.media.url} 
                                alt={item.media.character.name}
                                sx={{ width: 40, height: 40 }}
                              />
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  {item.media.character.name}
                                </Typography>
                                {item.media.description && (
                                  <Typography variant="caption" color="text.secondary">
                                    {item.media.description}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Link href={`/characters/${item.media.character.id}`} style={{ textDecoration: 'none' }}>
                                <Chip 
                                  label={`Ch. ${item.media.chapterNumber || 'N/A'}`} 
                                  size="small" 
                                  color="primary"
                                  sx={{ cursor: 'pointer' }}
                                />
                              </Link>
                              <Typography variant="caption" color="text.secondary">
                                {item.userCount} user{item.userCount !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Show message if no data */}
        {favoriteQuotes.length === 0 && favoriteGambles.length === 0 && favoriteCharacterMedia.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              No favorites data available yet. Be the first to set your favorites!
            </Typography>
          </Box>
        )}
      </motion.div>
    </Box>
  )
}