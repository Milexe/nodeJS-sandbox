import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { createChatSocket, fetchMessages, getSocketUrl } from '../api/chat'
import RateLimitsFootnote from '../components/RateLimitsFootnote'
import type { ChatMessage } from '../types/chat'

const TYPING_CLEAR_MS = 2000
const MAX_MESSAGE_LENGTH = 500

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  })
}

type ProcessedMessage = ChatMessage & {
  showTimestamp: boolean
  dateSeparator: string | null
}

function processMessages(msgs: ChatMessage[]): ProcessedMessage[] {
  return msgs.map((msg, i) => {
    const prev = msgs[i - 1]
    const next = msgs[i + 1]
    const dateSeparator =
      !prev || !isSameDay(new Date(msg.createdAt), new Date(prev.createdAt))
        ? formatDateLabel(msg.createdAt)
        : null
    const showTimestamp =
      !next ||
      next.userId !== msg.userId ||
      new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime() >= 60_000
    return { ...msg, showTimestamp, dateSeparator }
  })
}

export default function ChatPage() {
  const { userId: userIdParam } = useParams<{ userId: string }>()
  const userId = Number(userIdParam)
  const otherUserId = userId === 1 ? 2 : 1

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [input, setInput] = useState('')
  const [otherTyping, setOtherTyping] = useState(false)
  const [connected, setConnected] = useState(false)
  const [socketId, setSocketId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [floatingDate, setFloatingDate] = useState<string | null>(null)
  const [wsDialogOpen, setWsDialogOpen] = useState(false)

  const wsOverlayPressed = useRef(false)
  const wsTitleId = useId()

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const initialScrollDoneRef = useRef(false)
  const isPrependingRef = useRef(false)
  const skipScrollRef = useRef(false)
  const scrollHeightBeforeRef = useRef(0)
  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null)

  function updateFloatingDate() {
    const container = containerRef.current
    if (!container) return
    const containerTop = container.getBoundingClientRect().top
    const separators = container.querySelectorAll<HTMLElement>('[data-date]')
    let current: string | null = null
    for (const sep of separators) {
      if (sep.getBoundingClientRect().bottom < containerTop) {
        current = sep.dataset.date ?? null
      }
    }
    setFloatingDate(current)
  }

  useEffect(() => {
    fetchMessages()
      .then(({ messages, hasMore }) => {
        setMessages(messages)
        setHasMore(hasMore)
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load history')
      })

    const socket = createChatSocket()
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      setSocketId(socket.id ?? null)
    })
    socket.on('disconnect', () => {
      setConnected(false)
      setSocketId(null)
    })

    socket.on('message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg])
    })

    socket.on('typing', ({ userId: typingUserId }: { userId: number }) => {
      if (typingUserId !== userId) {
        setOtherTyping(true)
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current)
        }
        typingTimerRef.current = setTimeout(() => setOtherTyping(false), TYPING_CLEAR_MS)
      }
    })

    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
      }
      socket.disconnect()
    }
  }, [userId])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('scroll', updateFloatingDate, { passive: true })
    return () => container.removeEventListener('scroll', updateFloatingDate)
  }, [])

  useLayoutEffect(() => {
    if (!isPrependingRef.current) return
    isPrependingRef.current = false
    skipScrollRef.current = true
    if (containerRef.current) {
      containerRef.current.scrollTop =
        containerRef.current.scrollHeight - scrollHeightBeforeRef.current
    }
  }, [messages])

  useEffect(() => {
    if (messages.length === 0) return
    if (skipScrollRef.current) {
      skipScrollRef.current = false
      return
    }
    if (!initialScrollDoneRef.current) {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
      initialScrollDoneRef.current = true
      updateFloatingDate()
      return
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (initialScrollDoneRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [otherTyping])

  async function loadEarlier() {
    if (loadingMore || messages.length === 0) return
    setLoadingMore(true)
    try {
      const oldestId = messages[0].id
      const { messages: older, hasMore: more } = await fetchMessages(oldestId)
      if (older.length === 0) {
        setHasMore(false)
        return
      }
      scrollHeightBeforeRef.current = containerRef.current?.scrollHeight ?? 0
      isPrependingRef.current = true
      setMessages((prev) => [...older, ...prev])
      setHasMore(more)
    } catch {
      // silently ignore — button stays visible for retry
    } finally {
      setLoadingMore(false)
    }
  }

  function handleInputChange(value: string) {
    setInput(value)
    socketRef.current?.emit('typing', { userId })
  }

  function handleSend() {
    const text = input.trim()
    if (!text || !socketRef.current) return
    socketRef.current.emit('message', { userId, text })
    setInput('')
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      handleSend()
    }
  }

  if (userId !== 1 && userId !== 2) {
    return <p className="chat-page__error">Invalid user. Use /ws/1 or /ws/2.</p>
  }

  return (
    <>
      <section className="chat-page__notice" aria-label="How this demo works">
        <div className="chat-page__notice-header">
          <strong className="chat-page__notice-title">WebSockets &amp; Real-time</strong>
          <button
            type="button"
            className={`chat-ws-status chat-ws-status--${connected ? 'connected' : 'disconnected'}`}
            onClick={() => setWsDialogOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={wsDialogOpen}
            aria-label={`WebSocket ${connected ? 'connected' : 'disconnected'}. Open details.`}
          >
            <span className="chat-ws-status__dot" aria-hidden="true" />
            <span className="chat-ws-status__label">WS</span>
          </button>
        </div>
        <p>You are <strong>User {userId}</strong>.</p>
        <p className="chat-page__flow">
          Browser → Nest <code>/socket.io</code> → Gateway → broadcast to all clients
        </p>
        <button
          type="button"
          className="chat-page__open-other"
          onClick={() => window.open(`/ws/${otherUserId}`, '_blank', 'noopener,noreferrer')}
        >
          Open User {otherUserId} in a new tab →
        </button>
      </section>

      {wsDialogOpen
        ? createPortal(
            <div
              className="modal-overlay"
              role="presentation"
              onMouseDown={(e) => {
                wsOverlayPressed.current = e.target === e.currentTarget
              }}
              onMouseUp={(e) => {
                if (e.target === e.currentTarget && wsOverlayPressed.current) {
                  setWsDialogOpen(false)
                }
                wsOverlayPressed.current = false
              }}
            >
              <div
                className="modal modal--info ws-status-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={wsTitleId}
              >
                <div className="modal__header">
                  <h3 id={wsTitleId} className="modal__title">WebSocket connection</h3>
                  <button
                    type="button"
                    className="modal__close"
                    onClick={() => setWsDialogOpen(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="modal__body ws-status-dialog__body">
                  <p className="health-status-dialog__intro">
                    Persistent Socket.IO connection between the browser and NestJS gateway.
                    State updates automatically via socket events — no polling.
                  </p>

                  <div className="health-status-dialog__facts">
                    <div className="health-status-dialog__fact">
                      <span className="health-status-dialog__fact-label">Endpoint</span>
                      <code className="health-status-dialog__fact-value">
                        {getSocketUrl()}/socket.io
                      </code>
                    </div>
                    <div className="health-status-dialog__fact">
                      <span className="health-status-dialog__fact-label">Transport</span>
                      <code className="health-status-dialog__fact-value">
                        Socket.IO (WebSocket upgrade)
                      </code>
                    </div>
                    <div className="health-status-dialog__fact">
                      <span className="health-status-dialog__fact-label">Current user</span>
                      <code className="health-status-dialog__fact-value">User {userId}</code>
                    </div>
                    {socketId ? (
                      <div className="health-status-dialog__fact">
                        <span className="health-status-dialog__fact-label">Socket ID</span>
                        <code className="health-status-dialog__fact-value">{socketId}</code>
                      </div>
                    ) : null}
                  </div>

                  <div className="health-status-dialog__status">
                    <span
                      className={`health-status-dialog__badge health-status-dialog__badge--${connected ? 'ok' : 'error'}`}
                    >
                      {connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>

                <div className="modal__actions modal__actions--footer">
                  <button
                    type="button"
                    className="modal__button modal__button--secondary"
                    onClick={() => setWsDialogOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {error ? (
        <p className="chat-page__load-error">Could not load history: {error}</p>
      ) : null}

      <div className="chat-messages-wrapper">
        {floatingDate && messages.length > 0 ? (
          <div className="chat-date-float">
            <span className="chat-date-float__label">{floatingDate}</span>
          </div>
        ) : null}

        <div className="chat-messages" ref={containerRef}>
          {hasMore ? (
            <div className="chat-load-more">
              <button
                type="button"
                className="chat-load-more__btn"
                disabled={loadingMore}
                onClick={loadEarlier}
              >
                {loadingMore ? 'Loading...' : 'Load earlier messages'}
              </button>
            </div>
          ) : null}

          {messages.length === 0 && !error ? (
            <p className="chat-messages__empty">No messages yet. Say something!</p>
          ) : null}

          {processMessages(messages).map((msg) => {
            const own = msg.userId === userId
            return (
              <Fragment key={msg.id}>
                {msg.dateSeparator ? (
                  <div className="chat-separator" data-date={msg.dateSeparator}>
                    <span className="chat-separator__label">{msg.dateSeparator}</span>
                  </div>
                ) : null}
                <div className={`chat-bubble ${own ? 'chat-bubble--own' : 'chat-bubble--other'}`}>
                  <span className="chat-bubble__text">{msg.text}</span>
                  {msg.showTimestamp ? (
                    <span className="chat-bubble__meta">
                      {own ? 'You' : `User ${msg.userId}`} · {formatTime(msg.createdAt)}
                    </span>
                  ) : null}
                </div>
              </Fragment>
            )
          })}

          {otherTyping ? (
            <div className="chat-typing">
              <span className="chat-typing__dots">
                <span /><span /><span />
              </span>
              <span>User {otherUserId} is typing</span>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="chat-input">
        <input
          className="chat-input__field"
          type="text"
          placeholder="Type a message..."
          value={input}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="drinks-page__btn chat-input__send"
          disabled={!input.trim() || !connected}
          onClick={handleSend}
        >
          Send
        </button>
      </div>

      <div className="chat-page__footnote">
        <RateLimitsFootnote />
      </div>
    </>
  )
}
