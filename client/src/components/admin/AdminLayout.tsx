import React from 'react'
import { Layout, AppBar, usePermissions } from 'react-admin'
import { Box, Typography, IconButton } from '@mui/material'
import { Crown, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CustomAppBar = () => {
  const { permissions } = usePermissions()
  const router = useRouter()
  
  const handleBackToHome = () => {
    router.push('/')
  }
  
  return (
    <AppBar>
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <IconButton
          onClick={handleBackToHome}
          sx={{ 
            color: 'inherit',
            mr: 1,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
          title="Back to Landing Page"
        >
          <ArrowLeft size={24} />
        </IconButton>
        
        <Typography variant="h6" component="div">
          Usogui Admin Dashboard
        </Typography>
        {permissions === 'admin' && (
          <Typography
            variant="caption"
            sx={{
              ml: 2,
              px: 1,
              py: 0.5,
              bgcolor: 'error.main',
              color: 'white',
              borderRadius: 1
            }}
          >
            ADMIN
          </Typography>
        )}
      </Box>
    </AppBar>
  )
}

export const AdminLayout = (props: any) => (
  <Layout {...props} appBar={CustomAppBar} />
)