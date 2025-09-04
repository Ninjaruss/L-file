'use client'

import React from 'react'
import { Box, Typography, Link, Stack } from '@mui/material'
import NextLink from 'next/link'

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
          L-file is an independent fan resource. Usogui © Sako Toshio/Shueisha.
        </Typography>
        <Box>
          <Link component={NextLink} href="/disclaimer" color="primary" sx={{ textDecoration: 'none' }}>
            <Typography variant="body2">
              Disclaimer & Legal Information
            </Typography>
          </Link>
        </Box>
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