'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from '../lib/theme'
import EmotionRegistry from '../lib/emotion-registry'
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
  return (
    <EmotionRegistry options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <AuthProvider>
          <ProgressProvider>
            <ConditionalNavigation />
            <main className="min-h-screen bg-usogui-black">
              {children}
            </main>
            <ConditionalFloatingProgress />
          </ProgressProvider>
        </AuthProvider>
      </ThemeProvider>
    </EmotionRegistry>
  )
}