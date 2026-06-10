import { io, Socket } from 'socket.io-client'
import { apiUrl } from '../api'
import type { ChatMessage, MessagesResponse } from '../types/chat'

const SOCKET_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export function getSocketUrl(): string {
  return SOCKET_URL
}

export function createChatSocket(): Socket {
  return io(SOCKET_URL, { withCredentials: true })
}

export async function fetchMessages(before?: number): Promise<MessagesResponse> {
  const url = before !== undefined
    ? apiUrl(`/chat/messages?before=${before}`)
    : apiUrl('/chat/messages')
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to load messages: HTTP ${res.status}`)
  }
  return res.json() as Promise<MessagesResponse>
}
