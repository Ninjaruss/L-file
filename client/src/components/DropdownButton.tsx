import React from 'react'
import { Button, Box } from '@mui/material'
import { DropdownHandlers, DropdownState } from '../hooks/useDropdown'

export interface DropdownButtonProps {
  label: string
  state: DropdownState
  handlers: DropdownHandlers
  children?: React.ReactNode
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({
  label,
  state,
  handlers,
  children
}) => {
  return (
    <Box
      sx={{ position: 'relative' }}
      onMouseEnter={handlers.onEnter}
      onMouseLeave={handlers.onLeave}
    >
      <Button
        color="inherit"
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          },
          backgroundColor: state.isOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          cursor: 'default'
        }}
        disableRipple
      >
        {label}
      </Button>

      {/* Arrow indicator */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -2,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: state.isOpen ? '4px solid white' : 'none',
          borderBottom: state.isOpen ? 'none' : '4px solid rgba(255, 255, 255, 0.4)',
          opacity: 1,
          transition: 'all 0.2s ease-in-out'
        }}
      />

      {children}
    </Box>
  )
}