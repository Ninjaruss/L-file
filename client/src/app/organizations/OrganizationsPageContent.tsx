'use client'

import React, { useState, useEffect } from 'react'
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Card,
  Container,
  Grid,
  Group,
  Loader,
  Pagination,
  Stack,
  Text,
  TextInput,
  Title,
  useMantineTheme
} from '@mantine/core'
import { Search, Shield, Users } from 'lucide-react'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import MediaThumbnail from '../../components/MediaThumbnail'
import { useRouter, useSearchParams } from 'next/navigation'

interface Organization {
  id: number
  name: string
  description?: string
  memberCount?: number
}

interface OrganizationsPageContentProps {
  initialOrganizations: Organization[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialError: string
}

export default function OrganizationsPageContent({
  initialOrganizations,
  initialTotalPages,
  initialTotal,
  initialPage,
  initialSearch,
  initialError
}: OrganizationsPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const theme = useMantineTheme()
  
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)

  const limit = 12

  useEffect(() => {
    if (error) return

    const fetchOrganizations = async () => {
      try {
        setLoading(true)
        const params: any = { page, limit }
        if (searchTerm.trim()) {
          params.name = searchTerm
        }
        
        const response = await api.getOrganizations(params)
        setOrganizations(response.data)
        setTotalPages(response.totalPages)
        setTotal(response.total)
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if different from initial state
    const currentSearch = searchParams.get('search') || ''
    const currentPage = parseInt(searchParams.get('page') || '1', 10)
    
    if (currentSearch !== initialSearch || currentPage !== initialPage) {
      fetchOrganizations()
    }
  }, [page, searchTerm, searchParams, initialSearch, initialPage, error])

  const updateURL = (newSearch: string, newPage: number) => {
    const params = new URLSearchParams()
    if (newSearch) params.set('search', newSearch)
    if (newPage > 1) params.set('page', newPage.toString())
    
    const url = params.toString() ? `/organizations?${params.toString()}` : '/organizations'
    router.push(url)
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setSearchTerm(newSearch)
    setPage(1)
    updateURL(newSearch, 1)
  }

  const handlePageChange = (value: number) => {
    setPage(value)
    updateURL(searchTerm, value)
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert color="red" variant="light">
          {error}
        </Alert>
      </Container>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Stack gap="lg">
        <Box ta="center">
          <Shield size={48} style={{ marginBottom: 16 }} />
          <Title order={2} component="h1">
            Organizations
          </Title>
          <Text size="lg" c="dimmed">
            Explore the various groups and organizations in Usogui
          </Text>
        </Box>

        <TextInput
          size="md"
          leftSection={<Search size={18} />}
          placeholder="Search organizations by name..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </Stack>

      {loading ? (
        <Box style={{ display: 'flex', justifyContent: 'center', paddingBlock: theme.spacing.xl }}>
          <Loader size="lg" />
        </Box>
      ) : (
        <>
          <Text size="sm" c="dimmed" mb="sm">
            {total} organizations found
          </Text>

          <Grid gutter="xl">
            {organizations.map((organization) => (
              <Grid.Col key={organization.id} span={{ base: 12, sm: 6, md: 4 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  style={{ height: '100%' }}
                >
                  <Card
                    shadow="lg"
                    radius="md"
                    withBorder
                    style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                  >
                    <Box style={{ position: 'relative' }}>
                      <MediaThumbnail
                        entityType="organization"
                        entityId={organization.id}
                        entityName={organization.name}
                        maxWidth="100%"
                        maxHeight="200px"
                        allowCycling={false}
                      />
                    </Box>

                    <Stack gap="sm" style={{ flex: 1 }} mt="md">
                      <Group align="center" gap="sm">
                        <Shield size={24} />
                        <Anchor
                          component={Link}
                          href={`/organizations/${organization.id}`}
                          fw={600}
                          size="lg"
                          c={theme.other.usogui.red}
                        >
                          {organization.name}
                        </Anchor>
                      </Group>

                      {organization.description && (
                        <Box
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            flexGrow: 1
                          }}
                        >
                          <EnhancedSpoilerMarkdown
                            content={organization.description}
                            className="organization-description-preview"
                            enableEntityEmbeds
                            compactEntityCards
                          />
                        </Box>
                      )}

                      {organization.memberCount !== undefined && (
                        <Box
                          style={{
                            marginTop: 'auto',
                            paddingTop: theme.spacing.sm,
                            borderTop: `1px solid rgba(255, 255, 255, 0.12)`
                          }}
                        >
                          <Badge
                            variant="outline"
                            color="purple"
                            leftSection={<Users size={14} />}
                          >
                            {organization.memberCount} members
                          </Badge>
                        </Box>
                      )}
                    </Stack>
                  </Card>
                </motion.div>
              </Grid.Col>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box style={{ display: 'flex', justifyContent: 'center', marginTop: theme.spacing.xl }}>
              <Pagination
                total={totalPages}
                value={page}
                onChange={handlePageChange}
                size="lg"
                color="red"
              />
            </Box>
          )}

          {organizations.length === 0 && !loading && (
            <Box ta="center" py="xl">
              <Text size="lg" c="dimmed">
                No organizations found
              </Text>
            </Box>
          )}
        </>
      )}
    </motion.div>
  )
}
