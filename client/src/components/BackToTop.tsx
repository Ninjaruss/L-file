'use client'

import React, { useState, useEffect } from 'react'
import { ActionIcon, Transition } from '@mantine/core'
import { ArrowUp } from 'lucide-react'

export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Transition mounted={visible} transition="fade" duration={200}>
      {(styles) => (
        <ActionIcon
          onClick={scrollToTop}
          size="xl"
          radius="xl"
          variant="filled"
          aria-label="Back to top"
          style={{
            ...styles,
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <ArrowUp size={20} />
        </ActionIcon>
      )}
    </Transition>
  )
}
