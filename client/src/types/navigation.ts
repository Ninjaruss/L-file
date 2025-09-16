import { ReactNode } from 'react'

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

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Cast':
      return '#2196f3' // Bright Material Blue
    case 'Story Elements':
      return '#e91e63' // Bright Material Pink
    case 'Reference Guide':
      return '#4caf50' // Bright Material Green
    default:
      return '#f44336' // Bright Material Red
  }
}