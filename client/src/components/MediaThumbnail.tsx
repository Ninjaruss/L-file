'use client'

import React, { useState, useEffect } from 'react'
import { Box, IconButton, Typography, CircularProgress } from '@mui/material'
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import SpoilerWrapper from './SpoilerWrapper'
import { useProgress } from '../providers/ProgressProvider'

interface MediaItem {
  id: number
  url: string
  type: 'image' | 'video' | 'audio'
  description?: string
  chapterNumber?: number
  isSpoiler?: boolean
}

interface MediaThumbnailProps {
  entityType: 'character' | 'arc' | 'gamble' | 'faction'
  entityId: number
  entityName?: string
  className?: string
  allowCycling?: boolean
  showGallery?: boolean
  maxWidth?: string | number
  maxHeight?: string | number
}

export default function MediaThumbnail({
  entityType,
  entityId,
  entityName,
  className,
  allowCycling = true,
  showGallery = false,
  maxWidth = 300,
  maxHeight = 300,
}: MediaThumbnailProps) {
  const [currentThumbnail, setCurrentThumbnail] = useState<MediaItem | null>(null)
  const [allEntityMedia, setAllEntityMedia] = useState<MediaItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { userProgress } = useProgress()

  // Fetch current thumbnail using polymorphic media API
  const fetchCurrentThumbnail = async () => {
    try {
      const response = await fetch(
        `/api/media/owner/${entityType}/${entityId}/default`
      )
      if (response.ok) {
        const thumbnail = await response.json()
        setCurrentThumbnail(thumbnail.data)
      } else {
        setCurrentThumbnail(null)
      }
    } catch (err) {
      console.error(`Error fetching ${entityType} thumbnail:`, err)
      setCurrentThumbnail(null)
    }
  }

  // Fetch all entity display media for cycling using polymorphic media API
  const fetchEntityDisplayMedia = async () => {
    if (!allowCycling) return

    try {
      const response = await fetch(
        `/api/media/entity-display/${entityType}/${entityId}`
      )
      if (response.ok) {
        const data = await response.json()
        setAllEntityMedia(data.data || [])
        
        // Find current thumbnail index in the media list
        if (currentThumbnail && data.data) {
          const index = data.data.findIndex((media: MediaItem) => media.id === currentThumbnail.id)
          setCurrentIndex(index >= 0 ? index : 0)
        }
      }
    } catch (err) {
      console.error(`Error fetching ${entityType} media:`, err)
    }
  }

  useEffect(() => {
    const loadMedia = async () => {
      setLoading(true)
      setError(null)
      
      await fetchCurrentThumbnail()
      await fetchEntityDisplayMedia()
      
      setLoading(false)
    }

    loadMedia()
  }, [entityId, entityType, userProgress])

  const handlePrevious = () => {
    if (allEntityMedia.length > 1) {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : allEntityMedia.length - 1
      setCurrentIndex(newIndex)
      setCurrentThumbnail(allEntityMedia[newIndex])
    }
  }

  const handleNext = () => {
    if (allEntityMedia.length > 1) {
      const newIndex = currentIndex < allEntityMedia.length - 1 ? currentIndex + 1 : 0
      setCurrentIndex(newIndex)
      setCurrentThumbnail(allEntityMedia[newIndex])
    }
  }

  const renderMediaContent = (media: MediaItem) => {
    if (media.type === 'image') {
      return (
        <img
          src={media.url}
          alt={media.description || `${entityName} image`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '8px',
          }}
          onError={(e) => {
            console.error('Image failed to load:', media.url)
            setError('Failed to load image')
          }}
        />
      )
    } else if (media.type === 'video') {
      return (
        <video
          src={media.url}
          controls
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '8px',
          }}
          onError={(e) => {
            console.error('Video failed to load:', media.url)
            setError('Failed to load video')
          }}
        />
      )
    }
    
    // Fallback for other media types
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: '8px',
        }}
      >
        <ImageIcon size={48} color="grey" />
        <Typography variant="body2" color="text.secondary" ml={1}>
          {media.type.toUpperCase()}
        </Typography>
      </Box>
    )
  }

  const renderEmptyState = () => (
    <Box
      sx={{
        width: maxWidth,
        height: maxHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        borderRadius: '8px',
        border: '2px dashed',
        borderColor: 'grey.300',
      }}
    >
      <Box textAlign="center">
        <ImageIcon size={48} color="grey" />
        <Typography variant="body2" color="text.secondary" mt={1}>
          No thumbnail available
        </Typography>
      </Box>
    </Box>
  )

  if (loading) {
    return (
      <Box
        className={className}
        sx={{
          width: maxWidth,
          height: maxHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box
        className={className}
        sx={{
          width: maxWidth,
          height: maxHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'error.light',
          borderRadius: '8px',
        }}
      >
        <Typography variant="body2" color="error.main">
          {error}
        </Typography>
      </Box>
    )
  }

  if (!currentThumbnail) {
    return renderEmptyState()
  }

  const thumbnailContent = (
    <Box
      className={className}
      sx={{
        position: 'relative',
        width: maxWidth,
        height: maxHeight,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentThumbnail.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', height: '100%' }}
        >
          {renderMediaContent(currentThumbnail)}
        </motion.div>
      </AnimatePresence>

      {/* Cycling controls */}
      {allowCycling && allEntityMedia.length > 1 && (
        <>
          <IconButton
            onClick={handlePrevious}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.8)',
              },
            }}
            size="small"
          >
            <ChevronLeft size={20} />
          </IconButton>

          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.8)',
              },
            }}
            size="small"
          >
            <ChevronRight size={20} />
          </IconButton>

          {/* Media counter */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
            }}
          >
            {currentIndex + 1} / {allEntityMedia.length}
          </Box>
        </>
      )}
    </Box>
  )

  // Wrap with spoiler protection if needed
  return (
    <SpoilerWrapper
      isSpoiler={currentThumbnail.isSpoiler}
      chapterNumber={currentThumbnail.chapterNumber}
      spoilerType="major"
      description={`${entityType} image from chapter ${currentThumbnail.chapterNumber}`}
    >
      {thumbnailContent}
    </SpoilerWrapper>
  )
}