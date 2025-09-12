'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  Typography,
  Box,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Paper
} from '@mui/material'
import { Search, Quote as QuoteIcon } from 'lucide-react'

interface Quote {
  id: number
  text: string
  character: string
  chapterNumber: number
}

interface QuoteSelectionPopupProps {
  open: boolean
  onClose: () => void
  quotes: Quote[]
  selectedQuoteId?: number | null
  onSelectQuote: (quoteId: number | null) => void
  loading?: boolean
}

export default function QuoteSelectionPopup({
  open,
  onClose,
  quotes,
  selectedQuoteId,
  onSelectQuote,
  loading = false
}: QuoteSelectionPopupProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [tempSelectedQuote, setTempSelectedQuote] = useState<number | null>(selectedQuoteId || null)

  // Filter quotes based on search term
  const filteredQuotes = quotes.filter(quote =>
    quote.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.character.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleConfirm = () => {
    onSelectQuote(tempSelectedQuote)
    onClose()
  }

  const handleCancel = () => {
    setTempSelectedQuote(selectedQuoteId || null)
    setSearchTerm('')
    onClose()
  }

  const handleClearSelection = () => {
    setTempSelectedQuote(null)
  }

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuoteIcon size={24} />
          Select Favorite Quote
        </Box>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 2 }}>
        {/* Search Field */}
        <TextField
          fullWidth
          placeholder="Search quotes by text or character..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            )
          }}
          size="small"
        />

        {/* Current Selection */}
        {tempSelectedQuote && (
          <Paper elevation={1} sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" gutterBottom>
              Currently Selected:
            </Typography>
            {(() => {
              const selectedQuote = quotes.find(q => q.id === tempSelectedQuote)
              return selectedQuote ? (
                <Box>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1 }}>
                    "{selectedQuote.text}"
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip 
                      label={selectedQuote.character} 
                      size="small" 
                      variant="outlined"
                    />
                    <Chip 
                      label={`Ch. ${selectedQuote.chapterNumber}`} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Quote not found
                </Typography>
              )
            })()}
          </Paper>
        )}

        {/* Quote List */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle2" gutterBottom>
            Available Quotes ({filteredQuotes.length})
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredQuotes.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {searchTerm ? 'No quotes found matching your search.' : 'No quotes available.'}
            </Typography>
          ) : (
            <List sx={{ flex: 1, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {filteredQuotes.map((quote) => (
                <ListItem key={quote.id} disablePadding>
                  <ListItemButton
                    selected={tempSelectedQuote === quote.id}
                    onClick={() => setTempSelectedQuote(quote.id)}
                    sx={{ 
                      flexDirection: 'column', 
                      alignItems: 'flex-start',
                      py: 2,
                      '&.Mui-selected': {
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.main'
                        }
                      }
                    }}
                  >
                    <Box sx={{ width: '100%', py: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontStyle: 'italic',
                          mb: 1,
                          color: tempSelectedQuote === quote.id ? 'inherit' : 'text.primary'
                        }}
                      >
                        "{quote.text}"
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip 
                          label={quote.character} 
                          size="small" 
                          variant={tempSelectedQuote === quote.id ? "filled" : "outlined"}
                          sx={{
                            bgcolor: tempSelectedQuote === quote.id ? 'primary.dark' : 'transparent',
                            color: tempSelectedQuote === quote.id ? 'primary.contrastText' : 'text.secondary',
                            borderColor: tempSelectedQuote === quote.id ? 'primary.dark' : 'divider'
                          }}
                        />
                        <Chip 
                          label={`Ch. ${quote.chapterNumber}`} 
                          size="small" 
                          variant={tempSelectedQuote === quote.id ? "filled" : "outlined"}
                          color="primary"
                          sx={{
                            bgcolor: tempSelectedQuote === quote.id ? 'primary.dark' : 'transparent',
                            color: tempSelectedQuote === quote.id ? 'primary.contrastText' : 'primary.main',
                            borderColor: tempSelectedQuote === quote.id ? 'primary.dark' : 'primary.main'
                          }}
                        />
                      </Box>
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClearSelection} color="warning" variant="outlined">
          Clear Selection
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="primary" 
          variant="contained"
          disabled={loading}
        >
          Confirm Selection
        </Button>
      </DialogActions>
    </Dialog>
  )
}
