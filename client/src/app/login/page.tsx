'use client'

import React, { useState } from 'react'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link as MuiLink,
  CircularProgress
} from '@mui/material'
import { LogIn } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../providers/AuthProvider'
import { motion } from 'motion/react'

export default function LoginPage() {
  const theme = useTheme()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(formData.username, formData.password)
      router.push('/')
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={8} sx={{ p: 4, borderRadius: 3 }}>
          <Box textAlign="center" mb={4}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <LogIn size={48} color={theme.palette.info.main} />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to access your Usogui fansite account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              margin="normal"
              id="username"
              name="username"
              label="Username or Email"
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={loading}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              margin="normal"
              id="password"
              name="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mb: 2, py: 1.5 }}
              startIcon={loading ? <CircularProgress size={20} /> : <LogIn size={20} />}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <Box textAlign="center" mt={3}>
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{' '}
              <MuiLink component={Link} href="/register" color="primary">
                Sign up here
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  )
}