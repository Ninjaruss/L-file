'use client'

import React, { useState, useEffect } from 'react'
import { Box, Button, Typography, Alert } from '@mui/material'
import { Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface SpoilerWrapperProps {
  children: React.ReactNode
  chapterNumber?: number
  spoilerType?: 'major' | 'minor' | 'outcome'
  description?: string
  className?: string
}

const SPOILER_STORAGE_KEY = 'usogui-spoiler-tolerance'

export default function SpoilerWrapper({ 
  children, 
  chapterNumber, 
  spoilerType = 'major', 
  description,
  className 
}: SpoilerWrapperProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [userTolerance, setUserTolerance] = useState<number>(0)

  useEffect(() => {
    const storedTolerance = localStorage.getItem(SPOILER_STORAGE_KEY)
    if (storedTolerance) {
      setUserTolerance(parseInt(storedTolerance, 10))
    }
  }, [])

  const shouldHideSpoiler = () => {
    if (!chapterNumber) return spoilerType === 'major'
    return chapterNumber > userTolerance
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
      return `${baseLabel} - Chapter ${chapterNumber}`
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