'use client'

import React, { useEffect, useState } from 'react'
import { VisuallyHidden } from '@mantine/core'

interface LiveRegionProps {
  /**
   * The message to announce to screen readers
   */
  message: string
  /**
   * Whether to use polite (waits for idle) or assertive (interrupts) announcement
   * @default 'polite'
   */
  priority?: 'polite' | 'assertive'
  /**
   * Whether this is relevant content ('additions', 'removals', 'text', or 'all')
   * @default 'additions text'
   */
  relevant?: 'additions' | 'removals' | 'text' | 'all' | 'additions text'
  /**
   * Whether the region should be atomic (announce entire region on change)
   * @default true
   */
  atomic?: boolean
}

/**
 * Accessible live region component for announcing dynamic content to screen readers
 * Use this for loading states, search results, form validation, etc.
 *
 * @example
 * // Announce loading state
 * <LiveRegion message={isLoading ? "Loading results..." : `${count} results found`} />
 *
 * @example
 * // Announce error with high priority
 * <LiveRegion message={errorMessage} priority="assertive" />
 */
export function LiveRegion({
  message,
  priority = 'polite',
  relevant = 'additions text',
  atomic = true
}: LiveRegionProps) {
  // Use state to trigger re-announcement on message change
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    // Clear and set message to force re-announcement
    setAnnouncement('')
    const timeout = setTimeout(() => {
      setAnnouncement(message)
    }, 100)

    return () => clearTimeout(timeout)
  }, [message])

  return (
    <VisuallyHidden>
      <div
        role="status"
        aria-live={priority}
        aria-relevant={relevant}
        aria-atomic={atomic}
      >
        {announcement}
      </div>
    </VisuallyHidden>
  )
}

/**
 * Hook for programmatic announcements to screen readers
 *
 * @example
 * const announce = useAnnounce()
 * announce("5 new results loaded")
 */
export function useAnnounce() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create a temporary live region
    const liveRegion = document.createElement('div')
    liveRegion.setAttribute('role', 'status')
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `
    document.body.appendChild(liveRegion)

    // Announce after a brief delay
    setTimeout(() => {
      liveRegion.textContent = message
    }, 100)

    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion)
    }, 1000)
  }

  return announce
}

export default LiveRegion
