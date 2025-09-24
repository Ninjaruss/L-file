'use client'

import { useState } from 'react'
import { Box, Card, Text, Grid, Badge, Group, Stack, Skeleton, Overlay, useMantineTheme } from '@mantine/core'
import { Users, BookOpen, Dices, FileText, ChevronRight, TrendingUp, Eye } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { textColors, headerColors } from '../lib/mantine-theme'

interface StatsData {
  totalCharacters?: number
  totalArcs?: number
  totalGambles?: number
  totalGuides?: number
}

interface TrendingData {
  characters?: Array<{
    id: number
    name: string
    description?: string
    viewCount: number
  }>
  gambles?: Array<{
    id: number
    name: string
    rules: string
    viewCount: number
  }>
  guides?: Array<{
    id: number
    title: string
    description: string
    viewCount: number
    author: { username: string }
  }>
}

interface EnhancedFeaturesGridProps {
  stats?: StatsData
  trending?: TrendingData
  loading?: boolean
}

export function EnhancedFeaturesGrid({ stats, trending, loading = false }: EnhancedFeaturesGridProps) {
  const theme = useMantineTheme()
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)

  const features = [
    {
      key: 'characters',
      icon: <Users className="w-8 h-8" style={{ color: textColors.character }} />,
      title: 'Characters',
      description: 'Explore detailed profiles of all Usogui characters',
      href: '/characters',
      color: textColors.character,
      count: stats?.totalCharacters,
      preview: trending?.characters?.slice(0, 3)
    },
    {
      key: 'arcs',
      icon: <BookOpen className="w-8 h-8" style={{ color: textColors.arc }} />,
      title: 'Story Arcs',
      description: 'Dive into the major arcs and storylines',
      href: '/arcs',
      color: textColors.arc,
      count: stats?.totalArcs,
      preview: [] // Arcs don't have trending data in the interface
    },
    {
      key: 'gambles',
      icon: <Dices className="w-8 h-8" style={{ color: textColors.gamble }} />,
      title: 'Gambles',
      description: 'Details on every gambling game and competition',
      href: '/gambles',
      color: textColors.gamble,
      count: stats?.totalGambles,
      preview: trending?.gambles?.slice(0, 3)
    },
    {
      key: 'guides',
      icon: <FileText className="w-8 h-8" style={{ color: textColors.guide }} />,
      title: 'Guides',
      description: 'In-depth analysis and insights from the community',
      href: '/guides',
      color: textColors.guide,
      count: stats?.totalGuides,
      preview: trending?.guides?.slice(0, 3)
    }
  ]

  const renderPreviewContent = (feature: typeof features[0]) => {
    if (!feature.preview || feature.preview.length === 0) {
      return (
        <Text size="xs" c="dimmed" style={{ textAlign: 'center', padding: '1rem' }}>
          {feature.count ? `${feature.count.toLocaleString()} total` : 'Browse all'}
        </Text>
      )
    }

    return (
      <Stack gap="xs" style={{ padding: '0.75rem' }}>
        {feature.preview.map((item: any, index) => (
          <Box key={item.id || index} style={{ fontSize: '0.75rem' }}>
            <Text
              size="xs"
              fw={500}
              style={{
                marginBottom: '0.125rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {'title' in item ? item.title : item.name}
            </Text>
            {item.viewCount && (
              <Group gap={4} align="center">
                <Eye className="w-3 h-3" style={{ color: feature.color, opacity: 0.7 }} />
                <Text size="xs" c="dimmed">
                  {item.viewCount.toLocaleString()} views
                </Text>
              </Group>
            )}
          </Box>
        ))}
        {feature.count && (
          <Text size="xs" c="dimmed" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            +{(feature.count - feature.preview.length).toLocaleString()} more
          </Text>
        )}
      </Stack>
    )
  }

  if (loading) {
    return (
      <Grid>
        {[1, 2, 3, 4].map((i) => (
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }} key={i}>
            <Card style={{ height: '300px', padding: '1.5rem' }}>
              <Stack gap="md" align="center">
                <Skeleton height={64} width={64} radius="md" />
                <Skeleton height={24} width="80%" />
                <Skeleton height={40} width="100%" />
                <Skeleton height={60} width="100%" />
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    )
  }

  return (
    <Grid>
      {features.map((feature, index) => (
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }} key={feature.key}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
          >
            <Card
              className="gambling-card"
              style={{
                height: '100%',
                minHeight: '300px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                textDecoration: 'none',
                padding: '1.5rem',
                position: 'relative',
                overflow: 'hidden'
              }}
              component={Link}
              href={feature.href}
              onMouseEnter={() => setHoveredFeature(feature.key)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              {/* Main Content */}
              <Box style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <Box style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    {feature.icon}
                  </Box>
                  <Group justify="space-between" align="flex-start" style={{ marginBottom: '0.5rem' }}>
                    <Text
                      fw={700}
                      size="lg"
                      style={{ color: headerColors.h3 }}
                    >
                      {feature.title}
                    </Text>
                    {feature.count && (
                      <Badge
                        variant="light"
                        size="xs"
                        style={{
                          backgroundColor: `${feature.color}20`,
                          color: feature.color,
                          border: `1px solid ${feature.color}40`
                        }}
                      >
                        {feature.count.toLocaleString()}
                      </Badge>
                    )}
                  </Group>
                  <Text size="sm" c="dimmed" style={{ marginBottom: '1rem' }}>
                    {feature.description}
                  </Text>
                </Box>

                {/* Preview Content */}
                <Box
                  style={{
                    flexGrow: 1,
                    backgroundColor: hoveredFeature === feature.key ?
                      `${feature.color}08` : 'transparent',
                    borderRadius: '0.5rem',
                    border: `1px solid ${hoveredFeature === feature.key ?
                      `${feature.color}30` : 'transparent'}`,
                    transition: 'all 0.3s ease',
                    marginBottom: '1rem'
                  }}
                >
                  {renderPreviewContent(feature)}
                </Box>

                {/* Action Button */}
                <Group justify="center" gap="xs" style={{ marginTop: 'auto' }}>
                  <Text size="sm" style={{ fontWeight: 'bold', color: feature.color }}>
                    Explore
                  </Text>
                  <ChevronRight
                    className="w-4 h-4"
                    style={{
                      color: feature.color,
                      transform: hoveredFeature === feature.key ? 'translateX(4px)' : 'translateX(0)',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                </Group>
              </Box>

              {/* Trending Indicator */}
              {feature.preview && feature.preview.length > 0 && (
                <Box
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    opacity: hoveredFeature === feature.key ? 1 : 0.6,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  <TrendingUp
                    className="w-4 h-4"
                    style={{ color: feature.color }}
                  />
                </Box>
              )}
            </Card>
          </motion.div>
        </Grid.Col>
      ))}
    </Grid>
  )
}