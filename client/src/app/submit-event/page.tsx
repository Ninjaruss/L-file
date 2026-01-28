import { Metadata } from 'next'
import SubmitEventPageContent from './SubmitEventPageContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Submit Event | L-file',
    description: 'Submit a story event to the L-file wiki. Help document key moments, decisions, and revelations from Usogui.',
    openGraph: {
      title: 'Submit Event | L-file',
      description: 'Submit a story event to the L-file wiki. Help document key moments, decisions, and revelations from Usogui.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Submit Event | L-file',
      description: 'Submit a story event to the L-file wiki. Help document key moments, decisions, and revelations from Usogui.',
    },
  }
}

export default function SubmitEventPage() {
  return <SubmitEventPageContent />
}
