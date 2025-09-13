'use client'

import React, { useState, useEffect } from 'react'
import { Avatar } from '@mui/material'
import { User } from 'lucide-react'
import { api } from '../lib/api'

interface AuthorProfileImageProps {
  author: {
    id: number
    username: string
    // Minimal author info from guides API
    role?: string
    profilePictureType?: 'discord' | 'character_media' | null
    selectedCharacterMediaId?: number | null
    selectedCharacterMedia?: {
      id: number
      url: string
      fileName?: string
      description?: string
    } | null
    discordId?: string | null
    discordAvatar?: string | null
  }
  size?: number
  showFallback?: boolean
  className?: string
}

interface FullUserProfile {
  id: number
  username: string
  role: string
  profilePictureType?: 'discord' | 'character_media' | null
  selectedCharacterMediaId?: number | null
  selectedCharacterMedia?: {
    id: number
    url: string
    fileName?: string
    description?: string
  } | null
  discordId?: string | null
  discordAvatar?: string | null
}

export default function AuthorProfileImage({
  author,
  size = 60,
  showFallback = true,
  className
}: AuthorProfileImageProps) {
  const [fullProfile, setFullProfile] = useState<FullUserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  // Check if we already have profile data
  const hasProfileData = author.profilePictureType || author.discordAvatar || author.selectedCharacterMedia

  useEffect(() => {
    // Only fetch profile data if we don't already have it
    if (!hasProfileData && !loading && !fullProfile) {
      const fetchUserProfile = async () => {
        try {
          setLoading(true)
          const profile = await api.getPublicUserProfile(author.id)
          setFullProfile(profile)
        } catch (error) {
          console.log(`Could not fetch profile for user ${author.id}:`, error)
          setError(true)
        } finally {
          setLoading(false)
        }
      }

      fetchUserProfile()
    }
  }, [author.id, hasProfileData, loading, fullProfile])

  // Use full profile data if available, otherwise use author data
  const userToRender = fullProfile || author

  // Discord avatar
  if (userToRender.profilePictureType === 'discord' && userToRender.discordAvatar && userToRender.discordId) {
    const discordAvatarUrl = userToRender.discordAvatar.startsWith('http')
      ? userToRender.discordAvatar
      : `https://cdn.discordapp.com/avatars/${userToRender.discordId}/${userToRender.discordAvatar}.png?size=256`

    return (
      <Avatar
        src={discordAvatarUrl}
        alt={`${userToRender.username}'s Discord avatar`}
        className={className}
        sx={{
          width: size,
          height: size,
        }}
        onError={() => setError(true)}
      >
        {(error || !userToRender.discordAvatar) && showFallback && userToRender.username[0]?.toUpperCase()}
      </Avatar>
    )
  }

  // Character media image
  if (userToRender.profilePictureType === 'character_media' && userToRender.selectedCharacterMedia && !error) {
    const media = userToRender.selectedCharacterMedia
    const imageUrl = media.url

    return (
      <Avatar
        src={imageUrl}
        alt={`${userToRender.username}'s profile image`}
        className={className}
        sx={{
          width: size,
          height: size,
        }}
        onError={() => setError(true)}
      >
        {showFallback && userToRender.username[0]?.toUpperCase()}
      </Avatar>
    )
  }

  // Fallback Discord avatar (when profilePictureType is not set but Discord data exists)
  if (!userToRender.profilePictureType && userToRender.discordAvatar && userToRender.discordId && !error) {
    const discordAvatarUrl = userToRender.discordAvatar.startsWith('http')
      ? userToRender.discordAvatar
      : `https://cdn.discordapp.com/avatars/${userToRender.discordId}/${userToRender.discordAvatar}.png?size=256`

    return (
      <Avatar
        src={discordAvatarUrl}
        alt={`${userToRender.username}'s Discord avatar`}
        className={className}
        sx={{
          width: size,
          height: size,
        }}
        onError={() => setError(true)}
      >
        {(error || !userToRender.discordAvatar) && showFallback && userToRender.username[0]?.toUpperCase()}
      </Avatar>
    )
  }

  // Fallback to first letter of username
  return (
    <Avatar
      className={className}
      sx={{
        width: size,
        height: size,
        bgcolor: 'primary.main',
        fontSize: `${size * 0.4}px`,
        fontWeight: 'bold'
      }}
    >
      {showFallback ? (
        userToRender.username[0]?.toUpperCase() || <User size={size * 0.5} />
      ) : (
        <User size={size * 0.5} />
      )}
    </Avatar>
  )
}