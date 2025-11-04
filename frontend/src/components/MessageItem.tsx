import React, { useState } from 'react'
import { ChatMessage, useChatStore } from '@/stores/useChatStore'
import { isRtl } from '@/utils/rtl'
import { Copy, Check, Bot, User, RotateCw, AlertTriangle } from 'lucide-react'
import { formatRelative } from 'date-fns'
import { faIR } from 'date-fns/locale'

const formatTimestamp = (ts: number) => {
  try {
    return formatRelative(new Date(ts), new Date(), { locale: faIR })
  } catch {
    return 'چند لحظه پیش'
  }
}

export const MessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const { text, role, createdAt, error } = message
  const regenerate = useChatStore((s) => s.regenerateLastResponse)
  const [hasCopied, setHasCopied] = useState(false)

  const isUser = role === 'user'
  const textDir = isRtl(text) ? 'rtl' : 'ltr'

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setHasCopied(true)
    setTimeout(() => setHasCopied(false), 2000)
  }

  const handleRetry = () => {
    regenerate()
  }

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        dir={textDir}
        className={`flex flex-col p-3 rounded-2xl max-w-[90%] md:max-w-[75%] ${
          isUser ? 'bg-primary text-primary-foreground rounded-br-lg' : 'bg-surface text-surface-foreground rounded-bl-lg'
        } ${error ? 'bg-destructive/20 border border-destructive' : ''}`}
      >
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold">
          {isUser ? <User size={16} className="text-primary-foreground/80" /> : <Bot size={16} className={error ? 'text-destructive' : 'text-surface-foreground/80'} />}
          <span className={isUser ? 'text-primary-foreground/80' : (error ? 'text-destructive' : 'text-surface-foreground/80')}>
            {isUser ? 'شما' : 'دستیار کندو'}
          </span>
        </div>

        <div className={`prose prose-sm dark:prose-invert prose-p:my-0 prose-pre:my-2 whitespace-pre-wrap break-words ${
          isUser ? 'text-primary-foreground' : (error ? 'text-destructive' : 'text-surface-foreground')
        }`}>
          {text}
        </div>

        <div className="flex items-center gap-3 mt-2 self-end">
          <span className={`text-xs ${isUser ? 'text-primary-foreground/70' : 'text-surface-foreground/70'}`}>{formatTimestamp(createdAt)}</span>

          {!error && text && (
            <button
              onClick={handleCopy}
              aria-label="کپی کردن پیام"
              className={`p-1 rounded-full ${
                isUser
                  ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20'
                  : 'text-surface-foreground/70 hover:text-surface-foreground hover:bg-black/10 dark:hover:bg-white/10'
              } transition-colors`}
            >
              {hasCopied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          )}

          {error && !isUser && (
            <button onClick={handleRetry} aria-label="تلاش مجدد" className="p-1 rounded-full text-destructive hover:bg-destructive/20 transition-colors">
              <RotateCw size={14} />
            </button>
          )}
        </div>

        {error && (
          <div dir="rtl" className="flex items-center gap-2 mt-2 text-xs text-destructive border-t border-destructive/30 pt-2">
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export const TypingIndicator: React.FC = () => (
  <div className="flex items-start">
    <div className="flex items-center justify-center gap-1.5 p-4 rounded-2xl rounded-bl-lg bg-surface">
      <span className="w-2 h-2 rounded-full bg-surface-foreground/50 animate-typing" />
      <span className="w-2 h-2 rounded-full bg-surface-foreground/50 animate-typing" style={{ animationDelay: '0.15s' }} />
      <span className="w-2 h-2 rounded-full bg-surface-foreground/50 animate-typing" style={{ animationDelay: '0.3s' }} />
    </div>
  </div>
)

export const MessageSkeleton: React.FC = () => (
  <>
    <div className="flex flex-col items-end">
      <div className="w-1/2 p-3 rounded-2xl rounded-br-lg bg-muted animate-pulse">
        <div className="h-4 bg-muted-foreground/20 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-muted-foreground/20 rounded w-full"></div>
      </div>
    </div>
    <div className="flex flex-col items-start">
      <div className="w-3/4 p-3 rounded-2xl rounded-bl-lg bg-muted animate-pulse">
        <div className="h-4 bg-muted-foreground/20 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-muted-foreground/20 rounded w-full mb-1"></div>
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
      </div>
    </div>
  </>
)
