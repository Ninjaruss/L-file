import { useState, useCallback, useRef, useEffect } from 'react'

export interface DropdownState {
  anchorEl: HTMLElement | null
  isOpen: boolean
}

export interface DropdownHandlers {
  onEnter: (event: React.MouseEvent<HTMLElement>) => void
  onLeave: () => void
  onClose: () => void
  onDropdownEnter: () => void
  onDropdownLeave: () => void
}

export interface UseDropdownOptions {
  buttonLeaveDelay?: number
  dropdownLeaveDelay?: number
  closeOthers?: () => void
}

export function useDropdown(options: UseDropdownOptions = {}): [DropdownState, DropdownHandlers] {
  const {
    buttonLeaveDelay = 250,
    dropdownLeaveDelay = 150,
    closeOthers
  } = options

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimeout = useCallback(() => {
    if (timeoutRef.current) {
      globalThis.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const onEnter = useCallback((event: React.MouseEvent<HTMLElement>) => {
    clearTimeout()
    closeOthers?.()
    setAnchorEl(event.currentTarget)
  }, [clearTimeout, closeOthers])

  const onLeave = useCallback(() => {
    timeoutRef.current = globalThis.setTimeout(() => {
      setAnchorEl(null)
    }, buttonLeaveDelay)
  }, [buttonLeaveDelay])

  const onClose = useCallback(() => {
    clearTimeout()
    setAnchorEl(null)
  }, [clearTimeout])

  const onDropdownEnter = useCallback(() => {
    clearTimeout()
  }, [clearTimeout])

  const onDropdownLeave = useCallback(() => {
    timeoutRef.current = globalThis.setTimeout(() => {
      setAnchorEl(null)
    }, dropdownLeaveDelay)
  }, [dropdownLeaveDelay])

  useEffect(() => {
    return () => {
      clearTimeout()
    }
  }, [clearTimeout])

  return [
    {
      anchorEl,
      isOpen: Boolean(anchorEl)
    },
    {
      onEnter,
      onLeave,
      onClose,
      onDropdownEnter,
      onDropdownLeave
    }
  ]
}