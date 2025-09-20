// Central config for paged cache TTLs and options per list
// TTL values are tailored based on content characteristics and update frequency
export const pagedCacheConfig = {
  defaults: {
    persist: true as const,
    maxEntries: 100 as const
  },
  lists: {
    // Static content - optimized for client-side loading
    characters: { ttlMs: 1_800_000, maxEntries: 100 }, // 30 minutes - static character data, good for client-side caching
    arcs: { ttlMs: 2_700_000, maxEntries: 50 }, // 45 minutes - story arcs rarely change
    organizations: { ttlMs: 3_600_000, maxEntries: 50 }, // 1 hour - small dataset, very stable
    volumes: { ttlMs: 300_000, maxEntries: 25 }, // 5 minutes - client-side optimized, frequent refresh for good UX
    chapters: { ttlMs: 1_800_000, maxEntries: 200 }, // 30 minutes - client-side optimized, balanced refresh rate

    // Dynamic content - shorter TTLs for freshness
    guides: { ttlMs: 300_000, maxEntries: 100 }, // 5 minutes - user-generated, needs freshness
    gambles: { ttlMs: 900_000, maxEntries: 200 }, // 15 minutes - game mechanics, moderately stable
    quotes: { ttlMs: 1_800_000, maxEntries: 200 }, // 30 minutes - curated content, stable but searchable
    users: { ttlMs: 600_000, maxEntries: 100 }, // 10 minutes - user data, needs reasonable freshness
    events: { ttlMs: 300_000, maxEntries: 100 } // 5 minutes - timeline content, needs freshness
  }
}

export type PagedCacheConfig = typeof pagedCacheConfig
