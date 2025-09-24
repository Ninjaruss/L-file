'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { Box, Skeleton } from '@mantine/core'
import { motion } from 'motion/react'

interface LazySectionProps {
  children: ReactNode
  fallback?: ReactNode
  rootMargin?: string
  threshold?: number
  delay?: number
  minHeight?: number | string
}

export function LazySection({
  children,
  fallback,
  rootMargin = '50px',
  threshold = 0.1,
  delay = 0,
  minHeight = 200
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
          // Add delay before rendering to stagger animations
          setTimeout(() => {
            setShouldRender(true)
          }, delay)
        }
      },
      {
        rootMargin,
        threshold
      }
    )

    const element = elementRef.current
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [isVisible, rootMargin, threshold, delay])

  const defaultFallback = (
    <Box style={{ minHeight, padding: '2rem' }}>
      <Skeleton height={40} width="60%" style={{ marginBottom: '1.5rem', margin: '0 auto' }} />
      <Skeleton height={120} width="100%" style={{ marginBottom: '1rem' }} />
      <Skeleton height={80} width="80%" style={{ margin: '0 auto' }} />
    </Box>
  )

  return (
    <Box ref={elementRef} style={{ minHeight: isVisible ? 'auto' : minHeight }}>
      {shouldRender ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      ) : (
        fallback || defaultFallback
      )}
    </Box>
  )
}