'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthProvider'
import { api } from '../lib/api'

interface ProgressContextType {
  userProgress: number
  loading: boolean
  updateProgress: (chapter: number) => Promise<void>
  isProgressLoaded: boolean
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

const STORAGE_KEY = 'usogui-reading-progress'
const MAX_CHAPTER = 539

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

  // Load progress from localStorage or user data
  const loadProgress = useCallback(async () => {
    setLoading(true)
    try {
      if (user) {
        // Use logged-in user's progress
        setUserProgress(user.userProgress || 1)
        // Sync local storage with user progress if different
        const localProgress = parseInt(localStorage.getItem(STORAGE_KEY) || '1', 10)
        if (localProgress > user.userProgress && localProgress <= MAX_CHAPTER) {
          // Local progress is ahead, sync it to server
          await api.updateUserProgress(localProgress)
          setUserProgress(localProgress)
        }
      } else {
        // Use localStorage for non-logged-in users
        const storedProgress = localStorage.getItem(STORAGE_KEY)
        const progress = storedProgress ? parseInt(storedProgress, 10) : 1
        setUserProgress(Math.min(Math.max(progress, 1), MAX_CHAPTER))
      }
    } catch (error) {
      console.error('Failed to load progress:', error)
      // Fallback to localStorage or default
      const storedProgress = localStorage.getItem(STORAGE_KEY)
      setUserProgress(storedProgress ? parseInt(storedProgress, 10) : 1)
    } finally {
      setLoading(false)
      setIsProgressLoaded(true)
    }
  }, [user])

  // Update progress
  const updateProgress = useCallback(async (chapter: number) => {
    const validChapter = Math.min(Math.max(chapter, 1), MAX_CHAPTER)
    
    try {
      if (user) {
        // Update on server for logged-in users
        await api.updateUserProgress(validChapter)
      }
      
      // Always update localStorage and local state
      localStorage.setItem(STORAGE_KEY, validChapter.toString())
      setUserProgress(validChapter)
    } catch (error) {
      console.error('Failed to update progress:', error)
      // Still update locally even if server update fails
      localStorage.setItem(STORAGE_KEY, validChapter.toString())
      setUserProgress(validChapter)
      throw error
    }
  }, [user])

  // Load progress when auth state changes
  useEffect(() => {
    if (!authLoading) {
      loadProgress()
    }
  }, [user, authLoading, loadProgress])

  // Sync local storage changes with state for non-logged-in users
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && !user) {
        const newProgress = e.newValue ? parseInt(e.newValue, 10) : 1
        setUserProgress(Math.min(Math.max(newProgress, 1), MAX_CHAPTER))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
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