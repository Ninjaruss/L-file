'use client'

import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Alert
} from '@mui/material'
import { Settings, Eye, EyeOff } from 'lucide-react'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'

const SpoilerSettings: React.FC = () => {
  const { settings, updateChapterTolerance, toggleShowAllSpoilers } = useSpoilerSettings()

  const handleChapterChange = (_: Event, newValue: number | number[]) => {
    updateChapterTolerance(newValue as number)
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Settings size={24} />
          <Typography variant="h5" sx={{ ml: 1 }}>
            Spoiler Settings
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Configure how spoilers are handled throughout the site. You can always reveal individual spoilers by clicking on them.
        </Alert>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Reading Progress
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Hide spoilers beyond chapter {settings.chapterTolerance}
          </Typography>
          
          <Box sx={{ px: 2 }}>
            <Slider
              value={settings.chapterTolerance}
              onChange={handleChapterChange}
              min={0}
              max={539}
              step={1}
              marks={[
                { value: 0, label: 'Start' },
                { value: 100, label: '100' },
                { value: 200, label: '200' },
                { value: 300, label: '300' },
                { value: 400, label: '400' },
                { value: 539, label: 'End' }
              ]}
              valueLabelDisplay="on"
              sx={{ mt: 2 }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={settings.showAllSpoilers}
                onChange={toggleShowAllSpoilers}
                icon={<EyeOff size={16} />}
                checkedIcon={<Eye size={16} />}
              />
            }
            label={
              <Box>
                <Typography variant="body1">
                  Show All Spoilers
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Override chapter tolerance and show all content
                </Typography>
              </Box>
            }
          />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Current Status:
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              size="small" 
              label={`Reading up to Chapter ${settings.chapterTolerance}`}
              color="primary"
              variant="outlined"
            />
            {settings.showAllSpoilers && (
              <Chip 
                size="small" 
                label="All spoilers visible"
                color="warning"
                variant="filled"
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default SpoilerSettings