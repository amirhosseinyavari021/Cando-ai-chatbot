import React, { useRef } from 'react'
import { useChatStore } from '@/stores/useChatStore'
import { useAutoScroll } from '@/hooks/useAutoScroll'
import { MessageItem, MessageSkeleton, TypingIndicator } from './MessageItem'
import { ArrowDown } from 'lucide-react'

export const MessageList: React.FC = () => {
  const listRef = useRef<HTMLDivElement>(null)
  const messages = useChatStore((s) => s.messages)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const isLoading = useChatStore((s) => s.isLoading)

  const { showJumpToBottom, jumpToBottom } = useAutoScroll(listRef, messages.length)

  const hasMessages = messages.length > 0
  const showSkeleton = isLoading && !hasMessages

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto p-4 sm:px-6 md:px-8" aria-live="polite">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        {showSkeleton ? <MessageSkeleton /> : messages.map((m) => <MessageItem key={m.id} message={m} />)}
        {isStreaming && !showSkeleton && <TypingIndicator />}
      </div>

      {showJumpToBottom && (
        <button
          onClick={jumpToBottom}
          aria-label="پرش به آخرین پیام"
          className="sticky bottom-6 start-1/2 -translate-x-1/2 z-10 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 focus-visible:ring-2 transition-all"
        >
          <ArrowDown size={20} />
        </button>
      )}
    </div>
  )
}
