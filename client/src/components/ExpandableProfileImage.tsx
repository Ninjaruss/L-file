'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import UserProfileImage from './UserProfileImage'
import type { UserProfileImageUser as UserShape } from './UserProfileImage'
import { useHoverModal } from '../hooks/useHoverModal'

interface ExpandableProfileImageProps {
  user: UserShape
  size?: number
  showFallback?: boolean
  className?: string
}

const MODAL_SIZE = 212 // 200px image + 6px padding each side

export default function ExpandableProfileImage({
  user,
  size = 60,
  showFallback = true,
  className,
}: ExpandableProfileImageProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const {
    hoveredItem,
    hoverPosition,
    handleMouseEnter,
    handleMouseLeave,
    handleModalMouseEnter,
    handleModalMouseLeave,
    handleTap,
    isTouchDevice,
  } = useHoverModal<string>({
    modalWidth: MODAL_SIZE,
    modalHeight: MODAL_SIZE,
    showDelay: 200,
    hideDelay: 150,
  })

  const getImageUrl = (): string | null => {
    if (user.profilePictureType === 'character_media' && user.selectedCharacterMedia?.url) {
      return user.selectedCharacterMedia.url
    }
    if (
      (user.profilePictureType === 'fluxer' || !user.profilePictureType) &&
      user.fluxerId &&
      user.fluxerAvatar
    ) {
      return user.fluxerAvatar.startsWith('http')
        ? user.fluxerAvatar
        : `https://fluxerusercontent.com/avatars/${user.fluxerId}/${user.fluxerAvatar}.png?size=256`
    }
    return null
  }

  const imageUrl = getImageUrl()

  const triggerHandlers = imageUrl
    ? isTouchDevice
      ? { onClick: (e: React.MouseEvent) => handleTap(imageUrl, e) }
      : {
          onMouseEnter: (e: React.MouseEvent) => handleMouseEnter(imageUrl, e),
          onMouseLeave: handleMouseLeave,
        }
    : {}

  return (
    <>
      <div
        style={{ display: 'inline-block', cursor: imageUrl ? 'pointer' : undefined }}
        {...triggerHandlers}
      >
        <UserProfileImage
          user={user}
          size={size}
          showFallback={showFallback}
          className={className}
        />
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {hoveredItem && hoverPosition && (
            <motion.div
              key="profile-expand-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onMouseEnter={handleModalMouseEnter}
              onMouseLeave={handleModalMouseLeave}
              style={{
                position: 'fixed',
                left: hoverPosition.x,
                top: hoverPosition.y,
                transform: 'translateX(-50%)',
                zIndex: 9999,
                background: '#111',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                padding: 6,
                pointerEvents: 'auto',
              }}
            >
              <img
                src={hoveredItem}
                alt={`${user.username}'s profile picture`}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 6,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
