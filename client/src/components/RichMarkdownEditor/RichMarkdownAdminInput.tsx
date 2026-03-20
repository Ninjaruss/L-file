'use client'

import React from 'react'
import { useController, useFormContext } from 'react-hook-form'
import RichMarkdownEditor from './index'

interface RichMarkdownAdminInputProps {
  source: string
  label?: string
  minHeight?: number
  maxHeight?: number
  placeholder?: string
}

/**
 * React Admin compatible wrapper for RichMarkdownEditor.
 * Uses react-hook-form's useController to bind to the form source field.
 * Admin edit views always render in edit mode — disabled prop not used here.
 */
export function RichMarkdownAdminInput({
  source,
  label,
  minHeight = 200,
  maxHeight,
  placeholder,
}: RichMarkdownAdminInputProps) {
  const { control } = useFormContext()
  const { field } = useController({ name: source, control })

  return (
    <RichMarkdownEditor
      value={field.value ?? ''}
      onChange={(md) => field.onChange(md)}
      label={label ?? source}
      minHeight={minHeight}
      maxHeight={maxHeight}
      placeholder={placeholder}
    />
  )
}
