import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { streamChatResponse } from '../api/apiService'
import { toast } from 'react-hot-toast'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
  error?: string | null
  isStreaming?: boolean
}

interface ChatState {
  messages: ChatMessage[]
  sessionId: string
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  abortController: AbortController | null

  addMessage: (message: ChatMessage) => void
  updateStreamingMessage: (chunk: string) => void
  finishStreamingMessage: () => void
  setErrorOnMessage: (messageId: string, error: string) => void
  startNewSession: () => void
  sendMessage: (text: string) => Promise<void>
  stopGenerating: () => void
  regenerateLastResponse: () => Promise<void>
}

const createMessage = (text: string, role: 'user' | 'assistant' = 'user'): ChatMessage => ({
  id: uuidv4(),
  role,
  text,
  createdAt: Date.now(),
})

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sessionId: uuidv4(),
  isLoading: false,
  isStreaming: false,
  error: null,
  abortController: null,

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message].slice(-200),
    }))
  },

  updateStreamingMessage: (chunk) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.isStreaming ? { ...m, text: m.text + chunk } : m)),
    }))
  },

  finishStreamingMessage: () => {
    set((state) => ({
      isStreaming: false,
      isLoading: false,
      abortController: null,
      messages: state.messages.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
    }))
  },

  setErrorOnMessage: (messageId, error) => {
    set((state) => ({
      isStreaming: false,
      isLoading: false,
      abortController: null,
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, error, isStreaming: false } : m)),
    }))
  },

  startNewSession: () => {
    get().stopGenerating()
    set({
      messages: [],
      sessionId: uuidv4(),
      error: null,
      isLoading: false,
      isStreaming: false,
    })
    toast.success('گفتگوی جدید آغاز شد')
  },

  stopGenerating: () => {
    const { abortController, isStreaming } = get()
    if (abortController && isStreaming) {
      abortController.abort()
      set({
        isStreaming: false,
        isLoading: false,
        abortController: null,
        messages: get().messages.map((m) => (m.isStreaming ? { ...m, isStreaming: false, text: m.text || 'متوقف شد.' } : m)),
      })
      toast('تولید پاسخ متوقف شد.')
    }
  },

  sendMessage: async (text) => {
    const { sessionId, addMessage, stopGenerating, regenerateLastResponse } = get()

    if (text.trim() === '/retry') {
      await regenerateLastResponse()
      return
    }
    if (text.trim() === '/new') {
      get().startNewSession()
      return
    }

    stopGenerating()

    const userMessage = createMessage(text, 'user')
    addMessage(userMessage)

    const assistantMessageId = uuidv4()
    addMessage({
      id: assistantMessageId,
      role: 'assistant',
      text: '',
      createdAt: Date.now(),
      isStreaming: true,
    })

    const controller = new AbortController()
    set({ isLoading: true, isStreaming: true, abortController: controller, error: null })

    try {
      const stream = await streamChatResponse({ text, sessionId, signal: controller.signal })
      const reader = stream.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        get().updateStreamingMessage(chunk)
      }

      get().finishStreamingMessage()
    } catch (err: any) {
      if (err && err.name === 'AbortError') return
      let errorMessage = 'خطایی در ارتباط با سرور رخ داد. (کد: 500)'
      if (err && ('' + err.message).includes('401')) errorMessage = 'دسترسی نامعتبر است. (کد: 401)'
      if (err && ('' + err.message).includes('403')) errorMessage = 'عدم مجوز دسترسی. (کد: 403)'
      if (err && ('' + err.message).includes('404')) errorMessage = 'مسیر API یافت نشد. (کد: 404)'
      toast.error(errorMessage)
      get().setErrorOnMessage(assistantMessageId, errorMessage)
    }
  },

  regenerateLastResponse: async () => {
    const { messages, sendMessage, stopGenerating } = get()
    stopGenerating()
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUser) return
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    let keep = messages
    if (lastAssistant) keep = keep.filter((m) => m.id !== lastAssistant.id)
    keep = keep.filter((m) => m.id !== lastUser.id)
    set({ messages: keep })
    await sendMessage(lastUser.text)
  },
}))
