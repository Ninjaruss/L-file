'use client'

import { useState, useEffect, useCallback } from 'react'

const SPOILER_STORAGE_KEY = 'usogui-spoiler-tolerance'
const SHOW_ALL_SPOILERS_KEY = 'usogui-show-all-spoilers'

export interface SpoilerSettings {
  chapterTolerance: number
  showAllSpoilers: boolean
}

export function useSpoilerSettings() {
  const [settings, setSettings] = useState<SpoilerSettings>({
    chapterTolerance: 0,
    showAllSpoilers: false
  })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const chapterTolerance = parseInt(localStorage.getItem(SPOILER_STORAGE_KEY) || '0', 10)
      const showAllSpoilers = localStorage.getItem(SHOW_ALL_SPOILERS_KEY) === 'true'
      
      setSettings({ chapterTolerance, showAllSpoilers })
      setIsLoaded(true)
    }
  }, [])

  const updateChapterTolerance = useCallback((chapter: number) => {
    const validChapter = Math.max(0, Math.min(chapter, 539)) // Ensure valid range
    const newSettings = { ...settings, chapterTolerance: validChapter }
    setSettings(newSettings)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SPOILER_STORAGE_KEY, validChapter.toString())
    }
  }, [settings])

  const toggleShowAllSpoilers = useCallback(() => {
    const newShowAll = !settings.showAllSpoilers
    const newSettings = { ...settings, showAllSpoilers: newShowAll }
    setSettings(newSettings)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SHOW_ALL_SPOILERS_KEY, newShowAll.toString())
    }
  }, [settings])

  const shouldHideSpoiler = useCallback((chapterNumber?: number, spoilerType?: string) => {
    // If show all spoilers is enabled, never hide
    if (settings.showAllSpoilers) return false
    
    // If no chapter number provided, use spoiler type to decide
    if (!chapterNumber) {
      switch (spoilerType) {
        case 'minor': return settings.chapterTolerance <= 1
        case 'outcome': return true // Always hide outcome spoilers unless explicitly shown
        case 'major':
        default: return settings.chapterTolerance <= 5 // Hide major spoilers if tolerance is low
      }
    }
    
    // If chapter tolerance is 0, don't hide anything (legacy behavior)
    if (settings.chapterTolerance === 0) return false
    
    // Standard comparison with chapter tolerance
    return chapterNumber > settings.chapterTolerance
  }, [settings])

  return {
    settings,
    isLoaded,
    updateChapterTolerance,
    toggleShowAllSpoilers,
    shouldHideSpoiler
  }
}