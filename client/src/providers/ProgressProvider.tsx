'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthProvider'
import { api } from '../lib/api'
import { MAX_CHAPTER } from '../lib/constants'

export { MAX_CHAPTER }

interface ProgressContextType {
  userProgress: number
  loading: boolean
  updateProgress: (chapter: number) => Promise<void>
  isProgressLoaded: boolean
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

const STORAGE_KEY = 'usogui-reading-progress'

export const useProgress = () => {
  const context = useContext(ProgressContext)
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider')
  }
  return context
}

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth()
  const [userProgress, setUserProgress] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [isProgressLoaded, setIsProgressLoaded] = useState(false)
  const [previousUser, setPreviousUser] = useState<typeof user | null>(null)

  // Load progress from localStorage or user data
  const loadProgress = useCallback(async () => {
    setLoading(true)
    try {
      if (user) {
        // Use logged-in user's progress as the primary source
        const serverProgress = user.userProgress || 1
        const localProgress = typeof window !== 'undefined' 
          ? parseInt(localStorage.getItem(STORAGE_KEY) || '1', 10)
          : 1
        
        // Determine which progress to use based on a smart comparison
        let finalProgress = serverProgress
        
        if (localProgress > serverProgress) {
          // Local is ahead - this could happen if:
          // 1. User made progress while logged out
          // 2. Local storage has stale data
          
          const difference = localProgress - serverProgress
          
          if (difference <= 2) {
            // Small difference (1-2 chapters) - likely recent progress while logged out
            // Use the higher value (local progress)
            finalProgress = localProgress
            
            // Sync the higher value to server
            try {
              await api.updateUserProgress(localProgress)
            } catch (error) {
              console.error('Failed to sync local progress to server:', error)
            }
          } else if (difference <= 10) {
            // Moderate difference (3-10 chapters) - could be legitimate offline progress
            // Use local but log for awareness
            finalProgress = localProgress
            
            // Sync to server
            try {
              await api.updateUserProgress(localProgress)
            } catch (error) {
              console.error('Failed to sync local progress to server:', error)
            }
          } else {
            // Large difference (>10 chapters) - likely stale/corrupted local data
            // Prioritize server progress for safety
            finalProgress = serverProgress
          }
        } else if (serverProgress > localProgress) {
          // Server is ahead - normal case, use server progress
          finalProgress = serverProgress
        }
        // If they're equal, use server progress (no change needed)
        
        setUserProgress(finalProgress)
        
        // Always keep localStorage in sync with the final decision
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, finalProgress.toString())
        }
      } else {
        // Use localStorage for non-logged-in users, ensure it's always initialized
        if (typeof window !== 'undefined') {
          const storedProgress = localStorage.getItem(STORAGE_KEY)
          if (storedProgress === null) {
            // Initialize localStorage with default value if not set
            localStorage.setItem(STORAGE_KEY, '1')
            setUserProgress(1)
          } else {
            const progress = parseInt(storedProgress, 10)
            const validProgress = Math.min(Math.max(progress, 1), MAX_CHAPTER)
            setUserProgress(validProgress)
            // Ensure localStorage has the validated value
            if (validProgress !== progress) {
              localStorage.setItem(STORAGE_KEY, validProgress.toString())
            }
          }
        } else {
          // Server-side default
          setUserProgress(1)
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error)
      // Fallback to localStorage or default
      if (typeof window !== 'undefined') {
        const storedProgress = localStorage.getItem(STORAGE_KEY)
        if (storedProgress === null) {
          // Initialize localStorage with default if not set
          localStorage.setItem(STORAGE_KEY, '1')
          setUserProgress(1)
        } else {
          const progress = parseInt(storedProgress, 10)
          setUserProgress(isNaN(progress) ? 1 : Math.min(Math.max(progress, 1), MAX_CHAPTER))
        }
      } else {
        setUserProgress(1)
      }
    } finally {
      setLoading(false)
      setIsProgressLoaded(true)
    }
  }, [user])

  // Update progress
  const updateProgress = useCallback(async (chapter: number) => {
    const validChapter = Math.min(Math.max(chapter, 1), MAX_CHAPTER)
    
    // Always update local state immediately for responsive UI
    setUserProgress(validChapter)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, validChapter.toString())
    }
    
    if (user) {
      // For logged-in users, also sync to server
      try {
        await api.updateUserProgress(validChapter)
      } catch (error) {
        console.error('Failed to sync progress to server:', error)
        // Local update already succeeded, so don't throw - just log the sync failure
        // This allows offline usage while preserving local progress
      }
    }
  }, [user])

  // Handle logout scenario - preserve local progress
  useEffect(() => {
    // Check if user just logged out (was logged in, now not logged in)
    if (previousUser && !user && !authLoading) {
      // User just logged out, continue with local progress
      // Don't reset it - keep whatever was the last known progress
      if (typeof window !== 'undefined') {
        const storedProgress = localStorage.getItem(STORAGE_KEY)
        if (storedProgress === null) {
          // Initialize with default if somehow not set
          localStorage.setItem(STORAGE_KEY, '1')
          setUserProgress(1)
        } else {
          const localProgress = parseInt(storedProgress, 10)
          const currentProgress = isNaN(localProgress) ? 1 : Math.min(Math.max(localProgress, 1), MAX_CHAPTER)
          setUserProgress(currentProgress)
        }
      } else {
        setUserProgress(1)
      }
    }
    setPreviousUser(user)
  }, [user, authLoading, previousUser])

  // Load progress when auth state changes
  useEffect(() => {
    if (!authLoading) {
      loadProgress()
    }
  }, [user, authLoading, loadProgress])

  // Sync local storage changes with state for non-logged-in users
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY && !user) {
          const newProgress = e.newValue ? parseInt(e.newValue, 10) : 1
          setUserProgress(Math.min(Math.max(newProgress, 1), MAX_CHAPTER))
        }
      }

      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }
  }, [user])



  const value = {
    userProgress,
    loading,
    updateProgress,
    isProgressLoaded
  }

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}