import React from 'react'
import {
  Container,
  Box,
  Button,
  Alert
} from '@mui/material'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { api } from '../../../lib/api'
import OrganizationPageClient from './OrganizationPageClient'

interface PageProps {
  params: Promise<{ id: string }>
}

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

// Fetch organization data at build time or request time
async function getOrganizationData(id: string) {
  try {
    // Validate that ID is a valid number
    if (!id || isNaN(Number(id))) {
      throw new Error('Invalid organization ID')
    }

    const organizationId = Number(id)

    // Additional safety check for negative or zero IDs
    if (organizationId <= 0) {
      throw new Error('Invalid organization ID')
    }

    const organizationData = await api.getOrganization(organizationId)

    // Set characters as members
    const members = organizationData.characters || []

    // For now, we'll set empty arrays for other related data
    const events: any[] = []
    const gambles: any[] = []

    return {
      organization: organizationData,
      members,
      events,
      gambles
    }
  } catch (error: unknown) {
    console.error('Error fetching organization data:', error)
    return null
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getOrganizationData(id)

  if (!data?.organization) {
    return {
      title: 'Organization Not Found - Usogui Fansite',
      description: 'The requested organization could not be found.'
    }
  }

  const { organization, members } = data
  const memberCount = members.length

  return {
    title: `${organization.name} - Organization Details | Usogui Fansite`,
    description: `Learn about ${organization.name}, ${memberCount > 0 ? `an organization with ${memberCount} known members` : 'an organization in the Usogui universe'}. ${organization.description ? organization.description.slice(0, 120) + '...' : ''}`,
    keywords: `Usogui, ${organization.name}, organization, characters, members${members.map((m: any) => `, ${m.name}`).join('').slice(0, 100)}`,
    openGraph: {
      title: `${organization.name} - Usogui Organization`,
      description: `${organization.name} is an organization${memberCount > 0 ? ` with ${memberCount} known members` : ''} in the Usogui universe.`,
      type: 'article'
    },
    twitter: {
      card: 'summary',
      title: `${organization.name} - Usogui Organization`,
      description: `Explore ${organization.name}${memberCount > 0 ? ` and its ${memberCount} members` : ''} in the Usogui universe.`
    }
  }
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { id } = await params
  const data = await getOrganizationData(id)

  if (!data?.organization) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          Organization not found
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Button component={Link} href="/organizations" startIcon={<ArrowLeft />}>
            Back to Organizations
          </Button>
        </Box>
      </Container>
    )
  }

  const { organization, members, events, gambles } = data

  return (
    <OrganizationPageClient
      initialOrganization={organization}
      initialMembers={members}
      initialEvents={events}
      initialGambles={gambles}
    />
  )
}

// Force dynamic rendering to ensure SSR
export const dynamic = 'force-dynamic'