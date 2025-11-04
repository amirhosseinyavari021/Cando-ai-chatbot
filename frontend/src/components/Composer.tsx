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
        <button type="button" onClick={stopGenerating} aria-label="توقف تولید پاسخ" className="p-2 rounded-full text-destructive hover:bg-destructive/10 transition-colors">
          <StopCircle size={24} />
        </button>
      )
    }
    if (isLoading && !isStreaming) {
      return (
        <div className="p-2 text-text-muted" aria-label="در حال بارگذاری">
          <RotateCw size={24} className="animate-spin" />
        </div>
      )
    }
    return (
      <button
        type="submit"
        disabled={!draft.trim()}
        aria-label="ارسال پیام"
        className="p-2 rounded-full text-primary disabled:text-text-muted hover:bg-primary/10 disabled:hover:bg-transparent transition-colors"
      >
        <Send size={24} style={{ transform: 'scaleX(-1)' }} />
      </button>
    )
  })()

  return (
    <div className="sticky bottom-0 z-10 p-2 sm:p-4 bg-background border-top border-t border-border-subtle">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-end gap-2 p-2 rounded-2xl border border-border bg-surface">
        <TextareaAutosize
          id="chat-composer"
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          maxRows={8}
          placeholder="سؤال‌تان را بنویسید و Enter را بزنید… (Shift+Enter: خط جدید)"
          aria-label="پیام خود را بنویسید"
          disabled={isLoading}
          className="flex-1 p-2 bg-transparent resize-none text-text-default placeholder:text-text-muted focus:outline-none disabled:opacity-70"
        />
        {actionButton}
      </form>

      {!isLoading && !isStreaming && useChatStore.getState().messages.length > 0 && (
        <div className="max-w-3xl mx-auto flex justify-center pt-2">
          <button
            type="button"
            onClick={regenerate}
            className="flex items-center gap-2 px-3 py-1 text-xs rounded-full text-text-muted hover:text-text-default hover:bg-surface transition-colors"
          >
            <RotateCw size={14} />
            <span>تولید مجدد پاسخ</span>
          </button>
        </div>
      )}
    </div>
  )
}
