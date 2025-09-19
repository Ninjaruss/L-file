import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Container, Box } from '@mantine/core'

// Dynamic import for client-side profile functionality
const ProfilePageClient = dynamic(() => import('./ProfilePageClient'), {
  loading: () => (
    <Container size="lg" py="xl">
      <Box ta="center" py="xl">
        Loading your profile...
      </Box>
    </Container>
  )
})

export const metadata: Metadata = {
  title: 'My Profile - L-File',
  description: 'Manage your L-File profile, preferences, and reading progress.',
  openGraph: {
    title: 'My Profile - L-File',
    description: 'Manage your L-File profile, preferences, and reading progress.',
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'My Profile - L-File',
    description: 'Manage your L-File profile, preferences, and reading progress.'
  }
}

export default function ProfilePage() {
  return <ProfilePageClient />
}