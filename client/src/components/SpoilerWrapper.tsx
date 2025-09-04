'use client'

import React, { useState } from 'react'
import { Box, Button, Typography, Alert, AlertTitle } from '@mui/material'
import { Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'

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
  const { shouldHideSpoiler: spoilerSettingsShouldHide, settings } = useSpoilerSettings()

  const shouldHideSpoiler = () => {
    // First check if spoiler settings say to show all spoilers
    if (settings.showAllSpoilers) {
      return false
    }

    // Determine the effective progress to use for spoiler checking
    // Priority: spoiler settings tolerance > user progress
    const effectiveProgress = settings.chapterTolerance > 0 
      ? settings.chapterTolerance 
      : userProgress

    // If we have a specific chapter number, use it for comparison
    if (chapterNumber) {
      // For different spoiler types, apply different tolerance levels
      switch (spoilerType) {
        case 'minor':
          // Minor spoilers are more lenient - only hide if user is very early (chapter 1-2) 
          // and the spoiler is from significantly later (5+ chapters ahead)
          if (effectiveProgress <= 2) {
            return chapterNumber > effectiveProgress + 4
          }
          // For users past chapter 2, be more lenient with minor spoilers
          return chapterNumber > effectiveProgress + 2
          
        case 'outcome':
          // Outcome spoilers need strict protection
          return chapterNumber > effectiveProgress
          
        case 'major':
        default:
          // Major spoilers use standard comparison
          return chapterNumber > effectiveProgress
      }
    }

    // For spoilers without specific chapter numbers
    // Base decision on spoiler type and current progress
    switch (spoilerType) {
      case 'minor':
        // Minor spoilers without chapter info: only hide if user is at the very beginning
        return effectiveProgress <= 1
        
      case 'outcome':
        // Outcome spoilers without chapter info: always hide until explicitly revealed
        return true
        
      case 'major':
      default:
        // Major spoilers without chapter info: hide if user hasn't made significant progress
        return effectiveProgress <= 5
    }
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

  const handleReveal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRevealed(true)
  }

  const handleAlertClick = (e: React.MouseEvent) => {
    // Only reveal if not clicking on a button or other interactive element
    const target = e.target as HTMLElement
    if (!target.closest('button') && !target.closest('a') && !target.closest('[role="button"]')) {
      handleReveal(e)
    }
  }

  // Always show content if manually revealed, regardless of progress
  if (isRevealed) {
    return <div className={className}>{children}</div>
  }

  // If spoiler should not be hidden based on unified progress logic, show content directly
  if (!shouldHideSpoiler()) {
    return <div className={className}>{children}</div>
  }

  // Show spoiler warning with reveal button
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          key="spoiler-warning"
        >
          <Alert 
            onClick={handleAlertClick}
            severity={getSpoilerColor()}
            icon={getSpoilerIcon()}
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: (theme) => theme.palette.action.hover
              }
            }}
          >
            <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getSpoilerLabel()}
            </AlertTitle>
            {description && <div>{description}</div>}
            <div style={{ marginTop: '8px' }}>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={handleReveal}
                sx={{ textTransform: 'none' }}
              >
                Click to Reveal
              </Button>
            </div>
          </Alert>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}