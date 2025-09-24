'use client'

import { Box, Container, Title, Text, Button, Badge, Group } from '@mantine/core'
import { useMantineTheme } from '@mantine/core'
import { Users, BookOpen, Dices, CalendarSearch, Book, Shield, FileText, Quote, ChevronRight, Sparkles, MessageCircle, ExternalLink, Image } from 'lucide-react'
import Link from 'next/link'
import { EnhancedSearchBar } from '../components/EnhancedSearchBar'
import { VolumeCoverSection } from '../components/VolumeCoverSection'
import { FavoritesSection } from '../components/FavoritesSection'
import { LazySection } from '../components/LazySection'
import { useLandingData } from '../hooks/useLandingData'
import { motion } from 'motion/react'
import Script from 'next/script'
import { FAQ } from '@/components/FAQ'
import { textColors } from '../lib/mantine-theme'

export default function HomePage() {
  const theme = useMantineTheme()
  const { data: landingData, loading: landingLoading, error: landingError } = useLandingData()



  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "L-File - Usogui Database",
    "alternateName": "L-File",
    "url": "https://l-file.com",
    "description": "The complete fan-made database for Usogui (Lie Eater) manga. Explore characters, story arcs, gambling mechanics, guides, and community content.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://l-file.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "mainEntity": {
      "@type": "CreativeWork",
      "@id": "https://l-file.com",
      "name": "Usogui Database",
      "description": "Comprehensive database for the Usogui manga series",
      "genre": ["Manga", "Database", "Fan Resource"],
      "about": {
        "@type": "ComicSeries",
        "name": "Usogui",
        "alternateName": "Lie Eater",
        "creator": {
          "@type": "Person",
          "name": "Sako Toshio"
        }
      }
    }
  }

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Container
        size="lg"
        style={{
          paddingTop: 'clamp(1rem, 3vw, 1.5rem)',
          paddingBottom: '2rem',
          paddingLeft: 'clamp(1rem, 4vw, 2rem)',
          paddingRight: 'clamp(1rem, 4vw, 2rem)'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
        {/* Hero Section */}
        <Box style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <Title
            order={1}
            style={{
              fontWeight: 'bold',
              background: `linear-gradient(45deg, ${textColors.character}, ${textColors.arc})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              marginBottom: '1rem'
            }}
          >
            Welcome to the L-File
          </Title>
          <Text size="xl" c="dimmed" style={{ marginBottom: '2rem' }}>
            The ultimate database for the gambling manga masterpiece - Usogui (Lie Eater)
          </Text>

          <Box style={{ maxWidth: 600, margin: '0 auto 2.5rem auto' }}>
            <EnhancedSearchBar trendingData={landingData?.trending} />
          </Box>

        </Box>

        {/* Featured Volume Covers Section */}
        <LazySection minHeight={450} delay={100}>
          <VolumeCoverSection />
        </LazySection>


        {/* Community Favorites Section */}
        <LazySection minHeight={400} delay={200}>
          <FavoritesSection />
        </LazySection>


        <LazySection minHeight={300} delay={400}>
          <FAQ />
        </LazySection>

        {/* Discord CTA Section */}
        <Box style={{ marginBottom: '2rem' }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          <Box
            style={{
              textAlign: 'center',
              padding: 'clamp(1.5rem, 4vw, 2.5rem)',
              background: `linear-gradient(135deg, #5865F2 0%, #4752C4 50%, #3C45A5 100%)`,
              borderRadius: '1rem',
              border: `2px solid rgba(255, 255, 255, 0.1)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Group justify="center" gap="md" style={{ marginBottom: '1rem' }}>
              <MessageCircle className="w-8 h-8" />
              <Title order={2} style={{ fontWeight: 'bold', color: '#ffffff' }}>
                Join Our Discord Community
              </Title>
            </Group>
            <Text size="xl" style={{ opacity: 0.9, marginBottom: '2rem', fontWeight: 'normal' }} c="#ffffff">
              Connect with fellow Usogui fans, discuss theories, share insights, and stay updated on the latest content
            </Text>

            {/* Database Stats */}
            {landingData?.stats && (
              <Box style={{ marginBottom: '2rem' }}>
                <Text size="lg" fw={600} style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#ffffff' }}>
                  Discover Rich Content & Community Insights
                </Text>
                <Group justify="center" gap="lg" style={{ flexWrap: 'wrap' }}>
                  {landingData.stats.totalGuides && (
                    <Badge
                      size="xl"
                      variant="filled"
                      style={{
                        backgroundColor: 'rgba(255, 217, 61, 0.2)',
                        border: '2px solid #FFD93D',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        minWidth: '140px',
                        height: 'auto'
                      }}
                    >
                      <Box style={{ textAlign: 'center' }}>
                        <Text size="xl" fw={700} style={{ color: '#FFD93D', marginBottom: '0.25rem', display: 'block' }}>
                          {landingData.stats.totalGuides.toLocaleString()}
                        </Text>
                        <Group justify="center" gap="xs" style={{ marginTop: '0.25rem' }}>
                          <FileText size={16} style={{ color: '#FFD93D' }} />
                          <Text size="sm" fw={600} style={{ color: '#FFD93D' }}>
                            Guides
                          </Text>
                        </Group>
                      </Box>
                    </Badge>
                  )}
                  {landingData.stats.totalEvents && (
                    <Badge
                      size="xl"
                      variant="filled"
                      style={{
                        backgroundColor: 'rgba(255, 107, 107, 0.2)',
                        border: '2px solid #FF6B6B',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        minWidth: '140px',
                        height: 'auto'
                      }}
                    >
                      <Box style={{ textAlign: 'center' }}>
                        <Text size="xl" fw={700} style={{ color: '#FF6B6B', marginBottom: '0.25rem', display: 'block' }}>
                          {landingData.stats.totalEvents.toLocaleString()}
                        </Text>
                        <Group justify="center" gap="xs" style={{ marginTop: '0.25rem' }}>
                          <CalendarSearch size={16} style={{ color: '#FF6B6B' }} />
                          <Text size="sm" fw={600} style={{ color: '#FF6B6B' }}>
                            Events
                          </Text>
                        </Group>
                      </Box>
                    </Badge>
                  )}
                  {landingData.stats.totalMedia && (
                    <Badge
                      size="xl"
                      variant="filled"
                      style={{
                        backgroundColor: 'rgba(78, 205, 196, 0.2)',
                        border: '2px solid #4ECDC4',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        minWidth: '140px',
                        height: 'auto'
                      }}
                    >
                      <Box style={{ textAlign: 'center' }}>
                        <Text size="xl" fw={700} style={{ color: '#4ECDC4', marginBottom: '0.25rem', display: 'block' }}>
                          {landingData.stats.totalMedia.toLocaleString()}
                        </Text>
                        <Group justify="center" gap="xs" style={{ marginTop: '0.25rem' }}>
                          <Image size={16} style={{ color: '#4ECDC4' }} />
                          <Text size="sm" fw={600} style={{ color: '#4ECDC4' }}>
                            Media
                          </Text>
                        </Group>
                      </Box>
                    </Badge>
                  )}
                  {landingData.stats.totalUsers && (
                    <Badge
                      size="xl"
                      variant="filled"
                      style={{
                        backgroundColor: 'rgba(168, 230, 207, 0.2)',
                        border: '2px solid #A8E6CF',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        minWidth: '140px',
                        height: 'auto'
                      }}
                    >
                      <Box style={{ textAlign: 'center' }}>
                        <Text size="xl" fw={700} style={{ color: '#A8E6CF', marginBottom: '0.25rem', display: 'block' }}>
                          {landingData.stats.totalUsers.toLocaleString()}
                        </Text>
                        <Group justify="center" gap="xs" style={{ marginTop: '0.25rem' }}>
                          <Shield size={16} style={{ color: '#A8E6CF' }} />
                          <Text size="sm" fw={600} style={{ color: '#A8E6CF' }}>
                            Members
                          </Text>
                        </Group>
                      </Box>
                    </Badge>
                  )}
                </Group>
              </Box>
            )}

            <Button
              component="a"
              href="https://discord.gg/JXeRhV2qpY"
              target="_blank"
              rel="noopener noreferrer"
              variant="filled"
              size="lg"
              leftSection={<MessageCircle className="w-5 h-5" />}
              rightSection={<ExternalLink className="w-4 h-4" />}
              style={{
                backgroundColor: 'white',
                color: '#5865F2',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              Join Discord Server
            </Button>
          </Box>
        </motion.div>
      </motion.div>
    </Container>
    </>
  )
}