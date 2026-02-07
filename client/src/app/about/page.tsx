import type { Metadata } from 'next'
import { AboutPageContent } from './AboutPageContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'About L-File - Usogui Database',
    description:
      "Learn about L-File, the comprehensive fan-made database dedicated to the manga series Usogui (The Lie Eater). Created by fans, for fans.",
    keywords: ['Usogui', 'Lie Eater', 'manga', 'database', 'characters', 'gambles', 'about'],
    openGraph: {
      title: 'About L-File - Usogui Database',
      description:
        'Learn about L-File, the comprehensive fan-made database dedicated to the manga series Usogui (The Lie Eater).',
      type: 'website'
    },
    twitter: {
      card: 'summary',
      title: 'About L-File - Usogui Database',
      description:
        'Learn about L-File, the comprehensive fan-made database dedicated to the manga series Usogui (The Lie Eater).'
    }
  }
}

export default function AboutPage() {
  return <AboutPageContent />
}
