import { Metadata } from 'next'
import { Suspense } from 'react'
import SubmitAnnotationPageContent from './SubmitAnnotationPageContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Submit Annotation',
    description: 'Submit an annotation to the L-file wiki. Share your insights, analysis, and commentary on characters, gambles, chapters, and story arcs.',
    openGraph: {
      title: 'Submit Annotation',
      description: 'Submit an annotation to the L-file wiki. Share your insights, analysis, and commentary on characters, gambles, chapters, and story arcs.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Submit Annotation',
      description: 'Submit an annotation to the L-file wiki. Share your insights, analysis, and commentary on characters, gambles, chapters, and story arcs.',
    },
  }
}

export default function SubmitAnnotationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubmitAnnotationPageContent />
    </Suspense>
  )
}
