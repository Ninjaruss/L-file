import { useEffect, useRef } from 'react'

export interface MouseTrackingOptions {
  isActive: boolean
  onOutsideArea: () => void
  selector: string
  padding?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
}

export function useMouseTracking(options: MouseTrackingOptions) {
  const {
    isActive,
    onOutsideArea,
    selector,
    padding = { left: 50, right: 50, top: 50, bottom: 300 }
  } = options

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      const mouseX = window.lastMouseX
      const mouseY = window.lastMouseY

      if (mouseX !== undefined && mouseY !== undefined) {
        const element = document.querySelector(selector) as HTMLElement
        if (!element) return

        const rect = element.getBoundingClientRect()

        const isOutside = (
          mouseX < rect.left - (padding.left || 0) ||
          mouseX > rect.right + (padding.right || 0) ||
          mouseY < rect.top - (padding.top || 0) ||
          mouseY > rect.bottom + (padding.bottom || 0)
        )

        if (isOutside) {
          onOutsideArea()
        }
      }
    }, 100)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive, onOutsideArea, selector, padding])

  useEffect(() => {
    const trackMousePosition = (event: MouseEvent) => {
      window.lastMouseX = event.clientX
      window.lastMouseY = event.clientY
    }

    document.addEventListener('mousemove', trackMousePosition, { passive: true })
    document.addEventListener('mouseenter', trackMousePosition, { passive: true })
    document.addEventListener('mouseover', trackMousePosition, { passive: true })

    return () => {
      document.removeEventListener('mousemove', trackMousePosition)
      document.removeEventListener('mouseenter', trackMousePosition)
      document.removeEventListener('mouseover', trackMousePosition)
    }
  }, [])
}