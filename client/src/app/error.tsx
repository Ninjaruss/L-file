'use client'

import { useEffect } from 'react'
import { Alert, Box, Button, Stack, Text, Title } from '@mantine/core'
import { textColors } from '../lib/mantine-theme'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

/**
 * Global error boundary for the Next.js App Router.
 * This catches unhandled errors in any route segment.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('[GlobalError] Unhandled error:', error)
  }, [error])

  const isNetworkError =
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('timeout') ||
    error.message?.includes('rate limit')

  return (
    <Box
      p="xl"
      style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Alert
        style={{
          color: textColors.gamble,
          maxWidth: '600px',
          width: '100%',
        }}
        radius="md"
        icon={<AlertTriangle size={24} />}
        title={
          <Title order={3}>
            {isNetworkError ? 'Connection Error' : 'Something went wrong'}
          </Title>
        }
      >
        <Stack gap="md">
          <Text size="sm">
            {isNetworkError
              ? "We're having trouble connecting to our servers. Please check your connection and try again."
              : 'We encountered an unexpected error while loading this page.'}
          </Text>

          {process.env.NODE_ENV !== 'production' && error.message && (
            <Text
              size="xs"
              c="dimmed"
              style={{
                fontFamily: 'monospace',
                background: 'rgba(0,0,0,0.2)',
                padding: '8px',
                borderRadius: '4px',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
            </Text>
          )}

          <Box style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button
              variant="light"
              style={{ color: textColors.gamble }}
              leftSection={<RefreshCw size={16} />}
              onClick={() => reset()}
            >
              Try Again
            </Button>

            <Button
              component={Link}
              href="/"
              variant="subtle"
              leftSection={<Home size={16} />}
            >
              Go Home
            </Button>
          </Box>

          {error.digest && (
            <Text size="xs" c="dimmed">
              Error ID: {error.digest}
            </Text>
          )}
        </Stack>
      </Alert>
    </Box>
  )
}
