'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { theme as mantineTheme } from '../lib/mantine-theme'
import EmotionRegistry from '../lib/emotion-registry'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme as muiTheme } from '../lib/theme'
import { AuthProvider } from './AuthProvider'
import { ProgressProvider } from './ProgressProvider'
import { FloatingProgressIndicator } from '../components/FloatingProgressIndicator'

// Dynamically import Navigation with SSR disabled to prevent hydration issues
const Navigation = dynamic(() => import('../components/Navigation'), {
  ssr: false
})

interface ClientProvidersProps {
  children: React.ReactNode
}

function ConditionalNavigation() {
  const [isClient, setIsClient] = React.useState(false)
  const pathname = usePathname()
  
  React.useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) {
    return null
  }
  
  const isAdminPage = pathname?.startsWith('/admin')
  
  if (isAdminPage) {
    return null
  }
  
  return <Navigation />
}

function ConditionalFloatingProgress() {
  const [isClient, setIsClient] = React.useState(false)
  const pathname = usePathname()
  
  React.useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) {
    return null
  }
  
  const isAdminPage = pathname?.startsWith('/admin')
  
  if (isAdminPage) {
    return null
  }
  
  return <FloatingProgressIndicator />
}

export function ClientProviders({ children }: ClientProvidersProps) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  if (isAdminPage) {
    // Admin routes still rely on MUI (React Admin). Keep Mantine available for shared UI.
    return (
      <MantineProvider theme={mantineTheme}>
        <EmotionRegistry options={{ key: 'mui' }}>
          <ThemeProvider theme={muiTheme}>
            <CssBaseline enableColorScheme />
            <Notifications />
            <AuthProvider>
              <ProgressProvider>
                <main className="min-h-screen bg-usogui-black">
                  {children}
                </main>
              </ProgressProvider>
            </AuthProvider>
          </ThemeProvider>
        </EmotionRegistry>
      </MantineProvider>
    )
  }

  // Public routes are Mantine-only.
  return (
    <MantineProvider theme={mantineTheme}>
      <Notifications />
      <AuthProvider>
        <ProgressProvider>
          <ConditionalNavigation />
          <main className="min-h-screen bg-usogui-black">
            {children}
          </main>
          <ConditionalFloatingProgress />
        </ProgressProvider>
      </AuthProvider>
    </MantineProvider>
  )
}
