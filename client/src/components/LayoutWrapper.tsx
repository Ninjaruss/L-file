'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Box } from '@mui/material'
import { Footer } from './Footer'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}
    >
      <Box sx={{ flex: 1 }}>
        {children}
      </Box>
      {!isAdminPage && <Footer />}
    </Box>
  )
}