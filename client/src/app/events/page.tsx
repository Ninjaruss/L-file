'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  TextField,
  InputAdornment,
  Pagination,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material'
import { Zap, Eye, Calendar, AlertTriangle, Search } from 'lucide-react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { motion } from 'motion/react'

interface Event {
  id: number
  title: string
  name: string
  description: string
  eventType: string
  chapter: number
  significance: string
  participants: string[]
  outcome: string
  createdAt: string
  updatedAt: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchEvents = async (page = 1, search = '') => {
    setLoading(true)
    try {
      const params: { page: number; limit: number; title?: string } = { page, limit: 12 }
      if (search) params.title = search
      
      const response = await api.getEvents(params)
      setEvents(response.data)
      setTotalPages(response.totalPages)
      setTotal(response.total)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents(currentPage, searchQuery)
  }, [currentPage, searchQuery])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType?.toLowerCase()) {
      case 'gamble':
        return 'error'
      case 'character introduction':
        return 'primary'
      case 'plot development':
        return 'secondary'
      case 'revelation':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getSignificanceColor = (significance: string) => {
    switch (significance?.toLowerCase()) {
      case 'major':
        return 'error'
      case 'moderate':
        return 'warning'
      case 'minor':
        return 'info'
      default:
        return 'default'
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Zap size={48} color="#f57c00" />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Events
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Key moments and turning points in the Usogui story
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search events..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 500, mx: 'auto', display: 'block' }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={50} />
          </Box>
        ) : (
          <>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {total} event{total !== 1 ? 's' : ''} found
            </Typography>

            <Grid container spacing={4}>
              {events.map((event, index) => (
                <Grid item xs={12} sm={6} md={4} key={event.id}>
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
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {event.title}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          {event.chapter && (
                            <Chip
                              label={`Chapter ${event.chapter}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              icon={<Calendar size={14} />}
                              sx={{ mr: 1, mb: 1 }}
                            />
                          )}
                          {event.eventType && (
                            <Chip
                              label={event.eventType}
                              size="small"
                              color={getEventTypeColor(event.eventType) as any}
                              variant="outlined"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          )}
                          {event.significance && (
                            <Chip
                              label={`${event.significance} Impact`}
                              size="small"
                              color={getSignificanceColor(event.significance) as any}
                              variant="filled"
                              icon={<AlertTriangle size={14} />}
                              sx={{ mb: 1 }}
                            />
                          )}
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 3,
                          }}
                        >
                          {event.description}
                        </Typography>

                        {event.participants?.length > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Key Participants:</strong> {event.participants.slice(0, 2).join(', ')}
                            {event.participants.length > 2 && ` +${event.participants.length - 2} more`}
                          </Typography>
                        )}
                      </CardContent>

                      <CardActions>
                        <Button
                          component={Link}
                          href={`/events/${event.id}`}
                          variant="outlined"
                          startIcon={<Eye size={16} />}
                          fullWidth
                        >
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </motion.div>
    </Container>
  )
}
