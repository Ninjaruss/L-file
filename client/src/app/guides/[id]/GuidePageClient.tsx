'use client'

import React, { useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Tabs,
  Text,
  Textarea,
  Title,
  useMantineTheme
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { ArrowLeft, FileText, Calendar, Heart, Edit, Save, X, Users, BookOpen, Dice6 } from 'lucide-react'
import Link from 'next/link'
import { api } from '../../../lib/api'
import { useAuth } from '../../../providers/AuthProvider'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import EntityEmbedHelperWithSearch from '../../../components/EntityEmbedHelperWithSearch'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { motion } from 'motion/react'
import { GuideStatus } from '../../../types'
import AuthorProfileImage from '../../../components/AuthorProfileImage'
import { UserRoleDisplay } from '../../../components/BadgeDisplay'
import { usePageView } from '../../../hooks/usePageView'

interface Guide {
  id: number
  title: string
  description: string
  content: string
  status: GuideStatus
  viewCount: number
  likeCount: number
  userHasLiked?: boolean
  author: {
    id: number
    username: string
    role?: string
    customRole?: string | null
    profilePictureType?: 'discord' | 'character_media' | null
    selectedCharacterMediaId?: number | null
    selectedCharacterMedia?: {
      id: number
      url: string
      fileName?: string
      description?: string
    } | null
    discordId?: string | null
    discordAvatar?: string | null
  }
  tags: Array<{
    id: number
    name: string
  }>
  characters?: Array<{
    id: number
    name: string
  }>
  arc?: {
    id: number
    name: string
  }
  gambles?: Array<{
    id: number
    name: string
  }>
  createdAt: string
  updatedAt: string
}

interface GuidePageClientProps {
  initialGuide: Guide
}

export default function GuidePageClient({ initialGuide }: GuidePageClientProps) {
  const theme = useMantineTheme()
  const { user } = useAuth()
  const [guide, setGuide] = useState(initialGuide)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(initialGuide.content)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('content')

  usePageView('guide', guide.id.toString(), true)

  const canEdit = user?.id === guide.author.id || user?.role === 'admin' || user?.role === 'moderator'
  const canPublish = user?.role === 'admin' || user?.role === 'moderator'

  const roleBadge = useMemo(() => {
    if (!guide.author.role) return null
    switch (guide.author.role) {
      case 'admin':
        return { label: 'Admin', color: theme.colors.red?.[5] ?? '#e11d48' }
      case 'moderator':
        return { label: 'Moderator', color: theme.colors.yellow?.[5] ?? '#facc15' }
      default:
        return null
    }
  }, [guide.author.role, theme.colors.red, theme.colors.yellow])

  const handleLikeToggle = async () => {
    try {
      const response = await api.toggleGuideLike(guide.id)
      setGuide((prev) => ({
        ...prev,
        likeCount: response.likeCount,
        userHasLiked: response.liked
      }))
    } catch (error) {
      notifications.show({ message: 'Failed to toggle like.', color: 'red' })
    }
  }

  const handlePublishToggle = async () => {
    if (!canPublish) return
    try {
      await api.updateGuideStatus(guide.id, guide.status === GuideStatus.APPROVED ? GuideStatus.PENDING : GuideStatus.APPROVED)
      const updatedGuide = await api.getGuide(guide.id)
      setGuide(updatedGuide)
      notifications.show({ message: 'Guide status updated.', color: 'green' })
    } catch (error: unknown) {
      notifications.show({ message: error instanceof Error ? error.message : 'Failed to update status.', color: 'red' })
    }
  }

  const handleSave = async () => {
    if (!canEdit) return
    setSaving(true)
    try {
      const updatedGuide = await api.updateGuide(guide.id, {
        content: editedContent.replace(/\r\n/g, '\n'),
        description: guide.description,
        title: guide.title
      })
      setGuide(updatedGuide)
      setIsEditing(false)
      notifications.show({ message: 'Guide updated successfully.', color: 'green' })
    } catch (error: unknown) {
      notifications.show({ message: error instanceof Error ? error.message : 'Failed to save guide.', color: 'red' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedContent(guide.content)
  }

  return (
    <Container size="lg" py="xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Group justify="space-between" align="flex-start" mb="lg">
          <Button component={Link} href="/guides" variant="subtle" color="gray" leftSection={<ArrowLeft size={18} />}>
            Back to Guides
          </Button>
          <Group gap="sm">
            {canPublish && (
              <Button variant="outline" color="yellow" onClick={handlePublishToggle}>
                {guide.status === GuideStatus.APPROVED ? 'Unpublish' : 'Approve Guide'}
              </Button>
            )}
            <Button
              variant={guide.userHasLiked ? 'filled' : 'outline'}
              color="red"
              leftSection={<Heart size={16} />}
              onClick={handleLikeToggle}
            >
              {guide.likeCount} Like{guide.likeCount !== 1 ? 's' : ''}
            </Button>
          </Group>
        </Group>

        <Card withBorder radius="md" className="gambling-card" shadow="md" mb="xl">
          <Stack gap="md" p="lg">
            <Group gap="sm" align="flex-start">
              <AuthorProfileImage
                author={guide.author}
                size={64}
              />
              <Stack gap={4}>
                <Title order={1}>{guide.title}</Title>
                <Group gap="sm" align="center">
                  <Text size="sm" c="dimmed">
                    By {guide.author.username}
                  </Text>
                  {guide.author.customRole && <Badge color="violet" variant="outline" radius="sm">{guide.author.customRole}</Badge>}
                  {roleBadge && (
                    <Badge color={roleBadge.color} variant="light" radius="sm">
                      {roleBadge.label}
                    </Badge>
                  )}
                  <UserRoleDisplay role={guide.author.role} customRole={guide.author.customRole} size="sm" />
                </Group>
                <Group gap="xs" align="center">
                  <Badge color="red" radius="sm" variant="light" leftSection={<Calendar size={14} />}>
                    Published {new Date(guide.createdAt).toLocaleDateString()}
                  </Badge>
                  <Badge color="blue" radius="sm" variant="light">
                    {guide.viewCount} view{guide.viewCount !== 1 ? 's' : ''}
                  </Badge>
                  <Badge color="violet" radius="sm" variant="light">
                    {guide.likeCount} like{guide.likeCount !== 1 ? 's' : ''}
                  </Badge>
                </Group>
                {guide.description && (
                  <Text size="sm" c="dimmed">
                    {guide.description}
                  </Text>
                )}
                <Group gap="xs" wrap>
                  {guide.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" radius="sm">
                      {tag.name}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </Group>
          </Stack>
        </Card>

        <Card withBorder radius="md" className="gambling-card" shadow="md">
          <Tabs value={activeTab} onChange={setActiveTab} keepMounted={false}>
            <Tabs.List>
              <Tabs.Tab value="content" leftSection={<FileText size={16} />}>Guide Content</Tabs.Tab>
              {guide.arc && (
                <Tabs.Tab value="arc" leftSection={<BookOpen size={16} />}>Related Arc</Tabs.Tab>
              )}
              {guide.gambles && guide.gambles.length > 0 && (
                <Tabs.Tab value="gambles" leftSection={<Dice6 size={16} />}>Related Gambles</Tabs.Tab>
              )}
              {guide.characters && guide.characters.length > 0 && (
                <Tabs.Tab value="characters" leftSection={<Users size={16} />}>Characters</Tabs.Tab>
              )}
              {canEdit && (
                <Tabs.Tab value="edit" leftSection={<Edit size={16} />}>Edit Guide</Tabs.Tab>
              )}
            </Tabs.List>

            <Tabs.Panel value="content" pt="md">
              <TimelineSpoilerWrapper chapterNumber={undefined}>
                <EnhancedSpoilerMarkdown
                  content={guide.content}
                  enableEntityEmbeds
                  compactEntityCards={false}
                  className="guide-content"
                />
              </TimelineSpoilerWrapper>
            </Tabs.Panel>

            {guide.arc && (
              <Tabs.Panel value="arc" pt="md">
                <Card withBorder radius="md" shadow="sm">
                  <Stack gap="md" p="lg">
                    <Title order={3}>Arc Overview</Title>
                    <Text size="sm">
                      This guide references the {guide.arc.name} arc. Explore the arc for detailed event breakdowns and timeline.
                    </Text>
                    <Button component={Link} href={`/arcs/${guide.arc.id}`} variant="outline" color="red">
                      View Arc
                    </Button>
                  </Stack>
                </Card>
              </Tabs.Panel>
            )}

            {guide.gambles && guide.gambles.length > 0 && (
              <Tabs.Panel value="gambles" pt="md">
                <Card withBorder radius="md" shadow="sm">
                  <Stack gap="sm" p="lg">
                    <Title order={3}>Related Gambles</Title>
                    <Stack gap="sm">
                      {guide.gambles.map((gamble) => (
                        <Button
                          key={gamble.id}
                          component={Link}
                          href={`/gambles/${gamble.id}`}
                          variant="outline"
                          color="red"
                          fullWidth
                        >
                          {gamble.name}
                        </Button>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              </Tabs.Panel>
            )}

            {guide.characters && guide.characters.length > 0 && (
              <Tabs.Panel value="characters" pt="md">
                <Card withBorder radius="md" shadow="sm">
                  <Stack gap="sm" p="lg">
                    <Title order={3}>Featured Characters</Title>
                    <Stack gap="xs">
                      {guide.characters.map((character) => (
                        <Button
                          key={character.id}
                          component={Link}
                          href={`/characters/${character.id}`}
                          variant="subtle"
                          color="gray"
                          justify="flex-start"
                        >
                          {character.name}
                        </Button>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              </Tabs.Panel>
            )}

            {canEdit && (
              <Tabs.Panel value="edit" pt="md">
                <Card withBorder radius="md" shadow="sm">
                  <Stack gap="md" p="lg">
                    <EntityEmbedHelperWithSearch />
                    <Textarea
                      value={editedContent}
                      onChange={(event) => setEditedContent(event.currentTarget.value)}
                      autosize
                      minRows={10}
                      placeholder="Update guide content"
                    />
                    <Group gap="sm">
                      <Button variant="outline" color="gray" onClick={handleCancel} leftSection={<X size={16} />}>
                        Cancel
                      </Button>
                      <Button color="red" onClick={handleSave} loading={saving} leftSection={!saving ? <Save size={16} /> : undefined}>
                        Save Guide
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              </Tabs.Panel>
            )}
          </Tabs>
        </Card>
      </motion.div>
    </Container>
  )
}
