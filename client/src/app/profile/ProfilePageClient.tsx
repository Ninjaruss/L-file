'use client'

import React, { useState, useEffect } from 'react'
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Loader,
  Modal,
  Progress,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
  useMantineTheme,
  ActionIcon,
  rem,
  Center
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  User,
  Crown,
  BookOpen,
  Edit,
  Save,
  Upload,
  X,
  Camera,
  Settings,
  Heart,
  Quote,
  Dice6,
  Eye,
  Calendar,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { useAuth } from '../../providers/AuthProvider'
import { useProgress } from '../../providers/ProgressProvider'
import { useSpoilerSettings } from '../../hooks/useSpoilerSettings'
import { api } from '../../lib/api'
import { GuideStatus } from '../../types'
import UserProfileImage from '../../components/UserProfileImage'
import GambleChip from '../../components/GambleChip'
import QuoteSelectionPopup from '../../components/QuoteSelectionPopup'
import GambleSelectionPopup from '../../components/GambleSelectionPopup'
import UserBadges from '../../components/UserBadges'
import CustomRoleEditor from '../../components/CustomRoleEditor'
import CustomRoleDisplay from '../../components/CustomRoleDisplay'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'
import MediaGallery from '../../components/MediaGallery'
import SpoilerSettings from '../../components/SpoilerSettings'

interface UserGuide {
  id: number
  title: string
  description?: string
  status: GuideStatus
  createdAt: string
  updatedAt: string
  readingProgress?: number
}

interface UserSubmission {
  id: number
  type: 'guide' | 'media'
  title: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export default function ProfilePageClient() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { progress } = useProgress()
  const { spoilerSettings, updateSpoilerSettings } = useSpoilerSettings()
  const theme = useMantineTheme()

  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    bio: '',
    favoriteCharacter: '',
    favoriteQuote: '',
    favoriteGamble: ''
  })
  const [userGuides, setUserGuides] = useState<UserGuide[]>([])
  const [userSubmissions, setUserSubmissions] = useState<UserSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [quoteModalOpened, { open: openQuoteModal, close: closeQuoteModal }] = useDisclosure(false)
  const [gambleModalOpened, { open: openGambleModal, close: closeGambleModal }] = useDisclosure(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfileData()
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false)
    }
  }, [isAuthenticated, user, authLoading])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      const [profileResponse, guidesResponse, submissionsResponse] = await Promise.allSettled([
        api.get('/users/profile'),
        api.get('/guides/my-guides'),
        api.get('/users/my-submissions')
      ])

      if (profileResponse.status === 'fulfilled') {
        setProfileData(profileResponse.value.data)
      }

      if (guidesResponse.status === 'fulfilled') {
        setUserGuides(guidesResponse.value.data)
      }

      if (submissionsResponse.status === 'fulfilled') {
        setUserSubmissions(submissionsResponse.value.data)
      }
    } catch (error) {
      console.error('Failed to load profile data:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load profile data',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.put('/users/profile', profileData)
      setIsEditing(false)
      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green'
      })
    } catch (error) {
      console.error('Failed to save profile:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to save profile',
        color: 'red'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleQuoteSelect = (quote: any) => {
    setProfileData(prev => ({ ...prev, favoriteQuote: quote.id }))
    closeQuoteModal()
  }

  const handleGambleSelect = (gamble: any) => {
    setProfileData(prev => ({ ...prev, favoriteGamble: gamble.id }))
    closeGambleModal()
  }

  if (authLoading) {
    return (
      <Container size="lg" py="xl">
        <Center h={300}>
          <Loader size="lg" />
        </Center>
      </Container>
    )
  }

  if (!isAuthenticated) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<User size={16} />}
          title="Authentication Required"
          color="blue"
          variant="light"
        >
          <Stack gap="md">
            <Text c="#ffffff">You need to be logged in to view your profile.</Text>
            <Group>
              <Button component={Link} href="/login" variant="filled">
                Log In
              </Button>
              <Button component={Link} href="/register" variant="outline">
                Sign Up
              </Button>
            </Group>
          </Stack>
        </Alert>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Center h={300}>
          <Loader size="lg" />
        </Center>
      </Container>
    )
  }

  const progressValue = progress?.currentChapter && progress?.totalChapters
    ? (progress.currentChapter / progress.totalChapters) * 100
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Container size="lg" py="xl">
        <Stack gap="xl">
          {/* Profile Header */}
          <Card shadow="md" padding="xl" radius="md">
            <Group justify="space-between" align="flex-start">
              <Group align="center" gap="lg">
                <UserProfileImage user={user} size={120} />
                <Stack gap="sm">
                  <Group align="center" gap="md">
                    <Title order={2}>{user?.username}</Title>
                    <UserBadges user={user} />
                    <CustomRoleDisplay user={user} />
                  </Group>
                  <Text size="sm" c="dimmed">
                    Member since {new Date(user?.createdAt || '').toLocaleDateString()}
                  </Text>
                  {progress && (
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="#ffffff">
                        Reading Progress: Chapter {progress.currentChapter} of {progress.totalChapters}
                      </Text>
                      <Progress value={progressValue} size="sm" radius="md" />
                    </Stack>
                  )}
                </Stack>
              </Group>
              <ActionIcon
                variant="light"
                size="lg"
                onClick={() => setIsEditing(!isEditing)}
                aria-label={isEditing ? "Cancel editing" : "Edit profile"}
              >
                {isEditing ? <X size={18} /> : <Edit size={18} />}
              </ActionIcon>
            </Group>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" variant="outline">
            <Tabs.List>
              <Tabs.Tab value="overview" leftSection={<User size={16} />}>
                Overview
              </Tabs.Tab>
              <Tabs.Tab value="guides" leftSection={<BookOpen size={16} />}>
                My Guides
              </Tabs.Tab>
              <Tabs.Tab value="submissions" leftSection={<Upload size={16} />}>
                Submissions
              </Tabs.Tab>
              <Tabs.Tab value="settings" leftSection={<Settings size={16} />}>
                Settings
              </Tabs.Tab>
            </Tabs.List>

            {/* Overview Tab */}
            <Tabs.Panel value="overview" pt="lg">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {/* Bio Section */}
                <Card shadow="sm" padding="md" radius="md">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Text fw={600} size="lg" c="#ffffff">Bio</Text>
                      {isEditing && (
                        <ActionIcon size="sm" variant="light" color="blue">
                          <Edit size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                    {isEditing ? (
                      <Textarea
                        placeholder="Tell us about yourself..."
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        minRows={3}
                      />
                    ) : (
                      <Text size="sm" c={profileData.bio ? undefined : 'dimmed'}>
                        {profileData.bio || 'No bio yet. Click edit to add one!'}
                      </Text>
                    )}
                  </Stack>
                </Card>

                {/* Favorites Section */}
                <Card shadow="sm" padding="md" radius="md">
                  <Stack gap="md">
                    <Text fw={600} size="lg" c="#ffffff">Favorites</Text>

                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Text size="sm" fw={500} c="#ffffff">Favorite Quote:</Text>
                        {isEditing && (
                          <Button size="xs" variant="light" onClick={openQuoteModal}>
                            <Quote size={14} />
                          </Button>
                        )}
                      </Group>
                      <Text size="sm" c={profileData.favoriteQuote ? undefined : 'dimmed'}>
                        {profileData.favoriteQuote || 'No favorite quote selected'}
                      </Text>
                    </Stack>

                    <Divider />

                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Text size="sm" fw={500} c="#ffffff">Favorite Gamble:</Text>
                        {isEditing && (
                          <Button size="xs" variant="light" onClick={openGambleModal}>
                            <Dice6 size={14} />
                          </Button>
                        )}
                      </Group>
                      {profileData.favoriteGamble ? (
                        <GambleChip gambleId={parseInt(profileData.favoriteGamble)} />
                      ) : (
                        <Text size="sm" c="dimmed">No favorite gamble selected</Text>
                      )}
                    </Stack>
                  </Stack>
                </Card>
              </SimpleGrid>

              {isEditing && (
                <Group justify="center" mt="xl">
                  <Button
                    onClick={handleSave}
                    loading={saving}
                    leftSection={<Save size={16} />}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </Group>
              )}
            </Tabs.Panel>

            {/* Guides Tab */}
            <Tabs.Panel value="guides" pt="lg">
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={3}>My Guides</Title>
                  <Button component={Link} href="/submit-guide" leftSection={<FileText size={16} />}>
                    Create New Guide
                  </Button>
                </Group>

                {userGuides.length > 0 ? (
                  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
                    {userGuides.map((guide) => (
                      <Card key={guide.id} shadow="sm" padding="md" radius="md">
                        <Stack gap="sm">
                          <Group justify="space-between">
                            <Text fw={600} size="md" lineClamp={2} c="#ffffff">{guide.title}</Text>
                            <Badge
                              variant="light"
                              color={
                                guide.status === GuideStatus.APPROVED ? 'green' :
                                guide.status === GuideStatus.PENDING ? 'yellow' : 'red'
                              }
                              size="sm"
                            >
                              {guide.status}
                            </Badge>
                          </Group>
                          {guide.description && (
                            <Text size="sm" c="dimmed" lineClamp={3}>
                              {guide.description}
                            </Text>
                          )}
                          <Group gap="xs" mt="auto">
                            <Text size="xs" c="dimmed">
                              Updated {new Date(guide.updatedAt).toLocaleDateString()}
                            </Text>
                          </Group>
                        </Stack>
                      </Card>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Alert icon={<BookOpen size={16} />} title="No guides yet" variant="light">
                    <Text c="#ffffff">You haven&apos;t created any guides yet. Start sharing your knowledge with the community!</Text>
                  </Alert>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Submissions Tab */}
            <Tabs.Panel value="submissions" pt="lg">
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={3}>My Submissions</Title>
                  <Group>
                    <Button component={Link} href="/submit-guide" variant="outline" leftSection={<FileText size={16} />}>
                      Submit Guide
                    </Button>
                    <Button component={Link} href="/submit-media" variant="outline" leftSection={<Camera size={16} />}>
                      Submit Media
                    </Button>
                  </Group>
                </Group>

                {userSubmissions.length > 0 ? (
                  <Stack gap="sm">
                    {userSubmissions.map((submission) => (
                      <Card key={submission.id} shadow="sm" padding="md" radius="md">
                        <Group justify="space-between">
                          <Stack gap="xs">
                            <Group gap="md">
                              <Text fw={600} c="#ffffff">{submission.title}</Text>
                              <Badge
                                variant="light"
                                color={
                                  submission.status === 'approved' ? 'green' :
                                  submission.status === 'pending' ? 'yellow' : 'red'
                                }
                                size="sm"
                              >
                                {submission.status}
                              </Badge>
                              <Badge variant="outline" size="sm">
                                {submission.type}
                              </Badge>
                            </Group>
                            <Text size="sm" c="dimmed">
                              Submitted {new Date(submission.createdAt).toLocaleDateString()}
                            </Text>
                          </Stack>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Alert icon={<Upload size={16} />} title="No submissions yet" variant="light">
                    <Text c="#ffffff">You haven&apos;t made any submissions yet. Share guides or media with the community!</Text>
                  </Alert>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Settings Tab */}
            <Tabs.Panel value="settings" pt="lg">
              <Stack gap="xl">
                <Card shadow="sm" padding="md" radius="md">
                  <Stack gap="md">
                    <Title order={4}>Spoiler Settings</Title>
                    <SpoilerSettings />
                  </Stack>
                </Card>

                <Card shadow="sm" padding="md" radius="md">
                  <Stack gap="md">
                    <Title order={4}>Custom Role</Title>
                    <CustomRoleEditor user={user} />
                  </Stack>
                </Card>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>

      {/* Modals */}
      <QuoteSelectionPopup
        opened={quoteModalOpened}
        onClose={closeQuoteModal}
        onSelect={handleQuoteSelect}
      />

      <GambleSelectionPopup
        opened={gambleModalOpened}
        onClose={closeGambleModal}
        onSelect={handleGambleSelect}
      />
    </motion.div>
  )
}