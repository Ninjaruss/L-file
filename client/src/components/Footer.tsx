'use client'

import React from 'react'
import { Box, Typography, Link, Stack } from '@mui/material'

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 3,
        px: 2,
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider'
      }}
    >
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Typography variant="body2" color="text.secondary">
          This is an unofficial fan resource for Usogui created by Sako Toshio and published by Shueisha.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Contact:{' '}
            <Link href="mailto:ninjarussyt@gmail.com" color="primary">
              ninjarussyt@gmail.com
            </Link>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Discord:{' '}
            <Link href="https://discord.gg/JXeRhV2qpY" target="_blank" rel="noopener noreferrer" color="primary">
              Join our server
            </Link>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Support:{' '}
            <Link href="https://ko-fi.com/ninjaruss" target="_blank" rel="noopener noreferrer" color="primary">
              Ko-fi
            </Link>
          </Typography>
        </Stack>
      </Stack>
    </Box>
  )
}