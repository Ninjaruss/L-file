'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Skeleton
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { 
  User, 
  BookOpen, 
  Dice6, 
  FileText, 
  Users, 
  Hash, 
  Volume2, 
  Quote 
} from 'lucide-react'
import { 
  fetchEntityData, 
  getEntityTypeLabel, 
  getDefaultDisplayText, 
  getEntityUrl, 
  getEntityThemeColor,
  EntityEmbedData 
} from '../lib/entityEmbedParser'
import MediaThumbnail from './MediaThumbnail'

interface EntityCardProps {
  type: 'character' | 'arc' | 'gamble' | 'guide' | 'organization' | 'chapter' | 'volume' | 'quote'
  id: number
  displayText?: string
  compact?: boolean
  showImage?: boolean
  inline?: boolean
}

const EntityCard: React.FC<EntityCardProps> = ({ 
  type, 
  id, 
  displayText, 
  compact = false,
  showImage = true,
  inline = false
}) => {
  const theme = useTheme()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const entityData = await fetchEntityData(type, id)
        setData(entityData)
        setError(!entityData)
      } catch (err) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [type, id])

  const getEntityIcon = () => {
    const iconProps = { size: compact ? 16 : 20 }
    switch (type) {
      case 'character': return <User {...iconProps} />
      case 'arc': return <BookOpen {...iconProps} />
      case 'gamble': return <Dice6 {...iconProps} />
      case 'guide': return <FileText {...iconProps} />
      case 'organization': return <Users {...iconProps} />
      case 'chapter': return <Hash {...iconProps} />
      case 'volume': return <Volume2 {...iconProps} />
      case 'quote': return <Quote {...iconProps} />
      default: return <Hash {...iconProps} />
    }
  }

  const getEntityColor = () => {
    const themeColor = getEntityThemeColor(type)
    // Try to access the theme color, fallback to primary
    const colorParts = themeColor.split('.')
    let color = theme.palette
    try {
      for (const part of colorParts) {
        color = (color as any)[part]
      }
      return typeof color === 'string' ? color : theme.palette.primary.main
    } catch {
      return theme.palette.primary.main
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, maxWidth: '100%' }}>
          <Skeleton variant="circular" width={compact ? 24 : 32} height={compact ? 24 : 32} sx={{ flexShrink: 0 }} />
          <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="text" width="60%" height={compact ? 20 : 24} />
            {!compact && <Skeleton variant="text" width="40%" height={16} />}
          </Box>
        </Box>
      )
    }

    if (error || !data) {
      return (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, maxWidth: '100%' }}>
          <Avatar 
            sx={{ 
              width: compact ? 24 : 32, 
              height: compact ? 24 : 32,
              bgcolor: 'error.main',
              flexShrink: 0
            }}
          >
            {getEntityIcon()}
          </Avatar>
          <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <Typography 
              component={inline ? "span" : "p"}
              variant={compact ? 'caption' : 'body2'} 
              color="error"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {displayText || `${getEntityTypeLabel(type)} Not Found`}
            </Typography>
            {!compact && (
              <Typography 
                component={inline ? "span" : "p"}
                variant="caption" 
                color="text.secondary"
                sx={{
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                ID: {id}
              </Typography>
            )}
          </Box>
        </Box>
      )
    }

    const finalDisplayText = displayText || getDefaultDisplayText(type, data)
    const entityColor = getEntityColor()

    return (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, maxWidth: '100%' }}>
        {/* Entity Icon/Image */}
        {showImage && (
          <Box component="span" sx={{ position: 'relative', flexShrink: 0 }}>
            {(type === 'character' || type === 'arc' || type === 'volume') ? (
              <Box component="span" sx={{ width: compact ? 24 : 32, height: compact ? 24 : 32, display: 'block' }}>
                <MediaThumbnail
                  entityType={type as 'character' | 'arc' | 'volume'}
                  entityId={id}
                  entityName={finalDisplayText}
                  maxWidth={compact ? 24 : 32}
                  maxHeight={compact ? 24 : 32}
                  inline={inline}
                />
              </Box>
            ) : (
              <Avatar 
                sx={{ 
                  width: compact ? 24 : 32, 
                  height: compact ? 24 : 32,
                  bgcolor: entityColor,
                  color: 'white'
                }}
              >
                {getEntityIcon()}
              </Avatar>
            )}
          </Box>
        )}

        {/* Entity Info */}
        <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Typography 
            component="span"
            variant={compact ? 'caption' : 'body2'} 
            sx={{ 
              fontWeight: 600,
              color: entityColor,
              textDecoration: 'none',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            {finalDisplayText}
          </Typography>
          
          {!compact && (
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                label={getEntityTypeLabel(type)}
                size="small"
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  borderColor: entityColor,
                  color: entityColor,
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
              
              {/* Additional context based on entity type */}
              {type === 'character' && data.organization && (
                <Typography 
                  component={inline ? "span" : "p"}
                  variant="caption" 
                  color="text.secondary"
                >
                  {data.organization}
                </Typography>
              )}
              
              {type === 'arc' && (data.startChapter && data.endChapter) && (
                <Typography 
                  component={inline ? "span" : "p"}
                  variant="caption" 
                  color="text.secondary"
                >
                  Ch. {data.startChapter}-{data.endChapter}
                </Typography>
              )}
              
              {type === 'gamble' && data.chapterNumber && (
                <Typography 
                  component={inline ? "span" : "p"}
                  variant="caption" 
                  color="text.secondary"
                >
                  Ch. {data.chapterNumber}
                </Typography>
              )}
              
              {type === 'chapter' && data.number && (
                <Typography 
                  component={inline ? "span" : "p"}
                  variant="caption" 
                  color="text.secondary"
                >
                  #{data.number}
                </Typography>
              )}
              
              {type === 'volume' && data.number && (
                <Typography 
                  component={inline ? "span" : "p"}
                  variant="caption" 
                  color="text.secondary"
                >
                  Vol. {data.number}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>
    )
  }

  if (compact || inline) {
    return (
      <Box
        component={Link}
        href={getEntityUrl(type, id)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
          border: `1px solid ${getEntityColor()}30`,
          borderRadius: 1,
          padding: '2px 6px',
          background: `linear-gradient(135deg, ${getEntityColor()}08 0%, transparent 100%)`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          maxWidth: '100%',
          '&:hover': {
            borderColor: `${getEntityColor()}60`,
            background: `linear-gradient(135deg, ${getEntityColor()}15 0%, transparent 100%)`,
            transform: 'translateY(-1px)'
          }
        }}
      >
        {renderContent()}
      </Box>
    )
  }

  return (
    <Card
      component={Link}
      href={getEntityUrl(type, id)}
      sx={{
        border: `1px solid ${getEntityColor()}30`,
        background: `linear-gradient(135deg, ${getEntityColor()}08 0%, transparent 100%)`,
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: `${getEntityColor()}60`,
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {renderContent()}
      </CardContent>
    </Card>
  )
}

export default EntityCard
