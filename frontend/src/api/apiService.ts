import { toast } from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

interface SendMessageParams {
  text: string
  sessionId: string
  signal: AbortSignal
}

export const streamChatResponse = async ({ text, sessionId, signal }: SendMessageParams): Promise<ReadableStream<Uint8Array>> => {
  const response = await fetch(`${API_BASE_URL}/chat/stream`, { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sessionId }),
    signal,
  })

  if (!res.ok) {
    throw new Error(`API request failed with status ${res.status}`)
  }

  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('text/event-stream') && res.body) {
    return res.body
  }

  // JSON fallback simulation
  const data = await res.json()
  const simulated = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      const words = String(data.text || '').split(' ')
      for (const w of words) {
        await new Promise((r) => setTimeout(r, 40))
        controller.enqueue(encoder.encode(w + ' '))
      }
      controller.close()
    },
  })
  return simulated
}

// Online/offline toasts
let offlineId: string | undefined
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (offlineId) {
      toast.dismiss(offlineId)
      offlineId = undefined
    }
    toast.success('دوباره آنلاین شدید!')
  })
  window.addEventListener('offline', () => {
    offlineId = toast.error('آفلاین هستید. پیام‌ها پس از اتصال ارسال می‌شوند.', {
      id: 'offline-toast',
      duration: Infinity,
    }) as unknown as string
  })
}
