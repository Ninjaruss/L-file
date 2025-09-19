import { ReactNode } from 'react'
import { getEntityAccent, mantineTheme, EntityAccentKey } from '../lib/mantine-theme'

export interface NavigationItem {
  label: string
  href: string
  icon: ReactNode
}

export interface NavigationCategory {
  name: string
  items: NavigationItem[]
  color?: string
}

export interface NavigationData {
  browse: NavigationCategory[]
  community: NavigationItem[]
  submit: NavigationItem[]
}

const categoryAccentMap: Record<string, EntityAccentKey> = {
  Cast: 'character',
  'Story Elements': 'arc',
  'Reference Guide': 'guide'
}

const fallbackCategoryColor = mantineTheme.other?.usogui?.red ?? '#e11d48'

export const getCategoryColor = (category: string): string => {
  const accentKey = categoryAccentMap[category]
  if (!accentKey) {
    return fallbackCategoryColor
  }

  return getEntityAccent(accentKey)
}
