import { useState, useCallback, useRef, useEffect } from 'react'

export interface DropdownState {
  isOpen: boolean
}

export interface DropdownHandlers {
  open: () => void
  close: () => void
  setOpen: (opened: boolean) => void
  onTriggerEnter: () => void
  onTriggerLeave: () => void
  onDropdownEnter: () => void
  onDropdownLeave: () => void
}

export interface UseDropdownOptions {
  closeOthers?: () => void
  openDelay?: number
  closeDelay?: number
}

export function useDropdown(options: UseDropdownOptions = {}): [DropdownState, DropdownHandlers] {
  const {
    closeOthers,
    openDelay = 120,
    closeDelay = 200
  } = options

  const [isOpen, setIsOpen] = useState(false)
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const clearOpenTimeout = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current)
      openTimeoutRef.current = null
    }
  }, [])

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const open = useCallback(() => {
    clearOpenTimeout()
    clearCloseTimeout()
    closeOthers?.()
    setIsOpen(true)
  }, [clearCloseTimeout, clearOpenTimeout, closeOthers])

  const close = useCallback(() => {
    clearOpenTimeout()
    clearCloseTimeout()
    setIsOpen(false)
  }, [clearCloseTimeout, clearOpenTimeout])

  const setOpen = useCallback((opened: boolean) => {
    if (opened) {
      open()
    } else {
      close()
    }
  }, [open, close])

  const scheduleOpen = useCallback(() => {
    clearOpenTimeout()
    clearCloseTimeout()
    if (openDelay === 0) {
      open()
      return
    }

    openTimeoutRef.current = setTimeout(() => {
      open()
      openTimeoutRef.current = null
    }, openDelay)
  }, [clearCloseTimeout, clearOpenTimeout, open, openDelay])

  const scheduleClose = useCallback(() => {
    clearOpenTimeout()
    clearCloseTimeout()
    if (closeDelay === 0) {
      close()
      return
    }

    closeTimeoutRef.current = setTimeout(() => {
      close()
      closeTimeoutRef.current = null
    }, closeDelay)
  }, [clearCloseTimeout, clearOpenTimeout, close, closeDelay])

  const onTriggerEnter = useCallback(() => {
    scheduleOpen()
  }, [scheduleOpen])

  const onTriggerLeave = useCallback(() => {
    scheduleClose()
  }, [scheduleClose])

  const onDropdownEnter = useCallback(() => {
    clearCloseTimeout()
  }, [clearCloseTimeout])

  const onDropdownLeave = useCallback(() => {
    scheduleClose()
  }, [scheduleClose])

  useEffect(() => {
    return () => {
      clearOpenTimeout()
      clearCloseTimeout()
    }
  }, [clearCloseTimeout, clearOpenTimeout])

  return [
    {
      isOpen
    },
    {
      open,
      close,
      setOpen,
      onTriggerEnter,
      onTriggerLeave,
      onDropdownEnter,
      onDropdownLeave
    }
  ]
}
