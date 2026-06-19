'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { VolumeShowcaseSlot } from '../lib/showcase-config'
import type { ShowcaseSlot } from '../types'

interface LandingData {
  trending: {
    guides: Array<{
      id: number
      title: string
      description: string
      viewCount: number
      recentViewCount: number
      author: { id: number; username: string }
      createdAt: string
    }>
    characters: Array<{
      id: number
      name: string
      description?: string
      viewCount: number
      recentViewCount: number
    }>
    events: Array<{
      id: number
      title: string
      description: string
      viewCount: number
      recentViewCount: number
    }>
    gambles: Array<{
      id: number
      name: string
      rules: string
      viewCount: number
      recentViewCount: number
    }>
  }
  stats: {
    totalCharacters: number
    totalEvents: number
    totalGuides: number
    totalGambles: number
    totalArcs?: number
    totalMedia?: number
    totalUsers?: number
  }
}

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 600

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)))
      }
    }
  }
  throw lastError
}

function mapShowcaseSlots(items: ShowcaseSlot[]): VolumeShowcaseSlot[] {
  return items.map((slot) => ({
    primary: {
      id: slot.primary.volumeId,
      backgroundImage: slot.primary.backgroundUrl,
      popoutImage: slot.primary.popoutUrl,
      title: slot.primary.title,
    },
    secondary: slot.secondary
      ? {
          id: slot.secondary.volumeId,
          backgroundImage: slot.secondary.backgroundUrl,
          popoutImage: slot.secondary.popoutUrl,
          title: slot.secondary.title,
        }
      : undefined,
  }))
}

export function useLandingData() {
  const [data, setData] = useState<LandingData | null>(null)
  const [showcaseSlots, setShowcaseSlots] = useState<VolumeShowcaseSlot[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [landingResult, showcaseResult] = await Promise.all([
        fetchWithRetry(() => api.getLandingPageData({ limit: 3, daysBack: 7 })),
        fetchWithRetry(() => api.getShowcaseReadyVolumes()).catch(() => [] as ShowcaseSlot[]),
      ])

      setData(landingResult)
      setShowcaseSlots(
        showcaseResult.length > 0 ? mapShowcaseSlots(showcaseResult) : []
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load landing page data')
      setShowcaseSlots([])
      console.error('Error fetching landing page data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, showcaseSlots, loading, error, retry: fetchData }
}
