'use client'

import React from 'react'
import { Paper, Stack, rem } from '@mantine/core'
import { motion, AnimatePresence } from 'motion/react'
import { backgroundStyles } from '../lib/mantine-theme'

interface HoverModalPosition {
  x: number
  y: number
}

interface HoverModalProps {
  isOpen: boolean
  position: HoverModalPosition | null
  accentColor: string
  width?: number
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  children: React.ReactNode
}

export function HoverModal({
  isOpen,
  position,
  accentColor,
  width = 300,
  onMouseEnter,
  onMouseLeave,
  children
}: HoverModalProps) {
  if (!isOpen || !position) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && position && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            left: position.x - width / 2,
            top: position.y,
            zIndex: 1001,
            pointerEvents: 'auto'
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <Paper
            shadow="xl"
            radius="lg"
            p="md"
            style={{
              backgroundColor: backgroundStyles.modal,
              border: `2px solid ${accentColor}`,
              backdropFilter: 'blur(10px)',
              width: rem(width),
              maxWidth: '90vw'
            }}
          >
            <Stack gap="sm">
              {children}
            </Stack>
          </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default HoverModal
