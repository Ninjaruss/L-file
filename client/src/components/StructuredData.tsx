import { JsonLd } from './JsonLd'

interface CharacterStructuredDataProps {
  character: {
    id: number
    name: string
    alternateNames?: string[] | null
    description?: string | null
    firstAppearanceChapter?: number | null
    imageUrl?: string
  }
}

interface ArcStructuredDataProps {
  arc: {
    id: number
    name: string
    description?: string
    startChapter?: number
    endChapter?: number
    imageUrl?: string
  }
}

interface GambleStructuredDataProps {
  gamble: {
    id: number
    name: string
    description?: string
    type?: string
    imageUrl?: string
  }
}

export function CharacterStructuredData({ character }: CharacterStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: character.name,
    additionalName: character.alternateNames?.filter(Boolean) || [],
    description: character.description || `Character from the manga series Usogui (Lie Eater)`,
    identifier: character.id.toString(),
    ...(character.imageUrl && {
      image: character.imageUrl
    }),
    ...(character.firstAppearanceChapter && {
      mentions: {
        '@type': 'CreativeWork',
        name: `Usogui Chapter ${character.firstAppearanceChapter}`,
        description: `First appearance in chapter ${character.firstAppearanceChapter}`
      }
    }),
    isPartOf: {
      '@type': 'CreativeWork',
      name: 'Usogui',
      alternateName: 'Lie Eater',
      author: {
        '@type': 'Person',
        name: 'Sako Toshio'
      },
      genre: ['Manga', 'Psychological', 'Gambling', 'Thriller'],
      publisher: {
        '@type': 'Organization',
        name: 'Shueisha'
      }
    }
  }

  return <JsonLd data={structuredData} />
}

export function ArcStructuredData({ arc }: ArcStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: arc.name,
    description: arc.description || `Story arc from the manga series Usogui (Lie Eater)`,
    identifier: arc.id.toString(),
    ...(arc.imageUrl && {
      image: arc.imageUrl
    }),
    ...(arc.startChapter && arc.endChapter && {
      position: `Chapters ${arc.startChapter}-${arc.endChapter}`,
      numberOfPages: arc.endChapter - arc.startChapter + 1
    }),
    isPartOf: {
      '@type': 'CreativeWork',
      name: 'Usogui',
      alternateName: 'Lie Eater',
      author: {
        '@type': 'Person',
        name: 'Sako Toshio'
      },
      genre: ['Manga', 'Psychological', 'Gambling', 'Thriller'],
      publisher: {
        '@type': 'Organization',
        name: 'Shueisha'
      }
    }
  }

  return <JsonLd data={structuredData} />
}

export function GambleStructuredData({ gamble }: GambleStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: gamble.name,
    description: gamble.description || `Gambling game from the manga series Usogui (Lie Eater)`,
    identifier: gamble.id.toString(),
    ...(gamble.imageUrl && {
      image: gamble.imageUrl
    }),
    ...(gamble.type && {
      category: gamble.type
    }),
    isPartOf: {
      '@type': 'CreativeWork',
      name: 'Usogui',
      alternateName: 'Lie Eater',
      author: {
        '@type': 'Person',
        name: 'Sako Toshio'
      },
      genre: ['Manga', 'Psychological', 'Gambling', 'Thriller'],
      publisher: {
        '@type': 'Organization',
        name: 'Shueisha'
      }
    }
  }

  return <JsonLd data={structuredData} />
}

interface EventStructuredDataProps {
  event: {
    id: number
    title: string
    description?: string
    chapterNumber?: number
    status?: string
    imageUrl?: string
  }
}

interface VolumeStructuredDataProps {
  volume: {
    id: number
    number: number
    title?: string | null
    description?: string | null
    startChapter: number
    endChapter: number
    imageUrl?: string
  }
}

interface ChapterStructuredDataProps {
  chapter: {
    id: number
    number: number
    title?: string | null
    summary?: string | null
    imageUrl?: string
  }
}

interface GuideStructuredDataProps {
  guide: {
    id: number
    title: string
    description?: string
    content?: string
    author?: {
      username: string
    }
    createdAt: string
    updatedAt?: string
    viewCount?: number
    likeCount?: number
  }
}

export function EventStructuredData({ event }: EventStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || `Event from the manga series Usogui (Lie Eater)`,
    identifier: event.id.toString(),
    ...(event.imageUrl && {
      image: event.imageUrl
    }),
    ...(event.chapterNumber && {
      location: {
        '@type': 'Place',
        name: `Chapter ${event.chapterNumber}`
      }
    }),
    ...(event.status && {
      eventStatus: event.status
    }),
    isPartOf: {
      '@type': 'CreativeWork',
      name: 'Usogui',
      alternateName: 'Lie Eater',
      author: {
        '@type': 'Person',
        name: 'Sako Toshio'
      },
      genre: ['Manga', 'Psychological', 'Gambling', 'Thriller'],
      publisher: {
        '@type': 'Organization',
        name: 'Shueisha'
      }
    }
  }

  return <JsonLd data={structuredData} />
}

export function VolumeStructuredData({ volume }: VolumeStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: `Usogui Volume ${volume.number}${volume.title ? `: ${volume.title}` : ''}`,
    description: volume.description || `Volume ${volume.number} of the manga series Usogui (Lie Eater)`,
    identifier: volume.id.toString(),
    bookFormat: 'GraphicNovel',
    volumeNumber: volume.number,
    ...(volume.imageUrl && {
      image: volume.imageUrl
    }),
    numberOfPages: volume.endChapter - volume.startChapter + 1,
    position: `Chapters ${volume.startChapter}-${volume.endChapter}`,
    isPartOf: {
      '@type': 'BookSeries',
      name: 'Usogui',
      alternateName: 'Lie Eater',
      author: {
        '@type': 'Person',
        name: 'Sako Toshio'
      },
      genre: ['Manga', 'Psychological', 'Gambling', 'Thriller'],
      publisher: {
        '@type': 'Organization',
        name: 'Shueisha'
      }
    }
  }

  return <JsonLd data={structuredData} />
}

export function ChapterStructuredData({ chapter }: ChapterStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    name: `Usogui Chapter ${chapter.number}${chapter.title ? `: ${chapter.title}` : ''}`,
    description: chapter.summary || `Chapter ${chapter.number} of the manga series Usogui (Lie Eater)`,
    identifier: chapter.id.toString(),
    position: chapter.number,
    ...(chapter.imageUrl && {
      image: chapter.imageUrl
    }),
    isPartOf: {
      '@type': 'CreativeWork',
      name: 'Usogui',
      alternateName: 'Lie Eater',
      author: {
        '@type': 'Person',
        name: 'Sako Toshio'
      },
      genre: ['Manga', 'Psychological', 'Gambling', 'Thriller'],
      publisher: {
        '@type': 'Organization',
        name: 'Shueisha'
      }
    }
  }

  return <JsonLd data={structuredData} />
}

export function GuideStructuredData({ guide }: GuideStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    name: guide.title,
    headline: guide.title,
    description: guide.description || `A fan guide about the manga series Usogui (Lie Eater)`,
    identifier: guide.id.toString(),
    datePublished: guide.createdAt,
    ...(guide.updatedAt && {
      dateModified: guide.updatedAt
    }),
    ...(guide.author && {
      author: {
        '@type': 'Person',
        name: guide.author.username
      }
    }),
    ...(guide.viewCount !== undefined && {
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/ReadAction',
          userInteractionCount: guide.viewCount
        },
        ...(guide.likeCount !== undefined ? [{
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/LikeAction',
          userInteractionCount: guide.likeCount
        }] : [])
      ]
    }),
    about: {
      '@type': 'CreativeWork',
      name: 'Usogui',
      alternateName: 'Lie Eater',
      author: {
        '@type': 'Person',
        name: 'Sako Toshio'
      },
      genre: ['Manga', 'Psychological', 'Gambling', 'Thriller'],
      publisher: {
        '@type': 'Organization',
        name: 'Shueisha'
      }
    }
  }

  return <JsonLd data={structuredData} />
}