'use client'

import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'
import { api } from '../../lib/api'

type ImageStatus = 'approved' | 'pending' | 'rejected' | null
type ShowcaseState = 'not-ready' | 'incomplete' | 'ready' | 'loading'

interface VolumeShowcaseStatusCardProps {
  volumeId: number
  pairedVolumeId: number | null
}

const IMAGE_STATUS_CONFIG: Record<
  NonNullable<ImageStatus> | 'null',
  { icon: React.ReactNode; label: string; color: string }
> = {
  approved: {
    icon: <CheckCircle size={13} color="#10b981" />,
    label: 'Approved',
    color: '#10b981',
  },
  pending: {
    icon: <Clock size={13} color="#eab308" />,
    label: 'Pending approval',
    color: '#eab308',
  },
  rejected: {
    icon: <XCircle size={13} color="#ef4444" />,
    label: 'Rejected — re-upload',
    color: '#ef4444',
  },
  null: {
    icon: null,
    label: 'Not uploaded',
    color: 'rgba(255,255,255,0.3)',
  },
}

function ImageStatusTile({ label, status }: { label: string; status: ImageStatus }) {
  const cfg = status ? IMAGE_STATUS_CONFIG[status] : IMAGE_STATUS_CONFIG.null
  return (
    <Box sx={{ background: 'rgba(255,255,255,0.04)', borderRadius: 1.5, p: '8px 10px' }}>
      <Typography
        sx={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.68rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        {cfg.icon}
        <Typography sx={{ color: cfg.color, fontSize: '0.75rem', fontWeight: 600 }}>
          {cfg.label}
        </Typography>
      </Box>
    </Box>
  )
}

const STATE_CONFIG = {
  loading: {
    border: 'rgba(99,102,241,0.35)',
    bg: 'rgba(99,102,241,0.08)',
    icon: null,
    titleColor: 'rgba(255,255,255,0.5)',
    title: 'Checking status…',
    message: '',
  },
  'not-ready': {
    border: 'rgba(239,68,68,0.35)',
    bg: 'rgba(239,68,68,0.08)',
    icon: <XCircle size={28} color="#ef4444" />,
    titleColor: '#ef4444',
    title: 'Not in Showcase',
    message: 'Both images are required for this volume to appear in the homepage showcase.',
  },
  incomplete: {
    border: 'rgba(234,179,8,0.4)',
    bg: 'rgba(234,179,8,0.07)',
    icon: <AlertTriangle size={28} color="#eab308" />,
    titleColor: '#eab308',
    title: 'Incomplete — Not in Showcase',
    message: 'Take action on the images below to enable showcase.',
  },
  ready: {
    border: 'rgba(16,185,129,0.4)',
    bg: 'rgba(16,185,129,0.07)',
    icon: <CheckCircle size={28} color="#10b981" />,
    titleColor: '#10b981',
    title: 'Showcase Ready',
    message: 'This volume will appear in the homepage showcase automatically.',
  },
}

export function VolumeShowcaseStatusCard({
  volumeId,
  pairedVolumeId,
}: VolumeShowcaseStatusCardProps) {
  const [backgroundStatus, setBackgroundStatus] = useState<ImageStatus>(null)
  const [popoutStatus, setPopoutStatus] = useState<ImageStatus>(null)
  const [state, setState] = useState<ShowcaseState>('loading')
  const [pairedWith, setPairedWith] = useState<{ volumeId: number; volumeNumber: number } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchStatus() {
      try {
        const [showcaseReady, imageStatus] = await Promise.all([
          api.getShowcaseReadyVolumes(),
          api.getVolumeShowcaseStatus(volumeId),
        ])
        if (cancelled) return

        const bg = imageStatus?.background ?? null
        const pop = imageStatus?.popout ?? null
        setBackgroundStatus(bg)
        setPopoutStatus(pop)

        // Find which slot this volume belongs to (as primary or secondary)
        const mySlot = showcaseReady.find(
          (slot) =>
            slot.primary.volumeId === volumeId ||
            slot.secondary?.volumeId === volumeId,
        )
        const isShowcaseReady = !!mySlot

        if (mySlot?.secondary) {
          const partner =
            mySlot.primary.volumeId === volumeId
              ? mySlot.secondary
              : mySlot.primary
          setPairedWith({ volumeId: partner.volumeId, volumeNumber: partner.volumeNumber })
        } else {
          setPairedWith(null)
        }

        if (isShowcaseReady) setState('ready')
        else if (bg !== null || pop !== null) setState('incomplete')
        else setState('not-ready')
      } catch {
        setState((prev) => (prev === 'loading' ? 'not-ready' : prev))
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [volumeId])

  const config = STATE_CONFIG[state]

  return (
    <Box
      sx={{
        p: '16px 20px',
        background: config.bg,
        border: `2px solid ${config.border}`,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        mb: 3,
      }}
    >
      {config.icon && (
        <Box sx={{ flexShrink: 0, mt: '2px' }}>{config.icon}</Box>
      )}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="body1"
          sx={{ color: config.titleColor, fontWeight: 700, mb: 0.5 }}
        >
          {config.title}
        </Typography>
        {config.message && (
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.55)', mb: 1.5 }}
          >
            {config.message}
          </Typography>
        )}
        {state !== 'loading' && (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
              <ImageStatusTile label="Background Image" status={backgroundStatus} />
              <ImageStatusTile label="Popout Image" status={popoutStatus} />
            </Box>
            <Box
              sx={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                pt: 1.5,
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 1.5,
                  p: '8px 10px',
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.68rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      mb: 0.5,
                    }}
                  >
                    Showcase Layout
                  </Typography>
                  {pairedWith ? (
                    <Typography sx={{ color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 600 }}>
                      ⇄ Paired · Vol. {pairedWith.volumeNumber}
                    </Typography>
                  ) : pairedVolumeId ? (
                    <Typography sx={{ color: '#eab308', fontSize: '0.75rem', fontWeight: 600 }}>
                      ⇄ Paired (secondary not ready)
                    </Typography>
                  ) : (
                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                      Single (no pairing)
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.68rem', alignSelf: 'flex-end', pb: '1px' }}>
                  (set in Edit tab)
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}
