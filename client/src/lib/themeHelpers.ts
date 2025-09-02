import { Theme } from '@mui/material/styles'

// Helper function to get consistent icon colors for different content types
export const getIconColor = (type: string, theme: Theme): string => {
  switch (type) {
    case 'gamble':
    case 'gambles':
      return theme.palette.usogui.gamble
    case 'character':
    case 'characters':
      return theme.palette.usogui.character
    case 'arc':
    case 'arcs':
      return theme.palette.usogui.arc
    case 'event':
    case 'events':
      return theme.palette.usogui.event
    case 'guide':
    case 'guides':
      return theme.palette.usogui.guide
    case 'media':
      return theme.palette.usogui.media
    case 'quote':
    case 'quotes':
      return theme.palette.usogui.quote
    case 'info':
    case 'login':
    case 'register':
      return theme.palette.info.main
    case 'admin':
    case 'dashboard':
      return theme.palette.error.main
    default:
      return theme.palette.primary.main
  }
}

// Helper function to get MUI color prop for different content types
export const getMuiColor = (type: string): 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
  switch (type) {
    case 'gamble':
    case 'gambles':
      return 'error'
    case 'character':
    case 'characters':
      return 'info'
    case 'arc':
    case 'arcs':
      return 'secondary'
    case 'event':
    case 'events':
      return 'warning'
    case 'guide':
    case 'guides':
      return 'success'
    default:
      return 'primary'
  }
}