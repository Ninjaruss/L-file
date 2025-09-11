'use client'

import { useEffect, useRef } from 'react'
import { api } from '../lib/api'

export function usePageView(pageType: string, pageId: number | string, enabled: boolean = true) {
  const recordedRef = useRef<Set<string>>(new Set())
  
  // Load previously recorded views from sessionStorage
  useEffect(() => {
    try {
      const storedViews = sessionStorage.getItem('recordedPageViews')
      if (storedViews) {
        const parsedViews = JSON.parse(storedViews)
        recordedRef.current = new Set(parsedViews)
      }
    } catch (error) {
      console.debug('Failed to load recorded page views from storage:', error)
    }
  }, [])

  useEffect(() => {
    if (!enabled || !pageId) return

    // Create a unique key for this page view
    const viewKey = `${pageType}:${pageId}`
    
    // Check if we've already recorded this view
    if (recordedRef.current.has(viewKey)) return

    const recordView = async () => {
      try {
        // Validate pageId before converting to number
        const numericPageId = Number(pageId)
        if (isNaN(numericPageId) || numericPageId <= 0) {
          console.debug('Invalid page ID for page view tracking:', pageId)
          return
        }
        
        // Mark as recorded before making the API call to prevent race conditions
        recordedRef.current.add(viewKey)
        
        // Persist to sessionStorage
        try {
          sessionStorage.setItem('recordedPageViews', JSON.stringify(Array.from(recordedRef.current)))
        } catch (storageError) {
          console.debug('Failed to save recorded page views to storage:', storageError)
        }
        
        await api.recordPageView(pageType, numericPageId)
      } catch (error) {
        // If the API call fails, remove from recorded set so it can be retried
        recordedRef.current.delete(viewKey)
        try {
          sessionStorage.setItem('recordedPageViews', JSON.stringify(Array.from(recordedRef.current)))
        } catch (storageError) {
          console.debug('Failed to update recorded page views in storage:', storageError)
        }
        // Silently fail - page view tracking shouldn't break the user experience
        console.debug('Failed to record page view:', error)
      }
    }

    // Record the page view
    recordView()
  }, [pageType, pageId, enabled])
}