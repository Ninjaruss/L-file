export interface TimelineEvent {
  id: number
  title: string
  description?: string | null
  chapterNumber: number
  pageNumber?: number | null
  type?: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution' | null
  spoilerChapter?: number
  arcId?: number
  arcName?: string
  gambleId?: number
  characters?: Array<{ id: number; name: string }>
}

export interface TimelineArc {
  id: number
  name: string
  description?: string | null
  startChapter: number
  endChapter: number | null
}
