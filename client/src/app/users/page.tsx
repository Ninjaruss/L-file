import { Metadata } from 'next'
import { Suspense } from 'react'
import UsersPageContent from './UsersPageContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Community',
    description: 'Meet the L-file community members. Browse user profiles, reading progress, and community contributions.',
    openGraph: {
      title: 'Community',
      description: 'Meet the L-file community members. Browse user profiles, reading progress, and community contributions.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Community',
      description: 'Meet the L-file community members. Browse user profiles, reading progress, and community contributions.',
    },
  }
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UsersPageContent />
    </Suspense>
  )
}