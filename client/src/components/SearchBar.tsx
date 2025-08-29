'use client'

import React, { useState, useCallback, useRef } from 'react'
import {
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  CircularProgress,
  Typography
} from '@mui/material'
import { Search, BookOpen, Users, Crown, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api } from '../lib/api'
import { useAuth } from '../providers/AuthProvider'
import { motion, AnimatePresence } from 'motion/react'

interface SearchResult {
  id: number
  type: string
  title: string
  description: string
  score: number
  hasSpoilers: boolean
  slug: string
  metadata?: any
}

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'character':
        return <Users size={16} />
      case 'arc':
        return <BookOpen size={16} />
      case 'gamble':
        return <Crown size={16} />
      case 'event':
        return <Zap size={16} />
      default:
        return <Search size={16} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'character':
        return 'primary'
      case 'arc':
        return 'secondary'
      case 'gamble':
        return 'error'
      case 'event':
        return 'warning'
      default:
        return 'default'
    }
  }

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    try {
      const response = await api.search(
        searchQuery,
        undefined,
        user?.userProgress
      )
      setResults(response.results)
      setShowResults(true)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
      setShowResults(false)
    } finally {
      setLoading(false)
    }
  }, [user?.userProgress])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setQuery(value)

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    searchTimeout.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false)
    setQuery('')
    
    const path = `/${result.type}s/${result.id}`
    router.push(path)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowResults(false)
      setQuery('')
    }
  }

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search characters, arcs, gambles, events..."
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 2 && setShowResults(true)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <Search size={20} />
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'background.paper',
          }
        }}
      />

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Paper
              elevation={8}
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1300,
                maxHeight: 400,
                overflow: 'auto',
                mt: 1,
                borderRadius: 2
              }}
            >
              {results.length > 0 ? (
                <List disablePadding>
                  {results.map((result) => (
                    <ListItem
                      key={`${result.type}-${result.id}`}
                      component="button"
                      onClick={() => handleResultClick(result)}
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        },
                        '&:last-child': {
                          borderBottom: 'none'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        {getTypeIcon(result.type)}
                      </Box>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
                              {result.title}
                            </Typography>
                            <Chip
                              size="small"
                              label={result.type}
                              color={getTypeColor(result.type) as any}
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                            {result.hasSpoilers && (
                              <Chip
                                size="small"
                                label="Spoilers"
                                color="warning"
                                variant="filled"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%'
                            }}
                          >
                            {result.description}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {query.trim().length < 2 
                      ? 'Type at least 2 characters to search'
                      : 'No results found'
                    }
                  </Typography>
                </Box>
              )}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {showResults && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
            backgroundColor: 'transparent'
          }}
          onClick={() => setShowResults(false)}
        />
      )}
    </Box>
  )
}