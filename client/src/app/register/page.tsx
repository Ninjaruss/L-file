'use client'

import React, { useState, Suspense } from 'react'
import {
  Alert,
  Anchor,
  Button,
  Card,
  Container,
  Divider,
  List,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  ThemeIcon,
} from '@mantine/core'
import { AlertCircle, CheckCircle, Circle } from 'lucide-react'
import Link from 'next/link'
import { API_BASE_URL } from '../../../src/lib/api'
import { useAuth } from '../../providers/AuthProvider'

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'At most 128 characters', test: (p: string) => p.length <= 128 },
  { label: 'One uppercase letter (A–Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number (0–9)', test: (p: string) => /\d/.test(p) },
]

function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null
  return (
    <List spacing={2} size="xs" mt={4}>
      {PASSWORD_RULES.map(({ label, test }) => {
        const ok = test(password)
        return (
          <List.Item
            key={label}
            icon={
              <ThemeIcon color={ok ? 'green' : 'gray'} size={14} radius="xl" variant="transparent">
                {ok ? <CheckCircle size={12} /> : <Circle size={12} />}
              </ThemeIcon>
            }
          >
            <Text size="xs" c={ok ? 'green' : 'dimmed'}>{label}</Text>
          </List.Item>
        )
      })}
    </List>
  )
}

function validatePassword(p: string): string | null {
  if (p.length < 8) return 'Password must be at least 8 characters.'
  if (p.length > 128) return 'Password must not exceed 128 characters.'
  if (!/[A-Z]/.test(p)) return 'Password must contain at least one uppercase letter.'
  if (!/[a-z]/.test(p)) return 'Password must contain at least one lowercase letter.'
  if (!/\d/.test(p)) return 'Password must contain at least one number.'
  return null
}

function RegisterContent() {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleFluxerSignup = () => {
    setIsRedirecting(true)
    window.location.href = `${API_BASE_URL}/auth/fluxer`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (username.length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }
    if (username.length > 30) {
      setError('Username must not exceed 30 characters.')
      return
    }

    const pwError = validatePassword(password)
    if (pwError) {
      setError(pwError)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await register(username, email, password)
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Container size="xs" py="xl">
        <Card withBorder radius="md" shadow="sm" padding="xl">
          <Stack gap="md" align="center">
            <CheckCircle size={48} color="var(--mantine-color-green-6)" />
            <Title order={3} ta="center">Check your email</Title>
            <Text size="sm" c="dimmed" ta="center">
              We sent a verification link to <strong>{email}</strong>. Click the link to activate your account.
            </Text>
            <Button component={Link} href="/login" variant="subtle" size="sm">
              Back to login
            </Button>
          </Stack>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xs" py="xl">
      <Card withBorder radius="md" shadow="sm" padding="xl">
        <Stack gap="lg">
          <Stack align="center" gap="xs">
            <Title order={2}>Create Account</Title>
            <Text size="sm" c="dimmed">
              Join the Usogui community
            </Text>
          </Stack>

          {error && (
            <Alert icon={<AlertCircle size={16} />} color="red" variant="light" radius="md">
              {error}
            </Alert>
          )}

          <Stack gap="xs">
            <Button
              onClick={handleFluxerSignup}
              color="violet"
              fullWidth
              size="md"
              loading={isRedirecting}
              disabled={isRedirecting || loading}
              leftSection={
                !isRedirecting && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                )
              }
            >
              {isRedirecting ? 'Redirecting to Fluxer...' : 'Sign up with Fluxer'}
            </Button>
            <Text size="xs" c="dimmed" ta="center">
              New to Fluxer?{' '}
              <Anchor href="https://fluxer.app/" target="_blank" rel="noopener noreferrer" size="xs">
                Learn more
              </Anchor>
            </Text>
          </Stack>

          <Divider label="or sign up with email" labelPosition="center" />

          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              <TextInput
                label="Username"
                placeholder="your_username (3–30 characters)"
                value={username}
                onChange={(e) => setUsername(e.currentTarget.value)}
                required
                disabled={isRedirecting}
              />
              <TextInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
                disabled={isRedirecting}
              />
              <div>
                <PasswordInput
                  label="Password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  required
                  disabled={isRedirecting}
                />
                <PasswordRequirements password={password} />
              </div>
              <PasswordInput
                label="Confirm Password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                required
                disabled={isRedirecting}
                error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
              />
              <Button
                type="submit"
                fullWidth
                size="md"
                loading={loading}
                disabled={isRedirecting || loading || !username || !email || !password || !confirmPassword}
              >
                Create Account
              </Button>
            </Stack>
          </form>

          <Text size="xs" c="dimmed" ta="center">
            Already have an account?{' '}
            <Anchor component={Link} href="/login" size="xs">
              Sign in
            </Anchor>
          </Text>
        </Stack>
      </Card>
    </Container>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <Container size="xs" py="xl">
        <Card withBorder radius="md" shadow="sm" padding="xl">
          <Stack align="center" gap="xs" py="xl">
            <Text size="sm" c="dimmed">Loading...</Text>
          </Stack>
        </Card>
      </Container>
    }>
      <RegisterContent />
    </Suspense>
  )
}
