import { useEffect, useRef, useState } from 'react'

type PaginatedEnvelope<T> = {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

type CacheEntry<T> = {
  value: PaginatedEnvelope<T>
  ts: number
}

type UsePagedCacheOptions = {
  ttlMs?: number
  persist?: boolean
  maxEntries?: number
}

// Rate limiting state
const rateLimitState = {
  requests: new Map<string, number[]>(), // keyBase -> timestamps
  retryAfter: new Map<string, number>(), // keyBase -> retry timestamp
}

// Simple LRU-like capped cache with optional sessionStorage persistence and stale-while-revalidate
export function createPagedCache<T>(keyBase: string, options: UsePagedCacheOptions = {}) {
  const ttlMs = options.ttlMs ?? 60_000
  const persist = options.persist ?? true
  const maxEntries = options.maxEntries ?? 100

  const cache = new Map<string, CacheEntry<T>>()
  const inflight = new Map<string, Promise<PaginatedEnvelope<T>>>()
  const subscribers = new Map<string, Set<() => void>>()

  const storageKey = `pagedcache:${keyBase}`

  function makeKey(page: number, params?: any) {
    const p = params ? JSON.stringify(params) : ''
    return `${page}|${p}`
  }

  function pruneIfNeeded() {
    if (cache.size <= maxEntries) return
    const keys = cache.keys()
    const toRemove = cache.size - maxEntries
    for (let i = 0; i < toRemove; i++) {
      const k = keys.next().value
      if (!k) break
      cache.delete(k)
    }
  }

  function persistCache() {
    if (!persist) return
    try {
      const obj: Record<string, CacheEntry<T>> = {}
      cache.forEach((v, k) => {
        obj[k] = v
      })
      sessionStorage.setItem(storageKey, JSON.stringify(obj))
    } catch (e) {
      // ignore
    }
  }

  function rehydrate() {
    if (!persist) return
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as Record<string, CacheEntry<T>>
      for (const k of Object.keys(parsed)) {
        cache.set(k, parsed[k])
      }
    } catch (e) {
      // ignore
    }
  }

  rehydrate()

  function get(page: number, params?: any) {
    const k = makeKey(page, params)
    const entry = cache.get(k)
    if (!entry) return undefined
    return entry.value
  }

  function set(page: number, params: any, value: PaginatedEnvelope<T>) {
    const k = makeKey(page, params)
    cache.set(k, { value, ts: Date.now() })
    pruneIfNeeded()
    persistCache()
    const subs = subscribers.get(k)
    if (subs) subs.forEach(cb => cb())
  }

  function isStale(page: number, params?: any) {
    const k = makeKey(page, params)
    const entry = cache.get(k)
    if (!entry) return true
    return Date.now() - entry.ts > ttlMs
  }

  function subscribe(page: number, params: any, cb: () => void) {
    const k = makeKey(page, params)
    let setForKey = subscribers.get(k)
    if (!setForKey) {
      setForKey = new Set()
      subscribers.set(k, setForKey)
    }
    setForKey.add(cb)
    return () => setForKey!.delete(cb)
  }

  function invalidate(page?: number, params?: any) {
    if (page == null) {
      cache.clear()
      persistCache()
      return
    }
    const k = makeKey(page, params)
    cache.delete(k)
    persistCache()
  }

  function checkRateLimit(): boolean {
    const now = Date.now()

    // Check if we're in a retry-after period
    const retryAfter = rateLimitState.retryAfter.get(keyBase)
    if (retryAfter && now < retryAfter) {
      return false // Still in rate limit period
    }

    // More restrictive rate limiting based on keyBase
    const requests = rateLimitState.requests.get(keyBase) || []
    const oneMinuteAgo = now - 60_000
    const recentRequests = requests.filter(timestamp => timestamp > oneMinuteAgo)

    // Different limits based on content type
    let maxRequests = 10 // Default
    if (keyBase === 'volumes') {
      maxRequests = 5 // More restrictive for volumes
    } else if (keyBase.includes('search') || keyBase.includes('filter')) {
      maxRequests = 3 // Very restrictive for search operations
    }

    if (recentRequests.length >= maxRequests) {
      return false // Rate limit exceeded
    }

    // Update request tracking
    recentRequests.push(now)
    rateLimitState.requests.set(keyBase, recentRequests)
    return true
  }

  async function fetchOnce(page: number, params: any, fetcher: (page: number, params?: any) => Promise<PaginatedEnvelope<T>>) {
    const k = makeKey(page, params)
    if (inflight.has(k)) return inflight.get(k)!

    // Check rate limiting
    if (!checkRateLimit()) {
      const retryAfter = rateLimitState.retryAfter.get(keyBase)
      const waitTime = retryAfter ? Math.max(0, retryAfter - Date.now()) : 10000 // Increased wait time
      const requests = rateLimitState.requests.get(keyBase) || []
      const oneMinuteAgo = Date.now() - 60_000
      const recentRequests = requests.filter(timestamp => timestamp > oneMinuteAgo)

      throw new Error(`Rate limited: ${recentRequests.length} requests in the last minute. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`)
    }

    const p = (async () => {
      try {
        const res = await fetcher(page, params)
        set(page, params, res)

        // Clear any rate limit state on successful request
        rateLimitState.retryAfter.delete(keyBase)

        return res
      } catch (error: any) {
        // Handle rate limiting
        if (error?.status === 429) {
          const retryAfterHeader = error?.headers?.get?.('retry-after')
          const retryAfterMs = retryAfterHeader ? parseInt(retryAfterHeader) * 1000 : 30000
          rateLimitState.retryAfter.set(keyBase, Date.now() + retryAfterMs)
        }
        throw error
      } finally {
        inflight.delete(k)
      }
    })()
    inflight.set(k, p)
    return p
  }

  return {
    get,
    set,
    isStale,
    subscribe,
    invalidate,
    fetchOnce
  }
}

export function usePaged<T>(
  keyBase: string,
  page: number,
  fetcher: (page: number, params?: any) => Promise<PaginatedEnvelope<T>>,
  params?: any,
  options?: UsePagedCacheOptions
) {
  const cacheRef = useRef<any | null>(null)
  if (!cacheRef.current) cacheRef.current = createPagedCache<T>(keyBase, options)
  const cache = cacheRef.current

  const key = `${keyBase}:${page}:${JSON.stringify(params ?? {})}`

  const [state, setState] = useState<{
    data?: PaginatedEnvelope<T>
    loading: boolean
    error?: unknown
  }>(() => {
    const v = cache.get(page, params)
    return { data: v, loading: v ? false : true }
  })

  useEffect(() => {
    let mounted = true
    const cb = () => {
      if (!mounted) return
      setState(s => ({ ...s, data: cache.get(page, params) }))
    }
    const unsub = cache.subscribe(page, params, cb)

    // If we have cached data but it's stale, start background refresh
    const cached = cache.get(page, params)
    if (!cached || cache.isStale(page, params)) {
      setState(s => ({ ...s, loading: true }))
      cache.fetchOnce(page, params, fetcher).then((res: PaginatedEnvelope<T>) => {
        if (!mounted) return
        setState({ data: res, loading: false })
      }).catch((err: any) => {
        if (!mounted) return
        // Handle rate limiting gracefully
        if (err?.status === 429 || err.message?.includes('Rate limited')) {
          setState({ loading: false, error: err.message || 'Rate limit exceeded. Please wait and try again.' })
        } else {
          setState({ loading: false, error: err })
        }
      })
    }

    return () => {
      mounted = false
      unsub()
    }
  }, [page, key])

  const refresh = async (force = false) => {
    setState(s => ({ ...s, loading: true }))
    try {
      const res = await cache.fetchOnce(page, params, fetcher)
      setState({ data: res, loading: false })
      return res
    } catch (err: any) {
      // Handle rate limiting gracefully
      if (err?.status === 429 || err.message?.includes('Rate limited')) {
        setState({ loading: false, error: err.message || 'Rate limit exceeded. Please wait and try again.' })
      } else {
        setState({ loading: false, error: err })
      }
      throw err
    }
  }

  const prefetch = async (p: number) => {
    return cache.fetchOnce(p, params, fetcher)
  }

  const invalidate = (p?: number) => {
    cache.invalidate(p ?? page, params)
  }

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh,
    prefetch,
    invalidate
  }
}
