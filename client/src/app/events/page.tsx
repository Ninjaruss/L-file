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
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material'
import { CalendarSearch, Eye, Calendar, Search } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import type { Event, Arc } from '../../types'

export default function EventsPage() {
  const theme = useTheme()
  const [groupedEvents, setGroupedEvents] = useState<{
    arcs: Array<{ arc: Arc; events: Event[] }>
    noArc: Event[]
  }>({ arcs: [], noArc: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchEvents = async (search = '', type = '', status = '') => {
    setLoading(true)
    try {
      if (search) {
        // Fall back to regular search when searching
        const params: Record<string, string | number> = { page: 1, limit: 100, title: search }
        if (type) params.type = type
        if (status) params.status = status
        
        const response = await api.getEvents(params)
        setGroupedEvents({
          arcs: [],
          noArc: response.data
        })
      } else {
        // Use grouped endpoint when not searching
        const params: Record<string, string> = {}
        if (type) params.type = type
        if (status) params.status = status
        
        const response = await api.getEventsGroupedByArc(params)
        setGroupedEvents(response)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents(searchQuery, typeFilter, statusFilter)
  }, [searchQuery, typeFilter, statusFilter])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const handleTypeChange = (event: SelectChangeEvent) => {
    setTypeFilter(event.target.value as string)
  }

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value as string)
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType?.toLowerCase()) {
      case 'gamble':
        return 'primary'
      case 'decision':
        return 'secondary'
      case 'reveal':
        return 'warning'
      case 'shift':
        return 'info'
      case 'resolution':
        return 'success'
      default:
        return 'default'
    }
  }

  const renderEvent = (event: Event, index: number) => (
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
              {event.chapterNumber && (
                <Chip
                  label={`Chapter ${event.chapterNumber}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  icon={<Calendar size={14} />}
                  component={Link}
                  href={`/chapters/${event.chapterNumber}`}
                  clickable
                  sx={{ 
                    mr: 1, 
                    mb: 1,
                    textDecoration: 'none',
                    '&:hover': { 
                      backgroundColor: 'primary.main',
                      color: 'white'
                    }
                  }}
                />
              )}
              {event.type && (
                <Chip
                  label={event.type.replace('_', ' ').toUpperCase()}
                  size="small"
                  color={getEventTypeColor(event.type) as any}
                  variant="outlined"
                  sx={{ mr: 1, mb: 1 }}
                />
              )}
              {event.status === 'approved' && (
                <Chip
                  label="Approved"
                  size="small"
                  color="success"
                  variant="filled"
                  icon={<Eye size={14} />}
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
  )

  const renderArcSection = (title: string, arcs: Array<{ arc: Arc; events: Event[] }>, color: string) => (
    arcs.length > 0 && (
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" sx={{ mb: 3, color, fontWeight: 'bold' }}>
          {title}
        </Typography>
        {arcs.map((arcGroup) => (
          <Box key={arcGroup.arc.id} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h3" sx={{ flexGrow: 1 }}>
                {arcGroup.arc.name}
              </Typography>
              {arcGroup.arc.startChapter && arcGroup.arc.endChapter && (
                <Chip
                  label={`Chapters ${arcGroup.arc.startChapter}-${arcGroup.arc.endChapter}`}
                  color="secondary"
                  variant="outlined"
                  component={Link}
                  href={`/chapters?search=${arcGroup.arc.startChapter}`}
                  clickable
                  sx={{ 
                    textDecoration: 'none',
                    '&:hover': { 
                      backgroundColor: 'secondary.main',
                      color: 'white'
                    }
                  }}
                />
              )}
            </Box>
            {arcGroup.arc.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {arcGroup.arc.description}
              </Typography>
            )}
            <Grid container spacing={3}>
              {arcGroup.events.map((event, index) => renderEvent(event, index))}
            </Grid>
          </Box>
        ))}
      </Box>
    )
  )

  const totalEvents = groupedEvents.arcs.reduce((sum, arc) => sum + arc.events.length, 0) +
                     groupedEvents.noArc.length

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CalendarSearch size={48} color={theme.palette.usogui.event} />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Events
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Key moments and turning points in the Usogui story, organized by story arcs
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, maxWidth: 800, mx: 'auto' }}>
            <TextField
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
              sx={{ flexGrow: 1 }}
            />
            <FormControl variant="outlined" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={handleTypeChange}
                label="Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="gamble">Gamble</MenuItem>
                <MenuItem value="decision">Decision</MenuItem>
                <MenuItem value="reveal">Reveal</MenuItem>
                <MenuItem value="shift">Shift</MenuItem>
                <MenuItem value="resolution">Resolution</MenuItem>
              </Select>
            </FormControl>
            <FormControl variant="outlined" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusChange}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="pending_review">Pending Review</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
              </Select>
            </FormControl>
          </Box>
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
              {totalEvents} event{totalEvents !== 1 ? 's' : ''} found
            </Typography>

            {searchQuery ? (
              // Show flat list when searching
              <Grid container spacing={4}>
                {groupedEvents.noArc.map((event, index) => renderEvent(event, index))}
              </Grid>
            ) : (
              // Show grouped structure when not searching
              <>
                {renderArcSection('Story Arcs', groupedEvents.arcs, '#1976d2')}
                
                {groupedEvents.noArc.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" component="h2" sx={{ mb: 3, color: '#0a0a0a', fontWeight: 'bold' }}>
                      Other Events
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      Events that are not currently associated with any specific arc.
                    </Typography>
                    <Grid container spacing={3}>
                      {groupedEvents.noArc.map((event, index) => renderEvent(event, index))}
                    </Grid>
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </motion.div>
    </Container>
  )
}
