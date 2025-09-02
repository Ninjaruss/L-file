'use client'

import { useEffect, useRef } from 'react'
import { api } from '../lib/api'

export function usePageView(pageType: string, pageId: number | string, enabled: boolean = true) {
  const recordedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled || !pageId) return

    // Create a unique key for this page view
    const viewKey = `${pageType}:${pageId}`
    
    // Check if we've already recorded this view
    if (recordedRef.current.has(viewKey)) return

    const recordView = async () => {
      try {
        // Mark as recorded before making the API call to prevent race conditions
        recordedRef.current.add(viewKey)
        await api.recordPageView(pageType, Number(pageId))
      } catch (error) {
        // If the API call fails, remove from recorded set so it can be retried
        recordedRef.current.delete(viewKey)
        // Silently fail - page view tracking shouldn't break the user experience
        console.debug('Failed to record page view:', error)
      }
    }

    // Record the page view
    recordView()
  }, [pageType, pageId, enabled])
}