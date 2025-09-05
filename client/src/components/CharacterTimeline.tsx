'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Tooltip,
  Divider,
  useTheme
} from '@mui/material'
import { ArrowRight, BookOpen, Calendar, AlertTriangle } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'

interface TimelineEvent {
  id: number
  title: string
  chapterNumber: number
  arcId?: number
  arcName?: string
  isSpoiler?: boolean
  spoilerChapter?: number
  description?: string
}

interface Arc {
  id: number | 'unassigned'
  name: string
  order: number
  startChapter?: number
  endChapter?: number
}

interface CharacterTimelineProps {
  events: TimelineEvent[]
  arcs: Arc[]
  characterName: string
  firstAppearanceChapter: number
}

export default function CharacterTimeline({ 
  events, 
  arcs, 
  characterName, 
  firstAppearanceChapter 
}: CharacterTimelineProps) {
  const theme = useTheme()
  const [selectedArc, setSelectedArc] = useState<number | null>(null)
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [expandedArcs, setExpandedArcs] = useState<Set<number | string>>(new Set())
  const timelineRef = React.useRef<HTMLDivElement>(null)

  // Group events by arc
  const eventsByArc = events.reduce((acc, event) => {
    const arcId = event.arcId || 'unassigned'
    if (!acc[arcId]) {
      acc[arcId] = []
    }
    acc[arcId].push(event)
    return acc
  }, {} as Record<string | number, TimelineEvent[]>)

  // Sort events within each arc by chapter number
  Object.keys(eventsByArc).forEach(arcId => {
    eventsByArc[arcId].sort((a, b) => a.chapterNumber - b.chapterNumber)
  })

  // Create timeline sections - combine arcs and events, sorted by chapter progression
  const timelineSections = arcs
    .sort((a, b) => {
      // Sort by order, but also consider the earliest chapter in each arc
      const aEarliestChapter = eventsByArc[a.id]?.length > 0 
        ? Math.min(...eventsByArc[a.id].map(e => e.chapterNumber))
        : a.startChapter || 999999
      const bEarliestChapter = eventsByArc[b.id]?.length > 0 
        ? Math.min(...eventsByArc[b.id].map(e => e.chapterNumber))
        : b.startChapter || 999999
      
      return aEarliestChapter - bEarliestChapter || a.order - b.order
    })
    .map(arc => ({
      type: 'arc' as const,
      arc,
      events: eventsByArc[arc.id] || [],
      earliestChapter: eventsByArc[arc.id]?.length > 0 
        ? Math.min(...eventsByArc[arc.id].map(e => e.chapterNumber))
        : arc.startChapter,
      latestChapter: eventsByArc[arc.id]?.length > 0 
        ? Math.max(...eventsByArc[arc.id].map(e => e.chapterNumber))
        : arc.endChapter
    }))

  // Add unassigned events section if any exist
  if (eventsByArc.unassigned?.length > 0) {
    const unassignedEvents = eventsByArc.unassigned
    timelineSections.push({
      type: 'arc' as const,
      arc: { id: 'unassigned' as const, name: 'Other Events', order: 999, startChapter: undefined, endChapter: undefined },
      events: unassignedEvents,
      earliestChapter: Math.min(...unassignedEvents.map(e => e.chapterNumber)),
      latestChapter: Math.max(...unassignedEvents.map(e => e.chapterNumber))
    })
  }

  const scrollToArc = (arcId: number | string) => {
    const arcElement = document.getElementById(`timeline-arc-${arcId}`)
    if (arcElement && timelineRef.current) {
      const container = timelineRef.current
      const elementLeft = arcElement.offsetLeft
      const elementWidth = arcElement.offsetWidth
      const containerWidth = container.offsetWidth
      
      // Center the arc in view
      const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2)
      
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      })
      
      setSelectedArc(typeof arcId === 'number' ? arcId : null)
    }
  }

  const scrollToChapter = (chapterNumber: number) => {
    // Find which arc contains this chapter
    const eventWithChapter = events.find(e => e.chapterNumber === chapterNumber)
    if (eventWithChapter && eventWithChapter.arcId) {
      // Expand the arc's events automatically
      setExpandedArcs(prev => new Set(prev).add(eventWithChapter.arcId!))
      
      // Scroll to the arc
      scrollToArc(eventWithChapter.arcId)
      
      // After scrolling to arc, scroll to the specific event within that arc
      setTimeout(() => {
        const eventElement = document.getElementById(`event-${eventWithChapter.id}`)
        if (eventElement) {
          eventElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest' 
          })
          
          // Highlight the event briefly with a more visible effect
          eventElement.style.backgroundColor = theme.palette.warning.light
          eventElement.style.border = `2px solid ${theme.palette.warning.main}`
          eventElement.style.boxShadow = `0 0 8px ${theme.palette.warning.light}`
          eventElement.style.transition = 'all 0.3s ease'
          setTimeout(() => {
            eventElement.style.backgroundColor = ''
            eventElement.style.border = `1px solid ${theme.palette.divider}`
            eventElement.style.boxShadow = ''
          }, 3000)
        }
      }, 500) // Wait for arc scroll to complete
    } else {
      // If no arc found, scroll to unassigned section
      const unassignedArcId = 'unassigned'
      setExpandedArcs(prev => new Set(prev).add(unassignedArcId))
      scrollToArc(unassignedArcId)
      
      // Find and highlight the event in unassigned section
      setTimeout(() => {
        const eventWithChapterInUnassigned = events.find(e => 
          e.chapterNumber === chapterNumber && !e.arcId
        )
        if (eventWithChapterInUnassigned) {
          const eventElement = document.getElementById(`event-${eventWithChapterInUnassigned.id}`)
          if (eventElement) {
            eventElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest' 
            })
            
            // Highlight the event briefly with a more visible effect
            eventElement.style.backgroundColor = theme.palette.warning.light
            eventElement.style.border = `2px solid ${theme.palette.warning.main}`
            eventElement.style.boxShadow = `0 0 8px ${theme.palette.warning.light}`
            eventElement.style.transition = 'all 0.3s ease'
            setTimeout(() => {
              eventElement.style.backgroundColor = ''
              eventElement.style.border = `1px solid ${theme.palette.divider}`
              eventElement.style.boxShadow = ''
            }, 3000)
          }
        }
      }, 500)
    }
  }

  const handleArcClick = (arcId: number | string) => {
    if (arcId === 'unassigned') return
    if (typeof arcId === 'number') {
      window.location.href = `/arcs/${arcId}`
    }
  }


  const toggleArcExpansion = (arcId: number | string) => {
    setExpandedArcs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(arcId)) {
        newSet.delete(arcId)
      } else {
        newSet.add(arcId)
      }
      return newSet
    })
  }

  const visibleSections = showAllEvents ? timelineSections : timelineSections.slice(0, 4)

  return (
    <Card className="gambling-card">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calendar size={20} />
            Character Timeline
          </Typography>
          <Button
            component={Link}
            href={`/events?character=${characterName}`}
            size="small"
            color="primary"
          >
            View All Events
          </Button>
        </Box>

        {/* First Appearance Marker */}
        <Box sx={{ mb: 3 }}>
          <Chip
            label={`First Appearance: Chapter ${firstAppearanceChapter}`}
            color="secondary"
            variant="filled"
            icon={<BookOpen size={16} />}
            onClick={() => scrollToChapter(firstAppearanceChapter)}
            clickable
            sx={{ 
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'secondary.dark'
              }
            }}
          />
        </Box>

        {/* Timeline Container */}
        <Box sx={{ position: 'relative' }}>
          {/* Horizontal Timeline Line */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: 'primary.main',
              opacity: 0.3,
              zIndex: 1
            }}
          />

          {/* Timeline Sections */}
          <Box 
            ref={timelineRef}
            sx={{ 
              display: 'flex', 
              overflowX: 'auto',
              gap: 3,
              pb: 2,
              minHeight: '220px',
              alignItems: 'flex-start',
              position: 'relative',
              zIndex: 2,
              scrollBehavior: 'smooth',
              '&::-webkit-scrollbar': {
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.5)',
                }
              }
            }}
          >
            {visibleSections.map((section, index) => (
              <motion.div
                key={`${section.arc.id}-${index}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                style={{ minWidth: '320px', maxWidth: '400px', flexShrink: 0, flex: '0 0 auto' }}
              >
                <Box
                  id={`timeline-arc-${section.arc.id}`}
                  sx={{
                    position: 'relative',
                    backgroundColor: 'background.paper',
                    border: `2px solid ${selectedArc === section.arc.id ? theme.palette.primary.main : theme.palette.divider}`,
                    borderRadius: 2,
                    p: 2,
                    cursor: typeof section.arc.id === 'number' ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    '&:hover': typeof section.arc.id === 'number' ? {
                      borderColor: theme.palette.primary.main,
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4]
                    } : {}
                  }}
                  onClick={() => handleArcClick(section.arc.id)}
                >
                  {/* Arc Header */}
                  <Box sx={{ mb: 2 }}>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight="bold" 
                      color="primary"
                      sx={{ mb: 0.5 }}
                    >
                      {section.arc.name}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {section.earliestChapter && section.latestChapter && (
                        <Typography variant="caption" color="text.secondary">
                          {section.earliestChapter === section.latestChapter 
                            ? `Chapter ${section.earliestChapter}`
                            : `Chapters ${section.earliestChapter}-${section.latestChapter}`
                          }
                        </Typography>
                      )}
                      {section.events.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {section.events.length} event{section.events.length !== 1 ? 's' : ''}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Timeline Dot */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '-8px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      border: `3px solid ${theme.palette.background.default}`,
                      transform: 'translateY(-50%)',
                      zIndex: 3
                    }}
                  />

                  {/* Events in this arc */}
                  <EventsInArc 
                    events={section.events} 
                    isExpanded={expandedArcs.has(section.arc.id)}
                    onToggleExpansion={() => toggleArcExpansion(section.arc.id)}
                  />

                  {/* Arc Navigation Button */}
                  {typeof section.arc.id === 'number' && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        endIcon={<ArrowRight size={16} />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleArcClick(section.arc.id)
                        }}
                      >
                        View Arc
                      </Button>
                    </Box>
                  )}
                </Box>
              </motion.div>
            ))}
          </Box>

          {/* Show More Button */}
          {timelineSections.length > 4 && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setShowAllEvents(!showAllEvents)}
                size="small"
              >
                {showAllEvents 
                  ? 'Show Less' 
                  : `Show ${timelineSections.length - 4} More Arc${timelineSections.length - 4 !== 1 ? 's' : ''}`
                }
              </Button>
            </Box>
          )}
        </Box>

        {/* Quick Navigation */}
        <Divider sx={{ my: 3 }} />
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Quick Navigation:
          </Typography>
          
          {/* Arc Navigation */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Jump to Arc:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {timelineSections.slice(0, 5).map(section => (
                <Chip
                  key={section.arc.id}
                  label={section.arc.name}
                  size="small"
                  variant={selectedArc === section.arc.id ? "filled" : "outlined"}
                  color="primary"
                  clickable
                  onClick={() => scrollToArc(section.arc.id)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
          
          {/* Chapter Navigation */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Jump to Chapter:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Array.from(new Set(events.map(e => e.chapterNumber)))
                .sort((a, b) => a - b)
                .slice(0, 10)
                .map(chapter => (
                  <Chip
                    key={chapter}
                    label={`Ch. ${chapter}`}
                    size="small"
                    variant="outlined"
                    clickable
                    onClick={() => scrollToChapter(chapter)}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'white'
                      }
                    }}
                  />
                ))
              }
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// Events in Arc Component - handles large lists with show more/less
function EventsInArc({ 
  events, 
  isExpanded = false, 
  onToggleExpansion 
}: { 
  events: TimelineEvent[]
  isExpanded?: boolean
  onToggleExpansion?: () => void 
}) {
  const [showAllEvents, setShowAllEvents] = useState(false)
  const theme = useTheme()
  
  const MAX_INITIAL_EVENTS = 5 // Increase from 3 to 5 for better UX
  
  // Use either controlled expansion state or internal state
  const effectiveShowAll = onToggleExpansion ? isExpanded : showAllEvents
  const visibleEvents = effectiveShowAll ? events : events.slice(0, MAX_INITIAL_EVENTS)
  const hasMoreEvents = events.length > MAX_INITIAL_EVENTS
  
  if (events.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No events recorded
        </Typography>
      </Box>
    )
  }

  const handleShowMoreClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (onToggleExpansion) {
      onToggleExpansion()
    } else {
      setShowAllEvents(!showAllEvents)
    }
  }
  
  return (
    <Box>
      <Box sx={{ maxHeight: effectiveShowAll ? '400px' : '200px', overflowY: 'auto', mb: hasMoreEvents ? 1 : 0 }}>
        {visibleEvents.map((event, eventIndex) => (
          <Box 
            key={event.id} 
            id={`event-${event.id}`}
            sx={{ 
              mb: eventIndex < visibleEvents.length - 1 ? 1.5 : 0,
              p: 1,
              borderRadius: 1,
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.02)' 
                : 'rgba(0,0,0,0.01)',
              border: `1px solid ${theme.palette.divider}`,
              position: 'relative',
              transition: 'background-color 0.3s ease'
            }}
          >
            <TimelineSpoilerWrapper event={event}>
              <EventContent event={event} />
            </TimelineSpoilerWrapper>
          </Box>
        ))}
      </Box>
      
      {hasMoreEvents && (
        <Box sx={{ 
          textAlign: 'center', 
          pt: 1, 
          borderTop: `1px solid ${theme.palette.divider}`,
          position: 'relative',
          zIndex: 10
        }}>
          <Button
            size="small"
            variant="text"
            onClick={handleShowMoreClick}
            sx={{ 
              textTransform: 'none',
              fontSize: '0.75rem',
              minHeight: 'auto',
              py: 0.5,
              position: 'relative',
              zIndex: 10
            }}
          >
            {effectiveShowAll 
              ? `Show Less (${MAX_INITIAL_EVENTS} of ${events.length})`
              : `Show ${events.length - MAX_INITIAL_EVENTS} More Event${events.length - MAX_INITIAL_EVENTS !== 1 ? 's' : ''}`
            }
          </Button>
        </Box>
      )}
    </Box>
  )
}

// Compact Timeline Spoiler Wrapper
function TimelineSpoilerWrapper({ event, children }: { event: TimelineEvent, children: React.ReactNode }) {
  const [isRevealed, setIsRevealed] = useState(false)
  const { userProgress } = useProgress()
  const { settings } = useSpoilerSettings()
  const theme = useTheme()

  const shouldHideSpoiler = () => {
    const chapterNumber = event.spoilerChapter || event.chapterNumber
    
    // First check if spoiler settings say to show all spoilers
    if (settings.showAllSpoilers) {
      return false
    }

    // Determine the effective progress to use for spoiler checking
    // Priority: spoiler settings tolerance > user progress
    const effectiveProgress = settings.chapterTolerance > 0 
      ? settings.chapterTolerance 
      : userProgress

    // If we have a chapter number, use unified logic
    if (chapterNumber) {
      // Timeline events are typically major spoilers, so use standard comparison
      return chapterNumber > effectiveProgress
    }

    // For events without chapter numbers, be conservative and hide them
    // unless user has made significant progress
    return effectiveProgress <= 5
  }

  // Always check client-side logic, don't rely solely on server's isSpoiler
  // This ensures spoilers work properly when not logged in
  const clientSideShouldHide = shouldHideSpoiler()
  
  // Always render the event, but with spoiler protection overlay if needed
  if (!clientSideShouldHide || isRevealed) {
    return <>{children}</>
  }

  const handleReveal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRevealed(true)
  }

  const chapterNumber = event.spoilerChapter || event.chapterNumber
  const effectiveProgress = settings.chapterTolerance > 0 
    ? settings.chapterTolerance 
    : userProgress

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Render the actual content underneath */}
      <Box sx={{ opacity: 0.3, filter: 'blur(2px)', pointerEvents: 'none' }}>
        {children}
      </Box>
      
      {/* Spoiler overlay */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'error.light',
          borderRadius: 1,
          cursor: 'pointer',
          border: `1px solid ${theme.palette.error.main}`,
          '&:hover': {
            backgroundColor: 'error.dark'
          },
          zIndex: 100
        }}
        onClick={handleReveal}
      >
        <Tooltip 
          title={`Chapter ${chapterNumber} spoiler - You're at Chapter ${effectiveProgress}. Click to reveal.`}
          placement="top"
          arrow
        >
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'white',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                fontSize: '0.75rem',
                mb: 0.5
              }}
            >
              <AlertTriangle size={14} />
              Chapter {chapterNumber} Spoiler
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.65rem',
                display: 'block'
              }}
            >
              Click to reveal
            </Typography>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  )
}

// Event Content Component
function EventContent({ event }: { event: TimelineEvent }) {
  const { userProgress } = useProgress()
  const { settings } = useSpoilerSettings()
  
  // Check if chapter navigation should be available
  const chapterNumber = event.chapterNumber
  const effectiveProgress = settings.chapterTolerance > 0 ? settings.chapterTolerance : userProgress
  const isChapterAccessible = settings.showAllSpoilers || chapterNumber <= effectiveProgress
  
  return (
    <Box>
      <Typography 
        variant="body2" 
        fontWeight="medium"
        component={Link}
        href={`/events/${event.id}`}
        sx={{ 
          textDecoration: 'none',
          color: 'primary.main',
          '&:hover': { textDecoration: 'underline' },
          display: 'block',
          mb: 0.5
        }}
      >
        {event.title}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tooltip title={isChapterAccessible ? "Go to chapter" : `Chapter ${chapterNumber} - Read up to here to access`}>
          <Chip
            label={`Ch. ${event.chapterNumber}`}
            size="small"
            variant="outlined"
            color={isChapterAccessible ? "primary" : "secondary"}
            clickable={isChapterAccessible}
            onClick={(e) => {
              e.stopPropagation()
              if (isChapterAccessible) {
                window.location.href = `/chapters/${event.chapterNumber}`
              }
            }}
            sx={{ 
              fontSize: '0.7rem', 
              height: '20px',
              opacity: isChapterAccessible ? 1 : 0.6,
              cursor: isChapterAccessible ? 'pointer' : 'default',
              '&:hover': isChapterAccessible ? {
                backgroundColor: 'primary.light'
              } : {}
            }}
          />
        </Tooltip>
      </Box>
    </Box>
  )
}