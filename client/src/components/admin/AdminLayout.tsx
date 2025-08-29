import React from 'react'
import { Layout, AppBar, UserMenu, usePermissions } from 'react-admin'
import { Box, Typography } from '@mui/material'
import { Crown } from 'lucide-react'

const CustomAppBar = () => {
  const { permissions } = usePermissions()
  
  return (
    <AppBar>
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <Crown size={24} style={{ marginRight: 8 }} />
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
      <UserMenu />
    </AppBar>
  )
}

export const AdminLayout = (props: any) => (
  <Layout {...props} appBar={CustomAppBar} />
)