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
    const chapterTolerance = parseInt(localStorage.getItem(SPOILER_STORAGE_KEY) || '0', 10)
    const showAllSpoilers = localStorage.getItem(SHOW_ALL_SPOILERS_KEY) === 'true'
    
    setSettings({ chapterTolerance, showAllSpoilers })
    setIsLoaded(true)
  }, [])

  const updateChapterTolerance = useCallback((chapter: number) => {
    const newSettings = { ...settings, chapterTolerance: chapter }
    setSettings(newSettings)
    localStorage.setItem(SPOILER_STORAGE_KEY, chapter.toString())
  }, [settings])

  const toggleShowAllSpoilers = useCallback(() => {
    const newShowAll = !settings.showAllSpoilers
    const newSettings = { ...settings, showAllSpoilers: newShowAll }
    setSettings(newSettings)
    localStorage.setItem(SHOW_ALL_SPOILERS_KEY, newShowAll.toString())
  }, [settings])

  const shouldHideSpoiler = useCallback((chapterNumber?: number, spoilerType?: string) => {
    if (settings.showAllSpoilers) return false
    if (!chapterNumber) return spoilerType === 'major'
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