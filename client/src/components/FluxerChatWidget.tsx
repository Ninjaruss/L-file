'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ActionIcon, Transition, TextInput } from '@mantine/core'
import { MessageCircle, X, Send, ExternalLink } from 'lucide-react'
import { useAuth } from '../providers/AuthProvider'
import { api } from '../lib/api'

const FLUXER_SERVER_INVITE = 'https://fluxer.gg/7ce7lrCc'
const POLL_INTERVAL_MS = 4000
const ANNOUNCEMENT_POLL_MS = 5 * 60 * 1000

type FluxerMsg = {
  id: string
  content: string
  timestamp: string
  author: { id: string; username: string; avatar: string | null }
}

type Announcement = {
  id: number
  messageId: string
  content: string
  authorUsername: string
  authorId: string
  timestamp: string
  updatedAt: string
} | null

/** Deterministic pastel colour from a user ID string */
function avatarColor(id: string): string {
  const colors = ['#5865f2', '#e44', '#2a9d8f', '#e9c46a', '#f4a261', '#9b5de5', '#00bbf9']
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return colors[hash % colors.length]
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function FluxerChatWidget() {
  const { user, loginWithFluxer, linkFluxer } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<FluxerMsg[]>([])
  const [announcement, setAnnouncement] = useState<Announcement>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [tokenError, setTokenError] = useState<'missing' | 'expired' | 'no_permission' | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const announcePollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const hasFluxerLinked = Boolean(user?.fluxerId)

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.getFluxerMessages()
      setMessages(data)
    } catch {
      // silent — show stale messages
    }
  }, [])

  const fetchAnnouncement = useCallback(async () => {
    try {
      const data = await api.getFluxerAnnouncement()
      setAnnouncement(data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current)
      if (announcePollRef.current) clearInterval(announcePollRef.current)
      return
    }

    fetchMessages()
    fetchAnnouncement()

    pollRef.current = setInterval(fetchMessages, POLL_INTERVAL_MS)
    announcePollRef.current = setInterval(fetchAnnouncement, ANNOUNCEMENT_POLL_MS)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (announcePollRef.current) clearInterval(announcePollRef.current)
    }
  }, [open, fetchMessages, fetchAnnouncement])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return

    // Optimistic add
    const optimistic: FluxerMsg = {
      id: `optimistic-${Date.now()}`,
      content: trimmed,
      timestamp: new Date().toISOString(),
      author: {
        id: user?.fluxerId ?? 'me',
        username: user?.fluxerUsername ?? user?.username ?? 'You',
        avatar: user?.fluxerAvatar ?? null,
      },
    }
    setMessages(prev => [...prev, optimistic])
    setInput('')
    setSending(true)

    try {
      await api.sendFluxerMessage(trimmed)
      setTokenError(null)
    } catch (err: any) {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setInput(trimmed)
      const code = err?.details?.message ?? err?.message ?? ''
      if (code.includes('FLUXER_TOKEN_EXPIRED') || code.includes('FLUXER_TOKEN_MISSING')) {
        setTokenError('expired')
      } else if (code.includes('FLUXER_NO_PERMISSION')) {
        setTokenError('no_permission')
      }
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Collapsed bubble */}
      <Transition mounted={!open} transition="fade" duration={150}>
        {(styles) => (
          <ActionIcon
            onClick={() => setOpen(true)}
            size={52}
            radius="xl"
            aria-label="Open Fluxer chat"
            style={{
              ...styles,
              position: 'fixed',
              bottom: 24,
              left: 24,
              zIndex: 999,
              background: 'linear-gradient(135deg, #5865f2, #7c3aed)',
              border: '2px solid rgba(255,255,255,0.15)',
              boxShadow: '0 4px 16px rgba(88,101,242,0.5)',
              color: '#ffffff',
            }}
          >
            <MessageCircle size={22} />
          </ActionIcon>
        )}
      </Transition>

      {/* Expanded panel */}
      <Transition mounted={open} transition="slide-up" duration={200}>
        {(styles) => (
          <div
            style={{
              ...styles,
              position: 'fixed',
              bottom: 24,
              left: 24,
              zIndex: 999,
              width: 340,
              maxHeight: 500,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#1a1a2e',
              border: '1px solid #2a2a4a',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #5865f2, #7c3aed)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, background: '#23d160', borderRadius: '50%' }} />
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}># usogui</span>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>on Fluxer</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <a
                  href={FLUXER_SERVER_INVITE}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  Join <ExternalLink size={10} />
                </a>
                <ActionIcon
                  onClick={() => setOpen(false)}
                  variant="transparent"
                  size="sm"
                  aria-label="Close chat"
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                >
                  <X size={16} />
                </ActionIcon>
              </div>
            </div>

            {/* Announcement banner */}
            {announcement && (
              <div style={{
                background: 'rgba(88,101,242,0.15)',
                borderBottom: '1px solid rgba(88,101,242,0.3)',
                padding: '8px 14px',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 12 }}>📣</span>
                  <span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Latest Announcement
                  </span>
                  <span style={{ color: '#555', fontSize: 10, marginLeft: 'auto' }}>
                    {relativeTime(announcement.timestamp)}
                  </span>
                </div>
                <div style={{ color: '#ddd', fontSize: 12, lineHeight: 1.5 }}>{announcement.content}</div>
                <div style={{ color: '#888', fontSize: 11, marginTop: 3 }}>— {announcement.authorUsername}</div>
              </div>
            )}

            {/* Message list */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minHeight: 180,
            }}>
              {messages.length === 0 && (
                <div style={{ color: '#555', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
                  No messages yet
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: msg.author.avatar
                      ? `url(https://fluxerusercontent.com/avatars/${msg.author.id}/${msg.author.avatar}.png) center/cover`
                      : avatarColor(msg.author.id),
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    color: '#fff',
                    fontWeight: 700,
                  }}>
                    {!msg.author.avatar && msg.author.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{msg.author.username}</span>
                      <span style={{ color: '#444', fontSize: 10 }}>{relativeTime(msg.timestamp)}</span>
                    </div>
                    <div style={{ color: '#ccc', fontSize: 12, lineHeight: 1.4, wordBreak: 'break-word' }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer */}
            <div style={{ padding: 10, borderTop: '1px solid #2a2a4a', background: '#111122', flexShrink: 0 }}>
              {/* Full chat: Fluxer linked and no token error */}
              {hasFluxerLinked && !tokenError && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    value={input}
                    onChange={(e) => setInput(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message #usogui..."
                    disabled={sending}
                    size="xs"
                    styles={{
                      root: { flex: 1 },
                      input: {
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: 12,
                      },
                    }}
                  />
                  <ActionIcon
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    size={30}
                    radius="md"
                    style={{
                      background: 'linear-gradient(135deg, #5865f2, #7c3aed)',
                      color: '#fff',
                      flexShrink: 0,
                    }}
                    aria-label="Send message"
                  >
                    <Send size={14} />
                  </ActionIcon>
                </div>
              )}

              {/* Token expired / re-link needed */}
              {hasFluxerLinked && tokenError && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f87171', fontSize: 12, marginBottom: 8 }}>
                    {tokenError === 'no_permission'
                      ? 'You need to join the server to chat.'
                      : 'Your Fluxer session expired. Re-link to chat.'}
                  </div>
                  {tokenError !== 'no_permission' && (
                    <button
                      onClick={() => { linkFluxer(); setTokenError(null) }}
                      style={{
                        background: 'linear-gradient(135deg, #5865f2, #7c3aed)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Re-link Fluxer
                    </button>
                  )}
                </div>
              )}

              {/* Logged in but no Fluxer linked */}
              {user && !hasFluxerLinked && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#aaa', fontSize: 12, marginBottom: 8 }}>
                    Link your Fluxer account to chat
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button
                      onClick={linkFluxer}
                      style={{
                        background: 'linear-gradient(135deg, #5865f2, #7c3aed)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Link Fluxer
                    </button>
                    <a
                      href={FLUXER_SERVER_INVITE}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: '#ccc',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 12,
                        textDecoration: 'none',
                      }}
                    >
                      Join Server
                    </a>
                  </div>
                </div>
              )}

              {/* Not logged in */}
              {!user && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#aaa', fontSize: 12, marginBottom: 8 }}>
                    Log in with Fluxer to chat
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button
                      onClick={loginWithFluxer}
                      style={{
                        background: 'linear-gradient(135deg, #5865f2, #7c3aed)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Login with Fluxer
                    </button>
                    <a
                      href={FLUXER_SERVER_INVITE}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: '#ccc',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 12,
                        textDecoration: 'none',
                      }}
                    >
                      Join Server
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Transition>
    </>
  )
}
