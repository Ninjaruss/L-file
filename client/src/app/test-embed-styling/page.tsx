'use client'

import { Box, Typography, Paper } from '@mui/material'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'

export default function EntityEmbedStylingTest() {
  const testContent = `
# Entity Embed Styling Test

Testing various entity embeds to ensure proper styling:

## Basic Embeds
Here's a character embed: {{character:1}}

Here's an arc embed: {{arc:1}}

Here's a gamble embed: {{gamble:1}}

## Custom Text Embeds
Here's a character with custom text: {{character:1:The Protagonist}}

Here's an arc with custom text: {{arc:1:The Beginning}}

## Multiple Embeds in One Line
Characters: {{character:1}} and {{character:2}} appear in {{arc:1:Introduction Arc}}.

## Embeds that might not have thumbnails
Testing volume embed: {{volume:1}}

Testing chapter embed: {{chapter:1}}

## Compact View
Testing with compact entity cards:
  `

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>Entity Embed Styling Test</Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Regular Entity Cards:</Typography>
        <Paper sx={{ p: 3, border: '1px solid #ddd' }}>
          <EnhancedSpoilerMarkdown 
            content={testContent}
            compactEntityCards={false}
          />
        </Paper>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Compact Entity Cards:</Typography>
        <Paper sx={{ p: 3, border: '1px solid #ddd' }}>
          <EnhancedSpoilerMarkdown 
            content={testContent}
            compactEntityCards={true}
          />
        </Paper>
      </Box>
    </Box>
  )
}
