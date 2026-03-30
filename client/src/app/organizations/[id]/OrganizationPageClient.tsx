'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Card,
  Container,
  Group,
  Stack,
  Tabs,
  Text,
  useMantineTheme
} from '@mantine/core'
import {
  getEntityThemeColor,
  textColors,
  setTabAccentColors,
  backgroundStyles,
} from '../../../lib/mantine-theme'
import { Users, Shield, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import { pageEnter } from '../../../lib/motion-presets'
import MediaGallery from '../../../components/MediaGallery'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import { DetailPageHeader } from '../../../components/layouts/DetailPageHeader'
import { RelatedContentSection } from '../../../components/layouts/RelatedContentSection'
import { CinematicCard, CinematicSectionHeader } from '../../../components/layouts/CinematicCard'
import { usePageView } from '../../../hooks/usePageView'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import OrganizationMembers from '../../../components/OrganizationMembers'

interface Organization {
  id: number
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  characters?: Array<{
    id: number
    name: string
    alternateNames?: string[]
    firstAppearanceChapter?: number
  }>
}

interface OrganizationPageClientProps {
  initialOrganization: Organization
  initialMembers: any[]
  initialEvents: any[]
  initialGambles: any[]
}

export default function OrganizationPageClient({
  initialOrganization,
  initialMembers,
  initialEvents: _initialEvents,
  initialGambles
}: OrganizationPageClientProps) {
  const theme = useMantineTheme()
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  usePageView('organization', initialOrganization.id.toString(), true)

  // Set tab accent colors for organization entity
  useEffect(() => {
    setTabAccentColors('organization')
  }, [])

  if (!isClient) {
    return <Box py="md" c={textColors.primary}>Loading...</Box>
  }

  // Use consistent theme colors
  const entityColors = {
    organization: getEntityThemeColor(theme, 'organization'),
    character: getEntityThemeColor(theme, 'character'),
    gamble: getEntityThemeColor(theme, 'gamble'),
    media: getEntityThemeColor(theme, 'media')
  }

  return (
    <Box style={{
      backgroundColor: backgroundStyles.page(theme),
      minHeight: '100vh',
      color: textColors.primary
    }}>
    <Container size="lg" py="md" style={{ backgroundColor: backgroundStyles.container(theme) }}>
    <Stack gap={theme.spacing.md}>
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav
        items={createEntityBreadcrumbs('organization', initialOrganization.name)}
        entityType="organization"
      />

      {/* Enhanced Organization Header */}
      <DetailPageHeader
        entityType="organization"
        entityId={initialOrganization.id}
        entityName={initialOrganization.name}
        stats={[
          { value: initialMembers?.length ?? 0, label: 'Members' },
          { value: initialGambles?.length ?? 0, label: 'Gambles' },
        ]}
      />

      <motion.div {...pageEnter}>
        <Card withBorder radius="lg" className="gambling-card" shadow="xl" style={{ background: backgroundStyles.card, border: `1px solid ${entityColors.organization}22` }}>
        <Tabs
          value={activeTab}
          onChange={(value) => value && setActiveTab(value)}
          keepMounted={false}
          variant="pills"
          className="organization-tabs"
        >
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<Shield size={16} />}>Overview</Tabs.Tab>
            <Tabs.Tab value="members" leftSection={<Users size={16} />}>
              Members
            </Tabs.Tab>
            <Tabs.Tab value="media" leftSection={<ImageIcon size={16} />}>Media</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt={theme.spacing.md}>
            <Box
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 260px',
                gap: 12,
                alignItems: 'start',
              }}
              className="detail-editorial-grid"
            >
              {/* Main column */}
              <Stack gap={theme.spacing.md}>
                {/* Organization Description Section */}
                <CinematicCard entityColor={entityColors.organization}>
                  <CinematicSectionHeader label="Organization Overview" entityColor={entityColors.organization} />
                  {initialOrganization.description ? (
                    <TimelineSpoilerWrapper chapterNumber={1}>
                      <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
                        <EnhancedSpoilerMarkdown content={initialOrganization.description} enableEntityEmbeds compactEntityCards={false} />
                      </Box>
                    </TimelineSpoilerWrapper>
                  ) : (
                    <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.xl }}>
                      No description available for this organization yet. Check back later for updates!
                    </Text>
                  )}
                </CinematicCard>
              </Stack>

              {/* Aside column */}
              <Stack gap={theme.spacing.sm}>
                {/* Details card */}
                <CinematicCard entityColor={entityColors.organization} padding="md">
                  <CinematicSectionHeader label="Details" entityColor={entityColors.organization} />
                  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.organization}14` }}>
                    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.organization, flexShrink: 0 }} />
                    <Text style={{ fontSize: 11, color: `${entityColors.organization}66`, flex: 1 }}>Members</Text>
                    <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>{initialMembers?.length ?? 0}</Text>
                  </Box>
                  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.organization, flexShrink: 0 }} />
                    <Text style={{ fontSize: 11, color: `${entityColors.organization}66`, flex: 1 }}>Gambles</Text>
                    <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.gamble }}>{initialGambles?.length ?? 0}</Text>
                  </Box>
                </CinematicCard>

                {/* Members compact list */}
                <RelatedContentSection
                  entityType="character"
                  title="Members"
                  items={initialMembers ?? []}
                  previewCount={4}
                  getKey={(m) => m.id}
                  variant="compact"
                  getLabel={(m) => m.name}
                  getHref={(m) => `/characters/${m.id}`}
                  itemDotColor={entityColors.character}
                />

                {/* Gambles compact list */}
                <RelatedContentSection
                  entityType="gamble"
                  title="Gambles"
                  items={initialGambles ?? []}
                  previewCount={4}
                  getKey={(g) => g.id}
                  variant="compact"
                  getLabel={(g) => g.name}
                  getHref={(g) => `/gambles/${g.id}`}
                  itemDotColor={entityColors.gamble}
                />
              </Stack>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="members" pt={theme.spacing.md}>
            <OrganizationMembers organizationId={initialOrganization.id} />
          </Tabs.Panel>

          <Tabs.Panel value="media" pt={theme.spacing.md}>
            <Stack gap="md">
              <CinematicCard entityColor={entityColors.media} padding="md">
                <Group justify="space-between" align="center" mb={14}>
                  <Box style={{ fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', borderRadius: 4, padding: '3px 8px', background: `${entityColors.media}18`, border: `1px solid ${entityColors.media}30`, color: entityColors.media }}>
                    Media Gallery
                  </Box>
                  <Box component={Link} href={`/media?ownerType=organization&ownerId=${initialOrganization.id}`} style={{ fontSize: 11, color: `${entityColors.media}88`, textDecoration: 'none' }}>
                    View All →
                  </Box>
                </Group>
                <MediaGallery ownerType="organization" ownerId={initialOrganization.id} purpose="gallery" limit={8} showTitle={false} compactMode showFilters={false} />
              </CinematicCard>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Card>
    </motion.div>
    </Stack>
    </Container>
    </Box>
  )
}
