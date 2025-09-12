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
  Paper,
  Collapse
} from '@mui/material'
import { Search, Dices, ChevronDown, ChevronRight } from 'lucide-react'
import GambleChip from './GambleChip'

interface Gamble {
  id: number
  name: string
  rules?: string
}

interface GambleSelectionPopupProps {
  open: boolean
  onClose: () => void
  gambles: Gamble[]
  selectedGambleId?: number | null
  onSelectGamble: (gambleId: number | null) => void
  loading?: boolean
}

export default function GambleSelectionPopup({
  open,
  onClose,
  gambles,
  selectedGambleId,
  onSelectGamble,
  loading = false
}: GambleSelectionPopupProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [tempSelectedGamble, setTempSelectedGamble] = useState<number | null>(selectedGambleId || null)
  const [expandedGamble, setExpandedGamble] = useState<number | null>(null)

  // Filter gambles based on search term
  const filteredGambles = gambles.filter(gamble =>
    gamble.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (gamble.rules && gamble.rules.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleConfirm = () => {
    onSelectGamble(tempSelectedGamble)
    onClose()
  }

  const handleCancel = () => {
    setTempSelectedGamble(selectedGambleId || null)
    setSearchTerm('')
    setExpandedGamble(null)
    onClose()
  }

  const handleClearSelection = () => {
    setTempSelectedGamble(null)
  }

  const toggleExpanded = (gambleId: number) => {
    setExpandedGamble(expandedGamble === gambleId ? null : gambleId)
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
          <Dices size={24} />
          Select Favorite Gamble
        </Box>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 2 }}>
        {/* Search Field */}
        <TextField
          fullWidth
          placeholder="Search gambles by name or rules..."
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
        {tempSelectedGamble && (
          <Paper elevation={1} sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" gutterBottom>
              Currently Selected:
            </Typography>
            {(() => {
              const selectedGamble = gambles.find(g => g.id === tempSelectedGamble)
              return selectedGamble ? (
                <Box>
                  <GambleChip 
                    gamble={selectedGamble} 
                    size="small" 
                    variant="filled"
                    clickable={false}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Gamble not found
                </Typography>
              )
            })()}
          </Paper>
        )}

        {/* Gamble List */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle2" gutterBottom>
            Available Gambles ({filteredGambles.length})
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredGambles.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {searchTerm ? 'No gambles found matching your search.' : 'No gambles available.'}
            </Typography>
          ) : (
            <List sx={{ flex: 1, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {filteredGambles.map((gamble) => (
                <Box key={gamble.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={tempSelectedGamble === gamble.id}
                      onClick={() => setTempSelectedGamble(gamble.id)}
                      sx={{ 
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
                      <Box sx={{ width: '100%', py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <GambleChip 
                              gamble={gamble} 
                              size="small" 
                              variant={tempSelectedGamble === gamble.id ? "filled" : "outlined"}
                              clickable={false}
                            />
                          </Box>
                          {gamble.rules && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: tempSelectedGamble === gamble.id ? 'inherit' : 'text.secondary',
                                opacity: 0.8
                              }}
                            >
                              {gamble.rules.length > 100 
                                ? `${gamble.rules.substring(0, 100)}...` 
                                : gamble.rules
                              }
                            </Typography>
                          )}
                        </Box>
                        
                        {/* Expand button for full rules */}
                        {gamble.rules && gamble.rules.length > 100 && (
                          <Button
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExpanded(gamble.id)
                            }}
                            sx={{ 
                              minWidth: 'auto',
                              color: tempSelectedGamble === gamble.id ? 'inherit' : 'text.secondary'
                            }}
                          >
                            {expandedGamble === gamble.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </Button>
                        )}
                      </Box>
                    </ListItemButton>
                  </ListItem>
                  
                  {/* Expanded rules section */}
                  {gamble.rules && (
                    <Collapse in={expandedGamble === gamble.id}>
                      <Box sx={{ px: 2, pb: 2, bgcolor: 'action.hover' }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Full Rules:</strong> {gamble.rules}
                        </Typography>
                      </Box>
                    </Collapse>
                  )}
                </Box>
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
