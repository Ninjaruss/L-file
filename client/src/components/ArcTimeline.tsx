'use client'

import React, { useState, useMemo } from 'react'
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
import { BookOpen, Calendar, AlertTriangle, Dice1, Users, Eye, ArrowUpDown, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'

interface TimelineEvent {
  id: number
  title: string
  chapterNumber: number
  type?: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution'
  characters?: string[]
  description?: string
  isSpoiler?: boolean
}

interface ArcTimelineProps {
  events: TimelineEvent[]
  arcName: string
  startChapter: number
  endChapter: number
}

// Event type styling helpers
const getEventTypeIcon = (type?: string) => {
  switch (type) {
    case 'gamble': return Dice1
    case 'decision': return Users
    case 'reveal': return Eye
    case 'shift': return ArrowUpDown
    case 'resolution': return CheckCircle2
    default: return Calendar
  }
}

const getEventTypeColor = (type?: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  switch (type) {
    case 'gamble': return 'error'
    case 'decision': return 'warning'
    case 'reveal': return 'info'
    case 'shift': return 'secondary'
    case 'resolution': return 'success'
    default: return 'primary'
  }
}

const getEventTypeLabel = (type?: string): string => {
  switch (type) {
    case 'gamble': return 'Gamble'
    case 'decision': return 'Decision'
    case 'reveal': return 'Reveal'
    case 'shift': return 'Shift'
    case 'resolution': return 'Resolution'
    default: return 'Event'
  }
}

export default function ArcTimeline({ 
  events, 
  arcName, 
  startChapter, 
  endChapter 
}: ArcTimelineProps) {
  const theme = useTheme()
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set())
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set())
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const timelineRef = React.useRef<HTMLDivElement>(null)
  
  // Global modal state for all events
  const [globalModal, setGlobalModal] = useState<{
    show: boolean
    event: TimelineEvent | null
    position: { x: number, y: number }
  }>({
    show: false,
    event: null,
    position: { x: 0, y: 0 }
  })

  // Get all unique event types and characters from events
  const { uniqueEventTypes, uniqueCharacters } = useMemo(() => {
    const eventTypes = new Set<string>()
    const characters = new Set<string>()
    
    events.forEach(event => {
      if (event.type) eventTypes.add(event.type)
      if (event.characters) {
        event.characters.forEach((char: string) => characters.add(char))
      }
    })
    
    return {
      uniqueEventTypes: Array.from(eventTypes),
      uniqueCharacters: Array.from(characters)
    }
  }, [events])

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    let filtered = [...events]
    
    // Filter by event types
    if (selectedEventTypes.size > 0) {
      filtered = filtered.filter(event => 
        event.type && selectedEventTypes.has(event.type)
      )
    }
    
    // Filter by characters
    if (selectedCharacters.size > 0) {
      filtered = filtered.filter(event =>
        event.characters && event.characters.some((char: string) => selectedCharacters.has(char))
      )
    }
    
    return filtered.sort((a, b) => a.chapterNumber - b.chapterNumber)
  }, [events, selectedEventTypes, selectedCharacters])

  // Group events by event type for horizontal timeline sections
  const timelineSections = useMemo(() => {
    const sections: Array<{
      type: 'section'
      sectionType: string
      sectionName: string
      events: TimelineEvent[]
      earliestChapter?: number
      latestChapter?: number
    }> = []

    if (filteredEvents.length === 0) return sections

    // Sort events by chapter first
    const sortedEvents = [...filteredEvents].sort((a, b) => a.chapterNumber - b.chapterNumber)
    
    // Step 1: Identify all RESOLUTION events as primary anchors
    const resolutionEvents = sortedEvents.filter(event => event.type === 'resolution')
    
    // Step 2: Create narrative units by grouping backwards from each RESOLUTION
    const usedEventIds = new Set<number>()
    let narrativeUnitIndex = 1

    resolutionEvents.forEach((resolution) => {
      if (usedEventIds.has(resolution.id)) return

      // Find events that led to this resolution
      const narrativeUnit: TimelineEvent[] = []
      const resolutionChapter = resolution.chapterNumber
      
      // Look backwards from this resolution to find the complete gamble cycle
      // Include the resolution itself
      narrativeUnit.push(resolution)
      usedEventIds.add(resolution.id)
      
      // Find the initial GAMBLE that started this cycle
      // Look for the most recent gamble before this resolution
      let associatedGamble: TimelineEvent | null = null
      for (let i = sortedEvents.length - 1; i >= 0; i--) {
        const event = sortedEvents[i]
        if (event.type === 'gamble' && 
            event.chapterNumber <= resolutionChapter && 
            !usedEventIds.has(event.id)) {
          associatedGamble = event
          break
        }
      }
      
      if (associatedGamble) {
        narrativeUnit.unshift(associatedGamble) // Add at beginning
        usedEventIds.add(associatedGamble.id)
        
        // Now find all events between this gamble and resolution that belong to this cycle
        const gambleChapter = associatedGamble.chapterNumber
        
        sortedEvents.forEach(event => {
          if (usedEventIds.has(event.id)) return
          
          // Include events between gamble and resolution that are part of this narrative
          if (event.chapterNumber >= gambleChapter && 
              event.chapterNumber <= resolutionChapter &&
              (event.type === 'decision' || event.type === 'reveal' || event.type === 'shift')) {
            narrativeUnit.push(event)
            usedEventIds.add(event.id)
          }
        })
        
        // Sort the narrative unit by chapter
        narrativeUnit.sort((a, b) => a.chapterNumber - b.chapterNumber)
      }
      
      // Create section for this narrative unit
      if (narrativeUnit.length > 0) {
        const earliestChapter = Math.min(...narrativeUnit.map(e => e.chapterNumber))
        const latestChapter = Math.max(...narrativeUnit.map(e => e.chapterNumber))
        
        // Create descriptive name based on the gamble and resolution
        let sectionName = `Narrative Unit ${narrativeUnitIndex}`
        if (associatedGamble && resolution) {
          // Try to create a more descriptive name from the events
          const gambleTitle = associatedGamble.title.length > 30 
            ? associatedGamble.title.substring(0, 30) + '...' 
            : associatedGamble.title
          sectionName = `${gambleTitle} → Resolution`
        }
        
        sections.push({
          type: 'section' as const,
          sectionType: `narrative-unit-${narrativeUnitIndex}`,
          sectionName,
          events: narrativeUnit,
          earliestChapter,
          latestChapter
        })
        
        narrativeUnitIndex++
      }
    })
    
    // Step 3: Handle orphaned events (events not part of complete GAMBLE->RESOLUTION cycles)
    const orphanedEvents = sortedEvents.filter(event => !usedEventIds.has(event.id))
    
    if (orphanedEvents.length > 0) {
      // Group orphaned events as connectors/transitions
      // These are events that set up future gambles or are consequences of past resolutions
      const orphanGroups: Array<{
        events: TimelineEvent[]
        startChapter: number
        endChapter: number
        type: 'setup' | 'consequence' | 'standalone'
      }> = []
      
      // Simple grouping by proximity (within 5 chapters of each other)
      let currentGroup: TimelineEvent[] = []
      
      orphanedEvents.forEach((event, index) => {
        if (currentGroup.length === 0) {
          currentGroup.push(event)
        } else {
          const lastEvent = currentGroup[currentGroup.length - 1]
          const chapterGap = event.chapterNumber - lastEvent.chapterNumber
          
          if (chapterGap <= 5) {
            currentGroup.push(event)
          } else {
            // End current group and start new one
            if (currentGroup.length > 0) {
              const groupStart = currentGroup[0].chapterNumber
              const groupEnd = currentGroup[currentGroup.length - 1].chapterNumber
              
              orphanGroups.push({
                events: [...currentGroup],
                startChapter: groupStart,
                endChapter: groupEnd,
                type: 'standalone' // Could be enhanced to detect setup vs consequence
              })
            }
            currentGroup = [event]
          }
        }
        
        // Handle last group
        if (index === orphanedEvents.length - 1 && currentGroup.length > 0) {
          const groupStart = currentGroup[0].chapterNumber
          const groupEnd = currentGroup[currentGroup.length - 1].chapterNumber
          
          orphanGroups.push({
            events: [...currentGroup],
            startChapter: groupStart,
            endChapter: groupEnd,
            type: 'standalone'
          })
        }
      })
      
      // Add orphan groups as connector sections
      orphanGroups.forEach((group, index) => {
        const sectionName = group.events.length === 1 
          ? `${group.events[0].title.length > 25 ? group.events[0].title.substring(0, 25) + '...' : group.events[0].title} (Transition)`
          : `Transition Events ${index + 1}`
        
        sections.push({
          type: 'section' as const,
          sectionType: `transition-${index + 1}`,
          sectionName,
          events: group.events,
          earliestChapter: group.startChapter,
          latestChapter: group.endChapter
        })
      })
    }
    
    // If no sections were created (no resolutions found), fall back to basic grouping
    if (sections.length === 0 && sortedEvents.length > 0) {
      sections.push({
        type: 'section' as const,
        sectionType: 'all-events',
        sectionName: `${arcName} Arc Events`,
        events: sortedEvents,
        earliestChapter: sortedEvents[0].chapterNumber,
        latestChapter: sortedEvents[sortedEvents.length - 1].chapterNumber
      })
    }

    // Sort sections by earliest chapter
    return sections.sort((a, b) => (a.earliestChapter || 999) - (b.earliestChapter || 999))
  }, [filteredEvents, arcName])

  const scrollToSection = (sectionType: string) => {
    const sectionElement = document.getElementById(`timeline-section-${sectionType}`)
    if (sectionElement && timelineRef.current) {
      const container = timelineRef.current
      const elementLeft = sectionElement.offsetLeft
      const elementWidth = sectionElement.offsetWidth
      const containerWidth = container.offsetWidth
      
      // Center the section in view
      const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2)
      
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      })
    }
  }

  const scrollToChapter = (chapterNumber: number) => {
    // Find which section contains this chapter
    const eventWithChapter = filteredEvents.find(e => e.chapterNumber === chapterNumber)
    if (eventWithChapter) {
      // Find the section that contains this event
      const section = timelineSections.find(s => s.events.some(e => e.id === eventWithChapter.id))
      if (section) {
        // Expand the section's events automatically
        setExpandedSections(prev => new Set(prev).add(section.sectionType))
        
        // Scroll to the section first
        scrollToSection(section.sectionType)
        
        // After scrolling to section, scroll to the specific event within that section
        setTimeout(() => {
          const eventElement = document.getElementById(`event-${eventWithChapter.id}`)
          if (eventElement) {
            eventElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest' 
            })
            
            // Highlight the event briefly
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
        }, 500)
      }
    }
  }

  const toggleSectionExpansion = (sectionType: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionType)) {
        newSet.delete(sectionType)
      } else {
        newSet.add(sectionType)
      }
      return newSet
    })
  }

  const toggleEventTypeFilter = (eventType: string) => {
    setSelectedEventTypes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(eventType)) {
        newSet.delete(eventType)
      } else {
        newSet.add(eventType)
      }
      return newSet
    })
  }

  const toggleCharacterFilter = (character: string) => {
    setSelectedCharacters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(character)) {
        newSet.delete(character)
      } else {
        newSet.add(character)
      }
      return newSet
    })
  }

  const clearAllFilters = () => {
    setSelectedEventTypes(new Set())
    setSelectedCharacters(new Set())
  }

  const visibleSections = showAllEvents ? timelineSections : timelineSections.slice(0, 4)

  // Modal positioning function
  const showEventModal = (event: TimelineEvent, targetElement: Element) => {
    const rect = targetElement.getBoundingClientRect()
    const modalWidth = 280
    const modalHeight = 150
    const spacing = 15
    
    // Calculate position relative to viewport
    let modalX = rect.left + rect.width / 2
    let modalY = rect.top - spacing
    
    // Horizontal boundary checking
    const rightOverflow = (modalX + modalWidth / 2) - (window.innerWidth - 20)
    const leftOverflow = (modalX - modalWidth / 2) - 20
    
    if (rightOverflow > 0) {
      modalX -= rightOverflow
    } else if (leftOverflow < 0) {
      modalX -= leftOverflow
    }
    
    // Vertical boundary checking - if not enough space above, show below
    if (modalY - modalHeight < 20) {
      modalY = rect.bottom + spacing
    }
    
    setGlobalModal({
      show: true,
      event,
      position: { x: modalX, y: modalY }
    })
  }

  const hideEventModal = () => {
    setGlobalModal({
      show: false,
      event: null,
      position: { x: 0, y: 0 }
    })
  }

  // Memoize unique chapters for navigation
  const uniqueChapters = useMemo(() => {
    return Array.from(new Set(filteredEvents.map(e => e.chapterNumber)))
      .sort((a, b) => a - b)
      .slice(0, 10)
  }, [filteredEvents])

  return (
    <Card className="gambling-card">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

            <Calendar size={20} />
            Arc Timeline
          </Typography>
          <Button
            component={Link}
            href={`/events?arc=${arcName}`}
            size="small"
            color="primary"
          >
            View All Events
          </Button>
        </Box>

        {/* Arc Range Marker */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`Arc Range: Chapters ${startChapter}-${endChapter}`}
              color="secondary"
              variant="filled"
              icon={<BookOpen size={16} />}
              sx={{ 
                fontWeight: 'bold',
              }}
            />
            <Chip
              label={`${filteredEvents.length} Event${filteredEvents.length !== 1 ? 's' : ''}`}
              color="primary"
              variant="outlined"
              icon={<Calendar size={16} />}
            />
            {(selectedEventTypes.size > 0 || selectedCharacters.size > 0) && (
              <Chip
                label={`${filteredEvents.length} Filtered`}
                color="info"
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        </Box>

        {/* Filter Controls */}
        {(uniqueEventTypes.length > 0 || uniqueCharacters.length > 0) && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Filters:
              </Typography>
              {(selectedEventTypes.size > 0 || selectedCharacters.size > 0) && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={clearAllFilters}
                  color="secondary"
                >
                  Clear Filters
                </Button>
              )}
            </Box>

            {/* Event Type Filters */}
            {uniqueEventTypes.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Event Types:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {uniqueEventTypes.map(eventType => {
                    const EventTypeIcon = getEventTypeIcon(eventType)
                    const isSelected = selectedEventTypes.has(eventType)
                    return (
                      <Chip
                        key={eventType}
                        icon={<EventTypeIcon size={12} />}
                        label={getEventTypeLabel(eventType)}
                        size="small"
                        variant={isSelected ? "filled" : "outlined"}
                        color={getEventTypeColor(eventType)}
                        clickable
                        onClick={() => toggleEventTypeFilter(eventType)}
                        sx={{
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                      />
                    )
                  })}
                </Box>
              </Box>
            )}

            {/* Character Filters */}
            {uniqueCharacters.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Characters:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {uniqueCharacters.map(character => {
                    const isSelected = selectedCharacters.has(character)
                    return (
                      <Chip
                        key={character}
                        icon={<Users size={12} />}
                        label={character}
                        size="small"
                        variant={isSelected ? "filled" : "outlined"}
                        color="primary"
                        clickable
                        onClick={() => toggleCharacterFilter(character)}
                        sx={{
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                      />
                    )
                  })}
                </Box>
              </Box>
            )}
          </Box>
        )}

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
              <Box
                key={`${section.sectionType}-${index}`}
                id={`timeline-section-${section.sectionType}`}
                sx={{ 
                  minWidth: '320px', 
                  maxWidth: '400px', 
                  flexShrink: 0, 
                  flex: '0 0 auto',
                  opacity: 0,
                  animation: `fadeInUp 0.6s ease forwards`,
                  animationDelay: `${index * 0.1}s`,
                  '@keyframes fadeInUp': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateX(20px)'
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateX(0)'
                    }
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    backgroundColor: 'background.paper',
                    border: `2px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    p: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4]
                    }
                  }}
                >
                  {/* Section Header */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {section.sectionType !== 'all' && section.sectionType !== 'other' && (
                        <>
                          {React.createElement(getEventTypeIcon(section.sectionType), { size: 18 })}
                        </>
                      )}
                      <Typography 
                        variant="subtitle1" 
                        fontWeight="bold" 
                        color="primary"
                        sx={{ mb: 0.5 }}
                      >
                        {section.sectionName}
                      </Typography>
                    </Box>
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
                      backgroundColor: section.sectionType !== 'all' && section.sectionType !== 'other' ? 
                        (() => {
                          switch (getEventTypeColor(section.sectionType)) {
                            case 'error': return theme.palette.error.main
                            case 'warning': return theme.palette.warning.main
                            case 'info': return theme.palette.info.main
                            case 'secondary': return theme.palette.secondary.main
                            case 'success': return theme.palette.success.main
                            default: return theme.palette.primary.main
                          }
                        })() : theme.palette.primary.main,
                      border: `3px solid ${theme.palette.background.default}`,
                      transform: 'translateY(-50%)',
                      zIndex: 3
                    }}
                  />

                  {/* Events in this section */}
                  <EventsInSection 
                    events={section.events} 
                    isExpanded={expandedSections.has(section.sectionType)}
                    onToggleExpansion={() => toggleSectionExpansion(section.sectionType)}
                    onShowModal={showEventModal}
                    onHideModal={hideEventModal}
                  />
                </Box>
              </Box>
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
                  : `Show ${timelineSections.length - 4} More Section${timelineSections.length - 4 !== 1 ? 's' : ''}`
                }
              </Button>
            </Box>
          )}
        </Box>

        {/* Quick Navigation */}
        {filteredEvents.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Quick Navigation:
              </Typography>
              
              {/* Section Navigation */}
              {timelineSections.length > 1 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Jump to Section:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {timelineSections.slice(0, 5).map(section => (
                      <Chip
                        key={section.sectionType}
                        label={section.sectionName}
                        size="small"
                        variant="outlined"
                        color="primary"
                        clickable
                        onClick={() => scrollToSection(section.sectionType)}
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
              )}
              
              {/* Chapter Navigation */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Jump to Chapter:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {uniqueChapters.map(chapter => (
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
                  ))}
                </Box>
              </Box>
            </Box>
          </>
        )}

        {/* Global Modal - Rendered at top level */}
        {globalModal.show && globalModal.event && (
          <Box
            sx={{
              position: 'fixed',
              left: globalModal.position.x,
              top: globalModal.position.y,
              transform: 'translate(-50%, -100%)',
              zIndex: 999999,
              width: '300px',
              maxWidth: 'calc(100vw - 40px)',
              backgroundColor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              boxShadow: theme.shadows[12],
              p: 2.5,
              pointerEvents: 'none',
              backdropFilter: 'blur(8px)',
              // Add subtle gradient overlay for better depth
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[900]} 100%)`
                : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
              // Add border accent
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                borderRadius: '12px 12px 0 0'
              }
            }}
          >
            <Typography 
              variant="subtitle2" 
              fontWeight="bold" 
              sx={{ 
                mb: 1.5, 
                color: 'text.primary',
                fontSize: '1rem'
              }}
            >
              {globalModal.event.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                label={`Chapter ${globalModal.event.chapterNumber}`}
                size="small"
                variant="outlined"
                color="primary"
                sx={{ 
                  fontSize: '0.75rem',
                  height: '24px',
                  fontWeight: 'medium'
                }}
              />
              {globalModal.event.type && (
                <Chip
                  icon={React.createElement(getEventTypeIcon(globalModal.event.type), { size: 12 })}
                  label={getEventTypeLabel(globalModal.event.type)}
                  size="small"
                  variant="filled"
                  color={getEventTypeColor(globalModal.event.type)}
                  sx={{ fontSize: '0.7rem', height: '24px' }}
                />
              )}
            </Box>

            <Typography 
              variant="body2" 
              color="text.primary"
              sx={{ 
                lineHeight: 1.5,
                fontSize: '0.875rem'
              }}
            >
              {globalModal.event.description || 'No description available'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// Events in Section Component - handles large lists with show more/less
function EventsInSection({ 
  events, 
  isExpanded = false, 
  onToggleExpansion,
  onShowModal,
  onHideModal 
}: { 
  events: TimelineEvent[]
  isExpanded?: boolean
  onToggleExpansion?: () => void
  onShowModal?: (event: TimelineEvent, targetElement: Element) => void
  onHideModal?: () => void 
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
              <EventContent 
                event={event} 
                onShowModal={onShowModal}
                onHideModal={onHideModal}
              />
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

// Timeline Spoiler Wrapper
function TimelineSpoilerWrapper({ event, children }: { event: TimelineEvent, children: React.ReactNode }) {
  const [isRevealed, setIsRevealed] = useState(false)
  const { userProgress } = useProgress()
  const { settings } = useSpoilerSettings()
  const theme = useTheme()

  const shouldHideSpoiler = () => {
    const chapterNumber = event.chapterNumber
    
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
    // Clone children and pass the revealed state to EventContent
    const childrenWithProps = React.cloneElement(children as React.ReactElement<any>, {
      isRevealedFromSpoiler: true
    })
    return <>{childrenWithProps}</>
  }

  const handleReveal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRevealed(true)
  }

  const chapterNumber = event.chapterNumber
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
function EventContent({ 
  event, 
  isRevealedFromSpoiler = false,
  onShowModal,
  onHideModal
}: { 
  event: TimelineEvent, 
  isRevealedFromSpoiler?: boolean,
  onShowModal?: (event: TimelineEvent, targetElement: Element) => void,
  onHideModal?: () => void
}) {
  const { userProgress } = useProgress()
  const { settings } = useSpoilerSettings()
  const theme = useTheme()
  
  // Check if chapter navigation should be available
  const chapterNumber = event.chapterNumber
  const effectiveProgress = settings.chapterTolerance > 0 ? settings.chapterTolerance : userProgress
  const isChapterAccessible = settings.showAllSpoilers || chapterNumber <= effectiveProgress
  
  // Check if this event is revealed (not a spoiler)
  const shouldHideSpoiler = () => {
    const spoilerChapterNumber = event.chapterNumber
    
    if (settings.showAllSpoilers) {
      return false
    }

    const effectiveProgressForSpoiler = settings.chapterTolerance > 0 
      ? settings.chapterTolerance 
      : userProgress

    if (spoilerChapterNumber) {
      return spoilerChapterNumber > effectiveProgressForSpoiler
    }

    return effectiveProgressForSpoiler <= 5
  }

  // Use either the natural reveal state or the prop from spoiler wrapper
  const isRevealed = !shouldHideSpoiler() || isRevealedFromSpoiler

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!isRevealed || !event.description || !onShowModal) return
    onShowModal(event, e.currentTarget)
  }

  const handleMouseLeave = () => {
    if (onHideModal) {
      onHideModal()
    }
  }

  // Get event type styling
  const EventTypeIcon = getEventTypeIcon(event.type)
  const eventTypeColor = getEventTypeColor(event.type)
  const eventTypeLabel = getEventTypeLabel(event.type)
  
  // Enhanced styling for better event type differentiation
  const getEventTypeStyles = (type?: string) => {
    const baseStyles = {
      fontSize: '0.65rem', 
      height: '22px',
      fontWeight: 'bold' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      '& .MuiChip-icon': {
        fontSize: '0.8rem'
      }
    }

    switch (type) {
      case 'gamble':
        return {
          ...baseStyles,
          backgroundColor: theme.palette.error.main,
          color: theme.palette.error.contrastText,
          boxShadow: `0 2px 4px ${theme.palette.error.main}40`,
          '&:hover': {
            backgroundColor: theme.palette.error.dark,
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 8px ${theme.palette.error.main}60`
          }
        }
      case 'decision':
        return {
          ...baseStyles,
          backgroundColor: theme.palette.warning.main,
          color: theme.palette.warning.contrastText,
          boxShadow: `0 2px 4px ${theme.palette.warning.main}40`,
          '&:hover': {
            backgroundColor: theme.palette.warning.dark,
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 8px ${theme.palette.warning.main}60`
          }
        }
      case 'reveal':
        return {
          ...baseStyles,
          backgroundColor: theme.palette.info.main,
          color: theme.palette.info.contrastText,
          boxShadow: `0 2px 4px ${theme.palette.info.main}40`,
          '&:hover': {
            backgroundColor: theme.palette.info.dark,
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 8px ${theme.palette.info.main}60`
          }
        }
      case 'shift':
        return {
          ...baseStyles,
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
          boxShadow: `0 2px 4px ${theme.palette.secondary.main}40`,
          '&:hover': {
            backgroundColor: theme.palette.secondary.dark,
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 8px ${theme.palette.secondary.main}60`
          }
        }
      case 'resolution':
        return {
          ...baseStyles,
          backgroundColor: theme.palette.success.main,
          color: theme.palette.success.contrastText,
          boxShadow: `0 2px 4px ${theme.palette.success.main}40`,
          '&:hover': {
            backgroundColor: theme.palette.success.dark,
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 8px ${theme.palette.success.main}60`
          }
        }
      default:
        return {
          ...baseStyles,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          boxShadow: `0 2px 4px ${theme.palette.primary.main}40`,
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 8px ${theme.palette.primary.main}60`
          }
        }
    }
  }
  
  return (
    <Box 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{ 
        position: 'relative',
        // Add subtle background differentiation based on event type
        background: event.type ? `linear-gradient(135deg, ${
          (() => {
            switch (eventTypeColor) {
              case 'error': return theme.palette.error.light
              case 'warning': return theme.palette.warning.light
              case 'info': return theme.palette.info.light
              case 'secondary': return theme.palette.secondary.light
              case 'success': return theme.palette.success.light
              default: return theme.palette.primary.light
            }
          })()
        }08, transparent)` : 'transparent',
        borderRadius: 1,
        p: 0.5,
        transition: 'all 0.2s ease'
      }}
    >
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
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
          
          {/* Enhanced Event Type Indicator */}
          <Tooltip title={`${eventTypeLabel} Event`}>
            <Chip
              icon={<EventTypeIcon size={12} />}
              label={eventTypeLabel}
              size="small"
              variant="filled"
              sx={{
                ...getEventTypeStyles(event.type),
                transition: 'all 0.2s ease'
              }}
            />
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )
}
