'use client'

import React, { useState } from 'react'
import { Box, Button, Typography, Alert } from '@mui/material'
import { Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useProgress } from '../providers/ProgressProvider'

interface SpoilerWrapperProps {
  children: React.ReactNode
  chapterNumber?: number
  spoilerType?: 'major' | 'minor' | 'outcome'
  description?: string
  className?: string
}

export default function SpoilerWrapper({ 
  children, 
  chapterNumber, 
  spoilerType = 'major', 
  description,
  className 
}: SpoilerWrapperProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const { userProgress } = useProgress()

  const shouldHideSpoiler = () => {
    if (!chapterNumber) {
      // For minor spoilers without chapter info, only hide if user progress is very low (1 or default)
      // For major spoilers without chapter info, always hide by default
      return spoilerType === 'major' || userProgress === 1
    }
    
    // If chapter number exists, consider spoiler type in the comparison
    if (spoilerType === 'minor') {
      // For minor spoilers (like character descriptions), be more lenient
      // Only hide if user is very early in the series or hasn't started reading
      // This allows basic character info to be shown to users who have made some progress
      return userProgress === 1 && chapterNumber > 1
    }
    
    // For major and outcome spoilers, use strict comparison
    return chapterNumber > userProgress
  }

  const getSpoilerIcon = () => {
    switch (spoilerType) {
      case 'major': return <AlertTriangle size={16} />
      case 'outcome': return <EyeOff size={16} />
      default: return <Eye size={16} />
    }
  }

  const getSpoilerLabel = () => {
    const baseLabel = spoilerType === 'major' ? 'MAJOR SPOILER' : 
                      spoilerType === 'outcome' ? 'OUTCOME SPOILER' : 'SPOILER'
    
    if (chapterNumber) {
      return `${baseLabel} - Read up to Chapter ${chapterNumber}`
    }
    return baseLabel
  }

  const getSpoilerColor = () => {
    switch (spoilerType) {
      case 'major': return 'error'
      case 'outcome': return 'warning'
      default: return 'info'
    }
  }

  if (!shouldHideSpoiler() || isRevealed) {
    return <>{children}</>
  }

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Alert 
            severity={getSpoilerColor()}
            icon={getSpoilerIcon()}
            sx={{ 
              mb: 2,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
            onClick={() => setIsRevealed(true)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {getSpoilerLabel()}
                </Typography>
                {description && (
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {description}
                  </Typography>
                )}
                {chapterNumber && chapterNumber > userProgress && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                    You need to read up to Chapter {chapterNumber} to view this content (currently at Chapter {userProgress})
                  </Typography>
                )}
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Eye size={14} />}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsRevealed(true)
                }}
                sx={{ ml: 2, minWidth: 'auto' }}
              >
                Reveal
              </Button>
            </Box>
          </Alert>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}