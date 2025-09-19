'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  FileInput,
  Image as MantineImage,
  LoadingOverlay,
  Paper,
  Modal,
  Pagination,
  Text,
  TextInput,
  SimpleGrid,
  Title,
  Group,
  useMantineTheme
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { AlertCircle, Camera, User, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { useAuth } from '../../providers/AuthProvider'
import { Search } from 'lucide-react'
import { api } from '../../lib/api'

interface Character {
  id: number
  name: string
  alias?: string
  alternateNames: string[] | null
  description: string
  firstAppearanceChapter: number
  imageFileName?: string
  imageDisplayName?: string
  tags?: string[]
}

interface CharactersPageContentProps {
  initialCharacters?: Character[]
  initialTotalPages?: number
  initialTotal?: number
  initialSearch?: string
  initialError?: string
}

const PAGE_SIZE = 12

export default function CharactersPageContent({
  initialCharacters = [],
  initialTotalPages = 1,
  initialTotal = 0,
  initialSearch = '',
  initialError = ''
}: CharactersPageContentProps) {
  const theme = useMantineTheme()
  const accentCharacter = 'character' // Use string key for theme colors
  const [characters, setCharacters] = useState<Character[]>(initialCharacters)
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const currentSearch = searchParams.get('search') || ''

  const [totalPages, setTotalPages] = useState<number>(initialTotalPages)
  const [total, setTotal] = useState<number>(initialTotal)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const [searchQuery, setSearchQuery] = useState(currentSearch || initialSearch)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageDisplayName, setImageDisplayName] = useState('')
  const { isModeratorOrAdmin } = useAuth()

  // Get character colors from theme with fallback
  const characterColors = theme.colors.character || theme.other?.usogui?.character || ['#eff6ff', '#1976d2']
  const primaryCharacterColor = characterColors[1] || theme.colors.red[6]
  const secondaryCharacterColor = characterColors[0] || theme.colors.dark[7]
  const withAlpha = useCallback((inputColor: string, alpha: number) => {
    if (!inputColor) return `rgba(0, 0, 0, ${alpha})`

    const normalizeHex = (hex: string) => {
      const stripped = hex.replace('#', '')
      if (stripped.length === 3) {
        return stripped
          .split('')
          .map((char) => char + char)
          .join('')
      }
      return stripped
    }

    if (inputColor.startsWith('#')) {
      const hex = normalizeHex(inputColor)
      if (hex.length !== 6) return inputColor
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    if (inputColor.startsWith('rgba(')) {
      const values = inputColor
        .slice(5, -1)
        .split(',')
        .map((value) => value.trim())

      if (values.length >= 3) {
        const [r, g, b] = values
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
    }

    if (inputColor.startsWith('rgb(')) {
      const values = inputColor
        .slice(4, -1)
        .split(',')
        .map((value) => value.trim())

      if (values.length >= 3) {
        const [r, g, b] = values
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
    }

    return inputColor
  }, [])

  const cardBorderColor = withAlpha(primaryCharacterColor, 0.4)
  const cardHoverBorderColor = withAlpha(primaryCharacterColor, 0.75)
  const cardBackgroundColor = withAlpha('#0f172a', 0.6)
  const numberFormatter = useMemo(() => new Intl.NumberFormat(), [])
  const hasSearchQuery = searchQuery.trim().length > 0
  const featuredCharacter = characters.length > 0 ? characters[0] : null
  const firstIndexOnPage = useMemo(() => {
    if (!total || total <= 0) return 0
    return (currentPage - 1) * PAGE_SIZE + 1
  }, [total, currentPage])

  const lastIndexOnPage = useMemo(() => {
    if (!total || total <= 0) return 0
    return Math.min(currentPage * PAGE_SIZE, total)
  }, [total, currentPage])

  const summaryStats = useMemo(
    () => [
      {
        label: 'Characters cataloged',
        value: total > 0 ? numberFormatter.format(total) : '—',
        hint: total > 0 ? 'Across every documented encounter' : 'Roster syncing'
      },
      {
        label: 'On this page',
        value: characters.length > 0 ? numberFormatter.format(characters.length) : '—',
        hint:
          total > 0 && characters.length > 0
            ? `${numberFormatter.format(firstIndexOnPage)}–${numberFormatter.format(lastIndexOnPage)} of ${numberFormatter.format(total)}`
            : hasSearchQuery
              ? 'Adjust your search or filters to reveal more.'
              : 'Waiting for characters to display.'
      },
      {
        label: 'Page',
        value: `${Math.max(currentPage, 1)} / ${Math.max(totalPages, 1)}`,
        hint: hasSearchQuery ? 'Currently filtered by your search query.' : 'Exploring the full roster.'
      }
    ],
    [
      characters.length,
      currentPage,
      firstIndexOnPage,
      hasSearchQuery,
      lastIndexOnPage,
      numberFormatter,
      total,
      totalPages
    ]
  )

  const featuredCharacterTags = useMemo(() => {
    if (!featuredCharacter?.tags) return []
    return featuredCharacter.tags.slice(0, 3)
  }, [featuredCharacter])

  const hasAdditionalFeaturedTags =
    (featuredCharacter?.tags?.length ?? 0) > featuredCharacterTags.length

  const extraFeaturedTags = hasAdditionalFeaturedTags
    ? (featuredCharacter?.tags?.length ?? 0) - featuredCharacterTags.length
    : 0

  const fetchCharacters = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: PAGE_SIZE.toString(),
        ...(searchQuery && { name: searchQuery })
      })

      const response = await api.get(`/characters?${params}`)
      const data = await response.json()

      setCharacters(data.characters || [])
      setTotal(data.total || 0)
      setTotalPages(Math.ceil((data.total || 0) / PAGE_SIZE))
    } catch (error) {
      console.error('Error fetching characters:', error)
      setError('Failed to load characters. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery])

  useEffect(() => {
    if (searchQuery !== currentSearch || characters.length === 0) {
      fetchCharacters()
    }
  }, [currentPage, searchQuery, currentSearch, characters.length, fetchCharacters])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.currentTarget.value
    setSearchQuery(newSearch)

    const params = new URLSearchParams()
    if (newSearch) params.set('search', newSearch)
    params.set('page', '1') // Reset to first page on new search

    router.push(`/characters?${params.toString()}`)
  }, [router])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')

    const params = new URLSearchParams()
    params.set('page', '1')

    router.push(`/characters?${params.toString()}`)
  }, [router])

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    params.set('page', page.toString())

    router.push(`/characters?${params.toString()}`)
  }, [router, searchQuery])

  const handleEditImage = (character: Character) => {
    setSelectedCharacter(character)
    setImageDisplayName(character.imageDisplayName || '')
    setImageDialogOpen(true)
  }

  const handleUploadImage = async () => {
    if (!selectedFile || !selectedCharacter) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('entityType', 'character')
      formData.append('entityId', selectedCharacter.id.toString())
      if (imageDisplayName) {
        formData.append('displayName', imageDisplayName)
      }

      const response = await api.post('/media', formData)

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      notifications.show({
        title: 'Success',
        message: 'Image uploaded successfully',
        color: 'green'
      })

      // Close dialog and refresh
      handleCloseImageDialog()
      fetchCharacters()
    } catch (error) {
      console.error('Upload error:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to upload image',
        color: 'red'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!selectedCharacter?.imageFileName) return

    setUploading(true)
    try {
      const response = await api.delete(`/media/character/${selectedCharacter.imageFileName}`)
      if (!response.ok) {
        throw new Error('Failed to remove image')
      }

      notifications.show({
        title: 'Success',
        message: 'Image removed successfully',
        color: 'green'
      })

      handleCloseImageDialog()
      fetchCharacters()
    } catch (error) {
      console.error('Error removing image:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to remove image',
        color: 'red'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleCloseImageDialog = () => {
    setSelectedCharacter(null)
    setSelectedFile(null)
    setImageDisplayName('')
    setImageDialogOpen(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${withAlpha(secondaryCharacterColor, 0.65)} 0%, ${withAlpha(primaryCharacterColor, 0.55)} 100%)`
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.22) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />
      <div className="container relative z-10 mx-auto px-4 py-16">
        <section
          className="relative overflow-hidden rounded-3xl border border-white/10 px-6 py-10 shadow-2xl backdrop-blur-md lg:px-12"
          style={{
            background: `linear-gradient(120deg, ${withAlpha(secondaryCharacterColor, 0.55)} 0%, ${withAlpha(primaryCharacterColor, 0.45)} 100%)`
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.32),transparent_55%)] opacity-70" />
          <div className="relative grid items-start gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="space-y-6 text-left">
              <Title order={1} className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">
                Characters
              </Title>
              <Text size="lg" c="gray.1" className="max-w-2xl">
                Explore the rich cast of Usogui characters, from cunning gamblers to mysterious adversaries.
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                {summaryStats.map((stat) => (
                  <Paper
                    key={stat.label}
                    radius="lg"
                    p="md"
                    className="border border-white/15 bg-black/35 backdrop-blur-sm"
                  >
                    <Text size="xs" c="gray.4" tt="uppercase" fw={600} mb={6}>
                      {stat.label}
                    </Text>
                    <Text size="xl" fw={600} c="white">
                      {stat.value}
                    </Text>
                    <Text size="xs" c="gray.3" mt={8}>
                      {stat.hint}
                    </Text>
                  </Paper>
                ))}
              </SimpleGrid>
            </div>
            {featuredCharacter && (
              <Card
                radius="xl"
                padding="lg"
                className="group border border-white/20 bg-black/45 backdrop-blur-md shadow-xl"
              >
                <Card.Section className="relative overflow-hidden rounded-2xl">
                  <div className="relative h-60 w-full">
                    {featuredCharacter.imageFileName ? (
                      <MantineImage
                        src={`https://f005.backblazeb2.com/file/usogui-media/${featuredCharacter.imageFileName}`}
                        alt={featuredCharacter.imageDisplayName || featuredCharacter.name}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-black/60">
                        <User size={72} color={withAlpha('#f8fafc', 0.8)} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <Badge
                      variant="filled"
                      color={accentCharacter}
                      className="absolute left-4 top-4"
                    >
                      First appearance – Chapter {featuredCharacter.firstAppearanceChapter}
                    </Badge>
                  </div>
                </Card.Section>
                <div className="mt-5 space-y-3">
                  <div>
                    <Text fw={600} size="lg" c="white">
                      {featuredCharacter.name}
                    </Text>
                    {featuredCharacter.alias && (
                      <Text size="sm" c="gray.3" className="italic">
                        &ldquo;{featuredCharacter.alias}&rdquo;
                      </Text>
                    )}
                  </div>
                  {featuredCharacter.description && (
                    <Text size="sm" c="gray.3" lineClamp={3}>
                      {featuredCharacter.description}
                    </Text>
                  )}
                  {featuredCharacterTags.length > 0 && (
                    <Group gap="xs" className="flex-wrap">
                      {featuredCharacterTags.map((tag) => (
                        <Badge key={tag} variant="outline" color="gray" radius="sm">
                          {tag}
                        </Badge>
                      ))}
                      {hasAdditionalFeaturedTags && extraFeaturedTags > 0 && (
                        <Badge variant="outline" color="gray" radius="sm">
                          +{extraFeaturedTags}
                        </Badge>
                      )}
                    </Group>
                  )}
                  <Button
                    component={Link}
                    href={`/characters/${featuredCharacter.id}`}
                    variant="gradient"
                    gradient={{ from: primaryCharacterColor, to: cardHoverBorderColor }}
                    size="sm"
                    radius="md"
                    className="mt-2 self-start"
                  >
                    View profile
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </section>

        <Paper
          radius="xl"
          p="md"
          className="mt-10 border border-white/10 bg-black/45 backdrop-blur-md"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-lg">
              <TextInput
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search characters by name, alias, or tag..."
                leftSection={<Search size={16} />}
                rightSection={
                  hasSearchQuery ? (
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="gray"
                      aria-label="Clear search"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={handleClearSearch}
                    >
                      <X size={14} />
                    </ActionIcon>
                  ) : undefined
                }
                rightSectionPointerEvents={hasSearchQuery ? 'auto' : undefined}
                radius="md"
                size="md"
              />
            </div>
            <Group gap="xs" className="flex-wrap justify-start md:justify-end">
              <Badge variant="light" color={accentCharacter}>
                {total > 0 ? `${numberFormatter.format(total)} total` : 'No characters yet'}
              </Badge>
              {hasSearchQuery && (
                <Badge variant="outline" color="gray">
                  Searching for &ldquo;{searchQuery}&rdquo;
                </Badge>
              )}
            </Group>
          </div>
        </Paper>

        {error && (
          <Alert
            icon={<AlertCircle size={16} />}
            title="Error"
            color="red"
            className="mt-8"
          >
            {error}
          </Alert>
        )}

        <div className="relative mt-12">
          <LoadingOverlay visible={loading} overlayProps={{ radius: 'sm', blur: 2 }} />
          {characters.length === 0 && !loading ? (
            <div className="rounded-3xl border border-dashed border-white/20 bg-black/30 py-16 text-center backdrop-blur-sm">
              <Text size="lg" c="dimmed">
                {hasSearchQuery ? 'No characters found matching your search.' : 'No characters available yet.'}
              </Text>
              {hasSearchQuery && (
                <Text size="sm" c="dimmed" mt={8}>
                  Try clearing the search or exploring a different keyword.
                </Text>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {characters.map((character) => {
                  const visibleTags = (character.tags ?? []).slice(0, 3)
                  const extraTagsCount =
                    (character.tags?.length ?? 0) > visibleTags.length
                      ? (character.tags?.length ?? 0) - visibleTags.length
                      : 0

                  return (
                    <motion.div
                      key={character.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="group h-full"
                    >
                      <Card
                        shadow="sm"
                        padding="lg"
                        radius="lg"
                        withBorder
                        component={Link}
                        href={`/characters/${character.id}`}
                        className="flex h-full flex-col overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                        style={{
                          borderColor: cardBorderColor,
                          background: cardBackgroundColor,
                          boxShadow: `0 20px 40px -25px ${withAlpha(primaryCharacterColor, 0.55)}`
                        }}
                      >
                        <Card.Section className="relative overflow-hidden rounded-xl">
                          <div className="relative h-52 w-full">
                            {character.imageFileName ? (
                              <MantineImage
                                src={`https://f005.backblazeb2.com/file/usogui-media/${character.imageFileName}`}
                                alt={character.imageDisplayName || character.name}
                                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-black/60">
                                <User size={64} color={withAlpha('#f8fafc', 0.85)} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-95" />
                            <Badge
                              variant="filled"
                              color={accentCharacter}
                              className="absolute left-3 top-3"
                            >
                              Chapter {character.firstAppearanceChapter}
                            </Badge>
                            {isModeratorOrAdmin && (
                              <ActionIcon
                                size="lg"
                                radius="md"
                                variant="filled"
                                color={accentCharacter}
                                className="absolute right-3 top-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleEditImage(character)
                                }}
                              >
                                <Camera size={16} />
                              </ActionIcon>
                            )}
                          </div>
                        </Card.Section>
                        <div className="mt-5 flex flex-1 flex-col space-y-3">
                          <div className="flex flex-col gap-1">
                            <Text fw={600} size="lg" c="white">
                              {character.name}
                            </Text>
                            {character.alias && (
                              <Text size="sm" c="gray.4" className="italic">
                                &ldquo;{character.alias}&rdquo;
                              </Text>
                            )}
                          </div>
                          {character.description && (
                            <Text size="sm" c="gray.3" lineClamp={3}>
                              {character.description}
                            </Text>
                          )}
                          {visibleTags.length > 0 && (
                            <Group gap="xs" className="flex flex-wrap">
                              {visibleTags.map((tag) => (
                                <Badge key={tag} variant="outline" color="gray" radius="sm">
                                  {tag}
                                </Badge>
                              ))}
                              {extraTagsCount > 0 && (
                                <Badge variant="outline" color="gray" radius="sm">
                                  +{extraTagsCount}
                                </Badge>
                              )}
                            </Group>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
              {totalPages > 1 && (
                <div className="mt-10 flex justify-center">
                  <Pagination
                    total={totalPages}
                    value={currentPage}
                    onChange={handlePageChange}
                    size="md"
                    color={accentCharacter}
                    radius="md"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Image Upload Modal */}
        <Modal
          opened={imageDialogOpen}
          onClose={handleCloseImageDialog}
          title="Edit Character Image"
          size="md"
        >
          <div className="space-y-4">
            {selectedCharacter && (
              <>
                <Text size="lg" fw={500}>
                  {selectedCharacter.name}
                </Text>

                <TextInput
                  label="Display Name (optional)"
                  value={imageDisplayName}
                  onChange={(e) => setImageDisplayName(e.currentTarget.value)}
                  placeholder="Enter display name for the image"
                />

                <div>
                  <Text size="sm" mb={8}>Select Image File:</Text>
                  <FileInput
                    placeholder="Choose image file"
                    accept="image/*"
                    onChange={(file) => setSelectedFile(file)}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleUploadImage}
                    disabled={!selectedFile || uploading}
                    loading={uploading}
                    color={accentCharacter}
                    flex={1}
                  >
                    Upload
                  </Button>

                  {selectedCharacter.imageFileName && (
                    <Button
                      onClick={handleRemoveImage}
                      disabled={uploading}
                      loading={uploading}
                      color="red"
                      variant="outline"
                      flex={1}
                    >
                      Remove Current
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </Modal>

      </div>
    </motion.div>
  )
}
