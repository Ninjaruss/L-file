'use client'

import React, { useMemo, useState } from 'react'
import { Avatar, useMantineTheme } from '@mantine/core'
import { User } from 'lucide-react'

interface UserProfileImageProps {
  user: {
    id: number
    username: string
    profilePictureType?:
      | 'discord'
      | 'character_media'
      | 'premium_character_media'
      | 'animated_avatar'
      | 'custom_frame'
      | 'exclusive_artwork'
      | null
    selectedCharacterMediaId?: number | null
    selectedCharacterMedia?: {
      id: number
      url: string
      fileName?: string
      description?: string
      ownerType?: string
      ownerId?: number
    } | null
    discordId?: string | null
    discordAvatar?: string | null
  }
  size?: number
  showFallback?: boolean
  className?: string
}

export default function UserProfileImage({
  user,
  size = 60,
  showFallback = true,
  className
}: UserProfileImageProps) {
  const theme = useMantineTheme()
  const [error, setError] = useState(false)

  const fallbackBackground = theme.other?.usogui?.red ?? theme.colors.red?.[6] ?? '#e11d48'
  const fallbackLetter = useMemo(() => user.username?.[0]?.toUpperCase() ?? '', [user.username])
  const fallbackIconSize = Math.round(size * 0.5)
  const commonStyles = {
    root: {
      backgroundColor: fallbackBackground,
      fontSize: `${size * 0.4}px`,
      fontWeight: 700
    }
  } as const

  const getDiscordUrl = () => {
    if (!user.discordAvatar || !user.discordId) return null
    return user.discordAvatar.startsWith('http')
      ? user.discordAvatar
      : `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png?size=256`
  }

  if (user.profilePictureType === 'discord' && !error) {
    const discordAvatarUrl = getDiscordUrl()
    if (discordAvatarUrl) {
      return (
        <Avatar
          src={discordAvatarUrl}
          alt={`${user.username}'s Discord avatar`}
          className={className}
          size={size}
          radius="xl"
          onError={() => setError(true)}
          styles={commonStyles}
        >
          {(error || !user.discordAvatar) && showFallback && fallbackLetter}
        </Avatar>
      )
    }
  }

  if (user.profilePictureType === 'character_media' && user.selectedCharacterMedia && !error) {
    const imageUrl = user.selectedCharacterMedia.url
    return (
      <Avatar
        src={imageUrl}
        alt={`${user.username}'s profile image`}
        className={className}
        size={size}
        radius="xl"
        onError={() => setError(true)}
        styles={commonStyles}
      >
        {showFallback && fallbackLetter}
      </Avatar>
    )
  }

  if (!user.profilePictureType && !error) {
    const discordAvatarUrl = getDiscordUrl()
    if (discordAvatarUrl) {
      return (
        <Avatar
          src={discordAvatarUrl}
          alt={`${user.username}'s Discord avatar`}
          className={className}
          size={size}
          radius="xl"
          onError={() => setError(true)}
          styles={commonStyles}
        >
          {(error || !user.discordAvatar) && showFallback && fallbackLetter}
        </Avatar>
      )
    }
  }

  return (
    <Avatar className={className} size={size} radius="xl" styles={commonStyles}>
      {showFallback ? fallbackLetter || <User size={fallbackIconSize} /> : <User size={fallbackIconSize} />}
    </Avatar>
  )
}
