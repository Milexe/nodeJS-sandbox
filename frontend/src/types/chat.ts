export type ChatMessage = {
  id: number
  userId: number
  text: string
  createdAt: string
}

export type MessagesResponse = {
  messages: ChatMessage[]
  hasMore: boolean
}
