'use client'

import { Box, Typography, Grid, Card, CardContent, Chip, Avatar } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { TrendingUp, Eye, Users, BookOpen, Dices, CalendarSearch } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'

interface TrendingItem {
  id: number
  title?: string
  name?: string
  description?: string
  rules?: string
  viewCount: number
  recentViewCount: number
  author?: { id: number; username: string }
  createdAt?: string
}

interface TrendingSectionProps {
  title: string
  items: TrendingItem[]
  type: 'guides' | 'characters' | 'events' | 'gambles'
  maxItems?: number
}

export function TrendingSection({ title, items, type, maxItems = 3 }: TrendingSectionProps) {
  const theme = useTheme()
  
  const getTypeConfig = () => {
    switch (type) {
      case 'guides':
        return {
          icon: <BookOpen className="w-5 h-5" />,
          color: theme.palette.primary.main,
          href: '/guides'
        }
      case 'characters':
        return {
          icon: <Users className="w-5 h-5" />,
          color: theme.palette.usogui?.character || theme.palette.secondary.main,
          href: '/characters'
        }
      case 'events':
        return {
          icon: <CalendarSearch className="w-5 h-5" />,
          color: theme.palette.warning.main,
          href: '/events'
        }
      case 'gambles':
        return {
          icon: <Dices className="w-5 h-5" />,
          color: theme.palette.error.main,
          href: '/gambles'
        }
      default:
        return {
          icon: <TrendingUp className="w-5 h-5" />,
          color: theme.palette.primary.main,
          href: '/'
        }
    }
  }

  const typeConfig = getTypeConfig()
  const displayItems = items.slice(0, maxItems)

  if (displayItems.length === 0) {
    return null
  }

  return (
    <Box mb={4}>
      <Box display="flex" alignItems="center" mb={2}>
        <Box sx={{ color: typeConfig.color, mr: 1 }}>
          {typeConfig.icon}
        </Box>
        <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <Link 
          href={typeConfig.href}
          style={{ 
            color: typeConfig.color, 
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          View all →
        </Link>
      </Box>
      
      <Grid container spacing={2}>
        {displayItems.map((item, index) => (
          <Grid item xs={12} md={4} key={item.id}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                component={Link}
                href={`${typeConfig.href}/${item.id}`}
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  height: '100%',
                  display: 'block',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography
                      variant="subtitle2"
                      component="h4"
                      sx={{
                        fontWeight: 600,
                        flexGrow: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.title || item.name}
                    </Typography>
                    <Chip
                      icon={<TrendingUp className="w-3 h-3" />}
                      label={item.recentViewCount}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ ml: 1, fontSize: '0.75rem' }}
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      flexGrow: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '2.5em',
                    }}
                  >
                    {item.description || item.rules || 'No description available'}
                  </Typography>

                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Eye className="w-4 h-4" color={theme.palette.text.secondary} />
                      <Typography variant="caption" color="text.secondary">
                        {item.viewCount.toLocaleString()} views
                      </Typography>
                    </Box>
                    
                    {type === 'guides' && item.author && (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Avatar sx={{ width: 16, height: 16, fontSize: '0.625rem' }}>
                          {item.author.username[0].toUpperCase()}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          {item.author.username}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}