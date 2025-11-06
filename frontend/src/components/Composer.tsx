import React, { useRef, useState, KeyboardEvent } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Send, StopCircle, RotateCw } from 'lucide-react'
import { useChatStore } from '@/stores/useChatStore'

export const Composer: React.FC = () => {
  const [draft, setDraft] = useState('')
  const isLoading = useChatStore((s) => s.isLoading)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const stopGenerating = useChatStore((s) => s.stopGenerating)
  const regenerate = useChatStore((s) => s.regenerateLastResponse)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    const text = draft.trim()
    if (!text || isLoading) return
    sendMessage(text)
    setDraft('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setDraft('')
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const actionButton = (() => {
    if (isStreaming) {
      return (
        // Translated label
        <button type="button" onClick={stopGenerating} aria-label="Stop generating response" className="p-2 rounded-full text-destructive hover:bg-destructive/10 transition-colors">
          <StopCircle size={24} />
        </button>
      )
    }
    if (isLoading && !isStreaming) {
      return (
        // Translated label
        <div className="p-2 text-text-muted" aria-label="Loading...">
          <RotateCw size={24} className="animate-spin" />
        </div>
      )
    }
    return (
      <button
        type="submit"
        disabled={!draft.trim()}
        // Translated label
        aria-label="Send message"
        className="p-2 rounded-full text-primary disabled:text-text-muted hover:bg-primary/10 disabled:hover:bg-transparent transition-colors"
      >
        {/* UI MOD: Removed transform: 'scaleX(-1)' for standard LTR icon */}
        <Send size={24} />
      </button>
    )
  })()

  return (
    <div className="sticky bottom-0 z-10 p-2 sm:p-4 bg-background border-t border-border-subtle">
      {/* UI MOD: Applied max-w-3xl here to match the message list */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-end gap-2 p-2 rounded-2xl border border-border bg-surface">
        <TextareaAutosize
          id="chat-composer"
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          maxRows={8}
          // Translated placeholder
          placeholder="Type your question and press Enter... (Shift+Enter for new line)"
          // Translated label
          aria-label="Write your message"
          disabled={isLoading}
          className="flex-1 p-2 bg-transparent resize-none text-text-default placeholder:text-text-muted focus:outline-none disabled:opacity-70"
        />
        {actionButton}
      </form>

      {/* UI MOD: Applied max-w-3xl here for alignment */}
      {!isLoading && !isStreaming && useChatStore.getState().messages.length > 0 && (
        <div className="max-w-3xl mx-auto flex justify-center pt-2">
          <button
            type="button"
            onClick={regenerate}
            className="flex items-center gap-2 px-3 py-1 text-xs rounded-full text-text-muted hover:text-text-default hover:bg-surface transition-colors"
          >
            <RotateCw size={14} />
            {/* Translated label */}
            <span>Regenerate Response</span>
          </button>
        </div>
      )}
    </div>
  )
}