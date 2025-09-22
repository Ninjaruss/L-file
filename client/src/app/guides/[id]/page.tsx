import React from 'react'
import { Alert, Button, Container, Stack } from '@mantine/core'
import { getEntityThemeColor, semanticColors, textColors } from '../../../lib/mantine-theme'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { api } from '../../../lib/api'
import GuidePageClient from './GuidePageClient'
import { GuideStatus } from '../../../types'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getGuide(id: number) {
  const guide = await api.getGuide(id)
  return guide
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const guideId = parseInt(id, 10)

  if (Number.isNaN(guideId) || guideId <= 0) {
    return {
      title: 'Guide Not Found - Usogui Fansite'
    }
  }

  try {
    const guide = await getGuide(guideId)
    return {
      title: `${guide.title} - Usogui Guide`,
      description: guide.description || guide.content.slice(0, 160).replace(/\n/g, ' ') + '...',
      openGraph: {
        title: `${guide.title} - Usogui Guide`,
        description: guide.description || guide.content.slice(0, 160).replace(/\n/g, ' ') + '...'
      }
    }
  } catch (error) {
    console.error('Failed to generate metadata for guide:', error)
    return {
      title: 'Guide Not Found - Usogui Fansite'
    }
  }
}

export default async function GuidePage({ params }: PageProps) {
  const { id } = await params
  const guideId = parseInt(id, 10)

  if (Number.isNaN(guideId) || guideId <= 0) {
    return (
      <Container size="lg" py="xl">
        <Stack gap="md">
          <Alert style={{ color: getEntityThemeColor(theme, 'gamble') }} radius="md">
            Guide not found
          </Alert>
          <Button component={Link} href="/guides" variant="subtle" color="gray" leftSection={<ArrowLeft size={18} />}
          >
            Back to Guides
          </Button>
        </Stack>
      </Container>
    )
  }

  try {
    const guide = await getGuide(guideId)

    if (guide.status !== GuideStatus.APPROVED) {
      return (
        <Container size="lg" py="xl">
          <Stack gap="md">
            <Alert style={{ color: semanticColors.warning }} radius="md">
              This guide is not available to the public.
            </Alert>
            <Button component={Link} href="/guides" variant="subtle" color="gray" leftSection={<ArrowLeft size={18} />}>
              Back to Guides
            </Button>
          </Stack>
        </Container>
      )
    }

    return <GuidePageClient initialGuide={guide} />
  } catch (error) {
    console.error('Failed to load guide:', error)
    return (
      <Container size="lg" py="xl">
        <Stack gap="md">
          <Alert style={{ color: getEntityThemeColor(theme, 'gamble') }} radius="md">
            Failed to load guide.
          </Alert>
          <Button component={Link} href="/guides" variant="subtle" color="gray" leftSection={<ArrowLeft size={18} />}>
            Back to Guides
          </Button>
        </Stack>
      </Container>
    )
  }
}

