'use client'

import { parseEntityEmbeds } from '../../lib/entityEmbedParser'
import { useState } from 'react'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'
import { Box, TextField, Typography, Paper } from '@mui/material'

export default function EntityEmbedTest() {
  const [testContent, setTestContent] = useState(`
# Entity Embed Test

Here are some test embeds:

Basic format: {{character:1}}
With custom text: {{character:1:Baku Madarame}}
Arc embed: {{arc:1:Introduction Arc}}
Gamble embed: {{gamble:1:First Game}}

Let's test if these render correctly!
  `.trim())

  // Parse the content to see what's being extracted
  const { content: parsedContent, embeds } = parseEntityEmbeds(testContent)

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>Entity Embed Debug Test</Typography>
      
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Left side - Input */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>Input Content:</Typography>
          <TextField
            multiline
            fullWidth
            rows={10}
            value={testContent}
            onChange={(e) => setTestContent(e.target.value)}
            variant="outlined"
          />
          
          <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>Parsed Embeds:</Typography>
          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(embeds, null, 2)}
            </pre>
          </Paper>
          
          <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>Processed Content:</Typography>
          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {parsedContent}
            </pre>
          </Paper>
        </Box>
        
        {/* Right side - Preview */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>Rendered Preview:</Typography>
          <Paper sx={{ p: 2, border: '1px solid #ddd', minHeight: '400px' }}>
            <EnhancedSpoilerMarkdown 
              content={testContent}
              compactEntityCards={false}
            />
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}
