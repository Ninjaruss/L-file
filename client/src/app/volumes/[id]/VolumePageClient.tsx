'use client'

import React from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  Stack,
  Text,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { ArrowLeft, Book, Hash } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'
import MediaThumbnail from '../../../components/MediaThumbnail'

interface Volume {
  id: number
  number: number
  title?: string
  description?: string
  coverUrl?: string
  startChapter: number
  endChapter: number
  createdAt: string
  updatedAt: string
}

interface VolumePageClientProps {
  initialVolume: Volume
  initialChapters: number[]
}

export default function VolumePageClient({ initialVolume, initialChapters }: VolumePageClientProps) {
  const theme = useMantineTheme()

  // Track page view
  usePageView('volume', initialVolume.id.toString(), true)

  return (
    <Container size="lg" py="xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box mb="md">
          <Button
            component={Link}
            href="/volumes"
            variant="subtle"
            color="gray"
            leftSection={<ArrowLeft size={18} />}
          >
            Back to Volumes
          </Button>
        </Box>

        <Stack align="center" gap="sm" mb="xl">
          <Title order={1}>Volume {initialVolume.number}</Title>

          {initialVolume.title && (
            <Text size="lg" c="dimmed">
              {initialVolume.title}
            </Text>
          )}

          <Box>
            <MediaThumbnail
              entityType="volume"
              entityId={initialVolume.id}
              entityName={`Volume ${initialVolume.number}`}
              maxWidth="200px"
              maxHeight="300px"
              allowCycling
            />
          </Box>

          <Badge
            variant="outline"
            color="red"
            radius="sm"
            size="lg"
            leftSection={<Hash size={16} />}
          >
            Chapters {initialVolume.startChapter}-{initialVolume.endChapter}
          </Badge>
        </Stack>

        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 8 }}>
            {initialVolume.description && (
              <Card withBorder radius="md" className="gambling-card" shadow="sm" p="lg">
                <Stack gap="sm">
                  <Group gap="sm">
                    <Book size={20} />
                    <Title order={4}>Volume Summary</Title>
                  </Group>
                  <TimelineSpoilerWrapper chapterNumber={initialVolume.startChapter}>
                    <Text size="sm" style={{ lineHeight: 1.6 }}>
                      {initialVolume.description}
                    </Text>
                  </TimelineSpoilerWrapper>
                </Stack>
              </Card>
            )}

            {initialChapters.length > 0 && (
              <Card
                withBorder
                radius="md"
                className="gambling-card"
                shadow="sm"
                p="lg"
                mt="xl"
              >
                <Stack gap="md">
                  <Title order={4}>Chapters in this Volume</Title>
                  <Grid gutter="sm">
                    {initialChapters.map((chapterNumber) => (
                      <Grid.Col span={{ base: 6, sm: 4, md: 3 }} key={chapterNumber}>
                        <Button
                          component={Link}
                          href={`/chapters/${chapterNumber}`}
                          variant="outline"
                          color="red"
                          size="sm"
                          fullWidth
                        >
                          Chapter {chapterNumber}
                        </Button>
                      </Grid.Col>
                    ))}
                  </Grid>
                </Stack>
              </Card>
            )}
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder radius="md" className="gambling-card" shadow="sm" p="lg">
              <Stack gap="md">
                <Title order={5}>Volume Info</Title>

                <Stack gap={4}>
                  <Text size="xs" c="dimmed">Volume Number</Text>
                  <Text>{initialVolume.number}</Text>
                </Stack>

                <Stack gap={4}>
                  <Text size="xs" c="dimmed">Chapter Range</Text>
                  <Text>
                    Chapters {initialVolume.startChapter} – {initialVolume.endChapter}
                  </Text>
                </Stack>

                <Stack gap={4}>
                  <Text size="xs" c="dimmed">Total Chapters</Text>
                  <Text>{initialVolume.endChapter - initialVolume.startChapter + 1} chapters</Text>
                </Stack>

                <Divider color="rgba(255, 255, 255, 0.12)" my="sm" />

                <Title order={6}>Quick Navigation</Title>

                <Stack gap="sm">
                  <Button
                    component={Link}
                    href={`/chapters/${initialVolume.startChapter}`}
                    variant="outline"
                    color="red"
                    size="sm"
                    fullWidth
                  >
                    First Chapter ({initialVolume.startChapter})
                  </Button>
                  <Button
                    component={Link}
                    href={`/chapters/${initialVolume.endChapter}`}
                    variant="outline"
                    color="red"
                    size="sm"
                    fullWidth
                  >
                    Last Chapter ({initialVolume.endChapter})
                  </Button>
                  <Button
                    component={Link}
                    href="/chapters"
                    variant="outline"
                    color="red"
                    size="sm"
                    fullWidth
                  >
                    Browse All Chapters
                  </Button>
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </motion.div>
    </Container>
  )
}
