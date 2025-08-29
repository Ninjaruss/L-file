'use client'

import React from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from '../lib/theme'
import { AuthProvider } from './AuthProvider'
import { Navigation } from '../components/Navigation'

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
      </AuthProvider>
    </ThemeProvider>
  )
}