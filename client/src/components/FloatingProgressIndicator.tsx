'use client'

import React, { useState, useEffect } from 'react'
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  LinearProgress,
  Slide,
  IconButton,
  Tooltip,
  Alert,
  Chip
} from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { BookOpen, Edit3, Check, X, User } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useProgress } from '../providers/ProgressProvider'
import { useAuth } from '../providers/AuthProvider'
import { motion, AnimatePresence } from 'motion/react'

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

const MAX_CHAPTER = 539

export const FloatingProgressIndicator: React.FC = () => {
  const theme = useTheme()
  const { user } = useAuth()
  const { userProgress, updateProgress, loading: progressLoading } = useProgress()
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const progressPercentage = Math.round((userProgress / MAX_CHAPTER) * 100)

  useEffect(() => {
    setInputValue(userProgress.toString())
  }, [userProgress])

  const handleOpen = () => {
    setOpen(true)
    setError('')
    setIsEditing(false)
  }

  const handleClose = () => {
    setOpen(false)
    setInputValue(userProgress.toString())
    setIsEditing(false)
    setError('')
  }

  const handleEdit = () => {
    setIsEditing(true)
    setError('')
  }

  const handleSave = async () => {
    const chapter = parseInt(inputValue, 10)
    
    if (isNaN(chapter) || chapter < 1 || chapter > MAX_CHAPTER) {
      setError(`Chapter must be between 1 and ${MAX_CHAPTER}`)
      return
    }

    setIsUpdating(true)
    setError('')

    try {
      await updateProgress(chapter)
      setIsEditing(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (error) {
      setError('Failed to update progress. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    setInputValue(userProgress.toString())
    setIsEditing(false)
    setError('')
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isUpdating) {
      handleSave()
    } else if (event.key === 'Escape') {
      handleCancel()
    }
  }

  if (progressLoading) {
    return null
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
      >
        <Tooltip
          title={`Reading Progress: Chapter ${userProgress} (${progressPercentage}%)`}
          placement="left"
        >
          <Fab
            color="primary"
            onClick={handleOpen}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: 4,
              '&:hover': {
                boxShadow: 8,
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={24} />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.success.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: 'white'
                }}
              >
                {Math.min(Math.round(progressPercentage / 10), 9)}
              </Box>
            </Box>
          </Fab>
        </Tooltip>
      </motion.div>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
              position: 'fixed',
              bottom: 100,
              right: 24,
              zIndex: 1001
            }}
          >
            <Chip
              label="Progress Updated!"
              color="success"
              variant="filled"
              icon={<Check size={16} />}
              sx={{
                fontSize: '0.875rem',
                fontWeight: 'bold',
                boxShadow: 4
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(33, 33, 33, 0.95) 0%, rgba(66, 66, 66, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 250, 0.95) 100%)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BookOpen size={24} />
            <Typography variant="h6">Reading Progress</Typography>
            {user && (
              <Chip
                label={`Logged in as ${user.username}`}
                size="small"
                color="primary"
                variant="outlined"
                icon={<User size={14} />}
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Progress: {progressPercentage}% complete ({MAX_CHAPTER - userProgress} chapters remaining)
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              sx={{
                height: 8,
                borderRadius: 1,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 1,
                  background: `linear-gradient(90deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`
                }
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {isEditing ? (
              <>
                <TextField
                  fullWidth
                  label="Current Chapter"
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  inputProps={{ min: 1, max: MAX_CHAPTER }}
                  disabled={isUpdating}
                  size="small"
                  helperText={`Enter a chapter number between 1 and ${MAX_CHAPTER}`}
                />
                <IconButton
                  color="primary"
                  onClick={handleSave}
                  disabled={isUpdating}
                  size="small"
                >
                  <Check size={20} />
                </IconButton>
                <IconButton
                  color="secondary"
                  onClick={handleCancel}
                  disabled={isUpdating}
                  size="small"
                >
                  <X size={20} />
                </IconButton>
              </>
            ) : (
              <>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Chapter {userProgress}
                </Typography>
                <IconButton
                  color="primary"
                  onClick={handleEdit}
                  size="small"
                  sx={{ ml: 'auto' }}
                >
                  <Edit3 size={20} />
                </IconButton>
              </>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!user && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Your progress is saved locally. Sign in to sync across devices.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            component={Link}
            href={`/chapters/${userProgress}`}
            variant="contained"
            startIcon={<BookOpen size={16} />}
            onClick={handleClose}
            fullWidth
          >
            Go to Chapter {userProgress}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}