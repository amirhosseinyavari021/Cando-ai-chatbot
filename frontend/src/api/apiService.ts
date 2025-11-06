import { toast } from 'react-hot-toast'

// Use the VITE_API_BASE_URL, default to /api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

interface SendMessageParams {
  text: string
  sessionId: string
  signal: AbortSignal
}

export const streamChatResponse = async ({ text, sessionId, signal }: SendMessageParams): Promise<ReadableStream<Uint8Array>> => {
  // FIX: Changed endpoint from /chat/stream to /ai/chat to match backend routes
  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sessionId }), // 'text' matches backend controller
    signal,
  })

  // FIX: Changed 'res' to 'response' to fix ReferenceError
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  // FIX: Removed event-stream logic as backend sends JSON.
  // Made the JSON "simulation" the primary path.
  const data = await response.json()
  const simulated = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      // The backend returns { text: "..." }, so we use data.text
      const words = String(data.text || '').split(' ')
      for (const w of words) {
        // Reduced delay for a faster-feeling response
        await new Promise((r) => setTimeout(r, 20))
        controller.enqueue(encoder.encode(w + ' '))
      }
      controller.close()
    },
  })
  return simulated
}

// Online/offline toasts (Translated to English)
let offlineId: string | undefined
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (offlineId) {
      toast.dismiss(offlineId)
      offlineId = undefined
    }
    toast.success('You are back online!')
  })
  window.addEventListener('offline', () => {
    offlineId = toast.error('You are offline. Messages will be sent upon reconnection.', {
      id: 'offline-toast',
      duration: Infinity,
    }) as unknown as string
  })
}